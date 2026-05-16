/**
 * A11oy Formulas API — backs the /formulas Codex surface.
 *
 * Public reads:
 *   GET  /a11oy/formulas/catalog
 *   GET  /a11oy/formulas/detail/:id
 *   GET  /a11oy/formulas/invocations/:id
 *   GET  /a11oy/formulas/history/:id
 *   GET  /a11oy/formulas/proposals
 *
 * Protected mutations (mounted after guardianPolicyCheck):
 *   POST /a11oy/formulas/propose-tuning
 *   POST /a11oy/formulas/approve-tuning/:id
 *   POST /a11oy/formulas/reject-tuning/:id
 *
 * Source: docs/audits/formulas.md, lib/formulas/src/registry.ts.
 */

import { Router, type Response } from 'express';
import { logger } from '../lib/logger.js';
import {
  FORMULA_REGISTRY,
  getFormula,
  setInvocationSink,
  evaluateObservedEvent,
  type FormulaInvocation,
  type ObservedEvent,
} from '@szl-holdings/formulas';

const publicRouter = Router();
const protectedRouter = Router();

function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ ok: true, data, meta: { ...meta, timestamp: new Date().toISOString() } });
}
function err(res: Response, status: number, message: string) {
  res.status(status).json({ ok: false, error: { message, retryable: false } });
}

// ─── Lightweight in-memory stores ────────────────────────────────────
// The Drizzle tables ship in migration 0162; this module keeps an
// in-memory mirror so the API works without DB writes during demo /
// agent-gateway boot. Persistence wires up in a follow-up task.
type ProposalRow = {
  id: number;
  formulaId: string;
  fromVersion: string;
  parameter: string;
  oldValue: number;
  newValue: number;
  proposalScore: number;
  rationale: string;
  evidence: { samples: number; gap: number; drift: number; thesisCitation: string };
  proposedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  decidedAt?: string;
  decisionNote?: string;
  createdAt: string;
};

const invocations: FormulaInvocation[] = [];
const MAX_INVOCATIONS = 5000;
const proposals: ProposalRow[] = [];
let nextProposalId = 1;
const versionHistory = new Map<string, Array<{ version: string; parameters: Record<string, number>; note?: string; createdAt: string }>>();

// Wire the in-memory invocation sink so any caller using `instrument()`
// will surface invocations on the /invocations endpoint immediately and
// — when the invocation carries observed-vs-baseline metadata — feed
// the ROSIE drift detector for the scheduled evolution loop.
setInvocationSink((inv) => {
  invocations.push(inv);
  if (invocations.length > MAX_INVOCATIONS) invocations.splice(0, invocations.length - MAX_INVOCATIONS);
  // Lazy import to avoid a circular load at module init.
  import('../jobs/rosie-evolution-loop.js')
    .then(({ formulaInvocationDriftBridge }) => formulaInvocationDriftBridge(inv))
    .catch(() => {
      // Drift bridge failures must never break the invocation hot path.
    });
});

// Seed initial version history from the registry so /history is non-empty.
for (const f of FORMULA_REGISTRY) {
  versionHistory.set(f.id, [
    {
      version: f.version,
      parameters: Object.fromEntries(f.parameters.map((p) => [p.name, p.default])),
      note: 'initial version (seeded from registry)',
      createdAt: new Date().toISOString(),
    },
  ]);
}

function summarise(f: typeof FORMULA_REGISTRY[number]) {
  return {
    id: f.id,
    name: f.name,
    domain: f.domain,
    version: f.version,
    description: f.description,
    provenance: f.provenance,
    parameters: f.parameters,
    consumers: f.consumers,
    inputShape: f.inputShape,
    outputShape: f.outputShape,
  };
}

publicRouter.get('/a11oy/formulas/catalog', (_req, res) => {
  try {
    const byDomain: Record<string, number> = {};
    for (const f of FORMULA_REGISTRY) byDomain[f.domain] = (byDomain[f.domain] ?? 0) + 1;
    ok(res, {
      total: FORMULA_REGISTRY.length,
      byDomain,
      entries: FORMULA_REGISTRY.map(summarise),
    });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-formulas] catalog');
    err(res, 500, 'Failed to load formula catalog.');
  }
});

publicRouter.get('/a11oy/formulas/detail/:id', (req, res) => {
  const f = getFormula(req.params.id);
  if (!f) return err(res, 404, `Formula "${req.params.id}" not found.`);
  ok(res, summarise(f));
});

publicRouter.get('/a11oy/formulas/invocations/:id', (req, res) => {
  const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50));
  const filtered = invocations.filter((i) => i.formulaId === req.params.id).slice(-limit).reverse();
  ok(res, { results: filtered, total: filtered.length });
});

publicRouter.get('/a11oy/formulas/history/:id', (req, res) => {
  const hist = versionHistory.get(req.params.id) ?? [];
  ok(res, { history: [...hist].reverse() });
});

publicRouter.get('/a11oy/formulas/proposals', (req, res) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  const filtered = status ? proposals.filter((p) => p.status === status) : proposals;
  ok(res, {
    total: filtered.length,
    proposals: [...filtered].reverse(),
    byStatus: proposals.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {}),
  });
});

export interface ProposeTuningInProcessResult {
  status: number;
  envelope:
    | { ok: true; data: unknown; meta: Record<string, unknown> }
    | { ok: false; error: { message: string; retryable: boolean } };
}

/**
 * Programmatic in-process equivalent of the POST handler. Used by the
 * scheduled ROSIE evolution loop so server-side ticks don't need to
 * make a loopback HTTP request (and re-enter CSRF/auth middleware).
 */
export function proposeTuningInProcess(
  body: Record<string, unknown>,
): ProposeTuningInProcessResult {
  try {
    const partial = body as Partial<ObservedEvent>;
    if (!partial.formulaId || typeof partial.parameter !== 'string') {
      return {
        status: 400,
        envelope: { ok: false, error: { message: 'formulaId and parameter are required.', retryable: false } },
      };
    }
    const f = getFormula(partial.formulaId);
    if (!f) {
      return {
        status: 404,
        envelope: { ok: false, error: { message: `Formula "${partial.formulaId}" not found.`, retryable: false } },
      };
    }
    const param = f.parameters.find((p) => p.name === partial.parameter);
    if (!param) {
      return {
        status: 400,
        envelope: { ok: false, error: { message: `Parameter "${partial.parameter}" not found on ${f.id}.`, retryable: false } },
      };
    }
    const event: ObservedEvent = {
      formulaId: partial.formulaId,
      fromVersion: partial.fromVersion ?? f.version,
      parameter: partial.parameter,
      oldValue: partial.oldValue ?? param.default,
      candidateValue: Number(partial.candidateValue ?? param.default),
      observedGap: Number(partial.observedGap ?? 0),
      samples: Number(partial.samples ?? 0),
      driftSamples: partial.driftSamples,
      irreversibility: partial.irreversibility ?? 0,
      thesisCitation: partial.thesisCitation ?? `${f.provenance.thesisDoc} ${f.provenance.thesisSection}`,
    };
    const decision = evaluateObservedEvent(event);
    if (decision.kind === 'noop') {
      return {
        status: 200,
        envelope: {
          ok: true,
          data: { accepted: false, reason: decision.reason },
          meta: { timestamp: new Date().toISOString() },
        },
      };
    }
    const row: ProposalRow = {
      id: nextProposalId++,
      formulaId: decision.proposal.formulaId,
      fromVersion: decision.proposal.fromVersion,
      parameter: decision.proposal.parameter,
      oldValue: decision.proposal.oldValue,
      newValue: decision.proposal.newValue,
      proposalScore: decision.proposal.score,
      rationale: decision.proposal.rationale,
      evidence: decision.proposal.evidence,
      proposedBy: 'rosie',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    proposals.push(row);
    return {
      status: 200,
      envelope: {
        ok: true,
        data: { accepted: true, proposal: row },
        meta: { timestamp: new Date().toISOString() },
      },
    };
  } catch (e) {
    logger.error({ err: e }, '[a11oy-formulas] propose-tuning (in-process)');
    return {
      status: 500,
      envelope: { ok: false, error: { message: 'Failed to record tuning proposal.', retryable: false } },
    };
  }
}

protectedRouter.post('/a11oy/formulas/propose-tuning', (req, res) => {
  const result = proposeTuningInProcess((req.body ?? {}) as Record<string, unknown>);
  res.status(result.status).json(result.envelope);
});

function decide(id: number, status: 'approved' | 'rejected', note?: string) {
  const p = proposals.find((row) => row.id === id);
  if (!p) return null;
  if (p.status !== 'pending') return p;
  p.status = status;
  p.decidedAt = new Date().toISOString();
  p.decisionNote = note;
  if (status === 'approved') {
    const hist = versionHistory.get(p.formulaId) ?? [];
    const last = hist[hist.length - 1];
    const params = { ...(last?.parameters ?? {}), [p.parameter]: p.newValue };
    const next = bumpVersion(last?.version ?? p.fromVersion);
    hist.push({ version: next, parameters: params, note: `tuning #${p.id}: ${p.rationale.slice(0, 200)}`, createdAt: new Date().toISOString() });
    versionHistory.set(p.formulaId, hist);
  }
  return p;
}

function bumpVersion(v: string): string {
  const parts = v.split('.').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return `${v}+1`;
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

protectedRouter.post('/a11oy/formulas/approve-tuning/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = decide(id, 'approved', String(req.body?.note ?? ''));
  if (!result) return err(res, 404, `Proposal ${id} not found.`);
  ok(res, result);
});

protectedRouter.post('/a11oy/formulas/reject-tuning/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = decide(id, 'rejected', String(req.body?.note ?? ''));
  if (!result) return err(res, 404, `Proposal ${id} not found.`);
  ok(res, result);
});

export const a11oyFormulasPublicRouter = publicRouter;
export const a11oyFormulasProtectedRouter = protectedRouter;
