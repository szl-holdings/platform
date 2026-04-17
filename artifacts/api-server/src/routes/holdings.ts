import { Router, type IRouter } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";
import { validateBody } from "../lib/validation";
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
  carlotaReservationsTable,
} from "@szl-holdings/db";
import { eq, desc, ilike, or, sql, count } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
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
        aegis: { incidents: firestormIncidents, findings: firestormFindings, href: "/aegis/" },
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
      probePlatform("alloy", "Alloy", "Execution Fabric", () =>
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

router.get("/holdings/ventures", async (req, res) => {
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

router.delete("/holdings/ventures/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(holdingsVenturesTable).where(eq(holdingsVenturesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Venture"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete venture");
  }
});

router.get("/holdings/milestones", async (req, res) => {
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

router.delete("/holdings/milestones/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(holdingsMilestonesTable).where(eq(holdingsMilestonesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Milestone"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete milestone");
  }
});

router.get("/holdings/metrics", async (req, res) => {
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

router.delete("/holdings/metrics/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(holdingsMetricsTable).where(eq(holdingsMetricsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Metric"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete metric");
  }
});

router.get("/holdings/leadership", async (req, res) => {
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

router.delete("/holdings/leadership/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(holdingsLeadershipTable).where(eq(holdingsLeadershipTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Leadership"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete leadership entry");
  }
});

router.get("/holdings/inquiries", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(holdingsInquiriesTable).orderBy(desc(holdingsInquiriesTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(holdingsInquiriesTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list inquiries");
  }
});

router.post("/holdings/inquiries", validateBody(createInquirySchema), (req, res) => {
  const { name, email, subject, message, company, intent, source } = req.body as z.infer<typeof createInquirySchema>;

  const metadata: Record<string, string> = {};
  if (intent) metadata.intent = intent;
  if (source) metadata.source = source;

  db.insert(holdingsInquiriesTable).values({
    name, email,
    company: company ?? null,
    subject, message,
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  }).returning().then(([row]) => {
    res.status(201).json({ success: true, data: row });
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

router.delete("/holdings/inquiries/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(holdingsInquiriesTable).where(eq(holdingsInquiriesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Inquiry"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete inquiry");
  }
});

router.get("/holdings/search", async (req, res) => {
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

export default router;
