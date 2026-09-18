import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_KEY = "canva_token";
const API = "https://api.canva.com/rest/v1";

export interface CanvaToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // epoch ms
  scope?: string;
}

export interface DesignResult {
  imageUrl: string;
  editUrl: string | null;
  designId: string | null;
  source: "canva" | "sandbox";
}

const SCOPES = [
  "design:content:read",
  "design:content:write",
  "asset:read",
  "asset:write",
  "profile:read",
].join(" ");

export function canvaConfigured(): boolean {
  return Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET);
}

// --- PKCE helpers ---

export function createVerifier(): string {
  return randomBytes(48).toString("base64url");
}

export function challengeFromVerifier(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function authorizeUrl(
  redirectUri: string,
  state: string,
  codeChallenge: string
): string {
  const params = new URLSearchParams({
    client_id: process.env.CANVA_CLIENT_ID || "",
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "s256",
  });
  return `https://www.canva.com/api/oauth/authorize?${params.toString()}`;
}

function basicAuthHeader(): string {
  const creds = `${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(creds).toString("base64")}`;
}

export async function exchangeCodeForToken(
  code: string,
  verifier: string,
  redirectUri: string
): Promise<CanvaToken> {
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code_verifier: verifier,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      (json.error_description as string) ||
        (json.error as string) ||
        "Canva token exchange failed"
    );
  }
  return normalizeToken(json);
}

function normalizeToken(json: Record<string, unknown>): CanvaToken {
  const expiresIn = Number(json.expires_in ?? 14400);
  return {
    access_token: String(json.access_token),
    refresh_token: json.refresh_token ? String(json.refresh_token) : undefined,
    expires_at: Date.now() + expiresIn * 1000,
    scope: json.scope ? String(json.scope) : undefined,
  };
}

export async function saveToken(token: CanvaToken): Promise<void> {
  await prisma.setting.upsert({
    where: { key: TOKEN_KEY },
    update: { value: JSON.stringify(token) },
    create: { key: TOKEN_KEY, value: JSON.stringify(token) },
  });
}

export async function getStoredToken(): Promise<CanvaToken | null> {
  const row = await prisma.setting.findUnique({ where: { key: TOKEN_KEY } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as CanvaToken;
  } catch {
    return null;
  }
}

export async function disconnect(): Promise<void> {
  await prisma.setting.deleteMany({ where: { key: TOKEN_KEY } });
}

async function refresh(token: CanvaToken): Promise<CanvaToken | null> {
  if (!token.refresh_token) return null;
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
    }),
  });
  if (!res.ok) return null;
  const next = normalizeToken((await res.json()) as Record<string, unknown>);
  if (!next.refresh_token) next.refresh_token = token.refresh_token;
  await saveToken(next);
  return next;
}

// Returns a valid access token, refreshing if needed.
async function getValidToken(): Promise<string | null> {
  let token = await getStoredToken();
  if (!token) return null;
  if (token.expires_at - Date.now() < 60_000) {
    token = (await refresh(token)) ?? token;
  }
  return token.access_token;
}

export async function canvaConnected(): Promise<boolean> {
  return Boolean(await getStoredToken());
}

// --- Design creation + export (real Canva Connect API path) ---

async function uploadAssetFromUrl(
  token: string,
  imageUrl: string
): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const bytes = Buffer.from(await imgRes.arrayBuffer());
    const meta = Buffer.from(
      JSON.stringify({ name_base64: Buffer.from("socialshit").toString("base64") })
    ).toString("base64");

    const res = await fetch(`${API}/asset-uploads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
        "Asset-Upload-Metadata": meta,
      },
      body: bytes,
    });
    if (!res.ok) return null;
    const job = (await res.json()) as {
      job?: { id: string; status: string; asset?: { id: string } };
    };
    let current = job.job;
    for (let i = 0; i < 10 && current && current.status === "in_progress"; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const poll = await fetch(`${API}/asset-uploads/${current.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      current = ((await poll.json()) as { job?: typeof current }).job;
    }
    return current?.asset?.id ?? null;
  } catch {
    return null;
  }
}

async function createDesignReal(
  token: string,
  caption: string,
  imageUrl?: string | null
): Promise<{ designId: string; editUrl: string | null }> {
  const assetId = imageUrl ? await uploadAssetFromUrl(token, imageUrl) : null;
  const body: Record<string, unknown> = {
    design_type: { type: "custom", width: 1080, height: 1080 },
    title: caption.slice(0, 50) || "Socialshit post",
  };
  if (assetId) body.asset_id = assetId;

  const res = await fetch(`${API}/designs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    design?: { id: string; urls?: { edit_url?: string } };
    message?: string;
  };
  if (!res.ok || !json.design) {
    throw new Error(json.message || "Canva design creation failed");
  }
  return {
    designId: json.design.id,
    editUrl: json.design.urls?.edit_url ?? null,
  };
}

async function exportDesignPng(
  token: string,
  designId: string
): Promise<string | null> {
  const res = await fetch(`${API}/exports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      design_id: designId,
      format: { type: "png", width: 1080 },
    }),
  });
  if (!res.ok) return null;
  let job = ((await res.json()) as { job?: { id: string; status: string; urls?: string[] } })
    .job;
  for (let i = 0; i < 15 && job && job.status === "in_progress"; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const poll = await fetch(`${API}/exports/${job.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    job = ((await poll.json()) as { job?: typeof job }).job;
  }
  if (job?.status === "success" && job.urls?.length) return job.urls[0];
  return null;
}

// Builds a self-contained "designed" image (SVG data URL) with the caption laid
// out on a branded background. Used for the sandbox path so the feature is fully
// demonstrable without Canva credentials.
export function sandboxDesignImage(caption: string): string {
  const text = (caption || "Your post copy here").replace(/\s+/g, " ").trim();
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > 24) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
    if (lines.length >= 7) break;
  }
  if (line && lines.length < 8) lines.push(line.trim());

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const tspans = lines
    .map(
      (l, i) =>
        `<tspan x="90" dy="${i === 0 ? 0 : 66}">${esc(l)}</tspan>`
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7c3aed"/>
      <stop offset="1" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#g)"/>
  <circle cx="900" cy="180" r="230" fill="#ffffff" opacity="0.08"/>
  <circle cx="180" cy="920" r="180" fill="#ffffff" opacity="0.08"/>
  <text x="90" y="150" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="#ffffff" opacity="0.85" font-weight="700">SOCIALSHIT</text>
  <text x="90" y="470" font-family="Segoe UI, Arial, sans-serif" font-size="56" font-weight="800" fill="#ffffff">${tspans}</text>
  <text x="90" y="1000" font-family="Segoe UI, Arial, sans-serif" font-size="28" fill="#ffffff" opacity="0.8">Designed with Canva (sandbox)</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function generatePostDesign(input: {
  caption: string;
  imageUrl?: string | null;
}): Promise<DesignResult> {
  const token = canvaConfigured() ? await getValidToken() : null;
  if (!token) {
    return {
      imageUrl: sandboxDesignImage(input.caption),
      editUrl: "https://www.canva.com/",
      designId: null,
      source: "sandbox",
    };
  }
  const { designId, editUrl } = await createDesignReal(
    token,
    input.caption,
    input.imageUrl
  );
  const exported = await exportDesignPng(token, designId);
  return {
    imageUrl: exported ?? sandboxDesignImage(input.caption),
    editUrl,
    designId,
    source: "canva",
  };
}
