#!/usr/bin/env sh
set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <postgres-backup.sql.gz>"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

./infrastructure/backups/restore-postgres.sh "$1"

echo "[restore] restore completed"
