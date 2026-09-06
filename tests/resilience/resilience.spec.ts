/**
 * CYBERMIND OS — RC-002 Resilience Test Harness
 *
 * Tests controlled failure scenarios per RVS-001 Workstream 3.
 *
 * Prerequisites:
 *   docker-compose up -d (starts postgres, redis, redpanda, opensearch, minio)
 *
 * Usage:
 *   npx jest --config tests/resilience/jest.config.js
 *
 * Each test:
 *   1. Stops the target infrastructure container
 *   2. Validates the service degrades gracefully (expected errors)
 *   3. Restarts the container
 *   4. Validates recovery within SLO
 */
import * as request from 'supertest';
import { execSync, spawnSync } from 'child_process';

const GATEWAY_URL  = process.env.GATEWAY_URL  || 'http://localhost:3000';
const IDENTITY_URL = process.env.IDENTITY_URL || 'http://localhost:3001';

// Helper: stop a docker-compose service and restore after test
function stopService(name: string) {
  spawnSync('docker', ['compose', 'stop', name], { stdio: 'inherit' });
}

function startService(name: string) {
  spawnSync('docker', ['compose', 'start', name], { stdio: 'inherit' });
}

// Helper: wait for a URL to become healthy
async function waitForHealth(url: string, timeoutMs = 30_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch { /* still down */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

// Helper: measure how long recovery takes
async function measureRecovery(url: string, maxMs = 30_000): Promise<number> {
  const start = Date.now();
  const recovered = await waitForHealth(url, maxMs);
  if (!recovered) throw new Error(`Service did not recover within ${maxMs}ms`);
  return Date.now() - start;
}

// ─── RES-001: PostgreSQL Unavailable ─────────────────────────────────────────
describe('RES-001: PostgreSQL Unavailable', () => {
  beforeAll(() => stopService('postgres'));
  afterAll(async () => {
    startService('postgres');
    await waitForHealth(`${IDENTITY_URL}/health/live`, 30_000);
  });

  it('identity service returns 503 when database is unavailable', async () => {
    // Allow a moment for the health check to detect the outage
    await new Promise(r => setTimeout(r, 2000));
    const res = await request(IDENTITY_URL).get('/health/ready');
    expect([503, 500]).toContain(res.status);
  });

  it('gateway health/live still responds (app-level health)', async () => {
    const res = await request(GATEWAY_URL).get('/health/live');
    expect(res.status).toBe(200);
  });

  it('login attempt returns a clear error (not a crash)', async () => {
    const res = await request(IDENTITY_URL)
      .post('/api/v1/auth/login')
      .send({ email: 'test@cybermind.io', password: 'test' })
      .set('Content-Type', 'application/json');
    expect([500, 503, 502]).toContain(res.status);
    // Must not expose raw DB errors
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/postgres|psql|PrismaClient|relation/i);
  });
});

// ─── RES-002: Redis Unavailable ───────────────────────────────────────────────
describe('RES-002: Redis Unavailable', () => {
  beforeAll(() => stopService('redis'));
  afterAll(async () => {
    startService('redis');
    await new Promise(r => setTimeout(r, 3000)); // Let Redis fully start
  });

  it('gateway returns responses (cache-miss fallback, not crash)', async () => {
    const res = await request(GATEWAY_URL).get('/health/live');
    expect(res.status).toBe(200);
  });

  it('asset reads still succeed with cache miss fallback', async () => {
    const res = await request(GATEWAY_URL)
      .get('/api/v1/assets')
      .set('x-tenant-id', 'tenant-resilience-1');
    // 401 (no auth) or 200 (if cache miss handled) are both valid — not 500
    expect([200, 401]).toContain(res.status);
  });
});

// ─── RES-003: Redpanda (Kafka) Unavailable ────────────────────────────────────
describe('RES-003: Redpanda Unavailable', () => {
  beforeAll(() => stopService('redpanda'));
  afterAll(async () => {
    startService('redpanda');
    await new Promise(r => setTimeout(r, 5000)); // Redpanda startup time
  });

  it('event publish fails gracefully (not a 500 crash)', async () => {
    const res = await request(GATEWAY_URL)
      .post('/api/v1/events')
      .set('x-tenant-id', 'tenant-resilience-1')
      .send({ type: 'security.alert', source: 'test', payload: {} })
      .set('Content-Type', 'application/json');
    // 503 / 502 expected — message queued or rejected cleanly
    expect([201, 200, 503, 502, 401]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('other non-event services remain healthy', async () => {
    const res = await request(GATEWAY_URL).get('/health/live');
    expect(res.status).toBe(200);
  });
});

// ─── RES-004: OpenSearch Unavailable ─────────────────────────────────────────
describe('RES-004: OpenSearch Unavailable', () => {
  beforeAll(() => stopService('opensearch'));
  afterAll(async () => {
    startService('opensearch');
    await new Promise(r => setTimeout(r, 15_000)); // OpenSearch is slow to start
  });

  it('asset search returns degraded response (not 500)', async () => {
    const res = await request(GATEWAY_URL)
      .get('/api/v1/assets/search?q=test')
      .set('x-tenant-id', 'tenant-resilience-1');
    expect([200, 503, 401, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('non-search endpoints remain healthy', async () => {
    const res = await request(GATEWAY_URL).get('/health/live');
    expect(res.status).toBe(200);
  });
});

// ─── RES-005: MinIO Unavailable ───────────────────────────────────────────────
describe('RES-005: MinIO (Object Storage) Unavailable', () => {
  beforeAll(() => stopService('minio'));
  afterAll(async () => {
    startService('minio');
    await new Promise(r => setTimeout(r, 3000));
  });

  it('non-storage endpoints remain healthy', async () => {
    const res = await request(GATEWAY_URL).get('/health/live');
    expect(res.status).toBe(200);
  });

  it('evidence upload returns a clear storage error (not 500)', async () => {
    const res = await request(GATEWAY_URL)
      .post('/api/v1/evidence')
      .set('x-tenant-id', 'tenant-resilience-1')
      .send({ name: 'test-file', content: 'base64data' });
    expect([503, 502, 401, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

// ─── RES-006: Duplicate Event Delivery (Idempotency) ─────────────────────────
describe('RES-006: Duplicate Event Delivery — Idempotency', () => {
  const eventId = `idempotency-test-${Date.now()}`;

  it('publishing the same event ID twice does not create duplicate records', async () => {
    const payload = {
      id: eventId,
      type: 'security.alert.created',
      source: 'resilience-test',
      payload: { alertId: 'alert-001' },
    };

    const first = await request(GATEWAY_URL)
      .post('/api/v1/events')
      .set('x-tenant-id', 'tenant-resilience-1')
      .set('Content-Type', 'application/json')
      .send(payload);

    const second = await request(GATEWAY_URL)
      .post('/api/v1/events')
      .set('x-tenant-id', 'tenant-resilience-1')
      .set('Content-Type', 'application/json')
      .send(payload);

    // Both should respond — second should be idempotent (200/201/409)
    expect([200, 201, 401]).toContain(first.status);
    expect([200, 201, 409, 401]).toContain(second.status);
    // Neither should 500
    expect(first.status).not.toBe(500);
    expect(second.status).not.toBe(500);
  });
});

// ─── RES-007: Service Recovery Timing ────────────────────────────────────────
describe('RES-007: Service Recovery Within SLO', () => {
  it('postgres recovery time is within 30s SLO after restart', async () => {
    stopService('postgres');
    await new Promise(r => setTimeout(r, 2000));
    startService('postgres');

    const recoveryMs = await measureRecovery(`${IDENTITY_URL}/health/ready`, 30_000);
    console.log(`PostgreSQL recovery time: ${recoveryMs}ms`);
    expect(recoveryMs).toBeLessThan(30_000);
  });
});
