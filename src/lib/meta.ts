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

function facebookDialogUrl(
  redirectUri: string,
  state: string,
  scopes: string[]
): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID || "",
    redirect_uri: redirectUri,
    state,
    scope: scopes.join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/${graphVersion()}/dialog/oauth?${params}`;
}

// Facebook Login — identity. public_profile is available without extra App Review.
// Do not require email: new Meta apps often reject the email scope until it is
// added under Use cases, which surfaces as a Facebook login error.
export function facebookLoginUrl(redirectUri: string, state: string): string {
  return facebookDialogUrl(redirectUri, state, ["public_profile"]);
}

// Instagram Login (Instagram API with Instagram Login).
export function instagramLoginUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID || "",
    redirect_uri: redirectUri,
    state,
    scope: [
      "instagram_business_basic",
      "instagram_business_content_publish",
    ].join(","),
    response_type: "code",
  });
  return `https://www.instagram.com/oauth/authorize?${params}`;
}

// Connect Facebook Pages + linked IG Business accounts for publishing.
export function oauthLoginUrl(redirectUri: string, state: string): string {
  return facebookDialogUrl(redirectUri, state, [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
    "business_management",
  ]);
}

export interface SocialProfile {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

export async function fetchFacebookProfile(
  accessToken: string
): Promise<SocialProfile> {
  const params = new URLSearchParams({
    fields: "id,name,email,picture",
    access_token: accessToken,
  });
  const res = await fetch(graphUrl(`me?${params.toString()}`));
  const json = (await res.json()) as {
    id?: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
    error?: { message?: string };
  };
  if (!res.ok || !json.id) {
    throw new Error(json.error?.message || "Failed to load Facebook profile");
  }
  return {
    id: json.id,
    name: json.name || "Facebook user",
    email: json.email || null,
    avatarUrl: json.picture?.data?.url || null,
  };
}

export async function exchangeInstagramCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; userId: string }> {
  const body = new URLSearchParams({
    client_id: process.env.META_APP_ID || "",
    client_secret: process.env.META_APP_SECRET || "",
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    user_id?: string | number;
    data?: Array<{ access_token?: string; user_id?: string | number }>;
    error_message?: string;
    error?: { message?: string };
  };
  const row = json.data?.[0];
  const accessToken = json.access_token || row?.access_token;
  const userId = String(json.user_id || row?.user_id || "");
  if (!res.ok || !accessToken) {
    throw new Error(
      json.error?.message ||
        json.error_message ||
        "Failed to exchange Instagram code"
    );
  }
  return { accessToken, userId };
}

export async function fetchInstagramProfile(
  accessToken: string
): Promise<SocialProfile> {
  const params = new URLSearchParams({
    fields: "user_id,username,name,profile_picture_url",
    access_token: accessToken,
  });
  const res = await fetch(
    `https://graph.instagram.com/${graphVersion()}/me?${params.toString()}`
  );
  const json = (await res.json()) as {
    user_id?: string;
    id?: string;
    username?: string;
    name?: string;
    profile_picture_url?: string;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(json.error?.message || "Failed to load Instagram profile");
  }
  const id = String(json.user_id || json.id || "");
  if (!id) {
    throw new Error("Instagram profile did not include a user id");
  }
  const username = json.username ? `@${json.username}` : "Instagram user";
  return {
    id,
    name: json.name || username,
    email: null,
    avatarUrl: json.profile_picture_url || null,
  };
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
    error?: { message?: string; type?: string; code?: number };
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(
      json.error?.message || json.error_description || "Failed to exchange code"
    );
  }
  return json.access_token;
}
