import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { IpService } from './ip-legacy.service';
import { IpQueryDto } from './dto/ip-query.dto';

const EXAMPLE_RESPONSE = {
  success: true,
  timestamp: '2024-01-01T00:00:00.000Z',
  ip: { address: '8.8.8.8', version: 'IPv4' },
  location: {
    continent: 'North America',
    country: 'United States',
    countryCode: 'US',
    state: 'California',
    district: null,
    city: 'Mountain View',
    zip: '94035',
    timezone: 'America/Los_Angeles',
    latitude: 37.3861,
    longitude: -122.0839,
    geoAccuracyRadiusKm: 10,
  },
  network: {
    isp: 'Google LLC',
    organization: 'Google LLC',
    asn: 15169,
    network: '8.8.8.0/24',
    connectionType: 'HOSTING',
  },
  reverseDns: 'dns.google',
  geoConfidence: { score: 55, level: 'MEDIUM' },
  metadata: { cacheHit: false, lookupTimeMs: 12 },
};

@ApiTags('ip')
@Controller('ip')
export class IpController {
  constructor(private readonly ipService: IpService) {}

  @Get('basic')
  @ApiOperation({
    summary: 'Basic IP lookup',
    description:
      'Returns geo, ASN, ISP, rDNS, and confidence data for an IP. ' +
      'If no ?ip= is provided, resolves the caller\'s IP from request headers. ' +
      'Public endpoint — no authentication required.',
  })
  @ApiQuery({
    name: 'ip',
    required: false,
    description: 'Target IP address. Omit to use caller IP.',
    example: '8.8.8.8',
  })
  @ApiResponse({
    status: 200,
    description: 'IP lookup result',
    schema: { example: EXAMPLE_RESPONSE },
  })
  @ApiResponse({ status: 400, description: 'Invalid or private IP address' })
  async basicLookup(
    @Req() req: Request,
    @Query() query: IpQueryDto,
  ): Promise<unknown> {
    // Use a default public tenant ID for unauthenticated requests
    // Full multi-tenant API key auth comes in Phase 04
    const tenantId = 'public';
    return this.ipService.lookup(req, tenantId, query.ip);
  }
}
