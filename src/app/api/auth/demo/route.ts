import { NextRequest, NextResponse } from "next/server";
import {
  applySessionCookie,
  createEphemeralToken,
  createSessionToken,
  ensureSandboxAccounts,
  persistUser,
  safeNextPath,
} from "@/lib/auth";
import { databaseConfigured } from "@/lib/prisma";

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
  const user = await persistUser({
    provider,
    providerUserId: `demo-${provider}`,
    name,
    email: null,
    avatarUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${provider}-demo`,
    sandbox: true,
  });
  try {
    await ensureSandboxAccounts(user.id, provider);
  } catch {
    // Publishing still works in sandbox without a database.
  }

  const redirect = safeNextPath(body.next);
  const res = NextResponse.json({ ok: true, redirect, user });
  if (databaseConfigured() && !user.id.startsWith("eph-")) {
    try {
      const { token, expiresAt } = await createSessionToken(user.id);
      applySessionCookie(res, token, expiresAt);
      return res;
    } catch {
      // fall through to cookie session
    }
  }
  const { token, expiresAt } = createEphemeralToken(user);
  applySessionCookie(res, token, expiresAt);
  return res;
}
