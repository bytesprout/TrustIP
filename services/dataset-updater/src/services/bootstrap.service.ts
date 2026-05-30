import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatasetType } from '../constants/dataset.constants';
import { HotReloadService } from './hot-reload.service';
import { RegistryService } from './registry.service';
import { SchedulerService } from './scheduler.service';
import { ValidatorService } from './validator.service';

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
    for (const datasetType of [DatasetType.TOR, DatasetType.FIREHOL, DatasetType.VPN]) {
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
    const datasetTypes = [
      DatasetType.GEOLITE_CITY,
      DatasetType.GEOLITE_ASN,
      DatasetType.TOR,
      DatasetType.FIREHOL,
      DatasetType.VPN,
    ];

    for (const datasetType of datasetTypes) {
      const entry = await this.registry.getOne(datasetType).catch(() => null);
      const hasLocalFile = this.validator.fileExists(datasetType);
      const needsUpdate = !entry || !entry.lastUpdatedAt || entry.status === 'FAILED' || !hasLocalFile;

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
