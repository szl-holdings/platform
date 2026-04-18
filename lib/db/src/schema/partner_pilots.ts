import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * partner_pilots — pilot / design-partner / prospect pipeline.
 *
 * Backs GET /api/cross-platform/pilots. Each row is one external account
 * engaged with one or more SZL products (lyte, vessels, terra, prism, aegis,
 * carlota). The cross-platform endpoint joins each row with live trace-graph
 * activity per `product` to compute weekly-runs / pass-rate / lastRunAt.
 *
 * Statuses (lifecycle):
 *   prospect  — pre-contract, in evaluation
 *   pilot     — active design-partner engagement
 *   active    — live customer
 *   at-risk   — degraded health on the joined trace activity
 *   inactive  — paused or churned
 */
export const partnerPilotsTable = pgTable("partner_pilots", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  organizationId: integer("organization_id"),
  name: text("name").notNull(),
  product: text("product").notNull(), // lyte | vessels | terra | prism | aegis | carlota
  status: text("status").notNull().default("prospect"),
  tier: text("tier").notNull().default("design-partner"),
  region: text("region"),
  industry: text("industry"),
  primaryContact: text("primary_contact"),
  contactEmail: text("contact_email"),
  pilotStartedAt: timestamp("pilot_started_at"),
  contractValueUsd: integer("contract_value_usd").notNull().default(0),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPartnerPilotSchema = createInsertSchema(partnerPilotsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPartnerPilot = z.infer<typeof insertPartnerPilotSchema>;
export type PartnerPilot = typeof partnerPilotsTable.$inferSelect;
