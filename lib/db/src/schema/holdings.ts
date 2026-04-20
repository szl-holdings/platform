import { integer, jsonb, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const holdingsVenturesTable = pgTable('holdings_ventures', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  sector: text('sector'),
  status: text('status', { enum: ['active', 'growth', 'stealth', 'acquired', 'sunset'] })
    .notNull()
    .default('active'),
  stage: text('stage'),
  founded: text('founded'),
  website: text('website'),
  logo: text('logo'),
  color: text('color'),
  metrics: jsonb('metrics'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const holdingsMilestonesTable = pgTable('holdings_milestones', {
  id: serial('id').primaryKey(),
  ventureId: integer('venture_id').references(() => holdingsVenturesTable.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date'),
  category: text('category'),
  icon: text('icon'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const holdingsMetricsTable = pgTable('holdings_metrics', {
  id: serial('id').primaryKey(),
  ventureId: integer('venture_id').references(() => holdingsVenturesTable.id, {
    onDelete: 'cascade',
  }),
  label: text('label').notNull(),
  value: text('value').notNull(),
  change: text('change'),
  period: text('period'),
  category: text('category'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const holdingsLeadershipTable = pgTable('holdings_leadership', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  bio: text('bio'),
  imageUrl: text('image_url'),
  linkedIn: text('linked_in'),
  sortOrder: integer('sort_order').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const holdingsInquiriesTable = pgTable('holdings_inquiries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status', { enum: ['new', 'read', 'replied', 'closed'] })
    .notNull()
    .default('new'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmContent: text('utm_content'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertHoldingsVentureSchema = createInsertSchema(holdingsVenturesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHoldingsVenture = z.infer<typeof insertHoldingsVentureSchema>;
export type HoldingsVenture = typeof holdingsVenturesTable.$inferSelect;

export const insertHoldingsMilestoneSchema = createInsertSchema(holdingsMilestonesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertHoldingsMilestone = z.infer<typeof insertHoldingsMilestoneSchema>;
export type HoldingsMilestone = typeof holdingsMilestonesTable.$inferSelect;

export const insertHoldingsMetricSchema = createInsertSchema(holdingsMetricsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertHoldingsMetric = z.infer<typeof insertHoldingsMetricSchema>;
export type HoldingsMetric = typeof holdingsMetricsTable.$inferSelect;

export const insertHoldingsLeadershipSchema = createInsertSchema(holdingsLeadershipTable).omit({
  id: true,
  createdAt: true,
});
export type InsertHoldingsLeadership = z.infer<typeof insertHoldingsLeadershipSchema>;
export type HoldingsLeadership = typeof holdingsLeadershipTable.$inferSelect;

export const insertHoldingsInquirySchema = createInsertSchema(holdingsInquiriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHoldingsInquiry = z.infer<typeof insertHoldingsInquirySchema>;
export type HoldingsInquiry = typeof holdingsInquiriesTable.$inferSelect;
