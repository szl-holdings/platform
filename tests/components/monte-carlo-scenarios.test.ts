import {
  DOMAIN_SCENARIO_LIBRARY,
  runSimulation,
  type ScenarioDefinition,
} from '@szl-holdings/monte-carlo';
import { describe, expect, it } from 'vitest';

const ITERATIONS = 1000;

const scenarios = Object.values(DOMAIN_SCENARIO_LIBRARY) as ScenarioDefinition[];

describe('Monte Carlo scenario library — smoke coverage', () => {
  it('registers more than just the maritime voyage scenario', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(2);
    const ids = new Set(scenarios.map((s) => s.id));
    expect(ids.has('vessels/voyage-cost')).toBe(true);
    // Sanity: every other domain scenario beyond vessels exists.
    expect(scenarios.length).toBe(ids.size);
  });

  for (const scenario of scenarios) {
    describe(`${scenario.id} (${scenario.domain})`, () => {
      it(`runs ${ITERATIONS} iterations and produces every configured output with finite, ordered percentiles`, async () => {
        const result = await runSimulation(scenario, {
          iterations: ITERATIONS,
          batchSize: 250,
          timeoutMs: 30_000,
        });

        expect(result.scenarioId).toBe(scenario.id);
        expect(result.timedOut).toBe(false);
        expect(result.totalIterations).toBe(ITERATIONS);
        // Allow modest constraint violations; most scenarios have none.
        expect(result.validIterations).toBeGreaterThan(ITERATIONS * 0.5);

        for (const output of scenario.outputs) {
          const metricResult = result.results[output.id];
          expect(metricResult, `missing result for output ${output.id}`).toBeDefined();
          expect(metricResult!.values.length).toBeGreaterThan(0);

          const stats = metricResult!.stats;
          for (const [name, value] of Object.entries({
            mean: stats.mean,
            stdDev: stats.stdDev,
            min: stats.min,
            max: stats.max,
            p5: stats.p5,
            p25: stats.p25,
            p50: stats.p50,
            p75: stats.p75,
            p95: stats.p95,
          })) {
            expect(
              Number.isFinite(value),
              `${scenario.id}.${output.id}.${name} should be finite, got ${value}`,
            ).toBe(true);
          }

          // Percentile ordering invariants.
          expect(stats.min).toBeLessThanOrEqual(stats.p5);
          expect(stats.p5).toBeLessThanOrEqual(stats.p25);
          expect(stats.p25).toBeLessThanOrEqual(stats.p50);
          expect(stats.p50).toBeLessThanOrEqual(stats.p75);
          expect(stats.p75).toBeLessThanOrEqual(stats.p95);
          expect(stats.p95).toBeLessThanOrEqual(stats.max);

          // Spread should be non-negative; allow zero only for constant-derived
          // outputs (e.g., when all sampled outputs collapse to the same value).
          expect(stats.stdDev).toBeGreaterThanOrEqual(0);
        }
      }, 30_000);
    });
  }
});
