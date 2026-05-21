import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    const tenantId = req.params.tenantId ?? req.params.id;
    if (!tenantId || user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: tenant mismatch');
    }

    return true;
  }
}
