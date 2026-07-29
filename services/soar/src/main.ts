import { initializeOpenTelemetry, setupObservability } from '../../../packages/sdk/observability-client/src';
initializeOpenTelemetry('soar-service');

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  setupObservability(app, 'soar-service');
  const port = process.env.PORT || 3011;
  await app.listen(port);
  Logger.log(`⚙️ CYBERMIND SOAR running on: http://localhost:${port}/api`);
}

bootstrap();
