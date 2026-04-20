/**
 * AEF Ingestion Orchestrator — verify_index_health workflow
 *
 * Pipeline:
 *   sample queries against gold set → score drift → emit report
 *
 * Steps:
 *   1. IndexVerifier — sample queries against gold set and score drift
 */

import type { WorkflowDefinition } from "../types.js";

export interface VerifyIndexHealthInput {
  tenantId: string;
  profileId: string;
  goldQueries?: Array<{ query: string; expectedChunkIds: string[] }>;
  sampleSize?: number;
}

export function buildVerifyIndexHealthWorkflow(input: VerifyIndexHealthInput): WorkflowDefinition {
  return {
    workflowId: "verify_index_health",
    name: "Verify Index Health",
    description: "Sample queries against gold set → score drift → emit report",
    retryPolicy: { maxAttempts: 2, backoffMs: 100 },
    steps: [
      {
        stepId: "index-health-check",
        name: "IndexVerifier: Sample & Score Drift",
        actor: "IndexVerifier",
        input: {
          tenantId: input.tenantId,
          profileId: input.profileId,
          goldQueries: input.goldQueries ?? [],
          sampleSize: input.sampleSize ?? 20,
        },
      },
    ],
  };
}
