import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const post = await prisma.post
    .update({ where: { id: params.id }, data, include: { account: true } })
    .catch(() => null);

  if (!post) {
    return NextResponse.json({ error: "post not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.post.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
