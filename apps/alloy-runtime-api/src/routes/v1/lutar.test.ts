/**
 * Tests for the Lutar invariant routes. These exercise the real
 * @workspace/ouroboros-invariant computation (not a stub): the geometric-mean
 * invariant, the zero-pinning axiom (Λ = 0 if any axis is 0), and the v10
 * artefact-matrix audit.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import lutarRouter from './lutar.js';
import { mountRouter, type TestClient } from '../__testkit.js';

let client: TestClient;
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  delete process.env.ALLOY_API_KEY;
  client = await mountRouter('/v1/ouroboros', lutarRouter);
});
afterAll(() => client?.close());

describe('POST /v1/ouroboros/lutar/v1', () => {
  it('rejects an axis outside [0,1]', async () => {
    const res = await client.req('POST', '/v1/ouroboros/lutar/v1', {
      body: { cleanliness: 1.5, horizon: 0.5, resonance: 0.5, frustum: 0.5 },
    });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe('validation_failed');
  });

  it('computes an invariant in [0,1] for all-equal axes', async () => {
    const res = await client.req('POST', '/v1/ouroboros/lutar/v1', {
      body: { cleanliness: 0.5, horizon: 0.5, resonance: 0.5, frustum: 0.5 },
    });
    expect(res.status).toBe(200);
    // Weighted geometric mean of all-0.5 axes is 0.5.
    expect(res.json.invariant).toBeCloseTo(0.5, 6);
  });

  it('pins the invariant to 0 when any axis is 0 (axiom A2)', async () => {
    const res = await client.req('POST', '/v1/ouroboros/lutar/v1', {
      body: { cleanliness: 0, horizon: 0.9, resonance: 0.9, frustum: 0.9 },
    });
    expect(res.status).toBe(200);
    expect(res.json.invariant).toBe(0);
  });
});

describe('POST /v1/ouroboros/lutar/v7', () => {
  it('accepts the 7-axis tuple', async () => {
    const res = await client.req('POST', '/v1/ouroboros/lutar/v7', {
      body: {
        cleanliness: 0.8,
        horizon: 0.8,
        resonance: 0.8,
        frustum: 0.8,
        gaussClosure: 0.8,
        invariance: 0.8,
        moralGrounding: 0.8,
      },
    });
    expect(res.status).toBe(200);
    expect(typeof res.json.invariant).toBe('number');
    expect(res.json.invariant).toBeGreaterThan(0);
    expect(res.json.invariant).toBeLessThanOrEqual(1);
  });
});

describe('POST /v1/ouroboros/lutar/evaluate-all', () => {
  it('returns the v1..v9 family at one 9-axis tuple', async () => {
    const res = await client.req('POST', '/v1/ouroboros/lutar/evaluate-all', {
      body: {
        cleanliness: 0.9,
        horizon: 0.9,
        resonance: 0.9,
        frustum: 0.9,
        gaussClosure: 0.9,
        invariance: 0.9,
        moralGrounding: 0.9,
        ontologicalGrounding: 0.9,
        measurabilityHonesty: 0.9,
      },
    });
    expect(res.status).toBe(200);
    expect(Object.keys(res.json).sort()).toEqual(['v1', 'v2', 'v6', 'v7', 'v8', 'v9']);
    for (const layer of ['v1', 'v2', 'v6', 'v7', 'v8', 'v9']) {
      expect(typeof res.json[layer].invariant).toBe('number');
    }
  });
});

describe('POST /v1/ouroboros/lutar/v10', () => {
  it('rejects an empty matrix', async () => {
    const res = await client.req('POST', '/v1/ouroboros/lutar/v10', { body: { matrix: [] } });
    expect(res.status).toBe(400);
  });

  it('audits a one-row artefact matrix', async () => {
    const res = await client.req('POST', '/v1/ouroboros/lutar/v10', {
      body: {
        matrix: [
          {
            layer: 'L1',
            lambdaValue: 0.8,
            artifacts: { CODE: true, CODEX: true, API: true, TEST: true, THESIS: false, SURFACE: false },
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.json).toBeTypeOf('object');
  });
});
