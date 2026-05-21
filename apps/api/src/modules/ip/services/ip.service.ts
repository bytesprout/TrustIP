import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GeoLookupService, IpValidatorService } from '@trustip/geo-engine';
import { TrustService } from '@trustip/trust-engine';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { AnalyticsService } from './analytics.service';
import { ResponseBuilderService } from './response-builder.service';
import { ObservabilityMetricsService } from '../../observability/observability-metrics.service';
import type {
  AuthenticatedRequest,
  BasicIpResponse,
  EnrichedIpResult,
  IntelligenceIpResponse,
  TrustScoreResponse,
} from '../interfaces/ip.interfaces';
import type { Request } from 'express';

// Redis keys for system-level threat intel datasets (written by dataset-updater)
const REDIS_KEY_TOR = 'system:dataset:tor:ips';
const REDIS_KEY_FIREHOL = 'system:dataset:firehol:ips';
const REDIS_KEY_VPN = 'system:dataset:vpn:ips';

@Injectable()
export class IpService {
  private readonly logger = new Logger(IpService.name);

  constructor(
    private readonly geoLookupService: GeoLookupService,
    private readonly ipValidator: IpValidatorService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly analytics: AnalyticsService,
    private readonly responseBuilder: ResponseBuilderService,
    private readonly trustService: TrustService,
    private readonly metrics: ObservabilityMetricsService,
  ) {}

  async basic(
    req: Request & AuthenticatedRequest,
    targetIp?: string,
  ): Promise<BasicIpResponse> {
    const start = Date.now();
    const { ip } = this.resolveIp(req, targetIp);
    const tenantId = req.tenant.id;
    const apiKeyId = req.apiKey.id;

    const geoResult = await this.geoLookupService.lookup({ ip, tenantId });
    const privacy = await this.checkPrivacy(ip);
    const enriched: EnrichedIpResult = { ...geoResult, privacy };

    const lookupTimeMs = Date.now() - start;
    const response = this.responseBuilder.buildBasic(enriched, lookupTimeMs);

    this.analytics.track({
      tenantId,
      apiKeyId,
      endpoint: '/api/v1/ip/basic',
      queryIp: ip,
      country: geoResult.location?.countryCode ?? undefined,
      statusCode: 200,
      latencyMs: lookupTimeMs,
      cacheHit: geoResult.metadata.cacheHit,
      scope: 'basic_lookup',
      userAgent: req.headers['user-agent'] ?? undefined,
    });

    this.metrics.recordCache('ip_basic', tenantId, geoResult.metadata.cacheHit);
    if (privacy.vpn) {
      this.metrics.recordVpnDetection(tenantId);
    }

    return response;
  }

  async intelligence(
    req: Request & AuthenticatedRequest,
    targetIp?: string,
  ): Promise<IntelligenceIpResponse> {
    const start = Date.now();
    const { ip, isCustom } = this.resolveIp(req, targetIp);
    const tenantId = req.tenant.id;
    const apiKeyId = req.apiKey.id;

    const geoResult = await this.geoLookupService.lookup({ ip, tenantId });
    const privacy = await this.checkPrivacy(ip);
    const enriched: EnrichedIpResult = { ...geoResult, privacy };

    const lookupTimeMs = Date.now() - start;
    const response = this.responseBuilder.buildIntelligence(enriched, tenantId, isCustom, lookupTimeMs);

    this.analytics.track({
      tenantId,
      apiKeyId,
      endpoint: '/api/v1/ip/intelligence',
      queryIp: ip,
      country: geoResult.location?.countryCode ?? undefined,
      statusCode: 200,
      latencyMs: lookupTimeMs,
      cacheHit: geoResult.metadata.cacheHit,
      scope: 'intelligence_lookup',
      userAgent: req.headers['user-agent'] ?? undefined,
    });

    this.metrics.recordCache('ip_intelligence', tenantId, geoResult.metadata.cacheHit);
    if (privacy.vpn) {
      this.metrics.recordVpnDetection(tenantId);
    }

    return response;
  }

  async trustScore(
    req: Request & AuthenticatedRequest,
    targetIp?: string,
  ): Promise<TrustScoreResponse> {
    const start = Date.now();
    const { ip } = this.resolveIp(req, targetIp);
    const tenantId = req.tenant.id;
    const apiKeyId = req.apiKey.id;

    const geoResult = await this.geoLookupService.lookup({ ip, tenantId });
    const privacy = await this.checkPrivacy(ip);
    const enriched: EnrichedIpResult = { ...geoResult, privacy };

    const trustOutput = await this.trustService.evaluate({
      ip,
      tenantId,
      geoResult,
      privacyFlags: privacy,
    });

    const lookupTimeMs = Date.now() - start;
    const response = this.responseBuilder.buildTrustScore(enriched, lookupTimeMs, trustOutput);

    this.analytics.track({
      tenantId,
      apiKeyId,
      endpoint: '/api/v1/ip/trust-score',
      queryIp: ip,
      country: geoResult.location?.countryCode ?? undefined,
      statusCode: 200,
      latencyMs: lookupTimeMs,
      cacheHit: geoResult.metadata.cacheHit,
      scope: 'trust_lookup',
      userAgent: req.headers['user-agent'] ?? undefined,
    });

    this.metrics.recordCache('ip_trust', tenantId, geoResult.metadata.cacheHit);
    if (privacy.vpn) {
      this.metrics.recordVpnDetection(tenantId);
    }
    this.metrics.recordTrustScore(tenantId, response.trust.trustScore);

    return response;
  }

  // ------------------------------------------------------------------
  // PRIVATE HELPERS
  // ------------------------------------------------------------------

  private resolveIp(req: Request, targetIp?: string): { ip: string; isCustom: boolean } {
    if (targetIp) {
      if (!this.ipValidator.isValid(targetIp) || !this.ipValidator.isPublicRoutable(targetIp)) {
        throw new BadRequestException({
          success: false,
          error: { code: 'INVALID_IP', message: 'Invalid or private IP address' },
        });
      }
      return { ip: targetIp, isCustom: true };
    }

    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    const callerIp = forwarded
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress ?? '';

    if (!this.ipValidator.isValid(callerIp) || !this.ipValidator.isPublicRoutable(callerIp)) {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_IP', message: 'Unable to determine a valid caller IP' },
      });
    }

    return { ip: callerIp, isCustom: false };
  }

  /** Check Redis threat intel sets for Tor / FireHOL / VPN membership */
  private async checkPrivacy(ip: string): Promise<{ vpn: boolean; proxy: boolean; tor: boolean }> {
    try {
      const client = this.redis.getClient();
      const [tor, firehol, vpn] = await Promise.all([
        client.sismember(REDIS_KEY_TOR, ip),
        client.sismember(REDIS_KEY_FIREHOL, ip),
        client.sismember(REDIS_KEY_VPN, ip),
      ]);

      return {
        tor: tor === 1,
        proxy: firehol === 1,  // FireHOL = known bad IPs / proxy blocklist
        vpn: vpn === 1,
      };
    } catch (err) {
      this.logger.warn(`Privacy check failed for ${ip}: ${String(err)}`);
      return { vpn: false, proxy: false, tor: false };
    }
  }
}
