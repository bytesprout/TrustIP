FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ============================================================
# Builder stage
# ============================================================
FROM base AS builder
WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json ./

# Copy all package.json files for dependency resolution
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/logger/package.json ./packages/logger/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api ./apps/api
COPY packages ./packages

# Build packages first, then api
WORKDIR /app
RUN pnpm --filter @trustip/shared-types build
RUN pnpm --filter @trustip/shared-config build
RUN pnpm --filter @trustip/logger build
RUN pnpm --filter @trustip/api build

# ============================================================
# Production stage
# ============================================================
FROM node:22-alpine AS production
RUN apk add --no-cache libc6-compat python3 make g++
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy production package manifests
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/logger/package.json ./packages/logger/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# Install production only
RUN pnpm install --frozen-lockfile --prod

# Copy built output
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-config/dist ./packages/shared-config/dist
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist

WORKDIR /app/apps/api

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

# Start: run migrations then start app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
