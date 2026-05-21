import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse, ApiMeta } from '@trustip/shared-types';
import type { Request } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<unknown>> {
    const request = context.switchToHttp().getRequest<Request & { requestId?: string }>();

    return next.handle().pipe(
      map((data: unknown) => {
        const meta: ApiMeta = {
          requestId: request.requestId ?? 'unknown',
          timestamp: new Date().toISOString(),
          version: '1',
        };

        return {
          success: true,
          data,
          meta,
        } satisfies ApiResponse<unknown>;
      }),
    );
  }
}
