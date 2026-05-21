#!/usr/bin/env sh
set -eu

DATASET_ROOT="${DATASET_ROOT:-data/datasets/current}"
ARCHIVE_ROOT="${ARCHIVE_ROOT:-data/datasets/archive}"
KEEP_VERSIONS="${KEEP_VERSIONS:-5}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$ARCHIVE_ROOT"

for dataset in "$DATASET_ROOT"/*; do
  [ -d "$dataset" ] || continue
  dataset_name="$(basename "$dataset")"
  target="$ARCHIVE_ROOT/$dataset_name"
  mkdir -p "$target"
  tar -czf "$target/${dataset_name}_${TIMESTAMP}.tar.gz" -C "$DATASET_ROOT" "$dataset_name"

  ls -1t "$target"/*.tar.gz | awk "NR>$KEEP_VERSIONS" | xargs -I{} rm -f {}
done

echo "Dataset rotation complete"
