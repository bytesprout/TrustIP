# PHASE 01 — FOUNDATION & ARCHITECTURE
Product: TrustIP
Repository: trustip-platform
Phase: 01
Status: ACTIVE
Priority: CRITICAL
Execution Mode: STRICT
Estimated Complexity: HIGH

---

# OBJECTIVE

Build the complete non-negotiable foundation for TrustIP.

This phase establishes the architecture contract for all future phases.

No later phase may violate this architecture.

This phase MUST deliver:

- Production-grade monorepo
- NestJS API foundation
- Next.js Admin foundation
- Docker-first development
- PostgreSQL + Prisma
- Redis
- JWT authentication
- RBAC
- Swagger/OpenAPI
- Structured logging
- Environment management
- Feature flag system
- Health monitoring
- Shared packages
- CI baseline

At the end of this phase, the platform must boot successfully locally with:

```bash
docker compose up -d
```

and expose:

```txt
API: http://localhost:8080
Admin: http://localhost:3000
Swagger: http://localhost:8080/docs
Health: http://localhost:8080/health
```

---

# NON-NEGOTIABLE ARCHITECTURE RULES

The AI agent MUST obey these rules.

## RULE 1 — NEVER BREAK PREVIOUS PHASES

Once implemented:

- never refactor destructively
- never remove APIs
- never break contracts

Backward compatibility is mandatory.

---

## RULE 2 — DOCKER FIRST

Everything must run in Docker.

Never depend on host-installed software.

All development must work using:

```bash
docker compose up
```

No exceptions.

---

## RULE 3 — STRICT TYPESCRIPT

Enable:

```json
"strict": true
```

Disallow:

```txt
any
implicit any
unsafe casts
```

Must use:

```txt
DTOs
interfaces
validation
typing
```

---

## RULE 4 — SECURITY FIRST

Must include:

- JWT auth
- refresh tokens
- RBAC
- request validation
- input sanitization
- secure cookies
- hashed credentials
- environment secrets

No plaintext secrets.

---

## RULE 5 — MULTI-TENANT READY

Even before tenants are implemented.

Architecture MUST be tenant-aware.

Prepare for:

```txt
tenant_id
query scoping
cache isolation
RBAC isolation
```

---

## RULE 6 — OBSERVABILITY MANDATORY

Every service must support:

```txt
logging
metrics
health checks
request tracing
```

---

# MANDATORY TECH STACK

## Backend

Required:

```txt
NestJS
TypeScript
Prisma ORM
PostgreSQL
Redis
BullMQ
JWT
Swagger
Class Validator
Class Transformer
Pino Logger
```

---

## Frontend

Required:

```txt
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
Zustand
React Hook Form
Zod
```

---

## Infrastructure

Required:

```txt
Docker
Docker Compose
Nginx
Let's Encrypt Ready
GitHub Actions
```

---

# REPOSITORY STRUCTURE

The AI agent MUST create EXACTLY this structure.

```txt
trustip-platform/
│
├── apps/
│   ├── api/
│   └── admin/
│
├── packages/
│   ├── shared-types/
│   ├── shared-config/
│   ├── logger/
│   └── eslint-config/
│
├── services/
│   ├── geo-engine/
│   ├── trust-engine/
│   └── dataset-updater/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── scripts/
│   └── monitoring/
│
├── docs/
│   └── phases/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── pnpm-workspace.yaml
└── README.md
```

Never deviate.

---

# PACKAGE MANAGER

MANDATORY:

```txt
pnpm
```

Do NOT use:

```txt
npm
yarn
bun
```

---

# MONOREPO TOOLING

Use:

```txt
TurboRepo
```

Required commands:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```

---

# BACKEND ARCHITECTURE

Location:

```txt
apps/api
```

Required architecture:

```txt
src/
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── health/
│   ├── config/
│   ├── feature-flags/
│   └── system/
│
├── common/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   ├── decorators/
│   ├── middleware/
│   └── dto/
│
├── config/
├── prisma/
└── main.ts
```

Use:

```txt
Clean Architecture
Feature modules
Dependency injection
```

---

# AUTHENTICATION FOUNDATION

Implement:

## Access Tokens

JWT access token.

Expiry:

```txt
15 minutes
```

---

## Refresh Tokens

Expiry:

```txt
30 days
```

Store hashed.

Never plaintext.

---

## Password Hashing

MANDATORY:

```txt
Argon2
```

Never bcrypt.

---

# RBAC FOUNDATION

Roles:

```txt
SUPER_ADMIN
TENANT_ADMIN
TENANT_MANAGER
VIEWER
```

Implement:

```txt
Role decorator
Role guard
Permission middleware
```

---

# DATABASE FOUNDATION

Database:

```txt
PostgreSQL
```

ORM:

```txt
Prisma
```

Initial models:

```txt
User
Role
Tenant
ApiKey
FeatureFlag
AuditLog
SystemConfig
```

Every table must include:

```txt
id
created_at
updated_at
```

UUID only.

No incremental IDs.

---

# REDIS FOUNDATION

Redis mandatory.

Use for:

```txt
cache
rate limiting
queues
session storage
feature flags
```

---

# ENVIRONMENT MANAGEMENT

Support:

```txt
development
staging
production
```

Files:

```txt
.env.development
.env.staging
.env.production
```

Never commit secrets.

Required env validation.

Use:

```txt
Zod validation
```

---

# FEATURE FLAGS

Create foundation.

Support:

```txt
trustEngine
billing
geoAnomaly
analytics
vpnDetection
```

Must be database driven.

---

# LOGGING STANDARD

MANDATORY:

```txt
Pino Logger
```

Every request log:

```json
{
  "requestId": "",
  "tenantId": "",
  "endpoint": "",
  "latency": 0,
  "statusCode": 200
}
```

Structured logs only.

No console.log.

---

# HEALTH CHECKS

Implement:

```http
GET /health
GET /health/db
GET /health/redis
```

Response example:

```json
{
  "healthy": true,
  "database": "healthy",
  "redis": "healthy"
}
```

---

# SWAGGER

Available at:

```txt
/docs
```

Must include:

```txt
JWT auth
examples
DTO validation
response schemas
```

---

# ADMIN FOUNDATION

Location:

```txt
apps/admin
```

Use:

```txt
App Router
Tailwind
shadcn/ui
```

Initial pages:

```txt
/login
/dashboard
/settings
```

Must support:

```txt
dark mode
responsive layout
protected routes
```

---

# DOCKER REQUIREMENTS

Required containers:

```txt
api
admin
postgres
redis
nginx
```

Must support:

```bash
docker compose up -d
```

---

# CI FOUNDATION

GitHub Actions required.

Pipeline:

```txt
lint
typecheck
build
test
docker validation
```

Block merge on failure.

---

# ACCEPTANCE CRITERIA

Phase 1 succeeds ONLY IF:

✅ Monorepo builds  
✅ Docker boots successfully  
✅ API accessible  
✅ Admin accessible  
✅ Swagger working  
✅ PostgreSQL connected  
✅ Redis connected  
✅ JWT auth working  
✅ RBAC working  
✅ Health checks working  
✅ Logging working  
✅ Prisma migrations working  

---

# REQUIRED TESTS

Must implement:

```txt
Auth tests
RBAC tests
Health endpoint tests
DB connection tests
Redis connection tests
Environment validation tests
```

Minimum coverage:

```txt
80%
```

---

# STOP CONDITIONS

STOP IMMEDIATELY if:

```txt
Docker fails
Prisma broken
Redis broken
JWT broken
RBAC broken
Swagger broken
```

Do NOT continue to Phase 2.

Fix Phase 1 first.

---

# DEFINITION OF DONE

Phase 1 is COMPLETE only when:

```txt
docker compose up -d
```

starts a fully operational TrustIP foundation with:

```txt
Healthy API
Healthy DB
Healthy Redis
JWT auth
RBAC
Swagger
Admin UI
Logging
Feature flags
CI baseline
```

No TODOs allowed.

No mocked architecture.

Production-grade only.

---

# NEXT PHASE

After completion:

```txt
PHASE_02_IP_INTELLIGENCE.md
```

DO NOT START PHASE 2 UNTIL ALL ACCEPTANCE CRITERIA PASS.