import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  const status = req.nextUrl.searchParams.get("status");
  const posts = await prisma.post.findMany({
    where: {
      account: { userId: auth.user.id },
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { account: true },
  });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { accountId, caption, hashtags, mediaUrl, scheduledAt, aiGenerated } =
    body;

  if (!accountId || typeof accountId !== "string") {
    return NextResponse.json(
      { error: "accountId is required" },
      { status: 400 }
    );
  }
  if (!caption || typeof caption !== "string") {
    return NextResponse.json({ error: "caption is required" }, { status: 400 });
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: auth.user.id },
  });
  if (!account) {
    return NextResponse.json({ error: "account not found" }, { status: 404 });
  }

  let scheduled: Date | null = null;
  let status = "draft";
  if (scheduledAt) {
    const d = new Date(scheduledAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json(
        { error: "scheduledAt is invalid" },
        { status: 400 }
      );
    }
    scheduled = d;
    status = "scheduled";
  }

  const post = await prisma.post.create({
    data: {
      accountId,
      platform: account.platform,
      caption,
      hashtags: hashtags || "",
      mediaUrl: mediaUrl || null,
      scheduledAt: scheduled,
      status,
      aiGenerated: Boolean(aiGenerated),
    },
    include: { account: true },
  });

  return NextResponse.json({ post }, { status: 201 });
}
