/**
 * Pure logic extracted from the Approval Inbox screen.
 * Imported by both the screen and its tests so regressions are caught.
 */

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Decision = 'approved' | 'rejected' | 'revised';

export interface ApprovalLike {
  id: number;
  title: string;
  priority: Priority;
  status: string;
  resourceType: string;
  createdAt: string;
  expiresAt?: string;
}

export const VALID_DECISIONS: readonly Decision[] = ['approved', 'rejected', 'revised'] as const;

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#6b7280',
};

export function isValidDecision(d: string): d is Decision {
  return (VALID_DECISIONS as readonly string[]).includes(d);
}

export function normalizeApprovals<T>(raw: { data: T[] } | T[] | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return (raw as { data: T[] }).data ?? [];
}

export function approvalsListPath(status: string): string {
  return `/api/approvals?status=${status}`;
}

export interface ReviewRequest {
  path: string;
  method: 'POST';
  body: { decision: Decision; note: string };
}

export function buildReviewRequest(id: number, decision: Decision, note: string): ReviewRequest {
  if (!isValidDecision(decision)) {
    throw new Error(`Invalid decision: ${decision}`);
  }
  return {
    path: `/api/approvals/${id}/review`,
    method: 'POST',
    body: { decision, note },
  };
}

export interface EscalateRequest {
  path: string;
  method: 'POST';
  body: { reason: string };
}

export function buildEscalateRequest(id: number, reason: string): EscalateRequest {
  const trimmed = reason.trim();
  if (trimmed.length < 4) {
    throw new Error('Escalation reason too short');
  }
  return {
    path: `/api/approvals/${id}/escalate`,
    method: 'POST',
    body: { reason: trimmed },
  };
}

export function auditTrailPath(id: number): string {
  return `/api/approvals/${id}/audit-trail`;
}

export function commentsListPath(id: number): string {
  return `/api/approvals/${id}/comments`;
}

export interface PostCommentRequest {
  path: string;
  method: 'POST';
  body: { body: string };
}

export function buildPostCommentRequest(id: number, body: string): PostCommentRequest {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new Error('Comment body is required');
  }
  return {
    path: `/api/approvals/${id}/comment`,
    method: 'POST',
    body: { body: trimmed },
  };
}

export interface QueuedDecision {
  approvalId: number;
  approvalTitle: string;
  decision: Decision;
  note: string;
  queuedAt: string;
}

export function enqueueOfflineDecision(
  queue: readonly QueuedDecision[],
  approval: Pick<ApprovalLike, 'id' | 'title'>,
  decision: Decision,
  note: string,
  nowIso: string = new Date().toISOString(),
): QueuedDecision[] {
  return [
    ...queue,
    {
      approvalId: approval.id,
      approvalTitle: approval.title,
      decision,
      note,
      queuedAt: nowIso,
    },
  ];
}
