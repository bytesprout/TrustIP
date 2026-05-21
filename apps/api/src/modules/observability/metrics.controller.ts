import { Controller, Get, Header } from '@nestjs/common';
import { ObservabilityMetricsService } from './observability-metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: ObservabilityMetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async metrics(): Promise<string> {
    return this.metricsService.serialize();
  }
}
