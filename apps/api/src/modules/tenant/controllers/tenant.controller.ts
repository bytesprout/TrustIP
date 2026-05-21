import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@trustip/shared-types';
import type { JwtPayload } from '@trustip/shared-types';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateTenantDto, UpdateTenantDto } from '../dto/tenant.dto';
import { TenantService } from '../services/tenant.service';

@ApiTags('tenant')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'tenants', version: '1' })
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create tenant (SUPER_ADMIN)' })
  @ApiResponse({ status: 201, description: 'Tenant created' })
  async create(@Body() dto: CreateTenantDto, @CurrentUser() user: JwtPayload) {
    return this.tenantService.create(dto, user);
  }

  @Get()
  @Roles(Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'List tenants' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.tenantService.findAll(user);
  }

  @Get(':id')
  @Roles(Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get tenant by id' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tenantService.findById(id, user);
  }

  @Patch(':id')
  @Roles(Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update tenant settings' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tenantService.update(id, dto, user);
  }
}
