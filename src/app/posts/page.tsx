"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge, PlatformBadge } from "@/components/StatusBadge";

interface Post {
  id: string;
  platform: string;
  caption: string;
  hashtags: string;
  mediaUrl: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  externalUrl: string | null;
  error: string | null;
  aiGenerated: boolean;
  account: { name: string; sandbox: boolean };
}

function fmt(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleString();
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.posts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function publishNow(id: string) {
    setBusy(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      setMessage(
        data.sandbox ? "Published (sandbox / simulated)." : "Published live!"
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(null);
      load();
    }
  }

  async function remove(id: string) {
    setBusy(id);
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setBusy(null);
    load();
  }

  async function runScheduler() {
    setBusy("scheduler");
    setMessage(null);
    try {
      const res = await fetch("/api/scheduler/tick", { method: "POST" });
      const data = await res.json();
      setMessage(
        `Scheduler ran: processed ${data.processed}, published ${data.published.length}, failed ${data.failed.length}.`
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(null);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="mt-1 text-sm text-slate-400">
            Drafts, scheduled, and published content across your accounts.
          </p>
        </div>
        <button
          className="btn-ghost"
          onClick={runScheduler}
          disabled={busy === "scheduler"}
        >
          {busy === "scheduler" ? "Running…" : "Run scheduler now"}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-brand-500/40 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="card text-center text-slate-400">
          No posts yet. Head to the Content Studio to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="card">
              <div className="flex gap-4">
                {p.mediaUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.mediaUrl}
                    alt=""
                    className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PlatformBadge platform={p.platform} />
                    <StatusBadge status={p.status} />
                    {p.aiGenerated && (
                      <span className="badge bg-brand-500/20 text-brand-300">
                        AI
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      {p.account.name}
                      {p.account.sandbox ? " · sandbox" : ""}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
                    {p.caption}
                  </p>
                  {p.hashtags && (
                    <p className="mt-1 text-sm text-brand-300">{p.hashtags}</p>
                  )}
                  <div className="mt-2 text-xs text-slate-500">
                    {p.status === "scheduled" && p.scheduledAt && (
                      <span>Scheduled for {fmt(p.scheduledAt)}</span>
                    )}
                    {p.status === "published" && p.publishedAt && (
                      <span>
                        Published {fmt(p.publishedAt)}
                        {p.externalUrl && (
                          <>
                            {" · "}
                            <a
                              href={p.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-400 hover:underline"
                            >
                              View post
                            </a>
                          </>
                        )}
                      </span>
                    )}
                    {p.status === "failed" && p.error && (
                      <span className="text-red-400">Error: {p.error}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col gap-2">
                  {p.status !== "published" && (
                    <button
                      className="btn-primary"
                      onClick={() => publishNow(p.id)}
                      disabled={busy === p.id}
                    >
                      {busy === p.id ? "…" : "Publish"}
                    </button>
                  )}
                  <button
                    className="btn-danger"
                    onClick={() => remove(p.id)}
                    disabled={busy === p.id}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
