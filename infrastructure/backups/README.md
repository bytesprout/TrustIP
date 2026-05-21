# TrustIP Backup Operations

This directory contains Phase 09 backup and recovery scripts.

## Scripts

- `backup-postgres.sh`: Daily encrypted-ready PostgreSQL dump pipeline (gzip output).
- `restore-postgres.sh`: Restore PostgreSQL from `.sql.gz` archive.
- `backup-redis.sh`: Redis RDB snapshot extraction.
- `rotate-datasets.sh`: Keep last 5 dataset archives per dataset by default.

## Recommended schedule

- PostgreSQL: daily
- Redis: hourly or every 6 hours depending on RPO
- Dataset archive rotation: daily after updater completion
