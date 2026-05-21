import { Injectable, type NestMiddleware, BadRequestException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /\bunion\s+select\b/gi,
  /\bdrop\s+table\b/gi,
  /\.\.\//g,
  /%2e%2e%2f/gi,
  /\b(select|insert|update|delete)\b\s+.*\bfrom\b/gi,
];

@Injectable()
export class SecuritySanitizationMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    this.scan(req.query, 'query');
    this.scan(req.body as unknown, 'body');
    next();
  }

  private scan(value: unknown, source: 'query' | 'body'): void {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      const isDangerous = DANGEROUS_PATTERNS.some((pattern) => pattern.test(value));
      if (isDangerous) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'SECURITY_VALIDATION_FAILED',
            message: `Potentially malicious input detected in ${source}`,
          },
        });
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        this.scan(entry, source);
      });
      return;
    }

    if (typeof value === 'object') {
      Object.values(value as Record<string, unknown>).forEach((entry) => {
        this.scan(entry, source);
      });
    }
  }
}
