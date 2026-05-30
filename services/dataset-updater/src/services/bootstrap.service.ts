import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatasetStatus, DatasetType } from '../constants/dataset.constants';
import { HotReloadService } from './hot-reload.service';
import { RegistryService } from './registry.service';
import { SchedulerService } from './scheduler.service';
import { ValidatorService } from './validator.service';

const THREAT_INTEL_DATASETS = [DatasetType.TOR, DatasetType.FIREHOL, DatasetType.VPN] as const;
const BOOTSTRAP_DATASETS = [
  DatasetType.GEOLITE_CITY,
  DatasetType.GEOLITE_ASN,
  ...THREAT_INTEL_DATASETS,
] as const;

@Injectable()
export class DatasetBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(DatasetBootstrapService.name);

  constructor(
    private readonly hotReload: HotReloadService,
    private readonly registry: RegistryService,
    private readonly scheduler: SchedulerService,
    private readonly validator: ValidatorService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.preloadThreatIntelSets();
    await this.ensureInitialUpdates();
  }

  private async preloadThreatIntelSets(): Promise<void> {
    for (const datasetType of THREAT_INTEL_DATASETS) {
      if (!this.validator.fileExists(datasetType)) {
        this.logger.warn(`bootstrap_preload_skipped ${JSON.stringify({ datasetType, reason: 'file_missing' })}`);
        continue;
      }

      try {
        await this.hotReload.reload(datasetType);
        this.logger.log(`bootstrap_preload_success ${JSON.stringify({ datasetType })}`);
      } catch (err) {
        this.logger.warn(`bootstrap_preload_failed ${JSON.stringify({ datasetType, error: String(err) })}`);
      }
    }
  }

  private async ensureInitialUpdates(): Promise<void> {
    for (const datasetType of BOOTSTRAP_DATASETS) {
      const entry = await this.registry.getOne(datasetType).catch(() => null);
      const hasLocalFile = this.validator.fileExists(datasetType);
      const needsUpdate = !entry || !entry.lastUpdatedAt || entry.status === DatasetStatus.FAILED || !hasLocalFile;

      if (!needsUpdate) {
        continue;
      }

      try {
        const jobId = await this.scheduler.triggerNow(datasetType);
        this.logger.log(`bootstrap_update_queued ${JSON.stringify({ datasetType, jobId })}`);
      } catch (err) {
        this.logger.warn(`bootstrap_update_queue_failed ${JSON.stringify({ datasetType, error: String(err) })}`);
      }
    }
  }
}
