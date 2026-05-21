#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:8080}"

echo "[chaos] stopping postgres container"
docker stop trustip-postgres >/dev/null

set +e
wget -qO- "$BASE_URL/api/health/db" | grep -q 'UNHEALTHY\|unhealthy'
RESULT=$?
set -e

docker start trustip-postgres >/dev/null

if [ "$RESULT" -ne 0 ]; then
  echo "[chaos] postgres failure test failed"
  exit 1
fi

echo "[chaos] postgres failure recovery test passed"
