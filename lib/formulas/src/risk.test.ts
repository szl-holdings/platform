import { describe, expect, it } from 'vitest';
import { normalizedRiskScore, riskScore } from './risk.js';
import { autonomyGate } from './governance.js';

describe('normalizedRiskScore', () => {
  it('returns 0 when severity is 0', () => {
    expect(normalizedRiskScore(0, 1, 1_000_000)).toBe(0);
  });

  it('returns 0 when likelihood is 0', () => {
    expect(normalizedRiskScore(1, 0, 1_000_000)).toBe(0);
  });

  it('returns 0 when valueAtRisk is 0', () => {
    expect(normalizedRiskScore(1, 1, 0)).toBe(0);
  });

  it('returns 1 when raw risk equals the cap', () => {
    expect(normalizedRiskScore(1, 1, 1_000_000, 1_000_000)).toBe(1);
  });

  it('caps the normalized value at 1 even if raw exceeds cap', () => {
    expect(normalizedRiskScore(1, 1, 5_000_000, 1_000_000)).toBe(1);
  });

  it('returns the expected ratio for mid-range inputs', () => {
    // severity=0.5, likelihood=0.5, value=400_000 → raw=100_000 / cap=1_000_000 = 0.1
    expect(normalizedRiskScore(0.5, 0.5, 400_000, 1_000_000)).toBeCloseTo(0.1, 10);
  });

  it('clamps negative severity to 0', () => {
    expect(normalizedRiskScore(-5, 1, 1_000_000)).toBe(0);
  });

  it('clamps severity greater than 1 to 1', () => {
    // severity clamped to 1, likelihood=1, v=1_000_000, cap default → 1
    expect(normalizedRiskScore(99, 1, 1_000_000)).toBe(1);
  });

  it('clamps negative likelihood to 0', () => {
    expect(normalizedRiskScore(1, -0.5, 1_000_000)).toBe(0);
  });

  it('clamps negative valueAtRisk to 0', () => {
    expect(normalizedRiskScore(1, 1, -1_000_000)).toBe(0);
  });

  it('returns 0 when cap is 0', () => {
    expect(normalizedRiskScore(1, 1, 1_000_000, 0)).toBe(0);
  });

  it('returns 0 when cap is negative', () => {
    expect(normalizedRiskScore(1, 1, 1_000_000, -100)).toBe(0);
  });

  it('returns 0 when cap is NaN', () => {
    expect(normalizedRiskScore(1, 1, 1_000_000, Number.NaN)).toBe(0);
  });

  it('returns 0 when cap is Infinity', () => {
    expect(normalizedRiskScore(1, 1, 1_000_000, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('propagates NaN severity through to a NaN result (current behaviour)', () => {
    // Math.max(0, Math.min(1, NaN)) returns NaN — clamping does not sanitise
    // NaN inputs. riskScore then returns Math.min(NaN, cap) = NaN, and the
    // final Math.max(0, Math.min(1, NaN / cap)) is also NaN. This test pins
    // down today's behaviour so callers cannot accidentally start relying on
    // a different (e.g. silently-zeroed) outcome.
    expect(Number.isNaN(normalizedRiskScore(Number.NaN, 1, 1_000_000))).toBe(true);
  });

  it('feeds straight into autonomyGate for low-risk inputs → auto', () => {
    const r = normalizedRiskScore(0.2, 0.2, 100_000); // 4_000 / 1_000_000 = 0.004
    expect(autonomyGate(r)).toBe('auto');
  });

  it('feeds straight into autonomyGate for mid-risk inputs → approve', () => {
    const r = normalizedRiskScore(0.5, 0.5, 1_000_000); // 0.25
    expect(autonomyGate(r)).toBe('approve');
  });

  it('feeds straight into autonomyGate for high-risk inputs → multi-party', () => {
    const r = normalizedRiskScore(0.9, 0.9, 1_000_000); // 0.81
    expect(autonomyGate(r)).toBe('multi-party');
  });

  it('matches riskScore / cap for in-range inputs', () => {
    const raw = riskScore(0.3, 0.4, 200_000, 1_000_000);
    expect(normalizedRiskScore(0.3, 0.4, 200_000, 1_000_000)).toBeCloseTo(raw / 1_000_000, 10);
  });
});
