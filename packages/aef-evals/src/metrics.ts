/**
 * AEF Retrieval Evaluation Metrics
 *
 * Implements recall@k, precision@k, nDCG@k, MRR, and exact-match recovery
 * on boost terms. All functions are pure — no side effects, no I/O.
 */

export interface RetrievedResult {
  chunkId: string;
  score: number;
  boostTermsMatched?: string[];
}

export interface GoldenQuery {
  queryId: string;
  query: string;
  relevantChunkIds: string[];
  exactMatchBoostTerms?: string[];
  metadata?: Record<string, unknown>;
  /**
   * Number of relevant results expected for this query. Defaults to
   * `relevantChunkIds.length` when omitted. Set to `0` to mark a query as
   * adversarial — i.e. the retriever is expected to return no results, and
   * the smoke harness will report it under `adversarial_precision` instead
   * of folding it into the positive recall/ndcg/mrr aggregates (where an
   * empty relevant set artificially scores 1.0).
   */
  expectedRelevant?: number;
}

export interface MetricResult {
  metric: string;
  atK: number;
  value: number;
}

function relevantAtK(retrieved: RetrievedResult[], relevant: Set<string>, k: number): number[] {
  return retrieved
    .slice(0, k)
    .map((r) => (relevant.has(r.chunkId) ? 1 : 0));
}

export function recallAtK(
  retrieved: RetrievedResult[],
  relevant: string[],
  k: number,
): number {
  if (relevant.length === 0) return 1;
  const relevantSet = new Set(relevant);
  const hits = relevantAtK(retrieved, relevantSet, k);
  const found = hits.reduce((a, b) => a + b, 0);
  return found / relevant.length;
}

export function precisionAtK(
  retrieved: RetrievedResult[],
  relevant: string[],
  k: number,
): number {
  if (k === 0) return 0;
  const relevantSet = new Set(relevant);
  const hits = relevantAtK(retrieved, relevantSet, k);
  const found = hits.reduce((a, b) => a + b, 0);
  return found / Math.min(k, retrieved.length);
}

function dcg(gains: number[]): number {
  return gains.reduce((acc, gain, i) => acc + gain / Math.log2(i + 2), 0);
}

export function ndcgAtK(
  retrieved: RetrievedResult[],
  relevant: string[],
  k: number,
): number {
  if (relevant.length === 0) return 1;
  const relevantSet = new Set(relevant);
  const gains = relevantAtK(retrieved, relevantSet, k);

  const idealGains = Array.from({ length: Math.min(relevant.length, k) }, () => 1);

  const actualDcg = dcg(gains);
  const idealDcg = dcg(idealGains);

  if (idealDcg === 0) return 0;
  return actualDcg / idealDcg;
}

export function mrr(
  retrieved: RetrievedResult[],
  relevant: string[],
): number {
  const relevantSet = new Set(relevant);
  for (let i = 0; i < retrieved.length; i++) {
    if (relevantSet.has(retrieved[i]!.chunkId)) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

export function exactMatchRecoveryRate(
  retrieved: RetrievedResult[],
  boostTerms: string[],
  k: number,
): number {
  if (boostTerms.length === 0) return 1;

  const topK = retrieved.slice(0, k);
  let recovered = 0;

  for (const term of boostTerms) {
    const termLower = term.toLowerCase();
    const found = topK.some((r) =>
      r.boostTermsMatched?.some((m) => m.toLowerCase().includes(termLower)),
    );
    if (found) recovered++;
  }

  return recovered / boostTerms.length;
}

export function computeAllMetrics(
  retrieved: RetrievedResult[],
  query: GoldenQuery,
  k: number,
): MetricResult[] {
  return [
    { metric: "recall", atK: k, value: recallAtK(retrieved, query.relevantChunkIds, k) },
    { metric: "precision", atK: k, value: precisionAtK(retrieved, query.relevantChunkIds, k) },
    { metric: "ndcg", atK: k, value: ndcgAtK(retrieved, query.relevantChunkIds, k) },
    { metric: "mrr", atK: k, value: mrr(retrieved, query.relevantChunkIds) },
    {
      metric: "exact_match_recovery",
      atK: k,
      value: exactMatchRecoveryRate(retrieved, query.exactMatchBoostTerms ?? [], k),
    },
  ];
}

export function aggregateMetrics(
  perQueryMetrics: MetricResult[][],
): MetricResult[] {
  if (perQueryMetrics.length === 0) return [];
  const template = perQueryMetrics[0]!;
  return template.map((_, idx) => {
    const values = perQueryMetrics.map((qm) => qm[idx]!.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { ...template[idx]!, value: avg };
  });
}
