"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-400">
        {error.digest
          ? `Server error (digest ${error.digest}).`
          : "A server-side exception occurred."}{" "}
        If this is a fresh Vercel deploy, add a Postgres database and set{" "}
        <code className="text-slate-200">DATABASE_URL</code>, then redeploy.
      </p>
      <button className="btn-primary mt-6" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
