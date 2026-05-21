#!/usr/bin/env sh
set -eu

BASE_URL="${1:-http://localhost:8080}"

wget -qO- "$BASE_URL/api/health" | grep -q '"healthy":true'
wget -qO- "$BASE_URL/api/health/db" | grep -q '"status":"HEALTHY"\|"status":"healthy"'
wget -qO- "$BASE_URL/api/health/redis" | grep -q '"status":"HEALTHY"\|"status":"healthy"'

# Metrics endpoint should be reachable
wget -qO- "$BASE_URL/api/metrics" | grep -q 'trustip_http_requests_total'

echo "[smoke-test] all checks passed"
