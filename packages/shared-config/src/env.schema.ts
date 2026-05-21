import { z } from 'zod';

const appEnvValues = ['development', 'staging', 'production'] as const;
const appModeValues = ['saas', 'enterprise'] as const;

export const ApiEnvSchema = z.object({
  // Application
  APP_NAME: z.string().default('TrustIP'),
  APP_ENV: z.enum(appEnvValues).default('development'),
  APP_MODE: z.enum(appModeValues).default('saas'),
  APP_PORT: z.coerce.number().int().positive().default(8080),
  APP_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().min(1, 'REDIS_PASSWORD is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // JWT
  JWT_SECRET: z
    .string()
    .min(64, 'JWT_SECRET must be at least 64 characters for security'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Admin
  ADMIN_URL: z.string().url().default('http://localhost:3000'),

  // Security monitoring
  SECURITY_ABUSE_WINDOW_SECONDS: z.coerce.number().int().positive().default(300),
  SECURITY_ABUSE_THRESHOLD: z.coerce.number().int().positive().default(8),
  SECURITY_BLOCK_SECONDS: z.coerce.number().int().positive().default(900),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;

export const AdminEnvSchema = z.object({
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
});

export type AdminEnv = z.infer<typeof AdminEnvSchema>;

export function validateApiEnv(env: Record<string, string | undefined>): ApiEnv {
  const result = ApiEnvSchema.safeParse(env);
  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(
      `❌ Invalid environment variables:\n${JSON.stringify(formatted, null, 2)}`,
    );
  }
  return result.data;
}
