export type Platform = "instagram" | "facebook";

export function metaConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function graphVersion(): string {
  return process.env.META_GRAPH_VERSION || "v21.0";
}

export interface PublishInput {
  platform: Platform;
  externalId: string; // IG business account id or FB page id
  accessToken: string;
  caption: string;
  mediaUrl?: string | null;
  sandbox: boolean;
}

export interface PublishResult {
  externalId: string;
  externalUrl: string | null;
  sandbox: boolean;
}

function graphUrl(path: string): string {
  return `https://graph.facebook.com/${graphVersion()}/${path}`;
}

async function graphPost(
  path: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams(params);
  const res = await fetch(graphUrl(path), { method: "POST", body });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = (json.error as { message?: string } | undefined)?.message;
    throw new Error(err || `Graph API error (${res.status})`);
  }
  return json;
}

// Simulated publish used when credentials are missing or the account is in
// sandbox mode. Lets the full create -> publish -> permalink flow be exercised.
function sandboxPublish(input: PublishInput): PublishResult {
  const id = `sandbox-${input.platform}-${Date.now()}-${Math.floor(
    Math.random() * 1e6
  )}`;
  const url =
    input.platform === "instagram"
      ? `https://instagram.com/p/${id}`
      : `https://facebook.com/${input.externalId}/posts/${id}`;
  return { externalId: id, externalUrl: url, sandbox: true };
}

async function publishInstagram(input: PublishInput): Promise<PublishResult> {
  if (!input.mediaUrl) {
    throw new Error("Instagram posts require an image (mediaUrl).");
  }
  // Step 1: create a media container.
  const container = await graphPost(`${input.externalId}/media`, {
    image_url: input.mediaUrl,
    caption: input.caption,
    access_token: input.accessToken,
  });
  const creationId = container.id as string;

  // Step 2: publish the container.
  const published = await graphPost(`${input.externalId}/media_publish`, {
    creation_id: creationId,
    access_token: input.accessToken,
  });
  const mediaId = published.id as string;

  // Step 3: fetch the permalink (best effort).
  let permalink: string | null = null;
  try {
    const res = await fetch(
      graphUrl(
        `${mediaId}?fields=permalink&access_token=${encodeURIComponent(
          input.accessToken
        )}`
      )
    );
    const json = (await res.json()) as { permalink?: string };
    permalink = json.permalink ?? null;
  } catch {
    permalink = null;
  }

  return { externalId: mediaId, externalUrl: permalink, sandbox: false };
}

async function publishFacebook(input: PublishInput): Promise<PublishResult> {
  // Photo post if media provided, otherwise a text feed post.
  if (input.mediaUrl) {
    const res = await graphPost(`${input.externalId}/photos`, {
      url: input.mediaUrl,
      caption: input.caption,
      access_token: input.accessToken,
    });
    const postId = (res.post_id as string) || (res.id as string);
    return {
      externalId: postId,
      externalUrl: `https://facebook.com/${postId}`,
      sandbox: false,
    };
  }
  const res = await graphPost(`${input.externalId}/feed`, {
    message: input.caption,
    access_token: input.accessToken,
  });
  const postId = res.id as string;
  return {
    externalId: postId,
    externalUrl: `https://facebook.com/${postId}`,
    sandbox: false,
  };
}

export async function publishPost(input: PublishInput): Promise<PublishResult> {
  if (input.sandbox || input.accessToken === "sandbox") {
    return sandboxPublish(input);
  }
  return input.platform === "instagram"
    ? publishInstagram(input)
    : publishFacebook(input);
}

// --- OAuth helpers (used when real Meta credentials are configured) ---

export function oauthLoginUrl(redirectUri: string, state: string): string {
  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
    "business_management",
  ].join(",");
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID || "",
    redirect_uri: redirectUri,
    state,
    scope: scopes,
    response_type: "code",
  });
  return `https://www.facebook.com/${graphVersion()}/dialog/oauth?${params}`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID || "",
    client_secret: process.env.META_APP_SECRET || "",
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(
    graphUrl(`oauth/access_token?${params.toString()}`)
  );
  const json = (await res.json()) as {
    access_token?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message || "Failed to exchange code");
  }
  return json.access_token;
}
