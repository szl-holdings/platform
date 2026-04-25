import { requireRole } from '../directives.js';
import { parseIntId } from '../utils.js';

export const approvalsTypeDefs = `#graphql
  type ApprovalRequest {
    id: ID!
    orgId: Int
    resourceType: String!
    resourceId: String!
    title: String!
    description: String
    actionClass: String!
    priority: String!
    status: String!
    requestedById: Int
    requestedByRole: String
    assignedApproverId: Int
    requiredApproverRole: String
    approvedById: Int
    approvedAt: String
    rejectedById: Int
    rejectedAt: String
    escalatedAt: String
    escalationReason: String
    expiresAt: String
    correlationId: String
    serviceAttribution: String
    payload: JSON
    metadata: JSON
    createdAt: String!
    updatedAt: String!
  }

  type ApprovalAuditEntry {
    id: ID!
    approvalId: Int!
    actorId: Int
    actorRole: String
    action: String!
    fromStatus: String
    toStatus: String
    note: String
    correlationId: String
    serviceAttribution: String
    createdAt: String!
  }

  type ApprovalComment {
    id: ID!
    approvalId: Int!
    authorId: Int
    authorRole: String
    body: String!
    isInternal: Boolean!
    createdAt: String!
  }

  extend type Query {
    approvalRequest(id: ID!): ApprovalRequest @auditSensitive(actionClass: "approval_read")
    approvalRequests(status: String, orgId: Int, limit: Int): [ApprovalRequest!]! @requireRole(roles: ["super_admin", "admin", "ops", "compliance", "analyst"])
    approvalsByResource(resourceType: String!, resourceId: String!): [ApprovalRequest!]!
    approvalAuditTrail(approvalId: ID!): [ApprovalAuditEntry!]! @requireRole(roles: ["super_admin", "admin", "ops", "compliance"]) @auditSensitive(actionClass: "approval_audit_trail_read")
    approvalComments(approvalId: ID!): [ApprovalComment!]!
  }

  extend type Mutation {
    createApprovalRequest(
      resourceType: String!
      resourceId: String!
      title: String!
      description: String
      actionClass: String
      priority: String
      requiredApproverRole: String
      expiresInHours: Int
      payload: JSON
    ): ApprovalRequest! @auditSensitive(actionClass: "approval_create")

    reviewApproval(
      id: ID!
      decision: String!
      note: String
    ): ApprovalRequest! @requireRole(roles: ["super_admin", "admin", "ops", "compliance"]) @auditSensitive(actionClass: "approval_review")

    escalateApproval(
      id: ID!
      reason: String!
      escalatedToId: Int
    ): ApprovalRequest! @requireRole(roles: ["super_admin", "admin", "ops"])

    addApprovalComment(
      approvalId: ID!
      body: String!
      isInternal: Boolean
    ): Boolean!
  }
`;

type GQLContext = {
  req?: {
    user?: { id?: number; roles?: string[]; orgs?: Array<{ orgId: number }> };
    correlationId?: string;
  };
};

export const approvalsResolvers = {
  Query: {
    approvalRequest: async (_: unknown, args: { id: string }) => {
      const { getApprovalById } = await import('@szl-holdings/covenant-policy');
      return getApprovalById(parseIntId(args.id));
    },

    approvalRequests: requireRole(
      ['super_admin', 'admin', 'ops', 'compliance', 'analyst'],
      async (
        _: unknown,
        args: { status?: string; orgId?: number; limit?: number },
        ctx: GQLContext,
      ) => {
        const { listPendingApprovals } = await import('@szl-holdings/covenant-policy');
        const user = ctx?.req?.user;
        const isAdminUser = user?.roles?.some((r) => ['super_admin', 'admin'].includes(r)) ?? false;
        const orgId = args.orgId ?? (isAdminUser ? undefined : (user?.orgs?.[0]?.orgId ?? undefined));
        return listPendingApprovals({ orgId, limit: args.limit ?? 100 });
      },
    ),

    approvalsByResource: async (_: unknown, args: { resourceType: string; resourceId: string }) => {
      const { listApprovalsByResource } = await import('@szl-holdings/covenant-policy');
      return listApprovalsByResource(args.resourceType, args.resourceId);
    },

    approvalAuditTrail: requireRole(
      ['super_admin', 'admin', 'ops', 'compliance'],
      async (_: unknown, args: { approvalId: string }) => {
        const { getApprovalAuditTrail } = await import('@szl-holdings/covenant-policy');
        return getApprovalAuditTrail(parseIntId(args.approvalId));
      },
    ),

    approvalComments: async (_: unknown, args: { approvalId: string }) => {
      const { getApprovalComments } = await import('@szl-holdings/covenant-policy');
      return getApprovalComments(parseIntId(args.approvalId));
    },
  },

  Mutation: {
    createApprovalRequest: async (
      _: unknown,
      args: {
        resourceType: string;
        resourceId: string;
        title: string;
        description?: string;
        actionClass?: string;
        priority?: string;
        requiredApproverRole?: string;
        expiresInHours?: number;
        payload?: Record<string, unknown>;
      },
      ctx: GQLContext,
    ) => {
      const { createApprovalRequest } = await import('@szl-holdings/covenant-policy');
      const user = ctx?.req?.user;
      return createApprovalRequest({
        orgId: user?.orgs?.[0]?.orgId ?? null,
        resourceType: args.resourceType,
        resourceId: args.resourceId,
        title: args.title,
        description: args.description,
        actionClass: args.actionClass ?? 'general',
        priority: (args.priority as 'low' | 'medium' | 'high' | 'critical') ?? 'medium',
        requestedById: user?.id ?? null,
        requestedByRole: user?.roles?.[0],
        requiredApproverRole: args.requiredApproverRole,
        expiresAt: args.expiresInHours
          ? new Date(Date.now() + args.expiresInHours * 60 * 60 * 1000)
          : undefined,
        correlationId: ctx?.req?.correlationId,
        serviceAttribution: 'graphql',
        payload: args.payload,
      });
    },

    reviewApproval: requireRole(
      ['super_admin', 'admin', 'ops', 'compliance'],
      async (
        _: unknown,
        args: { id: string; decision: string; note?: string },
        ctx: GQLContext,
      ) => {
        const { reviewApproval } = await import('@szl-holdings/covenant-policy');
        const user = ctx?.req?.user;
        return reviewApproval({
          approvalId: parseIntId(args.id),
          actorId: user?.id ?? null,
          actorRole: user?.roles?.[0],
          decision: args.decision as 'approved' | 'rejected' | 'revised',
          note: args.note,
          correlationId: ctx?.req?.correlationId,
          serviceAttribution: 'graphql',
        });
      },
    ),

    escalateApproval: requireRole(
      ['super_admin', 'admin', 'ops'],
      async (
        _: unknown,
        args: { id: string; reason: string; escalatedToId?: number },
        ctx: GQLContext,
      ) => {
        const { escalateApproval } = await import('@szl-holdings/covenant-policy');
        const user = ctx?.req?.user;
        return escalateApproval({
          approvalId: parseIntId(args.id),
          actorId: user?.id ?? null,
          actorRole: user?.roles?.[0],
          escalatedToId: args.escalatedToId,
          reason: args.reason,
          correlationId: ctx?.req?.correlationId,
          serviceAttribution: 'graphql',
        });
      },
    ),

    addApprovalComment: async (
      _: unknown,
      args: { approvalId: string; body: string; isInternal?: boolean },
      ctx: GQLContext,
    ) => {
      const { addApprovalComment, getApprovalById } = await import('@szl-holdings/covenant-policy');
      const user = ctx?.req?.user;
      const approval = await getApprovalById(parseIntId(args.approvalId));
      if (!approval) throw new Error('Approval not found');
      await addApprovalComment({
        approvalId: parseIntId(args.approvalId),
        orgId: approval.orgId,
        authorId: user?.id ?? null,
        authorRole: user?.roles?.[0],
        body: args.body,
        isInternal: args.isInternal ?? false,
      });
      return true;
    },
  },
};
