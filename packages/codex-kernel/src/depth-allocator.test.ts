/**
 * Codex-Kernel — EntropyDepthAllocator golden tests.
 *
 * These pin the verdict precedence and the determinism contract from
 * §3.2 of the Ouroboros Thesis v3. They run with zero randomness and
 * zero clock dependence; failure of any of them indicates a regression
 * in the controller's pure-function behaviour.
 */

import { describe, expect, test } from 'vitest';
import {
  DEFAULT_DEPTH_ALLOCATOR_CONFIG,
  decideDepth,
  deltaHammingWitness,
  rollingSoftFailRate,
  severityEntropyBits,
  type AllocatorStepRecord,
  type DepthAllocatorConfig,
} from './depth-allocator.js';
import type { ValidatorSeverity } from './types.js';

const allPass = (n: number): ValidatorSeverity[] =>
  Array<ValidatorSeverity>(n).fill('pass');
const passAndSoft = (
  passes: number,
  softs: number,
): ValidatorSeverity[] => [
  ...Array<ValidatorSeverity>(passes).fill('pass'),
  ...Array<ValidatorSeverity>(softs).fill('soft_fail'),
];

function rec(
  step: number,
  hash: string,
  severities: ValidatorSeverity[],
): AllocatorStepRecord {
  return { step, state_hash: hash, validator_severities: severities };
}

describe('Codex-Kernel — depth-allocator pure functions', () => {
  test('Hamming witness is normalized to [0,1] and zero for identical hashes', () => {
    expect(deltaHammingWitness('abcd1234', 'abcd1234')).toBe(0);
    expect(deltaHammingWitness('00000000', 'ffffffff')).toBe(1);
    expect(deltaHammingWitness('abcd0000', 'abcdffff')).toBeCloseTo(0.5, 6);
  });

  test('Hamming witness handles unequal length without throwing', () => {
    expect(deltaHammingWitness('abcd', 'abcd1234')).toBeCloseTo(0.5, 6);
    expect(deltaHammingWitness('', '')).toBe(0);
    expect(deltaHammingWitness('', 'abcd')).toBe(1);
  });

  test('Shannon entropy is 0 for uniform passes and >0 when mixed', () => {
    expect(severityEntropyBits([])).toBe(0);
    expect(severityEntropyBits(allPass(5))).toBe(0);
    const mixed = severityEntropyBits(passAndSoft(2, 2));
    expect(mixed).toBeGreaterThan(0.99);
    expect(mixed).toBeLessThanOrEqual(1.001);
    const triMix = severityEntropyBits(['pass', 'soft_fail', 'hard_fail']);
    // log2(3) ≈ 1.585
    expect(triMix).toBeGreaterThan(1.58);
    expect(triMix).toBeLessThan(1.59);
  });

  test('rollingSoftFailRate counts soft-fails over the requested window', () => {
    const h = [
      rec(1, 'a', allPass(3)),
      rec(2, 'b', passAndSoft(2, 1)),
      rec(3, 'c', passAndSoft(1, 2)),
    ];
    expect(rollingSoftFailRate(h, 1)).toBeCloseTo(2 / 3, 6);
    expect(rollingSoftFailRate(h, 2)).toBeCloseTo(3 / 6, 6);
    expect(rollingSoftFailRate(h, 5)).toBeCloseTo(3 / 9, 6);
    expect(rollingSoftFailRate([], 3)).toBe(0);
  });
});

describe('Codex-Kernel — depth-allocator decision precedence', () => {
  const cfg: DepthAllocatorConfig = { ...DEFAULT_DEPTH_ALLOCATOR_CONFIG };

  test('returns early_exit_converged when last W_Δ witnesses are below ε_Δ', () => {
    // Hashes that differ by tiny amounts → witness ≈ 0
    const h = [
      rec(1, 'aaaaaaaaaaaaaaaa', allPass(2)),
      rec(2, 'aaaaaaaaaaaaaaaa', allPass(2)),
      rec(3, 'aaaaaaaaaaaaaaaa', allPass(2)),
    ];
    const out = decideDepth({ history: h, current_max_steps: 30 }, cfg);
    expect(out.verdict).toBe('early_exit_converged');
    expect(out.details.delta_witness).toBe(0);
  });

  test('returns early_exit_entropy when validators are clean for W_H steps', () => {
    // Hashes diverge each step (so converged branch does not fire) but
    // every validator passes, so entropy is 0 with no soft fails.
    const h = [
      rec(1, '0000000000000000', allPass(3)),
      rec(2, 'ffffffffffffffff', allPass(3)),
      rec(3, '1111111111111111', allPass(3)),
    ];
    const out = decideDepth({ history: h, current_max_steps: 30 }, cfg);
    expect(out.verdict).toBe('early_exit_entropy');
    expect(out.details.entropy).toBe(0);
  });

  test('returns extend when soft-fail rate is high near the ceiling', () => {
    // Ceiling 5, history length 5, soft-fail rate well above ρ.
    const h = [
      rec(1, '00', passAndSoft(1, 2)),
      rec(2, '11', passAndSoft(1, 2)),
      rec(3, '22', passAndSoft(1, 2)),
      rec(4, '33', passAndSoft(1, 2)),
      rec(5, '44', passAndSoft(1, 2)),
    ];
    const out = decideDepth({ history: h, current_max_steps: 5 }, cfg);
    expect(out.verdict).toBe('extend');
    expect(out.details.extended_max_steps).toBeGreaterThan(5);
    expect(out.details.extended_max_steps).toBeLessThanOrEqual(cfg.hard_max_steps);
  });

  test('extend respects hard_max_steps ceiling', () => {
    const tightCfg: DepthAllocatorConfig = {
      ...cfg,
      hard_max_steps: 6,
      delta_convergence_window: 1,
      entropy_window: 1,
    };
    const h = [
      rec(1, '00', passAndSoft(1, 3)),
      rec(2, '11', passAndSoft(1, 3)),
      rec(3, '22', passAndSoft(1, 3)),
      rec(4, '33', passAndSoft(1, 3)),
      rec(5, '44', passAndSoft(1, 3)),
    ];
    const out = decideDepth({ history: h, current_max_steps: 5 }, tightCfg);
    if (out.verdict === 'extend') {
      expect(out.details.extended_max_steps).toBeLessThanOrEqual(6);
    }
  });

  test('returns continue when no exit condition is met', () => {
    // Hashes diverge, validators have a soft-fail (so entropy > 0), and we
    // are nowhere near the ceiling.
    const h = [
      rec(1, '0000', passAndSoft(2, 1)),
      rec(2, 'ffff', passAndSoft(2, 1)),
    ];
    const out = decideDepth({ history: h, current_max_steps: 30 }, cfg);
    expect(out.verdict).toBe('continue');
  });

  test('decideDepth is deterministic — same input yields identical output', () => {
    const h = [
      rec(1, 'aabbccddeeff0011', passAndSoft(2, 1)),
      rec(2, 'aabbccddeeff0012', passAndSoft(2, 1)),
      rec(3, 'aabbccddeeff0013', allPass(3)),
    ];
    const a = decideDepth({ history: h, current_max_steps: 10 }, cfg);
    const b = decideDepth({ history: h, current_max_steps: 10 }, cfg);
    expect(b).toEqual(a);
    // And again, on a fresh-but-equal context object:
    const c = decideDepth(
      { history: h.map((r) => ({ ...r })), current_max_steps: 10 },
      cfg,
    );
    expect(c).toEqual(a);
  });

  test('precedence: convergence beats entropy when both would fire', () => {
    // delta_convergence_window=2 requires 2 witnesses → 3 history records,
    // all with identical hashes (witness=0) AND all-pass validators
    // (entropy=0). Convergence is checked first; it must win.
    const h = [
      rec(1, 'aa', allPass(2)),
      rec(2, 'aa', allPass(2)),
      rec(3, 'aa', allPass(2)),
    ];
    const out = decideDepth({ history: h, current_max_steps: 30 }, cfg);
    expect(out.verdict).toBe('early_exit_converged');
  });
});
