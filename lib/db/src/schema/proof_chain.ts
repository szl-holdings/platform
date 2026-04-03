import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";
import { organizationsTable } from "./organizations";

export type ProvenanceSourceClass =
  | "llm_generated"
  | "llm_summarized"
  | "llm_extracted"
  | "human_authored"
  | "system_computed"
  | "external_feed"
  | "hybrid";

export type ProofReviewState =
  | "unreviewed"
  | "reviewed"
  | "approved"
  | "flagged"
  | "retracted";

export type ProofExportSafetyState =
  | "safe"
  | "restricted"
  | "blocked"
  | "pending_review";

export const proofChainTable = pgTable("proof_chain", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  contentId: text("content_id").notNull(),
  contentType: text("content_type").notNull(),
  sourceClass: text("source_class", {
    enum: [
      "llm_generated",
      "llm_summarized",
      "llm_extracted",
      "human_authored",
      "system_computed",
      "external_feed",
      "hybrid",
    ],
  }).notNull(),
  confidenceScore: real("confidence_score").notNull().default(0.5),
  modelLane: text("model_lane"),
  modelId: text("model_id"),
  modelProvider: text("model_provider"),
  modelVersion: text("model_version"),
  promptHash: text("prompt_hash"),
  parentProofId: integer("parent_proof_id"),
  reviewState: text("review_state", {
    enum: ["unreviewed", "reviewed", "approved", "flagged", "retracted"],
  }).notNull().default("unreviewed"),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  reviewNote: text("review_note"),
  exportSafetyState: text("export_safety_state", {
    enum: ["safe", "restricted", "blocked", "pending_review"],
  }).notNull().default("pending_review"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  generatedByUserId: integer("generated_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  correlationId: text("correlation_id"),
  serviceAttribution: text("service_attribution"),
  inputSources: jsonb("input_sources").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("proof_chain_org_idx").on(table.orgId),
  index("proof_chain_content_idx").on(table.contentId, table.contentType),
  index("proof_chain_review_state_idx").on(table.reviewState),
  index("proof_chain_source_class_idx").on(table.sourceClass),
  index("proof_chain_generated_at_idx").on(table.generatedAt),
  index("proof_chain_correlation_idx").on(table.correlationId),
]);

export const insertProofChainSchema = createInsertSchema(proofChainTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProofChain = z.infer<typeof insertProofChainSchema>;
export type ProofChain = typeof proofChainTable.$inferSelect;
