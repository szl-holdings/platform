import { describe, expect, it } from 'vitest';
import { InMemoryEvalRegistry } from './registry.js';
import { detectDrift } from './drift.js';
import { runChampionChallenger } from './champion-challenger.js';
import type { ModelSnapshot } from './types.js';

function makeSnapshot(headName: string, mae: number, sampleCount = 50): ModelSnapshot {
  return {
    modelId: `model-${headName}-${Math.random().toString(36).slice(2, 8)}`,
    modelVersion: '1.0.0',
    headName,
    adapterId: 'safe-default',
    capturedAt: new Date().toISOString(),
    metrics: { mae, calibrationScore: 1 - mae, coverageRate: 0.85, customMetrics: {} },
    sampleCount,
  };
}

describe('drift-eval registry', () => {
  it('starts empty', async () => {
    const registry = new InMemoryEvalRegistry();
    const drifts = await registry.queryDrift({});
    expect(drifts).toHaveLength(0);
  });

  it('persists and queries drift results', async () => {
    const registry = new InMemoryEvalRegistry();
    const snap = makeSnapshot('lyte:bottlenecks', 0.1);
    await registry.saveSnapshot(snap);
    const retrieved = await registry.latestSnapshot('lyte:bottlenecks');
    expect(retrieved?.headName).toBe('lyte:bottlenecks');
  });
});

describe('drift detection', () => {
  it('returns null when no baseline exists yet (first run)', async () => {
    const registry = new InMemoryEvalRegistry();
    const snap = makeSnapshot('lyte:bottlenecks', 0.12);
    await registry.saveSnapshot(snap);
    const result = await detectDrift('lyte:bottlenecks', registry);
    expect(result).toBeNull();
  });

  it('detects drift when current MAE significantly exceeds baseline', async () => {
    const registry = new InMemoryEvalRegistry();
    const baselineSnap = makeSnapshot('aegis:alert-surge', 0.05);
    await registry.saveSnapshot({ ...baselineSnap, headName: 'aegis:alert-surge::baseline' });
    const currentSnap = makeSnapshot('aegis:alert-surge', 0.40);
    await registry.saveSnapshot(currentSnap);
    const result = await detectDrift('aegis:alert-surge', registry);
    expect(result).not.toBeNull();
    expect(result!.driftScore).toBeGreaterThan(0.05);
    expect(['medium', 'high', 'critical']).toContain(result!.severity);
  });
});

describe('champion-challenger', () => {
  it('returns insufficient-data when sample counts are too low', async () => {
    const registry = new InMemoryEvalRegistry();
    const champ = makeSnapshot('terra:deal-likelihood', 0.15, 5);
    const chall = makeSnapshot('terra:deal-likelihood', 0.10, 5);
    const result = await runChampionChallenger('terra:deal-likelihood', champ, chall, registry);
    expect(result.outcome).toBe('insufficient-data');
  });

  it('promotes challenger when it has lower MAE', async () => {
    const registry = new InMemoryEvalRegistry();
    const champ = makeSnapshot('terra:deal-likelihood', 0.20, 100);
    const chall = makeSnapshot('terra:deal-likelihood', 0.10, 100);
    const result = await runChampionChallenger('terra:deal-likelihood', champ, chall, registry);
    expect(result.outcome).toBe('challenger');
    expect(result.improvementDelta).toBeGreaterThan(0);
  });

  it('keeps champion when challenger is worse', async () => {
    const registry = new InMemoryEvalRegistry();
    const champ = makeSnapshot('counsel:deadline-slippage', 0.10, 100);
    const chall = makeSnapshot('counsel:deadline-slippage', 0.25, 100);
    const result = await runChampionChallenger('counsel:deadline-slippage', champ, chall, registry);
    expect(result.outcome).toBe('champion');
  });

  it('persists result to registry', async () => {
    const registry = new InMemoryEvalRegistry();
    const champ = makeSnapshot('vessels:dark-activity', 0.12, 50);
    const chall = makeSnapshot('vessels:dark-activity', 0.10, 50);
    await runChampionChallenger('vessels:dark-activity', champ, chall, registry);
    const ccResults = await registry.queryChampionChallenger({ headName: 'vessels:dark-activity' });
    expect(ccResults).toHaveLength(1);
  });
});
