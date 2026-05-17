import { withFilter } from 'graphql-subscriptions';
import {
  processSignalIntoWorkflow,
  requestApproval,
  reviewApproval,
  startWorkflowRun,
  writeAuditLog,
} from '../../lib/alloy-orchestration.js';
import { domainEventBus } from '../../lib/domain-events/index.js';
import { ALLOY_EVENTS, pubsub } from '../../lib/pubsub-bridge.js';
import { publish, WS_CHANNELS } from '../../lib/websocket.js';
import { parseIntId } from '../utils.js';

export { ALLOY_EVENTS, pubsub };

type PublisherCtx = { req?: { user?: { id?: number; orgs?: Array<{ orgId: number }> } } };
type SubscriberCtx = { wsUser?: { id: number; orgs: Array<{ orgId: number }> } };

async function resolveResourceOrgIds(
  ownerUserId: number | null | undefined,
  actorId: number | null | undefined,
): Promise<number[]> {
  const userId = ownerUserId ?? actorId;
  if (!userId) return [];
  const { db } = await import('@szl-holdings/db');
  const { orgMembersTable } = await import('@szl-holdings/db/schema');
  const { eq } = await import('drizzle-orm');
  const rows = await db
    .select({ orgId: orgMembersTable.orgId })
    .from(orgMembersTable)
    .where(eq(orgMembersTable.userId, userId));
  return rows.map((r) => r.orgId);
}

function ownerOf(resource: unknown): number | null {
  if (resource == null || typeof resource !== 'object') return null;
  const r = resource as Record<string, unknown>;
  const v = r['ownerUserId'] ?? r['requestedByUserId'] ?? r['createdByUserId'];
  return typeof v === 'number' ? v : null;
}

function checkOrgAccess(eventOrgIds: number[] | undefined, ctx: SubscriberCtx): boolean {
  if (!ctx?.wsUser) return false;
  if (!eventOrgIds?.length) return false;
  const userOrgIds = new Set(ctx.wsUser.orgs.map(o => o.orgId));
  return eventOrgIds.some(id => userOrgIds.has(id));
}

// ─── Workflow State Machine ────────────────────────────────────────────────────
// Enforced at mutation layer. Every status change validates against this matrix.
// DB schema status enum: draft | pending | running | waiting_approval | approved | rejected | completed | failed | cancelled
//
// Lifecycle:
//   draft           → pending (submit via submitAlloyWorkflow) | cancelled
//   pending         → waiting_approval (if requiresApproval) | running (direct start) | cancelled
//   waiting_approval → approved | rejected | cancelled
//   approved        → running | cancelled
//   running         → completed | failed | cancelled
//   failed          → pending (retry) | cancelled
//   terminal: completed, rejected, cancelled

const WORKFLOW_STATE_MACHINE: Record<string, string[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['waiting_approval', 'running', 'cancelled'],
  waiting_approval: ['approved', 'rejected', 'cancelled'],
  approved: ['running', 'cancelled'],
  running: ['completed', 'failed', 'cancelled'],
  failed: ['pending', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: [],
};

function canTransition(from: string, to: string): boolean {
  return (WORKFLOW_STATE_MACHINE[from] ?? []).includes(to);
}

// Valid DB enum values for alloy_workflow_runs.status
type WorkflowRunStatus = 'started' | 'completed' | 'failed' | 'cancelled';

const VALID_RUN_STATUSES = new Set<WorkflowRunStatus>([
  'started',
  'completed',
  'failed',
  'cancelled',
]);

// Valid DB enum values for alloy_workflows.type
type WorkflowType =
  | 'investigation'
  | 'remediation'
  | 'escalation'
  | 'review'
  | 'notification'
  | 'report'
  | 'custom';
const VALID_WORKFLOW_TYPES = new Set<WorkflowType>([
  'investigation',
  'remediation',
  'escalation',
  'review',
  'notification',
  'report',
  'custom',
]);

// Valid DB enum values for alloy_workflows.priority
type WorkflowPriority = 'low' | 'medium' | 'high' | 'critical';
const VALID_PRIORITIES = new Set<WorkflowPriority>(['low', 'medium', 'high', 'critical']);

// Valid DB enum values for alloy_workflows.status (now includes "draft" as initial state)
type WorkflowStatus =
  | 'draft'
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed'
  | 'cancelled';
const VALID_WORKFLOW_STATUSES = new Set<WorkflowStatus>([
  'draft',
  'pending',
  'running',
  'waiting_approval',
  'approved',
  'rejected',
  'completed',
  'failed',
  'cancelled',
]);

// Valid DB enum values for alloy_actions.type
type ActionType =
  | 'alert'
  | 'notify'
  | 'escalate'
  | 'assign'
  | 'resolve'
  | 'suppress'
  | 'review'
  | 'remediate'
  | 'report'
  | 'custom';
const VALID_ACTION_TYPES = new Set<ActionType>([
  'alert',
  'notify',
  'escalate',
  'assign',
  'resolve',
  'suppress',
  'review',
  'remediate',
  'report',
  'custom',
]);

function coerceWorkflowType(t: string | undefined): WorkflowType {
  return VALID_WORKFLOW_TYPES.has(t as WorkflowType) ? (t as WorkflowType) : 'investigation';
}

function coercePriority(p: string | undefined): WorkflowPriority {
  return VALID_PRIORITIES.has(p as WorkflowPriority) ? (p as WorkflowPriority) : 'medium';
}

function coerceActionType(t: string | undefined): ActionType {
  return VALID_ACTION_TYPES.has(t as ActionType) ? (t as ActionType) : 'custom';
}

export const alloyTypeDefs = `#graphql
  # ── Workflow State Machine ────────────────────────────────────────────────────
  # States: draft → pending → [waiting_approval →] [approved →] running → completed | failed | cancelled | rejected
  # All transitions are validated at resolver level — arbitrary status updates are rejected.

  enum AlloyWorkflowStatus {
    draft
    pending
    waiting_approval
    approved
    running
    completed
    failed
    cancelled
    rejected
  }

  enum AlloyApprovalState {
    none
    pending
    approved
    rejected
    expired
  }

  enum AlloySeverity {
    low
    medium
    high
    critical
  }

  enum AlloyPriority {
    low
    medium
    high
    critical
  }

  # ── Core Types ────────────────────────────────────────────────────────────────

  type AlloySignal {
    id: ID!
    source: String
    sourceType: String
    domain: String
    severity: String
    status: String
    title: String
    description: String
    confidence: Float
    ownerUserId: ID
    environment: String
    createdAt: String
    updatedAt: String
  }

  type AlloyWorkflowStep {
    step: Int!
    name: String!
    description: String
    status: String!
    startedAt: String
    completedAt: String
    error: String
  }

  type AlloyWorkflow {
    id: ID!
    name: String!
    description: String
    type: String
    domain: String
    status: AlloyWorkflowStatus!
    priority: AlloyPriority
    requiresApproval: Boolean!
    approvalState: AlloyApprovalState!
    confidenceScore: Float
    triggerId: ID
    triggerType: String
    environment: String
    steps: [AlloyWorkflowStep!]
    currentStep: Int
    retryCount: Int
    ownerUserId: ID
    startedAt: String
    completedAt: String
    errorMessage: String
    createdAt: String
    updatedAt: String
    # Derived — enforced by server, not DB stored
    canRun: Boolean!
    canCancel: Boolean!
    canRetry: Boolean!
    allowedNextStates: [String!]!
  }

  type AlloyWorkflowRun {
    id: ID!
    workflowId: ID!
    runNumber: Int!
    status: String!
    trigger: String
    durationMs: Int
    errorMessage: String
    ownerUserId: ID
    approvalState: String
    stepsExecuted: [AlloyWorkflowStep!]
    startedAt: String
    completedAt: String
  }

  type AlloyApproval {
    id: ID!
    workflowId: ID!
    status: String!
    reason: String
    reviewNote: String
    requestedByUserId: ID
    reviewerUserId: ID
    requiredRoles: [String!]
    expiresAt: String
    reviewedAt: String
    createdAt: String
  }

  type AlloyAction {
    id: ID!
    workflowId: ID!
    type: String
    status: String
    description: String
    outcome: String
    actorUserId: ID
    actorType: String
    executedAt: String
    createdAt: String
  }

  type AlloyArtifact {
    id: ID!
    workflowId: ID
    signalId: ID
    type: String
    title: String
    content: String
    domain: String
    format: String
    confidenceScore: Float
    requiresApproval: Boolean
    approvalState: String
    tags: [String!]
    ownerUserId: ID
    publishedAt: String
    createdAt: String
  }

  type AlloyAuditEntry {
    id: ID!
    entityType: String!
    entityId: ID!
    action: String!
    actorUserId: ID
    actorType: String!
    previousState: String
    newState: String
    notes: String
    correlationId: String
    createdAt: String!
  }

  type AlloyDashboardStats {
    totalWorkflows: Int!
    totalRuns: Int!
    runningRuns: Int!
    pendingApprovals: Int!
    failedRuns: Int!
    successRate: Float!
    avgDurationMs: Float
    workflowsByStatus: [AlloyStatusCount!]!
    recentActivity: [AlloyAuditEntry!]!
  }

  type AlloyStatusCount {
    status: String!
    count: Int!
  }

  # ── Queries ───────────────────────────────────────────────────────────────────

  extend type Query {
    alloySignals(limit: Int, offset: Int, severity: String, status: String, domain: String): [AlloySignal!]!
    alloySignal(id: ID!): AlloySignal

    alloyWorkflows(limit: Int, offset: Int, status: String, priority: String, domain: String): [AlloyWorkflow!]!
    alloyWorkflow(id: ID!): AlloyWorkflow
    alloyWorkflowStateTransitions(workflowId: ID!): [String!]!

    alloyWorkflowRuns(workflowId: ID, limit: Int, offset: Int, status: String): [AlloyWorkflowRun!]!
    alloyWorkflowRun(id: ID!): AlloyWorkflowRun

    alloyApprovals(workflowId: ID, status: String, limit: Int, offset: Int): [AlloyApproval!]!
    alloyApproval(id: ID!): AlloyApproval

    alloyActions(workflowId: ID, limit: Int, offset: Int): [AlloyAction!]!
    alloyArtifacts(workflowId: ID, domain: String, limit: Int, offset: Int): [AlloyArtifact!]!

    alloyAuditLog(entityType: String, entityId: ID, limit: Int, offset: Int): [AlloyAuditEntry!]!
    alloyDashboard: AlloyDashboardStats!
  }

  # ── Mutations ─────────────────────────────────────────────────────────────────

  extend type Mutation {
    # Workflow lifecycle — all transitions validated against state machine
    createAlloyWorkflow(name: String!, type: String, priority: String, description: String, domain: String, requiresApproval: Boolean): AlloyWorkflow!
    submitAlloyWorkflow(id: ID!): AlloyWorkflow!
    cancelAlloyWorkflow(id: ID!, reason: String): AlloyWorkflow!
    retryAlloyWorkflow(id: ID!): AlloyWorkflow!

    # Approval flow
    requestAlloyApproval(workflowId: ID!, reason: String, reviewerUserId: ID, expiresInHours: Int): AlloyApproval!
    reviewAlloyApproval(approvalId: ID!, decision: String!, reviewNote: String, reviewerUserId: ID!): AlloyApproval!

    # Execution
    runAlloyWorkflow(workflowId: ID!, overrideApproval: Boolean): AlloyWorkflowRun!
    advanceAlloyWorkflowStep(runId: ID!, stepNumber: Int!, result: String!, error: String): AlloyWorkflowRun!

    # Signal processing
    createAlloySignalWorkflow(signalId: ID!, workflowType: String, priority: String): AlloyWorkflow

    # Actions — type must be a valid alloy_actions.type enum value
    recordAlloyAction(workflowId: ID!, type: String!, description: String, outcome: String): AlloyAction!
  }

  # ── Subscriptions ─────────────────────────────────────────────────────────────

  extend type Subscription {
    alloyWorkflowRunUpdated(workflowId: ID): AlloyWorkflowRun!
    alloyApprovalRequired(reviewerUserId: ID): AlloyApproval!
    alloyWorkflowStatusChanged: AlloyWorkflow!
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function enrichWorkflow(workflow: Record<string, unknown>) {
  const status = String(workflow.status ?? 'pending');
  const allowed = WORKFLOW_STATE_MACHINE[status] ?? [];
  return {
    ...workflow,
    canRun: allowed.includes('running'),
    canCancel: allowed.includes('cancelled'),
    canRetry: status === 'failed',
    allowedNextStates: allowed,
    steps: Array.isArray(workflow.steps) ? workflow.steps : [],
    requiresApproval: workflow.requiresApproval ?? false,
    approvalState: workflow.approvalState ?? 'none',
  };
}

function auditEntrySerialize(r: Record<string, unknown>) {
  return {
    ...r,
    previousState: r.previousState ? JSON.stringify(r.previousState) : null,
    newState: r.newState ? JSON.stringify(r.newState) : null,
  };
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

export const alloyResolvers = {
  Query: {
    alloySignals: async (
      _: unknown,
      args: {
        limit?: number;
        offset?: number;
        severity?: string;
        status?: string;
        domain?: string;
      },
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloySignals } = await import('@szl-holdings/db/schema');
        const { desc, eq, and } = await import('drizzle-orm');
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.severity)
          conditions.push(
            eq(alloySignals.severity, args.severity as typeof alloySignals.severity._.data),
          );
        if (args.status)
          conditions.push(
            eq(alloySignals.status, args.status as typeof alloySignals.status._.data),
          );
        if (args.domain) conditions.push(eq(alloySignals.domain, args.domain));
        const q = db
          .select()
          .from(alloySignals)
          .orderBy(desc(alloySignals.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
        return conditions.length > 0 ? await q.where(and(...conditions)) : await q;
      } catch {
        return [];
      }
    },

    alloySignal: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloySignals } = await import('@szl-holdings/db/schema');
        const { eq } = await import('drizzle-orm');
        const rows = await db
          .select()
          .from(alloySignals)
          .where(eq(alloySignals.id, parseInt(args.id, 10)))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },

    alloyWorkflows: async (
      _: unknown,
      args: {
        limit?: number;
        offset?: number;
        status?: string;
        priority?: string;
        domain?: string;
      },
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflows } = await import('@szl-holdings/db/schema');
        const { desc, eq, and } = await import('drizzle-orm');
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.status && VALID_WORKFLOW_STATUSES.has(args.status as WorkflowStatus)) {
          conditions.push(eq(alloyWorkflows.status, args.status as WorkflowStatus));
        }
        if (args.priority && VALID_PRIORITIES.has(args.priority as WorkflowPriority)) {
          conditions.push(eq(alloyWorkflows.priority, args.priority as WorkflowPriority));
        }
        if (args.domain) conditions.push(eq(alloyWorkflows.domain, args.domain));
        const q = db
          .select()
          .from(alloyWorkflows)
          .orderBy(desc(alloyWorkflows.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
        const rows = conditions.length > 0 ? await q.where(and(...conditions)) : await q;
        return rows.map((r) => enrichWorkflow(r as unknown as Record<string, unknown>));
      } catch {
        return [];
      }
    },

    alloyWorkflow: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflows } = await import('@szl-holdings/db/schema');
        const { eq } = await import('drizzle-orm');
        const rows = await db
          .select()
          .from(alloyWorkflows)
          .where(eq(alloyWorkflows.id, parseInt(args.id, 10)))
          .limit(1);
        return rows[0] ? enrichWorkflow(rows[0] as unknown as Record<string, unknown>) : null;
      } catch {
        return null;
      }
    },

    alloyWorkflowStateTransitions: async (_: unknown, args: { workflowId: string }) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflows } = await import('@szl-holdings/db/schema');
        const { eq } = await import('drizzle-orm');
        const rows = await db
          .select({ status: alloyWorkflows.status })
          .from(alloyWorkflows)
          .where(eq(alloyWorkflows.id, parseInt(args.workflowId, 10)))
          .limit(1);
        return rows[0] ? (WORKFLOW_STATE_MACHINE[rows[0].status] ?? []) : [];
      } catch {
        return [];
      }
    },

    alloyWorkflowRuns: async (
      _: unknown,
      args: { workflowId?: string; limit?: number; offset?: number; status?: string },
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflowRuns } = await import('@szl-holdings/db/schema');
        const { desc, eq, and } = await import('drizzle-orm');
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.workflowId)
          conditions.push(eq(alloyWorkflowRuns.workflowId, parseInt(args.workflowId, 10)));
        if (args.status && VALID_RUN_STATUSES.has(args.status as WorkflowRunStatus)) {
          conditions.push(eq(alloyWorkflowRuns.status, args.status as WorkflowRunStatus));
        }
        const q = db
          .select()
          .from(alloyWorkflowRuns)
          .orderBy(desc(alloyWorkflowRuns.startedAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
        return conditions.length > 0 ? await q.where(and(...conditions)) : await q;
      } catch {
        return [];
      }
    },

    alloyWorkflowRun: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflowRuns } = await import('@szl-holdings/db/schema');
        const { eq } = await import('drizzle-orm');
        const rows = await db
          .select()
          .from(alloyWorkflowRuns)
          .where(eq(alloyWorkflowRuns.id, parseIntId(args.id)))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },

    alloyApprovals: async (
      _: unknown,
      args: { workflowId?: string; status?: string; limit?: number; offset?: number },
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyApprovals } = await import('@szl-holdings/db/schema');
        const { desc, eq, and } = await import('drizzle-orm');
        type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
        const VALID_APPROVAL_STATUSES = new Set<ApprovalStatus>([
          'pending',
          'approved',
          'rejected',
          'expired',
        ]);
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.workflowId)
          conditions.push(eq(alloyApprovals.workflowId, parseInt(args.workflowId, 10)));
        if (args.status && VALID_APPROVAL_STATUSES.has(args.status as ApprovalStatus)) {
          conditions.push(eq(alloyApprovals.status, args.status as ApprovalStatus));
        }
        const q = db
          .select()
          .from(alloyApprovals)
          .orderBy(desc(alloyApprovals.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
        return conditions.length > 0 ? await q.where(and(...conditions)) : await q;
      } catch {
        return [];
      }
    },

    alloyApproval: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyApprovals } = await import('@szl-holdings/db/schema');
        const { eq } = await import('drizzle-orm');
        const rows = await db
          .select()
          .from(alloyApprovals)
          .where(eq(alloyApprovals.id, parseIntId(args.id)))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },

    alloyActions: async (
      _: unknown,
      args: { workflowId?: string; limit?: number; offset?: number },
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyActions } = await import('@szl-holdings/db/schema');
        const { desc, eq } = await import('drizzle-orm');
        const q = db
          .select()
          .from(alloyActions)
          .orderBy(desc(alloyActions.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
        if (args.workflowId)
          return await q.where(eq(alloyActions.workflowId, parseInt(args.workflowId, 10)));
        return await q;
      } catch {
        return [];
      }
    },

    alloyArtifacts: async (
      _: unknown,
      args: { workflowId?: string; domain?: string; limit?: number; offset?: number },
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyArtifacts } = await import('@szl-holdings/db/schema');
        const { desc, eq, and } = await import('drizzle-orm');
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.workflowId)
          conditions.push(eq(alloyArtifacts.workflowId, parseInt(args.workflowId, 10)));
        if (args.domain) conditions.push(eq(alloyArtifacts.domain, args.domain));
        const q = db
          .select()
          .from(alloyArtifacts)
          .orderBy(desc(alloyArtifacts.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
        return conditions.length > 0 ? await q.where(and(...conditions)) : await q;
      } catch {
        return [];
      }
    },

    alloyAuditLog: async (
      _: unknown,
      args: { entityType?: string; entityId?: string; limit?: number; offset?: number },
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyAuditLog } = await import('@szl-holdings/db/schema');
        const { desc, eq, and } = await import('drizzle-orm');
        type AuditEntityType = 'signal' | 'workflow' | 'action' | 'artifact' | 'approval' | 'owner';
        const VALID_ENTITY_TYPES = new Set<AuditEntityType>([
          'signal',
          'workflow',
          'action',
          'artifact',
          'approval',
          'owner',
        ]);
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.entityType && VALID_ENTITY_TYPES.has(args.entityType as AuditEntityType)) {
          conditions.push(eq(alloyAuditLog.entityType, args.entityType as AuditEntityType));
        }
        if (args.entityId) conditions.push(eq(alloyAuditLog.entityId, parseInt(args.entityId, 10)));
        const q = db
          .select()
          .from(alloyAuditLog)
          .orderBy(desc(alloyAuditLog.createdAt))
          .limit(args.limit ?? 100)
          .offset(args.offset ?? 0);
        const rows = conditions.length > 0 ? await q.where(and(...conditions)) : await q;
        return rows.map((r) => auditEntrySerialize(r as unknown as Record<string, unknown>));
      } catch {
        return [];
      }
    },

    alloyDashboard: async () => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflows, alloyWorkflowRuns, alloyApprovals, alloyAuditLog } = await import(
          '@szl-holdings/db/schema'
        );
        const { desc, eq } = await import('drizzle-orm');

        const [workflows, runs, pendingApprovals, recentAudit] = await Promise.all([
          db.select().from(alloyWorkflows).orderBy(desc(alloyWorkflows.createdAt)).limit(200),
          db.select().from(alloyWorkflowRuns).orderBy(desc(alloyWorkflowRuns.startedAt)).limit(200),
          db.select().from(alloyApprovals).where(eq(alloyApprovals.status, 'pending')).limit(50),
          db.select().from(alloyAuditLog).orderBy(desc(alloyAuditLog.createdAt)).limit(10),
        ]);

        const running = runs.filter((r) => r.status === 'started').length;
        const failed = runs.filter((r) => r.status === 'failed').length;
        const completed = runs.filter((r) => r.status === 'completed').length;
        const successRate = runs.length > 0 ? Math.round((completed / runs.length) * 100) : 100;
        const completedWithDuration = runs.filter((r) => r.durationMs && r.status === 'completed');
        const avgDurationMs =
          completedWithDuration.length > 0
            ? completedWithDuration.reduce((s, r) => s + (r.durationMs ?? 0), 0) /
              completedWithDuration.length
            : null;

        const statusCounts: Record<string, number> = {};
        for (const wf of workflows) statusCounts[wf.status] = (statusCounts[wf.status] ?? 0) + 1;

        return {
          totalWorkflows: workflows.length,
          totalRuns: runs.length,
          runningRuns: running,
          pendingApprovals: pendingApprovals.length,
          failedRuns: failed,
          successRate,
          avgDurationMs,
          workflowsByStatus: Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
          })),
          recentActivity: recentAudit.map((r) =>
            auditEntrySerialize(r as unknown as Record<string, unknown>),
          ),
        };
      } catch {
        return {
          totalWorkflows: 0,
          totalRuns: 0,
          runningRuns: 0,
          pendingApprovals: 0,
          failedRuns: 0,
          successRate: 100,
          avgDurationMs: null,
          workflowsByStatus: [],
          recentActivity: [],
        };
      }
    },
  },

  Mutation: {
    createAlloyWorkflow: async (
      _: unknown,
      args: {
        name: string;
        type?: string;
        priority?: string;
        description?: string;
        domain?: string;
        requiresApproval?: boolean;
      },
      context: PublisherCtx,
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflows } = await import('@szl-holdings/db/schema');
        const rows = await db
          .insert(alloyWorkflows)
          .values({
            name: args.name,
            type: coerceWorkflowType(args.type),
            priority: coercePriority(args.priority),
            status: 'draft',
            requiresApproval: args.requiresApproval ?? false,
            approvalState: 'none',
            domain: args.domain ?? 'general',
          })
          .returning();
        const wf = rows[0];
        await writeAuditLog({
          entityType: 'workflow',
          entityId: wf.id,
          action: 'created',
          actorType: 'user',
          newState: { status: 'draft', name: args.name },
        });
        const wfOrgIds = await resolveResourceOrgIds(wf.ownerUserId, context.req?.user?.id);
        pubsub.publish(ALLOY_EVENTS.WORKFLOW_STATUS_CHANGED, {
          alloyWorkflowStatusChanged: enrichWorkflow(wf as unknown as Record<string, unknown>),
          _orgIds: wfOrgIds,
        });
        return enrichWorkflow(wf as unknown as Record<string, unknown>);
      } catch (err) {
        throw new Error(`Failed to create workflow: ${err}`);
      }
    },

    submitAlloyWorkflow: async (_: unknown, args: { id: string }, context: PublisherCtx) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflows } = await import('@szl-holdings/db/schema');
        const { eq } = await import('drizzle-orm');
        const id = parseIntId(args.id);
        const [existing] = await db
          .select({ status: alloyWorkflows.status })
          .from(alloyWorkflows)
          .where(eq(alloyWorkflows.id, id))
          .limit(1);
        if (!existing) throw new Error('Workflow not found');
        if (existing.status !== 'draft') {
          throw new Error(
            `Cannot submit workflow in state '${existing.status}' — only draft workflows can be submitted`,
          );
        }
        if (!canTransition(existing.status, 'pending')) {
          throw new Error(`State machine error: draft → pending transition not allowed`);
        }
        const rows = await db
          .update(alloyWorkflows)
          .set({ status: 'pending', updatedAt: new Date() })
          .where(eq(alloyWorkflows.id, id))
          .returning();
        const wf = rows[0];
        await writeAuditLog({
          entityType: 'workflow',
          entityId: id,
          action: 'submitted',
          actorType: 'user',
          previousState: { status: 'draft' },
          newState: { status: 'pending' },
        });
        const wfOrgIds = await resolveResourceOrgIds(wf.ownerUserId, context.req?.user?.id);
        pubsub.publish(ALLOY_EVENTS.WORKFLOW_STATUS_CHANGED, {
          alloyWorkflowStatusChanged: enrichWorkflow(wf as unknown as Record<string, unknown>),
          _orgIds: wfOrgIds,
        });
        const { alloyWorkflowRuns } = await import('@szl-holdings/db/schema');
        const { desc: descFn } = await import('drizzle-orm');
        const latestRuns = await db
          .select()
          .from(alloyWorkflowRuns)
          .where(eq(alloyWorkflowRuns.workflowId, id))
          .orderBy(descFn(alloyWorkflowRuns.runNumber))
          .limit(1);
        if (latestRuns[0]) {
          const runOrgIds = await resolveResourceOrgIds(latestRuns[0].ownerUserId, context.req?.user?.id);
          pubsub.publish(ALLOY_EVENTS.WORKFLOW_RUN_UPDATED, {
            alloyWorkflowRunUpdated: latestRuns[0],
            _orgIds: runOrgIds,
          });
        }
        return enrichWorkflow(wf as unknown as Record<string, unknown>);
      } catch (err) {
        throw new Error(`Failed to submit workflow: ${err}`);
      }
    },

    cancelAlloyWorkflow: async (_: unknown, args: { id: string; reason?: string }, context: PublisherCtx) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflows, alloyWorkflowRuns } = await import('@szl-holdings/db/schema');
        const { and, eq } = await import('drizzle-orm');
        const id = parseIntId(args.id);
        const [existing] = await db
          .select({ status: alloyWorkflows.status })
          .from(alloyWorkflows)
          .where(eq(alloyWorkflows.id, id))
          .limit(1);
        if (!existing) throw new Error('Workflow not found');
        if (!canTransition(existing.status, 'cancelled')) {
          throw new Error(`Cannot cancel workflow in terminal state '${existing.status}'`);
        }
        const rows = await db
          .update(alloyWorkflows)
          .set({ status: 'cancelled', updatedAt: new Date(), errorMessage: args.reason ?? null })
          .where(eq(alloyWorkflows.id, id))
          .returning();
        const wf = rows[0];
        await writeAuditLog({
          entityType: 'workflow',
          entityId: id,
          action: 'cancelled',
          actorType: 'user',
          previousState: { status: existing.status },
          newState: { status: 'cancelled' },
          notes: args.reason,
        });
        const wfOrgIds = await resolveResourceOrgIds(wf.ownerUserId, context.req?.user?.id);
        pubsub.publish(ALLOY_EVENTS.WORKFLOW_STATUS_CHANGED, {
          alloyWorkflowStatusChanged: enrichWorkflow(wf as unknown as Record<string, unknown>),
          _orgIds: wfOrgIds,
        });
        const cancelledRuns = await db
          .update(alloyWorkflowRuns)
          .set({ status: 'cancelled', completedAt: new Date() })
          .where(and(eq(alloyWorkflowRuns.workflowId, id), eq(alloyWorkflowRuns.status, 'started')))
          .returning();
        for (const run of cancelledRuns) {
          const runOrgIds = await resolveResourceOrgIds(run.ownerUserId, context.req?.user?.id);
          pubsub.publish(ALLOY_EVENTS.WORKFLOW_RUN_UPDATED, { alloyWorkflowRunUpdated: run, _orgIds: runOrgIds });
        }
        return enrichWorkflow(wf as unknown as Record<string, unknown>);
      } catch (err) {
        throw new Error(`Failed to cancel workflow: ${err}`);
      }
    },

    retryAlloyWorkflow: async (_: unknown, args: { id: string }, context: PublisherCtx) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflows, alloyWorkflowRuns } = await import('@szl-holdings/db/schema');
        const { and, desc, eq } = await import('drizzle-orm');
        const id = parseIntId(args.id);
        const [existing] = await db
          .select({ status: alloyWorkflows.status })
          .from(alloyWorkflows)
          .where(eq(alloyWorkflows.id, id))
          .limit(1);
        if (!existing) throw new Error('Workflow not found');
        if (existing.status !== 'failed') {
          throw new Error(
            `Cannot retry workflow in state '${existing.status}' — only failed workflows can be retried`,
          );
        }
        if (!canTransition(existing.status, 'pending')) {
          throw new Error(`State machine error: failed → pending transition not allowed`);
        }
        const rows = await db
          .update(alloyWorkflows)
          .set({ status: 'pending', errorMessage: null, updatedAt: new Date() })
          .where(eq(alloyWorkflows.id, id))
          .returning();
        const wf = rows[0];
        await writeAuditLog({
          entityType: 'workflow',
          entityId: id,
          action: 'retry_requested',
          actorType: 'user',
          previousState: { status: existing.status },
          newState: { status: 'pending' },
        });
        const wfOrgIds = await resolveResourceOrgIds(wf.ownerUserId, context.req?.user?.id);
        pubsub.publish(ALLOY_EVENTS.WORKFLOW_STATUS_CHANGED, {
          alloyWorkflowStatusChanged: enrichWorkflow(wf as unknown as Record<string, unknown>),
          _orgIds: wfOrgIds,
        });
        const [latestFailedRun] = await db
          .select()
          .from(alloyWorkflowRuns)
          .where(and(eq(alloyWorkflowRuns.workflowId, id), eq(alloyWorkflowRuns.status, 'failed')))
          .orderBy(desc(alloyWorkflowRuns.startedAt))
          .limit(1);
        if (latestFailedRun) {
          const [retriedRun] = await db
            .update(alloyWorkflowRuns)
            .set({
              status: 'started',
              completedAt: null,
              errorMessage: null,
              retryCount: (latestFailedRun.retryCount ?? 0) + 1,
            })
            .where(eq(alloyWorkflowRuns.id, latestFailedRun.id))
            .returning();
          if (retriedRun) {
            const retriedRunOrgIds = await resolveResourceOrgIds(retriedRun.ownerUserId, context.req?.user?.id);
            pubsub.publish(ALLOY_EVENTS.WORKFLOW_RUN_UPDATED, { alloyWorkflowRunUpdated: retriedRun, _orgIds: retriedRunOrgIds });
          }
        }
        return enrichWorkflow(wf as unknown as Record<string, unknown>);
      } catch (err) {
        throw new Error(`Failed to retry workflow: ${err}`);
      }
    },

    requestAlloyApproval: async (
      _: unknown,
      args: {
        workflowId: string;
        reason?: string;
        reviewerUserId?: string;
        expiresInHours?: number;
      },
      context: PublisherCtx,
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflows, alloyApprovals } = await import('@szl-holdings/db/schema');
        const { and, desc, eq } = await import('drizzle-orm');
        const workflowId = parseIntId(args.workflowId);
        const [existing] = await db
          .select({ status: alloyWorkflows.status })
          .from(alloyWorkflows)
          .where(eq(alloyWorkflows.id, workflowId))
          .limit(1);
        if (!existing) throw new Error('Workflow not found');
        const isPending = existing.status === 'pending';
        const isAlreadyWaiting = existing.status === 'waiting_approval';
        if (!isPending && !isAlreadyWaiting) {
          throw new Error(
            `Cannot request approval for workflow in state '${existing.status}' — workflow must be in 'pending' or 'waiting_approval' state`,
          );
        }
        if (isAlreadyWaiting) {
          // Idempotent: only re-create approval if no pending approval exists
          const [pendingApproval] = await db
            .select({ id: alloyApprovals.id })
            .from(alloyApprovals)
            .where(
              and(eq(alloyApprovals.workflowId, workflowId), eq(alloyApprovals.status, 'pending')),
            )
            .limit(1);
          if (pendingApproval)
            throw new Error(
              'Workflow already has a pending approval — use reviewAlloyApproval to resolve it',
            );
        }
        await requestApproval(workflowId, {
          reason: args.reason,
          reviewerUserId: args.reviewerUserId ? parseInt(args.reviewerUserId, 10) : undefined,
          expiresInHours: args.expiresInHours,
        });
        const rows = await db
          .select()
          .from(alloyApprovals)
          .where(eq(alloyApprovals.workflowId, workflowId))
          .orderBy(desc(alloyApprovals.createdAt))
          .limit(1);
        const approval = rows[0];
        const approvalOrgIds = await resolveResourceOrgIds(approval.requestedByUserId, context.req?.user?.id);
        pubsub.publish(ALLOY_EVENTS.APPROVAL_REQUIRED, { alloyApprovalRequired: approval, _orgIds: approvalOrgIds });
        return approval;
      } catch (err) {
        throw new Error(`Failed to request approval: ${err}`);
      }
    },

    reviewAlloyApproval: async (
      _: unknown,
      args: { approvalId: string; decision: string; reviewNote?: string; reviewerUserId: string },
    ) => {
      try {
        if (!['approved', 'rejected'].includes(args.decision)) {
          throw new Error(`Invalid decision '${args.decision}' — must be 'approved' or 'rejected'`);
        }
        const reviewerUserId = parseInt(args.reviewerUserId, 10);
        if (!reviewerUserId || Number.isNaN(reviewerUserId))
          throw new Error('reviewerUserId is required and must be a valid integer');
        // Validate the linked workflow is in waiting_approval state before reviewing
        const { db } = await import('@szl-holdings/db');
        const { alloyApprovals, alloyWorkflows } = await import('@szl-holdings/db/schema');
        const { eq } = await import('drizzle-orm');
        const approvalId = parseIntId(args.approvalId);
        const [approval] = await db
          .select({ workflowId: alloyApprovals.workflowId, status: alloyApprovals.status })
          .from(alloyApprovals)
          .where(eq(alloyApprovals.id, approvalId))
          .limit(1);
        if (!approval) throw new Error('Approval not found');
        if (approval.status !== 'pending')
          throw new Error(`Approval is already '${approval.status}' — cannot review again`);
        const [workflow] = await db
          .select({ status: alloyWorkflows.status })
          .from(alloyWorkflows)
          .where(eq(alloyWorkflows.id, approval.workflowId))
          .limit(1);
        if (workflow && !canTransition(workflow.status, args.decision as 'approved' | 'rejected')) {
          throw new Error(
            `Cannot ${args.decision} approval for workflow in state '${workflow.status}' — must be in 'waiting_approval'`,
          );
        }
        await reviewApproval(approvalId, args.decision as 'approved' | 'rejected', {
          reviewerUserId,
          reviewNote: args.reviewNote,
        });
        const rows = await db
          .select()
          .from(alloyApprovals)
          .where(eq(alloyApprovals.id, approvalId))
          .limit(1);
        return rows[0];
      } catch (err) {
        throw new Error(`Failed to review approval: ${err}`);
      }
    },

    runAlloyWorkflow: async (
      _: unknown,
      args: { workflowId: string; overrideApproval?: boolean },
      context: PublisherCtx,
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflows } = await import('@szl-holdings/db/schema');
        const { eq } = await import('drizzle-orm');
        const id = parseIntId(args.workflowId);
        const [existing] = await db
          .select({ status: alloyWorkflows.status })
          .from(alloyWorkflows)
          .where(eq(alloyWorkflows.id, id))
          .limit(1);
        if (!existing) throw new Error('Workflow not found');
        if (!canTransition(existing.status, 'running')) {
          throw new Error(
            `Cannot start workflow in state '${existing.status}' — must be in pending or approved state`,
          );
        }
        const run = await startWorkflowRun(id, { overrideApproval: args.overrideApproval });
        const runOrgIds = await resolveResourceOrgIds(run.ownerUserId, context.req?.user?.id);
        pubsub.publish(ALLOY_EVENTS.WORKFLOW_RUN_UPDATED, { alloyWorkflowRunUpdated: run, _orgIds: runOrgIds });
        publish(WS_CHANNELS.WORKFLOW_RUNS, 'workflow-run-started', {
          id: run.id,
          workflowId: run.workflowId,
          status: run.status,
        });
        return run;
      } catch (err) {
        throw new Error(`Failed to run workflow: ${err}`);
      }
    },

    advanceAlloyWorkflowStep: async (
      _: unknown,
      args: { runId: string; stepNumber: number; result: string; error?: string },
      context: PublisherCtx,
    ) => {
      try {
        if (!['completed', 'failed'].includes(args.result)) {
          throw new Error(`Invalid step result '${args.result}' — must be 'completed' or 'failed'`);
        }
        const { advanceWorkflowStep } = await import('../../lib/alloy-orchestration.js');
        await advanceWorkflowStep(
          parseIntId(args.runId),
          args.stepNumber,
          args.result as 'completed' | 'failed',
          { error: args.error },
        );
        const { db } = await import('@szl-holdings/db');
        const { alloyWorkflowRuns } = await import('@szl-holdings/db/schema');
        const { eq } = await import('drizzle-orm');
        const rows = await db
          .select()
          .from(alloyWorkflowRuns)
          .where(eq(alloyWorkflowRuns.id, parseIntId(args.runId)))
          .limit(1);
        const run = rows[0];
        const runOrgIds = await resolveResourceOrgIds(run.ownerUserId, context.req?.user?.id);
        pubsub.publish(ALLOY_EVENTS.WORKFLOW_RUN_UPDATED, { alloyWorkflowRunUpdated: run, _orgIds: runOrgIds });
        return run;
      } catch (err) {
        throw new Error(`Failed to advance step: ${err}`);
      }
    },

    createAlloySignalWorkflow: async (
      _: unknown,
      args: { signalId: string; workflowType?: string; priority?: string },
      context: PublisherCtx,
    ) => {
      try {
        const signalId = parseInt(args.signalId, 10);
        const workflowType = coerceWorkflowType(args.workflowType);
        const priority = coercePriority(args.priority);

        const { db } = await import('@szl-holdings/db');
        const { alloySignals } = await import('@szl-holdings/db/schema');
        const { eq } = await import('drizzle-orm');
        const [signal] = await db
          .select()
          .from(alloySignals)
          .where(eq(alloySignals.id, signalId))
          .limit(1);
        if (signal) {
          domainEventBus.publish('alloy.signal-ingested', {
            signalId: signal.id,
            severity: signal.severity,
            domain: signal.domain ?? null,
            source: signal.source ?? 'manual',
            title: signal.title ?? `Signal #${signal.id}`,
          });
        }

        const workflow = await processSignalIntoWorkflow(signalId, {
          workflowType: workflowType as
            | 'investigation'
            | 'remediation'
            | 'escalation'
            | 'review'
            | 'notification'
            | 'report'
            | 'custom',
          priority: priority as 'low' | 'medium' | 'high' | 'critical',
        });

        if (workflow) {
          domainEventBus.publish('alloy.workflow-created', {
            workflowId: workflow.id,
            signalId,
            workflowType,
            priority,
          });
        }

        if (workflow) {
          const signalWorkflowOrgIds = await resolveResourceOrgIds(
            ownerOf(workflow) ?? signal?.ownerUserId ?? null,
            context.req?.user?.id,
          );
          pubsub.publish(ALLOY_EVENTS.WORKFLOW_STATUS_CHANGED, {
            alloyWorkflowStatusChanged: enrichWorkflow(workflow as unknown as Record<string, unknown>),
            _orgIds: signalWorkflowOrgIds,
          });
        }
        return workflow ? enrichWorkflow(workflow as unknown as Record<string, unknown>) : null;
      } catch (err) {
        throw new Error(`Failed to create signal workflow: ${err}`);
      }
    },

    recordAlloyAction: async (
      _: unknown,
      args: { workflowId: string; type: string; description?: string; outcome?: string },
    ) => {
      try {
        const { db } = await import('@szl-holdings/db');
        const { alloyActions } = await import('@szl-holdings/db/schema');
        const actionType = coerceActionType(args.type);
        const rows = await db
          .insert(alloyActions)
          .values({
            workflowId: parseIntId(args.workflowId),
            type: actionType,
            title: args.description ?? args.type,
            description: args.description,
            status: 'completed',
            completedAt: new Date(),
          })
          .returning();
        const action = rows[0];
        await writeAuditLog({
          entityType: 'action',
          entityId: action.id,
          action: 'recorded',
          actorType: 'user',
          newState: { type: actionType },
        });
        return action;
      } catch (err) {
        throw new Error(`Failed to record action: ${err}`);
      }
    },
  },

  Subscription: {
    alloyWorkflowRunUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator(ALLOY_EVENTS.WORKFLOW_RUN_UPDATED),
        (
          payload: { alloyWorkflowRunUpdated: { workflowId: number }; _orgIds?: number[] },
          variables: { workflowId?: string },
          context: SubscriberCtx,
        ) => {
          if (!checkOrgAccess(payload._orgIds, context)) return false;
          if (!variables.workflowId) return true;
          return String(payload.alloyWorkflowRunUpdated.workflowId) === variables.workflowId;
        },
      ),
    },
    alloyApprovalRequired: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator(ALLOY_EVENTS.APPROVAL_REQUIRED),
        (
          payload: { alloyApprovalRequired: { reviewerUserId?: number }; _orgIds?: number[] },
          _variables,
          context: SubscriberCtx,
        ) => {
          if (!checkOrgAccess(payload._orgIds, context)) return false;
          // Only deliver approval events addressed to the connected user.
          return payload.alloyApprovalRequired.reviewerUserId === context.wsUser?.id;
        },
      ),
    },
    alloyWorkflowStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator(ALLOY_EVENTS.WORKFLOW_STATUS_CHANGED),
        (payload: { _orgIds?: number[] }, _variables, context: SubscriberCtx) => {
          return checkOrgAccess(payload._orgIds, context);
        },
      ),
    },
  },
};
