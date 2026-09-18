import { NextRequest, NextResponse } from "next/server";
import {
  finishLogin,
  getCurrentUser,
  oauthBaseUrl,
  persistUser,
  readOAuthState,
  verifyOAuthState,
} from "@/lib/auth";
import { attachInstagramPublishingAccount } from "@/lib/connect-pages";
import {
  exchangeInstagramCodeForToken,
  exchangeInstagramLongLivedToken,
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
    const dest =
      readOAuthState(req.nextUrl.searchParams.get("state"))?.flow === "ig"
        ? "/accounts"
        : "/login";
    return NextResponse.redirect(
      new URL(`${dest}?error=${encodeURIComponent(err)}`, req.url)
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
  const parsed = readOAuthState(state);

  try {
    const exchanged = await exchangeInstagramCodeForToken(code, redirectUri);
    const accessToken = await exchangeInstagramLongLivedToken(
      exchanged.accessToken
    );
    let profile;
    try {
      profile = await fetchInstagramProfile(accessToken);
    } catch {
      profile = {
        id: exchanged.userId,
        name: "Instagram user",
        email: null,
        avatarUrl: null,
      };
    }
    const igId = profile.id || exchanged.userId;
    const handle = profile.username || null;

    if (parsed?.flow === "ig") {
      const current = await getCurrentUser(req);
      if (!current) {
        return NextResponse.redirect(
          new URL("/login?next=/accounts", req.url)
        );
      }
      try {
        await attachInstagramPublishingAccount(current.id, {
          name: profile.name,
          handle,
          externalId: igId,
          accessToken,
          avatarUrl: profile.avatarUrl,
        });
      } catch (attachErr) {
        const message =
          attachErr instanceof Error
            ? attachErr.message
            : "Could not save Instagram account";
        return NextResponse.redirect(
          new URL(`/accounts?error=${encodeURIComponent(message)}`, req.url)
        );
      }
      return NextResponse.redirect(new URL("/accounts?connected=1", req.url));
    }

    const user = await persistUser({
      provider: "instagram",
      providerUserId: igId,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      sandbox: false,
    });
    try {
      await attachInstagramPublishingAccount(user.id, {
        name: profile.name,
        handle,
        externalId: igId,
        accessToken,
        avatarUrl: profile.avatarUrl,
      });
    } catch (attachErr) {
      console.error("[instagram-callback] account attach skipped:", attachErr);
    }
    return finishLogin(req, user, parsed?.next || "/");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Instagram login failed";
    console.error("[instagram-callback]", message);
    const dest = parsed?.flow === "ig" ? "/accounts" : "/login";
    return NextResponse.redirect(
      new URL(`${dest}?error=${encodeURIComponent(message)}`, req.url)
    );
  }
}
