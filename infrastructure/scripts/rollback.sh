#!/usr/bin/env sh
set -eu

ENVIRONMENT="${1:-production}"
RELEASE_TAG="${2:-}"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [ -z "$RELEASE_TAG" ]; then
  echo "Usage: $0 [environment] <release-tag>"
  exit 1
fi

cd "$PROJECT_ROOT"

COMPOSE_ENV_FILE="$ENVIRONMENT"
if [ "$ENVIRONMENT" = "development" ]; then
  COMPOSE_ENV_FILE="dev"
fi

echo "[rollback] environment=$ENVIRONMENT release=$RELEASE_TAG"

export API_IMAGE_TAG="$RELEASE_TAG"
export ADMIN_IMAGE_TAG="$RELEASE_TAG"

docker compose -f docker-compose.yml -f docker-compose.${COMPOSE_ENV_FILE}.yml up -d --remove-orphans
./infrastructure/scripts/healthcheck.sh "$ENVIRONMENT"

echo "[rollback] rollback completed"
