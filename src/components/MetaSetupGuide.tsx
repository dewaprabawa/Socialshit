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

export function MetaSetupGuide() {
  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    setOrigin(window.location.origin.replace(/\/$/, ""));
  }, []);

  const facebookCallback = `${origin}/api/auth/facebook/callback`;
  const instagramCallback = `${origin}/api/auth/instagram/callback`;
  const pagesCallback = `${origin}/api/auth/meta/callback`;

  return (
    <div className="card space-y-4 text-sm">
      <div>
        <h2 className="text-base font-semibold">Connect Facebook Developer</h2>
        <p className="mt-1 text-slate-400">
          Do this once so <span className="text-slate-200">Continue with Facebook</span> and{" "}
          <span className="text-slate-200">Continue with Instagram</span> use your real Meta app
          instead of sandbox login.
        </p>
      </div>

      <ol className="list-decimal space-y-3 pl-5 text-slate-300">
        <li>
          Open{" "}
          <a
            className="text-brand-400 hover:underline"
            href="https://developers.facebook.com/apps/"
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
          slash):
        </li>
      </ol>

      <div className="space-y-2">
        <CopyRow label="Facebook Login callback" value={facebookCallback} />
        <CopyRow label="Instagram Login callback" value={instagramCallback} />
        <CopyRow label="Connect Pages / IG Business (after you are signed in)" value={pagesCallback} />
      </div>

      <ol className="list-decimal space-y-3 pl-5 text-slate-300" start={4}>
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
APP_BASE_URL=${origin}`}</pre>
        </li>
        <li>
          Local: add those lines to <code className="text-slate-200">.env</code> and restart{" "}
          <code className="text-slate-200">npm run dev</code>. Vercel: Project → Settings →
          Environment Variables, then Redeploy. Also add this site under{" "}
          <span className="text-white">App domains</span> (for localhost use{" "}
          <code className="text-slate-200">localhost</code>).
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
      </ol>
    </div>
  );
}
