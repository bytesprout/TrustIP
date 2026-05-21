#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:8080}"

echo "[chaos] stopping redis container"
docker stop trustip-redis >/dev/null

set +e
wget -qO- "$BASE_URL/api/health/redis" | grep -q 'UNHEALTHY\|unhealthy'
RESULT=$?
set -e

docker start trustip-redis >/dev/null

if [ "$RESULT" -ne 0 ]; then
  echo "[chaos] redis failure test failed"
  exit 1
fi

echo "[chaos] redis failure recovery test passed"
