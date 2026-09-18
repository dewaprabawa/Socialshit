"use client";

import { useCallback, useEffect, useState } from "react";
import { PlatformBadge } from "@/components/StatusBadge";

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
  const [meta, setMeta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Add-sandbox form.
  const [platform, setPlatform] = useState("instagram");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

  const load = useCallback(async () => {
    const [a, c] = await Promise.all([
      fetch("/api/accounts").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
    ]);
    setAccounts(a.accounts || []);
    setMeta(Boolean(c.meta));
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

  async function addSandbox(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: "err", text: "Enter an account name." });
      return;
    }
    setBusy("add");
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, name, handle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add account");
      setName("");
      setHandle("");
      setMessage({ type: "ok", text: "Sandbox account added." });
      load();
    } catch (err) {
      setMessage({ type: "err", text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    setBusy(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Accounts</h1>
        <p className="mt-1 text-sm text-slate-400">
          Connect your Instagram Business account and Facebook Page.
        </p>
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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Connect with Meta</h2>
          <p className="mt-1 text-sm text-slate-400">
            Authorize Socialshit to manage your Facebook Pages and linked
            Instagram Business accounts.
          </p>
          {meta ? (
            <a href="/api/auth/meta" className="btn-primary mt-4">
              Connect Facebook &amp; Instagram
            </a>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              Meta app credentials are not configured. Set{" "}
              <code className="text-amber-100">META_APP_ID</code> and{" "}
              <code className="text-amber-100">META_APP_SECRET</code> to enable
              real connections. Meanwhile, add a sandbox account to try the full
              flow.
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold">Add a sandbox account</h2>
          <p className="mt-1 text-sm text-slate-400">
            Simulated account for testing generation, scheduling, and publishing.
          </p>
          <form onSubmit={addSandbox} className="mt-4 space-y-3">
            <div>
              <label className="label">Platform</label>
              <select
                className="input"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>
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
                placeholder="@mybrand"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>
            <button className="btn-primary" disabled={busy === "add"}>
              {busy === "add" ? "Adding…" : "Add sandbox account"}
            </button>
          </form>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Connected accounts</h2>
        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : accounts.length === 0 ? (
          <div className="card text-center text-slate-400">
            No accounts yet. Connect with Meta or add a sandbox account above.
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
    </div>
  );
}
