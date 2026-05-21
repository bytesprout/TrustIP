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
import type { AuthenticatedRequest, TrustScoreResponse } from '../interfaces/ip.interfaces';

const TRUST_RESPONSE_EXAMPLE: TrustScoreResponse = {
  success: true,
  ip: '8.8.8.8',
  trust: {
    trustScore: 80,
    riskScore: 20,
    decision: 'ALLOW',
    confidence: 'HIGH',
    signals: {
      vpn: false,
      proxy: false,
      hosting: true,
      tor: false,
      geoVelocityRisk: false,
      concurrentRisk: false,
    },
    reasons: ['Hosting/datacenter IP', 'No abuse indicators'],
  },
};

@ApiTags('ip')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard, ScopeGuard)
@RequiredScopes(API_SCOPES.TRUST_LOOKUP)
@Controller('ip')
export class TrustController {
  constructor(private readonly ipService: IpService) {}

  @Get('trust-score')
  @ApiOperation({
    summary: 'IP trust score',
    description:
      'Returns a deterministic trust score (0–100) with decision and explanation. ' +
      'Requires scope: trust_lookup.',
  })
  @ApiQuery({ name: 'ip', required: false, example: '8.8.8.8' })
  @ApiResponse({ status: 200, description: 'Trust score result', schema: { example: TRUST_RESPONSE_EXAMPLE } })
  @ApiResponse({ status: 400, description: 'Invalid IP' })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  @ApiResponse({ status: 403, description: 'Insufficient scope' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async trustScore(
    @Req() req: Request & AuthenticatedRequest,
    @Query() query: IpQueryDto,
  ): Promise<TrustScoreResponse> {
    return this.ipService.trustScore(req, query.ip);
  }
}
