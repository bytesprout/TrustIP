import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '@trustip/shared-types';
import type { JwtPayload } from '@trustip/shared-types';
import { PlanService } from '../services/plan.service';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';

@ApiTags('billing')
@ApiBearerAuth('JWT')
@Controller({ path: 'billing/plans', version: '1' })
export class PlansController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  @ApiOperation({ summary: 'List active plans' })
  async listActive() {
    return this.planService.listActive();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all plans (SUPER_ADMIN)' })
  async listAll(@CurrentUser() user: JwtPayload) {
    return this.planService.listAll(user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create plan (SUPER_ADMIN)' })
  async create(@Body() dto: CreatePlanDto, @CurrentUser() user: JwtPayload) {
    return this.planService.create(dto, user);
  }

  @Patch(':planId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update plan (SUPER_ADMIN)' })
  async update(
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.planService.update(planId, dto, user);
  }
}
