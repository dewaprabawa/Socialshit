"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Provider = "facebook" | "instagram";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2Zm8.4 1.8H7.8c-2.2 0-4 1.8-4 4v8.4c0 2.2 1.8 4 4 4h8.4c2.2 0 4-1.8 4-4V7.8c0-2.2-1.8-4-4-4ZM12 7.2A4.8 4.8 0 1 1 7.2 12 4.8 4.8 0 0 1 12 7.2Zm0 1.8A3 3 0 1 0 15 12a3 3 0 0 0-3-3Zm5.4-2.85a1.05 1.05 0 1 1-1.05 1.05 1.05 1.05 0 0 1 1.05-1.05Z"
      />
    </svg>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const error = params.get("error");
  const [busy, setBusy] = useState<Provider | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [sandboxLogin, setSandboxLogin] = useState(true);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setSandboxLogin(!d.meta))
      .catch(() => setSandboxLogin(true));
  }, []);

  const errorText = useMemo(() => {
    if (localError) return localError;
    if (!error) return null;
    return error;
  }, [error, localError]);

  async function start(provider: Provider) {
    setBusy(provider);
    setLocalError(null);
    try {
      const cfg = await fetch("/api/config").then((r) => r.json());
      if (cfg.meta) {
        const url = `/api/auth/${provider}?next=${encodeURIComponent(next)}`;
        window.location.href = url;
        return;
      }
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      window.location.href = data.redirect || "/";
    } catch (e) {
      setLocalError((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="mb-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-pink-500 text-2xl font-black text-white">
          S
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Sign in to Socialshit
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Continue with Facebook or Instagram to generate, schedule, and publish
          content.
        </p>
      </div>

      <div className="card space-y-3">
        {errorText && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {errorText}
          </div>
        )}

        <button
          type="button"
          onClick={() => start("facebook")}
          disabled={Boolean(busy)}
          className="btn w-full bg-[#1877F2] text-white hover:bg-[#166fe5]"
        >
          <FacebookIcon />
          {busy === "facebook" ? "Signing in…" : "Continue with Facebook"}
        </button>

        <button
          type="button"
          onClick={() => start("instagram")}
          disabled={Boolean(busy)}
          className="btn w-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white hover:opacity-95"
        >
          <InstagramIcon />
          {busy === "instagram" ? "Signing in…" : "Continue with Instagram"}
        </button>

        <p className="pt-1 text-center text-xs text-slate-500">
          {sandboxLogin
            ? "Meta app keys are not set — these buttons create a sandbox session so you can try the full marketing flow."
            : "You’ll be redirected to Facebook or Instagram to authorize Socialshit."}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-slate-400">Loading…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
