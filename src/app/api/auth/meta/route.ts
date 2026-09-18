import { NextRequest, NextResponse } from "next/server";
import { metaConfigured, oauthLoginUrl } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!metaConfigured()) {
    return NextResponse.json(
      {
        error:
          "Meta app credentials are not configured. Set META_APP_ID and META_APP_SECRET to enable real account connection, or add a sandbox account.",
      },
      { status: 400 }
    );
  }
  const base =
    process.env.APP_BASE_URL || req.nextUrl.origin.replace(/\/$/, "");
  const redirectUri = `${base}/api/auth/meta/callback`;
  const state = Math.random().toString(36).slice(2);
  return NextResponse.redirect(oauthLoginUrl(redirectUri, state));
}
