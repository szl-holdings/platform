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

  it('routes detection.confidence-floor through supervised at high confidence', () => {
    expect(classifyTier('detection.confidence-floor', 0.9)).toBe('supervised');
    expect(classifyTier('detection.confidence-floor', 0.5)).toBe('operator-approved');
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
