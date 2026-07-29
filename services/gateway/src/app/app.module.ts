import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { JwtAuthMiddleware } from './middleware/jwt-auth.middleware';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 req per minute
    }]),
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. First, inject Correlation IDs globally
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');

    // 2. Extract and validate JWT (populates req.headers['x-tenant-id'])
    consumer.apply(JwtAuthMiddleware).forRoutes('*');

    // 3. Reverse Proxy to Identity Service
    consumer
      .apply(createProxyMiddleware({
        target: 'http://identity:3001',
        changeOrigin: true,
        pathRewrite: { '^/api/v1/identity': '' },
      }))
      .forRoutes({ path: 'identity/*', method: RequestMethod.ALL });

    // 4. Reverse Proxy to Asset Service (future)
    consumer
      .apply(createProxyMiddleware({
        target: 'http://asset:3002',
        changeOrigin: true,
        pathRewrite: { '^/api/v1/asset': '' },
      }))
      .forRoutes({ path: 'asset/*', method: RequestMethod.ALL });
  }
}
