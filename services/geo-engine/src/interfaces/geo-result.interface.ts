import type { ConnectionType, GeoConfidenceLevel, IpVersion } from '../constants/geo.constants';

// ============================================================
// GEO RESULT — from GeoLite2-City
// ============================================================

export interface GeoLocation {
  continent: string | null;
  country: string | null;
  countryCode: string | null;
  state: string | null;
  district: string | null;
  city: string | null;
  zip: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  geoAccuracyRadiusKm: number | null;
}

// ============================================================
// ASN RESULT — from GeoLite2-ASN
// ============================================================

export interface AsnResult {
  asn: number | null;
  isp: string | null;
  organization: string | null;
  network: string | null;
  connectionType: ConnectionType;
}

// ============================================================
// GEO CONFIDENCE
// ============================================================

export interface GeoConfidence {
  score: number;
  level: GeoConfidenceLevel;
}

// ============================================================
// FULL IP LOOKUP RESULT
// ============================================================

export interface IpLookupResult {
  ip: {
    address: string;
    version: IpVersion;
  };
  location: GeoLocation;
  network: AsnResult;
  reverseDns: string | null;
  geoConfidence: GeoConfidence;
  metadata: {
    cacheHit: boolean;
    lookupTimeMs: number;
  };
}

// ============================================================
// INPUTS
// ============================================================

export interface LookupRequest {
  ip: string;
  tenantId: string;
}
