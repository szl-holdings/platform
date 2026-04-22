// QUARANTINED — Pre-existing failure tracked by Task #2898 follow-up. Re-enable
// once the underlying flake/breakage is repaired. Do not delete: the test surface
// is still authoritative for the feature it covers.

/**
 * ATLAS Execution Persistence Test (Task #1838)
 *
 * Proves that ATLAS execution data — signals, evidence, outcomes, and
 * evaluation hooks — is durably stored in PostgreSQL and survives an
 * in-process server restart, and that the replay endpoint correctly
 * rehydrates from the persisted hook.
 *
 * Phases:
 *   1. Phase 1 — bootstrap a fresh app instance, ingest a signal, capture
 *      evidence, record an outcome, and register an evaluation hook through
 *      the public HTTP routes (or the engine, where no public POST surface
 *      exists for evaluation hooks).
 *   2. Restart — drop the Vitest module cache and re-import the router so
 *      the next mount goes through the same module bootstrap a real process
 *      restart would.
 *   3. Phase 2 — bootstrap a brand-new app, fetch every record back over
 *      HTTP by id and by domain query, and assert the values match.
 *   4. Phase 3 — POST the persisted hook id to the replay endpoint and
 *      assert the workflow rehydrates from the stored snapshot, returning
 *      a fresh run plus a new replay-tagged hook.
 *
 * Test isolation:
 *   - All rows use a tenantId / source / workflowId derived from a unique
 *     run-scoped UUID so concurrent runs and existing seed data are never
 *     read or written.
 *   - afterAll deletes only the rows this test created.
 *
 * Skipped if no DATABASE_URL is configured.
 */

import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const HAS_DB = Boolean(process.env.DATABASE_URL);
const d = HAS_DB ? describe : describe.skip;

// ---------------------------------------------------------------------------
// Mock auth so we can drive the real router via HTTP without a session.
// All exercised routes are `authMiddleware({ required: false })`, but the
// router still calls req.user?.* so we provide a stub.
// ---------------------------------------------------------------------------

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    // Mark as an internal service agent so tenant context is not derived from
    // user orgs — the test controls tenantId via the request body directly.
    (req as unknown as { isInternalAgent: boolean }).isInternalAgent = true;
    next();
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireOrgMembership: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// Mount the (currently-loaded) atlas execution router on a fresh Express
// app — equivalent to a fresh server boot from the router's perspective.
async function bootApp() {
  const { default: atlasRouter } = await import('../routes/domain-atlas-execution.js');
  const app = express();
  app.use(express.json());
  app.use(atlasRouter);
  return app;
}

d(
  'ATLAS execution data persists across an in-process server restart (#1838)',
  { timeout: 30_000 },
  () => {
    const runId = randomUUID();
    const DOMAIN = 'aegis';
    const TENANT = `atlas-persistence-${runId}`;
    const WORKFLOW_ID = `wf-${runId}`;

    const PINNED = {
      signal: {
        signalType: 'security-incident',
        severity: 'high' as const,
        title: `Persistence signal ${runId}`,
        description: 'ATLAS execution persistence smoke test signal',
        confidence: 0.91,
        source: `persistence-test-${runId}`,
        payload: { runId, marker: 'atlas-persistence', count: 7 },
        tenantId: TENANT,
      },
      evidence: {
        workflowId: WORKFLOW_ID,
        label: `evidence-${runId}`,
        value: `forensic artifact captured for ${runId}`,
        source: 'atlas-persistence-test',
        capturedBy: 'system',
        immutable: true,
      },
      outcome: {
        workflowId: WORKFLOW_ID,
        title: `Outcome ${runId}`,
        summary: `ATLAS persistence outcome for run ${runId}`,
        status: 'success' as const,
        businessImpact: {
          financialImpactUsd: 12345,
          operationalSeverity: 'medium',
          entitiesAffected: 3,
        },
        recordedBy: 'atlas-persistence-test',
        evidence: [`ev-${runId}`],
        metadata: { runId, marker: 'atlas-persistence' },
      },
      hook: {
        workflowId: WORKFLOW_ID,
        workflowName: `ATLAS Persistence Workflow ${runId}`,
        replayable: true,
        benchmarkMetrics: {
          latencyMs: 4242,
          stepsCompleted: 9,
          stepsFailed: 0,
          policyChecks: 2,
          policiesBlocked: 0,
          evidenceCount: 1,
        },
      },
    };

    // Captured ids from Phase 1 — used to assert direct lookup by id and for
    // targeted cleanup.
    let signalId = '';
    let evidenceId = '';
    let outcomeId = '';
    let hookId = '';

    afterAll(async () => {
      if (!HAS_DB) return;
      const { db, atlasSignalsTable, atlasEvidenceTable, atlasOutcomesTable, atlasRunsTable } =
        await import('@szl-holdings/db');
      const { eq } = await import('drizzle-orm');
      if (signalId) await db.delete(atlasSignalsTable).where(eq(atlasSignalsTable.id, signalId));
      if (evidenceId)
        await db.delete(atlasEvidenceTable).where(eq(atlasEvidenceTable.id, evidenceId));
      if (outcomeId)
        await db.delete(atlasOutcomesTable).where(eq(atlasOutcomesTable.id, outcomeId));
      // Clean up the original hook plus any replay hook produced in phase 3
      // (matched by workflowId prefix is too broad — instead delete by domain+
      // workflowName prefix, which uniquely identifies our run).
      if (hookId) await db.delete(atlasRunsTable).where(eq(atlasRunsTable.id, hookId));
      // Replay hooks are inserted with a generated runId; clean by
      // workflowName prefix to catch them.
      const all = await db.select().from(atlasRunsTable).where(eq(atlasRunsTable.domain, DOMAIN));
      for (const row of all) {
        if (row.workflowName.includes(runId)) {
          await db.delete(atlasRunsTable).where(eq(atlasRunsTable.id, row.id));
        }
      }
    });

    beforeAll(() => {
      if (!HAS_DB) return;
      // Sanity: surface DATABASE_URL presence in test logs so failures are
      // attributable.
    });

    it('Phase 1 — bootstraps the server and writes signal/evidence/outcome/hook', async () => {
      const app = await bootApp();

      // 1) POST /:domain/atlas/signals
      const sigRes = await request(app).post(`/${DOMAIN}/atlas/signals`).send(PINNED.signal);
      expect(sigRes.status).toBe(201);
      expect(sigRes.body?.id).toBeTruthy();
      expect(sigRes.body?.title).toBe(PINNED.signal.title);
      signalId = sigRes.body.id;

      // 2) POST /:domain/atlas/evidence
      const evRes = await request(app).post(`/${DOMAIN}/atlas/evidence`).send(PINNED.evidence);
      expect(evRes.status).toBe(201);
      expect(evRes.body?.id).toBeTruthy();
      expect(evRes.body?.workflowId).toBe(WORKFLOW_ID);
      evidenceId = evRes.body.id;

      // 3) POST /:domain/atlas/outcome
      const ocRes = await request(app).post(`/${DOMAIN}/atlas/outcome`).send(PINNED.outcome);
      expect(ocRes.status).toBe(201);
      expect(ocRes.body?.id).toBeTruthy();
      expect(ocRes.body?.title).toBe(PINNED.outcome.title);
      outcomeId = ocRes.body.id;

      // 4) Evaluation hook — there is no public POST surface for these
      // (they are produced by executedomainWorkflow at the end of a real run),
      // so we register one through the engine using the same path the
      // production code takes.
      const engine = await import('../lib/atlas-execution-engine.js');
      const fakeRun = {
        runId: WORKFLOW_ID,
        definitionId: 'aegis-incident-response',
        status: 'completed',
        startedAt: Date.now() - 4242,
        completedAt: Date.now(),
        steps: [
          { id: 'triage', status: 'completed' },
          { id: 'enrich', status: 'completed' },
        ],
        metadata: { runId, marker: 'atlas-persistence' },
      } as unknown as Parameters<typeof engine.registerEvaluationHook>[0]['runSnapshot'];

      const hook = await engine.registerEvaluationHook({
        domain: DOMAIN,
        workflowId: PINNED.hook.workflowId,
        workflowName: PINNED.hook.workflowName,
        triggerSignalId: signalId,
        replayable: PINNED.hook.replayable,
        signalSnapshot: [
          {
            id: signalId,
            domain: DOMAIN,
            signalType: PINNED.signal.signalType,
            severity: PINNED.signal.severity,
            title: PINNED.signal.title,
            description: PINNED.signal.description,
            confidence: PINNED.signal.confidence,
            source: PINNED.signal.source,
            payload: PINNED.signal.payload,
            status: 'raw',
            tenantId: PINNED.signal.tenantId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        runSnapshot: fakeRun,
        benchmarkMetrics: PINNED.hook.benchmarkMetrics,
      });
      expect(hook.id).toBeTruthy();
      hookId = hook.id;
    });

    it('Restart in-process — drops the module cache so the next import is fresh', async () => {
      vi.resetModules();
      // Re-import to prove module state was reset (a no-op if the import
      // succeeds — the assertion is that the engine functions still resolve
      // their data from the database, which we verify in Phase 2).
      const engine = await import('../lib/atlas-execution-engine.js');
      expect(typeof engine.getEvaluationHookById).toBe('function');
    });

    it('Phase 2 — fresh app reads every record back identically over HTTP', async () => {
      const app = await bootApp();

      // 1) Signal lookup by domain query (GET /:domain/atlas/signals)
      const sigList = await request(app).get(`/${DOMAIN}/atlas/signals?limit=200`);
      expect(sigList.status).toBe(200);
      const signals = (sigList.body?.signals ?? []) as Array<{
        id: string;
        title: string;
        payload: Record<string, unknown>;
        tenantId: string;
        severity: string;
        source: string;
      }>;
      const ourSignal = signals.find((s) => s.id === signalId);
      expect(ourSignal).toBeDefined();
      expect(ourSignal!.title).toBe(PINNED.signal.title);
      expect(ourSignal!.severity).toBe(PINNED.signal.severity);
      expect(ourSignal!.source).toBe(PINNED.signal.source);
      expect(ourSignal!.tenantId).toBe(TENANT);
      expect(ourSignal!.payload).toEqual(PINNED.signal.payload);

      // 2) Evidence lookup by domain + workflowId (GET /:domain/atlas/evidence)
      const evList = await request(app).get(`/${DOMAIN}/atlas/evidence?workflowId=${WORKFLOW_ID}`);
      expect(evList.status).toBe(200);
      const evidence = (evList.body?.evidence ?? []) as Array<{
        id: string;
        label: string;
        value: string;
        workflowId: string;
        immutable: boolean;
      }>;
      const ourEvidence = evidence.find((e) => e.id === evidenceId);
      expect(ourEvidence).toBeDefined();
      expect(ourEvidence!.label).toBe(PINNED.evidence.label);
      expect(ourEvidence!.value).toBe(PINNED.evidence.value);
      expect(ourEvidence!.workflowId).toBe(WORKFLOW_ID);
      expect(ourEvidence!.immutable).toBe(true);

      // 3) Outcome lookup by domain query (GET /:domain/atlas/outcomes)
      const ocList = await request(app).get(`/${DOMAIN}/atlas/outcomes?limit=200`);
      expect(ocList.status).toBe(200);
      const outcomes = (ocList.body?.outcomes ?? []) as Array<{
        id: string;
        title: string;
        summary: string;
        status: string;
        businessImpact?: {
          financialImpactUsd?: number;
          operationalSeverity?: string;
          entitiesAffected?: number;
        };
        metadata?: Record<string, unknown>;
      }>;
      const ourOutcome = outcomes.find((o) => o.id === outcomeId);
      expect(ourOutcome).toBeDefined();
      expect(ourOutcome!.title).toBe(PINNED.outcome.title);
      expect(ourOutcome!.summary).toBe(PINNED.outcome.summary);
      expect(ourOutcome!.status).toBe('success');
      expect(ourOutcome!.businessImpact?.financialImpactUsd).toBe(
        PINNED.outcome.businessImpact.financialImpactUsd,
      );
      expect(ourOutcome!.businessImpact?.operationalSeverity).toBe(
        PINNED.outcome.businessImpact.operationalSeverity,
      );
      expect(ourOutcome!.businessImpact?.entitiesAffected).toBe(
        PINNED.outcome.businessImpact.entitiesAffected,
      );
      expect(ourOutcome!.metadata).toEqual(PINNED.outcome.metadata);

      // 4) Evaluation hook lookup — both by domain query and by id
      const hooksList = await request(app).get(`/${DOMAIN}/atlas/evaluation-hooks`);
      expect(hooksList.status).toBe(200);
      const hooks = (hooksList.body?.hooks ?? []) as Array<{
        id: string;
        workflowId: string;
        workflowName: string;
        replayable: boolean;
        signalSnapshotCount: number;
        benchmarkMetrics?: { latencyMs?: number };
      }>;
      const ourHook = hooks.find((h) => h.id === hookId);
      expect(ourHook).toBeDefined();
      expect(ourHook!.workflowId).toBe(PINNED.hook.workflowId);
      expect(ourHook!.workflowName).toBe(PINNED.hook.workflowName);
      expect(ourHook!.replayable).toBe(true);
      expect(ourHook!.signalSnapshotCount).toBe(1);
      expect(ourHook!.benchmarkMetrics?.latencyMs).toBe(PINNED.hook.benchmarkMetrics.latencyMs);

      // Direct id lookup through the engine (the same path the replay
      // endpoint takes internally).
      const engine = await import('../lib/atlas-execution-engine.js');
      const fetched = await engine.getEvaluationHookById(hookId);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(hookId);
      expect(fetched!.workflowId).toBe(PINNED.hook.workflowId);
      expect(fetched!.signalSnapshot).toHaveLength(1);
      expect(fetched!.signalSnapshot[0].id).toBe(signalId);
      expect(fetched!.signalSnapshot[0].title).toBe(PINNED.signal.title);

      // Direct by-ID retrieval for signal/evidence/outcome through the DB
      // layer (no public GET-by-id endpoint exists for these, so we go
      // through the same Drizzle path the engine uses). Proves each row is
      // individually addressable after restart, not just discoverable via
      // a domain list scan.
      const { db, atlasSignalsTable, atlasEvidenceTable, atlasOutcomesTable } = await import(
        '@szl-holdings/db'
      );
      const { eq } = await import('drizzle-orm');

      const [sigRow] = await db
        .select()
        .from(atlasSignalsTable)
        .where(eq(atlasSignalsTable.id, signalId))
        .limit(1);
      expect(sigRow).toBeDefined();
      expect(sigRow!.title).toBe(PINNED.signal.title);
      expect(sigRow!.tenantId).toBe(TENANT);
      expect(sigRow!.payload).toEqual(PINNED.signal.payload);

      const [evRow] = await db
        .select()
        .from(atlasEvidenceTable)
        .where(eq(atlasEvidenceTable.id, evidenceId))
        .limit(1);
      expect(evRow).toBeDefined();
      expect(evRow!.label).toBe(PINNED.evidence.label);
      expect(evRow!.workflowId).toBe(WORKFLOW_ID);

      const [ocRow] = await db
        .select()
        .from(atlasOutcomesTable)
        .where(eq(atlasOutcomesTable.id, outcomeId))
        .limit(1);
      expect(ocRow).toBeDefined();
      expect(ocRow!.title).toBe(PINNED.outcome.title);
      expect(ocRow!.status).toBe('success');
      expect(ocRow!.financialImpactUsd).toBe(PINNED.outcome.businessImpact.financialImpactUsd);
    });

    it('Phase 3 — replay endpoint rehydrates from the persisted hook', async () => {
      const app = await bootApp();

      const replayRes = await request(app)
        .post(`/${DOMAIN}/atlas/evaluation-hooks/replay`)
        .send({ hookId, isDryRun: true });

      // Replay must succeed and return both the rehydrated run and a new
      // replay-tagged hook id.
      expect(replayRes.status).toBe(201);
      expect(replayRes.body?.replayedHookId).toBe(hookId);
      expect(replayRes.body?.replayHookId).toBeTruthy();
      expect(replayRes.body?.run).toBeTruthy();
      expect(replayRes.body?.run?.runId).toBeTruthy();
      expect(replayRes.body?.benchmarkComparison).toBeTruthy();
      expect(replayRes.body?.benchmarkComparison?.originalLatencyMs).toBe(
        PINNED.hook.benchmarkMetrics.latencyMs,
      );
      expect(typeof replayRes.body?.benchmarkComparison?.replayLatencyMs).toBe('number');

      // Replay run must carry rehydration metadata pointing back at the
      // original persisted hook (proves the replay used persisted state,
      // not in-memory accidental survival).
      const replayRunMeta = (replayRes.body?.run?.metadata ?? {}) as Record<string, unknown>;
      expect(replayRunMeta.replayOf).toBe(hookId);
      expect(replayRunMeta.originalWorkflowId).toBe(PINNED.hook.workflowId);

      // The new replay hook must itself be persisted and retrievable via
      // GET /:domain/atlas/evaluation-hooks.
      const hooksList = await request(app).get(`/${DOMAIN}/atlas/evaluation-hooks`);
      expect(hooksList.status).toBe(200);
      const hooks = (hooksList.body?.hooks ?? []) as Array<{
        id: string;
        workflowName: string;
        replayable: boolean;
      }>;
      const replayHook = hooks.find((h) => h.id === replayRes.body.replayHookId);
      expect(replayHook).toBeDefined();
      expect(replayHook!.workflowName).toContain('[REPLAY]');
      expect(replayHook!.workflowName).toContain(runId);
      expect(replayHook!.replayable).toBe(false);
    });
  },
);
