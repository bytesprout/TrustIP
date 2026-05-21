import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@trustip/shared-types';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TenantAccessGuard } from '../guards/tenant-access.guard';
import { ApiKeyService } from '../services/api-key.service';
import { CreateApiKeyDto } from '../dto/api-key.dto';

@ApiTags('tenant')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard, TenantAccessGuard)
@Controller({ path: 'tenants/:tenantId/api-keys', version: '1' })
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @ApiOperation({ summary: 'Create API key for tenant' })
  @ApiResponse({ status: 201, description: 'API key created (plaintext shown once)' })
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.apiKeyService.create(tenantId, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List tenant API keys' })
  async list(@Param('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.apiKeyService.list(tenantId, user);
  }

  @Delete(':keyId')
  @ApiOperation({ summary: 'Revoke tenant API key' })
  async revoke(
    @Param('tenantId') tenantId: string,
    @Param('keyId') keyId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: true }> {
    await this.apiKeyService.revoke(tenantId, keyId, user);
    return { success: true };
  }
}
