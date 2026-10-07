/**
 * AEEP v1 Index Routes
 *
 * POST /v1/index/rebuild — trigger a full index rebuild across ingestion pipelines
 * GET  /v1/index/verify  — verify index integrity and report shard health
 *
 * Development/test stubs preserve the response shape for contract work. The
 * production orchestrator is not wired in this service release, so both routes
 * fail closed with HTTP 503/UNAVAILABLE rather than accepting phantom jobs or
 * reporting synthetic shard health.
 */

import { type Request, type Response, type IRouter, Router } from 'express';
import { z } from 'zod';
import { rejectUnwiredProductionCapability } from '../../runtime-capabilities.js';

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
  if (rejectUnwiredProductionCapability(res, 'index-rebuild')) return;

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
  if (rejectUnwiredProductionCapability(res, 'index-verification')) return;
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
