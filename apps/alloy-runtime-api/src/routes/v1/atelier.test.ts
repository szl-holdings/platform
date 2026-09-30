import {
  type AtelierCommitTurnInput,
  type AtelierProvider,
  AtelierProviderResponseError,
  AtelierProviderUnavailableError,
  type AtelierStatePersistenceMetadata,
  type AtelierTurnCapsule,
  InMemoryAtelierStateStore,
} from '@szl-holdings/a11oy-atelier';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mountRouter, type TestClient } from '../__testkit.js';
import {
  ATELIER_VERIFY_RATE_LIMIT_MAX,
  createAtelierRouter,
  shutdownAtelierContinuityPruning,
} from './atelier.js';

const headers = {
  'x-api-key': 'k',
  'x-tenant-id': 'solo-builder',
  'idempotency-key': 'atelier-test-key',
};
const otherTenant = {
  'x-api-key': 'k',
  'x-tenant-id': 'other-tenant',
};
const savedKey = process.env.ALLOY_API_KEY;
const savedNodeEnv = process.env.NODE_ENV;
let client: TestClient;
let stateStore: InMemoryAtelierStateStore;

const generate = vi.fn(async () => ({
  text: 'ATELIER_API_OK',
  provider: 'xai' as const,
  providerLabel: 'xAI API',
  model: 'grok-4.6',
  providerRequestId: 'req_api_test',
  usage: { totalTokens: 7 },
  localOnly: false,
}));

const provider: AtelierProvider = {
  id: 'xai',
  label: 'xAI API',
  localOnly: false,
  health: () => ({
    provider: 'xai',
    model: 'grok-4.6',
    configured: true,
    available: true,
    localOnly: false,
    evidenceState: 'OBSERVED',
    reason: 'test',
  }),
  generate,
};

beforeAll(async () => {
  process.env.ALLOY_API_KEY = 'k';
  process.env.NODE_ENV = 'test';
  stateStore = new InMemoryAtelierStateStore();
  client = await mountRouter(
    '/api/a11oy/v1/atelier',
    createAtelierRouter({ provider, stateStore }),
  );
});

afterAll(() => {
  client.close();
  shutdownAtelierContinuityPruning();
  if (savedKey === undefined) delete process.env.ALLOY_API_KEY;
  else process.env.ALLOY_API_KEY = savedKey;
  if (savedNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = savedNodeEnv;
});

describe('A11oy Atelier continuity API', () => {
  it('limits verification before state reads and cannot reset the budget with another tenant', async () => {
    const limitedStore = new InMemoryAtelierStateStore();
    const readSession = vi.spyOn(limitedStore, 'getSession');
    const limitedClient = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({ stateStore: limitedStore }),
    );
    try {
      for (let attempt = 0; attempt < ATELIER_VERIFY_RATE_LIMIT_MAX; attempt += 1) {
        const result = await limitedClient.req(
          'GET',
          `/api/a11oy/v1/atelier/sessions/missing-${attempt}/verify`,
          { headers },
        );
        expect(result.status).toBe(404);
      }
      const limited = await limitedClient.req(
        'GET',
        '/api/a11oy/v1/atelier/sessions/missing-other/verify',
        { headers: otherTenant },
      );
      expect(limited.status).toBe(429);
      expect(limited.json.code).toBe('ATELIER_VERIFY_RATE_LIMITED');
      expect(readSession).toHaveBeenCalledTimes(ATELIER_VERIFY_RATE_LIMIT_MAX);
      const health = await limitedClient.req('GET', '/api/a11oy/v1/atelier/health', { headers });
      expect(health.status).toBe(200);
    } finally {
      limitedClient.close();
    }
  });

  it('rejects unauthenticated verification before consuming the authenticated route budget', async () => {
    const isolatedStore = new InMemoryAtelierStateStore();
    const readSession = vi.spyOn(isolatedStore, 'getSession');
    const isolatedClient = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({ stateStore: isolatedStore }),
    );
    try {
      const rejected = await isolatedClient.req(
        'GET',
        '/api/a11oy/v1/atelier/sessions/missing/verify',
      );
      expect(rejected.status).toBe(401);
      expect(readSession).not.toHaveBeenCalled();
      const authenticated = await isolatedClient.req(
        'GET',
        '/api/a11oy/v1/atelier/sessions/missing/verify',
        { headers },
      );
      expect(authenticated.status).toBe(404);
      expect(readSession).toHaveBeenCalledTimes(1);
    } finally {
      isolatedClient.close();
    }
  });

  it('rejects a retry key without a client session before invoking a provider', async () => {
    const body = { prompt: 'must not charge', idempotencyKey: 'missing-session-key' };
    const first = await client.req('POST', '/api/a11oy/v1/atelier/ask', {
      headers: { ...headers, 'idempotency-key': 'missing-session-key' },
      body,
    });
    const retry = await client.req('POST', '/api/a11oy/v1/atelier/ask', {
      headers: { ...headers, 'idempotency-key': 'missing-session-key' },
      body,
    });
    expect(first.status).toBe(400);
    expect(retry.status).toBe(400);
    expect(first.json.code).toBe('ATELIER_SESSION_ID_REQUIRED');
    expect(generate).not.toHaveBeenCalled();
  });

  it('rejects repeated requests without a client retry key before invoking a provider', async () => {
    const callsBefore = generate.mock.calls.length;
    const body = { prompt: 'must not charge', sessionId: 'missing-key-session' };
    const request = () =>
      client.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: { 'x-api-key': 'k', 'x-tenant-id': 'solo-builder' },
        body,
      });
    const first = await request();
    const retry = await request();
    expect(first.status).toBe(400);
    expect(retry.status).toBe(400);
    expect(first.json.code).toBe('ATELIER_IDEMPOTENCY_KEY_REQUIRED');
    expect(generate.mock.calls.length).toBe(callsBefore);
  });

  it('releases a known provider quota failure so the same turn can be retried safely', async () => {
    const quotaGenerate = vi
      .fn()
      .mockRejectedValueOnce(
        new AtelierProviderUnavailableError('Grok Build usage balance exhausted.'),
      )
      .mockResolvedValueOnce({
        text: 'provider-recovered',
        provider: 'xai' as const,
        providerLabel: 'xAI API',
        model: 'grok-4.6',
        usage: {},
        localOnly: false,
      });
    const quotaClient = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({
        provider: { ...provider, generate: quotaGenerate },
        stateStore: new InMemoryAtelierStateStore(),
      }),
    );
    const body = {
      prompt: 'retry after quota',
      sessionId: 'quota-session',
      idempotencyKey: 'quota-key',
    };
    try {
      const rejected = await quotaClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: { ...headers, 'idempotency-key': 'quota-key' },
        body,
      });
      expect(rejected.status).toBe(503);
      expect(rejected.json.code).toBe('ATELIER_PROVIDER_UNAVAILABLE');
      const retry = await quotaClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: { ...headers, 'idempotency-key': 'quota-key' },
        body,
      });
      expect(retry.status).toBe(200);
      expect(retry.json.replayed).toBe(false);
      expect(quotaGenerate).toHaveBeenCalledTimes(2);
    } finally {
      quotaClient.close();
    }
  });

  it('commits one capsule and replays the exact response without a second provider call', async () => {
    const body = {
      prompt: 'hello',
      sessionId: 'session-one',
      idempotencyKey: 'atelier-test-key',
      provider: 'xai',
    };
    const first = await client.req('POST', '/api/a11oy/v1/atelier/ask', { headers, body });
    const replay = await client.req('POST', '/api/a11oy/v1/atelier/ask', { headers, body });

    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    expect(first.json.replayed).toBe(false);
    expect(replay.json.replayed).toBe(true);
    expect(replay.json.answer).toBe(first.json.answer);
    expect(replay.json.receipt.capsuleDigest).toBe(first.json.receipt.capsuleDigest);
    expect(first.json.receipt).toMatchObject({
      provider: 'xai',
      ledgerState: 'IN_PROCESS_APPEND_ACCEPTED',
      persistenceState: 'COMMITTED_IN_PROCESS_NON_DURABLE',
      stateDurable: false,
      memoryState: 'COMMITTED_IN_PROCESS',
      sequence: 1,
    });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('rejects header/body idempotency mismatch and divergent key reuse', async () => {
    const mismatch = await client.req('POST', '/api/a11oy/v1/atelier/ask', {
      headers,
      body: { prompt: 'hello', sessionId: 'session-one', idempotencyKey: 'different' },
    });
    expect(mismatch.status).toBe(400);
    expect(mismatch.json.code).toBe('ATELIER_INVALID_STATE_INPUT');

    const divergent = await client.req('POST', '/api/a11oy/v1/atelier/ask', {
      headers,
      body: {
        prompt: 'different prompt',
        sessionId: 'session-one',
        idempotencyKey: 'atelier-test-key',
      },
    });
    expect(divergent.status).toBe(409);
    expect(divergent.json.code).toBe('ATELIER_IDEMPOTENCY_DIVERGENT');
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('returns tenant-isolated session history and a verified capsule chain', async () => {
    const own = await client.req('GET', '/api/a11oy/v1/atelier/sessions/session-one', {
      headers,
    });
    const other = await client.req('GET', '/api/a11oy/v1/atelier/sessions/session-one', {
      headers: otherTenant,
    });
    const verification = await client.req(
      'GET',
      '/api/a11oy/v1/atelier/sessions/session-one/verify',
      { headers },
    );
    expect(own.json).toMatchObject({ turnCount: 2, capsuleCount: 1, durable: false });
    expect(other.json).toMatchObject({ turnCount: 0, capsuleCount: 0 });
    expect(verification.status).toBe(200);
    expect(verification.json.verification.valid).toBe(true);
  });

  it('reports redacted continuity health and fails closed when durability is required', async () => {
    const health = await client.req('GET', '/api/a11oy/v1/atelier/health', { headers });
    expect(health.status).toBe(200);
    expect(health.json.continuity).toEqual({
      backend: 'memory',
      persistenceState: 'IN_PROCESS_NON_DURABLE',
      durable: false,
      encryptionState: 'NONE',
      evidenceState: 'OBSERVED',
      retentionHours: 24,
    });
    expect(health.json.capabilities.durableStorage).toBe(false);
    expect(JSON.stringify(health.json)).not.toContain('CONTINUITY_KEY');
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const unavailableRouter = createAtelierRouter({
      provider,
      stateStore: new InMemoryAtelierStateStore(),
    });
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    const unavailableClient = await mountRouter('/api/a11oy/v1/atelier', unavailableRouter);
    try {
      const unavailable = await unavailableClient.req('GET', '/api/a11oy/v1/atelier/health', {
        headers,
      });
      expect(unavailable.status).toBe(503);
      expect(unavailable.json).toMatchObject({
        status: 'continuity-unavailable',
        continuity: {
          persistenceState: 'UNAVAILABLE',
          durable: false,
          encryptionState: 'UNAVAILABLE',
          evidenceState: 'UNAVAILABLE',
        },
      });
    } finally {
      unavailableClient.close();
    }
  });

  it('rejects invalid tenant identifiers before the provider executes', async () => {
    const invalidGenerate = vi.fn(provider.generate.bind(provider));
    const invalidClient = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({
        stateStore: new InMemoryAtelierStateStore(),
        provider: { ...provider, generate: invalidGenerate },
      }),
    );
    try {
      const result = await invalidClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: {
          ...headers,
          'x-tenant-id': 'x'.repeat(129),
          'idempotency-key': 'invalid-tenant',
        },
        body: { prompt: 'must not run', sessionId: 'invalid-tenant-session' },
      });
      expect(result.status).toBe(400);
      expect(result.json.code).toBe('ATELIER_INVALID_TENANT');
      expect(invalidGenerate).not.toHaveBeenCalled();
    } finally {
      invalidClient.close();
    }
  });

  it('does not report an empty or pending-only session as a verified chain', async () => {
    const missing = await client.req(
      'GET',
      '/api/a11oy/v1/atelier/sessions/missing-session/verify',
      { headers },
    );
    expect(missing.status).toBe(404);
    expect(missing.json.code).toBe('ATELIER_SESSION_NOT_FOUND');

    await stateStore.reserveTurn({
      tenantId: 'solo-builder',
      sessionId: 'pending-only',
      idempotencyKey: 'pending-only-key',
      request: { prompt: 'pending' },
    });
    const pending = await client.req('GET', '/api/a11oy/v1/atelier/sessions/pending-only/verify', {
      headers,
    });
    expect(pending.status).toBe(409);
    expect(pending.json.code).toBe('ATELIER_SESSION_PENDING_OR_EMPTY');
    expect(pending.json.verification.valid).toBe(false);
  });

  it('keeps a maximum-length operator prompt within the provider schema', async () => {
    const receivedPrompts: string[] = [];
    const boundedProvider: AtelierProvider = {
      ...provider,
      generate: vi.fn(async (request) => {
        receivedPrompts.push(request.prompt);
        return {
          text: 'BOUNDED_OK',
          provider: 'xai' as const,
          providerLabel: 'xAI API',
          model: 'grok-4.6',
          providerRequestId: 'bounded',
          usage: {},
          localOnly: false,
        };
      }),
    };
    const boundedClient = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({
        stateStore: new InMemoryAtelierStateStore(),
        provider: boundedProvider,
      }),
    );
    try {
      const seed = await boundedClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: { ...headers, 'idempotency-key': 'bounded-seed' },
        body: { prompt: 'seed', sessionId: 'bounded-session' },
      });
      const maximumPrompt = 'p'.repeat(100_000);
      const maximum = await boundedClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: { ...headers, 'idempotency-key': 'bounded-maximum' },
        body: { prompt: maximumPrompt, sessionId: 'bounded-session' },
      });
      expect(seed.status).toBe(200);
      expect(maximum.status).toBe(200);
      expect(receivedPrompts[receivedPrompts.length - 1]).toBe(maximumPrompt);
      expect(receivedPrompts[receivedPrompts.length - 1]?.length).toBe(100_000);
    } finally {
      boundedClient.close();
    }
  });

  it('admits only one active provider call per tenant session', async () => {
    let releaseProvider!: () => void;
    let signalStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      signalStarted = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      releaseProvider = resolve;
    });
    const slowGenerate = vi.fn(async () => {
      signalStarted();
      await gate;
      return {
        text: 'SLOW_OK',
        provider: 'xai' as const,
        providerLabel: 'xAI API',
        model: 'grok-4.6',
        providerRequestId: 'slow',
        usage: {},
        localOnly: false,
      };
    });
    const slowClient = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({
        stateStore: new InMemoryAtelierStateStore(),
        provider: { ...provider, generate: slowGenerate },
      }),
    );
    try {
      const firstPromise = slowClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: { ...headers, 'idempotency-key': 'slow-one' },
        body: { prompt: 'one', sessionId: 'busy-session' },
      });
      await started;
      const second = await slowClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: { ...headers, 'idempotency-key': 'slow-two' },
        body: { prompt: 'two', sessionId: 'busy-session' },
      });
      expect(second.status).toBe(409);
      expect(second.json.code).toBe('ATELIER_SESSION_BUSY');
      releaseProvider();
      expect((await firstPromise).status).toBe(200);
      expect(slowGenerate).toHaveBeenCalledTimes(1);
    } finally {
      releaseProvider();
      slowClient.close();
    }
  });

  it('preserves a charged response as pending recovery when commit fails', async () => {
    class FailingCommitStore extends InMemoryAtelierStateStore {
      override commitTurn(_input: AtelierCommitTurnInput): Promise<AtelierTurnCapsule> {
        return Promise.reject(new Error('simulated persistence failure'));
      }
    }
    const failingGenerate = vi.fn(provider.generate.bind(provider));
    const recoveryClient = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({
        stateStore: new FailingCommitStore(),
        provider: { ...provider, generate: failingGenerate },
      }),
    );
    const recoveryHeaders = { ...headers, 'idempotency-key': 'recovery-key' };
    const body = { prompt: 'charge once', sessionId: 'recovery-session' };
    try {
      const failed = await recoveryClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: recoveryHeaders,
        body,
      });
      const retry = await recoveryClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: recoveryHeaders,
        body,
      });
      expect(failed.status).toBe(503);
      expect(failed.json.code).toBe('ATELIER_CONTINUITY_PENDING_RECOVERY');
      expect(failed.json).toMatchObject({
        durable: false,
        persistenceState: 'IN_PROCESS_NON_DURABLE',
      });
      expect(failed.json.error).toContain('current non-durable process');
      expect(retry.status).toBe(425);
      expect(retry.json.reason).toBe('PENDING_RECOVERY');
      expect(failingGenerate).toHaveBeenCalledTimes(1);
    } finally {
      recoveryClient.close();
    }
  });

  it('labels an acknowledged durable recovery separately from volatile retention', async () => {
    class FailingDurableStore extends InMemoryAtelierStateStore {
      override readonly persistence: AtelierStatePersistenceMetadata = Object.freeze({
        backend: 'encrypted-local',
        persistenceState: 'ENCRYPTED_LOCAL_DURABLE',
        durable: true,
        encryptionState: 'ENCRYPTED_AT_REST',
        evidenceState: 'OBSERVED',
        retentionHours: 24,
        retentionMs: 24 * 60 * 60 * 1_000,
      });

      override commitTurn(_input: AtelierCommitTurnInput): Promise<AtelierTurnCapsule> {
        return Promise.reject(new Error('simulated durable commit failure'));
      }
    }

    const durableGenerate = vi.fn(provider.generate.bind(provider));
    const durableClient = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({
        stateStore: new FailingDurableStore(),
        provider: { ...provider, generate: durableGenerate },
      }),
    );
    try {
      const failed = await durableClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: { ...headers, 'idempotency-key': 'durable-recovery-key' },
        body: {
          prompt: 'charge once durably',
          sessionId: 'durable-recovery-session',
        },
      });
      expect(failed.status).toBe(503);
      expect(failed.json).toMatchObject({
        code: 'ATELIER_CONTINUITY_PENDING_RECOVERY',
        durable: true,
        persistenceState: 'ENCRYPTED_LOCAL_DURABLE',
      });
      expect(failed.json.error).toContain('durably preserved');
      expect(durableGenerate).toHaveBeenCalledTimes(1);
    } finally {
      durableClient.close();
      shutdownAtelierContinuityPruning();
    }
  });

  it('retains the reservation and avoids provider execution when context read fails', async () => {
    class FailingReadStore extends InMemoryAtelierStateStore {
      override getSession(): Promise<null> {
        return Promise.reject(new Error('simulated authenticated read failure'));
      }
    }
    const readGenerate = vi.fn(provider.generate.bind(provider));
    const readClient = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({
        stateStore: new FailingReadStore(),
        provider: { ...provider, generate: readGenerate },
      }),
    );
    const readHeaders = { ...headers, 'idempotency-key': 'read-failure-key' };
    const body = { prompt: 'do not run', sessionId: 'read-failure-session' };
    try {
      const failed = await readClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: readHeaders,
        body,
      });
      const retry = await readClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: readHeaders,
        body,
      });
      expect(failed.status).toBe(503);
      expect(failed.json.continuityState).toBe('RESERVATION_RETAINED_CONTEXT_READ_FAILED');
      expect(retry.status).toBe(425);
      expect(readGenerate).not.toHaveBeenCalled();
    } finally {
      readClient.close();
    }
  });

  it('retains ambiguous provider failures so retries cannot double-charge', async () => {
    const ambiguousGenerate = vi.fn(async () => {
      throw new AtelierProviderResponseError('provider returned an invalid response');
    });
    const ambiguousClient = await mountRouter(
      '/api/a11oy/v1/atelier',
      createAtelierRouter({
        stateStore: new InMemoryAtelierStateStore(),
        provider: { ...provider, generate: ambiguousGenerate },
      }),
    );
    const ambiguousHeaders = { ...headers, 'idempotency-key': 'ambiguous-key' };
    const body = { prompt: 'possibly charged', sessionId: 'ambiguous-session' };
    try {
      const failed = await ambiguousClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: ambiguousHeaders,
        body,
      });
      const retry = await ambiguousClient.req('POST', '/api/a11oy/v1/atelier/ask', {
        headers: ambiguousHeaders,
        body,
      });
      expect(failed.status).toBe(502);
      expect(failed.json.continuityState).toBe(
        'RESERVATION_RETAINED_AMBIGUOUS_PROVIDER_COMPLETION',
      );
      expect(retry.status).toBe(425);
      expect(retry.json.reason).toBe('IDEMPOTENCY_KEY');
      expect(ambiguousGenerate).toHaveBeenCalledTimes(1);
    } finally {
      ambiguousClient.close();
    }
  });
});
