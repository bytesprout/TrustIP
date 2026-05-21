import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import { SubscriptionService } from '../services/subscription.service';

function toSingle(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload; tenant?: { id: string } }>();

    const user = req.user;
    if (!user) {
      return true;
    }
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    const tenantId = toSingle(req.params.tenantId) ?? user.tenantId ?? req.tenant?.id;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const result = await this.subscriptionService.validateAccess(tenantId);
    if (!result.allowed) {
      throw new ForbiddenException(result.message ?? 'Subscription inactive');
    }

    return true;
  }
}
