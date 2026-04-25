/**
 * Unit tests — Simulation Engine
 */

import { buildSimulatedState } from '../simulation/index.js';
import type { SimulatedPERState } from '../simulation/index.js';

describe('buildSimulatedState', () => {
  let state: SimulatedPERState;

  beforeAll(() => {
    state = buildSimulatedState();
  });

  test('returns all required top-level keys', () => {
    expect(state).toHaveProperty('candidates');
    expect(state).toHaveProperty('evaluationRuns');
    expect(state).toHaveProperty('rewardBreakdowns');
    expect(state).toHaveProperty('calibrationRuns');
    expect(state).toHaveProperty('driftReports');
    expect(state).toHaveProperty('promotionQueue');
    expect(state).toHaveProperty('runtimeDiagnostics');
    expect(state).toHaveProperty('generatedAt');
  });

  test('has at least one candidate policy', () => {
    expect(state.candidates.length).toBeGreaterThan(0);
  });

  test('has exactly one active candidate', () => {
    const active = state.candidates.filter((c) => c.state === 'active');
    expect(active).toHaveLength(1);
  });

  test('all candidates are tagged simulated=true', () => {
    state.candidates.forEach((c) => {
      expect(c.simulated).toBe(true);
    });
  });

  test('all evaluation runs are tagged simulated=true', () => {
    state.evaluationRuns.forEach((r) => {
      expect(r.simulated).toBe(true);
    });
  });

  test('all drift reports are tagged simulated=true', () => {
    state.driftReports.forEach((r) => {
      expect(r.simulated).toBe(true);
    });
  });

  test('all reward breakdowns are tagged simulated=true', () => {
    state.rewardBreakdowns.forEach((rb) => {
      expect(rb.simulated).toBe(true);
    });
  });

  test('runtimeDiagnostics is tagged simulated=true', () => {
    expect(state.runtimeDiagnostics.simulated).toBe(true);
  });

  test('runtimeDiagnostics uses cpu_safe precision profile', () => {
    expect(state.runtimeDiagnostics.precisionProfile).toBe('cpu_safe');
  });

  test('generatedAt is a valid ISO 8601 date string', () => {
    expect(() => new Date(state.generatedAt)).not.toThrow();
    expect(new Date(state.generatedAt).toISOString()).toBe(state.generatedAt);
  });

  test('drift reports all have valid status values', () => {
    const validStatuses = new Set(['healthy', 'degraded', 'critical']);
    state.driftReports.forEach((r) => {
      expect(validStatuses.has(r.status)).toBe(true);
    });
  });

  test('candidate states cover the full policy lifecycle (at minimum: active + others)', () => {
    const states = new Set(state.candidates.map((c) => c.state));
    expect(states.has('active')).toBe(true);
    expect(states.size).toBeGreaterThan(1);
  });

  test('each candidate has a valid precisionProfile', () => {
    const validProfiles = new Set([
      'cpu_safe', 'cuda_bf16', 'cuda_fp8_linear',
      'cuda_fp8_linear_kv', 'remote_accelerated', 'future_blackwell_path',
    ]);
    state.candidates.forEach((c) => {
      expect(validProfiles.has(c.precisionProfile)).toBe(true);
    });
  });

  test('evaluation runs have valid status values', () => {
    const validStatuses = new Set(['queued', 'running', 'completed', 'failed', 'cancelled']);
    state.evaluationRuns.forEach((r) => {
      expect(validStatuses.has(r.status)).toBe(true);
    });
  });

  test('reward breakdowns have valid scoreTotal in [0, 1]', () => {
    state.rewardBreakdowns.forEach((rb) => {
      expect(rb.scoreTotal).toBeGreaterThanOrEqual(0);
      expect(rb.scoreTotal).toBeLessThanOrEqual(1);
    });
  });

  test('successive calls produce different generatedAt timestamps', async () => {
    await new Promise((r) => setTimeout(r, 5));
    const state2 = buildSimulatedState();
    expect(state2.generatedAt).not.toBe(state.generatedAt);
  });
});
