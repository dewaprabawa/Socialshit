import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { aiConfigured } from "@/lib/ai";
import { metaConfigured } from "@/lib/meta";
import { StatusBadge, PlatformBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [accounts, total, published, scheduled, drafts, recent] =
    await Promise.all([
      prisma.account.count(),
      prisma.post.count(),
      prisma.post.count({ where: { status: "published" } }),
      prisma.post.count({ where: { status: "scheduled" } }),
      prisma.post.count({ where: { status: "draft" } }),
      prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { account: true },
      }),
    ]);

  const ai = aiConfigured();
  const meta = metaConfigured();

  const stats = [
    { label: "Connected accounts", value: accounts, href: "/accounts" },
    { label: "Total posts", value: total, href: "/posts" },
    { label: "Published", value: published, href: "/posts" },
    { label: "Scheduled", value: scheduled, href: "/posts" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">
          Marketing on autopilot
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Generate content and captions with AI, connect your Instagram Business
          and Facebook Page, then publish now or schedule for later.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/studio" className="btn-primary">
            Create content
          </Link>
          <Link href="/accounts" className="btn-ghost">
            Connect an account
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card hover:border-brand-500/50">
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="mt-1 text-sm text-slate-400">{s.label}</div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Integrations</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>AI content &amp; captions (OpenAI)</span>
              <span
                className={`badge ${
                  ai
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {ai ? "Connected" : "Offline fallback"}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Meta Graph API (Instagram / Facebook)</span>
              <span
                className={`badge ${
                  meta
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {meta ? "Connected" : "Sandbox mode"}
              </span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            {ai
              ? "OpenAI is configured — real AI generations are enabled."
              : "No OPENAI_API_KEY set — content is generated with the built-in template engine."}{" "}
            {meta
              ? "Meta app configured — connect real accounts from the Accounts page."
              : "No Meta app configured — accounts and publishing run in sandbox (simulated) mode."}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent posts</h2>
            <Link href="/posts" className="text-sm text-brand-400 hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No posts yet.{" "}
              <Link href="/studio" className="text-brand-400 hover:underline">
                Create your first one.
              </Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recent.map((p) => (
                <li key={p.id} className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={p.platform} />
                      <StatusBadge status={p.status} />
                      {p.aiGenerated && (
                        <span className="badge bg-brand-500/20 text-brand-300">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-300">
                      {p.caption}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
