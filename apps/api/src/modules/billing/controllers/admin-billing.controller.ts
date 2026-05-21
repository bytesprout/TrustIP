import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import { OverrideService } from '../services/override.service';
import { BillingService } from '../services/billing.service';
import { ExtendSubscriptionDto, OverrideQuotaDto } from '../dto/admin-override.dto';

@ApiTags('billing')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller({ path: 'billing/admin', version: '1' })
export class AdminBillingController {
  constructor(
    private readonly overrideService: OverrideService,
    private readonly billingService: BillingService,
  ) {}

  @Post('tenants/:tenantId/activate')
  @ApiOperation({ summary: 'Manual activate tenant' })
  async activateTenant(@Param('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.overrideService.activateTenant(tenantId, user);
  }

  @Post('tenants/:tenantId/extend')
  @ApiOperation({ summary: 'Manual extend subscription' })
  async extend(
    @Param('tenantId') tenantId: string,
    @Body() dto: ExtendSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.overrideService.extendSubscription(tenantId, dto, user);
  }

  @Patch('tenants/:tenantId/quota')
  @ApiOperation({ summary: 'Manual quota override' })
  async overrideQuota(
    @Param('tenantId') tenantId: string,
    @Body() dto: OverrideQuotaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.overrideService.overrideQuota(tenantId, dto, user);
  }

  @Post('tenants/:tenantId/grant-enterprise')
  @ApiOperation({ summary: 'Grant enterprise licensing' })
  async grantEnterprise(@Param('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.overrideService.grantEnterprise(tenantId, user);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Billing analytics overview' })
  async analytics(@CurrentUser() user: JwtPayload) {
    return this.billingService.getAdminAnalytics(user);
  }
}
