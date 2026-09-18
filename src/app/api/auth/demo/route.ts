import { NextRequest, NextResponse } from "next/server";
import {
  applySessionCookie,
  createSessionToken,
  ensureSandboxAccounts,
  safeNextPath,
  upsertOAuthUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const provider = body.provider;
  if (provider !== "facebook" && provider !== "instagram") {
    return NextResponse.json(
      { error: "provider must be 'facebook' or 'instagram'" },
      { status: 400 }
    );
  }

  const name =
    provider === "instagram" ? "Instagram Demo" : "Facebook Demo";
  const user = await upsertOAuthUser({
    provider,
    providerUserId: `demo-${provider}`,
    name,
    email: null,
    avatarUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${provider}-demo`,
    sandbox: true,
  });
  await ensureSandboxAccounts(user.id, provider);

  const { token, expiresAt } = await createSessionToken(user.id);
  const redirect = safeNextPath(body.next);
  const res = NextResponse.json({ ok: true, redirect, user });
  applySessionCookie(res, token, expiresAt);
  return res;
}
