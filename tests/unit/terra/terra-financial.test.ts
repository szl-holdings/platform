import { describe, expect, it } from 'vitest';
import {
  BEAR_INPUTS,
  BULL_INPUTS,
  calcProForma,
  DEFAULT_INPUTS,
} from '../../../artifacts/terra/src/lib/pro-forma-math';
import {
  calcWaterfall,
  DEFAULT_WATERFALL_INPUTS,
} from '../../../artifacts/terra/src/lib/waterfall-math';

describe('calcProForma — cost structure', () => {
  it('totalSF = totalUnits × avgUnitSF', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.totalSF).toBe(DEFAULT_INPUTS.totalUnits * DEFAULT_INPUTS.avgUnitSF);
  });

  it('hardCosts = totalSF × hardCostPerSF', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.hardCosts).toBeCloseTo(r.totalSF * DEFAULT_INPUTS.hardCostPerSF, 1);
  });

  it('softCosts = hardCosts × softCostPct/100', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.softCosts).toBeCloseTo(r.hardCosts * (DEFAULT_INPUTS.softCostPct / 100), 1);
  });

  it('totalDevelopmentCost includes land + hard + soft + contingency', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.totalDevelopmentCost).toBeCloseTo(
      DEFAULT_INPUTS.landCost + r.hardCosts + r.softCosts + r.contingency,
      1,
    );
  });

  it('totalDebt = totalDevelopmentCost × loanToCost/100', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.totalDebt).toBeCloseTo(r.totalDevelopmentCost * (DEFAULT_INPUTS.loanToCost / 100), 1);
  });

  it('totalEquity = totalDevelopmentCost - totalDebt', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.totalEquity).toBeCloseTo(r.totalDevelopmentCost - r.totalDebt, 1);
  });
});

describe('calcProForma — NOI and valuation', () => {
  it('NOI = effectiveGrossIncome - opex', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.noi).toBeCloseTo(r.effectiveGrossIncome - r.opex, 1);
  });

  it('stabilizedValue = NOI / (exitCapRate/100)', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.stabilizedValue).toBeCloseTo(r.noi / (DEFAULT_INPUTS.exitCapRate / 100), 1);
  });

  it('yieldOnCost = (NOI / totalProjectCost) × 100', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.yieldOnCost).toBeCloseTo((r.noi / r.totalProjectCost) * 100, 3);
  });

  it('spreadToCapRate = yieldOnCost - exitCapRate', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.spreadToCapRate).toBeCloseTo(r.yieldOnCost - DEFAULT_INPUTS.exitCapRate, 3);
  });
});

describe('calcProForma — equity returns', () => {
  it('equityMultiple = (stabilizedValue - totalDebt) / totalEquity', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    const expectedEM = (r.stabilizedValue - r.totalDebt) / r.totalEquity;
    expect(r.equityMultiple).toBeCloseTo(expectedEM, 4);
  });

  it('IRR is positive for a viable deal', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.irr).toBeGreaterThan(0);
  });

  it('bull IRR > base IRR > bear IRR', () => {
    const base = calcProForma(DEFAULT_INPUTS);
    const bear = calcProForma(BEAR_INPUTS);
    const bull = calcProForma(BULL_INPUTS);
    expect(bull.irr).toBeGreaterThan(base.irr);
    expect(base.irr).toBeGreaterThan(bear.irr);
  });

  it('IRR formula: equityMultiple^(12/projectMonths) - 1', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    const projectMonths = DEFAULT_INPUTS.constructionMonths + DEFAULT_INPUTS.absorptionMonths;
    const expectedIRR = (Math.max(r.equityMultiple, 0.001) ** (12 / projectMonths) - 1) * 100;
    expect(r.irr).toBeCloseTo(expectedIRR, 6);
  });
});

describe('calcProForma — cost schedule', () => {
  it('schedule has 5 phases', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.schedule).toHaveLength(5);
  });

  it('schedule cumulative final value equals totalProjectCost', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    const finalCum = r.schedule[r.schedule.length - 1].cumulative;
    expect(finalCum).toBeCloseTo(r.totalProjectCost, 1);
  });

  it('sensRows span exitCapRate ± 1% in 0.25 steps', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    expect(r.sensRows[0].capRate).toBeCloseTo(DEFAULT_INPUTS.exitCapRate - 1, 4);
    expect(r.sensRows[r.sensRows.length - 1].capRate).toBeCloseTo(
      DEFAULT_INPUTS.exitCapRate + 1,
      4,
    );
  });

  it('higher capRate in sensRows yields lower stabilized value', () => {
    const r = calcProForma(DEFAULT_INPUTS);
    const low = r.sensRows[0];
    const high = r.sensRows[r.sensRows.length - 1];
    expect(low.value).toBeGreaterThan(high.value);
  });
});

describe('calcWaterfall — capital return and pref', () => {
  it('Tier 1 total = totalEquity (return of capital)', () => {
    const r = calcWaterfall(DEFAULT_WATERFALL_INPUTS);
    expect(r.tiers[0].total).toBeCloseTo(DEFAULT_WATERFALL_INPUTS.totalEquity, 1);
  });

  it('GP receives gpContributionPct of equity in Tier 1', () => {
    const r = calcWaterfall(DEFAULT_WATERFALL_INPUTS);
    const expectedGPEquity =
      DEFAULT_WATERFALL_INPUTS.totalEquity * (DEFAULT_WATERFALL_INPUTS.gpContributionPct / 100);
    expect(r.gpEquity).toBeCloseTo(expectedGPEquity, 1);
  });

  it('LP receives 100% of Tier 2 preferred return', () => {
    const r = calcWaterfall(DEFAULT_WATERFALL_INPUTS);
    expect(r.tiers[1].lpPct).toBe(100);
    expect(r.tiers[1].gpPct).toBe(0);
  });

  it('preferred return = totalEquity × prefReturn% × holdYears', () => {
    const r = calcWaterfall(DEFAULT_WATERFALL_INPUTS);
    const expectedPref =
      DEFAULT_WATERFALL_INPUTS.totalEquity *
      (DEFAULT_WATERFALL_INPUTS.preferredReturn / 100) *
      (DEFAULT_WATERFALL_INPUTS.holdMonths / 12);
    expect(r.prefReturnAmount).toBeCloseTo(expectedPref, 1);
  });
});

describe('calcWaterfall — promote and distributions', () => {
  it('gpTotal + lpTotal does not exceed exitProceeds (conservation)', () => {
    const r = calcWaterfall(DEFAULT_WATERFALL_INPUTS);
    expect(r.gpTotal + r.lpTotal).toBeLessThanOrEqual(
      DEFAULT_WATERFALL_INPUTS.exitProceeds + 0.01,
    );
  });

  it('GP promote is non-negative', () => {
    const r = calcWaterfall(DEFAULT_WATERFALL_INPUTS);
    expect(r.gpPromote).toBeGreaterThanOrEqual(0);
  });

  it('higher promote % increases GP total', () => {
    const low = calcWaterfall({ ...DEFAULT_WATERFALL_INPUTS, promotePct: 10 });
    const high = calcWaterfall({ ...DEFAULT_WATERFALL_INPUTS, promotePct: 30 });
    expect(high.gpTotal).toBeGreaterThan(low.gpTotal);
  });

  it('GP EM > 1 when deal is profitable', () => {
    const r = calcWaterfall(DEFAULT_WATERFALL_INPUTS);
    expect(r.gpEM).toBeGreaterThan(1);
  });

  it('LP EM > 1 when deal is profitable', () => {
    const r = calcWaterfall(DEFAULT_WATERFALL_INPUTS);
    expect(r.lpEM).toBeGreaterThan(1);
  });
});

describe('calcWaterfall — edge cases', () => {
  it('no catch-up when exitProceeds < equity + pref', () => {
    const shortfall = {
      ...DEFAULT_WATERFALL_INPUTS,
      exitProceeds: 10_000_000,
    };
    const r = calcWaterfall(shortfall);
    expect(r.catchUpAmount).toBe(0);
    expect(r.gpPromote).toBe(0);
  });

  it('higher preferred return reduces LP equity multiple (more pref paid earlier)', () => {
    const low = calcWaterfall({ ...DEFAULT_WATERFALL_INPUTS, preferredReturn: 6 });
    const high = calcWaterfall({ ...DEFAULT_WATERFALL_INPUTS, preferredReturn: 12 });
    expect(high.prefReturnAmount).toBeGreaterThan(low.prefReturnAmount);
  });

  it('returns 4 tiers always', () => {
    const r = calcWaterfall(DEFAULT_WATERFALL_INPUTS);
    expect(r.tiers).toHaveLength(4);
  });
});
