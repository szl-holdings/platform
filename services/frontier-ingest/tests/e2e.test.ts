import { afterEach, describe, expect, it } from 'vitest';
import {
  _resetAdaptersForTests,
  _resetForTests,
  approveInboxItem,
  classify,
  listInbox,
  getPromotionStore,
  getSource,
  getStats,
  listAllPromotions,
  onPromotion,
  pullSource,
} from '../src/index.js';

// Note: the frontier_* schema is pre-warmed by the workspace-level vitest
// `globalSetup` (`tests/utils/warmup-shared-services.ts`) before any test
// fork starts. This avoids the 7–8s cold-start cost of CREATE TABLE IF
// NOT EXISTS against a freshly-provisioned shared Postgres blowing
// per-test timeouts.

afterEach(() => {
  _resetAdaptersForTests();
  _resetForTests();
});

describe('frontier ingestion engine — e2e', () => {
  it('discover → score → queue → approve → promote → notify', { timeout: 30_000 }, async () => {
    const source = getSource('anthropic.models');
    expect(source).toBeDefined();

    // Synthetic provider event: Anthropic publishes three models with very
    // different cost/safety profiles.
    const synthetic = {
      data: [
        {
          id: 'claude-haiku-5',
          display_name: 'Cheap, safe, additive evolution',
          created_at: new Date().toISOString(),
        },
        {
          id: 'claude-opus-5',
          display_name: 'Capable, expensive, doctrine-shifting reasoning frontier',
          created_at: new Date().toISOString(),
        },
        {
          id: 'claude-uncensored-test',
          display_name: 'unsafe uncensored jailbreak test build',
          created_at: new Date().toISOString(),
        },
      ],
    };

    const promotionEvents: string[] = [];
    onPromotion((event) => promotionEvents.push(event.artifact.id));

    const result = await pullSource(source!, {
      syntheticFeeds: { 'anthropic.models': synthetic },
    });

    expect(result.artifacts.length).toBe(3);

    // Auto-promoted: cheap+safe+additive haiku.
    const promoted = listAllPromotions();
    const flatPromoted = Object.values(promoted).flat();
    const haikuPromoted = flatPromoted.find((p) => p.artifact.externalId === 'claude-haiku-5');
    expect(haikuPromoted).toBeDefined();

    // Queued: capable+expensive+doctrine-shifting opus needs operator review.
    const inbox = listInbox();
    const opusItem = inbox.find((i) => i.evidence.artifact.externalId === 'claude-opus-5');
    expect(opusItem).toBeDefined();
    expect(opusItem!.status).toBe('pending');

    // Discarded: low-safety uncensored build.
    const discardedScore = await classify(result.artifacts.find((a) => a.externalId === 'claude-uncensored-test')!);
    expect(discardedScore.decision).toBe('discard');

    // Operator approves the queued opus → must run the same promotion pipeline
    // as auto-promote (this is the bug the previous reviewer flagged).
    const approved = approveInboxItem(opusItem!.id, 'operator-test');
    expect(approved?.status).toBe('approved');

    const opusPromotion = getPromotionStore('operator_model_registry').find(
      (p) => p.artifact.externalId === 'claude-opus-5',
    );
    expect(opusPromotion).toBeDefined();

    // Downstream listener fired for both auto-promotion and operator approval.
    expect(promotionEvents).toContain(haikuPromoted!.artifact.id);
    expect(promotionEvents).toContain(opusPromotion!.artifact.id);

    // Stats reflect the full discover → score → route flow.
    const stats = getStats();
    expect(stats.totalDiscovered).toBeGreaterThanOrEqual(3);
    expect(stats.totalPromoted).toBeGreaterThanOrEqual(2);
  });

  it('respects the spend cap and pauses pulls when reached', async () => {
    const { setSpendCap, isCapReached, recordCost } = await import('../src/store.js');
    setSpendCap(0.01);
    recordCost('anthropic', 0.02);
    expect(isCapReached()).toBe(true);

    const source = getSource('anthropic.models');
    const result = await pullSource(source!, {
      syntheticFeeds: { 'anthropic.models': { data: [{ id: 'should-not-discover' }] } },
    });
    expect(result.artifacts.length).toBe(0);
  });

  it('records nonzero cost for every source pull (real cost metering)', async () => {
    const source = getSource('anthropic.models');
    const result = await pullSource(source!, {
      syntheticFeeds: { 'anthropic.models': { data: [{ id: 'cost-meter-test' }] } },
    });
    expect(result.costUsd).toBeGreaterThan(0);
    const stats = getStats();
    const totalSpend = stats.spend.reduce((acc, s) => acc + s.spendUsd, 0);
    expect(totalSpend).toBeGreaterThan(0);
  });

  it('Temporal scheduler returns ok:false (and does not throw) when TEMPORAL_ADDRESS is unset', async () => {
    const { ensureFrontierIngestSchedule } = await import('../src/temporal-scheduler.js');
    const originalAddr = process.env.TEMPORAL_ADDRESS;
    const originalEp = process.env.TEMPORAL_ENDPOINT;
    delete process.env.TEMPORAL_ADDRESS;
    delete process.env.TEMPORAL_ENDPOINT;
    try {
      const result = await ensureFrontierIngestSchedule();
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/TEMPORAL_ADDRESS/);
      expect(result.reason).toMatch(/TEMPORAL_ENDPOINT/);
    } finally {
      if (originalAddr !== undefined) process.env.TEMPORAL_ADDRESS = originalAddr;
      if (originalEp !== undefined) process.env.TEMPORAL_ENDPOINT = originalEp;
    }
  });

  it('in-process worker refuses to start unless explicitly opted-in (Temporal is the production scheduler)', async () => {
    const { startWorker, isWorkerRunning, stopWorker } = await import('../src/worker.js');
    const original = process.env.FRONTIER_INGEST_DEV_WORKER;
    delete process.env.FRONTIER_INGEST_DEV_WORKER;
    try {
      startWorker();
      expect(isWorkerRunning()).toBe(false);
      startWorker({ force: true });
      expect(isWorkerRunning()).toBe(true);
      stopWorker();
    } finally {
      if (original !== undefined) process.env.FRONTIER_INGEST_DEV_WORKER = original;
    }
  });

  it('routes tool artifacts to tool_proposals (not model registry)', async () => {
    const source = getSource('nvidia.nim.catalog');
    expect(source).toBeDefined();
    const synthetic = {
      models: [
        {
          id: 'nim-routing-experimental',
          description: 'cost-aware router cascade with speculative decoding',
        },
      ],
    };
    await pullSource(source!, { syntheticFeeds: { 'nvidia.nim.catalog': synthetic } });

    const stores = listAllPromotions();
    const inbox = listInbox();
    const allEvidence = [
      ...Object.values(stores).flat().map((p) => p.evidence),
      ...inbox.map((i) => i.evidence),
    ];
    const toolEv = allEvidence.find((e) => e.artifact.externalId === 'nim-routing-experimental');
    expect(toolEv).toBeDefined();
    expect(toolEv!.promotionTarget).toBe('tool_proposals');
    // Must NOT have landed in operator_model_registry.
    expect(stores.operator_model_registry.find((p) => p.artifact.externalId === 'nim-routing-experimental')).toBeUndefined();
  });

  it('daily spend cap trips independently of lifetime cap and notifies', async () => {
    const { setSpendCap, setDailySpendCap, recordCost, isCapReached, onCapReached, getDailySpend } =
      await import('../src/store.js');
    setSpendCap(100);
    setDailySpendCap(0.5);

    const notifications: string[] = [];
    onCapReached((message) => notifications.push(message));

    recordCost('openai', 0.6);
    expect(isCapReached()).toBe(true);
    expect(notifications.length).toBe(1);
    expect(notifications[0]).toMatch(/Daily spend cap/);
    expect(getDailySpend().usd).toBeCloseTo(0.6, 5);
  });
});
