# PHASE 06 — MULTI-TENANT SAAS ENGINE
Product: TrustIP
Repository: trustip-platform
Phase: 06
Status: ACTIVE
Priority: CRITICAL
Execution Mode: STRICT
Estimated Complexity: VERY HIGH

---

# OBJECTIVE

Build the production-grade Multi-Tenant SaaS Engine for TrustIP.

This phase introduces:

- Multi-tenant isolation
- API key management
- Tenant settings
- Domain locking
- IP whitelisting
- Quotas
- Rate limiting
- Feature flags
- Analytics retention
- SaaS + Enterprise mode
- Audit logging
- Tenant-aware caching

The system MUST support:

```txt
1. SaaS Mode
2. Enterprise Self-Hosted Mode
```

Architecture MUST scale safely for:

```txt
1000+ tenants
```

without tenant leakage.

---

# PHASE DEPENDENCY

MANDATORY:

Phase 01 MUST PASS.

Phase 02 MUST PASS.

Phase 03 MUST PASS.

Phase 04 MUST PASS.

Phase 05 MUST PASS.

Validate:

✅ Trust engine healthy  
✅ API layer healthy  
✅ Redis healthy  
✅ PostgreSQL healthy  
✅ JWT working  
✅ RBAC working  

If any fail:

```txt
STOP
DO NOT CONTINUE
```

---

# NON-NEGOTIABLE RULES

## RULE 1 — TENANT ISOLATION IS ABSOLUTE

Tenant A MUST NEVER access:

```txt
Tenant B data
Tenant B analytics
Tenant B logs
Tenant B API keys
```

No exceptions.

Cross-tenant leakage is a CRITICAL FAILURE.

---

## RULE 2 — EVERY QUERY IS TENANT-SCOPED

Every DB query MUST include:

```sql
WHERE tenant_id = ?
```

No bypass.

No global queries unless:

```txt
SUPER_ADMIN
```

---

## RULE 3 — TENANT-AWARE CACHE

All Redis keys MUST include:

```txt
tenant:{tenantId}
```

Example:

```txt
tenant:abc123:ip:trust:1.1.1.1
```

No shared cache.

---

## RULE 4 — MANUAL OVERRIDE ALWAYS SUPPORTED

Super admin MUST be able to:

```txt
activate tenant
extend quota
disable billing
grant premium
```

Billing must NEVER lock platform flexibility.

---

# DEPLOYMENT MODES

Support:

## SaaS Mode

Multiple isolated tenants.

Example:

```txt
Tenant A
Tenant B
Tenant C
```

Config:

```env
APP_MODE=saas
```

---

## Enterprise Mode

Single internal tenant.

Config:

```env
APP_MODE=enterprise
```

Behavior:

```txt
No tenant management UI
Unlimited quotas
Internal tenant auto-created
Optional API auth
```

---

# REQUIRED MODULE STRUCTURE

Create EXACT structure:

```txt
apps/api/src/modules/tenant/
│
├── controllers/
│   ├── tenant.controller.ts
│   ├── api-key.controller.ts
│   ├── domain.controller.ts
│   ├── whitelist.controller.ts
│   └── quota.controller.ts
│
├── services/
│   ├── tenant.service.ts
│   ├── api-key.service.ts
│   ├── tenant-resolution.service.ts
│   ├── quota.service.ts
│   ├── domain-lock.service.ts
│   ├── whitelist.service.ts
│   ├── retention.service.ts
│   ├── feature-flag.service.ts
│   └── audit-log.service.ts
│
├── dto/
├── guards/
├── interfaces/
└── constants/
```

Never deviate.

---

# DATABASE TABLES

Create:

## tenants

Fields:

```txt
id
name
slug
company_name
status
mode
subscription_plan_id
analytics_enabled
analytics_retention_days
rate_limit_enabled
quota_enabled
created_at
updated_at
```

Statuses:

```txt
ACTIVE
DISABLED
SUSPENDED
TRIAL
```

---

## api_keys

Fields:

```txt
id
tenant_id
name
api_key_hash
prefix
status
expires_at
last_used_at
scopes
request_limit
created_at
updated_at
```

Statuses:

```txt
ACTIVE
DISABLED
REVOKED
EXPIRED
```

Never store plaintext key.

Only show ONCE.

---

## tenant_domains

Fields:

```txt
id
tenant_id
domain
mode
created_at
```

Modes:

```txt
STRICT
WILDCARD
DISABLED
```

Examples:

```txt
api.client.com
*.client.com
```

---

## tenant_ip_whitelist

Fields:

```txt
id
tenant_id
ip
type
created_at
```

Support:

```txt
single IP
CIDR
```

---

## tenant_feature_flags

Fields:

```txt
id
tenant_id
trust_engine
vpn_detection
geo_anomaly
analytics
billing
reverse_dns
created_at
updated_at
```

---

## usage_metrics

Fields:

```txt
id
tenant_id
endpoint
request_count
country
vpn_hits
blocked_requests
created_at
```

---

## audit_logs

Fields:

```txt
id
tenant_id
user_id
action
metadata
severity
created_at
```

Severity:

```txt
INFO
WARNING
CRITICAL
```

---

# API KEY SYSTEM

Generate keys:

Formats:

```txt
tip_live_xxxxxxxxxxxxx
tip_test_xxxxxxxxxxxxx
```

Requirements:

```txt
crypto secure
hashed
rotatable
revokable
scoped
expirable
```

Support:

```txt
last used tracking
usage count
rate limits
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

Validation mandatory.

Example:

```json
{
  "scopes": [
    "basic_lookup",
    "trust_lookup"
  ]
}
```

---

# DOMAIN LOCKING

Modes:

## Disabled

No restrictions.

---

## Strict

Allowed:

```txt
api.client.com
dashboard.client.com
```

---

## Wildcard

Allowed:

```txt
*.client.com
```

Validation sources:

```txt
Origin
Referer
```

Fail response:

```json
{
  "success": false,
  "error": {
    "code": "DOMAIN_NOT_ALLOWED",
    "message": "Unauthorized domain"
  }
}
```

---

# IP WHITELISTING

Support:

```txt
single IP
CIDR
```

Modes:

```txt
STRICT
DISABLED
```

Example:

```txt
129.212.245.151
129.212.245.0/24
```

Fail response:

```json
{
  "success": false,
  "error": {
    "code": "IP_NOT_WHITELISTED",
    "message": "Unauthorized IP"
  }
}
```

---

# RATE LIMITING

Support:

```txt
per minute
per hour
per day
per month
```

Tenant configurable.

Headers mandatory:

```http
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

---

# QUOTA SYSTEM

Support:

## Soft Limit

Behavior:

```txt
warn tenant
continue API
```

---

## Hard Limit

Behavior:

```txt
block request
```

Response:

```json
{
  "success": false,
  "error": {
    "code": "PLAN_LIMIT_REACHED",
    "message": "Monthly quota exceeded"
  }
}
```

---

# ANALYTICS RETENTION

Support:

```txt
30 days
60 days
90 days
unlimited
disabled
```

Must auto cleanup.

Create scheduler.

---

# FEATURE FLAGS

Tenant configurable.

Support:

```json
{
  "trustEngine": true,
  "vpnDetection": true,
  "geoAnomaly": true,
  "analytics": true
}
```

Feature flags MUST be:

```txt
database driven
cacheable
runtime reloadable
```

---

# TENANT RESOLUTION FLOW

Mandatory:

```txt
API Key
   ↓
Resolve Tenant
   ↓
Validate Status
   ↓
Validate Subscription
   ↓
Validate Domain
   ↓
Validate IP
   ↓
Validate Scope
   ↓
Validate Rate Limit
   ↓
Continue
```

No bypass.

---

# ENTERPRISE MODE BEHAVIOR

If:

```env
APP_MODE=enterprise
```

Then:

```txt
Single internal tenant
No tenant management
Unlimited quotas
Optional API auth
```

Must remain production-grade.

---

# SECURITY REQUIREMENTS

Mandatory:

```txt
hashed API keys
RBAC enforcement
tenant scoped queries
tenant scoped cache
audit logging
secure secrets
```

Never:

```txt
store plaintext API keys
share tenant cache
expose tenant internals
```

---

# PERFORMANCE TARGETS

Support:

```txt
1000+ tenants
10k requests/minute
```

Requirements:

```txt
tenant resolution < 10ms
cache lookup < 5ms
```

---

# REQUIRED TESTS

## Unit Tests

Test:

```txt
tenant resolution
api key validation
scope validation
domain lock
IP whitelist
feature flags
quota logic
```

---

## Integration Tests

Test:

```txt
tenant isolation
cross-tenant access prevention
enterprise mode
rate limits
retention cleanup
```

---

## Security Tests

Validate:

```txt
tenant leakage impossible
cache isolation working
query isolation working
```

Critical failure if broken.

---

# ACCEPTANCE CRITERIA

Phase 06 succeeds ONLY IF:

✅ tenant isolation works  
✅ api key system works  
✅ scopes work  
✅ domain locking works  
✅ IP whitelist works  
✅ quotas work  
✅ rate limits work  
✅ feature flags work  
✅ analytics retention works  
✅ enterprise mode works  
✅ tests passing  

---

# STOP CONDITIONS

STOP IMMEDIATELY if:

```txt
tenant leakage detected
query not tenant scoped
cache shared
api keys insecure
```

Do NOT continue.

Fix Phase 06 first.

---

# DEFINITION OF DONE

Phase 06 is COMPLETE only when:

```txt
Tenant isolation operational
API keys operational
Scopes operational
Domain lock operational
IP whitelist operational
Quotas operational
Feature flags operational
Analytics retention operational
Enterprise mode operational
Tests complete
```

Production-grade only.

No shortcuts.

No tenant leakage.

---

# NEXT PHASE

After completion:

```txt
PHASE_07_BILLING.md
```

DO NOT START PHASE 07 UNTIL ALL ACCEPTANCE CRITERIA PASS.