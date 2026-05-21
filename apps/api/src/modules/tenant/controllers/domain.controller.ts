import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@trustip/shared-types';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TenantAccessGuard } from '../guards/tenant-access.guard';
import { AddDomainDto } from '../dto/domain.dto';
import { DomainLockService } from '../services/domain-lock.service';

@ApiTags('tenant')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard, TenantAccessGuard)
@Controller({ path: 'tenants/:tenantId/domains', version: '1' })
export class DomainController {
  constructor(private readonly domainService: DomainLockService) {}

  @Get()
  @ApiOperation({ summary: 'List domain lock entries' })
  async list(@Param('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.domainService.list(tenantId, user);
  }

  @Post()
  @ApiOperation({ summary: 'Add domain lock entry' })
  async add(
    @Param('tenantId') tenantId: string,
    @Body() dto: AddDomainDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.domainService.add(tenantId, dto, user);
  }

  @Delete(':domainId')
  @ApiOperation({ summary: 'Remove domain lock entry' })
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('domainId') domainId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: true }> {
    await this.domainService.remove(tenantId, domainId, user);
    return { success: true };
  }
}
