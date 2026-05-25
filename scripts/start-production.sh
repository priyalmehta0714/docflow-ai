#!/bin/sh
set -e

echo "Running database migrations..."
pnpm db:migrate:deploy

echo "Starting worker in background..."
pnpm --filter @docflow/worker start &

echo "Starting API..."
exec pnpm --filter @docflow/api start
