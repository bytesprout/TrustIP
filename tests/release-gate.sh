#!/usr/bin/env sh
set -eu

pnpm test:unit
pnpm test:integration
pnpm test:contract
pnpm test:e2e
pnpm test:security
pnpm test:performance
pnpm test:chaos

echo "[release-gate] all release validation gates passed"
