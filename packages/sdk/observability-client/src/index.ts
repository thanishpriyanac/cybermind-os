import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as promClient from 'prom-client';
import pinoHttp from 'pino-http';
import helmet from 'helmet';
import { initializeOpenTelemetry } from './opentelemetry';

export { initializeOpenTelemetry };

export function setupObservability(app: INestApplication, serviceName: string) {
  // Security Hardening (Phase 2)
  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // 1. Initialize Prometheus Metrics
  promClient.collectDefaultMetrics({ prefix: `${serviceName.replace(/-/g, '_')}_` });
  
  const httpRequestsTotal = new promClient.Counter({
    name: `${serviceName.replace(/-/g, '_')}_http_requests_total`,
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  // 2. Setup HTTP Logging via Pino
  app.use(pinoHttp({
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customProps: (req, res) => ({
      service: serviceName,
      traceId: req.headers['x-trace-id'], // If passed through via gateway
    }),
  }));

  // 3. Attach standard observability endpoints directly to Express/Fastify
  const httpAdapter = app.getHttpAdapter();

  httpAdapter.get('/metrics', async (req: any, res: any) => {
    res.setHeader('Content-Type', promClient.register.contentType);
    res.send(await promClient.register.metrics());
  });

  httpAdapter.get('/health', (req: any, res: any) => {
    res.status(200).json({ status: 'ok', service: serviceName, timestamp: new Date().toISOString() });
  });

  httpAdapter.get('/live', (req: any, res: any) => {
    res.status(200).json({ status: 'live' });
  });

  httpAdapter.get('/ready', (req: any, res: any) => {
    res.status(200).json({ status: 'ready' });
  });

  // Middleware for prometheus counters
  app.use((req: any, res: any, next: () => void) => {
    res.on('finish', () => {
      // Exclude observability endpoints from counting to avoid noise
      if (!['/metrics', '/health', '/live', '/ready'].includes(req.path)) {
        httpRequestsTotal.inc({
          method: req.method,
          route: req.route ? req.route.path : req.path,
          status_code: res.statusCode,
        });
      }
    });
    next();
  });
}
