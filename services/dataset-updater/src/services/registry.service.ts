import { Injectable, Logger, Inject } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { DatasetStatus } from '../constants/dataset.constants';
import type { DatasetRegistryEntry } from '../interfaces/dataset.interface';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Injectable()
export class RegistryService {
  private readonly logger = new Logger(RegistryService.name);

  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async getOrCreate(datasetName: string, datasetType: string, sourceUrl?: string): Promise<DatasetRegistryEntry> {
    let entry = await this.prisma.datasetRegistry.findUnique({
      where: { datasetName },
    });

    if (!entry) {
      entry = await this.prisma.datasetRegistry.create({
        data: {
          datasetName,
          datasetType,
          sourceUrl: sourceUrl ?? null,
          status: DatasetStatus.ACTIVE,
        },
      });
      this.logger.log(`Created registry entry for ${datasetName}`);
    }

    return entry as DatasetRegistryEntry;
  }

  async markUpdating(datasetName: string): Promise<void> {
    await this.prisma.datasetRegistry.update({
      where: { datasetName },
      data: { status: DatasetStatus.UPDATING },
    });
  }

  async markSuccess(
    datasetName: string,
    version: string,
    checksum: string,
    size: bigint,
    sourceUrl?: string,
  ): Promise<void> {
    await this.prisma.datasetRegistry.update({
      where: { datasetName },
      data: {
        status: DatasetStatus.ACTIVE,
        version,
        checksum,
        size,
        ...(sourceUrl ? { sourceUrl } : {}),
        lastUpdatedAt: new Date(),
        failureReason: null,
      },
    });
  }

  async markFailed(datasetName: string, reason: string): Promise<void> {
    await this.prisma.datasetRegistry.update({
      where: { datasetName },
      data: {
        status: DatasetStatus.FAILED,
        failureReason: reason,
      },
    });
  }

  async markRolledBack(datasetName: string, version: string): Promise<void> {
    await this.prisma.datasetRegistry.update({
      where: { datasetName },
      data: {
        status: DatasetStatus.ROLLED_BACK,
        rollbackVersion: version,
      },
    });
  }

  async getAll(): Promise<DatasetRegistryEntry[]> {
    const entries = await this.prisma.datasetRegistry.findMany();
    return entries as DatasetRegistryEntry[];
  }

  async getOne(datasetName: string): Promise<DatasetRegistryEntry | null> {
    const entry = await this.prisma.datasetRegistry.findUnique({
      where: { datasetName },
    });
    return entry as DatasetRegistryEntry | null;
  }

  async logUpdate(
    datasetName: string,
    version: string | null,
    status: string,
    durationMs: number,
    failureReason?: string,
  ): Promise<void> {
    try {
      await this.prisma.datasetUpdateLog.create({
        data: {
          datasetName,
          version,
          status,
          durationMs,
          failureReason: failureReason ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to write update log: ${String(err)}`);
    }
  }
}

export { PRISMA_CLIENT as DATASET_PRISMA_CLIENT };
