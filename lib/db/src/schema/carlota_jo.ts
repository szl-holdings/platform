import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const carlotaInquiriesTable = pgTable('carlota_inquiries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  phone: text('phone'),
  service: text('service'),
  message: text('message').notNull(),
  status: text('status', { enum: ['new', 'contacted', 'in_progress', 'closed'] })
    .notNull()
    .default('new'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const carlotaReservationsTable = pgTable('carlota_reservations', {
  id: serial('id').primaryKey(),
  confirmationId: text('confirmation_id').notNull().unique(),
  service: text('service').notNull(),
  tier: text('tier').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  phone: text('phone'),
  notes: text('notes'),
  status: text('status', { enum: ['pending', 'confirmed', 'completed', 'canceled'] })
    .notNull()
    .default('pending'),
  amount: numeric('amount', { precision: 10, scale: 2 }),
  currency: text('currency').default('USD'),
  paymentStatus: text('payment_status', { enum: ['unpaid', 'paid', 'refunded'] })
    .notNull()
    .default('unpaid'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const carlotaServicesTable = pgTable('carlota_services', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  summary: text('summary'),
  description: text('description'),
  icon: text('icon'),
  category: text('category'),
  capabilities: jsonb('capabilities'),
  isActive: text('is_active').default('true'),
  sortOrder: integer('sort_order').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const carlotaClientProfilesTable = pgTable('carlota_client_profiles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  phone: text('phone'),
  industry: text('industry'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertCarlotaInquirySchema = createInsertSchema(carlotaInquiriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCarlotaInquiry = z.infer<typeof insertCarlotaInquirySchema>;
export type CarlotaInquiry = typeof carlotaInquiriesTable.$inferSelect;

export const insertCarlotaReservationSchema = createInsertSchema(carlotaReservationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCarlotaReservation = z.infer<typeof insertCarlotaReservationSchema>;
export type CarlotaReservation = typeof carlotaReservationsTable.$inferSelect;

export const insertCarlotaServiceSchema = createInsertSchema(carlotaServicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCarlotaService = z.infer<typeof insertCarlotaServiceSchema>;
export type CarlotaService = typeof carlotaServicesTable.$inferSelect;

export const insertCarlotaClientProfileSchema = createInsertSchema(carlotaClientProfilesTable).omit(
  { id: true, createdAt: true, updatedAt: true },
);
export type InsertCarlotaClientProfile = z.infer<typeof insertCarlotaClientProfileSchema>;
export type CarlotaClientProfile = typeof carlotaClientProfilesTable.$inferSelect;

export const carlotaEngagementsTable = pgTable('carlota_engagements', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  organizationId: integer('organization_id'),
  clientAccountId: integer('client_account_id'),
  createdByUserId: integer('created_by_user_id'),
  client: text('client').notNull(),
  engagement: text('engagement').notNull(),
  status: text('status').notNull().default('active'),
  feeType: text('fee_type').notNull().default('fixed'),
  contractedValue: numeric('contracted_value', { precision: 12, scale: 2 }).notNull().default('0'),
  invoiced: numeric('invoiced', { precision: 12, scale: 2 }).notNull().default('0'),
  collected: numeric('collected', { precision: 12, scale: 2 }).notNull().default('0'),
  costToDate: numeric('cost_to_date', { precision: 12, scale: 2 }).notNull().default('0'),
  forecastedCost: numeric('forecasted_cost', { precision: 12, scale: 2 }).notNull().default('0'),
  marginTarget: integer('margin_target').notNull().default(40),
  phase: text('phase').notNull().default(''),
  rateRealisationPct: integer('rate_realisation_pct').notNull().default(100),
  writeOffs: numeric('write_offs', { precision: 12, scale: 2 }).notNull().default('0'),
  scopeCreepHours: integer('scope_creep_hours').notNull().default(0),
  startDate: text('start_date').notNull().default(''),
  endDate: text('end_date').notNull().default(''),
  alerts: jsonb('alerts').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertCarlotaEngagementSchema = createInsertSchema(carlotaEngagementsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCarlotaEngagement = z.infer<typeof insertCarlotaEngagementSchema>;
export type CarlotaEngagement = typeof carlotaEngagementsTable.$inferSelect;

export const carlotaDiagnosticsTable = pgTable('carlota_diagnostics', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  organizationId: integer('organization_id'),
  clientAccountId: integer('client_account_id'),
  createdByUserId: integer('created_by_user_id'),
  companyName: text('company_name').notNull(),
  industry: text('industry').notNull().default(''),
  stage: text('stage').notNull().default(''),
  report: jsonb('report').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const carlotaScenariosTable = pgTable('carlota_scenarios', {
  id: serial('id').primaryKey(),
  externalId: text('external_id').notNull().unique(),
  organizationId: integer('organization_id'),
  clientAccountId: integer('client_account_id'),
  createdByUserId: integer('created_by_user_id'),
  label: text('label').notNull(),
  details: text('details').notNull().default(''),
  context: text('context'),
  result: jsonb('result').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertCarlotaDiagnosticSchema = createInsertSchema(carlotaDiagnosticsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCarlotaDiagnostic = z.infer<typeof insertCarlotaDiagnosticSchema>;
export type CarlotaDiagnostic = typeof carlotaDiagnosticsTable.$inferSelect;

export const insertCarlotaScenarioSchema = createInsertSchema(carlotaScenariosTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCarlotaScenario = z.infer<typeof insertCarlotaScenarioSchema>;
export type CarlotaScenario = typeof carlotaScenariosTable.$inferSelect;

export const carlotaRadarCompetitorsTable = pgTable('carlota_radar_competitors', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id'),
  userId: integer('user_id'),
  clientId: text('client_id'),
  competitors: jsonb('competitors').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertCarlotaRadarCompetitorsSchema = createInsertSchema(
  carlotaRadarCompetitorsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarlotaRadarCompetitors = z.infer<typeof insertCarlotaRadarCompetitorsSchema>;
export type CarlotaRadarCompetitors = typeof carlotaRadarCompetitorsTable.$inferSelect;

export type CarlotaRadarPendingSignal = {
  competitor: string;
  event: string;
  date: string;
  url: string;
  source: string;
  detail: string;
  capturedAt: string;
};

export const carlotaRadarNotifPrefsTable = pgTable('carlota_radar_notif_prefs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  organizationId: integer('organization_id'),
  enabled: boolean('enabled').notNull().default(true),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  inAppEnabled: boolean('in_app_enabled').notNull().default(true),
  email: text('email'),
  frequency: text('frequency', { enum: ['instant', 'daily', 'weekly'] })
    .notNull()
    .default('instant'),
  competitors: jsonb('competitors').$type<string[] | null>().default(null),
  pendingDigest: jsonb('pending_digest').$type<CarlotaRadarPendingSignal[]>().notNull().default([]),
  lastDigestAt: timestamp('last_digest_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type CarlotaRadarNotifPrefs = typeof carlotaRadarNotifPrefsTable.$inferSelect;

export const carlotaRadarSeenSignalsTable = pgTable(
  'carlota_radar_seen_signals',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    signalHash: text('signal_hash').notNull(),
    competitor: text('competitor').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    uniq: uniqueIndex('carlota_radar_seen_user_hash_idx').on(table.userId, table.signalHash),
    byUser: index('carlota_radar_seen_user_idx').on(table.userId),
  }),
);
