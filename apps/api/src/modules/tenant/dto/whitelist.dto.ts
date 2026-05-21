import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { WHITELIST_ENTRY_TYPE } from '../constants/tenant.constants';

export class AddWhitelistEntryDto {
  @ApiProperty({ example: '129.212.245.151' })
  @IsString()
  ip!: string;

  @ApiProperty({ enum: Object.values(WHITELIST_ENTRY_TYPE), example: WHITELIST_ENTRY_TYPE.SINGLE })
  @IsEnum(WHITELIST_ENTRY_TYPE)
  type!: (typeof WHITELIST_ENTRY_TYPE)[keyof typeof WHITELIST_ENTRY_TYPE];
}
