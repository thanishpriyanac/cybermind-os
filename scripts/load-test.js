import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 concurrent users over 30s
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 min
    { duration: '10s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate less than 1%
  },
};

export default function () {
  const url = 'http://localhost:3000/api/fanout/dispatch';
  const payload = JSON.stringify({
    conversationId: `k6-test-${__VU}-${__ITER}`,
    promptText: 'Provide a brief summary of phishing techniques.',
    mode: 'SMART',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      // Assuming Bearer token is needed in a real env, mock or disable auth for tests if necessary
      // 'Authorization': `Bearer YOUR_TEST_TOKEN`
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 201': (r) => r.status === 201,
    'has turnId': (r) => JSON.parse(r.body).turnId !== undefined,
  });

  // Simulate user think time
  sleep(1);
}
