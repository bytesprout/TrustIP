# TrustIP

Production-grade IP Intelligence, Trust Scoring & Anti-Abuse Platform.

TrustIP is a multi-tenant SaaS and enterprise-ready platform for:

- IP intelligence
- geo intelligence
- VPN detection
- proxy detection
- Tor detection
- hosting detection
- trust scoring
- IPTV anti-abuse
- geo anomaly detection
- concurrent abuse detection
- API monetization

Built for:

```txt
SaaS
Enterprise Self-Hosted
Cybersecurity
IPTV Platforms
Fraud Prevention
Risk Analysis
Geo Intelligence
```

---

# Why TrustIP?

TrustIP provides a production-grade alternative to expensive third-party IP intelligence providers while remaining:

```txt
Open Source Ready
Self Hosted
Privacy Friendly
High Performance
Multi-Tenant
Enterprise Ready
```

Unlike traditional IP lookup services, TrustIP includes:

```txt
Trust Scoring
Risk Analysis
VPN Intelligence
Hosting Detection
Geo Velocity Detection
Concurrent Abuse Detection
IPTV Anti-Sharing Signals
Tenant APIs
Admin Dashboard
Billing Engine
```

---

# Key Features

## IP Intelligence

Provides:

```txt
Country
Region
State
District
City
Zip
Timezone
Latitude
Longitude
ASN
ISP
Organization
Network CIDR
Reverse DNS
Geo Confidence
```

Powered by:

```txt
GeoLite2
ASN Intelligence
FireHOL
Tor Datasets
Open Source VPN Intelligence
```

---

## Trust & Risk Engine

TrustIP evaluates:

```txt
VPN risk
Proxy risk
Tor risk
Hosting risk
Geo anomaly
Concurrent abuse
Historical trust
Threat intelligence
```

Outputs:

```json
{
  "trustScore": 92,
  "riskScore": 8,
  "decision": "ALLOW"
}
```

Supported decisions:

```txt
ALLOW
WARN
CHALLENGE
TEMP_BLOCK
BLOCK
```

---

## IPTV Anti-Abuse

Designed specifically for IPTV providers.

Detect:

```txt
account sharing
VPN abuse
multi-country access
impossible travel
datacenter streaming
suspicious concurrency
```

---

## Multi-Tenant SaaS

Supports:

```txt
1000+ tenants
```

Features:

```txt
API key management
Scopes
Domain locking
IP whitelisting
Rate limits
Quotas
Analytics retention
Billing
Feature flags
```

---

## SaaS + Enterprise Mode

### SaaS Mode

Multi-tenant platform.

```env
APP_MODE=saas
```

---

### Enterprise Mode

Single tenant internal deployment.

```env
APP_MODE=enterprise
```

Enterprise mode includes:

```txt
simplified UI
no billing
optional API auth
unlimited quotas
```

---

# Architecture Overview

```txt
Internet
    ↓
Cloudflare (Optional)
    ↓
Nginx Reverse Proxy
    ↓
TrustIP Platform
    ├── API
    ├── Admin Panel
    ├── Geo Engine
    ├── Trust Engine
    ├── Dataset Updater
    ├── Redis
    ├── PostgreSQL
    ├── Monitoring
    └── Workers
```

---

# Technology Stack

## Backend

```txt
NestJS
TypeScript
Prisma ORM
PostgreSQL
Redis
BullMQ
JWT
Swagger
Pino
OpenTelemetry
```

---

## Frontend

```txt
Next.js App Router
TypeScript
TailwindCSS
shadcn/ui
TanStack Query
Zustand
Recharts
React Hook Form
Framer Motion
```

---

## Infrastructure

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

# Repository Structure

```txt
trustip-platform/
│
├── AGENTS.md
├── README.md
├── SYSTEM_ARCHITECTURE.md
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
│
├── tests/
│
└── docs/
    └── phases/
```

---

# API Endpoints

## Basic Lookup

```http
GET /api/v1/ip/basic
```

Optional:

```http
GET /api/v1/ip/basic?ip=8.8.8.8
```

Returns:

```txt
Basic geo intelligence
```

---

## Intelligence Lookup

```http
GET /api/v1/ip/intelligence
```

Returns:

```txt
Geo
ISP
ASN
VPN
Hosting
Tor
Threat intelligence
Confidence
```

---

## Trust Score

```http
GET /api/v1/ip/trust-score
```

Returns:

```txt
trust score
risk score
decision
signals
reasons
```

---

# Authentication

Required header:

```http
x-api-key: YOUR_API_KEY
```

Enterprise mode supports:

```http
Authorization: Bearer TOKEN
```

---

# API Scopes

Supported scopes:

```txt
basic_lookup
intelligence_lookup
trust_lookup
admin_lookup
analytics_lookup
```

---

# Development Setup

## Requirements

Install:

```txt
Docker
Docker Compose
pnpm
```

---

## Clone Repository

```bash
git clone https://github.com/your-org/trustip-platform.git

cd trustip-platform
```

---

## Environment Setup

Copy:

```bash
cp .env.example .env.development
```

Configure:

```env
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
APP_MODE=saas
```

---

## Start Development

```bash
docker compose up -d
```

Expected:

```txt
API → http://localhost:8080
Admin → http://localhost:3000
Swagger → http://localhost:8080/docs
Health → http://localhost:8080/health
```

---

# Docker Commands

Start:

```bash
docker compose up -d
```

Stop:

```bash
docker compose down
```

Logs:

```bash
docker compose logs -f
```

Rebuild:

```bash
docker compose up -d --build
```

---

# Environments

Supported:

## Development

```env
APP_ENV=development
```

---

## Staging

```env
APP_ENV=staging
```

---

## Production

```env
APP_ENV=production
```

---

# Monitoring

Built-in observability:

```txt
Prometheus
Grafana
Loki
OpenTelemetry
```

Health endpoints:

```http
/health
/health/db
/health/redis
/health/datasets
```

---

# Security

TrustIP enforces:

```txt
JWT auth
RBAC
Argon2 password hashing
API key hashing
Rate limiting
Input validation
Structured logging
Tenant isolation
```

---

# Testing

Run tests:

```bash
pnpm test
```

Coverage:

```txt
80% minimum
100% critical services
```

Includes:

```txt
Unit
Integration
Contract
E2E
Security
Performance
Chaos
```

---

# Deployment

Supports:

```txt
AWS
DigitalOcean
Hetzner
Bare Metal
Docker VPS
Ubuntu 24.04+
```

Production:

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

# CI/CD

GitHub Actions pipeline:

```txt
lint
typecheck
tests
docker validation
build
deploy
rollback
```

Merge blocked if:

```txt
tests fail
contracts break
security fails
coverage low
```

---

# Roadmap

Planned support:

```txt
IPv6 intelligence
AI risk scoring
device fingerprinting
real-time alerts
webhooks
GraphQL APIs
Kubernetes
regional deployments
```

---

# Documentation

Core docs:

```txt
AGENTS.md
SYSTEM_ARCHITECTURE.md
docs/phases/
```

Implementation order:

```txt
PHASE_01_FOUNDATION
PHASE_02_IP_INTELLIGENCE
PHASE_03_DATASET_UPDATER
PHASE_04_APIS
PHASE_05_TRUST_ENGINE
PHASE_06_MULTI_TENANT
PHASE_07_BILLING
PHASE_08_ADMIN_PANEL
PHASE_09_SECURITY_MONITORING
PHASE_10_DEPLOYMENT
PHASE_11_TESTING
PHASE_12_PRODUCTION
```

---

# License

Private / Commercial by default.

Open-source licensing optional.

---

# TrustIP

```txt
Production-grade IP Intelligence & Trust Scoring Platform
```