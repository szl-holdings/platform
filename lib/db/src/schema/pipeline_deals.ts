import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const PIPELINE_VERTICALS = ["Security", "Maritime", "Real Estate", "Legal"] as const;
export const PIPELINE_STAGES = [
  "Researched",
  "Outreach Sent",
  "Reply / Meeting Booked",
  "Discovery Call",
  "Demo Delivered",
  "DPA Sent",
  "Signed",
  "Lost / No Fit",
] as const;

export const pipelineDealsTable = pgTable(
  "pipeline_deals",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    account: text("account").notNull(),
    vertical: text("vertical", { enum: PIPELINE_VERTICALS }).notNull(),
    champion: text("champion").notNull().default(""),
    championTitle: text("champion_title").notNull().default(""),
    stage: text("stage", { enum: PIPELINE_STAGES }).notNull().default("Researched"),
    fitScore: integer("fit_score").notNull().default(7),
    nextStep: text("next_step").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdByUserId: integer("created_by_user_id"),
    updatedByUserId: integer("updated_by_user_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("pipeline_deals_org_idx").on(t.orgId),
    index("pipeline_deals_stage_idx").on(t.stage),
    index("pipeline_deals_updated_idx").on(t.updatedAt),
  ],
);

export const pipelineDealEventsTable = pgTable(
  "pipeline_deal_events",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id").notNull(),
    orgId: integer("org_id").notNull(),
    accountSnapshot: text("account_snapshot").notNull().default(""),
    fromStage: text("from_stage", { enum: PIPELINE_STAGES }),
    toStage: text("to_stage", { enum: PIPELINE_STAGES }).notNull(),
    actorUserId: integer("actor_user_id"),
    actorEmail: text("actor_email"),
    actorName: text("actor_name"),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("pipeline_deal_events_deal_idx").on(t.dealId),
    index("pipeline_deal_events_org_idx").on(t.orgId),
    index("pipeline_deal_events_created_idx").on(t.createdAt),
  ],
);

export const insertPipelineDealSchema = createInsertSchema(pipelineDealsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPipelineDeal = z.infer<typeof insertPipelineDealSchema>;
export type PipelineDeal = typeof pipelineDealsTable.$inferSelect;

export const insertPipelineDealEventSchema = createInsertSchema(pipelineDealEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPipelineDealEvent = z.infer<typeof insertPipelineDealEventSchema>;
export type PipelineDealEvent = typeof pipelineDealEventsTable.$inferSelect;

export type PipelineVertical = (typeof PIPELINE_VERTICALS)[number];
export type PipelineStage = (typeof PIPELINE_STAGES)[number];
