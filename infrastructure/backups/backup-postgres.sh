#!/usr/bin/env sh
set -eu

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

OUTPUT_FILE="$BACKUP_DIR/trustip_pg_${TIMESTAMP}.sql.gz"

echo "Creating PostgreSQL backup: $OUTPUT_FILE"
docker exec trustip-postgres pg_dump -U trustip trustip_db | gzip > "$OUTPUT_FILE"

echo "Validating backup archive"
gzip -t "$OUTPUT_FILE"

echo "Pruning backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

echo "PostgreSQL backup complete"
