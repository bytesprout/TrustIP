import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { AppMode } from '@trustip/shared-types';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Streaming' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Acme LLC' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ enum: AppMode, example: AppMode.SAAS })
  @IsEnum(AppMode)
  @IsOptional()
  mode?: AppMode;

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @Min(1)
  @Max(100000)
  @IsOptional()
  rateLimitPerMinute?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  monthlyRequestLimit?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsInt()
  @Min(30)
  @Max(3650)
  @IsOptional()
  analyticsRetentionDays?: number;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Acme Streaming EMEA' })
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Acme Holdings Ltd' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  analyticsEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  quotaEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  rateLimitEnabled?: boolean;

  @ApiPropertyOptional({ example: 120000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  monthlyRequestLimit?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  quotaSoftLimitPercent?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsInt()
  @Min(30)
  @Max(3650)
  @IsOptional()
  analyticsRetentionDays?: number;
}
