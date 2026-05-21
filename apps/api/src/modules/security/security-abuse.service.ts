import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '../../config/config.service';
import { AuditLogService } from '../tenant/services/audit-log.service';
import { AlertingService } from '../observability/alerting.service';
import { ObservabilityMetricsService } from '../observability/observability-metrics.service';

type AbuseScope = 'auth' | 'api_key' | 'flood';

interface AbuseState {
  attempts: number;
  blockedUntil: number | null;
}

@Injectable()
export class SecurityAbuseService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
    private readonly alerting: AlertingService,
    private readonly metrics: ObservabilityMetricsService,
  ) {}

  async getState(scope: AbuseScope, identifier: string): Promise<AbuseState> {
    const key = this.buildKey(scope, identifier);
    const payload = await this.redis.getJson<AbuseState>(key);
    return payload ?? { attempts: 0, blockedUntil: null };
  }

  async isBlocked(scope: AbuseScope, identifier: string): Promise<boolean> {
    const state = await this.getState(scope, identifier);
    return Boolean(state.blockedUntil && state.blockedUntil > Date.now());
  }

  async recordFailure(params: {
    scope: AbuseScope;
    identifier: string;
    tenantId?: string | null;
    userId?: string | null;
    source: string;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const key = this.buildKey(params.scope, params.identifier);
    const ttl = this.config.securityAbuseWindowSeconds;
    const threshold = this.config.securityAbuseThreshold;
    const blockSeconds = this.config.securityBlockSeconds;

    const current = await this.getState(params.scope, params.identifier);
    const nextAttempts = current.attempts + 1;
    let blockedUntil = current.blockedUntil;

    if (nextAttempts >= threshold) {
      blockedUntil = Date.now() + blockSeconds * 1000;
      this.alerting.emit({
        source: params.source,
        severity: 'CRITICAL',
        code: 'ABUSE_BLOCK',
        message: `Temporary block triggered for ${params.scope}`,
        tenantId: params.tenantId ?? undefined,
        requestId: params.requestId,
        metadata: {
          scope: params.scope,
          identifier: params.identifier,
          attempts: nextAttempts,
        },
      });

      await this.auditLog.log({
        tenantId: params.tenantId ?? null,
        userId: params.userId ?? null,
        action: 'security.abuse.block',
        resource: 'security',
        metadata: {
          scope: params.scope,
          identifier: params.identifier,
          attempts: nextAttempts,
          blockedUntil,
          ...(params.metadata ?? {}),
        },
        severity: 'CRITICAL',
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      });
    }

    await this.redis.setJson(
      key,
      {
        attempts: nextAttempts,
        blockedUntil,
      },
      ttl,
    );

    this.metrics.recordBlockedRequest(
      blockedUntil && blockedUntil > Date.now() ? 'TEMP_BLOCK' : 'WARN',
      params.tenantId ?? 'system',
    );
  }

  async clear(scope: AbuseScope, identifier: string): Promise<void> {
    await this.redis.del(this.buildKey(scope, identifier));
  }

  private buildKey(scope: AbuseScope, identifier: string): string {
    return `security:abuse:${scope}:${identifier}`;
  }
}
