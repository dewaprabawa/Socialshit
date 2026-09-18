import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { publishPost, type Platform } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  const post = await prisma.post.findFirst({
    where: { id: params.id, account: { userId: auth.user.id } },
    include: { account: true },
  });
  if (!post) {
    return NextResponse.json({ error: "post not found" }, { status: 404 });
  }
  if (post.status === "published") {
    return NextResponse.json({ error: "already published" }, { status: 409 });
  }

  await prisma.post.update({
    where: { id: post.id },
    data: { status: "publishing" },
  });

  try {
    const published = await publishPost({
      platform: post.platform as Platform,
      externalId: post.account.externalId,
      accessToken: post.account.accessToken,
      caption: [post.caption, post.hashtags].filter(Boolean).join("\n\n"),
      mediaUrl: post.mediaUrl,
      sandbox: post.account.sandbox,
    });

    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        status: "published",
        publishedAt: new Date(),
        externalId: published.externalId,
        externalUrl: published.externalUrl,
        error: null,
      },
      include: { account: true },
    });
    return NextResponse.json({ post: updated, sandbox: published.sandbox });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: { status: "failed", error: message },
      include: { account: true },
    });
    return NextResponse.json({ post: updated, error: message }, { status: 502 });
  }
}
