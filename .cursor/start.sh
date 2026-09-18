#!/usr/bin/env bash
set -euo pipefail

# Starts the local PostgreSQL used for development and ensures the app role and
# database exist. Idempotent: safe to run on every boot.

PGVER="$(ls /etc/postgresql 2>/dev/null | sort -V | tail -1 || true)"
if [ -z "${PGVER:-}" ]; then
  echo "[start] PostgreSQL not installed; skipping (run install first)."
  exit 0
fi

if ! pg_isready -h localhost -q 2>/dev/null; then
  echo "[start] starting PostgreSQL cluster ${PGVER}/main"
  sudo pg_ctlcluster "${PGVER}" main start || true
fi

# Wait for readiness.
for _ in $(seq 1 30); do
  pg_isready -h localhost -q 2>/dev/null && break
  sleep 1
done

# Ensure role + database exist.
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='socialshit'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE ROLE socialshit LOGIN PASSWORD 'socialshit' CREATEDB;"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='socialshit'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE socialshit OWNER socialshit;"

echo "[start] PostgreSQL ready."
