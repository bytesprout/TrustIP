#!/bin/sh
set -e

echo "🚀 TrustIP Setup"
echo "================="

# Copy env if not exists
if [ ! -f .env.development ]; then
  cp .env.example .env.development
  echo "✅ Created .env.development from .env.example"
  echo "⚠️  Update .env.development with your secrets before running."
else
  echo "ℹ️  .env.development already exists"
fi

# Check pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm not found. Install with: npm install -g pnpm"
  exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🔧 Building shared packages..."
pnpm --filter @trustip/shared-types build
pnpm --filter @trustip/shared-config build
pnpm --filter @trustip/logger build

echo "✅ Setup complete. Run: docker compose up -d"
