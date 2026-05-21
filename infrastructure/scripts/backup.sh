#!/usr/bin/env sh
set -eu

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

./infrastructure/backups/backup-postgres.sh
./infrastructure/backups/backup-redis.sh
./infrastructure/backups/rotate-datasets.sh

echo "[backup] backup workflow completed"
