import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  await prisma.account
    .deleteMany({ where: { id: params.id, userId: auth.user.id } })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
