-- CreateEnum
CREATE TYPE "DomainLockMode" AS ENUM ('DISABLED', 'STRICT', 'WILDCARD');

-- CreateEnum
CREATE TYPE "IpWhitelistMode" AS ENUM ('DISABLED', 'STRICT');

-- AlterTable: Add Phase 04 tenant fields
ALTER TABLE "tenants"
  ADD COLUMN "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN "domain_lock_mode"      "DomainLockMode"  NOT NULL DEFAULT 'DISABLED',
  ADD COLUMN "allowed_domains"       TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN "ip_whitelist_mode"     "IpWhitelistMode" NOT NULL DEFAULT 'DISABLED',
  ADD COLUMN "allowed_ips"           TEXT[]  NOT NULL DEFAULT '{}';

-- CreateTable: ApiUsageLog
CREATE TABLE "api_usage_logs" (
    "id"          TEXT        NOT NULL,
    "tenant_id"   TEXT        NOT NULL,
    "api_key_id"  TEXT,
    "endpoint"    TEXT        NOT NULL,
    "query_ip"    TEXT        NOT NULL,
    "country"     TEXT,
    "status_code" INTEGER     NOT NULL,
    "latency_ms"  INTEGER     NOT NULL,
    "cache_hit"   BOOLEAN     NOT NULL DEFAULT false,
    "scope"       TEXT,
    "user_agent"  TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_usage_logs_tenant_id_idx" ON "api_usage_logs"("tenant_id");
CREATE INDEX "api_usage_logs_tenant_id_created_at_idx" ON "api_usage_logs"("tenant_id", "created_at");
CREATE INDEX "api_usage_logs_endpoint_idx" ON "api_usage_logs"("endpoint");
CREATE INDEX "api_usage_logs_created_at_idx" ON "api_usage_logs"("created_at");

-- AddForeignKey
ALTER TABLE "api_usage_logs"
  ADD CONSTRAINT "api_usage_logs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
