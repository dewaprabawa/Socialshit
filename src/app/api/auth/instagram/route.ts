import { NextRequest, NextResponse } from "next/server";
import {
  applyOAuthStateCookie,
  createOAuthState,
  safeNextPath,
  sandboxLogin,
} from "@/lib/auth";
import { instagramLoginUrl, metaConfigured } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  if (!metaConfigured()) {
    return sandboxLogin(req, "instagram", next);
  }
  const state = `${createOAuthState()}.${Buffer.from(next).toString("base64url")}`;
  const base =
    process.env.APP_BASE_URL || req.nextUrl.origin.replace(/\/$/, "");
  const redirectUri = `${base}/api/auth/instagram/callback`;
  const res = NextResponse.redirect(instagramLoginUrl(redirectUri, state));
  applyOAuthStateCookie(res, state);
  return res;
}
