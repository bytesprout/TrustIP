import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '@trustip/shared-types';
import type { TenantScopedRequest } from '../interfaces/tenant.interfaces';

@Injectable()
export class TenantResolutionService {
  resolveFromRequest(req: TenantScopedRequest): string | null {
    if (req.tenant?.id) {
      return req.tenant.id;
    }

    const user = req.user as JwtPayload | undefined;
    if (user?.tenantId) {
      return user.tenantId;
    }

    return null;
  }
}
