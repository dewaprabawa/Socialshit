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
    lower === "missing_supported_permission" ||
    lower.includes("supported permission") ||
    lower.includes("setidaknya satu")
  ) {
    return (
      "Facebook Login for Business needs at least one permission besides " +
      "public_profile (this app asks for pages_show_list). In the Meta app open " +
      "Use cases → Authentication → Customize and add pages_show_list, or create a " +
      "Facebook Login for Business configuration with that permission and set " +
      "META_LOGIN_CONFIG_ID on Vercel, then Redeploy."
    );
  }
  if (
    lower === "invalid_scopes" ||
    lower.includes("invalid scope") ||
    lower.includes("invalid_scope")
  ) {
    return (
      "Facebook rejected the Page/Instagram permissions (Invalid Scopes). " +
      "Continue with Facebook (login) now also requests pages_show_list. " +
      "Connect Pages needs Facebook Login for Business: add that product, create a User access token " +
      "configuration with pages_show_list, pages_read_engagement, pages_manage_posts, " +
      "instagram_basic, instagram_content_publish, and business_management, then set " +
      "META_LOGIN_CONFIG_ID on Vercel and Redeploy. Or add each permission under " +
      "App Review → Permissions and Features (Development testers can use them immediately)."
    );
  }

  if (
    lower === "app_unavailable" ||
    lower.includes("tidak bisa diakses") ||
    lower.includes("not accessible") ||
    lower.includes("isn't available") ||
    lower.includes("isnt available") ||
    lower.includes("app not available") ||
    lower.includes("temporarily_unavailable") ||
    lower.includes("app_not_setup")
  ) {
    return (
      "Facebook blocked this login because the Meta app is in Development, " +
      "turned off, or your Facebook account is not an Admin/Developer/Tester. " +
      "Open the Meta app → App roles and add the same Facebook account you use to log in. " +
      "Add the Facebook Login product, paste the Valid OAuth Redirect URI, add the App domain " +
      "(no https://), and keep App Mode on Development while you test. Live mode is not required."
    );
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
