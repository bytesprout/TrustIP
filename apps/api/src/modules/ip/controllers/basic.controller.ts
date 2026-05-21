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
import type { AuthenticatedRequest, BasicIpResponse } from '../interfaces/ip.interfaces';

const BASIC_RESPONSE_EXAMPLE: BasicIpResponse = {
  success: true,
  timestamp: '2026-05-21T12:30:00.000Z',
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
    connectionType: 'HOSTING',
  },
  metadata: { cacheHit: false, lookupTimeMs: 8 },
};

@ApiTags('ip')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard, ScopeGuard)
@RequiredScopes(API_SCOPES.BASIC_LOOKUP)
@Controller('ip')
export class BasicController {
  constructor(private readonly ipService: IpService) {}

  @Get('basic')
  @ApiOperation({
    summary: 'Basic IP lookup',
    description:
      'Returns geo, ASN, ISP data for an IP. Omit ?ip= to use caller IP. ' +
      'Requires scope: basic_lookup.',
  })
  @ApiQuery({ name: 'ip', required: false, example: '8.8.8.8' })
  @ApiResponse({ status: 200, description: 'IP lookup result', schema: { example: BASIC_RESPONSE_EXAMPLE } })
  @ApiResponse({ status: 400, description: 'Invalid IP address', schema: { example: { success: false, error: { code: 'INVALID_IP', message: 'Invalid or private IP address' } } } })
  @ApiResponse({ status: 401, description: 'Invalid API key', schema: { example: { success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid API key' } } } })
  @ApiResponse({ status: 403, description: 'Insufficient scope', schema: { example: { success: false, error: { code: 'SCOPE_DENIED', message: 'Insufficient permissions' } } } })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded', schema: { example: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } } } })
  async basicLookup(
    @Req() req: Request & AuthenticatedRequest,
    @Query() query: IpQueryDto,
  ): Promise<BasicIpResponse> {
    return this.ipService.basic(req, query.ip);
  }
}
