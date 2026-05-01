import { describe, it, expect, beforeEach } from 'vitest';
import { SignalBus } from '@szl-holdings/signal-mesh/bus';
import {
  CognitiveReflexivityEngine,
  StrategyRegistry,
  applyStrategiesToDecision,
  computeHealthScore,
  runConsolidationCycle,
  InMemoryConsolidationStore,
  classifyTier,
  telemetrySampleToPayload,
  bridgeTelemetryToReflexivity,
} from './index';
import type { CognitiveReflexivePayload } from './types';

describe('classifyTier', () => {
  it('keeps router.advisory in advisory tier regardless of confidence', () => {
    expect(classifyTier('router.advisory', 0.99)).toBe('advisory');
    expect(classifyTier('router.advisory', 0.05)).toBe('advisory');
  });

  it('escalates router.constraint to dual-approved at low confidence', () => {
    expect(classifyTier('router.constraint', 0.5)).toBe('dual-approved');
    expect(classifyTier('router.constraint', 0.95)).toBe('operator-approved');
  });

  it('escalates detection.confidence-floor to dual-approved (high-impact self-mod)', () => {
    // Detection floor changes are blast-radius critical: a single
    // operator should never be able to lower the bar that gates
    // hallucination/risk emission, so the tier is always dual-approved.
    expect(classifyTier('detection.confidence-floor', 0.9)).toBe('dual-approved');
    expect(classifyTier('detection.confidence-floor', 0.5)).toBe('dual-approved');
  });

  it('escalates router.constraint to dual-approved at low confidence', () => {
    // Reasserting the dual-approval gate from above for low-confidence
    // router constraints — these silently re-route real traffic.
    expect(classifyTier('router.constraint', 0.55)).toBe('dual-approved');
  });
});

describe('StrategyRegistry.approve dual-approval gate', () => {
  it('requires two distinct operators for dual-approved tier', () => {
    const registry = new StrategyRegistry();
    registry._reset();
    const proposed = registry.propose({
      strategyId: 'sd-1',
      class: 'detection.confidence-floor',
      description: 'lower hallucination floor 0.7 -> 0.6',
      params: { floor: 0.6 },
      applicableContexts: [],
      confidence: 0.9,
      provenance: {
        originatingSignalIds: [],
        monologueThreadIds: [],
        proposedBy: 'engine',
        proposedAt: new Date().toISOString(),
      },
    });
    expect(proposed.tier).toBe('dual-approved');
    expect(proposed.status).toBe('proposed');

    // First operator signs — strategy is held at 'approved', not active.
    const r1 = registry.approve('sd-1', 'alice');
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error('expected ok');
    expect(r1.strategy.status).toBe('approved');
    expect(r1.strategy.firstApprovedBy).toBe('alice');
    expect(r1.strategy.firstApprovedAt).toBeDefined();

    // Same operator cannot self-co-sign.
    const rSame = registry.approve('sd-1', 'alice');
    expect(rSame.ok).toBe(false);
    if (rSame.ok) throw new Error('expected refusal');
    expect(rSame.reason).toBe('DUAL_APPROVAL_REQUIRES_DISTINCT_OPERATOR');

    // Strategy must remain at 'approved' (not silently escalated).
    expect(rSame.strategy?.status).toBe('approved');

    // Second, distinct operator activates the strategy.
    const r2 = registry.approve('sd-1', 'bob');
    expect(r2.ok).toBe(true);
    if (!r2.ok) throw new Error('expected ok');
    expect(r2.strategy.status).toBe('active');
    expect(r2.strategy.approvedBy).toBe('bob');
    expect(r2.strategy.firstApprovedBy).toBe('alice');
  });

  it('single operator activates non-dual-approved tiers', () => {
    const registry = new StrategyRegistry();
    registry._reset();
    const s = registry.propose({
      strategyId: 'sa-1',
      class: 'router.advisory',
      description: 'prefer reasoning lane',
      params: {},
      applicableContexts: [],
      confidence: 0.9,
      provenance: {
        originatingSignalIds: [],
        monologueThreadIds: [],
        proposedBy: 'engine',
        proposedAt: new Date().toISOString(),
      },
    });
    expect(s.tier).toBe('advisory');
    const r = registry.approve('sa-1', 'alice');
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('expected ok');
    expect(r.strategy.status).toBe('active');
    expect(r.strategy.approvedBy).toBe('alice');
  });
});

describe('CognitiveReflexivityEngine', () => {
  let bus: SignalBus;
  let registry: StrategyRegistry;
  let engine: CognitiveReflexivityEngine;

  beforeEach(() => {
    bus = new SignalBus();
    registry = new StrategyRegistry();
    registry._reset();
    engine = new CognitiveReflexivityEngine({
      bus,
      registry,
      monologue: {
        async dialecticalReason() {
          return {
            thesis: 'A',
            antithesis: 'B',
            synthesis: 'C',
            confidence: 0.75,
          };
        },
      },
    });
    engine.start();
  });

  it('absorbs signals below the trigger threshold without proposing strategies', async () => {
    const payload: CognitiveReflexivePayload = {
      subtype: 'router.lane_drift',
      observation: 'tiny drift',
      intensity: 0.1,
      evidenceRefs: [],
      data: {},
    };
    engine.emit(payload);
    await Promise.resolve();
    expect(registry.list()).toHaveLength(0);
  });

  it('emits an advisory strategy auto-approved for low-impact subtypes', async () => {
    const payload: CognitiveReflexivePayload = {
      subtype: 'sync.success',
      observation: 'sync ok',
      intensity: 0.7,
      evidenceRefs: [],
      data: {},
    };
    engine.emit(payload);
    // Wait microtask + macrotask for dialectic + propose
    await new Promise((r) => setTimeout(r, 10));
    const all = registry.list();
    expect(all.length).toBeGreaterThan(0);
    const s = all[0]!;
    expect(s.tier).toBe('advisory');
    expect(s.status).toBe('active'); // auto-approved
    expect(s.provenance.originatingSignalIds.length).toBe(1);
  });

  it('emits a constraint strategy in higher tier and does NOT auto-apply', async () => {
    const requested: string[] = [];
    const eng = new CognitiveReflexivityEngine({
      bus: new SignalBus(),
      registry,
      monologue: {
        async dialecticalReason() {
          return { thesis: 'a', antithesis: 'b', synthesis: 'c', confidence: 0.7 };
        },
      },
      approvalGate: {
        request(s) {
          requested.push(s.strategyId);
        },
      },
    });
    eng.start();
    eng.emit({
      subtype: 'router.lane_drift',
      observation: 'drift detected',
      intensity: 0.85,
      evidenceRefs: [],
      data: { suggestedLane: 'reasoning' },
    });
    await new Promise((r) => setTimeout(r, 10));
    const constraints = registry.list({ klass: 'router.constraint' });
    expect(constraints.length).toBeGreaterThan(0);
    expect(constraints[0]!.status).toBe('proposed');
    expect(requested).toContain(constraints[0]!.strategyId);
  });
});

describe('applyStrategiesToDecision', () => {
  it('applies an active router.constraint to a decision and records a trace', () => {
    const registry = new StrategyRegistry();
    registry._reset();
    const proposed = registry.propose({
      strategyId: 's-1',
      class: 'router.constraint',
      description: 'force reasoning lane',
      params: { suggestedLane: 'reasoning', minConfidence: 0.8 },
      applicableContexts: [],
      confidence: 0.95,
      provenance: {
        originatingSignalIds: [],
        monologueThreadIds: [],
        proposedBy: 'test',
        proposedAt: new Date().toISOString(),
      },
    });
    registry.approve(proposed.strategyId, 'test');

    const result = applyStrategiesToDecision(
      {
        routeClass: 'general',
        defaults: { lane: 'fast', minConfidence: 0.5 },
      },
      registry,
    );

    expect(result.lane).toBe('reasoning');
    expect(result.minConfidence).toBe(0.8);
    expect(result.appliedStrategyIds).toContain(proposed.strategyId);
    expect(result.influencedDimensions).toContain('lane');
    expect(result.influencedDimensions).toContain('confidence-floor');

    const traces = registry.recentTraces();
    expect(traces[0]!.appliedStrategyIds).toContain(proposed.strategyId);
  });
});

describe('computeHealthScore', () => {
  it('returns flourishing tier when components are strong', () => {
    const registry = new StrategyRegistry();
    registry._reset();
    const s = registry.propose({
      strategyId: 's-1',
      class: 'router.advisory',
      description: 'good advice',
      params: {},
      applicableContexts: [],
      confidence: 0.9,
      provenance: {
        originatingSignalIds: [],
        monologueThreadIds: [],
        dialecticalTrace: { thesis: 'a', antithesis: 'b', synthesis: 'c', confidence: 0.92 },
        proposedBy: 'test',
        proposedAt: new Date().toISOString(),
      },
    });
    registry.approve(s.strategyId, 'test');

    const score = computeHealthScore(
      {
        signalsObserved: 10,
        signalsActedOn: 6,
        dialecticInvocations: 3,
        consolidationCycles: { ok: 5, fail: 0 },
      },
      registry,
    );
    expect(score.tier).toMatch(/healthy|flourishing/);
    expect(score.score).toBeGreaterThanOrEqual(65);
  });
});

describe('runConsolidationCycle', () => {
  it('promotes reinforced working memory to episodic and ages out the rest', async () => {
    const store = new InMemoryConsolidationStore();
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    store.add({ id: 'a', tier: 'working', key: 'k1', payload: {}, createdAt: old, reinforcedCount: 2 });
    store.add({ id: 'b', tier: 'working', key: 'k2', payload: {}, createdAt: old, reinforcedCount: 0 });
    const r = await runConsolidationCycle(store);
    expect(r.promotedToEpisodic).toBe(1);
    expect(r.expired).toBe(1);
    expect(store.list('episodic').map((e) => e.id)).toEqual(['a']);
  });

  it('promotes episodic to semantic when reinforce floor is hit', async () => {
    const store = new InMemoryConsolidationStore();
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    store.add({ id: 'x', tier: 'episodic', key: 'k', payload: {}, createdAt: old, reinforcedCount: 5 });
    const r = await runConsolidationCycle(store);
    expect(r.promotedToSemantic).toBe(1);
    expect(store.list('semantic').map((e) => e.id)).toEqual(['x']);
  });
});

describe('telemetry-bridge', () => {
  it('converts hallucination_rate above target into a high-intensity payload', () => {
    const out = telemetrySampleToPayload({
      metric: 'hallucination_rate',
      value: 0.04, // 4% — close to scale (5%)
    });
    expect(out).not.toBeNull();
    if (!out) throw new Error('expected payload');
    expect(out.payload.subtype).toBe('telemetry.hallucination_rate_breach');
    expect(out.payload.intensity).toBeGreaterThan(0.5);
    expect(out.payload.affectedDimension).toBe('confidence-floor');
    expect(out.emit.severity).not.toBe('info');
  });

  it('skips sub-noise telemetry samples', () => {
    const out = telemetrySampleToPayload({
      metric: 'hallucination_rate',
      value: 0.001, // 0.1% — well below noise threshold
    });
    expect(out).toBeNull();
  });

  it('skips on-target retrieval quality (lower-is-worse)', () => {
    // value exactly at target → no breach.
    const out = telemetrySampleToPayload({
      metric: 'retrieval_quality_score',
      value: 1,
    });
    expect(out).toBeNull();
  });

  it('detects retrieval_quality drop and recommends retrieval-depth', () => {
    const out = telemetrySampleToPayload({
      metric: 'retrieval_quality_score',
      value: 0.7, // 0.3 below target=1, scale=0.2 → intensity=1.0
    });
    expect(out).not.toBeNull();
    if (!out) throw new Error('expected payload');
    expect(out.payload.affectedDimension).toBe('retrieval-depth');
    expect(out.payload.intensity).toBeCloseTo(1.0, 1);
  });

  it('value_at_risk_usd above $7k goes critical severity', () => {
    const out = telemetrySampleToPayload({
      metric: 'value_at_risk_usd',
      value: 8_000, // intensity 0.8 → critical for VAR
    });
    expect(out).not.toBeNull();
    if (!out) throw new Error('expected payload');
    expect(out.emit.severity).toBe('critical');
  });

  it('bridgeTelemetryToReflexivity emits onto the engine bus', async () => {
    const bus = new SignalBus();
    const registry = new StrategyRegistry();
    registry._reset();
    const engine = new CognitiveReflexivityEngine({ bus, registry });
    engine.start();
    let observed = 0;
    bus.on('cognitive-reflexive', () => {
      observed++;
    });

    const result = bridgeTelemetryToReflexivity(engine, [
      { metric: 'hallucination_rate', value: 0.04 },
      { metric: 'retrieval_quality_score', value: 0.7 },
      { metric: 'hallucination_rate', value: 0 }, // skipped
      { metric: 'value_at_risk_usd', value: 8_000 },
    ]);

    expect(result.emitted).toBe(3);
    expect(result.skipped).toBe(1);
    // bus.on handlers fire synchronously inside publish, so observed
    // matches emitted count.
    expect(observed).toBe(3);
    engine.stop();
  });
});

describe('computeHealthScore composite dimensions', () => {
  it('returns composite block when telemetry is supplied', () => {
    const registry = new StrategyRegistry();
    registry._reset();
    const score = computeHealthScore(
      {
        signalsObserved: 10,
        signalsActedOn: 6,
        dialecticInvocations: 3,
        consolidationCycles: { ok: 5, fail: 0 },
        telemetry: {
          hallucinationRateSeries: [0.04, 0.03, 0.02, 0.01], // falling → great
          strategyOutcomes: [
            { strategyId: 'a', improved: true },
            { strategyId: 'b', improved: true },
            { strategyId: 'c', improved: false },
          ],
          calibrationSamples: [
            { confidence: 0.9, correct: true },
            { confidence: 0.8, correct: true },
            { confidence: 0.6, correct: false },
          ],
          retrievalSamples: [
            { retrievedIds: ['a', 'b'], usedIds: ['a'] },
            { retrievedIds: ['c', 'd'], usedIds: ['c', 'd'] },
          ],
        },
      },
      registry,
    );
    expect(score.composite).toBeDefined();
    if (!score.composite) throw new Error('expected composite');
    expect(score.composite.hallucinationTrend).toBeGreaterThan(0.7);
    expect(score.composite.strategyEffectiveness).toBeCloseTo(2 / 3, 1);
    expect(score.composite.confidenceCalibration).toBeGreaterThan(0.5);
    expect(score.composite.memoryRetrievalPrecision).toBeCloseTo(0.75, 1);
  });

  it('omits composite when telemetry is absent (back-compat)', () => {
    const registry = new StrategyRegistry();
    registry._reset();
    const score = computeHealthScore(
      {
        signalsObserved: 10,
        signalsActedOn: 6,
        dialecticInvocations: 3,
        consolidationCycles: { ok: 5, fail: 0 },
      },
      registry,
    );
    expect(score.composite).toBeUndefined();
    expect(score.components).toBeDefined();
  });
});
