import { prisma } from "@/lib/prisma";
import { publishPost, type Platform } from "@/lib/meta";

export interface ProcessResult {
  processed: number;
  published: string[];
  failed: { id: string; error: string }[];
}

// Finds every post that is scheduled for now-or-earlier and publishes it.
// Safe to call repeatedly (idempotent per post via the status transition).
export async function processDuePosts(now = new Date()): Promise<ProcessResult> {
  const due = await prisma.post.findMany({
    where: { status: "scheduled", scheduledAt: { lte: now } },
    include: { account: true },
    orderBy: { scheduledAt: "asc" },
    take: 25,
  });

  const result: ProcessResult = { processed: 0, published: [], failed: [] };

  for (const post of due) {
    // Claim the post so concurrent ticks don't double-publish it.
    const claimed = await prisma.post.updateMany({
      where: { id: post.id, status: "scheduled" },
      data: { status: "publishing" },
    });
    if (claimed.count === 0) continue;

    result.processed++;
    try {
      const published = await publishPost({
        platform: post.platform as Platform,
        externalId: post.account.externalId,
        accessToken: post.account.accessToken,
        caption: [post.caption, post.hashtags].filter(Boolean).join("\n\n"),
        mediaUrl: post.mediaUrl,
        sandbox: post.account.sandbox,
      });
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: "published",
          publishedAt: new Date(),
          externalId: published.externalId,
          externalUrl: published.externalUrl,
          error: null,
        },
      });
      result.published.push(post.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "failed", error: message },
      });
      result.failed.push({ id: post.id, error: message });
    }
  }

  return result;
}

// In-process loop. Guarded so it only starts once per server instance.
const globalForScheduler = globalThis as unknown as {
  __socialshitScheduler?: NodeJS.Timeout;
};

export function startScheduler(intervalMs = 30_000) {
  if (globalForScheduler.__socialshitScheduler) return;
  console.log(`[scheduler] starting, tick every ${intervalMs}ms`);
  globalForScheduler.__socialshitScheduler = setInterval(async () => {
    try {
      const res = await processDuePosts();
      if (res.processed > 0) {
        console.log(
          `[scheduler] processed=${res.processed} published=${res.published.length} failed=${res.failed.length}`
        );
      }
    } catch (err) {
      console.error("[scheduler] tick error:", err);
    }
  }, intervalMs);
}
