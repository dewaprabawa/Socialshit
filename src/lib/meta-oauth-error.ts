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
  const instagramCallback = origin
    ? `${origin.replace(/\/$/, "")}/api/auth/instagram/callback`
    : "/api/auth/instagram/callback";

  if (
    lower === "missing_business" ||
    lower.includes("business portfolio") ||
    lower.includes("business account") ||
    lower.includes("business manager") ||
    lower.includes("not connected to a business") ||
    lower.includes("tidak terhubung")
  ) {
    return (
      "Continue with Facebook does not need a Meta Business account. Use Facebook Login " +
      "(Authentication use case) with public_profile only — not Facebook Login for Business. " +
      "To publish, use Continue with Instagram (Instagram API with Instagram Login). " +
      "A Facebook Page is optional and separate."
    );
  }

  if (
    lower === "missing_supported_permission" ||
    lower.includes("supported permission") ||
    lower.includes("setidaknya satu")
  ) {
    return (
      "The Meta app is using Facebook Login for Business, which needs a Business portfolio. " +
      "For personal Facebook sign-in, add the Facebook Login product (Authentication use case) " +
      "with only public_profile. Do not use a Login for Business config_id on Continue with Facebook."
    );
  }

  if (
    lower === "invalid_scopes" ||
    lower.includes("invalid scope") ||
    lower.includes("invalid_scope")
  ) {
    return (
      "Facebook rejected Page/Instagram permissions. Continue with Facebook only requests " +
      "public_profile. For Instagram publishing use Continue with Instagram (Instagram API with " +
      "Instagram Login). Facebook Pages are a separate optional step."
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
      "Add the Facebook Login product (not Login for Business), paste the Valid OAuth Redirect URI, " +
      "add the App domain (no https://), and keep App Mode on Development. Live mode is not required."
    );
  }

  if (
    lower.includes("invalid platform") ||
    lower.includes("instagram product") ||
    (lower.includes("instagram login") && lower.includes("not available"))
  ) {
    return (
      "Instagram API with Instagram Login is not enabled on this Meta app. " +
      "Add the Instagram product → API setup with Instagram login, paste " +
      `${instagramCallback} as a Valid OAuth Redirect URI, and add your Instagram username as a tester.`
    );
  }

  if (
    lower.includes("professional account") ||
    lower.includes("convert to professional") ||
    lower.includes("business or creator")
  ) {
    return (
      "Instagram API with Instagram Login needs a Professional Instagram account " +
      "(Business or Creator). Convert the account in the Instagram app, then try again. " +
      "A Facebook Page and Business Manager are not required."
    );
  }

  if (lower.includes("redirect_uri") || lower === "redirect_uri") {
    return (
      `${decoded} Add ${facebookCallback} under Facebook Login Valid OAuth Redirect URIs, ` +
      `and ${instagramCallback} under Instagram → API setup with Instagram login.`
    );
  }

  if (lower.includes("meta app is not configured") || lower === "meta_not_configured") {
    return "Meta app keys are not set on this host. In Vercel → Settings → Environment Variables add META_APP_ID, META_APP_SECRET, and APP_BASE_URL, then Redeploy.";
  }

  if (lower.includes("database") || decoded.includes("DATABASE_URL")) {
    return "This host has no Postgres URL, so a database session could not be saved. Add DATABASE_URL on Vercel.";
  }

  return decoded;
}
