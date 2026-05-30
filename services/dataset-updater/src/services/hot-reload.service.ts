import { Injectable, Logger, Inject } from '@nestjs/common';
import type Redis from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import {
  DatasetType,
  DATASET_EVENTS,
  DATASET_PATHS,
  DATASET_FILENAMES,
  DATASET_REDIS_KEYS,
} from '../constants/dataset.constants';

export const HOT_RELOAD_REDIS_CLIENT = 'HOT_RELOAD_REDIS_CLIENT';

@Injectable()
export class HotReloadService {
  private readonly logger = new Logger(HotReloadService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @Inject(HOT_RELOAD_REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async reload(datasetType: string): Promise<void> {
    this.logger.log(`Hot reload triggered for: ${datasetType}`);

    switch (datasetType) {
      case DatasetType.GEOLITE_CITY:
        await this.emitReload(DATASET_EVENTS.RELOADED_GEOLITE_CITY, datasetType);
        break;
      case DatasetType.GEOLITE_ASN:
        await this.emitReload(DATASET_EVENTS.RELOADED_GEOLITE_ASN, datasetType);
        break;
      case DatasetType.TOR:
        await this.reloadThreatIntelToRedis(datasetType, DATASET_REDIS_KEYS.torIps);
        await this.emitReload(DATASET_EVENTS.RELOADED_TOR, datasetType);
        break;
      case DatasetType.FIREHOL:
        await this.reloadThreatIntelToRedis(datasetType, DATASET_REDIS_KEYS.fireholIps);
        await this.emitReload(DATASET_EVENTS.RELOADED_FIREHOL, datasetType);
        break;
      case DatasetType.VPN:
        await this.reloadThreatIntelToRedis(datasetType, DATASET_REDIS_KEYS.vpnIps);
        await this.emitReload(DATASET_EVENTS.RELOADED_VPN, datasetType);
        break;
      default:
        this.logger.warn(`No hot reload handler for dataset type: ${datasetType}`);
    }
  }

  private async emitReload(event: string, datasetType: string): Promise<void> {
    this.logger.debug(`Emitting ${event}`);
    await this.eventEmitter.emitAsync(event, { datasetType, reloadedAt: new Date() });
  }

  private async reloadThreatIntelToRedis(datasetType: string, redisKey: string): Promise<void> {
    const filename = DATASET_FILENAMES[datasetType];
    if (!filename) return;

    const filePath = path.join(DATASET_PATHS.current(datasetType), filename);
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Threat intel file not found for Redis load: ${filePath}`);
      return;
    }

    const content = await fs.promises.readFile(filePath, 'utf-8');
    const ips = content
      .split('\n')
      .map((l) => l.split(/[#;]/)[0]?.trim() ?? '')
      .filter((l) => l && !l.startsWith('#') && !l.startsWith(';'))
      .map((l) => l.split(/\s+/)[0]?.trim() ?? l)
      .filter((entry) => this.isValidIpOrCidr(entry));

    const exactIps = ips.filter((entry) => !entry.includes('/'));
    const cidrs = ips.filter((entry) => entry.includes('/'));

    if (ips.length === 0) {
      this.logger.warn(`No IPs to load into Redis for ${datasetType}`);
      return;
    }

    // Atomic replace: pipeline DELETE + batch SADD
    const BATCH_SIZE = 5000;
    const pipeline = this.redis.pipeline();
    pipeline.del(redisKey);
    pipeline.del(`${redisKey}:cidr`);

    for (let i = 0; i < exactIps.length; i += BATCH_SIZE) {
      const batch = exactIps.slice(i, i + BATCH_SIZE);
      pipeline.sadd(redisKey, ...batch);
    }
    for (let i = 0; i < cidrs.length; i += BATCH_SIZE) {
      const batch = cidrs.slice(i, i + BATCH_SIZE);
      pipeline.sadd(`${redisKey}:cidr`, ...batch);
    }

    await pipeline.exec();

    this.logger.log(`Loaded ${exactIps.length} exact IPs and ${cidrs.length} CIDRs into Redis set ${redisKey}`);
  }

  async isIpInSet(redisKey: string, ip: string): Promise<boolean> {
    try {
      return (await this.redis.sismember(redisKey, ip)) === 1;
    } catch {
      return false;
    }
  }

  private isValidIpOrCidr(entry: string): boolean {
    if (!entry.includes('/')) {
      return net.isIP(entry) !== 0;
    }

    const [base, prefixRaw] = entry.split('/');
    const prefix = Number(prefixRaw);
    const version = net.isIP(base ?? '');
    if (version === 4) {
      return Number.isInteger(prefix) && prefix >= 0 && prefix <= 32;
    }
    if (version === 6) {
      return Number.isInteger(prefix) && prefix >= 0 && prefix <= 128;
    }
    return false;
  }
}
