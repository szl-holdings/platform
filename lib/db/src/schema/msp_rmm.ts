import { pgTable, text, serial, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { mspClientsTable, mspDevicesTable, mspTicketsTable } from "./msp";

export const mspRmmConnectorsTable = pgTable("msp_rmm_connectors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider", {
    enum: ["ninjaone", "connectwise_automate", "connectwise_manage", "datto_rmm", "halopsa", "autotask_psa", "atera"],
  }).notNull(),
  mode: text("mode", { enum: ["rmm", "psa", "both"] }).notNull().default("both"),
  status: text("status", { enum: ["active", "inactive", "error", "pending"] }).notNull().default("pending"),
  authType: text("auth_type", { enum: ["api_key", "oauth2", "basic"] }).notNull().default("api_key"),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  lastSyncAt: timestamp("last_sync_at"),
  lastErrorAt: timestamp("last_error_at"),
  lastError: text("last_error"),
  syncIntervalMinutes: integer("sync_interval_minutes").default(5),
  deviceCount: integer("device_count").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mspRmmDeviceMetricsTable = pgTable("msp_rmm_device_metrics", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => mspDevicesTable.id, { onDelete: "cascade" }),
  deviceDbId: text("device_db_id"),
  connectorId: integer("connector_id").references(() => mspRmmConnectorsTable.id, { onDelete: "set null" }),
  providerDeviceId: text("provider_device_id"),
  cpu: integer("cpu").default(0),
  memory: integer("memory").default(0),
  disk: integer("disk").default(0),
  networkInKbps: integer("network_in_kbps").default(0),
  networkOutKbps: integer("network_out_kbps").default(0),
  agentVersion: text("agent_version"),
  patchStatus: text("patch_status"),
  services: jsonb("services").$type<Array<{ name: string; status: string; pid?: number }>>().default([]),
  processes: jsonb("processes").$type<Array<{ name: string; pid: number; cpu: number; memory: number }>>().default([]),
  diskFillRateGbPerHour: integer("disk_fill_rate_gb_per_hour"),
  predictedFullAt: timestamp("predicted_full_at"),
  snapshotAt: timestamp("snapshot_at").notNull().defaultNow(),
}, (t) => [
  index("msp_rmm_device_metrics_device_idx").on(t.deviceId),
  index("msp_rmm_device_metrics_snapshot_idx").on(t.snapshotAt),
]);

export const mspHealingPlaybooksTable = pgTable("msp_healing_playbooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { enum: ["active", "inactive", "draft"] }).notNull().default("active"),
  executionMode: text("execution_mode", { enum: ["full_auto", "human_gated", "notify_only"] }).notNull().default("human_gated"),
  detectionRules: jsonb("detection_rules").$type<Array<{
    metric: string;
    operator: "gt" | "lt" | "eq" | "gte" | "lte";
    threshold: number;
    durationMinutes?: number;
    condition?: string;
  }>>().default([]),
  remediationActions: jsonb("remediation_actions").$type<Array<{
    type: "restart_service" | "reboot" | "kill_process" | "clear_disk" | "run_script" | "escalate";
    target?: string;
    parameters?: Record<string, unknown>;
    requireApproval?: boolean;
  }>>().default([]),
  targetDeviceTypes: jsonb("target_device_types").$type<string[]>().default([]),
  targetClientIds: jsonb("target_client_ids").$type<number[]>().default([]),
  confidenceThreshold: integer("confidence_threshold").default(70),
  successRate: integer("success_rate").default(0),
  totalExecutions: integer("total_executions").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mspHealingExecutionsTable = pgTable("msp_healing_executions", {
  id: serial("id").primaryKey(),
  playbookId: integer("playbook_id").references(() => mspHealingPlaybooksTable.id, { onDelete: "set null" }),
  deviceId: integer("device_id").references(() => mspDevicesTable.id, { onDelete: "set null" }),
  clientId: integer("client_id").references(() => mspClientsTable.id, { onDelete: "set null" }),
  triggeredBy: text("triggered_by").notNull().default("auto"),
  status: text("status", { enum: ["pending_approval", "approved", "running", "completed", "failed", "rejected"] }).notNull().default("pending_approval"),
  approvalRequired: boolean("approval_required").default(true),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  detectionContext: jsonb("detection_context").$type<Record<string, unknown>>().default({}),
  beforeMetrics: jsonb("before_metrics").$type<{ cpu: number; memory: number; disk: number; services?: Array<{ name: string; status: string }> }>(),
  afterMetrics: jsonb("after_metrics").$type<{ cpu: number; memory: number; disk: number; services?: Array<{ name: string; status: string }> }>(),
  actionsExecuted: jsonb("actions_executed").$type<Array<{ action: string; result: string; at: string }>>().default([]),
  healingConfidenceScore: integer("healing_confidence_score").default(0),
  ticketId: integer("ticket_id").references(() => mspTicketsTable.id, { onDelete: "set null" }),
  psaTicketRef: text("psa_ticket_ref"),
  notes: text("notes"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("msp_healing_exec_playbook_idx").on(t.playbookId),
  index("msp_healing_exec_device_idx").on(t.deviceId),
  index("msp_healing_exec_status_idx").on(t.status),
]);

export const mspRemoteActionsTable = pgTable("msp_remote_actions", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => mspDevicesTable.id, { onDelete: "set null" }),
  connectorId: integer("connector_id").references(() => mspRmmConnectorsTable.id, { onDelete: "set null" }),
  actionType: text("action_type", {
    enum: ["service_start", "service_stop", "service_restart", "reboot", "forced_reboot", "run_script", "kill_process", "clear_temp"],
  }).notNull(),
  target: text("target"),
  parameters: jsonb("parameters").$type<Record<string, unknown>>().default({}),
  status: text("status", { enum: ["pending_approval", "approved", "executing", "completed", "failed", "cancelled"] }).notNull().default("pending_approval"),
  requiresApproval: boolean("requires_approval").default(true),
  requestedBy: text("requested_by").notNull().default("system"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  providerJobId: text("provider_job_id"),
  result: jsonb("result").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  executedAt: timestamp("executed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("msp_remote_actions_device_idx").on(t.deviceId),
  index("msp_remote_actions_status_idx").on(t.status),
]);

export const mspPsaTicketSyncTable = pgTable("msp_psa_ticket_sync", {
  id: serial("id").primaryKey(),
  internalTicketId: integer("internal_ticket_id").references(() => mspTicketsTable.id, { onDelete: "cascade" }),
  connectorId: integer("connector_id").references(() => mspRmmConnectorsTable.id, { onDelete: "set null" }),
  psaTicketId: text("psa_ticket_id"),
  psaUrl: text("psa_url"),
  syncStatus: text("sync_status", { enum: ["synced", "pending", "error", "closed"] }).notNull().default("pending"),
  lastSyncAt: timestamp("last_sync_at"),
  slaBreach: boolean("sla_breach").default(false),
  slaTimerStartedAt: timestamp("sla_timer_started_at"),
  closedAt: timestamp("closed_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mspOrgSiteMappingsTable = pgTable("msp_org_site_mappings", {
  id: serial("id").primaryKey(),
  connectorId: integer("connector_id").references(() => mspRmmConnectorsTable.id, { onDelete: "cascade" }).notNull(),
  providerOrgId: text("provider_org_id").notNull(),
  providerOrgName: text("provider_org_name"),
  providerSiteId: text("provider_site_id"),
  providerSiteName: text("provider_site_name"),
  internalClientId: integer("internal_client_id").references(() => mspClientsTable.id, { onDelete: "set null" }),
  syncEnabled: boolean("sync_enabled").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("msp_org_site_connector_idx").on(t.connectorId),
  index("msp_org_site_client_idx").on(t.internalClientId),
]);

export type MspRmmConnector = typeof mspRmmConnectorsTable.$inferSelect;
export type InsertMspRmmConnector = typeof mspRmmConnectorsTable.$inferInsert;
export type MspHealingPlaybook = typeof mspHealingPlaybooksTable.$inferSelect;
export type InsertMspHealingPlaybook = typeof mspHealingPlaybooksTable.$inferInsert;
export type MspHealingExecution = typeof mspHealingExecutionsTable.$inferSelect;
export type InsertMspHealingExecution = typeof mspHealingExecutionsTable.$inferInsert;
export type MspRemoteAction = typeof mspRemoteActionsTable.$inferSelect;
export type InsertMspRemoteAction = typeof mspRemoteActionsTable.$inferInsert;
