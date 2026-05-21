import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import type { ApiEnv } from '@trustip/shared-config';

@Injectable()
export class ConfigService {
  constructor(private readonly nestConfig: NestConfigService<ApiEnv, true>) {}

  get appName(): string {
    return this.nestConfig.get('APP_NAME', { infer: true });
  }

  get appEnv(): string {
    return this.nestConfig.get('APP_ENV', { infer: true });
  }

  get appMode(): string {
    return this.nestConfig.get('APP_MODE', { infer: true });
  }

  get port(): number {
    return this.nestConfig.get('APP_PORT', { infer: true });
  }

  get appUrl(): string {
    return this.nestConfig.get('APP_URL', { infer: true });
  }

  get adminUrl(): string {
    return this.nestConfig.get('ADMIN_URL', { infer: true });
  }

  get databaseUrl(): string {
    return this.nestConfig.get('DATABASE_URL', { infer: true });
  }

  get redisHost(): string {
    return this.nestConfig.get('REDIS_HOST', { infer: true });
  }

  get redisPort(): number {
    return this.nestConfig.get('REDIS_PORT', { infer: true });
  }

  get redisPassword(): string {
    return this.nestConfig.get('REDIS_PASSWORD', { infer: true });
  }

  get redisUrl(): string {
    return this.nestConfig.get('REDIS_URL', { infer: true });
  }

  get jwtSecret(): string {
    return this.nestConfig.get('JWT_SECRET', { infer: true });
  }

  get jwtAccessExpiresIn(): string {
    return this.nestConfig.get('JWT_ACCESS_EXPIRES_IN', { infer: true });
  }

  get jwtRefreshExpiresIn(): string {
    return this.nestConfig.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
  }

  get isDevelopment(): boolean {
    return this.appEnv === 'development';
  }

  get isProduction(): boolean {
    return this.appEnv === 'production';
  }

  get isSaasMode(): boolean {
    return this.appMode === 'saas';
  }

  get isEnterpriseMode(): boolean {
    return this.appMode === 'enterprise';
  }

  get securityAbuseWindowSeconds(): number {
    return this.nestConfig.get('SECURITY_ABUSE_WINDOW_SECONDS', { infer: true });
  }

  get securityAbuseThreshold(): number {
    return this.nestConfig.get('SECURITY_ABUSE_THRESHOLD', { infer: true });
  }

  get securityBlockSeconds(): number {
    return this.nestConfig.get('SECURITY_BLOCK_SECONDS', { infer: true });
  }

  get otelExporterOtlpEndpoint(): string | undefined {
    return this.nestConfig.get('OTEL_EXPORTER_OTLP_ENDPOINT', { infer: true });
  }
}
