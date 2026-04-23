/**
 * Vessels Write-Path Unit Tests
 *
 * Covers:
 *  1. Alert-rule CRUD schema validation (Zod, no DB)
 *  2. Trading order math (notional value, commission, fill logic)
 *  3. Voyage-economics math (TCE, margin, cost breakdown)
 *  4. Dark-vessel suspicion-score computation
 *
 * All tests run in-process — no live server or database required.
 */

import { insertVesselAlertRuleSchema } from '../../lib/db/src/schema/vessels';
import { describe, expect, it } from 'vitest';

// ─── 1. Alert-rule schema validation (real server schema from @szl-holdings/db) ─

describe('SEXTANT — Alert Rule schema', () => {
  it('accepts a valid rule with all required fields', () => {
    const result = insertVesselAlertRuleSchema.safeParse({
      name: 'Speed Limit Alert',
      ruleType: 'speed',
      severity: 'high',
      conditions: { maxKnots: 15 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Speed Limit Alert');
      expect(result.data.ruleType).toBe('speed');
    }
  });

  it('rejects when name field is absent', () => {
    const result = insertVesselAlertRuleSchema.safeParse({
      ruleType: 'geofence',
      severity: 'medium',
      conditions: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid ruleType enum value', () => {
    const result = insertVesselAlertRuleSchema.safeParse({
      name: 'Bad Rule',
      ruleType: 'unknown_type',
      severity: 'high',
      conditions: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid severity enum value', () => {
    const result = insertVesselAlertRuleSchema.safeParse({
      name: 'Test',
      ruleType: 'speed',
      severity: 'extreme',
      conditions: {},
    });
    expect(result.success).toBe(false);
  });

  it('accepts rule without optional isActive (DB supplies default)', () => {
    const result = insertVesselAlertRuleSchema.safeParse({
      name: 'Cargo Alert',
      ruleType: 'cargo',
      severity: 'low',
      conditions: {},
    });
    expect(result.success).toBe(true);
  });
});

// ─── 2. Trading order math ────────────────────────────────────────────────────

function computeOrderNotional(quantity: number, price: number): number {
  return quantity * price;
}

function computeCommission(notional: number, rate = 0.003): number {
  return Math.round(notional * rate * 100) / 100;
}

function resolveOrderFill(
  orderType: 'market' | 'limit',
  limitPrice: number | undefined,
  currentPrice: number,
): { fillPrice: number; status: 'filled' | 'open' } {
  if (orderType === 'market') {
    return { fillPrice: currentPrice, status: 'filled' };
  }
  return { fillPrice: limitPrice ?? currentPrice, status: 'open' };
}

describe('SEXTANT — Trading order math', () => {
  it('computes notional correctly for market order', () => {
    const notional = computeOrderNotional(10, 1800);
    expect(notional).toBe(18000);
  });

  it('computes commission at 0.3% rate', () => {
    const commission = computeCommission(18000);
    expect(commission).toBe(54);
  });

  it('rounds commission to 2 decimal places', () => {
    const commission = computeCommission(12345.67);
    expect(commission).toBe(37.04);
  });

  it('market order fills at current price', () => {
    const { fillPrice, status } = resolveOrderFill('market', undefined, 2000);
    expect(fillPrice).toBe(2000);
    expect(status).toBe('filled');
  });

  it('limit order stays open at limit price', () => {
    const { fillPrice, status } = resolveOrderFill('limit', 1950, 2000);
    expect(fillPrice).toBe(1950);
    expect(status).toBe('open');
  });
});

// ─── 3. Voyage economics math ─────────────────────────────────────────────────

interface VoyageCosts {
  estimatedRevenue: number;
  operatingCost: number;
  fuelCost: number;
  portCost: number;
  delayCost: number;
  distanceNm: number;
  durationDays: number;
}

function computeMarginEstimate(voyage: Pick<VoyageCosts, 'estimatedRevenue' | 'operatingCost'>) {
  return voyage.estimatedRevenue - voyage.operatingCost;
}

function computeMarginPct(voyage: Pick<VoyageCosts, 'estimatedRevenue' | 'operatingCost'>) {
  if (voyage.estimatedRevenue <= 0) return 0;
  return (computeMarginEstimate(voyage) / voyage.estimatedRevenue) * 100;
}

function computeTCE(
  voyage: Pick<VoyageCosts, 'estimatedRevenue' | 'operatingCost' | 'durationDays'>,
): number {
  if (voyage.durationDays <= 0) return 0;
  return computeMarginEstimate(voyage) / voyage.durationDays;
}

function computeCostBreakdownPct(voyage: VoyageCosts) {
  const total = voyage.operatingCost;
  if (total <= 0) return { fuel: 0, port: 0, delay: 0, other: 0 };
  const fuel = (voyage.fuelCost / total) * 100;
  const port = (voyage.portCost / total) * 100;
  const delay = (voyage.delayCost / total) * 100;
  const other = Math.max(100 - fuel - port - delay, 0);
  return { fuel, port, delay, other };
}

describe('SEXTANT — Voyage economics math', () => {
  const sampleVoyage: VoyageCosts = {
    estimatedRevenue: 5_000_000,
    operatingCost: 3_500_000,
    fuelCost: 1_800_000,
    portCost: 700_000,
    delayCost: 200_000,
    distanceNm: 8200,
    durationDays: 18,
  };

  it('computes margin estimate correctly', () => {
    const margin = computeMarginEstimate(sampleVoyage);
    expect(margin).toBe(1_500_000);
  });

  it('computes margin percent correctly', () => {
    const pct = computeMarginPct(sampleVoyage);
    expect(pct).toBeCloseTo(30, 1);
  });

  it('computes TCE per day', () => {
    const tce = computeTCE(sampleVoyage);
    expect(tce).toBeCloseTo(83_333, -2);
  });

  it('returns 0 TCE when duration is zero', () => {
    const tce = computeTCE({ ...sampleVoyage, durationDays: 0 });
    expect(tce).toBe(0);
  });

  it('returns 0 margin pct when revenue is zero', () => {
    const pct = computeMarginPct({ ...sampleVoyage, estimatedRevenue: 0 });
    expect(pct).toBe(0);
  });

  it('cost breakdown percentages sum close to 100', () => {
    const { fuel, port, delay, other } = computeCostBreakdownPct(sampleVoyage);
    const sum = fuel + port + delay + other;
    expect(sum).toBeCloseTo(100, 5);
  });

  it('fuel is largest cost component', () => {
    const { fuel, port, delay } = computeCostBreakdownPct(sampleVoyage);
    expect(fuel).toBeGreaterThan(port);
    expect(fuel).toBeGreaterThan(delay);
  });
});

// ─── 4. Dark-vessel suspicion-score computation ───────────────────────────────

interface DarkVesselSignal {
  aisGapMinutes: number;
  destination: string;
  flagCode: string;
  speedKnots: number;
  navStatus: number;
  priorSanctionedPortCalls: number;
}

function computeDarkVesselSuspicionScore(signal: DarkVesselSignal): number {
  let score = 10;
  if (signal.aisGapMinutes > 60 * 20) score += 35;
  else if (signal.aisGapMinutes > 60 * 6) score += 20;
  else if (signal.aisGapMinutes > 60 * 2) score += 10;

  const unknownDestinations = ['UNKNOWN', 'IN TRANSIT', ''];
  if (unknownDestinations.includes(signal.destination.toUpperCase())) score += 10;

  const hiRiskFlags = ['TZ', 'KH', 'KP', 'SY', 'CU'];
  if (hiRiskFlags.includes(signal.flagCode)) score += 15;

  if (signal.speedKnots < 0.3 && signal.navStatus === 0) score += 15;

  score += Math.min(signal.priorSanctionedPortCalls * 10, 30);

  return Math.min(score, 100);
}

describe('SEXTANT — Dark vessel suspicion score', () => {
  it('returns low score for normal vessel', () => {
    const score = computeDarkVesselSuspicionScore({
      aisGapMinutes: 10,
      destination: 'SINGAPORE',
      flagCode: 'NO',
      speedKnots: 14,
      navStatus: 0,
      priorSanctionedPortCalls: 0,
    });
    expect(score).toBeLessThan(30);
  });

  it('penalises long AIS gap heavily', () => {
    const score = computeDarkVesselSuspicionScore({
      aisGapMinutes: 60 * 15,
      destination: 'SINGAPORE',
      flagCode: 'NO',
      speedKnots: 10,
      navStatus: 0,
      priorSanctionedPortCalls: 0,
    });
    expect(score).toBeGreaterThanOrEqual(30);
  });

  it('caps score at 100', () => {
    const score = computeDarkVesselSuspicionScore({
      aisGapMinutes: 60 * 48,
      destination: 'UNKNOWN',
      flagCode: 'KP',
      speedKnots: 0.1,
      navStatus: 0,
      priorSanctionedPortCalls: 5,
    });
    expect(score).toBe(100);
  });

  it('penalises unknown destination', () => {
    const baseline = computeDarkVesselSuspicionScore({
      aisGapMinutes: 60 * 5,
      destination: 'ROTTERDAM',
      flagCode: 'NL',
      speedKnots: 12,
      navStatus: 0,
      priorSanctionedPortCalls: 0,
    });
    const withUnknown = computeDarkVesselSuspicionScore({
      aisGapMinutes: 60 * 5,
      destination: 'UNKNOWN',
      flagCode: 'NL',
      speedKnots: 12,
      navStatus: 0,
      priorSanctionedPortCalls: 0,
    });
    expect(withUnknown).toBeGreaterThan(baseline);
  });

  it('penalises high-risk flag state', () => {
    const withLowRisk = computeDarkVesselSuspicionScore({
      aisGapMinutes: 60,
      destination: 'DUBAI',
      flagCode: 'DE',
      speedKnots: 10,
      navStatus: 0,
      priorSanctionedPortCalls: 0,
    });
    const withHighRisk = computeDarkVesselSuspicionScore({
      aisGapMinutes: 60,
      destination: 'DUBAI',
      flagCode: 'KP',
      speedKnots: 10,
      navStatus: 0,
      priorSanctionedPortCalls: 0,
    });
    expect(withHighRisk).toBeGreaterThan(withLowRisk);
  });

  it('penalises prior sanctioned port calls', () => {
    const clean = computeDarkVesselSuspicionScore({
      aisGapMinutes: 60,
      destination: 'DUBAI',
      flagCode: 'PA',
      speedKnots: 10,
      navStatus: 0,
      priorSanctionedPortCalls: 0,
    });
    const flagged = computeDarkVesselSuspicionScore({
      aisGapMinutes: 60,
      destination: 'DUBAI',
      flagCode: 'PA',
      speedKnots: 10,
      navStatus: 0,
      priorSanctionedPortCalls: 3,
    });
    expect(flagged).toBeGreaterThan(clean);
  });
});
