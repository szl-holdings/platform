import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import {
  db,
  lyteWorkspacesTable,
  lyteSignalsTable,
  lyteCommandCardsTable,
  lyteIncidentsTable,
  lytePlaybooksTable,
  lyteRecommendationsTable,
  lyteActionsTable,
  lyteSavedViewsTable,
  lyteReadinessItemsTable,
} from "@szl-holdings/db";
import { eq, desc, sql } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam, denyIfReadOnly, requireRole } from "../middlewares/auth";
import { broadcastWs } from "../lib/pubsub-bridge.js";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/lyte/workspaces", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(lyteWorkspacesTable).orderBy(desc(lyteWorkspacesTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lyteWorkspacesTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list workspaces");
  }
});

router.post("/lyte/workspaces", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteWorkspacesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create workspace");
  }
});

router.get("/lyte/workspaces/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(lyteWorkspacesTable).where(eq(lyteWorkspacesTable.id, id));
    if (!row) { sendNotFound(res, "Workspace"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get workspace");
  }
});

router.get("/lyte/signals", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(lyteSignalsTable).orderBy(desc(lyteSignalsTable.receivedAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lyteSignalsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list signals");
  }
});

router.post("/lyte/signals", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteSignalsTable).values(req.body).returning();
    broadcastWs("lyte-metrics", "signal-created", { id: row.id, type: row.sourceType, severity: row.severity });
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create signal");
  }
});

router.patch("/lyte/signals/:id", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteSignalsTable).set(req.body).where(eq(lyteSignalsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Signal"); return; }
    broadcastWs("lyte-metrics", "signal-updated", { id: row.id, type: row.sourceType, severity: row.severity });
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update signal");
  }
});

router.delete("/lyte/signals/:id", authMiddleware(), requireRole("ops", "admin", "super_admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(lyteSignalsTable).where(eq(lyteSignalsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Signal"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete signal");
  }
});

router.get("/lyte/command-cards", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(lyteCommandCardsTable).orderBy(desc(lyteCommandCardsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lyteCommandCardsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list command cards");
  }
});

router.post("/lyte/command-cards", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteCommandCardsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create command card");
  }
});

router.patch("/lyte/command-cards/:id", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteCommandCardsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lyteCommandCardsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Command card"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update command card");
  }
});

router.delete("/lyte/command-cards/:id", authMiddleware(), requireRole("ops", "admin", "super_admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(lyteCommandCardsTable).where(eq(lyteCommandCardsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Command card"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete command card");
  }
});

router.get("/lyte/incidents", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(lyteIncidentsTable).orderBy(desc(lyteIncidentsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lyteIncidentsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list incidents");
  }
});

router.post("/lyte/incidents", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteIncidentsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create incident");
  }
});

router.patch("/lyte/incidents/:id", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteIncidentsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lyteIncidentsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Incident"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update incident");
  }
});

router.delete("/lyte/incidents/:id", authMiddleware(), requireRole("ops", "admin", "super_admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(lyteIncidentsTable).where(eq(lyteIncidentsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Incident"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete incident");
  }
});

router.get("/lyte/playbooks", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(lytePlaybooksTable).orderBy(desc(lytePlaybooksTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lytePlaybooksTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list playbooks");
  }
});

router.post("/lyte/playbooks", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lytePlaybooksTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create playbook");
  }
});

router.get("/lyte/playbooks/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(lytePlaybooksTable).where(eq(lytePlaybooksTable.id, id));
    if (!row) { sendNotFound(res, "Playbook"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get playbook");
  }
});

router.patch("/lyte/playbooks/:id", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lytePlaybooksTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lytePlaybooksTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Playbook"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update playbook");
  }
});

router.delete("/lyte/playbooks/:id", authMiddleware(), requireRole("ops", "admin", "super_admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(lytePlaybooksTable).where(eq(lytePlaybooksTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Playbook"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete playbook");
  }
});

router.get("/lyte/recommendations", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(lyteRecommendationsTable).orderBy(desc(lyteRecommendationsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lyteRecommendationsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list recommendations");
  }
});

router.post("/lyte/recommendations", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteRecommendationsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create recommendation");
  }
});

router.patch("/lyte/recommendations/:id", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteRecommendationsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lyteRecommendationsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Recommendation"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update recommendation");
  }
});

router.delete("/lyte/recommendations/:id", authMiddleware(), requireRole("ops", "admin", "super_admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(lyteRecommendationsTable).where(eq(lyteRecommendationsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Recommendation"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete recommendation");
  }
});

router.get("/lyte/executive-summary", authMiddleware(), async (_req, res) => {
  try {
    const [signals, incidents, recommendations, commandCards] = await Promise.all([
      db.select().from(lyteSignalsTable).orderBy(desc(lyteSignalsTable.receivedAt)).catch((err): { id: number; status: string; severity: string; [key: string]: unknown }[] => { logger.warn({ err, table: "lyte_signals" }, "[executive-summary] lyte_signals query failed — returning empty"); return []; }),
      db.select().from(lyteIncidentsTable).orderBy(desc(lyteIncidentsTable.createdAt)).catch((err): { id: number; status: string; [key: string]: unknown }[] => { logger.warn({ err, table: "lyte_incidents" }, "[executive-summary] lyte_incidents query failed — returning empty"); return []; }),
      db.select().from(lyteRecommendationsTable).orderBy(desc(lyteRecommendationsTable.createdAt)).catch((err): { id: number; status: string; [key: string]: unknown }[] => { logger.warn({ err, table: "lyte_recommendations" }, "[executive-summary] lyte_recommendations query failed — returning empty"); return []; }),
      db.select().from(lyteCommandCardsTable).orderBy(desc(lyteCommandCardsTable.createdAt)).catch((err): { id: number; status: string; [key: string]: unknown }[] => { logger.warn({ err, table: "lyte_command_cards" }, "[executive-summary] lyte_command_cards query failed — returning empty"); return []; }),
    ]);

    const openIncidents = incidents.filter(i => !["resolved", "closed"].includes(i.status));
    const criticalSignals = signals.filter(s => s.severity === "critical" && s.status === "new");
    const pendingRecs = recommendations.filter(r => r.status === "suggested");
    const activeCards = commandCards.filter(c => !["completed", "deferred"].includes(c.status));

    sendSuccess(res, {
      totalSignals: signals.length,
      criticalSignalCount: criticalSignals.length,
      openIncidentCount: openIncidents.length,
      pendingRecommendationCount: pendingRecs.length,
      activeCommandCardCount: activeCards.length,
      recentSignals: signals.slice(0, 5),
      recentIncidents: incidents.slice(0, 5),
      topRecommendations: pendingRecs.slice(0, 5),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build executive summary");
  }
});

router.get("/lyte/actions", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const role = req.query.role as string | undefined;
    const state = req.query.state as string | undefined;
    const rows = await db.select().from(lyteActionsTable).orderBy(desc(lyteActionsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(lyteActionsTable);
    const filtered = rows.filter(r => {
      if (state && r.state !== state) return false;
      if (role) {
        const rv = r.roleVisibility as Record<string, boolean> | null;
        if (rv && !rv[role]) return false;
      }
      return true;
    });
    sendSuccess(res, filtered, 200, { page, limit, total: count });
  } catch (err) { handleRouteError(res, err, "Failed to list actions"); }
});

router.post("/lyte/actions", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteActionsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create action"); }
});

router.patch("/lyte/actions/:id", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const current = await db.select().from(lyteActionsTable).where(eq(lyteActionsTable.id, id)).limit(1);
    if (!current[0]) { sendNotFound(res, "Action"); return; }

    const { state, assignedTo, notes, ...rest } = req.body;
    const stateHistory = (current[0].stateHistory as Array<{ from: string; to: string; at: string }>) ?? [];
    if (state && state !== current[0].state) {
      stateHistory.push({ from: current[0].state, to: state, at: new Date().toISOString() });
    }

    const [row] = await db.update(lyteActionsTable).set({
      ...rest,
      ...(state ? { state } : {}),
      ...(assignedTo !== undefined ? { assignedTo } : {}),
      ...(notes !== undefined ? { notes } : {}),
      stateHistory,
      updatedAt: new Date(),
      ...(state === "resolved" ? { resolvedAt: new Date() } : {}),
    }).where(eq(lyteActionsTable.id, id)).returning();
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update action"); }
});

router.get("/lyte/views", authMiddleware(), async (req, res) => {
  try {
    const role = req.query.role as string | undefined;
    const rows = await db.select().from(lyteSavedViewsTable).orderBy(desc(lyteSavedViewsTable.createdAt));
    const filtered = role ? rows.filter(r => !r.role || r.role === role) : rows;
    sendSuccess(res, filtered);
  } catch (err) { handleRouteError(res, err, "Failed to list views"); }
});

router.post("/lyte/views", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteSavedViewsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create view"); }
});

router.patch("/lyte/views/:id", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteSavedViewsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lyteSavedViewsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "View"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update view"); }
});

router.delete("/lyte/views/:id", authMiddleware(), requireRole("ops", "admin", "super_admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(lyteSavedViewsTable).where(eq(lyteSavedViewsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "View"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete view"); }
});

router.get("/lyte/readiness", authMiddleware(), async (req, res) => {
  try {
    const rows = await db.select().from(lyteReadinessItemsTable).orderBy(desc(lyteReadinessItemsTable.createdAt));
    const total = rows.length;
    const complete = rows.filter(r => r.status === "complete").length;
    const blocked = rows.filter(r => r.status === "blocked").length;
    const score = total > 0 ? Math.round((complete / total) * 100) : 0;
    sendSuccess(res, { items: rows, summary: { total, complete, blocked, score } });
  } catch (err) { handleRouteError(res, err, "Failed to list readiness items"); }
});

router.post("/lyte/readiness", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteReadinessItemsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create readiness item"); }
});

router.patch("/lyte/readiness/:id", authMiddleware(), denyIfReadOnly(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteReadinessItemsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lyteReadinessItemsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Readiness item"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update readiness item"); }
});

const lyteLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Lyte Live rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const lyteCache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const c = lyteCache.get(key);
  if (c && c.expiry > Date.now()) return Promise.resolve(c.data as T);
  return fetcher().then(data => {
    lyteCache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = lyteCache.get(key);
    if (stale) return stale.data as T;
    throw new Error("Data unavailable");
  });
}

async function fetchText(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Lyte/1.0", Accept: "text/xml,application/rss+xml,*/*" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Lyte/1.0", Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

interface RssNewsItem {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  source: string;
}

function parseRssToNews(xml: string, source: string, maxItems = 8): RssNewsItem[] {
  const items: RssNewsItem[] = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const item = match[1] ?? "";
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? item.match(/<title>(.*?)<\/title>/)?.[1] ?? "No title";
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "#";
    const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString();
    const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]?.replace(/<[^>]+>/g, "").slice(0, 200) ?? "";
    items.push({
      id: `${source}-${items.length}`,
      title: title.trim(),
      url: link.trim(),
      publishedAt: new Date(date).toISOString(),
      summary: description.trim(),
      source,
    });
    if (items.length >= maxItems) break;
  }
  return items;
}

router.get("/lyte/live/tech-news", lyteLiveLimit, authMiddleware(), async (_req, res) => {
  try {
    const news = await getCached("lyte-tech-news", 600000, async () => {
      const [tcXml, vrXml] = await Promise.allSettled([
        fetchText("https://techcrunch.com/feed/", 10000),
        fetchText("https://www.theverge.com/rss/index.xml", 10000),
      ]);
      const tcItems = tcXml.status === "fulfilled" ? parseRssToNews(tcXml.value, "TechCrunch", 5) : [];
      const vrItems = vrXml.status === "fulfilled" ? parseRssToNews(vrXml.value, "The Verge", 5) : [];
      const combined = [...tcItems, ...vrItems].sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
      return { items: combined, liveCount: tcItems.length + vrItems.length };
    });
    sendSuccess(res, {
      source: "TechCrunch + The Verge Live RSS Feeds",
      count: news.items.length,
      liveItemsCount: news.liveCount,
      news: news.items,
      liveData: news.liveCount > 0,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch tech news"); }
});

router.get("/lyte/live/bls-employment", lyteLiveLimit, authMiddleware(), async (_req, res) => {
  try {
    const data = await getCached("lyte-bls", 86400000, async () => {
      try {
        interface BlsDataPoint { value: string; periodName: string; year: string; }
        interface BlsResponse { status: string; Results?: { series?: Array<{ data?: BlsDataPoint[] }> } }
        const raw = await fetchJson(
          "https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000",
          8000,
        ) as BlsResponse;
        if (raw?.status !== "REQUEST_SUCCEEDED") throw new Error("BLS API error");
        const series = raw?.Results?.series?.[0]?.data;
        if (!Array.isArray(series) || series.length === 0) throw new Error("No BLS data");
        const latest = series[0];
        const prev = series[1];
        return {
          unemploymentRate: parseFloat(latest.value),
          period: `${latest.periodName} ${latest.year}`,
          previousPeriod: `${prev?.periodName} ${prev?.year}`,
          previousRate: parseFloat(prev?.value ?? latest.value),
          trend: parseFloat(latest.value) < parseFloat(prev?.value ?? "9999") ? "improving" : "worsening",
          historicalData: series.slice(0, 12).map((d: BlsDataPoint) => ({
            period: `${d.periodName} ${d.year}`,
            rate: parseFloat(d.value),
          })),
          source: "live",
        };
      } catch {
        return { source: "unavailable", data: null };
      }
    });
    sendSuccess(res, {
      source: "Bureau of Labor Statistics — Unemployment Rate (LNS14000000)",
      url: "https://www.bls.gov/cps/",
      data,
      liveData: data.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch BLS employment data"); }
});

router.get("/lyte/live/github-trending", lyteLiveLimit, authMiddleware(), async (req, res) => {
  try {
    const language = (req.query.language as string) || "TypeScript";
    const data = await getCached(`lyte-github-${language}`, 3600000, async () => {
      try {
        interface GhRepo { full_name: string; description?: string | null; stargazers_count: number; forks_count: number; language?: string | null; topics?: string[]; html_url: string; created_at: string; pushed_at: string; }
        interface GhSearchResponse { items?: GhRepo[] }
        const raw = await fetchJson(
          `https://api.github.com/search/repositories?q=language:${encodeURIComponent(language)}+created:>2026-01-01&sort=stars&order=desc&per_page=8`,
          8000,
        ) as GhSearchResponse;
        if (!Array.isArray(raw?.items)) throw new Error("No GitHub data");
        return raw.items.map((r: GhRepo) => ({
          name: r.full_name,
          description: r.description?.slice(0, 150) ?? "",
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language,
          topics: r.topics?.slice(0, 4) ?? [],
          url: r.html_url,
          createdAt: r.created_at,
          pushedAt: r.pushed_at,
          source: "live",
        }));
      } catch {
        return [];
      }
    });
    sendSuccess(res, {
      source: "GitHub Public API — Trending Repositories",
      url: "https://github.com/explore",
      language,
      count: data.length,
      repositories: data,
      liveData: data.length > 0 && data[0]?.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch GitHub trending data"); }
});

export default router;
