import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@trustip/shared-types';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TenantAccessGuard } from '../guards/tenant-access.guard';
import { AddWhitelistEntryDto } from '../dto/whitelist.dto';
import { WhitelistService } from '../services/whitelist.service';

@ApiTags('tenant')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard, TenantAccessGuard)
@Controller({ path: 'tenants/:tenantId/whitelist', version: '1' })
export class WhitelistController {
  constructor(private readonly whitelistService: WhitelistService) {}

  @Get()
  @ApiOperation({ summary: 'List tenant IP whitelist entries' })
  async list(@Param('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.whitelistService.list(tenantId, user);
  }

  @Post()
  @ApiOperation({ summary: 'Add tenant whitelist entry' })
  async add(
    @Param('tenantId') tenantId: string,
    @Body() dto: AddWhitelistEntryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.whitelistService.add(tenantId, dto, user);
  }

  @Delete(':entryId')
  @ApiOperation({ summary: 'Remove tenant whitelist entry' })
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: true }> {
    await this.whitelistService.remove(tenantId, entryId, user);
    return { success: true };
  }
}
