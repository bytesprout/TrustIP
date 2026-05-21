# PHASE 07 — BILLING & SUBSCRIPTION ENGINE
Product: TrustIP
Repository: trustip-platform
Phase: 07
Status: ACTIVE
Priority: HIGH
Execution Mode: STRICT
Estimated Complexity: HIGH

---

# OBJECTIVE

Build the production-grade Billing & Subscription Engine for TrustIP.

This phase introduces:

- Subscription lifecycle
- Plans & entitlements
- Free trials
- Manual activation
- Grace periods
- Quota enforcement
- Enterprise licensing
- Billing history
- Invoice foundation
- Admin overrides
- Payment-provider abstraction

The system MUST support:

```txt
Manual Mode
Billing Mode
Enterprise Licensing
```

Billing MUST NEVER be tightly coupled to platform access.

Manual override is mandatory.

---

# PHASE DEPENDENCY

MANDATORY:

Phase 01 MUST PASS.

Phase 02 MUST PASS.

Phase 03 MUST PASS.

Phase 04 MUST PASS.

Phase 05 MUST PASS.

Phase 06 MUST PASS.

Validate:

✅ Multi-tenant engine healthy  
✅ API keys working  
✅ Tenant isolation working  
✅ Rate limiting working  
✅ Quotas working  
✅ RBAC healthy  

If any fail:

```txt
STOP
DO NOT CONTINUE
```

---

# NON-NEGOTIABLE RULES

## RULE 1 — MANUAL OVERRIDE ALWAYS WINS

Super Admin MUST always be able to:

```txt
activate tenant
extend access
grant premium
increase quota
ignore billing
```

Billing can NEVER hard lock platform flexibility.

---

## RULE 2 — NO PAYMENT LOCK-IN

Payment provider MUST be abstracted.

Support future:

```txt
Razorpay
Stripe
PayPal
Manual billing
```

without rewriting billing logic.

---

## RULE 3 — NEVER DELETE TENANT DATA

Expired tenants:

```txt
SUSPEND ACCESS
```

Do NOT delete:

```txt
analytics
api keys
history
settings
```

Retention first.

---

## RULE 4 — GRACE PERIOD REQUIRED

Subscription expiry MUST support:

```txt
grace period
```

Default:

```txt
7 days
```

Configurable.

---

# BILLING MODES

Support:

## Manual Mode (Default)

Super admin manually activates.

Examples:

```txt
offline payment
trusted customer
partner account
```

---

## Subscription Mode

Tenant billed by plan.

---

## Enterprise License

Custom:

```txt
Unlimited requests
Dedicated pricing
Premium features
```

---

# REQUIRED MODULE STRUCTURE

Create EXACT structure:

```txt
apps/api/src/modules/billing/
│
├── controllers/
│   ├── plans.controller.ts
│   ├── subscriptions.controller.ts
│   ├── invoices.controller.ts
│   └── admin-billing.controller.ts
│
├── services/
│   ├── billing.service.ts
│   ├── subscription.service.ts
│   ├── plan.service.ts
│   ├── quota-enforcement.service.ts
│   ├── invoice.service.ts
│   ├── grace-period.service.ts
│   ├── override.service.ts
│   ├── trial.service.ts
│   └── payment-provider.service.ts
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

## plans

Fields:

```txt
id
name
slug
monthly_price
annual_price
currency
request_limit_monthly
requests_per_minute
analytics_retention_days
features
status
created_at
updated_at
```

Status:

```txt
ACTIVE
DISABLED
ARCHIVED
```

---

## subscriptions

Fields:

```txt
id
tenant_id
plan_id
status
billing_cycle
starts_at
expires_at
grace_period_ends_at
manual_override
auto_renew
created_at
updated_at
```

Statuses:

```txt
ACTIVE
TRIAL
EXPIRED
GRACE_PERIOD
SUSPENDED
CANCELLED
```

---

## invoices

Fields:

```txt
id
tenant_id
invoice_number
amount
currency
status
issued_at
paid_at
notes
created_at
```

Statuses:

```txt
PAID
UNPAID
PARTIAL
VOID
```

---

## billing_history

Fields:

```txt
id
tenant_id
event_type
metadata
created_at
```

Track:

```txt
plan changes
manual overrides
renewals
quota increases
suspensions
```

---

## payment_attempts

Fields:

```txt
id
tenant_id
provider
status
amount
currency
provider_reference
failure_reason
created_at
```

---

## quota_usage

Fields:

```txt
id
tenant_id
month
requests_used
trust_requests
intelligence_requests
blocked_requests
created_at
updated_at
```

---

# DEFAULT PLANS

Create seed data.

## Free

```txt
10,000 requests/month
30 days analytics
basic lookup only
```

---

## Starter

```txt
100,000 requests/month
trust engine
60 days analytics
```

---

## Business

```txt
1M requests/month
all APIs
90 days analytics
```

---

## Enterprise

```txt
Unlimited
custom SLA
manual pricing
```

Plans MUST be editable.

Never hardcoded.

---

# FREE TRIAL SYSTEM

Support:

```txt
7 day
14 day
30 day
```

Configurable.

Rules:

```txt
One trial per tenant
```

Prevent abuse.

---

# SUBSCRIPTION LIFECYCLE

Mandatory flow:

```txt
Trial
   ↓
Active
   ↓
Expiring
   ↓
Grace Period
   ↓
Suspended
```

No destructive deletion.

---

# GRACE PERIOD

Default:

```txt
7 days
```

Behavior:

```txt
warning banner
limited access
analytics readable
```

After grace:

```txt
Suspend APIs
```

---

# QUOTA ENFORCEMENT

Support:

## Soft Limit

Behavior:

```txt
warn tenant
continue access
```

---

## Hard Limit

Behavior:

```txt
block requests
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

Frozen contract.

---

# PLAN UPGRADES / DOWNGRADES

## Upgrade

Apply:

```txt
immediately
```

---

## Downgrade

Apply:

```txt
next billing cycle
```

Never delete data.

---

# MANUAL ADMIN OVERRIDE

Super Admin can:

```txt
activate subscription
extend expiry
increase quota
disable billing
grant enterprise
```

Must bypass billing logic safely.

---

# ENTERPRISE LICENSING

Support:

```txt
Unlimited quotas
Premium features
Custom expiry
Dedicated limits
```

Behavior:

```txt
manual control
```

---

# PAYMENT PROVIDER ABSTRACTION

Create:

```txt
payment-provider.service.ts
```

Supported future adapters:

```txt
Razorpay
Stripe
PayPal
```

Mandatory pattern:

```txt
adapter pattern
```

Must remain optional.

---

# SUBSCRIPTION MIDDLEWARE

Every API request MUST validate:

```txt
tenant active
subscription active
quota remaining
feature enabled
grace period status
```

No bypass.

---

# NOTIFICATION EVENTS

Trigger:

```txt
plan expiring
quota near limit
payment failed
subscription renewed
grace period started
```

Event-ready architecture only.

No actual email provider yet.

---

# BILLING ANALYTICS

Track:

```txt
MRR
ARR
active tenants
expiring tenants
quota usage
plan distribution
```

Admin only.

---

# SECURITY REQUIREMENTS

Mandatory:

```txt
tenant scoped billing
invoice protection
RBAC enforcement
audit logging
manual override logging
```

Never:

```txt
allow tenant cross access
store provider secrets insecurely
```

---

# PERFORMANCE TARGETS

Requirements:

```txt
subscription validation < 10ms
quota lookup < 5ms
```

Must support:

```txt
1000+ tenants
```

---

# REQUIRED TESTS

## Unit Tests

Test:

```txt
plan logic
trial logic
grace period
quota enforcement
override system
subscription validation
```

---

## Integration Tests

Test:

```txt
subscription lifecycle
manual override
quota blocking
trial expiration
enterprise mode
```

---

## Security Tests

Validate:

```txt
tenant billing isolation
override audit logs
RBAC restrictions
```

Critical if broken.

---

# ACCEPTANCE CRITERIA

Phase 07 succeeds ONLY IF:

✅ plans working  
✅ subscriptions working  
✅ trial logic working  
✅ grace periods working  
✅ quotas enforced  
✅ manual override works  
✅ enterprise licensing works  
✅ payment abstraction ready  
✅ tests passing  

---

# STOP CONDITIONS

STOP IMMEDIATELY if:

```txt
tenant billing leakage
manual override broken
quota bypass detected
subscription validation broken
```

Do NOT continue.

Fix Phase 07 first.

---

# DEFINITION OF DONE

Phase 07 is COMPLETE only when:

```txt
Plans operational
Subscriptions operational
Trials operational
Grace periods operational
Quota enforcement operational
Enterprise licensing operational
Manual overrides operational
Audit logging operational
Tests complete
```

Production-grade only.

No hardcoded billing logic.

Manual-first architecture mandatory.

---

# NEXT PHASE

After completion:

```txt
PHASE_08_ADMIN_PANEL.md
```

DO NOT START PHASE 08 UNTIL ALL ACCEPTANCE CRITERIA PASS.