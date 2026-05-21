#!/usr/bin/env sh
set -eu

SCRIPT_PATH="./tests/performance/k6-ip-lookup.js"

if command -v k6 >/dev/null 2>&1; then
  k6 run "$SCRIPT_PATH"
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[performance] neither k6 nor docker is available"
  exit 1
fi

docker run --rm --network host \
  -e K6_BASE_URL="${K6_BASE_URL:-http://localhost:8080}" \
  -e K6_PATH="${K6_PATH:-/api/health}" \
  -e K6_EXPECT_HEALTHY="${K6_EXPECT_HEALTHY:-1}" \
  -v "$PWD/tests/performance:/scripts" \
  grafana/k6:latest run /scripts/k6-ip-lookup.js

echo "[performance] k6 completed via docker"
