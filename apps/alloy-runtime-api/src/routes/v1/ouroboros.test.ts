import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mountRouter, type TestClient } from '../__testkit.js';

vi.mock('@workspace/ouroboros-integrations', () => ({
  a11oy: {
    reconcileHandoff: vi.fn(),
    auditFleetHandoffs: vi.fn(),
  },
  amaru: {
    AmaruFleetMonitor: class {
      observe() {
        return {};
      }
    },
    auditThreshold: vi.fn(),
  },
  sentra: {
    SentraHSMAnchor: class {
      append() {
        return {
          state: { accumulator: 1n, eventCount: 1, lastUpdate: 0, prime: 2n },
          trace: { product: 1n, steps: [] },
        };
      }

      appendBatch() {
        return { accumulator: 1n, eventCount: 1, lastUpdate: 0, prime: 2n };
      }

      snapshot() {
        return { accumulator: 1n, eventCount: 0, lastUpdate: 0, prime: 2n };
      }
    },
    verifyHSMTrace: vi.fn(() => true),
  },
}));

import ouroborosRouter, { VERIFY_TRACE_RATE_LIMIT_MAX } from './ouroboros.js';

let client: TestClient;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  delete process.env.ALLOY_API_KEY;
  client = await mountRouter('/v1/ouroboros', ouroborosRouter);
});

afterAll(() => client?.close());

describe('POST /v1/ouroboros/sentra/verify-trace rate limit', () => {
  it('rejects requests beyond the route-local verification budget', async () => {
    const body = { product: '0x1', steps: [] };

    for (let attempt = 0; attempt < VERIFY_TRACE_RATE_LIMIT_MAX; attempt += 1) {
      const response = await client.req('POST', '/v1/ouroboros/sentra/verify-trace', { body });
      expect(response.status).toBe(200);
      expect(response.json.valid).toBe(true);
    }

    const limited = await client.req('POST', '/v1/ouroboros/sentra/verify-trace', { body });
    expect(limited.status).toBe(429);
    expect(limited.json).toMatchObject({ error: 'RATE_LIMITED' });
  });
});
