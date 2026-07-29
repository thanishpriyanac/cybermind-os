import { initializeOpenTelemetry, setupObservability } from '../../../packages/sdk/observability-client/src';
initializeOpenTelemetry('gateway-service');

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  setupObservability(app, 'gateway-service');

  // Security Hardening (v0.8.0-alpha)
  app.use(helmet());
  
  app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts' }));
  app.use('/api/v1/ai', rateLimit({ windowMs: 60 * 1000, max: 60, message: 'AI rate limit exceeded' }));
  app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 1000 })); // Global fallback

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🛡️ CYBERMIND Gateway running on: http://localhost:${port}/api`);
}

bootstrap();
