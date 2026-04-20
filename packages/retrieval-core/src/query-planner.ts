/**
 * AEEP Retrieval — Query Planner
 *
 * Decomposes a natural language query into a RetrievalQuery with:
 *  - Strategy selection (semantic | keyword | hybrid)
 *  - Namespace selection based on domain profile
 *  - TopK and score threshold defaults
 */
import type { RetrievalQuery, RetrievalStrategy } from '@szl-holdings/shared-contracts';

export interface QueryPlannerOptions {
  profileId?: string;
  profileVersion?: string;
  namespaces?: string[];
  strategy?: RetrievalStrategy;
  topK?: number;
  minScore?: number;
}

let _queryCounter = 0;

function generateQueryId(): string {
  return `q_${Date.now()}_${(++_queryCounter).toString().padStart(4, '0')}`;
}

/**
 * Plan a retrieval query from a natural language text.
 */
export function planQuery(text: string, options: QueryPlannerOptions = {}): RetrievalQuery {
  const strategy: RetrievalStrategy = options.strategy ?? inferStrategy(text);

  return {
    queryId: generateQueryId(),
    text,
    strategy,
    ...(options.profileId !== undefined ? { profileId: options.profileId } : {}),
    ...(options.profileVersion !== undefined ? { profileVersion: options.profileVersion } : {}),
    ...(options.namespaces !== undefined ? { namespaces: options.namespaces } : {}),
    topK: options.topK ?? 10,
    minScore: options.minScore ?? 0.65,
    reranker: strategy === 'hybrid' ? 'reciprocal-rank-fusion' : 'none',
  };
}

/**
 * Infer retrieval strategy from query text heuristics.
 * Keyword terms (codes, IDs, exact phrases) → keyword.
 * General questions → semantic.
 * Mixed → hybrid.
 */
function inferStrategy(text: string): RetrievalStrategy {
  const hasKeywordSignals =
    /\b[A-Z]{2,}-\d+\b|\b\d{4,}\b|"[^"]+"/i.test(text) || text.split(' ').length <= 4;

  const hasSemanticSignals = text.split(' ').length > 6 || text.includes('?');

  if (hasKeywordSignals && hasSemanticSignals) return 'hybrid';
  if (hasKeywordSignals) return 'keyword';
  return 'semantic';
}
