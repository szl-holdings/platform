export interface AefReadinessInputs {
  embedding: { ready: boolean };
  reranker: { ready: boolean };
  retrieval: { admitted: boolean };
  evidenceLedger: { ready: boolean };
  statefulWorkflows: { ready: boolean };
}

/**
 * The process advertises all four capabilities from one API surface, so its
 * aggregate probe must not report ready while any advertised capability is
 * unadmitted. Component reports remain available for precise diagnosis.
 */
export function isAefRuntimeReady(inputs: AefReadinessInputs): boolean {
  return (
    inputs.embedding.ready &&
    inputs.reranker.ready &&
    inputs.retrieval.admitted &&
    inputs.evidenceLedger.ready &&
    inputs.statefulWorkflows.ready
  );
}
