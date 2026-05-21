import { Injectable } from '@nestjs/common';
import { ConnectionType, GeoConfidenceLevel } from '../constants/geo.constants';
import type { GeoLocation, AsnResult, GeoConfidence } from '../interfaces/geo-result.interface';

// Confidence score factors
const SCORE_ACCURACY_EXCELLENT = 40; // accuracy radius <= 10 km
const SCORE_ACCURACY_GOOD = 30;      // accuracy radius <= 50 km
const SCORE_ACCURACY_FAIR = 15;      // accuracy radius <= 200 km
const SCORE_KNOWN_ISP = 20;          // ISP/org is known (non-null)
const SCORE_HAS_CITY = 15;           // city is available
const SCORE_HAS_COUNTRY = 10;        // country is available
const PENALTY_HOSTING = -15;         // hosting provider reduces geo confidence
const PENALTY_VPN_KEYWORDS = -20;    // ISP name suggests VPN/proxy

const VPN_KEYWORDS = ['vpn', 'proxy', 'tor', 'anonymizer', 'hide', 'tunnel'];

@Injectable()
export class ConfidenceService {
  calculate(location: GeoLocation, asn: AsnResult): GeoConfidence {
    let score = 0;

    // Accuracy radius scoring
    const radius = location.geoAccuracyRadiusKm;
    if (radius !== null) {
      if (radius <= 10) {
        score += SCORE_ACCURACY_EXCELLENT;
      } else if (radius <= 50) {
        score += SCORE_ACCURACY_GOOD;
      } else if (radius <= 200) {
        score += SCORE_ACCURACY_FAIR;
      }
      // > 200 km: no accuracy score
    }

    // Known ISP
    if (asn.isp) score += SCORE_KNOWN_ISP;

    // City available
    if (location.city) score += SCORE_HAS_CITY;

    // Country available
    if (location.country) score += SCORE_HAS_COUNTRY;

    // Hosting penalty (geo data less reliable for data center IPs)
    if (asn.connectionType === ConnectionType.HOSTING) score += PENALTY_HOSTING;

    // VPN/proxy keyword penalty
    const ispLower = (asn.isp ?? '').toLowerCase();
    if (VPN_KEYWORDS.some((kw) => ispLower.includes(kw))) score += PENALTY_VPN_KEYWORDS;

    // Clamp to 0-100
    const finalScore = Math.max(0, Math.min(100, score));

    return {
      score: finalScore,
      level: this.toLevel(finalScore),
    };
  }

  private toLevel(score: number): GeoConfidenceLevel {
    if (score >= 70) return GeoConfidenceLevel.HIGH;
    if (score >= 40) return GeoConfidenceLevel.MEDIUM;
    return GeoConfidenceLevel.LOW;
  }
}
