#!/usr/bin/env sh
set -eu

pnpm --filter @trustip/api test:critical

echo "[unit] critical service tests passed"
