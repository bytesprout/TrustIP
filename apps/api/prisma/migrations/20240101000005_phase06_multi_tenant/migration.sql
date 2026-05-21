-- Phase 06: Multi-tenant SaaS engine foundations

CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'DISABLED', 'SUSPENDED', 'TRIAL');
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'DISABLED', 'REVOKED', 'EXPIRED');
CREATE TYPE "TenantDomainMode" AS ENUM ('DISABLED', 'STRICT', 'WILDCARD');
CREATE TYPE "WhitelistEntryType" AS ENUM ('SINGLE', 'CIDR');

ALTER TABLE "tenants"
  ADD COLUMN "company_name" TEXT,
  ADD COLUMN "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "subscription_plan_id" TEXT,
  ADD COLUMN "analytics_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "analytics_retention_days" INTEGER DEFAULT 90,
  ADD COLUMN "rate_limit_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "quota_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "monthly_request_limit" INTEGER DEFAULT 100000,
  ADD COLUMN "quota_soft_limit_percent" INTEGER NOT NULL DEFAULT 80;

ALTER TABLE "api_keys"
  ADD COLUMN "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "request_limit" INTEGER;

CREATE TABLE "tenant_domains" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "mode" "TenantDomainMode" NOT NULL DEFAULT 'STRICT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_domains_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tenant_ip_whitelist" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "ip" TEXT NOT NULL,
  "type" "WhitelistEntryType" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_ip_whitelist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usage_metrics" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "request_count" INTEGER NOT NULL DEFAULT 0,
  "country" TEXT,
  "vpn_hits" INTEGER NOT NULL DEFAULT 0,
  "blocked_requests" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usage_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_domains_tenant_id_domain_key" ON "tenant_domains"("tenant_id", "domain");
CREATE INDEX "tenant_domains_tenant_id_idx" ON "tenant_domains"("tenant_id");

CREATE UNIQUE INDEX "tenant_ip_whitelist_tenant_id_ip_key" ON "tenant_ip_whitelist"("tenant_id", "ip");
CREATE INDEX "tenant_ip_whitelist_tenant_id_idx" ON "tenant_ip_whitelist"("tenant_id");

CREATE INDEX "usage_metrics_tenant_id_idx" ON "usage_metrics"("tenant_id");
CREATE INDEX "usage_metrics_tenant_id_created_at_idx" ON "usage_metrics"("tenant_id", "created_at");

ALTER TABLE "tenant_domains"
  ADD CONSTRAINT "tenant_domains_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_ip_whitelist"
  ADD CONSTRAINT "tenant_ip_whitelist_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "usage_metrics"
  ADD CONSTRAINT "usage_metrics_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backward-compatible backfill from legacy array fields
INSERT INTO "tenant_domains" ("id", "tenant_id", "domain", "mode", "created_at")
SELECT
  uuid_generate_v4()::text,
  t."id",
  d,
  CASE t."domain_lock_mode"
    WHEN 'WILDCARD' THEN 'WILDCARD'::"TenantDomainMode"
    WHEN 'STRICT' THEN 'STRICT'::"TenantDomainMode"
    ELSE 'DISABLED'::"TenantDomainMode"
  END,
  CURRENT_TIMESTAMP
FROM "tenants" t,
LATERAL unnest(t."allowed_domains") AS d
ON CONFLICT ("tenant_id", "domain") DO NOTHING;

INSERT INTO "tenant_ip_whitelist" ("id", "tenant_id", "ip", "type", "created_at")
SELECT
  uuid_generate_v4()::text,
  t."id",
  ip,
  CASE
    WHEN position('/' in ip) > 0 THEN 'CIDR'::"WhitelistEntryType"
    ELSE 'SINGLE'::"WhitelistEntryType"
  END,
  CURRENT_TIMESTAMP
FROM "tenants" t,
LATERAL unnest(t."allowed_ips") AS ip
ON CONFLICT ("tenant_id", "ip") DO NOTHING;

UPDATE "api_keys"
SET "status" = CASE
  WHEN "is_active" = false THEN 'DISABLED'::"ApiKeyStatus"
  WHEN "expires_at" IS NOT NULL AND "expires_at" < CURRENT_TIMESTAMP THEN 'EXPIRED'::"ApiKeyStatus"
  ELSE 'ACTIVE'::"ApiKeyStatus"
END;

UPDATE "tenants"
SET "status" = CASE
  WHEN "is_active" = false THEN 'DISABLED'::"TenantStatus"
  ELSE 'ACTIVE'::"TenantStatus"
END;