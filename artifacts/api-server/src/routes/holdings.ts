import { Router, type IRouter } from "express";
import {
  db,
  holdingsVenturesTable,
  holdingsMilestonesTable,
  holdingsMetricsTable,
  holdingsLeadershipTable,
  holdingsInquiriesTable,
} from "@workspace/db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError, sendBadRequest, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/holdings/health", (_req, res) => {
  res.json({ service: "holdings", status: "ok", timestamp: new Date().toISOString() });
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

router.post("/holdings/ventures", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(holdingsVenturesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create venture");
  }
});

router.patch("/holdings/ventures/:id", authMiddleware(), async (req, res) => {
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

router.post("/holdings/milestones", authMiddleware(), async (req, res) => {
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

router.post("/holdings/metrics", authMiddleware(), async (req, res) => {
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

router.post("/holdings/leadership", authMiddleware(), async (req, res) => {
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

router.post("/holdings/inquiries", (req, res) => {
  const { name, email, subject, message, company } = req.body || {};
  const errors: string[] = [];
  if (!name || typeof name !== "string" || !name.trim()) errors.push("Name is required");
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required");
  if (!subject || typeof subject !== "string" || !subject.trim()) errors.push("Subject is required");
  if (!message || typeof message !== "string" || message.trim().length < 10) errors.push("Message must be at least 10 characters");
  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  db.insert(holdingsInquiriesTable).values({
    name: name.trim(), email: email.trim(),
    company: typeof company === "string" ? company.trim() : null,
    subject: subject.trim(), message: message.trim(),
  }).returning().then(([row]) => {
    res.status(201).json({ success: true, data: row });
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
