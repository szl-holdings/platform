import {
  pgTable,
  text,
  integer,
  serial,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";

export const agentMeshRuntimesTable = pgTable("agent_mesh_runtimes", {
  id: text("id").primaryKey(),
  orgId: integer("org_id"),
  name: text("name").notNull(),
  version: text("version").notNull().default("unknown"),
  sourceRegistry: text("source_registry").notNull().default("unknown"),
  trustState: text("trust_state").notNull().default("unverified"),
  configFiles: jsonb("config_files").$type<string[]>().notNull().default([]),
  activeAgentIds: jsonb("active_agent_ids").$type<string[]>().notNull().default([]),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentMeshMcpServersTable = pgTable("agent_mesh_mcp_servers", {
  id: text("id").primaryKey(),
  orgId: integer("org_id"),
  name: text("name").notNull(),
  packageRef: text("package_ref").notNull().default(""),
  version: text("version").notNull().default("unknown"),
  pinned: boolean("pinned").notNull().default(false),
  sourceRegistry: text("source_registry").notNull().default("unknown"),
  trustState: text("trust_state").notNull().default("unverified"),
  runtimeIds: jsonb("runtime_ids").$type<string[]>().notNull().default([]),
  allowedEgressDomains: jsonb("allowed_egress_domains").$type<string[]>().notNull().default([]),
  detectedEgressDomains: jsonb("detected_egress_domains").$type<string[]>().notNull().default([]),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentMeshSecretsTable = pgTable("agent_mesh_secrets", {
  id: text("id").primaryKey(),
  orgId: integer("org_id"),
  label: text("label").notNull(),
  format: text("format").notNull().default("env-var"),
  foundInFile: text("found_in_file").notNull(),
  entropy: doublePrecision("entropy").notNull().default(0),
  reachableByAgentIds: jsonb("reachable_by_agent_ids").$type<string[]>().notNull().default([]),
  reachableByMcpIds: jsonb("reachable_by_mcp_ids").$type<string[]>().notNull().default([]),
  lastDetectedAt: timestamp("last_detected_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentMeshEdgesTable = pgTable(
  "agent_mesh_edges",
  {
    id: text("id").primaryKey(),
    orgId: integer("org_id"),
    agentId: text("agent_id").notNull(),
    mcpServerId: text("mcp_server_id").notNull(),
    tools: jsonb("tools").$type<string[]>().notNull().default([]),
    dataReadPaths: jsonb("data_read_paths").$type<string[]>().notNull().default([]),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    agentIdx: index("agent_mesh_edges_agent_idx").on(t.agentId),
    mcpIdx: index("agent_mesh_edges_mcp_idx").on(t.mcpServerId),
  }),
);

export const agentMeshExposuresTable = pgTable("agent_mesh_exposures", {
  id: text("id").primaryKey(),
  orgId: integer("org_id"),
  title: text("title").notNull(),
  severity: text("severity").notNull().default("medium"),
  affectedAgentIds: jsonb("affected_agent_ids").$type<string[]>().notNull().default([]),
  affectedSecretIds: jsonb("affected_secret_ids").$type<string[]>().notNull().default([]),
  affectedMcpIds: jsonb("affected_mcp_ids").$type<string[]>().notNull().default([]),
  explanation: text("explanation").notNull().default(""),
  owaspCategory: text("owasp_category").notNull().default(""),
  owaspRef: text("owasp_ref").notNull().default(""),
  cveRefs: jsonb("cve_refs").$type<string[]>().notNull().default([]),
  fixType: text("fix_type").notNull().default("scope-token"),
  fixLabel: text("fix_label").notNull().default(""),
  proofHash: text("proof_hash").notNull().default(""),
  status: text("status").notNull().default("open"),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentMeshContainmentRulesTable = pgTable("agent_mesh_containment_rules", {
  id: text("id").primaryKey(),
  orgId: integer("org_id"),
  name: text("name").notNull(),
  agentClass: text("agent_class").notNull(),
  allowedMcpServers: jsonb("allowed_mcp_servers").$type<string[]>().notNull().default([]),
  allowedTools: jsonb("allowed_tools").$type<string[]>().notNull().default([]),
  allowedReadPaths: jsonb("allowed_read_paths").$type<string[]>().notNull().default([]),
  allowedEgressDomains: jsonb("allowed_egress_domains").$type<string[]>().notNull().default([]),
  tier: text("tier").notNull().default("standard"),
  enforcementMode: text("enforcement_mode").notNull().default("log-only"),
  pendingModeChange: jsonb("pending_mode_change").$type<{
    requestedMode: string;
    requestedBy: string;
    requestedAt: string;
    guardianApprovalId: string;
  } | null>(),
  violationCount: integer("violation_count").notNull().default(0),
  lastEvaluatedAt: timestamp("last_evaluated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentMeshGatewayEventsTable = pgTable(
  "agent_mesh_gateway_events",
  {
    id: text("id").primaryKey(),
    orgId: integer("org_id"),
    ruleId: text("rule_id").notNull(),
    agentClass: text("agent_class").notNull(),
    mcpServerId: text("mcp_server_id").notNull(),
    tool: text("tool").notNull(),
    egressDomain: text("egress_domain"),
    decision: text("decision").notNull(),
    reason: text("reason").notNull().default(""),
    enforcementMode: text("enforcement_mode").notNull(),
    linkedExposureId: text("linked_exposure_id"),
    latencyMs: integer("latency_ms"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    occurredAtIdx: index("agent_mesh_gateway_events_occurred_at_idx").on(t.occurredAt),
    ruleIdx: index("agent_mesh_gateway_events_rule_idx").on(t.ruleId),
    decisionIdx: index("agent_mesh_gateway_events_decision_idx").on(t.decision),
  }),
);

export const agentMeshDriftSnapshotsTable = pgTable("agent_mesh_drift_snapshots", {
  id: text("id").primaryKey(),
  orgId: integer("org_id"),
  configFile: text("config_file").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  changedBy: text("changed_by").notNull().default("unknown"),
  policyApproved: boolean("policy_approved").notNull().default(false),
  approvedBy: text("approved_by"),
  diff: jsonb("diff").$type<{ removed: string[]; added: string[] }>().notNull().default({ removed: [], added: [] }),
  linkedExposureIds: jsonb("linked_exposure_ids").$type<string[]>().notNull().default([]),
});

export const agentMeshResilienceIndexTable = pgTable(
  "agent_mesh_resilience_index",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id"),
    overall: integer("overall").notNull(),
    grade: text("grade").notNull(),
    secretHygiene: integer("secret_hygiene").notNull(),
    permissionSurface: integer("permission_surface").notNull(),
    supplyChain: integer("supply_chain").notNull(),
    egressContainment: integer("egress_containment").notNull(),
    scheduleHygiene: integer("schedule_hygiene").notNull(),
    instructionTamperingRisk: integer("instruction_tampering_risk").notNull(),
    crossAgentBlastRadius: integer("cross_agent_blast_radius").notNull(),
    openExposures: integer("open_exposures").notNull().default(0),
    pendingApprovals: integer("pending_approvals").notNull().default(0),
    topExposure: text("top_exposure"),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    computedAtIdx: index("agent_mesh_resilience_index_computed_at_idx").on(t.computedAt),
  }),
);
