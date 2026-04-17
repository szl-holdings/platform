export * from "./types.js";
export * from "./checks.js";
export { aggregateDecision, type AggregatedDecision } from "./aggregator.js";
export { verify, registerCheck, unregisterCheck, listChecks } from "./engine.js";
export {
  InMemoryVerifierStore,
  defaultVerifierStore,
  type VerifierStore,
  type VerifierStoreQuery,
} from "./store.js";
export { DbVerifierStore } from "./db-store.js";

export const VERIFIER_VERSION = "1.0.0" as const;
