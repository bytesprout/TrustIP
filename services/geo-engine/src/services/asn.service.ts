import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as maxmind from 'maxmind';
import type { AsnResponse, Reader } from 'maxmind';
import { DATASET_FILES } from '../constants/geo.constants';
import { IspClassifierService } from './isp-classifier.service';
import type { AsnResult } from '../interfaces/geo-result.interface';

@Injectable()
export class AsnService implements OnModuleInit {
  private readonly logger = new Logger(AsnService.name);
  private reader: Reader<AsnResponse> | null = null;

  constructor(private readonly ispClassifier: IspClassifierService) {}

  private get datasetPath(): string {
    return process.env['GEO_ENGINE_DATASET_PATH'] ?? path.join(process.cwd(), 'data', 'datasets', 'geolite');
  }

  async onModuleInit(): Promise<void> {
    await this.loadDatabase();
  }

  async loadDatabase(): Promise<void> {
    const dbPath = path.join(this.datasetPath, DATASET_FILES.ASN);
    if (!fs.existsSync(dbPath)) {
      this.logger.warn(`GeoLite2-ASN database not found at: ${dbPath}. ASN lookups will return null.`);
      return;
    }
    try {
      this.reader = await maxmind.open<AsnResponse>(dbPath);
      this.logger.log(`GeoLite2-ASN database loaded from: ${dbPath}`);
    } catch (err) {
      this.logger.error(`Failed to load GeoLite2-ASN: ${String(err)}`);
      this.reader = null;
    }
  }

  lookup(ip: string): AsnResult {
    if (!this.reader) {
      return this.emptyAsn();
    }

    try {
      const result = this.reader.get(ip);
      if (!result) return this.emptyAsn();

      const org = result.autonomous_system_organization ?? null;
      const network = (result as unknown as { ip_prefix?: string }).ip_prefix ?? null;
      const connectionType = this.ispClassifier.classify(org ?? '');

      return {
        asn: result.autonomous_system_number ?? null,
        isp: org,
        organization: org,
        network,
        connectionType,
      };
    } catch {
      return this.emptyAsn();
    }
  }

  isLoaded(): boolean {
    return this.reader !== null;
  }

  private emptyAsn(): AsnResult {
    return {
      asn: null,
      isp: null,
      organization: null,
      network: null,
      connectionType: this.ispClassifier.classify(''),
    };
  }
}
