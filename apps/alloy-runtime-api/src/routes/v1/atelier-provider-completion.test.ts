import { readFileSync } from 'node:fs';
import { InMemoryAtelierStateStore, XaiResponsesProvider } from '@szl-holdings/a11oy-atelier';
import { EvidenceLedger } from '@szl-holdings/evidence-ledger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountRouter } from '../__testkit.js';
import { createAtelierRouter, shutdownAtelierContinuityPruning } from './atelier.js';

interface Vector {
  name: string;
  model: string;
  document: unknown;
  expected: { accepted: boolean; text?: string };
}

const vectors = (
  JSON.parse(
    readFileSync(
      new URL(
        '../../../../../tests/contracts/fixtures/xai-final-output-vectors.json',
        import.meta.url,
      ),
      'utf8',
    ),
  ) as { vectors: Vector[] }
).vectors;

beforeEach(() => {
  vi.stubEnv('ALLOY_API_KEY', 'offline-api-fixture');
  vi.stubEnv('NODE_ENV', 'test');
});

afterEach(() => {
  shutdownAtelierContinuityPruning();
  vi.unstubAllEnvs();
});

describe('Atelier route provider-completion admission', () => {
  it.each(
    vectors.filter((vector) => !vector.expected.accepted),
  )('retains ambiguous invalid success: $name', async (vector) => {
    const fetchMock = vi.fn(async () => Response.json(vector.document));
    const stateStore = new InMemoryAtelierStateStore();
    const ledger = new EvidenceLedger();
    const append = vi.spyOn(ledger, 'append');
    const stage = vi.spyOn(stateStore, 'stageTurnResponse');
    const commit = vi.spyOn(stateStore, 'commitTurn');
    const provider = new XaiResponsesProvider(
      'offline-provider-fixture',
      fetchMock as typeof fetch,
    );
    const client = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({ provider, stateStore, ledger }),
    );
    const headers = {
      'x-api-key': 'offline-api-fixture',
      'x-tenant-id': 'solo-builder',
      'idempotency-key': 'pending-provider-completion-fixture',
    };
    const body = {
      prompt: 'offline fixture',
      sessionId: 'pending-provider-session',
      provider: 'xai',
      model: vector.model,
    };
    try {
      const failure = await client.req('POST', '/api/a11oy/v1/atelier/ask', { headers, body });
      expect(failure.status).toBe(502);
      expect(failure.json.code).toBe('ATELIER_PROVIDER_RESPONSE_INVALID');
      expect(failure.json.continuityState).toBe(
        'RESERVATION_RETAINED_AMBIGUOUS_PROVIDER_COMPLETION',
      );
      expect(append).not.toHaveBeenCalled();
      expect(stage).not.toHaveBeenCalled();
      expect(commit).not.toHaveBeenCalled();
      const retry = await client.req('POST', '/api/a11oy/v1/atelier/ask', { headers, body });
      expect(retry.status).toBe(425);
      expect(retry.json.reason).toBe('IDEMPOTENCY_KEY');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(
        (await stateStore.getSession('solo-builder', body.sessionId))?.turns ?? [],
      ).toHaveLength(0);
    } finally {
      client.close();
    }
  });

  it('commits one bound completed response and replays without a second provider call', async () => {
    const vector = vectors[0];
    if (!vector) throw new Error('Missing positive provider contract fixture.');
    const fetchMock = vi.fn(async () => Response.json(vector.document));
    const stateStore = new InMemoryAtelierStateStore();
    const ledger = new EvidenceLedger();
    const append = vi.spyOn(ledger, 'append');
    const stage = vi.spyOn(stateStore, 'stageTurnResponse');
    const commit = vi.spyOn(stateStore, 'commitTurn');
    const provider = new XaiResponsesProvider(
      'offline-provider-fixture',
      fetchMock as typeof fetch,
    );
    const client = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({ provider, stateStore, ledger }),
    );
    const headers = {
      'x-api-key': 'offline-api-fixture',
      'x-tenant-id': 'solo-builder',
      'idempotency-key': 'completed-provider-fixture',
    };
    const body = {
      prompt: 'offline fixture',
      sessionId: 'completed-provider-session',
      provider: 'xai',
      model: vector.model,
    };
    try {
      const first = await client.req('POST', '/api/a11oy/v1/atelier/ask', { headers, body });
      const replay = await client.req('POST', '/api/a11oy/v1/atelier/ask', { headers, body });
      expect(first.status).toBe(200);
      expect(first.json.answer).toBe(vector.expected.text);
      expect(first.json.receipt.model).toBe(vector.model);
      expect(first.json.replayed).toBe(false);
      expect(replay.status).toBe(200);
      expect(replay.json.replayed).toBe(true);
      expect(replay.json.receipt.capsuleDigest).toBe(first.json.receipt.capsuleDigest);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(append).toHaveBeenCalledTimes(1);
      expect(stage).toHaveBeenCalledTimes(1);
      expect(commit).toHaveBeenCalledTimes(1);
      expect(
        (await stateStore.getSession('solo-builder', body.sessionId))?.turns.map(
          (turn) => turn.role,
        ),
      ).toEqual(['user', 'assistant']);
    } finally {
      client.close();
    }
  });
});
