import {
  type ApprovalRequest,
  type ApprovalStatus,
  approvalAuditTrailTable,
  approvalCommentsTable,
  approvalRequestsTable,
  db,
} from '@szl-holdings/db';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';

export type { ApprovalRequest, ApprovalStatus };

export interface CreateApprovalParams {
  orgId?: number | null;
  resourceType: string;
  resourceId: string;
  title: string;
  description?: string;
  actionClass?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  requestedById?: number | null;
  requestedByRole?: string;
  assignedApproverId?: number | null;
  requiredApproverRole?: string;
  expiresAt?: Date;
  correlationId?: string;
  serviceAttribution?: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ReviewApprovalParams {
  approvalId: number;
  actorId?: number | null;
  actorRole?: string;
  decision: 'approved' | 'rejected' | 'revised';
  note?: string;
  correlationId?: string;
  serviceAttribution?: string;
  /**
   * Defense-in-depth tenant guard. When provided, the operation will throw
   * `ApprovalAccessDeniedError` if the loaded approval's orgId does not match.
   * Routes/services should pass the caller's orgId for non-admin actors.
   */
  expectedOrgId?: number | null;
}

export interface EscalateApprovalParams {
  approvalId: number;
  actorId?: number | null;
  actorRole?: string;
  escalatedToId?: number | null;
  reason: string;
  correlationId?: string;
  serviceAttribution?: string;
  /** See {@link ReviewApprovalParams.expectedOrgId}. */
  expectedOrgId?: number | null;
}

export class ApprovalAccessDeniedError extends Error {
  readonly code = 'APPROVAL_ACCESS_DENIED';
  constructor(approvalId: number) {
    super(`Cross-tenant access denied for approval ${approvalId}`);
    this.name = 'ApprovalAccessDeniedError';
  }
}

/**
 * Hook fired (fire-and-forget) immediately after a new approval request is
 * persisted. Used by the API server to push notifications (in-app toast,
 * email, Slack) to operators with the required approver role so they can act
 * on the request without having the dashboard open.
 *
 * The hook is registered at server startup via `setApprovalCreatedHook`. Hook
 * errors are swallowed by the caller — notification failure must never break
 * approval creation itself.
 */
export type ApprovalCreatedHook = (approval: ApprovalRequest) => void | Promise<void>;

let approvalCreatedHook: ApprovalCreatedHook | null = null;

export function setApprovalCreatedHook(hook: ApprovalCreatedHook | null): void {
  approvalCreatedHook = hook;
}

export interface AddApprovalCommentParams {
  approvalId: number;
  orgId?: number | null;
  authorId?: number | null;
  authorRole?: string;
  body: string;
  isInternal?: boolean;
}

async function writeAuditEntry(params: {
  approvalId: number;
  orgId?: number | null;
  actorId?: number | null;
  actorRole?: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  correlationId?: string;
  serviceAttribution?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(approvalAuditTrailTable).values({
      approvalId: params.approvalId,
      orgId: params.orgId ?? null,
      actorId: params.actorId ?? null,
      actorRole: params.actorRole ?? null,
      action: params.action,
      fromStatus: params.fromStatus ?? null,
      toStatus: params.toStatus ?? null,
      note: params.note ?? null,
      correlationId: params.correlationId ?? null,
      serviceAttribution: params.serviceAttribution ?? 'approvals',
      metadata: params.metadata ?? {},
    });
  } catch {}
}

export async function createApprovalRequest(
  params: CreateApprovalParams,
): Promise<ApprovalRequest> {
  const expiresAt = params.expiresAt ?? new Date(Date.now() + 48 * 60 * 60 * 1000);

  const [approval] = await db
    .insert(approvalRequestsTable)
    .values({
      orgId: params.orgId ?? null,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      title: params.title,
      description: params.description ?? null,
      actionClass: params.actionClass ?? 'general',
      priority: params.priority ?? 'medium',
      status: 'pending',
      requestedById: params.requestedById ?? null,
      requestedByRole: params.requestedByRole ?? null,
      assignedApproverId: params.assignedApproverId ?? null,
      requiredApproverRole: params.requiredApproverRole ?? null,
      expiresAt,
      correlationId: params.correlationId ?? null,
      serviceAttribution: params.serviceAttribution ?? null,
      payload: params.payload ?? {},
      metadata: params.metadata ?? {},
    })
    .returning();

  await writeAuditEntry({
    approvalId: approval.id,
    orgId: params.orgId,
    actorId: params.requestedById,
    actorRole: params.requestedByRole,
    action: 'created',
    fromStatus: undefined,
    toStatus: 'pending',
    correlationId: params.correlationId,
    serviceAttribution: params.serviceAttribution,
  });

  if (approvalCreatedHook) {
    Promise.resolve()
      .then(() => approvalCreatedHook?.(approval))
      .catch(() => {
        // Notification failure must never break approval creation. The hook
        // is responsible for its own logging.
      });
  }

  return approval;
}

export async function reviewApproval(params: ReviewApprovalParams): Promise<ApprovalRequest> {
  const [existing] = await db
    .select()
    .from(approvalRequestsTable)
    .where(eq(approvalRequestsTable.id, params.approvalId));

  if (!existing) {
    throw Object.assign(new Error(`Approval ${params.approvalId} not found`), {
      code: 'NOT_FOUND',
    });
  }

  if (
    params.expectedOrgId != null &&
    existing.orgId != null &&
    existing.orgId !== params.expectedOrgId
  ) {
    throw new ApprovalAccessDeniedError(params.approvalId);
  }

  if (existing.status !== 'pending' && existing.status !== 'escalated') {
    throw Object.assign(new Error(`Cannot review approval in status: ${existing.status}`), {
      code: 'INVALID_TRANSITION',
    });
  }

  const now = new Date();
  const updateFields: Partial<typeof approvalRequestsTable.$inferInsert> = {
    status: params.decision as ApprovalStatus,
    updatedAt: now,
  };

  if (params.decision === 'approved') {
    updateFields.approvedById = params.actorId ?? null;
    updateFields.approvedAt = now;
  } else if (params.decision === 'rejected') {
    updateFields.rejectedById = params.actorId ?? null;
    updateFields.rejectedAt = now;
  }

  const [updated] = await db
    .update(approvalRequestsTable)
    .set(updateFields)
    .where(eq(approvalRequestsTable.id, params.approvalId))
    .returning();

  await writeAuditEntry({
    approvalId: params.approvalId,
    orgId: existing.orgId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    action: params.decision,
    fromStatus: existing.status,
    toStatus: params.decision,
    note: params.note,
    correlationId: params.correlationId,
    serviceAttribution: params.serviceAttribution,
  });

  return updated;
}

export async function escalateApproval(params: EscalateApprovalParams): Promise<ApprovalRequest> {
  const [existing] = await db
    .select()
    .from(approvalRequestsTable)
    .where(eq(approvalRequestsTable.id, params.approvalId));

  if (!existing) {
    throw Object.assign(new Error(`Approval ${params.approvalId} not found`), {
      code: 'NOT_FOUND',
    });
  }

  if (
    params.expectedOrgId != null &&
    existing.orgId != null &&
    existing.orgId !== params.expectedOrgId
  ) {
    throw new ApprovalAccessDeniedError(params.approvalId);
  }

  if (existing.status !== 'pending') {
    throw Object.assign(new Error(`Cannot escalate approval in status: ${existing.status}`), {
      code: 'INVALID_TRANSITION',
    });
  }

  const [updated] = await db
    .update(approvalRequestsTable)
    .set({
      status: 'escalated',
      escalatedAt: new Date(),
      escalatedToId: params.escalatedToId ?? null,
      escalationReason: params.reason,
      updatedAt: new Date(),
    })
    .where(eq(approvalRequestsTable.id, params.approvalId))
    .returning();

  await writeAuditEntry({
    approvalId: params.approvalId,
    orgId: existing.orgId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    action: 'escalated',
    fromStatus: 'pending',
    toStatus: 'escalated',
    note: params.reason,
    correlationId: params.correlationId,
    serviceAttribution: params.serviceAttribution,
  });

  return updated;
}

export async function addApprovalComment(params: AddApprovalCommentParams): Promise<void> {
  const [inserted] = await db
    .insert(approvalCommentsTable)
    .values({
      approvalId: params.approvalId,
      orgId: params.orgId ?? null,
      authorId: params.authorId ?? null,
      authorRole: params.authorRole ?? null,
      body: params.body,
      isInternal: params.isInternal ?? false,
    })
    .returning();

  await writeAuditEntry({
    approvalId: params.approvalId,
    orgId: params.orgId,
    actorId: params.authorId,
    actorRole: params.authorRole,
    action: 'comment',
    note: params.body,
    metadata: {
      commentId: inserted?.id,
      isInternal: params.isInternal ?? false,
    },
  });
}

export async function getApprovalById(id: number): Promise<ApprovalRequest | undefined> {
  const [row] = await db
    .select()
    .from(approvalRequestsTable)
    .where(eq(approvalRequestsTable.id, id));
  return row;
}

export async function listApprovalsByResource(
  resourceType: string,
  resourceId: string,
): Promise<ApprovalRequest[]> {
  return db
    .select()
    .from(approvalRequestsTable)
    .where(
      and(
        eq(approvalRequestsTable.resourceType, resourceType),
        eq(approvalRequestsTable.resourceId, resourceId),
      ),
    )
    .orderBy(desc(approvalRequestsTable.createdAt));
}

export async function listPendingApprovals(
  options: {
    orgId?: number;
    assignedApproverId?: number;
    requiredApproverRole?: string;
    limit?: number;
  } = {},
): Promise<ApprovalRequest[]> {
  const conditions = [inArray(approvalRequestsTable.status, ['pending', 'escalated'])];

  if (options.orgId != null) {
    conditions.push(eq(approvalRequestsTable.orgId, options.orgId));
  }
  if (options.assignedApproverId != null) {
    conditions.push(eq(approvalRequestsTable.assignedApproverId, options.assignedApproverId));
  }
  if (options.requiredApproverRole) {
    conditions.push(eq(approvalRequestsTable.requiredApproverRole, options.requiredApproverRole));
  }

  return db
    .select()
    .from(approvalRequestsTable)
    .where(and(...conditions))
    .orderBy(desc(approvalRequestsTable.createdAt))
    .limit(options.limit ?? 100);
}

export async function listApprovals(
  options: {
    orgId?: number;
    statuses?: Array<
      'pending' | 'approved' | 'rejected' | 'revised' | 'escalated' | 'expired' | 'withdrawn'
    >;
    limit?: number;
    /**
     * Result ordering. Defaults to `createdAt` (most-recently-submitted first).
     * Use `decidedAt` to sort by effective decision time
     * (`COALESCE(approved_at, rejected_at) DESC`) — required for the mobile
     * Quick Action decision-history view, where users need the *most recently
     * actioned* requests at the top regardless of when they were submitted.
     */
    orderBy?: 'createdAt' | 'decidedAt';
    /**
     * Restrict the result to approvals where the given user id was the actual
     * decision-maker (matches `approvedById` or `rejectedById`). Used by the
     * mobile decision-history view so that each executive sees only the
     * decisions *they* made, not every resolved approval in their org.
     */
    decidedByUserId?: number;
  } = {},
): Promise<ApprovalRequest[]> {
  const conditions = [] as Array<ReturnType<typeof eq>>;
  if (options.statuses && options.statuses.length > 0) {
    conditions.push(
      inArray(approvalRequestsTable.status, options.statuses) as ReturnType<typeof eq>,
    );
  }
  if (options.orgId != null) {
    conditions.push(eq(approvalRequestsTable.orgId, options.orgId));
  }
  if (options.decidedByUserId != null) {
    const decidedByClause = or(
      eq(approvalRequestsTable.approvedById, options.decidedByUserId),
      eq(approvalRequestsTable.rejectedById, options.decidedByUserId),
    );
    if (decidedByClause) conditions.push(decidedByClause as ReturnType<typeof eq>);
  }

  const orderClause =
    options.orderBy === 'decidedAt'
      ? sql`COALESCE(${approvalRequestsTable.approvedAt}, ${approvalRequestsTable.rejectedAt}, ${approvalRequestsTable.createdAt}) DESC`
      : desc(approvalRequestsTable.createdAt);

  const query = db
    .select()
    .from(approvalRequestsTable)
    .orderBy(orderClause)
    .limit(options.limit ?? 200);

  if (conditions.length === 0) return query;
  return query.where(and(...conditions));
}

export async function getApprovalAuditTrail(approvalId: number) {
  return db
    .select()
    .from(approvalAuditTrailTable)
    .where(eq(approvalAuditTrailTable.approvalId, approvalId))
    .orderBy(desc(approvalAuditTrailTable.createdAt));
}

export async function getApprovalComments(approvalId: number) {
  return db
    .select()
    .from(approvalCommentsTable)
    .where(eq(approvalCommentsTable.approvalId, approvalId))
    .orderBy(desc(approvalCommentsTable.createdAt));
}

export async function expireStaleApprovals(): Promise<number> {
  const now = new Date();
  const stale = await db
    .select({ id: approvalRequestsTable.id, orgId: approvalRequestsTable.orgId })
    .from(approvalRequestsTable)
    .where(and(eq(approvalRequestsTable.status, 'pending')));

  let expired = 0;
  for (const row of stale) {
    const [full] = await db
      .select()
      .from(approvalRequestsTable)
      .where(eq(approvalRequestsTable.id, row.id));
    if (full?.expiresAt && full.expiresAt < now) {
      await db
        .update(approvalRequestsTable)
        .set({ status: 'expired', updatedAt: now })
        .where(eq(approvalRequestsTable.id, row.id));
      await writeAuditEntry({
        approvalId: row.id,
        orgId: row.orgId,
        action: 'expired',
        fromStatus: 'pending',
        toStatus: 'expired',
        serviceAttribution: 'approvals:scheduler',
      });
      expired++;
    }
  }
  return expired;
}
