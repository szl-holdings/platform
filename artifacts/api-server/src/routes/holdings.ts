import { Router, type IRouter } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../lib/logger";
import { generateInvestorDocPdf } from "../lib/investor-doc-pdf";
import { listQuerySchema, validateBody, validateQuery } from "../lib/validation";
import {
  db,
  holdingsVenturesTable,
  holdingsMilestonesTable,
  holdingsMetricsTable,
  holdingsLeadershipTable,
  holdingsInquiriesTable,
  terraDistressPropertiesTable,
  terraDealsTable,
  vesselsTable,
  vesselsFleetsTable,
  alloyWorkflowRuns,
  alloyWorkflows,
  lyteIncidentsTable,
  firestormIncidentsTable,
  firestormFindingsTable,
  carlotaInquiriesTable,
  auditEventsTable,
} from "@szl-holdings/db";
import { eq, desc, ilike, or, sql, and, isNull, asc } from "drizzle-orm";
import { hashIp } from "@szl-holdings/audit";
import { encrypt, decrypt, isEncrypted } from '../lib/encryption';
import { sendSuccess, sendNotFound, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam, requireRole } from "../middlewares/auth";
import { sendEmail, buildInquiryAckEmail, buildLeadNotificationEmail, INTERNAL_EMAIL } from "../lib/email";

const createVentureSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  slug: z.string().max(100).optional(),
  description: z.string().max(5000).trim().optional(),
  status: z.string().max(50).optional(),
  sector: z.string().max(100).trim().optional(),
  stage: z.string().max(100).trim().optional(),
  foundedYear: z.number().int().min(1900).max(2100).optional().nullable(),
  website: z.string().url().max(2048).optional().nullable(),
  logoUrl: z.string().url().max(2048).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

const patchVentureSchema = createVentureSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createMilestoneSchema = z.object({
  ventureId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(5000).trim().optional(),
  status: z.string().max(50).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  completedAt: z.string().datetime({ offset: true }).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

const createMetricSchema = z.object({
  ventureId: z.number().int().positive().optional().nullable(),
  name: z.string().min(1).max(200).trim(),
  value: z.union([z.number(), z.string()]).optional(),
  unit: z.string().max(100).trim().optional().nullable(),
  period: z.string().max(50).trim().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

const createLeadershipSchema = z.object({
  ventureId: z.number().int().positive().optional().nullable(),
  name: z.string().min(1).max(200).trim(),
  role: z.string().min(1).max(200).trim(),
  bio: z.string().max(5000).trim().optional(),
  avatarUrl: z.string().url().max(2048).optional().nullable(),
  linkedinUrl: z.string().url().max(2048).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const createInquirySchema = z.object({
  name: z.string().min(1, "Name is required").max(200).trim(),
  email: z.string().email("Valid email is required").max(320).trim().toLowerCase(),
  subject: z.string().min(1, "Subject is required").max(500).trim(),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000).trim(),
  company: z.string().max(200).trim().optional(),
  intent: z.string().max(200).trim().optional(),
  source: z.string().max(200).trim().optional(),
  utm_source: z.string().max(200).trim().optional(),
  utm_medium: z.string().max(200).trim().optional(),
  utm_campaign: z.string().max(200).trim().optional(),
  utm_content: z.string().max(200).trim().optional(),
  _hp: z.string().max(200).optional(),
});

const router: IRouter = Router();

router.get("/holdings/health", (_req, res) => {
  res.json({ service: "holdings", status: "ok", timestamp: new Date().toISOString() });
});

let kpiCache: { data: unknown; at: number } | null = null;
const KPI_TTL = 60_000;

router.get("/holdings/kpis", authMiddleware(), async (_req, res) => {
  try {
    if (kpiCache && Date.now() - kpiCache.at < KPI_TTL) {
      res.json(kpiCache.data);
      return;
    }
    const [
      [{ terraDistress }],
      [{ terraDeals }],
      [{ vessels }],
      [{ fleets }],
      [{ workflowRuns }],
      [{ workflows }],
      [{ lyteIncidents }],
      [{ firestormIncidents }],
      [{ firestormFindings }],
      [{ carlotaInquiries }],
    ] = await Promise.all([
      db.select({ terraDistress: sql<number>`count(*)::int` }).from(terraDistressPropertiesTable),
      db.select({ terraDeals: sql<number>`count(*)::int` }).from(terraDealsTable),
      db.select({ vessels: sql<number>`count(*)::int` }).from(vesselsTable),
      db.select({ fleets: sql<number>`count(*)::int` }).from(vesselsFleetsTable),
      db.select({ workflowRuns: sql<number>`count(*)::int` }).from(alloyWorkflowRuns),
      db.select({ workflows: sql<number>`count(*)::int` }).from(alloyWorkflows),
      db.select({ lyteIncidents: sql<number>`count(*)::int` }).from(lyteIncidentsTable),
      db.select({ firestormIncidents: sql<number>`count(*)::int` }).from(firestormIncidentsTable),
      db.select({ firestormFindings: sql<number>`count(*)::int` }).from(firestormFindingsTable),
      db.select({ carlotaInquiries: sql<number>`count(*)::int` }).from(carlotaInquiriesTable),
    ]);
    const payload = {
      checkedAt: new Date().toISOString(),
      platforms: {
        terra: { distressProperties: terraDistress, activeDeals: terraDeals, href: "/terra/" },
        vessels: { trackedVessels: vessels, fleets: fleets, href: "/vessels/" },
        alloy: { workflowRuns: workflowRuns, activeWorkflows: workflows, href: "/alloy/" },
        lyte: { incidents: lyteIncidents, href: "/command/operations/" },
        sentra: { incidents: firestormIncidents, findings: firestormFindings, href: "/sentra/" },
        carlotaJo: { inquiries: carlotaInquiries, href: "/carlota-jo/" },
      },
      aggregate: {
        totalWorkflowRuns: workflowRuns,
        activeIncidents: lyteIncidents + firestormIncidents,
        distressProperties: terraDistress,
        fleetVessels: vessels,
        activeDeals: terraDeals,
        securityFindings: firestormFindings,
      },
    };
    kpiCache = { data: payload, at: Date.now() };
    res.json(payload);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch KPIs");
  }
});

let ecosystemHealthCache: { data: unknown; at: number } | null = null;
const ECOSYSTEM_TTL = 30_000;

type PlatformHealthResult = {
  key: string; name: string; role: string; status: "online" | "degraded"; latencyMs: number; checkedAt: string;
};

async function probePlatform(key: string, name: string, role: string, probe: () => Promise<unknown>): Promise<PlatformHealthResult> {
  const checkedAt = new Date().toISOString();
  const start = Date.now();
  try {
    await probe();
    return { key, name, role, status: "online", latencyMs: Date.now() - start, checkedAt };
  } catch {
    return { key, name, role, status: "degraded", latencyMs: Date.now() - start, checkedAt };
  }
}

router.get("/holdings/ecosystem-health", async (_req, res) => {
  try {
    if (ecosystemHealthCache && Date.now() - ecosystemHealthCache.at < ECOSYSTEM_TTL) {
      res.json(ecosystemHealthCache.data);
      return;
    }
    const results = await Promise.all([
      probePlatform("alloy", "Counsel", "Execution Fabric", () =>
        db.select({ n: sql<number>`count(*)::int` }).from(alloyWorkflows)
      ),
      probePlatform("lyte", "Lyte", "Business Observability", () =>
        db.select({ n: sql<number>`count(*)::int` }).from(lyteIncidentsTable)
      ),
      probePlatform("vessels", "Vessels", "Maritime Command", () =>
        db.select({ n: sql<number>`count(*)::int` }).from(vesselsTable)
      ),
      probePlatform("aegis", "Aegis", "Defense & Intelligence", () =>
        db.select({ n: sql<number>`count(*)::int` }).from(firestormIncidentsTable)
      ),
      probePlatform("terra", "Terra", "Real Estate Intelligence", () =>
        db.select({ n: sql<number>`count(*)::int` }).from(terraDistressPropertiesTable)
      ),
      probePlatform("carlotaJo", "Carlota Jo", "Private Advisory", () =>
        db.select({ n: sql<number>`count(*)::int` }).from(carlotaInquiriesTable)
      ),
    ]);
    const checkedAt = new Date().toISOString();
    const onlineCount = results.filter((p) => p.status === "online").length;
    const payload = {
      checkedAt,
      summary: { total: results.length, online: onlineCount, degraded: results.length - onlineCount },
      platforms: results,
    };
    ecosystemHealthCache = { data: payload, at: Date.now() };
    res.json(payload);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch ecosystem health");
  }
});

let publicSummaryCache: { data: unknown; at: number } | null = null;
const PUBLIC_SUMMARY_TTL = 120_000;

router.get("/holdings/ecosystem-summary", async (_req, res) => {
  try {
    if (publicSummaryCache && Date.now() - publicSummaryCache.at < PUBLIC_SUMMARY_TTL) {
      res.json(publicSummaryCache.data);
      return;
    }
    const [
      [{ alloyRuns }],
      [{ lyteInc }],
      [{ shipCount }],
      [{ fleetCount }],
      [{ aegisInc }],
      [{ aegisFind }],
      [{ propCount }],
      [{ dealCount }],
      [{ cjCount }],
    ] = await Promise.all([
      db.select({ alloyRuns: sql<number>`count(*)::int` }).from(alloyWorkflowRuns),
      db.select({ lyteInc: sql<number>`count(*)::int` }).from(lyteIncidentsTable),
      db.select({ shipCount: sql<number>`count(*)::int` }).from(vesselsTable),
      db.select({ fleetCount: sql<number>`count(*)::int` }).from(vesselsFleetsTable),
      db.select({ aegisInc: sql<number>`count(*)::int` }).from(firestormIncidentsTable),
      db.select({ aegisFind: sql<number>`count(*)::int` }).from(firestormFindingsTable),
      db.select({ propCount: sql<number>`count(*)::int` }).from(terraDistressPropertiesTable),
      db.select({ dealCount: sql<number>`count(*)::int` }).from(terraDealsTable),
      db.select({ cjCount: sql<number>`count(*)::int` }).from(carlotaInquiriesTable),
    ]);
    const payload = {
      checkedAt: new Date().toISOString(),
      alloy: { workflowRuns: alloyRuns },
      lyte: { incidents: lyteInc },
      vessels: { trackedVessels: shipCount, fleets: fleetCount },
      aegis: { incidents: aegisInc, findings: aegisFind },
      terra: { distressProperties: propCount, activeDeals: dealCount },
      carlotaJo: { inquiries: cjCount },
    };
    publicSummaryCache = { data: payload, at: Date.now() };
    res.json(payload);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch ecosystem summary");
  }
});

/**
 * GET /api/holdings/venture-health
 *
 * Returns curated health scores for each SZL portfolio company, enriched
 * with live DB signal counts (vessel coverage, incident counts, deal flow, etc.).
 * Scores are analyst-curated baselines; live signals are used to compute a
 * "signal delta" overlay shown on the radar chart.
 *
 * AUTH: Intentionally unauthenticated — this endpoint is used by the SZL Holdings
 * investor-facing health radar which is accessible in demo mode (?view=app bypass
 * via PrivateAppGuard). Read-only aggregate counts; no PII or sensitive fields exposed.
 * If auth scope expands beyond demo, add authMiddleware() here.
 */
let ventureHealthCache: { data: unknown; at: number } | null = null;
const VENTURE_HEALTH_TTL = 60_000;

router.get("/holdings/venture-health", async (_req, res) => {
  try {
    if (ventureHealthCache && Date.now() - ventureHealthCache.at < VENTURE_HEALTH_TTL) {
      res.json(ventureHealthCache.data);
      return;
    }
    const [
      [{ shipCount }],
      [{ lyteInc }],
      [{ aegisInc }],
      [{ aegisFind }],
      [{ dealCount }],
      [{ cjCount }],
    ] = await Promise.all([
      db.select({ shipCount: sql<number>`count(*)::int` }).from(vesselsTable),
      db.select({ lyteInc: sql<number>`count(*)::int` }).from(lyteIncidentsTable),
      db.select({ aegisInc: sql<number>`count(*)::int` }).from(firestormIncidentsTable),
      db.select({ aegisFind: sql<number>`count(*)::int` }).from(firestormFindingsTable),
      db.select({ dealCount: sql<number>`count(*)::int` }).from(terraDealsTable),
      db.select({ cjCount: sql<number>`count(*)::int` }).from(carlotaInquiriesTable),
    ]);
    const payload = {
      checkedAt: new Date().toISOString(),
      signals: {
        lyte: { incidents: lyteInc },
        vessels: { trackedVessels: shipCount },
        aegis: { incidents: aegisInc, findings: aegisFind },
        terra: { activeDeals: dealCount },
        carlota: { inquiries: cjCount },
      },
    };
    ventureHealthCache = { data: payload, at: Date.now() };
    res.json(payload);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch venture health");
  }
});

let fundamentalsCache: { data: unknown; at: number } | null = null;
const FUNDAMENTALS_TTL = 60_000;

router.get("/holdings/fundamentals", async (_req, res) => {
  try {
    if (fundamentalsCache && Date.now() - fundamentalsCache.at < FUNDAMENTALS_TTL) {
      res.json(fundamentalsCache.data);
      return;
    }
    const rows = await db
      .select()
      .from(holdingsMetricsTable)
      .where(and(eq(holdingsMetricsTable.category, "fundamentals"), isNull(holdingsMetricsTable.ventureId)))
      .orderBy(asc(holdingsMetricsTable.id));
    const fundamentals = rows.map((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      return {
        label: r.label,
        value: r.value,
        note: typeof meta.note === "string" ? (meta.note as string) : "",
      };
    });
    const payload = {
      checkedAt: new Date().toISOString(),
      seeded: fundamentals.length > 0,
      fundamentals,
    };
    fundamentalsCache = { data: payload, at: Date.now() };
    res.json(payload);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch fundamentals");
  }
});

const investorContentCache = new Map<string, { data: unknown; at: number }>();
const INVESTOR_CONTENT_TTL = 60_000;
const INVESTOR_CONTENT_SLUGS = new Set([
  "overview",
  "architecture",
  "moat",
  "roadmap",
  "trust",
  "founder",
]);

router.get("/holdings/investor-content", async (req, res) => {
  try {
    const slug = String(req.query.slug ?? "").trim().toLowerCase();
    if (!slug || !INVESTOR_CONTENT_SLUGS.has(slug)) {
      res.status(400).json({ error: "Invalid or missing slug" });
      return;
    }
    const cached = investorContentCache.get(slug);
    if (cached && Date.now() - cached.at < INVESTOR_CONTENT_TTL) {
      res.json(cached.data);
      return;
    }
    const [row] = await db
      .select()
      .from(holdingsMetricsTable)
      .where(
        and(
          eq(holdingsMetricsTable.category, "investor-content"),
          eq(holdingsMetricsTable.label, slug),
          isNull(holdingsMetricsTable.ventureId),
        ),
      )
      .limit(1);
    const meta = (row?.metadata ?? {}) as Record<string, unknown>;
    const content = meta && typeof meta === "object" && meta.content && typeof meta.content === "object"
      ? (meta.content as Record<string, unknown>)
      : null;
    const payload = {
      checkedAt: new Date().toISOString(),
      slug,
      seeded: Boolean(content),
      content,
    };
    investorContentCache.set(slug, { data: payload, at: Date.now() });
    res.json(payload);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch investor content");
  }
});

router.get("/holdings/ventures", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(holdingsVenturesTable).orderBy(desc(holdingsVenturesTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(holdingsVenturesTable);
    res.json({ data: rows, meta: { page, limit, total: count } });
  } catch (err) {
    handleRouteError(res, err, "Failed to list ventures");
  }
});

router.get("/holdings/ventures/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(holdingsVenturesTable).where(eq(holdingsVenturesTable.id, id));
    if (!row) { res.status(404).json({ error: "Venture not found" }); return; }
    res.json({ data: row });
  } catch (err) {
    handleRouteError(res, err, "Failed to get venture");
  }
});

router.post("/holdings/ventures", authMiddleware(), validateBody(createVentureSchema), async (req, res) => {
  try {
    const [row] = await db.insert(holdingsVenturesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create venture");
  }
});

router.patch("/holdings/ventures/:id", authMiddleware(), validateBody(patchVentureSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(holdingsVenturesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(holdingsVenturesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Venture"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update venture");
  }
});

router.delete("/holdings/ventures/:id", validateBody(bodyShape({})), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(holdingsVenturesTable).where(eq(holdingsVenturesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Venture"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete venture");
  }
});

router.get("/holdings/milestones", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(holdingsMilestonesTable).orderBy(desc(holdingsMilestonesTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(holdingsMilestonesTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list milestones");
  }
});

router.post("/holdings/milestones", authMiddleware(), validateBody(createMilestoneSchema), async (req, res) => {
  try {
    const [row] = await db.insert(holdingsMilestonesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create milestone");
  }
});

router.delete("/holdings/milestones/:id", validateBody(bodyShape({})), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(holdingsMilestonesTable).where(eq(holdingsMilestonesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Milestone"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete milestone");
  }
});

router.get("/holdings/metrics", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const ventureId = req.query.ventureId ? parseInt(String(req.query.ventureId), 10) : undefined;
    let query = db.select().from(holdingsMetricsTable);
    if (ventureId) {
      query = query.where(eq(holdingsMetricsTable.ventureId, ventureId)) as typeof query;
    }
    const rows = await query.orderBy(desc(holdingsMetricsTable.createdAt)).limit(limit).offset(offset);
    const countQuery = ventureId
      ? db.select({ count: sql<number>`count(*)::int` }).from(holdingsMetricsTable).where(eq(holdingsMetricsTable.ventureId, ventureId))
      : db.select({ count: sql<number>`count(*)::int` }).from(holdingsMetricsTable);
    const [{ count }] = await countQuery;
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list metrics");
  }
});

router.post("/holdings/metrics", authMiddleware(), validateBody(createMetricSchema), async (req, res) => {
  try {
    const [row] = await db.insert(holdingsMetricsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create metric");
  }
});

router.delete("/holdings/metrics/:id", validateBody(bodyShape({})), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(holdingsMetricsTable).where(eq(holdingsMetricsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Metric"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete metric");
  }
});

router.get("/holdings/leadership", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(holdingsLeadershipTable).orderBy(holdingsLeadershipTable.sortOrder).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(holdingsLeadershipTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list leadership");
  }
});

router.post("/holdings/leadership", authMiddleware(), validateBody(createLeadershipSchema), async (req, res) => {
  try {
    const [row] = await db.insert(holdingsLeadershipTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create leadership entry");
  }
});

router.delete("/holdings/leadership/:id", validateBody(bodyShape({})), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(holdingsLeadershipTable).where(eq(holdingsLeadershipTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Leadership"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete leadership entry");
  }
});

router.get("/holdings/inquiries", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(holdingsInquiriesTable).orderBy(desc(holdingsInquiriesTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(holdingsInquiriesTable);
    const decryptedRows = rows.map((row) => ({
      ...row,
      name: isEncrypted(row.name) ? (decrypt(row.name) ?? row.name) : row.name,
      email: isEncrypted(row.email) ? (decrypt(row.email) ?? row.email) : row.email,
    }));
    sendSuccess(res, decryptedRows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list inquiries");
  }
});

const inquiryRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many inquiry submissions. Please try again later." },
});

router.post("/holdings/inquiries", inquiryRateLimit, validateBody(createInquirySchema), (req, res) => {
  if ((req.body as z.infer<typeof createInquirySchema>)._hp) {
    res.status(400).json({ success: false, error: "Bot submission detected" });
    return;
  }
  const { name, email, subject, message, company, intent, source, utm_source, utm_medium, utm_campaign, utm_content } = req.body as z.infer<typeof createInquirySchema>;

  const metadata: Record<string, string> = {};
  if (intent) metadata.intent = intent;
  if (source) metadata.source = source;

  db.insert(holdingsInquiriesTable).values({
    name: encrypt(name) ?? name,
    email: encrypt(email) ?? email,
    company: company ?? null,
    subject, message,
    utmSource: utm_source ?? null,
    utmMedium: utm_medium ?? null,
    utmCampaign: utm_campaign ?? null,
    utmContent: utm_content ?? null,
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  }).returning().then(([row]) => {
    const respName = isEncrypted(row.name) ? (decrypt(row.name) ?? row.name) : row.name;
    const respEmail = isEncrypted(row.email) ? (decrypt(row.email) ?? row.email) : row.email;
    res.status(201).json({ success: true, data: { ...row, name: respName, email: respEmail } });
    setImmediate(async () => {
      try {
        await sendEmail({
          to: email,
          subject: "We received your inquiry — SZL Holdings",
          html: buildInquiryAckEmail(name, subject),
        });
        await sendEmail({
          to: INTERNAL_EMAIL,
          subject: `New Inquiry: ${subject} — from ${name}`,
          html: buildLeadNotificationEmail({
            name, email,
            company,
            subject, message,
            intent,
            source,
            utm_source,
            utm_medium,
            utm_campaign,
            utm_content,
          }),
          replyTo: email,
        });
      } catch (emailErr) {
        logger.warn({ err: emailErr }, "[holdings] Email send failed (non-blocking)");
      }
    });
  }).catch(err => {
    handleRouteError(res, err, "Failed to create inquiry");
  });
});

router.delete("/holdings/inquiries/:id", validateBody(bodyShape({})), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(holdingsInquiriesTable).where(eq(holdingsInquiriesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Inquiry"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete inquiry");
  }
});

router.get("/holdings/search", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const query = (req.query.q as string) || "";
    if (!query) { res.json({ data: [], meta: { page: 1, limit: 25, total: 0 } }); return; }
    const pattern = `%${query}%`;
    const results = await db.select().from(holdingsVenturesTable).where(
      or(ilike(holdingsVenturesTable.name, pattern), ilike(holdingsVenturesTable.description, pattern))
    );
    res.json({ data: results, meta: { page: 1, limit: 25, total: results.length } });
  } catch (err) {
    handleRouteError(res, err, "Failed to search");
  }
});

const INVESTOR_DOCS_DIR = join(__dirname, "../data/investor-docs");

interface InvestorDocMeta {
  filename: string;
  title: string;
  subtitle: string;
}

const INVESTOR_DOC_MANIFEST: Record<string, InvestorDocMeta> = {
  "platform-overview": {
    filename: "PLATFORM-OVERVIEW.md",
    title: "Platform Overview",
    subtitle: "What SZL Holdings builds and why the architecture is different",
  },
  "product-matrix": {
    filename: "PRODUCT-MATRIX.md",
    title: "Product Matrix",
    subtitle: "All domain platforms, audiences, and strategic roles",
  },
  "founder-summary": {
    filename: "FOUNDER-SUMMARY.md",
    title: "Founder Executive Summary",
    subtitle: "Founder narrative, investment thesis, and Series A rationale",
  },
  "launch-readiness": {
    filename: "LAUNCH-READINESS-SCORECARD.md",
    title: "Launch Readiness Scorecard",
    subtitle: "Scored readiness across 8 operational dimensions — before and after",
  },
  "system-overview": {
    filename: "SYSTEM-OVERVIEW.md",
    title: "System Overview",
    subtitle: "Platform summary for technical evaluators",
  },
  "architecture": {
    filename: "ARCHITECTURE.md",
    title: "Architecture Specifications",
    subtitle: "Stack topology, service boundaries, and data flows",
  },
  "product-surfaces": {
    filename: "PRODUCT-SURFACES.md",
    title: "Product Surfaces",
    subtitle: "All surfaces, their audiences, and feature sets",
  },
  "data-model": {
    filename: "DATA-MODEL.md",
    title: "Data Model",
    subtitle: "Schema domains, key tables, and tenant isolation",
  },
  "api-spec": {
    filename: "API-SPEC.md",
    title: "API Specification",
    subtitle: "Endpoints, auth flows, and GraphQL schema",
  },
  "access-control": {
    filename: "ACCESS-CONTROL-MATRIX.md",
    title: "Access Control Matrix",
    subtitle: "Role definitions, permission boundaries, and RBAC",
  },
  "security-checklist": {
    filename: "SECURITY-CHECKLIST.md",
    title: "Security Checklist",
    subtitle: "Hardening status, audit findings, and compliance posture",
  },
  "deployment-guide": {
    filename: "DEPLOYMENT-GUIDE.md",
    title: "Deployment Guide",
    subtitle: "Infrastructure, CI/CD, and environment configuration",
  },
  "operations-runbook": {
    filename: "OPERATIONS-RUNBOOK.md",
    title: "Operations Runbook",
    subtitle: "Incident response, alerting, and on-call procedures",
  },
  "analytics-events": {
    filename: "ANALYTICS-EVENTS.md",
    title: "Analytics Events",
    subtitle: "Event taxonomy, instrumentation, and tracking plan",
  },
  "known-gaps": {
    filename: "KNOWN-GAPS.md",
    title: "Known Gaps",
    subtitle: "Open risks, remediation status, and sprint owners",
  },
  "technical-due-diligence": {
    filename: "TECHNICAL-DUE-DILIGENCE-PACKET.md",
    title: "Technical Due Diligence Packet",
    subtitle: "Structured technical due diligence for Series A investors and institutional evaluators",
  },
};

const INVESTOR_NDA_ACTION = "investor_nda_accepted";

function extractDocSections(content: string): Array<{ heading: string; text: string }> {
  const lines = content.split("\n");
  const sections: Array<{ heading: string; text: string }> = [];
  let currentHeading = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = /^#{1,4}\s+(.+)$/.exec(line);
    if (headingMatch) {
      if (currentLines.length > 0) {
        sections.push({ heading: currentHeading, text: currentLines.join(" ").replace(/\s+/g, " ").trim() });
      }
      currentHeading = headingMatch[1]?.trim();
      currentLines = [];
    } else {
      const stripped = line.replace(/[`*_~|[\]()]/g, " ").trim();
      if (stripped) currentLines.push(stripped);
    }
  }
  if (currentLines.length > 0) {
    sections.push({ heading: currentHeading, text: currentLines.join(" ").replace(/\s+/g, " ").trim() });
  }
  return sections;
}

function buildExcerpt(text: string, query: string, window = 160): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, window).trim() + (text.length > window ? "…" : "");
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 100);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return prefix + text.slice(start, end).trim() + suffix;
}

export interface DocSearchResult {
  docId: string;
  docTitle: string;
  heading: string;
  excerpt: string;
}

router.get("/investors/search", authMiddleware(), requireRole("admin", "exec", "analyst"), async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  try {
    const [ndaRecord] = await db
      .select({ id: auditEventsTable.id })
      .from(auditEventsTable)
      .where(and(eq(auditEventsTable.userId, userId), eq(auditEventsTable.action, INVESTOR_NDA_ACTION)))
      .limit(1);
    if (!ndaRecord) {
      res.status(403).json({ error: "NDA acceptance required", code: "NDA_REQUIRED" });
      return;
    }
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q || q.length < 2) {
      res.json({ data: [] });
      return;
    }
    const results: DocSearchResult[] = [];
    for (const [docId, meta] of Object.entries(INVESTOR_DOC_MANIFEST)) {
      let content: string;
      try {
        content = readFileSync(join(INVESTOR_DOCS_DIR, meta.filename), "utf-8");
      } catch {
        continue;
      }
      const sections = extractDocSections(content);
      for (const section of sections) {
        const searchable = (`${section.heading} ${section.text}`).toLowerCase();
        if (searchable.includes(q.toLowerCase())) {
          results.push({
            docId,
            docTitle: meta.title,
            heading: section.heading,
            excerpt: buildExcerpt(section.text || section.heading, q),
          });
          if (results.filter((r) => r.docId === docId).length >= 3) break;
        }
      }
      if (results.length >= 20) break;
    }
    res.json({ data: results });
  } catch (err) {
    logger.error({ err }, "Failed to search investor docs");
    res.status(500).json({ error: "Failed to search documents" });
  }
});

router.get("/investors/nda/status", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }
    const [record] = await db
      .select({ id: auditEventsTable.id, createdAt: auditEventsTable.createdAt })
      .from(auditEventsTable)
      .where(and(eq(auditEventsTable.userId, userId), eq(auditEventsTable.action, INVESTOR_NDA_ACTION)))
      .orderBy(desc(auditEventsTable.createdAt))
      .limit(1);
    res.json({ data: { accepted: Boolean(record), acceptedAt: record?.createdAt ?? null } });
  } catch (err) {
    logger.error({ err }, "Failed to check NDA status");
    res.status(500).json({ error: "Failed to check NDA status" });
  }
});

router.post("/investors/nda/accept", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }
    await db.insert(auditEventsTable).values({
      userId,
      action: INVESTOR_NDA_ACTION,
      entityType: "investor_data_room",
      entityId: "data-room-nda",
      ipAddress: hashIp(req.ip ?? null),
      userAgent: req.headers["user-agent"] ?? null,
      newValues: { acceptedAt: new Date().toISOString(), userAgent: req.headers["user-agent"] ?? null },
    });
    res.json({ data: { accepted: true } });
  } catch (err) {
    logger.error({ err }, "Failed to record NDA acceptance");
    res.status(500).json({ error: "Failed to record NDA acceptance" });
  }
});

router.get("/investors/docs", authMiddleware(), requireRole("admin", "exec", "analyst"), async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  try {
    const [ndaRecord] = await db
      .select({ id: auditEventsTable.id })
      .from(auditEventsTable)
      .where(and(eq(auditEventsTable.userId, userId), eq(auditEventsTable.action, INVESTOR_NDA_ACTION)))
      .limit(1);
    if (!ndaRecord) {
      res.status(403).json({ error: "NDA acceptance required", code: "NDA_REQUIRED" });
      return;
    }
    const docs = Object.entries(INVESTOR_DOC_MANIFEST).map(([id, meta]) => ({ id, filename: meta.filename, title: meta.title }));
    res.json({ data: docs });
  } catch (err) {
    logger.error({ err }, "Failed to list investor docs");
    res.status(500).json({ error: "Failed to list investor docs" });
  }
});

router.get("/investors/docs/:id", authMiddleware(), requireRole("admin", "exec", "analyst"), async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  try {
    const [ndaRecord] = await db
      .select({ id: auditEventsTable.id })
      .from(auditEventsTable)
      .where(and(eq(auditEventsTable.userId, userId), eq(auditEventsTable.action, INVESTOR_NDA_ACTION)))
      .limit(1);
    if (!ndaRecord) {
      res.status(403).json({ error: "NDA acceptance required", code: "NDA_REQUIRED" });
      return;
    }
    const id = req.params.id as string;
    const meta = INVESTOR_DOC_MANIFEST[id];
    if (!meta) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    const content = readFileSync(join(INVESTOR_DOCS_DIR, meta.filename), "utf-8");
    res.json({ data: { id, filename: meta.filename, content } });
  } catch (err) {
    logger.error({ err, id: req.params.id }, "Failed to read investor doc");
    res.status(500).json({ error: "Failed to read document" });
  }
});

router.get("/investors/docs/:id/download", authMiddleware(), requireRole("admin", "exec", "analyst"), async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  try {
    const [ndaRecord] = await db
      .select({ id: auditEventsTable.id })
      .from(auditEventsTable)
      .where(and(eq(auditEventsTable.userId, userId), eq(auditEventsTable.action, INVESTOR_NDA_ACTION)))
      .limit(1);
    if (!ndaRecord) {
      res.status(403).json({ error: "NDA acceptance required", code: "NDA_REQUIRED" });
      return;
    }
    const id = req.params.id as string;
    const meta = INVESTOR_DOC_MANIFEST[id];
    if (!meta) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    const content = readFileSync(join(INVESTOR_DOCS_DIR, meta.filename), "utf-8");
    const downloadName = meta.filename.replace(".md", ".pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    await db.insert(auditEventsTable).values({
      userId,
      action: "investor_doc_downloaded",
      entityType: "investor_data_room",
      entityId: id,
      ipAddress: hashIp(req.ip ?? null),
      userAgent: req.headers["user-agent"] ?? null,
      newValues: { docId: id, filename: meta.filename, format: "pdf" },
    });
    const pdfStream = generateInvestorDocPdf(content, meta.title, meta.subtitle);
    pdfStream.pipe(res);
    pdfStream.on("error", (err) => {
      logger.error({ err, id }, "PDF generation stream error");
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    });
  } catch (err) {
    logger.error({ err, id: req.params.id }, "Failed to download investor doc");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to download document" });
    }
  }
});

const demoRequestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(300),
  company: z.string().min(1).max(300),
  role: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
});

const INVESTOR_NOTIFY_EMAIL = process.env.SZL_INVESTORS_EMAIL || "investors@szlholdings.com";

router.post("/investors/demo-request", authMiddleware(), validateBody(demoRequestSchema), async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  const name = String(req.body.name).trim();
  const email = String(req.body.email).trim();
  const company = String(req.body.company).trim();
  const role = req.body.role ? String(req.body.role).trim() : null;
  const message = req.body.message ? String(req.body.message).trim() : null;
  const subject = `Investor Demo Request — ${company} — ${name}`;

  try {
    await db.insert(auditEventsTable).values({
      userId,
      action: "investor_demo_requested",
      entityType: "investor_data_room",
      entityId: "demo-request",
      ipAddress: hashIp(req.ip ?? null),
      userAgent: req.headers["user-agent"] ?? null,
      newValues: {
        name,
        email,
        company,
        role,
        message,
        requestedAt: new Date().toISOString(),
      },
    });
    logger.info({ email, company }, "Investor demo request received");
    res.json({ data: { submitted: true } });

    // Fire-and-forget email notifications: ack to requester + lead alert to investors inbox.
    setImmediate(async () => {
      try {
        await sendEmail({
          to: email,
          subject: `We received your demo request — SZL Holdings`,
          html: buildInquiryAckEmail(name, subject),
        });
      } catch (emailErr) {
        logger.warn({ err: emailErr, email }, "[investors/demo-request] Ack email send failed (non-blocking)");
      }
      try {
        await sendEmail({
          to: INVESTOR_NOTIFY_EMAIL,
          subject,
          html: buildLeadNotificationEmail({
            name,
            email,
            company,
            subject,
            message: [
              role ? `Role: ${role}` : null,
              message ? `Context: ${message}` : null,
            ].filter(Boolean).join("\n") || "(no additional context provided)",
            source: "investor-data-room",
          }),
          replyTo: email,
        });
      } catch (emailErr) {
        logger.warn({ err: emailErr, to: INVESTOR_NOTIFY_EMAIL }, "[investors/demo-request] Lead notification email failed (non-blocking)");
      }
    });
  } catch (err) {
    logger.error({ err }, "Failed to record investor demo request");
    res.status(500).json({ error: "Failed to submit demo request" });
  }
});

const inquirySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(300),
  company: z.string().min(1).max(300),
  role: z.string().max(100).optional(),
  materialsRequested: z.array(z.string()).min(1),
  context: z.string().max(2000).optional(),
});

router.post("/investors/inquiry", authMiddleware(), validateBody(inquirySchema), async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  try {
    await db.insert(auditEventsTable).values({
      userId,
      action: "investor_deeper_access_requested",
      entityType: "investor_data_room",
      entityId: "access-inquiry",
      ipAddress: hashIp(req.ip ?? null),
      userAgent: req.headers["user-agent"] ?? null,
      newValues: {
        name: req.body.name,
        email: req.body.email,
        company: req.body.company,
        role: req.body.role ?? null,
        materialsRequested: req.body.materialsRequested,
        context: req.body.context ?? null,
        requestedAt: new Date().toISOString(),
      },
    });
    logger.info({ email: req.body.email, materials: req.body.materialsRequested }, "Investor deeper access inquiry received");
    res.json({ data: { submitted: true } });
  } catch (err) {
    logger.error({ err }, "Failed to record investor inquiry");
    res.status(500).json({ error: "Failed to submit inquiry" });
  }
});

export default router;
