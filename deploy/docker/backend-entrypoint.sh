#!/bin/bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set; cannot run migrations" >&2
  exit 1
fi

echo "Running database migrations..."
until npx prisma migrate deploy; do
  echo "Prisma migrate failed, retrying in 5 seconds..."
  sleep 5
done

echo "Starting API server"
exec node dist/server.js
