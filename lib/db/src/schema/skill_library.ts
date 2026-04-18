import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const skillLibraryTable = pgTable(
  "skills",
  {
    id: serial("id").primaryKey(),
    skillId: text("skill_id").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    objective: text("objective").notNull(),
    inputFields: jsonb("input_fields").notNull().default([]),
    steps: jsonb("steps").notNull().default([]),
    toolsUsed: text("tools_used").array().notNull().default([]),
    expectedOutputs: text("expected_outputs").array().notNull().default([]),
    successCriteria: jsonb("success_criteria").notNull().default([]),
    failureConditions: jsonb("failure_conditions").notNull().default([]),
    totalRuns: integer("total_runs").notNull().default(0),
    successfulRuns: integer("successful_runs").notNull().default(0),
    failedRuns: integer("failed_runs").notNull().default(0),
    successRate: real("success_rate").notNull().default(0),
    avgLatencyMs: real("avg_latency_ms").notNull().default(0),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    lastFailureAt: timestamp("last_failure_at", { withTimezone: true }),
    lastFailureReason: text("last_failure_reason"),
    isBuiltin: boolean("is_builtin").notNull().default(false),
    enabled: boolean("enabled").notNull().default(true),
    version: text("version").notNull().default("1.0.0"),
    tags: text("tags").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("skills_category_idx").on(t.category),
    index("skills_enabled_idx").on(t.enabled),
    index("skills_is_builtin_idx").on(t.isBuiltin),
  ]
);

export const skillLibraryRunsTable = pgTable(
  "skill_runs",
  {
    id: serial("id").primaryKey(),
    runId: text("run_id").notNull().unique(),
    skillId: text("skill_id").notNull(),
    skillName: text("skill_name").notNull(),
    status: text("status").notNull(),
    inputs: jsonb("inputs").notNull().default({}),
    outputs: jsonb("outputs"),
    steps: jsonb("steps").notNull().default([]),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    latencyMs: integer("latency_ms"),
  },
  (t) => [
    index("skill_runs_skill_id_idx").on(t.skillId),
    index("skill_runs_status_idx").on(t.status),
    index("skill_runs_started_at_idx").on(t.startedAt),
  ]
);

export type SkillLibraryRow = typeof skillLibraryTable.$inferSelect;
export type SkillLibraryRunRow = typeof skillLibraryRunsTable.$inferSelect;
