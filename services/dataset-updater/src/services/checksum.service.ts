import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import type { ChecksumResult } from '../interfaces/dataset.interface';

@Injectable()
export class ChecksumService {
  computeForBuffer(buffer: Buffer): ChecksumResult {
    return {
      sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
      md5: crypto.createHash('md5').update(buffer).digest('hex'),
    };
  }

  async computeForFile(filePath: string): Promise<ChecksumResult> {
    const sha256Hash = crypto.createHash('sha256');
    const md5Hash = crypto.createHash('md5');

    const stream = fs.createReadStream(filePath);

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer | string) => {
        sha256Hash.update(chunk);
        md5Hash.update(chunk);
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    return {
      sha256: sha256Hash.digest('hex'),
      md5: md5Hash.digest('hex'),
    };
  }

  verify(expected: string, actual: string, algorithm: 'sha256' | 'md5' = 'sha256'): boolean {
    if (!expected || !actual) return false;
    // Constant-time comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expected.toLowerCase(), 'hex');
    const actualBuf = Buffer.from(actual.toLowerCase(), 'hex');
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }
}
