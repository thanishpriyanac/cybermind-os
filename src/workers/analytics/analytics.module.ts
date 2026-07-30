import { Module } from '@nestjs/common';
import { AnalyticsWorker } from './analytics.worker';

@Module({
  providers: [AnalyticsWorker],
})
export class AnalyticsModule {}
