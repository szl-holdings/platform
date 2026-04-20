export * from './approval-gate.js';
export * from './dead-letter.js';
export * from './errors.js';
export * from './retry.js';
export * from './run.js';
export * from './step-io-store.js';
export * from './step-log.js';

// Note: cognitive-runtime re-exports were removed to break the agents-core ↔
// cognitive-runtime dependency cycle (cognitive-runtime now depends on
// agents-core for the AgentRun lifecycle). Consumers should import directly
// from "@workspace/cognitive-runtime".

export {
  buildPolicyEvaluation,
  checkAction,
  POLICY_ENGINE_VERSION,
  registerPolicy,
} from '@szl-holdings/policy-engine';
export {
  type ApprovalAction,
  type ApprovalVerdict,
  getApprovalActions,
  getApprovalForRecommendation,
  getInboxStats,
  submitApprovalAction,
} from '@workspace/approvals-inbox';
export {
  GUARDIAN_VERSION,
  GuardianDecisionEngine,
  type PolicyTier,
} from '@workspace/guardian';

export const AGENTS_CORE_VERSION = '0.1.0' as const;
