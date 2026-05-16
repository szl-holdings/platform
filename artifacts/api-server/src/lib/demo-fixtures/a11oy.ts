/**
 * A11oy demo fixtures.
 *
 * Mirrors the response envelopes of the live A11oy fabric, dashboard, and
 * orchestration routes so the A11oy hub renders populated KPIs, brand cards,
 * signals, risks, decisions, outcomes, evidence, and proofs in demo mode
 * without hitting the database or requiring authentication.
 *
 * Source-of-truth data is re-used directly from the same in-memory stores
 * the live handlers query, so demo output stays consistent with sandbox.
 */

import {
  FABRIC_SIGNALS,
  FABRIC_RISKS,
  FABRIC_DECISIONS,
  FABRIC_OUTCOMES,
  FABRIC_EVIDENCE,
  DOMAIN_TWINS,
  VERTICALS,
  FABRIC_AGENTS,
  ROADMAP_PHASES,
  AGENT_IDENTITIES,
  AGENT_TRUST_EDGES,
  RAG_COLLECTIONS,
  deriveFabricKpis,
} from '../../services/fabric-store.js';
import {
  A11OY_PRODUCT_IDS,
  KNOWN_PRODUCT_META,
  listAllProductsWithStatus,
} from '../../services/orchestration-store.js';

const ts = () => new Date().toISOString();
const meta = (extra?: Record<string, unknown>) => ({
  ts: ts(),
  source: 'demo-fixture',
  ...extra,
});

// ─── Fabric data envelopes (matches a11oy-domain-fabric-api.ts) ──────────────

const kpis = deriveFabricKpis();

const fabricAll = {
  ok: true,
  data: {
    kpis,
    signals: FABRIC_SIGNALS,
    risks: FABRIC_RISKS,
    decisions: FABRIC_DECISIONS,
    outcomes: FABRIC_OUTCOMES,
    evidence: FABRIC_EVIDENCE,
    twins: DOMAIN_TWINS,
    verticals: VERTICALS,
    agents: FABRIC_AGENTS,
    roadmap: ROADMAP_PHASES,
  },
  meta: meta(),
};

const fabricKpis      = { ok: true, data: kpis,             meta: meta() };
const fabricSignals   = { ok: true, data: FABRIC_SIGNALS,   meta: meta({ total: FABRIC_SIGNALS.length, filtered: FABRIC_SIGNALS.length }) };
const fabricRisks     = { ok: true, data: FABRIC_RISKS,     meta: meta({ total: FABRIC_RISKS.length, filtered: FABRIC_RISKS.length }) };
const fabricDecisions = { ok: true, data: FABRIC_DECISIONS, meta: meta({ total: FABRIC_DECISIONS.length, filtered: FABRIC_DECISIONS.length }) };
const fabricOutcomes  = { ok: true, data: FABRIC_OUTCOMES,  meta: meta({ total: FABRIC_OUTCOMES.length, filtered: FABRIC_OUTCOMES.length }) };
const fabricEvidence  = { ok: true, data: FABRIC_EVIDENCE,  meta: meta({ total: FABRIC_EVIDENCE.length, filtered: FABRIC_EVIDENCE.length }) };
const fabricTwins     = { ok: true, data: DOMAIN_TWINS,     meta: meta({ total: DOMAIN_TWINS.length }) };
const fabricVerticals = { ok: true, data: VERTICALS,        meta: meta({ total: VERTICALS.length }) };
const fabricAgents    = { ok: true, data: FABRIC_AGENTS,    meta: meta({ total: FABRIC_AGENTS.length }) };
const fabricRoadmap   = { ok: true, data: ROADMAP_PHASES,   meta: meta({ total: ROADMAP_PHASES.length }) };

// ─── Orchestration registry (matches a11oy-orchestration-api.ts) ─────────────

const fabricProducts = {
  ok: true,
  data: {
    products: listAllProductsWithStatus(),
    knownProductIds: A11OY_PRODUCT_IDS,
    productCatalog: KNOWN_PRODUCT_META,
    recentProofs: [],
    totalProofs: 0,
    generatedAt: ts(),
  },
  meta: meta(),
};

const fabricProofs = { ok: true, data: [], meta: meta() };

// ─── Workflow dashboard snapshot (matches a11oy-dashboard-api.ts) ────────────

const dashboardSnapshot = {
  ok: true,
  data: {
    totalWorkflows: 24,
    totalRuns: 318,
    runningRuns: 4,
    pendingApprovals: kpis.approvalQueue,
    failedRuns: 6,
    successRate: 96,
    avgDurationMs: 4820,
    workflowsByStatus: [
      { status: 'active',   count: 18 },
      { status: 'paused',   count: 4  },
      { status: 'archived', count: 2  },
    ],
    recentActivity: [
      { id: 'al-001', action: 'workflow.run.completed', target: 'wf-terra-covenant',     actor: 'orchestrator', createdAt: ts() },
      { id: 'al-002', action: 'approval.granted',      target: 'apr-vessels-psc-014',   actor: 'op-fleet-vessels', createdAt: ts() },
      { id: 'al-003', action: 'workflow.run.started',  target: 'wf-aegis-threat',       actor: 'orchestrator', createdAt: ts() },
      { id: 'al-004', action: 'workflow.run.failed',   target: 'wf-lyte-churn',         actor: 'orchestrator', createdAt: ts() },
      { id: 'al-005', action: 'approval.requested',    target: 'apr-counsel-discovery', actor: 'counsel-sentinel', createdAt: ts() },
    ],
  },
  meta: { timestamp: ts(), source: 'demo-fixture', visibility: 'public', doctrine: 'V6' },
};

// ─── Fabric "now" overview (matches a11oy-fabric-api.ts /a11oy/now) ──────────

const bySeverity = FABRIC_SIGNALS.reduce<Record<string, number>>((acc, s) => {
  acc[s.severity] = (acc[s.severity] ?? 0) + 1;
  return acc;
}, {});
const byVertical = FABRIC_SIGNALS.reduce<Record<string, number>>((acc, s) => {
  acc[s.verticalId] = (acc[s.verticalId] ?? 0) + 1;
  return acc;
}, {});

const fabricNow = {
  ok: true,
  data: {
    signals: FABRIC_SIGNALS.length,
    activeOutcomes: FABRIC_OUTCOMES.filter((o) => o.status === 'in_progress').length,
    pendingActions: FABRIC_DECISIONS.filter((d) => d.status === 'awaiting_review' || d.status === 'draft').length,
    activeWorkcells: 3,
    fabricStatus: 'healthy',
    criticalSignals: FABRIC_SIGNALS.filter((s) => s.severity === 'critical').length,
    bySeverity,
    byVertical,
    fabricLayers: 7,
    proofPackets: FABRIC_EVIDENCE.length,
  },
  meta: { ...meta(), mode: 'demo', phase: 'Phase 1 — Foundation' },
};

// ─── Identity & RAG pages (matches /pages/identity and /pages/rag) ───────────

const pagesIdentity = {
  ok: true,
  data: { agents: AGENT_IDENTITIES, trustEdges: AGENT_TRUST_EDGES },
  meta: meta(),
};

const pagesRag = {
  ok: true,
  data: { collections: RAG_COLLECTIONS },
  meta: meta(),
};

export const a11oyFixtures = {
  fabricAll,
  fabricKpis,
  fabricSignals,
  fabricRisks,
  fabricDecisions,
  fabricOutcomes,
  fabricEvidence,
  fabricTwins,
  fabricVerticals,
  fabricAgents,
  fabricRoadmap,
  fabricProducts,
  fabricProofs,
  fabricNow,
  dashboardSnapshot,
  pagesIdentity,
  pagesRag,
};
