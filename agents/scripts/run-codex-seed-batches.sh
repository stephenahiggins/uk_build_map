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

normalize_json_output() {
  local input_file="$1"
  local output_file="$2"

  node - "$input_file" "$output_file" <<'EOF'
const fs = require('fs');

const [, , inputFile, outputFile] = process.argv;
const raw = fs.readFileSync(inputFile, 'utf8');

function tryParse(text) {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function stripCodeFence(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function findBalancedJson(text) {
  const openers = new Set(['[', '{']);

  for (let start = 0; start < text.length; start += 1) {
    const first = text[start];
    if (!openers.has(first)) continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let end = start; end < text.length; end += 1) {
      const ch = text[end];

      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === '\\') {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === '[' || ch === '{') {
        depth += 1;
        continue;
      }

      if (ch === ']' || ch === '}') {
        depth -= 1;
        if (depth !== 0) continue;

        const candidate = text.slice(start, end + 1).trim();
        const parsed = tryParse(candidate);
        if (parsed !== undefined) {
          return parsed;
        }
      }
    }
  }

  return undefined;
}

const candidates = [
  raw.replace(/^\uFEFF/, '').trim(),
  stripCodeFence(raw),
  raw,
];

let parsed;
for (const candidate of candidates) {
  parsed = tryParse(candidate);
  if (parsed !== undefined) break;
}

if (parsed === undefined) {
  for (const candidate of candidates) {
    parsed = findBalancedJson(candidate);
    if (parsed !== undefined) break;
  }
}

if (parsed === undefined) {
  process.exit(1);
}

fs.writeFileSync(outputFile, `${JSON.stringify(parsed)}\n`, 'utf8');
EOF
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

successful_batches=()
failed_batches=()
invalid_json_batches=()

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

  if [[ "$DRY_RUN" -ne 1 ]]; then
    tmp_file="$(mktemp "$OUT_DIR/batch-${batch_num}.tmp.XXXXXX")"
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

  vmsg "Running batch ${batch_num}"
  if ! cat "$prompt_file" | "${cmd[@]}"; then
    vmsg "Batch ${batch_num} failed; continuing to next batch"
    failed_batches+=("$batch_num")
    rm -f "$tmp_file"
    continue
  fi

  normalized_tmp="$(mktemp "$OUT_DIR/batch-${batch_num}.normalized.XXXXXX")"
  if ! normalize_json_output "$tmp_file" "$normalized_tmp"; then
    vmsg "Batch ${batch_num} did not produce valid JSON; continuing to next batch"
    invalid_json_batches+=("$batch_num")
    rm -f "$normalized_tmp"
    rm -f "$tmp_file"
    continue
  fi

  mv "$normalized_tmp" "$out_file"
  rm -f "$tmp_file"
  successful_batches+=("$batch_num")
  vmsg "Saved batch ${batch_num} to $out_file"
done

vmsg "Completed Codex batch run. Successful: ${#successful_batches[@]}, command failures: ${#failed_batches[@]}, invalid JSON: ${#invalid_json_batches[@]}"
if [[ ${#failed_batches[@]} -gt 0 ]]; then
  vmsg "Batches with command failures: ${failed_batches[*]}"
fi
if [[ ${#invalid_json_batches[@]} -gt 0 ]]; then
  vmsg "Batches with invalid JSON: ${invalid_json_batches[*]}"
fi
