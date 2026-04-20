/**
 * AEEP Policy Type Contracts
 *
 * Shared types for policy rules, verdicts, approval workflows,
 * and policy tiers.
 */

/**
 * Policy verdicts:
 * - `allowed`            — Request permitted. Proceed.
 * - `requires-approval`  — Request gated. Await human decision before proceeding.
 * - `blocked`            — Request denied. Do not proceed.
 * - `override`           — Request was manually overridden by an authorized operator.
 *                          Used in evidence envelopes and audit trails to record
 *                          operator-bypassed policy decisions.
 */
export type PolicyVerdict = 'allowed' | 'requires-approval' | 'blocked' | 'override';
export type PolicyTier = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'escalated';

export interface PolicyRule {
  policyId: string;
  description: string;
  tier: PolicyTier;
  conditions: string[];
  verdict: PolicyVerdict;
  requiresApprovalFrom?: string[];
  escalationPath?: string[];
  auditRequired: boolean;
}

export interface PolicyCheckRequest {
  actionType: string;
  agentRole?: string;
  toolId?: string;
  workflowId?: string;
  resourceType?: string;
  resourceId?: string;
  traceId: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyCheckResult {
  requestId: string;
  verdict: PolicyVerdict;
  matchedPolicyId?: string;
  reason?: string;
  requiresApprovalFrom?: string[];
  approvalId?: string;
  traceId: string;
  evaluatedAt: string;
}

export interface ApprovalRequest {
  approvalId: string;
  workflowRunId?: string;
  stepId?: string;
  policyId?: string;
  requestedBy: string;
  requestedAt: string;
  expiresAt?: string;
  action: string;
  context?: Record<string, unknown>;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}
