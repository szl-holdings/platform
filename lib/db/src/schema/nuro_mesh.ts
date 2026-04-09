// Legacy: Nuro Mesh AI infrastructure — absorbed into agent_os/agent_training/alloy_platform.
// Retained for active DB tables; do not add new tables here.
import { pgTable, serial, text, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";

export const agentMemoryFacts = pgTable("agent_memory_facts", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  domain: text("domain").notNull(),
  factType: text("fact_type").notNull(),
  content: text("content").notNull(),
  importance: integer("importance").notNull().default(5),
  tags: text("tags").array().notNull().default([]),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const agentUsageStats = pgTable("agent_usage_stats", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name").notNull(),
  domain: text("domain").notNull(),
  tokensUsed: integer("tokens_used").notNull().default(0),
  latencyMs: integer("latency_ms").notNull().default(0),
  success: boolean("success").notNull().default(true),
  model: text("model").notNull(),
  provider: text("provider").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const agentToolCalls = pgTable("agent_tool_calls", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  toolName: text("tool_name").notNull(),
  input: text("input").notNull(),
  output: text("output"),
  success: boolean("success").notNull().default(true),
  latencyMs: integer("latency_ms").notNull().default(0),
  calledAt: timestamp("called_at", { withTimezone: true }).defaultNow().notNull(),
});

export const advisoryFindings = pgTable("advisory_findings", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name").notNull(),
  analysisType: text("analysis_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  severity: text("severity").notNull().default("info"),
  score: integer("score").notNull().default(75),
  tags: text("tags").array().notNull().default([]),
  acknowledged: boolean("acknowledged").notNull().default(false),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiSafetyEvents = pgTable("ai_safety_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  agentId: text("agent_id"),
  severity: text("severity").notNull().default("low"),
  description: text("description").notNull(),
  blocked: boolean("blocked").notNull().default(false),
  inputSample: text("input_sample"),
  detectedAt: timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
});

export const agentModelAssignments = pgTable("agent_model_assignments", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  agentName: text("agent_name").notNull(),
  model: text("model").notNull(),
  provider: text("provider").notNull(),
  tokenBudget: integer("token_budget").notNull().default(100000),
  tokensUsedPeriod: integer("tokens_used_period").notNull().default(0),
  periodResetAt: timestamp("period_reset_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
