import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GeoService } from '@trustip/geo-engine';
import { AsnService } from '@trustip/geo-engine';
import { DATASET_EVENTS } from '@trustip/dataset-updater';

interface DatasetReloadedPayload {
  datasetType: string;
  version: string;
}

@Injectable()
export class GeoReloadListenerService {
  private readonly logger = new Logger(GeoReloadListenerService.name);

  constructor(
    private readonly geoService: GeoService,
    private readonly asnService: AsnService,
  ) {}

  @OnEvent(DATASET_EVENTS.RELOADED_GEOLITE_CITY, { async: true })
  async onGeoliteCity(payload: DatasetReloadedPayload): Promise<void> {
    this.logger.log(`GeoLite2-City updated to version ${payload.version}. Reloading database...`);
    try {
      await this.geoService.loadDatabase();
      this.logger.log('GeoLite2-City database hot-reloaded successfully');
    } catch (err) {
      this.logger.error('Failed to hot-reload GeoLite2-City database', err);
    }
  }

  @OnEvent(DATASET_EVENTS.RELOADED_GEOLITE_ASN, { async: true })
  async onGeoliteAsn(payload: DatasetReloadedPayload): Promise<void> {
    this.logger.log(`GeoLite2-ASN updated to version ${payload.version}. Reloading database...`);
    try {
      await this.asnService.loadDatabase();
      this.logger.log('GeoLite2-ASN database hot-reloaded successfully');
    } catch (err) {
      this.logger.error('Failed to hot-reload GeoLite2-ASN database', err);
    }
  }
}
