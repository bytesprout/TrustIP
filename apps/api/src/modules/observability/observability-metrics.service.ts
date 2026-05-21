import { Injectable } from '@nestjs/common';
import {
  Registry,
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
} from 'prom-client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

interface RequestMetricInput {
  method: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  tenantId: string;
}

@Injectable()
export class ObservabilityMetricsService {
  private readonly registry = new Registry();

  private readonly requestCounter = new Counter({
    name: 'trustip_http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'endpoint', 'status_code', 'tenant_id'],
    registers: [this.registry],
  });

  private readonly requestLatency = new Histogram({
    name: 'trustip_http_request_latency_ms',
    help: 'HTTP request latency in milliseconds',
    labelNames: ['method', 'endpoint', 'status_code', 'tenant_id'],
    buckets: [10, 25, 50, 75, 100, 250, 500, 1000, 2000],
    registers: [this.registry],
  });

  private readonly errorCounter = new Counter({
    name: 'trustip_http_errors_total',
    help: 'Total HTTP 5xx errors',
    labelNames: ['endpoint'],
    registers: [this.registry],
  });

  private readonly cacheHitCounter = new Counter({
    name: 'trustip_cache_hits_total',
    help: 'Cache hits',
    labelNames: ['scope', 'tenant_id'],
    registers: [this.registry],
  });

  private readonly cacheMissCounter = new Counter({
    name: 'trustip_cache_misses_total',
    help: 'Cache misses',
    labelNames: ['scope', 'tenant_id'],
    registers: [this.registry],
  });

  private readonly blockedRequestsCounter = new Counter({
    name: 'trustip_blocked_requests_total',
    help: 'Blocked requests due to abuse/rate/plan constraints',
    labelNames: ['reason', 'tenant_id'],
    registers: [this.registry],
  });

  private readonly vpnDetectionsCounter = new Counter({
    name: 'trustip_vpn_detections_total',
    help: 'VPN detections by tenant',
    labelNames: ['tenant_id'],
    registers: [this.registry],
  });

  private readonly trustScoreHistogram = new Histogram({
    name: 'trustip_trust_score_distribution',
    help: 'Trust score distribution',
    labelNames: ['tenant_id'],
    buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    registers: [this.registry],
  });

  private readonly quotaUsageGauge = new Gauge({
    name: 'trustip_tenant_quota_usage_ratio',
    help: 'Current tenant quota usage ratio (0-1)',
    labelNames: ['tenant_id'],
    registers: [this.registry],
  });

  private readonly tenantRequestCounter = new Counter({
    name: 'trustip_tenant_requests_total',
    help: 'Requests by tenant',
    labelNames: ['tenant_id'],
    registers: [this.registry],
  });

  private readonly activeTenantsGauge = new Gauge({
    name: 'trustip_billing_active_tenants',
    help: 'Active subscribed tenants',
    registers: [this.registry],
  });

  private readonly failedPaymentsGauge = new Gauge({
    name: 'trustip_billing_failed_payments',
    help: 'Failed payments in last 30 days',
    registers: [this.registry],
  });

  private readonly infraMemoryGauge = new Gauge({
    name: 'trustip_infra_node_memory_used_bytes',
    help: 'Process memory used by API node',
    registers: [this.registry],
  });

  private readonly infraRedisMemoryGauge = new Gauge({
    name: 'trustip_infra_redis_used_memory_bytes',
    help: 'Redis memory usage in bytes',
    registers: [this.registry],
  });

  private readonly infraPostgresConnectionGauge = new Gauge({
    name: 'trustip_infra_postgres_connections',
    help: 'Current PostgreSQL connections',
    registers: [this.registry],
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    collectDefaultMetrics({ register: this.registry, prefix: 'trustip_node_' });
  }

  recordRequest(input: RequestMetricInput): void {
    const labels = {
      method: input.method,
      endpoint: input.endpoint,
      status_code: String(input.statusCode),
      tenant_id: input.tenantId,
    };

    this.requestCounter.inc(labels);
    this.requestLatency.observe(labels, input.latencyMs);
    this.tenantRequestCounter.inc({ tenant_id: input.tenantId });

    if (input.statusCode >= 500) {
      this.errorCounter.inc({ endpoint: input.endpoint });
    }
  }

  recordCache(scope: string, tenantId: string, hit: boolean): void {
    if (hit) {
      this.cacheHitCounter.inc({ scope, tenant_id: tenantId });
      return;
    }

    this.cacheMissCounter.inc({ scope, tenant_id: tenantId });
  }

  recordBlockedRequest(reason: string, tenantId: string): void {
    this.blockedRequestsCounter.inc({ reason, tenant_id: tenantId });
  }

  recordVpnDetection(tenantId: string): void {
    this.vpnDetectionsCounter.inc({ tenant_id: tenantId });
  }

  recordTrustScore(tenantId: string, score: number): void {
    this.trustScoreHistogram.observe({ tenant_id: tenantId }, score);
  }

  recordQuotaUsage(tenantId: string, used: number, limit: number | null): void {
    if (!limit || limit <= 0) {
      return;
    }

    const ratio = Math.max(0, Math.min(1, used / limit));
    this.quotaUsageGauge.set({ tenant_id: tenantId }, ratio);
  }

  async serialize(): Promise<string> {
    await this.refreshGauges();
    return this.registry.metrics();
  }

  private async refreshGauges(): Promise<void> {
    this.infraMemoryGauge.set(process.memoryUsage().rss);
    await Promise.all([
      this.updateBillingGauges(),
      this.updateRedisMemoryGauge(),
      this.updatePostgresConnectionGauge(),
    ]);
  }

  private async updateBillingGauges(): Promise<void> {
    const now = new Date();
    const [activeTenants, failedPayments] = await Promise.all([
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.paymentAttempt.count({
        where: {
          status: {
            not: 'SUCCESS',
          },
          createdAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    this.activeTenantsGauge.set(activeTenants);
    this.failedPaymentsGauge.set(failedPayments);
  }

  private async updateRedisMemoryGauge(): Promise<void> {
    const client = this.redis.getClient();
    const info = await client.info('memory');
    const usedMemoryLine = info
      .split('\n')
      .find((line) => line.startsWith('used_memory:'));

    if (!usedMemoryLine) {
      return;
    }

    const value = Number(usedMemoryLine.split(':')[1]?.trim() ?? '0');
    if (!Number.isNaN(value)) {
      this.infraRedisMemoryGauge.set(value);
    }
  }

  private async updatePostgresConnectionGauge(): Promise<void> {
    const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM pg_stat_activity
    `;
    const count = Number(result[0]?.count ?? 0);
    this.infraPostgresConnectionGauge.set(count);
  }
}
