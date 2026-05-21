import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { DATASET_UPDATE_QUEUE } from '../constants/dataset.constants';
import { UpdaterService } from '../services/updater.service';

interface DatasetUpdateJobData {
  datasetType: string;
  lastError?: string;
}

@Processor(DATASET_UPDATE_QUEUE)
export class DatasetUpdateProcessor extends WorkerHost {
  private readonly logger = new Logger(DatasetUpdateProcessor.name);

  constructor(private readonly updaterService: UpdaterService) {
    super();
  }

  async process(job: Job<DatasetUpdateJobData>): Promise<void> {
    const { datasetType } = job.data;
    this.logger.log(`Processing dataset update job: ${datasetType} (job ID: ${job.id ?? 'unknown'})`);

    const result = await this.updaterService.update(datasetType);

    if (!result.success) {
      // BullMQ will retry on thrown errors — don't throw here since updater already rolled back
      this.logger.error(
        `Dataset update FAILED for ${datasetType}: ${result.error ?? 'unknown error'}`,
      );
      // Report failure to BullMQ job metadata (non-throwing — rollback already handled)
      await job.updateData({ ...job.data, lastError: result.error });
    } else {
      this.logger.log(
        `Dataset update SUCCESS for ${datasetType} (version: ${result.version}, ${result.durationMs}ms)`,
      );
    }
  }
}
