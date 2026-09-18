import { NextRequest, NextResponse } from "next/server";
import {
  applyOAuthStateCookie,
  getCurrentUser,
  oauthBaseUrl,
  safeNextPath,
  sandboxLogin,
  signOAuthState,
} from "@/lib/auth";
import { instagramLoginUrl, metaConfigured } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  try {
    if (metaConfigured()) {
      const user = await getCurrentUser(req);
      const flow = user ? "ig" : "login";
      const dest = user ? "/accounts" : next;
      const state = signOAuthState(dest, flow);
      const redirectUri = `${oauthBaseUrl(req)}/api/auth/instagram/callback`;
      const res = NextResponse.redirect(instagramLoginUrl(redirectUri, state));
      applyOAuthStateCookie(res, state);
      return res;
    }
    return await sandboxLogin(req, "instagram", next);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Instagram login failed";
    console.error("[instagram-login]", message);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Instagram login could not start. Add META_APP_ID and META_APP_SECRET in Vercel, plus DATABASE_URL for saved sessions."
        )}`,
        req.url
      )
    );
  }
}
