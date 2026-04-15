import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  bigint,
} from "drizzle-orm/pg-core";

export const durableJobsTable = pgTable(
  "durable_jobs",
  {
    id: serial("id").primaryKey(),
    jobId: text("job_id").notNull().unique(),
    type: text("type").notNull(),
    queue: text("queue").notNull().default("default"),
    priority: integer("priority").notNull().default(50),
    payload: jsonb("payload").notNull().default({}),
    status: text("status", {
      enum: ["pending", "running", "completed", "failed", "dead_letter", "cancelled", "waiting"],
    })
      .notNull()
      .default("pending"),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    retryDelayMs: integer("retry_delay_ms").notNull().default(1000),
    scheduledAt: timestamp("scheduled_at").notNull().defaultNow(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    lastHeartbeatAt: timestamp("last_heartbeat_at"),
    error: text("error"),
    result: jsonb("result"),
    workerId: text("worker_id"),
    parentJobId: text("parent_job_id"),
    dependsOn: jsonb("depends_on").notNull().default([]),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("durable_jobs_status_priority_scheduled_idx").on(t.status, t.priority, t.scheduledAt),
    index("durable_jobs_queue_status_idx").on(t.queue, t.status),
    index("durable_jobs_type_idx").on(t.type),
    index("durable_jobs_parent_idx").on(t.parentJobId),
    index("durable_jobs_created_at_idx").on(t.createdAt),
  ]
);

export const jobRunsTable = pgTable(
  "job_runs",
  {
    id: serial("id").primaryKey(),
    jobId: text("job_id").notNull(),
    attemptNumber: integer("attempt_number").notNull().default(1),
    workerId: text("worker_id"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    status: text("status", { enum: ["running", "completed", "failed"] }).notNull().default("running"),
    error: text("error"),
    durationMs: bigint("duration_ms", { mode: "number" }),
    metadata: jsonb("metadata").notNull().default({}),
  },
  (t) => [
    index("job_runs_job_id_idx").on(t.jobId),
    index("job_runs_started_at_idx").on(t.startedAt),
  ]
);

export const jobSchedulesTable = pgTable(
  "job_schedules",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    jobType: text("job_type").notNull(),
    queue: text("queue").notNull().default("default"),
    priority: integer("priority").notNull().default(50),
    cronExpression: text("cron_expression").notNull(),
    payload: jsonb("payload").notNull().default({}),
    maxRetries: integer("max_retries").notNull().default(3),
    enabled: boolean("enabled").notNull().default(true),
    lastRunAt: timestamp("last_run_at"),
    nextRunAt: timestamp("next_run_at"),
    lastStatus: text("last_status", { enum: ["completed", "failed", "running", "pending"] }),
    runCount: integer("run_count").notNull().default(0),
    failCount: integer("fail_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("job_schedules_enabled_next_run_idx").on(t.enabled, t.nextRunAt),
    index("job_schedules_job_type_idx").on(t.jobType),
  ]
);

export const deadLetterQueueTable = pgTable(
  "dead_letter_queue",
  {
    id: serial("id").primaryKey(),
    originalJobId: text("original_job_id").notNull(),
    type: text("type").notNull(),
    queue: text("queue").notNull().default("default"),
    payload: jsonb("payload").notNull().default({}),
    error: text("error").notNull(),
    failedAt: timestamp("failed_at").notNull().defaultNow(),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    firstFailedAt: timestamp("first_failed_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by"),
    resolution: text("resolution"),
    metadata: jsonb("metadata").notNull().default({}),
  },
  (t) => [
    index("dlq_type_idx").on(t.type),
    index("dlq_failed_at_idx").on(t.failedAt),
    index("dlq_resolved_idx").on(t.resolvedAt),
  ]
);

export const agentExecutionContextsTable = pgTable(
  "agent_execution_contexts",
  {
    id: serial("id").primaryKey(),
    agentId: text("agent_id").notNull().unique(),
    state: jsonb("state").notNull().default({}),
    lastRunAt: timestamp("last_run_at"),
    lastRunId: text("last_run_id"),
    runCount: integer("run_count").notNull().default(0),
    totalDurationMs: bigint("total_duration_ms", { mode: "number" }).notNull().default(0),
    metadata: jsonb("metadata").notNull().default({}),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("agent_exec_agent_id_idx").on(t.agentId)]
);

export type DurableJob = typeof durableJobsTable.$inferSelect;
export type InsertDurableJob = typeof durableJobsTable.$inferInsert;
export type JobRun = typeof jobRunsTable.$inferSelect;
export type JobSchedule = typeof jobSchedulesTable.$inferSelect;
export type DeadLetterEntry = typeof deadLetterQueueTable.$inferSelect;
export type AgentExecutionContext = typeof agentExecutionContextsTable.$inferSelect;
