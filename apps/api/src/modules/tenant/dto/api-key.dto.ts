import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Backend Integration Key' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: ['basic_lookup', 'intelligence_lookup'],
    isArray: true,
    type: String,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  scopes!: string[];

  @ApiPropertyOptional({ example: 100000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  requestLimit?: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: false, description: 'Generate test key prefix' })
  @IsOptional()
  testKey?: boolean;
}
