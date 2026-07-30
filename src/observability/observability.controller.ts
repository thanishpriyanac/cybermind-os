import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './services/metrics.service';

@Controller('metrics')
export class ObservabilityController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  getMetrics() {
    return this.metricsService.getMetrics();
  }
}
