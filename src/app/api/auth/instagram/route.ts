import { NextRequest, NextResponse } from "next/server";
import {
  applyOAuthStateCookie,
  createOAuthState,
  safeNextPath,
} from "@/lib/auth";
import { instagramLoginUrl, metaConfigured } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!metaConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=Meta%20app%20is%20not%20configured", req.url)
    );
  }
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  const state = `${createOAuthState()}.${Buffer.from(next).toString("base64url")}`;
  const base =
    process.env.APP_BASE_URL || req.nextUrl.origin.replace(/\/$/, "");
  const redirectUri = `${base}/api/auth/instagram/callback`;
  const res = NextResponse.redirect(instagramLoginUrl(redirectUri, state));
  applyOAuthStateCookie(res, state);
  return res;
}
