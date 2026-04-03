import { pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const firestormScenariosTable = pgTable("firestorm_scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", { enum: ["network", "application", "social_engineering", "physical", "insider_threat", "supply_chain", "cloud", "iot"] }).notNull(),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  complexity: text("complexity", { enum: ["basic", "intermediate", "advanced", "expert"] }).notNull().default("intermediate"),
  attackVector: text("attack_vector"),
  mitreTechnique: text("mitre_technique"),
  prerequisites: jsonb("prerequisites"),
  expectedDuration: integer("expected_duration"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const firestormAssessmentsTable = pgTable("firestorm_assessments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  assessmentType: text("assessment_type", { enum: ["penetration_test", "vulnerability_scan", "red_team", "blue_team", "purple_team", "tabletop"] }).notNull(),
  status: text("status", { enum: ["draft", "scheduled", "in_progress", "completed", "canceled"] }).notNull().default("draft"),
  scope: text("scope"),
  targetEnvironment: text("target_environment"),
  assessorName: text("assessor_name"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  overallRiskScore: numeric("overall_risk_score", { precision: 5, scale: 2 }),
  executiveSummary: text("executive_summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const firestormSimulationRunsTable = pgTable("firestorm_simulation_runs", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").references(() => firestormAssessmentsTable.id, { onDelete: "cascade" }),
  scenarioId: integer("scenario_id").references(() => firestormScenariosTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  status: text("status", { enum: ["pending", "running", "completed", "failed", "aborted"] }).notNull().default("pending"),
  mode: text("mode", { enum: ["controlled", "full", "automated", "demo"] }).notNull().default("controlled"),
  parameters: jsonb("parameters"),
  results: jsonb("results"),
  durationSeconds: integer("duration_seconds"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const firestormFindingsTable = pgTable("firestorm_findings", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => firestormAssessmentsTable.id, { onDelete: "cascade" }),
  simulationRunId: integer("simulation_run_id").references(() => firestormSimulationRunsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity", { enum: ["info", "low", "medium", "high", "critical"] }).notNull(),
  status: text("status", { enum: ["open", "confirmed", "mitigated", "accepted", "false_positive"] }).notNull().default("open"),
  category: text("category"),
  affectedAsset: text("affected_asset"),
  impact: text("impact"),
  recommendation: text("recommendation"),
  cvssScore: numeric("cvss_score", { precision: 4, scale: 2 }),
  evidence: jsonb("evidence"),
  remediationOwner: text("remediation_owner"),
  dueDate: timestamp("due_date"),
  auditTrail: jsonb("audit_trail").$type<Array<{ action: string; user: string; at: string }>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const firestormRiskScoresTable = pgTable("firestorm_risk_scores", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => firestormAssessmentsTable.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  likelihood: integer("likelihood").notNull(),
  impact: integer("impact").notNull(),
  currentScore: numeric("current_score", { precision: 5, scale: 2 }).notNull(),
  residualScore: numeric("residual_score", { precision: 5, scale: 2 }),
  trend: text("trend", { enum: ["improving", "stable", "degrading"] }).notNull().default("stable"),
  notes: text("notes"),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
});

export const firestormIncidentsTable = pgTable("firestorm_incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  status: text("status", { enum: ["detection", "triage", "investigation", "containment", "remediation", "closed"] }).notNull().default("detection"),
  assignedAnalyst: text("assigned_analyst"),
  affectedAssets: jsonb("affected_assets"),
  relatedFindingIds: jsonb("related_finding_ids"),
  attackTechnique: text("attack_technique"),
  timeline: jsonb("timeline"),
  notes: text("notes"),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const firestormHardeningControlsTable = pgTable("firestorm_hardening_controls", {
  id: serial("id").primaryKey(),
  controlId: text("control_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", { enum: ["mfa_credential", "application_hardening", "config_hardening", "dependency_supply_chain", "vulnerability_assessment"] }).notNull(),
  status: text("status", { enum: ["implemented", "partial", "not_implemented"] }).notNull().default("not_implemented"),
  priority: text("priority", { enum: ["critical", "high", "medium", "low"] }).notNull().default("high"),
  owner: text("owner"),
  linkedAssets: jsonb("linked_assets").$type<string[]>().default([]),
  recommendedAction: text("recommended_action"),
  dueDate: timestamp("due_date"),
  auditTrail: jsonb("audit_trail").$type<Array<{ action: string; user: string; at: string }>>().default([]),
  lastReviewedAt: timestamp("last_reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFirestormHardeningControlSchema = createInsertSchema(firestormHardeningControlsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormHardeningControl = z.infer<typeof insertFirestormHardeningControlSchema>;
export type FirestormHardeningControl = typeof firestormHardeningControlsTable.$inferSelect;

export const firestormComplianceControlsTable = pgTable("firestorm_compliance_controls", {
  id: serial("id").primaryKey(),
  framework: text("framework", { enum: ["nist_csf", "fedramp", "fisma"] }).notNull(),
  category: text("category").notNull(),
  controlId: text("control_id").notNull(),
  controlName: text("control_name").notNull(),
  description: text("description"),
  status: text("status", { enum: ["implemented", "partial", "not_implemented", "not_applicable"] }).notNull().default("not_implemented"),
  evidenceNotes: text("evidence_notes"),
  owner: text("owner"),
  dueDate: timestamp("due_date"),
  auditTrail: jsonb("audit_trail").default([]),
  lastAssessedAt: timestamp("last_assessed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const firestormAlertsTable = pgTable("firestorm_alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  source: text("source").notNull(),
  status: text("status", { enum: ["new", "acknowledged", "investigating", "resolved", "dismissed"] }).notNull().default("new"),
  relatedCve: text("related_cve"),
  relatedIncidentId: integer("related_incident_id"),
  metadata: jsonb("metadata"),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const firestormCampaignsTable = pgTable("firestorm_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  status: text("status", { enum: ["draft", "active", "paused", "completed", "archived"] }).notNull().default("draft"),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  spent: numeric("spent", { precision: 12, scale: 2 }).default("0"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  targetAudience: jsonb("target_audience"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const firestormLeadsTable = pgTable("firestorm_leads", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => firestormCampaignsTable.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  company: text("company"),
  title: text("title"),
  phone: text("phone"),
  source: text("source"),
  score: integer("score").default(0),
  status: text("status", { enum: ["new", "contacted", "engaged", "qualified", "disqualified"] }).notNull().default("new"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const firestormAnalyticsTable = pgTable("firestorm_analytics", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => firestormCampaignsTable.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  spend: numeric("spend", { precision: 10, scale: 2 }).default("0"),
  revenue: numeric("revenue", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const firestormAssetsTable = pgTable("firestorm_assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  assetType: text("asset_type", { enum: ["server", "endpoint", "network_device", "cloud_resource", "application", "database", "api", "iam_identity", "container", "other"] }).notNull(),
  owner: text("owner").notNull(),
  team: text("team"),
  environment: text("environment", { enum: ["production", "staging", "development", "dmz", "internal"] }).notNull().default("production"),
  exposureLevel: text("exposure_level", { enum: ["public", "internal", "restricted", "critical"] }).notNull().default("internal"),
  riskScore: numeric("risk_score", { precision: 4, scale: 1 }).notNull().default("0"),
  criticalFindings: integer("critical_findings").notNull().default(0),
  highFindings: integer("high_findings").notNull().default(0),
  lastScannedAt: timestamp("last_scanned_at"),
  tags: jsonb("tags"),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const firestormWorkflowActionsTable = pgTable("firestorm_workflow_actions", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type", { enum: ["finding", "incident", "asset", "simulation"] }).notNull(),
  entityId: integer("entity_id").notNull(),
  actionType: text("action_type", { enum: ["assign_owner", "escalate", "acknowledge", "remediate", "route_to_response", "create_ticket", "notify"] }).notNull(),
  assignedTo: text("assigned_to"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "failed"] }).notNull().default("pending"),
  notes: text("notes"),
  triggeredBy: text("triggered_by"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFirestormAssetSchema = createInsertSchema(firestormAssetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormAsset = z.infer<typeof insertFirestormAssetSchema>;
export type FirestormAsset = typeof firestormAssetsTable.$inferSelect;

export const insertFirestormWorkflowActionSchema = createInsertSchema(firestormWorkflowActionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormWorkflowAction = z.infer<typeof insertFirestormWorkflowActionSchema>;
export type FirestormWorkflowAction = typeof firestormWorkflowActionsTable.$inferSelect;

export const insertFirestormScenarioSchema = createInsertSchema(firestormScenariosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormScenario = z.infer<typeof insertFirestormScenarioSchema>;
export type FirestormScenario = typeof firestormScenariosTable.$inferSelect;

export const insertFirestormAssessmentSchema = createInsertSchema(firestormAssessmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormAssessment = z.infer<typeof insertFirestormAssessmentSchema>;
export type FirestormAssessment = typeof firestormAssessmentsTable.$inferSelect;

export const insertFirestormSimulationRunSchema = createInsertSchema(firestormSimulationRunsTable).omit({ id: true, createdAt: true });
export type InsertFirestormSimulationRun = z.infer<typeof insertFirestormSimulationRunSchema>;
export type FirestormSimulationRun = typeof firestormSimulationRunsTable.$inferSelect;

export const insertFirestormFindingSchema = createInsertSchema(firestormFindingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormFinding = z.infer<typeof insertFirestormFindingSchema>;
export type FirestormFinding = typeof firestormFindingsTable.$inferSelect;

export const insertFirestormRiskScoreSchema = createInsertSchema(firestormRiskScoresTable).omit({ id: true });
export type InsertFirestormRiskScore = z.infer<typeof insertFirestormRiskScoreSchema>;
export type FirestormRiskScore = typeof firestormRiskScoresTable.$inferSelect;

export const insertFirestormIncidentSchema = createInsertSchema(firestormIncidentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormIncident = z.infer<typeof insertFirestormIncidentSchema>;
export type FirestormIncident = typeof firestormIncidentsTable.$inferSelect;

export const insertFirestormComplianceControlSchema = createInsertSchema(firestormComplianceControlsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormComplianceControl = z.infer<typeof insertFirestormComplianceControlSchema>;
export type FirestormComplianceControl = typeof firestormComplianceControlsTable.$inferSelect;

export const insertFirestormAlertSchema = createInsertSchema(firestormAlertsTable).omit({ id: true, createdAt: true });
export type InsertFirestormAlert = z.infer<typeof insertFirestormAlertSchema>;
export type FirestormAlert = typeof firestormAlertsTable.$inferSelect;

export const firestormCasesTable = pgTable("firestorm_cases", {
  id: serial("id").primaryKey(),
  caseNumber: text("case_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["open", "in_progress", "pending_review", "resolved", "closed"] }).notNull().default("open"),
  priority: text("priority", { enum: ["p1_critical", "p2_high", "p3_medium", "p4_low"] }).notNull().default("p3_medium"),
  assignedAnalyst: text("assigned_analyst"),
  relatedIncidentIds: jsonb("related_incident_ids").$type<number[]>().default([]),
  relatedFindingIds: jsonb("related_finding_ids").$type<number[]>().default([]),
  slaTriage: integer("sla_triage_minutes").notNull().default(60),
  slaResolve: integer("sla_resolve_minutes").notNull().default(1440),
  triagedAt: timestamp("triaged_at"),
  resolvedAt: timestamp("resolved_at"),
  notes: jsonb("notes").$type<Array<{ content: string; author: string; at: string }>>().default([]),
  evidence: jsonb("evidence").$type<Array<{ name: string; type: string; url?: string; addedAt: string }>>().default([]),
  auditTrail: jsonb("audit_trail").$type<Array<{ action: string; user: string; at: string }>>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFirestormCaseSchema = createInsertSchema(firestormCasesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormCase = z.infer<typeof insertFirestormCaseSchema>;
export type FirestormCase = typeof firestormCasesTable.$inferSelect;

export const firestormMitreDetectionsTable = pgTable("firestorm_mitre_detections", {
  id: serial("id").primaryKey(),
  techniqueId: text("technique_id").notNull(),
  techniqueName: text("technique_name").notNull(),
  tactic: text("tactic").notNull(),
  detectionCount: integer("detection_count").notNull().default(0),
  incidentCount: integer("incident_count").notNull().default(0),
  lastDetectedAt: timestamp("last_detected_at"),
  coverageStatus: text("coverage_status", { enum: ["detected", "partial", "not_covered"] }).notNull().default("not_covered"),
  relatedIncidentIds: jsonb("related_incident_ids").$type<number[]>().default([]),
  relatedFindingIds: jsonb("related_finding_ids").$type<number[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFirestormMitreDetectionSchema = createInsertSchema(firestormMitreDetectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormMitreDetection = z.infer<typeof insertFirestormMitreDetectionSchema>;
export type FirestormMitreDetection = typeof firestormMitreDetectionsTable.$inferSelect;

export const firestormTradecraftDecisionsTable = pgTable("firestorm_tradecraft_decisions", {
  id: serial("id").primaryKey(),
  objectId: text("object_id").notNull().unique(),
  tenantId: text("tenant_id").notNull().default("default"),
  caseId: text("case_id"),
  incidentId: text("incident_id"),
  signalId: text("signal_id"),
  decisionType: text("decision_type", {
    enum: ["TriageDecision", "IncidentAssessment", "RiskDecision", "EscalationDecision", "ApprovalRecommendation", "ResponsePlan", "ExecutiveBrief", "ControlGapFinding"],
  }).notNull(),
  policyClass: text("policy_class").notNull(),
  schemaVersion: text("schema_version").notNull().default("2.0.0"),
  summary: text("summary").notNull(),
  issueStatement: text("issue_statement").notNull(),
  evidenceRefs: jsonb("evidence_refs").$type<unknown[]>().default([]),
  evidenceQuality: text("evidence_quality", { enum: ["high", "medium", "low", "insufficient"] }).notNull().default("low"),
  assumptions: jsonb("assumptions").$type<unknown[]>().default([]),
  alternatives: jsonb("alternatives").$type<unknown[]>().default([]),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull().default("0"),
  confidenceLabel: text("confidence_label", { enum: ["high", "moderate", "low", "insufficient"] }).notNull().default("low"),
  confidenceStatement: text("confidence_statement"),
  gapsAndUnknowns: jsonb("gaps_and_unknowns").$type<string[]>().default([]),
  impactLevel: text("impact_level", { enum: ["critical", "high", "medium", "low", "negligible"] }).notNull().default("medium"),
  urgency: text("urgency", { enum: ["immediate", "urgent", "standard", "deferred"] }).notNull().default("standard"),
  recommendedAction: text("recommended_action").notNull(),
  ownerSuggestion: text("owner_suggestion"),
  approvalRequired: boolean("approval_required").notNull().default(false),
  approvalReason: text("approval_reason"),
  humanReviewRequired: boolean("human_review_required").notNull().default(true),
  humanReviewReason: text("human_review_reason"),
  modelRoute: text("model_route").notNull().default("unknown"),
  rawOutput: text("raw_output"),
  decisionPayload: jsonb("decision_payload").$type<Record<string, unknown>>().default({}),
  status: text("status", { enum: ["active", "superseded", "archived"] }).notNull().default("active"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectedBy: text("rejected_by"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFirestormTradecraftDecisionSchema = createInsertSchema(firestormTradecraftDecisionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormTradecraftDecision = z.infer<typeof insertFirestormTradecraftDecisionSchema>;
export type FirestormTradecraftDecision = typeof firestormTradecraftDecisionsTable.$inferSelect;

export const firestormCaseMemoryTable = pgTable("firestorm_case_memory", {
  id: serial("id").primaryKey(),
  caseId: text("case_id").notNull().unique(),
  incidentId: text("incident_id"),
  phase: text("phase", { enum: ["detection", "triage", "investigation", "containment", "eradication", "recovery", "closed"] }).notNull().default("detection"),
  phaseHistory: jsonb("phase_history").$type<Array<{ phase: string; enteredAt: string; exitedAt: string | null }>>().default([]),
  decisions: jsonb("decisions").$type<unknown[]>().default([]),
  evidenceSnapshots: jsonb("evidence_snapshots").$type<unknown[]>().default([]),
  analystNotes: jsonb("analyst_notes").$type<Array<{ noteId: string; content: string; author: string; noteType: string; createdAt: string }>>().default([]),
  changeLog: jsonb("change_log").$type<unknown[]>().default([]),
  summary: jsonb("summary").$type<Record<string, unknown>>().default({}),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  lastUpdatedAt: timestamp("last_updated_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFirestormCaseMemorySchema = createInsertSchema(firestormCaseMemoryTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormCaseMemory = z.infer<typeof insertFirestormCaseMemorySchema>;
export type FirestormCaseMemory = typeof firestormCaseMemoryTable.$inferSelect;

export const firestormAnalystNotebookTable = pgTable("firestorm_analyst_notebook", {
  id: serial("id").primaryKey(),
  noteId: text("note_id").notNull().unique(),
  caseId: text("case_id"),
  incidentId: text("incident_id"),
  decisionObjectId: text("decision_object_id"),
  content: text("content").notNull(),
  author: text("author").notNull(),
  noteType: text("note_type", { enum: ["observation", "hypothesis", "assumption", "gap", "dissent", "general", "key_judgment", "evidence_note"] }).notNull().default("general"),
  tags: jsonb("tags").$type<string[]>().default([]),
  noteReferences: jsonb("note_references").$type<string[]>().default([]),
  isKey: boolean("is_key").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFirestormAnalystNotebookSchema = createInsertSchema(firestormAnalystNotebookTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFirestormAnalystNote = z.infer<typeof insertFirestormAnalystNotebookSchema>;
export type FirestormAnalystNote = typeof firestormAnalystNotebookTable.$inferSelect;

export const firestormTradecraftValidationAuditTable = pgTable("firestorm_tradecraft_validation_audit", {
  id: serial("id").primaryKey(),
  auditId: text("audit_id").notNull().unique(),
  decisionType: text("decision_type").notNull(),
  tenantId: text("tenant_id").notNull().default("default"),
  caseId: text("case_id"),
  incidentId: text("incident_id"),
  validationErrors: jsonb("validation_errors").$type<string[]>().notNull().default([]),
  rawOutput: text("raw_output"),
  rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>().notNull().default({}),
  modelRoute: text("model_route").notNull().default("unknown"),
  errorClass: text("error_class").notNull().default("schema_validation"),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFirestormValidationAuditSchema = createInsertSchema(firestormTradecraftValidationAuditTable).omit({ id: true, createdAt: true });
export type InsertFirestormValidationAudit = z.infer<typeof insertFirestormValidationAuditSchema>;
export type FirestormValidationAudit = typeof firestormTradecraftValidationAuditTable.$inferSelect;

export const firestormToolAuditLogTable = pgTable("firestorm_tool_audit_log", {
  id: serial("id").primaryKey(),
  logId: text("log_id").notNull().unique(),
  toolName: text("tool_name").notNull(),
  calledBy: text("called_by").notNull().default("alloy"),
  tenantId: text("tenant_id").notNull().default("default"),
  executionMode: text("execution_mode", {
    enum: ["observe_only", "propose_only", "approval_required", "approved_execute"],
  }).notNull().default("propose_only"),
  policyChecked: boolean("policy_checked").notNull().default(true),
  approvalRequired: boolean("approval_required").notNull().default(false),
  approvalStatus: text("approval_status", {
    enum: ["approved", "pending", "rejected", "not_required"],
  }).notNull().default("not_required"),
  result: text("result", {
    enum: ["success", "failure", "blocked"],
  }).notNull(),
  arguments: jsonb("arguments").$type<Record<string, unknown>>().notNull().default({}),
  output: jsonb("output").default(null),
  error: text("error"),
  relatedDecisionId: text("related_decision_id"),
  relatedCaseId: text("related_case_id"),
  relatedIncidentId: text("related_incident_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFirestormToolAuditLogSchema = createInsertSchema(firestormToolAuditLogTable).omit({ id: true, createdAt: true });
export type InsertFirestormToolAuditLog = z.infer<typeof insertFirestormToolAuditLogSchema>;
export type FirestormToolAuditLog = typeof firestormToolAuditLogTable.$inferSelect;
