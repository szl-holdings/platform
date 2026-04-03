import { pgTable, text, serial, timestamp, integer, numeric, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { pcMattersTable } from "./prism_counsel";

export const pcRecoveryItemsTable = pgTable("pc_recovery_items", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  lienCategory: text("lien_category", {
    enum: [
      "medicare_msp", "medicaid", "private_health_reimbursement", "workers_comp",
      "provider_lien", "hospital_lien", "statutory_recovery", "firm_internal",
      "erisa", "no_fault_reimbursement", "child_support", "other"
    ]
  }).notNull(),
  lienHolder: text("lien_holder").notNull(),
  lifecycleState: text("lifecycle_state", {
    enum: [
      "not_identified", "suspected", "identified", "documentation_requested",
      "awaiting_response", "amount_pending", "amount_known", "dispute_flagged",
      "reviewed", "ready_for_settlement_handling", "resolved", "archived"
    ]
  }).notNull().default("not_identified"),
  assertedAmount: numeric("asserted_amount", { precision: 14, scale: 2 }),
  negotiatedAmount: numeric("negotiated_amount", { precision: 14, scale: 2 }),
  confirmedAmount: numeric("confirmed_amount", { precision: 14, scale: 2 }),
  amountStatus: text("amount_status", { enum: ["confirmed", "inferred", "pending", "unknown"] }).notNull().default("unknown"),
  sourceClass: text("source_class", { enum: ["carrier_document", "provider_notice", "government_letter", "attorney_note", "court_filing", "manual_entry", "inferred"] }).notNull().default("manual_entry"),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  blocksSettlement: boolean("blocks_settlement").default(false),
  blocksExport: boolean("blocks_export").default(false),
  isStale: boolean("is_stale").default(false),
  staleSince: timestamp("stale_since"),
  lastActivityAt: timestamp("last_activity_at"),
  amountLastUpdatedAt: timestamp("amount_last_updated_at"),
  documentationRequestedAt: timestamp("documentation_requested_at"),
  responseDeadline: timestamp("response_deadline"),
  notes: text("notes"),
  provenance: jsonb("provenance"),
  assignedTo: integer("assigned_to"),
  createdBy: integer("created_by"),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("pc_recovery_matter_idx").on(table.matterId),
  index("pc_recovery_org_idx").on(table.orgId),
  index("pc_recovery_state_idx").on(table.lifecycleState),
  index("pc_recovery_blocks_idx").on(table.blocksSettlement),
]);

export const pcRecoveryPartiesTable = pgTable("pc_recovery_parties", {
  id: serial("id").primaryKey(),
  recoveryItemId: integer("recovery_item_id").notNull().references(() => pcRecoveryItemsTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").notNull(),
  role: text("role", { enum: ["lien_holder", "insurer", "adjuster", "provider", "government_agency", "counsel", "mediator", "other"] }).notNull(),
  name: text("name").notNull(),
  organization: text("organization"),
  email: text("email"),
  phone: text("phone"),
  contactPreference: text("contact_preference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcRecoveryDocumentsTable = pgTable("pc_recovery_documents", {
  id: serial("id").primaryKey(),
  recoveryItemId: integer("recovery_item_id").notNull().references(() => pcRecoveryItemsTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").notNull(),
  documentType: text("document_type", { enum: [
    "lien_notice", "conditional_payment_letter", "final_demand", "dispute_letter",
    "supporting_records", "correspondence", "settlement_agreement", "waiver", "other"
  ] }).notNull(),
  title: text("title").notNull(),
  documentRef: text("document_ref"),
  sourceSystem: text("source_system"),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  privilegeFlag: boolean("privilege_flag").default(false),
  reviewState: text("review_state", { enum: ["unreviewed", "reviewed", "flagged"] }).default("unreviewed"),
  uploadedBy: integer("uploaded_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcRecoveryStatusHistoryTable = pgTable("pc_recovery_status_history", {
  id: serial("id").primaryKey(),
  recoveryItemId: integer("recovery_item_id").notNull().references(() => pcRecoveryItemsTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").notNull(),
  fromState: text("from_state"),
  toState: text("to_state").notNull(),
  actorId: integer("actor_id"),
  actorRole: text("actor_role"),
  reason: text("reason"),
  notes: text("notes"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pc_recovery_hist_item_idx").on(table.recoveryItemId),
]);

export const pcRecoveryAmountMarkersTable = pgTable("pc_recovery_amount_markers", {
  id: serial("id").primaryKey(),
  recoveryItemId: integer("recovery_item_id").notNull().references(() => pcRecoveryItemsTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").notNull(),
  markerType: text("marker_type", { enum: [
    "initial_assertion", "updated_assertion", "negotiated_reduction",
    "conditional_payment", "final_amount", "dispute_challenge", "waiver_credit"
  ] }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  amountStatus: text("amount_status", { enum: ["confirmed", "inferred", "pending"] }).notNull().default("pending"),
  sourceDocument: text("source_document"),
  sourceClass: text("source_class"),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  markedAt: timestamp("marked_at").notNull().defaultNow(),
  actorId: integer("actor_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcRecoveryFollowupsTable = pgTable("pc_recovery_followups", {
  id: serial("id").primaryKey(),
  recoveryItemId: integer("recovery_item_id").notNull().references(() => pcRecoveryItemsTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").notNull(),
  followupType: text("followup_type", { enum: [
    "request_documentation", "request_updated_amount", "escalate_delay",
    "attach_support", "add_notes", "link_to_matter_event", "link_to_settlement_friction",
    "route_for_attorney_review", "route_for_managed_review", "mark_dependency_reviewed"
  ] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  assignedTo: integer("assigned_to"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "overdue", "cancelled"] }).notNull().default("pending"),
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by"),
  notes: text("notes"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("pc_recovery_followup_item_idx").on(table.recoveryItemId),
  index("pc_recovery_followup_status_idx").on(table.status),
]);

export const pcRecoveryDependencyLinksTable = pgTable("pc_recovery_dependency_links", {
  id: serial("id").primaryKey(),
  recoveryItemId: integer("recovery_item_id").notNull().references(() => pcRecoveryItemsTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").notNull(),
  dependencyType: text("dependency_type", { enum: [
    "blocks_settlement", "blocks_export", "increases_friction",
    "affects_readiness", "tied_to_matter_event", "tied_to_blocker"
  ] }).notNull(),
  linkedEntityType: text("linked_entity_type", { enum: ["matter", "settlement_blocker", "deadline", "offer", "approval"] }).notNull(),
  linkedEntityId: integer("linked_entity_id").notNull(),
  notes: text("notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pc_recovery_dep_item_idx").on(table.recoveryItemId),
]);

export const pcRecoveryRiskSnapshotsTable = pgTable("pc_recovery_risk_snapshots", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").notNull(),
  totalAsserted: numeric("total_asserted", { precision: 14, scale: 2 }),
  totalConfirmed: numeric("total_confirmed", { precision: 14, scale: 2 }),
  totalPending: numeric("total_pending", { precision: 14, scale: 2 }),
  totalStale: integer("total_stale").default(0),
  totalBlockingSettlement: integer("total_blocking_settlement").default(0),
  totalAwaitingResponse: integer("total_awaiting_response").default(0),
  totalUnresolved: integer("total_unresolved").default(0),
  exportBlocked: boolean("export_blocked").default(false),
  overallRisk: text("overall_risk", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  signals: jsonb("signals"),
  snapshotAt: timestamp("snapshot_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pc_recovery_risk_matter_idx").on(table.matterId),
]);

export const pcSettlementBlockersTable = pgTable("pc_settlement_blockers", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  blockerType: text("blocker_type", { enum: [
    "missing_evidence", "missing_records", "contradiction", "insurer_silence",
    "insurer_hardening", "no_fault_support", "recovery_lien", "approval",
    "review_backlog", "venue_timing", "document_confidence", "export_safety"
  ] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  isInternal: boolean("is_internal").default(true),
  isExternal: boolean("is_external").default(false),
  ownerId: integer("owner_id"),
  ownerRole: text("owner_role"),
  status: text("status", { enum: ["open", "in_progress", "resolved", "dismissed"] }).notNull().default("open"),
  nextBestAction: text("next_best_action"),
  consequencesIfIgnored: text("consequences_if_ignored"),
  blocksWhat: text("blocks_what"),
  daysOpen: integer("days_open").default(0),
  lastAssessedAt: timestamp("last_assessed_at"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by"),
  recoveryItemId: integer("recovery_item_id").references(() => pcRecoveryItemsTable.id),
  provenance: jsonb("provenance"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("pc_blockers_matter_idx").on(table.matterId),
  index("pc_blockers_org_idx").on(table.orgId),
  index("pc_blockers_severity_idx").on(table.severity),
  index("pc_blockers_status_idx").on(table.status),
]);

export const pcSettlementBlockerDriversTable = pgTable("pc_settlement_blocker_drivers", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => pcSettlementBlockersTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").notNull(),
  driverType: text("driver_type", { enum: [
    "evidence_gap", "document_missing", "response_lag", "dispute_flag",
    "amount_unknown", "lien_unresolved", "approval_pending", "confidence_low",
    "privilege_risk", "deadline_pressure", "venue_constraint", "internal_backlog"
  ] }).notNull(),
  description: text("description").notNull(),
  weight: numeric("weight", { precision: 5, scale: 2 }),
  sourceEntityType: text("source_entity_type"),
  sourceEntityId: integer("source_entity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcSettlementBlockerActionsTable = pgTable("pc_settlement_blocker_actions", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => pcSettlementBlockersTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").notNull(),
  actionType: text("action_type", { enum: [
    "request_document", "follow_up_insurer", "escalate_internally", "request_approval",
    "flag_for_attorney", "attach_support", "mark_resolved", "link_recovery_item",
    "note_added", "route_managed_review"
  ] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to"),
  dueDate: timestamp("due_date"),
  status: text("status", { enum: ["pending", "completed", "skipped"] }).notNull().default("pending"),
  completedBy: integer("completed_by"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pc_blocker_actions_blocker_idx").on(table.blockerId),
]);

export const pcSettlementBlockerSnapshotsTable = pgTable("pc_settlement_blocker_snapshots", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").notNull(),
  totalOpen: integer("total_open").default(0),
  totalCritical: integer("total_critical").default(0),
  totalHigh: integer("total_high").default(0),
  totalInternal: integer("total_internal").default(0),
  totalExternal: integer("total_external").default(0),
  oldestBlockerDays: integer("oldest_blocker_days").default(0),
  settlementReadiness: text("settlement_readiness", { enum: ["blocked", "partial", "clear"] }).notNull().default("partial"),
  exportReadiness: text("export_readiness", { enum: ["blocked", "partial", "clear"] }).notNull().default("partial"),
  signals: jsonb("signals"),
  snapshotAt: timestamp("snapshot_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pc_blocker_snap_matter_idx").on(table.matterId),
]);

export const insertRecoveryItemSchema = createInsertSchema(pcRecoveryItemsTable);
export const insertSettlementBlockerSchema = createInsertSchema(pcSettlementBlockersTable);

export type PcRecoveryItem = typeof pcRecoveryItemsTable.$inferSelect;
export type PcRecoveryParty = typeof pcRecoveryPartiesTable.$inferSelect;
export type PcRecoveryDocument = typeof pcRecoveryDocumentsTable.$inferSelect;
export type PcRecoveryStatusHistory = typeof pcRecoveryStatusHistoryTable.$inferSelect;
export type PcRecoveryAmountMarker = typeof pcRecoveryAmountMarkersTable.$inferSelect;
export type PcRecoveryFollowup = typeof pcRecoveryFollowupsTable.$inferSelect;
export type PcRecoveryDependencyLink = typeof pcRecoveryDependencyLinksTable.$inferSelect;
export type PcRecoveryRiskSnapshot = typeof pcRecoveryRiskSnapshotsTable.$inferSelect;
export type PcSettlementBlocker = typeof pcSettlementBlockersTable.$inferSelect;
export type PcSettlementBlockerDriver = typeof pcSettlementBlockerDriversTable.$inferSelect;
export type PcSettlementBlockerAction = typeof pcSettlementBlockerActionsTable.$inferSelect;
export type PcSettlementBlockerSnapshot = typeof pcSettlementBlockerSnapshotsTable.$inferSelect;
