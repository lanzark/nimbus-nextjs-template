#!/usr/bin/env bash
set -euo pipefail

# Per-boot: Postgres 18 + .env.local + Next.js dev server (stays attached).
if command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo pg_ctlcluster 18 main start || true
  # Wait briefly for readiness
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if sudo -u postgres psql -c 'SELECT 1' >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='el_dev'" | grep -q 1 \
    || sudo -u postgres psql -c "CREATE USER el_dev WITH PASSWORD 'dev' SUPERUSER;"
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='entendimiento-luchante'" | grep -q 1 \
    || sudo -u postgres psql -c 'CREATE DATABASE "entendimiento-luchante" OWNER el_dev;'
fi

find_nextjs() {
  if [ -f "./package.json" ] && grep -q '"next"' ./package.json 2>/dev/null; then
    pwd
    return
  fi
  for d in \
    "./nimbus-nextjs-template" \
    "./repos/nimbus-nextjs-template" \
    "/agent/repos/nimbus-nextjs-template" \
    "/workspace/nimbus-nextjs-template" \
    "/workspace/repos/nimbus-nextjs-template" \
    "/home/ubuntu/entendimiento-luchante"
  do
    if [ -f "$d/package.json" ]; then
      echo "$d"
      return
    fi
  done
}

APP_DIR="$(find_nextjs)"
if [ -z "${APP_DIR:-}" ] || [ ! -d "$APP_DIR" ]; then
  echo "No Next.js app found to start"
  exit 1
fi

cd "$APP_DIR"
if [ ! -f .env.local ]; then
  cat > .env.local <<'ENV'
DATABASE_URL=postgresql://el_dev:dev@127.0.0.1:5432/entendimiento-luchante
ENV
fi

exec npm run dev -- --hostname 0.0.0.0 --port 3000
