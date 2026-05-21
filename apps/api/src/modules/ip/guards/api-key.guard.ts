import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { TenantValidationService } from '../services/tenant-validation.service';
import type { AuthenticatedRequest } from '../interfaces/ip.interfaces';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly tenantValidation: TenantValidationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & AuthenticatedRequest>();
    const res = http.getResponse<Response>();

    const rawApiKey = req.headers['x-api-key'] as string | undefined;
    if (!rawApiKey) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'INVALID_API_KEY', message: 'Missing x-api-key header' },
      });
    }

    const callerIp = this.extractCallerIp(req);
    const origin = req.headers['origin'] as string | undefined;
    const referer = req.headers['referer'] as string | undefined;

    const result = await this.tenantValidation.validate(rawApiKey, origin, referer, callerIp);

    if (!result.valid) {
      const status = this.getStatusForError(result.errorCode ?? 'INVALID_API_KEY');
      const body = {
        success: false,
        error: { code: result.errorCode, message: result.errorMessage },
      };
      if (status === 429) {
        res.status(429).json(body);
        return false;
      }
      if (status === 403) {
        throw new ForbiddenException(body);
      }
      throw new UnauthorizedException(body);
    }

    // Attach resolved context to request
    req.tenant = result.tenant!;
    req.apiKey = result.apiKey!;
    req.requestStartTime = Date.now();

    // Check rate limit and set headers
    const rateLimit = await this.tenantValidation.checkRateLimit(
      result.tenant!.id,
      result.tenant!.rateLimitPerMinute,
    );

    res.setHeader('X-RateLimit-Limit', String(rateLimit.limit));
    res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
    res.setHeader('X-RateLimit-Reset', String(rateLimit.resetAt));

    if (rateLimit.exceeded) {
      res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
      });
      return false;
    }

    return true;
  }

  private extractCallerIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.socket.remoteAddress;
  }

  private getStatusForError(code: string): number {
    switch (code) {
      case 'RATE_LIMIT_EXCEEDED':
        return 429;
      case 'TENANT_DISABLED':
      case 'SCOPE_DENIED':
      case 'DOMAIN_NOT_ALLOWED':
      case 'IP_NOT_WHITELISTED':
        return 403;
      default:
        return 401;
    }
  }
}
