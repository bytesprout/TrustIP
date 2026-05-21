#!/usr/bin/env sh
set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring PostgreSQL backup from $BACKUP_FILE"
gzip -dc "$BACKUP_FILE" | docker exec -i trustip-postgres psql -U trustip -d trustip_db

echo "Restore complete"
