import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@trustip/shared-types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtPayload } from '@trustip/shared-types';
import type { Request } from 'express';

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 4,
  [Role.TENANT_ADMIN]: 3,
  [Role.TENANT_MANAGER]: 2,
  [Role.VIEWER]: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const hasRole = requiredRoles.some(
      (role) => userLevel >= (ROLE_HIERARCHY[role] ?? 0),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
