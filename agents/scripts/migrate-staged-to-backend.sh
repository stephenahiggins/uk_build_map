#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   BACKEND_URL=... ./scripts/migrate-staged-to-backend.sh [--all] [--file path] [--mode append|override] [--backend-env path]

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Defaults
MODE="append"
BACKEND_ENV=""
STAGE_FILE=""
COMMIT_ALL="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --backend-env)
      BACKEND_ENV="$2"
      shift 2
      ;;
    --file)
      STAGE_FILE="$2"
      shift 2
      ;;
    --all)
      COMMIT_ALL="1"
      shift
      ;;
    -h|--help)
      echo "Usage: BACKEND_URL=... $0 [--all] [--file path] [--mode append|override] [--backend-env path]"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
 esac
done

cd "$ROOT_DIR"

if [[ -n "${BACKEND_DATABASE_URL:-}" && -z "${BACKEND_URL:-}" ]]; then
  export BACKEND_URL="$BACKEND_DATABASE_URL"
elif [[ -n "${MIGRATE_DATABASE_URL:-}" && -z "${BACKEND_URL:-}" ]]; then
  export BACKEND_URL="$MIGRATE_DATABASE_URL"
fi

# Build first
npm run build

# Commit staged JSONs into agents DB
if [[ -n "$STAGE_FILE" ]]; then
  node dist/cli.js commit-staged --file "$STAGE_FILE"
else
  if [[ "$COMMIT_ALL" == "1" ]]; then
    node dist/cli.js commit-staged --all
  else
    # default: all staged files
    node dist/cli.js commit-staged --all
  fi
fi

# Migrate agents DB into backend DB
if [[ -n "$BACKEND_ENV" ]]; then
  node dist/cli.js migrate-backend --mode "$MODE" --backend-env "$BACKEND_ENV"
else
  node dist/cli.js migrate-backend --mode "$MODE"
fi
