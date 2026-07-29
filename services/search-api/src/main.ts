import { initializeOpenTelemetry, setupObservability } from '../../../packages/sdk/observability-client/src';
initializeOpenTelemetry('search-api-service');

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  setupObservability(app, 'search-api-service');
  const port = process.env.PORT || 3005;
  await app.listen(port);
  Logger.log(`🚀 Search API running on: http://localhost:${port}/api`);
}

bootstrap();
