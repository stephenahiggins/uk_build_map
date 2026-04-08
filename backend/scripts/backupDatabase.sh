#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date '+%Y%m%d-%H%M%S')"
BACKUP_DIR="${ROOT_DIR}/backups"
OUT_FILE="${1:-${BACKUP_DIR}/mysql-${STAMP}.sql.gz}"

mkdir -p "$(dirname "${OUT_FILE}")"

if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

: "${DATABASE_NAME:?DATABASE_NAME must be set}"
: "${DATABASE_PASSWORD:?DATABASE_PASSWORD must be set}"

docker-compose -f "${ROOT_DIR}/docker-compose.yml" exec -T db \
  mysqldump -uroot "-p${DATABASE_PASSWORD}" \
  --single-transaction \
  --routines \
  --triggers \
  "${DATABASE_NAME}" | gzip > "${OUT_FILE}"

printf 'Database backup written to %s\n' "${OUT_FILE}"
