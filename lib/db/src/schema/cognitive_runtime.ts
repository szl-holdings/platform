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

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const sensitivityTierEnum = pgEnum("cog_sensitivity_tier", [
  "public",
  "internal",
  "confidential",
  "restricted",
  "top-secret",
]);

export const provenanceMethodEnum = pgEnum("cog_provenance_method", [
  "api",
  "manual",
  "agent",
  "import",
  "derived",
]);

export const selfModelStatusEnum = pgEnum("self_model_status", [
  "draft",
  "active",
  "archived",
  "deprecated",
]);

export const skillStatusEnum = pgEnum("cog_skill_status", [
  "draft",
  "active",
  "deprecated",
  "retired",
]);

export const skillRunStatusEnum = pgEnum("cog_skill_run_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const planStatusEnum = pgEnum("cog_plan_status", [
  "draft",
  "pending",
  "running",
  "completed",
  "failed",
  "aborted",
  "rolled-back",
]);

export const planStepStatusEnum = pgEnum("cog_plan_step_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
]);

export const verifierOutcomeEnum = pgEnum("cog_verifier_outcome", [
  "pass",
  "fail",
  "warn",
  "blocked",
]);

export const reflectionTypeEnum = pgEnum("cog_reflection_type", [
  "post-task",
  "periodic",
  "error-triggered",
  "human-initiated",
  "goal-review",
  "policy-breach",
]);

export const policyEffectEnum = pgEnum("cog_policy_effect", [
  "allow",
  "deny",
  "require-approval",
  "log",
  "redact",
  "escalate",
]);

export const actionStatusEnum = pgEnum("cog_action_status", [
  "pending",
  "approved",
  "running",
  "completed",
  "failed",
  "rolled-back",
  "denied",
]);

export const rollbackTriggerEnum = pgEnum("cog_rollback_trigger", [
  "agent",
  "verifier",
  "guardian",
  "human",
  "policy",
  "timeout",
  "cascade-failure",
]);

export const entityEdgeTypeEnum = pgEnum("cog_entity_edge_type", [
  "relates-to",
  "depends-on",
  "triggers",
  "mitigates",
  "owns",
  "managed-by",
  "derived-from",
  "affects",
  "linked-trace",
  "similar-to",
  "supersedes",
  "alias-of",
  "custom",
]);

// ---------------------------------------------------------------------------
// Self-model tables
// ---------------------------------------------------------------------------

/**
 * self_models — one active model per agent at any given time.
 * version increments on each significant update; the full history
 * lives in self_model_snapshots (immutable).
 */
export const selfModelsTable = pgTable(
  "self_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: text("agent_id").notNull(),
    version: integer("version").notNull().default(1),
    status: selfModelStatusEnum("status").notNull().default("active"),
    capabilities: jsonb("capabilities").$type<string[]>().notNull().default([]),
    goals: jsonb("goals").$type<Record<string, unknown>[]>().notNull().default([]),
    constraints: jsonb("constraints").$type<Record<string, unknown>[]>().notNull().default([]),
    beliefs: jsonb("beliefs").$type<Record<string, unknown>>().notNull().default({}),
    identity: jsonb("identity").$type<Record<string, unknown>>().notNull().default({}),
    performanceProfile: jsonb("performance_profile").$type<Record<string, unknown>>().notNull().default({}),
    confidence: real("confidence").notNull().default(1.0),
    sensitivityTier: sensitivityTierEnum("sensitivity_tier").notNull().default("internal"),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    provenanceAuthor: text("provenance_author"),
    freshnessLastUpdatedAt: timestamp("freshness_last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    freshnessTtlSeconds: integer("freshness_ttl_seconds"),
    freshnessIsStale: boolean("freshness_is_stale").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    agentIdIdx: index("self_models_agent_id_idx").on(t.agentId),
    statusIdx: index("self_models_status_idx").on(t.status),
    versionIdx: index("self_models_version_idx").on(t.agentId, t.version),
  }),
);

/**
 * self_model_snapshots — immutable point-in-time copies created whenever
 * the active self-model is updated. Append-only; never updated after insert.
 */
export const selfModelSnapshotsTable = pgTable(
  "self_model_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    selfModelId: uuid("self_model_id")
      .notNull()
      .references(() => selfModelsTable.id, { onDelete: "cascade" }),
    agentId: text("agent_id").notNull(),
    version: integer("version").notNull(),
    snapshotData: jsonb("snapshot_data").$type<Record<string, unknown>>().notNull().default({}),
    changeReason: text("change_reason"),
    triggeredBy: text("triggered_by"),
    traceId: text("trace_id"),
    confidence: real("confidence").notNull().default(1.0),
    sensitivityTier: sensitivityTierEnum("sensitivity_tier").notNull().default("internal"),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    selfModelIdIdx: index("self_model_snapshots_model_idx").on(t.selfModelId),
    agentIdIdx: index("self_model_snapshots_agent_id_idx").on(t.agentId),
    versionIdx: index("self_model_snapshots_version_idx").on(t.selfModelId, t.version),
    createdAtIdx: index("self_model_snapshots_created_at_idx").on(t.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// Entity extension tables (cognitive graph layer)
// ---------------------------------------------------------------------------

/**
 * entity_aliases — alternative identifiers for an entity.
 */
export const entityAliasesTable = pgTable(
  "entity_aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityId: text("entity_id").notNull(),
    alias: text("alias").notNull(),
    aliasType: text("alias_type").notNull().default("display"),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    confidence: real("confidence").notNull().default(1.0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdIdx: index("entity_aliases_entity_idx").on(t.entityId),
    aliasIdx: index("entity_aliases_alias_idx").on(t.alias),
    typeIdx: index("entity_aliases_type_idx").on(t.aliasType),
  }),
);

/**
 * entity_edges — directed, weighted, typed edges between entities in the
 * cognitive graph. Supplements entity_relationships with provenance,
 * confidence, and freshness metadata required by the cognitive runtime.
 */
export const entityEdgesTable = pgTable(
  "entity_edges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromEntityId: text("from_entity_id").notNull(),
    toEntityId: text("to_entity_id").notNull(),
    edgeType: entityEdgeTypeEnum("edge_type").notNull().default("relates-to"),
    label: text("label"),
    weight: real("weight").notNull().default(1.0),
    bidirectional: boolean("bidirectional").notNull().default(false),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    provenanceAuthor: text("provenance_author"),
    confidence: real("confidence").notNull().default(1.0),
    sensitivityTier: sensitivityTierEnum("sensitivity_tier").notNull().default("internal"),
    freshnessLastUpdatedAt: timestamp("freshness_last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    freshnessTtlSeconds: integer("freshness_ttl_seconds"),
    freshnessIsStale: boolean("freshness_is_stale").notNull().default(false),
    linkedTraces: jsonb("linked_traces").$type<string[]>().notNull().default([]),
    properties: jsonb("properties").$type<Record<string, unknown>>().notNull().default({}),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    fromEntityIdx: index("entity_edges_from_idx").on(t.fromEntityId),
    toEntityIdx: index("entity_edges_to_idx").on(t.toEntityId),
    typeIdx: index("entity_edges_type_idx").on(t.edgeType),
    pairIdx: index("entity_edges_pair_idx").on(t.fromEntityId, t.toEntityId),
  }),
);

// ---------------------------------------------------------------------------
// Skills — cognitive runtime executable skills
// ---------------------------------------------------------------------------

/**
 * skills — versioned, reusable executable skill definitions.
 * Each row represents a specific version; latestVersion tracks the head.
 */
export const skillsTable = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: text("skill_id").notNull(),
    version: integer("version").notNull().default(1),
    latestVersion: integer("latest_version").notNull().default(1),
    name: text("name").notNull(),
    description: text("description"),
    domain: text("domain").notNull().default("general"),
    capability: text("capability").notNull(),
    status: skillStatusEnum("status").notNull().default("active"),
    inputSchema: jsonb("input_schema").$type<Record<string, unknown>>().notNull().default({}),
    outputSchema: jsonb("output_schema").$type<Record<string, unknown>>().notNull().default({}),
    implementation: jsonb("implementation").$type<Record<string, unknown>>().notNull().default({}),
    triggerConditions: jsonb("trigger_conditions").$type<Record<string, unknown>[]>().notNull().default([]),
    policyClass: text("policy_class"),
    estimatedLatencyMs: integer("estimated_latency_ms"),
    tags: text("tags").array().notNull().default([]),
    isBuiltin: boolean("is_builtin").notNull().default(false),
    confidence: real("confidence").notNull().default(1.0),
    sensitivityTier: sensitivityTierEnum("sensitivity_tier").notNull().default("internal"),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    provenanceAuthor: text("provenance_author"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    skillIdIdx: index("skills_skill_id_idx").on(t.skillId),
    domainIdx: index("skills_domain_idx").on(t.domain),
    statusIdx: index("skills_status_idx").on(t.status),
    versionIdx: index("skills_version_idx").on(t.skillId, t.version),
    capabilityIdx: index("skills_capability_idx").on(t.capability),
  }),
);

/**
 * skill_runs — execution records for every invocation of a skill.
 */
export const skillRunsTable = pgTable(
  "skill_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: text("skill_id").notNull(),
    skillVersion: integer("skill_version").notNull().default(1),
    agentId: text("agent_id"),
    traceId: text("trace_id"),
    planId: uuid("plan_id"),
    planStepId: uuid("plan_step_id"),
    status: skillRunStatusEnum("status").notNull().default("pending"),
    inputs: jsonb("inputs").$type<Record<string, unknown>>().notNull().default({}),
    outputs: jsonb("outputs").$type<Record<string, unknown>>(),
    latencyMs: real("latency_ms"),
    tokensUsed: integer("tokens_used"),
    costUsd: real("cost_usd"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    retries: integer("retries").notNull().default(0),
    approvalId: text("approval_id"),
    confidence: real("confidence").notNull().default(1.0),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    skillIdIdx: index("skill_runs_skill_id_idx").on(t.skillId),
    agentIdIdx: index("skill_runs_agent_id_idx").on(t.agentId),
    traceIdIdx: index("skill_runs_trace_id_idx").on(t.traceId),
    planIdIdx: index("skill_runs_plan_id_idx").on(t.planId),
    statusIdx: index("skill_runs_status_idx").on(t.status),
    createdAtIdx: index("skill_runs_created_at_idx").on(t.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// Plans — directed plan graphs
// ---------------------------------------------------------------------------

/**
 * plans — top-level plan records, each representing a goal decomposition.
 */
export const plansTable = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: text("plan_id").notNull().unique(),
    agentId: text("agent_id"),
    sessionId: text("session_id"),
    workflowId: text("workflow_id"),
    traceId: text("trace_id"),
    title: text("title").notNull(),
    description: text("description"),
    goal: jsonb("goal").$type<Record<string, unknown>>().notNull().default({}),
    status: planStatusEnum("status").notNull().default("draft"),
    totalSteps: integer("total_steps").notNull().default(0),
    completedSteps: integer("completed_steps").notNull().default(0),
    failedSteps: integer("failed_steps").notNull().default(0),
    fallbackPlanId: text("fallback_plan_id"),
    parentPlanId: text("parent_plan_id"),
    confidence: real("confidence").notNull().default(1.0),
    sensitivityTier: sensitivityTierEnum("sensitivity_tier").notNull().default("internal"),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    provenanceAuthor: text("provenance_author"),
    freshnessLastUpdatedAt: timestamp("freshness_last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    freshnessIsStale: boolean("freshness_is_stale").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    planIdIdx: index("plans_plan_id_idx").on(t.planId),
    agentIdIdx: index("plans_agent_id_idx").on(t.agentId),
    sessionIdIdx: index("plans_session_id_idx").on(t.sessionId),
    workflowIdIdx: index("plans_workflow_id_idx").on(t.workflowId),
    statusIdx: index("plans_status_idx").on(t.status),
    createdAtIdx: index("plans_created_at_idx").on(t.createdAt),
  }),
);

/**
 * plan_steps — individual steps within a plan.
 */
export const planStepsTable = pgTable(
  "plan_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plansTable.id, { onDelete: "cascade" }),
    stepIndex: integer("step_index").notNull(),
    parentStepId: uuid("parent_step_id"),
    title: text("title").notNull(),
    description: text("description"),
    skillId: text("skill_id"),
    skillVersion: integer("skill_version"),
    skillRunId: uuid("skill_run_id"),
    status: planStepStatusEnum("status").notNull().default("pending"),
    dependsOnStepIds: jsonb("depends_on_step_ids").$type<string[]>().notNull().default([]),
    inputs: jsonb("inputs").$type<Record<string, unknown>>().notNull().default({}),
    outputs: jsonb("outputs").$type<Record<string, unknown>>(),
    approvalRequired: boolean("approval_required").notNull().default(false),
    approvalId: text("approval_id"),
    verifierResultId: uuid("verifier_result_id"),
    confidence: real("confidence").notNull().default(1.0),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    retries: integer("retries").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    planIdIdx: index("plan_steps_plan_id_idx").on(t.planId),
    statusIdx: index("plan_steps_status_idx").on(t.status),
    stepIndexIdx: index("plan_steps_step_index_idx").on(t.planId, t.stepIndex),
  }),
);

// ---------------------------------------------------------------------------
// Verifier results
// ---------------------------------------------------------------------------

/**
 * verifier_results — strict pre-commit check records. One row per
 * verification run against a plan step, action, or skill output.
 */
export const verifierResultsTable = pgTable(
  "verifier_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    verifierId: text("verifier_id").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    traceId: text("trace_id"),
    planId: uuid("plan_id"),
    planStepId: uuid("plan_step_id"),
    skillRunId: uuid("skill_run_id"),
    outcome: verifierOutcomeEnum("outcome").notNull(),
    checks: jsonb("checks").$type<{
      name: string;
      outcome: string;
      message?: string;
      evidence?: unknown;
    }[]>().notNull().default([]),
    overallScore: real("overall_score"),
    blockerCount: integer("blocker_count").notNull().default(0),
    warningCount: integer("warning_count").notNull().default(0),
    passCount: integer("pass_count").notNull().default(0),
    reasoning: text("reasoning"),
    confidence: real("confidence").notNull().default(1.0),
    sensitivityTier: sensitivityTierEnum("sensitivity_tier").notNull().default("internal"),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    targetIdx: index("verifier_results_target_idx").on(t.targetType, t.targetId),
    traceIdIdx: index("verifier_results_trace_id_idx").on(t.traceId),
    outcomeIdx: index("verifier_results_outcome_idx").on(t.outcome),
    planIdIdx: index("verifier_results_plan_id_idx").on(t.planId),
    createdAtIdx: index("verifier_results_created_at_idx").on(t.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// Reflections — structured self-improvement records
// ---------------------------------------------------------------------------

/**
 * reflections — post-task and periodic structured self-improvement records.
 */
export const reflectionsTable = pgTable(
  "reflections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reflectionId: text("reflection_id").notNull().unique(),
    agentId: text("agent_id").notNull(),
    type: reflectionTypeEnum("type").notNull().default("post-task"),
    traceId: text("trace_id"),
    planId: uuid("plan_id"),
    sessionId: text("session_id"),
    triggeringEvent: text("triggering_event"),
    summary: text("summary").notNull(),
    observations: jsonb("observations").$type<{
      category: string;
      observation: string;
      evidence?: unknown;
    }[]>().notNull().default([]),
    improvements: jsonb("improvements").$type<{
      area: string;
      suggestion: string;
      priority: string;
    }[]>().notNull().default([]),
    policyBreaches: jsonb("policy_breaches").$type<{
      policyId: string;
      description: string;
      severity: string;
    }[]>().notNull().default([]),
    confidenceAdjustment: real("confidence_adjustment").notNull().default(0),
    overallHealth: text("overall_health").notNull().default("good"),
    actionable: boolean("actionable").notNull().default(false),
    suggestedActions: jsonb("suggested_actions").$type<string[]>().notNull().default([]),
    confidence: real("confidence").notNull().default(1.0),
    sensitivityTier: sensitivityTierEnum("sensitivity_tier").notNull().default("internal"),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    freshnessLastUpdatedAt: timestamp("freshness_last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    reflectionIdIdx: index("reflections_reflection_id_idx").on(t.reflectionId),
    agentIdIdx: index("reflections_agent_id_idx").on(t.agentId),
    typeIdx: index("reflections_type_idx").on(t.type),
    traceIdIdx: index("reflections_trace_id_idx").on(t.traceId),
    createdAtIdx: index("reflections_created_at_idx").on(t.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// Policies — cognitive runtime policy table
// ---------------------------------------------------------------------------

/**
 * policies — versioned policy definitions for the cognitive runtime.
 * Each version is a new row; latestVersion tracks the current head.
 */
export const policiesTable = pgTable(
  "policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    policyId: text("policy_id").notNull(),
    version: integer("version").notNull().default(1),
    latestVersion: integer("latest_version").notNull().default(1),
    name: text("name").notNull(),
    description: text("description"),
    domain: text("domain").notNull().default("general"),
    scope: text("scope").notNull().default("global"),
    effect: policyEffectEnum("effect").notNull().default("allow"),
    conditions: jsonb("conditions").$type<{
      field: string;
      operator: string;
      value: unknown;
    }[]>().notNull().default([]),
    priority: integer("priority").notNull().default(100),
    enabled: boolean("enabled").notNull().default(true),
    owner: text("owner"),
    tags: text("tags").array().notNull().default([]),
    confidence: real("confidence").notNull().default(1.0),
    sensitivityTier: sensitivityTierEnum("sensitivity_tier").notNull().default("internal"),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    provenanceAuthor: text("provenance_author"),
    freshnessLastUpdatedAt: timestamp("freshness_last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    freshnessIsStale: boolean("freshness_is_stale").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    policyIdIdx: index("policies_policy_id_idx").on(t.policyId),
    domainIdx: index("policies_domain_idx").on(t.domain),
    enabledIdx: index("policies_enabled_idx").on(t.enabled),
    priorityIdx: index("policies_priority_idx").on(t.priority),
    versionIdx: index("policies_version_idx").on(t.policyId, t.version),
  }),
);

// ---------------------------------------------------------------------------
// Actions — cognitive runtime executed actions
// ---------------------------------------------------------------------------

/**
 * actions — every agent-initiated action, its outcome, and full provenance.
 */
export const cogActionsTable = pgTable(
  "cog_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actionId: text("action_id").notNull().unique(),
    agentId: text("agent_id"),
    traceId: text("trace_id"),
    planId: uuid("plan_id"),
    planStepId: uuid("plan_step_id"),
    skillRunId: uuid("skill_run_id"),
    domain: text("domain").notNull().default("general"),
    actionType: text("action_type").notNull(),
    description: text("description").notNull(),
    status: actionStatusEnum("status").notNull().default("pending"),
    inputs: jsonb("inputs").$type<Record<string, unknown>>().notNull().default({}),
    outputs: jsonb("outputs").$type<Record<string, unknown>>(),
    policyId: text("policy_id"),
    policyVersion: integer("policy_version"),
    approvalId: text("approval_id"),
    verifierResultId: uuid("verifier_result_id"),
    rollbackEventId: uuid("rollback_event_id"),
    isReversible: boolean("is_reversible").notNull().default(true),
    rollbackProcedure: jsonb("rollback_procedure").$type<Record<string, unknown>>(),
    businessImpact: jsonb("business_impact").$type<{
      valueCreatedUsd?: number;
      valueAtRiskUsd?: number;
      description?: string;
    }>(),
    confidence: real("confidence").notNull().default(1.0),
    sensitivityTier: sensitivityTierEnum("sensitivity_tier").notNull().default("internal"),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    provenanceAuthor: text("provenance_author"),
    freshnessLastUpdatedAt: timestamp("freshness_last_updated_at", { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    actionIdIdx: index("cog_actions_action_id_idx").on(t.actionId),
    agentIdIdx: index("cog_actions_agent_id_idx").on(t.agentId),
    traceIdIdx: index("cog_actions_trace_id_idx").on(t.traceId),
    planIdIdx: index("cog_actions_plan_id_idx").on(t.planId),
    statusIdx: index("cog_actions_status_idx").on(t.status),
    domainIdx: index("cog_actions_domain_idx").on(t.domain),
    createdAtIdx: index("cog_actions_created_at_idx").on(t.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// Rollback events — immutable rollback history
// ---------------------------------------------------------------------------

/**
 * rollback_events — immutable record of every rollback. Append-only.
 */
export const rollbackEventsTable = pgTable(
  "rollback_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rollbackId: text("rollback_id").notNull().unique(),
    agentId: text("agent_id"),
    traceId: text("trace_id"),
    planId: uuid("plan_id"),
    actionId: text("action_id"),
    trigger: rollbackTriggerEnum("trigger").notNull().default("agent"),
    reason: text("reason").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    stateBeforeRollback: jsonb("state_before_rollback").$type<Record<string, unknown>>().notNull().default({}),
    stateAfterRollback: jsonb("state_after_rollback").$type<Record<string, unknown>>(),
    success: boolean("success").notNull().default(false),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    confidence: real("confidence").notNull().default(1.0),
    sensitivityTier: sensitivityTierEnum("sensitivity_tier").notNull().default("internal"),
    provenanceSource: text("provenance_source").notNull().default("agent"),
    provenanceMethod: provenanceMethodEnum("provenance_method").notNull().default("agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    initiatedAt: timestamp("initiated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    rollbackIdIdx: index("rollback_events_rollback_id_idx").on(t.rollbackId),
    agentIdIdx: index("rollback_events_agent_id_idx").on(t.agentId),
    traceIdIdx: index("rollback_events_trace_id_idx").on(t.traceId),
    targetIdx: index("rollback_events_target_idx").on(t.targetType, t.targetId),
    triggerIdx: index("rollback_events_trigger_idx").on(t.trigger),
    createdAtIdx: index("rollback_events_created_at_idx").on(t.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// TypeScript types
// ---------------------------------------------------------------------------

export type SelfModelRow = typeof selfModelsTable.$inferSelect;
export type SelfModelInsert = typeof selfModelsTable.$inferInsert;
export type SelfModelSnapshotRow = typeof selfModelSnapshotsTable.$inferSelect;
export type SelfModelSnapshotInsert = typeof selfModelSnapshotsTable.$inferInsert;
export type EntityAliasRow = typeof entityAliasesTable.$inferSelect;
export type EntityAliasInsert = typeof entityAliasesTable.$inferInsert;
export type EntityEdgeRow = typeof entityEdgesTable.$inferSelect;
export type EntityEdgeInsert = typeof entityEdgesTable.$inferInsert;
export type SkillRow = typeof skillsTable.$inferSelect;
export type SkillInsert = typeof skillsTable.$inferInsert;
export type SkillRunRow = typeof skillRunsTable.$inferSelect;
export type SkillRunInsert = typeof skillRunsTable.$inferInsert;
export type PlanRow = typeof plansTable.$inferSelect;
export type PlanInsert = typeof plansTable.$inferInsert;
export type PlanStepRow = typeof planStepsTable.$inferSelect;
export type PlanStepInsert = typeof planStepsTable.$inferInsert;
export type VerifierResultRow = typeof verifierResultsTable.$inferSelect;
export type VerifierResultInsert = typeof verifierResultsTable.$inferInsert;
export type ReflectionRow = typeof reflectionsTable.$inferSelect;
export type ReflectionInsert = typeof reflectionsTable.$inferInsert;
export type PolicyRow = typeof policiesTable.$inferSelect;
export type PolicyInsert = typeof policiesTable.$inferInsert;
export type CogActionRow = typeof cogActionsTable.$inferSelect;
export type CogActionInsert = typeof cogActionsTable.$inferInsert;
export type RollbackEventRow = typeof rollbackEventsTable.$inferSelect;
export type RollbackEventInsert = typeof rollbackEventsTable.$inferInsert;
