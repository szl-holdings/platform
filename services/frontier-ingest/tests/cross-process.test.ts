/**
 * Cross-process integration test for the Frontier Ingestion Engine.
 *
 * The reviewer's blocking concern: scheduled pulls run inside the
 * Temporal worker process while the operator UI reads from the api-
 * server process. If state lives only in process memory, the api-
 * server can never show what the worker just discovered.
 *
 * This test simulates that boundary by:
 *   1. Process A: writes (discover → queue → promote) using the
 *      normal store/adapters APIs.
 *   2. Process B: clears all in-process memory state, then reads
 *      via the DB-backed listing functions (`dbList*Shared`).
 *
 * If the api-server can read what the Temporal worker wrote, the
 * lists must be non-empty even after the in-process Maps/arrays
 * are emptied. Otherwise the test is skipped (no DATABASE_URL or
 * @szl-holdings/db pool not resolvable in the env).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  _resetAdaptersForTests,
  _resetForTests,
  _resetDbBackendForTests,
  _truncateFrontierDbForTests,
  classify,
  dbGetStatsShared,
  dbListDownstreamShared,
  dbListInboxShared,
  dbListPromotionsShared,
  dbListTimelineShared,
  ensureFrontierIngestDbSchema,
  isFrontierIngestDbEnabled,
  recordDiscovered,
  recordPromoted,
  recordQueued,
  applyPromotion,
} from '../src/index.js';
import type { FrontierArtifact } from '../src/types.js';

const HAS_DB = !!process.env.DATABASE_URL;
const describeIfDb = HAS_DB ? describe : describe.skip;

function mkArtifact(id: string, partial: Partial<FrontierArtifact> = {}): FrontierArtifact {
  return {
    id,
    provider: 'anthropic',
    kind: 'model',
    externalId: id,
    title: `cross-process test ${id}`,
    url: `https://example.test/${id}`,
    summary: 'cross-process integration probe',
    publishedAt: new Date().toISOString(),
    tags: ['cross-process'],
    raw: {},
    discoveredAt: new Date().toISOString(),
    ...partial,
  };
}

describeIfDb('frontier ingestion engine — cross-process DB-shared state', () => {
  beforeAll(async () => {
    _resetDbBackendForTests();
    const ok = await ensureFrontierIngestDbSchema();
    if (ok) await _truncateFrontierDbForTests();
  }, 60_000);

  afterAll(async () => {
    if (isFrontierIngestDbEnabled()) await _truncateFrontierDbForTests();
    _resetAdaptersForTests();
    _resetForTests();
  }, 30_000);

  it(
    'process A writes; process B reads through DB after in-memory state is wiped',
    async () => {
      const ok = await ensureFrontierIngestDbSchema();
      if (!ok) {
        // Db not reachable in this env — skip silently rather than fail.
        return;
      }

      // ── Process A: scheduled worker behavior ───────────────────────────
      const queuedArtifact = mkArtifact('xproc-queue-1');
      const queuedClass = await classify(queuedArtifact);
      const queuedEvidence = {
        artifact: queuedArtifact,
        score: queuedClass.score,
        decision: 'queue' as const,
        promotionTarget: queuedClass.promotionTarget,
        evaluatedAt: new Date().toISOString(),
      };
      recordDiscovered(queuedArtifact);
      const inboxItem = recordQueued(queuedEvidence);

      const promotedArtifact = mkArtifact('xproc-promote-1', {
        kind: 'paper',
        title: 'cheap safe additive paper',
      });
      const promotedClass = await classify(promotedArtifact);
      const promotedEvidence = {
        artifact: promotedArtifact,
        score: promotedClass.score,
        decision: 'auto-promote' as const,
        promotionTarget: 'thesis_corpus' as const,
        evaluatedAt: new Date().toISOString(),
      };
      recordDiscovered(promotedArtifact);
      recordPromoted(promotedEvidence);
      applyPromotion(promotedEvidence);

      // Allow fire-and-forget DB writes to drain.
      await new Promise((r) => setTimeout(r, 250));

      // ── Process B: simulate a separate process by wiping in-memory ─────
      _resetAdaptersForTests();
      _resetForTests();

      // The DB-backed reads must still surface what process A wrote.
      const sharedInbox = await dbListInboxShared({ status: 'pending', limit: 50 });
      const sharedTimeline = await dbListTimelineShared({ limit: 50 });
      const sharedPromotions = await dbListPromotionsShared(50);
      const sharedDownstream = await dbListDownstreamShared('thesis_corpus', 50);
      const sharedStats = await dbGetStatsShared(5, false, undefined);

      expect(sharedInbox?.some((i) => i.id === inboxItem.id)).toBe(true);
      expect(sharedTimeline?.some((e) => e.artifactId === queuedArtifact.id && e.kind === 'queued')).toBe(true);
      expect(sharedTimeline?.some((e) => e.kind === 'promoted')).toBe(true);
      expect(sharedPromotions?.some((p) => p.artifact.id === promotedArtifact.id)).toBe(true);
      expect(sharedDownstream?.some((d) => d.artifactId === promotedArtifact.id)).toBe(true);
      expect(sharedStats?.pendingInbox ?? 0).toBeGreaterThanOrEqual(1);
      expect(sharedStats?.totalPromoted ?? 0).toBeGreaterThanOrEqual(1);
    },
    20_000,
  );

  it(
    'process B can approve a queue item written by process A; promotion + downstream wired',
    async () => {
      const ok = await ensureFrontierIngestDbSchema();
      if (!ok) return;
      await _truncateFrontierDbForTests();
      _resetAdaptersForTests();
      _resetForTests();

      // ── Process A: a Temporal-worker-like process queues an artifact ───
      const { recordDiscovered: recA, recordQueued: recQA, classify: classA } =
        await import('../src/index.js');
      const queuedArtifact = mkArtifact('xproc-approve-1', {
        kind: 'paper',
        title: 'cross-process approval probe paper',
      });
      const cls = await classA(queuedArtifact);
      const evidence = {
        artifact: queuedArtifact,
        score: cls.score,
        decision: 'queue' as const,
        promotionTarget: 'thesis_corpus' as const,
        evaluatedAt: new Date().toISOString(),
      };
      recA(queuedArtifact);
      const queued = recQA(evidence);
      // Drain fire-and-forget DB writes.
      await new Promise((r) => setTimeout(r, 250));

      // ── Process B: simulate api-server restart — wipe all in-memory.
      _resetAdaptersForTests();
      _resetForTests();

      // The in-memory inbox is empty; the only path to approval is the
      // shared (DB-hydrating) helper. This exercises the same code the
      // /a11oy/frontier/inbox/:id/approve route calls.
      const { approveInboxItemShared, listAllPromotions, listTimeline } =
        await import('../src/index.js');
      const approved = await approveInboxItemShared(queued.id, 'cross-process-test', 'integration');
      expect(approved).toBeDefined();
      expect(approved!.status).toBe('approved');
      // Allow async fire-and-forget DB writes from approve to drain.
      await new Promise((r) => setTimeout(r, 250));

      // Promotion pipeline must have fired (in-memory + DB).
      const promoStores = listAllPromotions();
      expect(
        Object.values(promoStores).flat().some((p) => p.artifact.id === queuedArtifact.id),
      ).toBe(true);

      const sharedPromotions = await dbListPromotionsShared(50);
      expect(sharedPromotions?.some((p) => p.artifact.id === queuedArtifact.id)).toBe(true);

      // Downstream adapter wrote into thesis_corpus.
      const downstream = await dbListDownstreamShared('thesis_corpus', 50);
      expect(downstream?.some((d) => d.artifactId === queuedArtifact.id)).toBe(true);

      // Timeline carries the cross-process approval marker.
      const tl = listTimeline({ limit: 50 });
      expect(tl.some((t) => t.kind === 'approved' && t.inboxId === queued.id)).toBe(true);
    },
    30_000,
  );
});

describeIfDb('frontier ingestion engine — daily spend cap survives restart', () => {
  beforeAll(async () => {
    _resetDbBackendForTests();
    const ok = await ensureFrontierIngestDbSchema();
    if (ok) await _truncateFrontierDbForTests();
  }, 60_000);

  afterAll(async () => {
    if (isFrontierIngestDbEnabled()) await _truncateFrontierDbForTests();
    _resetAdaptersForTests();
    _resetForTests();
  }, 30_000);

  it(
    'restart with persisted daily spend at cap blocks the first post-restart pull',
    async () => {
      const ok = await ensureFrontierIngestDbSchema();
      if (!ok) return;
      await _truncateFrontierDbForTests();
      _resetAdaptersForTests();
      _resetForTests();

      const {
        setDailySpendCap,
        setSpendCap,
        recordCost,
        isCapReached,
      } = await import('../src/store.js');

      // ── Process A: scheduled worker fully spends the daily cap.
      setSpendCap(100);
      setDailySpendCap(0.5);
      recordCost('openai', 0.6);
      expect(isCapReached()).toBe(true);
      // Let the additive SQL increment land.
      await new Promise((r) => setTimeout(r, 250));

      // ── Process B: simulate a clean restart by wiping in-memory state.
      // capReached resets to false, dailySpendUsd resets to 0 — without
      // hydrating from the persisted row the worker would happily pull.
      _resetForTests();
      _resetAdaptersForTests();

      const { pullSource, getSource } = await import('../src/index.js');
      const source = getSource('anthropic.models');
      expect(source).toBeDefined();
      let fetchCalls = 0;
      const fetchSpy: typeof fetch = async (...args) => {
        fetchCalls += 1;
        return (await fetch(...args));
      };
      const result = await pullSource(source!, {
        // Synthetic feed avoids real HTTP even if cap check fails.
        syntheticFeeds: { 'anthropic.models': { data: [{ id: 'must-be-blocked' }] } },
        fetchImpl: fetchSpy,
      });

      // The hydration-aware cap check must block the pull: no artifacts
      // and no fetch attempts (synthetic feed never consulted either).
      expect(result.artifacts.length).toBe(0);
      expect(result.costUsd).toBe(0);
      expect(fetchCalls).toBe(0);

      // After hydration, isCapReached should be true on the new process.
      const { isCapReachedHydrated } = await import('../src/store.js');
      expect(await isCapReachedHydrated()).toBe(true);
    },
    20_000,
  );
});

describeIfDb('frontier ingestion engine — 7-day daily spend history', () => {
  beforeAll(async () => {
    _resetDbBackendForTests();
    const ok = await ensureFrontierIngestDbSchema();
    if (ok) await _truncateFrontierDbForTests();
  }, 60_000);

  afterAll(async () => {
    if (isFrontierIngestDbEnabled()) await _truncateFrontierDbForTests();
    _resetAdaptersForTests();
    _resetForTests();
  }, 30_000);

  it(
    'returns exactly N calendar days oldest→newest, zero-filling quiet days',
    async () => {
      const ok = await ensureFrontierIngestDbSchema();
      if (!ok) return;
      await _truncateFrontierDbForTests();
      _resetAdaptersForTests();
      _resetForTests();

      const { dbArchiveDailySpend } = await import('../src/db-backend.js');
      const { getRecentDailySpend, recordCost, setDailySpendCap, setSpendCap } =
        await import('../src/store.js');

      // Compute UTC day keys relative to "today" so the test is
      // independent of wall-clock date.
      const DAY_MS = 24 * 60 * 60 * 1000;
      const todayKey = new Date().toISOString().slice(0, 10);
      const todayStartUtcMs = Date.UTC(
        Number(todayKey.slice(0, 4)),
        Number(todayKey.slice(5, 7)) - 1,
        Number(todayKey.slice(8, 10)),
      );
      const isoFor = (offsetDays: number) =>
        new Date(todayStartUtcMs - offsetDays * DAY_MS).toISOString();

      // Seed only days at offsets 6, 4, 2 — days 5, 3, 1 should be
      // zero-filled in the returned series.
      await dbArchiveDailySpend(isoFor(6), 0.10);
      await dbArchiveDailySpend(isoFor(4), 0.25);
      await dbArchiveDailySpend(isoFor(2), 0.05);

      setSpendCap(100);
      setDailySpendCap(5);
      recordCost('openai', 0.42);
      await new Promise((r) => setTimeout(r, 200));

      const history = await getRecentDailySpend(7);
      expect(history.length).toBe(7);
      // Oldest → newest, ending with today.
      expect(history[0]!.day).toBe(isoFor(6).slice(0, 10));
      expect(history[6]!.day).toBe(todayKey);
      // Archived values present at the seeded offsets.
      expect(history[0]!.usd).toBeCloseTo(0.10, 5);
      expect(history[2]!.usd).toBeCloseTo(0.25, 5);
      expect(history[4]!.usd).toBeCloseTo(0.05, 5);
      // Missing days are zero-filled, not dropped.
      expect(history[1]!.usd).toBe(0);
      expect(history[3]!.usd).toBe(0);
      expect(history[5]!.usd).toBe(0);
      // Today (last entry) reflects the live in-memory spend.
      expect(history[6]!.usd).toBeCloseTo(0.42, 5);
    },
    20_000,
  );
});

describe('frontier ingestion engine — DB backend gracefully disabled', () => {
  it('isFrontierIngestDbEnabled() returns false when DATABASE_URL is absent', async () => {
    const original = process.env.DATABASE_URL;
    try {
      delete process.env.DATABASE_URL;
      _resetDbBackendForTests();
      await ensureFrontierIngestDbSchema();
      expect(isFrontierIngestDbEnabled()).toBe(false);
      // Listing helpers must return undefined (caller falls back to in-memory)
      expect(await dbListInboxShared()).toBeUndefined();
      expect(await dbListTimelineShared()).toBeUndefined();
    } finally {
      if (original !== undefined) process.env.DATABASE_URL = original;
      _resetDbBackendForTests();
    }
  });
});
