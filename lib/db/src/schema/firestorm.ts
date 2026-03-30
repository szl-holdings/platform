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
