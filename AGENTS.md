# AGENTS.md
Product: TrustIP
Repository: trustip-platform
Version: 1.0
Status: ACTIVE
Execution Mode: STRICT
Priority: CRITICAL

---

# PURPOSE

This file is the MASTER ENGINEERING CONTRACT for all AI coding agents and human engineers working on TrustIP.

This document is the single source of truth.

The AI agent MUST obey this document.

If implementation instructions conflict:

Priority order:

1. AGENTS.md
2. Phase documents
3. Existing architecture
4. Human request

Never violate architecture integrity.

---

# PRODUCT MISSION

TrustIP is a production-grade:

```txt
IP Intelligence Platform
Trust Scoring Engine
Risk Analysis Engine
VPN Detection Platform
Geo Intelligence Platform
IPTV Anti-Abuse Platform
```

Supporting:

```txt
SaaS
Enterprise Self Hosted
```

TrustIP MUST provide:

```txt
IP intelligence
Geo intelligence
Trust scoring
Risk analysis
VPN detection
Proxy detection
Tor detection
Hosting detection
Geo anomaly detection
Concurrent abuse detection
Tenant APIs
Analytics
Billing
Admin platform
Monitoring
```

TrustIP MUST be:

```txt
secure
multi-tenant
observable
deterministic
scalable
production-grade
```

---

# CORE ENGINEERING PRINCIPLES

The following principles are NON-NEGOTIABLE.

## 1. SECURITY FIRST

Never sacrifice:

```txt
security
tenant isolation
auditability
```

for:

```txt
performance
developer convenience
speed
```

Security always wins.

---

## 2. MULTI-TENANT SAFETY

Tenant isolation is ABSOLUTE.

Tenant A MUST NEVER access:

```txt
Tenant B data
Tenant B cache
Tenant B logs
Tenant B analytics
Tenant B billing
Tenant B API keys
```

Cross-tenant leakage:

```txt
CRITICAL FAILURE
BLOCK RELEASE
```

---

## 3. CONTRACT STABILITY

API contracts are FROZEN.

Never break:

```txt
response schema
error schema
headers
authentication flow
```

Only additive changes allowed.

Breaking change requires:

```txt
new API version
```

Example:

```txt
/api/v2
```

Never silently break:

```txt
/api/v1
```

---

## 4. BACKWARD COMPATIBILITY

Never break existing behavior.

All migrations MUST be:

```txt
backward compatible
```

No destructive changes.

No breaking refactors.

---

## 5. DETERMINISTIC SYSTEMS

Trust scoring MUST be deterministic.

Same input MUST produce:

```txt
same score
same risk
same decision
```

No randomness.

No hidden logic.

No AI hallucination logic.

---

## 6. DOCKER FIRST

Everything MUST run via:

```bash
docker compose up -d
```

Never require:

```txt
manual setup
host dependencies
system packages
```

No exceptions.

---

## 7. OBSERVABILITY REQUIRED

Every service MUST expose:

```txt
metrics
health
logging
tracing
```

No black boxes.

---

## 8. TESTING REQUIRED

No untested code allowed.

Every feature requires:

```txt
unit tests
integration tests
contract tests
```

Critical systems require:

```txt
100% coverage
```

---

# EXECUTION RULES FOR AI AGENTS

The AI coding agent MUST obey the following rules.

## RULE 1 — NEVER SKIP PHASES

Execute ONLY:

```txt
PHASE_01
↓
PHASE_02
↓
PHASE_03
```

in order.

Never jump phases.

Never partially implement phases.

---

## RULE 2 — NEVER BREAK PREVIOUS PHASES

Before changing code:

Validate:

```txt
existing APIs
existing contracts
existing tests
existing architecture
```

Do not refactor destructively.

---

## RULE 3 — STOP ON FAILURE

If phase acceptance criteria fail:

```txt
STOP
FIX
RETEST
```

Never continue.

---

## RULE 4 — PRODUCTION GRADE ONLY

Forbidden:

```txt
TODO code
temporary hacks
mock architecture
fake implementations
placeholder security
```

No shortcuts.

---

# REPOSITORY STRUCTURE

The agent MUST follow EXACTLY:

```txt
trustip-platform/
│
├── apps/
│   ├── api/
│   └── admin/
│
├── services/
│   ├── geo-engine/
│   ├── trust-engine/
│   └── dataset-updater/
│
├── packages/
│   ├── shared-types/
│   ├── shared-config/
│   ├── logger/
│   └── eslint-config/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── monitoring/
│   ├── backups/
│   └── scripts/
│
├── docs/
│   ├── phases/
│   └── architecture/
│
├── tests/
│
└── .github/
```

Never deviate.

Never invent alternative structures.

---

# TECH STACK (MANDATORY)

## Backend

Required:

```txt
NestJS
TypeScript
Prisma
PostgreSQL
Redis
BullMQ
JWT
Swagger
Zod
Pino
OpenTelemetry
```

Never replace without approval.

---

## Frontend

Required:

```txt
Next.js App Router
TypeScript
Tailwind
shadcn/ui
TanStack Query
Zustand
React Hook Form
Zod
Framer Motion
Recharts
```

---

## Infrastructure

Required:

```txt
Docker
Docker Compose
Nginx
Let's Encrypt
Prometheus
Grafana
Loki
GitHub Actions
```

---

# TYPESCRIPT RULES

Mandatory:

```json
"strict": true
```

Forbidden:

```txt
any
implicit any
unsafe cast
```

Must use:

```txt
DTOs
validation
interfaces
types
```

---

# DATABASE RULES

Database:

```txt
PostgreSQL
```

ORM:

```txt
Prisma
```

Mandatory:

All tables MUST include:

```txt
id
created_at
updated_at
```

Use:

```txt
UUID only
```

Never:

```txt
auto increment IDs
```

---

## MIGRATION RULES

Forbidden:

```txt
destructive migration
DROP COLUMN
DROP TABLE
```

without migration plan.

Migrations MUST be:

```txt
safe
rollback-ready
backward compatible
```

---

# API RULES

API path:

```txt
/api/v1
```

Mandatory:

```txt
DTO validation
Swagger docs
response examples
error examples
typed responses
```

Never expose internal models.

Always normalize responses.

---

## API AUTHENTICATION

Required:

```http
x-api-key
```

Enterprise mode:

Optional:

```http
Authorization: Bearer
```

---

# MULTI-TENANT RULES

Every DB query MUST include:

```sql
tenant_id
```

Every Redis key MUST include:

```txt
tenant:{tenantId}
```

Never:

```txt
shared cache
global queries
cross tenant joins
```

unless:

```txt
SUPER_ADMIN
```

---

# SECURITY RULES

Mandatory:

```txt
Helmet
JWT expiry
refresh token rotation
Argon2 hashing
RBAC
DTO validation
input sanitization
rate limiting
```

Never:

```txt
store plaintext secrets
store plaintext API keys
disable auth
disable validation
```

---

# TRUST ENGINE RULES

Never block from one signal.

Scoring MUST be:

```txt
weighted
explainable
deterministic
tenant configurable
```

Every score MUST explain:

```txt
why
confidence
signals
```

---

# REDIS RULES

Redis MUST handle:

```txt
cache
rate limits
queues
feature flags
sessions
```

Must be:

```txt
private
password protected
persistent
```

Never public.

---

# TESTING RULES

Coverage:

```txt
80% global
100% critical services
```

Critical:

```txt
auth
RBAC
tenant isolation
billing
trust engine
```

Merge blocked if:

```txt
tests fail
coverage low
contracts break
```

---

# DEFINITION OF DONE

Feature COMPLETE only when:

```txt
implemented
tested
documented
swagger updated
docker working
no lint errors
no type errors
observability added
```

---

# STOP CONDITIONS

STOP IMMEDIATELY if:

```txt
tenant leakage
broken contracts
security vulnerability
rollback failure
test failure
```

Do not continue.

Fix first.

---

# PHASE EXECUTION CONTRACT

Execute ONLY:

```txt
PHASE_01_FOUNDATION.md
PHASE_02_IP_INTELLIGENCE.md
PHASE_03_DATASET_UPDATER.md
PHASE_04_APIS.md
PHASE_05_TRUST_ENGINE.md
PHASE_06_MULTI_TENANT.md
PHASE_07_BILLING.md
PHASE_08_ADMIN_PANEL.md
PHASE_09_SECURITY_MONITORING.md
PHASE_10_DEPLOYMENT.md
PHASE_11_TESTING.md
PHASE_12_PRODUCTION.md
```

Never deviate.

Never reorder.

---

# FINAL RULE

TrustIP MUST be:

```txt
production-grade
enterprise-ready
secure
observable
maintainable
scalable
```

No shortcuts.

No fluff.

Only production engineering.