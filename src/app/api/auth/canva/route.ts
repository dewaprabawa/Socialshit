import { NextRequest, NextResponse } from "next/server";
import {
  authorizeUrl,
  canvaConfigured,
  challengeFromVerifier,
  createVerifier,
} from "@/lib/canva";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!canvaConfigured()) {
    return NextResponse.json(
      {
        error:
          "Canva is not configured. Set CANVA_CLIENT_ID and CANVA_CLIENT_SECRET to connect. Until then, 'Design with Canva' runs in sandbox mode.",
      },
      { status: 400 }
    );
  }
  const base = process.env.APP_BASE_URL || req.nextUrl.origin.replace(/\/$/, "");
  const redirectUri = `${base}/api/auth/canva/callback`;
  const verifier = createVerifier();
  const challenge = challengeFromVerifier(verifier);
  const state = createVerifier().slice(0, 16);

  const res = NextResponse.redirect(authorizeUrl(redirectUri, state, challenge));
  const secure = base.startsWith("https");
  res.cookies.set("canva_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 600,
    path: "/",
  });
  res.cookies.set("canva_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 600,
    path: "/",
  });
  return res;
}
