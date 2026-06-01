// SPDX-License-Identifier: Apache-2.0
// rosie hot-endpoint load test — Doctrine v11 749/14/163 — Yachay
// Run: k6 run platform/load-tests/rosie.js -e BASE_URL=https://szlholdings-rosie.hf.space
import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const errors = new Rate('endpoint_errors');
const BASE = __ENV.BASE_URL || 'https://szlholdings-rosie.hf.space';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // ramp to 50 VUs
    { duration: '60s', target: 50 }, // sustain
    { duration: '15s', target: 0 },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // p99 < 1.5s
    endpoint_errors: ['rate<0.01'],    // error rate < 1%
  },
};

// rosie hot endpoints
const HOT = [
  { method: 'POST', path: '/api/rosie/v2/command', body: JSON.stringify({ command: 'status', args: {} }) },
  { method: 'GET', path: '/api/rosie/v2/unay/recall?q=loadtest' },
  { method: 'GET', path: '/console' },
];

export default function () {
  for (const ep of HOT) {
    const url = `${BASE}${ep.path}`;
    let res;
    if (ep.method === 'POST') {
      res = http.post(url, ep.body, { headers: { 'Content-Type': 'application/json' }, tags: { name: ep.path } });
    } else {
      res = http.get(url, { tags: { name: ep.path } });
    }
    const ok = check(res, { 'status is 2xx/3xx': (r) => r.status >= 200 && r.status < 400 });
    errors.add(!ok);
  }
}
