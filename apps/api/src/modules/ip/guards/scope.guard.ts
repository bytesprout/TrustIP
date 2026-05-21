import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { REQUIRED_SCOPES_KEY } from '../constants/ip.constants';
import { ScopeValidationService } from '../services/scope-validation.service';
import type { AuthenticatedRequest } from '../interfaces/ip.interfaces';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly scopeValidation: ScopeValidationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(REQUIRED_SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No scopes required — allow
    if (!requiredScopes || requiredScopes.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request & AuthenticatedRequest>();
    const apiKey = req.apiKey;

    if (!apiKey) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'SCOPE_DENIED', message: 'Insufficient permissions' },
      });
    }

    const hasAccess = this.scopeValidation.hasAllScopes(apiKey.scopes, requiredScopes);
    if (!hasAccess) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'SCOPE_DENIED', message: 'Insufficient permissions' },
      });
    }

    return true;
  }
}
