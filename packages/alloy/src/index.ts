/**
 * @workspace/alloy
 *
 * Alloy — Governed Multi-Agent Coordinator
 *
 * Alloy sits at the heart of the SZL agent backbone. It coordinates small
 * specialist sub-agents (planner, policy evaluator, approval router, retrieval,
 * document, speech, forecasting, anomaly) to handle any agent request and
 * produces a fully audited, ledger-backed response envelope.
 *
 * Usage:
 *   import { coordinate } from "@workspace/alloy";
 *   const response = await coordinate({ objective: "…", domain: "lyte", surface: "lyte" });
 */

export * from './envelope.js';
export * from './specialists.js';
export { coordinate, type CoordinatorOptions } from './coordinator.js';

export const ALLOY_COORDINATOR_VERSION = '1.0.0' as const;
