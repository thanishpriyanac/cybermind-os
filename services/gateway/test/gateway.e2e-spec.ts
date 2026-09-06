import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secretOrPublicKey, options, callback) => {
    if (token === 'valid-token') {
      callback(null, { sub: 'user123', tid: 'tenant123' });
    } else {
      callback(new Error('Invalid token'), null);
    }
  }),
}));

describe('Gateway API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply exact security middleware from main.ts to test them
    app.use(helmet());
    app.enableCors({
      origin: '*',
      credentials: true,
    });
    app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts' }));
    app.use('/api/v1/ai', rateLimit({ windowMs: 60 * 1000, max: 60, message: 'AI rate limit exceeded' }));
    app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 1000 }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health & Basics', () => {
    it('/health/live (GET)', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.body.status).toBe('ok');
          expect(res.headers['x-correlation-id']).toBeDefined();
        });
    });

    it('/api/unknown-route should 401 since it requires Auth by default', () => {
      return request(app.getHttpServer())
        .get('/api/unknown-route')
        .expect(401)
        .expect((res) => {
          expect(res.headers['x-correlation-id']).toBeDefined();
        });
    });
  });

  describe('Security & Rate Limiting', () => {
    it('should include Helmet security headers', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect((res) => {
          expect(res.headers['x-dns-prefetch-control']).toBeDefined();
          expect(res.headers['x-frame-options']).toBeDefined();
          expect(res.headers['strict-transport-security']).toBeDefined();
        });
    });

    it('should include CORS headers', () => {
      return request(app.getHttpServer())
        .options('/health/live')
        .set('Origin', 'http://localhost:3000')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBe('*');
        });
    });

    it('/api/v1/auth should enforce rate limit (max 10)', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer()).post('/api/v1/auth/login');
      }
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .expect(429)
        .expect((res) => {
          expect(res.text).toBe('Too many login attempts');
        });
    });
  });

  describe('Auth Bypass & Proxying', () => {
    it('/api/v1/identity/auth/login (POST) should bypass JWT', () => {
      return request(app.getHttpServer())
        .post('/api/v1/identity/auth/login')
        .expect((res) => {
          expect(res.status).not.toBe(401);
          expect([504, 502, 404, 500]).toContain(res.status);
          expect(res.headers['x-correlation-id']).toBeDefined();
        });
    });

    it('/api/v1/asset/protected (GET) should fail without JWT', () => {
      return request(app.getHttpServer())
        .get('/api/v1/asset/protected')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Missing or invalid Authorization header');
          expect(res.headers['x-correlation-id']).toBeDefined();
        });
    });

    it('/api/v1/asset/protected (GET) should fail with invalid JWT', () => {
      return request(app.getHttpServer())
        .get('/api/v1/asset/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('JWT Validation failed');
          expect(res.headers['x-correlation-id']).toBeDefined();
        });
    });

    it('/api/v1/asset/protected (GET) should pass with valid JWT (proxies to downstream)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/asset/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect((res) => {
          expect(res.status).not.toBe(401);
          expect([504, 502, 404]).toContain(res.status);
          expect(res.headers['x-correlation-id']).toBeDefined();
        });
    });
  });
});
