import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '../config/config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis({
      host: this.configService.redisHost,
      port: this.configService.redisPort,
      password: this.configService.redisPassword,
      lazyConnect: false,
      retryStrategy: (times: number): number => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting...');
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    this.logger.log('Redis disconnected');
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }
}
