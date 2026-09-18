"use client";

import { useEffect, useState } from "react";

type Platform = "facebook" | "instagram";
type Method = "meta" | "manual" | "sandbox";

interface Props {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
}

const STEPS = ["Platform", "Method", "Details", "Done"];

export function ConnectWizard({ open, onClose, onConnected }: Props) {
  const [step, setStep] = useState(0);
  const [metaReady, setMetaReady] = useState(false);
  const [platform, setPlatform] = useState<Platform | "">("");
  const [method, setMethod] = useState<Method | "">("");

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [externalId, setExternalId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; sandbox: boolean } | null>(
    null
  );

  useEffect(() => {
    if (!open) return;
    // Reset each time the wizard opens.
    setStep(0);
    setPlatform("");
    setMethod("");
    setName("");
    setHandle("");
    setExternalId("");
    setAccessToken("");
    setError(null);
    setCreated(null);
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setMetaReady(Boolean(d.meta)))
      .catch(() => setMetaReady(false));
  }, [open]);

  if (!open) return null;

  const platformLabel = platform === "instagram" ? "Instagram" : "Facebook";
  const idLabel =
    platform === "instagram"
      ? "Instagram Business Account ID"
      : "Facebook Page ID";

  function next() {
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function chooseMethod(m: Method) {
    setMethod(m);
    setError(null);
    setStep(2);
  }

  function startMetaOAuth() {
    window.location.href = "/api/auth/meta";
  }

  async function submit() {
    if (!name.trim()) {
      setError("Please enter an account name.");
      return;
    }
    if (method === "manual") {
      if (!accessToken.trim()) {
        setError("An access token is required for a live connection.");
        return;
      }
      if (!externalId.trim()) {
        setError(`A ${idLabel} is required for a live connection.`);
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        platform,
        name,
        handle: handle || undefined,
      };
      if (method === "manual") {
        payload.accessToken = accessToken.trim();
        payload.externalId = externalId.trim();
      } else {
        payload.sandbox = true;
      }
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create integration");
      setCreated({ name: data.account.name, sandbox: data.account.sandbox });
      setStep(3);
      onConnected();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        {/* Header + stepper */}
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Add an integration</h2>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div
                  className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    i < step
                      ? "bg-brand-600 text-white"
                      : i === step
                      ? "bg-brand-500 text-white ring-2 ring-brand-400/50"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  className={`hidden text-xs sm:inline ${
                    i === step ? "text-white" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="h-px flex-1 bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Step 0: platform */}
          {step === 0 && (
            <div>
              <p className="mb-4 text-sm text-slate-400">
                Which account do you want to connect?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      key: "facebook",
                      title: "Facebook Page",
                      desc: "Publish photos and text posts to a Page.",
                    },
                    {
                      key: "instagram",
                      title: "Instagram Business",
                      desc: "Publish photos to an IG Business/Creator account.",
                    },
                  ] as { key: Platform; title: string; desc: string }[]
                ).map((p) => (
                  <button
                    key={p.key}
                    onClick={() => {
                      setPlatform(p.key);
                      next();
                    }}
                    className={`rounded-xl border p-4 text-left transition ${
                      platform === p.key
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-white/10 bg-white/5 hover:border-brand-500/50"
                    }`}
                  >
                    <div
                      className={`badge ${
                        p.key === "instagram"
                          ? "bg-pink-500/20 text-pink-300"
                          : "bg-blue-600/20 text-blue-300"
                      }`}
                    >
                      {p.title}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{p.desc}</p>
                  </button>
                ))}
              </div>
              {platform === "instagram" && (
                <p className="mt-3 text-xs text-amber-400/80">
                  Instagram publishing requires an IG Business account linked to a
                  Facebook Page.
                </p>
              )}
            </div>
          )}

          {/* Step 1: method */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="mb-1 text-sm text-slate-400">
                How do you want to connect your {platformLabel} account?
              </p>
              <button
                onClick={() => metaReady && chooseMethod("meta")}
                disabled={!metaReady}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  metaReady
                    ? "border-white/10 bg-white/5 hover:border-brand-500/50"
                    : "cursor-not-allowed border-white/10 bg-white/5 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Connect with Meta (OAuth)</span>
                  <span className="badge bg-emerald-500/20 text-emerald-300">
                    Recommended
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Securely authorize via Facebook. Automatically discovers your
                  Pages and linked Instagram accounts.
                </p>
                {!metaReady && (
                  <p className="mt-2 text-xs text-amber-400/80">
                    Unavailable: set META_APP_ID and META_APP_SECRET to enable.
                  </p>
                )}
              </button>

              <button
                onClick={() => chooseMethod("manual")}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-brand-500/50"
              >
                <span className="font-medium">Enter an access token manually</span>
                <p className="mt-1 text-sm text-slate-400">
                  For advanced users with a Page access token and account ID from
                  the Meta developer tools.
                </p>
              </button>

              <button
                onClick={() => chooseMethod("sandbox")}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-brand-500/50"
              >
                <span className="font-medium">Create a sandbox account</span>
                <p className="mt-1 text-sm text-slate-400">
                  A simulated account to try generation, scheduling, and
                  publishing without any credentials.
                </p>
              </button>

              <div className="pt-2">
                <button onClick={back} className="btn-ghost">
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 2: details */}
          {step === 2 && method === "meta" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">
                  You&apos;ll be redirected to Facebook
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-400">
                  <li>Log in and choose the Pages to connect.</li>
                  <li>Approve the requested permissions.</li>
                  <li>
                    We&apos;ll import each Page and its linked Instagram Business
                    account automatically.
                  </li>
                </ol>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="btn-ghost">
                  Back
                </button>
                <button onClick={startMetaOAuth} className="btn-primary">
                  Continue with Meta
                </button>
              </div>
            </div>
          )}

          {step === 2 && method === "manual" && (
            <div className="space-y-3">
              <div>
                <label className="label">Account name</label>
                <input
                  className="input"
                  placeholder={
                    platform === "instagram" ? "@mybrand" : "My Brand Page"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Handle (optional)</label>
                <input
                  className="input"
                  placeholder={platform === "instagram" ? "@mybrand" : "My Brand Page"}
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
              </div>
              <div>
                <label className="label">{idLabel}</label>
                <input
                  className="input"
                  placeholder={
                    platform === "instagram" ? "17841400000000000" : "1234567890"
                  }
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Page access token</label>
                <input
                  className="input"
                  type="password"
                  placeholder="EAAG… long-lived Page access token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-800/50 p-3 text-xs text-slate-400">
                Get these from{" "}
                <a
                  className="text-brand-400 hover:underline"
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Meta Graph API Explorer
                </a>
                . You need a long-lived Page access token with{" "}
                <code>pages_manage_posts</code>
                {platform === "instagram" && (
                  <>
                    {" "}
                    and <code>instagram_content_publish</code>
                  </>
                )}
                .
              </div>
              <div className="flex justify-between pt-1">
                <button onClick={() => setStep(1)} className="btn-ghost">
                  Back
                </button>
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? "Connecting…" : "Connect integration"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && method === "sandbox" && (
            <div className="space-y-3">
              <div>
                <label className="label">Account name</label>
                <input
                  className="input"
                  placeholder="My Brand"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Handle (optional)</label>
                <input
                  className="input"
                  placeholder={platform === "instagram" ? "@mybrand" : "My Brand Page"}
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500">
                This creates a simulated {platformLabel} account. Publishing is
                simulated so you can test the full flow safely.
              </p>
              <div className="flex justify-between pt-1">
                <button onClick={() => setStep(1)} className="btn-ghost">
                  Back
                </button>
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? "Creating…" : "Create sandbox account"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: done */}
          {step === 3 && created && (
            <div className="py-4 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20 text-2xl text-emerald-300">
                ✓
              </div>
              <h3 className="mt-4 text-lg font-semibold">Integration added</h3>
              <p className="mt-1 text-sm text-slate-400">
                <span className="text-white">{created.name}</span> is now
                connected
                {created.sandbox ? " in sandbox mode" : " and ready to publish"}.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  onClick={() => {
                    setCreated(null);
                    setStep(0);
                  }}
                  className="btn-ghost"
                >
                  Add another
                </button>
                <a href="/studio" className="btn-primary">
                  Create content
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
