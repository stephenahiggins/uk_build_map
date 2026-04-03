#!/usr/bin/env bash
set -euo pipefail

ts() {
  date '+%Y-%m-%d %H:%M:%S'
}

vmsg() {
  printf '[overnight-growth-map] [%s] %s\n' "$(ts)" "$*" >&2
}

AGENTS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_ROOT="$(cd "$AGENTS_ROOT/../backend" && pwd)"

IMPORT=0
YES=0
MODEL="${CODEX_MODEL:-gpt-5.2}"
PASS_THROUGH=()

usage() {
  cat <<'USAGE'
Usage: ./scripts/overnight-growth-map.sh [options] [-- extra codex batch args]

Options:
  -y, --yes         Skip confirmations
  --import          After merge, seed into backend and run geo/evaluation refresh
  --model MODEL     Codex model to use for overnight batch research
  -h, --help        Show help

This script runs:
  1. authority coverage snapshot
  2. local authority export
  3. Codex batch generation
  4. Codex batch execution
  5. merge outputs
  6. optional seed/import + geo sync + evaluation + fresh coverage snapshot
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -y|--yes)
      YES=1
      shift
      ;;
    --import)
      IMPORT=1
      shift
      ;;
    --model)
      MODEL="${2:-}"
      if [[ -z "$MODEL" ]]; then
        echo "error: --model requires a value" >&2
        exit 1
      fi
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      PASS_THROUGH+=("$@")
      break
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

confirm() {
  local msg="$1"
  if [[ "$YES" -eq 1 ]]; then
    return 0
  fi
  read -r -p "$msg [y/N] " ans || true
  ans=$(printf '%s' "$ans" | tr '[:upper:]' '[:lower:]')
  [[ "$ans" == "y" || "$ans" == "yes" ]]
}

if ! confirm "Start overnight Growth Map pipeline?"; then
  vmsg "Aborted."
  exit 0
fi

vmsg "Step 1/6: computing authority coverage"
( cd "$BACKEND_ROOT" && npm run coverage:authorities )

vmsg "Step 2/6: exporting local authorities"
( cd "$BACKEND_ROOT" && npm run seed:export-local-authorities )

vmsg "Step 3/6: generating Codex batches"
(
  cd "$BACKEND_ROOT" && \
  npm run seed:generate-codex-batches -- --authorities-json seeds/local-authorities.json
)

vmsg "Step 4/6: running Codex overnight batches"
codex_args=()
if [[ "$YES" -eq 1 ]]; then
  codex_args+=(--yes)
fi
codex_args+=(--model "$MODEL")
if [[ ${#PASS_THROUGH[@]} -gt 0 ]]; then
  codex_args+=(-- "${PASS_THROUGH[@]}")
fi
(
  cd "$AGENTS_ROOT" && \
  ./scripts/run-codex-seed-batches.sh "${codex_args[@]}"
)

vmsg "Step 5/6: merging Codex outputs"
( cd "$BACKEND_ROOT" && npm run seed:merge-codex-outputs )

if [[ "$IMPORT" -eq 1 ]]; then
  vmsg "Step 6/6: importing merged data, syncing geo, recomputing evaluations, refreshing coverage"
  (
    cd "$BACKEND_ROOT" && \
    npx ts-node scripts/seedProjectsFromFile.ts seeds/merged-from-codex.json && \
    npm run sync:geo && \
    npm run recompute:evaluations:all && \
    npm run coverage:authorities
  )
else
  vmsg "Step 6/6 skipped: import disabled. Re-run with --import to seed and refresh backend state."
fi

vmsg "Overnight Growth Map pipeline completed."
