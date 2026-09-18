import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  const existing = await prisma.post.findFirst({
    where: { id: params.id, account: { userId: auth.user.id } },
  });
  if (!existing) {
    return NextResponse.json({ error: "post not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.caption === "string") data.caption = body.caption;
  if (typeof body.hashtags === "string") data.hashtags = body.hashtags;
  if (typeof body.mediaUrl === "string") data.mediaUrl = body.mediaUrl;
  if (body.scheduledAt !== undefined) {
    if (body.scheduledAt === null) {
      data.scheduledAt = null;
      data.status = "draft";
    } else {
      const d = new Date(body.scheduledAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "scheduledAt is invalid" },
          { status: 400 }
        );
      }
      data.scheduledAt = d;
      data.status = "scheduled";
    }
  }

  const post = await prisma.post.update({
    where: { id: params.id },
    data,
    include: { account: true },
  });
  return NextResponse.json({ post });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  await prisma.post
    .deleteMany({
      where: { id: params.id, account: { userId: auth.user.id } },
    })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
