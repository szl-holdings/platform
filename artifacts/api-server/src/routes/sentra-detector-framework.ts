/**
 * Sentra detector framework — registry, runs, findings, resolution.
 *
 * Routes:
 *   GET    /api/sentra/detectors
 *   POST   /api/sentra/detectors/register      — sidecar handshake
 *   POST   /api/sentra/detectors/:id/run
 *   GET    /api/sentra/findings
 *   POST   /api/sentra/findings/:id/resolve
 *   GET    /api/sentra/detector-runs
 *
 * Every mutating route appends a row to a per-detector `ReceiptChain`
 * from `@szl-holdings/szl-receipts` and stores the resulting SHA-256
 * receipt id on the run / finding row so investors can audit the path
 * "telemetry → detector → finding → workcell".
 *
 * AMARU_HOOK: severity classification / cortex enrichment will land
 * here. Today the framework just trusts the detector-emitted severity.
 */
import { randomUUID } from 'node:crypto';
import {
  db,
  sentraDetectorRunsTable,
  sentraDetectorsTable,
  sentraFindingsTable,
} from '@szl-holdings/db';
import {
  type DetectorManifest,
  type Finding,
  type FindingSeverity,
  detectorManifestSchema,
  shouldHandoff,
  sidecarRegisterRequestSchema,
  sidecarRunRequestSchema,
  sidecarRunResponseSchema,
} from '@szl-holdings/sentra-detector-sdk';
import { ReceiptChain } from '@szl-holdings/szl-receipts';
import { and, desc, eq, gte } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  parsePagination,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../lib/validation';
import {
  emptyContextRead,
  runTsDetector,
  sentraDetectorRegistry,
} from '../lib/sentra-detector-registry';
import {
  type ClassifiedFinding,
  classifyFindings,
} from '../lib/sentra-amaru-classifier';

const router: IRouter = Router();

// ────────────────────────────────────────────────────────────────────────
// Receipt chain per detector — in-memory; the chain's selfHash is what
// we persist on every run/finding so cross-restart audit is preserved.
// ────────────────────────────────────────────────────────────────────────
const chains = new Map<string, ReceiptChain>();
function chainFor(detectorId: string): ReceiptChain {
  let c = chains.get(detectorId);
  if (!c) {
    c = new ReceiptChain({ operatorId: `sentra/detector/${detectorId}` });
    chains.set(detectorId, c);
  }
  return c;
}

// ────────────────────────────────────────────────────────────────────────
// Persistence helpers
// ────────────────────────────────────────────────────────────────────────

/**
 * Allowlist for sidecar callback URLs. Without this gate, an
 * authenticated caller registering a Python detector could point
 * `sidecarBaseUrl` at an arbitrary host and turn `/sentra/detectors/:id/run`
 * into an SSRF gadget. We require loopback by default and allow
 * operators to add additional hosts via `SENTRA_SIDECAR_ALLOWED_HOSTS`
 * (comma-separated host[:port] list).
 */
function isSidecarBaseUrlAllowed(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  const hostPort = url.port ? `${host}:${url.port}` : host;
  const loopback =
    host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '[::1]';
  if (loopback) return true;
  const extra = (process.env.SENTRA_SIDECAR_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return extra.includes(host) || extra.includes(hostPort);
}

async function upsertDetector(
  manifest: DetectorManifest,
  sidecarBaseUrl?: string,
): Promise<{ chainReceiptId: string }> {
  if (sidecarBaseUrl && !isSidecarBaseUrlAllowed(sidecarBaseUrl)) {
    throw new Error(
      `Refusing to register detector ${manifest.id}: sidecarBaseUrl "${sidecarBaseUrl}" is not in the allowlist (loopback only by default; extend via SENTRA_SIDECAR_ALLOWED_HOSTS).`,
    );
  }
  // Append a registration receipt to this detector's chain so the
  // registration write is auditable alongside subsequent runs and
  // findings. Spec: "every write emits a receipt".
  const chain = chainFor(manifest.id);
  const receipt = await chain.append({
    kind: 'sentra.detector.register',
    detectorId: manifest.id,
    runtime: manifest.runtime,
    version: manifest.version ?? null,
    sidecarBaseUrl: sidecarBaseUrl ?? null,
    at: new Date().toISOString(),
  });
  const row = {
    id: manifest.id,
    label: manifest.label,
    description: manifest.description,
    kind: manifest.kind,
    runtime: manifest.runtime,
    inputs: manifest.inputs ?? [],
    costClass: manifest.costClass,
    governanceClass: manifest.governanceClass,
    attackTechniques: manifest.attackTechniques ?? null,
    version: manifest.version ?? null,
    sidecarBaseUrl: sidecarBaseUrl ?? null,
    chainReceiptId: receipt.selfHash,
    lastSeenAt: new Date(),
  } as const;
  await db
    .insert(sentraDetectorsTable)
    .values(row)
    .onConflictDoUpdate({
      target: sentraDetectorsTable.id,
      set: {
        label: row.label,
        description: row.description,
        kind: row.kind,
        runtime: row.runtime,
        inputs: row.inputs,
        costClass: row.costClass,
        governanceClass: row.governanceClass,
        attackTechniques: row.attackTechniques,
        version: row.version,
        sidecarBaseUrl: row.sidecarBaseUrl,
        chainReceiptId: row.chainReceiptId,
        lastSeenAt: row.lastSeenAt,
      },
    });
  return { chainReceiptId: receipt.selfHash };
}

function rowToManifest(row: typeof sentraDetectorsTable.$inferSelect): DetectorManifest & {
  enabled: boolean;
  sidecarBaseUrl: string | null;
  chainReceiptId: string | null;
  registeredAt: string;
  lastSeenAt: string;
} {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    kind: row.kind,
    runtime: row.runtime,
    inputs: row.inputs ?? [],
    costClass: row.costClass,
    governanceClass: row.governanceClass,
    attackTechniques: row.attackTechniques ?? undefined,
    version: row.version ?? undefined,
    enabled: row.enabled === 'true',
    sidecarBaseUrl: row.sidecarBaseUrl,
    chainReceiptId: row.chainReceiptId ?? null,
    registeredAt: row.registeredAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
  };
}

function severityToBps(score: number): number {
  return Math.max(0, Math.min(10_000, Math.round(score * 10_000)));
}

function bpsToScore(bps: number): number {
  return Math.max(0, Math.min(1, bps / 10_000));
}

async function persistFindings(opts: {
  detectorId: string;
  runId: string;
  classified: ClassifiedFinding[];
  chainReceiptId: string;
}) {
  if (opts.classified.length === 0) return [];
  const rows = opts.classified.map((c) => {
    const f = c.finding;
    return {
      id: f.id,
      detectorId: opts.detectorId,
      runId: opts.runId,
      severity: f.severity,
      score: severityToBps(f.score),
      title: f.title,
      summary: f.summary,
      attackTechniques: f.attackTechniques ?? null,
      affectedAssets: f.affectedAssets ?? [],
      evidence: f.evidence ?? {},
      recommendedAction: f.recommendedAction ?? null,
      governanceClass: f.governanceClass,
      chainReceiptId: opts.chainReceiptId,
      amaruClassifiedAt: new Date(c.classifiedAt),
      amaruOriginalSeverity: c.originalSeverity ?? null,
      amaruOriginalScore: c.originalScoreBps ?? null,
      amaruClassification: c.classification,
      emittedAt: new Date(f.emittedAt),
    };
  });
  await db.insert(sentraFindingsTable).values(rows).onConflictDoNothing();
  return rows;
}

async function maybeHandoff(findings: Finding[]) {
  const escalate = findings.find((f) => shouldHandoff(f.severity));
  if (!escalate) return;
  try {
    // Import lazily so the framework doesn't pull a11oy-orchestration into
    // unit tests that don't need it.
    const { crossProductHandoff } = await import('@workspace/a11oy-orchestration/client');
    await crossProductHandoff({
      sourceProduct: 'sentra',
      destProduct: 'a11oy',
      title: `Sentra finding ${escalate.id} — ${escalate.severity}`,
      summary: escalate.title,
      deepLink: `/sentra/alerts?finding=${escalate.id}`,
      payload: {
        findingId: escalate.id,
        detectorId: escalate.detectorId,
        severity: escalate.severity,
        governanceClass: escalate.governanceClass,
      },
    });
  } catch (err) {
    logger.debug({ err }, '[sentra-detector] crossProductHandoff unavailable in this build');
  }
}

// ────────────────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────────────────

router.get('/sentra/detectors', async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(sentraDetectorsTable);
    sendSuccess(res, { detectors: rows.map(rowToManifest) });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list detectors');
  }
});

/**
 * Observability surface for the Python sidecar fleet. Returns one
 * entry per distinct `sidecarBaseUrl` last seen registering a detector,
 * with the set of detector ids it owns and the freshest `lastSeenAt`.
 * Operators rely on this to confirm that the production sidecar (a)
 * is still heartbeating and (b) is the one currently authoritative
 * for a given detector id — important during rolling sidecar restarts
 * where the most-recent registration wins.
 */
router.get('/sentra/sidecars', async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(sentraDetectorsTable)
      .where(eq(sentraDetectorsTable.runtime, 'python'));
    const byBaseUrl = new Map<
      string,
      {
        sidecarBaseUrl: string;
        detectorIds: string[];
        lastSeenAt: string;
        registeredAt: string;
        chainReceiptIds: string[];
      }
    >();
    for (const r of rows) {
      const key = r.sidecarBaseUrl ?? '<none>';
      const cur = byBaseUrl.get(key);
      if (cur) {
        cur.detectorIds.push(r.id);
        if (r.lastSeenAt.toISOString() > cur.lastSeenAt) {
          cur.lastSeenAt = r.lastSeenAt.toISOString();
        }
        if (r.chainReceiptId) cur.chainReceiptIds.push(r.chainReceiptId);
      } else {
        byBaseUrl.set(key, {
          sidecarBaseUrl: key,
          detectorIds: [r.id],
          lastSeenAt: r.lastSeenAt.toISOString(),
          registeredAt: r.registeredAt.toISOString(),
          chainReceiptIds: r.chainReceiptId ? [r.chainReceiptId] : [],
        });
      }
    }
    const now = Date.now();
    const sidecars = Array.from(byBaseUrl.values()).map((s) => ({
      ...s,
      ageSeconds: Math.round((now - new Date(s.lastSeenAt).getTime()) / 1000),
    }));
    sendSuccess(res, { sidecars });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list sidecars');
  }
});

const registerBodySchema = z.object({
  manifest: detectorManifestSchema,
  sidecarBaseUrl: z.string().url().optional(),
});

router.post(
  '/sentra/detectors/register',
  authMiddleware(),
  validateBody(registerBodySchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof registerBodySchema>;
      const { chainReceiptId } = await upsertDetector(body.manifest, body.sidecarBaseUrl);
      sendCreated(res, { ok: true, detectorId: body.manifest.id, chainReceiptId });
    } catch (err) {
      handleRouteError(res, err, 'Failed to register detector');
    }
  },
);

/**
 * The sidecar registration handshake is gated by a shared loopback
 * secret, NOT by user auth, because the sidecar boots before any user
 * session exists. The default secret is bound to localhost; operators
 * override `SENTRA_SIDECAR_SHARED_SECRET` to deploy off-host (paired
 * with `SENTRA_SIDECAR_ALLOWED_HOSTS`).
 */
function checkSidecarSecret(req: Request, res: Response): boolean {
  const expected =
    process.env.SENTRA_SIDECAR_SHARED_SECRET ?? 'sentra-sidecar-loopback-dev';
  const got =
    req.header('x-sentra-sidecar-secret') ?? req.header('X-Sentra-Sidecar-Secret');
  if (!got || got !== expected) {
    res.status(401).json({ error: 'sidecar handshake rejected: invalid or missing shared secret' });
    return false;
  }
  return true;
}

router.post(
  '/sentra/detectors/sidecar-register',
  validateBody(sidecarRegisterRequestSchema),
  async (req: Request, res: Response) => {
    if (!checkSidecarSecret(req, res)) return;
    try {
      const body = req.body as z.infer<typeof sidecarRegisterRequestSchema>;
      const receipts: Array<{ detectorId: string; chainReceiptId: string }> = [];
      for (const m of body.detectors) {
        const { chainReceiptId } = await upsertDetector(m, body.baseUrl);
        receipts.push({ detectorId: m.id, chainReceiptId });
      }
      sendCreated(res, {
        ok: true,
        sidecarId: body.sidecarId,
        registered: body.detectors.map((d) => d.id),
        receipts,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to register sidecar');
    }
  },
);

const runBodySchema = z.object({
  triggeredBy: z.string().optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  /** Optional inline inputs to pass to python detectors. */
  inputs: z.record(z.string(), z.array(z.unknown())).optional(),
});

router.post(
  '/sentra/detectors/:id/run',
  validateBody(runBodySchema),
  async (req: Request, res: Response) => {
    const detectorId = req.params.id;
    if (!detectorId) {
      sendNotFound(res, 'Detector');
      return;
    }
    const body = req.body as z.infer<typeof runBodySchema>;
    try {
      const [detRow] = await db
        .select()
        .from(sentraDetectorsTable)
        .where(eq(sentraDetectorsTable.id, detectorId))
        .limit(1);
      if (!detRow) {
        sendNotFound(res, 'Detector');
        return;
      }
      const manifest = rowToManifest(detRow);
      const runId = randomUUID();
      const startedAt = new Date();
      const triggeredBy = body.triggeredBy ?? (req.user?.email ?? 'system');
      const params = body.params ?? {};

      let findings: Finding[] = [];
      let trace: Array<{ ts: string; msg: string; data?: Record<string, unknown> }> = [];
      let status: 'ok' | 'error' = 'ok';
      let errorMessage: string | undefined;

      try {
        if (manifest.runtime === 'ts') {
          const detector = sentraDetectorRegistry.get(detectorId);
          if (!detector) throw new Error(`TS detector "${detectorId}" not registered in-process`);
          // Wire inline `body.inputs` into `ctx.read(name)` so TS
          // detectors can be exercised end-to-end from the API
          // surface. Production callers will replace this with a real
          // telemetry adapter; for now inline inputs let the canonical
          // example emit findings on demand.
          const inlineInputs = body.inputs ?? {};
          const inlineRead = async (name: string): Promise<unknown[]> =>
            Array.isArray(inlineInputs[name]) ? inlineInputs[name] : [];
          const result = await runTsDetector(detector, {
            detectorId,
            runId,
            startedAt: startedAt.toISOString(),
            triggeredBy,
            params,
            read: inlineInputs && Object.keys(inlineInputs).length > 0
              ? inlineRead
              : emptyContextRead(),
          });
          findings = result.findings;
          trace = result.trace;
        } else {
          if (!detRow.sidecarBaseUrl) throw new Error('Python detector has no sidecarBaseUrl');
          // Re-check the allowlist at call-time as a defense-in-depth
          // against historical rows that pre-date the registration
          // guard, or env policy that has tightened since registration.
          if (!isSidecarBaseUrlAllowed(detRow.sidecarBaseUrl)) {
            throw new Error(
              `Refusing to invoke detector ${detectorId}: sidecarBaseUrl "${detRow.sidecarBaseUrl}" is not in the current allowlist.`,
            );
          }
          const r = await fetch(`${detRow.sidecarBaseUrl}/detectors/${detectorId}/run`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              detectorId,
              runId,
              triggeredBy,
              startedAt: startedAt.toISOString(),
              params,
              inputs: body.inputs ?? {},
            }),
          });
          if (!r.ok) throw new Error(`Sidecar HTTP ${r.status}`);
          const parsed = sidecarRunResponseSchema.parse(await r.json());
          if (parsed.status === 'error') {
            status = 'error';
            errorMessage = parsed.errorMessage;
          }
          findings = parsed.findings as Finding[];
          trace = parsed.trace;
        }
      } catch (err) {
        status = 'error';
        errorMessage = err instanceof Error ? err.message : String(err);
      }

      const finishedAt = new Date();
      const receipt = await chainFor(detectorId).append({
        endpoint: `POST /api/sentra/detectors/${detectorId}/run`,
        method: 'POST',
        params: { runId, triggeredBy, params, inputs: body.inputs ?? null },
        result: { status, findingsCount: findings.length, errorMessage },
        metadata: { runId, runtime: manifest.runtime },
      });

      await db.insert(sentraDetectorRunsTable).values({
        id: runId,
        detectorId,
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        status,
        triggeredBy,
        findingsCount: findings.length,
        chainReceiptId: receipt.selfHash,
        errorMessage: errorMessage ?? null,
        trace,
      });

      // Amaru cortex classification / enrichment. Runs BEFORE persistence
      // and BEFORE the A11oy handoff so the row written to
      // `sentra_findings` and the severity used for escalation both
      // reflect the post-classification view. Override (when the cortex
      // changed severity) is recorded on the finding row itself via
      // `amaru_original_*` + `amaru_classification`.
      const classified = await classifyFindings(findings);
      const postFindings = classified.map((c) => c.finding);

      await persistFindings({
        detectorId,
        runId,
        classified,
        chainReceiptId: receipt.selfHash,
      });
      await maybeHandoff(postFindings);

      sendCreated(res, {
        runId,
        status,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        findings: postFindings,
        amaruClassifications: classified.map((c) => ({
          findingId: c.finding.id,
          classifiedAt: c.classifiedAt,
          originalSeverity: c.originalSeverity,
          originalScoreBps: c.originalScoreBps,
          severity: c.finding.severity,
          score: c.finding.score,
          classification: c.classification,
        })),
        chainReceiptId: receipt.selfHash,
        errorMessage,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to run detector');
    }
  },
);

router.get('/sentra/detector-runs', async (req: Request, res: Response) => {
  try {
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const detectorId = typeof req.query.detectorId === 'string' ? req.query.detectorId : undefined;
    const base = db
      .select()
      .from(sentraDetectorRunsTable)
      .orderBy(desc(sentraDetectorRunsTable.startedAt))
      .limit(limit)
      .offset(offset);
    const rows = detectorId
      ? await base.where(eq(sentraDetectorRunsTable.detectorId, detectorId))
      : await base;
    sendSuccess(res, { runs: rows });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list detector runs');
  }
});

router.get('/sentra/findings', async (req: Request, res: Response) => {
  try {
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const filters = [] as ReturnType<typeof eq>[];
    if (typeof req.query.detectorId === 'string') {
      filters.push(eq(sentraFindingsTable.detectorId, req.query.detectorId));
    }
    if (typeof req.query.status === 'string') {
      filters.push(eq(sentraFindingsTable.status, req.query.status as 'open' | 'resolved' | 'suppressed'));
    }
    if (typeof req.query.severity === 'string') {
      filters.push(
        eq(sentraFindingsTable.severity, req.query.severity as FindingSeverity),
      );
    }
    if (typeof req.query.sinceMs === 'string') {
      const since = new Date(Number(req.query.sinceMs));
      if (!Number.isNaN(since.getTime())) {
        filters.push(gte(sentraFindingsTable.emittedAt, since));
      }
    }
    const q = db
      .select()
      .from(sentraFindingsTable)
      .orderBy(desc(sentraFindingsTable.emittedAt))
      .limit(limit)
      .offset(offset);
    const rows = filters.length === 0 ? await q : await q.where(and(...filters));
    sendSuccess(res, {
      findings: rows.map((r) => ({
        id: r.id,
        detectorId: r.detectorId,
        runId: r.runId,
        severity: r.severity,
        score: bpsToScore(r.score),
        title: r.title,
        summary: r.summary,
        attackTechniques: r.attackTechniques ?? undefined,
        affectedAssets: r.affectedAssets ?? [],
        evidence: r.evidence ?? {},
        recommendedAction: r.recommendedAction ?? undefined,
        governanceClass: r.governanceClass,
        status: r.status,
        chainReceiptId: r.chainReceiptId ?? undefined,
        amaru: r.amaruClassifiedAt
          ? {
              classifiedAt: r.amaruClassifiedAt.toISOString(),
              originalSeverity: r.amaruOriginalSeverity ?? undefined,
              originalScore:
                r.amaruOriginalScore != null
                  ? bpsToScore(r.amaruOriginalScore)
                  : undefined,
              classification: r.amaruClassification ?? undefined,
            }
          : undefined,
        emittedAt: r.emittedAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString(),
        resolvedBy: r.resolvedBy ?? undefined,
        resolutionNote: r.resolutionNote ?? undefined,
      })),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list findings');
  }
});

const resolveBodySchema = z.object({
  resolution: z.enum(['resolved', 'suppressed']).default('resolved'),
  note: z.string().max(2000).optional(),
});

router.post(
  '/sentra/findings/:id/resolve',
  authMiddleware(),
  validateBody(resolveBodySchema),
  async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      sendNotFound(res, 'Finding');
      return;
    }
    const body = req.body as z.infer<typeof resolveBodySchema>;
    try {
      const [row] = await db
        .select()
        .from(sentraFindingsTable)
        .where(eq(sentraFindingsTable.id, id))
        .limit(1);
      if (!row) {
        sendNotFound(res, 'Finding');
        return;
      }
      const operator = req.user?.email ?? 'system';
      const receipt = await chainFor(row.detectorId).append({
        endpoint: `POST /api/sentra/findings/${id}/resolve`,
        method: 'POST',
        params: { findingId: id, resolution: body.resolution, note: body.note ?? null },
        metadata: { operator, runId: row.runId },
      });
      await db
        .update(sentraFindingsTable)
        .set({
          status: body.resolution,
          resolvedAt: new Date(),
          resolvedBy: operator,
          resolutionNote: body.note ?? null,
          chainReceiptId: receipt.selfHash,
        })
        .where(eq(sentraFindingsTable.id, id));
      sendSuccess(res, { ok: true, chainReceiptId: receipt.selfHash });
    } catch (err) {
      handleRouteError(res, err, 'Failed to resolve finding');
    }
  },
);

export default router;
