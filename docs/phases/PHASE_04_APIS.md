# PHASE 04 — API LAYER & RESPONSE CONTRACTS
Product: TrustIP
Repository: trustip-platform
Phase: 04
Status: ACTIVE
Priority: CRITICAL
Execution Mode: STRICT
Estimated Complexity: VERY HIGH

---

# OBJECTIVE

Build the production-grade TrustIP API layer.

This phase introduces:

- Public API endpoints
- Tenant-aware middleware
- API authentication
- API scopes
- Request validation
- Response contracts
- API analytics tracking
- Rate-limit headers
- Swagger completion
- API versioning

This phase MUST expose:

```http
GET /api/v1/ip/basic
GET /api/v1/ip/intelligence
GET /api/v1/ip/trust-score
```

All APIs must support:

```txt
caller IP lookup
custom IP lookup
multi-tenant validation
API key auth
scope validation
analytics tracking
```

---

# PHASE DEPENDENCY

MANDATORY:

Phase 01 MUST PASS.

Phase 02 MUST PASS.

Phase 03 MUST PASS.

Validate:

✅ JWT auth working  
✅ RBAC working  
✅ Geo engine healthy  
✅ Dataset updater healthy  
✅ Redis healthy  
✅ Swagger healthy  

If any fail:

```txt
STOP
DO NOT CONTINUE
```

---

# NON-NEGOTIABLE RULES

## RULE 1 — RESPONSE CONTRACTS ARE FROZEN

Once implemented:

```txt
DO NOT BREAK RESPONSE JSON
```

Only additive changes allowed.

Backward compatibility mandatory.

---

## RULE 2 — TENANT FIRST

Every request MUST resolve tenant.

No anonymous access.

All APIs require:

```http
x-api-key
```

unless enterprise override enabled.

---

## RULE 3 — API VERSIONING

Mandatory:

```txt
/api/v1
```

Never expose:

```txt
/api/basic
```

Future versions:

```txt
/api/v2
```

must not break v1.

---

## RULE 4 — LOW LATENCY

Targets:

```txt
Basic API < 20ms
Intelligence API < 50ms
Trust API < 50ms
```

Cached:

```txt
< 10ms
```

---

# API ARCHITECTURE

Create EXACT structure:

```txt
apps/api/src/modules/ip/
│
├── controllers/
│   ├── basic.controller.ts
│   ├── intelligence.controller.ts
│   └── trust.controller.ts
│
├── services/
│   ├── ip.service.ts
│   ├── analytics.service.ts
│   ├── tenant-validation.service.ts
│   ├── scope-validation.service.ts
│   └── response-builder.service.ts
│
├── dto/
├── guards/
├── interfaces/
└── constants/
```

Never deviate.

---

# AUTHENTICATION

Mandatory header:

```http
x-api-key: YOUR_API_KEY
```

Optional enterprise mode:

```http
Authorization: Bearer JWT
```

Validate:

```txt
tenant enabled
subscription active
api key active
key expiry
scope access
quota
rate limits
```

Failure:

```txt
deny request
```

---

# API SCOPES

Supported:

```txt
basic_lookup
intelligence_lookup
trust_lookup
admin_lookup
analytics_lookup
```

Examples:

## Basic API

Required:

```txt
basic_lookup
```

---

## Intelligence API

Required:

```txt
intelligence_lookup
```

---

## Trust API

Required:

```txt
trust_lookup
```

---

# TENANT RESOLUTION FLOW

Mandatory flow:

```txt
Request
   ↓
Resolve API Key
   ↓
Resolve Tenant
   ↓
Validate Subscription
   ↓
Validate Scope
   ↓
Validate Rate Limit
   ↓
Validate Domain Lock
   ↓
Validate IP Whitelist
   ↓
Continue
```

No bypass.

---

# DOMAIN LOCKING

Support:

## Disabled

No restriction.

---

## Strict

Allowed:

```txt
api.customer.com
dashboard.customer.com
```

---

## Wildcard

Example:

```txt
*.customer.com
```

Validation sources:

```txt
Origin
Referer
```

---

# IP WHITELIST

Support:

```txt
single IP
CIDR
```

Examples:

```txt
129.212.245.151
129.212.245.0/24
```

Modes:

```txt
STRICT
DISABLED
```

---

# API 01 — BASIC LOOKUP

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
Fast geo lookup
```

---

# BASIC RESPONSE CONTRACT

FROZEN CONTRACT:

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
    "organization": "Reliance Jio",
    "asn": 55836,
    "connectionType": "RESIDENTIAL"
  },

  "metadata": {
    "cacheHit": true,
    "lookupTimeMs": 8
  }
}
```

Never break.

---

# API 02 — INTELLIGENCE LOOKUP

Endpoint:

```http
GET /api/v1/ip/intelligence
```

Optional:

```http
GET /api/v1/ip/intelligence?ip=8.8.8.8
```

Purpose:

```txt
Full IP enrichment
```

Must include:

```txt
Geo
ASN
ISP
RDNS
Hosting
VPN
Tor
Threat intelligence
Confidence
```

---

# INTELLIGENCE RESPONSE CONTRACT

FROZEN:

```json
{
  "success": true,
  "timestamp": "2026-05-21T12:30:00Z",

  "request": {
    "queryIp": "49.xx.xx.xx",
    "lookupType": "caller_ip",
    "tenantId": "tenant_123"
  },

  "ip": {
    "address": "49.xx.xx.xx",
    "version": "IPv4",
    "network": "49.xx.xx.0/24",
    "reverseDns": "49-205.jio.com"
  },

  "location": {
    "continent": "Asia",
    "country": "India",
    "countryCode": "IN",
    "state": "Kerala",
    "district": "Ernakulam",
    "city": "Kochi",
    "zip": "682001",
    "latitude": 9.9312,
    "longitude": 76.2673,
    "timezone": "Asia/Kolkata",
    "geoAccuracyRadiusKm": 25,
    "confidenceScore": 87
  },

  "network": {
    "isp": "Reliance Jio",
    "organization": "Jio",
    "asn": 55836,
    "connectionType": "RESIDENTIAL",
    "isHostingProvider": false
  },

  "privacy": {
    "vpn": false,
    "proxy": false,
    "tor": false,
    "hosting": false
  },

  "security": {
    "threatLevel": "LOW",
    "blacklisted": false,
    "abuseConfidence": 2
  },

  "metadata": {
    "cacheHit": true,
    "lookupTimeMs": 15
  }
}
```

Frozen.

---

# API 03 — TRUST SCORE

Endpoint:

```http
GET /api/v1/ip/trust-score
```

Optional:

```http
GET /api/v1/ip/trust-score?ip=8.8.8.8
```

Purpose:

```txt
Fast trust evaluation
```

---

# TRUST RESPONSE CONTRACT

FROZEN:

```json
{
  "success": true,
  "ip": "49.xx.xx.xx",

  "trust": {
    "trustScore": 92,
    "riskScore": 8,
    "decision": "ALLOW",
    "confidence": "HIGH",

    "reasons": [
      "Residential ISP",
      "No VPN",
      "No abuse indicators"
    ]
  }
}
```

---

# RATE LIMIT HEADERS

Mandatory:

```http
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

Example:

```http
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4980
```

---

# ANALYTICS TRACKING

Track:

```txt
tenant_id
endpoint
ip queried
country
latency
cache hit
response code
request time
```

Create:

```txt
api_usage_logs
```

Fields:

```txt
id
tenant_id
endpoint
ip
country
status_code
latency_ms
cache_hit
created_at
```

---

# ERROR CONTRACTS

## Invalid API Key

```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "Invalid API key"
  }
}
```

---

## Scope Denied

```json
{
  "success": false,
  "error": {
    "code": "SCOPE_DENIED",
    "message": "Insufficient permissions"
  }
}
```

---

## Rate Limit

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
```

---

## Tenant Disabled

```json
{
  "success": false,
  "error": {
    "code": "TENANT_DISABLED",
    "message": "Tenant access disabled"
  }
}
```

Error contracts are frozen.

---

# SWAGGER REQUIREMENTS

Must include:

```txt
API key auth
examples
responses
error examples
scopes
query params
```

Available at:

```txt
/docs
```

---

# PERFORMANCE TARGETS

Required:

```txt
Basic API < 20ms
Intelligence API < 50ms
Trust API < 50ms
```

Support:

```txt
10k requests/minute
```

---

# REQUIRED TESTS

## Unit Tests

Test:

```txt
tenant validation
scope validation
api key validation
response builder
analytics logger
```

---

## Integration Tests

Test:

```txt
all endpoints
query param support
caller IP fallback
tenant middleware
rate limit headers
```

---

## Contract Tests

Verify:

```txt
JSON schema never changes
```

Breaking changes:

```txt
BLOCK MERGE
```

---

# ACCEPTANCE CRITERIA

Phase 04 succeeds ONLY IF:

✅ `/ip/basic` works  
✅ `/ip/intelligence` works  
✅ `/ip/trust-score` works  
✅ API auth working  
✅ scopes working  
✅ rate limits working  
✅ tenant validation working  
✅ analytics tracking working  
✅ Swagger complete  
✅ tests passing  

---

# STOP CONDITIONS

STOP IMMEDIATELY if:

```txt
API contract changes
tenant validation fails
rate limiting broken
scope validation broken
Swagger broken
```

Do NOT continue.

Fix Phase 04 first.

---

# DEFINITION OF DONE

Phase 04 is COMPLETE only when:

```txt
All APIs operational
Tenant validation working
Scopes working
Analytics operational
Rate limits operational
Swagger complete
Contracts frozen
Testing complete
```

Production-grade only.

No mocked endpoints.

---

# NEXT PHASE

After completion:

```txt
PHASE_05_TRUST_ENGINE.md
```

DO NOT START PHASE 05 UNTIL ALL ACCEPTANCE CRITERIA PASS.