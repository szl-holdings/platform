/**
 * A11oy stubs killer — backing endpoints for Ownership Graph, Distress Engine,
 * Knowledge Vault, and Infrastructure Map surfaces. Strategy scenarios live
 * in a sibling module at `routes/a11oy-strategy.ts`.
 *
 * All endpoints return deterministic seed data scoped to the calling tenant
 * (or a `demo` slug for unauthenticated requests) so the same caller observes
 * the same data across reloads. State for ownership reassignments and saved
 * playbook annotations is kept in-memory keyed by tenant.
 *
 * Mounted at `/api/a11oy/stubs` from `routes/index.ts`.
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess } from '../lib/api-response';

const router: IRouter = Router();

// ─── Tenant helper ────────────────────────────────────────────────────────────

function tenantSlug(req: Request): string {
  const raw =
    (req.headers['x-tenant-id'] as string | undefined) ??
    (req.headers['x-org-id'] as string | undefined) ??
    (req as Request & { user?: { tenantId?: string; orgId?: string } }).user?.tenantId ??
    (req as Request & { user?: { tenantId?: string; orgId?: string } }).user?.orgId ??
    'demo';
  return String(raw).slice(0, 64) || 'demo';
}

// ─── Ownership Graph ──────────────────────────────────────────────────────────

interface OwnerNode {
  id: string;
  name: string;
  team: string;
  role: 'owner' | 'backup' | 'shadow';
  workflows: number;
  approvals: number;
  gaps: number;
  valueAtRisk: number;
  status: 'overloaded' | 'gap' | 'normal';
  reportsTo: string | null;
}

interface OwnerEdge {
  from: string;
  to: string;
  kind: 'reports-to' | 'backs-up' | 'collaborates';
  weight: number;
}

const OWNERSHIP_SEED: { nodes: OwnerNode[]; edges: OwnerEdge[] } = {
  nodes: [
    { id: 'unassigned',    name: 'Unassigned',     team: 'Procurement',       role: 'owner',  workflows: 1, approvals: 1, gaps: 1, valueAtRisk: 320000,  status: 'gap',         reportsTo: null },
    { id: 'jordan-a',      name: 'Jordan Alvarez', team: 'Revenue Operations', role: 'owner',  workflows: 4, approvals: 6, gaps: 0, valueAtRisk: 840000,  status: 'overloaded',  reportsTo: 'elena-s' },
    { id: 'priya-m',       name: 'Priya Mehta',    team: 'Finance',           role: 'owner',  workflows: 3, approvals: 2, gaps: 0, valueAtRisk: 450000,  status: 'normal',      reportsTo: 'thomas-n' },
    { id: 'marcus-w',      name: 'Marcus Webb',    team: 'Customer Success',  role: 'owner',  workflows: 5, approvals: 7, gaps: 0, valueAtRisk: 480000,  status: 'overloaded',  reportsTo: 'elena-s' },
    { id: 'thomas-n',      name: 'Thomas Nguyen',  team: 'Legal',             role: 'owner',  workflows: 6, approvals: 9, gaps: 0, valueAtRisk: 2100000, status: 'overloaded',  reportsTo: null },
    { id: 'elena-s',       name: 'Elena Santos',   team: 'Product',           role: 'owner',  workflows: 2, approvals: 0, gaps: 0, valueAtRisk: 0,       status: 'normal',      reportsTo: null },
    { id: 'kai-r',         name: 'Kai Romero',     team: 'Platform',          role: 'backup', workflows: 2, approvals: 1, gaps: 0, valueAtRisk: 180000,  status: 'normal',      reportsTo: 'elena-s' },
    { id: 'noor-d',        name: 'Noor Dabbagh',   team: 'Security',          role: 'owner',  workflows: 3, approvals: 4, gaps: 1, valueAtRisk: 690000,  status: 'gap',         reportsTo: 'thomas-n' },
  ],
  edges: [
    { from: 'jordan-a', to: 'elena-s',  kind: 'reports-to',    weight: 1 },
    { from: 'priya-m',  to: 'thomas-n', kind: 'reports-to',    weight: 1 },
    { from: 'marcus-w', to: 'elena-s',  kind: 'reports-to',    weight: 1 },
    { from: 'kai-r',    to: 'elena-s',  kind: 'reports-to',    weight: 1 },
    { from: 'noor-d',   to: 'thomas-n', kind: 'reports-to',    weight: 1 },
    { from: 'kai-r',    to: 'jordan-a', kind: 'backs-up',      weight: 0.6 },
    { from: 'noor-d',   to: 'marcus-w', kind: 'collaborates',  weight: 0.4 },
    { from: 'priya-m',  to: 'jordan-a', kind: 'collaborates',  weight: 0.5 },
  ],
};

// Tenant-scoped reassignment overrides (in-memory)
type Reassignment = { workflowKey: string; from: string; to: string; reason: string; at: string };
const ownershipReassignments = new Map<string, Reassignment[]>();

router.get('/ownership-graph', (req, res) => {
  try {
    const tenant = tenantSlug(req);
    const reassignments = ownershipReassignments.get(tenant) ?? [];
    const data = {
      nodes: OWNERSHIP_SEED.nodes,
      edges: OWNERSHIP_SEED.edges,
      reassignments,
      summary: {
        totalOwners: OWNERSHIP_SEED.nodes.length,
        overloaded: OWNERSHIP_SEED.nodes.filter((n) => n.status === 'overloaded').length,
        gaps: OWNERSHIP_SEED.nodes.filter((n) => n.status === 'gap').length,
        totalValueAtRisk: OWNERSHIP_SEED.nodes.reduce((s, n) => s + n.valueAtRisk, 0),
      },
    };
    sendSuccess(res, data, 200, { source: 'seed', tenant, generatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, 'ownership-graph');
  }
});

const ReassignSchema = z.object({
  workflowKey: z.string().min(1).max(120),
  from: z.string().min(1).max(120),
  to: z.string().min(1).max(120),
  reason: z.string().min(1).max(500),
});

router.post('/ownership-graph/reassign', (req, res) => {
  try {
    const parsed = ReassignSchema.safeParse(req.body);
    if (!parsed.success) return sendBadRequest(res, 'Invalid reassignment payload', parsed.error.format());
    const tenant = tenantSlug(req);
    const existing = ownershipReassignments.get(tenant) ?? [];
    const entry: Reassignment = { ...parsed.data, at: new Date().toISOString() };
    const next = [entry, ...existing].slice(0, 100);
    ownershipReassignments.set(tenant, next);
    sendSuccess(res, { reassignment: entry, count: next.length }, 201);
  } catch (err) {
    handleRouteError(res, err, 'ownership-graph-reassign');
  }
});

// ─── Distress Engine ──────────────────────────────────────────────────────────

interface DistressSignal {
  id: string;
  account: string;
  segment: 'enterprise' | 'mid-market' | 'smb';
  region: string;
  ownerId: string;
  score: number;                   // 0-100
  band: 'severe' | 'elevated' | 'watch' | 'stable';
  drivers: { label: string; weight: number; trend: 'up' | 'down' | 'flat' }[];
  arrAtRisk: number;
  daysSinceLastEngagement: number;
  recommendedPlay: string;
  lastUpdated: string;
}

const DISTRESS_SEED: DistressSignal[] = [
  {
    id: 'ds-001', account: 'Northwind Logistics', segment: 'enterprise', region: 'NA', ownerId: 'marcus-w',
    score: 87, band: 'severe',
    drivers: [
      { label: 'Sponsor churn (CFO exit)', weight: 0.34, trend: 'up' },
      { label: 'Usage drop (-42% MoM)',    weight: 0.28, trend: 'up' },
      { label: 'Open Sev-1 incident',      weight: 0.22, trend: 'flat' },
      { label: 'Renewal in 38 days',       weight: 0.16, trend: 'up' },
    ],
    arrAtRisk: 1_240_000, daysSinceLastEngagement: 19,
    recommendedPlay: 'Executive recovery: schedule QBR + sponsor remap within 7 days',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'ds-002', account: 'Helios Apparel', segment: 'mid-market', region: 'EMEA', ownerId: 'jordan-a',
    score: 71, band: 'elevated',
    drivers: [
      { label: 'NPS dropped 32 → 11',  weight: 0.40, trend: 'up' },
      { label: 'Support tickets +180%', weight: 0.30, trend: 'up' },
      { label: 'Adoption stalled',      weight: 0.30, trend: 'flat' },
    ],
    arrAtRisk: 380_000, daysSinceLastEngagement: 11,
    recommendedPlay: 'Adoption sprint: enable 3 missing modules + value review',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'ds-003', account: 'Aether Robotics', segment: 'enterprise', region: 'APAC', ownerId: 'priya-m',
    score: 54, band: 'watch',
    drivers: [
      { label: 'Slowed expansion talks', weight: 0.55, trend: 'flat' },
      { label: 'Champion role change',    weight: 0.45, trend: 'down' },
    ],
    arrAtRisk: 620_000, daysSinceLastEngagement: 6,
    recommendedPlay: 'Re-anchor with new champion; introduce co-design workshop',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'ds-004', account: 'Borealis Media', segment: 'smb', region: 'NA', ownerId: 'kai-r',
    score: 28, band: 'stable',
    drivers: [
      { label: 'On-time payments',     weight: 0.50, trend: 'down' },
      { label: 'Healthy weekly usage',  weight: 0.50, trend: 'down' },
    ],
    arrAtRisk: 48_000, daysSinceLastEngagement: 4,
    recommendedPlay: 'Monitor — no proactive outreach required',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'ds-005', account: 'Verdant Mutual', segment: 'enterprise', region: 'NA', ownerId: 'noor-d',
    score: 76, band: 'elevated',
    drivers: [
      { label: 'Compliance audit findings', weight: 0.45, trend: 'up' },
      { label: 'Stalled procurement',       weight: 0.30, trend: 'flat' },
      { label: 'Renewal in 64 days',        weight: 0.25, trend: 'up' },
    ],
    arrAtRisk: 980_000, daysSinceLastEngagement: 14,
    recommendedPlay: 'Compliance pack + procurement unblock task force',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 33).toISOString(),
  },
];

router.get('/distress-engine', (req, res) => {
  try {
    const tenant = tenantSlug(req);
    const totals = DISTRESS_SEED.reduce(
      (acc, s) => {
        acc.arrAtRisk += s.arrAtRisk;
        acc.bands[s.band] = (acc.bands[s.band] ?? 0) + 1;
        return acc;
      },
      { arrAtRisk: 0, bands: {} as Record<string, number> },
    );
    sendSuccess(
      res,
      { signals: DISTRESS_SEED, totals },
      200,
      { source: 'seed', tenant, generatedAt: new Date().toISOString() },
    );
  } catch (err) {
    handleRouteError(res, err, 'distress-engine');
  }
});

router.get('/distress-engine/:id', (req, res) => {
  try {
    const signal = DISTRESS_SEED.find((s) => s.id === req.params.id);
    if (!signal) return sendNotFound(res, 'Distress signal');
    sendSuccess(res, { signal });
  } catch (err) {
    handleRouteError(res, err, 'distress-engine-detail');
  }
});

// ─── Knowledge Vault ──────────────────────────────────────────────────────────

interface KnowledgeEntry {
  id: string;
  title: string;
  category: 'runbook' | 'decision' | 'doctrine' | 'lessons-learned' | 'reference';
  summary: string;
  tags: string[];
  owner: string;
  updatedAt: string;
  reads: number;
  citations: number;
  confidence: number; // 0-1
}

const KNOWLEDGE_SEED: KnowledgeEntry[] = [
  {
    id: 'kv-001', title: 'Tenant isolation invariants',
    category: 'doctrine',
    summary: 'Non-negotiable invariants enforced at the data, transport, and policy layers for multi-tenant operation.',
    tags: ['security', 'multi-tenancy', 'data-plane'], owner: 'noor-d',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    reads: 412, citations: 18, confidence: 0.96,
  },
  {
    id: 'kv-002', title: 'Sev-1 stabilization runbook',
    category: 'runbook',
    summary: 'Step-by-step containment, comms cadence, and rollback gates for Sev-1 incidents touching production data.',
    tags: ['incident', 'runbook', 'sev1'], owner: 'marcus-w',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
    reads: 1284, citations: 47, confidence: 0.92,
  },
  {
    id: 'kv-003', title: 'Decision: pivot to envelope-only error contract',
    category: 'decision',
    summary: 'Why every API route returns a single error envelope, and the migration plan to back-fill the remaining routes.',
    tags: ['api', 'contracts', 'architecture'], owner: 'thomas-n',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
    reads: 233, citations: 9, confidence: 0.88,
  },
  {
    id: 'kv-004', title: 'Lessons learned — Q1 outage post-mortem',
    category: 'lessons-learned',
    summary: 'Five concrete corrective actions and ownership assignments emerging from the Q1 cascading-failure event.',
    tags: ['post-mortem', 'reliability'], owner: 'kai-r',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    reads: 178, citations: 12, confidence: 0.84,
  },
  {
    id: 'kv-005', title: 'Reference — runbook authoring guide',
    category: 'reference',
    summary: 'Required sections, severity bands, and review cadence for any runbook added to the vault.',
    tags: ['authoring', 'reference'], owner: 'elena-s',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    reads: 89, citations: 4, confidence: 0.78,
  },
  {
    id: 'kv-006', title: 'Renewal playbook — enterprise',
    category: 'runbook',
    summary: 'Sequenced motions from T-90 through close for enterprise renewals, including sponsor remap and value review.',
    tags: ['renewals', 'enterprise', 'gtm'], owner: 'jordan-a',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    reads: 504, citations: 22, confidence: 0.9,
  },
];

router.get('/knowledge-vault', (req, res) => {
  try {
    const tenant = tenantSlug(req);
    const q = String(req.query.q ?? '').trim().toLowerCase();
    const category = req.query.category ? String(req.query.category) : null;
    let entries = KNOWLEDGE_SEED;
    if (category) entries = entries.filter((e) => e.category === category);
    if (q) {
      entries = entries.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    const totals = {
      total: KNOWLEDGE_SEED.length,
      matched: entries.length,
      byCategory: KNOWLEDGE_SEED.reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + 1;
        return acc;
      }, {}),
    };
    sendSuccess(res, { entries, totals }, 200, { source: 'seed', tenant });
  } catch (err) {
    handleRouteError(res, err, 'knowledge-vault');
  }
});

router.get('/knowledge-vault/:id', (req, res) => {
  try {
    const entry = KNOWLEDGE_SEED.find((e) => e.id === req.params.id);
    if (!entry) return sendNotFound(res, 'Knowledge entry');
    sendSuccess(res, { entry });
  } catch (err) {
    handleRouteError(res, err, 'knowledge-vault-detail');
  }
});

// ─── Infrastructure Map fixtures ──────────────────────────────────────────────

interface InfraPin {
  id: string;
  label: string;
  region: string;
  lat: number;
  lon: number;
  status: 'nominal' | 'degraded' | 'critical';
  tier: 'edge' | 'core' | 'sovereign';
  capacity: number; // 0-1
}

const INFRA_PINS: InfraPin[] = [
  { id: 'p-iad', label: 'IAD-1 Core',      region: 'us-east-1',  lat: 38.9531, lon: -77.4565, status: 'nominal',  tier: 'core',      capacity: 0.62 },
  { id: 'p-sfo', label: 'SFO-2 Core',      region: 'us-west-2',  lat: 37.6213, lon: -122.3790, status: 'degraded', tier: 'core',      capacity: 0.81 },
  { id: 'p-dub', label: 'DUB-1 Sovereign', region: 'eu-west-1',  lat: 53.3498, lon: -6.2603,  status: 'nominal',  tier: 'sovereign', capacity: 0.45 },
  { id: 'p-fra', label: 'FRA-1 Core',      region: 'eu-central-1', lat: 50.1109, lon: 8.6821,  status: 'nominal',  tier: 'core',      capacity: 0.58 },
  { id: 'p-sin', label: 'SIN-1 Edge',      region: 'ap-southeast-1', lat: 1.3521, lon: 103.8198, status: 'critical', tier: 'edge',     capacity: 0.94 },
  { id: 'p-tyo', label: 'TYO-2 Sovereign', region: 'ap-northeast-1', lat: 35.6762, lon: 139.6503, status: 'nominal', tier: 'sovereign', capacity: 0.39 },
  { id: 'p-syd', label: 'SYD-1 Edge',      region: 'ap-southeast-2', lat: -33.8688, lon: 151.2093, status: 'degraded', tier: 'edge',   capacity: 0.77 },
  { id: 'p-gru', label: 'GRU-1 Edge',      region: 'sa-east-1',  lat: -23.5505, lon: -46.6333, status: 'nominal',  tier: 'edge',      capacity: 0.51 },
];

router.get('/infrastructure-map', (req, res) => {
  try {
    const tenant = tenantSlug(req);
    sendSuccess(
      res,
      {
        pins: INFRA_PINS,
        totals: {
          total: INFRA_PINS.length,
          nominal: INFRA_PINS.filter((p) => p.status === 'nominal').length,
          degraded: INFRA_PINS.filter((p) => p.status === 'degraded').length,
          critical: INFRA_PINS.filter((p) => p.status === 'critical').length,
        },
      },
      200,
      { source: 'seed', tenant },
    );
  } catch (err) {
    handleRouteError(res, err, 'infrastructure-map');
  }
});

export default router;
