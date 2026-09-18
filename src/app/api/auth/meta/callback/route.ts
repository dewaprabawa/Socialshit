import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, oauthBaseUrl, verifyOAuthState } from "@/lib/auth";
import {
  exchangeCodeForToken,
  graphVersion,
  metaConfigured,
} from "@/lib/meta";

export const dynamic = "force-dynamic";

async function upsertOwnedAccount(
  userId: string,
  data: {
    platform: "facebook" | "instagram";
    name: string;
    handle: string | null;
    externalId: string;
    accessToken: string;
    avatarUrl?: string | null;
  }
) {
  const existing = await prisma.account.findFirst({
    where: {
      userId,
      platform: data.platform,
      externalId: data.externalId,
    },
  });
  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: {
        accessToken: data.accessToken,
        name: data.name,
        handle: data.handle,
        avatarUrl: data.avatarUrl ?? existing.avatarUrl,
        sandbox: false,
      },
    });
    return;
  }
  await prisma.account.create({
    data: {
      userId,
      platform: data.platform,
      name: data.name,
      handle: data.handle,
      externalId: data.externalId,
      accessToken: data.accessToken,
      avatarUrl: data.avatarUrl ?? null,
      sandbox: false,
    },
  });
}

// Handles the Meta OAuth redirect: exchanges the code, then discovers the
// user's Facebook Pages and their linked Instagram business accounts.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/accounts", req.url));
  }
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

  try {
    const userToken = await exchangeCodeForToken(code, redirectUri);
    const v = graphVersion();

    const pagesRes = await fetch(
      `https://graph.facebook.com/${v}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${encodeURIComponent(
        userToken
      )}`
    );
    const pagesJson = (await pagesRes.json()) as {
      data?: Array<{
        id: string;
        name: string;
        access_token: string;
        instagram_business_account?: {
          id: string;
          username?: string;
          profile_picture_url?: string;
        };
      }>;
    };

    let connected = 0;
    for (const page of pagesJson.data ?? []) {
      await upsertOwnedAccount(user.id, {
        platform: "facebook",
        name: page.name,
        handle: page.name,
        externalId: page.id,
        accessToken: page.access_token,
      });
      connected++;

      if (page.instagram_business_account) {
        const ig = page.instagram_business_account;
        await upsertOwnedAccount(user.id, {
          platform: "instagram",
          name: ig.username || page.name,
          handle: ig.username ? `@${ig.username}` : null,
          externalId: ig.id,
          accessToken: page.access_token,
          avatarUrl: ig.profile_picture_url || null,
        });
        connected++;
      }
    }

    return NextResponse.redirect(
      new URL(`/accounts?connected=${connected}`, req.url)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "oauth_failed";
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(message)}`, req.url)
    );
  }
}
