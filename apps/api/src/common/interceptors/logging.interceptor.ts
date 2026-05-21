import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';
import { createLogger, type Logger } from '@trustip/logger';
import { ObservabilityMetricsService } from '../../modules/observability/observability-metrics.service';
import { TracingService } from '../../modules/observability/tracing.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger = createLogger({
    name: 'trustip-api',
    level: process.env.APP_ENV === 'development' ? 'debug' : 'info',
    isDevelopment: process.env.APP_ENV === 'development',
  });

  constructor(
    private readonly metrics: ObservabilityMetricsService,
    private readonly tracing: TracingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { requestId?: string }>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string | undefined) ?? uuidv4();
    const tenantId = (
      request as Request & { tenant?: { id?: string }; user?: { tenantId?: string | null } }
    ).tenant?.id ?? (
      request as Request & { user?: { tenantId?: string | null } }
    ).user?.tenantId ?? 'system';

    response.setHeader('x-request-id', requestId);
    request.requestId = requestId;

    const startTime = Date.now();
    const { method, originalUrl } = request;
    const clientIp = request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
      ?? request.socket.remoteAddress
      ?? 'unknown';
    const span = this.tracing.startHttpSpan(`${method} ${originalUrl}`, {
      'http.method': method,
      'http.route': originalUrl,
      'http.request_id': requestId,
      'trustip.tenant_id': tenantId,
      'net.peer.ip': clientIp,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const latency = Date.now() - startTime;
          this.metrics.recordRequest({
            method,
            endpoint: originalUrl,
            statusCode: response.statusCode,
            latencyMs: latency,
            tenantId,
          });
          this.logger.info({
            timestamp: new Date().toISOString(),
            service: 'api',
            requestId,
            tenantId,
            method,
            endpoint: originalUrl,
            statusCode: response.statusCode,
            latency,
            ip: clientIp,
          });
          span.setAttribute('http.status_code', response.statusCode);
          this.tracing.finish(span);
        },
        error: (error: Error) => {
          const latency = Date.now() - startTime;
          this.metrics.recordRequest({
            method,
            endpoint: originalUrl,
            statusCode: response.statusCode,
            latencyMs: latency,
            tenantId,
          });
          this.logger.error({
            timestamp: new Date().toISOString(),
            service: 'api',
            requestId,
            tenantId,
            method,
            endpoint: originalUrl,
            statusCode: response.statusCode,
            latency,
            error: error.message,
            ip: clientIp,
          });
          span.setAttribute('http.status_code', response.statusCode);
          this.tracing.setError(span, error);
          this.tracing.finish(span);
        },
      }),
    );
  }
}
