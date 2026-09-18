const STYLES: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300",
  scheduled: "bg-amber-500/20 text-amber-300",
  publishing: "bg-blue-500/20 text-blue-300",
  published: "bg-emerald-500/20 text-emerald-300",
  failed: "bg-red-500/20 text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STYLES[status] ?? STYLES.draft}`}>
      {status}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: string }) {
  const ig = platform === "instagram";
  return (
    <span
      className={`badge ${
        ig
          ? "bg-pink-500/20 text-pink-300"
          : "bg-blue-600/20 text-blue-300"
      }`}
    >
      {ig ? "Instagram" : "Facebook"}
    </span>
  );
}
