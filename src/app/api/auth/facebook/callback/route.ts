import { NextRequest, NextResponse } from "next/server";
import {
  finishLogin,
  oauthBaseUrl,
  readSignedOAuthState,
  upsertOAuthUser,
  verifyOAuthState,
} from "@/lib/auth";
import {
  exchangeCodeForToken,
  fetchFacebookProfile,
  metaConfigured,
} from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!metaConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=Meta%20app%20is%20not%20configured", req.url)
    );
  }
  const err =
    req.nextUrl.searchParams.get("error_description") ||
    req.nextUrl.searchParams.get("error_reason") ||
    req.nextUrl.searchParams.get("error");
  if (err) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err)}`, req.url)
    );
  }
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=Facebook%20login%20was%20cancelled", req.url)
    );
  }
  if (!verifyOAuthState(req, state)) {
    return NextResponse.redirect(
      new URL("/login?error=Invalid%20login%20state", req.url)
    );
  }

  const redirectUri = `${oauthBaseUrl(req)}/api/auth/facebook/callback`;

  try {
    const accessToken = await exchangeCodeForToken(code, redirectUri);
    const profile = await fetchFacebookProfile(accessToken);
    const user = await upsertOAuthUser({
      provider: "facebook",
      providerUserId: profile.id,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      sandbox: false,
    });
    return finishLogin(req, user.id, readSignedOAuthState(state) || "/");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Facebook login failed";
    console.error("[facebook-callback]", message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, req.url)
    );
  }
}
