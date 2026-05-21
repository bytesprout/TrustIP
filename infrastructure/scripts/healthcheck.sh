#!/bin/sh
set -eu

ENVIRONMENT="${1:-development}"

case "$ENVIRONMENT" in
  development)
    API_URL="${API_URL:-http://localhost:8080}"
    ADMIN_URL="${ADMIN_URL:-http://localhost:3000}"
    ;;
  staging)
    API_URL="${API_URL:-https://api-staging.trustip.io}"
    ADMIN_URL="${ADMIN_URL:-https://admin-staging.trustip.io}"
    ;;
  production)
    API_URL="${API_URL:-https://api.trustip.io}"
    ADMIN_URL="${ADMIN_URL:-https://admin.trustip.io}"
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

check_health() {
  name="$1"
  url="$2"
  if wget -qO- "$url" 2>/dev/null | grep -q '"healthy":true\|"status":"HEALTHY"\|"status":"healthy"'; then
    echo "[health] $name healthy"
    return 0
  fi

  echo "[health] $name unhealthy ($url)"
  return 1
}

check_health "api-overall" "$API_URL/api/health"
check_health "api-db" "$API_URL/api/health/db"
check_health "api-redis" "$API_URL/api/health/redis"
check_health "api-datasets" "$API_URL/api/health/datasets"
check_health "api-trust-engine" "$API_URL/api/health/trust-engine"
check_health "api-billing" "$API_URL/api/health/billing"

if wget -qO- "$ADMIN_URL" >/dev/null 2>&1; then
  echo "[health] admin healthy"
else
  echo "[health] admin unhealthy"
  exit 1
fi

echo "[health] all checks passed"
