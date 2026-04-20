export type { AuthIdentity, AuthProvider } from '@szl-holdings/auth';
export {
  AuthService,
  createAuthService,
  DevAuthProvider,
} from '@szl-holdings/auth';
export type {
  AddApprovalCommentParams,
  ApprovalCreatedHook,
  ApprovalRequest,
  ApprovalStatus,
  CreateApprovalParams,
  EscalateApprovalParams,
  ReviewApprovalParams,
} from './approvals.js';
export {
  ApprovalAccessDeniedError,
  addApprovalComment,
  createApprovalRequest,
  escalateApproval,
  expireStaleApprovals,
  getApprovalAuditTrail,
  getApprovalById,
  getApprovalComments,
  listApprovals,
  listApprovalsByResource,
  listPendingApprovals,
  reviewApproval,
  setApprovalCreatedHook,
} from './approvals.js';
export type { CovenantCheckResult, CovenantVisibleDecision } from './decisions.js';
export {
  assertPermission,
  checkPermission,
  formatDecisionForUI,
  getDeniedDecisions,
  getRecentDecisions,
} from './decisions.js';
export type {
  CovenantCondition,
  CovenantDecision,
  CovenantEffect,
  CovenantPermission,
  CovenantPolicy,
  CovenantRequest,
  CovenantResource,
  CovenantRole,
  CovenantSubject,
} from './engine.js';
export { CovenantPolicyEngine, covenantEngine } from './engine.js';
export {
  buildDomainScopedPolicy,
  COVENANT_POLICY_TEMPLATES,
  instantiateTemplate,
} from './templates.js';
