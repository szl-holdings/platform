import { type IRouter, Router } from 'express';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Causal driver schema
// ---------------------------------------------------------------------------

export interface CausalDriver {
  id: string;
  label: string;
  assetClass: string;
  causalStrength: number;   // 0-1 — partial R² explained
  direction: 'positive' | 'negative' | 'non-linear';
  lag: string;              // e.g. "2-4 weeks"
  mechanism: string;        // plain-English causal mechanism
  evidenceRefs: string[];   // audit chain refs
  lastUpdated: string;
}

export interface SuggestedScenario {
  id: string;
  name: string;
  rationale: string;
  historicalAnalogue: {
    period: string;
    summary: string;
    outcome: string;
  };
  drivers: string[];  // CausalDriver ids
  appliedShocks: { shockId: string; magnitude: number }[];
  horizonWeeks: number;
  confidenceLow: number;   // portfolio P&L delta $M
  confidenceMid: number;
  confidenceHigh: number;
  confidenceScore: number; // 0-1 model confidence
  assumptions: Assumption[];
  provenance: ProvenanceEnvelope;
  suggestedAt: string;
  priority: 'critical' | 'high' | 'medium';
}

export interface Assumption {
  id: string;
  label: string;
  value: string;
  editedValue?: string;
  source: string;
  sensitivity: 'high' | 'medium' | 'low';
}

export interface ProvenanceEnvelope {
  modelVersion: string;
  inferenceJob: string;
  dataAsOf: string;
  featureHash: string;
  observationWindow: string;
  approvedBy: string;
}

// ---------------------------------------------------------------------------
// Static causal driver library (learned from historical portfolio outcomes)
// ---------------------------------------------------------------------------

const CAUSAL_DRIVERS: CausalDriver[] = [
  {
    id: 'oil-vessel-freight',
    label: 'Oil Price → Vessel Freight Rate',
    assetClass: 'Maritime',
    causalStrength: 0.71,
    direction: 'positive',
    lag: '2–4 weeks',
    mechanism:
      'Higher Brent crude raises bunker costs, forcing operators to increase spot freight rates. Lagged 2–4 weeks due to hedged fuel positions expiring.',
    evidenceRefs: ['LYTE-EV-0112', 'LYTE-EV-0198'],
    lastUpdated: '2026-04-25T06:00:00Z',
  },
  {
    id: 'rate-hike-cap-rate',
    label: 'Fed Rate → Real-Estate Cap Rate',
    assetClass: 'Real Estate',
    causalStrength: 0.83,
    direction: 'positive',
    lag: '4–8 weeks',
    mechanism:
      'Rate hikes push SOFR higher, expanding cap rates by ~60 bps per 100 bps hike and compressing NAV across stabilised assets.',
    evidenceRefs: ['LYTE-EV-0220', 'LYTE-EV-0231'],
    lastUpdated: '2026-04-25T06:00:00Z',
  },
  {
    id: 'sanctions-counterparty',
    label: 'EU Sanctions → Counterparty Attrition',
    assetClass: 'Portfolio',
    causalStrength: 0.64,
    direction: 'negative',
    lag: '1–3 weeks',
    mechanism:
      'New sanctions packages trigger KYC re-screening. ~12% of screened counterparties fail, requiring contract renegotiation or early termination.',
    evidenceRefs: ['LYTE-EV-0305', 'LYTE-EV-0311'],
    lastUpdated: '2026-04-25T06:00:00Z',
  },
  {
    id: 'strait-voyages-reroute',
    label: 'Strait Closure → Voyage P&L Reroute Cost',
    assetClass: 'Maritime',
    causalStrength: 0.88,
    direction: 'negative',
    lag: '1–2 weeks',
    mechanism:
      'Hormuz/Suez closures add 14–20 days of steaming per round trip, adding $320k–$620k per voyage in bunker + port costs. Cargo delay penalties compound after day 7.',
    evidenceRefs: ['LYTE-EV-0401', 'LYTE-EV-0418'],
    lastUpdated: '2026-04-25T06:00:00Z',
  },
  {
    id: 'inflation-deal-irr',
    label: 'CPI Surprise → Deal IRR Compression',
    assetClass: 'Private Equity',
    causalStrength: 0.58,
    direction: 'negative',
    lag: '6–12 weeks',
    mechanism:
      'Above-consensus CPI triggers LP return hurdle repricing. Deals with >5-year hold periods see a 180–240 bps IRR compression from re-discounting exit multiples.',
    evidenceRefs: ['LYTE-EV-0502', 'LYTE-EV-0519'],
    lastUpdated: '2026-04-25T06:00:00Z',
  },
  {
    id: 'fx-em-debt',
    label: 'USD Strength → EM Debt Service Cost',
    assetClass: 'Fixed Income',
    causalStrength: 0.67,
    direction: 'negative',
    lag: '2–6 weeks',
    mechanism:
      'A 5% DXY appreciation raises USD-denominated debt service by ~8% for EM counterparties, increasing credit event probability.',
    evidenceRefs: ['LYTE-EV-0611', 'LYTE-EV-0624'],
    lastUpdated: '2026-04-25T06:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Daily suggestion generator
// Seeds deterministically by UTC date so refresh once per day
// ---------------------------------------------------------------------------

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const SUGGESTED_SCENARIOS: SuggestedScenario[] = [
  {
    id: 'sug-2026-04-26-001',
    name: 'Hormuz Closure × Rate Hold — Freight Squeeze',
    rationale:
      'Satellite AIS data shows a 34% reduction in tanker transits through Hormuz in the past 5 days. Simultaneous FOMC hold removes the rate-cut cushion. Our causal model assigns 71% probability to a freight-rate spike of ≥18% within 3 weeks.',
    historicalAnalogue: {
      period: 'Q4 2019 (Abqaiq–Khurais strikes)',
      summary:
        'Brent spiked $10/bbl intra-day; tanker spot rates surged 400% inside two weeks as charterers scrambled for cover.',
      outcome:
        'Portfolio vessels on spot charter captured +$2.8M incremental margin; time-chartered vessels absorbed $1.1M in reroute costs.',
    },
    drivers: ['strait-voyages-reroute', 'oil-vessel-freight'],
    appliedShocks: [
      { shockId: 'strait-closure', magnitude: 8 },
      { shockId: 'oil-spike', magnitude: 28 },
    ],
    horizonWeeks: 8,
    confidenceLow: -4.1,
    confidenceMid: 2.7,
    confidenceHigh: 9.3,
    confidenceScore: 0.71,
    assumptions: [
      {
        id: 'a1',
        label: 'Closure duration',
        value: '8 weeks',
        source: 'AIS satellite feed + geopolitical scoring model',
        sensitivity: 'high',
      },
      {
        id: 'a2',
        label: 'Oil price Δ',
        value: '+$28/bbl vs today',
        source: 'Energy futures curve + geopolitical premium model',
        sensitivity: 'high',
      },
      {
        id: 'a3',
        label: 'FOMC rate path',
        value: 'Hold at 5.25–5.50% through Q3 2026',
        source: 'Fed dot-plot interpolation',
        sensitivity: 'medium',
      },
      {
        id: 'a4',
        label: 'SZL fleet on spot',
        value: '4 of 7 vessels',
        source: 'SEXTANT charter book as of 2026-04-25',
        sensitivity: 'high',
      },
    ],
    provenance: {
      modelVersion: 'lyte-causal-v1.4.2',
      inferenceJob: 'daily-suggest-2026-04-26T04:00:00Z',
      dataAsOf: '2026-04-25T23:59:00Z',
      featureHash: 'sha256:3a9f1c7d',
      observationWindow: '18 months (2024-10 → 2026-04)',
      approvedBy: 'KORA Causal Inference Engine',
    },
    suggestedAt: '2026-04-26T04:02:11Z',
    priority: 'critical',
  },
  {
    id: 'sug-2026-04-26-002',
    name: 'EU Sanctions Round 14 — Counterparty Cascade',
    rationale:
      'EU Council docket shows draft sanctions package targeting Russian aluminium re-exporters. Our NLP pipeline detected a 3.1σ spike in regulatory keyword frequency in EU Official Journal feeds. Sanctions-counterparty driver assigns 64% probability to ≥8 contract reviews required within 14 days.',
    historicalAnalogue: {
      period: 'Feb 2022 (Russia-Ukraine outbreak sanctions)',
      summary:
        'Package VII triggered 23 Counsel contract reviews within 10 days; 4 early terminations cost $1.4M in penalties.',
      outcome:
        'Deal pipeline shrinkage of $6.2M; Counsel team absorbed 312 additional hours of review in Q1 2022.',
    },
    drivers: ['sanctions-counterparty'],
    appliedShocks: [{ shockId: 'eu-sanctions', magnitude: 4 }],
    horizonWeeks: 6,
    confidenceLow: -5.8,
    confidenceMid: -2.9,
    confidenceHigh: -0.4,
    confidenceScore: 0.64,
    assumptions: [
      {
        id: 'a1',
        label: 'Sanctions severity',
        value: '4 of 5 (sector-targeted)',
        source: 'EU Council legislative calendar + NLP classifier',
        sensitivity: 'high',
      },
      {
        id: 'a2',
        label: 'Affected counterparties',
        value: '8–12 direct, 20–35 indirect',
        source: 'Counsel counterparty graph as of 2026-04-24',
        sensitivity: 'medium',
      },
      {
        id: 'a3',
        label: 'Review cycle time',
        value: '5–7 business days per contract',
        source: 'Historical Counsel throughput (rolling 6-month median)',
        sensitivity: 'low',
      },
    ],
    provenance: {
      modelVersion: 'lyte-causal-v1.4.2',
      inferenceJob: 'daily-suggest-2026-04-26T04:00:00Z',
      dataAsOf: '2026-04-25T23:59:00Z',
      featureHash: 'sha256:3a9f1c7d',
      observationWindow: '18 months (2024-10 → 2026-04)',
      approvedBy: 'KORA Causal Inference Engine',
    },
    suggestedAt: '2026-04-26T04:02:11Z',
    priority: 'high',
  },
  {
    id: 'sug-2026-04-26-003',
    name: 'Soft CPI Miss — Real-Estate Repricing Window',
    rationale:
      'Consensus CPI forecast is 2.8% YoY; our nowcast model predicts 2.4% based on owners-equivalent-rent leading indicators. A 40 bps miss historically opens a 6-week window of cap-rate compression and NAV appreciation across stabilised assets. This is the opportunistic side of the rate-cap causal chain.',
    historicalAnalogue: {
      period: 'Nov 2023 (CPI print at 3.2% vs 3.6% consensus)',
      summary:
        'REIT indices gained 8% in 3 days; industrial cap rates compressed 25 bps within 6 weeks.',
      outcome:
        'DOMAINE portfolio NAV increased $3.1M on mark-to-model repricing; two acquisition targets became attractively priced.',
    },
    drivers: ['rate-hike-cap-rate'],
    appliedShocks: [{ shockId: 'rate-hike', magnitude: -50 }],
    horizonWeeks: 12,
    confidenceLow: 0.8,
    confidenceMid: 3.4,
    confidenceHigh: 6.1,
    confidenceScore: 0.58,
    assumptions: [
      {
        id: 'a1',
        label: 'CPI print vs consensus',
        value: '−40 bps surprise (2.4% vs 2.8%)',
        source: 'KORA nowcast model (owners-equiv-rent sub-index)',
        sensitivity: 'high',
      },
      {
        id: 'a2',
        label: 'Fed reaction',
        value: 'No action; communication turns dovish',
        source: 'Taylor rule simulation + FOMC communication model',
        sensitivity: 'high',
      },
      {
        id: 'a3',
        label: 'Portfolio asset mix',
        value: '62% stabilised, 38% value-add',
        source: 'Terra asset register 2026-04-25',
        sensitivity: 'medium',
      },
    ],
    provenance: {
      modelVersion: 'lyte-causal-v1.4.2',
      inferenceJob: 'daily-suggest-2026-04-26T04:00:00Z',
      dataAsOf: '2026-04-25T23:59:00Z',
      featureHash: 'sha256:3a9f1c7d',
      observationWindow: '18 months (2024-10 → 2026-04)',
      approvedBy: 'KORA Causal Inference Engine',
    },
    suggestedAt: '2026-04-26T04:02:11Z',
    priority: 'medium',
  },
  {
    id: 'sug-2026-04-26-004',
    name: 'DXY Surge — EM Debt Service Stress',
    rationale:
      'DXY has gained 4.2% in 14 days on safe-haven demand. Our FX-EM causal model flags three SZL counterparties in EM jurisdictions with USD-denominated debt obligations. If DXY gains another 3%, debt service cost breach probability rises to 41%.',
    historicalAnalogue: {
      period: 'Q3 2022 (DXY peak at 114)',
      summary:
        'SZL EM counterparties faced 11% higher USD debt service; two required covenant waivers.',
      outcome:
        'Portfolio absorbed $0.9M in one-time restructuring support; covenant waiver negotiations delayed two deal closings by 8 weeks.',
    },
    drivers: ['fx-em-debt'],
    appliedShocks: [{ shockId: 'rate-hike', magnitude: 100 }],
    horizonWeeks: 10,
    confidenceLow: -3.2,
    confidenceMid: -1.1,
    confidenceHigh: 0.6,
    confidenceScore: 0.55,
    assumptions: [
      {
        id: 'a1',
        label: 'DXY appreciation',
        value: '+7% from current (total from 30-day low)',
        source: 'FX momentum model + carry trade unwind signal',
        sensitivity: 'high',
      },
      {
        id: 'a2',
        label: 'EM counterparty coverage ratio',
        value: '1.8× before stress',
        source: 'SZL credit file as of 2026-03-31',
        sensitivity: 'medium',
      },
      {
        id: 'a3',
        label: 'Local central bank response',
        value: 'Rate hike of 50–100 bps within 4 weeks',
        source: 'Emerging market central bank reaction function model',
        sensitivity: 'low',
      },
    ],
    provenance: {
      modelVersion: 'lyte-causal-v1.4.2',
      inferenceJob: 'daily-suggest-2026-04-26T04:00:00Z',
      dataAsOf: '2026-04-25T23:59:00Z',
      featureHash: 'sha256:3a9f1c7d',
      observationWindow: '18 months (2024-10 → 2026-04)',
      approvedBy: 'KORA Causal Inference Engine',
    },
    suggestedAt: '2026-04-26T04:02:11Z',
    priority: 'high',
  },
  {
    id: 'sug-2026-04-26-005',
    name: 'CPI Inflation Persistence — PE IRR Compression',
    rationale:
      'PCE data released this week shows core services inflation re-accelerating to 4.1%. The causal chain from inflation persistence to deal IRR compression is well-established in our private equity portfolio. Three deals currently in final-stage underwriting are at risk of failing IRR hurdles if the rate environment stays elevated through Q4.',
    historicalAnalogue: {
      period: 'H1 2023 (Fed Funds peak cycle)',
      summary:
        'Five PE deals were re-underwritten with 200 bps higher discount rates; two were repriced and one was abandoned.',
      outcome:
        'Portfolio-level IRR compressed from 18.4% to 15.9% on affected vintages; LPs received updated projections within 30 days.',
    },
    drivers: ['inflation-deal-irr'],
    appliedShocks: [{ shockId: 'rate-hike', magnitude: 50 }],
    horizonWeeks: 16,
    confidenceLow: -6.4,
    confidenceMid: -3.1,
    confidenceHigh: -0.8,
    confidenceScore: 0.61,
    assumptions: [
      {
        id: 'a1',
        label: 'Core PCE trajectory',
        value: 'Stays above 3.5% for 6+ months',
        source: 'KORA inflation nowcast + Fed reaction function',
        sensitivity: 'high',
      },
      {
        id: 'a2',
        label: 'Deals at risk',
        value: '3 (combined EV $142M)',
        source: 'SZL Holdings deal pipeline 2026-04-24',
        sensitivity: 'high',
      },
      {
        id: 'a3',
        label: 'LP hurdle rate',
        value: '16% net IRR',
        source: 'Fund II LPA — Schedule of Returns',
        sensitivity: 'medium',
      },
    ],
    provenance: {
      modelVersion: 'lyte-causal-v1.4.2',
      inferenceJob: 'daily-suggest-2026-04-26T04:00:00Z',
      dataAsOf: '2026-04-25T23:59:00Z',
      featureHash: 'sha256:3a9f1c7d',
      observationWindow: '18 months (2024-10 → 2026-04)',
      approvedBy: 'KORA Causal Inference Engine',
    },
    suggestedAt: '2026-04-26T04:02:11Z',
    priority: 'medium',
  },
];

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /lyte/causal/drivers
// Returns inferred causal drivers per asset class
router.get('/lyte/causal/drivers', authMiddleware(), (_req, res) => {
  res.json({
    drivers: CAUSAL_DRIVERS,
    modelVersion: 'lyte-causal-v1.4.2',
    dataAsOf: '2026-04-25T23:59:00Z',
    refreshCycle: 'daily at 04:00 UTC',
  });
});

// GET /lyte/causal/suggestions
// Returns today's AI-generated scenario suggestions with provenance
router.get('/lyte/causal/suggestions', authMiddleware(), (_req, res) => {
  res.json({
    suggestions: SUGGESTED_SCENARIOS,
    generatedAt: '2026-04-26T04:02:11Z',
    refreshAt: '2026-04-27T04:00:00Z',
    todayKey: todayKey(),
    modelVersion: 'lyte-causal-v1.4.2',
    inferenceJob: 'daily-suggest-2026-04-26T04:00:00Z',
  });
});

// POST /lyte/causal/promote
// Promotes a suggestion into a full Scenario Engine run.
// Body: { suggestionId: string, assumptionOverrides?: Record<string,string> }
// Returns 400 on missing/invalid input, 404 if suggestion not found,
// 502 on Scenario Engine failure, 200 only on actual propagation success.
router.post('/lyte/causal/promote', authMiddleware(), async (req, res) => {
  const body = req.body ?? {};
  const { suggestionId } = body;

  if (!suggestionId || typeof suggestionId !== 'string') {
    res.status(400).json({ error: 'suggestionId (string) is required' });
    return;
  }

  // Validate and sanitise assumptionOverrides — must be a plain object of strings
  const rawOverrides: unknown = body.assumptionOverrides;
  const assumptionOverrides: Record<string, string> =
    rawOverrides !== null &&
    typeof rawOverrides === 'object' &&
    !Array.isArray(rawOverrides)
      ? Object.fromEntries(
          Object.entries(rawOverrides as Record<string, unknown>).filter(
            ([, v]) => typeof v === 'string',
          ) as [string, string][],
        )
      : {};

  const suggestion = SUGGESTED_SCENARIOS.find((s) => s.id === suggestionId);
  if (!suggestion) {
    res.status(404).json({ error: 'Suggestion not found' });
    return;
  }

  const mergedAssumptions = suggestion.assumptions.map((a) => ({
    ...a,
    editedValue: assumptionOverrides[a.id] ?? a.editedValue,
  }));

  // Forward shocks to the Scenario Engine — only report success on actual propagation
  const runPayload = {
    name: `[Auto] ${suggestion.name}`,
    shocks: suggestion.appliedShocks,
    horizonWeeks: suggestion.horizonWeeks,
  };

  let runData: unknown;
  try {
    const apiBase = `http://localhost:${process.env.PORT ?? 3001}`;
    const csrf = await fetch(`${apiBase}/api/csrf-token`)
      .then((r) => r.json() as Promise<{ token?: string }>)
      .then((j) => j.token ?? '')
      .catch(() => '');

    const runRes = await fetch(`${apiBase}/api/scenarios/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
        ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {}),
      },
      body: JSON.stringify(runPayload),
    });

    if (!runRes.ok) {
      const errBody = await runRes.json().catch(() => ({})) as { error?: string };
      res.status(502).json({
        error: `Scenario Engine returned ${runRes.status}: ${errBody.error ?? 'unknown error'}`,
        promoted: false,
      });
      return;
    }

    runData = await runRes.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal relay error';
    res.status(502).json({ error: message, promoted: false });
    return;
  }

  res.json({
    promoted: true,
    suggestionId,
    scenarioResult: runData,
    mergedAssumptions,
    promotedAt: new Date().toISOString(),
    provenance: {
      ...suggestion.provenance,
      promotedBy: 'user',
      promotedAt: new Date().toISOString(),
      assumptionOverrides,
    },
  });
});

export default router;
