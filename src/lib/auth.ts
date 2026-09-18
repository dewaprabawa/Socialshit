import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "socialshit_session";
export const OAUTH_STATE_COOKIE = "socialshit_oauth_state";
const SESSION_MS = 1000 * 60 * 60 * 24 * 30;

export type AuthUser = {
  id: string;
  provider: string;
  providerUserId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  sandbox: boolean;
};

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.VERCEL === "1";
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(),
    path: "/",
    expires,
  };
}

export function createOAuthState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function applyOAuthStateCookie(res: NextResponse, state: string) {
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 600,
  });
  return res;
}

export function verifyOAuthState(
  req: NextRequest,
  state: string | null
): boolean {
  const expected = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  return Boolean(state && expected && state === expected);
}

export function safeNextPath(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\")
  ) {
    return "/";
  }
  return next;
}

export async function createSessionToken(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  return { token, expiresAt };
}

export function applySessionCookie(
  res: NextResponse,
  token: string,
  expiresAt: Date
) {
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
  return res;
}

export function readSessionToken(req?: NextRequest): string | undefined {
  if (req) return req.cookies.get(SESSION_COOKIE)?.value;
  return cookies().get(SESSION_COOKIE)?.value;
}

export async function getCurrentUser(
  req?: NextRequest
): Promise<AuthUser | null> {
  const token = readSessionToken(req);
  if (!token) return null;
  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) {
      if (session) {
        await prisma.session
          .delete({ where: { id: session.id } })
          .catch(() => undefined);
      }
      return null;
    }
    return session.user;
  } catch {
    return null;
  }
}

export async function destroySession(req?: NextRequest) {
  const token = readSessionToken(req);
  if (!token) return;
  await prisma.session
    .deleteMany({ where: { tokenHash: hashToken(token) } })
    .catch(() => undefined);
}

export function unauthorized(message = "Sign in to continue.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function requireUser(req?: NextRequest): Promise<
  | { user: AuthUser; error?: undefined }
  | { user?: undefined; error: NextResponse }
> {
  const user = await getCurrentUser(req);
  if (!user) return { error: unauthorized() };
  return { user };
}

export async function upsertOAuthUser(input: {
  provider: "facebook" | "instagram";
  providerUserId: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  sandbox?: boolean;
}) {
  return prisma.user.upsert({
    where: {
      provider_providerUserId: {
        provider: input.provider,
        providerUserId: input.providerUserId,
      },
    },
    update: {
      name: input.name,
      email: input.email ?? undefined,
      avatarUrl: input.avatarUrl ?? undefined,
      sandbox: Boolean(input.sandbox),
    },
    create: {
      provider: input.provider,
      providerUserId: input.providerUserId,
      name: input.name,
      email: input.email ?? null,
      avatarUrl: input.avatarUrl ?? null,
      sandbox: Boolean(input.sandbox),
    },
  });
}

export async function finishLogin(
  req: NextRequest,
  userId: string,
  nextPath?: string | null
) {
  const { token, expiresAt } = await createSessionToken(userId);
  const dest = new URL(safeNextPath(nextPath), req.nextUrl.origin);
  const res = NextResponse.redirect(dest);
  applySessionCookie(res, token, expiresAt);
  res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function sandboxLogin(
  req: NextRequest,
  provider: "facebook" | "instagram",
  nextPath?: string | null
) {
  const name = provider === "instagram" ? "Instagram Demo" : "Facebook Demo";
  const user = await upsertOAuthUser({
    provider,
    providerUserId: `demo-${provider}`,
    name,
    email: null,
    avatarUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${provider}-demo`,
    sandbox: true,
  });
  await ensureSandboxAccounts(user.id, provider);
  return finishLogin(req, user.id, nextPath);
}

export async function ensureSandboxAccounts(
  userId: string,
  provider: "facebook" | "instagram"
) {
  const count = await prisma.account.count({ where: { userId } });
  if (count > 0) return;

  const igName =
    provider === "instagram" ? "My Instagram" : "Demo Instagram";
  const fbName =
    provider === "facebook" ? "My Facebook Page" : "Demo Facebook Page";

  await prisma.account.createMany({
    data: [
      {
        userId,
        platform: "instagram",
        name: igName,
        handle: provider === "instagram" ? "@me" : "@demo.ig",
        externalId: `sandbox-ig-${userId.slice(0, 8)}`,
        accessToken: "sandbox",
        sandbox: true,
        avatarUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(
          userId
        )}-ig`,
      },
      {
        userId,
        platform: "facebook",
        name: fbName,
        handle: fbName,
        externalId: `sandbox-fb-${userId.slice(0, 8)}`,
        accessToken: "sandbox",
        sandbox: true,
        avatarUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(
          userId
        )}-fb`,
      },
    ],
  });
}
