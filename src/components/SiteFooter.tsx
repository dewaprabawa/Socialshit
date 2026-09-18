import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500">
        <span>© {new Date().getFullYear()} Socialshit</span>
        <nav className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-300">
            Privacy Policy
          </Link>
          <Link href="/privacy#data-deletion" className="hover:text-slate-300">
            Data deletion
          </Link>
        </nav>
      </div>
    </footer>
  );
}
