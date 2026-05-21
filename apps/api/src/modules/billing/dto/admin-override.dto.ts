import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ExtendSubscriptionDto {
  @ApiPropertyOptional({ example: '2026-07-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 7 })
  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  graceDays?: number;
}

export class OverrideQuotaDto {
  @ApiPropertyOptional({ example: 2000000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  monthlyRequestLimit?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  quotaEnabled?: boolean;
}
