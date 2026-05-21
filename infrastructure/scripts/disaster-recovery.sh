#!/usr/bin/env sh
set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <postgres-backup.sql.gz>"
  exit 1
fi

POSTGRES_BACKUP="$1"

echo "[1/4] Stopping API and workers"
docker compose stop api

echo "[2/4] Restoring PostgreSQL"
./infrastructure/backups/restore-postgres.sh "$POSTGRES_BACKUP"

echo "[3/4] Restarting API"
docker compose up -d api

echo "[4/4] Verifying health"
curl -sf http://localhost:8080/api/health > /dev/null

echo "Disaster recovery workflow completed"
