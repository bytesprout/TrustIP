-- Phase 05: Trust Engine tables

CREATE TABLE "trust_history" (
    "id"          TEXT NOT NULL,
    "tenant_id"   TEXT NOT NULL,
    "ip"          TEXT NOT NULL,
    "trust_score" INTEGER NOT NULL,
    "risk_score"  INTEGER NOT NULL,
    "decision"    TEXT NOT NULL,
    "signals"     JSONB NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trust_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trust_history_tenant_id_ip_idx" ON "trust_history"("tenant_id", "ip");

CREATE TABLE "risk_events" (
    "id"         TEXT NOT NULL,
    "tenant_id"  TEXT NOT NULL,
    "ip"         TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "severity"   TEXT NOT NULL,
    "metadata"   JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "risk_events_tenant_id_ip_idx" ON "risk_events"("tenant_id", "ip");

CREATE TABLE "geo_velocity_logs" (
    "id"               TEXT NOT NULL,
    "tenant_id"        TEXT NOT NULL,
    "ip"               TEXT NOT NULL,
    "previous_country" TEXT,
    "new_country"      TEXT NOT NULL,
    "risk_score"       INTEGER NOT NULL,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "geo_velocity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "geo_velocity_logs_tenant_id_ip_idx" ON "geo_velocity_logs"("tenant_id", "ip");

CREATE TABLE "concurrent_session_logs" (
    "id"            TEXT NOT NULL,
    "tenant_id"     TEXT NOT NULL,
    "account_id"    TEXT NOT NULL,
    "device_count"  INTEGER NOT NULL,
    "country_count" INTEGER NOT NULL,
    "risk_score"    INTEGER NOT NULL,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "concurrent_session_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "concurrent_session_logs_tenant_id_account_id_idx" ON "concurrent_session_logs"("tenant_id", "account_id");
