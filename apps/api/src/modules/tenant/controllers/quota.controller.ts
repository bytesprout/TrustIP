import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@trustip/shared-types';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TenantAccessGuard } from '../guards/tenant-access.guard';
import { UpdateQuotaDto } from '../dto/quota.dto';
import { QuotaService } from '../services/quota.service';
import { TenantService } from '../services/tenant.service';

@ApiTags('tenant')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard, TenantAccessGuard)
@Controller({ path: 'tenants/:tenantId/quota', version: '1' })
export class QuotaController {
  constructor(
    private readonly quotaService: QuotaService,
    private readonly tenantService: TenantService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current tenant quota snapshot' })
  async getQuota(@Param('tenantId') tenantId: string) {
    return this.quotaService.getQuotaSnapshot(tenantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update tenant quota configuration' })
  async updateQuota(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateQuotaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tenantService.update(tenantId, dto, user);
  }
}
