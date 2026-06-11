import { integer, jsonb, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';
import { organizationsTable } from './organizations.js';

export const signalsTable = pgTable('signals', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  sourceKey: text('source_key'),
  title: text('title').notNull(),
  description: text('description'),
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] })
    .notNull()
    .default('medium'),
  status: text('status', { enum: ['new', 'reviewed', 'escalated', 'closed'] })
    .notNull()
    .default('new'),
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  metadataJson: jsonb('metadata_json'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const findingsTable = pgTable('findings', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  signalId: integer('signal_id').references(() => signalsTable.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  summary: text('summary'),
  confidenceScore: numeric('confidence_score', { precision: 5, scale: 2 }),
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] })
    .notNull()
    .default('medium'),
  status: text('status', { enum: ['open', 'confirmed', 'disputed', 'resolved'] })
    .notNull()
    .default('open'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const investigationsTable = pgTable('investigations', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['open', 'in_progress', 'closed'] })
    .notNull()
    .default('open'),
  ownerUserId: integer('owner_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  openedAt: timestamp('opened_at').notNull().defaultNow(),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const investigationItemsTable = pgTable('investigation_items', {
  id: serial('id').primaryKey(),
  investigationId: integer('investigation_id')
    .notNull()
    .references(() => investigationsTable.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const incaAlertsTable = pgTable('inca_alerts', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  findingId: integer('finding_id').references(() => findingsTable.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] })
    .notNull()
    .default('medium'),
  status: text('status', { enum: ['active', 'acknowledged', 'resolved'] })
    .notNull()
    .default('active'),
  triggeredAt: timestamp('triggered_at').notNull().defaultNow(),
  metadataJson: jsonb('metadata_json'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const incaReportsTable = pgTable('inca_reports', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  reportType: text('report_type').notNull(),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  reportUrl: text('report_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertSignalSchema = createInsertSchema(signalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Signal = typeof signalsTable.$inferSelect;

export const insertFindingSchema = createInsertSchema(findingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFinding = z.infer<typeof insertFindingSchema>;
export type Finding = typeof findingsTable.$inferSelect;

export const insertInvestigationSchema = createInsertSchema(investigationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInvestigation = z.infer<typeof insertInvestigationSchema>;
export type Investigation = typeof investigationsTable.$inferSelect;

export const insertInvestigationItemSchema = createInsertSchema(investigationItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertInvestigationItem = z.infer<typeof insertInvestigationItemSchema>;
export type InvestigationItem = typeof investigationItemsTable.$inferSelect;

export const insertIncaAlertSchema = createInsertSchema(incaAlertsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIncaAlert = z.infer<typeof insertIncaAlertSchema>;
export type IncaAlert = typeof incaAlertsTable.$inferSelect;

export const insertIncaReportSchema = createInsertSchema(incaReportsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertIncaReport = z.infer<typeof insertIncaReportSchema>;
export type IncaReport = typeof incaReportsTable.$inferSelect;
