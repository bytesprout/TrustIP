import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateQuotaDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  quotaEnabled?: boolean;

  @ApiPropertyOptional({ example: 150000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  monthlyRequestLimit?: number;

  @ApiPropertyOptional({ example: 85 })
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  quotaSoftLimitPercent?: number;
}
