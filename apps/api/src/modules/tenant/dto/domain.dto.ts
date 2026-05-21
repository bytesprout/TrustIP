import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches, MinLength } from 'class-validator';
import { DOMAIN_MODE } from '../constants/tenant.constants';

export class AddDomainDto {
  @ApiProperty({ example: 'api.client.com' })
  @IsString()
  @MinLength(3)
  @Matches(/^(\*\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  domain!: string;

  @ApiProperty({ enum: Object.values(DOMAIN_MODE), example: DOMAIN_MODE.STRICT })
  @IsEnum(DOMAIN_MODE)
  mode!: (typeof DOMAIN_MODE)[keyof typeof DOMAIN_MODE];
}
