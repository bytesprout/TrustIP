#!/usr/bin/env bash
# Download GeoLite2 databases from MaxMind
# Required env var: MAXMIND_LICENSE_KEY
# Optional: DATASET_PATH (default: ./data/datasets/geolite)

set -euo pipefail

DATASET_PATH="${DATASET_PATH:-./data/datasets/geolite}"
LICENSE_KEY="${MAXMIND_LICENSE_KEY:-}"
MAXMIND_BASE_URL="https://download.maxmind.com/app/geoip_download"

if [[ -z "$LICENSE_KEY" ]]; then
  echo "ERROR: MAXMIND_LICENSE_KEY environment variable is required."
  echo "Get your free license key at: https://www.maxmind.com/en/geolite2/signup"
  exit 1
fi

mkdir -p "$DATASET_PATH"

download_db() {
  local edition="$1"
  local output="${DATASET_PATH}/${edition}.mmdb"
  local url="${MAXMIND_BASE_URL}?edition_id=${edition}&license_key=${LICENSE_KEY}&suffix=tar.gz"

  echo "Downloading ${edition}..."
  TMP_DIR=$(mktemp -d)
  curl -fsSL "$url" -o "${TMP_DIR}/${edition}.tar.gz"
  tar -xzf "${TMP_DIR}/${edition}.tar.gz" -C "$TMP_DIR"
  find "$TMP_DIR" -name "*.mmdb" -exec cp {} "$output" \;
  rm -rf "$TMP_DIR"
  echo "  ✓ ${edition}.mmdb saved to ${output}"
}

download_db "GeoLite2-City"
download_db "GeoLite2-ASN"

echo ""
echo "GeoLite2 databases downloaded successfully to: ${DATASET_PATH}"
echo "Note: These databases are subject to the MaxMind GeoLite2 License."
echo "      https://www.maxmind.com/en/geolite2/eula"
