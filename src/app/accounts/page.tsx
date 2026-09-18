"use client";

import { useCallback, useEffect, useState } from "react";
import { PlatformBadge } from "@/components/StatusBadge";
import { ConnectWizard } from "@/components/ConnectWizard";
import { MetaSetupGuide } from "@/components/MetaSetupGuide";
import { parseJson } from "@/lib/parse-json";
import { friendlyMetaOAuthError } from "@/lib/meta-oauth-error";

interface Account {
  id: string;
  platform: string;
  name: string;
  handle: string | null;
  externalId: string;
  avatarUrl: string | null;
  sandbox: boolean;
  _count?: { posts: number };
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [canva, setCanva] = useState<{ configured: boolean; connected: boolean }>(
    { configured: false, connected: false }
  );
  const [metaReady, setMetaReady] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([
        fetch("/api/accounts").then((r) =>
          parseJson<{ accounts?: Account[] }>(r)
        ),
        fetch("/api/config").then((r) =>
          parseJson<{
            meta?: boolean;
            canva?: { configured: boolean; connected: boolean };
          }>(r)
        ),
      ]);
      setAccounts(a.accounts || []);
      setCanva(c.canva || { configured: false, connected: false });
      setMetaReady(Boolean(c.meta));
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to load accounts",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Surface OAuth callback results from the URL.
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      setMessage({
        type: "ok",
        text: `Connected ${params.get("connected")} account(s) from Meta.`,
      });
    } else if (params.get("error")) {
      const origin = window.location.origin.replace(/\/$/, "");
      setMessage({
        type: "err",
        text:
          friendlyMetaOAuthError(params.get("error"), origin) ||
          `Meta error: ${params.get("error")}`,
      });
    } else if (params.get("canva") === "connected") {
      setMessage({ type: "ok", text: "Canva connected." });
    } else if (params.get("canvaError")) {
      setMessage({
        type: "err",
        text: `Canva error: ${params.get("canvaError")}`,
      });
    }
    load();
  }, [load]);

  async function disconnectCanva() {
    setBusy("canva");
    await fetch("/api/canva/disconnect", { method: "POST" });
    setBusy(null);
    load();
  }

  async function remove(id: string) {
    setBusy(id);
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    setBusy(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="mt-1 text-sm text-slate-400">
            Connect your Instagram Business account and Facebook Page.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setWizardOpen(true)}
        >
          + Add integration
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <h2 className="mb-3 font-semibold">Connected accounts</h2>
        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : accounts.length === 0 ? (
          <div className="card text-center">
            <p className="text-slate-400">No integrations yet.</p>
            <button
              className="btn-primary mt-4"
              onClick={() => setWizardOpen(true)}
            >
              + Add your first integration
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {accounts.map((a) => (
              <div key={a.id} className="card flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    a.avatarUrl ||
                    `https://api.dicebear.com/9.x/shapes/svg?seed=${a.id}`
                  }
                  alt=""
                  className="h-12 w-12 rounded-full bg-white/10 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{a.name}</span>
                    <PlatformBadge platform={a.platform} />
                  </div>
                  <div className="text-xs text-slate-400">
                    {a.handle || a.externalId}
                    {" · "}
                    {a.sandbox ? "Sandbox" : "Live"}
                    {" · "}
                    {a._count?.posts ?? 0} posts
                  </div>
                </div>
                <button
                  className="btn-danger"
                  onClick={() => remove(a.id)}
                  disabled={busy === a.id}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Design tools</h2>
        <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 font-black text-white">
              C
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Canva</span>
                <span
                  className={`badge ${
                    canva.connected
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {canva.connected
                    ? "Connected"
                    : canva.configured
                    ? "Not connected"
                    : "Sandbox mode"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate and edit editable post designs in Canva.
              </p>
            </div>
          </div>
          <div>
            {canva.connected ? (
              <button
                className="btn-ghost"
                onClick={disconnectCanva}
                disabled={busy === "canva"}
              >
                {busy === "canva" ? "…" : "Disconnect"}
              </button>
            ) : canva.configured ? (
              <a href="/api/auth/canva" className="btn-primary">
                Connect Canva
              </a>
            ) : (
              <span className="text-xs text-amber-400/80">
                Set CANVA_CLIENT_ID &amp; CANVA_CLIENT_SECRET to connect. Sandbox
                designs work now.
              </span>
            )}
          </div>
        </div>
      </div>

      <MetaSetupGuide metaReady={metaReady} />

      <ConnectWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onConnected={load}
      />
    </div>
  );
}
