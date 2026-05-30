import * as path from 'path';

// ============================================================
// Dataset Types
// ============================================================
export const DatasetType = {
  GEOLITE_CITY: 'geolite_city',
  GEOLITE_ASN: 'geolite_asn',
  TOR: 'tor',
  FIREHOL: 'firehol',
  VPN: 'vpn',
  ASN_INTEL: 'asn_intel',
} as const;

export type DatasetType = (typeof DatasetType)[keyof typeof DatasetType];

// ============================================================
// Dataset Statuses (matches Prisma DatasetRegistry.status)
// ============================================================
export const DatasetStatus = {
  ACTIVE: 'ACTIVE',
  UPDATING: 'UPDATING',
  FAILED: 'FAILED',
  ROLLED_BACK: 'ROLLED_BACK',
} as const;

export type DatasetStatus = (typeof DatasetStatus)[keyof typeof DatasetStatus];

// ============================================================
// BullMQ Queue
// ============================================================
export const DATASET_UPDATE_QUEUE = 'trustip:dataset-updates';

// ============================================================
// HTTPS-allowlisted source URLs
// ============================================================
export const DATASET_SOURCES: Record<string, string> = {
  [DatasetType.TOR]: 'https://check.torproject.org/torbulkexitlist',
  [DatasetType.FIREHOL]: 'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset',
  [DatasetType.VPN]: 'https://raw.githubusercontent.com/X4BNet/lists_vpn/main/output/vpn/ipv4.txt',
  // GeoLite2 requires MaxMind license key — dynamic URL built at runtime
};

export interface DatasetSourceProvider {
  name: string;
  url: string;
  headers?: Record<string, string>;
}

export const DATASET_SOURCE_PROVIDERS: Record<string, DatasetSourceProvider[]> = {
  [DatasetType.TOR]: [
    {
      name: 'torproject',
      url: 'https://check.torproject.org/torbulkexitlist',
      headers: { 'User-Agent': 'TrustIP-DatasetUpdater/1.0' },
    },
    {
      name: 'dan-me-uk-tor',
      url: 'https://www.dan.me.uk/torlist/',
      headers: { 'User-Agent': 'TrustIP-DatasetUpdater/1.0' },
    },
  ],
  [DatasetType.FIREHOL]: [
    {
      name: 'firehol-primary',
      url: 'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset',
      headers: { 'User-Agent': 'TrustIP-DatasetUpdater/1.0' },
    },
  ],
  [DatasetType.VPN]: [
    {
      name: 'x4bnet-ipv4',
      url: 'https://raw.githubusercontent.com/X4BNet/lists_vpn/main/output/vpn/ipv4.txt',
      headers: { 'User-Agent': 'TrustIP-DatasetUpdater/1.0' },
    },
    {
      name: 'x4bnet-openvpn',
      url: 'https://raw.githubusercontent.com/X4BNet/lists_vpn/main/output/vpn/openvpn.txt',
      headers: { 'User-Agent': 'TrustIP-DatasetUpdater/1.0' },
    },
  ],
};

// Domains that are allowlisted for dataset downloads (security)
export const ALLOWED_DOWNLOAD_DOMAINS = [
  'check.torproject.org',
  'www.dan.me.uk',
  'raw.githubusercontent.com',
  'download.maxmind.com',
];

// ============================================================
// BullMQ Cron Schedules (standard cron: min hour day month weekday)
// ============================================================
export const DATASET_SCHEDULES: Record<string, string> = {
  [DatasetType.GEOLITE_CITY]: '0 3 * * 1',  // Weekly Monday 3am
  [DatasetType.GEOLITE_ASN]: '0 3 * * 1',   // Weekly Monday 3am
  [DatasetType.TOR]: '0 */6 * * *',          // Every 6 hours
  [DatasetType.FIREHOL]: '0 2 * * *',        // Daily 2am
  [DatasetType.VPN]: '0 4 * * *',            // Daily 4am
  [DatasetType.ASN_INTEL]: '0 5 * * *',      // Daily 5am
};

// ============================================================
// Storage path helpers
// ============================================================
export const DATASET_PATHS = {
  base: (): string => process.env['DATASET_BASE_PATH'] ?? path.join(process.cwd(), 'data', 'datasets'),
  current: (type: string): string => path.join(DATASET_PATHS.base(), 'current', type),
  staging: (): string => path.join(DATASET_PATHS.base(), 'staging'),
  backup: (type: string, version: string): string => path.join(DATASET_PATHS.base(), 'backup', type, version),
  temp: (): string => path.join(DATASET_PATHS.base(), 'temp'),
};

// ============================================================
// File names per dataset type
// ============================================================
export const DATASET_FILENAMES: Record<string, string> = {
  [DatasetType.GEOLITE_CITY]: 'GeoLite2-City.mmdb',
  [DatasetType.GEOLITE_ASN]: 'GeoLite2-ASN.mmdb',
  [DatasetType.TOR]: 'tor-exit-nodes.txt',
  [DatasetType.FIREHOL]: 'firehol_level1.netset',
  [DatasetType.VPN]: 'vpn-ips.txt',
};

// ============================================================
// Redis keys for system-level threat intel sets
// These are NOT tenant-scoped — global intelligence data
// ============================================================
export const DATASET_REDIS_KEYS = {
  torIps: 'system:dataset:tor:ips',
  fireholIps: 'system:dataset:firehol:ips',
  vpnIps: 'system:dataset:vpn:ips',
};

// ============================================================
// Validation thresholds
// ============================================================
export const VALIDATION_THRESHOLDS = {
  [DatasetType.TOR]: { minEntries: 50 },
  [DatasetType.FIREHOL]: { minEntries: 100 },
  [DatasetType.VPN]: { minEntries: 50 },
  [DatasetType.GEOLITE_CITY]: { minSizeBytes: 50 * 1024 * 1024 },  // 50 MB
  [DatasetType.GEOLITE_ASN]: { minSizeBytes: 5 * 1024 * 1024 },    // 5 MB
};

// ============================================================
// Download settings
// ============================================================
export const DOWNLOAD_TIMEOUT_MS = 60_000;
export const DOWNLOAD_MAX_RETRIES = 3;
export const DOWNLOAD_RETRY_DELAY_MS = 2_000;

// ============================================================
// Versioning: keep last N versions
// ============================================================
export const MAX_BACKUP_VERSIONS = 5;

// ============================================================
// Hot reload event names
// ============================================================
export const DATASET_EVENTS = {
  RELOADED_GEOLITE_CITY: 'dataset.reloaded.geolite_city',
  RELOADED_GEOLITE_ASN: 'dataset.reloaded.geolite_asn',
  RELOADED_TOR: 'dataset.reloaded.tor',
  RELOADED_FIREHOL: 'dataset.reloaded.firehol',
  RELOADED_VPN: 'dataset.reloaded.vpn',
  UPDATE_FAILED: 'dataset.update.failed',
  ROLLBACK_COMPLETED: 'dataset.rollback.completed',
};
