import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { ScopeGuard } from '../guards/scope.guard';
import { RequiredScopes } from '../guards/required-scopes.decorator';
import { API_SCOPES } from '../constants/ip.constants';
import { IpService } from '../services/ip.service';
import { IpQueryDto } from '../dto/ip-query.dto';
import type { AuthenticatedRequest, IntelligenceIpResponse } from '../interfaces/ip.interfaces';

const INTEL_RESPONSE_EXAMPLE: IntelligenceIpResponse = {
  success: true,
  timestamp: '2026-05-21T12:30:00.000Z',
  request: { queryIp: '8.8.8.8', lookupType: 'custom_ip', tenantId: 'tenant_abc' },
  ip: { address: '8.8.8.8', version: 'IPv4', network: '8.8.8.0/24', reverseDns: 'dns.google' },
  location: {
    continent: 'North America',
    country: 'United States',
    countryCode: 'US',
    state: 'California',
    district: null,
    city: 'Mountain View',
    zip: '94035',
    latitude: 37.3861,
    longitude: -122.0839,
    timezone: 'America/Los_Angeles',
    geoAccuracyRadiusKm: 10,
    confidenceScore: 85,
  },
  network: { isp: 'Google LLC', organization: 'Google LLC', asn: 15169, connectionType: 'HOSTING', isHostingProvider: true },
  privacy: { vpn: false, proxy: false, tor: false, hosting: true },
  security: { threatLevel: 'LOW', blacklisted: false, abuseConfidence: 0 },
  metadata: { cacheHit: false, lookupTimeMs: 15 },
};

@ApiTags('ip')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard, ScopeGuard)
@RequiredScopes(API_SCOPES.INTELLIGENCE_LOOKUP)
@Controller('ip')
export class IntelligenceController {
  constructor(private readonly ipService: IpService) {}

  @Get('intelligence')
  @ApiOperation({
    summary: 'Full IP intelligence lookup',
    description:
      'Returns complete IP enrichment: geo, ASN, ISP, rDNS, VPN/Tor/proxy detection, ' +
      'threat intelligence, and confidence scores. Requires scope: intelligence_lookup.',
  })
  @ApiQuery({ name: 'ip', required: false, example: '8.8.8.8' })
  @ApiResponse({ status: 200, description: 'IP intelligence result', schema: { example: INTEL_RESPONSE_EXAMPLE } })
  @ApiResponse({ status: 400, description: 'Invalid IP', schema: { example: { success: false, error: { code: 'INVALID_IP', message: 'Invalid or private IP address' } } } })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  @ApiResponse({ status: 403, description: 'Insufficient scope' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async intelligenceLookup(
    @Req() req: Request & AuthenticatedRequest,
    @Query() query: IpQueryDto,
  ): Promise<IntelligenceIpResponse> {
    return this.ipService.intelligence(req, query.ip);
  }
}
