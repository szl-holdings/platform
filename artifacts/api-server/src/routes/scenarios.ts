import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Shock taxonomy — named composable macro-events with parameter ranges
// ---------------------------------------------------------------------------

export interface ShockDefinition {
  id: string;
  name: string;
  category: 'commodity' | 'rates' | 'geopolitical' | 'fx' | 'real_estate' | 'sanctions';
  description: string;
  icon: string;
  defaultMagnitude: number;
  unit: string;
  minMagnitude: number;
  maxMagnitude: number;
  affectedDomains: Domain[];
  transmissionChannels: string[];
}

type Domain = 'vessels' | 'terra' | 'szl_holdings' | 'counsel' | 'aegis' | 'lyte';

export const SHOCK_LIBRARY: ShockDefinition[] = [
  {
    id: 'oil-spike',
    name: 'Oil Price Shock',
    category: 'commodity',
    description: 'Crude oil price movement — positive = supply squeeze, negative = glut.',
    icon: '🛢',
    defaultMagnitude: 20,
    unit: '$/bbl',
    minMagnitude: -60,
    maxMagnitude: 120,
    affectedDomains: ['vessels', 'terra', 'szl_holdings', 'counsel'],
    transmissionChannels: ['fuel_cost', 'cap_rate', 'nav', 'contract_clauses'],
  },
  {
    id: 'rate-hike',
    name: 'Interest Rate Move',
    category: 'rates',
    description: 'Central bank rate change in basis points — positive = hike, negative = cut.',
    icon: '📈',
    defaultMagnitude: 75,
    unit: 'bps',
    minMagnitude: -300,
    maxMagnitude: 300,
    affectedDomains: ['terra', 'szl_holdings', 'vessels', 'lyte'],
    transmissionChannels: ['cap_rate', 'nav', 'voyage_financing', 'deal_irr'],
  },
  {
    id: 'strait-closure',
    name: 'Strategic Strait Closure',
    category: 'geopolitical',
    description: 'Maritime chokepoint closure (Suez, Hormuz, Malacca) for N weeks.',
    icon: '⚓',
    defaultMagnitude: 6,
    unit: 'weeks',
    minMagnitude: 1,
    maxMagnitude: 26,
    affectedDomains: ['vessels', 'szl_holdings', 'counsel', 'aegis'],
    transmissionChannels: ['voyage_reroute', 'cargo_delay', 'war_risk_premium', 'force_majeure'],
  },
  {
    id: 'eu-sanctions',
    name: 'EU Sanctions Package',
    category: 'sanctions',
    description: 'Sanctions regime expansion — 1 = light export controls, 5 = full sector ban.',
    icon: '🚫',
    defaultMagnitude: 3,
    unit: 'severity (1–5)',
    minMagnitude: 1,
    maxMagnitude: 5,
    affectedDomains: ['vessels', 'counsel', 'szl_holdings', 'aegis'],
    transmissionChannels: ['sanctions_screening', 'counterparty_exposure', 'contract_termination'],
  },
  {
    id: 'fx-usd',
    name: 'USD FX Move',
    category: 'fx',
    description: 'USD DXY index shift in percentage points — positive = USD strengthening.',
    icon: '💱',
    defaultMagnitude: 5,
    unit: '%',
    minMagnitude: -20,
    maxMagnitude: 20,
    affectedDomains: ['vessels', 'terra', 'szl_holdings'],
    transmissionChannels: ['charter_revenue', 'foreign_asset_valuation', 'nav'],
  },
  {
    id: 'occupancy-delta',
    name: 'Commercial Occupancy Shift',
    category: 'real_estate',
    description: 'Occupancy rate change across commercial real estate portfolio (ppt).',
    icon: '🏢',
    defaultMagnitude: -8,
    unit: 'ppt',
    minMagnitude: -30,
    maxMagnitude: 15,
    affectedDomains: ['terra', 'szl_holdings'],
    transmissionChannels: ['noi_impact', 'cap_rate', 'nav'],
  },
  {
    id: 'geopolitical-threat',
    name: 'Geopolitical Threat Escalation',
    category: 'geopolitical',
    description: 'Threat-environment severity (1 = normalised, 5 = active conflict near assets).',
    icon: '🛡',
    defaultMagnitude: 3.5,
    unit: 'threat level (1–5)',
    minMagnitude: 1,
    maxMagnitude: 5,
    affectedDomains: ['aegis', 'vessels', 'counsel', 'szl_holdings'],
    transmissionChannels: ['war_risk_premium', 'force_majeure', 'soc_escalation', 'nav'],
  },
];

// ---------------------------------------------------------------------------
// Transmission-rule schema
//
// Each rule describes one causal edge in the shock→entity graph:
//   shockId ──[channel]──→ entity (domain, entityId)
//
// `computeDeltaM` returns the P&L impact in $M (positive = gain, negative = loss)
// given the raw shock magnitude and the scenario horizon in weeks.
//
// Rules are pure functions so they are deterministic, testable in isolation,
// and composable when multiple shocks affect the same entity (deltas sum).
// ---------------------------------------------------------------------------

export interface TransmissionRule {
  id: string;
  shockId: string;
  entityId: string;
  entityLabel: string;
  domain: Domain;
  domainIcon: string;
  domainColor: string;
  metricLabel: string;
  baselineM: number;            // baseline value in $M used to compute % delta
  channel: string;
  computeDeltaM: (magnitude: number, horizonWeeks: number) => number;
  narrativeFn: (magnitude: number, deltaMTotal: number) => string[];
}

// Deterministic pseudo-random helper (no Math.random — stable across calls)
function stableNoise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const TRANSMISSION_RULES: TransmissionRule[] = [
  // ── Vessels: MV Poseidon ──────────────────────────────────────────────────
  {
    id: 'oil→vessels-poseidon-fuel',
    shockId: 'oil-spike',
    entityId: 'vessels-mv-poseidon',
    entityLabel: 'MV Poseidon',
    domain: 'vessels',
    domainIcon: '⚓',
    domainColor: '#0ea5e9',
    metricLabel: 'Voyage P&L',
    baselineM: 8.2,
    channel: 'fuel_cost',
    computeDeltaM: (mag, hw) => -(mag * 0.19) * Math.min(hw / 4, 2.5),
    narrativeFn: (mag) => mag > 5
      ? [`Fuel surcharge rises $${(mag * 0.19).toFixed(1)}M on current charter rates.`,
         `${Math.floor(mag / 8)} routes become marginally uneconomic.`]
      : mag < -5
        ? [`Fuel savings of $${Math.abs(mag * 0.19).toFixed(1)}M unlock additional route capacity.`]
        : [],
  },
  {
    id: 'strait→vessels-poseidon-reroute',
    shockId: 'strait-closure',
    entityId: 'vessels-mv-poseidon',
    entityLabel: 'MV Poseidon',
    domain: 'vessels',
    domainIcon: '⚓',
    domainColor: '#0ea5e9',
    metricLabel: 'Voyage P&L',
    baselineM: 8.2,
    channel: 'voyage_reroute',
    computeDeltaM: (mag) => -(mag * 0.42),
    narrativeFn: (mag) => mag > 0
      ? [`Rerouting adds ${(mag * 0.42).toFixed(1)} voyage-days of transit cost.`,
         `Charter extensions required for ${Math.ceil(mag / 3)} active voyages.`]
      : [],
  },
  {
    id: 'sanctions→vessels-poseidon-screen',
    shockId: 'eu-sanctions',
    entityId: 'vessels-mv-poseidon',
    entityLabel: 'MV Poseidon',
    domain: 'vessels',
    domainIcon: '⚓',
    domainColor: '#0ea5e9',
    metricLabel: 'Voyage P&L',
    baselineM: 8.2,
    channel: 'counterparty_exposure',
    computeDeltaM: (mag) => mag >= 3 ? -(mag * 1.1) : -(mag * 0.25),
    narrativeFn: (mag) => mag >= 3
      ? [`${Math.ceil(mag * 1.2)} counterparties flagged for sanctions re-screening.`,
         `Force majeure review required on ${Math.ceil(mag / 2)} cargo agreements.`]
      : [],
  },
  {
    id: 'fx→vessels-poseidon-charter',
    shockId: 'fx-usd',
    entityId: 'vessels-mv-poseidon',
    entityLabel: 'MV Poseidon',
    domain: 'vessels',
    domainIcon: '⚓',
    domainColor: '#0ea5e9',
    metricLabel: 'Voyage P&L',
    baselineM: 8.2,
    channel: 'charter_revenue',
    computeDeltaM: (mag, hw) => mag * 0.08 * Math.min(hw / 4, 2.5),
    narrativeFn: (mag) => mag > 2
      ? [`USD strengthening benefits USD-denominated charter income by ~$${(mag * 0.08).toFixed(1)}M.`]
      : mag < -2
        ? [`USD weakness reduces charter income value in reporting currency.`]
        : [],
  },

  // ── Vessels: MV Argo Fleet ────────────────────────────────────────────────
  {
    id: 'oil→vessels-argo-fuel',
    shockId: 'oil-spike',
    entityId: 'vessels-mv-argo',
    entityLabel: 'MV Argo Fleet',
    domain: 'vessels',
    domainIcon: '⚓',
    domainColor: '#0ea5e9',
    metricLabel: 'Voyage P&L',
    baselineM: 5.1,
    channel: 'fuel_cost',
    computeDeltaM: (mag, hw) => -(mag * 0.11) * Math.min(hw / 4, 2.5),
    narrativeFn: (mag) => mag > 10
      ? [`War-risk premium surcharge expected on Red Sea segments.`,
         `${Math.floor(mag / 10)} long-haul routes become temporarily uneconomic.`]
      : [],
  },
  {
    id: 'strait→vessels-argo-reroute',
    shockId: 'strait-closure',
    entityId: 'vessels-mv-argo',
    entityLabel: 'MV Argo Fleet',
    domain: 'vessels',
    domainIcon: '⚓',
    domainColor: '#0ea5e9',
    metricLabel: 'Voyage P&L',
    baselineM: 5.1,
    channel: 'voyage_reroute',
    computeDeltaM: (mag) => -(mag * 0.26),
    narrativeFn: (mag) => mag > 3
      ? [`Long-haul detour makes ${Math.floor(mag / 3)} routes temporarily uneconomic.`]
      : [],
  },
  {
    id: 'sanctions→vessels-argo-screen',
    shockId: 'eu-sanctions',
    entityId: 'vessels-mv-argo',
    entityLabel: 'MV Argo Fleet',
    domain: 'vessels',
    domainIcon: '⚓',
    domainColor: '#0ea5e9',
    metricLabel: 'Voyage P&L',
    baselineM: 5.1,
    channel: 'counterparty_exposure',
    computeDeltaM: (mag) => mag >= 3 ? -(mag * 0.7) : -(mag * 0.15),
    narrativeFn: (mag) => mag >= 4
      ? [`Fleet-wide counterparty re-screen required under new sanctions tier.`]
      : [],
  },

  // ── Terra: Miami Beach Commercial ─────────────────────────────────────────
  {
    id: 'rate→terra-miami-caprate',
    shockId: 'rate-hike',
    entityId: 'terra-miami-commercial',
    entityLabel: 'Miami Beach Commercial',
    domain: 'terra',
    domainIcon: '⬢',
    domainColor: '#22c55e',
    metricLabel: 'Asset NAV',
    baselineM: 42,
    channel: 'cap_rate',
    computeDeltaM: (mag, hw) => -(mag / 10000) * 0.38 * 100 * 1.8 * Math.min(hw / 4, 2.5),
    narrativeFn: (mag) => mag !== 0
      ? [`${Math.abs(mag * 0.38).toFixed(0)}bps cap-rate ${mag > 0 ? 'expansion' : 'compression'} drives valuation ${mag > 0 ? 'down' : 'up'}.`,
         `Industrial properties most ${mag > 0 ? 'exposed' : 'insulated'} in this rate environment.`]
      : [],
  },
  {
    id: 'occupancy→terra-miami-noi',
    shockId: 'occupancy-delta',
    entityId: 'terra-miami-commercial',
    entityLabel: 'Miami Beach Commercial',
    domain: 'terra',
    domainIcon: '⬢',
    domainColor: '#22c55e',
    metricLabel: 'Asset NAV',
    baselineM: 42,
    channel: 'noi_impact',
    computeDeltaM: (mag) => (mag / 100) * 12.4 * 1.8,
    narrativeFn: (mag) => mag < 0
      ? [`${Math.abs(mag)}ppt occupancy drop reduces NOI by $${Math.abs((mag / 100) * 12.4).toFixed(1)}M.`]
      : mag > 0
        ? [`${mag}ppt occupancy gain adds $${((mag / 100) * 12.4).toFixed(1)}M to annual NOI.`]
        : [],
  },
  {
    id: 'fx→terra-miami-valuation',
    shockId: 'fx-usd',
    entityId: 'terra-miami-commercial',
    entityLabel: 'Miami Beach Commercial',
    domain: 'terra',
    domainIcon: '⬢',
    domainColor: '#22c55e',
    metricLabel: 'Asset NAV',
    baselineM: 42,
    channel: 'foreign_asset_valuation',
    computeDeltaM: (mag, hw) => -(mag * 0.04) * Math.min(hw / 4, 2.5),
    narrativeFn: () => [],
  },

  // ── Terra: Austin Industrial ──────────────────────────────────────────────
  {
    id: 'rate→terra-austin-caprate',
    shockId: 'rate-hike',
    entityId: 'terra-austin-industrial',
    entityLabel: 'Austin Industrial',
    domain: 'terra',
    domainIcon: '⬢',
    domainColor: '#22c55e',
    metricLabel: 'Asset NAV',
    baselineM: 28,
    channel: 'cap_rate',
    computeDeltaM: (mag, hw) => -(mag / 10000) * 0.38 * 100 * 0.9 * Math.min(hw / 4, 2.5),
    narrativeFn: (mag) => mag > 100
      ? [`Long-duration leases limit mark-to-market exposure over short horizon.`]
      : [],
  },
  {
    id: 'occupancy→terra-austin-noi',
    shockId: 'occupancy-delta',
    entityId: 'terra-austin-industrial',
    entityLabel: 'Austin Industrial',
    domain: 'terra',
    domainIcon: '⬢',
    domainColor: '#22c55e',
    metricLabel: 'Asset NAV',
    baselineM: 28,
    channel: 'noi_impact',
    computeDeltaM: (mag) => (mag / 100) * 8.1 * 0.9,
    narrativeFn: (mag) => mag < -5
      ? [`Industrial sector more resilient than office — impact partially cushioned.`]
      : [],
  },

  // ── SZL Holdings: Portfolio NAV ───────────────────────────────────────────
  {
    id: 'oil→szl-nav',
    shockId: 'oil-spike',
    entityId: 'szl-portfolio-nav',
    entityLabel: 'SZL Portfolio NAV',
    domain: 'szl_holdings',
    domainIcon: '◆',
    domainColor: '#f59e0b',
    metricLabel: 'Portfolio NAV',
    baselineM: 120,
    channel: 'nav',
    computeDeltaM: (mag, hw) => -(mag * 0.004) * Math.min(hw / 4, 2.5) * 120,
    narrativeFn: (mag) => mag > 0
      ? [`Maritime segment drives ${Math.abs(mag * 0.4).toFixed(0)}% of headline NAV variance via fuel exposure.`]
      : [],
  },
  {
    id: 'rate→szl-nav',
    shockId: 'rate-hike',
    entityId: 'szl-portfolio-nav',
    entityLabel: 'SZL Portfolio NAV',
    domain: 'szl_holdings',
    domainIcon: '◆',
    domainColor: '#f59e0b',
    metricLabel: 'Portfolio NAV',
    baselineM: 120,
    channel: 'nav',
    computeDeltaM: (mag, hw) => -(mag / 10000) * 0.07 * Math.min(hw / 4, 2.5) * 120,
    narrativeFn: (mag) => mag > 50
      ? [`Real estate cap-rate exposure accounts for ~${(mag * 0.25).toFixed(0)}bps of NAV erosion.`]
      : [],
  },
  {
    id: 'strait→szl-nav',
    shockId: 'strait-closure',
    entityId: 'szl-portfolio-nav',
    entityLabel: 'SZL Portfolio NAV',
    domain: 'szl_holdings',
    domainIcon: '◆',
    domainColor: '#f59e0b',
    metricLabel: 'Portfolio NAV',
    baselineM: 120,
    channel: 'nav',
    computeDeltaM: (mag) => -(mag * 0.28),
    narrativeFn: (mag) => mag > 3
      ? [`Strait closure of ${mag} weeks crystallises logistics risk across maritime holdings.`]
      : [],
  },
  {
    id: 'sanctions→szl-nav',
    shockId: 'eu-sanctions',
    entityId: 'szl-portfolio-nav',
    entityLabel: 'SZL Portfolio NAV',
    domain: 'szl_holdings',
    domainIcon: '◆',
    domainColor: '#f59e0b',
    metricLabel: 'Portfolio NAV',
    baselineM: 120,
    channel: 'nav',
    computeDeltaM: (mag) => -(mag * 0.6),
    narrativeFn: (mag) => mag >= 3
      ? [`Sanctions scenario triggers portfolio-level compliance review.`,
         `Portfolio hedge ratio ${mag > 4 ? 'insufficient' : 'adequate'} at current coverage.`]
      : [],
  },
  {
    id: 'occupancy→szl-nav',
    shockId: 'occupancy-delta',
    entityId: 'szl-portfolio-nav',
    entityLabel: 'SZL Portfolio NAV',
    domain: 'szl_holdings',
    domainIcon: '◆',
    domainColor: '#f59e0b',
    metricLabel: 'Portfolio NAV',
    baselineM: 120,
    channel: 'nav',
    computeDeltaM: (mag, hw) => mag * 0.15 * Math.min(hw / 4, 2.5),
    narrativeFn: () => [],
  },
  {
    id: 'threat→szl-nav',
    shockId: 'geopolitical-threat',
    entityId: 'szl-portfolio-nav',
    entityLabel: 'SZL Portfolio NAV',
    domain: 'szl_holdings',
    domainIcon: '◆',
    domainColor: '#f59e0b',
    metricLabel: 'Portfolio NAV',
    baselineM: 120,
    channel: 'war_risk_premium',
    computeDeltaM: (mag) => mag > 3 ? -((mag - 3) * 0.9) : 0,
    narrativeFn: (mag) => mag > 3
      ? [`Elevated geopolitical threat adds war-risk premium across maritime and real-estate exposure.`]
      : [],
  },
  {
    id: 'fx→szl-nav',
    shockId: 'fx-usd',
    entityId: 'szl-portfolio-nav',
    entityLabel: 'SZL Portfolio NAV',
    domain: 'szl_holdings',
    domainIcon: '◆',
    domainColor: '#f59e0b',
    metricLabel: 'Portfolio NAV',
    baselineM: 120,
    channel: 'nav',
    computeDeltaM: (mag, hw) => -(mag * 0.01) * Math.min(hw / 4, 2.5) * 120,
    narrativeFn: () => [],
  },

  // ── Counsel: Maritime & Cargo Contracts ───────────────────────────────────
  {
    id: 'oil→counsel-contracts',
    shockId: 'oil-spike',
    entityId: 'counsel-contracts',
    entityLabel: 'Maritime & Cargo Contracts',
    domain: 'counsel',
    domainIcon: '⚖',
    domainColor: '#a855f7',
    metricLabel: 'Clauses Triggered',
    baselineM: 24,  // total clauses in portfolio
    channel: 'contract_clauses',
    computeDeltaM: (mag) => mag > 12 ? Math.floor(mag / 12) : 0,
    narrativeFn: (mag) => mag > 12
      ? [`${Math.floor(mag / 12)} cargo contracts contain fuel price escalation clauses.`]
      : [],
  },
  {
    id: 'strait→counsel-force-majeure',
    shockId: 'strait-closure',
    entityId: 'counsel-contracts',
    entityLabel: 'Maritime & Cargo Contracts',
    domain: 'counsel',
    domainIcon: '⚖',
    domainColor: '#a855f7',
    metricLabel: 'Clauses Triggered',
    baselineM: 24,
    channel: 'force_majeure',
    computeDeltaM: (mag) => mag > 2 ? 3 : 0,
    narrativeFn: (mag) => mag > 2
      ? [`3 charter agreements invoke force majeure provisions for strait closure >${mag} weeks.`]
      : [],
  },
  {
    id: 'sanctions→counsel-screen',
    shockId: 'eu-sanctions',
    entityId: 'counsel-contracts',
    entityLabel: 'Maritime & Cargo Contracts',
    domain: 'counsel',
    domainIcon: '⚖',
    domainColor: '#a855f7',
    metricLabel: 'Clauses Triggered',
    baselineM: 24,
    channel: 'contract_termination',
    computeDeltaM: (mag) => mag >= 3 ? 4 : 0,
    narrativeFn: (mag) => mag >= 3
      ? [`4 counterparties require immediate re-screening under updated sanctions regime.`]
      : [],
  },

  // ── Aegis: Threat Surface ─────────────────────────────────────────────────
  {
    id: 'threat→aegis-surface',
    shockId: 'geopolitical-threat',
    entityId: 'aegis-threat-surface',
    entityLabel: 'Threat Surface',
    domain: 'aegis',
    domainIcon: '🛡',
    domainColor: '#ef4444',
    metricLabel: 'Attack Probability %',
    baselineM: 100,  // normalised 100% baseline
    channel: 'soc_escalation',
    computeDeltaM: (mag) => mag > 2.5 ? (mag - 2) * 14 : 0,
    narrativeFn: (mag) => mag > 3
      ? [`Threat level ${mag}/5 — SOC posture elevated to AMBER.`,
         `Nation-state actor TTPs updated; ${Math.ceil((mag - 2) * 2)} new indicators ingested.`]
      : [],
  },
  {
    id: 'strait→aegis-maritime-ot',
    shockId: 'strait-closure',
    entityId: 'aegis-threat-surface',
    entityLabel: 'Threat Surface',
    domain: 'aegis',
    domainIcon: '🛡',
    domainColor: '#ef4444',
    metricLabel: 'Attack Probability %',
    baselineM: 100,
    channel: 'war_risk_premium',
    computeDeltaM: (mag) => mag * 2,
    narrativeFn: (mag) => mag > 0
      ? [`Maritime OT systems flagged for heightened monitoring during ${mag}-week closure.`]
      : [],
  },
  {
    id: 'sanctions→aegis-actor',
    shockId: 'eu-sanctions',
    entityId: 'aegis-threat-surface',
    entityLabel: 'Threat Surface',
    domain: 'aegis',
    domainIcon: '🛡',
    domainColor: '#ef4444',
    metricLabel: 'Attack Probability %',
    baselineM: 100,
    channel: 'soc_escalation',
    computeDeltaM: (mag) => mag >= 3 ? (mag - 2) * 5 : 0,
    narrativeFn: (mag) => mag >= 3
      ? [`Nation-state actor correlation with sanctions regime — ${Math.ceil((mag - 2) * 3)} TTPs updated.`]
      : [],
  },
];

// ---------------------------------------------------------------------------
// Propagation engine — walks the transmission-rule graph
// ---------------------------------------------------------------------------

interface EntityDelta {
  entityId: string;
  entityLabel: string;
  domain: string;
  domainIcon: string;
  domainColor: string;
  metricLabel: string;
  absoluteDelta: number;
  percentDelta: number;
  confidence: number;
  direction: 'up' | 'down' | 'flat';
  narrativeLines: string[];
}

interface ScenarioResult {
  scenarioId: string;
  name: string;
  shocks: AppliedShock[];
  horizon: string;
  entityDeltas: EntityDelta[];
  portfolioPnLLow: number;
  portfolioPnLMid: number;
  portfolioPnLHigh: number;
  topMovers: { label: string; delta: string; direction: 'up' | 'down' }[];
  sensitivityMap: SensitivityCell[];
  runAt: string;
  computedBy: 'rule-graph-v1';
}

interface SensitivityCell {
  shock: string;
  domain: string;
  sensitivity: number;
}

function toPercent(absoluteDelta: number, baselineM: number): number {
  if (baselineM === 0) return 0;
  return parseFloat(((absoluteDelta / baselineM) * 100).toFixed(1));
}

function computeConfidence(ruleIds: string[], seed: number): number {
  const base = 0.68 + stableNoise(seed + ruleIds.length) * 0.22;
  return Math.round(base * 100) / 100;
}

function propagateShocks(shocks: AppliedShock[], horizonWeeks: number): EntityDelta[] {
  // Aggregate deltas per entity by walking all matching transmission rules
  const accumulator = new Map<
    string,
    {
      rule: TransmissionRule;
      totalDeltaM: number;
      narrativeLines: string[];
      ruleIds: string[];
    }
  >();

  for (const shock of shocks) {
    const matchingRules = TRANSMISSION_RULES.filter((r) => r.shockId === shock.shockId);
    for (const rule of matchingRules) {
      const deltaM = rule.computeDeltaM(shock.magnitude, horizonWeeks);
      const lines = rule.narrativeFn(shock.magnitude, deltaM);

      const existing = accumulator.get(rule.entityId);
      if (existing) {
        existing.totalDeltaM += deltaM;
        existing.narrativeLines.push(...lines);
        existing.ruleIds.push(rule.id);
      } else {
        accumulator.set(rule.entityId, {
          rule,
          totalDeltaM: deltaM,
          narrativeLines: [...lines],
          ruleIds: [rule.id],
        });
      }
    }
  }

  // Convert accumulator entries to EntityDelta objects
  const deltas: EntityDelta[] = [];
  let seed = 42;
  for (const [entityId, { rule, totalDeltaM, narrativeLines, ruleIds }] of accumulator) {
    const pct = toPercent(totalDeltaM, rule.baselineM);
    deltas.push({
      entityId,
      entityLabel: rule.entityLabel,
      domain: rule.domain,
      domainIcon: rule.domainIcon,
      domainColor: rule.domainColor,
      metricLabel: rule.metricLabel,
      absoluteDelta: parseFloat(totalDeltaM.toFixed(2)),
      percentDelta: pct,
      confidence: computeConfidence(ruleIds, seed++),
      direction: totalDeltaM > 0.05 ? 'up' : totalDeltaM < -0.05 ? 'down' : 'flat',
      narrativeLines: [...new Set(narrativeLines)],  // deduplicate
    });
  }

  return deltas;
}

function buildSensitivityMap(shocks: AppliedShock[]): SensitivityCell[] {
  const domainNames: Record<Domain, string> = {
    vessels: 'Vessels',
    terra: 'Terra',
    szl_holdings: 'SZL Holdings',
    counsel: 'Counsel',
    aegis: 'Aegis',
    lyte: 'Lyte',
  };

  const cells: SensitivityCell[] = [];
  for (const shock of shocks) {
    const def = SHOCK_LIBRARY.find((s) => s.id === shock.shockId);
    if (!def) continue;

    const displayDomains: Domain[] = ['vessels', 'terra', 'szl_holdings', 'counsel', 'aegis'];
    for (const domain of displayDomains) {
      // Sensitivity = sum of |computeDeltaM| for all rules matching this (shock, domain), normalised
      const matchingRules = TRANSMISSION_RULES.filter(
        (r) => r.shockId === shock.shockId && r.domain === domain,
      );
      const rawSens = matchingRules.reduce(
        (acc, r) => acc + Math.abs(r.computeDeltaM(shock.magnitude, 12)),
        0,
      );
      // Normalise to 0–1 using the domain baseline sum as reference
      const refM = matchingRules.reduce((acc, r) => acc + r.baselineM, 0) || 100;
      const sensitivity = Math.min(rawSens / refM, 1);
      cells.push({
        shock: def.name,
        domain: domainNames[domain],
        sensitivity: Math.round(sensitivity * 100) / 100,
      });
    }
  }
  return cells;
}

// ---------------------------------------------------------------------------
// Request / response schemas
// ---------------------------------------------------------------------------

const AppliedShockSchema = z.object({
  shockId: z.string().min(1),
  magnitude: z.number(),
  label: z.string().optional(),
});

type AppliedShock = z.infer<typeof AppliedShockSchema>;

const runScenarioSchema = z.object({
  name: z.string().max(120).optional().default('Unnamed scenario'),
  shocks: z.array(AppliedShockSchema).min(1).max(8),
  horizonWeeks: z.number().int().min(1).max(52).optional().default(12),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** GET /scenarios/library — returns the shock taxonomy */
router.get(
  '/scenarios/library',
  authMiddleware({ required: false }),
  (_req: Request, res: Response) => {
    try {
      sendSuccess(res, { shocks: SHOCK_LIBRARY });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load scenario library');
    }
  },
);

/** POST /scenarios/run — propagates stacked shocks across the entity graph */
router.post(
  '/scenarios/run',
  authMiddleware({ required: false }),
  validateBody(runScenarioSchema),
  (req: Request, res: Response) => {
    try {
      const { name, shocks, horizonWeeks } = req.body as {
        name: string;
        shocks: AppliedShock[];
        horizonWeeks: number;
      };

      for (const s of shocks) {
        if (!SHOCK_LIBRARY.find((lib) => lib.id === s.shockId)) {
          res.status(400).json({ error: `Unknown shock ID: ${s.shockId}` });
          return;
        }
      }

      const entityDeltas = propagateShocks(shocks, horizonWeeks);

      // Portfolio P&L band from the SZL holdings NAV delta
      const holdingsDelta = entityDeltas.find((e) => e.entityId === 'szl-portfolio-nav');
      const mid = holdingsDelta?.absoluteDelta ?? 0;
      const sigma = Math.abs(mid) * 0.28 + 1.2;
      const portfolioPnLLow = parseFloat((mid - sigma).toFixed(2));
      const portfolioPnLMid = parseFloat(mid.toFixed(2));
      const portfolioPnLHigh = parseFloat((mid + sigma).toFixed(2));

      // Top movers (excluding portfolio roll-up)
      const topMovers = [...entityDeltas]
        .filter((e) => e.entityId !== 'szl-portfolio-nav')
        .sort((a, b) => Math.abs(b.percentDelta) - Math.abs(a.percentDelta))
        .slice(0, 4)
        .map((e) => ({
          label: `${e.domainIcon} ${e.entityLabel}`,
          delta: `${e.percentDelta >= 0 ? '+' : ''}${e.percentDelta.toFixed(1)}%`,
          direction: e.direction as 'up' | 'down',
        }));

      const sensitivityMap = buildSensitivityMap(shocks);

      const result: ScenarioResult = {
        scenarioId: `scn_${Date.now()}`,
        name,
        shocks,
        horizon: `${horizonWeeks}w`,
        entityDeltas,
        portfolioPnLLow,
        portfolioPnLMid,
        portfolioPnLHigh,
        topMovers,
        sensitivityMap,
        runAt: new Date().toISOString(),
        computedBy: 'rule-graph-v1',
      };

      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to run scenario');
    }
  },
);

export default router;
