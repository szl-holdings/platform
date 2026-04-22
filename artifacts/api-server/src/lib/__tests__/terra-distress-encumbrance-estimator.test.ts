import { describe, expect, it } from 'vitest';
import {
  buildEstimateProvenance,
  estimateEncumbrance,
} from '../terra-distress-encumbrance-estimator';

describe('estimateEncumbrance', () => {
  it('returns null for invalid value', () => {
    expect(
      estimateEncumbrance({ distressType: 'foreclosure', estimatedValue: 0, opportunityScore: 80 }),
    ).toBeNull();
    expect(
      estimateEncumbrance({ distressType: 'foreclosure', estimatedValue: -1, opportunityScore: 80 }),
    ).toBeNull();
  });

  it('returns null for expired-listing (no encumbrance applies)', () => {
    expect(
      estimateEncumbrance({
        distressType: 'expired-listing',
        estimatedValue: 1_000_000,
        opportunityScore: 70,
      }),
    ).toBeNull();
  });

  it('tax-lien produces lien-heavy split with senior debt', () => {
    const r = estimateEncumbrance({
      distressType: 'tax-lien',
      estimatedValue: 1_000_000,
      opportunityScore: 75,
      daysInDistress: 365,
    });
    expect(r).not.toBeNull();
    // Lien sized 4-18% of value, debt at ~55% LTV.
    expect(r?.lienAmount).toBeGreaterThan(20_000);
    expect(r?.lienAmount).toBeLessThanOrEqual(180_000);
    expect(r?.debtAmount).toBe(550_000);
    expect(r?.method).toBe('tax_lien_dof_v1');
  });

  it('foreclosure clamps LTV between 0.65 and 0.92', () => {
    const low = estimateEncumbrance({
      distressType: 'foreclosure',
      estimatedValue: 1_000_000,
      opportunityScore: 0,
    })!;
    const high = estimateEncumbrance({
      distressType: 'foreclosure',
      estimatedValue: 1_000_000,
      opportunityScore: 100,
      daysInDistress: 9999,
    })!;
    expect(low.ltv).toBeGreaterThanOrEqual(0.65);
    expect(high.ltv).toBeLessThanOrEqual(0.92);
    expect(low.lienAmount).toBe(0);
    expect(high.lienAmount).toBe(0);
  });

  it('auction reflects late-stage debt 70-95% LTV', () => {
    const r = estimateEncumbrance({
      distressType: 'auction',
      estimatedValue: 800_000,
      opportunityScore: 80,
    })!;
    expect(r.ltv).toBeGreaterThanOrEqual(0.7);
    expect(r.ltv).toBeLessThanOrEqual(0.95);
    expect(r.debtAmount).toBeGreaterThan(0);
  });

  it('reo carries lower LTV than active foreclosure (bank wrote down basis)', () => {
    const reo = estimateEncumbrance({
      distressType: 'reo',
      estimatedValue: 1_000_000,
      opportunityScore: 50,
    })!;
    const foreclosure = estimateEncumbrance({
      distressType: 'foreclosure',
      estimatedValue: 1_000_000,
      opportunityScore: 50,
    })!;
    expect(reo.ltv).toBeLessThanOrEqual(foreclosure.ltv);
  });

  it('pre-foreclosure stays below auction LTV at same score', () => {
    const pre = estimateEncumbrance({
      distressType: 'pre-foreclosure',
      estimatedValue: 1_000_000,
      opportunityScore: 60,
    })!;
    const auction = estimateEncumbrance({
      distressType: 'auction',
      estimatedValue: 1_000_000,
      opportunityScore: 60,
    })!;
    expect(pre.ltv).toBeLessThan(auction.ltv);
  });

  it('output values are non-negative integers', () => {
    const r = estimateEncumbrance({
      distressType: 'foreclosure',
      estimatedValue: 743_215,
      opportunityScore: 67,
    })!;
    expect(Number.isInteger(r.debtAmount)).toBe(true);
    expect(Number.isInteger(r.lienAmount)).toBe(true);
    expect(r.debtAmount).toBeGreaterThanOrEqual(0);
    expect(r.lienAmount).toBeGreaterThanOrEqual(0);
  });
});

describe('buildEstimateProvenance', () => {
  it('captures the inputs and method for audit', () => {
    const input = {
      distressType: 'tax-lien' as const,
      estimatedValue: 500_000,
      opportunityScore: 70,
      connectorSource: 'NYC DOF Tax Liens',
      daysInDistress: 200,
    };
    const est = estimateEncumbrance(input)!;
    const at = new Date('2026-04-22T00:00:00.000Z');
    const prov = buildEstimateProvenance(input, est, at);
    expect(prov.source).toBe('heuristic_v1');
    expect(prov.method).toBe(est.method);
    expect(prov.estimatedAt).toBe(at.toISOString());
    expect(prov.inputs.connectorSource).toBe('NYC DOF Tax Liens');
    expect(prov.ltv).toBe(est.ltv);
  });
});
