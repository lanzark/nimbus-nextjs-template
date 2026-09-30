#!/usr/bin/env bash
set -euo pipefail

# Idempotent: Postgres 18 client/server (PGDG) + npm deps for Next.js template.
if ! dpkg -s postgresql-18 >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl ca-certificates gnupg
  if [ ! -f /usr/share/keyrings/postgresql-keyring.gpg ]; then
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg
  fi
  if [ ! -f /etc/apt/sources.list.d/pgdg.list ]; then
    echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt noble-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null
    sudo apt-get update -qq
  fi
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql-18 postgresql-client-18
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
    "/workspace/repos/nimbus-nextjs-template"
  do
    if [ -f "$d/package.json" ]; then
      echo "$d"
      return
    fi
  done
  # last resort
  find . -maxdepth 3 -type f -name package.json 2>/dev/null | while read -r f; do
    if grep -q '"next"' "$f" 2>/dev/null; then
      dirname "$f"
      break
    fi
  done
}

APP_DIR="$(find_nextjs)"
if [ -z "${APP_DIR:-}" ] || [ ! -d "$APP_DIR" ]; then
  echo "nimbus-nextjs-template not found; skipping npm ci"
  exit 0
fi

cd "$APP_DIR"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
echo "install ok in $APP_DIR"
