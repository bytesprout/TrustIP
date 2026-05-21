#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_URL="${ADMIN_URL:-http://localhost:3000}"

wget -qO- "$BASE_URL/api/health" | grep -q '"healthy":true'
wget -qO- "$BASE_URL/api/health/billing" | grep -q '"status"'
wget -qO- "$BASE_URL/api/health/trust-engine" | grep -q '"status"'
wget -qO- "$BASE_URL/api/health/datasets" | grep -q '"status"'
wget -qO- "$ADMIN_URL" >/dev/null

echo "[qa] checklist passed"
