export * from "./errors.js";
export * from "./retry.js";
export * from "./step-log.js";
export * from "./approval-gate.js";
export * from "./dead-letter.js";
export * from "./run.js";
export * from "./step-io-store.js";

// Note: cognitive-runtime re-exports were removed to break the agents-core ↔
// cognitive-runtime dependency cycle (cognitive-runtime now depends on
// agents-core for the AgentRun lifecycle). Consumers should import directly
// from "@workspace/cognitive-runtime".

export {
  GuardianDecisionEngine,
  type PolicyTier,
  GUARDIAN_VERSION,
} from "@workspace/guardian";

export {
  checkAction,
  registerPolicy,
  buildPolicyEvaluation,
  POLICY_ENGINE_VERSION,
} from "@szl-holdings/policy-engine";

export {
  submitApprovalAction,
  getApprovalForRecommendation,
  getApprovalActions,
  getInboxStats,
  type ApprovalAction,
  type ApprovalVerdict,
} from "@workspace/approvals-inbox";

export const AGENTS_CORE_VERSION = "0.1.0" as const;
