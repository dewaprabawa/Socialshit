"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/studio", label: "Content Studio" },
  { href: "/posts", label: "Posts" },
  { href: "/accounts", label: "Accounts" },
];

interface Me {
  id: string;
  name: string;
  avatarUrl: string | null;
  provider: string;
  sandbox: boolean;
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.text())
      .then((text) => {
        if (!text) {
          setMe(null);
          return;
        }
        const data = JSON.parse(text) as { user?: Me | null };
        setMe(data.user || null);
      })
      .catch(() => setMe(null));
  }, [pathname]);

  if (pathname === "/login" || pathname === "/privacy") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 font-black text-white">
            S
          </span>
          <span className="text-lg font-bold tracking-tight">Socialshit</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {me ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  me.avatarUrl ||
                  `https://api.dicebear.com/9.x/identicon/svg?seed=${me.id}`
                }
                alt=""
                className="h-8 w-8 rounded-full bg-white/10 object-cover"
              />
              <div className="hidden sm:block">
                <div className="text-sm font-medium leading-tight">{me.name}</div>
                <div className="text-[11px] capitalize text-slate-400">
                  {me.provider}
                  {me.sandbox ? " · sandbox" : ""}
                </div>
              </div>
              <button onClick={logout} className="btn-ghost px-3 py-1.5 text-xs">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary px-3 py-1.5 text-xs">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
