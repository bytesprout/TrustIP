import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { DATASET_UPDATE_QUEUE, DATASET_SCHEDULES, DatasetType } from '../constants/dataset.constants';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue(DATASET_UPDATE_QUEUE) private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.registerCronJobs();
  }

  async registerCronJobs(): Promise<void> {
    // Remove stale repeatable jobs before re-registering
    const existingRepeatables = await this.queue.getRepeatableJobs();
    for (const job of existingRepeatables) {
      await this.queue.removeRepeatableByKey(job.key);
    }

    const datasetTypes = Object.values(DatasetType);

    for (const datasetType of datasetTypes) {
      const cron = DATASET_SCHEDULES[datasetType];
      if (!cron) {
        this.logger.warn(`No schedule defined for dataset type: ${datasetType}`);
        continue;
      }

      await this.queue.add(
        'update',
        { datasetType },
        {
          repeat: { pattern: cron },
          removeOnComplete: 100,
          removeOnFail: 50,
          jobId: `dataset-update-${datasetType}`,
        },
      );

      this.logger.log(`Scheduled ${datasetType}: ${cron}`);
    }

    this.logger.log(`Registered ${datasetTypes.length} dataset update schedules`);
  }

  async triggerNow(datasetType: string): Promise<string> {
    const job = await this.queue.add(
      'update',
      { datasetType },
      {
        removeOnComplete: 10,
        removeOnFail: 10,
        priority: 1, // high priority for manual triggers
      },
    );
    this.logger.log(`Queued immediate update for ${datasetType}, job ID: ${job.id ?? 'unknown'}`);
    return job.id ?? 'unknown';
  }

  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}
