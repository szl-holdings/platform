import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  real,
  jsonb,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { entitiesTable } from "./entities";

export const traceStatusEnum = pgEnum("trace_status", [
  "running",
  "completed",
  "failed",
  "rolled-back",
]);

export const spanStatusEnum = pgEnum("span_status", ["ok", "error", "pending"]);

export const traceEventKindEnum = pgEnum("trace_event_kind", [
  "tool_call",
  "retrieval",
  "memory_read",
  "memory_write",
  "memory_evict",
  "model_call",
  "guardrail",
  "approval",
  "policy_decision",
  "error",
  "retry",
  "rollback",
  "custom",
]);

export const tracesTable = pgTable(
  "traces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    traceId: text("trace_id").notNull().unique(),
    requestId: text("request_id"),
    sessionId: text("session_id"),
    workflowId: text("workflow_id"),
    agentId: text("agent_id"),
    userId: text("user_id"),
    operatorId: text("operator_id"),
    domain: text("domain"),
    model: text("model"),
    promptVersion: text("prompt_version"),
    status: traceStatusEnum("status").notNull().default("running"),
    latencyMs: real("latency_ms"),
    totalTokens: integer("total_tokens"),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    costUsd: real("cost_usd"),
    retries: integer("retries").notNull().default(0),
    rollbackId: text("rollback_id"),
    isReplay: boolean("is_replay").notNull().default(false),
    replayOfTraceId: text("replay_of_trace_id"),
    businessImpact: jsonb("business_impact").$type<{
      valueCreatedUsd?: number;
      valueAtRiskUsd?: number;
      description?: string;
    }>(),
    outputs: jsonb("outputs").$type<Record<string, unknown>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    traceIdIdx: index("traces_trace_id_idx").on(t.traceId),
    requestIdIdx: index("traces_request_id_idx").on(t.requestId),
    agentIdIdx: index("traces_agent_id_idx").on(t.agentId),
    workflowIdIdx: index("traces_workflow_id_idx").on(t.workflowId),
    sessionIdIdx: index("traces_session_id_idx").on(t.sessionId),
    domainIdx: index("traces_domain_idx").on(t.domain),
    statusIdx: index("traces_status_idx").on(t.status),
    startedAtIdx: index("traces_started_at_idx").on(t.startedAt),
    userIdIdx: index("traces_user_id_idx").on(t.userId),
  }),
);

export const traceSpansTable = pgTable(
  "trace_spans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    traceId: text("trace_id").notNull(),
    spanId: text("span_id").notNull(),
    parentSpanId: text("parent_span_id"),
    name: text("name").notNull(),
    status: spanStatusEnum("status").notNull().default("ok"),
    latencyMs: real("latency_ms"),
    errorMessage: text("error_message"),
    attributes: jsonb("attributes").$type<Record<string, unknown>>().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    traceIdIdx: index("trace_spans_trace_id_idx").on(t.traceId),
    spanIdIdx: index("trace_spans_span_id_idx").on(t.spanId),
    parentSpanIdIdx: index("trace_spans_parent_span_id_idx").on(t.parentSpanId),
    startedAtIdx: index("trace_spans_started_at_idx").on(t.startedAt),
  }),
);

export const traceEventsTable = pgTable(
  "trace_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    traceId: text("trace_id").notNull(),
    spanId: text("span_id"),
    kind: traceEventKindEnum("kind").notNull(),
    name: text("name").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
    latencyMs: real("latency_ms"),
    tokens: integer("tokens"),
    costUsd: real("cost_usd"),
    success: boolean("success"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    traceIdIdx: index("trace_events_trace_id_idx").on(t.traceId),
    spanIdIdx: index("trace_events_span_id_idx").on(t.spanId),
    kindIdx: index("trace_events_kind_idx").on(t.kind),
    occurredAtIdx: index("trace_events_occurred_at_idx").on(t.occurredAt),
  }),
);

export const traceEntityLinksTable = pgTable(
  "trace_entity_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    traceId: text("trace_id").notNull(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entitiesTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("touched"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    traceIdIdx: index("trace_entity_links_trace_id_idx").on(t.traceId),
    entityIdIdx: index("trace_entity_links_entity_id_idx").on(t.entityId),
  }),
);

export type TraceRow = typeof tracesTable.$inferSelect;
export type TraceInsert = typeof tracesTable.$inferInsert;
export type TraceSpanRow = typeof traceSpansTable.$inferSelect;
export type TraceSpanInsert = typeof traceSpansTable.$inferInsert;
export type TraceEventRow = typeof traceEventsTable.$inferSelect;
export type TraceEventInsert = typeof traceEventsTable.$inferInsert;
export type TraceEntityLinkRow = typeof traceEntityLinksTable.$inferSelect;
export type TraceEntityLinkInsert = typeof traceEntityLinksTable.$inferInsert;
