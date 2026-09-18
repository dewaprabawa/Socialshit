import { NextRequest, NextResponse } from "next/server";
import {
  applyOAuthStateCookie,
  createOAuthState,
  getCurrentUser,
} from "@/lib/auth";
import { metaConfigured, oauthLoginUrl } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/accounts", req.url));
  }
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
  const state = `${createOAuthState()}.${user.id}`;
  const res = NextResponse.redirect(oauthLoginUrl(redirectUri, state));
  applyOAuthStateCookie(res, state);
  return res;
}
