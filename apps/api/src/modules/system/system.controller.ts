import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemService } from './system.service';
import { Role } from '@trustip/shared-types';

@ApiTags('system')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller({ path: 'system', version: '1' })
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('info')
  @ApiOperation({ summary: 'Get system information (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'System information' })
  @ApiResponse({ status: 403, description: 'Requires SUPER_ADMIN role' })
  getSystemInfo() {
    return this.systemService.getSystemInfo();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'System statistics' })
  async getStats() {
    return this.systemService.getStats();
  }
}
