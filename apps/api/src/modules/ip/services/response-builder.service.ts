import { Injectable } from '@nestjs/common';
import { TRUST_SCORE } from '../constants/ip.constants';
import type { TrustOutput } from '@trustip/trust-engine';
import type { EnrichedIpResult } from '../interfaces/ip.interfaces';
import type {
  BasicIpResponse,
  IntelligenceIpResponse,
  TrustScoreResponse,
} from '../interfaces/ip.interfaces';

@Injectable()
export class ResponseBuilderService {
  buildBasic(result: EnrichedIpResult, lookupTimeMs: number): BasicIpResponse {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      ip: {
        address: result.ip.address,
        version: result.ip.version,
      },
      location: {
        continent: result.location?.continent ?? null,
        country: result.location?.country ?? null,
        countryCode: result.location?.countryCode ?? null,
        state: result.location?.state ?? null,
        district: result.location?.district ?? null,
        city: result.location?.city ?? null,
        zip: result.location?.zip ?? null,
        timezone: result.location?.timezone ?? null,
        latitude: result.location?.latitude ?? null,
        longitude: result.location?.longitude ?? null,
        geoAccuracyRadiusKm: result.location?.geoAccuracyRadiusKm ?? null,
      },
      network: {
        isp: result.network?.isp ?? null,
        organization: result.network?.organization ?? null,
        asn: result.network?.asn ?? null,
        connectionType: result.network?.connectionType ?? null,
      },
      metadata: {
        cacheHit: result.metadata.cacheHit,
        lookupTimeMs,
      },
    };
  }

  buildIntelligence(
    result: EnrichedIpResult,
    tenantId: string,
    isCustomIp: boolean,
    lookupTimeMs: number,
  ): IntelligenceIpResponse {
    const threatLevel = this.deriveThreatLevel(result);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      request: {
        queryIp: result.ip.address,
        lookupType: isCustomIp ? 'custom_ip' : 'caller_ip',
        tenantId,
      },
      ip: {
        address: result.ip.address,
        version: result.ip.version,
        network: result.network?.network ?? null,
        reverseDns: result.reverseDns ?? null,
      },
      location: {
        continent: result.location?.continent ?? null,
        country: result.location?.country ?? null,
        countryCode: result.location?.countryCode ?? null,
        state: result.location?.state ?? null,
        district: result.location?.district ?? null,
        city: result.location?.city ?? null,
        zip: result.location?.zip ?? null,
        latitude: result.location?.latitude ?? null,
        longitude: result.location?.longitude ?? null,
        timezone: result.location?.timezone ?? null,
        geoAccuracyRadiusKm: result.location?.geoAccuracyRadiusKm ?? null,
        confidenceScore: result.geoConfidence?.score ?? null,
      },
      network: {
        isp: result.network?.isp ?? null,
        organization: result.network?.organization ?? null,
        asn: result.network?.asn ?? null,
        connectionType: result.network?.connectionType ?? null,
        isHostingProvider: result.network?.connectionType === 'HOSTING',
      },
      privacy: {
        vpn: result.privacy?.vpn ?? false,
        proxy: result.privacy?.proxy ?? false,
        tor: result.privacy?.tor ?? false,
        hosting: result.network?.connectionType === 'HOSTING',
      },
      security: {
        threatLevel,
        blacklisted: result.privacy?.tor ?? false,
        abuseConfidence: this.deriveAbuseConfidence(result),
      },
      metadata: {
        cacheHit: result.metadata.cacheHit,
        lookupTimeMs,
      },
    };
  }

  buildTrustScore(result: EnrichedIpResult, _lookupTimeMs: number, trustOutput?: TrustOutput): TrustScoreResponse {
    if (trustOutput) {
      return {
        success: true,
        ip: result.ip.address,
        trust: {
          trustScore: trustOutput.trustScore,
          riskScore: trustOutput.riskScore,
          decision: trustOutput.decision,
          confidence: trustOutput.confidence,
          signals: trustOutput.signals,
          reasons: trustOutput.reasons,
        },
      };
    }

    const { score, reasons } = this.computeTrustScore(result);
    const riskScore = 100 - score;
    const decision = this.deriveDecision(score);
    const confidence = result.geoConfidence?.level
      ? this.mapConfidenceLevel(result.geoConfidence.level)
      : this.deriveConfidence(score);

    return {
      success: true,
      ip: result.ip.address,
      trust: {
        trustScore: score,
        riskScore,
        decision,
        confidence: confidence as 'LOW' | 'MEDIUM' | 'HIGH',
        signals: {
          vpn: result.privacy?.vpn ?? false,
          proxy: result.privacy?.proxy ?? false,
          hosting: result.network?.connectionType === 'HOSTING',
          tor: result.privacy?.tor ?? false,
          geoVelocityRisk: false,
          concurrentRisk: false,
        },
        reasons,
      },
    };
  }

  // ------------------------------------------------------------------
  // PRIVATE HELPERS
  // ------------------------------------------------------------------

  private computeTrustScore(result: EnrichedIpResult): { score: number; reasons: string[] } {
    let score = TRUST_SCORE.BASE;
    const reasons: string[] = [];

    if (result.privacy?.tor) {
      score -= TRUST_SCORE.TOR_DEDUCT;
      reasons.push('Tor exit node detected');
    }
    if (result.privacy?.vpn) {
      score -= TRUST_SCORE.VPN_DEDUCT;
      reasons.push('VPN detected');
    }
    if (result.privacy?.proxy) {
      score -= TRUST_SCORE.PROXY_DEDUCT;
      reasons.push('Proxy detected');
    }
    if (result.network?.connectionType === 'HOSTING') {
      score -= TRUST_SCORE.HOSTING_DEDUCT;
      reasons.push('Hosting provider');
    }
    if (result.network?.connectionType === 'RESIDENTIAL') {
      score += TRUST_SCORE.RESIDENTIAL_BONUS;
      reasons.push('Residential ISP');
    }
    if (!result.privacy?.vpn && !result.privacy?.tor && !result.privacy?.proxy) {
      reasons.push('No privacy tools detected');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  private deriveDecision(score: number): 'ALLOW' | 'REVIEW' | 'BLOCK' {
    if (score >= TRUST_SCORE.HIGH_THRESHOLD) return 'ALLOW';
    if (score >= TRUST_SCORE.MEDIUM_THRESHOLD) return 'REVIEW';
    return 'BLOCK';
  }

  private deriveConfidence(score: number): string {
    if (score >= TRUST_SCORE.HIGH_THRESHOLD) return 'HIGH';
    if (score >= TRUST_SCORE.MEDIUM_THRESHOLD) return 'MEDIUM';
    return 'LOW';
  }

  private mapConfidenceLevel(level: string): string {
    const map: Record<string, string> = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };
    return map[level] ?? 'MEDIUM';
  }

  private deriveThreatLevel(result: EnrichedIpResult): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (result.privacy?.tor) return 'CRITICAL';
    if (result.privacy?.vpn && result.privacy?.proxy) return 'HIGH';
    if (result.privacy?.vpn || result.privacy?.proxy) return 'MEDIUM';
    return 'LOW';
  }

  private deriveAbuseConfidence(result: EnrichedIpResult): number {
    let confidence = 0;
    if (result.privacy?.tor) confidence += 60;
    if (result.privacy?.vpn) confidence += 30;
    if (result.privacy?.proxy) confidence += 30;
    return Math.min(100, confidence);
  }
}
