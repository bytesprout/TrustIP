# PHASE 02 — IP INTELLIGENCE ENGINE
Product: TrustIP
Repository: trustip-platform
Phase: 02
Status: ACTIVE
Priority: CRITICAL
Execution Mode: STRICT
Estimated Complexity: HIGH

---

# OBJECTIVE

Build the production-grade IP Intelligence Engine for TrustIP.

This phase introduces:

- IP enrichment
- Geo intelligence
- ASN intelligence
- ISP intelligence
- Reverse DNS
- Hosting detection
- Geo confidence scoring
- Redis caching
- Normalized response contracts

At the end of this phase, TrustIP must support:

```http
GET /api/v1/ip/basic
GET /api/v1/ip/basic?ip=8.8.8.8
```

with caller IP fallback support.

Latency target:

```txt
Cached Lookup < 10ms
Fresh Lookup < 50ms
```

---

# PHASE DEPENDENCY

MANDATORY:

Phase 01 MUST be fully complete.

Validate:

✅ Docker healthy  
✅ PostgreSQL healthy  
✅ Redis healthy  
✅ JWT working  
✅ RBAC working  
✅ Swagger working  

If ANY Phase 01 requirement fails:

```txt
STOP
DO NOT CONTINUE
```

---

# NON-NEGOTIABLE RULES

## RULE 1 — NEVER BREAK PHASE 01

Do not modify:

```txt
auth
RBAC
docker
swagger
logging
shared architecture
```

Only extend.

Never refactor destructively.

---

## RULE 2 — CACHE FIRST

Every lookup MUST check Redis first.

Flow:

```txt
Request
 ↓
Redis Cache
 ↓
Geo Engine
 ↓
Cache Result
 ↓
Response
```

No exceptions.

---

## RULE 3 — NORMALIZED OUTPUTS

Never expose raw GeoLite2 output.

Must normalize into:

```txt
TrustIP JSON contracts
```

---

## RULE 4 — LOW LATENCY

Design for:

```txt
10k+ requests/minute
```

Must avoid blocking calls.

Everything async.

---

# OPEN SOURCE DATA SOURCES

MANDATORY:

## Geo Intelligence

Use:

- GeoLite2 City
- GeoLite2 ASN

Database format:

```txt
.mmdb
```

Local only.

Never use third-party APIs.

---

## Reverse DNS

Use:

```txt
native DNS resolver
```

Timeout:

```txt
1000ms max
```

Never block request.

If fails:

```txt
return null
```

---

# REQUIRED SERVICE STRUCTURE

Create EXACT structure:

```txt
services/
└── geo-engine/
    ├── src/
    │   ├── services/
    │   │   ├── geo.service.ts
    │   │   ├── asn.service.ts
    │   │   ├── rdns.service.ts
    │   │   ├── confidence.service.ts
    │   │   ├── cache.service.ts
    │   │   └── ip-validator.service.ts
    │   │
    │   ├── dto/
    │   ├── interfaces/
    │   ├── constants/
    │   └── utils/
```

Never deviate.

---

# DATASET STORAGE

Create structure:

```txt
/data
   /datasets
      /geolite
         GeoLite2-City.mmdb
         GeoLite2-ASN.mmdb
```

Must support:

```txt
hot reload ready
```

for future updates.

---

# DATABASE TABLES

Add:

## ip_lookup_logs

Purpose:

```txt
analytics
performance monitoring
debugging
```

Fields:

```txt
id
tenant_id
ip
country
city
asn
cache_hit
latency_ms
endpoint
created_at
```

---

# API ENDPOINTS

## 1. BASIC LOOKUP API

Endpoint:

```http
GET /api/v1/ip/basic
```

Optional:

```http
GET /api/v1/ip/basic?ip=8.8.8.8
```

Purpose:

```txt
Fast lookup
Low latency
Basic geo information
```

---

# IP RESOLUTION PRIORITY

If query param missing:

Resolve client IP using:

```txt
1. cf-connecting-ip
2. x-forwarded-for
3. x-real-ip
4. socket.remoteAddress
```

Must support:

```txt
Cloudflare
Nginx
Load balancer
Docker
```

---

# BASIC RESPONSE CONTRACT

MANDATORY:

```json
{
  "success": true,
  "timestamp": "2026-05-21T12:30:00Z",

  "ip": {
    "address": "49.xx.xx.xx",
    "version": "IPv4"
  },

  "location": {
    "continent": "Asia",
    "country": "India",
    "countryCode": "IN",
    "state": "Kerala",
    "district": "Ernakulam",
    "city": "Kochi",
    "zip": "682001",
    "timezone": "Asia/Kolkata",
    "latitude": 9.9312,
    "longitude": 76.2673,
    "geoAccuracyRadiusKm": 25
  },

  "network": {
    "isp": "Reliance Jio",
    "organization": "Reliance Jio Infocomm Ltd",
    "asn": 55836,
    "network": "49.xx.xx.0/24"
  },

  "metadata": {
    "cacheHit": true,
    "lookupTimeMs": 8
  }
}
```

Response contract is FROZEN.

Do not change later.

Backward compatibility mandatory.

---

# GEO ENGINE FLOW

```txt
Request
   ↓
Validate IP
   ↓
Redis Cache
   ↓
GeoLite2 City Lookup
   ↓
GeoLite2 ASN Lookup
   ↓
Reverse DNS
   ↓
Geo Confidence Score
   ↓
Normalize
   ↓
Redis Cache
   ↓
Response
```

---

# GEO INTELLIGENCE FIELDS

MANDATORY:

```txt
continent
country
countryCode
state
district
city
zip
timezone
latitude
longitude
accuracy radius
```

Must gracefully handle missing data.

Never crash.

Return:

```json
null
```

when unavailable.

---

# ASN INTELLIGENCE

MANDATORY:

Return:

```txt
asn
isp
organization
network cidr
connection type
```

Connection types:

```txt
RESIDENTIAL
MOBILE
BUSINESS
HOSTING
UNKNOWN
```

---

# CONNECTION TYPE CLASSIFIER

Implement:

```txt
isp-classifier.service.ts
```

Purpose:

Classify ISP.

Examples:

```txt
Jio → RESIDENTIAL
Airtel → RESIDENTIAL
AWS → HOSTING
DigitalOcean → HOSTING
Azure → HOSTING
```

Must be extendable.

Use config-driven rules.

---

# REVERSE DNS

Create:

```txt
rdns.service.ts
```

Requirements:

```txt
timeout safe
non-blocking
graceful failure
```

Example:

```json
{
  "reverseDns": "49-205-xx.jio.com"
}
```

If unavailable:

```json
{
  "reverseDns": null
}
```

---

# GEO CONFIDENCE ENGINE

Create:

```txt
confidence.service.ts
```

Purpose:

Estimate geo confidence.

Scoring factors:

```txt
accuracy radius
known ISP
ASN reliability
hosting provider
region certainty
```

Scoring:

```txt
0–39 LOW
40–69 MEDIUM
70–100 HIGH
```

Response:

```json
{
  "geoConfidence": {
    "score": 87,
    "level": "HIGH"
  }
}
```

---

# REDIS CACHE STRATEGY

Cache keys:

```txt
tenant:{tenantId}:ip:basic:{ip}
```

TTL:

```txt
24 hours
```

Must support:

```txt
cache invalidation
future hot reload
```

---

# ERROR CONTRACTS

MANDATORY:

## Invalid IP

```json
{
  "success": false,
  "error": {
    "code": "INVALID_IP",
    "message": "Invalid IP address"
  }
}
```

---

## Internal Failure

```json
{
  "success": false,
  "error": {
    "code": "LOOKUP_FAILED",
    "message": "Unable to process IP lookup"
  }
}
```

Error contracts are frozen.

---

# SWAGGER REQUIREMENTS

Must include:

```txt
endpoint examples
response examples
error examples
query param docs
auth requirements
```

Swagger path:

```txt
/docs
```

---

# PERFORMANCE TARGETS

MANDATORY:

```txt
P50 < 20ms
P95 < 50ms
Cache hit < 10ms
```

Support:

```txt
10,000 requests/minute
```

---

# REQUIRED TESTS

Mandatory:

## Unit Tests

Test:

```txt
geo lookup
asn lookup
ip validator
reverse DNS
cache behavior
confidence scoring
connection classifier
```

---

## Integration Tests

Test:

```txt
Redis cache
GeoLite2 DB
endpoint response
query param support
caller IP fallback
```

---

## Contract Tests

Validate:

```txt
JSON response never changes
```

Breaking response changes:

```txt
BLOCK MERGE
```

---

# ACCEPTANCE CRITERIA

Phase 02 succeeds ONLY IF:

✅ `/api/v1/ip/basic` works  
✅ custom IP lookup works  
✅ caller IP fallback works  
✅ GeoLite2 integrated  
✅ ASN lookup working  
✅ Redis cache working  
✅ Reverse DNS working  
✅ Geo confidence working  
✅ Swagger updated  
✅ tests passing  
✅ latency targets achieved  

---

# STOP CONDITIONS

STOP IMMEDIATELY if:

```txt
Redis cache broken
GeoLite2 broken
Response contract changed
Latency exceeds target
Swagger broken
```

Do NOT continue.

Fix Phase 02 first.

---

# DEFINITION OF DONE

Phase 02 is COMPLETE only when:

```http
GET /api/v1/ip/basic
```

returns fully enriched production-grade geo intelligence with:

```txt
Geo
ASN
ISP
Connection Type
RDNS
Confidence
Caching
Logging
Testing
Swagger
```

No mocked responses.

No fake data.

Production-grade only.

---

# NEXT PHASE

After completion:

```txt
PHASE_03_DATASET_UPDATER.md
```

DO NOT START PHASE 03 UNTIL ALL ACCEPTANCE CRITERIA PASS.