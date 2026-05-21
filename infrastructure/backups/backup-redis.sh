#!/usr/bin/env sh
set -eu

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-/backups/redis}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

echo "Triggering Redis snapshot"
docker exec trustip-redis redis-cli -a "${REDIS_PASSWORD:-redis_dev_password}" BGSAVE
sleep 2

docker cp trustip-redis:/data/dump.rdb "$BACKUP_DIR/trustip_redis_${TIMESTAMP}.rdb"

echo "Pruning redis snapshots older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -type f -name '*.rdb' -mtime +"$RETENTION_DAYS" -delete

echo "Redis backup complete"
