/**
 * Terra AI Deal Sourcing — Off-Market Signal Adapters + Ranking Engine
 *
 * Implements a pluggable signal adapter interface with two starter adapters:
 *   1. PermitAdapter  — surfaces recent building permit filings as sourcing signals
 *   2. OwnershipAdapter — surfaces ownership-change indicators (deed, entity transfer)
 *
 * Additional planned adapters (tax lien, vacancy, distress) follow the same interface.
 *
 * Sourcing signals are ranked by a weighted engine and published to the cross-domain
 * alert bus whenever a "Save to portfolio" action is triggered.
 *
 * All data is deterministically seeded — no external licenses required.
 * Routes are registered BEFORE tenantScope so they are demo-accessible.
 */

import { type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';
import { publish as publishToAlertBus, getRecentEvents, getEventCount } from '../lib/terra-alert-bus';
import { defaultEntityRegistry, createEntitySnapshot } from '@workspace/ontology';
import { logger } from '../lib/logger';

const router = Router();
const authOptional = authMiddleware({ required: false });
const authRequired = authMiddleware({ required: true });

/**
 * In-memory deal store keyed by userId → (dealId → deal).
 * Each user sees only their own saved deals; no cross-user leakage.
 */
const SAVED_DEALS_MAX_PER_USER = 50;
const savedDealsByUser = new Map<number, Map<string, Record<string, unknown>>>();

function getUserDeals(userId: number): Map<string, Record<string, unknown>> {
  let m = savedDealsByUser.get(userId);
  if (!m) {
    m = new Map();
    savedDealsByUser.set(userId, m);
  }
  return m;
}

function evictOldestUserDeal(userId: number) {
  const m = getUserDeals(userId);
  if (m.size >= SAVED_DEALS_MAX_PER_USER) {
    const firstKey = m.keys().next().value;
    if (firstKey !== undefined) m.delete(firstKey);
  }
}

// ─── Shared RNG (djb2 variant) ────────────────────────────────────────────────
function seedRng(seed: string) {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h * 33) ^ seed.charCodeAt(i)) >>> 0;
  return (offset: number, min: number, max: number) =>
    min + ((h + offset * 2053) % (max - min + 1));
}

// ─── Signal Adapter Interface ─────────────────────────────────────────────────
type SignalType = 'permit' | 'ownership_change' | 'lien' | 'distress' | 'vacancy';

interface PropertySignal {
  type: SignalType;
  source: string;
  description: string;
  date: string;
  weight: number;
  raw?: Record<string, unknown>;
}

interface SignalAdapter {
  name: string;
  signalTypes: SignalType[];
  fetch(propertyId: string, rng: ReturnType<typeof seedRng>): PropertySignal[];
}

// ─── Starter Adapter 1: Permits ───────────────────────────────────────────────
const PermitAdapter: SignalAdapter = {
  name: 'Municipal Permit Feed',
  signalTypes: ['permit'],
  fetch(propertyId, rng) {
    const permitTypes = [
      'Demo + New Construction',
      'Major Addition (>500 SF)',
      'Change of Occupancy',
      'Mechanical / HVAC Replacement',
      'Roof Replacement',
      'Electrical Service Upgrade',
      'Plumbing — Full Re-pipe',
    ];
    const count = rng(10, 0, 1) ? rng(11, 1, 3) : 0;
    return Array.from({ length: count }, (_, i) => {
      const typeIdx = rng(20 + i, 0, permitTypes.length - 1);
      const month = rng(21 + i, 1, 12);
      const day = rng(22 + i, 1, 28);
      const year = 2025 + rng(23 + i, 0, 1);
      return {
        type: 'permit' as const,
        source: 'Municipal Permit Feed (public)',
        description: `${permitTypes[typeIdx]} permit filed — value $${(rng(24 + i, 25, 850) * 1000).toLocaleString()}`,
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        weight: 0.18,
        raw: { permitType: permitTypes[typeIdx], status: 'filed', filedYear: year },
      };
    });
  },
};

// ─── Starter Adapter 2: Ownership Changes ─────────────────────────────────────
const OwnershipAdapter: SignalAdapter = {
  name: 'County Deed / Ownership Transfer',
  signalTypes: ['ownership_change'],
  fetch(propertyId, rng) {
    if (!rng(30, 0, 1)) return [];
    const entityTypes = [
      'LLC dissolution recorded',
      'Deed transfer — intra-family',
      'Estate / Probate transfer',
      'Out-of-state LLC acquisition',
      'Trust conveyance',
      'Foreclosure deed recorded',
    ];
    const idx = rng(31, 0, entityTypes.length - 1);
    const month = rng(32, 1, 12);
    const day = rng(33, 1, 28);
    return [
      {
        type: 'ownership_change' as const,
        source: 'County Recorder (public)',
        description: `${entityTypes[idx]} — ${rng(34, 1, 9)} months ago`,
        date: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        weight: 0.22,
        raw: { eventType: entityTypes[idx], grantor: 'Entity A', grantee: 'Entity B' },
      },
    ];
  },
};

// ─── Additional seeded adapters (lien, distress, vacancy) ─────────────────────
const LienAdapter: SignalAdapter = {
  name: 'Tax Lien / UCC Recorder',
  signalTypes: ['lien'],
  fetch(propertyId, rng) {
    if (!rng(40, 0, 1)) return [];
    const months = rng(41, 1, 24);
    const amount = rng(42, 5, 280) * 1000;
    return [
      {
        type: 'lien' as const,
        source: 'County Tax Recorder (public)',
        description: `Tax lien recorded — $${amount.toLocaleString()} delinquent (${months}mo)`,
        date: `2025-${String(rng(43, 1, 12)).padStart(2, '0')}-01`,
        weight: 0.28,
        raw: { amount, months, lienType: 'property_tax' },
      },
    ];
  },
};

const DistressAdapter: SignalAdapter = {
  name: 'Distress & NOD Monitor',
  signalTypes: ['distress'],
  fetch(propertyId, rng) {
    if (rng(50, 0, 3) > 0) return [];
    const signals = [
      'Notice of Default filed',
      'Lis Pendens recorded',
      'Loan maturity within 6 months (CMBS)',
      'NOI decline >25% YoY (CoStar flag)',
    ];
    return [
      {
        type: 'distress' as const,
        source: 'Court / EDGAR / CMBS Monitor (seeded)',
        description: signals[rng(51, 0, signals.length - 1)],
        date: `2025-${String(rng(52, 1, 12)).padStart(2, '0')}-${String(rng(53, 1, 28)).padStart(2, '0')}`,
        weight: 0.32,
        raw: {},
      },
    ];
  },
};

const VacancyAdapter: SignalAdapter = {
  name: 'Occupancy / Vacancy Monitor',
  signalTypes: ['vacancy'],
  fetch(propertyId, rng) {
    if (!rng(60, 0, 1)) return [];
    const vacancyPct = rng(61, 18, 72);
    return [
      {
        type: 'vacancy' as const,
        source: 'CoStar / Regrid Vacancy Index (seeded)',
        description: `Elevated vacancy detected — ${vacancyPct}% vs ${rng(62, 6, 14)}% submarket avg`,
        date: `2026-${String(rng(63, 1, 4)).padStart(2, '0')}-01`,
        weight: 0.2,
        raw: { vacancyPct, submarketAvg: rng(62, 6, 14) },
      },
    ];
  },
};

const ADAPTERS: SignalAdapter[] = [
  PermitAdapter,
  OwnershipAdapter,
  LienAdapter,
  DistressAdapter,
  VacancyAdapter,
];

// ─── Ranking Engine ───────────────────────────────────────────────────────────
function scoreCandidate(signals: PropertySignal[]): number {
  if (signals.length === 0) return 0;
  const signalScore = signals.reduce((s, sig) => s + sig.weight, 0);
  const urgencyBonus = signals.some((s) => s.type === 'distress' || s.type === 'lien') ? 0.25 : 0;
  const diversityBonus = new Set(signals.map((s) => s.type)).size * 0.05;
  return Math.min(100, Math.round((signalScore + urgencyBonus + diversityBonus) * 100));
}

// ─── Property seed pool ───────────────────────────────────────────────────────
const PROPERTY_SEEDS = [
  { id: 'prop-sf-001', address: '1842 Mission St', city: 'San Francisco, CA', type: 'Mixed-Use' },
  { id: 'prop-la-002', address: '8421 Wilshire Blvd', city: 'Los Angeles, CA', type: 'Office' },
  { id: 'prop-nyc-003', address: '420 W 23rd St', city: 'New York, NY', type: 'Multifamily' },
  { id: 'prop-chi-004', address: '3300 N Halsted St', city: 'Chicago, IL', type: 'Retail Strip' },
  { id: 'prop-mia-005', address: '820 NW 7th Ave', city: 'Miami, FL', type: 'Industrial' },
  { id: 'prop-aus-006', address: '1901 E 6th St', city: 'Austin, TX', type: 'Mixed-Use' },
  { id: 'prop-sea-007', address: '512 2nd Ave', city: 'Seattle, WA', type: 'Office' },
  { id: 'prop-den-008', address: '1624 Market St', city: 'Denver, CO', type: 'Multifamily' },
  { id: 'prop-atl-009', address: '755 Ralph D Abernathy Blvd', city: 'Atlanta, GA', type: 'Retail' },
  { id: 'prop-bos-010', address: '388 Congress St', city: 'Boston, MA', type: 'Mixed-Use' },
  { id: 'prop-phx-011', address: '2222 N 7th St', city: 'Phoenix, AZ', type: 'Industrial' },
  { id: 'prop-pdx-012', address: '1411 NW 21st Ave', city: 'Portland, OR', type: 'Multifamily' },
];

function buildCandidate(
  seed: (typeof PROPERTY_SEEDS)[0],
  signals: PropertySignal[],
  score: number,
  rng: ReturnType<typeof seedRng>,
) {
  return {
    id: seed.id,
    address: seed.address,
    city: seed.city,
    type: seed.type,
    estimatedValue: rng(70, 2, 48) * 500_000,
    sqft: rng(71, 4, 80) * 1000,
    ownershipYears: rng(72, 2, 22),
    motivationScore: rng(73, 30, 95),
    opportunityScore: score,
    signals,
    signalCount: signals.length,
    aiSummary: buildSummary(seed, signals, score),
    savedToPortfolio: false,
  };
}

function buildSummary(
  seed: (typeof PROPERTY_SEEDS)[0],
  signals: PropertySignal[],
  score: number,
): string {
  if (signals.length === 0)
    return `${seed.address} shows baseline interest. No strong distress signals detected; monitor for emerging indicators.`;
  const types = [...new Set(signals.map((s) => s.type))];
  const urgency = score >= 70 ? 'High-conviction' : score >= 45 ? 'Moderate-confidence' : 'Early-stage';
  return `${urgency} off-market candidate. ${types.length > 1 ? `Multiple signal types: ${types.join(', ')}.` : `Primary signal: ${types[0]}.`} ${signals[0].description}. Score: ${score}/100.`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /terra/sourcing/candidates
 * Returns ranked off-market deal candidates with their sourced signals.
 */
router.get('/terra/sourcing/candidates', authOptional, (_req: Request, res: Response) => {
  try {
    const candidates = PROPERTY_SEEDS.map((seed) => {
      const rng = seedRng(seed.id);
      const signals = ADAPTERS.flatMap((adapter) => adapter.fetch(seed.id, rng));
      const score = scoreCandidate(signals);
      return buildCandidate(seed, signals, score, rng);
    })
      .filter((c) => c.signalCount > 0)
      .sort((a, b) => b.opportunityScore - a.opportunityScore);

    sendSuccess(res, {
      candidates,
      totalScanned: PROPERTY_SEEDS.length,
      adapters: ADAPTERS.map((a) => ({ name: a.name, signalTypes: a.signalTypes })),
      dataMode: 'seeded',
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch sourcing candidates');
  }
});

/**
 * GET /terra/sourcing/candidates/:propertyId
 * Returns signals for a specific property ID.
 */
router.get(
  '/terra/sourcing/candidates/:propertyId',
  authOptional,
  (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params as { propertyId: string };
      const rng = seedRng(propertyId);
      const signals = ADAPTERS.flatMap((adapter) => adapter.fetch(propertyId, rng));
      const score = scoreCandidate(signals);
      sendSuccess(res, {
        propertyId,
        signals,
        opportunityScore: score,
        dataMode: 'seeded',
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch property signals');
    }
  },
);

/**
 * POST /terra/sourcing/save-to-portfolio
 * Creates a Terra deal record from a sourced candidate and registers it as an entity.
 * Also emits a sourcing signal to the cross-domain alert bus.
 */
router.post('/terra/sourcing/save-to-portfolio', authRequired, (req: Request, res: Response) => {
  try {
    const { candidateId, address, city, type, estimatedValue, signals, opportunityScore } =
      req.body as {
        candidateId: string;
        address: string;
        city: string;
        type: string;
        estimatedValue: number;
        signals: PropertySignal[];
        opportunityScore: number;
      };

    if (
      !candidateId ||
      typeof candidateId !== 'string' ||
      candidateId.length > 64 ||
      !address ||
      typeof address !== 'string' ||
      address.length > 200
    ) {
      res.status(400).json({ error: 'candidateId (max 64 chars) and address (max 200 chars) are required' });
      return;
    }

    if (typeof estimatedValue !== 'number' || !isFinite(estimatedValue)) {
      res.status(400).json({ error: 'estimatedValue must be a finite number' });
      return;
    }

    const safeSignals = Array.isArray(signals)
      ? signals.slice(0, 20).map((s) => ({
          type: String(s.type).slice(0, 32),
          source: String(s.source ?? '').slice(0, 128),
          description: String(s.description ?? '').slice(0, 256),
          date: String(s.date ?? '').slice(0, 32),
          weight: typeof s.weight === 'number' ? s.weight : 0,
        }))
      : [];

    const dealId = `deal-${candidateId}-${Date.now()}`;
    const entityId = `entity-terra-${candidateId}`;
    const createdAt = new Date().toISOString();

    const deal = {
      id: dealId,
      entityId,
      propertyId: candidateId,
      address: address.slice(0, 200),
      city: typeof city === 'string' ? city.slice(0, 100) : '',
      type: typeof type === 'string' ? type.slice(0, 64) : '',
      estimatedValue,
      opportunityScore: typeof opportunityScore === 'number' ? opportunityScore : 0,
      stage: 'Sourced',
      source: 'AI Sourcing Engine',
      signals: safeSignals,
      alertDomain: 'terra',
      alertType: 'off_market_candidate_saved',
      createdAt,
    };

    const userId = req.user!.id;

    const alertEvent = publishToAlertBus('terra.sourcing.candidate_saved', 'terra', {
      dealId,
      entityId,
      candidateId,
      address: deal.address,
      city: deal.city,
      type: deal.type,
      estimatedValue,
      opportunityScore: deal.opportunityScore,
      signalCount: safeSignals.length,
      savedAt: createdAt,
      userId,
    });

    let entityRegistered = false;
    try {
      const snapshot = createEntitySnapshot({
        entityId,
        entityType: 'deal',
        domain: 'real-estate',
        displayName: `${deal.address} — Off-Market Sourced Deal`,
        description: `AI-sourced off-market candidate. Opportunity score: ${deal.opportunityScore}. Signals: ${safeSignals.map((s) => s.type).join(', ')}.`,
        health: 'unknown',
        opportunityScore: deal.opportunityScore as number,
        attributes: {
          propertyId: candidateId,
          address: deal.address,
          city: deal.city,
          type: deal.type,
          estimatedValue,
          stage: deal.stage,
          source: deal.source,
          signalCount: safeSignals.length,
          dealId,
        },
        tags: ['terra', 'off-market', 'ai-sourced'],
        snapshotAt: createdAt,
      });
      defaultEntityRegistry.upsert(snapshot);
      entityRegistered = true;
    } catch (ontologyErr) {
      logger.warn({ err: ontologyErr, dealId, entityId }, '[terra-sourcing] Ontology registration failed (non-fatal); deal still saved');
      entityRegistered = false;
    }

    evictOldestUserDeal(userId);
    getUserDeals(userId).set(dealId, { ...deal, entityRegistered });

    sendSuccess(res, {
      deal,
      entityRegistered,
      alertPublished: true,
      alertEventId: alertEvent.id,
      message: `Deal ${dealId} created${entityRegistered ? ' and registered in ontology' : ' (ontology registration skipped)'}. Sourcing alert ${alertEvent.id} published to cross-domain bus.`,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to save candidate to portfolio');
  }
});

/**
 * GET /terra/sourcing/saved-deals
 * Returns deals saved to portfolio for the authenticated caller only.
 * Each user sees exclusively their own saved deals — no cross-user leakage.
 */
router.get('/terra/sourcing/saved-deals', authRequired, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userDeals = getUserDeals(userId);
  sendSuccess(res, {
    deals: Array.from(userDeals.values()),
    count: userDeals.size,
    dataMode: 'in-memory',
  });
});

/**
 * GET /terra/sourcing/alert-bus/events
 * Returns recent Terra alert bus events scoped to the authenticated caller.
 *
 * Sourcing events tagged with a userId are only returned to the user who
 * created them. Climate / property-level events (no userId tag) are visible
 * to all authenticated users since they contain no deal-private data.
 */
const MAX_BUS_PREFETCH = 500;
router.get('/terra/sourcing/alert-bus/events', authRequired, (req: Request, res: Response) => {
  const callerId = req.user!.id;
  const limit = Math.min(100, parseInt((req.query.limit as string) ?? '20', 10) || 20);
  const allEvents = getRecentEvents({ domain: 'terra', limit: MAX_BUS_PREFETCH });
  const scoped = allEvents.filter((e) => {
    const payloadUserId = e.payload.userId;
    if (payloadUserId === undefined || payloadUserId === null) return true;
    return payloadUserId === callerId;
  }).slice(0, limit);
  sendSuccess(res, {
    events: scoped,
    total: getEventCount(),
    domain: 'terra',
  });
});

/**
 * GET /terra/sourcing/adapters
 * Returns the list of registered signal adapter definitions.
 */
router.get('/terra/sourcing/adapters', authOptional, (_req: Request, res: Response) => {
  sendSuccess(res, {
    adapters: ADAPTERS.map((a) => ({
      name: a.name,
      signalTypes: a.signalTypes,
      description: `Provides ${a.signalTypes.join(', ')} signals from ${a.name}`,
      pluggable: true,
    })),
  });
});

export default router;
