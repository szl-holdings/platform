import { Router, type IRouter, type RequestHandler } from "express";
import {
  db,
  firestormFindingsTable,
  firestormHardeningControlsTable,
  firestormComplianceControlsTable,
  firestormWorkflowActionsTable,
  insertFirestormFindingSchema,
} from "@szl-holdings/db";
import { REFERENCE_COMPLIANCE_CONTROLS } from "./readiness.js";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

const VALID_COMPLIANCE_FRAMEWORKS = ["nist_csf", "fedramp", "fisma"] as const;
type ComplianceFramework = typeof VALID_COMPLIANCE_FRAMEWORKS[number];

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

router.get("/firestorm/compliance", authMiddleware({ required: false }), async (req, res) => {
  try {
    await ensureComplianceControlsSeeded();
    const rawFramework = req.query.framework as string | undefined;
    const framework: ComplianceFramework = VALID_COMPLIANCE_FRAMEWORKS.includes(rawFramework as ComplianceFramework)
      ? (rawFramework as ComplianceFramework)
      : "nist_csf";
    const controls = await db.select().from(firestormComplianceControlsTable).where(eq(firestormComplianceControlsTable.framework, framework)).orderBy(firestormComplianceControlsTable.category);
    const implemented = controls.filter(c => c.status === "implemented").length;
    const partial = controls.filter(c => c.status === "partial").length;
    const notImplemented = controls.filter(c => c.status === "not_implemented").length;
    const score = controls.length > 0 ? Math.round((implemented * 1 + partial * 0.5) / controls.length * 100) : 0;
    sendSuccess(res, { framework, total: controls.length, implemented, partial, notImplemented, score, controls });
  } catch (err) {
    handleRouteError(res, err, "Failed to list compliance controls");
  }
});

router.put("/firestorm/compliance/:controlId", authMiddleware({ required: true }), async (req, res) => {
  try {
    const controlId = String(req.params.controlId);
    const { status, owner, dueDate, notes } = req.body as {
      status?: string; owner?: string; dueDate?: string; notes?: string;
    };

    const [existing] = await db.select().from(firestormComplianceControlsTable).where(eq(firestormComplianceControlsTable.controlId, controlId));
    if (!existing) { sendNotFound(res, "Compliance Control"); return; }

    const effectiveStatus = status ?? existing.status;
    const effectiveOwner = owner ?? existing.owner;
    if ((effectiveStatus === "not_implemented" || effectiveStatus === "partial") && !effectiveOwner) {
      res.status(422).json({ error: "Owner assignment is required for non-compliant compliance controls to enable gap routing." });
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

router.get("/firestorm/vulnerabilities", authMiddleware({ required: false }), async (req, res) => {
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

router.get("/firestorm/vulnerabilities/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
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
    const id = parseIdParam(req.params.id);
    const { status, remediationOwner, dueDate, recommendedAction, recommendation } = req.body as {
      status?: string; remediationOwner?: string; dueDate?: string; recommendedAction?: string; recommendation?: string;
    };
    const [current] = await db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.id, id));
    if (!current) { sendNotFound(res, "Vulnerability"); return; }

    const effectiveStatus = status ?? current.status;
    const effectiveOwner = remediationOwner ?? current.remediationOwner;
    const effectiveDueDate = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : current.dueDate;
    const effectiveRecommendation = recommendedAction ?? recommendation ?? current.recommendation;

    if ((effectiveStatus === "confirmed" || effectiveStatus === "open") && (current.severity === "critical" || current.severity === "high")) {
      if (!effectiveOwner) {
        res.status(422).json({ error: "Remediation owner is required for critical/high severity findings when status is confirmed or open." });
        return;
      }
      if (!effectiveDueDate) {
        res.status(422).json({ error: "Due date is required for critical/high severity findings when status is confirmed or open." });
        return;
      }
      if (!effectiveRecommendation) {
        res.status(422).json({ error: "Recommended action is required for critical/high severity findings when status is confirmed or open." });
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

router.get("/firestorm/vulnerability-inventory", authMiddleware({ required: false }), async (req, res) => {
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
      description: "Platform-wide vulnerability inventory. firestorm_findings is the canonical vulnerability store.",
      stats,
      vulnerabilities: filtered.map(f => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        status: f.status,
        affectedAsset: f.affectedAsset,
        cvssScore: f.cvssScore,
        cveId: (f as any).cveId,
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

router.get("/firestorm/hardening-controls", authMiddleware({ required: false }), async (req, res) => {
  try {
    const categoryFilter = req.query.category as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const controls = await db.select().from(firestormHardeningControlsTable).orderBy(firestormHardeningControlsTable.controlId);
    const filtered = controls.filter(c => {
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      return true;
    });
    sendSuccess(res, filtered);
  } catch (err) {
    handleRouteError(res, err, "Failed to list hardening controls");
  }
});

router.get("/firestorm/hardening-controls/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [control] = await db.select().from(firestormHardeningControlsTable).where(eq(firestormHardeningControlsTable.id, id));
    if (!control) { sendNotFound(res, "Hardening control"); return; }
    sendSuccess(res, control);
  } catch (err) {
    handleRouteError(res, err, "Failed to get hardening control");
  }
});

router.put("/firestorm/hardening-controls/:id", authMiddleware({ required: true }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { status, owner, recommendedAction, dueDate, notes } = req.body as {
      status?: string; owner?: string; recommendedAction?: string; dueDate?: string; notes?: string;
    };
    const [current] = await db.select().from(firestormHardeningControlsTable).where(eq(firestormHardeningControlsTable.id, id));
    if (!current) { sendNotFound(res, "Hardening control"); return; }

    const updates: Partial<typeof firestormHardeningControlsTable.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() };
    if (status !== undefined) updates.status = status as typeof current.status;
    if (owner !== undefined) updates.owner = owner;
    if (recommendedAction !== undefined) updates.recommendedAction = recommendedAction;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

    const existingTrail = Array.isArray(current.auditTrail) ? current.auditTrail : [];
    const changedFields = Object.keys(updates).filter(k => k !== "updatedAt");
    const auditEntry = { action: notes ?? `Updated: ${changedFields.join(", ")}`, user: "Operator", at: new Date().toISOString() };
    updates.auditTrail = [...existingTrail, auditEntry];
    updates.lastReviewedAt = new Date();

    const [control] = await db.update(firestormHardeningControlsTable).set(updates).where(eq(firestormHardeningControlsTable.id, id)).returning();

    if (status === "implemented" && current.status !== "implemented") {
      await db.insert(firestormWorkflowActionsTable).values({
        entityType: "asset",
        entityId: id,
        actionType: "remediate",
        assignedTo: owner ?? current.owner ?? undefined,
        status: "completed",
        notes: `Hardening control ${current.controlId} marked implemented: ${current.name}`,
        triggeredBy: "hardening-control-update",
      });
    }

    sendSuccess(res, control);
  } catch (err) {
    handleRouteError(res, err, "Failed to update hardening control");
  }
});

router.get("/firestorm/hardening-summary", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const controls = await db.select().from(firestormHardeningControlsTable);
    const implemented = controls.filter(c => c.status === "implemented").length;
    const partial = controls.filter(c => c.status === "partial").length;
    const notImplemented = controls.filter(c => c.status === "not_implemented").length;
    const criticalGaps = controls.filter(c => c.priority === "critical" && c.status === "not_implemented").length;
    const totalScore = controls.length > 0 ? Math.round((implemented * 1 + partial * 0.5) / controls.length * 100) : 0;

    const byCategory = ["mfa_credential", "application_hardening", "config_hardening", "dependency_supply_chain", "vulnerability_assessment"].map(cat => {
      const catControls = controls.filter(c => c.category === cat);
      const catImplemented = catControls.filter(c => c.status === "implemented").length;
      const catPartial = catControls.filter(c => c.status === "partial").length;
      const catScore = catControls.length > 0 ? Math.round((catImplemented * 1 + catPartial * 0.5) / catControls.length * 100) : 0;
      const catGaps = catControls.filter(c => c.priority === "critical" && c.status === "not_implemented").length;
      return { category: cat, total: catControls.length, implemented: catImplemented, partial: catPartial, notImplemented: catControls.length - catImplemented - catPartial, score: catScore, criticalGaps: catGaps };
    });

    sendSuccess(res, { total: controls.length, implemented, partial, notImplemented, criticalGaps, overallScore: totalScore, byCategory });
  } catch (err) {
    handleRouteError(res, err, "Failed to get hardening summary");
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
  } catch (_err) {
    sendSuccess(res, []);
  }
});

export default router;
