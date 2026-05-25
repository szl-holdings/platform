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
 * Persistence: backed by Postgres via `@szl-holdings/db`. The formulas,
 * formula_versions, formula_invocations, and formula_tuning_proposals
 * tables ship in migration 0162. Invocations are written through a
 * lightweight async buffer to keep the hot path non-blocking.
 *
 * Source: docs/audits/formulas.md, lib/formulas/src/registry.ts.
 */

import { Router, type Response } from 'express';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  db,
  formulasTable,
  formulaVersionsTable,
  formulaInvocationsTable,
  formulaTuningProposalsTable,
} from '@szl-holdings/db';
import { logger } from '../lib/logger.js';
import {
  FORMULA_REGISTRY,
  getFormula,
  setInvocationSink,
  evaluateObservedEvent,
  driftDetector,
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

// ─── Invocation write buffer ─────────────────────────────────────────
// Invocations can fire at high frequency from instrumented hot paths.
// We buffer them in-process and flush in small batches so a single
// hot-path call never awaits a DB round-trip. Failure to flush is logged
// at debug-level — losing a few telemetry rows must never break the
// app, and the proof-ledger is the system-of-record for anything that
// matters.

type InvocationRow = typeof formulaInvocationsTable.$inferInsert;

const INVOCATION_FLUSH_INTERVAL_MS = 2_000;
const INVOCATION_FLUSH_BATCH_MAX = 200;
const invocationBuffer: InvocationRow[] = [];

function toInvocationRow(inv: FormulaInvocation): InvocationRow {
  return {
    formulaId: inv.formulaId,
    version: inv.version,
    inputHash: inv.inputHash,
    outputHash: inv.outputHash,
    caller: inv.caller ?? null,
    durationMs: String(inv.durationMs),
    metadata: inv.meta ?? null,
    invokedAt: new Date(inv.ts),
  };
}

async function flushInvocationBuffer(): Promise<void> {
  if (invocationBuffer.length === 0) return;
  const batch = invocationBuffer.splice(0, INVOCATION_FLUSH_BATCH_MAX);
  try {
    await db.insert(formulaInvocationsTable).values(batch);
  } catch (e) {
    logger.warn(
      { err: e, dropped: batch.length },
      '[a11oy-formulas] invocation flush failed (rows dropped)',
    );
  }
}

const _flushTimer = setInterval(() => {
  void flushInvocationBuffer();
}, INVOCATION_FLUSH_INTERVAL_MS);
_flushTimer.unref?.();

// Wire the invocation sink — buffer to DB and forward observed-vs-baseline
// metadata to the ROSIE drift detector for the scheduled evolution loop.
setInvocationSink((inv) => {
  invocationBuffer.push(toInvocationRow(inv));
  if (invocationBuffer.length >= INVOCATION_FLUSH_BATCH_MAX) {
    void flushInvocationBuffer();
  }
  // Lazy import to avoid a circular load at module init.
  import('../jobs/rosie-evolution-loop.js')
    .then(({ formulaInvocationDriftBridge }) => formulaInvocationDriftBridge(inv))
    .catch(() => {
      // Drift bridge failures must never break the invocation hot path.
    });
});

// ─── Registry seeding ────────────────────────────────────────────────
// Idempotent: inserts the canonical registry into `formulas` and seeds
// an initial row into `formula_versions` per formula. Safe to run on
// every boot — ON CONFLICT clauses make this a no-op after first boot.
async function seedRegistry(): Promise<void> {
  try {
    for (const f of FORMULA_REGISTRY) {
      const defaults = Object.fromEntries(f.parameters.map((p) => [p.name, p.default]));
      await db
        .insert(formulasTable)
        .values({
          formulaId: f.id,
          name: f.name,
          domain: f.domain,
          currentVersion: f.version,
          description: f.description,
          provenance: f.provenance as typeof formulasTable.$inferInsert['provenance'],
          parameters: defaults,
          consumers: [...f.consumers],
          inputShape: f.inputShape,
          outputShape: f.outputShape,
        })
        .onConflictDoNothing({ target: formulasTable.formulaId });

      // Seed an initial version row if none exists for this formula.
      const existing = await db
        .select({ id: formulaVersionsTable.id })
        .from(formulaVersionsTable)
        .where(eq(formulaVersionsTable.formulaId, f.id))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(formulaVersionsTable).values({
          formulaId: f.id,
          version: f.version,
          parameters: defaults,
          note: 'initial version (seeded from registry)',
        });
      }
    }
  } catch (e) {
    logger.warn({ err: e }, '[a11oy-formulas] registry seed failed (non-fatal)');
  }
}

void seedRegistry();

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

publicRouter.get('/a11oy/formulas/invocations/:id', async (req, res) => {
  try {
    const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50));
    const offset = Math.max(0, parseInt(String(req.query.offset ?? '0'), 10) || 0);
    // Flush pending writes so the most recent invocations are queryable
    // immediately after they are emitted (esp. useful in tests / demos).
    await flushInvocationBuffer();
    const where = eq(formulaInvocationsTable.formulaId, req.params.id);
    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(formulaInvocationsTable)
        .where(where)
        .orderBy(desc(formulaInvocationsTable.invokedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(formulaInvocationsTable)
        .where(where),
    ]);
    const results = rows.map((r) => ({
      formulaId: r.formulaId,
      version: r.version,
      ts: r.invokedAt.toISOString(),
      inputHash: r.inputHash,
      outputHash: r.outputHash,
      caller: r.caller ?? undefined,
      durationMs: r.durationMs == null ? 0 : Number(r.durationMs),
      meta: (r.metadata ?? undefined) as Record<string, unknown> | undefined,
    }));
    ok(res, { results, total: count, limit, offset });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-formulas] invocations');
    err(res, 500, 'Failed to load invocations.');
  }
});

publicRouter.get('/a11oy/formulas/history/:id', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(formulaVersionsTable)
      .where(eq(formulaVersionsTable.formulaId, req.params.id))
      .orderBy(desc(formulaVersionsTable.createdAt));
    const history = rows.map((r) => ({
      version: r.version,
      parameters: r.parameters,
      note: r.note ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
    ok(res, { history });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-formulas] history');
    err(res, 500, 'Failed to load version history.');
  }
});

function proposalDto(row: typeof formulaTuningProposalsTable.$inferSelect) {
  return {
    id: row.id,
    formulaId: row.formulaId,
    fromVersion: row.fromVersion,
    parameter: row.parameter,
    oldValue: Number(row.oldValue),
    newValue: Number(row.newValue),
    proposalScore: Number(row.proposalScore),
    rationale: row.rationale,
    evidence: row.evidence,
    proposedBy: row.proposedBy,
    status: row.status,
    decidedAt: row.decidedAt?.toISOString(),
    decisionNote: row.decisionNote ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

const PROPOSAL_STATUSES = ['pending', 'approved', 'rejected', 'superseded'] as const;
type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

publicRouter.get('/a11oy/formulas/drift-buckets', (_req, res) => {
  try {
    const buckets = driftDetector.inspectBuckets();
    ok(res, {
      buckets,
      thresholds: driftDetector.thresholds,
      bucketCount: buckets.length,
      firingCount: buckets.filter((b) => b.willFire).length,
    });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-formulas] drift-buckets');
    err(res, 500, 'Failed to load drift buckets.');
  }
});

publicRouter.get('/a11oy/formulas/proposals', async (req, res) => {
  try {
    let status: ProposalStatus | undefined;
    if (req.query.status !== undefined) {
      const raw = String(req.query.status);
      if (!(PROPOSAL_STATUSES as readonly string[]).includes(raw)) {
        return err(
          res,
          400,
          `Invalid status "${raw}". Expected one of: ${PROPOSAL_STATUSES.join(', ')}.`,
        );
      }
      status = raw as ProposalStatus;
    }
    const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit ?? '100'), 10) || 100));
    const offset = Math.max(0, parseInt(String(req.query.offset ?? '0'), 10) || 0);
    const filter = status
      ? eq(formulaTuningProposalsTable.status, status)
      : undefined;

    const [rows, [{ count: total }], statusCounts] = await Promise.all([
      filter
        ? db
            .select()
            .from(formulaTuningProposalsTable)
            .where(filter)
            .orderBy(desc(formulaTuningProposalsTable.createdAt))
            .limit(limit)
            .offset(offset)
        : db
            .select()
            .from(formulaTuningProposalsTable)
            .orderBy(desc(formulaTuningProposalsTable.createdAt))
            .limit(limit)
            .offset(offset),
      filter
        ? db
            .select({ count: sql<number>`count(*)::int` })
            .from(formulaTuningProposalsTable)
            .where(filter)
        : db
            .select({ count: sql<number>`count(*)::int` })
            .from(formulaTuningProposalsTable),
      db
        .select({
          status: formulaTuningProposalsTable.status,
          count: sql<number>`count(*)::int`,
        })
        .from(formulaTuningProposalsTable)
        .groupBy(formulaTuningProposalsTable.status),
    ]);

    const byStatus: Record<string, number> = {};
    for (const r of statusCounts) byStatus[r.status] = r.count;

    ok(res, {
      total,
      proposals: rows.map(proposalDto),
      byStatus,
      limit,
      offset,
    });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-formulas] proposals');
    err(res, 500, 'Failed to load proposals.');
  }
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
export async function proposeTuningInProcess(
  body: Record<string, unknown>,
): Promise<ProposeTuningInProcessResult> {
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

    const [inserted] = await db
      .insert(formulaTuningProposalsTable)
      .values({
        formulaId: decision.proposal.formulaId,
        fromVersion: decision.proposal.fromVersion,
        parameter: decision.proposal.parameter,
        oldValue: String(decision.proposal.oldValue),
        newValue: String(decision.proposal.newValue),
        proposalScore: String(decision.proposal.score),
        rationale: decision.proposal.rationale,
        evidence: decision.proposal.evidence,
        proposedBy: 'rosie',
        status: 'pending',
      })
      .returning();

    return {
      status: 200,
      envelope: {
        ok: true,
        data: { accepted: true, proposal: proposalDto(inserted) },
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

protectedRouter.post('/a11oy/formulas/propose-tuning', async (req, res) => {
  const result = await proposeTuningInProcess((req.body ?? {}) as Record<string, unknown>);
  res.status(result.status).json(result.envelope);
});

function bumpVersion(v: string): string {
  const parts = v.split('.').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return `${v}+1`;
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

async function decide(
  id: number,
  status: 'approved' | 'rejected',
  note?: string,
): Promise<ReturnType<typeof proposalDto> | null> {
  // Run the whole decision — proposal status update, version insert,
  // and formula parameter mirror — inside one transaction so a mid-way
  // failure can never leave an approved proposal without its version
  // row / current parameter snapshot.
  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(formulaTuningProposalsTable)
      .where(eq(formulaTuningProposalsTable.id, id))
      .limit(1);
    if (!existing) return null;
    if (existing.status !== 'pending') return proposalDto(existing);

    // Conditional UPDATE guards against concurrent decisions across replicas.
    const [updated] = await tx
      .update(formulaTuningProposalsTable)
      .set({
        status,
        decidedAt: new Date(),
        decisionNote: note ?? null,
      })
      .where(
        and(
          eq(formulaTuningProposalsTable.id, id),
          eq(formulaTuningProposalsTable.status, 'pending'),
        ),
      )
      .returning();
    if (!updated) {
      const [snapshot] = await tx
        .select()
        .from(formulaTuningProposalsTable)
        .where(eq(formulaTuningProposalsTable.id, id))
        .limit(1);
      return snapshot ? proposalDto(snapshot) : null;
    }

    if (status === 'approved') {
      const [latestVersion] = await tx
        .select()
        .from(formulaVersionsTable)
        .where(eq(formulaVersionsTable.formulaId, updated.formulaId))
        .orderBy(desc(formulaVersionsTable.createdAt))
        .limit(1);

      const [formulaRow] = await tx
        .select()
        .from(formulasTable)
        .where(eq(formulasTable.formulaId, updated.formulaId))
        .limit(1);

      const registryEntry = getFormula(updated.formulaId);
      const baselineParams: Record<string, number> =
        latestVersion?.parameters ??
        formulaRow?.parameters ??
        (registryEntry
          ? Object.fromEntries(registryEntry.parameters.map((p) => [p.name, p.default]))
          : {});

      const nextParams = { ...baselineParams, [updated.parameter]: Number(updated.newValue) };
      const nextVersion = bumpVersion(latestVersion?.version ?? updated.fromVersion);

      await tx.insert(formulaVersionsTable).values({
        formulaId: updated.formulaId,
        version: nextVersion,
        parameters: nextParams,
        note: `tuning #${updated.id}: ${updated.rationale.slice(0, 200)}`,
      });

      await tx
        .update(formulasTable)
        .set({
          parameters: nextParams,
          currentVersion: nextVersion,
          updatedAt: new Date(),
        })
        .where(eq(formulasTable.formulaId, updated.formulaId));
    }

    return proposalDto(updated);
  });
}

protectedRouter.post('/a11oy/formulas/approve-tuning/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await decide(id, 'approved', String(req.body?.note ?? ''));
    if (!result) return err(res, 404, `Proposal ${id} not found.`);
    ok(res, result);
  } catch (e) {
    logger.error({ err: e }, '[a11oy-formulas] approve-tuning');
    err(res, 500, 'Failed to approve proposal.');
  }
});

protectedRouter.post('/a11oy/formulas/reject-tuning/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await decide(id, 'rejected', String(req.body?.note ?? ''));
    if (!result) return err(res, 404, `Proposal ${id} not found.`);
    ok(res, result);
  } catch (e) {
    logger.error({ err: e }, '[a11oy-formulas] reject-tuning');
    err(res, 500, 'Failed to reject proposal.');
  }
});

export const a11oyFormulasPublicRouter = publicRouter;
export const a11oyFormulasProtectedRouter = protectedRouter;
