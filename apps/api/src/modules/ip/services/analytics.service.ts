import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AnalyticsTrackPayload } from '../interfaces/ip.interfaces';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget usage tracking — never throws */
  track(payload: AnalyticsTrackPayload): void {
    this.write(payload).catch((err: unknown) => {
      this.logger.warn(`Analytics write failed: ${String(err)}`);
    });
  }

  private async write(payload: AnalyticsTrackPayload): Promise<void> {
    await this.prisma.apiUsageLog.create({
      data: {
        tenantId: payload.tenantId,
        apiKeyId: payload.apiKeyId ?? null,
        endpoint: payload.endpoint,
        queryIp: payload.queryIp,
        country: payload.country ?? null,
        statusCode: payload.statusCode,
        latencyMs: payload.latencyMs,
        cacheHit: payload.cacheHit,
        scope: payload.scope ?? null,
        userAgent: payload.userAgent ?? null,
      },
    });
  }
}
