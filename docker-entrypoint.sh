#!/bin/sh
set -e

echo "[GALINHAGORDA] Running database migrations..."
node scripts/migrate.js || echo "[GALINHAGORDA] Migration warning - continuing..."

echo "[GALINHAGORDA] Starting application..."
exec "$@"
