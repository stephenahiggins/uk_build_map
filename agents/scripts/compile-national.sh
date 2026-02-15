#!/usr/bin/env bash
set -euo pipefail

# Continually gather UK-wide infrastructure data, stage it, commit to agents DB,
# then migrate into the backend MySQL database.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Tunables (override via env vars)
ITERATIONS="${ITERATIONS:-0}"           # 0 = infinite loop
SLEEP_SECONDS="${SLEEP_SECONDS:-3600}"  # wait between cycles
FETCH="${FETCH:-200}"
MAX_EVIDENCE="${MAX_EVIDENCE:-5}"
CONCURRENCY="${CONCURRENCY:-4}"
PROVIDER="${PROVIDER:-openai}"
MIGRATE_MODE="${MIGRATE_MODE:-append}"
SINCE_DAYS="${SINCE_DAYS:-30}"
EXTRA_ARGS="${EXTRA_ARGS:-}"

# Backend DB connection from agents/.env
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck source=../.env
  source "$ROOT_DIR/.env"
  set +a
fi
BACKEND_URL="${BACKEND_URL:-${MIGRATE_DATABASE_URL:-$DATABASE_URL}}"
export BACKEND_URL

SINCE_DATE="$(python3 - <<PY
from datetime import datetime, timedelta
print((datetime.utcnow() - timedelta(days=int(${SINCE_DAYS}))).date().isoformat())
PY
)"

echo "[compile-national] Building agents CLI..."
npm run build

run_cycle() {
  echo "[compile-national] Starting UK-wide staged scrape..."
  node dist/cli.js \
    --uk-wide \
    --stage \
    --since "$SINCE_DATE" \
    --fetch "$FETCH" \
    --max-evidence "$MAX_EVIDENCE" \
    --concurrency "$CONCURRENCY" \
    --provider "$PROVIDER" \
    $EXTRA_ARGS

  echo "[compile-national] Committing staged data into agents DB..."
  node dist/cli.js commit-staged --all

  echo "[compile-national] Migrating agents data into backend DB..."
  node dist/cli.js migrate-backend --mode "$MIGRATE_MODE" --backend-url "$BACKEND_URL"
}

if [[ "$ITERATIONS" -gt 0 ]]; then
  for i in $(seq 1 "$ITERATIONS"); do
    echo "[compile-national] Cycle $i/$ITERATIONS"
    run_cycle
    if [[ "$i" -lt "$ITERATIONS" ]]; then
      echo "[compile-national] Sleeping for ${SLEEP_SECONDS}s..."
      sleep "$SLEEP_SECONDS"
    fi
  done
else
  while true; do
    run_cycle
    echo "[compile-national] Sleeping for ${SLEEP_SECONDS}s..."
    sleep "$SLEEP_SECONDS"
  done
fi
