import { spawnSync } from "node:child_process";

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.PRISMA_DATABASE_URL;

if (!url || url.startsWith("file:")) {
  console.warn(
    "[socialshit] No PostgreSQL DATABASE_URL — skipping migrations. Add a Vercel Postgres / Neon database, then redeploy."
  );
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});
process.exit(result.status ?? 1);
