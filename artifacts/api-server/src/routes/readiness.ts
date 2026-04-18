import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { LRUCache } from "lru-cache";
import { z } from "zod";
import {
  db,
  readinessProgramsTable,
  readinessDimensionsTable,
  readinessScoreHistoryTable,
  readinessMilestonesTable,
  readinessRisksTable,
  readinessAlertsTable,
} from "@szl-holdings/db";
import { eq, desc, sql } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
import { jsonObjectBodySchema, listQuerySchema, validateBody, validateQuery } from "../lib/validation";

const programCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "completed", "archived"]).optional(),
  targetScore: z.number().min(0).max(100).optional(),
  entityType: z.string().optional(),
  entityId: z.number().int().optional(),
}).passthrough();

const programUpdateSchema = programCreateSchema.partial();

const milestoneSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "skipped"]).optional(),
  dueDate: z.string().optional(),
  programId: z.number().int().optional(),
}).passthrough();

const router: IRouter = Router();

router.get("/readiness/programs", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(readinessProgramsTable).orderBy(desc(readinessProgramsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(readinessProgramsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list programs");
  }
});

router.post("/readiness/programs", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  const parsed = programCreateSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors.map(e => e.message).join(", "), 400); return; }
  try {
    const [row] = await db.insert(readinessProgramsTable).values(parsed.data as any).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create program");
  }
});

router.get("/readiness/programs/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(readinessProgramsTable).where(eq(readinessProgramsTable.id, id));
    if (!row) { sendNotFound(res, "Program"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get program");
  }
});

router.patch("/readiness/programs/:id", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  const parsed = programUpdateSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors.map(e => e.message).join(", "), 400); return; }
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(readinessProgramsTable).set({ ...parsed.data, updatedAt: new Date() } as any).where(eq(readinessProgramsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Program"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update program");
  }
});

router.delete("/readiness/programs/:id", validateBody(jsonObjectBodySchema), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(readinessProgramsTable).where(eq(readinessProgramsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Program"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete program");
  }
});

router.get("/readiness/programs/:id/dimensions", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(readinessDimensionsTable).where(eq(readinessDimensionsTable.programId, id)).orderBy(readinessDimensionsTable.category);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list dimensions");
  }
});

router.post("/readiness/dimensions", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const [row] = await db.insert(readinessDimensionsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create dimension");
  }
});

router.patch("/readiness/dimensions/:id", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(readinessDimensionsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(readinessDimensionsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Dimension"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update dimension");
  }
});

router.delete("/readiness/dimensions/:id", validateBody(jsonObjectBodySchema), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(readinessDimensionsTable).where(eq(readinessDimensionsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Dimension"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete dimension");
  }
});

router.get("/readiness/dimensions/:id/scores", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(readinessScoreHistoryTable).where(eq(readinessScoreHistoryTable.dimensionId, id)).orderBy(desc(readinessScoreHistoryTable.recordedAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list score history");
  }
});

router.post("/readiness/scores", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const [row] = await db.insert(readinessScoreHistoryTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to record score");
  }
});

router.get("/readiness/programs/:id/milestones", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(readinessMilestonesTable).where(eq(readinessMilestonesTable.programId, id)).orderBy(readinessMilestonesTable.dueDate);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list milestones");
  }
});

router.post("/readiness/milestones", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const [row] = await db.insert(readinessMilestonesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create milestone");
  }
});

router.patch("/readiness/milestones/:id", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(readinessMilestonesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(readinessMilestonesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Milestone"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update milestone");
  }
});

router.delete("/readiness/milestones/:id", validateBody(jsonObjectBodySchema), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(readinessMilestonesTable).where(eq(readinessMilestonesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Milestone"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete milestone");
  }
});

router.get("/readiness/programs/:id/risks", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(readinessRisksTable).where(eq(readinessRisksTable.programId, id)).orderBy(desc(readinessRisksTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list risks");
  }
});

router.post("/readiness/risks", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const [row] = await db.insert(readinessRisksTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create risk");
  }
});

router.patch("/readiness/risks/:id", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(readinessRisksTable).set({ ...req.body, updatedAt: new Date() }).where(eq(readinessRisksTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Risk"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update risk");
  }
});

router.delete("/readiness/risks/:id", validateBody(jsonObjectBodySchema), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(readinessRisksTable).where(eq(readinessRisksTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Risk"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete risk");
  }
});

router.get("/readiness/programs/:id/alerts", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(readinessAlertsTable).where(eq(readinessAlertsTable.programId, id)).orderBy(desc(readinessAlertsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list alerts");
  }
});

router.post("/readiness/alerts", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const [row] = await db.insert(readinessAlertsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create alert");
  }
});

router.patch("/readiness/alerts/:id", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(readinessAlertsTable).set(req.body).where(eq(readinessAlertsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Alert"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update alert");
  }
});

router.delete("/readiness/alerts/:id", validateBody(jsonObjectBodySchema), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(readinessAlertsTable).where(eq(readinessAlertsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Alert"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete alert");
  }
});

router.get("/readiness/executive-rollup", authMiddleware(), async (_req, res) => {
  try {
    const programs = await db.select().from(readinessProgramsTable).orderBy(desc(readinessProgramsTable.createdAt));
    const dimensions = await db.select().from(readinessDimensionsTable);
    const milestones = await db.select().from(readinessMilestonesTable);
    const risks = await db.select().from(readinessRisksTable);
    const alerts = await db.select().from(readinessAlertsTable).where(eq(readinessAlertsTable.isRead, false));

    const activePrograms = programs.filter(p => p.status === "active");
    const overdueMilestones = milestones.filter(m => m.status === "overdue");
    const openRisks = risks.filter(r => !["resolved", "accepted"].includes(r.status));
    const criticalRisks = openRisks.filter(r => r.severity === "critical");

    sendSuccess(res, {
      programCount: programs.length,
      activeProgramCount: activePrograms.length,
      dimensionCount: dimensions.length,
      overdueMilestoneCount: overdueMilestones.length,
      openRiskCount: openRisks.length,
      criticalRiskCount: criticalRisks.length,
      unreadAlertCount: alerts.length,
      programs: activePrograms,
      recentAlerts: alerts.slice(0, 10),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build executive rollup");
  }
});

const readinessLiveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Readiness Live rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const readinessCache = new LRUCache<string, { data: unknown; expiry: number }>({ max: 100 });
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = readinessCache.get(key);
  if (cached && cached.expiry > Date.now()) return Promise.resolve(cached.data as T);
  return fetcher().then((data) => {
    readinessCache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = readinessCache.get(key);
    if (stale) return stale.data as T;
    throw new Error("Data unavailable");
  });
}

const NIST_CSF_FRAMEWORK = {
  version: "2.0",
  releaseDate: "2024-02-26",
  url: "https://www.nist.gov/cyberframework",
  functions: [
    {
      id: "GV", name: "GOVERN", description: "Establish and monitor cybersecurity risk management strategy, expectations, and policies",
      categories: 6, subcategories: 25,
      keyOutcomes: ["Organizational Context", "Risk Management Strategy", "Roles & Responsibilities", "Policy", "Oversight", "Cybersecurity Supply Chain Risk Management"],
    },
    {
      id: "ID", name: "IDENTIFY", description: "Understand cybersecurity risks to systems, people, assets, data, and capabilities",
      categories: 5, subcategories: 21,
      keyOutcomes: ["Asset Management", "Risk Assessment", "Improvement"],
    },
    {
      id: "PR", name: "PROTECT", description: "Safeguards to manage cybersecurity risks",
      categories: 6, subcategories: 24,
      keyOutcomes: ["Identity Management", "Awareness Training", "Data Security", "Platform Security", "Technology Infrastructure Resilience"],
    },
    {
      id: "DE", name: "DETECT", description: "Find and analyze possible cybersecurity incidents",
      categories: 2, subcategories: 7,
      keyOutcomes: ["Continuous Monitoring", "Adverse Event Analysis"],
    },
    {
      id: "RS", name: "RESPOND", description: "Actions regarding a detected cybersecurity incident",
      categories: 4, subcategories: 17,
      keyOutcomes: ["Incident Management", "Incident Analysis", "Incident Response Reporting", "Incident Mitigation"],
    },
    {
      id: "RC", name: "RECOVER", description: "Restore assets and operations affected by a cybersecurity incident",
      categories: 2, subcategories: 6,
      keyOutcomes: ["Incident Recovery Plan", "Incident Recovery Communication"],
    },
  ],
};

export const REFERENCE_COMPLIANCE_CONTROLS = [
  { controlId: "GV.RM-01", function: "GOVERN", category: "Risk Management Strategy", status: "compliant", score: 92, lastAssessed: "2026-03-15", owner: "CISO", evidence: "Documented risk management strategy reviewed Q1 2026", priority: "high" },
  { controlId: "ID.AM-01", function: "IDENTIFY", category: "Asset Management", status: "compliant", score: 88, lastAssessed: "2026-03-20", owner: "IT Operations", evidence: "Asset inventory updated, 98% coverage", priority: "high" },
  { controlId: "ID.RA-01", function: "IDENTIFY", category: "Risk Assessment", status: "partial", score: 71, lastAssessed: "2026-03-10", owner: "Risk Team", evidence: "Annual risk assessment completed, quarterly updates missing", priority: "medium" },
  { controlId: "PR.AA-01", function: "PROTECT", category: "Identity Management", status: "compliant", score: 95, lastAssessed: "2026-03-22", owner: "IAM Team", evidence: "MFA enforced, PAM deployed, 100% critical accounts covered", priority: "critical" },
  { controlId: "PR.DS-01", function: "PROTECT", category: "Data Security", status: "partial", score: 68, lastAssessed: "2026-03-18", owner: "Data Team", evidence: "Data classification complete, encryption at rest 89% coverage", priority: "high" },
  { controlId: "DE.CM-01", function: "DETECT", category: "Continuous Monitoring", status: "compliant", score: 91, lastAssessed: "2026-03-25", owner: "SOC", evidence: "24/7 SIEM monitoring, automated alerting, 99.9% uptime", priority: "critical" },
  { controlId: "RS.MA-01", function: "RESPOND", category: "Incident Management", status: "compliant", score: 87, lastAssessed: "2026-03-12", owner: "IR Team", evidence: "IRP tested quarterly, avg MTTR 4.2 hours", priority: "high" },
  { controlId: "RC.RP-01", function: "RECOVER", category: "Incident Recovery Plan", status: "partial", score: 74, lastAssessed: "2026-02-28", owner: "BCM Team", evidence: "BCP documented, DR test completed annually (last: Jan 2026)", priority: "medium" },
];

const REFERENCE_AUDIT_FINDINGS = [
  { id: "AF-2026-001", severity: "high", finding: "Multi-factor authentication not enforced on 3 legacy VPN endpoints", standard: "NIST CSF PR.AA-02", status: "remediation_in_progress", dueDate: "2026-04-15", assignee: "Network Operations", riskScore: 78, ciaCritical: ["confidentiality", "access_control"] },
  { id: "AF-2026-002", severity: "medium", finding: "Security awareness training completion rate at 84% — below 95% target", standard: "NIST CSF PR.AT-01", status: "open", dueDate: "2026-04-30", assignee: "HR / Security", riskScore: 52, ciaCritical: ["all"] },
  { id: "AF-2026-003", severity: "critical", finding: "3rd-party vendor with access to CUI has not completed annual security review", standard: "NIST CSF GV.SC-05", status: "open", dueDate: "2026-04-01", assignee: "Vendor Management", riskScore: 91, ciaCritical: ["confidentiality", "integrity"] },
  { id: "AF-2026-004", severity: "low", finding: "Backup restoration testing documentation not current (last test: July 2025)", standard: "NIST CSF RC.RP-02", status: "open", dueDate: "2026-05-31", assignee: "IT Operations", riskScore: 34, ciaCritical: ["availability"] },
  { id: "AF-2026-005", severity: "medium", finding: "Privileged access review not completed within 90-day window for 12 accounts", standard: "NIST CSF PR.AA-05", status: "remediation_in_progress", dueDate: "2026-04-10", assignee: "IAM Team", riskScore: 61, ciaCritical: ["confidentiality", "access_control"] },
];

const REFERENCE_FRAMEWORK_MAPPINGS = {
  "NIST CSF 2.0": { controls: 106, aligned: 89, gap: 17, complianceScore: 84 },
  "CMMC Level 2": { controls: 110, aligned: 98, gap: 12, complianceScore: 89 },
  "ISO 27001:2022": { controls: 93, aligned: 77, gap: 16, complianceScore: 83 },
  "SOC 2 Type II": { controls: 64, aligned: 61, gap: 3, complianceScore: 95 },
  "HIPAA Security Rule": { controls: 45, aligned: 42, gap: 3, complianceScore: 93 },
  "PCI DSS v4.0": { controls: 259, aligned: 201, gap: 58, complianceScore: 78 },
};

router.get("/readiness/live/nist-framework", readinessLiveRateLimit, authMiddleware(), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "NIST Cybersecurity Framework 2.0",
      url: "https://www.nist.gov/cyberframework",
      framework: NIST_CSF_FRAMEWORK,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch NIST framework"); }
});

router.get("/readiness/live/controls", readinessLiveRateLimit, authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const func = req.query.function as string;
    const status = req.query.status as string;
    let controls = REFERENCE_COMPLIANCE_CONTROLS;
    if (func) controls = controls.filter(c => c.function === func.toUpperCase());
    if (status) controls = controls.filter(c => c.status === status);
    const avgScore = controls.reduce((s, c) => s + c.score, 0) / controls.length;
    sendSuccess(res, {
      source: "NIST CSF 2.0 Control Assessment — Vanta-style Automation",
      count: controls.length,
      controls,
      summary: {
        avgScore: Math.round(avgScore),
        compliant: controls.filter(c => c.status === "compliant").length,
        partial: controls.filter(c => c.status === "partial").length,
        nonCompliant: controls.filter(c => c.status === "non_compliant").length,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch compliance controls"); }
});

router.get("/readiness/live/audit-findings", readinessLiveRateLimit, authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const severity = req.query.severity as string;
    let findings = REFERENCE_AUDIT_FINDINGS;
    if (severity) findings = findings.filter(f => f.severity === severity);
    const critical = findings.filter(f => f.severity === "critical").length;
    const high = findings.filter(f => f.severity === "high").length;
    sendSuccess(res, {
      source: "Readiness Audit Engine — NIST CSF 2.0 Aligned",
      count: findings.length,
      findings,
      summary: { critical, high, medium: findings.filter(f => f.severity === "medium").length, low: findings.filter(f => f.severity === "low").length },
      overallRiskRating: critical > 0 ? "CRITICAL" : high > 1 ? "HIGH" : high > 0 ? "MEDIUM" : "LOW",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch audit findings"); }
});

router.get("/readiness/live/framework-mappings", readinessLiveRateLimit, authMiddleware(), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "Multi-Framework Compliance Mapping Engine",
      frameworks: REFERENCE_FRAMEWORK_MAPPINGS,
      primaryFramework: "NIST CSF 2.0",
      overallCompliance: Math.round(
        Object.values(REFERENCE_FRAMEWORK_MAPPINGS).reduce((s, f) => s + f.complianceScore, 0) / Object.keys(REFERENCE_FRAMEWORK_MAPPINGS).length,
      ),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch framework mappings"); }
});

router.get("/readiness/live/risk-posture", readinessLiveRateLimit, authMiddleware(), async (_req, res) => {
  try {
    const openFindings = REFERENCE_AUDIT_FINDINGS.filter(f => f.status === "open").length;
    const criticalFindings = REFERENCE_AUDIT_FINDINGS.filter(f => f.severity === "critical").length;
    const avgControlScore = REFERENCE_COMPLIANCE_CONTROLS.reduce((s, c) => s + c.score, 0) / REFERENCE_COMPLIANCE_CONTROLS.length;
    const compositeRisk = 100 - Math.round(
      (avgControlScore * 0.5) +
      (Math.max(0, 100 - openFindings * 5) * 0.3) +
      (Math.max(0, 100 - criticalFindings * 20) * 0.2),
    );
    sendSuccess(res, {
      source: "SZL Readiness Risk Posture Engine",
      posture: {
        overallScore: Math.round(avgControlScore),
        compositeRisk: Math.max(0, Math.min(100, compositeRisk)),
        riskRating: criticalFindings > 0 ? "CRITICAL" : compositeRisk > 60 ? "HIGH" : compositeRisk > 40 ? "MEDIUM" : "LOW",
        openFindings,
        criticalFindings,
        controlsCoverage: REFERENCE_COMPLIANCE_CONTROLS.length,
        lastAssessment: "2026-03-25",
        nextAssessment: "2026-06-25",
        trendsVs90Days: { controlScore: +2.3, openFindings: -4, criticalFindings: -1 },
      },
      benchmarks: {
        industryAvg: 71,
        topQuartile: 89,
        szlScore: Math.round(avgControlScore),
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch risk posture"); }
});

export default router;
