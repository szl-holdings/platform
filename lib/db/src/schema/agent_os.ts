import { pgTable, text, serial, timestamp, integer, real, jsonb, bigint } from "drizzle-orm/pg-core";

export const agentKnowledgeTable = pgTable("agent_knowledge", {
  id: serial("id").primaryKey(),
  entryId: text("entry_id").notNull().unique(),
  type: text("type").notNull(),
  domain: text("domain").notNull(),
  sourceAgent: text("source_agent").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  confidence: real("confidence").notNull().default(0.8),
  tags: text("tags").array().notNull().default([]),
  relatedEntryIds: text("related_entry_ids").array().notNull().default([]),
  data: jsonb("data"),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agentRunsTable = pgTable("agent_runs", {
  id: serial("id").primaryKey(),
  runId: text("run_id").notNull().unique(),
  agentId: text("agent_id").notNull(),
  domain: text("domain").notNull(),
  status: text("status").notNull().default("running"),
  startedAt: bigint("started_at", { mode: "number" }).notNull(),
  completedAt: bigint("completed_at", { mode: "number" }),
  durationMs: integer("duration_ms"),
  summary: text("summary"),
  error: text("error"),
  knowledgeEntryIds: text("knowledge_entry_ids").array().notNull().default([]),
  eventsPublished: text("events_published").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AgentKnowledgeRow = typeof agentKnowledgeTable.$inferSelect;
export type AgentRunRow = typeof agentRunsTable.$inferSelect;
