import { Injectable } from '@nestjs/common';

@Injectable()
export class ExplainabilityService {
  buildConfidence(geoConfidenceScore: number, signalCount: number): string {
    if (geoConfidenceScore >= 70 && signalCount === 0) return 'HIGH';
    if (geoConfidenceScore >= 50) return 'MEDIUM';
    return 'LOW';
  }
}
