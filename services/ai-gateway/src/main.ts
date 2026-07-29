import { initializeOpenTelemetry, setupObservability } from '../../../packages/sdk/observability-client/src';
initializeOpenTelemetry('ai-gateway-service');

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  setupObservability(app, 'ai-gateway-service');
  const port = process.env.PORT || 3010;
  await app.listen(port);
  Logger.log(`🤖 CYBERMIND AI Gateway running on: http://localhost:${port}/api`);
}

bootstrap();
