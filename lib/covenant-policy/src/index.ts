export type {
  CovenantEffect,
  CovenantPermission,
  CovenantRole,
  CovenantPolicy,
  CovenantCondition,
  CovenantSubject,
  CovenantResource,
  CovenantRequest,
  CovenantDecision,
} from "./engine.js";

export { CovenantPolicyEngine, covenantEngine } from "./engine.js";

export {
  COVENANT_POLICY_TEMPLATES,
  instantiateTemplate,
  buildDomainScopedPolicy,
} from "./templates.js";

export type { CovenantCheckResult, CovenantVisibleDecision } from "./decisions.js";

export {
  checkPermission,
  assertPermission,
  getRecentDecisions,
  getDeniedDecisions,
  formatDecisionForUI,
} from "./decisions.js";

export {
  createApprovalRequest,
  reviewApproval,
  escalateApproval,
  listPendingApprovals,
  getApprovalAuditTrail,
  expireStaleApprovals,
} from "@szl-holdings/approvals";

export type { ApprovalRequest, ApprovalStatus } from "@szl-holdings/approvals";

export {
  createAuthService,
  AuthService,
  DevAuthProvider,
} from "@szl-holdings/auth";

export type { AuthIdentity, AuthProvider } from "@szl-holdings/auth";
