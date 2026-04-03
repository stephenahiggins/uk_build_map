#!/usr/bin/env bash
set -euo pipefail

ts() {
  date '+%Y-%m-%d %H:%M:%S'
}

vmsg() {
  printf '[run-codex-seed] [%s] %s\n' "$(ts)" "$*" >&2
}

AGENTS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_ROOT="$(cd "$AGENTS_ROOT/../backend" && pwd)"
BATCH_DIR="$BACKEND_ROOT/seeds/codex-batches"
OUT_DIR="$BATCH_DIR/out"

YES=0
DRY_RUN=0
FORCE=0
SINGLE_BATCH_RAW=""
MODEL="${CODEX_MODEL:-gpt-5.2}"
PROFILE="${CODEX_PROFILE:-}"
USE_SEARCH="${CODEX_BATCH_SEARCH:-1}"
PASS_THROUGH=()

usage() {
  cat <<'USAGE'
Usage: ./scripts/run-codex-seed-batches.sh [options] [-- extra codex exec args]

Options:
  -y, --yes       Skip confirmation
  --dry-run       Print planned commands only
  --force         Re-run batches even if output already exists
  --batch N       Run only batch NNN
  --model MODEL   Override Codex model (default from CODEX_MODEL or gpt-5.2)
  --no-search     Disable Codex web search for the batch runs
  -h, --help      Show help

Env:
  CODEX_MODEL            Codex model override
  CODEX_PROFILE          Optional codex profile
  CODEX_BATCH_SEARCH     1 (default) enables --search, 0 disables it
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -y|--yes)
      YES=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    --batch)
      SINGLE_BATCH_RAW="${2:-}"
      if [[ -z "$SINGLE_BATCH_RAW" ]]; then
        echo "error: --batch requires a number" >&2
        exit 1
      fi
      shift 2
      ;;
    --model)
      MODEL="${2:-}"
      if [[ -z "$MODEL" ]]; then
        echo "error: --model requires a value" >&2
        exit 1
      fi
      shift 2
      ;;
    --no-search)
      USE_SEARCH=0
      shift
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

if [[ "$DRY_RUN" -ne 1 ]] && ! command -v codex >/dev/null 2>&1; then
  vmsg "ERROR: 'codex' not found on PATH."
  exit 1
fi

shopt -s nullglob
prompt_files=("$BATCH_DIR"/batch-*-PROMPT.md)
shopt -u nullglob

if [[ ${#prompt_files[@]} -eq 0 ]]; then
  vmsg "ERROR: no batch-*-PROMPT.md under $BATCH_DIR"
  exit 1
fi

sorted_files=()
while IFS= read -r line; do
  [[ -n "$line" ]] && sorted_files+=("$line")
done < <(
  for f in "${prompt_files[@]}"; do
    base=$(basename "$f")
    num=${base#batch-}
    num=${num%%-PROMPT.md}
    printf '%s\t%s\n' "$num" "$f"
  done | sort -n -k1,1 | cut -f2-
)

run_list=()
if [[ -n "$SINGLE_BATCH_RAW" ]]; then
  pad=$(printf '%03d' "$((10#$SINGLE_BATCH_RAW))")
  target="$BATCH_DIR/batch-${pad}-PROMPT.md"
  if [[ ! -f "$target" ]]; then
    echo "error: missing $target" >&2
    exit 1
  fi
  run_list=("$target")
else
  run_list=("${sorted_files[@]}")
fi

confirm() {
  local msg="$1"
  if [[ "$YES" -eq 1 ]]; then
    return 0
  fi
  read -r -p "$msg [y/N] " ans || true
  ans=$(printf '%s' "$ans" | tr '[:upper:]' '[:lower:]')
  [[ "$ans" == "y" || "$ans" == "yes" ]]
}

if [[ "$DRY_RUN" -ne 1 ]]; then
  vmsg "Codex CLI: $(codex --version 2>/dev/null || echo 'unknown')"
  vmsg "Model: $MODEL"
  vmsg "Search: $USE_SEARCH"
  vmsg "Batches: ${#run_list[@]}"
  if [[ ! -d "$OUT_DIR" ]]; then
    mkdir -p "$OUT_DIR"
  fi
  if ! confirm "Start Codex batch research run?"; then
    vmsg "Aborted."
    exit 0
  fi
fi

mkdir -p "$OUT_DIR"

for prompt_file in "${run_list[@]}"; do
  base=$(basename "$prompt_file")
  batch_num=${base#batch-}
  batch_num=${batch_num%%-PROMPT.md}
  out_file="$OUT_DIR/batch-${batch_num}.json"
  tmp_file="$OUT_DIR/batch-${batch_num}.tmp.DRYRUN"

  if [[ "$FORCE" -ne 1 && -s "$out_file" ]]; then
    vmsg "Skipping batch ${batch_num}: output already exists at $out_file"
    continue
  fi

  global_args=()
  if [[ "$USE_SEARCH" == "1" ]]; then
    global_args+=(--search)
  fi
  global_args+=(--ask-for-approval never)
  profile_args=()
  if [[ -n "$PROFILE" ]]; then
    profile_args+=(--profile "$PROFILE")
  fi

  cmd=(
    codex
    "${global_args[@]}"
    exec
    --cd "$BACKEND_ROOT"
    --sandbox workspace-write
    --skip-git-repo-check
    --model "$MODEL"
  )
  if [[ ${#profile_args[@]} -gt 0 ]]; then
    cmd+=("${profile_args[@]}")
  fi
  if [[ ${#PASS_THROUGH[@]} -gt 0 ]]; then
    cmd+=("${PASS_THROUGH[@]}")
  fi
  cmd+=(
    --output-last-message "$tmp_file"
    -
  )

  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf 'cat %q |' "$prompt_file"
    printf ' %q' "${cmd[@]}"
    printf '\n'
    continue
  fi

  tmp_file="$(mktemp "$OUT_DIR/batch-${batch_num}.tmp.XXXXXX")"
  vmsg "Running batch ${batch_num}"
  if ! cat "$prompt_file" | "${cmd[@]}"; then
    vmsg "Batch ${batch_num} failed"
    rm -f "$tmp_file"
    exit 1
  fi

  if ! node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));' "$tmp_file" >/dev/null 2>&1; then
    vmsg "Batch ${batch_num} did not produce valid JSON"
    rm -f "$tmp_file"
    exit 1
  fi

  mv "$tmp_file" "$out_file"
  vmsg "Saved batch ${batch_num} to $out_file"
done

vmsg "Completed Codex batch run."
