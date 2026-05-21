#!/bin/sh
API_URL="${API_URL:-http://localhost:8080}"
response=$(wget -qO- "$API_URL/health" 2>/dev/null)
if echo "$response" | grep -q '"healthy":true'; then
  echo "✅ API healthy"
  exit 0
else
  echo "❌ API unhealthy: $response"
  exit 1
fi
