/**
 * Lyte Approval Inbox — re-exports from @workspace/approvals-inbox.
 *
 * The shared approvals inbox is the platform-wide single source of truth
 * for approval actions. This file provides a convenient local import path
 * while using the shared package for all state management.
 */
export {
  submitApprovalAction,
  getApprovalActions,
  getApprovalForRecommendation,
  getInboxByVerdict,
  getInboxStats,
  clearApprovalInbox,
  type ApprovalVerdict,
  type ApprovalAction,
  type SubmitApprovalOptions,
} from "@workspace/approvals-inbox";
