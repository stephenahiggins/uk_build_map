#!/usr/bin/env bash
# Run Claude Code CLI (-p) against each batch-*-PROMPT.md from `make go`.
# Requires: `claude` on PATH, auth via subscription or ANTHROPIC_API_KEY (see Claude Code docs).
#
# Usage (from agents/):
#   ./scripts/run-claude-seed-batches.sh              # confirm once, then run all batches
#   ./scripts/run-claude-seed-batches.sh --yes        # skip confirmation; run all
#   ./scripts/run-claude-seed-batches.sh --batch 7    # single batch (accepts 7 or 007)
#   ./scripts/run-claude-seed-batches.sh --dry-run    # print planned commands only
#   ./scripts/run-claude-seed-batches.sh --yes --chrome
#   ./scripts/run-claude-seed-batches.sh -- --max-budget-usd 2.00
#   ./scripts/run-claude-seed-batches.sh --force    Re-run even if out/batch-NNN.json already exists
#
# By default, skips a batch when seeds/claude-batches/out/batch-NNN.json exists and is non-empty (resume after failures).
#
# When Claude hits a usage / rate limit, the script pauses and retries the same batch:
#   If output looks like "resets 6pm (Europe/London)", python3 parses that wall time in that
#   IANA zone and sleeps until then (+ CLAUDE_LIMIT_RESET_BUFFER_SEC, default 60s).
#   Set CLAUDE_LIMIT_USE_MESSAGE_TIME=0 to skip parsing and use prompt/sleep only.
#   CLAUDE_LIMIT_MAX_LIMIT_LOOPS=N   stop after N limit pause/retry cycles per batch (default 40; avoids false-positive loops)
#   CLAUDE_LIMIT_WAIT_MODE=prompt   wait for Enter (default if stdin is a TTY)
#   CLAUDE_LIMIT_WAIT_MODE=sleep    sleep CLAUDE_LIMIT_SLEEP_SEC (default 3600) then retry
# Non-TTY stdin defaults to sleep mode so the script does not hang.
#   CLAUDE_LIMIT_SLEEP_SEC=1800     seconds between auto-retries (sleep mode / non-TTY)
#   CLAUDE_LIMIT_OVERRIDE_SLEEP_SEC force a specific sleep (seconds) for limit waits; skips parsed reset time
#
# Transient API / transport failures (5xx, "Internal server error", etc.): sleep and retry same batch.
#   CLAUDE_TRANSIENT_MAX_RETRIES   max retries per batch after transient match (default 10)
#   CLAUDE_TRANSIENT_SLEEP_SEC     seconds to sleep before each retry (default 90)
#
set -euo pipefail

ts() {
  date '+%Y-%m-%d %H:%M:%S'
}

# Status lines on stderr so Claude's stdout stays primary on the terminal.
vmsg() {
  printf '[run-claude-seed] [%s] %s\n' "$(ts)" "$*" >&2
}

AGENTS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARSE_RESET_PY="$SCRIPTS_DIR/parse_claude_limit_reset.py"
BACKEND_ROOT="$(cd "$AGENTS_ROOT/../backend" && pwd)"
BATCH_DIR="$BACKEND_ROOT/seeds/claude-batches"
OUT_DIR="$BATCH_DIR/out"

YES=0
DRY_RUN=0
SINGLE_BATCH_RAW=""
CHROME=0
BARE=0
FORCE=0
PASS_THROUGH=()

usage() {
  cat <<'USAGE'
Usage: ./scripts/run-claude-seed-batches.sh [options] [-- extra claude args]

Options:
  -y, --yes       Skip confirmation before running
  --dry-run       Print planned cd/claude commands only
  --batch N       Run only batch NNN (e.g. 7 or 007)
  --chrome        Pass --chrome to claude (browser tools)
  --bare          Pass --bare to claude (minimal startup)
  --force         Re-run batches even when out/batch-NNN.json already exists (default: skip non-empty outputs)
  -h, --help      Show this help

Env (limit / quota handling):
  CLAUDE_LIMIT_USE_MESSAGE_TIME   1 (default): sleep until "resets Hpm (TZ)" from Claude output
  CLAUDE_LIMIT_RESET_BUFFER_SEC   extra seconds after that wall time (default 60)
  CLAUDE_LIMIT_MAX_SLEEP_SEC      cap parsed wait (default 172800); over cap falls back to prompt/sleep
  CLAUDE_LIMIT_MAX_LIMIT_LOOPS    max limit retries per batch (default 40); hit → exit 1 with hint
  CLAUDE_LIMIT_WAIT_MODE          prompt | sleep (see header comments)
  CLAUDE_LIMIT_SLEEP_SEC          seconds between retries when using sleep mode (default 3600)
  CLAUDE_LIMIT_OVERRIDE_SLEEP_SEC force limit-wait sleep seconds (takes precedence over parsed reset time)

Env (transient API 5xx / server errors — auto-retry with sleep):
  CLAUDE_TRANSIENT_MAX_RETRIES    cap per batch (default 10)
  CLAUDE_TRANSIENT_SLEEP_SEC      pause before retry in seconds (default 90)

Run from the agents/ directory after: make go
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes | -y)
      YES=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
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
    --chrome)
      CHROME=1
      shift
      ;;
    --bare)
      BARE=1
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    --)
      shift
      PASS_THROUGH+=("$@")
      break
      ;;
    *)
      echo "Unknown option: $1 (try --help)" >&2
      exit 1
      ;;
  esac
done

if [[ "$DRY_RUN" -ne 1 ]] && ! command -v claude >/dev/null 2>&1; then
  vmsg "ERROR: 'claude' not found on PATH. Install Claude Code and ensure the CLI is available."
  exit 1
fi

shopt -s nullglob
prompt_files=("$BATCH_DIR"/batch-*-PROMPT.md)
shopt -u nullglob

if [[ ${#prompt_files[@]} -eq 0 ]]; then
  vmsg "ERROR: no batch-*-PROMPT.md under $BATCH_DIR"
  vmsg "Hint: run make go (from agents/) or ./agents/make go first."
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

count=${#run_list[@]}
vmsg "Starting (verbose): ${count} batch(es) to run"
vmsg "Backend root: $BACKEND_ROOT"
vmsg "Prompt dir:   $BATCH_DIR"
vmsg "Output dir:   $OUT_DIR"
if [[ -n "$SINGLE_BATCH_RAW" ]]; then
  vmsg "Filter:       --batch only (single batch)"
fi
vmsg "Flags:        dry-run=$DRY_RUN yes=$YES chrome=$CHROME bare=$BARE force=$FORCE"
if [[ ${#PASS_THROUGH[@]} -gt 0 ]]; then
  vmsg "Extra claude args (${#PASS_THROUGH[@]}): ${PASS_THROUGH[*]}"
fi
if [[ "$DRY_RUN" -ne 1 ]]; then
  if command -v claude >/dev/null 2>&1; then
    _claude_ver=$(claude --version 2>/dev/null || true)
    [[ -n "$_claude_ver" ]] && vmsg "Claude CLI:   $_claude_ver"
    unset _claude_ver
  fi
  _lwm_show=${CLAUDE_LIMIT_WAIT_MODE:-'(auto: TTY=prompt, no TTY=sleep)'}
  vmsg "Limit pause:  CLAUDE_LIMIT_WAIT_MODE=${_lwm_show} CLAUDE_LIMIT_SLEEP_SEC=${CLAUDE_LIMIT_SLEEP_SEC:-3600}"
  vmsg "Limit override: CLAUDE_LIMIT_OVERRIDE_SLEEP_SEC=${CLAUDE_LIMIT_OVERRIDE_SLEEP_SEC:-'(none)'}"
  vmsg "Transient 5xx: CLAUDE_TRANSIENT_MAX_RETRIES=${CLAUDE_TRANSIENT_MAX_RETRIES:-10} CLAUDE_TRANSIENT_SLEEP_SEC=${CLAUDE_TRANSIENT_SLEEP_SEC:-90}"
  vmsg "Parsed reset: CLAUDE_LIMIT_USE_MESSAGE_TIME=${CLAUDE_LIMIT_USE_MESSAGE_TIME:-1} buffer=${CLAUDE_LIMIT_RESET_BUFFER_SEC:-60}s max_wait=${CLAUDE_LIMIT_MAX_SLEEP_SEC:-172800}s max_limit_loops=${CLAUDE_LIMIT_MAX_LIMIT_LOOPS:-40} python3=$(command -v python3 2>/dev/null || echo none)"
  unset _lwm_show
fi
vmsg "---"
echo ""

if [[ "$DRY_RUN" -eq 1 ]]; then
  YES=1
fi

confirm() {
  local msg="$1"
  if [[ "$YES" -eq 1 ]]; then
    return 0
  fi
  read -r -p "$msg [y/N] " ans || true
  ans_lc=$(printf '%s' "$ans" | tr '[:upper:]' '[:lower:]')
  case "$ans_lc" in
    y | yes) return 0 ;;
    *) return 1 ;;
  esac
}

if [[ "$DRY_RUN" -ne 1 ]]; then
  if ! confirm "Start Claude Code (${count} run(s))?"; then
    vmsg "Aborted by user (no)."
    exit 0
  fi
  vmsg "Confirmed: proceeding with ${count} claude run(s)."
fi

mkdir -p "$OUT_DIR"
vmsg "Ensured output directory exists: $OUT_DIR"

is_likely_claude_limit() {
  # Strict: avoid words common in seed JSON / council prose ("credit", "capacity", "quota", "billing").
  # Only scan start + end of log — tool errors are usually there; 50k lines of projects won't false-match.
  local raw=$1
  local probe
  probe=$(printf '%s\n' "$raw" | head -n 150
    printf '%s\n--- tail ---\n' ''
    printf '%s\n' "$raw" | tail -n 150)
  printf '%s' "$probe" | grep -qiE \
    'rate[[:space:]]*limit|ratelimit|(^|[^0-9])429([^0-9]|$)|too many requests|hit your limit|you.ve hit|billing_error|rate_limit|overloaded|try again later|throttl|context length exceeded|maximum context|resets[[:space:]]+[0-9]{1,2}(:[0-9]{2})?[[:space:]]*(am|pm)[[:space:]]*\([^)]+\)|usage limit exceeded|quota exceeded|token.?limit exceeded|max.?tokens exceeded'
}

# Server-side or network blips — retry with backoff sleep (checked after limit heuristics).
is_transient_api_failure() {
  local raw=$1
  local probe
  probe=$(printf '%s\n' "$raw" | head -n 120
    printf '%s\n--- tail ---\n' ''
    printf '%s\n' "$raw" | tail -n 120)
  printf '%s' "$probe" | grep -qiE \
    'API Error:[[:space:]]*5[0-9]{2}|"type"[[:space:]]*:[[:space:]]*"api_error"|Internal server error|Bad Gateway|Gateway Timeout|Service Unavailable|temporarily unavailable|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|fetch failed'
}

sleep_with_countdown() {
  local total="${1:-0}"
  local reason="${2:-sleep}"
  if ! [[ "$total" =~ ^[0-9]+$ ]] || [[ "$total" -le 0 ]]; then
    return
  fi
  local end now remain chunk
  end=$(( $(date +%s) + total ))
  vmsg "${reason}: countdown started (${total}s)."
  while true; do
    now=$(date +%s)
    remain=$((end - now))
    if [[ "$remain" -le 0 ]]; then
      break
    fi
    # Print every minute when long; switch to every 10s near completion.
    if [[ "$remain" -gt 120 ]]; then
      chunk=60
    elif [[ "$remain" -gt 30 ]]; then
      chunk=10
    else
      chunk=1
    fi
    if [[ "$chunk" -gt "$remain" ]]; then
      chunk="$remain"
    fi
    vmsg "${reason}: ${remain}s remaining"
    sleep "$chunk"
  done
}

wait_for_limit_reset() {
  local limit_text=${1:-}
  local mode=${CLAUDE_LIMIT_WAIT_MODE:-}
  local sec=${CLAUDE_LIMIT_SLEEP_SEC:-3600}
  local use_parse=${CLAUDE_LIMIT_USE_MESSAGE_TIME:-1}
  local override_sec=${CLAUDE_LIMIT_OVERRIDE_SLEEP_SEC:-}

  if [[ -n "$override_sec" ]]; then
    if [[ "$override_sec" =~ ^[0-9]+$ ]] && [[ "$override_sec" -gt 0 ]]; then
      echo "" >&2
      vmsg "CLAUDE_LIMIT_OVERRIDE_SLEEP_SEC is set → forcing sleep ${override_sec}s (skipping parsed reset time / wait mode)."
      vmsg "Sleep started at $(ts) (local machine clock)."
      sleep_with_countdown "$override_sec" "limit-override"
      vmsg "Sleep finished at $(ts); retrying batch-${pad}."
      return
    fi
    vmsg "WARN: invalid CLAUDE_LIMIT_OVERRIDE_SLEEP_SEC='${override_sec}' (expected positive integer); ignoring override."
  fi

  if [[ "$use_parse" == "1" ]] && command -v python3 >/dev/null 2>&1 && [[ -f "$PARSE_RESET_PY" ]]; then
    local parse_out parse_rc sleep_sec reset_iso
    parse_out=$(
      CLAUDE_LIMIT_RESET_BUFFER_SEC="${CLAUDE_LIMIT_RESET_BUFFER_SEC:-60}" \
        CLAUDE_LIMIT_MAX_SLEEP_SEC="${CLAUDE_LIMIT_MAX_SLEEP_SEC:-172800}" \
        python3 "$PARSE_RESET_PY" <<<"$limit_text"
    ) || parse_rc=$?
    parse_rc=${parse_rc:-0}
    if [[ "$parse_rc" -eq 0 ]] && [[ -n "$parse_out" ]]; then
      sleep_sec=$(printf '%s' "$parse_out" | sed -n '1p')
      reset_iso=$(printf '%s' "$parse_out" | sed -n '2p')
      if [[ "$sleep_sec" =~ ^[0-9]+$ ]] && [[ "$sleep_sec" -gt 0 ]]; then
        echo "" >&2
        vmsg "Parsed Claude reset time from output → sleep ${sleep_sec}s (target ~${reset_iso}, now ~$(date -Iseconds))."
        vmsg "Sleep started at $(ts) (local machine clock)."
        sleep_with_countdown "$sleep_sec" "limit-reset"
        vmsg "Sleep finished at $(ts); retrying batch-${pad}."
        return
      fi
    fi
    if [[ "$parse_rc" -eq 3 ]]; then
      vmsg "Parsed reset time exceeds CLAUDE_LIMIT_MAX_SLEEP_SEC; falling back to prompt/sleep mode."
    fi
  fi

  if [[ -z "$mode" ]]; then
    if [[ -t 0 ]]; then
      mode=prompt
    else
      mode=sleep
    fi
  fi
  if [[ "$mode" == "sleep" ]]; then
    echo "" >&2
    vmsg "Pause mode=sleep: sleeping ${sec}s then retrying same batch (set CLAUDE_LIMIT_SLEEP_SEC to change)."
    vmsg "Sleep started at $(ts) (local)."
    sleep_with_countdown "$sec" "limit-sleep-mode"
    vmsg "Sleep finished at $(ts); retrying batch-${pad}."
    return
  fi
  echo "" >&2
  vmsg "Pause mode=prompt: waiting for you to press Enter (then retry batch-${pad})."
  if ! read -r -p "Limit/quota suspected — press Enter when your Claude limit has reset to retry this batch (Ctrl+C to stop)... " _ </dev/tty 2>/dev/null; then
    vmsg "Could not read /dev/tty; falling back to sleep ${sec}s."
    sleep_with_countdown "$sec" "limit-fallback-sleep"
    vmsg "Fallback sleep finished; retrying batch-${pad}."
  else
    vmsg "Enter received; retrying batch-${pad}."
  fi
}

run_claude_for_batch() {
  local log attempt _cc_start _elapsed code combined limit_loops transient_loops
  local out_json="$OUT_DIR/batch-${pad}.json"
  local max_limit_loops=${CLAUDE_LIMIT_MAX_LIMIT_LOOPS:-40}
  local max_transient=${CLAUDE_TRANSIENT_MAX_RETRIES:-10}
  local transient_sleep=${CLAUDE_TRANSIENT_SLEEP_SEC:-90}
  log=$(mktemp "${TMPDIR:-/tmp}/claude-seed-batch.XXXXXX")
  vmsg "batch-${pad}: temp log file: $log"
  attempt=0
  limit_loops=0
  transient_loops=0
  while true; do
    attempt=$((attempt + 1))
    vmsg "batch-${pad}: claude run attempt #${attempt} — cwd=$BACKEND_ROOT"
    _cc_start=$SECONDS
    set +e
    set -o pipefail
    (cd "$BACKEND_ROOT" && "${cmd[@]}") 2>&1 | tee "$log"
    code=${PIPESTATUS[0]}
    set +o pipefail
    set -e
    _elapsed=$((SECONDS - _cc_start))
    vmsg "batch-${pad}: attempt #${attempt} finished after ${_elapsed}s with exit code ${code}"

    if [[ "$code" -eq 0 ]]; then
      if [[ -f "$out_json" ]]; then
        vmsg "batch-${pad}: expected output present: $out_json ($(wc -c < "$out_json" | tr -d ' ') bytes)"
      else
        vmsg "WARNING batch-${pad}: claude exited 0 but $out_json is missing — verify manually."
      fi
      rm -f "$log"
      vmsg "batch-${pad}: completed successfully."
      return 0
    fi

    combined=$(cat "$log")
    if is_likely_claude_limit "$combined"; then
      limit_loops=$((limit_loops + 1))
      if [[ "$limit_loops" -gt "$max_limit_loops" ]]; then
        echo "" >&2
        vmsg "ERROR batch-${pad}: limit heuristics fired ${limit_loops} times (cap CLAUDE_LIMIT_MAX_LIMIT_LOOPS=${max_limit_loops})."
        vmsg "This usually means a false match on log text, or the limit never clears. Inspect: $log"
        vmsg "Try: CLAUDE_LIMIT_USE_MESSAGE_TIME=0, raise the cap, or fix the underlying claude error."
        cat "$log" >&2
        rm -f "$log"
        exit 1
      fi
      echo "" >&2
      vmsg "batch-${pad}: exit ${code} — output matched usage/rate-limit heuristics (limit loop ${limit_loops}/${max_limit_loops}); pause then retry."
      vmsg "batch-${pad}: last lines of claude output (for context):"
      tail -n 20 "$log" >&2 || true
      wait_for_limit_reset "$combined"
      continue
    fi

    if is_transient_api_failure "$combined"; then
      transient_loops=$((transient_loops + 1))
      if [[ "$transient_loops" -gt "$max_transient" ]]; then
        echo "" >&2
        vmsg "ERROR batch-${pad}: transient API/transport errors ${transient_loops} times (cap CLAUDE_TRANSIENT_MAX_RETRIES=${max_transient})."
        vmsg "Raise the cap or wait and re-run; inspect: $log"
        cat "$log" >&2
        rm -f "$log"
        exit 1
      fi
      echo "" >&2
      vmsg "batch-${pad}: exit ${code} — matched transient API/transport heuristics (retry ${transient_loops}/${max_transient}); sleeping ${transient_sleep}s."
      tail -n 25 "$log" >&2 || true
      sleep "$transient_sleep"
      continue
    fi

    echo "" >&2
    vmsg "batch-${pad}: exit ${code} — not treated as limit or transient; failing. Full claude output:"
    cat "$log" >&2
    rm -f "$log"
    return "$code"
  done
}

batch_idx=0
skipped_batches=0
ran_batches=0
for prompt_path in "${run_list[@]}"; do
  batch_idx=$((batch_idx + 1))
  base=$(basename "$prompt_path")
  pad=${base#batch-}
  pad=${pad%%-PROMPT.md}
  out_json_path="$OUT_DIR/batch-${pad}.json"

  user_prompt=$(
    cat <<EOF
You are working in the backend app root (cwd). Open and follow every rule in seeds/claude-batches/batch-${pad}-PROMPT.md.

Deliverables:
- Write the JSON array to seeds/claude-batches/out/batch-${pad}.json only (raw JSON, no markdown fences).
- Create seeds/claude-batches/out if it does not exist.

Use whatever tools you have (Read, Edit, Bash, browser / MCP) so evidence URLs are real when the prompt requires it.
EOF
  )

  cmd=(claude -p "$user_prompt" --allowedTools "Read,Edit,Bash")
  if [[ "$BARE" -eq 1 ]]; then
    cmd+=(--bare)
  fi
  if [[ "$CHROME" -eq 1 ]]; then
    cmd+=(--chrome)
  fi
  if [[ ${#PASS_THROUGH[@]} -gt 0 ]]; then
    cmd+=("${PASS_THROUGH[@]}")
  fi

  echo ""
  echo "========== batch ${batch_idx}/${count} (batch-${pad}) ==========" >&2
  vmsg "Prompt file:  $prompt_path"
  vmsg "Target JSON:  $out_json_path"

  if [[ "$FORCE" -ne 1 ]] && [[ -f "$out_json_path" ]] && [[ -s "$out_json_path" ]]; then
    vmsg "Skipping batch-${pad}: output already exists and is non-empty (use --force to re-run)."
    skipped_batches=$((skipped_batches + 1))
    continue
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    vmsg "Dry-run: would execute:"
    printf '  (cd %q && ' "$BACKEND_ROOT"
    printf '%q ' "${cmd[@]}"
    echo ')'
    continue
  fi

  ran_batches=$((ran_batches + 1))
  if [[ "$DRY_RUN" -ne 1 ]]; then
    run_claude_for_batch
  fi
  vmsg "Finished batch ${batch_idx}/${count} (batch-${pad}) on run list."
done

echo "" >&2
vmsg "Run finished: ${ran_batches} batch(es) invoked claude, ${skipped_batches} skipped (existing output), ${count} in list."
vmsg "No fatal errors in this script run."
echo "Done. Next: ./agents/make go-merge   (or: cd agents && make go-merge)"
