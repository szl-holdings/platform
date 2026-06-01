// SPDX-License-Identifier: Apache-2.0
// killinchu hot-endpoint load test — Doctrine v11 749/14/163 — Yachay
// Run: k6 run platform/load-tests/killinchu.js -e BASE_URL=https://szlholdings-killinchu.hf.space
import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const errors = new Rate('endpoint_errors');
const BASE = __ENV.BASE_URL || 'https://szlholdings-killinchu.hf.space';

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

// killinchu hot endpoints
const HOT = [
  { method: 'GET', path: '/globe' },
  { method: 'POST', path: '/api/killinchu/v2/geofence/check', body: JSON.stringify({ lat: -13.16, lon: -72.54, alt_m: 120 }) },
  { method: 'POST', path: '/api/killinchu/v2/mission/plan', body: JSON.stringify({ waypoints: [[-13.16,-72.54],[-13.17,-72.55]] }) },
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
