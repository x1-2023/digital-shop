#!/bin/sh
set -e

echo "==================================="
echo "Digital Shop - Container Starting"
echo "==================================="

# Check database directory
echo "[1/4] Checking database directory..."
if [ ! -d "/app/data" ]; then
  echo "ERROR: /app/data directory not found!"
  exit 1
fi

if [ ! -w "/app/data" ]; then
  echo "ERROR: /app/data is not writable!"
  ls -la /app/data
  exit 1
fi
echo "      ✓ Database directory OK"

# Setup database
echo "[2/4] Setting up database..."
DB_FILE="/app/data/production.db"

if [ -f "$DB_FILE" ]; then
  echo "      ✓ Database file exists, checking schema..."

  # Try migrate deploy first (for production with migrations)
  if [ -d "/app/prisma/migrations" ] && [ "$(ls -A /app/prisma/migrations 2>/dev/null)" ]; then
    echo "      → Running migrations..."
    if npx prisma migrate deploy 2>/dev/null; then
      echo "      ✓ Migrations applied"
    else
      echo "      ⚠ Migrate failed, syncing schema..."
      npx prisma db push --skip-generate --accept-data-loss || {
        echo "ERROR: Failed to sync schema"
        exit 1
      }
    fi
  else
    # No migrations folder, just sync schema
    echo "      → Syncing schema (no migrations found)..."
    npx prisma db push --skip-generate --accept-data-loss || {
      echo "ERROR: Failed to sync schema"
      exit 1
    }
    echo "      ✓ Schema synced"
  fi
else
  echo "      → Database not found, creating..."
  npx prisma db push --skip-generate --accept-data-loss || {
    echo "ERROR: Failed to create database"
    exit 1
  }
  echo "      ✓ Database created"
fi

# Verify database
echo "[3/4] Verifying database connection..."
if node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('      ✓ Connection OK'); process.exit(0); }).catch(e => { console.error('ERROR:', e.message); process.exit(1); });" 2>/dev/null; then
  echo ""
else
  echo "      ⚠ Verification failed (will retry on app start)"
fi

# Start application
echo "[4/4] Starting Next.js server..."
echo "==================================="
echo ""

exec node server.js
