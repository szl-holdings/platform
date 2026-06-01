import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './auth';
import { organizationsTable } from './organizations';

export const supportTicketsTable = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  ticketRef: text('ticket_ref').notNull().unique(),
  orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
  userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  submitterName: text('submitter_name').notNull(),
  submitterEmail: text('submitter_email').notNull(),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  category: text('category', {
    enum: [
      'billing',
      'technical',
      'account',
      'feature_request',
      'security',
      'data_privacy',
      'other',
    ],
  })
    .notNull()
    .default('other'),
  priority: text('priority', {
    enum: ['low', 'medium', 'high', 'urgent'],
  })
    .notNull()
    .default('medium'),
  status: text('status', {
    enum: ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'],
  })
    .notNull()
    .default('open'),
  assignedToId: integer('assigned_to_id').references(() => usersTable.id, { onDelete: 'set null' }),
  assignedToName: text('assigned_to_name'),
  resolvedAt: timestamp('resolved_at'),
  closedAt: timestamp('closed_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  // SLA tracking
  slaResponseDeadline: timestamp('sla_response_deadline'),
  slaResolutionDeadline: timestamp('sla_resolution_deadline'),
  firstResponseAt: timestamp('first_response_at'),
  slaResponseBreached: boolean('sla_response_breached').notNull().default(false),
  slaResolutionBreached: boolean('sla_resolution_breached').notNull().default(false),
  escalatedAt: timestamp('escalated_at'),
  escalationCount: integer('escalation_count').notNull().default(0),
  // Ticket merge
  mergedIntoId: integer('merged_into_id'),
  mergedAt: timestamp('merged_at'),
  // CSAT
  csatRating: integer('csat_rating'),
  csatComment: text('csat_comment'),
  csatRequestSentAt: timestamp('csat_request_sent_at'),
  csatRespondedAt: timestamp('csat_responded_at'),
});

export const supportTicketCommentsTable = pgTable('support_ticket_comments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id')
    .notNull()
    .references(() => supportTicketsTable.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').references(() => usersTable.id, { onDelete: 'set null' }),
  authorName: text('author_name').notNull(),
  authorRole: text('author_role', { enum: ['customer', 'agent', 'admin'] })
    .notNull()
    .default('customer'),
  body: text('body').notNull(),
  isInternal: boolean('is_internal').notNull().default(false),
  cannedResponseId: integer('canned_response_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const supportKnowledgeArticlesTable = pgTable('support_knowledge_articles', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  summary: text('summary').notNull(),
  body: text('body').notNull(),
  tags: text('tags').array().notNull().default([]),
  isPublished: boolean('is_published').notNull().default(true),
  viewCount: integer('view_count').notNull().default(0),
  deflectionCount: integer('deflection_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const supportCannedResponsesTable = pgTable('support_canned_responses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull().default('general'),
  body: text('body').notNull(),
  tags: text('tags').array().notNull().default([]),
  usageCount: integer('usage_count').notNull().default(0),
  createdById: integer('created_by_id').references(() => usersTable.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
