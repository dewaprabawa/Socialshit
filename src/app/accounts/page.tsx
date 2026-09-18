"use client";

import { useCallback, useEffect, useState } from "react";
import { PlatformBadge } from "@/components/StatusBadge";
import { ConnectWizard } from "@/components/ConnectWizard";

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
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    const a = await fetch("/api/accounts").then((r) => r.json());
    setAccounts(a.accounts || []);
    setLoading(false);
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
      setMessage({ type: "err", text: `Meta error: ${params.get("error")}` });
    }
    load();
  }, [load]);

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

      <ConnectWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onConnected={load}
      />
    </div>
  );
}
