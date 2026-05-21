#!/usr/bin/env sh
set -eu

ENVIRONMENT="${1:-production}"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

case "$ENVIRONMENT" in
  development|staging|production) ;;
  *)
    echo "Unsupported environment: $ENVIRONMENT"
    echo "Usage: $0 [development|staging|production]"
    exit 1
    ;;
esac

COMPOSE_ENV_FILE="$ENVIRONMENT"
if [ "$ENVIRONMENT" = "development" ]; then
  COMPOSE_ENV_FILE="dev"
fi

cd "$PROJECT_ROOT"

echo "[deploy] environment=$ENVIRONMENT"

echo "[deploy] validating compose configuration"
docker compose -f docker-compose.yml -f docker-compose.${COMPOSE_ENV_FILE}.yml config >/dev/null

if [ "${SKIP_PULL:-0}" = "1" ]; then
  echo "[deploy] SKIP_PULL=1, skipping image pull"
else
  echo "[deploy] pulling latest images"
  docker compose -f docker-compose.yml -f docker-compose.${COMPOSE_ENV_FILE}.yml pull
fi

echo "[deploy] applying migrations"
docker compose -f docker-compose.yml -f docker-compose.${COMPOSE_ENV_FILE}.yml run --rm api npx prisma migrate deploy

echo "[deploy] starting services"
docker compose -f docker-compose.yml -f docker-compose.${COMPOSE_ENV_FILE}.yml up -d --remove-orphans

echo "[deploy] waiting for health checks"
./infrastructure/scripts/healthcheck.sh "$ENVIRONMENT"

echo "[deploy] deployment completed"
