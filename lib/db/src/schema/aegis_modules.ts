import { pgTable, text, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Action Queue ─────────────────────────────────────────────────────────────

export type AuditEntry = { actor: string; action: string; at: string; note?: string };
export type ActionQueueStatus = "open" | "blocked" | "in_progress" | "escalated" | "complete";
export type ActionQueuePriority = "critical" | "high" | "medium" | "low";

export const aegisActionQueueItemsTable = pgTable("aegis_action_queue_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").$type<ActionQueuePriority>().notNull().default("medium"),
  status: text("status").$type<ActionQueueStatus>().notNull().default("open"),
  assignedTo: text("assigned_to"),
  dueAt: timestamp("due_at"),
  incidentId: text("incident_id"),
  source: text("source").notNull().default("system"),
  playbookRef: text("playbook_ref"),
  auditTrail: jsonb("audit_trail").$type<AuditEntry[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  statusIdx: index("aegis_aq_status_idx").on(t.status),
  priorityIdx: index("aegis_aq_priority_idx").on(t.priority),
}));

export const insertAegisActionQueueItemSchema = createInsertSchema(aegisActionQueueItemsTable).omit({ createdAt: true, updatedAt: true });
export type InsertAegisActionQueueItem = z.infer<typeof insertAegisActionQueueItemSchema>;
export type AegisActionQueueItem = typeof aegisActionQueueItemsTable.$inferSelect;

// ─── SOAR Playbooks ───────────────────────────────────────────────────────────

export type PlaybookStatus = "active" | "draft" | "archived";
export type PlaybookNodeType = "trigger" | "action" | "condition" | "enrich" | "notify" | "approve" | "loop";
export type PlaybookNode = { id: string; type: PlaybookNodeType; label: string; config: string; auto: boolean };

export const aegisSoarPlaybooksTable = pgTable("aegis_soar_playbooks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(),
  description: text("description").notNull(),
  nodes: jsonb("nodes").$type<PlaybookNode[]>().notNull().default([]),
  status: text("status").$type<PlaybookStatus>().notNull().default("draft"),
  runCount: integer("run_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  statusIdx: index("aegis_soar_pb_status_idx").on(t.status),
}));

export const insertAegisSoarPlaybookSchema = createInsertSchema(aegisSoarPlaybooksTable).omit({ createdAt: true, updatedAt: true });
export type InsertAegisSoarPlaybook = z.infer<typeof insertAegisSoarPlaybookSchema>;
export type AegisSoarPlaybook = typeof aegisSoarPlaybooksTable.$inferSelect;

// ─── SOAR Runs ────────────────────────────────────────────────────────────────

export type SoarRunStatus = "running" | "completed" | "failed" | "awaiting_approval";

export const aegisSoarRunsTable = pgTable("aegis_soar_runs", {
  id: text("id").primaryKey(),
  playbookId: text("playbook_id").notNull().references(() => aegisSoarPlaybooksTable.id, { onDelete: "cascade" }),
  playbookName: text("playbook_name").notNull(),
  status: text("status").$type<SoarRunStatus>().notNull().default("running"),
  triggeredBy: text("triggered_by").notNull().default("manual"),
  duration: text("duration"),
  stepsCompleted: integer("steps_completed").notNull().default(0),
  stepsFailed: integer("steps_failed").notNull().default(0),
  outcome: text("outcome"),
  incidentId: text("incident_id"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (t) => ({
  playbookIdx: index("aegis_soar_runs_pb_idx").on(t.playbookId),
  statusIdx: index("aegis_soar_runs_status_idx").on(t.status),
}));

export const insertAegisSoarRunSchema = createInsertSchema(aegisSoarRunsTable).omit({ startedAt: true, completedAt: true });
export type InsertAegisSoarRun = z.infer<typeof insertAegisSoarRunSchema>;
export type AegisSoarRun = typeof aegisSoarRunsTable.$inferSelect;

// ─── Deception Honeypots ──────────────────────────────────────────────────────

export type HoneypotStatus = "active" | "inactive" | "compromised";
export type HoneypotType = "ssh" | "http" | "smb" | "ftp" | "db" | "ics";

export const aegisDeceptionHotpotsTable = pgTable("aegis_deception_honeypots", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").$type<HoneypotType>().notNull(),
  ip: text("ip").notNull(),
  os: text("os").notNull(),
  status: text("status").$type<HoneypotStatus>().notNull().default("active"),
  interactions: integer("interactions").notNull().default(0),
  iocsPushed: integer("iocs_pushed").notNull().default(0),
  deceptionScore: integer("deception_score").notNull().default(0),
  lastHit: timestamp("last_hit"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  statusIdx: index("aegis_honeypots_status_idx").on(t.status),
}));

export const insertAegisDeceptionHoneypotSchema = createInsertSchema(aegisDeceptionHotpotsTable).omit({ createdAt: true, updatedAt: true });
export type InsertAegisDeceptionHoneypot = z.infer<typeof insertAegisDeceptionHoneypotSchema>;
export type AegisDeceptionHoneypot = typeof aegisDeceptionHotpotsTable.$inferSelect;

// ─── Digital Twin Nodes ───────────────────────────────────────────────────────

export type TwinNodeStatus = "synced" | "drifted" | "offline";
export type TwinNodeTier = "tier-0" | "tier-1" | "tier-2" | "tier-3";

export const aegisTwinNodesTable = pgTable("aegis_twin_nodes", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  type: text("type").notNull(),
  zone: text("zone").notNull(),
  tier: text("tier").$type<TwinNodeTier>().notNull().default("tier-2"),
  status: text("status").$type<TwinNodeStatus>().notNull().default("synced"),
  ip: text("ip"),
  os: text("os"),
  vulnerabilities: integer("vulnerabilities").notNull().default(0),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  meta: jsonb("meta").$type<Record<string, string | number | boolean>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  zoneIdx: index("aegis_twin_zone_idx").on(t.zone),
  statusIdx: index("aegis_twin_status_idx").on(t.status),
}));

export const insertAegisTwinNodeSchema = createInsertSchema(aegisTwinNodesTable).omit({ createdAt: true, updatedAt: true });
export type InsertAegisTwinNode = z.infer<typeof insertAegisTwinNodeSchema>;
export type AegisTwinNode = typeof aegisTwinNodesTable.$inferSelect;
