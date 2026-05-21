import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@trustip/shared-types';

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: Role, example: Role.TENANT_MANAGER })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsString()
  limit?: string;
}
