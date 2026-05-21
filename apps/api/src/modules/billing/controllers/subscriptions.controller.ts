import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@trustip/shared-types';
import { SubscriptionService } from '../services/subscription.service';
import { CreateSubscriptionDto, StartTrialDto, UpdateSubscriptionDto } from '../dto/subscription.dto';
import { TrialService } from '../services/trial.service';

@ApiTags('billing')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'billing/subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly trialService: TrialService,
  ) {}

  @Get(':tenantId')
  @ApiOperation({ summary: 'List tenant subscriptions' })
  async list(@Param('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.subscriptionService.list(tenantId, user);
  }

  @Post(':tenantId')
  @ApiOperation({ summary: 'Create tenant subscription' })
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.subscriptionService.create(tenantId, dto, user);
  }

  @Patch(':tenantId/:subscriptionId')
  @ApiOperation({ summary: 'Update tenant subscription' })
  async update(
    @Param('tenantId') tenantId: string,
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: UpdateSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.subscriptionService.update(tenantId, subscriptionId, dto, user);
  }

  @Post(':tenantId/trial/:planId')
  @ApiOperation({ summary: 'Start tenant trial' })
  async startTrial(
    @Param('tenantId') tenantId: string,
    @Param('planId') planId: string,
    @Body() dto: StartTrialDto,
  ) {
    return this.trialService.startTrial(tenantId, planId, dto.days);
  }
}
