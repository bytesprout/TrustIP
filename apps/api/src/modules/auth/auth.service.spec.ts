import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { RegisterDto, LoginDto } from './dto/auth.dto';
import { Role } from '@trustip/shared-types';

// Prisma mock
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

const mockConfigService = {
  jwtSecret: 'test-secret-that-is-very-long-at-least-64-chars-xxxxxxxxxxxxxxx',
  jwtAccessExpiresIn: '15m',
  jwtRefreshExpiresIn: '30d',
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto: RegisterDto = {
      email: 'test@trustip.io',
      password: 'SecureP@ssw0rd!',
    };

    it('should register a new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'uuid-1',
        email: dto.email,
        role: Role.VIEWER,
        tenantId: null,
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.register(dto);

      expect(result.email).toBe(dto.email);
      expect(result.role).toBe(Role.VIEWER);
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should hash the password with argon2', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockImplementation(async ({ data }: { data: { passwordHash: string; email: string } }) => ({
        id: 'uuid-2',
        email: data.email,
        role: Role.VIEWER,
        tenantId: null,
        isActive: true,
        createdAt: new Date(),
        passwordHash: data.passwordHash,
      }));

      await service.register(dto);

      const createCall = mockPrismaService.user.create.mock.calls[0] as [{ data: { passwordHash: string } }];
      const { passwordHash } = createCall[0].data;
      const valid = await argon2.verify(passwordHash, dto.password);
      expect(valid).toBe(true);
    });
  });

  describe('login', () => {
    const dto: LoginDto = {
      email: 'test@trustip.io',
      password: 'SecureP@ssw0rd!',
    };

    it('should return tokens on valid credentials', async () => {
      const passwordHash = await argon2.hash(dto.password);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: dto.email,
        passwordHash,
        role: Role.VIEWER,
        tenantId: null,
        isActive: true,
      });
      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login(dto);

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.expiresIn).toBe('number');
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: dto.email,
        passwordHash: 'hash',
        role: Role.VIEWER,
        isActive: false,
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const passwordHash = await argon2.hash('DifferentPassword1!');
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: dto.email,
        passwordHash,
        role: Role.VIEWER,
        isActive: true,
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke all refresh tokens for user', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      await service.logout('user-id');
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });
});
