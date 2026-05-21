import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateUserDto } from './dto/user.dto';
import type { UserProfile, JwtPayload, PaginatedResponse } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import { PAGINATION } from '@trustip/shared-config';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    requestUser: JwtPayload,
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
  ): Promise<PaginatedResponse<UserProfile>> {
    const actualLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * actualLimit;

    const where = requestUser.role === Role.SUPER_ADMIN
      ? {}
      : { tenantId: requestUser.tenantId };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: { id: true, email: true, role: true, tenantId: true, isActive: true, createdAt: true },
        skip: offset,
        take: actualLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        tenantId: u.tenantId,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      limit: actualLimit,
      totalPages: Math.ceil(total / actualLimit),
    };
  }

  async findOne(id: string, requestUser: JwtPayload): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, tenantId: true, isActive: true, createdAt: true },
    });

    if (!user) throw new NotFoundException('User not found');

    this.assertTenantAccess(user.tenantId, requestUser);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async update(id: string, dto: UpdateUserDto, requestUser: JwtPayload): Promise<UserProfile> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    this.assertTenantAccess(existing.tenantId, requestUser);

    // Only SUPER_ADMIN can elevate to SUPER_ADMIN
    if (dto.role === Role.SUPER_ADMIN && requestUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN role');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        role: dto.role as import('@prisma/client').Role | undefined,
        isActive: dto.isActive,
      },
      select: { id: true, email: true, role: true, tenantId: true, isActive: true, createdAt: true },
    });

    this.logger.log(`User updated: ${id} by ${requestUser.sub}`);

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      tenantId: updated.tenantId,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async remove(id: string, requestUser: JwtPayload): Promise<void> {
    if (id === requestUser.sub) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    this.assertTenantAccess(existing.tenantId, requestUser);

    await this.prisma.user.delete({ where: { id } });
    this.logger.log(`User deleted: ${id} by ${requestUser.sub}`);
  }

  private assertTenantAccess(resourceTenantId: string | null, requestUser: JwtPayload): void {
    if (requestUser.role === Role.SUPER_ADMIN) return;
    if (resourceTenantId !== requestUser.tenantId) {
      throw new ForbiddenException('Access denied: tenant mismatch');
    }
  }
}
