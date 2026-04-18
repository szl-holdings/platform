import { Router, type IRouter, type RequestHandler } from "express";
import { LRUCache } from "lru-cache";
import rateLimit from "express-rate-limit";
import {
  db,
  firestormScenariosTable,
  firestormAssessmentsTable,
  firestormSimulationRunsTable,
  firestormFindingsTable,
  firestormRiskScoresTable,
  firestormIncidentsTable,
  firestormAlertsTable,
  firestormAssetsTable,
  firestormWorkflowActionsTable,
  firestormHardeningControlsTable,
  firestormComplianceControlsTable,
  firestormCasesTable,
  firestormMitreDetectionsTable,
  firestormTradecraftDecisionsTable,
  firestormCaseMemoryTable,
  firestormAnalystNotebookTable,
  firestormTradecraftValidationAuditTable,
  insertFirestormScenarioSchema,
  insertFirestormAssessmentSchema,
  insertFirestormSimulationRunSchema,
  insertFirestormFindingSchema,
  insertFirestormRiskScoreSchema,
  insertFirestormIncidentSchema,
  insertFirestormAlertSchema,
  insertFirestormAssetSchema,
  insertFirestormWorkflowActionSchema,
  insertFirestormCaseSchema,
  insertFirestormTradecraftDecisionSchema,
  insertFirestormAnalystNotebookSchema,
  type InsertFirestormCaseMemory,
  alloyRuntimeAgentsTable,
  alloyRuntimeAgentVersionsTable,
  auditEventsTable,
} from "@szl-holdings/db";
import { REFERENCE_COMPLIANCE_CONTROLS } from "../readiness.js";
import { eq, desc, sql, inArray, and, or } from "drizzle-orm";
import { z } from "zod";
import { sendSuccess, sendCreated, sendNotFound, sendNoContent, sendError, handleRouteError } from "../../lib/api-response";
import { authMiddleware, parseIdParam } from "../../middlewares/auth";
import { logger } from "../../lib/logger";
import { validateIfMatch } from "../../middlewares/optimistic-concurrency";
import { queryEvidenceIndex, ingestDecisionToEvidenceIndex } from "../../lib/tradecraft-evidence-store";
import { validateAndBuildDecision, type DecisionObjectType } from "@szl-holdings/ai-engine";
import { broadcastWs, pubsub, FIRESTORM_EVENTS } from "../../lib/pubsub-bridge.js";
import {
  ingestFirestormFinding,
  ingestFirestormScenario,
  ingestFirestormAlert,
} from "@szl-holdings/ai-engine/domain-embedding-hooks";
const router = Router();

router.get("/firestorm/incidents", authMiddleware(), async (_req, res) => {
  try {
    const incidents = await db.select().from(firestormIncidentsTable).orderBy(desc(firestormIncidentsTable.createdAt));
    sendSuccess(res, incidents);
  } catch (err) {
    handleRouteError(res, err, "Failed to list incidents");
  }
});

router.get("/firestorm/incidents/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [incident] = await db.select().from(firestormIncidentsTable).where(eq(firestormIncidentsTable.id, id));
    if (!incident) { sendNotFound(res, "Incident"); return; }
    sendSuccess(res, incident);
  } catch (err) {
    handleRouteError(res, err, "Failed to get incident");
  }
});

router.post("/firestorm/incidents", authMiddleware({ required: true }), async (req, res) => {
  try {
    const data = insertFirestormIncidentSchema.parse(req.body);
    const [incident] = await db.insert(firestormIncidentsTable).values(data).returning();
    broadcastWs("aegis-incidents", "incident-created", { id: incident.id, severity: incident.severity, status: incident.status, title: incident.title });
    void pubsub.publish(FIRESTORM_EVENTS.INCIDENT_UPDATED, { firestormIncidentUpdated: incident });
    sendCreated(res, incident);
  } catch (err) {
    handleRouteError(res, err, "Failed to create incident");
  }
});

router.put("/firestorm/incidents/:id", authMiddleware({ required: true }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const data = insertFirestormIncidentSchema.partial().parse(req.body);

    const [current] = await db.select().from(firestormIncidentsTable).where(eq(firestormIncidentsTable.id, id));
    if (!current) { sendNotFound(res, "Incident"); return; }

    if (!(await validateIfMatch(req, res, async () => current))) return;

    const effectiveStatus = data.status ?? current.status;
    const effectiveSeverity = data.severity ?? current.severity;
    const effectiveAnalyst = data.assignedAnalyst ?? current.assignedAnalyst;
    const activeStatuses = ["triage", "investigation", "containment", "remediation"];

    if ((effectiveSeverity === "critical" || effectiveSeverity === "high") && activeStatuses.includes(effectiveStatus)) {
      if (!effectiveAnalyst) {
        sendError(res, "Assigned analyst is required for critical/high severity incidents in active status.", 422, "UNPROCESSABLE_ENTITY");
        return;
      }
    }

    const prevStatus = current.status;
    const [incident] = await db.update(firestormIncidentsTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormIncidentsTable.id, id)).returning();
    if (!incident) { sendNotFound(res, "Incident"); return; }

    if (data.status && data.status !== prevStatus && (incident.severity === "critical" || incident.severity === "high")) {
      await db.insert(firestormWorkflowActionsTable).values({
        entityType: "incident",
        entityId: id,
        actionType: data.status === "containment" || data.status === "remediation" ? "route_to_response" : "escalate",
        assignedTo: incident.assignedAnalyst ?? undefined,
        status: "pending",
        notes: `Auto-triggered: incident status changed to ${data.status} — severity=${incident.severity}`,
        triggeredBy: "incident-status-hook",
      });
    }

    broadcastWs("aegis-incidents", "incident-updated", { id: incident.id, severity: incident.severity, status: incident.status, title: incident.title });
    void pubsub.publish(FIRESTORM_EVENTS.INCIDENT_UPDATED, { firestormIncidentUpdated: incident });
    sendSuccess(res, incident);
  } catch (err) {
    handleRouteError(res, err, "Failed to update incident");
  }
});

router.delete("/firestorm/incidents/:id", authMiddleware({ required: true }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [incident] = await db.delete(firestormIncidentsTable).where(eq(firestormIncidentsTable.id, id)).returning();
    if (!incident) { sendNotFound(res, "Incident"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete incident");
  }
});

router.get("/firestorm/vulnerabilities", authMiddleware(), async (req, res) => {
  try {
    const severityFilter = req.query.severity as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const assetFilter = req.query.asset as string | undefined;
    const findings = await db.select().from(firestormFindingsTable).orderBy(desc(firestormFindingsTable.createdAt));
    const filtered = findings.filter(f => {
      if (severityFilter && f.severity !== severityFilter) return false;
      if (statusFilter && f.status !== statusFilter) return false;
      if (assetFilter && f.affectedAsset !== assetFilter) return false;
      return true;
    });
    const enriched = filtered.map(f => ({
      ...f,
      recommendedAction: f.recommendation ?? null,
      auditTrail: Array.isArray(f.auditTrail) ? f.auditTrail : [],
    }));
    sendSuccess(res, enriched);
  } catch (err) {
    handleRouteError(res, err, "Failed to list vulnerabilities");
  }
});

router.get("/firestorm/vulnerabilities/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [finding] = await db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.id, id));
    if (!finding) { sendNotFound(res, "Vulnerability"); return; }
    sendSuccess(res, {
      ...finding,
      recommendedAction: finding.recommendation ?? null,
      auditTrail: Array.isArray(finding.auditTrail) ? finding.auditTrail : [],
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get vulnerability");
  }
});

router.put("/firestorm/vulnerabilities/:id", authMiddleware({ required: true }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const { status, remediationOwner, dueDate, recommendedAction, recommendation } = updateVulnerabilitySchema.parse(req.body);
    const [current] = await db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.id, id));
    if (!current) { sendNotFound(res, "Vulnerability"); return; }

    const effectiveStatus = status ?? current.status;
    const effectiveOwner = remediationOwner ?? current.remediationOwner;
    const effectiveDueDate = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : current.dueDate;

    const effectiveRecommendation = recommendedAction ?? recommendation ?? current.recommendation;
    if ((effectiveStatus === "confirmed" || effectiveStatus === "open") && (current.severity === "critical" || current.severity === "high")) {
      if (!effectiveOwner) {
        sendError(res, "Remediation owner is required for critical/high severity findings when status is confirmed or open.", 422, "UNPROCESSABLE_ENTITY");
        return;
      }
      if (!effectiveDueDate) {
        sendError(res, "Due date is required for critical/high severity findings when status is confirmed or open.", 422, "UNPROCESSABLE_ENTITY");
        return;
      }
      if (!effectiveRecommendation) {
        sendError(res, "Recommended action is required for critical/high severity findings when status is confirmed or open.", 422, "UNPROCESSABLE_ENTITY");
        return;
      }
    }

    const updates: Partial<typeof firestormFindingsTable.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() };
    if (status !== undefined) updates.status = effectiveStatus as typeof current.status;
    if (remediationOwner !== undefined) updates.remediationOwner = remediationOwner;
    if (dueDate !== undefined) updates.dueDate = effectiveDueDate;
    const incomingRec = recommendedAction ?? recommendation;
    if (incomingRec !== undefined) updates.recommendation = incomingRec;

    const existingTrail = Array.isArray(current.auditTrail) ? current.auditTrail : [];
    const changedFields = Object.keys(updates).filter(k => k !== "updatedAt");
    const newEntry = { action: `Updated: ${changedFields.join(", ")}`, user: "Operator", at: new Date().toISOString() };
    updates.auditTrail = [...existingTrail, newEntry];

    const [finding] = await db.update(firestormFindingsTable).set(updates).where(eq(firestormFindingsTable.id, id)).returning();

    if (status === "confirmed" && current.status !== "confirmed") {
      await db.insert(firestormWorkflowActionsTable).values({
        entityType: "finding",
        entityId: id,
        actionType: "assign_owner",
        assignedTo: effectiveOwner ?? undefined,
        status: "pending",
        notes: `Auto-triggered: finding confirmed — severity=${finding.severity}, asset=${finding.affectedAsset ?? "unknown"}`,
        triggeredBy: "vulnerability-confirm-hook",
      });
    }

    sendSuccess(res, {
      ...finding,
      recommendedAction: finding.recommendation ?? null,
      auditTrail: Array.isArray(finding.auditTrail) ? finding.auditTrail : [],
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to update vulnerability");
  }
});

async function ensureComplianceControlsSeeded(): Promise<void> {
  const existing = await db.select({ id: firestormComplianceControlsTable.id }).from(firestormComplianceControlsTable).limit(1);
  if (existing.length > 0) return;
  const rows = REFERENCE_COMPLIANCE_CONTROLS.map(c => ({
    framework: "nist_csf" as const,
    category: c.category,
    controlId: c.controlId,
    controlName: c.controlId,
    description: c.evidence ?? null,
    status: (c.status === "compliant" ? "implemented" : c.status === "partial" ? "partial" : "not_implemented") as "implemented" | "partial" | "not_implemented",
    evidenceNotes: c.owner ? `Owner: ${c.owner}` : null,
    owner: c.owner ?? null,
  }));
  await db.insert(firestormComplianceControlsTable).values(rows);
}

const VALID_COMPLIANCE_FRAMEWORKS = ["nist_csf", "fedramp", "fisma"] as const;
type ComplianceFramework = typeof VALID_COMPLIANCE_FRAMEWORKS[number];

router.get("/firestorm/compliance", authMiddleware(), async (req, res) => {
  try {
    await ensureComplianceControlsSeeded();
    const rawFramework = req.query.framework as string | undefined;
    const framework: ComplianceFramework = VALID_COMPLIANCE_FRAMEWORKS.includes(rawFramework as ComplianceFramework)
      ? (rawFramework as ComplianceFramework)
      : "nist_csf";
    const controls = await db.select().from(firestormComplianceControlsTable).where(eq(firestormComplianceControlsTable.framework, framework)).orderBy(firestormComplianceControlsTable.category);
    sendSuccess(res, controls);
  } catch (err) {
    handleRouteError(res, err, "Failed to list compliance controls");
  }
});

router.put("/firestorm/compliance/:controlId", authMiddleware({ required: true }), async (req, res) => {
  try {
    await ensureComplianceControlsSeeded();
    const { controlId } = req.params as Record<string, string>;
    const { status, owner, dueDate, notes } = updateComplianceControlSchema.parse(req.body);
    const [existing] = await db.select().from(firestormComplianceControlsTable).where(eq(firestormComplianceControlsTable.controlId, controlId));
    if (!existing) { sendNotFound(res, "Compliance Control"); return; }

    const effectiveStatus = status ?? existing.status;
    const effectiveOwner = owner ?? existing.owner;
    if ((effectiveStatus === "not_implemented" || effectiveStatus === "partial") && !effectiveOwner) {
      sendError(res, "Owner assignment is required for non-compliant compliance controls to enable gap routing.", 422, "UNPROCESSABLE_ENTITY");
      return;
    }

    const prevAudit = Array.isArray(existing.auditTrail) ? existing.auditTrail as object[] : [];
    const auditEntry = { at: new Date().toISOString(), action: `Updated: ${[status && "status", owner && "owner", dueDate && "dueDate"].filter(Boolean).join(", ")}` };
    const updates: Partial<typeof firestormComplianceControlsTable.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date(), auditTrail: [...prevAudit, auditEntry] };
    if (status) updates.status = effectiveStatus as typeof existing.status;
    if (owner !== undefined) updates.owner = owner;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) updates.evidenceNotes = notes;

    const [updated] = await db.update(firestormComplianceControlsTable).set(updates).where(eq(firestormComplianceControlsTable.controlId, controlId)).returning();

    await db.insert(firestormWorkflowActionsTable).values({
      entityType: "asset",
      entityId: updated.id,
      actionType: effectiveStatus === "not_implemented" ? "escalate" : "remediate",
      assignedTo: effectiveOwner ?? undefined,
      status: "pending",
      notes: `Compliance gap routing: controlId=${controlId}, status=${effectiveStatus}, owner=${effectiveOwner ?? "unassigned"} — ${notes ?? ""}`,
      triggeredBy: "compliance-gap-hook",
    });

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update compliance control");
  }
});

router.get("/firestorm/vulnerability-inventory", authMiddleware(), async (req, res) => {
  try {
    const severityFilter = req.query.severity as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const assetFilter = req.query.asset as string | undefined;
    const findings = await db.select().from(firestormFindingsTable).orderBy(desc(firestormFindingsTable.createdAt));
    const filtered = findings.filter(f => {
      if (severityFilter && f.severity !== severityFilter) return false;
      if (statusFilter && f.status !== statusFilter) return false;
      if (assetFilter && f.affectedAsset !== assetFilter) return false;
      return true;
    });
    const stats = {
      total: filtered.length,
      critical: filtered.filter(f => f.severity === "critical").length,
      high: filtered.filter(f => f.severity === "high").length,
      medium: filtered.filter(f => f.severity === "medium").length,
      low: filtered.filter(f => f.severity === "low").length,
      open: filtered.filter(f => f.status === "open").length,
      confirmed: filtered.filter(f => f.status === "confirmed").length,
      mitigated: filtered.filter(f => f.status === "mitigated").length,
      unowned: filtered.filter(f => !f.remediationOwner && (f.severity === "critical" || f.severity === "high")).length,
      overdue: filtered.filter(f => f.dueDate && new Date(f.dueDate) < new Date() && f.status !== "mitigated" && f.status !== "accepted").length,
    };
    sendSuccess(res, {
      schema: "firestorm_findings",
      description: "Platform-wide vulnerability inventory. firestorm_findings is the canonical vulnerability store; assessment_id links findings to the originating assessment but is not required for platform-level tracking queries.",
      stats,
      vulnerabilities: filtered.map(f => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        status: f.status,
        affectedAsset: f.affectedAsset,
        cvssScore: f.cvssScore,
        cveId: (f as Record<string, unknown>).cveId,
        remediationOwner: f.remediationOwner,
        dueDate: f.dueDate,
        recommendation: f.recommendation,
        auditTrail: Array.isArray(f.auditTrail) ? f.auditTrail : [],
        assessmentId: f.assessmentId,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to list vulnerability inventory");
  }
});

router.get("/firestorm/alerts", authMiddleware(), async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const query = status
      ? db.select().from(firestormAlertsTable).where(eq(firestormAlertsTable.status, status as "new" | "acknowledged" | "investigating" | "resolved" | "dismissed")).orderBy(desc(firestormAlertsTable.createdAt))
      : db.select().from(firestormAlertsTable).orderBy(desc(firestormAlertsTable.createdAt));
    const alerts = await query;
    sendSuccess(res, alerts);
  } catch (err) {
    handleRouteError(res, err, "Failed to list alerts");
  }
});

router.post("/firestorm/alerts", authMiddleware({ required: true }), async (req, res) => {
  try {
    const data = insertFirestormAlertSchema.parse(req.body);
    const [alert] = await db.insert(firestormAlertsTable).values(data).returning();
    broadcastWs("aegis-incidents", "alert-created", { id: alert.id, severity: alert.severity, status: alert.status, title: alert.title });
    void ingestFirestormAlert(alert, getFirestormTenantId(req));
    sendCreated(res, alert);
  } catch (err) {
    handleRouteError(res, err, "Failed to create alert");
  }
});

router.put("/firestorm/alerts/:id", authMiddleware({ required: true }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const data = insertFirestormAlertSchema.partial().parse(req.body);
    const updates: Partial<typeof firestormAlertsTable.$inferInsert> & { acknowledgedAt?: Date; resolvedAt?: Date } = { ...data };
    if (data.status === "acknowledged") updates.acknowledgedAt = new Date();
    if (data.status === "resolved" || data.status === "dismissed") updates.resolvedAt = new Date();
    const [alert] = await db.update(firestormAlertsTable).set(updates).where(eq(firestormAlertsTable.id, id)).returning();
    if (!alert) { sendNotFound(res, "Alert"); return; }
    broadcastWs("aegis-incidents", "alert-updated", { id: alert.id, severity: alert.severity, status: alert.status, title: alert.title });
    void ingestFirestormAlert(alert, getFirestormTenantId(req));
    sendSuccess(res, alert);
  } catch (err) {
    handleRouteError(res, err, "Failed to update alert");
  }
});

router.get("/firestorm/soc-dashboard", authMiddleware(), async (_req, res) => {
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

router.get("/firestorm/cves", authMiddleware(), async (req, res) => {
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

    interface NvdCveDescription { lang: string; value: string; }
    interface NvdCvssMetric { cvssData?: { baseScore?: number }; }
    interface NvdCpeMatch { criteria?: string; }
    interface NvdCpeNode { cpeMatch?: NvdCpeMatch[]; }
    interface NvdConfiguration { nodes?: NvdCpeNode[]; }
    interface NvdCveItem {
      id?: string;
      descriptions?: NvdCveDescription[];
      metrics?: { cvssMetricV31?: NvdCvssMetric[]; cvssMetricV30?: NvdCvssMetric[]; cvssMetricV2?: NvdCvssMetric[]; };
      configurations?: NvdConfiguration[];
      published?: string;
      lastModified?: string;
    }
    interface NvdVulnerability { cve: NvdCveItem; }
    interface NvdApiResponse { vulnerabilities?: NvdVulnerability[]; }

    const data = (await response.json()) as NvdApiResponse;
    const cves = (data.vulnerabilities || []).map((v: NvdVulnerability) => {
      const cve = v.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0] || cve.metrics?.cvssMetricV2?.[0];
      const score = metrics?.cvssData?.baseScore || 0;
      const severity = score >= 9 ? "CRITICAL" : score >= 7 ? "HIGH" : score >= 4 ? "MEDIUM" : "LOW";

      return {
        id: cve.id,
        description: cve.descriptions?.find((d: NvdCveDescription) => d.lang === "en")?.value || "",
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



export function register(r: IRouter): void { r.use(router); }
