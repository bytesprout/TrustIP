#!/usr/bin/env sh
set -eu

EMAIL="${LETSENCRYPT_EMAIL:-ops@trustip.io}"
API_DOMAIN="${API_DOMAIN:-api.trustip.io}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.trustip.io}"

if [ ! -d /etc/letsencrypt/live ]; then
  mkdir -p /etc/letsencrypt
fi

certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$API_DOMAIN" \
  -d "$ADMIN_DOMAIN" \
  --keep-until-expiring

# Zero-downtime cert reload for nginx
docker exec trustip-nginx nginx -s reload
