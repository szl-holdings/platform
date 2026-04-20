/**
 * Lyte Approval Inbox — re-exports from @workspace/approvals-inbox.
 *
 * The shared approvals inbox is the platform-wide single source of truth
 * for approval actions. This file provides a convenient local import path
 * while using the shared package for all state management.
 */
export {
  type ApprovalAction,
  type ApprovalVerdict,
  clearApprovalInbox,
  getApprovalActions,
  getApprovalForRecommendation,
  getInboxByVerdict,
  getInboxStats,
  type SubmitApprovalOptions,
  submitApprovalAction,
} from '@workspace/approvals-inbox';
