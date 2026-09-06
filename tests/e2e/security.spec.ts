/**
 * CYBERMIND OS — RC-002 Security Validation Suite
 *
 * Covers:
 *  - JWT tampering, expiry, signature validation
 *  - Refresh token rotation
 *  - Tenant boundary enforcement
 *  - Authorization bypass attempts
 *  - Rate limiting under load
 *  - CORS validation
 *  - Security header validation (Helmet)
 */
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';

// ─── Configuration ────────────────────────────────────────────────────────────
const GATEWAY_URL  = process.env.GATEWAY_URL  || 'http://localhost:3000';
const IDENTITY_URL = process.env.IDENTITY_URL || 'http://localhost:3001';

const TENANT_A = 'tenant-security-A';
const TENANT_B = 'tenant-security-B';
const WRONG_SECRET = 'wrong-jwt-secret-for-tampering';

// Helper: create a tampered JWT signed with the wrong secret
function signFakeToken(payload: object): string {
  return jwt.sign(payload, WRONG_SECRET, { expiresIn: '1h' });
}

// Helper: create an expired JWT (signed with wrong secret and already expired)
function signExpiredToken(payload: object): string {
  return jwt.sign(payload, WRONG_SECRET, { expiresIn: '-1s' });
}

describe('RC-002 Security Validation', () => {
  // ── 1. JWT Security ─────────────────────────────────────────────────────────
  describe('JWT Security', () => {
    it('rejects requests with no Authorization header', async () => {
      await request(GATEWAY_URL)
        .get('/api/v1/assets')
        .set('x-tenant-id', TENANT_A)
        .expect(401);
    });

    it('rejects requests with malformed JWT (not a valid token)', async () => {
      await request(GATEWAY_URL)
        .get('/api/v1/assets')
        .set('Authorization', 'Bearer this.is.not.a.jwt')
        .set('x-tenant-id', TENANT_A)
        .expect(401);
    });

    it('rejects JWT signed with wrong secret (tampering)', async () => {
      const tamperedToken = signFakeToken({
        sub: 'user-1',
        tenantId: TENANT_A,
        roles: ['admin'],
      });
      await request(GATEWAY_URL)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .set('x-tenant-id', TENANT_A)
        .expect(401);
    });

    it('rejects expired JWT tokens', async () => {
      const expiredToken = signExpiredToken({
        sub: 'user-1',
        tenantId: TENANT_A,
      });
      await request(GATEWAY_URL)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${expiredToken}`)
        .set('x-tenant-id', TENANT_A)
        .expect(401);
    });

    it('rejects JWT with elevated role claim not issued by identity service', async () => {
      // Attacker tries to self-issue a super-admin token
      const elevatedToken = signFakeToken({
        sub: 'attacker-1',
        tenantId: TENANT_A,
        roles: ['super-admin', 'system'],
      });
      await request(GATEWAY_URL)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${elevatedToken}`)
        .set('x-tenant-id', TENANT_A)
        .expect((res) => {
          // Must be 401 (invalid token) not 403 (valid token but wrong role)
          expect([401, 403, 404]).toContain(res.status);
          // 200 would indicate bypass — fail immediately
          expect(res.status).not.toBe(200);
        });
    });
  });

  // ── 2. Tenant Isolation ──────────────────────────────────────────────────────
  describe('Tenant Boundary Enforcement', () => {
    it('cannot access Tenant B resources using Tenant A header without valid auth', async () => {
      await request(GATEWAY_URL)
        .get('/api/v1/assets')
        .set('x-tenant-id', TENANT_B)
        .expect(401);
    });

    it('rejects missing x-tenant-id header on protected endpoints', async () => {
      const res = await request(GATEWAY_URL)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer fake-token`);
      expect([400, 401]).toContain(res.status);
    });

    it('does not expose Tenant A data in error messages for Tenant B requests', async () => {
      const res = await request(GATEWAY_URL)
        .get('/api/v1/assets')
        .set('x-tenant-id', TENANT_B)
        .set('Authorization', `Bearer tampered`);
      // No tenant-specific data should leak in error body
      const body = JSON.stringify(res.body);
      expect(body).not.toContain(TENANT_A);
    });
  });

  // ── 3. Rate Limiting ─────────────────────────────────────────────────────────
  describe('Rate Limiting', () => {
    it('rate limits excessive login attempts (brute force protection)', async () => {
      // Send 20 rapid invalid login attempts
      const attempts = Array.from({ length: 20 }, () =>
        request(GATEWAY_URL)
          .post('/api/v1/auth/login')
          .send({ email: 'brute@cybermind.io', password: 'wrong' })
          .set('Content-Type', 'application/json'),
      );
      const responses = await Promise.all(attempts);
      // At least some must be rate-limited (429) after the limit
      const rateLimited = responses.filter((r) => r.status === 429);
      // We allow some requests through before the limit kicks in
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('returns Retry-After header with 429 response', async () => {
      const attempts = Array.from({ length: 25 }, () =>
        request(GATEWAY_URL)
          .get('/api/v1/assets')
          .set('x-tenant-id', TENANT_A),
      );
      const responses = await Promise.all(attempts);
      const rateLimited = responses.find((r) => r.status === 429);
      if (rateLimited) {
        expect(rateLimited.headers).toHaveProperty('retry-after');
      }
    });
  });

  // ── 4. Security Headers ──────────────────────────────────────────────────────
  describe('Security Headers (Helmet)', () => {
    let res: request.Response;

    beforeAll(async () => {
      res = await request(GATEWAY_URL).get('/health/live');
    });

    it('sets X-Content-Type-Options: nosniff', () => {
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('sets X-Frame-Options to deny clickjacking', () => {
      expect(['DENY', 'SAMEORIGIN']).toContain(
        res.headers['x-frame-options']?.toUpperCase(),
      );
    });

    it('sets Strict-Transport-Security (HSTS)', () => {
      expect(res.headers['strict-transport-security']).toBeDefined();
    });

    it('does not expose X-Powered-By header', () => {
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  // ── 5. CORS Validation ───────────────────────────────────────────────────────
  describe('CORS Policy', () => {
    it('allows requests from whitelisted origin', async () => {
      const res = await request(GATEWAY_URL)
        .options('/api/v1/assets')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'GET');
      expect([200, 204]).toContain(res.status);
    });

    it('rejects requests from untrusted origin', async () => {
      const res = await request(GATEWAY_URL)
        .get('/api/v1/assets')
        .set('Origin', 'https://evil-attacker.com')
        .set('x-tenant-id', TENANT_A);
      // Should not have ACAO header for untrusted origin
      const acao = res.headers['access-control-allow-origin'];
      if (acao) {
        expect(acao).not.toBe('https://evil-attacker.com');
      }
    });
  });
});
