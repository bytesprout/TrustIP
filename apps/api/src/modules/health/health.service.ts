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
    const [dbHealthy, redisHealthy] = await Promise.all([
      this.prisma.healthCheck(),
      this.redis.healthCheck(),
    ]);

    const database = dbHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
    const redisStatus = redisHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;

    return {
      healthy: dbHealthy && redisHealthy,
      database,
      redis: redisStatus,
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
}
