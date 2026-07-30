import { Module, Global } from '@nestjs/common';
import { MetricsService } from './services/metrics.service';
import { ObservabilityController } from './observability.controller';

@Global()
@Module({
  providers: [MetricsService],
  controllers: [ObservabilityController],
  exports: [MetricsService],
})
export class ObservabilityModule {}
