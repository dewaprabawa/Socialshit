/** Map Meta OAuth error strings / codes into setup instructions. */

export function friendlyMetaOAuthError(
  raw: string | null | undefined,
  origin = ""
): string | null {
  if (!raw) return null;
  const decoded = raw.replace(/\+/g, " ");
  const lower = decoded.toLowerCase();
  const facebookCallback = origin
    ? `${origin.replace(/\/$/, "")}/api/auth/facebook/callback`
    : "/api/auth/facebook/callback";

  if (
    lower === "invalid_scopes" ||
    lower.includes("invalid scope") ||
    lower.includes("invalid_scope")
  ) {
    return (
      "Facebook rejected the Page/Instagram permissions (Invalid Scopes). " +
      "Continue with Facebook (login) only needs public_profile. Connect Pages needs " +
      "Facebook Login for Business: add that product, create a User access token " +
      "configuration with pages_show_list, pages_read_engagement, pages_manage_posts, " +
      "instagram_basic, instagram_content_publish, and business_management, then set " +
      "META_LOGIN_CONFIG_ID on Vercel and Redeploy. Or add each permission under " +
      "App Review → Permissions and Features (Development testers can use them immediately)."
    );
  }

  if (decoded === "access_denied" || decoded === "user_denied") {
    return "Facebook login was cancelled. Try again.";
  }

  if (lower.includes("redirect_uri") || lower === "redirect_uri") {
    return `${decoded} Add ${facebookCallback} to Valid OAuth Redirect URIs in the Meta app.`;
  }

  if (lower.includes("meta app is not configured") || lower === "meta_not_configured") {
    return "Meta app keys are not set on this host. In Vercel → Settings → Environment Variables add META_APP_ID, META_APP_SECRET, and APP_BASE_URL, then Redeploy.";
  }

  if (
    lower.includes("database") ||
    decoded.includes("DATABASE_URL")
  ) {
    return "This host has no Postgres URL, so a database session could not be saved. Add DATABASE_URL on Vercel.";
  }

  return decoded;
}
