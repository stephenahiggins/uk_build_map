#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INPUT_FILE="${1:-}"

if [[ -z "${INPUT_FILE}" ]]; then
  echo "Usage: bash scripts/restoreDatabase.sh <backup.sql.gz|backup.sql>" >&2
  exit 1
fi

if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

: "${DATABASE_NAME:?DATABASE_NAME must be set}"
: "${DATABASE_PASSWORD:?DATABASE_PASSWORD must be set}"

ABS_INPUT="$(cd "$(dirname "${INPUT_FILE}")" && pwd)/$(basename "${INPUT_FILE}")"

if [[ ! -f "${ABS_INPUT}" ]]; then
  echo "Backup file not found: ${ABS_INPUT}" >&2
  exit 1
fi

if [[ "${ABS_INPUT}" == *.gz ]]; then
  gzip -dc "${ABS_INPUT}" | docker-compose -f "${ROOT_DIR}/docker-compose.yml" exec -T db \
    mysql -uroot "-p${DATABASE_PASSWORD}" "${DATABASE_NAME}"
else
  cat "${ABS_INPUT}" | docker-compose -f "${ROOT_DIR}/docker-compose.yml" exec -T db \
    mysql -uroot "-p${DATABASE_PASSWORD}" "${DATABASE_NAME}"
fi

printf 'Database restored from %s\n' "${ABS_INPUT}"
