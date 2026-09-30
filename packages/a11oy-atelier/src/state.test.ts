import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { AtelierAskResponse } from './contracts.js';
import {
  ATELIER_STATE_RETENTION_MS,
  AtelierAmbiguousProviderCompletionError,
  AtelierReservationExpiredError,
  AtelierReservationNotFoundError,
  type AtelierReservationOutcome,
  type AtelierTurnCapsule,
  createAtelierCanonicalDigest,
  createAtelierIdempotencyKeyDigest,
  InMemoryAtelierStateStore,
  verifyAtelierCapsuleChain,
  verifyAtelierTurnCapsule,
} from './state.js';

const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');

function response(params: {
  sessionId: string;
  providerPrompt: string;
  answer: string;
  receiptId: string;
}): AtelierAskResponse {
  return {
    answer: params.answer,
    disclosure: 'test disclosure',
    receipt: {
      receiptId: params.receiptId,
      traceId: `trace_${params.receiptId}`,
      sessionId: params.sessionId,
      provider: 'xai',
      providerLabel: 'xAI API',
      model: 'grok-4.6',
      providerRequestId: `provider_${params.receiptId}`,
      promptSha256: sha256(params.providerPrompt),
      responseSha256: sha256(params.answer),
      policyEffect: 'allow',
      policyEvaluationId: 'policy_test',
      evidenceState: 'OBSERVED',
      ledgerEntryId: null,
      ledgerState: 'PENDING_API_APPEND',
      memoryState: 'PENDING_API_COMMIT',
      localOnly: false,
      latencyMs: 1,
      usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      generatedAt: '2026-08-29T00:00:00.000Z',
    },
  };
}

function reserved(outcome: AtelierReservationOutcome) {
  if (outcome.status !== 'reserved') throw new Error(`Expected reserved, got ${outcome.status}`);
  return outcome.reservation;
}

async function commit(params: {
  store: InMemoryAtelierStateStore;
  tenantId?: string;
  sessionId?: string;
  key: string;
  prompt: string;
  providerPrompt?: string;
  answer?: string;
  receiptId?: string;
}): Promise<AtelierTurnCapsule> {
  const tenantId = params.tenantId ?? 'tenant-a';
  const sessionId = params.sessionId ?? 'session-a';
  const providerPrompt = params.providerPrompt ?? params.prompt;
  const reservation = reserved(
    await params.store.reserveTurn({
      tenantId,
      sessionId,
      idempotencyKey: params.key,
      request: { prompt: params.prompt, idempotencyKey: params.key, provider: 'xai' },
    }),
  );
  await params.store.stageTurnResponse({
    tenantId,
    sessionId,
    reservationId: reservation.reservationId,
    providerPrompt,
    response: response({
      sessionId,
      providerPrompt,
      answer: params.answer ?? `answer:${params.prompt}`,
      receiptId: params.receiptId ?? `receipt_${reservation.sequence}`,
    }),
  });
  return params.store.commitTurn({ tenantId, sessionId, reservationId: reservation.reservationId });
}

describe('Turn Capsule canonical state', () => {
  it('creates deterministic canonical SHA-256 digests', () => {
    expect(createAtelierCanonicalDigest({ b: 2, a: 1 })).toBe(
      createAtelierCanonicalDigest({ a: 1, b: 2 }),
    );
  });

  it('replays the complete committed response without a duplicate commit', async () => {
    const store = new InMemoryAtelierStateStore({ randomId: () => 'one' });
    const capsule = await commit({ store, key: 'private-client-key', prompt: 'hello' });
    const replay = await store.reserveTurn({
      tenantId: 'tenant-a',
      sessionId: 'session-a',
      idempotencyKey: 'private-client-key',
      request: { prompt: 'hello', idempotencyKey: 'private-client-key', provider: 'xai' },
    });
    expect(replay.status).toBe('replay');
    if (replay.status !== 'replay') return;
    expect(replay.response).toEqual(capsule.response);
    expect(replay.response.receipt.capsuleDigest).toBe(capsule.capsuleDigest);
    expect(replay.response.receipt.memoryState).toBe('COMMITTED_IN_PROCESS');
    expect((await store.getSession('tenant-a', 'session-a'))?.capsules).toHaveLength(1);
    expect(JSON.stringify(capsule)).not.toContain('private-client-key');
    expect(capsule.idempotencyKeyDigest).toBe(
      createAtelierIdempotencyKeyDigest('private-client-key'),
    );
  });

  it('rejects reuse of an idempotency key for divergent request content', async () => {
    const store = new InMemoryAtelierStateStore();
    await commit({ store, key: 'same-key', prompt: 'first' });
    const outcome = await store.reserveTurn({
      tenantId: 'tenant-a',
      sessionId: 'session-a',
      idempotencyKey: 'same-key',
      request: { prompt: 'different', idempotencyKey: 'same-key' },
    });
    expect(outcome).toMatchObject({
      status: 'divergent',
      code: 'ATELIER_IDEMPOTENCY_DIVERGENT',
    });
    expect((await store.getSession('tenant-a', 'session-a'))?.capsules).toHaveLength(1);
  });

  it('isolates identical tenant and session keys', async () => {
    const store = new InMemoryAtelierStateStore();
    const outcomes = await Promise.all([
      store.reserveTurn({
        tenantId: 'a',
        sessionId: 's',
        idempotencyKey: 'k',
        request: { prompt: 'x' },
      }),
      store.reserveTurn({
        tenantId: 'b',
        sessionId: 's',
        idempotencyKey: 'k',
        request: { prompt: 'x' },
      }),
      store.reserveTurn({
        tenantId: 'a',
        sessionId: 'other',
        idempotencyKey: 'k',
        request: { prompt: 'x' },
      }),
    ]);
    expect(outcomes.map((outcome) => outcome.status)).toEqual(['reserved', 'reserved', 'reserved']);
  });

  it('serializes concurrent reservations with one session lease and ordered sequence', async () => {
    let id = 0;
    const store = new InMemoryAtelierStateStore({ randomId: () => String(++id) });
    const outcomes = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        store.reserveTurn({
          tenantId: 'tenant-a',
          sessionId: 'session-a',
          idempotencyKey: `key-${index}`,
          request: { prompt: `prompt-${index}` },
        }),
      ),
    );
    expect(outcomes.filter((outcome) => outcome.status === 'reserved')).toHaveLength(1);
    expect(
      outcomes.filter(
        (outcome) => outcome.status === 'pending' && outcome.code === 'ATELIER_SESSION_BUSY',
      ),
    ).toHaveLength(11);
    const winnerOutcome = outcomes.find((outcome) => outcome.status === 'reserved');
    if (winnerOutcome === undefined) throw new Error('Expected one reserved outcome.');
    const winner = reserved(winnerOutcome);
    await store.stageTurnResponse({
      tenantId: 'tenant-a',
      sessionId: 'session-a',
      reservationId: winner.reservationId,
      providerPrompt: 'prompt-0',
      response: response({
        sessionId: 'session-a',
        providerPrompt: 'prompt-0',
        answer: 'one',
        receiptId: 'r1',
      }),
    });
    const first = await store.commitTurn({
      tenantId: 'tenant-a',
      sessionId: 'session-a',
      reservationId: winner.reservationId,
    });
    const second = await commit({ store, key: 'key-1', prompt: 'prompt-1', receiptId: 'r2' });
    expect([first.sequence, second.sequence]).toEqual([1, 2]);
    expect(second.priorCapsuleDigest).toBe(first.capsuleDigest);
    expect(verifyAtelierCapsuleChain([first, second])).toMatchObject({ valid: true });
  });

  it('binds original and expanded provider prompts and detects chain tampering', async () => {
    const store = new InMemoryAtelierStateStore();
    const first = await commit({ store, key: 'k1', prompt: 'operator one', answer: 'answer one' });
    const expanded = 'Context:\nuser: operator one\nassistant: answer one\nOperator: operator two';
    const second = await commit({
      store,
      key: 'k2',
      prompt: 'operator two',
      providerPrompt: expanded,
      answer: 'answer two',
      receiptId: 'r2',
    });
    expect(second.response.receipt.promptSha256).toBe(sha256('operator two'));
    expect(second.response.receipt.providerPromptSha256).toBe(sha256(expanded));
    expect(second.providerPromptSha256).toBe(sha256(expanded));
    expect(verifyAtelierTurnCapsule(second)).toMatchObject({ valid: true });
    const tampered = JSON.parse(JSON.stringify(second)) as AtelierTurnCapsule;
    (tampered.response as { answer: string }).answer = 'tampered';
    expect(verifyAtelierTurnCapsule(tampered)).toMatchObject({ valid: false });
    expect(verifyAtelierCapsuleChain([second, first])).toMatchObject({ valid: false });
  });

  it('releases only known pre-response failures and protects pending recovery', async () => {
    const store = new InMemoryAtelierStateStore();
    const released = reserved(
      await store.reserveTurn({
        tenantId: 't',
        sessionId: 's',
        idempotencyKey: 'k',
        request: { prompt: 'x' },
      }),
    );
    await expect(
      store.releaseTurn({
        tenantId: 't',
        sessionId: 's',
        reservationId: released.reservationId,
        reason: 'PROVIDER_UNAVAILABLE',
      }),
    ).resolves.toBe(true);
    const recovery = reserved(
      await store.reserveTurn({
        tenantId: 't',
        sessionId: 's',
        idempotencyKey: 'k',
        request: { prompt: 'x' },
      }),
    );
    await store.markTurnPendingRecovery({
      tenantId: 't',
      sessionId: 's',
      reservationId: recovery.reservationId,
      providerPrompt: 'x',
      response: response({
        sessionId: 's',
        providerPrompt: 'x',
        answer: 'charged answer',
        receiptId: 'recovery',
      }),
    });
    const pending = await store.reserveTurn({
      tenantId: 't',
      sessionId: 's',
      idempotencyKey: 'k',
      request: { prompt: 'x' },
    });
    expect(pending).toMatchObject({ status: 'pending', reason: 'PENDING_RECOVERY' });
    await expect(
      store.releaseTurn({
        tenantId: 't',
        sessionId: 's',
        reservationId: recovery.reservationId,
        reason: 'PROVIDER_FAILED_BEFORE_RESPONSE',
      }),
    ).rejects.toBeInstanceOf(AtelierAmbiguousProviderCompletionError);
  });

  it('uses one effective expiry for a staggered capsule chain', async () => {
    let now = Date.parse('2026-08-29T00:00:00.000Z');
    const store = new InMemoryAtelierStateStore({ now: () => new Date(now) });
    const first = await commit({ store, key: 'first', prompt: 'first' });
    now += 60 * 60 * 1_000;
    const second = await commit({ store, key: 'second', prompt: 'second' });

    expect(second.expiresAt).toBe(first.expiresAt);
    expect(second.response.receipt.stateRetentionExpiresAt).toBe(first.expiresAt);
    expect(second.response.receipt.memoryState).toBe('COMMITTED_IN_PROCESS');
    expect(verifyAtelierCapsuleChain([first, second])).toMatchObject({ valid: true });
  });

  it('never commits into a detached session after the retained chain expires', async () => {
    let now = Date.parse('2026-08-29T00:00:00.000Z');
    const store = new InMemoryAtelierStateStore({ now: () => new Date(now) });
    const first = await commit({ store, key: 'first', prompt: 'first' });
    now += 60 * 60 * 1_000;
    const reservation = reserved(
      await store.reserveTurn({
        tenantId: 'tenant-a',
        sessionId: 'session-a',
        idempotencyKey: 'second',
        request: { prompt: 'second' },
      }),
    );
    await store.stageTurnResponse({
      tenantId: 'tenant-a',
      sessionId: 'session-a',
      reservationId: reservation.reservationId,
      providerPrompt: 'second',
      response: response({
        sessionId: 'session-a',
        providerPrompt: 'second',
        answer: 'second answer',
        receiptId: 'second',
      }),
    });
    now = Date.parse(first.expiresAt);

    await expect(
      store.commitTurn({
        tenantId: 'tenant-a',
        sessionId: 'session-a',
        reservationId: reservation.reservationId,
      }),
    ).rejects.toBeInstanceOf(AtelierReservationNotFoundError);
    expect(await store.getSession('tenant-a', 'session-a')).toBeNull();
  });

  it('expires reservations and committed session content at the 24-hour boundary', async () => {
    let now = Date.parse('2026-08-29T00:00:00.000Z');
    const store = new InMemoryAtelierStateStore({ now: () => new Date(now) });
    const reservation = reserved(
      await store.reserveTurn({
        tenantId: 't',
        sessionId: 's',
        idempotencyKey: 'k',
        request: { prompt: 'x' },
      }),
    );
    now += ATELIER_STATE_RETENTION_MS;
    await expect(
      store.commitTurn({ tenantId: 't', sessionId: 's', reservationId: reservation.reservationId }),
    ).rejects.toBeInstanceOf(AtelierReservationExpiredError);

    const capsule = await commit({
      store,
      tenantId: 't',
      sessionId: 's',
      key: 'fresh',
      prompt: 'fresh',
    });
    expect(capsule.sequence).toBe(1);
    now += ATELIER_STATE_RETENTION_MS;
    expect(await store.pruneExpired()).toMatchObject({ sessions: 1, capsules: 1 });
    expect(await store.getSession('t', 's')).toBeNull();
  });
});
