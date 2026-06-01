/**
 * AEF Ingestion Orchestrator — Approval Routes
 *
 * Operators approve or reject paused runs at HumanApprovalGate steps.
 * Resuming an approved run continues from the gate's checkpoint.
 */

import { type Request, type Response, Router } from 'express';
import { defaultEngine } from '../engine.js';
import { defaultRunStore } from '../run-store.js';
import { ApprovalDecisionSchema } from '../types.js';
import { buildIngestDocumentWorkflow } from '../workflows/ingest-document.js';
import { buildRebuildIndexWorkflow } from '../workflows/rebuild-index.js';
import { buildRotateProfileVersionWorkflow } from '../workflows/rotate-profile-version.js';
import { buildRunRetrievalEvalWorkflow } from '../workflows/run-retrieval-eval.js';
import { buildVerifyIndexHealthWorkflow } from '../workflows/verify-index-health.js';

export function createApprovalsRouter(): Router {
  const router = Router();

  router.post('/runs/:runId/approve', async (req: Request, res: Response) => {
    const { runId } = req.params;
    const parse = ApprovalDecisionSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', detail: parse.error.issues });
      return;
    }

    const run = defaultRunStore.get(runId as string);
    if (!run) {
      res.status(404).json({ error: `Run not found: ${runId}` });
      return;
    }

    if (run.status !== 'pending-approval') {
      res.status(409).json({
        error: `Run is not pending-approval (status=${run.status})`,
        runId: run.runId,
        status: run.status,
      });
      return;
    }

    const definition = resolveWorkflowDefinitionFromRun(run);
    if (!definition) {
      res
        .status(422)
        .json({ error: `Cannot resolve workflow definition for workflowId: ${run.workflowId}` });
      return;
    }

    try {
      const resumed = await defaultEngine.resume(
        runId as string,
        definition,
        parse.data.decision,
        parse.data.actorId,
        parse.data.note,
      );

      res.status(200).json({
        runId: resumed.runId,
        workflowId: resumed.workflowId,
        status: resumed.status,
        completedAt: resumed.completedAt,
        error: resumed.error,
        stepResults: resumed.stepResults.map((r) => ({
          stepId: r.stepId,
          actor: r.actor,
          status: r.status,
          durationMs: r.durationMs,
          error: r.error,
        })),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  return router;
}

function resolveWorkflowDefinitionFromRun(run: {
  workflowId: string;
  tenantId: string;
  profileId: string;
  input: unknown;
}) {
  const input = (run.input ?? {}) as Record<string, unknown>;
  switch (run.workflowId) {
    case 'ingest_document':
      return buildIngestDocumentWorkflow(
        {
          sourceId: (input.sourceId as string) ?? 'unknown',
          content: (input.content as string) ?? '',
          contentType: (input.contentType as string) ?? 'text/plain',
          metadata: (input.metadata as Record<string, unknown>) ?? {},
        },
        run.tenantId,
        run.profileId,
      );
    case 'rebuild_index':
      return buildRebuildIndexWorkflow({ tenantId: run.tenantId, profileId: run.profileId });
    case 'verify_index_health':
      return buildVerifyIndexHealthWorkflow({ tenantId: run.tenantId, profileId: run.profileId });
    case 'run_retrieval_eval':
      return buildRunRetrievalEvalWorkflow({
        tenantId: run.tenantId,
        profileId: run.profileId,
        datasetId: (input.datasetId as string) ?? 'default',
        queries:
          (input.queries as Array<{
            queryId: string;
            query: string;
            relevantChunkIds: string[];
          }>) ?? [],
      });
    case 'rotate_profile_version':
      return buildRotateProfileVersionWorkflow({
        tenantId: run.tenantId,
        currentProfileId: run.profileId,
        newProfileId: (input.newProfileId as string) ?? run.profileId,
        newProfileVersion: (input.newProfileVersion as string) ?? 'v2',
      });
    default:
      return null;
  }
}
