import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as maxmind from 'maxmind';
import type { CityResponse, Reader } from 'maxmind';
import { DATASET_FILES } from '../constants/geo.constants';
import type { GeoLocation } from '../interfaces/geo-result.interface';

@Injectable()
export class GeoService implements OnModuleInit {
  private readonly logger = new Logger(GeoService.name);
  private reader: Reader<CityResponse> | null = null;

  private get datasetPath(): string {
    return process.env['GEO_ENGINE_DATASET_PATH'] ?? path.join(process.cwd(), 'data', 'datasets', 'geolite');
  }

  async onModuleInit(): Promise<void> {
    await this.loadDatabase();
  }

  async loadDatabase(): Promise<void> {
    const dbPath = path.join(this.datasetPath, DATASET_FILES.CITY);
    if (!fs.existsSync(dbPath)) {
      this.logger.warn(`GeoLite2-City database not found at: ${dbPath}. Geo lookups will return null.`);
      return;
    }
    try {
      this.reader = await maxmind.open<CityResponse>(dbPath);
      this.logger.log(`GeoLite2-City database loaded from: ${dbPath}`);
    } catch (err) {
      this.logger.error(`Failed to load GeoLite2-City: ${String(err)}`);
      this.reader = null;
    }
  }

  lookup(ip: string): GeoLocation {
    if (!this.reader) {
      return this.emptyLocation();
    }

    try {
      const result = this.reader.get(ip);
      if (!result) return this.emptyLocation();

      return {
        continent: result.continent?.names?.['en'] ?? null,
        country: result.country?.names?.['en'] ?? null,
        countryCode: result.country?.iso_code ?? null,
        state: result.subdivisions?.[0]?.names?.['en'] ?? null,
        district: result.subdivisions?.[1]?.names?.['en'] ?? null,
        city: result.city?.names?.['en'] ?? null,
        zip: result.postal?.code ?? null,
        timezone: result.location?.time_zone ?? null,
        latitude: result.location?.latitude ?? null,
        longitude: result.location?.longitude ?? null,
        geoAccuracyRadiusKm: result.location?.accuracy_radius ?? null,
      };
    } catch {
      return this.emptyLocation();
    }
  }

  isLoaded(): boolean {
    return this.reader !== null;
  }

  private emptyLocation(): GeoLocation {
    return {
      continent: null,
      country: null,
      countryCode: null,
      state: null,
      district: null,
      city: null,
      zip: null,
      timezone: null,
      latitude: null,
      longitude: null,
      geoAccuracyRadiusKm: null,
    };
  }
}
