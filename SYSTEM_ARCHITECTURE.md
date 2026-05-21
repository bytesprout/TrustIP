# SYSTEM_ARCHITECTURE.md

Product: TrustIP  
Repository: trustip-platform  
Version: 1.0  
Status: ACTIVE  
Architecture Mode: Production  
Deployment Modes:

```txt
SaaS
Enterprise Self Hosted
```

---

# PURPOSE

This document defines the complete technical architecture of TrustIP.

This file is the architecture source of truth.

It defines:

```txt
system boundaries
request flow
service responsibilities
trust engine design
multi-tenant architecture
security architecture
cache architecture
deployment topology
scaling model
failure recovery
```

No architectural deviations allowed.

---

# HIGH LEVEL ARCHITECTURE

TrustIP is designed as:

```txt
Modular Monolith + Service Boundaries
```

Why:

```txt
simpler deployment
lower ops cost
high development velocity
future microservice ready
```

Architecture style:

```txt
domain-driven
modular
service-oriented
event-ready
multi-tenant
```

---

# HIGH LEVEL SYSTEM TOPOLOGY

```txt
                    ┌─────────────────────┐
                    │      Internet       │
                    └──────────┬──────────┘
                               │
                     ┌─────────▼─────────┐
                     │ Cloudflare (Opt.) │
                     └─────────┬─────────┘
                               │
                     ┌─────────▼─────────┐
                     │       Nginx       │
                     │ Reverse Proxy     │
                     └─────────┬─────────┘
                               │
      ┌────────────────────────┼────────────────────────┐
      │                        │                        │
┌─────▼─────┐          ┌──────▼──────┐         ┌──────▼──────┐
│ API Layer │          │ Admin Panel │         │ Monitoring  │
│ NestJS    │          │ Next.js     │         │ Observability│
└─────┬─────┘          └─────────────┘         └─────────────┘
      │
      │
┌─────▼────────────────────────────────────────────────────┐
│                  CORE DOMAIN SERVICES                    │
│                                                          │
│  Geo Engine                                              │
│  Trust Engine                                            │
│  Dataset Updater                                         │
│  Billing Engine                                          │
│  Tenant Engine                                           │
│  Analytics Engine                                        │
│                                                          │
└─────┬────────────────────────────────────────────────────┘
      │
      │
 ┌────▼────────┐       ┌────────────┐
 │ PostgreSQL  │       │ Redis      │
 │ Persistent  │       │ Cache/Queue│
 └─────────────┘       └────────────┘
```

---

# CORE COMPONENTS

TrustIP consists of:

```txt
API Layer
Admin Panel
Geo Engine
Trust Engine
Dataset Updater
Tenant Engine
Billing Engine
Analytics Engine
Monitoring Stack
```

---

# SERVICE BOUNDARIES

## 1. API LAYER

Responsibility:

```txt
request handling
authentication
tenant resolution
rate limiting
response contracts
swagger
analytics tracking
```

Technology:

```txt
NestJS
TypeScript
```

Path:

```txt
apps/api
```

Never contains:

```txt
heavy business logic
```

Delegates to:

```txt
services
domain modules
```

---

## 2. ADMIN PANEL

Responsibility:

```txt
tenant management
billing
analytics
trust insights
api key management
dataset monitoring
audit logs
```

Technology:

```txt
Next.js App Router
```

Path:

```txt
apps/admin
```

Supports:

```txt
SUPER_ADMIN
TENANT_ADMIN
TENANT_MANAGER
VIEWER
```

---

## 3. GEO ENGINE

Responsibility:

```txt
IP enrichment
Geo intelligence
ASN intelligence
reverse DNS
connection type
geo confidence
```

Inputs:

```txt
IP address
```

Outputs:

```txt
normalized geo object
```

Powered by:

```txt
GeoLite2 City
GeoLite2 ASN
```

Path:

```txt
services/geo-engine
```

---

## 4. TRUST ENGINE

Responsibility:

```txt
risk scoring
trust scoring
vpn detection
proxy detection
tor detection
hosting detection
geo anomaly
concurrency detection
```

Must remain:

```txt
deterministic
explainable
tenant configurable
```

Path:

```txt
services/trust-engine
```

---

## 5. DATASET UPDATER

Responsibility:

```txt
download datasets
validate
checksum
rollback
hot reload
versioning
```

Never causes:

```txt
downtime
```

Path:

```txt
services/dataset-updater
```

---

# REQUEST FLOW

## BASIC LOOKUP FLOW

```txt
Request
   ↓
Nginx
   ↓
API Layer
   ↓
Tenant Resolution
   ↓
API Key Validation
   ↓
Rate Limit Validation
   ↓
Redis Cache
   ↓ (miss)
Geo Engine
   ↓
Normalize
   ↓
Cache
   ↓
Response
```

Target:

```txt
<20ms
```

Cached:

```txt
<10ms
```

---

## INTELLIGENCE FLOW

```txt
Request
   ↓
Tenant Resolution
   ↓
Scope Validation
   ↓
Geo Engine
   ↓
ASN Intelligence
   ↓
RDNS
   ↓
VPN Detection
   ↓
Tor Detection
   ↓
Hosting Detection
   ↓
Threat Intelligence
   ↓
Normalize
   ↓
Response
```

---

## TRUST FLOW

```txt
Incoming IP
       ↓
Geo Engine
       ↓
VPN Detector
       ↓
Proxy Detector
       ↓
Tor Detector
       ↓
Hosting Detector
       ↓
Geo Anomaly Detector
       ↓
Concurrent Session Detector
       ↓
Historical Trust
       ↓
Weighted Scoring
       ↓
Decision Engine
       ↓
Explainability Layer
       ↓
Response
```

---

# MULTI-TENANT ARCHITECTURE

TrustIP is:

```txt
tenant isolated
```

Every request resolves:

```txt
tenant_id
```

Flow:

```txt
API Key
   ↓
Tenant Lookup
   ↓
Subscription Validation
   ↓
Domain Lock
   ↓
IP Whitelist
   ↓
Scope Validation
   ↓
Quota Validation
   ↓
Continue
```

---

# TENANT ISOLATION MODEL

Every DB query MUST include:

```sql
WHERE tenant_id = ?
```

Redis keys:

```txt
tenant:{tenantId}:*
```

Example:

```txt
tenant:abc123:ip:trust:1.1.1.1
```

Forbidden:

```txt
shared cache
cross tenant joins
global queries
```

unless:

```txt
SUPER_ADMIN
```

---

# DATABASE ARCHITECTURE

Database:

```txt
PostgreSQL
```

ORM:

```txt
Prisma
```

Strategy:

```txt
shared DB
tenant scoped tables
```

Reason:

```txt
simpler scaling
lower cost
high performance
```

---

## CORE TABLES

Identity:

```txt
users
roles
permissions
sessions
```

Tenant:

```txt
tenants
api_keys
tenant_domains
tenant_ip_whitelist
tenant_feature_flags
```

Trust:

```txt
trust_history
risk_events
geo_velocity_logs
concurrent_session_logs
```

Billing:

```txt
plans
subscriptions
invoices
billing_history
```

Analytics:

```txt
api_usage_logs
usage_metrics
```

Dataset:

```txt
dataset_registry
dataset_update_logs
```

---

# REDIS ARCHITECTURE

Redis responsibilities:

```txt
cache
queues
rate limiting
feature flags
request throttling
```

Queue system:

```txt
BullMQ
```

Queues:

```txt
dataset-updater
analytics
cleanup
notifications
```

---

## CACHE STRATEGY

### Basic Lookup

TTL:

```txt
24 hours
```

Key:

```txt
tenant:{tenantId}:ip:basic:{ip}
```

---

### Trust Lookup

TTL:

```txt
30 minutes
```

Key:

```txt
tenant:{tenantId}:ip:trust:{ip}
```

---

### Feature Flags

TTL:

```txt
5 minutes
```

---

# SECURITY ARCHITECTURE

Security layers:

```txt
Nginx
Rate Limiting
Helmet
DTO Validation
JWT
RBAC
Tenant Isolation
Audit Logs
```

---

## AUTH FLOW

User auth:

```txt
JWT access token
refresh token
rotation
expiry
```

API auth:

```http
x-api-key
```

Enterprise:

```http
Bearer Token
```

---

## PASSWORD SECURITY

Hashing:

```txt
Argon2
```

Never:

```txt
bcrypt
plaintext
```

---

# TRUST ENGINE SCORING MODEL

Scoring:

```txt
0–100
```

Signals:

```txt
VPN
Proxy
Tor
Hosting
Geo anomaly
Concurrency
Threat intel
Historical trust
```

Rules:

```txt
weighted
deterministic
tenant configurable
```

Never:

```txt
single signal blocking
```

---

# DATASET ARCHITECTURE

Supported datasets:

```txt
GeoLite2 City
GeoLite2 ASN
FireHOL
Tor Exit Nodes
VPN Intelligence
```

Update flow:

```txt
download
 ↓
checksum
 ↓
validate
 ↓
staging
 ↓
swap
 ↓
reload
```

Rollback automatic.

---

# OBSERVABILITY ARCHITECTURE

Stack:

```txt
Prometheus
Grafana
Loki
OpenTelemetry
```

Tracks:

```txt
latency
errors
tenant metrics
cache hit ratio
trust metrics
billing metrics
infrastructure metrics
```

---

# HEALTH MODEL

Endpoints:

```http
/health
/health/db
/health/redis
/health/datasets
/health/trust-engine
```

Failure:

```txt
alert
rollback
graceful degradation
```

---

# DEPLOYMENT TOPOLOGY

Production:

```txt
Cloudflare (optional)
       ↓
Nginx
       ↓
Docker Containers
```

Containers:

```txt
api
admin
postgres
redis
trust-engine
geo-engine
dataset-updater
prometheus
grafana
loki
worker
```

---

# SCALING MODEL

API:

```txt
horizontal scaling
stateless
```

Shared:

```txt
Redis
PostgreSQL
```

Future ready:

```txt
Kubernetes
regional deployments
```

---

# FAILURE RECOVERY

Redis failure:

```txt
degraded mode
fallback logic
```

Dataset corruption:

```txt
rollback
```

Deployment failure:

```txt
automatic rollback
```

DB failure:

```txt
health fail
alerts
safe recovery
```

---

# PERFORMANCE TARGETS

Required:

```txt
P50 < 20ms
P95 < 100ms
99.9% uptime
```

Capacity:

```txt
10k requests/minute
1000+ tenants
```

---

# FINAL ARCHITECTURE RULES

TrustIP MUST remain:

```txt
modular
multi-tenant
secure
observable
deterministic
backward compatible
production-grade
```

Never:

```txt
break contracts
break tenant isolation
hardcode secrets
add destructive migrations
introduce architectural drift
```