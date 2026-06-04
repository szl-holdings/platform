/**
 * @workspace/drift-eval
 *
 * Drift-Eval — drift detection and champion-vs-challenger evaluation jobs.
 *
 * Provides:
 *  - Drift detection against model baseline snapshots
 *  - Champion-vs-challenger comparison with confidence scoring
 *  - Scheduled execution (configurable per-head intervals)
 *  - In-memory EvalRegistry (swap for DB-backed registry in production)
 *
 * Usage:
 *   import { globalEvalRegistry, detectDrift, runChampionChallenger, startDriftEvalScheduler } from "@workspace/drift-eval";
 *   await detectDrift("lyte:bottlenecks", globalEvalRegistry);
 */

export * from './types.js';
export * from './registry.js';
export * from './drift.js';
export * from './champion-challenger.js';
export * from './scheduler.js';

export { DRIFT_EVAL_VERSION } from './types.js';
