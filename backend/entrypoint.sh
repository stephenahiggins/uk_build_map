#!/bin/bash
set -e

# Run Prisma migrations
# Wait for the database to be available
/app/wait-for-it.sh db:3306 -- echo "Database is up"

# Deploy migrations without running seed (to avoid module-alias issues during deploy)
npx prisma migrate deploy

# Run seed separately with proper node modules setup if needed
# (Optional - remove this line if you don't want to seed on startup)
# npx ts-node --project tsnode.json prisma/seed.ts

# Seed projects from LFG.sql file
echo "Seeding projects from LFG.sql..."
mysql -h db -u root -prootpassword node_boilerplate < /app/prisma/seed/LFG.sql || echo "Warning: Failed to seed from LFG.sql (may already be seeded)"

# Start the pre-built application
exec node dist/server.js
