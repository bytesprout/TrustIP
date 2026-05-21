import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  DATASET_PATHS,
  DATASET_FILENAMES,
  MAX_BACKUP_VERSIONS,
} from '../constants/dataset.constants';

@Injectable()
export class RollbackService {
  private readonly logger = new Logger(RollbackService.name);

  async backupCurrent(datasetType: string, version: string): Promise<boolean> {
    const filename = DATASET_FILENAMES[datasetType];
    if (!filename) return false;

    const currentPath = path.join(DATASET_PATHS.current(datasetType), filename);
    if (!fs.existsSync(currentPath)) {
      this.logger.debug(`No current file to backup for ${datasetType}`);
      return false;
    }

    const backupDir = DATASET_PATHS.backup(datasetType, version);
    await fs.promises.mkdir(backupDir, { recursive: true });

    const backupPath = path.join(backupDir, filename);
    await fs.promises.copyFile(currentPath, backupPath);

    this.logger.log(`Backed up ${datasetType} v${version} to ${backupPath}`);

    // Cleanup old backups beyond retention limit
    await this.pruneOldBackups(datasetType);

    return true;
  }

  async rollback(datasetType: string, rollbackVersion: string): Promise<boolean> {
    const filename = DATASET_FILENAMES[datasetType];
    if (!filename) {
      this.logger.warn(`No filename mapping for dataset type: ${datasetType}`);
      return false;
    }

    const backupPath = path.join(DATASET_PATHS.backup(datasetType, rollbackVersion), filename);
    if (!fs.existsSync(backupPath)) {
      this.logger.error(`Rollback file not found: ${backupPath}`);
      return false;
    }

    const currentDir = DATASET_PATHS.current(datasetType);
    await fs.promises.mkdir(currentDir, { recursive: true });
    const currentPath = path.join(currentDir, filename);

    // Atomic rename for rollback
    const tempPath = `${currentPath}.rollback.${Date.now()}`;
    await fs.promises.copyFile(backupPath, tempPath);
    await fs.promises.rename(tempPath, currentPath);

    this.logger.log(`Rolled back ${datasetType} to version ${rollbackVersion}`);
    return true;
  }

  async getLatestBackupVersion(datasetType: string): Promise<string | null> {
    const backupBase = path.join(DATASET_PATHS.base(), 'backup', datasetType);
    if (!fs.existsSync(backupBase)) return null;

    const versions = await fs.promises.readdir(backupBase);
    if (versions.length === 0) return null;

    // Sort descending (ISO date strings sort correctly lexicographically)
    versions.sort((a, b) => b.localeCompare(a));
    return versions[0] ?? null;
  }

  async atomicSwap(stagingPath: string, targetPath: string): Promise<void> {
    const targetDir = path.dirname(targetPath);
    await fs.promises.mkdir(targetDir, { recursive: true });

    // Write to a temp file in same directory, then rename (atomic on most OS)
    const tempPath = `${targetPath}.tmp.${Date.now()}`;
    await fs.promises.copyFile(stagingPath, tempPath);
    await fs.promises.rename(tempPath, targetPath);

    this.logger.debug(`Atomic swap: ${stagingPath} → ${targetPath}`);
  }

  private async pruneOldBackups(datasetType: string): Promise<void> {
    const backupBase = path.join(DATASET_PATHS.base(), 'backup', datasetType);
    if (!fs.existsSync(backupBase)) return;

    const versions = await fs.promises.readdir(backupBase);
    versions.sort((a, b) => b.localeCompare(a)); // newest first

    const toDelete = versions.slice(MAX_BACKUP_VERSIONS);
    for (const version of toDelete) {
      const versionDir = path.join(backupBase, version);
      await fs.promises.rm(versionDir, { recursive: true, force: true });
      this.logger.debug(`Pruned old backup: ${datasetType}/${version}`);
    }
  }
}
