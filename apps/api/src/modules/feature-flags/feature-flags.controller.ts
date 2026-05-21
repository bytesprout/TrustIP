import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import { UpdateFeatureFlagDto } from './dto/feature-flag.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, TenantId } from '../../common/decorators/current-user.decorator';
import { Role } from '@trustip/shared-types';
import type { JwtPayload } from '@trustip/shared-types';

@ApiTags('feature-flags')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'feature-flags', version: '1' })
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'List all feature flags for current tenant' })
  @ApiResponse({ status: 200, description: 'Feature flags list' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.featureFlagsService.findAll(user.tenantId);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a specific feature flag value' })
  @ApiResponse({ status: 200, description: 'Feature flag value' })
  async getFlag(@Param('key') key: string, @TenantId() tenantId: string | null) {
    return this.featureFlagsService.getFlag(key, tenantId);
  }

  @Put(':key')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a feature flag (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Feature flag updated' })
  @ApiResponse({ status: 403, description: 'Requires SUPER_ADMIN role' })
  async updateFlag(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureFlagDto,
    @TenantId() tenantId: string | null,
  ) {
    return this.featureFlagsService.updateFlag(key, dto.value, tenantId);
  }
}
