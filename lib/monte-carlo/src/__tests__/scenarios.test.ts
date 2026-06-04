import { describe, expect, it } from 'vitest';
import { sample } from '../distributions.js';
import { DOMAIN_SCENARIO_LIBRARY, VESSELS_VOYAGE_COST } from '../scenarios.js';

function sampleInputs(scenario: typeof VESSELS_VOYAGE_COST): Record<string, number> {
  const inputs: Record<string, number> = {};
  for (const i of scenario.inputs) inputs[i.id] = sample(i.distribution);
  return inputs;
}

describe('VESSELS_VOYAGE_COST scenario', () => {
  it('declares the expected metadata', () => {
    expect(VESSELS_VOYAGE_COST.id).toBe('vessels/voyage-cost');
    expect(VESSELS_VOYAGE_COST.domain).toBe('vessels');
    expect(VESSELS_VOYAGE_COST.inputs.length).toBeGreaterThan(0);
    expect(VESSELS_VOYAGE_COST.outputs.length).toBeGreaterThan(0);
  });

  it('calculate() reproduces the documented arithmetic for fixed inputs', () => {
    const inputs = {
      fuelPricePerTon: 600,
      fuelConsumptionTons: 30,
      voyageDays: 20,
      portFees: 50, // $000
      weatherDelayDays: 2,
      piracyRiskPremiumPct: 0.02,
      cargoValue: 10, // $M
    };
    const out = VESSELS_VOYAGE_COST.calculate(inputs);

    const totalDays = 22;
    const fuelCost = 600 * 30 * 22; // 396_000
    const portFees = 50 * 1000; // 50_000
    const piracyPremium = 10 * 1_000_000 * 0.02; // 200_000
    const totalCost = fuelCost + portFees + piracyPremium; // 646_000

    expect(out.totalDays).toBe(totalDays);
    expect(out.effectiveFuelCost).toBeCloseTo(fuelCost / 1000, 6);
    expect(out.totalVoyageCost).toBeCloseTo(totalCost / 1000, 6);
    expect(out.fuelCostShare).toBeCloseTo(fuelCost / totalCost, 6);
    expect(out.costPerDay).toBeCloseTo(totalCost / totalDays / 1000, 6);
  });

  it('produces finite, positive cost outputs across many random samples', () => {
    for (let trial = 0; trial < 50; trial++) {
      const inputs = sampleInputs(VESSELS_VOYAGE_COST);
      const out = VESSELS_VOYAGE_COST.calculate(inputs);
      expect(Number.isFinite(out.totalVoyageCost!)).toBe(true);
      expect(out.totalVoyageCost!).toBeGreaterThan(0);
      expect(out.totalDays!).toBeGreaterThan(0);
      expect(out.fuelCostShare!).toBeGreaterThanOrEqual(0);
      expect(out.fuelCostShare!).toBeLessThanOrEqual(1);
    }
  });
});

describe('DOMAIN_SCENARIO_LIBRARY', () => {
  it('registers the vessels voyage cost scenario under its id', () => {
    expect(DOMAIN_SCENARIO_LIBRARY[VESSELS_VOYAGE_COST.id]).toBe(VESSELS_VOYAGE_COST);
  });

  it('every registered scenario has unique input ids and a calculate function', () => {
    for (const scenario of Object.values(DOMAIN_SCENARIO_LIBRARY)) {
      const ids = new Set(scenario.inputs.map((i) => i.id));
      expect(ids.size).toBe(scenario.inputs.length);
      expect(typeof scenario.calculate).toBe('function');
    }
  });
});
