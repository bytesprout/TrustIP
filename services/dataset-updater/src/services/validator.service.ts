import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import * as maxmind from 'maxmind';
import type { CityResponse } from 'maxmind';
import {
  DatasetType,
  VALIDATION_THRESHOLDS,
  DATASET_FILENAMES,
  DATASET_PATHS,
} from '../constants/dataset.constants';
import type { ValidationResult } from '../interfaces/dataset.interface';

@Injectable()
export class ValidatorService {
  private readonly logger = new Logger(ValidatorService.name);

  async validate(datasetType: string, filePath: string): Promise<ValidationResult> {
    try {
      switch (datasetType) {
        case DatasetType.GEOLITE_CITY:
          return await this.validateMmdb(filePath, 'city', VALIDATION_THRESHOLDS[DatasetType.GEOLITE_CITY].minSizeBytes);
        case DatasetType.GEOLITE_ASN:
          return await this.validateMmdb(filePath, 'asn', VALIDATION_THRESHOLDS[DatasetType.GEOLITE_ASN].minSizeBytes);
        case DatasetType.TOR:
          return await this.validateIpList(filePath, VALIDATION_THRESHOLDS[DatasetType.TOR].minEntries);
        case DatasetType.FIREHOL:
          return await this.validateIpList(filePath, VALIDATION_THRESHOLDS[DatasetType.FIREHOL].minEntries, true);
        case DatasetType.VPN:
          return await this.validateIpList(filePath, VALIDATION_THRESHOLDS[DatasetType.VPN].minEntries);
        default:
          return { valid: true };
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Validation failed for ${datasetType}: ${reason}`);
      return { valid: false, reason };
    }
  }

  private async validateMmdb(filePath: string, type: string, minSizeBytes: number): Promise<ValidationResult> {
    if (!fs.existsSync(filePath)) {
      return { valid: false, reason: `File not found: ${filePath}` };
    }

    const stats = await fs.promises.stat(filePath);
    if (stats.size < minSizeBytes) {
      return {
        valid: false,
        reason: `File too small: ${stats.size} bytes (minimum ${minSizeBytes} bytes)`,
        sizeBytes: stats.size,
      };
    }

    // Test actual lookup to verify database is readable and functional
    try {
      const reader = await maxmind.open<CityResponse>(filePath);
      // Test with a known public IP
      const testIp = type === 'city' ? '8.8.8.8' : '8.8.8.8';
      const result = reader.get(testIp);
      if (result === null) {
        // null is valid — IP might not be in DB, but it proves DB is readable
        this.logger.debug(`MMDB test lookup returned null for ${testIp} — file is valid`);
      }
      return { valid: true, sizeBytes: stats.size };
    } catch (err) {
      return {
        valid: false,
        reason: `MMDB read test failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  private async validateIpList(
    filePath: string,
    minEntries: number,
    allowCidr = false,
  ): Promise<ValidationResult> {
    if (!fs.existsSync(filePath)) {
      return { valid: false, reason: `File not found: ${filePath}` };
    }

    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && !l.startsWith(';'));

    let validCount = 0;
    const invalid: string[] = [];

    for (const line of lines) {
      const entry = allowCidr ? line.split('/')[0] : line;
      if (net.isIP(entry ?? '') !== 0) {
        validCount++;
      } else if (invalid.length < 5) {
        invalid.push(line);
      }
    }

    if (validCount < minEntries) {
      return {
        valid: false,
        reason: `Too few valid entries: ${validCount} (minimum ${minEntries}). Invalid samples: ${invalid.join(', ')}`,
        entryCount: validCount,
      };
    }

    return { valid: true, entryCount: validCount };
  }

  /** Verify a file exists at the expected current path */
  fileExists(datasetType: string): boolean {
    const filename = DATASET_FILENAMES[datasetType];
    if (!filename) return false;
    const filePath = path.join(DATASET_PATHS.current(datasetType), filename);
    return fs.existsSync(filePath);
  }
}
