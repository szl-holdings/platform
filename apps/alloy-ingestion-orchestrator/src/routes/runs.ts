/**
 * AEF Ingestion Orchestrator — Run Management Routes
 *
 * Submit / monitor / cancel / list workflow runs.
 */

import { randomUUID } from 'node:crypto';
import { type Request, type Response, Router } from 'express';
import { defaultEngine } from '../engine.js';
import { defaultRunStore } from '../run-store.js';
import { type ListRunsFilter, SubmitRunRequestSchema } from '../types.js';
import { buildIngestDocumentWorkflow } from '../workflows/ingest-document.js';
import { buildRebuildIndexWorkflow } from '../workflows/rebuild-index.js';
import { buildRotateProfileVersionWorkflow } from '../workflows/rotate-profile-version.js';
import { buildRunRetrievalEvalWorkflow } from '../workflows/run-retrieval-eval.js';
import { buildVerifyIndexHealthWorkflow } from '../workflows/verify-index-health.js';

export function createRunsRouter(): Router {
  const router = Router();

  router.post('/runs', async (req: Request, res: Response) => {
    const parse = SubmitRunRequestSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', detail: parse.error.issues });
      return;
    }

    const { workflowId, tenantId, profileId, input, metadata } = parse.data;
    const definition = resolveWorkflowDefinition(
      workflowId,
      input as Record<string, unknown>,
      tenantId,
      profileId,
    );
    if (!definition) {
      res.status(404).json({ error: `Unknown workflowId: ${workflowId}` });
      return;
    }

    try {
      const run = await defaultEngine.start(definition, {
        tenantId,
        profileId,
        input,
        metadata,
      });

      const statusUrl = `/orchestrator/v1/runs/${run.runId}`;
      res.status(202).json({
        runId: run.runId,
        workflowId: run.workflowId,
        tenantId: run.tenantId,
        status: run.status,
        statusUrl,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        error: run.error,
        approvalRequestId: run.approvalRequestId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  router.get('/runs/:runId', (req: Request, res: Response) => {
    const { runId } = req.params;
    const run = defaultRunStore.get(runId as string);
    if (!run) {
      res.status(404).json({ error: `Run not found: ${runId}` });
      return;
    }
    res.status(200).json(run);
  });

  router.delete('/runs/:runId', (req: Request, res: Response) => {
    const { runId } = req.params;
    try {
      const cancelled = defaultEngine.cancel(runId as string);
      res.status(200).json({ runId: cancelled.runId, status: cancelled.status });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
      } else {
        res.status(409).json({ error: message });
      }
    }
  });

  router.get('/runs', (req: Request, res: Response) => {
    const filter: ListRunsFilter = {
      tenantId: req.query.tenantId as string | undefined,
      profileId: req.query.profileId as string | undefined,
      status: req.query.status as ListRunsFilter['status'],
      workflowId: req.query.workflowId as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };
    const runs = defaultRunStore.list(filter);
    res.status(200).json({ runs, total: runs.length });
  });

  return router;
}

function resolveWorkflowDefinition(
  workflowId: string,
  input: Record<string, unknown>,
  tenantId: string,
  profileId: string,
) {
  switch (workflowId) {
    case 'ingest_document':
      return buildIngestDocumentWorkflow(
        {
          sourceId: (input.sourceId as string) ?? randomUUID(),
          content: (input.content as string) ?? '',
          contentType: (input.contentType as string) ?? 'text/plain',
          title: input.title as string | undefined,
          sourceUri: input.sourceUri as string | undefined,
          chunkSize: input.chunkSize as number | undefined,
          chunkOverlap: input.chunkOverlap as number | undefined,
          model: input.model as string | undefined,
          metadata: (input.metadata as Record<string, unknown>) ?? {},
        },
        tenantId,
        profileId,
      );
    case 'rebuild_index':
      return buildRebuildIndexWorkflow({
        tenantId,
        profileId,
        fullRebuild: input.fullRebuild as boolean | undefined,
        sourceIds: input.sourceIds as string[] | undefined,
      });
    case 'verify_index_health':
      return buildVerifyIndexHealthWorkflow({
        tenantId,
        profileId,
        goldQueries: input.goldQueries as
          | Array<{ query: string; expectedChunkIds: string[] }>
          | undefined,
        sampleSize: input.sampleSize as number | undefined,
      });
    case 'run_retrieval_eval':
      return buildRunRetrievalEvalWorkflow({
        tenantId,
        profileId,
        datasetId: (input.datasetId as string) ?? 'default',
        queries:
          (input.queries as Array<{
            queryId: string;
            query: string;
            relevantChunkIds: string[];
          }>) ?? [],
        topK: input.topK as number | undefined,
        metrics: input.metrics as Array<'ndcg' | 'recall' | 'precision' | 'mrr'> | undefined,
      });
    case 'rotate_profile_version':
      return buildRotateProfileVersionWorkflow({
        tenantId,
        currentProfileId: (input.currentProfileId as string) ?? profileId,
        newProfileId: (input.newProfileId as string) ?? profileId,
        newProfileVersion: (input.newProfileVersion as string) ?? 'v2',
        shadowDatasetId: input.shadowDatasetId as string | undefined,
        shadowQueries: input.shadowQueries as
          | Array<{ queryId: string; query: string; relevantChunkIds: string[] }>
          | undefined,
      });
    default:
      return null;
  }
}
