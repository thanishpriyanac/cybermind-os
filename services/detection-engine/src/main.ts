import { initializeOpenTelemetry, setupObservability } from '../../../packages/sdk/observability-client/src';
initializeOpenTelemetry('detection-engine-service');

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  setupObservability(app, 'detection-engine-service');
  const port = process.env.PORT || 3006;
  await app.listen(port);
  Logger.log(`🚀 Detection Engine running on: http://localhost:${port}/api`);
}

bootstrap();
