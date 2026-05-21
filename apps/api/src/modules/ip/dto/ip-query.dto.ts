import { IsOptional, IsIP } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class IpQueryDto {
  @ApiPropertyOptional({
    description: 'IP address to look up. If omitted, uses the caller\'s IP.',
    example: '8.8.8.8',
  })
  @IsOptional()
  @IsIP()
  ip?: string;
}
