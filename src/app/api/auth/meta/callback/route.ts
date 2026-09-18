import { NextRequest, NextResponse } from "next/server";
import { oauthBaseUrl, verifyOAuthState } from "@/lib/auth";
import { completePagesOAuth } from "@/lib/connect-pages";
import { metaConfigured } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!metaConfigured()) {
    return NextResponse.redirect(
      new URL("/accounts?error=meta_not_configured", req.url)
    );
  }
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code) {
    return NextResponse.redirect(
      new URL("/accounts?error=missing_code", req.url)
    );
  }
  if (!verifyOAuthState(req, state)) {
    return NextResponse.redirect(
      new URL("/accounts?error=invalid_state", req.url)
    );
  }
  const redirectUri = `${oauthBaseUrl(req)}/api/auth/meta/callback`;
  return completePagesOAuth(req, code, redirectUri);
}
