// Connection type classifications for IP addresses
export const ConnectionType = {
  RESIDENTIAL: 'RESIDENTIAL',
  MOBILE: 'MOBILE',
  BUSINESS: 'BUSINESS',
  HOSTING: 'HOSTING',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ConnectionType = (typeof ConnectionType)[keyof typeof ConnectionType];

// Geo confidence levels
export const GeoConfidenceLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type GeoConfidenceLevel = (typeof GeoConfidenceLevel)[keyof typeof GeoConfidenceLevel];

export const IP_VERSION = {
  V4: 'IPv4',
  V6: 'IPv6',
} as const;

export type IpVersion = (typeof IP_VERSION)[keyof typeof IP_VERSION];

// Dataset file names
export const DATASET_FILES = {
  CITY: 'GeoLite2-City.mmdb',
  ASN: 'GeoLite2-ASN.mmdb',
} as const;
