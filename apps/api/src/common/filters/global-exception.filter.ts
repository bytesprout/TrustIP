import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@trustip/shared-types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        const topLevelMessage = resp['message'] as string | string[] | undefined;
        const nestedError =
          typeof resp['error'] === 'object' && resp['error'] !== null
            ? (resp['error'] as Record<string, unknown>)
            : undefined;

        if (topLevelMessage) {
          message = Array.isArray(topLevelMessage)
            ? topLevelMessage.join(', ')
            : String(topLevelMessage);
        } else if (typeof nestedError?.['message'] === 'string') {
          message = nestedError['message'];
        }

        if (typeof nestedError?.['code'] === 'string') {
          code = nestedError['code'];
        } else if (typeof resp['error'] === 'string') {
          code = resp['error'];
        } else {
          code = this.statusToCode(status);
        }

        details =
          (nestedError?.['details'] as Record<string, unknown> | undefined) ??
          (resp['details'] as Record<string, unknown> | undefined);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        requestId: request.requestId,
      },
    };

    response.status(status).json(errorResponse);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }
}
