import { NextRequest, NextResponse } from "next/server";
import {
  finishLogin,
  oauthBaseUrl,
  persistUser,
  readSignedOAuthState,
  verifyOAuthState,
} from "@/lib/auth";
import {
  exchangeInstagramCodeForToken,
  fetchInstagramProfile,
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
      new URL("/login?error=Instagram%20login%20was%20cancelled", req.url)
    );
  }
  if (!verifyOAuthState(req, state)) {
    return NextResponse.redirect(
      new URL("/login?error=Invalid%20login%20state", req.url)
    );
  }

  const redirectUri = `${oauthBaseUrl(req)}/api/auth/instagram/callback`;

  try {
    const { accessToken, userId } = await exchangeInstagramCodeForToken(
      code,
      redirectUri
    );
    let profile;
    try {
      profile = await fetchInstagramProfile(accessToken);
    } catch {
      profile = {
        id: userId,
        name: "Instagram user",
        email: null,
        avatarUrl: null,
      };
    }
    const user = await persistUser({
      provider: "instagram",
      providerUserId: profile.id || userId,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      sandbox: false,
    });
    return finishLogin(req, user, readSignedOAuthState(state) || "/");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Instagram login failed";
    console.error("[instagram-callback]", message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, req.url)
    );
  }
}
