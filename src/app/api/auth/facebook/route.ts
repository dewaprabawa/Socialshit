import { NextRequest, NextResponse } from "next/server";
import {
  applyOAuthStateCookie,
  oauthBaseUrl,
  safeNextPath,
  sandboxLogin,
  signOAuthState,
} from "@/lib/auth";
import { facebookLoginUrl, metaConfigured } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  if (!metaConfigured()) {
    return sandboxLogin(req, "facebook", next);
  }
  const state = signOAuthState(next);
  const redirectUri = `${oauthBaseUrl(req)}/api/auth/facebook/callback`;
  const res = NextResponse.redirect(facebookLoginUrl(redirectUri, state));
  applyOAuthStateCookie(res, state);
  return res;
}
