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
import { ConfigService } from '../../../config/config.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { API_SCOPES } from '../constants/ip.constants';
import { SubscriptionService } from '../../billing/services/subscription.service';
import { QuotaEnforcementService } from '../../billing/services/quota-enforcement.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly tenantValidation: TenantValidationService,
    private readonly subscriptionService: SubscriptionService,
    private readonly quotaEnforcement: QuotaEnforcementService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & AuthenticatedRequest>();
    const res = http.getResponse<Response>();

    const rawApiKey = req.headers['x-api-key'] as string | undefined;
    if (!rawApiKey) {
      if (this.config.isEnterpriseMode) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { slug: 'enterprise-internal' },
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            status: true,
            rateLimitPerMinute: true,
            rateLimitEnabled: true,
            quotaEnabled: true,
            monthlyRequestLimit: true,
            quotaSoftLimitPercent: true,
            domainLockMode: true,
            allowedDomains: true,
            ipWhitelistMode: true,
            allowedIps: true,
          },
        });

        if (!tenant) {
          throw new UnauthorizedException({
            success: false,
            error: { code: 'INVALID_API_KEY', message: 'Missing x-api-key header' },
          });
        }

        req.tenant = tenant;
        req.apiKey = {
          id: 'enterprise-internal',
          tenantId: tenant.id,
          scopes: Object.values(API_SCOPES),
          keyPrefix: 'enterprise',
        };
        req.requestStartTime = Date.now();
        return true;
      }

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

    if (result.tenant!.rateLimitEnabled) {
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
    }

    const subscription = await this.subscriptionService.validateAccess(result.tenant!.id);
    if (!subscription.allowed) {
      res.status(403).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_INACTIVE',
          message: subscription.message ?? 'Subscription inactive',
        },
      });
      return false;
    }

    const featureEnabled = await this.subscriptionService.validateFeatureAccess(result.tenant!.id, req.path);
    if (!featureEnabled) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Requested feature is disabled for current plan',
        },
      });
      return false;
    }

    if (subscription.status === 'GRACE_PERIOD' && subscription.gracePeriodEndsAt) {
      res.setHeader('X-Billing-Status', 'GRACE_PERIOD');
      res.setHeader('X-Grace-Period-Ends-At', subscription.gracePeriodEndsAt.toISOString());
    }

    const quota = await this.quotaEnforcement.checkAndConsume(result.tenant!.id, req);
    if (quota.limit !== null) {
      res.setHeader('X-Quota-Limit', String(quota.limit));
      res.setHeader('X-Quota-Used', String(quota.used));
      res.setHeader('X-Quota-Remaining', String(quota.remaining ?? 0));
      res.setHeader('X-Quota-Reset', String(quota.resetAt));
      if (quota.softLimitReached && !quota.exceeded) {
        res.setHeader('X-Quota-Warning', 'SOFT_LIMIT_REACHED');
      }
    }

    if (quota.exceeded) {
      res.status(403).json({
        success: false,
        error: { code: 'PLAN_LIMIT_REACHED', message: 'Monthly quota exceeded' },
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
