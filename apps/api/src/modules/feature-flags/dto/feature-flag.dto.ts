import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFeatureFlagDto {
  @ApiProperty({ example: true, description: 'Enable or disable the feature flag' })
  @IsBoolean()
  value!: boolean;
}
