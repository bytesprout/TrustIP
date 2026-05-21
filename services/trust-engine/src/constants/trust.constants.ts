import type { TenantTrustConfig } from '../interfaces/trust.interface';

export const REDIS_CLIENT = 'TRUST_ENGINE_REDIS_CLIENT';

export const DEFAULT_TRUST_CONFIG: TenantTrustConfig = {
  vpnPenalty: 35,
  hostingPenalty: 40,
  torPenalty: 90,
  proxyPenalty: 25,
  geoAnomalyPenalty: 60,
  concurrentPenalty: 70,
  allowVpn: false,
  enableGeoAnomaly: true,
  enableConcurrentChecks: true,
  maxConcurrentStreams: 2,
};

export const TRUST_CACHE_TTL_SECONDS = 1800;
export const TRUST_CACHE_KEY_PREFIX = 'trust';
export const GEO_VELOCITY_WINDOW_SECONDS = 300;
export const CONCURRENT_SESSION_WINDOW_SECONDS = 3600;
export const CONCURRENT_SESSION_KEY_PREFIX = 'concurrent';
export const GEO_LAST_SEEN_KEY_PREFIX = 'geo:last';
export const TRUST_HISTORY_KEY_PREFIX = 'trust:history';

export const HOSTING_ISP_PATTERNS = [
  'amazon', 'aws', 'azure', 'microsoft', 'google', 'digitalocean',
  'linode', 'hetzner', 'ovh', 'contabo', 'oracle', 'vultr',
  'cloudflare', 'fastly', 'akamai', 'rackspace', 'datacenter',
  'hosting', 'server', 'cloud',
];

export const REDIS_KEY_TOR = 'system:dataset:tor:ips';
export const REDIS_KEY_FIREHOL = 'system:dataset:firehol:ips';
export const REDIS_KEY_VPN = 'system:dataset:vpn:ips';
