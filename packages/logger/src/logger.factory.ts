import pino, { type Logger, type LoggerOptions } from 'pino';

export interface LogContext {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface TrustIPLoggerOptions {
  name: string;
  level?: string;
  isDevelopment?: boolean;
  context?: LogContext;
}

export function createLogger(options: TrustIPLoggerOptions): Logger {
  const { name, level = 'info', isDevelopment = false, context = {} } = options;

  const pinoOptions: LoggerOptions = {
    name,
    level,
    base: {
      service: name,
      ...context,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label: string): Record<string, string> {
        return { level: label };
      },
    },
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["x-api-key"]',
        'password',
        'passwordHash',
        'token',
        'refreshToken',
        'accessToken',
        'secret',
      ],
      censor: '[REDACTED]',
    },
  };

  if (isDevelopment) {
    return pino({
      ...pinoOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino(pinoOptions);
}

export function createChildLogger(
  parent: Logger,
  context: LogContext,
): Logger {
  return parent.child(context);
}

export { type Logger } from 'pino';
