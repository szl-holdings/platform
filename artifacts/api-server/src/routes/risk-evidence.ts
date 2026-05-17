/**
 * Shared Risk Evidence Store — server-persisted store for cited Monte Carlo
 * runs ("Save run as evidence") that previously lived only in per-browser
 * localStorage (key prefix: szl.risk-evidence.<domain>). External reviewers,
 * lender briefings, and other devices need to see the same cited runs that
 * Terra/Vessels operators capture, so this endpoint backs the SaveRiskRunButton
 * and RiskEvidenceList components in lib/shared-ui/src/risk-evidence.tsx.
 *
 * Endpoints:
 *   GET    /api/risk-evidence/:domain               — public (unauthenticated)
 *                                                     list runs for a domain
 *   POST   /api/risk-evidence/:domain               — authenticated; saves a
 *                                                     run and returns the full
 *                                                     record (evidenceId +
 *                                                     savedAt)
 *   DELETE /api/risk-evidence/:domain/:evidenceId   — authenticated; removes
 *                                                     a run
 *   GET    /api/risk-evidence/by-id/:evidenceId     — public (unauthenticated)
 *                                                     resolve a single cited
 *                                                     run server-side (used
 *                                                     by lender briefing
 *                                                     exports so the PDF
 *                                                     pipeline can embed
 *                                                     percentile bands and
 *                                                     sensitivities for any
 *                                                     evidenceId referenced
 *                                                     in the briefing payload)
 *
 * Auth: GET endpoints are public so external reviewers and lender briefing
 * exports can resolve cited runs without a session. POST (save) and DELETE
 * (remove) require an authenticated session via authMiddleware() — anonymous
 * creation and deletion are blocked.
 *
 * Storage: one JSONB row per domain in platform_settings
 *   namespace = "szl.riskEvidence"
 *   key       = <domain>            (e.g. "terra", "vessels.routing")
 *   value     = SavedRiskRun[]      (most-recent first, capped at MAX_RUNS)
 *
 * Cap: MAX_RUNS_PER_DOMAIN = 200 — generous because lender briefings cite
 * historical runs spanning multiple reporting periods, but bounded so a
 * runaway client cannot blow up the row.
 */

import { bodyShape } from '@szl-holdings/contracts/common';
import { db, platformSettingsTable } from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../lib/validation';

const NAMESPACE = 'szl.riskEvidence';
const MAX_RUNS_PER_DOMAIN = 200;

interface SavedRiskRun {
  evidenceId: string;
  scenarioId: string;
  scenarioVersion?: string;
  scenarioTitle: string;
  domain: string;
  iterations: number;
  validIterations: number;
  durationMs: number;
  metrics: unknown[];
  sensitivities: unknown[];
  inputs: unknown[];
  savedAt: string;
  savedBy?: string;
  tenant?: string;
  note?: string;
}

const DOMAIN_PATTERN = /^[A-Za-z0-9._\-:]{1,80}$/;
const EVIDENCE_ID_PATTERN = /^[A-Za-z0-9._\-:]{1,80}$/;

function isValidDomain(d: unknown): d is string {
  return typeof d === 'string' && DOMAIN_PATTERN.test(d);
}

function isValidEvidenceId(id: unknown): id is string {
  return typeof id === 'string' && EVIDENCE_ID_PATTERN.test(id);
}

function generateEvidenceId(): string {
  return `RSK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

function normalizeRun(raw: unknown): SavedRiskRun | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.scenarioId !== 'string' ||
    typeof r.scenarioTitle !== 'string' ||
    typeof r.domain !== 'string'
  ) {
    return null;
  }
  return {
    evidenceId: typeof r.evidenceId === 'string' ? r.evidenceId : generateEvidenceId(),
    scenarioId: r.scenarioId,
    scenarioVersion: typeof r.scenarioVersion === 'string' ? r.scenarioVersion : undefined,
    scenarioTitle: r.scenarioTitle,
    domain: r.domain,
    iterations: typeof r.iterations === 'number' ? r.iterations : 0,
    validIterations: typeof r.validIterations === 'number' ? r.validIterations : 0,
    durationMs: typeof r.durationMs === 'number' ? r.durationMs : 0,
    metrics: Array.isArray(r.metrics) ? r.metrics : [],
    sensitivities: Array.isArray(r.sensitivities) ? r.sensitivities : [],
    inputs: Array.isArray(r.inputs) ? r.inputs : [],
    savedAt: typeof r.savedAt === 'string' ? r.savedAt : new Date().toISOString(),
    savedBy: typeof r.savedBy === 'string' ? r.savedBy : undefined,
    tenant: typeof r.tenant === 'string' ? r.tenant : undefined,
    note: typeof r.note === 'string' && r.note.trim() ? r.note : undefined,
  };
}

function normalizeRuns(raw: unknown): SavedRiskRun[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedRiskRun[] = [];
  for (const item of raw) {
    const n = normalizeRun(item);
    if (n) out.push(n);
  }
  return out;
}

async function loadRuns(domain: string): Promise<SavedRiskRun[]> {
  const [row] = await db
    .select()
    .from(platformSettingsTable)
    .where(
      and(eq(platformSettingsTable.namespace, NAMESPACE), eq(platformSettingsTable.key, domain)),
    )
    .limit(1);
  if (!row) return [];
  return normalizeRuns(row.value);
}

async function saveRuns(domain: string, runs: SavedRiskRun[]): Promise<void> {
  const trimmed = runs.slice(0, MAX_RUNS_PER_DOMAIN);
  const [existing] = await db
    .select({ id: platformSettingsTable.id })
    .from(platformSettingsTable)
    .where(
      and(eq(platformSettingsTable.namespace, NAMESPACE), eq(platformSettingsTable.key, domain)),
    )
    .limit(1);

  if (existing) {
    await db
      .update(platformSettingsTable)
      .set({ value: trimmed as never, valueType: 'json', updatedAt: new Date() })
      .where(eq(platformSettingsTable.id, existing.id));
  } else {
    await db.insert(platformSettingsTable).values({
      namespace: NAMESPACE,
      key: domain,
      value: trimmed as never,
      valueType: 'json',
      category: 'risk-evidence',
      isPublic: true,
    });
  }
}

const router: IRouter = Router();

router.get('/risk-evidence/by-id/:evidenceId', async (req: Request, res: Response) => {
  try {
    const { evidenceId } = req.params;
    if (!isValidEvidenceId(evidenceId)) {
      sendBadRequest(res, 'Invalid evidenceId');
      return;
    }
    // Scan every domain row. The rows are JSONB arrays so the work is bounded
    // by total domains × MAX_RUNS_PER_DOMAIN — small enough for the demo
    // without an extra index. If the volume ever grows, swap this for a
    // JSONB containment query (`@>` against `[{"evidenceId": "..."}]`).
    const rows = await db
      .select()
      .from(platformSettingsTable)
      .where(eq(platformSettingsTable.namespace, NAMESPACE));
    for (const row of rows) {
      const runs = normalizeRuns(row.value);
      const match = runs.find((r) => r.evidenceId === evidenceId);
      if (match) {
        sendSuccess(res, match);
        return;
      }
    }
    sendNotFound(res, 'Risk evidence run');
  } catch (err) {
    handleRouteError(res, err, 'Failed to resolve risk evidence by id');
  }
});

router.get('/risk-evidence/:domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    if (!isValidDomain(domain)) {
      sendBadRequest(res, 'Invalid domain');
      return;
    }
    const runs = await loadRuns(domain);
    runs.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
    sendSuccess(res, { runs });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load risk evidence');
  }
});

router.post(
  '/risk-evidence/:domain',
  authMiddleware(),
  validateBody(
    bodyShape({
      domain: z.unknown().optional(),
      evidenceId: z.unknown().optional(),
      savedAt: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { domain } = req.params;
      if (!isValidDomain(domain)) {
        sendBadRequest(res, 'Invalid domain');
        return;
      }
      const body = req.body as Record<string, unknown>;
      // The body's "domain" must agree with the path domain when present.
      if (typeof body.domain === 'string' && body.domain !== domain) {
        sendBadRequest(res, 'Body domain does not match path');
        return;
      }
      const candidate = normalizeRun({ ...body, domain });
      if (!candidate) {
        sendBadRequest(res, 'Body must include scenarioId, scenarioTitle and domain');
        return;
      }
      // Honour client-provided evidenceId when present (so SaveRiskRunButton's
      // optimistic local cache stays in lockstep with the server record); fall
      // back to a server-generated id when missing.
      const record: SavedRiskRun = {
        ...candidate,
        evidenceId:
          typeof body.evidenceId === 'string' && EVIDENCE_ID_PATTERN.test(body.evidenceId)
            ? body.evidenceId
            : generateEvidenceId(),
        savedAt: typeof body.savedAt === 'string' ? body.savedAt : new Date().toISOString(),
      };

      const existing = await loadRuns(domain);
      // Replace any prior record with the same evidenceId so re-saves are
      // idempotent rather than creating duplicate envelopes.
      const filtered = existing.filter((r) => r.evidenceId !== record.evidenceId);
      const next = [record, ...filtered];
      await saveRuns(domain, next);
      sendCreated(res, record);
    } catch (err) {
      handleRouteError(res, err, 'Failed to save risk evidence');
    }
  },
);

router.delete(
  '/risk-evidence/:domain/:evidenceId',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const { domain, evidenceId } = req.params;
      if (!isValidDomain(domain)) {
        sendBadRequest(res, 'Invalid domain');
        return;
      }
      if (!isValidEvidenceId(evidenceId)) {
        sendBadRequest(res, 'Invalid evidenceId');
        return;
      }
      const existing = await loadRuns(domain);
      const next = existing.filter((r) => r.evidenceId !== evidenceId);
      if (next.length === existing.length) {
        sendNotFound(res, 'Risk evidence run');
        return;
      }
      await saveRuns(domain, next);
      sendSuccess(res, { ok: true, evidenceId });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete risk evidence');
    }
  },
);

export default router;
