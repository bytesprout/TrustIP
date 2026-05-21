import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { URL } from 'url';
import {
  DOWNLOAD_TIMEOUT_MS,
  DOWNLOAD_MAX_RETRIES,
  DOWNLOAD_RETRY_DELAY_MS,
  ALLOWED_DOWNLOAD_DOMAINS,
} from '../constants/dataset.constants';
import type { DownloadResult } from '../interfaces/dataset.interface';
import { ChecksumService } from './checksum.service';

@Injectable()
export class DownloaderService {
  private readonly logger = new Logger(DownloaderService.name);

  constructor(private readonly checksumService: ChecksumService) {}

  async download(url: string, destPath: string): Promise<DownloadResult> {
    this.validateUrl(url);
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= DOWNLOAD_MAX_RETRIES; attempt++) {
      try {
        this.logger.debug(`Downloading ${url} (attempt ${attempt}/${DOWNLOAD_MAX_RETRIES})`);
        await this.downloadWithTimeout(url, destPath);
        const stats = await fs.promises.stat(destPath);
        const checksum = await this.checksumService.computeForFile(destPath);
        return {
          filePath: destPath,
          checksum: checksum.sha256,
          sizeBytes: stats.size,
          downloadedAt: new Date(),
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`Download attempt ${attempt} failed: ${lastError.message}`);
        if (attempt < DOWNLOAD_MAX_RETRIES) {
          await this.sleep(DOWNLOAD_RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw lastError ?? new Error(`Failed to download after ${DOWNLOAD_MAX_RETRIES} attempts`);
  }

  async downloadAndExtractGeoLite(
    edition: string,
    licenseKey: string,
    destDir: string,
  ): Promise<DownloadResult> {
    const url = `https://download.maxmind.com/app/geoip_download?edition_id=${edition}&license_key=${encodeURIComponent(licenseKey)}&suffix=tar.gz`;
    const tempTarGz = path.join(destDir, `${edition}.tar.gz`);

    this.validateUrl(url);
    await fs.promises.mkdir(destDir, { recursive: true });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= DOWNLOAD_MAX_RETRIES; attempt++) {
      try {
        this.logger.debug(`Downloading ${edition} (attempt ${attempt})`);
        await this.downloadWithTimeout(url, tempTarGz);

        // Extract .mmdb from tar.gz
        const mmdbPath = await this.extractMmdb(tempTarGz, destDir, edition);

        // Cleanup temp tar.gz
        await fs.promises.unlink(tempTarGz).catch(() => undefined);

        const stats = await fs.promises.stat(mmdbPath);
        const checksum = await this.checksumService.computeForFile(mmdbPath);

        return {
          filePath: mmdbPath,
          checksum: checksum.sha256,
          sizeBytes: stats.size,
          downloadedAt: new Date(),
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`GeoLite2 download attempt ${attempt} failed: ${lastError.message}`);
        // Cleanup partial download
        await fs.promises.unlink(tempTarGz).catch(() => undefined);
        if (attempt < DOWNLOAD_MAX_RETRIES) {
          await this.sleep(DOWNLOAD_RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw lastError ?? new Error(`Failed to download GeoLite2 ${edition}`);
  }

  private async extractMmdb(tarGzPath: string, destDir: string, edition: string): Promise<string> {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    // Extract to temp location, find .mmdb, move to destDir
    const extractDir = path.join(destDir, `_extract_${Date.now()}`);
    await fs.promises.mkdir(extractDir, { recursive: true });

    try {
      await execFileAsync('tar', ['-xzf', tarGzPath, '-C', extractDir]);

      // Find the .mmdb file in the extracted directory
      const files = await this.findFiles(extractDir, '.mmdb');
      if (files.length === 0) {
        throw new Error(`No .mmdb file found in ${edition} archive`);
      }

      const destPath = path.join(destDir, `${edition}.mmdb`);
      await fs.promises.rename(files[0], destPath);

      return destPath;
    } finally {
      await fs.promises.rm(extractDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private async findFiles(dir: string, ext: string): Promise<string[]> {
    const results: string[] = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await this.findFiles(fullPath, ext)));
      } else if (entry.name.endsWith(ext)) {
        results.push(fullPath);
      }
    }
    return results;
  }

  private async downloadWithTimeout(url: string, destPath: string): Promise<void> {
    const client = url.startsWith('https://') ? https : http;
    const writeStream = fs.createWriteStream(destPath);

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        req.destroy(new Error(`Download timeout after ${DOWNLOAD_TIMEOUT_MS}ms`));
        reject(new Error(`Download timeout: ${url}`));
      }, DOWNLOAD_TIMEOUT_MS);

      const req = client.get(url, { timeout: DOWNLOAD_TIMEOUT_MS }, (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          clearTimeout(timer);
          const location = res.headers.location;
          if (!location) {
            reject(new Error('Redirect without location header'));
            return;
          }
          this.downloadWithTimeout(location, destPath).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          clearTimeout(timer);
          reject(new Error(`HTTP ${res.statusCode ?? 'unknown'} for ${url}`));
          return;
        }

        // Handle gzip content encoding
        const isGzipped = res.headers['content-encoding'] === 'gzip';
        const source = isGzipped ? res.pipe(zlib.createGunzip()) : res;

        pipeline(source as NodeJS.ReadableStream, writeStream)
          .then(() => {
            clearTimeout(timer);
            resolve();
          })
          .catch((err: unknown) => {
            clearTimeout(timer);
            reject(err instanceof Error ? err : new Error(String(err)));
          });
      });

      req.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  private validateUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid download URL: ${url}`);
    }

    // Only allow HTTPS (except for MaxMind which always uses HTTPS)
    if (parsed.protocol !== 'https:') {
      throw new Error(`Only HTTPS downloads allowed. Got: ${parsed.protocol}`);
    }

    // Enforce allowlist
    const isAllowed = ALLOWED_DOWNLOAD_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
    );

    if (!isAllowed) {
      throw new Error(`Download domain not allowlisted: ${parsed.hostname}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
