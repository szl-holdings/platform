import { describe, it, expect } from 'vitest';
import { amiFormula, evaluateChatAmi } from './ami-formula.js';

const baseSignals = {
  mirrorEvalScore: 0.85,
  pceAllowed: true,
  hasGovernance: true,
  toolsAvailable: 10,
  toolsInvoked: 3,
  userPromptLength: 200,
  knownContradictions: 0,
  testCoverage: 0.8,
  alignment: 0.85,
  knotCount: 50,
};

describe('amiFormula — A multiplier', () => {
  const baseInput = {
    lambda: 0.8, K: 0.8, W: 0.85, T: 0.7, M: 0.9, E: 0.8, P: 0.75,
    N: 0.1, D: 0.15, G: 1,
  };
  it('A=undefined behaves identically to A=1', () => {
    expect(amiFormula(baseInput)).toBe(amiFormula({ ...baseInput, A: 1 }));
  });
  it('A < 1 scales the score down', () => {
    const a1 = amiFormula(baseInput);
    const a05 = amiFormula({ ...baseInput, A: 0.5 });
    expect(a05).toBeLessThan(a1);
    expect(a05).toBeCloseTo(a1 * 0.5, 5);
  });
  it('clamps A into [0.10, 1.00]', () => {
    expect(amiFormula({ ...baseInput, A: 0 })).toBe(amiFormula({ ...baseInput, A: 0.10 }));
    expect(amiFormula({ ...baseInput, A: 5 })).toBe(amiFormula({ ...baseInput, A: 1 }));
  });
});

describe('evaluateChatAmi — antivenom integration', () => {
  it('defaults to A=1 with no antivenom signal', () => {
    const r = evaluateChatAmi(baseSignals);
    expect(r.antivenom.A).toBe(1);
    expect(r.antivenom.forcedBlock).toBe(false);
    expect(r.components.A_adversarial_resistance).toBe(1);
  });

  it('lowers AMI when adversarial resistance drops', () => {
    const clean = evaluateChatAmi(baseSignals);
    const attacked = evaluateChatAmi({
      ...baseSignals,
      adversarialResistance: 0.45,
      antivenomFamilies: ['prompt-injection'],
    });
    expect(attacked.amiScore).toBeLessThan(clean.amiScore);
    expect(attacked.rationale).toMatch(/prompt-injection/);
  });

  it('forces BLOCK on critical-severity antivenom hit (A ≤ 0.15)', () => {
    const r = evaluateChatAmi({
      ...baseSignals,
      adversarialResistance: 0.10,
      antivenomFamilies: ['exfiltration'],
    });
    expect(r.gate).toBe('BLOCK');
    expect(r.antivenom.forcedBlock).toBe(true);
    expect(r.rationale).toMatch(/hard-floor/);
  });
});
