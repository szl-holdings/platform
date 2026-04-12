import { pgTable, serial, integer, text, timestamp, boolean, jsonb, real, index } from "drizzle-orm/pg-core";
import { pcMattersTable } from "./prism_counsel";

export const pcCitationAuditReportsTable = pgTable("pc_citation_audit_reports", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  matterId: integer("matter_id").references(() => pcMattersTable.id, { onDelete: "set null" }),
  reviewItemId: integer("review_item_id"),

  auditId: text("audit_id").notNull().unique(),
  documentId: text("document_id").notNull(),
  documentTitle: text("document_title").notNull(),
  documentType: text("document_type"),

  totalCitations: integer("total_citations").notNull().default(0),
  verifiedCount: integer("verified_count").notNull().default(0),
  unverifiedCount: integer("unverified_count").notNull().default(0),
  suspiciousCount: integer("suspicious_count").notNull().default(0),
  averageConfidence: real("average_confidence").notNull().default(0),
  overallStatus: text("overall_status", { enum: ["clear", "needs_review", "blocked"] }).notNull(),

  citations: jsonb("citations").notNull().default([]),
  blockingCitations: jsonb("blocking_citations").notNull().default([]),
  ragVerificationNotes: jsonb("rag_verification_notes").notNull().default({}),

  sealedAt: timestamp("sealed_at"),
  sealedBy: integer("sealed_by"),
  sealedNote: text("sealed_note"),
  proofChainId: integer("proof_chain_id"),

  verificationDurationMs: integer("verification_duration_ms"),
  verifiedAt: timestamp("verified_at").notNull().defaultNow(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("pc_car_org_idx").on(table.orgId),
  index("pc_car_matter_idx").on(table.matterId),
  index("pc_car_review_item_idx").on(table.reviewItemId),
  index("pc_car_audit_id_idx").on(table.auditId),
  index("pc_car_status_idx").on(table.overallStatus),
]);

export type PcCitationAuditReport = typeof pcCitationAuditReportsTable.$inferSelect;

export const pcManagedReviewItemsTable = pgTable("pc_managed_review_items", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),

  reviewWorkType: text("review_work_type", { enum: [
    "draft_review",
    "chronology_review",
    "evidence_review",
    "contradiction_review",
    "low_confidence_extraction_review",
    "safe_to_send_review",
    "safe_to_export_review",
    "recovery_lien_review",
    "approval_preparation_review",
  ] }).notNull(),

  lifecycleState: text("lifecycle_state", { enum: [
    "new",
    "triaged",
    "assigned",
    "in_review",
    "needs_evidence",
    "needs_attorney_review",
    "needs_partner_review",
    "approved",
    "rejected",
    "revised",
    "blocked",
    "exported",
    "closed",
  ] }).notNull().default("new"),

  title: text("title").notNull(),
  description: text("description"),

  sourceEntityType: text("source_entity_type"),
  sourceEntityId: integer("source_entity_id"),
  sourceLineage: text("source_lineage"),
  isGenerated: boolean("is_generated").notNull().default(false),

  confidence: real("confidence"),
  confidenceFlags: jsonb("confidence_flags"),

  privilegeSensitive: boolean("privilege_sensitive").notNull().default(false),
  privilegeType: text("privilege_type"),
  exportSafe: boolean("export_safe").notNull().default(false),
  sendSafe: boolean("send_safe").notNull().default(false),

  whatThisIs: text("what_this_is"),
  whyItsHere: text("why_its_here"),
  whatSupportsIt: jsonb("what_supports_it"),
  whatsMissing: jsonb("whats_missing"),
  whatRiskExists: text("what_risk_exists"),
  whatActionClearsIt: text("what_action_clears_it"),
  whoIsWaiting: jsonb("who_is_waiting"),
  whatItUnblocks: jsonb("what_it_unblocks"),

  priorityScore: real("priority_score").notNull().default(0),
  deadlineRiskScore: real("deadline_risk_score").notNull().default(0),
  settlementFrictionScore: real("settlement_friction_score").notNull().default(0),
  insurerPressureScore: real("insurer_pressure_score").notNull().default(0),
  contradictionSeverityScore: real("contradiction_severity_score").notNull().default(0),
  lowConfidenceScore: real("low_confidence_score").notNull().default(0),
  exportSendDependencyScore: real("export_send_dependency_score").notNull().default(0),
  workUnblockedScore: real("work_unblocked_score").notNull().default(0),
  partnerUrgencyScore: real("partner_urgency_score").notNull().default(0),
  clientFacingImpactScore: real("client_facing_impact_score").notNull().default(0),
  recoveryLienDependencyScore: real("recovery_lien_dependency_score").notNull().default(0),

  assignedTo: integer("assigned_to"),
  assignedAt: timestamp("assigned_at"),
  assignedBy: integer("assigned_by"),

  dueBy: timestamp("due_by"),
  slaHours: integer("sla_hours").notNull().default(24),
  slaBreachedAt: timestamp("sla_breached_at"),

  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectedBy: integer("rejected_by"),
  rejectedAt: timestamp("rejected_at"),

  proofChainId: integer("proof_chain_id"),
  auditPacketRef: text("audit_packet_ref"),

  blockedReason: text("blocked_reason"),
  escalatedTo: text("escalated_to"),
  escalatedAt: timestamp("escalated_at"),

  exportPacketRef: text("export_packet_ref"),
  exportedAt: timestamp("exported_at"),

  metadata: jsonb("metadata"),
  createdBy: integer("created_by"),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("pc_mri_org_idx").on(table.orgId),
  index("pc_mri_matter_idx").on(table.matterId),
  index("pc_mri_state_idx").on(table.lifecycleState),
  index("pc_mri_worktype_idx").on(table.reviewWorkType),
  index("pc_mri_priority_idx").on(table.priorityScore),
  index("pc_mri_assigned_idx").on(table.assignedTo),
]);

export const pcManagedReviewAssignmentsTable = pgTable("pc_managed_review_assignments", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  reviewItemId: integer("review_item_id").notNull().references(() => pcManagedReviewItemsTable.id, { onDelete: "cascade" }),
  assignedTo: integer("assigned_to").notNull(),
  assignedBy: integer("assigned_by"),
  role: text("role", { enum: ["primary", "attorney", "partner", "secondary"] }).notNull().default("primary"),
  status: text("status", { enum: ["active", "completed", "reassigned"] }).notNull().default("active"),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pc_mra_item_idx").on(table.reviewItemId),
  index("pc_mra_assigned_idx").on(table.assignedTo),
]);

export const pcManagedReviewNotesTable = pgTable("pc_managed_review_notes", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  reviewItemId: integer("review_item_id").notNull().references(() => pcManagedReviewItemsTable.id, { onDelete: "cascade" }),
  noteType: text("note_type", { enum: ["general", "missing_support_request", "escalation", "rejection_reason", "revision_request", "attorney_note", "partner_note"] }).notNull().default("general"),
  content: text("content").notNull(),
  authorId: integer("author_id"),
  authorRole: text("author_role"),
  isPrivileged: boolean("is_privileged").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pc_mrn_item_idx").on(table.reviewItemId),
]);

export const pcManagedReviewSlasTable = pgTable("pc_managed_review_slas", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  reviewWorkType: text("review_work_type").notNull(),
  lifecycleState: text("lifecycle_state").notNull(),
  slaHours: integer("sla_hours").notNull(),
  warningHours: integer("warning_hours").notNull(),
  escalationHours: integer("escalation_hours").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("pc_mrs_org_idx").on(table.orgId),
  index("pc_mrs_type_idx").on(table.reviewWorkType),
]);

export const pcManagedReviewMetricsTable = pgTable("pc_managed_review_metrics", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  reviewWorkType: text("review_work_type"),
  assignedTo: integer("assigned_to"),

  totalItems: integer("total_items").notNull().default(0),
  approvedItems: integer("approved_items").notNull().default(0),
  rejectedItems: integer("rejected_items").notNull().default(0),
  revisedItems: integer("revised_items").notNull().default(0),
  blockedItems: integer("blocked_items").notNull().default(0),
  exportedItems: integer("exported_items").notNull().default(0),
  closedItems: integer("closed_items").notNull().default(0),

  avgReviewAgeHours: real("avg_review_age_hours"),
  throughputPerDay: real("throughput_per_day"),
  backlogSize: integer("backlog_size").notNull().default(0),
  slaBreachCount: integer("sla_breach_count").notNull().default(0),

  contradictionResolutionHours: real("contradiction_resolution_hours"),
  lowConfidenceResolutionHours: real("low_confidence_resolution_hours"),
  exportReadyTurnaroundHours: real("export_ready_turnaround_hours"),
  approvalWaitTimeHours: real("approval_wait_time_hours"),
  reviewToMovementCorrelation: real("review_to_movement_correlation"),

  computedAt: timestamp("computed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pc_mrmet_org_idx").on(table.orgId),
  index("pc_mrmet_period_idx").on(table.periodStart),
  index("pc_mrmet_type_idx").on(table.reviewWorkType),
]);

export const pcReviewAuditEventsTable = pgTable("pc_review_audit_events", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  matterId: integer("matter_id"),
  reviewItemId: integer("review_item_id"),
  actorId: integer("actor_id"),
  action: text("action").notNull(),
  fromState: text("from_state"),
  toState: text("to_state"),
  details: jsonb("details"),
  proofChainPreserved: boolean("proof_chain_preserved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pc_rae_org_idx").on(table.orgId),
  index("pc_rae_item_idx").on(table.reviewItemId),
  index("pc_rae_matter_idx").on(table.matterId),
]);

export type PcManagedReviewItem = typeof pcManagedReviewItemsTable.$inferSelect;
export type PcManagedReviewAssignment = typeof pcManagedReviewAssignmentsTable.$inferSelect;
export type PcManagedReviewNote = typeof pcManagedReviewNotesTable.$inferSelect;
export type PcManagedReviewSla = typeof pcManagedReviewSlasTable.$inferSelect;
export type PcManagedReviewMetrics = typeof pcManagedReviewMetricsTable.$inferSelect;
export type PcReviewAuditEvent = typeof pcReviewAuditEventsTable.$inferSelect;
