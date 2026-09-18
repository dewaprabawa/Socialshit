#!/usr/bin/env bash
set -euo pipefail

# Idempotent bootstrap for the Socialshit dev environment.
# Runs after the repository is checked out; safe to run repeatedly.

# Ensure a local env file exists so DATABASE_URL is always defined.
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    printf 'DATABASE_URL="postgresql://socialshit:socialshit@localhost:5432/socialshit?schema=public"\nAPP_BASE_URL="http://localhost:3000"\n' > .env
  fi
fi

# Install PostgreSQL if it is not already present.
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  echo "[install] installing PostgreSQL"
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
fi

# Start Postgres and ensure the role/database exist.
./.cursor/start.sh

# Install Node dependencies (also runs `prisma generate` via postinstall).
npm install

# Generate the Prisma client and apply migrations (idempotent).
npm run db:generate
npm run db:migrate

# Seed demo data only when the database is empty (seed script self-guards).
npm run db:seed || true
