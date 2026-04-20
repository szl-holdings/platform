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

// ─── CAPITAL ARTIFACTS ────────────────────────────────────────────────────────

export const capitalArtifactsTable = pgTable(
  'capital_artifacts',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    artifactType: text('artifact_type', {
      enum: [
        'lender_packet',
        'investor_packet',
        'financial_model',
        'diligence_checklist',
        'data_room',
        'cap_table',
        'other',
      ],
    })
      .notNull()
      .default('other'),
    status: text('status', {
      enum: ['draft', 'in_progress', 'under_review', 'complete', 'archived'],
    })
      .notNull()
      .default('draft'),
    version: integer('version').notNull().default(1),
    ownedBy: text('owned_by'),
    notes: text('notes'),
    fileUrl: text('file_url'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('capital_artifacts_type_idx').on(t.artifactType),
    index('capital_artifacts_status_idx').on(t.status),
  ],
);

// ─── LENDER PACKETS ───────────────────────────────────────────────────────────

export const lenderPacketsTable = pgTable('lender_packets', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  lenderType: text('lender_type', { enum: ['bank', 'sba', 'cdfi', 'credit_union', 'other'] })
    .notNull()
    .default('bank'),
  targetAmount: text('target_amount'),
  useOfFunds: text('use_of_funds'),
  status: text('status', {
    enum: [
      'drafting',
      'ready_for_review',
      'submitted',
      'in_diligence',
      'approved',
      'declined',
      'archived',
    ],
  })
    .notNull()
    .default('drafting'),
  completionPct: integer('completion_pct').notNull().default(0),
  targetSubmitDate: timestamp('target_submit_date'),
  submittedAt: timestamp('submitted_at'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lenderPacketDeliverables = pgTable(
  'lender_packet_deliverables',
  {
    id: serial('id').primaryKey(),
    packetId: integer('packet_id')
      .notNull()
      .references(() => lenderPacketsTable.id, { onDelete: 'cascade' }),
    deliverableKey: text('deliverable_key').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', {
      enum: ['not_started', 'drafting', 'draft_complete', 'reviewed', 'final'],
    })
      .notNull()
      .default('not_started'),
    version: integer('version').notNull().default(1),
    content: text('content'),
    artifactId: integer('artifact_id').references(() => capitalArtifactsTable.id, {
      onDelete: 'set null',
    }),
    sortOrder: integer('sort_order').notNull().default(0),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('lender_deliverables_packet_idx').on(t.packetId)],
);

// ─── INVESTOR PACKETS ─────────────────────────────────────────────────────────

export const investorPacketsTable = pgTable('investor_packets', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  investorType: text('investor_type', {
    enum: ['angel', 'pre_seed', 'seed', 'series_a', 'strategic', 'other'],
  })
    .notNull()
    .default('angel'),
  targetAmount: text('target_amount'),
  raiseStructure: text('raise_structure'),
  status: text('status', {
    enum: ['drafting', 'ready_for_review', 'in_outreach', 'in_diligence', 'closed', 'archived'],
  })
    .notNull()
    .default('drafting'),
  completionPct: integer('completion_pct').notNull().default(0),
  targetCloseDate: timestamp('target_close_date'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const investorPacketDeliverables = pgTable(
  'investor_packet_deliverables',
  {
    id: serial('id').primaryKey(),
    packetId: integer('packet_id')
      .notNull()
      .references(() => investorPacketsTable.id, { onDelete: 'cascade' }),
    deliverableKey: text('deliverable_key').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', {
      enum: ['not_started', 'drafting', 'draft_complete', 'reviewed', 'final'],
    })
      .notNull()
      .default('not_started'),
    version: integer('version').notNull().default(1),
    content: text('content'),
    artifactId: integer('artifact_id').references(() => capitalArtifactsTable.id, {
      onDelete: 'set null',
    }),
    sortOrder: integer('sort_order').notNull().default(0),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('investor_deliverables_packet_idx').on(t.packetId)],
);

// ─── FUNDRAISING MILESTONES ───────────────────────────────────────────────────

export const fundraisingMilestonesTable = pgTable('fundraising_milestones', {
  id: serial('id').primaryKey(),
  packetType: text('packet_type', { enum: ['lender', 'investor'] }).notNull(),
  packetId: integer('packet_id'),
  title: text('title').notNull(),
  description: text('description'),
  milestoneType: text('milestone_type', {
    enum: ['preparation', 'outreach', 'diligence', 'close', 'post_close'],
  })
    .notNull()
    .default('preparation'),
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'blocked', 'skipped'] })
    .notNull()
    .default('pending'),
  targetDate: timestamp('target_date'),
  completedAt: timestamp('completed_at'),
  owner: text('owner'),
  notes: text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── FINANCIAL MODELS ─────────────────────────────────────────────────────────

export const financialModelsTable = pgTable('financial_models', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  modelType: text('model_type', {
    enum: [
      '12_month_operating',
      '24_month_operating',
      'cash_flow',
      'debt_service',
      'revenue_assumptions',
      'use_of_funds',
      'pro_forma',
      'other',
    ],
  })
    .notNull()
    .default('12_month_operating'),
  status: text('status', { enum: ['draft', 'in_review', 'approved', 'archived'] })
    .notNull()
    .default('draft'),
  version: integer('version').notNull().default(1),
  assumptions: text('assumptions'),
  notes: text('notes'),
  artifactId: integer('artifact_id').references(() => capitalArtifactsTable.id, {
    onDelete: 'set null',
  }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── USE OF FUNDS VERSIONS ────────────────────────────────────────────────────

export const useOfFundsVersionsTable = pgTable('use_of_funds_versions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  packetType: text('packet_type', { enum: ['lender', 'investor'] }).notNull(),
  packetId: integer('packet_id'),
  version: integer('version').notNull().default(1),
  totalAmount: text('total_amount'),
  allocationJson: jsonb('allocation_json'),
  rationale: text('rationale'),
  status: text('status', { enum: ['draft', 'final'] })
    .notNull()
    .default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── DILIGENCE CHECKLISTS ─────────────────────────────────────────────────────

export const diligenceChecklistsTable = pgTable('diligence_checklists', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  checklistType: text('checklist_type', {
    enum: ['lender', 'investor', 'data_room', 'legal', 'financial'],
  }).notNull(),
  packetType: text('packet_type', { enum: ['lender', 'investor', 'general'] })
    .notNull()
    .default('general'),
  status: text('status', { enum: ['active', 'archived'] })
    .notNull()
    .default('active'),
  completionPct: integer('completion_pct').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const diligenceChecklistItemsTable = pgTable(
  'diligence_checklist_items',
  {
    id: serial('id').primaryKey(),
    checklistId: integer('checklist_id')
      .notNull()
      .references(() => diligenceChecklistsTable.id, { onDelete: 'cascade' }),
    itemKey: text('item_key').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    category: text('category'),
    isRequired: boolean('is_required').notNull().default(true),
    status: text('status', { enum: ['not_started', 'in_progress', 'complete', 'waived', 'na'] })
      .notNull()
      .default('not_started'),
    artifactId: integer('artifact_id').references(() => capitalArtifactsTable.id, {
      onDelete: 'set null',
    }),
    artifactUrl: text('artifact_url'),
    notes: text('notes'),
    sortOrder: integer('sort_order').notNull().default(0),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('diligence_items_checklist_idx').on(t.checklistId)],
);

// ─── CAP TABLE PLACEHOLDERS ───────────────────────────────────────────────────

export const capTablePlaceholdersTable = pgTable('cap_table_placeholders', {
  id: serial('id').primaryKey(),
  holderName: text('holder_name').notNull(),
  holderType: text('holder_type', {
    enum: ['founder', 'employee', 'advisor', 'investor', 'option_pool', 'other'],
  })
    .notNull()
    .default('founder'),
  shareClass: text('share_class').notNull().default('Common'),
  sharesPlaceholder: text('shares_placeholder'),
  ownershipPct: text('ownership_pct'),
  vestingSchedule: text('vesting_schedule'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── INSERT SCHEMAS & TYPES ───────────────────────────────────────────────────

export const insertCapitalArtifactSchema = createInsertSchema(capitalArtifactsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCapitalArtifact = z.infer<typeof insertCapitalArtifactSchema>;
export type CapitalArtifact = typeof capitalArtifactsTable.$inferSelect;

export const insertLenderPacketSchema = createInsertSchema(lenderPacketsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLenderPacket = z.infer<typeof insertLenderPacketSchema>;
export type LenderPacket = typeof lenderPacketsTable.$inferSelect;

export const insertLenderPacketDeliverableSchema = createInsertSchema(
  lenderPacketDeliverables,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLenderPacketDeliverable = z.infer<typeof insertLenderPacketDeliverableSchema>;
export type LenderPacketDeliverable = typeof lenderPacketDeliverables.$inferSelect;

export const insertInvestorPacketSchema = createInsertSchema(investorPacketsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInvestorPacket = z.infer<typeof insertInvestorPacketSchema>;
export type InvestorPacket = typeof investorPacketsTable.$inferSelect;

export const insertInvestorPacketDeliverableSchema = createInsertSchema(
  investorPacketDeliverables,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvestorPacketDeliverable = z.infer<typeof insertInvestorPacketDeliverableSchema>;
export type InvestorPacketDeliverable = typeof investorPacketDeliverables.$inferSelect;

export const insertFundraisingMilestoneSchema = createInsertSchema(fundraisingMilestonesTable).omit(
  { id: true, createdAt: true, updatedAt: true },
);
export type InsertFundraisingMilestone = z.infer<typeof insertFundraisingMilestoneSchema>;
export type FundraisingMilestone = typeof fundraisingMilestonesTable.$inferSelect;

export const insertFinancialModelSchema = createInsertSchema(financialModelsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFinancialModel = z.infer<typeof insertFinancialModelSchema>;
export type FinancialModel = typeof financialModelsTable.$inferSelect;

export const insertUseOfFundsVersionSchema = createInsertSchema(useOfFundsVersionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUseOfFundsVersion = z.infer<typeof insertUseOfFundsVersionSchema>;
export type UseOfFundsVersion = typeof useOfFundsVersionsTable.$inferSelect;

export const insertDiligenceChecklistSchema = createInsertSchema(diligenceChecklistsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDiligenceChecklist = z.infer<typeof insertDiligenceChecklistSchema>;
export type DiligenceChecklist = typeof diligenceChecklistsTable.$inferSelect;

export const insertDiligenceChecklistItemSchema = createInsertSchema(
  diligenceChecklistItemsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDiligenceChecklistItem = z.infer<typeof insertDiligenceChecklistItemSchema>;
export type DiligenceChecklistItem = typeof diligenceChecklistItemsTable.$inferSelect;

export const insertCapTablePlaceholderSchema = createInsertSchema(capTablePlaceholdersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCapTablePlaceholder = z.infer<typeof insertCapTablePlaceholderSchema>;
export type CapTablePlaceholder = typeof capTablePlaceholdersTable.$inferSelect;
