import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GeoLookupService,
  IpValidatorService,
  type IpLookupResult,
} from '@trustip/geo-engine';
import type { Request } from 'express';

@Injectable()
export class IpService {
  private readonly logger = new Logger(IpService.name);

  constructor(
    private readonly geoLookupService: GeoLookupService,
    private readonly ipValidator: IpValidatorService,
    private readonly prisma: PrismaService,
  ) {}

  async lookup(req: Request, tenantId: string, targetIp?: string): Promise<IpLookupResult> {
    const start = Date.now();
    let ip: string;

    if (targetIp) {
      if (!this.ipValidator.isValid(targetIp) || !this.ipValidator.isPublicRoutable(targetIp)) {
        throw new BadRequestException('Invalid or private IP address');
      }
      ip = targetIp;
    } else {
      const extracted = this.ipValidator.extractFromHeaders(
        req.headers as Record<string, string>,
        req.socket.remoteAddress,
      );
      if (!extracted) {
        throw new BadRequestException('Unable to determine client IP address');
      }
      ip = extracted;
    }

    const result = await this.geoLookupService.lookup({ ip, tenantId });

    // Fire-and-forget audit log
    const latency = Date.now() - start;
    this.logLookup(tenantId, ip, result, latency, '/api/v1/ip/basic').catch((err: unknown) => {
      this.logger.warn(`IpLookupLog write failed: ${String(err)}`);
    });

    return result;
  }

  private async logLookup(
    tenantId: string,
    ip: string,
    result: IpLookupResult,
    latencyMs: number,
    endpoint: string,
  ): Promise<void> {
    try {
      await this.prisma.ipLookupLog.create({
        data: {
          tenantId,
          ip,
          country: result.location?.country ?? null,
          countryCode: result.location?.countryCode ?? null,
          city: result.location?.city ?? null,
          asn: result.network?.asn ?? null,
          isp: result.network?.isp ?? null,
          cacheHit: result.metadata.cacheHit,
          latencyMs,
          endpoint,
        },
      });
    } catch (err) {
      this.logger.warn(`IpLookupLog Prisma error: ${String(err)}`);
    }
  }
}
