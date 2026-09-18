import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { databaseConfigured, prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "socialshit_session";
export const OAUTH_STATE_COOKIE = "socialshit_oauth_state";
const SESSION_MS = 1000 * 60 * 60 * 24 * 30;
const EPHEMERAL_PREFIX = "e1.";

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

function oauthSigningSecret(): string {
  return process.env.META_APP_SECRET || process.env.APP_BASE_URL || "socialshit-oauth";
}

export function toAuthUser(input: {
  id?: string;
  provider: "facebook" | "instagram";
  providerUserId: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  sandbox?: boolean;
}): AuthUser {
  const id =
    input.id ||
    `eph-${input.provider}-${input.providerUserId}`
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 64);
  return {
    id,
    provider: input.provider,
    providerUserId: input.providerUserId,
    name: input.name,
    email: input.email ?? null,
    avatarUrl: input.avatarUrl ?? null,
    sandbox: Boolean(input.sandbox),
  };
}

export function createEphemeralToken(user: AuthUser): {
  token: string;
  expiresAt: Date;
} {
  const expiresAt = new Date(Date.now() + SESSION_MS);
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      provider: user.provider,
      providerUserId: user.providerUserId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      sandbox: user.sandbox,
      exp: expiresAt.getTime(),
    })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", oauthSigningSecret())
    .update(payload)
    .digest("base64url");
  return { token: `${EPHEMERAL_PREFIX}${payload}.${sig}`, expiresAt };
}

export function readEphemeralUser(token: string | undefined): AuthUser | null {
  if (!token?.startsWith(EPHEMERAL_PREFIX)) return null;
  const rest = token.slice(EPHEMERAL_PREFIX.length);
  const i = rest.lastIndexOf(".");
  if (i <= 0) return null;
  const payload = rest.slice(0, i);
  const sig = rest.slice(i + 1);
  const expected = crypto
    .createHmac("sha256", oauthSigningSecret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as AuthUser & { exp?: number };
    if (!data.exp || data.exp < Date.now() || !data.id) return null;
    return toAuthUser(data);
  } catch {
    return null;
  }
}

export function signOAuthState(nextPath: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      n: safeNextPath(nextPath),
      t: Date.now(),
      r: crypto.randomBytes(8).toString("hex"),
    })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", oauthSigningSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function readSignedOAuthState(state: string | null): string | null {
  if (!state) return null;
  const i = state.lastIndexOf(".");
  if (i <= 0) return null;
  const payload = state.slice(0, i);
  const sig = state.slice(i + 1);
  const expected = crypto
    .createHmac("sha256", oauthSigningSecret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      n?: string;
      t?: number;
    };
    if (!data.t || Date.now() - data.t > 10 * 60 * 1000) return null;
    return safeNextPath(data.n);
  } catch {
    return null;
  }
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
  if (readSignedOAuthState(state) !== null) return true;
  const expected = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  return Boolean(state && expected && state === expected);
}

export function oauthBaseUrl(req: NextRequest): string {
  return req.nextUrl.origin.replace(/\/$/, "");
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
  const ephemeral = readEphemeralUser(token);
  if (ephemeral) return ephemeral;
  if (!databaseConfigured()) return null;
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
  if (readEphemeralUser(token)) return;
  if (!databaseConfigured()) return;
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

export async function persistUser(input: {
  provider: "facebook" | "instagram";
  providerUserId: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  sandbox?: boolean;
}): Promise<AuthUser> {
  const fallback = toAuthUser(input);
  if (!databaseConfigured()) return fallback;
  try {
    return await upsertOAuthUser(input);
  } catch (err) {
    console.error("[auth] persistUser falling back to cookie session:", err);
    return fallback;
  }
}

export async function finishLogin(
  req: NextRequest,
  user: AuthUser | string,
  nextPath?: string | null
) {
  const dest = new URL(safeNextPath(nextPath), req.nextUrl.origin);
  const res = NextResponse.redirect(dest);
  const profile = typeof user === "string" ? null : user;

  if (profile && (!databaseConfigured() || profile.id.startsWith("eph-"))) {
    const { token, expiresAt } = createEphemeralToken(profile);
    applySessionCookie(res, token, expiresAt);
    res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  const userId = typeof user === "string" ? user : user.id;
  try {
    const { token, expiresAt } = await createSessionToken(userId);
    applySessionCookie(res, token, expiresAt);
  } catch (err) {
    console.error("[auth] createSessionToken failed, using cookie session:", err);
    const fallback =
      profile ||
      toAuthUser({
        id: userId,
        provider: "facebook",
        providerUserId: userId,
        name: "Signed-in user",
      });
    const { token, expiresAt } = createEphemeralToken(fallback);
    applySessionCookie(res, token, expiresAt);
  }
  res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function sandboxLogin(
  req: NextRequest,
  provider: "facebook" | "instagram",
  nextPath?: string | null
) {
  const name = provider === "instagram" ? "Instagram Demo" : "Facebook Demo";
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
  } catch (err) {
    console.error("[auth] ensureSandboxAccounts skipped:", err);
  }
  return finishLogin(req, user, nextPath);
}

export async function ensureSandboxAccounts(
  userId: string,
  provider: "facebook" | "instagram"
) {
  if (!databaseConfigured()) return;
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
