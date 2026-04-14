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
  retrievalCount: integer("retrieval_count").notNull().default(0),
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

export const alloyEvidenceIndex = pgTable("alloy_evidence_index", {
  id: text("id").primaryKey(),
  caseId: text("case_id"),
  incidentId: text("incident_id"),
  source: text("source").notNull(),
  sourceType: text("source_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array().notNull().default([]),
  freshness: text("freshness").notNull().default("current"),
  entryTimestamp: text("entry_timestamp"),
  objectId: text("object_id"),
  relevanceBoost: real("relevance_boost").notNull().default(1.0),
  embedding: jsonb("embedding"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const alloyCaseMemory = pgTable("alloy_case_memory", {
  id: serial("id").primaryKey(),
  caseId: text("case_id").notNull().unique(),
  snapshot: jsonb("snapshot").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const alloyConversationSummaries = pgTable("alloy_conversation_summaries", {
  id: serial("id").primaryKey(),
  conversationId: text("conversation_id").notNull().unique(),
  agentId: text("agent_id").notNull(),
  summary: text("summary").notNull(),
  topics: text("topics").array().notNull().default([]),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const alloyOutcomeLearning = pgTable("alloy_outcome_learning", {
  id: serial("id").primaryKey(),
  decisionId: text("decision_id").notNull(),
  agentId: text("agent_id").notNull(),
  orgId: integer("org_id"),
  outcome: text("outcome").notNull(),
  originalAction: text("original_action").notNull(),
  finalAction: text("final_action"),
  originalConfidence: real("original_confidence").notNull(),
  topic: text("topic").notNull(),
  topicKeywords: text("topic_keywords").array().notNull().default([]),
  overrideReason: text("override_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const alloyAgentCorrections = pgTable("alloy_agent_corrections", {
  id: serial("id").primaryKey(),
  sourceAgentId: text("source_agent_id").notNull(),
  validatorAgentId: text("validator_agent_id").notNull(),
  orgId: integer("org_id"),
  originalOutput: text("original_output").notNull(),
  correctedOutput: text("corrected_output").notNull(),
  validationNotes: text("validation_notes"),
  validationStatus: text("validation_status").notNull(),
  topicKeywords: text("topic_keywords").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const evalRuns = pgTable("eval_runs", {
  id: serial("id").primaryKey(),
  runId: text("run_id").notNull().unique(),
  model: text("model").notNull(),
  totalTests: integer("total_tests").notNull(),
  passed: integer("passed").notNull(),
  failed: integer("failed").notNull(),
  passRate: text("pass_rate").notNull(),
  avgLatencyMs: integer("avg_latency_ms").notNull(),
  byCategory: jsonb("by_category").notNull(),
  results: jsonb("results").notNull(),
  triggeredBy: text("triggered_by").notNull().default("scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
