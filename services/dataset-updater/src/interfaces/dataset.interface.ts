import type { DatasetType, DatasetStatus } from '../constants/dataset.constants';

export interface DatasetRegistryEntry {
  id: string;
  datasetName: string;
  datasetType: string;
  sourceUrl: string | null;
  version: string | null;
  checksum: string | null;
  size: bigint | null;
  status: DatasetStatus;
  lastUpdatedAt: Date | null;
  failureReason: string | null;
  rollbackVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatasetUpdateLogEntry {
  id: string;
  datasetName: string;
  version: string | null;
  status: string;
  durationMs: number | null;
  failureReason: string | null;
  createdAt: Date;
}

export interface UpdateResult {
  success: boolean;
  datasetType: DatasetType;
  version: string;
  checksum: string | null;
  durationMs: number;
  cacheHit: boolean;
  error?: string;
}

export interface DownloadResult {
  filePath: string;
  checksum: string;
  sizeBytes: number;
  downloadedAt: Date;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  entryCount?: number;
  sizeBytes?: number;
}

export interface ChecksumResult {
  sha256: string;
  md5: string;
}

export interface DatasetHealth {
  healthy: boolean;
  datasets: Record<string, DatasetHealthStatus>;
}

export interface DatasetHealthStatus {
  status: 'healthy' | 'stale' | 'missing' | 'failed';
  version: string | null;
  lastUpdated: Date | null;
}
