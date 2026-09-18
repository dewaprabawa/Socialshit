#!/usr/bin/env bash
set -euo pipefail

# Idempotent bootstrap for the Socialshit dev environment.
# Runs after the repository is checked out; safe to run repeatedly.

# Ensure a local env file exists so DATABASE_URL is always defined.
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    printf 'DATABASE_URL="file:./dev.db"\nAPP_BASE_URL="http://localhost:3000"\n' > .env
  fi
fi

# Install dependencies (also runs `prisma generate` via postinstall).
npm install

# Generate the Prisma client explicitly (idempotent).
npm run db:generate

# Create/sync the SQLite schema (idempotent).
npm run db:push

# Seed demo data only when the database is empty (seed script self-guards).
npm run db:seed || true
