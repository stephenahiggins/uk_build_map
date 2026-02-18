#!/bin/bash
set -e

/app/wait-for-it.sh db:3306 -- echo "Database is up"

npx prisma migrate deploy

echo "Seeding projects from LFG.sql..."
mysql -h db -u root -prootpassword node_boilerplate < /app/prisma/seed/LFG.sql || echo "Warning: Failed to seed from LFG.sql (may already be seeded)"

exec npm run dev
