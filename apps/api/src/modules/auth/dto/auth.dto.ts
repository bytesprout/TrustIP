import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin@trustip.io' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty({
    example: 'SecureP@ssw0rd!',
    description: 'Min 8 chars, must include uppercase, lowercase, number and special char',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=-])[A-Za-z\d@$!%*?&#^()_+=-]{8,}$/,
    { message: 'Password must contain uppercase, lowercase, number and special character' },
  )
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@trustip.io' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty({ example: 'SecureP@ssw0rd!' })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
