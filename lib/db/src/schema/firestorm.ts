import { pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const firestormCampaignsTable = pgTable("firestorm_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["email", "social", "ppc", "display", "content", "multi_channel"] }).notNull(),
  status: text("status", { enum: ["draft", "scheduled", "active", "paused", "completed", "archived"] }).notNull().default("draft"),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  spent: numeric("spent", { precision: 12, scale: 2 }).default("0"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  targetAudience: jsonb("target_audience"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const firestormLeadsTable = pgTable("firestorm_leads", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => firestormCampaignsTable.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  company: text("company"),
  title: text("title"),
  phone: text("phone"),
  source: text("source"),
  score: integer("score").default(0),
  status: text("status", { enum: ["new", "contacted", "qualified", "converted", "lost"] }).notNull().default("new"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const firestormAnalyticsTable = pgTable("firestorm_analytics", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => firestormCampaignsTable.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  spend: numeric("spend", { precision: 10, scale: 2 }).default("0"),
  revenue: numeric("revenue", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFirestormCampaignSchema = createInsertSchema(firestormCampaignsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormCampaign = z.infer<typeof insertFirestormCampaignSchema>;
export type FirestormCampaign = typeof firestormCampaignsTable.$inferSelect;

export const insertFirestormLeadSchema = createInsertSchema(firestormLeadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormLead = z.infer<typeof insertFirestormLeadSchema>;
export type FirestormLead = typeof firestormLeadsTable.$inferSelect;

export const insertFirestormAnalyticsSchema = createInsertSchema(firestormAnalyticsTable).omit({ id: true, createdAt: true });
export type InsertFirestormAnalytics = z.infer<typeof insertFirestormAnalyticsSchema>;
export type FirestormAnalytics = typeof firestormAnalyticsTable.$inferSelect;
