#!/usr/bin/env sh
set -eu

TARGET_URL="${TARGET_URL:-http://localhost:8080}"
REPORT_DIR="${REPORT_DIR:-./tests/security/reports}"
mkdir -p "$REPORT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "[security] docker not available; cannot run OWASP ZAP baseline"
  exit 1
fi

docker run --rm \
  -v "$PWD/$REPORT_DIR:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "$TARGET_URL" -r zap-baseline-report.html -J zap-baseline-report.json

echo "[security] OWASP ZAP baseline completed"
