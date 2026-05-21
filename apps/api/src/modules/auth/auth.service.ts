import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import type { RegisterDto, LoginDto } from './dto/auth.dto';
import type { AuthTokens, JwtPayload, UserProfile } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<UserProfile> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: Role.VIEWER,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
        createdAt: true,
      },
    });

    this.logger.log(`User registered: ${user.email}`);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId, ipAddress, userAgent);
    this.logger.log(`User logged in: ${user.email}`);
    return tokens;
  }

  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const { user } = storedToken;
    return this.generateTokens(user.id, user.email, user.role, user.tenantId, ipAddress, userAgent);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    this.logger.log(`User logged out: ${userId}`);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: Role,
    tenantId: string | null,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      role,
      tenantId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.jwtAccessExpiresIn,
    });

    const rawRefreshToken = randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 15 * 60,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
