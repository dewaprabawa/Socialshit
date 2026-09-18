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
  try {
    if (metaConfigured()) {
      const state = signOAuthState(next);
      const redirectUri = `${oauthBaseUrl(req)}/api/auth/facebook/callback`;
      const res = NextResponse.redirect(facebookLoginUrl(redirectUri, state));
      applyOAuthStateCookie(res, state);
      return res;
    }
    return await sandboxLogin(req, "facebook", next);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Facebook login failed";
    console.error("[facebook-login]", message);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Facebook login could not start. Add META_APP_ID and META_APP_SECRET in Vercel, plus DATABASE_URL for saved sessions."
        )}`,
        req.url
      )
    );
  }
}
