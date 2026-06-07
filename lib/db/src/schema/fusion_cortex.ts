import {
  index,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const fusionCortexAlertsTable = pgTable(
  'fusion_cortex_alerts',
  {
    id: serial('id').primaryKey(),
    alertId: text('alert_id').notNull().unique(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).notNull(),
    category: text('category').notNull(),
    confidence: numeric('confidence', { precision: 5, scale: 4 }).notNull(),
    affectedDomains: text('affected_domains').array().notNull().default([]),
    affectedEntities: jsonb('affected_entities')
      .$type<Array<{ id: string; name: string; domain: string; type: string }>>()
      .notNull()
      .default([]),
    evidenceChain: jsonb('evidence_chain').$type<unknown[]>().notNull().default([]),
    recommendedActions: text('recommended_actions').array().notNull().default([]),
    advisoryContext: text('advisory_context'),
    tags: text('tags').array().notNull().default([]),
    patternId: text('pattern_id'),
    status: text('status', { enum: ['active', 'acknowledged', 'resolved', 'escalated'] })
      .notNull()
      .default('active'),
    generatedAt: timestamp('generated_at').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    alertIdIdx: index('fusion_cortex_alerts_alert_id_idx').on(t.alertId),
    statusIdx: index('fusion_cortex_alerts_status_idx').on(t.status),
    severityIdx: index('fusion_cortex_alerts_severity_idx').on(t.severity),
    generatedAtIdx: index('fusion_cortex_alerts_generated_at_idx').on(t.generatedAt),
    expiresAtIdx: index('fusion_cortex_alerts_expires_at_idx').on(t.expiresAt),
  }),
);

export const insertFusionCortexAlertSchema = createInsertSchema(fusionCortexAlertsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFusionCortexAlert = z.infer<typeof insertFusionCortexAlertSchema>;
export type FusionCortexAlert = typeof fusionCortexAlertsTable.$inferSelect;
