# PHASE 03 — DATASET UPDATER ENGINE
Product: TrustIP
Repository: trustip-platform
Phase: 03
Status: ACTIVE
Priority: CRITICAL
Execution Mode: STRICT
Estimated Complexity: HIGH

---

# OBJECTIVE

Build a production-grade Dataset Updater Engine for TrustIP.

The updater must automatically:

- download datasets
- validate datasets
- verify checksum
- version datasets
- hot reload datasets
- rollback broken datasets
- avoid API downtime

This phase introduces:

```txt
GeoLite2 auto updates
FireHOL updates
Tor exit node updates
VPN dataset updates
ASN registry updates
```

The updater MUST operate fully offline after download.

No third-party runtime APIs allowed.

---

# PHASE DEPENDENCY

MANDATORY:

Phase 01 MUST PASS.

Phase 02 MUST PASS.

Validate:

✅ Docker healthy  
✅ GeoLite2 lookup working  
✅ Redis healthy  
✅ API healthy  
✅ Logging healthy  

If any fail:

```txt
STOP
DO NOT CONTINUE
```

---

# NON-NEGOTIABLE RULES

## RULE 1 — ZERO DOWNTIME

Dataset updates MUST NOT restart API.

Must support:

```txt
Hot reload
```

No API interruption allowed.

---

## RULE 2 — VALIDATE BEFORE REPLACE

Never replace production dataset directly.

Always:

```txt
Download
 ↓
Validate
 ↓
Stage
 ↓
Swap
```

No exceptions.

---

## RULE 3 — AUTO ROLLBACK

If dataset fails:

Automatically rollback.

Must never leave system broken.

---

## RULE 4 — FAIL SAFE

If update fails:

Keep previous dataset.

Never corrupt production.

---

# OPEN SOURCE DATA SOURCES

MANDATORY SOURCES

## Geo Intelligence

Use:

- GeoLite2 City
- GeoLite2 ASN

File type:

```txt
.mmdb
```

---

## Threat Intelligence

Use:

 [oai_citation:0‡github.com](https://github.com/firehol/blocklist-ipsets?utm_source=chatgpt.com)

Purpose:

```txt
Known malicious IPs
Hosting detection
VPN indicators
Threat intelligence
```

---

## Tor Detection

Use:

 [oai_citation:1‡check.torproject.org](https://check.torproject.org/torbulkexitlist?utm_source=chatgpt.com)

Purpose:

```txt
Tor exit node detection
```

---

## ASN Intelligence

Use public ASN registries.

Purpose:

```txt
Hosting provider detection
Datacenter ASN intelligence
```

---

## VPN Intelligence

Use:

Open-source public VPN/proxy lists.

Must be modular.

Future providers supported.

---

# REQUIRED SERVICE STRUCTURE

Create EXACT structure:

```txt
services/
└── dataset-updater/
    ├── src/
    │   ├── services/
    │   │   ├── updater.service.ts
    │   │   ├── scheduler.service.ts
    │   │   ├── downloader.service.ts
    │   │   ├── validator.service.ts
    │   │   ├── checksum.service.ts
    │   │   ├── rollback.service.ts
    │   │   ├── registry.service.ts
    │   │   └── hot-reload.service.ts
    │   │
    │   ├── jobs/
    │   ├── dto/
    │   ├── interfaces/
    │   ├── constants/
    │   └── utils/
```

Never deviate.

---

# STORAGE STRUCTURE

Create EXACT structure:

```txt
/data
   /datasets
      /current
         /geolite
         /tor
         /firehol
         /asn
         /vpn

      /staging
      /backup
      /temp
```

Purpose:

```txt
current → production
staging → validation
backup → rollback
temp → downloads
```

---

# DATABASE TABLES

Add:

## dataset_registry

Fields:

```txt
id
dataset_name
dataset_type
source_url
version
checksum
size
status
last_updated_at
failure_reason
rollback_version
created_at
updated_at
```

Status values:

```txt
ACTIVE
UPDATING
FAILED
ROLLED_BACK
```

---

## dataset_update_logs

Fields:

```txt
id
dataset_name
version
status
duration_ms
failure_reason
created_at
```

Purpose:

```txt
debugging
admin dashboard
analytics
```

---

# UPDATE SCHEDULER

Use:

```txt
BullMQ Cron Jobs
```

Default schedules:

## GeoLite2

```txt
Weekly
```

Example:

```cron
0 3 * * 1
```

---

## FireHOL

```txt
Daily
```

Example:

```cron
0 2 * * *
```

---

## Tor Exit Nodes

```txt
Every 6 hours
```

Example:

```cron
0 */6 * * *
```

---

## ASN Registry

```txt
Daily
```

---

## VPN Lists

```txt
Daily
```

---

# UPDATE FLOW

MANDATORY FLOW

```txt
Scheduler Trigger
        ↓
Download Dataset
        ↓
Checksum Validation
        ↓
File Validation
        ↓
Store Temp
        ↓
Move To Staging
        ↓
Run Integrity Checks
        ↓
Backup Current
        ↓
Atomic Swap
        ↓
Hot Reload
        ↓
Health Check
        ↓
Success
```

Never bypass validation.

---

# DOWNLOAD REQUIREMENTS

Downloader MUST support:

```txt
retry logic
timeouts
checksum verification
partial download recovery
gzip support
zip extraction
```

Retry:

```txt
3 retries
```

Timeout:

```txt
60 seconds
```

---

# CHECKSUM VALIDATION

Mandatory.

Supported:

```txt
SHA256
MD5
```

Flow:

```txt
download
 ↓
checksum compare
 ↓
accept/reject
```

Failure:

```txt
abort update
```

---

# FILE VALIDATION

Validate:

## GeoLite2

```txt
valid mmdb
minimum size
readable
lookup test
```

---

## FireHOL

```txt
non-empty
valid IP format
threshold count
```

---

## Tor List

```txt
valid IP format
minimum count
```

---

# HOT RELOAD ENGINE

MANDATORY:

No service restart allowed.

Must support:

```txt
reloadDatabase()
```

Services must reload:

```txt
geo-engine
trust-engine
vpn detector
tor detector
```

without downtime.

---

# ROLLBACK ENGINE

Triggers:

```txt
validation failure
high latency
lookup failure
service crash
health check fail
```

Flow:

```txt
restore backup
 ↓
reload
 ↓
validate
 ↓
mark incident
```

No manual intervention required.

---

# VERSIONING STRATEGY

Dataset versions:

Example:

```txt
GeoLite2-City-2026-05-21
Tor-2026-05-21-12PM
FireHOL-2026-05-21
```

Retention:

```txt
Keep last 5 versions
```

Auto cleanup older versions.

---

# ADMIN VISIBILITY

Expose data for admin panel.

Show:

```txt
current version
last update
next update
status
failures
checksum
rollback history
```

Actions:

```txt
force update
rollback
retry failed update
```

---

# HEALTH ENDPOINTS

Add:

```http
GET /internal/dataset/health
```

Response:

```json
{
  "healthy": true,
  "datasets": {
    "geolite_city": "healthy",
    "geolite_asn": "healthy",
    "tor": "healthy",
    "firehol": "healthy"
  }
}
```

---

# LOGGING REQUIREMENTS

Every update MUST log:

```txt
start time
end time
duration
file size
checksum
version
status
failure reason
```

Structured logging only.

No console.log.

---

# SECURITY REQUIREMENTS

Mandatory:

```txt
HTTPS downloads only
allowlisted URLs only
checksum validation
read-only production mount
no executable downloads
```

Prevent:

```txt
poisoned datasets
malicious replacements
MITM risks
```

---

# PERFORMANCE TARGETS

Requirements:

```txt
No API downtime
Reload < 3 sec
Rollback < 5 sec
```

Must not degrade:

```txt
lookup latency
cache performance
```

---

# REQUIRED TESTS

Mandatory:

## Unit Tests

Test:

```txt
downloader
validator
checksum
rollback
scheduler
hot reload
```

---

## Integration Tests

Test:

```txt
dataset update flow
rollback flow
health validation
storage swap
```

---

## Chaos Tests

Simulate:

```txt
corrupt dataset
network failure
checksum mismatch
reload failure
```

Expected:

```txt
safe rollback
```

---

# ACCEPTANCE CRITERIA

Phase 03 succeeds ONLY IF:

✅ datasets auto update  
✅ scheduler works  
✅ checksum validation works  
✅ staging validation works  
✅ hot reload works  
✅ rollback works  
✅ health endpoint works  
✅ zero downtime confirmed  
✅ tests passing  

---

# STOP CONDITIONS

STOP IMMEDIATELY if:

```txt
API downtime occurs
dataset corruption occurs
rollback fails
health check fails
```

Do NOT continue.

Fix Phase 03 first.

---

# DEFINITION OF DONE

Phase 03 is COMPLETE only when:

```txt
GeoLite2 auto updates
FireHOL updates
Tor updates
VPN lists update
Rollback operational
Hot reload operational
Health checks operational
Zero downtime confirmed
```

No mocked updates.

No manual replacement.

Production-grade only.

---

# NEXT PHASE

After completion:

```txt
PHASE_04_APIS.md
```

DO NOT START PHASE 04 UNTIL ALL ACCEPTANCE CRITERIA PASS.