/**
 * @szl-holdings/evidence-graph
 *
 * Evidence graph store and query layer.
 *
 * Usage:
 *   import { defaultEvidenceGraphQuery } from '@szl-holdings/evidence-graph';
 *
 *   const chain = defaultEvidenceGraphQuery.getEvidenceChain(recommendationId);
 *   const why = defaultEvidenceGraphQuery.why(entityId);
 */

export * from './postgres-store.js';
export * from './query.js';
export * from './store.js';

export const EVIDENCE_GRAPH_VERSION = '1.0.0' as const;
