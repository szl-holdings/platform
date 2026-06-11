import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';
import { organizationsTable } from './organizations.js';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revised'
  | 'escalated'
  | 'expired'
  | 'withdrawn';

export type ApprovalPriority = 'low' | 'medium' | 'high' | 'critical';

export const approvalRequestsTable = pgTable(
  'approval_requests',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    actionClass: text('action_class').notNull().default('general'),
    priority: text('priority', {
      enum: ['low', 'medium', 'high', 'critical'],
    })
      .notNull()
      .default('medium'),
    status: text('status', {
      enum: ['pending', 'approved', 'rejected', 'revised', 'escalated', 'expired', 'withdrawn'],
    })
      .notNull()
      .default('pending'),
    requestedById: integer('requested_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    requestedByRole: text('requested_by_role'),
    assignedApproverId: integer('assigned_approver_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    requiredApproverRole: text('required_approver_role'),
    approvedById: integer('approved_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    rejectedById: integer('rejected_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    rejectedAt: timestamp('rejected_at'),
    escalatedAt: timestamp('escalated_at'),
    escalatedToId: integer('escalated_to_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    escalationReason: text('escalation_reason'),
    expiresAt: timestamp('expires_at'),
    correlationId: text('correlation_id'),
    serviceAttribution: text('service_attribution'),
    payload: jsonb('payload').default({}),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('approval_requests_org_idx').on(table.orgId),
    index('approval_requests_resource_idx').on(table.resourceType, table.resourceId),
    index('approval_requests_status_idx').on(table.status),
    index('approval_requests_requested_by_idx').on(table.requestedById),
    index('approval_requests_approver_idx').on(table.assignedApproverId),
    index('approval_requests_correlation_idx').on(table.correlationId),
    index('approval_requests_created_idx').on(table.createdAt),
  ],
);

export const approvalCommentsTable = pgTable(
  'approval_comments',
  {
    id: serial('id').primaryKey(),
    approvalId: integer('approval_id')
      .notNull()
      .references(() => approvalRequestsTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    authorId: integer('author_id').references(() => usersTable.id, { onDelete: 'set null' }),
    authorRole: text('author_role'),
    body: text('body').notNull(),
    isInternal: boolean('is_internal').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('approval_comments_approval_idx').on(table.approvalId),
    index('approval_comments_author_idx').on(table.authorId),
  ],
);

export const approvalAuditTrailTable = pgTable(
  'approval_audit_trail',
  {
    id: serial('id').primaryKey(),
    approvalId: integer('approval_id')
      .notNull()
      .references(() => approvalRequestsTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    actorId: integer('actor_id').references(() => usersTable.id, { onDelete: 'set null' }),
    actorRole: text('actor_role'),
    action: text('action').notNull(),
    fromStatus: text('from_status'),
    toStatus: text('to_status'),
    note: text('note'),
    correlationId: text('correlation_id'),
    serviceAttribution: text('service_attribution'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('approval_audit_approval_idx').on(table.approvalId),
    index('approval_audit_actor_idx').on(table.actorId),
    index('approval_audit_action_idx').on(table.action),
    index('approval_audit_created_idx').on(table.createdAt),
  ],
);

export const insertApprovalRequestSchema = createInsertSchema(approvalRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;
export type ApprovalRequest = typeof approvalRequestsTable.$inferSelect;

export const insertApprovalCommentSchema = createInsertSchema(approvalCommentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertApprovalComment = z.infer<typeof insertApprovalCommentSchema>;
export type ApprovalComment = typeof approvalCommentsTable.$inferSelect;

export const insertApprovalAuditTrailSchema = createInsertSchema(approvalAuditTrailTable).omit({
  id: true,
  createdAt: true,
});
export type InsertApprovalAuditTrail = z.infer<typeof insertApprovalAuditTrailSchema>;
export type ApprovalAuditTrail = typeof approvalAuditTrailTable.$inferSelect;
