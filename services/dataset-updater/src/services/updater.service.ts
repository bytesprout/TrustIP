import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  DatasetType,
  DatasetStatus,
  DATASET_PATHS,
  DATASET_FILENAMES,
  DATASET_SOURCES,
} from '../constants/dataset.constants';
import type { UpdateResult } from '../interfaces/dataset.interface';
import { DownloaderService } from './downloader.service';
import { ValidatorService } from './validator.service';
import { ChecksumService } from './checksum.service';
import { RollbackService } from './rollback.service';
import { RegistryService } from './registry.service';
import { HotReloadService } from './hot-reload.service';

@Injectable()
export class UpdaterService {
  private readonly logger = new Logger(UpdaterService.name);

  constructor(
    private readonly downloader: DownloaderService,
    private readonly validator: ValidatorService,
    private readonly checksum: ChecksumService,
    private readonly rollback: RollbackService,
    private readonly registry: RegistryService,
    private readonly hotReload: HotReloadService,
  ) {}

  async update(datasetType: string): Promise<UpdateResult> {
    const start = Date.now();
    const version = this.buildVersion(datasetType);
    this.logger.log(`Starting update for ${datasetType} (version: ${version})`);

    // Ensure directories exist
    await this.ensureDirectories(datasetType);

    // Initialize registry entry
    await this.registry.getOrCreate(datasetType, datasetType, DATASET_SOURCES[datasetType]);
    await this.registry.markUpdating(datasetType);

    let stagingPath: string | null = null;

    try {
      // Step 1: Download
      const filename = DATASET_FILENAMES[datasetType];
      if (!filename) throw new Error(`Unknown dataset type: ${datasetType}`);

      const stagingDir = DATASET_PATHS.staging();
      stagingPath = path.join(stagingDir, `${datasetType}-${version}-${filename}`);

      this.logger.log(`[${datasetType}] Downloading...`);
      const downloadResult = await this.downloadDataset(datasetType, stagingPath, version);

      // Step 2: Validate
      this.logger.log(`[${datasetType}] Validating...`);
      const validationResult = await this.validator.validate(datasetType, downloadResult.filePath);
      if (!validationResult.valid) {
        throw new Error(`Validation failed: ${validationResult.reason ?? 'unknown'}`);
      }

      // Step 3: Backup current
      this.logger.log(`[${datasetType}] Backing up current...`);
      await this.rollback.backupCurrent(datasetType, version);

      // Step 4: Atomic swap to current
      const currentDir = DATASET_PATHS.current(datasetType);
      const currentPath = path.join(currentDir, filename);
      await this.rollback.atomicSwap(downloadResult.filePath, currentPath);

      // Step 5: Hot reload (no downtime)
      this.logger.log(`[${datasetType}] Hot reloading...`);
      await this.hotReload.reload(datasetType);

      // Step 6: Post-reload validation
      const postValidation = await this.validator.validate(datasetType, currentPath);
      if (!postValidation.valid) {
        // Rollback immediately
        const rollbackVersion = await this.rollback.getLatestBackupVersion(datasetType);
        if (rollbackVersion) {
          await this.rollback.rollback(datasetType, rollbackVersion);
          await this.hotReload.reload(datasetType);
          await this.registry.markRolledBack(datasetType, rollbackVersion);
        }
        throw new Error(`Post-reload validation failed: ${postValidation.reason ?? 'unknown'}`);
      }

      // Step 7: Record success
      const durationMs = Date.now() - start;
      await this.registry.markSuccess(
        datasetType,
        version,
        downloadResult.checksum,
        BigInt(downloadResult.sizeBytes),
      );
      await this.registry.logUpdate(datasetType, version, DatasetStatus.ACTIVE, durationMs);

      this.logger.log(`[${datasetType}] Update complete in ${durationMs}ms`);

      return {
        success: true,
        datasetType: datasetType as typeof DatasetType[keyof typeof DatasetType],
        version,
        checksum: downloadResult.checksum,
        durationMs,
        cacheHit: false,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const durationMs = Date.now() - start;

      this.logger.error(`[${datasetType}] Update failed: ${reason}`);

      // Attempt automatic rollback
      await this.attemptRollback(datasetType);

      await this.registry.markFailed(datasetType, reason).catch(() => undefined);
      await this.registry.logUpdate(datasetType, version, DatasetStatus.FAILED, durationMs, reason);

      return {
        success: false,
        datasetType: datasetType as typeof DatasetType[keyof typeof DatasetType],
        version,
        checksum: null,
        durationMs,
        cacheHit: false,
        error: reason,
      };
    } finally {
      // Cleanup staging file
      if (stagingPath) {
        await fs.promises.unlink(stagingPath).catch(() => undefined);
      }
      // Cleanup temp files
      await this.cleanupTempDir();
    }
  }

  private async downloadDataset(
    datasetType: string,
    stagingPath: string,
    _version: string,
  ): Promise<{ filePath: string; checksum: string; sizeBytes: number }> {
    if (datasetType === DatasetType.GEOLITE_CITY || datasetType === DatasetType.GEOLITE_ASN) {
      const licenseKey = process.env['MAXMIND_LICENSE_KEY'];
      if (!licenseKey) {
        throw new Error('MAXMIND_LICENSE_KEY environment variable required for GeoLite2 download');
      }

      const editionMap: Record<string, string> = {
        [DatasetType.GEOLITE_CITY]: 'GeoLite2-City',
        [DatasetType.GEOLITE_ASN]: 'GeoLite2-ASN',
      };

      const edition = editionMap[datasetType];
      if (!edition) throw new Error(`Unknown GeoLite2 edition for ${datasetType}`);

      const tempDir = DATASET_PATHS.temp();
      const result = await this.downloader.downloadAndExtractGeoLite(edition, licenseKey, tempDir);
      return result;
    }

    const sourceUrl = DATASET_SOURCES[datasetType];
    if (!sourceUrl) throw new Error(`No source URL for ${datasetType}`);

    const result = await this.downloader.download(sourceUrl, stagingPath);
    return result;
  }

  private async attemptRollback(datasetType: string): Promise<void> {
    try {
      const rollbackVersion = await this.rollback.getLatestBackupVersion(datasetType);
      if (!rollbackVersion) {
        this.logger.warn(`[${datasetType}] No backup available for rollback`);
        return;
      }

      const success = await this.rollback.rollback(datasetType, rollbackVersion);
      if (success) {
        await this.hotReload.reload(datasetType);
        await this.registry.markRolledBack(datasetType, rollbackVersion);
        this.logger.log(`[${datasetType}] Auto-rollback to ${rollbackVersion} successful`);
      }
    } catch (rollbackErr) {
      this.logger.error(`[${datasetType}] Rollback failed: ${String(rollbackErr)}`);
    }
  }

  private buildVersion(datasetType: string): string {
    const now = new Date();
    const dateStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

    if (datasetType === DatasetType.TOR) {
      const hourStr = String(now.getUTCHours()).padStart(2, '0');
      return `${dateStr}-${hourStr}h`;
    }

    return dateStr;
  }

  private async ensureDirectories(datasetType: string): Promise<void> {
    await fs.promises.mkdir(DATASET_PATHS.current(datasetType), { recursive: true });
    await fs.promises.mkdir(DATASET_PATHS.staging(), { recursive: true });
    await fs.promises.mkdir(DATASET_PATHS.temp(), { recursive: true });
  }

  private async cleanupTempDir(): Promise<void> {
    const tempDir = DATASET_PATHS.temp();
    try {
      const files = await fs.promises.readdir(tempDir);
      const oneDayAgo = Date.now() - 86_400_000;
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stat = await fs.promises.stat(filePath).catch(() => null);
        if (stat && stat.mtimeMs < oneDayAgo) {
          await fs.promises.unlink(filePath).catch(() => undefined);
        }
      }
    } catch {
      // Non-fatal
    }
  }
}
