import { ConnectionType } from './geo.constants';

// ============================================================
// ISP Classification Rules
// Keyword patterns (lowercase) matched against ISP/org name
// ============================================================

// Hosting/data center providers (checked first — highest signal)
export const HOSTING_KEYWORDS: string[] = [
  'amazon', 'aws', 'amazonaws',
  'google', 'gcp', 'googlecloud',
  'microsoft', 'azure',
  'digitalocean',
  'linode', 'akamai',
  'vultr',
  'hetzner',
  'ovh', 'ovhcloud',
  'scaleway',
  'cloudflare',
  'fastly',
  'leaseweb',
  'equinix',
  'rackspace',
  'softlayer',
  'datacenter', 'data center', 'data centre',
  'hosting', 'hosted', 'host',
  'colocation', 'colo',
  'dedicated server',
  'vpn', 'vpnservice',
  'proxy',
  'tor exit',
];

// ASN organization patterns known to be hosting
export const HOSTING_ASN_ORG_KEYWORDS: string[] = [
  'inc.', 'llc', 'ltd',
  'cloud', 'net', 'services',
  'communications', 'technologies',
  'internet services',
  'telecom',
];

// Mobile carrier patterns
export const MOBILE_KEYWORDS: string[] = [
  'mobile', 'cellular', 'wireless',
  'lte', '5g', '4g', '3g',
  'sprint', 't-mobile', 'tmobile',
  'verizon wireless',
  'at&t wireless', 'att wireless',
  'jio', 'reliance jio', 'reliance',
  'vodafone', 'vi mobile',
  'airtel mobile', 'bharti airtel',
  'bsnl mobile',
  'docomo',
  'softbank',
  'kddi',
  'telstra',
  'optus',
];

// Business/enterprise ISP patterns
export const BUSINESS_KEYWORDS: string[] = [
  'enterprise', 'business',
  'corporate', 'corp',
  'leased line',
  'mpls',
];

// Residential ISP patterns (fallback if no mobile/hosting/business match)
export const RESIDENTIAL_KEYWORDS: string[] = [
  'broadband', 'dsl', 'adsl', 'vdsl', 'fiber', 'fibre',
  'cable', 'coax',
  'residential',
  'internet service provider',
  'comcast', 'xfinity',
  'spectrum', 'charter',
  'cox',
  'att internet', 'at&t internet',
  'verizon fios',
  'bt', 'british telecom',
  'sky broadband',
  'virgin media',
  'jio fiber', 'jiofib',
  'airtel broadband',
  'bsnl broadband',
];

// Classification order (checked in this sequence)
export const CLASSIFIER_PRIORITY: Array<{ keywords: string[]; type: ConnectionType }> = [
  { keywords: HOSTING_KEYWORDS, type: ConnectionType.HOSTING },
  { keywords: MOBILE_KEYWORDS, type: ConnectionType.MOBILE },
  { keywords: BUSINESS_KEYWORDS, type: ConnectionType.BUSINESS },
  { keywords: RESIDENTIAL_KEYWORDS, type: ConnectionType.RESIDENTIAL },
];
