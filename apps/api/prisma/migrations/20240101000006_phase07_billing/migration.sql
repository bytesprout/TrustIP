-- Phase 07: Billing & Subscription Engine

CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ARCHIVED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'EXPIRED', 'GRACE_PERIOD', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL', 'MANUAL');
CREATE TYPE "InvoiceStatus" AS ENUM ('PAID', 'UNPAID', 'PARTIAL', 'VOID');
CREATE TYPE "PaymentProvider" AS ENUM ('MANUAL', 'RAZORPAY', 'STRIPE', 'PAYPAL');
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

CREATE TABLE "plans" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "monthly_price" DECIMAL(12,2) NOT NULL,
  "annual_price" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "request_limit_monthly" INTEGER,
  "requests_per_minute" INTEGER NOT NULL DEFAULT 100,
  "analytics_retention_days" INTEGER,
  "features" JSONB NOT NULL,
  "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_by_tenant_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "plan_id" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
  "starts_at" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3),
  "grace_period_ends_at" TIMESTAMP(3),
  "manual_override" BOOLEAN NOT NULL DEFAULT false,
  "auto_renew" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoices" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "invoice_number" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
  "issued_at" TIMESTAMP(3) NOT NULL,
  "paid_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "billing_history" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_attempts" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "provider_reference" TEXT,
  "failure_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quota_usage" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "requests_used" INTEGER NOT NULL DEFAULT 0,
  "trust_requests" INTEGER NOT NULL DEFAULT 0,
  "intelligence_requests" INTEGER NOT NULL DEFAULT 0,
  "blocked_requests" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quota_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");
CREATE INDEX "plans_status_idx" ON "plans"("status");

CREATE INDEX "subscriptions_tenant_id_idx" ON "subscriptions"("tenant_id");
CREATE INDEX "subscriptions_tenant_id_status_idx" ON "subscriptions"("tenant_id", "status");
CREATE INDEX "subscriptions_expires_at_idx" ON "subscriptions"("expires_at");

CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");
CREATE INDEX "invoices_tenant_id_idx" ON "invoices"("tenant_id");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

CREATE INDEX "billing_history_tenant_id_idx" ON "billing_history"("tenant_id");
CREATE INDEX "billing_history_event_type_idx" ON "billing_history"("event_type");

CREATE INDEX "payment_attempts_tenant_id_idx" ON "payment_attempts"("tenant_id");
CREATE INDEX "payment_attempts_provider_idx" ON "payment_attempts"("provider");
CREATE INDEX "payment_attempts_status_idx" ON "payment_attempts"("status");

CREATE UNIQUE INDEX "quota_usage_tenant_id_month_key" ON "quota_usage"("tenant_id", "month");
CREATE INDEX "quota_usage_tenant_id_idx" ON "quota_usage"("tenant_id");

ALTER TABLE "plans"
  ADD CONSTRAINT "plans_created_by_tenant_id_fkey"
  FOREIGN KEY ("created_by_tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "billing_history"
  ADD CONSTRAINT "billing_history_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_attempts"
  ADD CONSTRAINT "payment_attempts_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quota_usage"
  ADD CONSTRAINT "quota_usage_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenants"
  ADD CONSTRAINT "tenants_subscription_plan_id_fkey"
  FOREIGN KEY ("subscription_plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
