import { Router, type IRouter } from "express";
import {
  db,
  firestormScenariosTable,
  firestormAssessmentsTable,
  firestormSimulationRunsTable,
  firestormFindingsTable,
  firestormRiskScoresTable,
  firestormIncidentsTable,
  firestormComplianceControlsTable,
  firestormAlertsTable,
  insertFirestormScenarioSchema,
  insertFirestormAssessmentSchema,
  insertFirestormSimulationRunSchema,
  insertFirestormFindingSchema,
  insertFirestormRiskScoreSchema,
  insertFirestormIncidentSchema,
  insertFirestormComplianceControlSchema,
  insertFirestormAlertSchema,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendNoContent, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/firestorm/scenarios", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const scenarios = await db.select().from(firestormScenariosTable).orderBy(desc(firestormScenariosTable.createdAt));
    sendSuccess(res, scenarios);
  } catch (err) {
    handleRouteError(res, err, "Failed to list scenarios");
  }
});

router.get("/firestorm/scenarios/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [scenario] = await db.select().from(firestormScenariosTable).where(eq(firestormScenariosTable.id, id));
    if (!scenario) { sendNotFound(res, "Scenario"); return; }
    sendSuccess(res, scenario);
  } catch (err) {
    handleRouteError(res, err, "Failed to get scenario");
  }
});

router.post("/firestorm/scenarios", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormScenarioSchema.parse(req.body);
    const [scenario] = await db.insert(firestormScenariosTable).values(data).returning();
    sendCreated(res, scenario);
  } catch (err) {
    handleRouteError(res, err, "Failed to create scenario");
  }
});

router.put("/firestorm/scenarios/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormScenarioSchema.partial().parse(req.body);
    const [scenario] = await db.update(firestormScenariosTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormScenariosTable.id, id)).returning();
    if (!scenario) { sendNotFound(res, "Scenario"); return; }
    sendSuccess(res, scenario);
  } catch (err) {
    handleRouteError(res, err, "Failed to update scenario");
  }
});

router.delete("/firestorm/scenarios/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [scenario] = await db.delete(firestormScenariosTable).where(eq(firestormScenariosTable.id, id)).returning();
    if (!scenario) { sendNotFound(res, "Scenario"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete scenario");
  }
});

router.get("/firestorm/assessments", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const assessments = await db.select().from(firestormAssessmentsTable).orderBy(desc(firestormAssessmentsTable.createdAt));
    sendSuccess(res, assessments);
  } catch (err) {
    handleRouteError(res, err, "Failed to list assessments");
  }
});

router.get("/firestorm/assessments/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [assessment] = await db.select().from(firestormAssessmentsTable).where(eq(firestormAssessmentsTable.id, id));
    if (!assessment) { sendNotFound(res, "Assessment"); return; }
    sendSuccess(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Failed to get assessment");
  }
});

router.post("/firestorm/assessments", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormAssessmentSchema.parse(req.body);
    const [assessment] = await db.insert(firestormAssessmentsTable).values(data).returning();
    sendCreated(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Failed to create assessment");
  }
});

router.put("/firestorm/assessments/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormAssessmentSchema.partial().parse(req.body);
    const [assessment] = await db.update(firestormAssessmentsTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormAssessmentsTable.id, id)).returning();
    if (!assessment) { sendNotFound(res, "Assessment"); return; }
    sendSuccess(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Failed to update assessment");
  }
});

router.delete("/firestorm/assessments/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [assessment] = await db.delete(firestormAssessmentsTable).where(eq(firestormAssessmentsTable.id, id)).returning();
    if (!assessment) { sendNotFound(res, "Assessment"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete assessment");
  }
});

router.get("/firestorm/simulations", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const runs = await db.select().from(firestormSimulationRunsTable).orderBy(desc(firestormSimulationRunsTable.createdAt));
    sendSuccess(res, runs);
  } catch (err) {
    handleRouteError(res, err, "Failed to list simulation runs");
  }
});

router.post("/firestorm/simulations", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormSimulationRunSchema.parse(req.body);
    const [run] = await db.insert(firestormSimulationRunsTable).values({
      ...data,
      status: "running",
      mode: "controlled",
      startedAt: new Date(),
    }).returning();

    sendCreated(res, run);
  } catch (err) {
    handleRouteError(res, err, "Failed to create simulation run");
  }
});

router.get("/firestorm/simulations/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [run] = await db.select().from(firestormSimulationRunsTable).where(eq(firestormSimulationRunsTable.id, id));
    if (!run) { sendNotFound(res, "Simulation Run"); return; }
    sendSuccess(res, run);
  } catch (err) {
    handleRouteError(res, err, "Failed to get simulation run");
  }
});

router.get("/firestorm/findings", authMiddleware({ required: false }), async (req, res) => {
  try {
    const assessmentId = req.query.assessmentId ? parseInt(req.query.assessmentId as string, 10) : undefined;
    const query = assessmentId
      ? db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.assessmentId, assessmentId)).orderBy(desc(firestormFindingsTable.createdAt))
      : db.select().from(firestormFindingsTable).orderBy(desc(firestormFindingsTable.createdAt));
    const findings = await query;
    sendSuccess(res, findings);
  } catch (err) {
    handleRouteError(res, err, "Failed to list findings");
  }
});

router.get("/firestorm/findings/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [finding] = await db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.id, id));
    if (!finding) { sendNotFound(res, "Finding"); return; }
    sendSuccess(res, finding);
  } catch (err) {
    handleRouteError(res, err, "Failed to get finding");
  }
});

router.post("/firestorm/findings", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormFindingSchema.parse(req.body);
    const [finding] = await db.insert(firestormFindingsTable).values(data).returning();
    sendCreated(res, finding);
  } catch (err) {
    handleRouteError(res, err, "Failed to create finding");
  }
});

router.put("/firestorm/findings/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormFindingSchema.partial().parse(req.body);
    const [finding] = await db.update(firestormFindingsTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormFindingsTable.id, id)).returning();
    if (!finding) { sendNotFound(res, "Finding"); return; }
    sendSuccess(res, finding);
  } catch (err) {
    handleRouteError(res, err, "Failed to update finding");
  }
});

router.get("/firestorm/risk-scores", authMiddleware({ required: false }), async (req, res) => {
  try {
    const assessmentId = req.query.assessmentId ? parseInt(req.query.assessmentId as string, 10) : undefined;
    const query = assessmentId
      ? db.select().from(firestormRiskScoresTable).where(eq(firestormRiskScoresTable.assessmentId, assessmentId)).orderBy(desc(firestormRiskScoresTable.calculatedAt))
      : db.select().from(firestormRiskScoresTable).orderBy(desc(firestormRiskScoresTable.calculatedAt));
    const scores = await query;
    sendSuccess(res, scores);
  } catch (err) {
    handleRouteError(res, err, "Failed to list risk scores");
  }
});

router.post("/firestorm/risk-scores", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormRiskScoreSchema.parse(req.body);
    const [score] = await db.insert(firestormRiskScoresTable).values(data).returning();
    sendCreated(res, score);
  } catch (err) {
    handleRouteError(res, err, "Failed to create risk score");
  }
});

router.get("/firestorm/reports/:assessmentId", authMiddleware({ required: false }), async (req, res) => {
  try {
    const assessmentId = parseIdParam(req.params.assessmentId);
    const [assessment] = await db.select().from(firestormAssessmentsTable).where(eq(firestormAssessmentsTable.id, assessmentId));
    if (!assessment) { sendNotFound(res, "Assessment"); return; }

    const findings = await db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.assessmentId, assessmentId));
    const riskScores = await db.select().from(firestormRiskScoresTable).where(eq(firestormRiskScoresTable.assessmentId, assessmentId));
    const simulations = await db.select().from(firestormSimulationRunsTable).where(eq(firestormSimulationRunsTable.assessmentId, assessmentId));

    const criticalCount = findings.filter(f => f.severity === "critical").length;
    const highCount = findings.filter(f => f.severity === "high").length;
    const mediumCount = findings.filter(f => f.severity === "medium").length;
    const lowCount = findings.filter(f => f.severity === "low").length;

    sendSuccess(res, {
      assessment,
      summary: {
        totalFindings: findings.length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        simulationsRun: simulations.length,
        riskCategories: riskScores.length,
      },
      findings,
      riskScores,
      simulations,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate report");
  }
});

router.get("/firestorm/incidents", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const incidents = await db.select().from(firestormIncidentsTable).orderBy(desc(firestormIncidentsTable.createdAt));
    sendSuccess(res, incidents);
  } catch (err) {
    handleRouteError(res, err, "Failed to list incidents");
  }
});

router.get("/firestorm/incidents/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [incident] = await db.select().from(firestormIncidentsTable).where(eq(firestormIncidentsTable.id, id));
    if (!incident) { sendNotFound(res, "Incident"); return; }
    sendSuccess(res, incident);
  } catch (err) {
    handleRouteError(res, err, "Failed to get incident");
  }
});

router.post("/firestorm/incidents", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormIncidentSchema.parse(req.body);
    const [incident] = await db.insert(firestormIncidentsTable).values(data).returning();
    sendCreated(res, incident);
  } catch (err) {
    handleRouteError(res, err, "Failed to create incident");
  }
});

router.put("/firestorm/incidents/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormIncidentSchema.partial().parse(req.body);
    const [incident] = await db.update(firestormIncidentsTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormIncidentsTable.id, id)).returning();
    if (!incident) { sendNotFound(res, "Incident"); return; }
    sendSuccess(res, incident);
  } catch (err) {
    handleRouteError(res, err, "Failed to update incident");
  }
});

router.delete("/firestorm/incidents/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [incident] = await db.delete(firestormIncidentsTable).where(eq(firestormIncidentsTable.id, id)).returning();
    if (!incident) { sendNotFound(res, "Incident"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete incident");
  }
});

router.get("/firestorm/compliance", authMiddleware({ required: false }), async (req, res) => {
  try {
    const framework = req.query.framework as string | undefined;
    const query = framework
      ? db.select().from(firestormComplianceControlsTable).where(eq(firestormComplianceControlsTable.framework, framework as any)).orderBy(firestormComplianceControlsTable.category, firestormComplianceControlsTable.controlId)
      : db.select().from(firestormComplianceControlsTable).orderBy(firestormComplianceControlsTable.framework, firestormComplianceControlsTable.category, firestormComplianceControlsTable.controlId);
    const controls = await query;
    sendSuccess(res, controls);
  } catch (err) {
    handleRouteError(res, err, "Failed to list compliance controls");
  }
});

router.post("/firestorm/compliance", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormComplianceControlSchema.parse(req.body);
    const [control] = await db.insert(firestormComplianceControlsTable).values(data).returning();
    sendCreated(res, control);
  } catch (err) {
    handleRouteError(res, err, "Failed to create compliance control");
  }
});

router.put("/firestorm/compliance/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormComplianceControlSchema.partial().parse(req.body);
    const [control] = await db.update(firestormComplianceControlsTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormComplianceControlsTable.id, id)).returning();
    if (!control) { sendNotFound(res, "Compliance Control"); return; }
    sendSuccess(res, control);
  } catch (err) {
    handleRouteError(res, err, "Failed to update compliance control");
  }
});

router.post("/firestorm/compliance/seed", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const existing = await db.select().from(firestormComplianceControlsTable).limit(1);
    if (existing.length > 0) {
      sendSuccess(res, { message: "Controls already seeded" });
      return;
    }

    const nistControls = [
      { framework: "nist_csf" as const, category: "Identify", controlId: "ID.AM-1", controlName: "Asset Management", description: "Physical devices and systems are inventoried", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Identify", controlId: "ID.AM-2", controlName: "Software Inventory", description: "Software platforms and applications are inventoried", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Identify", controlId: "ID.RA-1", controlName: "Risk Assessment", description: "Asset vulnerabilities are identified and documented", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Identify", controlId: "ID.GV-1", controlName: "Governance Policy", description: "Organizational cybersecurity policy is established", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Protect", controlId: "PR.AC-1", controlName: "Access Control", description: "Identities and credentials are managed", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Protect", controlId: "PR.AT-1", controlName: "Security Training", description: "Users are informed and trained", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Protect", controlId: "PR.DS-1", controlName: "Data Security", description: "Data-at-rest is protected", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Protect", controlId: "PR.IP-1", controlName: "Configuration Management", description: "Baseline configs are created and maintained", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Detect", controlId: "DE.AE-1", controlName: "Anomaly Detection", description: "A baseline of network operations is established", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Detect", controlId: "DE.CM-1", controlName: "Continuous Monitoring", description: "The network is monitored for cybersecurity events", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Detect", controlId: "DE.DP-1", controlName: "Detection Processes", description: "Roles and responsibilities for detection are defined", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Respond", controlId: "RS.RP-1", controlName: "Response Planning", description: "Response plan is executed during or after an event", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Respond", controlId: "RS.CO-1", controlName: "Communications", description: "Personnel know their roles during an event", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Respond", controlId: "RS.AN-1", controlName: "Analysis", description: "Notifications from detection systems are investigated", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Recover", controlId: "RC.RP-1", controlName: "Recovery Planning", description: "Recovery plan is executed during or after an event", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Recover", controlId: "RC.IM-1", controlName: "Improvements", description: "Recovery plans incorporate lessons learned", status: "not_implemented" as const },
      { framework: "nist_csf" as const, category: "Recover", controlId: "RC.CO-1", controlName: "Recovery Communications", description: "Public relations and reputation are managed", status: "not_implemented" as const },
    ];

    await db.insert(firestormComplianceControlsTable).values(nistControls);
    sendCreated(res, { message: "NIST CSF controls seeded", count: nistControls.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to seed compliance controls");
  }
});

router.get("/firestorm/alerts", authMiddleware({ required: false }), async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const query = status
      ? db.select().from(firestormAlertsTable).where(eq(firestormAlertsTable.status, status as any)).orderBy(desc(firestormAlertsTable.createdAt))
      : db.select().from(firestormAlertsTable).orderBy(desc(firestormAlertsTable.createdAt));
    const alerts = await query;
    sendSuccess(res, alerts);
  } catch (err) {
    handleRouteError(res, err, "Failed to list alerts");
  }
});

router.post("/firestorm/alerts", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormAlertSchema.parse(req.body);
    const [alert] = await db.insert(firestormAlertsTable).values(data).returning();
    sendCreated(res, alert);
  } catch (err) {
    handleRouteError(res, err, "Failed to create alert");
  }
});

router.put("/firestorm/alerts/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormAlertSchema.partial().parse(req.body);
    const updates: any = { ...data };
    if (data.status === "acknowledged") updates.acknowledgedAt = new Date();
    if (data.status === "resolved" || data.status === "dismissed") updates.resolvedAt = new Date();
    const [alert] = await db.update(firestormAlertsTable).set(updates).where(eq(firestormAlertsTable.id, id)).returning();
    if (!alert) { sendNotFound(res, "Alert"); return; }
    sendSuccess(res, alert);
  } catch (err) {
    handleRouteError(res, err, "Failed to update alert");
  }
});

router.get("/firestorm/soc-dashboard", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const incidents = await db.select().from(firestormIncidentsTable);
    const alerts = await db.select().from(firestormAlertsTable);
    const findings = await db.select().from(firestormFindingsTable);

    const activeIncidents = incidents.filter(i => i.status !== "closed");
    const openAlerts = alerts.filter(a => a.status === "new" || a.status === "acknowledged" || a.status === "investigating");

    const alertsBySeverity = {
      critical: openAlerts.filter(a => a.severity === "critical").length,
      high: openAlerts.filter(a => a.severity === "high").length,
      medium: openAlerts.filter(a => a.severity === "medium").length,
      low: openAlerts.filter(a => a.severity === "low").length,
    };

    const closedIncidents = incidents.filter(i => i.status === "closed" && i.resolvedAt && i.detectedAt);
    const mttd = closedIncidents.length > 0
      ? closedIncidents.reduce((sum, i) => {
          const detected = new Date(i.detectedAt).getTime();
          const created = new Date(i.createdAt).getTime();
          return sum + Math.abs(detected - created);
        }, 0) / closedIncidents.length / 60000
      : 0;

    const mttr = closedIncidents.length > 0
      ? closedIncidents.reduce((sum, i) => {
          const detected = new Date(i.detectedAt).getTime();
          const resolved = new Date(i.resolvedAt!).getTime();
          return sum + (resolved - detected);
        }, 0) / closedIncidents.length / 60000
      : 0;

    const analystWorkload: Record<string, number> = {};
    activeIncidents.forEach(i => {
      const analyst = i.assignedAnalyst || "Unassigned";
      analystWorkload[analyst] = (analystWorkload[analyst] || 0) + 1;
    });

    const recentActivity = [
      ...incidents.slice(0, 5).map(i => ({ type: "incident" as const, title: i.title, severity: i.severity, status: i.status, timestamp: i.createdAt })),
      ...alerts.slice(0, 5).map(a => ({ type: "alert" as const, title: a.title, severity: a.severity, status: a.status, timestamp: a.createdAt })),
      ...findings.slice(0, 5).map(f => ({ type: "finding" as const, title: f.title, severity: f.severity, status: f.status, timestamp: f.createdAt })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    sendSuccess(res, {
      activeIncidents: activeIncidents.length,
      totalIncidents: incidents.length,
      openAlerts: openAlerts.length,
      totalAlerts: alerts.length,
      alertsBySeverity,
      mttd: Math.round(mttd),
      mttr: Math.round(mttr),
      analystWorkload,
      recentActivity,
      openFindings: findings.filter(f => f.status === "open").length,
      criticalFindings: findings.filter(f => f.severity === "critical" && f.status === "open").length,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch SOC dashboard");
  }
});

router.get("/firestorm/cves", authMiddleware({ required: false }), async (req, res) => {
  try {
    const keyword = (req.query.keyword as string) || "";
    const resultsPerPage = 20;
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=${resultsPerPage}${keyword ? `&keywordSearch=${encodeURIComponent(keyword)}` : ""}`;

    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      sendSuccess(res, []);
      return;
    }

    const data = await response.json();
    const cves = (data.vulnerabilities || []).map((v: any) => {
      const cve = v.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0] || cve.metrics?.cvssMetricV2?.[0];
      const score = metrics?.cvssData?.baseScore || 0;
      const severity = score >= 9 ? "CRITICAL" : score >= 7 ? "HIGH" : score >= 4 ? "MEDIUM" : "LOW";

      return {
        id: cve.id,
        description: cve.descriptions?.find((d: any) => d.lang === "en")?.value || "",
        score,
        severity,
        published: cve.published,
        lastModified: cve.lastModified,
        vendor: cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")[3] || "N/A",
        product: cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")[4] || "N/A",
      };
    });

    sendSuccess(res, cves);
  } catch (err) {
    sendSuccess(res, []);
  }
});

export default router;
