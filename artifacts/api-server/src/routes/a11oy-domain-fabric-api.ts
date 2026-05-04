import { Router, type Request, type Response } from 'express';
import {
  FABRIC_SIGNALS, FABRIC_RISKS, FABRIC_DECISIONS, FABRIC_OUTCOMES, FABRIC_EVIDENCE,
  DOMAIN_TWINS, VERTICALS, FABRIC_AGENTS, ROADMAP_PHASES, deriveFabricKpis,
  AGENT_IDENTITIES, AGENT_TRUST_EDGES, RAG_COLLECTIONS,
} from '../services/fabric-store.js';

const router = Router();
const ts = () => new Date().toISOString();
function ok(res: Response, data: unknown, meta?: Record<string, unknown>) {
  res.json({ ok: true, data, meta: { ts: ts(), ...meta } });
}

router.get('/fabric/kpis', (_req: Request, res: Response) => ok(res, deriveFabricKpis()));

router.get('/fabric/signals', (req: Request, res: Response) => {
  const { vertical, status, severity } = req.query;
  let items = [...FABRIC_SIGNALS];
  if (vertical && vertical !== 'all') items = items.filter(s => s.verticalId === vertical);
  if (status && status !== 'all')   items = items.filter(s => s.status === status);
  if (severity && severity !== 'all') items = items.filter(s => s.severity === severity);
  ok(res, items, { total: FABRIC_SIGNALS.length, filtered: items.length });
});

router.get('/fabric/risks', (req: Request, res: Response) => {
  const { vertical, status, category } = req.query;
  let items = [...FABRIC_RISKS];
  if (vertical && vertical !== 'all') items = items.filter(r => r.verticalId === vertical);
  if (status && status !== 'all')    items = items.filter(r => r.status === status);
  if (category && category !== 'all') items = items.filter(r => r.riskCategory === category);
  ok(res, items, { total: FABRIC_RISKS.length, filtered: items.length });
});

router.get('/fabric/decisions', (req: Request, res: Response) => {
  const { vertical, status } = req.query;
  let items = [...FABRIC_DECISIONS];
  if (vertical && vertical !== 'all') items = items.filter(d => d.verticalId === vertical);
  if (status && status !== 'all')    items = items.filter(d => d.status === status);
  ok(res, items, { total: FABRIC_DECISIONS.length, filtered: items.length });
});

router.get('/fabric/outcomes', (req: Request, res: Response) => {
  const { vertical } = req.query;
  let items = [...FABRIC_OUTCOMES];
  if (vertical && vertical !== 'all') items = items.filter(o => o.verticalId === vertical);
  ok(res, items, { total: FABRIC_OUTCOMES.length, filtered: items.length });
});

router.get('/fabric/evidence', (req: Request, res: Response) => {
  const { vertical, type, status } = req.query;
  let items = [...FABRIC_EVIDENCE];
  if (vertical && vertical !== 'all') items = items.filter(e => e.verticalId === vertical);
  if (type && type !== 'all')         items = items.filter(e => e.evidenceType === type);
  if (status && status !== 'all')     items = items.filter(e => e.status === status);
  ok(res, items, { total: FABRIC_EVIDENCE.length, filtered: items.length });
});

router.get('/fabric/twins',    (_req, res) => ok(res, DOMAIN_TWINS,   { total: DOMAIN_TWINS.length }));
router.get('/fabric/verticals',(_req, res) => ok(res, VERTICALS,      { total: VERTICALS.length }));
router.get('/fabric/agents',   (_req, res) => ok(res, FABRIC_AGENTS,  { total: FABRIC_AGENTS.length }));
router.get('/fabric/roadmap',  (_req, res) => ok(res, ROADMAP_PHASES, { total: ROADMAP_PHASES.length }));

router.get('/fabric/all', (_req, res) => ok(res, {
  kpis: deriveFabricKpis(), signals: FABRIC_SIGNALS, risks: FABRIC_RISKS,
  decisions: FABRIC_DECISIONS, outcomes: FABRIC_OUTCOMES, evidence: FABRIC_EVIDENCE,
  twins: DOMAIN_TWINS, verticals: VERTICALS, agents: FABRIC_AGENTS, roadmap: ROADMAP_PHASES,
}));

// Agent Identity Registry
router.get('/pages/identity', (_req, res) => ok(res, { agents: AGENT_IDENTITIES, trustEdges: AGENT_TRUST_EDGES }));

// Agentic RAG collections
router.get('/pages/rag', (_req, res) => ok(res, { collections: RAG_COLLECTIONS }));

// Intelligence Command summary
router.get('/pages/intelligence-summary', (_req, res) => {
  const openAlerts = FABRIC_RISKS.filter(r => r.status === 'open').length;
  ok(res, {
    kpis: [
      { label: 'Portfolio Entities', value: String(DOMAIN_TWINS.length), delta: '+2 this quarter' },
      { label: 'Active Intel Feeds', value: '6', delta: '2 pending auth' },
      { label: 'Avg ROI Signal', value: '2.3×', delta: 'vs 1.8× baseline' },
      { label: 'Open Alerts', value: String(openAlerts), delta: openAlerts > 10 ? `${openAlerts - 10} above baseline` : 'within baseline' },
    ],
    recent: [
      { entity: 'Carlota Jo Consulting', type: 'Entity deep dive', time: '2h ago', status: 'complete' },
      { entity: 'SZL Holdings LLC', type: 'ROI lens', time: '4h ago', status: 'complete' },
      { entity: 'A11oy Platform', type: 'Finance terminal', time: '1d ago', status: 'complete' },
      { entity: 'Vessels Maritime', type: 'Entity deep dive', time: '2d ago', status: 'stale' },
    ],
  });
});

// Signal Mesh page — returns pipeline layers, sources, KG entities, semantic results,
// and the full fabric signal list (mapped to the shape the frontend expects).
router.get('/pages/signal-mesh', (_req, res) => {
  const signals = FABRIC_SIGNALS.map(s => ({
    id: s.id,
    vertical: s.verticalId,
    title: s.title,
    severity: s.severity,
    status: s.status,
    owner: s.source,
    signalType: s.signalType,
    confidence: s.confidence,
    timestamp: s.timestamp,
    recommendedAction: s.recommendedAction,
  }));
  ok(res, {
    signals,
    layers: [
      { label: 'Ingestion',       status: 'ok', latency: '12ms avg',  throughput: '2,400/hr' },
      { label: 'Normalization',   status: 'ok', latency: '8ms avg',   throughput: '2,400/hr' },
      { label: 'Deduplication',   status: 'ok', latency: '4ms avg',   throughput: '2,200/hr' },
      { label: 'Routing',         status: 'ok', latency: '3ms avg',   throughput: '2,200/hr' },
      { label: 'Correlation',     status: 'ok', latency: '22ms avg',  throughput: '840 graphs/hr' },
      { label: 'Knowledge Graph', status: 'ok', latency: '18ms avg',  throughput: '840 entities/hr' },
    ],
    sources: [
      { name: 'AIS Vessel Feed',      domain: 'Maritime',     status: 'live', rate: '24/hr' },
      { name: 'Port Authority API',   domain: 'Maritime',     status: 'live', rate: '8/hr' },
      { name: 'CRM Webhook',          domain: 'Revenue',      status: 'live', rate: '36/hr' },
      { name: 'Matter Tracker',       domain: 'Legal',        status: 'live', rate: '12/hr' },
      { name: 'OSINT Aggregator',     domain: 'Defense',      status: 'live', rate: '48/hr' },
      { name: 'Cap Rate Feed',        domain: 'Real Estate',  status: 'live', rate: '4/hr' },
    ],
    kgEntities: [],
    semanticResults: [],
  }, { total: signals.length });
});

export default router;
