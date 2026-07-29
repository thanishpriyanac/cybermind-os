import { initializeOpenTelemetry, setupObservability } from '../../../packages/sdk/observability-client/src';
initializeOpenTelemetry('siem-ingestion-service');

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3004;
  await app.listen(port);
  Logger.log(`🚀 SIEM Ingestion Service running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
