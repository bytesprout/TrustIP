# PHASE 05 — TRUST & RISK ENGINE
Product: TrustIP
Repository: trustip-platform
Phase: 05
Status: ACTIVE
Priority: CRITICAL
Execution Mode: STRICT
Estimated Complexity: VERY HIGH

---

# OBJECTIVE

Build the production-grade Trust & Risk Engine for TrustIP.

This phase introduces:

- Trust scoring
- Risk scoring
- IPTV anti-sharing intelligence
- VPN detection
- Proxy detection
- Tor detection
- Hosting/datacenter detection
- Geo anomaly detection
- Concurrent session abuse detection
- Explainable trust decisions
- Configurable scoring rules

The Trust Engine MUST support:

```http
GET /api/v1/ip/trust-score
```

with:

```txt
low latency
explainable output
deterministic scoring
tenant-level customization
```

The engine MUST NEVER hard-block based on a single signal.

---

# PHASE DEPENDENCY

MANDATORY:

Phase 01 MUST PASS.

Phase 02 MUST PASS.

Phase 03 MUST PASS.

Phase 04 MUST PASS.

Validate:

✅ Geo intelligence healthy  
✅ Dataset updater healthy  
✅ Intelligence API working  
✅ Redis healthy  
✅ Tenant middleware healthy  

If any fail:

```txt
STOP
DO NOT CONTINUE
```

---

# NON-NEGOTIABLE RULES

## RULE 1 — NEVER BREAK PHASE 04

Frozen contracts remain frozen.

Do NOT modify:

```txt
basic response
intelligence response
tenant middleware
authentication
```

Only extend.

---

## RULE 2 — NO SINGLE SIGNAL BLOCKING

Never block because of:

```txt
VPN only
Proxy only
Hosting only
Country change only
```

Always use weighted scoring.

False positives must be minimized.

---

## RULE 3 — EXPLAINABLE DECISIONS

Every decision MUST explain:

```txt
why score changed
what triggered risk
confidence level
```

No black-box scoring.

---

## RULE 4 — DETERMINISTIC ENGINE

Same input MUST produce:

```txt
same trust score
same risk score
same decision
```

No randomness.

---

# TRUST ENGINE ARCHITECTURE

Create EXACT structure:

```txt
services/
└── trust-engine/
    ├── src/
    │
    ├── services/
    │   ├── trust.service.ts
    │   ├── scoring.service.ts
    │   ├── rule-engine.service.ts
    │   ├── vpn-detector.service.ts
    │   ├── tor-detector.service.ts
    │   ├── proxy-detector.service.ts
    │   ├── hosting-detector.service.ts
    │   ├── geo-anomaly.service.ts
    │   ├── concurrent-risk.service.ts
    │   ├── history-risk.service.ts
    │   └── explainability.service.ts
    │
    ├── dto/
    ├── interfaces/
    ├── constants/
    └── utils/
```

Never deviate.

---

# TRUST ENGINE FLOW

Mandatory flow:

```txt
Incoming IP
      ↓
Geo Intelligence
      ↓
VPN Detection
      ↓
Proxy Detection
      ↓
Tor Detection
      ↓
Hosting Detection
      ↓
Geo Anomaly Check
      ↓
Concurrent Session Check
      ↓
History Analysis
      ↓
Weighted Scoring
      ↓
Decision Engine
      ↓
Explainability Layer
      ↓
Response
```

No shortcuts.

---

# TRUST SCORE

Range:

```txt
0–100
```

Interpretation:

```txt
80–100 → TRUSTED
60–79 → MOSTLY_TRUSTED
40–59 → SUSPICIOUS
0–39 → HIGH_RISK
```

---

# RISK SCORE

Range:

```txt
0–100
```

Interpretation:

```txt
0–29 → LOW_RISK
30–59 → MEDIUM_RISK
60–100 → HIGH_RISK
```

---

# DECISION ENGINE

Allowed decisions:

```txt
ALLOW
WARN
CHALLENGE
TEMP_BLOCK
BLOCK
```

Rules:

```txt
Risk < 30 → ALLOW
Risk > 40 → WARN
Risk > 60 → CHALLENGE
Risk > 80 → TEMP_BLOCK
Risk > 90 → BLOCK
```

Must remain configurable.

---

# VPN DETECTION

Signals:

```txt
Known VPN IP
VPN datasets
Hosting ASN
Cloud ASN
Suspicious ISP
```

Penalty:

```txt
+35
```

Configurable.

Never block alone.

---

# PROXY DETECTION

Signals:

```txt
Known proxy list
Public proxy ASN
Anonymizer ranges
```

Penalty:

```txt
+25
```

---

# TOR DETECTION

Signals:

```txt
Tor exit node dataset
```

Penalty:

```txt
+90
```

Default decision:

```txt
TEMP_BLOCK
```

Configurable.

---

# HOSTING / DATACENTER DETECTION

Detect:

```txt
AWS
Azure
Google Cloud
DigitalOcean
Hetzner
OVH
Oracle
Contabo
```

Penalty:

```txt
+40
```

Reason:

```txt
Most IPTV abuse originates here
```

Never block alone.

---

# IPTV GEO ANOMALY DETECTION

Detect impossible movement.

Example:

```txt
Kochi → London in 5 mins
```

Penalty:

```txt
+60
```

Create:

```txt
geo-anomaly.service.ts
```

---

# CONCURRENT SESSION DETECTION

Detect:

```txt
Same account
multiple devices
multiple countries
same time
```

Penalty:

```txt
+70
```

Configurable threshold.

Default:

```txt
maxConcurrentStreams = 2
```

---

# HISTORY-BASED TRUST

Evaluate:

```txt
IP stability
country stability
trusted history
previous abuse
trusted device reuse
```

Bonuses:

```txt
Stable IP → -10 risk
Trusted history → -15 risk
Residential ISP → -20 risk
```

---

# GEO CONFIDENCE

Factor into trust.

Signals:

```txt
accuracy radius
ISP quality
ASN reliability
hosting detection
```

Low confidence:

```txt
higher risk
```

---

# THREAT INTELLIGENCE

Evaluate:

```txt
FireHOL
abuse datasets
known malicious IPs
```

Penalty:

```txt
Known abuse → +45
Blacklist → +80
```

---

# TENANT CONFIGURATION

Each tenant can customize:

```json
{
  "vpnPenalty": 35,
  "hostingPenalty": 40,
  "torPenalty": 90,
  "allowVpn": false,
  "enableGeoAnomaly": true,
  "enableConcurrentChecks": true,
  "maxConcurrentStreams": 2
}
```

Tenant overrides mandatory.

---

# TRUST RESPONSE CONTRACT

FROZEN CONTRACT:

```json
{
  "success": true,

  "ip": "49.xx.xx.xx",

  "trust": {
    "trustScore": 88,
    "riskScore": 12,
    "decision": "ALLOW",
    "confidence": "HIGH",

    "signals": {
      "vpn": false,
      "proxy": false,
      "hosting": false,
      "tor": false,
      "geoVelocityRisk": false,
      "concurrentRisk": false
    },

    "reasons": [
      "Residential ISP detected",
      "No VPN detected",
      "No abuse indicators"
    ]
  }
}
```

Never break.

---

# DATABASE TABLES

Create:

## trust_history

Fields:

```txt
id
tenant_id
ip
trust_score
risk_score
decision
created_at
```

---

## risk_events

Fields:

```txt
id
tenant_id
ip
event_type
severity
metadata
created_at
```

---

## geo_velocity_logs

Fields:

```txt
id
tenant_id
previous_country
new_country
risk_score
created_at
```

---

## concurrent_session_logs

Fields:

```txt
id
tenant_id
account_id
device_count
country_count
risk_score
created_at
```

---

# REDIS CACHE

Cache keys:

```txt
tenant:{tenantId}:ip:trust:{ip}
```

TTL:

```txt
30 minutes
```

Must support invalidation.

---

# PERFORMANCE TARGETS

Required:

```txt
Trust evaluation < 25ms
Cached trust lookup < 10ms
```

Support:

```txt
10k requests/minute
```

---

# SWAGGER REQUIREMENTS

Must include:

```txt
response examples
risk explanation
signals
trust meaning
decision meaning
```

---

# REQUIRED TESTS

## Unit Tests

Test:

```txt
vpn detection
tor detection
hosting detection
geo anomaly
decision engine
scoring engine
explainability
```

---

## Integration Tests

Test:

```txt
trust endpoint
tenant overrides
geo anomaly
cache behavior
```

---

## Contract Tests

Validate:

```txt
trust response schema frozen
```

Breaking change:

```txt
BLOCK MERGE
```

---

# ACCEPTANCE CRITERIA

Phase 05 succeeds ONLY IF:

✅ trust scoring works  
✅ risk scoring works  
✅ vpn detection works  
✅ tor detection works  
✅ hosting detection works  
✅ geo anomaly works  
✅ concurrent detection works  
✅ tenant overrides work  
✅ explainable response works  
✅ tests passing  

---

# STOP CONDITIONS

STOP IMMEDIATELY if:

```txt
trust contract changes
false positives too high
tenant overrides fail
trust engine non-deterministic
```

Do NOT continue.

Fix Phase 05 first.

---

# DEFINITION OF DONE

Phase 05 is COMPLETE only when:

```txt
Trust scoring operational
Risk scoring operational
Geo anomaly operational
VPN/Tor detection operational
Hosting detection operational
Explainability operational
Caching operational
Swagger complete
Tests complete
```

Production-grade only.

No hardcoded logic.

Fully configurable.

---

# NEXT PHASE

After completion:

```txt
PHASE_06_MULTI_TENANT.md
```

DO NOT START PHASE 06 UNTIL ALL ACCEPTANCE CRITERIA PASS.