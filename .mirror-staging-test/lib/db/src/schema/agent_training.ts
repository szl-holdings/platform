import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentTrainingPairs = pgTable("agent_training_pairs", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").default("general"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const agentBehaviorPrefs = pgTable("agent_behavior_prefs", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  tone: text("tone").default("professional"),
  detailLevel: text("detail_level").default("balanced"),
  domainJargon: boolean("domain_jargon").default(true).notNull(),
  responseLength: text("response_length").default("medium"),
  customInstructions: text("custom_instructions"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const agentFeedback = pgTable("agent_feedback", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  rating: integer("rating").notNull(),
  messageContent: text("message_content"),
  responseContent: text("response_content"),
  feedbackNote: text("feedback_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const advisoryAudit = pgTable("advisory_audit", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  recommendationType: text("recommendation_type").notNull(),
  riskLevel: text("risk_level").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  runbook: text("runbook"),
  status: text("status").default("pending").notNull(),
  actionedAt: timestamp("actioned_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertAgentTrainingPairSchema = createInsertSchema(agentTrainingPairs).omit({ id: true, createdAt: true });
export const insertAgentFeedbackSchema = createInsertSchema(agentFeedback).omit({ id: true, createdAt: true });
export const insertAdvisoryAuditSchema = createInsertSchema(advisoryAudit).omit({ id: true, createdAt: true, actionedAt: true });

export type AgentTrainingPair = typeof agentTrainingPairs.$inferSelect;
export type AgentBehaviorPref = typeof agentBehaviorPrefs.$inferSelect;
export type AgentFeedback = typeof agentFeedback.$inferSelect;
export type AdvisoryAudit = typeof advisoryAudit.$inferSelect;
export type InsertAgentTrainingPair = z.infer<typeof insertAgentTrainingPairSchema>;
export type InsertAgentFeedback = z.infer<typeof insertAgentFeedbackSchema>;
export type InsertAdvisoryAudit = z.infer<typeof insertAdvisoryAuditSchema>;
