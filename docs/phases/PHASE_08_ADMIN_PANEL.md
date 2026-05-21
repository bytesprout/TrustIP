# PHASE 08 — ADMIN PANEL & ANALYTICS
Product: TrustIP
Repository: trustip-platform
Phase: 08
Status: ACTIVE
Priority: HIGH
Execution Mode: STRICT
Estimated Complexity: VERY HIGH

---

# OBJECTIVE

Build the production-grade TrustIP Admin Panel.

This phase introduces:

- Super Admin dashboard
- Tenant Admin dashboard
- Role-based UI
- Tenant management
- API key management
- Analytics dashboards
- Billing dashboard
- Trust insights
- Dataset monitoring
- Feature flags
- Audit logs
- Enterprise mode UI

The Admin Panel MUST support:

```txt
1. Super Admin
2. Tenant Admin
3. Tenant Manager
4. Viewer
```

The UI must be:

```txt
fast
responsive
dark mode
enterprise-grade
production-ready
```

---

# PHASE DEPENDENCY

MANDATORY:

Phase 01 MUST PASS.

Phase 02 MUST PASS.

Phase 03 MUST PASS.

Phase 04 MUST PASS.

Phase 05 MUST PASS.

Phase 06 MUST PASS.

Phase 07 MUST PASS.

Validate:

✅ APIs healthy  
✅ Billing healthy  
✅ Tenant system healthy  
✅ RBAC healthy  
✅ Analytics healthy  

If any fail:

```txt
STOP
DO NOT CONTINUE
```

---

# NON-NEGOTIABLE RULES

## RULE 1 — ENTERPRISE GRADE UX

The admin panel MUST feel:

```txt
Cloudflare
Datadog
Stripe Dashboard
MaxMind
```

Not:

```txt
template UI
basic admin panel
```

Professional SaaS quality mandatory.

---

## RULE 2 — RBAC EVERYWHERE

Users MUST only see:

```txt
allowed pages
allowed actions
allowed analytics
```

No UI leakage.

No hidden unauthorized routes.

---

## RULE 3 — PERFORMANCE FIRST

Dashboard load:

```txt
< 2 seconds
```

Charts:

```txt
lazy loaded
```

Pagination mandatory.

---

## RULE 4 — ENTERPRISE MODE SUPPORT

If:

```env
APP_MODE=enterprise
```

Then:

```txt
Hide tenant management
Hide billing
Auto internal tenant
Simplified navigation
```

---

# FRONTEND TECH STACK

MANDATORY:

```txt
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
Zustand
Recharts
React Hook Form
Zod
Framer Motion
```

Never deviate.

---

# REQUIRED STRUCTURE

Create EXACT structure:

```txt
apps/admin/src/
│
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── tenants/
│   ├── api-keys/
│   ├── analytics/
│   ├── billing/
│   ├── trust/
│   ├── datasets/
│   ├── audit-logs/
│   └── settings/
│
├── components/
│   ├── dashboard/
│   ├── charts/
│   ├── layout/
│   ├── tables/
│   ├── forms/
│   └── shared/
│
├── hooks/
├── stores/
├── services/
├── providers/
└── lib/
```

Never deviate.

---

# ROLES

Support:

## SUPER_ADMIN

Can:

```txt
manage tenants
manage plans
billing override
global settings
dataset updates
platform analytics
trust rules
audit logs
```

---

## TENANT_ADMIN

Can:

```txt
manage API keys
tenant settings
analytics
billing view
feature flags
trust configuration
```

---

## TENANT_MANAGER

Can:

```txt
limited API key actions
analytics
settings view
```

---

## VIEWER

Read-only.

No mutations.

---

# AUTHENTICATION UI

Pages:

```txt
/login
/forgot-password
/reset-password
```

Requirements:

```txt
JWT auth
refresh token
protected routes
session persistence
logout
```

---

# DASHBOARD

Overview cards:

```txt
Total Requests
Active Tenants
Blocked Requests
VPN Detections
Trust Score Average
API Latency
```

Charts:

```txt
Requests Over Time
Country Distribution
API Usage
Trust Trends
VPN Trends
Blocked Requests
```

Must support:

```txt
date filtering
tenant filtering
lazy loading
```

---

# TENANT MANAGEMENT

Super admin only.

Features:

```txt
create tenant
edit tenant
activate
disable
suspend
assign plan
override quota
manual activation
feature flags
retention settings
```

Tenant detail tabs:

```txt
Overview
API Keys
Usage
Billing
Trust Rules
Settings
Logs
```

---

# API KEY MANAGEMENT

Features:

```txt
create key
rotate key
revoke key
scope assignment
expiry
rate limit
domain lock
IP whitelist
```

Table columns:

```txt
Key Name
Prefix
Status
Last Used
Scopes
Expiry
Usage Count
```

Never expose plaintext key again.

Only show once.

---

# ANALYTICS DASHBOARD

Support:

## Usage Analytics

Charts:

```txt
requests/day
requests/hour
endpoint usage
top countries
top queried IPs
latency trends
```

---

## Security Analytics

Charts:

```txt
VPN detections
Tor detections
blocked traffic
hosting traffic
geo anomalies
abuse signals
```

---

## Billing Analytics

Charts:

```txt
MRR
ARR
expiring tenants
plan distribution
quota usage
```

---

# TRUST INSIGHTS

Display:

```txt
Trust Score Distribution
Risk Score Distribution
Decision Types
VPN vs Residential
Geo Anomalies
Concurrent Abuse
```

Must explain:

```txt
why users blocked
risk causes
false positives
```

---

# DATASET MONITORING

Show:

```txt
GeoLite2 version
FireHOL version
Tor version
VPN version
last updated
next update
health
checksum
failures
rollback history
```

Actions:

```txt
force update
rollback
retry failed update
```

---

# BILLING DASHBOARD

Tenant view:

```txt
Current Plan
Usage
Quota Remaining
Renewal Date
Invoices
Billing History
```

Super Admin:

```txt
Revenue
MRR
ARR
Expiring Accounts
Manual Overrides
```

---

# AUDIT LOGS

Track:

```txt
logins
API key actions
tenant updates
billing updates
dataset updates
permission changes
security incidents
```

Filters:

```txt
date
tenant
severity
action
user
```

Severity:

```txt
INFO
WARNING
CRITICAL
```

---

# FEATURE FLAGS UI

Support:

```txt
Trust Engine
VPN Detection
Geo Anomaly
Billing
Analytics
Reverse DNS
```

Must support:

```txt
tenant override
global override
runtime update
```

---

# SETTINGS PAGE

## Tenant Settings

Support:

```txt
rate limits
retention
domain lock
IP whitelist
trust thresholds
API defaults
```

---

## Platform Settings

Support:

```txt
global trust penalties
cache TTL
scheduler settings
feature defaults
enterprise mode
```

---

# UI REQUIREMENTS

Mandatory:

```txt
dark mode
responsive
skeleton loading
empty states
error boundaries
loading states
keyboard navigation
```

Animations:

```txt
minimal
professional
smooth
```

---

# SECURITY REQUIREMENTS

Mandatory:

```txt
RBAC enforcement
secure cookies
route protection
API auth
CSRF protection
XSS prevention
```

Never:

```txt
expose secrets
show unauthorized data
```

---

# PERFORMANCE TARGETS

Requirements:

```txt
dashboard load < 2 sec
charts lazy loaded
pagination mandatory
```

Support:

```txt
1000+ tenants
```

---

# REQUIRED TESTS

## Unit Tests

Test:

```txt
RBAC UI
form validation
API key management
dashboard widgets
feature flags
```

---

## Integration Tests

Test:

```txt
tenant workflows
billing workflows
dataset monitoring
trust insights
role permissions
```

---

## E2E Tests

Use:

```txt
Playwright
```

Test:

```txt
login
tenant creation
API key flow
billing updates
dashboard navigation
```

---

# ACCEPTANCE CRITERIA

Phase 08 succeeds ONLY IF:

✅ dashboard operational  
✅ tenant management works  
✅ API key management works  
✅ analytics operational  
✅ billing dashboard works  
✅ trust insights work  
✅ dataset monitor works  
✅ audit logs work  
✅ RBAC UI works  
✅ tests passing  

---

# STOP CONDITIONS

STOP IMMEDIATELY if:

```txt
RBAC leakage
tenant data leakage
dashboard slow
unauthorized routes accessible
```

Do NOT continue.

Fix Phase 08 first.

---

# DEFINITION OF DONE

Phase 08 is COMPLETE only when:

```txt
Admin panel production-ready
RBAC operational
Analytics operational
Billing operational
Trust insights operational
Dataset monitoring operational
Audit logs operational
Enterprise mode operational
Tests complete
```

Enterprise-grade only.

No template UI.

Production SaaS quality mandatory.

---

# NEXT PHASE

After completion:

```txt
PHASE_09_SECURITY_MONITORING.md
```

DO NOT START PHASE 09 UNTIL ALL ACCEPTANCE CRITERIA PASS.