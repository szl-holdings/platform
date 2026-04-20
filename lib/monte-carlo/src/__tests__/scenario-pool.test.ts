import { describe, expect, it } from 'vitest';
import { planPoolSize, planShards } from '../scenario-pool.js';
import {
  aggregateScenarioShards,
  runScenarioSimulation,
  type ScenarioShardSamples,
  simulateScenarioShard,
} from '../scenario-simulation.js';
import { TERRA_PROPERTY_RETURNS, VESSELS_VOYAGE_COST } from '../scenarios.js';

describe('planShards', () => {
  it('splits iterations evenly across shards summing to total', () => {
    const shards = planShards(10_000, 4);
    expect(shards).toHaveLength(4);
    expect(shards.reduce((s, n) => s + n, 0)).toBe(10_000);
    expect(Math.max(...shards) - Math.min(...shards)).toBeLessThanOrEqual(1);
  });

  it('distributes the remainder so all shards receive ±1 iteration', () => {
    const shards = planShards(10_003, 4);
    expect(shards.reduce((s, n) => s + n, 0)).toBe(10_003);
    expect(Math.max(...shards) - Math.min(...shards)).toBeLessThanOrEqual(1);
  });

  it('collapses to one shard for tiny work', () => {
    expect(planShards(1, 4)).toEqual([1]);
    expect(planShards(0, 4)).toEqual([0]);
  });
});

describe('planPoolSize', () => {
  it('never exceeds the configured maxWorkers cap', () => {
    expect(planPoolSize(1_000_000, { maxWorkers: 4 })).toBeLessThanOrEqual(4);
  });

  it('collapses to 1 worker for small iteration counts', () => {
    expect(planPoolSize(100, { maxWorkers: 4, parallelThreshold: 5_000 })).toBe(1);
  });

  it('scales workers with iteration count up to the cap', () => {
    const size = planPoolSize(40_000, { maxWorkers: 4, parallelThreshold: 5_000 });
    expect(size).toBeGreaterThanOrEqual(1);
    expect(size).toBeLessThanOrEqual(4);
  });
});

describe('aggregateScenarioShards', () => {
  it('merging shards yields the same totals as a single combined run', () => {
    // With deterministic shard sample arrays, merging must be exact (not just
    // close), because all the math is just concat + percentile/mean/var.
    const scenario = VESSELS_VOYAGE_COST;
    const shardA = simulateScenarioShard(scenario, 2_000);
    const shardB = simulateScenarioShard(scenario, 3_000);

    const merged = aggregateScenarioShards(scenario, [shardA, shardB], 12);
    expect(merged.iterations).toBe(5_000);
    expect(merged.validIterations).toBe(shardA.validIterations + shardB.validIterations);
    expect(merged.durationMs).toBe(12);

    // Sanity: a primary metric exists and has p5 <= p50 <= p95.
    const primary = scenario.outputs[0]!;
    const stat = merged.metrics[primary.id]!;
    expect(stat.p5).toBeLessThanOrEqual(stat.p50);
    expect(stat.p50).toBeLessThanOrEqual(stat.p95);

    // Constructing the same aggregated stats from a single shard of equal
    // total size must produce identical numbers when fed the *same* sample
    // arrays, because the function is purely combinatorial.
    const oneShard: ScenarioShardSamples = {
      iterations: shardA.iterations + shardB.iterations,
      validIterations: shardA.validIterations + shardB.validIterations,
      inputSamples: {},
      outputSamples: {},
    };
    for (const inp of scenario.inputs) {
      oneShard.inputSamples[inp.id] = [
        ...(shardA.inputSamples[inp.id] ?? []),
        ...(shardB.inputSamples[inp.id] ?? []),
      ];
    }
    for (const out of scenario.outputs) {
      oneShard.outputSamples[out.id] = [
        ...(shardA.outputSamples[out.id] ?? []),
        ...(shardB.outputSamples[out.id] ?? []),
      ];
    }
    const single = aggregateScenarioShards(scenario, [oneShard], 12);
    for (const out of scenario.outputs) {
      expect(merged.metrics[out.id]).toEqual(single.metrics[out.id]);
    }
    expect(merged.inputSensitivity).toEqual(single.inputSensitivity);
  });

  it('sharded simulation produces statistics within numerical noise of single-worker', () => {
    // Run a large simulation in one shot, and the same total iterations
    // split across 4 shards. The statistics should match within Monte Carlo
    // noise (a few percent on the mean for 20k iterations).
    const scenario = TERRA_PROPERTY_RETURNS;
    const total = 20_000;
    const single = runScenarioSimulation(scenario, total);
    const shardSizes = planShards(total, 4);
    const shards = shardSizes.map((n) => simulateScenarioShard(scenario, n));
    const merged = aggregateScenarioShards(scenario, shards, 0);

    expect(merged.iterations).toBe(single.iterations);

    const primary = scenario.outputs[0]!;
    const a = single.metrics[primary.id]!;
    const b = merged.metrics[primary.id]!;
    const tolerance = Math.max(1, Math.abs(a.mean) * 0.05);
    expect(Math.abs(a.mean - b.mean)).toBeLessThan(tolerance);
    expect(Math.abs(a.p50 - b.p50)).toBeLessThan(tolerance);
    // stdDev should also be in the same ballpark
    expect(Math.abs(a.stdDev - b.stdDev)).toBeLessThan(Math.max(1, Math.abs(a.stdDev) * 0.15));
  });

  it('handles empty shard list without throwing', () => {
    const scenario = VESSELS_VOYAGE_COST;
    const empty = aggregateScenarioShards(scenario, [], 0);
    expect(empty.iterations).toBe(0);
    expect(empty.validIterations).toBe(0);
    for (const out of scenario.outputs) {
      const stat = empty.metrics[out.id]!;
      expect(stat.mean).toBe(0);
      expect(stat.stdDev).toBe(0);
    }
  });
});
