import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { HealthStatus } from '@trustip/shared-types';
import type { HealthResponse, ServiceHealth } from '@trustip/shared-types';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getOverallHealth(): Promise<HealthResponse> {
    const [dbHealthy, redisHealthy, datasets, trustEngine, billing] = await Promise.all([
      this.prisma.healthCheck(),
      this.redis.healthCheck(),
      this.getDatasetsHealth(),
      this.getTrustEngineHealth(),
      this.getBillingHealth(),
    ]);

    const database = dbHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
    const redisStatus = redisHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
    const services = {
      database,
      redis: redisStatus,
      datasets: datasets.status,
      trustEngine: trustEngine.status,
      billing: billing.status,
    };

    const allHealthy = Object.values(services).every((status) => status === HealthStatus.HEALTHY);

    return {
      healthy: allHealthy,
      database,
      redis: redisStatus,
      services,
      version: '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  async getDatabaseHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const healthy = await this.prisma.healthCheck();
      return {
        status: healthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Database health check failed: ${errorMessage}`);
      return {
        status: HealthStatus.UNHEALTHY,
        latencyMs: Date.now() - start,
        message: errorMessage,
      };
    }
  }

  async getRedisHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const healthy = await this.redis.healthCheck();
      return {
        status: healthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Redis health check failed: ${errorMessage}`);
      return {
        status: HealthStatus.UNHEALTHY,
        latencyMs: Date.now() - start,
        message: errorMessage,
      };
    }
  }

  async getDatasetsHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const now = Date.now();
      const maxAgeMs = 72 * 60 * 60 * 1000;

      const registries = await this.prisma.datasetRegistry.findMany({
        select: {
          datasetName: true,
          status: true,
          lastUpdatedAt: true,
        },
      });

      if (registries.length === 0) {
        return {
          status: HealthStatus.UNHEALTHY,
          latencyMs: Date.now() - start,
          message: 'No datasets registered',
        };
      }

      const staleCount = registries.filter((entry) => {
        if (!entry.lastUpdatedAt) {
          return true;
        }
        return now - entry.lastUpdatedAt.getTime() > maxAgeMs;
      }).length;

      return {
        status: staleCount === 0 ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        latencyMs: Date.now() - start,
        message: staleCount === 0
          ? `Datasets healthy (${registries.length} registered)`
          : `Detected ${staleCount} stale dataset(s)`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Dataset health check failed: ${errorMessage}`);
      return {
        status: HealthStatus.UNHEALTHY,
        latencyMs: Date.now() - start,
        message: errorMessage,
      };
    }
  }

  async getTrustEngineHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.prisma.trustHistory.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      return {
        status: HealthStatus.HEALTHY,
        latencyMs: Date.now() - start,
        message: 'Trust engine persistence reachable',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Trust engine health check failed: ${errorMessage}`);
      return {
        status: HealthStatus.UNHEALTHY,
        latencyMs: Date.now() - start,
        message: errorMessage,
      };
    }
  }

  async getBillingHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.prisma.$transaction([
        this.prisma.plan.count(),
        this.prisma.subscription.count(),
      ]);

      return {
        status: HealthStatus.HEALTHY,
        latencyMs: Date.now() - start,
        message: 'Billing datastore reachable',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Billing health check failed: ${errorMessage}`);
      return {
        status: HealthStatus.UNHEALTHY,
        latencyMs: Date.now() - start,
        message: errorMessage,
      };
    }
  }
}
