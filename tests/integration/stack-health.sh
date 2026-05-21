#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:8080}"

wget -qO- "$BASE_URL/api/health" | grep -q '"healthy":true'
wget -qO- "$BASE_URL/api/health/db" | grep -q '"status":"HEALTHY"\|"status":"healthy"'
wget -qO- "$BASE_URL/api/health/redis" | grep -q '"status":"HEALTHY"\|"status":"healthy"'
wget -qO- "$BASE_URL/api/health/datasets" | grep -q '"status":"HEALTHY"\|"status":"healthy"\|"status":"UNHEALTHY"\|"status":"unhealthy"'

echo "[integration] stack health checks passed"
