"use client";

import { useEffect, useState } from "react";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-400">{label}</div>
      <div className="flex items-center gap-2">
        <code className="block min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200">
          {value}
        </code>
        <button type="button" onClick={copy} className="btn-ghost shrink-0 px-3 py-2 text-xs">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function MetaSetupGuide({ metaReady = false }: { metaReady?: boolean }) {
  const [origin, setOrigin] = useState("http://localhost:3000");
  const [metaAppId, setMetaAppId] = useState<string | null>(null);
  const [metaLoginConfig, setMetaLoginConfig] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin.replace(/\/$/, ""));
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        setMetaAppId(typeof d.metaAppId === "string" ? d.metaAppId : null);
        setMetaLoginConfig(Boolean(d.metaLoginConfig));
      })
      .catch(() => undefined);
  }, []);

  const facebookCallback = `${origin}/api/auth/facebook/callback`;
  const instagramCallback = `${origin}/api/auth/instagram/callback`;
  const privacyUrl = `${origin}/privacy`;
  const deletionUrl = `${origin}/privacy#data-deletion`;
  const appDomain = origin.replace(/^https?:\/\//, "").split("/")[0];
  const appBase = metaAppId
    ? `https://developers.facebook.com/apps/${metaAppId}`
    : "https://developers.facebook.com/apps";
  const permissionsUrl = metaAppId
    ? `${appBase}/app-review/permissions/`
    : "https://developers.facebook.com/apps/";
  const loginBusinessUrl = metaAppId
    ? `${appBase}/fb-login-business/configurations/`
    : "https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/";
  const rolesUrl = metaAppId
    ? `${appBase}/roles/roles/`
    : "https://developers.facebook.com/apps/";
  const loginSettingsUrl = metaAppId
    ? `${appBase}/fb-login/settings/`
    : "https://developers.facebook.com/apps/";
  const basicSettingsUrl = metaAppId
    ? `${appBase}/settings/basic/`
    : "https://developers.facebook.com/apps/";

  return (
    <div className="card space-y-4 text-sm">
      <div>
        <h2 className="text-base font-semibold">
          {metaReady ? "Finish Meta dashboard setup" : "Connect Facebook Developer"}
        </h2>
        <p className="mt-1 text-slate-400">
          {metaReady
            ? "App ID and secret are loaded. Login uses public_profile only. Connecting Pages needs Facebook Login for Business (or those permissions added under App Review)."
            : "Do this once so Continue with Facebook and Continue with Instagram use your real Meta app instead of sandbox login."}
        </p>
      </div>

      {metaReady && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-amber-100">
          <p className="font-medium text-amber-50">
            “Aplikasi ini tidak bisa diakses sekarang”
          </p>
          <p className="mt-1 text-xs text-amber-100/90">
            Facebook shows that when the app is in Development and your Facebook
            account is not a role on the app, Facebook Login is missing, or the
            app is switched off. Live / App Review is not required for you to
            sign in.
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-amber-100/90">
            <li>
              Open{" "}
              <a
                className="text-white underline"
                href={rolesUrl}
                target="_blank"
                rel="noreferrer"
              >
                App roles
              </a>{" "}
              and add the same Facebook user you click Continue with. Role:{" "}
              <span className="text-white">Administrator</span> or{" "}
              <span className="text-white">Tester</span>. Accept the invite email
              if Facebook sends one.
            </li>
            <li>
              Add{" "}
              <a
                className="text-white underline"
                href={loginSettingsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Facebook Login
              </a>{" "}
              (Use cases → Authentication and Account Creation → Customize). Turn
              on Client OAuth login and Web OAuth login.
            </li>
            <li>
              In{" "}
              <a
                className="text-white underline"
                href={basicSettingsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Settings → Basic
              </a>{" "}
              set App domains to the host below (no https://) and add a Website
              platform with the Site URL. Keep App Mode on{" "}
              <span className="text-white">Development</span>.
            </li>
          </ol>
        </div>
      )}

      {metaReady && !metaLoginConfig && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-amber-100">
          <p className="font-medium text-amber-50">
            Invalid Scopes on Connect with Meta
          </p>
          <p className="mt-1 text-xs text-amber-100/90">
            After login works, Connect Pages still needs Facebook Login for
            Business. Add that product, create a User access token configuration,
            then paste the Config ID as{" "}
            <code className="text-white">META_LOGIN_CONFIG_ID</code>.
          </p>
        </div>
      )}

      {metaReady && metaLoginConfig && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          Facebook Login for Business Config ID is set. Connect Pages uses that
          configuration instead of listing scopes on consumer Facebook Login.
        </div>
      )}

      <ol className="list-decimal space-y-3 pl-5 text-slate-300">
        <li>
          Open{" "}
          <a
            className="text-brand-400 hover:underline"
            href={appBase}
            target="_blank"
            rel="noreferrer"
          >
            Meta for Developers
          </a>{" "}
          and create an app. Choose a <span className="text-white">Business</span> app (or the{" "}
          <span className="text-white">Authenticate and request data from users with Facebook
          Login</span>{" "}
          use case).
        </li>
        <li>
          Add the <span className="text-white">Facebook Login</span> product. In the current
          dashboard that is usually{" "}
          <span className="text-white">Use cases → Authentication and Account Creation →
          Customize → Go to settings</span>.
        </li>
        <li>
          Turn on <span className="text-white">Client OAuth login</span> and{" "}
          <span className="text-white">Web OAuth login</span>. Paste these{" "}
          <span className="text-white">Valid OAuth Redirect URIs</span> exactly (no trailing
          slash). Login and Connect Pages share the Facebook callback:
        </li>
      </ol>

      <div className="space-y-2">
        <CopyRow label="App domains (Settings → Basic) — no https://" value={appDomain} />
        <CopyRow label="Site URL / Allowed domains for JavaScript SDK" value={origin} />
        <CopyRow label="Facebook Login + Connect Pages callback" value={facebookCallback} />
        <CopyRow label="Instagram Login callback" value={instagramCallback} />
        <CopyRow label="Privacy Policy URL (App settings → Basic)" value={privacyUrl} />
        <CopyRow label="User data deletion instructions URL" value={deletionUrl} />
      </div>

      <ol className="list-decimal space-y-3 pl-5 text-slate-300" start={4}>
        <li>
          <span className="text-white">Connect Pages — Facebook Login for Business.</span>{" "}
          Open{" "}
          <a
            className="text-brand-400 hover:underline"
            href={loginBusinessUrl}
            target="_blank"
            rel="noreferrer"
          >
            Facebook Login for Business → Configurations
          </a>
          . Create a configuration:
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-400">
            <li>Access token type: <span className="text-white">User access token</span></li>
            <li>
              Permissions: <code className="text-slate-200">pages_show_list</code>,{" "}
              <code className="text-slate-200">pages_read_engagement</code>,{" "}
              <code className="text-slate-200">pages_manage_posts</code>,{" "}
              <code className="text-slate-200">instagram_basic</code>,{" "}
              <code className="text-slate-200">instagram_content_publish</code>,{" "}
              <code className="text-slate-200">business_management</code>
            </li>
            <li>Copy the <span className="text-white">Config ID</span></li>
          </ul>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-slate-950 p-3 text-xs text-slate-200">{`META_LOGIN_CONFIG_ID=your_config_id`}</pre>
          <p className="mt-2 text-xs text-slate-400">
            Alternative if you stay on consumer Facebook Login:{" "}
            <a
              className="text-brand-400 hover:underline"
              href={permissionsUrl}
              target="_blank"
              rel="noreferrer"
            >
              App Review → Permissions and Features
            </a>{" "}
            and add the same permissions. In Development, Admins/Developers/Testers
            can grant them without submitting App Review.
          </p>
        </li>
        <li>
          For Instagram Login, add the <span className="text-white">Instagram</span> product and
          open <span className="text-white">API setup with Instagram login</span>. Add the same
          Instagram callback URI there. Your IG account must be a{" "}
          <span className="text-white">Professional</span> (Business or Creator) account.
        </li>
        <li>
          In <span className="text-white">App settings → Basic</span>, copy{" "}
          <span className="text-white">App ID</span> and <span className="text-white">App
          Secret</span>. Put them in the app environment (never in frontend code):
          <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-slate-950 p-3 text-xs text-slate-200">{`META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_LOGIN_CONFIG_ID=your_config_id
APP_BASE_URL=${origin}`}</pre>
        </li>
        <li>
          Local: add those lines to <code className="text-slate-200">.env</code> and restart{" "}
          <code className="text-slate-200">npm run dev</code>. Vercel: Project → Settings →
          Environment Variables, then Redeploy. In{" "}
          <span className="text-white">App settings → Basic → App domains</span> paste the App
          domain above (for this production site that is{" "}
          <code className="text-slate-200">socialshit-dev-1.vercel.app</code>, not{" "}
          <code className="text-slate-200">https://</code>). Add a Website platform with the Site
          URL. If Facebook says the URL cannot be loaded, the App domain is missing.
        </li>
        <li>
          While the Meta app is in <span className="text-white">Development</span> mode, only
          Admins, Developers, and Testers can log in. Add yourself under{" "}
          <span className="text-white">App roles</span>.
        </li>
        <li>
          Reload this page. The sandbox note should disappear. Click{" "}
          <span className="text-white">Continue with Facebook</span>. After login, use{" "}
          <span className="text-white">Accounts → Add integration → Connect with Meta</span> to
          attach Pages and linked Instagram Business accounts for publishing.
        </li>
        <li>
          Before switching the Meta app to <span className="text-white">Live</span>, paste the
          Privacy Policy URL and data-deletion URL above into{" "}
          <span className="text-white">App settings → Basic</span>. Testers can keep using the app
          in Development without Live mode. Publishing permissions still need App Review.
        </li>
      </ol>
    </div>
  );
}