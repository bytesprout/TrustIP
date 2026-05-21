import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    normal: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '20s', target: 100 },
        { duration: '10s', target: 20 },
      ],
      startTime: '30s',
    },
  },
  thresholds: {
    http_req_failed: [`rate<${__ENV.K6_MAX_FAILURE_RATE || '0.005'}`],
    http_req_duration: [`p(95)<${__ENV.K6_P95_MS || '100'}`],
  },
};

const baseUrl = __ENV.K6_BASE_URL || 'http://localhost:8080';
const path = __ENV.K6_PATH || '/api/health';
const expectHealthy = __ENV.K6_EXPECT_HEALTHY !== '0';

export default function () {
  const response = http.get(`${baseUrl}${path}`);
  const checks = {
    'status is 200': (r) => r.status === 200,
  };

  if (expectHealthy) {
    checks['health response has healthy flag'] = (r) => r.body.includes('healthy');
  }

  check(response, checks);
  sleep(0.2);
}
