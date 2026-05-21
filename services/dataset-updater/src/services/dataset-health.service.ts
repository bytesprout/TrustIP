import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RegistryService } from './registry.service';
import {
  DatasetType,
  DATASET_PATHS,
  DATASET_FILENAMES,
} from '../constants/dataset.constants';
import type { DatasetHealth, DatasetHealthStatus } from '../interfaces/dataset.interface';

// Max age before a dataset is considered stale (hours)
const MAX_STALE_AGE: Record<string, number> = {
  [DatasetType.GEOLITE_CITY]: 7 * 24,   // 7 days
  [DatasetType.GEOLITE_ASN]: 7 * 24,    // 7 days
  [DatasetType.TOR]: 12,                 // 12 hours
  [DatasetType.FIREHOL]: 36,             // 36 hours
  [DatasetType.VPN]: 36,                 // 36 hours
};

@Injectable()
export class DatasetHealthService {
  private readonly logger = new Logger(DatasetHealthService.name);

  constructor(private readonly registry: RegistryService) {}

  async getHealth(): Promise<DatasetHealth> {
    const statuses: Record<string, DatasetHealthStatus> = {};
    let allHealthy = true;

    for (const datasetType of Object.values(DatasetType)) {
      const status = await this.checkDataset(datasetType);
      statuses[datasetType] = status;
      if (status.status !== 'healthy') {
        allHealthy = false;
      }
    }

    return { healthy: allHealthy, datasets: statuses };
  }

  private async checkDataset(datasetType: string): Promise<DatasetHealthStatus> {
    const filename = DATASET_FILENAMES[datasetType];

    // ASN_INTEL has no local file, check only registry
    if (!filename) {
      const entry = await this.registry.getOne(datasetType).catch(() => null);
      return {
        status: entry ? 'healthy' : 'missing',
        version: entry?.version ?? null,
        lastUpdated: entry?.lastUpdatedAt ?? null,
      };
    }

    const filePath = path.join(DATASET_PATHS.current(datasetType), filename);
    const fileExists = fs.existsSync(filePath);

    if (!fileExists) {
      return { status: 'missing', version: null, lastUpdated: null };
    }

    const entry = await this.registry.getOne(datasetType).catch(() => null);

    if (entry?.status === 'FAILED') {
      return {
        status: 'failed',
        version: entry.version ?? null,
        lastUpdated: entry.lastUpdatedAt ?? null,
      };
    }

    // Check staleness
    const lastUpdated = entry?.lastUpdatedAt ?? null;
    if (lastUpdated) {
      const maxAgeHours = MAX_STALE_AGE[datasetType] ?? 48;
      const ageHours = (Date.now() - lastUpdated.getTime()) / 3_600_000;
      if (ageHours > maxAgeHours) {
        return {
          status: 'stale',
          version: entry?.version ?? null,
          lastUpdated,
        };
      }
    }

    return {
      status: 'healthy',
      version: entry?.version ?? null,
      lastUpdated,
    };
  }
}
