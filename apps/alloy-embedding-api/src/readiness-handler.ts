import { RERANK_IMPLEMENTATION_ID } from '@workspace/aef-contracts';
import {
  type OrchestratorRuntimeAdmission,
  resolveOrchestratorRuntimeAdmission,
} from '@workspace/alloy-ingestion-orchestrator';
import type { RequestHandler } from 'express';
import { resolveEvidenceLedgerRuntimeAdmission } from './evidence-ledger-runtime.js';
import { isAefRuntimeReady } from './readiness-runtime.js';
import { buildRerankerReadinessReport, type RerankerReadinessReport } from './rerank-runtime.js';
import {
  buildEmbeddingReadinessReport,
  buildRetrievalStoreAdmissionReport,
  type EmbeddingReadinessReport,
} from './retrieval-store.js';

export interface AefReadinessHandlerOptions {
  env?: NodeJS.ProcessEnv;
  probeEmbedding?: () => Promise<EmbeddingReadinessReport>;
  probeReranker?: () => Promise<RerankerReadinessReport>;
}

function heldEmbeddingReport(): EmbeddingReadinessReport {
  return {
    ready: false,
    backendId: 'not-probed',
    model: 'not-probed',
    detail: 'Inference probe suppressed while a static production admission is held',
  };
}

function heldRerankerReport(): RerankerReadinessReport {
  return {
    ready: false,
    enabled: false,
    model: RERANK_IMPLEMENTATION_ID,
    detail: 'Rerank probe suppressed while a static production admission is held',
  };
}

/**
 * Build the public readiness handler without allowing a known static HOLD to
 * trigger external inference. Ledger/workflow/retrieval admission is pure and
 * evaluated first; backend probes run only when every static boundary admits
 * the process.
 */
export function createAefReadinessHandler(
  options: AefReadinessHandlerOptions = {},
): RequestHandler {
  const env = options.env ?? process.env;
  const probeEmbedding = options.probeEmbedding ?? buildEmbeddingReadinessReport;
  const probeReranker = options.probeReranker ?? buildRerankerReadinessReport;

  return async (_req, res): Promise<void> => {
    const retrieval = buildRetrievalStoreAdmissionReport(env);
    const evidenceLedger = resolveEvidenceLedgerRuntimeAdmission(env);
    const statefulWorkflows: OrchestratorRuntimeAdmission =
      resolveOrchestratorRuntimeAdmission(env);
    const staticAdmissionReady =
      retrieval.admitted && evidenceLedger.ready && statefulWorkflows.ready;

    const [embedding, reranker] = staticAdmissionReady
      ? await Promise.all([probeEmbedding(), probeReranker()])
      : [heldEmbeddingReport(), heldRerankerReport()];
    const ready = isAefRuntimeReady({
      embedding,
      reranker,
      retrieval,
      evidenceLedger,
      statefulWorkflows,
    });

    res.status(ready ? 200 : 503).json({
      ready,
      service: 'alloy-embedding-api',
      checkedAt: new Date().toISOString(),
      embedding,
      reranker,
      retrieval,
      evidenceLedger,
      statefulWorkflows,
    });
  };
}
