import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDecisionEngine } from '../../artifacts/szl-holdings/src/hooks/useDecisionEngine';

describe('useDecisionEngine — Decision Theater simulation', () => {
  it('populates every engine state field after runDemo completes', async () => {
    const { result } = renderHook(() => useDecisionEngine());

    await waitFor(() => expect(result.current.status).toBe('complete'), {
      timeout: 10000,
    });

    expect(result.current.error).toBeNull();
    expect(result.current.monteCarloResult).not.toBeNull();
    expect(result.current.policyDecision).not.toBeNull();
    expect(result.current.policySimulation).not.toBeNull();
    expect(result.current.recommendation).not.toBeNull();
    expect(result.current.proofRecord).not.toBeNull();
    expect(result.current.outcomeRecord).not.toBeNull();

    expect(result.current.publishedSignals.length).toBeGreaterThanOrEqual(2);
    expect(result.current.correlatedEvents.length).toBeGreaterThanOrEqual(1);
    expect(result.current.executionSteps.length).toBe(4);
    expect(result.current.busHistory.length).toBeGreaterThan(0);
    expect(result.current.busStats.totalPublished).toBeGreaterThan(0);
  });

  it('produces finite Monte Carlo metrics within reasonable ranges for VESSELS_VOYAGE_COST', async () => {
    const { result } = renderHook(() => useDecisionEngine());

    await waitFor(() => expect(result.current.status).toBe('complete'), {
      timeout: 10000,
    });

    const mc = result.current.monteCarloResult!;
    expect(mc.scenarioId).toBe('vessels/voyage-cost');
    expect(mc.iterations).toBe(5000);
    expect(mc.validIterations).toBeGreaterThan(0);

    const cost = mc.metrics['totalVoyageCost'];
    expect(cost).toBeDefined();
    for (const v of [
      cost!.mean,
      cost!.p5,
      cost!.p25,
      cost!.p50,
      cost!.p75,
      cost!.p95,
      cost!.stdDev,
    ]) {
      expect(Number.isFinite(v)).toBe(true);
    }
    // Ordering invariants for percentiles.
    expect(cost!.p5).toBeLessThanOrEqual(cost!.p50);
    expect(cost!.p50).toBeLessThanOrEqual(cost!.p95);
    expect(cost!.min).toBeLessThanOrEqual(cost!.p5);
    expect(cost!.max).toBeGreaterThanOrEqual(cost!.p95);
    // Total voyage cost is reported in $000; sanity bounds for the configured distribution.
    expect(cost!.mean).toBeGreaterThan(50);
    expect(cost!.mean).toBeLessThan(5000);
    expect(cost!.p5).toBeGreaterThan(0);

    const days = mc.metrics['totalDays'];
    expect(days).toBeDefined();
    expect(Number.isFinite(days!.mean)).toBe(true);
    expect(days!.mean).toBeGreaterThan(5);
    expect(days!.mean).toBeLessThan(60);
  });

  it('returns ALLOW for the maritime-critical-response-v2 policy with exec+ops roles', async () => {
    const { result } = renderHook(() => useDecisionEngine());

    await waitFor(() => expect(result.current.status).toBe('complete'), {
      timeout: 10000,
    });

    const decision = result.current.policyDecision!;
    expect(decision.effect).toBe('allow');
    expect(decision.allowed).toBe(true);
    expect(decision.matchedPolicies).toContain('maritime-critical-response-v2');
    expect(decision.subject.roles).toEqual(expect.arrayContaining(['exec', 'ops']));
    expect(decision.action).toBe('execute');
    expect(decision.resource.domain).toBe('vessels');

    const sim = result.current.policySimulation!;
    expect(sim.decision.effect).toBe('allow');
    expect(sim.explanation.length).toBeGreaterThan(0);
  });
});
