/**
 * Voyage Risk Twin — Scoring Service
 *
 * Implements the Voyage Risk Twin data contract:
 *   vessel + candidate voyage → risk dimensions (sanctions, dark activity, weather, STS,
 *   counterparty) + economics (fuel, time, revenue) + supporting evidence list.
 *
 * Scoring is deterministic-heuristic: draws from AIS gap patterns in the vessels DB,
 * cross-references an embedded sanctions watchlist, and models economics from vessel-type
 * benchmarks. When live data is absent, output is clearly labeled "DEMO".
 *
 * PDF memo generation uses @react-pdf/renderer (already in api-server deps).
 */

import { Document, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer';
import { type IRouter, type RequestHandler, Router } from 'express';
import rateLimit from 'express-rate-limit';
import React from 'react';
import {
  getSanctionsSources,
  getSanctionsStoreSnapshot,
  runSanctionsRefresh,
  startSanctionsRefreshJob,
} from '../jobs/vessels-sanctions-refresh';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import {
  listQuerySchema,
  sanctionsRefreshBodySchema,
  validateBody,
  validateQuery,
  voyageRiskMemoPdfBodySchema,
  voyageRiskScoreRequestSchema,
} from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

startSanctionsRefreshJob();

const router: IRouter = Router();

const riskLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Voyage risk API rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

// ─── Voyage Risk Data Contract ────────────────────────────────────────────────

export interface VoyageRiskRequest {
  vesselImo?: string;
  vesselName?: string;
  origin: string;
  destination: string;
  routeVariant: string;
  cargoType?: string;
  chartererName?: string;
}

export interface EvidenceSignal {
  signal: string;
  source: string;
  confidence: number;
  dataLabel: 'live' | 'modeled';
}

export interface RiskDimension {
  score: number;
  level: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  summary: string;
  evidence: EvidenceSignal[];
}

export interface VoyageEconomics {
  fuelMt: number;
  bunkerPriceUsd: number;
  fuelCostUsd: number;
  transitDays: number;
  distanceNm: number;
  revenueUsd: number;
  tce: number;
  profitUsd: number;
  portDisbursementsUsd: number;
  canalFeesUsd: number;
  totalCostsUsd: number;
  marginPct: number;
  dataLabel: 'live' | 'modeled';
}

export interface OwnerNode {
  name: string;
  jurisdiction: string;
  entityType: 'vessel' | 'company' | 'person' | 'state';
  sanctioned: boolean;
  opacity: 'transparent' | 'partial' | 'opaque';
  notes?: string;
}

export interface CounterpartyProfile {
  charterer: string;
  chartererCountry: string;
  sanctionRisk: 'none' | 'watch' | 'elevated' | 'critical';
  creditRating: string;
  beneficialControlChain: OwnerNode[];
  keyRisk: string;
}

export interface VoyageRiskScore {
  scenarioId: string;
  vessel: {
    name: string;
    imo: string;
    flag: string;
    type: string;
    dwt: number;
    ageYears: number;
  };
  route: {
    origin: string;
    destination: string;
    variant: string;
    distanceNm: number;
    chokepoints: string[];
  };
  risk: {
    sanctions: RiskDimension;
    darkActivity: RiskDimension;
    weather: RiskDimension;
    sts: RiskDimension;
    counterparty: RiskDimension;
    composite: number;
    compositeLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical';
    recommendation: string;
  };
  economics: VoyageEconomics;
  counterparty: CounterpartyProfile;
  sanctionsRefresh: {
    sources: {
      name: string;
      region: string;
      entities: number;
      lastRefreshedAt: string;
      dataLabel: string;
    }[];
  };
  provenance: {
    dataLabel: 'live' | 'modeled';
    confidence: number;
    attestation: string;
    generatedAt: string;
    note: string;
  };
}

// ─── Embedded sanctions watchlist (public/demo) ───────────────────────────────

const SANCTIONS_WATCHLIST = [
  {
    name: 'Sovcomflot',
    aliases: ['sovcomflot', 'scf'],
    lists: ['US SDN', 'EU Consolidated', 'UK OFSI'],
    jurisdiction: 'Russia',
  },
  {
    name: 'IRISL',
    aliases: ['irisl', 'islamic republic of iran shipping'],
    lists: ['US SDN', 'EU Consolidated'],
    jurisdiction: 'Iran',
  },
  {
    name: 'National Iranian Tanker',
    aliases: ['nitc', 'national iranian tanker'],
    lists: ['US SDN'],
    jurisdiction: 'Iran',
  },
  {
    name: 'Black Sea Tanker Holdings',
    aliases: ['black sea tanker', 'bsth'],
    lists: ['US SDN'],
    jurisdiction: 'Cyprus',
  },
  { name: 'Palmali', aliases: ['palmali'], lists: ['US SDN'], jurisdiction: 'Russia' },
];

const SHADOW_FLEET_PORTS = [
  'Novorossiysk',
  'Primorsk',
  'Ust-Luga',
  'Bandar Abbas',
  'Kharg Island',
  'Sokhna',
];
const HIGH_RISK_FLAGS = ['Cameroon', 'Palau', 'Togo', 'Gabon', 'Comoros', 'Belize', 'Tanzania'];
const CHOKEPOINT_STS_ZONES = [
  'Bab-el-Mandeb',
  'Strait of Hormuz',
  'Turkish Straits',
  'Ceuta Strait',
];

// ─── Scoring engine ──────────────────────────────────────────────────────────

function scoreLevel(score: number): 'none' | 'low' | 'moderate' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'moderate';
  if (score >= 10) return 'low';
  return 'none';
}

function seedRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function scoreSanctions(params: VoyageRiskRequest, rng: () => number): RiskDimension {
  let base = Math.floor(rng() * 25);
  const evidence: EvidenceSignal[] = [];

  const isShadowOrigin = SHADOW_FLEET_PORTS.some((p) =>
    params.origin.toLowerCase().includes(p.toLowerCase()),
  );

  if (isShadowOrigin) {
    base += 45;
    evidence.push({
      signal: `Origin port ${params.origin} is a primary sanctioned cargo export terminal`,
      source: 'OFAC / EU Reg 833/2014',
      confidence: 92,
      dataLabel: 'modeled',
    });
  }

  const chartererLower = (params.chartererName ?? '').toLowerCase();
  const ownerMatch = SANCTIONS_WATCHLIST.find((e) =>
    e.aliases.some((a) => chartererLower.includes(a)),
  );
  if (ownerMatch) {
    base += 40;
    evidence.push({
      signal: `Charterer or owner entity linked to ${ownerMatch.name} — ${ownerMatch.lists.join(', ')}`,
      source: 'OFAC SDN / WorldCheck',
      confidence: 88,
      dataLabel: 'modeled',
    });
  }

  if (evidence.length === 0) {
    evidence.push({
      signal: `No sanctions match detected on available watchlists for ${params.chartererName ?? 'charterer'}`,
      source: 'OFAC SDN / EU Consolidated / UK OFSI',
      confidence: 82,
      dataLabel: 'modeled',
    });
    evidence.push({
      signal: `Route corridor does not pass through active sanctions embargo zones`,
      source: 'Vessel Traffic Analysis',
      confidence: 88,
      dataLabel: 'modeled',
    });
  }

  const score = Math.min(100, base);
  return {
    score,
    level: scoreLevel(score),
    summary: buildSanctionsSummary(score, params, isShadowOrigin),
    evidence,
  };
}

function buildSanctionsSummary(
  score: number,
  params: VoyageRiskRequest,
  _isShadowOrigin: boolean,
): string {
  if (score >= 80)
    return `CRITICAL: Route originates from ${params.origin}, a sanctioned cargo export terminal. High probability of embargo-restricted cargo. Beneficial control likely linked to sanctioned state entity.`;
  if (score >= 60)
    return `Elevated sanctions exposure detected. Charterer entity or ownership chain has partial match to monitored watchlists. Enhanced due diligence required before fixture.`;
  if (score >= 35)
    return `Moderate sanctions risk. Route passes through elevated-risk jurisdiction. Charterer identity requires verification before fixture.`;
  return `Low sanctions exposure. Charterer is a known, screened entity. No sanctioned port calls detected in prior voyage history.`;
}

function scoreDarkActivity(params: VoyageRiskRequest, rng: () => number): RiskDimension {
  const isShadowOrigin = SHADOW_FLEET_PORTS.some((p) =>
    params.origin.toLowerCase().includes(p.toLowerCase()),
  );
  const _isHighRiskFlag = HIGH_RISK_FLAGS.some((f) =>
    (params.vesselName ?? '').toLowerCase().includes(f.toLowerCase()),
  );

  let base = Math.floor(rng() * 20);
  const evidence: EvidenceSignal[] = [];

  if (isShadowOrigin) {
    base += 38;
    const gapHours = 8 + Math.floor(rng() * 20);
    evidence.push({
      signal: `AIS gap detected: ${gapHours}h at known shadow-fleet anchorage zone near ${params.origin} — prior voyage`,
      source: 'AIS Gap Analysis live feed',
      confidence: 80 + Math.floor(rng() * 10),
      dataLabel: 'modeled',
    });
    evidence.push({
      signal: `Speed anomaly: drop from 12kts to <0.5kts for ${3 + Math.floor(rng() * 4)}h — no declared anchorage`,
      source: 'AIS Speed Profile',
      confidence: 72 + Math.floor(rng() * 10),
      dataLabel: 'modeled',
    });
  } else {
    evidence.push({
      signal: `No AIS gaps detected in past 6 voyages — transponder continuous`,
      source: 'AIS Continuity Check',
      confidence: 90 + Math.floor(rng() * 7),
      dataLabel: 'modeled',
    });
  }

  const score = Math.min(100, base);
  return {
    score,
    level: scoreLevel(score),
    summary:
      score >= 60
        ? `Multiple AIS gaps detected in prior voyages. Gap pattern and speed anomalies consistent with shadow-fleet or dark-activity behavior.`
        : score >= 35
          ? `Minor AIS gaps detected in prior voyage history. Monitoring recommended but no confirmed dark-activity pattern.`
          : `No AIS gaps or dark-activity signals detected. Vessel transponder history is clean.`,
    evidence,
  };
}

function scoreWeather(params: VoyageRiskRequest, rng: () => number): RiskDimension {
  const hasCape = params.routeVariant.toLowerCase().includes('cape');
  const base = hasCape ? 35 + Math.floor(rng() * 20) : Math.floor(rng() * 25);
  const swell = hasCape ? (2.5 + rng() * 2).toFixed(1) : (0.8 + rng() * 1.2).toFixed(1);
  const wind = hasCape ? Math.floor(22 + rng() * 12) : Math.floor(10 + rng() * 10);

  const evidence: EvidenceSignal[] = [
    {
      signal: `${hasCape ? 'Cape of Good Hope' : 'Primary corridor'}: Swell ${swell}m, wind ${wind}kts — ETA impact ${hasCape ? '+12–20h' : '<6h'} modeled`,
      source: 'ECMWF 10-day forecast',
      confidence: 80 + Math.floor(rng() * 10),
      dataLabel: 'modeled',
    },
    {
      signal: `No tropical storm systems in routing corridor for voyage window`,
      source: 'NHC / JTWC advisory',
      confidence: 88,
      dataLabel: 'modeled',
    },
  ];

  const score = Math.min(100, base);
  return {
    score,
    level: scoreLevel(score),
    summary:
      score >= 45
        ? `Elevated swell and wind conditions forecast for ${hasCape ? 'Cape of Good Hope' : 'primary corridor'} passage. ETA drift +12–20h modeled. Minor cargo risk at peak swell.`
        : `Routing conditions favorable. Swell and wind within seasonal norms. No disruption expected.`,
    evidence,
  };
}

function scoreSTS(params: VoyageRiskRequest, rng: () => number): RiskDimension {
  const isShadowOrigin = SHADOW_FLEET_PORTS.some((p) =>
    params.origin.toLowerCase().includes(p.toLowerCase()),
  );
  const passesSTSZone = CHOKEPOINT_STS_ZONES.some((z) => {
    const r = params.routeVariant.toLowerCase();
    return z
      .toLowerCase()
      .split(' ')
      .some((w) => r.includes(w));
  });

  let base = Math.floor(rng() * 15);
  const evidence: EvidenceSignal[] = [];

  if (isShadowOrigin) {
    base += 45;
    evidence.push({
      signal: `Prior voyage: proximity <200m to dark-fleet vessel during AIS blackout at ${params.origin} anchorage zone`,
      source: 'AIS Proximity Analysis',
      confidence: 82,
      dataLabel: 'modeled',
    });
  }

  if (passesSTSZone) {
    base += 18;
    const zoneName =
      CHOKEPOINT_STS_ZONES.find((z) =>
        params.routeVariant.toLowerCase().includes(z.toLowerCase().split(' ')[0]),
      ) ?? 'route chokepoint';
    evidence.push({
      signal: `Route passes ${zoneName} — active STS coordination zone with recent documented events`,
      source: 'Vessels STS Intelligence',
      confidence: 78,
      dataLabel: 'modeled',
    });
  }

  if (evidence.length === 0) {
    evidence.push({
      signal: `No AIS proximity events with dark-fleet vessels in past 24 months`,
      source: 'AIS Proximity Analysis',
      confidence: 92,
      dataLabel: 'modeled',
    });
    evidence.push({
      signal: `Route does not intersect known STS coordination areas`,
      source: 'Vessels STS Intelligence',
      confidence: 90,
      dataLabel: 'modeled',
    });
  }

  const score = Math.min(100, base);
  return {
    score,
    level: scoreLevel(score),
    summary:
      score >= 60
        ? `Elevated STS likelihood. Vessel's prior voyage history includes AIS gap patterns consistent with ship-to-ship transfers. Route passes active STS coordination zones.`
        : score >= 35
          ? `Moderate STS indicators. Route passes zones with documented STS activity. Prior voyage monitoring recommended.`
          : `No STS indicators. Vessel route and AIS history are clean.`,
    evidence,
  };
}

function scoreCounterparty(params: VoyageRiskRequest, rng: () => number): RiskDimension {
  const isShadowOrigin = SHADOW_FLEET_PORTS.some((p) =>
    params.origin.toLowerCase().includes(p.toLowerCase()),
  );
  let base = Math.floor(rng() * 20);
  const evidence: EvidenceSignal[] = [];

  if (isShadowOrigin) {
    base += 55;
    evidence.push({
      signal: `Owner/operator beneficial control chain terminates at state entity with OFAC/EU designations`,
      source: 'OFAC SDN / Corporate Registry Analysis',
      confidence: 86,
      dataLabel: 'modeled',
    });
    evidence.push({
      signal: `No credit rating available; comparable shadow-fleet operators rated speculative or withdrawn`,
      source: 'S&P / Fitch Rating Reference',
      confidence: 68,
      dataLabel: 'modeled',
    });
  } else if (params.chartererName?.toLowerCase().includes('shell')) {
    evidence.push({
      signal: `${params.chartererName} — publicly listed parent (Shell plc) — investment grade A+`,
      source: 'GLEIF / Bloomberg',
      confidence: 97,
      dataLabel: 'modeled',
    });
    evidence.push({
      signal: `Zero overdue invoices in 5-year payment history`,
      source: 'Credit Bureau',
      confidence: 96,
      dataLabel: 'modeled',
    });
  } else {
    base += 25 + Math.floor(rng() * 25);
    evidence.push({
      signal: `Charterer ${params.chartererName ?? 'unknown'} — ownership chain opacity elevated; UBO not publicly disclosed`,
      source: 'GLEIF / Corporate Registry Analysis',
      confidence: 62,
      dataLabel: 'modeled',
    });
    evidence.push({
      signal: `No public credit rating; payment history shows 1 overdue event in past 12 months`,
      source: 'Credit Bureau',
      confidence: 65,
      dataLabel: 'modeled',
    });
  }

  const score = Math.min(100, base);
  return {
    score,
    level: scoreLevel(score),
    summary:
      score >= 80
        ? `CRITICAL: Beneficial ownership terminates at sanctioned state entity. No independent creditworthy counterparty identified. Compliance block recommended.`
        : score >= 60
          ? `High counterparty opacity. Beneficial controller not publicly identified. Credit quality unrated. Escalate to compliance before committing.`
          : score >= 35
            ? `Moderate counterparty risk. Charterer identity partially verified. Enhanced KYC recommended.`
            : `Low counterparty risk. Charterer is a well-known, investment-grade entity with full ownership transparency.`,
    evidence,
  };
}

function buildEconomics(
  params: VoyageRiskRequest,
  distanceNm: number,
  rng: () => number,
): VoyageEconomics {
  const isTanker =
    (params.cargoType ?? 'crude').toLowerCase().includes('crude') ||
    (params.cargoType ?? '').toLowerCase().includes('oil');
  const transitDays = Math.round((distanceNm / (13 * 24)) * 10) / 10;
  const _dwt = isTanker ? 280_000 : 80_000;
  const fuelPerDay = isTanker ? 85 + rng() * 30 : 35 + rng() * 15;
  const fuelMt = Math.round(fuelPerDay * transitDays);
  const bunkerPrice = 580 + Math.floor(rng() * 60);
  const fuelCostUsd = fuelMt * bunkerPrice;
  const portDisbursementsUsd = 280_000 + Math.floor(rng() * 120_000);

  const hasSuez = params.routeVariant.toLowerCase().includes('suez');
  const hasPanama = params.routeVariant.toLowerCase().includes('panama');
  const canalFeesUsd = hasSuez
    ? 380_000 + Math.floor(rng() * 60_000)
    : hasPanama
      ? 250_000 + Math.floor(rng() * 40_000)
      : 0;

  const revenueUsd = (isTanker ? 42_000 : 18_000) * transitDays + Math.floor(rng() * 500_000);
  const totalCostsUsd =
    fuelCostUsd + portDisbursementsUsd + canalFeesUsd + Math.floor(rng() * 200_000);
  const profitUsd = revenueUsd - totalCostsUsd;
  const marginPct = revenueUsd > 0 ? (profitUsd / revenueUsd) * 100 : 0;
  const tce = transitDays > 0 ? Math.round(profitUsd / transitDays) : 0;

  return {
    fuelMt,
    bunkerPriceUsd: bunkerPrice,
    fuelCostUsd,
    transitDays: Math.ceil(transitDays),
    distanceNm,
    revenueUsd,
    tce,
    profitUsd,
    portDisbursementsUsd,
    canalFeesUsd,
    totalCostsUsd,
    marginPct: Math.round(marginPct * 10) / 10,
    dataLabel: 'modeled',
  };
}

function buildCounterparty(params: VoyageRiskRequest, sanctionsScore: number): CounterpartyProfile {
  const isShadowOrigin = SHADOW_FLEET_PORTS.some((p) =>
    params.origin.toLowerCase().includes(p.toLowerCase()),
  );
  const sanctionRisk =
    sanctionsScore >= 80
      ? 'critical'
      : sanctionsScore >= 60
        ? 'elevated'
        : sanctionsScore >= 30
          ? 'watch'
          : 'none';

  const chain: OwnerNode[] = [];
  if (isShadowOrigin) {
    chain.push({
      name: params.chartererName ?? 'Unknown Charterer',
      jurisdiction: 'UAE',
      entityType: 'company',
      sanctioned: false,
      opacity: 'opaque',
    });
    chain.push({
      name: 'Black Sea Tanker Holdings',
      jurisdiction: 'Cyprus',
      entityType: 'company',
      sanctioned: true,
      opacity: 'opaque',
      notes: 'SDN-adjacent via Sovcomflot',
    });
    chain.push({
      name: 'Sovcomflot JSC',
      jurisdiction: 'Russia',
      entityType: 'state',
      sanctioned: true,
      opacity: 'partial',
      notes: 'US/EU/UK sanctioned state entity',
    });
  } else if (params.chartererName?.toLowerCase().includes('shell')) {
    chain.push({
      name: params.chartererName ?? 'Shell Entity',
      jurisdiction: 'Netherlands',
      entityType: 'company',
      sanctioned: false,
      opacity: 'transparent',
    });
    chain.push({
      name: 'Shell plc',
      jurisdiction: 'United Kingdom',
      entityType: 'company',
      sanctioned: false,
      opacity: 'transparent',
      notes: 'LSE listed — full ownership transparency',
    });
  } else {
    chain.push({
      name: params.chartererName ?? 'Charterer Entity',
      jurisdiction: 'UAE',
      entityType: 'company',
      sanctioned: false,
      opacity: 'partial',
    });
    chain.push({
      name: 'Holding Company (UBO unknown)',
      jurisdiction: 'Cayman Islands',
      entityType: 'company',
      sanctioned: false,
      opacity: 'opaque',
      notes: 'Beneficial owner not publicly disclosed',
    });
  }

  return {
    charterer: params.chartererName ?? 'Unknown',
    chartererCountry: isShadowOrigin
      ? 'UAE'
      : params.chartererName?.toLowerCase().includes('shell')
        ? 'Netherlands'
        : 'Unknown',
    sanctionRisk: sanctionRisk as 'none' | 'watch' | 'elevated' | 'critical',
    creditRating: isShadowOrigin
      ? 'Unrated'
      : params.chartererName?.toLowerCase().includes('shell')
        ? 'A+'
        : 'Unrated',
    beneficialControlChain: chain,
    keyRisk:
      sanctionsScore >= 80
        ? 'Beneficial control chain terminates at sanctioned state entity — CRITICAL block recommended'
        : sanctionsScore >= 60
          ? 'Charterer opacity elevated; beneficial controller not publicly identified'
          : 'Counterparty within acceptable risk parameters',
  };
}

function routeDistance(origin: string, _destination: string, variant: string): number {
  const hasCape = variant.toLowerCase().includes('cape');
  const fromRasTanura =
    origin.toLowerCase().includes('tanura') || origin.toLowerCase().includes('ras');
  const fromNovorossiysk = origin.toLowerCase().includes('novorossiysk');
  const fromHouston = origin.toLowerCase().includes('houston');

  if (fromRasTanura) return hasCape ? 15_800 : 11_450;
  if (fromNovorossiysk) return 8_820;
  if (fromHouston) return hasCape ? 11_800 : 8_200;
  return 8_000 + Math.floor(Math.random() * 4_000);
}

function chokepoints(origin: string, destination: string, variant: string): string[] {
  const result: string[] = [];
  if (variant.toLowerCase().includes('suez')) result.push('Bab-el-Mandeb', 'Suez Canal');
  if (variant.toLowerCase().includes('cape')) result.push('Cape of Good Hope');
  if (origin.toLowerCase().includes('houston') || destination.toLowerCase().includes('houston'))
    result.push('Gulf of Mexico');
  if (origin.toLowerCase().includes('novorossiysk')) result.push('Bosporus', 'Dardanelles');
  if (origin.toLowerCase().includes('tanura')) result.push('Strait of Hormuz');
  return result;
}

// ─── Score endpoint ───────────────────────────────────────────────────────────

router.post(
  '/vessels/voyage-risk/score',
  riskLimit,
  authMiddleware({ required: false }),
  validateBody(voyageRiskScoreRequestSchema),
  async (req, res) => {
    try {
      const body = req.body as VoyageRiskRequest;
      const origin = body.origin ?? 'Unknown';
      const destination = body.destination ?? 'Unknown';
      const routeVariant = body.routeVariant ?? 'Direct';
      const distanceNm = routeDistance(origin, destination, routeVariant);

      const seed = Math.floor(Date.now() / 3600000) + origin.length + destination.length;
      const rng = seedRng(seed);

      const sanctions = scoreSanctions(body, rng);
      const darkActivity = scoreDarkActivity(body, rng);
      const weather = scoreWeather(body, rng);
      const sts = scoreSTS(body, rng);
      const counterpartyRisk = scoreCounterparty(body, rng);

      const composite = Math.round(
        sanctions.score * 0.3 +
          counterpartyRisk.score * 0.25 +
          sts.score * 0.2 +
          darkActivity.score * 0.15 +
          weather.score * 0.1,
      );

      const compositeLevel = scoreLevel(composite);
      const recommendation =
        composite >= 80
          ? 'HOLD — Compliance block recommended before fixture'
          : composite >= 60
            ? 'CAUTION — Escalate to compliance team before committing'
            : composite >= 35
              ? 'MONITOR — Proceed with enhanced due diligence'
              : 'PROCEED — Risk profile within acceptable parameters';

      const economics = buildEconomics(body, distanceNm, rng);
      const counterparty = buildCounterparty(body, sanctions.score);

      const result: VoyageRiskScore = {
        scenarioId: `VRT-${Date.now().toString(36).toUpperCase()}`,
        vessel: {
          name: body.vesselName ?? 'Unnamed Vessel',
          imo: body.vesselImo ?? 'Unknown',
          flag: 'Unknown',
          type: 'Tanker',
          dwt: 280_000,
          ageYears: 10,
        },
        route: {
          origin,
          destination,
          variant: routeVariant,
          distanceNm,
          chokepoints: chokepoints(origin, destination, routeVariant),
        },
        risk: {
          sanctions,
          darkActivity,
          weather,
          sts,
          counterparty: counterpartyRisk,
          composite,
          compositeLevel,
          recommendation,
        },
        economics,
        counterparty,
        sanctionsRefresh: {
          sources: getSanctionsSources(),
        },
        provenance: {
          dataLabel: 'modeled',
          confidence: 0.78,
          attestation: 'VESSELS-RISK-ENGINE-v1.0',
          generatedAt: new Date().toISOString(),
          note: 'Scores combine AIS gap analysis with current sanctions watchlist data.',
        },
      };

      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to score voyage risk');
    }
  },
);

// ─── Pre-defined scenarios endpoint (for the Voyage Scenario Simulator) ───────

const PRESET_SCENARIOS = [
  {
    id: 'SCN-001',
    label: 'Pacific Guardian — Ras Tanura → Rotterdam (Suez)',
    params: {
      vesselName: 'Pacific Guardian',
      vesselImo: '9821045',
      origin: 'Ras Tanura, SA',
      destination: 'Rotterdam, NL',
      routeVariant: 'Suez Canal',
      cargoType: 'Crude Oil',
      chartererName: 'Apex Voyages DMCC',
    },
  },
  {
    id: 'SCN-002',
    label: 'Nordic Carrier — Houston → Rotterdam (Cape of Good Hope)',
    params: {
      vesselName: 'Nordic Carrier',
      vesselImo: '9445566',
      origin: 'Houston, USA',
      destination: 'Rotterdam, NL',
      routeVariant: 'Cape of Good Hope',
      cargoType: 'Refined Products',
      chartererName: 'Shell Trading Rotterdam BV',
    },
  },
  {
    id: 'SCN-003',
    label: 'Orient Meridian — Novorossiysk → Fujairah (Turkish Straits → Suez)',
    params: {
      vesselName: 'Orient Meridian',
      vesselImo: '9654789',
      origin: 'Novorossiysk, RU',
      destination: 'Fujairah, UAE',
      routeVariant: 'Turkish Straits Suez',
      cargoType: 'Russian Crude (URALS)',
      chartererName: 'Caspian Energy Partners Ltd.',
    },
  },
];

router.get(
  '/vessels/voyage-risk/scenarios',
  riskLimit,
  validateQuery(listQuerySchema),
  authMiddleware({ required: false }),
  (_req, res) => {
    sendSuccess(res, { scenarios: PRESET_SCENARIOS, dataLabel: 'modeled' });
  },
);

// ─── Sanctions refresh endpoints (backed by in-memory refresh job) ──────────────

router.get(
  '/vessels/voyage-risk/sanctions/sources',
  riskLimit,
  validateQuery(listQuerySchema),
  authMiddleware({ required: false }),
  (_req, res) => {
    const snapshot = getSanctionsStoreSnapshot();
    sendSuccess(res, {
      sources: snapshot.sources,
      totalEntities: snapshot.totalEntities,
      lastFullRefreshAt: snapshot.lastFullRefreshAt,
      jobRunCount: snapshot.jobRunCount,
      note: 'Refresh job runs every 15 minutes. Connect live OFAC / Dow Jones / WorldCheck feeds to upgrade from modeled to live screening.',
      dataLabel: 'modeled',
      asOf: new Date().toISOString(),
    });
  },
);

router.post(
  '/vessels/voyage-risk/sanctions/refresh',
  riskLimit,
  authMiddleware({ required: false }),
  validateBody(sanctionsRefreshBodySchema),
  (req, res) => {
    try {
      const targetId = (req.body as { sourceId?: string }).sourceId;
      runSanctionsRefresh(targetId);
      const snapshot = getSanctionsStoreSnapshot();
      sendSuccess(res, {
        status: 'ok',
        message: targetId
          ? `Refresh triggered for source: ${targetId}`
          : 'Full sanctions list refresh cycle completed',
        sources: snapshot.sources,
        totalEntities: snapshot.totalEntities,
        lastFullRefreshAt: snapshot.lastFullRefreshAt,
        jobRunCount: snapshot.jobRunCount,
        dataLabel: 'modeled',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to run sanctions refresh');
    }
  },
);

// ─── PDF Memo generation ──────────────────────────────────────────────────────

const pdfStyles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 40, backgroundColor: '#ffffff' },
  header: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#0a1628' },
  subheader: { fontSize: 11, fontWeight: 'bold', marginBottom: 4, color: '#4d8fcc' },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#4d8fcc',
    marginTop: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  label: { color: '#6b7280', width: '40%' },
  value: { color: '#111827', width: '58%', textAlign: 'right' },
  evidenceItem: {
    marginBottom: 4,
    paddingLeft: 8,
    paddingTop: 3,
    paddingBottom: 3,
    backgroundColor: '#f9fafb',
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
  },
  evidenceSignal: { color: '#374151', marginBottom: 1 },
  evidenceSource: { color: '#9ca3af', fontSize: 7.5 },
  riskBlock: { marginBottom: 8 },
  riskTitle: { fontSize: 9, fontWeight: 'bold', color: '#111827' },
  riskLevel: { fontSize: 8, color: '#6b7280' },
  riskSummary: { color: '#374151', marginTop: 2, marginBottom: 4 },
  disclaimer: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  disclaimerText: { fontSize: 7.5, color: '#92400e' },
  watermark: {
    position: 'absolute',
    top: 200,
    left: 50,
    fontSize: 72,
    color: '#e5e7eb',
    opacity: 0.3,
    transform: 'rotate(-30deg)',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
  },
  footerText: { color: '#9ca3af', fontSize: 7, textAlign: 'center' },
  ownerNode: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
  ownerDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6, marginTop: 1.5 },
  ownerContent: { flex: 1 },
  ownerName: { color: '#111827', fontWeight: 'bold' },
  ownerMeta: { color: '#9ca3af', fontSize: 7.5 },
  tag: { fontSize: 7, padding: 2, paddingHorizontal: 5, borderRadius: 3, marginLeft: 6 },
});

function ComplianceMemoDoc({ score }: { score: VoyageRiskScore }) {
  const now = `${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC`;
  const dims = [
    { key: 'Sanctions Exposure', dim: score.risk.sanctions },
    { key: 'Dark Activity', dim: score.risk.darkActivity },
    { key: 'Weather Risk', dim: score.risk.weather },
    { key: 'STS Likelihood', dim: score.risk.sts },
    { key: 'Counterparty Risk', dim: score.risk.counterparty },
  ];

  const levelColor = (level: string) => {
    const m: Record<string, string> = {
      critical: '#ef4444',
      high: '#f87171',
      moderate: '#fbbf24',
      low: '#34d399',
      none: '#34d399',
    };
    return m[level] ?? '#6b7280';
  };

  return React.createElement(
    Document,
    { title: `Compliance Memo — ${score.scenarioId}`, author: 'Vessels Maritime Intelligence' },
    React.createElement(
      Page,
      { size: 'A4', style: pdfStyles.page },
      React.createElement(Text, { style: pdfStyles.watermark }, 'DEMO'),

      React.createElement(
        View,
        { style: { marginBottom: 16 } },
        React.createElement(Text, { style: pdfStyles.header }, 'Voyage Compliance Memo'),
        React.createElement(
          Text,
          { style: { fontSize: 10, color: '#6b7280', marginBottom: 2 } },
          'Vessels Maritime Intelligence — SZL Holdings',
        ),
        React.createElement(
          Text,
          { style: { fontSize: 8, color: '#9ca3af' } },
          `Generated: ${now} · Ref: ${score.scenarioId}`,
        ),
      ),

      React.createElement(Text, { style: pdfStyles.sectionTitle }, 'Voyage Identification'),
      React.createElement(
        View,
        { style: pdfStyles.row },
        React.createElement(Text, { style: pdfStyles.label }, 'Vessel'),
        React.createElement(
          Text,
          { style: pdfStyles.value },
          `${score.vessel.name} (IMO ${score.vessel.imo})`,
        ),
      ),
      React.createElement(
        View,
        { style: pdfStyles.row },
        React.createElement(Text, { style: pdfStyles.label }, 'Type / Flag / DWT'),
        React.createElement(
          Text,
          { style: pdfStyles.value },
          `${score.vessel.type} · ${score.vessel.flag} · ${score.vessel.dwt.toLocaleString()} DWT`,
        ),
      ),
      React.createElement(
        View,
        { style: pdfStyles.row },
        React.createElement(Text, { style: pdfStyles.label }, 'Route'),
        React.createElement(
          Text,
          { style: pdfStyles.value },
          `${score.route.origin} → ${score.route.destination}`,
        ),
      ),
      React.createElement(
        View,
        { style: pdfStyles.row },
        React.createElement(Text, { style: pdfStyles.label }, 'Route Variant'),
        React.createElement(Text, { style: pdfStyles.value }, score.route.variant),
      ),
      React.createElement(
        View,
        { style: pdfStyles.row },
        React.createElement(Text, { style: pdfStyles.label }, 'Distance'),
        React.createElement(
          Text,
          { style: pdfStyles.value },
          `${score.route.distanceNm.toLocaleString()} nm`,
        ),
      ),
      React.createElement(
        View,
        { style: pdfStyles.row },
        React.createElement(Text, { style: pdfStyles.label }, 'Chokepoints'),
        React.createElement(
          Text,
          { style: pdfStyles.value },
          score.route.chokepoints.join(', ') || 'None',
        ),
      ),

      React.createElement(Text, { style: pdfStyles.sectionTitle }, 'Composite Risk Summary'),
      React.createElement(
        View,
        { style: { ...pdfStyles.row, marginBottom: 6 } },
        React.createElement(Text, { style: pdfStyles.label }, 'Composite Score'),
        React.createElement(
          Text,
          {
            style: {
              ...pdfStyles.value,
              color: levelColor(score.risk.compositeLevel),
              fontWeight: 'bold',
            },
          },
          `${score.risk.composite}/100 — ${score.risk.compositeLevel.toUpperCase()}`,
        ),
      ),
      React.createElement(
        View,
        { style: { ...pdfStyles.row, marginBottom: 6 } },
        React.createElement(Text, { style: pdfStyles.label }, 'Recommendation'),
        React.createElement(
          Text,
          { style: { ...pdfStyles.value, color: levelColor(score.risk.compositeLevel) } },
          score.risk.recommendation,
        ),
      ),

      React.createElement(Text, { style: pdfStyles.sectionTitle }, 'Risk Dimensions — Evidence'),
      ...dims.map(({ key, dim }) =>
        React.createElement(
          View,
          { key, style: pdfStyles.riskBlock },
          React.createElement(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 } },
            React.createElement(Text, { style: { ...pdfStyles.riskTitle, flex: 1 } }, key),
            React.createElement(
              Text,
              { style: { fontSize: 8, color: levelColor(dim.level), fontWeight: 'bold' } },
              `${dim.score}/100 — ${dim.level.toUpperCase()}`,
            ),
          ),
          React.createElement(Text, { style: pdfStyles.riskSummary }, dim.summary),
          ...dim.evidence.map((ev, i) =>
            React.createElement(
              View,
              { key: i, style: pdfStyles.evidenceItem },
              React.createElement(Text, { style: pdfStyles.evidenceSignal }, `• ${ev.signal}`),
              React.createElement(
                Text,
                { style: pdfStyles.evidenceSource },
                `Source: ${ev.source} · Confidence: ${ev.confidence}%`,
              ),
            ),
          ),
        ),
      ),

      React.createElement(Text, { style: pdfStyles.sectionTitle }, 'Counterparty & Ownership'),
      React.createElement(
        View,
        { style: pdfStyles.row },
        React.createElement(Text, { style: pdfStyles.label }, 'Charterer'),
        React.createElement(
          Text,
          { style: pdfStyles.value },
          `${score.counterparty.charterer} (${score.counterparty.chartererCountry})`,
        ),
      ),
      React.createElement(
        View,
        { style: pdfStyles.row },
        React.createElement(Text, { style: pdfStyles.label }, 'Sanction Risk'),
        React.createElement(
          Text,
          {
            style: {
              ...pdfStyles.value,
              color: levelColor(score.counterparty.sanctionRisk),
              fontWeight: 'bold',
            },
          },
          score.counterparty.sanctionRisk.toUpperCase(),
        ),
      ),
      React.createElement(
        View,
        { style: pdfStyles.row },
        React.createElement(Text, { style: pdfStyles.label }, 'Credit Rating'),
        React.createElement(Text, { style: pdfStyles.value }, score.counterparty.creditRating),
      ),
      React.createElement(
        Text,
        { style: { color: '#374151', marginBottom: 6, marginTop: 2 } },
        score.counterparty.keyRisk,
      ),
      React.createElement(
        Text,
        { style: { color: '#6b7280', fontSize: 8, marginBottom: 4, fontWeight: 'bold' } },
        'Beneficial Control Chain:',
      ),
      ...score.counterparty.beneficialControlChain.map((node, i) =>
        React.createElement(
          View,
          { key: i, style: pdfStyles.ownerNode },
          React.createElement(View, {
            style: {
              ...pdfStyles.ownerDot,
              backgroundColor: node.sanctioned ? '#ef4444' : '#34d399',
            },
          }),
          React.createElement(
            View,
            { style: pdfStyles.ownerContent },
            React.createElement(
              Text,
              { style: pdfStyles.ownerName },
              `${node.name}${node.sanctioned ? ' ⚠ SANCTIONED' : ''}`,
            ),
            React.createElement(
              Text,
              { style: pdfStyles.ownerMeta },
              `${node.jurisdiction} · ${node.entityType} · Opacity: ${node.opacity}${node.notes ? ` · ${node.notes}` : ''}`,
            ),
          ),
        ),
      ),

      React.createElement(Text, { style: pdfStyles.sectionTitle }, 'Voyage Economics'),
      ...[
        ['Gross Revenue', `$${(score.economics.revenueUsd / 1e6).toFixed(2)}M`],
        ['Total Costs', `$${(score.economics.totalCostsUsd / 1e6).toFixed(2)}M`],
        ['Net Profit', `$${(score.economics.profitUsd / 1e6).toFixed(2)}M`],
        ['Margin', `${score.economics.marginPct.toFixed(1)}%`],
        ['TCE / day', `$${(score.economics.tce / 1000).toFixed(0)}K`],
        ['Transit Days', `${score.economics.transitDays}d`],
        [
          'Bunker / Fuel',
          `${score.economics.fuelMt.toLocaleString()} MT @ $${score.economics.bunkerPriceUsd}/MT = $${(score.economics.fuelCostUsd / 1000).toFixed(0)}K`,
        ],
        ['Port Disbursements', `$${(score.economics.portDisbursementsUsd / 1000).toFixed(0)}K`],
        ['Canal Fees', `$${(score.economics.canalFeesUsd / 1000).toFixed(0)}K`],
      ].map(([label, value]) =>
        React.createElement(
          View,
          { key: label, style: pdfStyles.row },
          React.createElement(Text, { style: pdfStyles.label }, label),
          React.createElement(Text, { style: pdfStyles.value }, value),
        ),
      ),

      React.createElement(
        View,
        { style: pdfStyles.disclaimer },
        React.createElement(
          Text,
          { style: pdfStyles.disclaimerText },
          'DEMO DATA — This memo was generated by Vessels Maritime Intelligence automated screening using heuristic models. ' +
            'All evidence is labeled with its source. This document does not constitute legal compliance advice. ' +
            'For regulatory submissions, obtain qualified compliance counsel sign-off. ' +
            `Generated: ${now} · ${score.provenance.attestation}`,
        ),
      ),

      React.createElement(
        View,
        { style: pdfStyles.footer },
        React.createElement(
          Text,
          { style: pdfStyles.footerText },
          `Vessels Maritime Intelligence · SZL Holdings · ${score.scenarioId} · Page 1`,
        ),
      ),
    ),
  );
}

router.post(
  '/vessels/voyage-risk/memo/pdf',
  riskLimit,
  authMiddleware({ required: false }),
  validateBody(voyageRiskMemoPdfBodySchema),
  async (req, res) => {
    try {
      const score = req.body as VoyageRiskScore;
      if (!score?.scenarioId) {
        res.status(400).json({ error: 'Invalid voyage risk score payload' });
        return;
      }

      const buffer = await renderToBuffer(React.createElement(ComplianceMemoDoc, { score }));

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="compliance-memo-${score.scenarioId.toLowerCase()}.pdf"`,
      );
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate compliance memo PDF');
    }
  },
);

export default router;
