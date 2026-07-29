import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Maintain for 1 min
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

const BASE_URL = __ENV.GATEWAY_URL || 'http://localhost:3000';

export default function () {
  // 1. Check health
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'health returns 200': (r) => r.status === 200,
  });

  // 2. Simulate alert ingestion
  const alertPayload = JSON.stringify({
    title: 'High CPU Usage',
    severity: 'MEDIUM',
    status: 'NEW',
    source: 'AWS',
  });

  const alertRes = http.post(`${BASE_URL}/api/v1/alerts`, alertPayload, {
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': 'tenant-load-test',
    },
  });

  check(alertRes, {
    'alert created or auth failed': (r) => r.status === 201 || r.status === 401,
  });

  sleep(1);
}
