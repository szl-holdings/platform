/**
 * @workspace/alloy-crew
 *
 * Alloy Crew — Governed Multi-Agent Coordinator
 *
 * Alloy Crew sits at the heart of the SZL agent backbone. It coordinates small
 * specialist sub-agents (planner, policy evaluator, approval router, retrieval,
 * document, speech, forecasting, anomaly) to handle any agent request and
 * produces a fully audited, ledger-backed response envelope.
 *
 * Usage:
 *   import { coordinate } from "@workspace/alloy-crew";
 *   const response = await coordinate({ objective: "…", domain: "lyte", surface: "lyte" });
 */

export * from './envelope.js';
export * from './specialists.js';
export { coordinate, type CoordinatorOptions } from './coordinator.js';

export {
  type LlmChatClient,
  type CrewMember,
  type CrewRole,
  type SubPlan,
  type SubPlanStatus,
  type SubPlanResult,
  type CrewRunResult,
  type MultiAgentCrewOptions,
  type ApprovalRequest,
  type ApprovalCallback,
  type PendingApproval,
  type CrewExecutor,
  MultiAgentCrew,
  getDefaultCrew,
  createCrew,
} from './multi-agent-crew.js';

export {
  type TrustLevel,
  type TrustScore,
  type ActionTypeScore,
  type TrustLevelChange,
  type TrustPolicy,
  type ApprovalDecision,
  TrustScoreEngine,
  defaultTrustEngine,
} from './trust-score.js';

export const ALLOY_COORDINATOR_VERSION = '1.0.0' as const;
