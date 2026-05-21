import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string | undefined) ?? uuidv4();
    const tenantId = (request as Request & { tenantId?: string }).tenantId ?? 'system';

    response.setHeader('x-request-id', requestId);
    (request as Request & { requestId: string }).requestId = requestId;

    const startTime = Date.now();
    const { method, originalUrl } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const latency = Date.now() - startTime;
          this.logger.log({
            requestId,
            tenantId,
            method,
            endpoint: originalUrl,
            statusCode: response.statusCode,
            latency,
          });
        },
        error: (error: Error) => {
          const latency = Date.now() - startTime;
          this.logger.error({
            requestId,
            tenantId,
            method,
            endpoint: originalUrl,
            statusCode: response.statusCode,
            latency,
            error: error.message,
          });
        },
      }),
    );
  }
}
