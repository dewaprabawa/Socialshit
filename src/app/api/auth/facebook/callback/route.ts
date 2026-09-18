import { NextRequest, NextResponse } from "next/server";
import {
  finishLogin,
  upsertOAuthUser,
  verifyOAuthState,
} from "@/lib/auth";
import {
  exchangeCodeForToken,
  fetchFacebookProfile,
  metaConfigured,
} from "@/lib/meta";

export const dynamic = "force-dynamic";

function nextFromState(state: string | null): string {
  const encoded = state?.split(".")[1];
  if (!encoded) return "/";
  try {
    const next = Buffer.from(encoded, "base64url").toString("utf8");
    return next.startsWith("/") ? next : "/";
  } catch {
    return "/";
  }
}

export async function GET(req: NextRequest) {
  if (!metaConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=Meta%20app%20is%20not%20configured", req.url)
    );
  }
  const err = req.nextUrl.searchParams.get("error_description") ||
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

  const base =
    process.env.APP_BASE_URL || req.nextUrl.origin.replace(/\/$/, "");
  const redirectUri = `${base}/api/auth/facebook/callback`;

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
    return finishLogin(req, user.id, nextFromState(state));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Facebook login failed";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, req.url)
    );
  }
}
