import { NextRequest, NextResponse } from "next/server";
import { canvaConfigured, exchangeCodeForToken, saveToken } from "@/lib/canva";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = process.env.APP_BASE_URL || req.nextUrl.origin.replace(/\/$/, "");
  const fail = (msg: string) =>
    NextResponse.redirect(new URL(`/accounts?canvaError=${encodeURIComponent(msg)}`, req.url));

  if (!canvaConfigured()) return fail("not_configured");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("canva_state")?.value;
  const verifier = req.cookies.get("canva_verifier")?.value;

  if (!code) return fail("missing_code");
  if (!verifier) return fail("missing_verifier");
  if (!state || state !== cookieState) return fail("state_mismatch");

  try {
    const redirectUri = `${base}/api/auth/canva/callback`;
    const token = await exchangeCodeForToken(code, verifier, redirectUri);
    await saveToken(token);
    const res = NextResponse.redirect(new URL("/accounts?canva=connected", req.url));
    res.cookies.delete("canva_verifier");
    res.cookies.delete("canva_state");
    return res;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "oauth_failed");
  }
}
