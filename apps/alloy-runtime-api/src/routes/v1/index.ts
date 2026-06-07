/**
 * AEEP v1 Index Routes
 *
 * POST /v1/index/rebuild — trigger a full index rebuild across ingestion pipelines
 * GET  /v1/index/verify  — verify index integrity and report shard health
 *
 * In production, these delegate to the alloy-ingestion-orchestrator service.
 * Stubs return the correct response envelopes so callers can code against the
 * contract before the ingestion service is wired.
 */

import { type Request, type Response, type IRouter, Router } from 'express';
import { z } from 'zod';

const router: IRouter = Router();

const RebuildSchema = z.object({
  domains: z.array(z.string()).optional(),
  dryRun: z.boolean().default(false),
  force: z.boolean().default(false),
});

router.post('/rebuild', (req: Request, res: Response): void => {
  const parse = RebuildSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', issues: parse.error.issues });
    return;
  }

  const { domains, dryRun, force } = parse.data;
  const tenantId = req.tenantCtx?.tenantId ?? 'default';
  const jobId = `rebuild_${Date.now()}`;

  res.status(202).json({
    jobId,
    tenantId,
    status: 'queued',
    domains: domains ?? ['*'],
    dryRun,
    force,
    queuedAt: new Date().toISOString(),
    statusUrl: `/v1/index/verify?jobId=${jobId}`,
    note: 'Ingestion orchestrator not yet wired — job is accepted but not executed.',
  });
});

router.get('/verify', (req: Request, res: Response): void => {
  const tenantId = req.tenantCtx?.tenantId ?? 'default';
  const jobId = req.query.jobId as string | undefined;

  res.status(200).json({
    tenantId,
    jobId: jobId ?? null,
    status: 'healthy',
    shards: [],
    totalDocuments: 0,
    lastRebuildAt: null,
    integrityCheckPassed: true,
    note: 'Ingestion orchestrator not yet wired — returns stub health envelope.',
  });
});

export default router;
