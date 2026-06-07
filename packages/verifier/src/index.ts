export { type AggregatedDecision, aggregateDecision } from './aggregator.js';
export * from './checks.js';
export { DbVerifierStore } from './db-store.js';
export { listChecks, registerCheck, unregisterCheck, verify } from './engine.js';
export {
  defaultVerifierStore,
  InMemoryVerifierStore,
  type VerifierStore,
  type VerifierStoreQuery,
} from './store.js';
export * from './types.js';

export const VERIFIER_VERSION = '1.0.0' as const;
