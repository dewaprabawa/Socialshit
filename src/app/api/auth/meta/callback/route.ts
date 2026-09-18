import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForToken,
  graphVersion,
  metaConfigured,
} from "@/lib/meta";

export const dynamic = "force-dynamic";

// Handles the Meta OAuth redirect: exchanges the code, then discovers the
// user's Facebook Pages and their linked Instagram business accounts.
export async function GET(req: NextRequest) {
  if (!metaConfigured()) {
    return NextResponse.redirect(new URL("/accounts?error=meta_not_configured", req.url));
  }
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/accounts?error=missing_code", req.url));
  }

  const base = process.env.APP_BASE_URL || req.nextUrl.origin.replace(/\/$/, "");
  const redirectUri = `${base}/api/auth/meta/callback`;

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
      await prisma.account.upsert({
        where: { id: `fb-${page.id}` },
        update: { accessToken: page.access_token, name: page.name },
        create: {
          id: `fb-${page.id}`,
          platform: "facebook",
          name: page.name,
          handle: page.name,
          externalId: page.id,
          accessToken: page.access_token,
          sandbox: false,
        },
      });
      connected++;

      if (page.instagram_business_account) {
        const ig = page.instagram_business_account;
        await prisma.account.upsert({
          where: { id: `ig-${ig.id}` },
          update: { accessToken: page.access_token },
          create: {
            id: `ig-${ig.id}`,
            platform: "instagram",
            name: ig.username || page.name,
            handle: ig.username ? `@${ig.username}` : null,
            externalId: ig.id,
            accessToken: page.access_token,
            avatarUrl: ig.profile_picture_url || null,
            sandbox: false,
          },
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
