#!/bin/bash
set -e

# Run Prisma migrations
# Wait for the database to be available
/app/wait-for-it.sh db:3307 -- echo "Database is up"

npx prisma migrate deploy

# Seed the database
npm run seed

# TypeScript build step (output errors to log)
npm run build
BUILD_STATUS=$?
if [ $BUILD_STATUS -ne 0 ]; then
	echo "TypeScript build failed with exit code $BUILD_STATUS"
	exit $BUILD_STATUS
fi

# Start the application
exec npm run dev
