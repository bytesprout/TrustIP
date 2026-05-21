import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'Starter' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'starter' })
  @IsString()
  @MinLength(2)
  slug!: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyPrice!: number;

  @ApiProperty({ example: 299.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  annualPrice!: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  currency!: string;

  @ApiPropertyOptional({ example: 100000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  requestLimitMonthly?: number;

  @ApiProperty({ example: 200 })
  @IsInt()
  @Min(1)
  requestsPerMinute!: number;

  @ApiPropertyOptional({ example: 60 })
  @IsInt()
  @Min(1)
  @IsOptional()
  analyticsRetentionDays?: number;

  @ApiProperty({
    example: { trustEngine: true, analytics: true, intelligenceLookup: true },
  })
  @IsObject()
  features!: Record<string, unknown>;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 'Business' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 99.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  monthlyPrice?: number;

  @ApiPropertyOptional({ example: 999.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  annualPrice?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  requestLimitMonthly?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  requestsPerMinute?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsInt()
  @Min(1)
  @IsOptional()
  analyticsRetentionDays?: number;

  @ApiPropertyOptional({ example: { premiumSupport: true } })
  @IsObject()
  @IsOptional()
  features?: Record<string, unknown>;
}
