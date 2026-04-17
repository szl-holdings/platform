import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { usersTable } from "./auth";

export const guardianPoliciesTable = pgTable("guardian_policies", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  tier: text("tier", {
    enum: [
      "advisory-only",
      "internal-workflow",
      "operator-assisted",
      "executive-facing",
      "regulated-workflow",
      "external-client-facing",
      "autonomous-reversible",
      "human-approval-mandatory",
    ],
  }).notNull(),
  conditions: jsonb("conditions").notNull().default([]),
  action: text("action", {
    enum: ["allow", "deny", "require-approval", "log", "redact", "escalate"],
  }).notNull(),
  priority: integer("priority").notNull().default(100),
  enabled: boolean("enabled").notNull().default(true),
  owner: text("owner"),
  tags: jsonb("tags").notNull().default([]),
  createdById: integer("created_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("guardian_policies_org_idx").on(table.orgId),
  index("guardian_policies_tier_idx").on(table.tier),
  index("guardian_policies_enabled_idx").on(table.enabled),
  index("guardian_policies_priority_idx").on(table.priority),
]);

export const guardianPolicyAssignmentsTable = pgTable("guardian_policy_assignments", {
  id: serial("id").primaryKey(),
  policyId: integer("policy_id").notNull().references(() => guardianPoliciesTable.id, { onDelete: "cascade" }),
  subjectType: text("subject_type", {
    enum: ["user", "agent", "team", "role", "org", "workflow"],
  }).notNull(),
  subjectId: text("subject_id").notNull(),
  context: jsonb("context").notNull().default({}),
  grantedById: integer("granted_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("guardian_policy_assignments_policy_idx").on(table.policyId),
  index("guardian_policy_assignments_subject_idx").on(table.subjectType, table.subjectId),
  uniqueIndex("guardian_policy_assignments_unique_idx").on(table.policyId, table.subjectType, table.subjectId),
]);

export const toolMeshToolsTable = pgTable("tool_mesh_tools", {
  id: serial("id").primaryKey(),
  toolId: text("tool_id").notNull().unique(),
  name: text("name").notNull(),
  version: text("version").notNull().default("1.0.0"),
  description: text("description").notNull(),
  domainTags: jsonb("domain_tags").notNull().default([]),
  policyTier: text("policy_tier", {
    enum: [
      "advisory-only",
      "internal-workflow",
      "operator-assisted",
      "executive-facing",
      "regulated-workflow",
      "external-client-facing",
      "autonomous-reversible",
      "human-approval-mandatory",
    ],
  }).notNull(),
  allowedEnvironments: jsonb("allowed_environments").notNull().default(["development", "staging", "production"]),
  inputSchema: jsonb("input_schema"),
  outputSchema: jsonb("output_schema"),
  rateLimits: jsonb("rate_limits").notNull().default({}),
  timeoutMs: integer("timeout_ms").notNull().default(30000),
  failureModes: jsonb("failure_modes").notNull().default([]),
  approvalRequired: boolean("approval_required").notNull().default(false),
  owner: text("owner"),
  observabilityHooks: jsonb("observability_hooks").notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("tool_mesh_tools_policy_tier_idx").on(table.policyTier),
  index("tool_mesh_tools_enabled_idx").on(table.enabled),
]);

export const toolMeshToolVersionsTable = pgTable("tool_mesh_tool_versions", {
  id: serial("id").primaryKey(),
  toolDbId: integer("tool_db_id").notNull().references(() => toolMeshToolsTable.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  changelog: text("changelog"),
  schemaSnapshot: jsonb("schema_snapshot").notNull().default({}),
  publishedById: integer("published_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("tool_mesh_tool_versions_tool_idx").on(table.toolDbId),
  uniqueIndex("tool_mesh_tool_versions_tool_version_idx").on(table.toolDbId, table.version),
]);

export const toolMeshToolPermissionsTable = pgTable("tool_mesh_tool_permissions", {
  id: serial("id").primaryKey(),
  toolDbId: integer("tool_db_id").notNull().references(() => toolMeshToolsTable.id, { onDelete: "cascade" }),
  subjectType: text("subject_type", {
    enum: ["user", "agent", "team", "role", "org"],
  }).notNull(),
  subjectId: text("subject_id").notNull(),
  permission: text("permission", {
    enum: ["invoke", "read-schema", "manage"],
  }).notNull().default("invoke"),
  grantedById: integer("granted_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("tool_mesh_tool_permissions_tool_idx").on(table.toolDbId),
  index("tool_mesh_tool_permissions_subject_idx").on(table.subjectType, table.subjectId),
  uniqueIndex("tool_mesh_tool_permissions_unique_idx").on(table.toolDbId, table.subjectType, table.subjectId, table.permission),
]);

export const toolMeshActionApprovalsTable = pgTable("tool_mesh_action_approvals", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  toolId: text("tool_id").notNull(),
  action: text("action").notNull(),
  agentId: text("agent_id"),
  sessionId: text("session_id"),
  workflowId: text("workflow_id"),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "expired", "cancelled"],
  }).notNull().default("pending"),
  policyId: integer("policy_id").references(() => guardianPoliciesTable.id, { onDelete: "set null" }),
  decisionReason: text("decision_reason"),
  requestedById: integer("requested_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  approvedById: integer("approved_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  rejectedById: integer("rejected_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  rejectedAt: timestamp("rejected_at"),
  expiresAt: timestamp("expires_at"),
  payload: jsonb("payload").notNull().default({}),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("tool_mesh_action_approvals_tool_idx").on(table.toolId),
  index("tool_mesh_action_approvals_status_idx").on(table.status),
  index("tool_mesh_action_approvals_org_idx").on(table.orgId),
  index("tool_mesh_action_approvals_agent_idx").on(table.agentId),
  index("tool_mesh_action_approvals_created_idx").on(table.createdAt),
]);

export type GuardianPolicy = typeof guardianPoliciesTable.$inferSelect;
export type InsertGuardianPolicy = typeof guardianPoliciesTable.$inferInsert;

export type GuardianPolicyAssignment = typeof guardianPolicyAssignmentsTable.$inferSelect;
export type InsertGuardianPolicyAssignment = typeof guardianPolicyAssignmentsTable.$inferInsert;

export type ToolMeshTool = typeof toolMeshToolsTable.$inferSelect;
export type InsertToolMeshTool = typeof toolMeshToolsTable.$inferInsert;

export type ToolMeshToolVersion = typeof toolMeshToolVersionsTable.$inferSelect;
export type InsertToolMeshToolVersion = typeof toolMeshToolVersionsTable.$inferInsert;

export type ToolMeshToolPermission = typeof toolMeshToolPermissionsTable.$inferSelect;
export type InsertToolMeshToolPermission = typeof toolMeshToolPermissionsTable.$inferInsert;

export type ToolMeshActionApproval = typeof toolMeshActionApprovalsTable.$inferSelect;
export type InsertToolMeshActionApproval = typeof toolMeshActionApprovalsTable.$inferInsert;
