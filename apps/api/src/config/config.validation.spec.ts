import { validateApiEnv } from '@trustip/shared-config';

describe('Environment Validation', () => {
  const validEnv = {
    APP_NAME: 'TrustIP',
    APP_ENV: 'development',
    APP_MODE: 'saas',
    APP_PORT: '8080',
    APP_URL: 'http://localhost:8080',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: 'secure-redis-password',
    REDIS_URL: 'redis://:secure-redis-password@localhost:6379',
    JWT_SECRET: 'a-very-secure-jwt-secret-that-is-at-least-64-chars-long-xxxxxxxxxxxxxxxxxxx',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '30d',
    ADMIN_URL: 'http://localhost:3000',
  };

  it('should validate a complete valid environment', () => {
    const result = validateApiEnv(validEnv as NodeJS.ProcessEnv);
    expect(result.APP_ENV).toBe('development');
    expect(result.APP_MODE).toBe('saas');
    expect(result.APP_PORT).toBe(8080);
  });

  it('should throw on missing DATABASE_URL', () => {
    const env = { ...validEnv, DATABASE_URL: '' };
    expect(() => validateApiEnv(env as NodeJS.ProcessEnv)).toThrow();
  });

  it('should throw on missing REDIS_PASSWORD', () => {
    const env = { ...validEnv, REDIS_PASSWORD: '' };
    expect(() => validateApiEnv(env as NodeJS.ProcessEnv)).toThrow();
  });

  it('should throw on JWT_SECRET too short', () => {
    const env = { ...validEnv, JWT_SECRET: 'too-short' };
    expect(() => validateApiEnv(env as NodeJS.ProcessEnv)).toThrow();
  });

  it('should throw on invalid APP_ENV', () => {
    const env = { ...validEnv, APP_ENV: 'invalid' };
    expect(() => validateApiEnv(env as NodeJS.ProcessEnv)).toThrow();
  });

  it('should throw on invalid APP_MODE', () => {
    const env = { ...validEnv, APP_MODE: 'invalid' };
    expect(() => validateApiEnv(env as NodeJS.ProcessEnv)).toThrow();
  });

  it('should use default values when optional fields are missing', () => {
    const env = { ...validEnv };
    delete (env as Partial<typeof validEnv>).APP_NAME;
    const result = validateApiEnv(env as NodeJS.ProcessEnv);
    expect(result.APP_NAME).toBe('TrustIP');
  });
});
