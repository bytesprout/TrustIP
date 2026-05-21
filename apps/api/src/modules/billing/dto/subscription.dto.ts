import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { BILLING_CYCLE } from '../constants/billing.constants';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'plan-id' })
  @IsString()
  @MinLength(1)
  planId!: string;

  @ApiProperty({ enum: Object.values(BILLING_CYCLE), example: BILLING_CYCLE.MONTHLY })
  @IsEnum(BILLING_CYCLE)
  billingCycle!: (typeof BILLING_CYCLE)[keyof typeof BILLING_CYCLE];

  @ApiPropertyOptional({ example: '2026-06-30T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

export class StartTrialDto {
  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  days?: number;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: Object.values(BILLING_CYCLE), example: BILLING_CYCLE.ANNUAL })
  @IsEnum(BILLING_CYCLE)
  @IsOptional()
  billingCycle?: (typeof BILLING_CYCLE)[keyof typeof BILLING_CYCLE];

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}
