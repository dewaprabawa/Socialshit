import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true } } },
  });
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { platform, name, handle, externalId, accessToken, avatarUrl } = body;

  if (platform !== "instagram" && platform !== "facebook") {
    return NextResponse.json(
      { error: "platform must be 'instagram' or 'facebook'" },
      { status: 400 }
    );
  }
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // A real Page/user access token is enough to publish via the Graph API, so a
  // manually-provided token creates a live account. Sandbox when no real token
  // is given, when the token is the literal "sandbox", or when explicitly asked.
  const sandbox =
    body.sandbox === true || !accessToken || accessToken === "sandbox";

  if (!sandbox && !externalId) {
    return NextResponse.json(
      {
        error:
          "A Page ID (Facebook) or Instagram Business Account ID is required for a live connection.",
      },
      { status: 400 }
    );
  }

  const account = await prisma.account.create({
    data: {
      platform,
      name,
      handle: handle || null,
      externalId: externalId || `sandbox-${platform}-${Date.now()}`,
      accessToken: sandbox ? "sandbox" : accessToken,
      avatarUrl:
        avatarUrl ||
        `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(
          name
        )}`,
      sandbox,
    },
  });

  return NextResponse.json({ account }, { status: 201 });
}
