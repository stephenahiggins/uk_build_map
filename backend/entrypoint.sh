#!/bin/bash
set -e

# Run Prisma migrations
# Wait for the database to be available
/app/wait-for-it.sh db:3307 -- echo "Database is up"

npx prisma migrate deploy

# Seed the database
npm run seed

# Start the application
exec npm run dev
