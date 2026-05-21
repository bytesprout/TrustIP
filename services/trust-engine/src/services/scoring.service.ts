import { Injectable } from '@nestjs/common';
import type { TrustSignals, HistoryResult, TenantTrustConfig } from '../interfaces/trust.interface';

interface ScoringResult {
  riskScore: number;
  reasons: string[];
}

@Injectable()
export class ScoringService {
  compute(
    signals: TrustSignals,
    history: HistoryResult,
    geoConfidence: number,
    config: TenantTrustConfig,
  ): ScoringResult {
    void geoConfidence;
    let riskScore = 0;
    const reasons: string[] = [];

    if (signals.tor) {
      riskScore += config.torPenalty;
      reasons.push('Tor exit node detected');
    }

    if (signals.vpn && !config.allowVpn) {
      riskScore += config.vpnPenalty;
      reasons.push('VPN detected');
    }

    if (signals.proxy) {
      riskScore += config.proxyPenalty;
      reasons.push('Known proxy/threat IP');
    }

    if (signals.hosting) {
      riskScore += config.hostingPenalty;
      reasons.push('Hosting/datacenter IP');
    }

    if (signals.geoVelocityRisk) {
      riskScore += config.geoAnomalyPenalty;
      reasons.push('Impossible geo movement detected');
    }

    if (signals.concurrentRisk) {
      riskScore += config.concurrentPenalty;
      reasons.push('Concurrent session abuse detected');
    }

    if (history.stableIp) {
      riskScore -= 10;
      reasons.push('Stable IP history');
    }

    if (history.trustedHistory) {
      riskScore -= 15;
      reasons.push('Trusted IP history');
    }

    if (history.residentialIsp) {
      riskScore -= 20;
      reasons.push('Residential ISP detected');
    }

    const hasNegativeSignals =
      signals.tor ||
      (signals.vpn && !config.allowVpn) ||
      signals.proxy ||
      signals.hosting ||
      signals.geoVelocityRisk ||
      signals.concurrentRisk;

    if (!hasNegativeSignals) {
      reasons.push('No abuse indicators');
    }

    return {
      riskScore: Math.max(0, Math.min(100, riskScore)),
      reasons,
    };
  }
}
