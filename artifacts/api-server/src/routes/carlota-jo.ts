import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { carlotaInquirySchema, carlotaInquiryUpdateSchema, carlotaReservationSchema, jsonObjectBodySchema, listQuerySchema, validateBody, validateQuery, carlotaRadarSignalsQuerySchema, carlotaRadarCompetitorsQuerySchema, carlotaRadarCompetitorsBodySchema } from "../lib/validation";
import {
  db,
  carlotaInquiriesTable,
  carlotaReservationsTable,
  carlotaServicesTable,
  carlotaClientProfilesTable,
  clientAccountsTable,
  clientDocumentsTable,
  clientUpdatesTable,
  clientMessagesTable,
  carlotaDiagnosticsTable,
  carlotaScenariosTable,
  carlotaEngagementsTable,
  carlotaRadarCompetitorsTable,
  carlotaRadarNotifPrefsTable,
  carlotaRadarSeenSignalsTable,
  type CarlotaRadarPendingSignal,
} from "@szl-holdings/db";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { createHash } from "crypto";
import { sendSuccess, sendNotFound, handleRouteError, sendBadRequest, parsePagination } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { services } from "@szl-holdings/services";
import { logger } from "../lib/logger";
import { broadcastWs, pubsub, CARLOTA_EVENTS } from "../lib/pubsub-bridge.js";
import { ingestCarlotaService } from "@szl-holdings/ai-engine/domain-embedding-hooks";
import {
  sendEmail,
  buildCarlotaContactAckEmail,
  buildCarlotaInquiryNotificationEmail,
  buildCarlotaRadarAlertEmail,
  buildCarlotaRadarDigestEmail,
  CARLOTA_ADMIN_EMAIL,
  type CarlotaRadarSignalSummary,
} from "../lib/email";

const portalUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router: IRouter = Router();

router.get("/booking/inquiries", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(carlotaInquiriesTable).orderBy(desc(carlotaInquiriesTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(carlotaInquiriesTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list inquiries");
  }
});

router.post("/booking/inquiries", validateBody(carlotaInquirySchema), async (req: Request, res: Response) => {
  try {
    const { name, email, company, phone, service, message } = req.body;

    const [row] = await db.insert(carlotaInquiriesTable).values({
      name, email, company: company || null, phone: phone || null, service: service || null, message,
    }).returning();

    Promise.allSettled([
      sendEmail({
        to: email,
        subject: "Inquiry received — Carlota Jo Advisory",
        html: buildCarlotaContactAckEmail(name),
        replyTo: CARLOTA_ADMIN_EMAIL,
      }),
      sendEmail({
        to: CARLOTA_ADMIN_EMAIL,
        subject: `New private inquiry from ${name}`,
        html: buildCarlotaInquiryNotificationEmail({
          name,
          email,
          company: company || undefined,
          phone: phone || undefined,
          service: service || undefined,
          message,
        }),
        replyTo: email,
      }),
    ]).then((results) => {
      for (const r of results) {
        if (r.status === "fulfilled" && !r.value.success) {
          logger.warn({ error: r.value.error }, "[email] Carlota Jo inquiry email failed");
        }
      }
    }).catch(() => {});

    broadcastWs("bookings", "inquiry-created", { id: row.id, name: row.name, service: row.service });
    void pubsub.publish(CARLOTA_EVENTS.INQUIRY_CREATED, { carlotaInquiryCreated: row });
    res.json({
      success: true,
      inquiryId: row.id,
      message: "Inquiry received. Our team will respond within one business day.",
      data: row,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to process inquiry");
  }
});

router.get("/booking/inquiries/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.select().from(carlotaInquiriesTable).where(eq(carlotaInquiriesTable.id, id));
    if (!row) { sendNotFound(res, "Inquiry"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get inquiry");
  }
});

router.patch("/booking/inquiries/:id", authMiddleware(), validateBody(carlotaInquiryUpdateSchema), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.update(carlotaInquiriesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(carlotaInquiriesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Inquiry"); return; }
    broadcastWs("bookings", "inquiry-updated", { id: row.id, status: row.status });
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update inquiry");
  }
});

router.delete("/booking/inquiries/:id", validateBody(jsonObjectBodySchema), authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.delete(carlotaInquiriesTable).where(eq(carlotaInquiriesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Inquiry"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete inquiry");
  }
});

router.get("/booking/reservations", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(carlotaReservationsTable).orderBy(desc(carlotaReservationsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(carlotaReservationsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list reservations");
  }
});

router.post("/booking/reservations", validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { service, tier, date, time, name, email, company, phone, notes } = req.body as {
      service?: string; tier?: string; date?: string; time?: string;
      name?: string; email?: string; company?: string; phone?: string; notes?: string;
    };

    if (!service || !tier || !date || !time || !name || !email) {
      res.status(400).json({ error: "Service, tier, date, time, name, and email are required" });
      return;
    }

    const confirmationId = "CJ-" + Date.now().toString(36).toUpperCase();
    const tierPricing: Record<string, number> = {
      "strategy-session": 4500, "portfolio-review": 45000, "advisory-retainer": 18000,
    };
    const amount = tierPricing[tier] || 0;

    const [row] = await db.insert(carlotaReservationsTable).values({
      confirmationId, service, tier, date, time, name, email,
      company: company || null, phone: phone || null, notes: notes || null,
      amount: amount.toFixed(2),
    }).returning();

    res.json({
      success: true,
      confirmationId: row.confirmationId,
      message: "Consultation booked successfully.",
      booking: row,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to create reservation");
  }
});

router.get("/booking/reservations/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.select().from(carlotaReservationsTable).where(eq(carlotaReservationsTable.id, id));
    if (!row) { sendNotFound(res, "Reservation"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get reservation");
  }
});

router.patch("/booking/reservations/:id", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.update(carlotaReservationsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(carlotaReservationsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Reservation"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update reservation");
  }
});

router.delete("/booking/reservations/:id", validateBody(jsonObjectBodySchema), authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.delete(carlotaReservationsTable).where(eq(carlotaReservationsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Reservation"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete reservation");
  }
});

router.get("/booking/availability", async (_req: Request, res: Response) => {
  const days: string[] = [];
  const today = new Date();
  const d = new Date(today);
  d.setDate(d.getDate() + 3);
  while (days.length < 14) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push(d.toISOString().split("T")[0]);
    }
    d.setDate(d.getDate() + 1);
  }
  res.json({
    availableDates: days,
    timeSlots: ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"],
    timezone: "America/New_York",
  });
});

router.post("/booking/invoices", validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { confirmationId, tier, service, email } = req.body as {
      confirmationId?: string; tier?: string; service?: string; email?: string;
    };

    if (!confirmationId || !tier || !email) {
      res.status(400).json({ error: "confirmationId, tier, and email are required" });
      return;
    }

    const tierPricing: Record<string, number> = {
      "strategy-session": 4500, "portfolio-review": 45000, "advisory-retainer": 18000,
    };
    const amount = tierPricing[tier] || 0;
    const invoiceId = "INV-" + Date.now().toString(36).toUpperCase();

    res.json({
      success: true,
      invoice: {
        invoiceId, confirmationId, tier, service, email, amount, currency: "USD",
        status: "pending", issuedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to create invoice");
  }
});

router.get("/booking/invoices/:invoiceId", async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    res.json({
      success: true,
      invoice: {
        invoiceId, confirmationId: "CJ-DEMO", tier: "strategy-session",
        service: "strategic-advisory", email: "demo@carlotajo.com",
        amount: 4500, currency: "USD", status: "pending",
        issuedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve invoice");
  }
});

router.get("/booking/services", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(carlotaServicesTable).orderBy(carlotaServicesTable.sortOrder).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(carlotaServicesTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list services");
  }
});

router.post("/booking/services", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const [row] = await db.insert(carlotaServicesTable).values(req.body).returning();
    if (row) {
      const _r = row as Record<string, unknown>;
      const _tid = req.user?.orgs[0]?.orgId != null ? String(req.user.orgs[0].orgId) : undefined;
      void ingestCarlotaService({ id: row.id, name: row.name, description: _r.description as string | undefined, tier: _r.tier as string | undefined, category: _r.category as string | undefined }, _tid).catch((e: unknown) => logger.error({ err: e }, "[carlota-jo] ingestCarlotaService failed"));
    }
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create service");
  }
});

router.patch("/booking/services/:id", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.update(carlotaServicesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(carlotaServicesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Service"); return; }
    const _r2 = row as Record<string, unknown>;
    const _tid2 = req.user?.orgs[0]?.orgId != null ? String(req.user.orgs[0].orgId) : undefined;
    void ingestCarlotaService({ id: row.id, name: row.name, description: _r2.description as string | undefined, tier: _r2.tier as string | undefined, category: _r2.category as string | undefined }, _tid2).catch((e: unknown) => logger.error({ err: e }, "[carlota-jo] ingestCarlotaService failed"));
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update service");
  }
});

router.delete("/booking/services/:id", validateBody(jsonObjectBodySchema), authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.delete(carlotaServicesTable).where(eq(carlotaServicesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Service"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete service");
  }
});

router.get("/booking/clients", authMiddleware(), requireRole("admin", "editor", "exec"), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(carlotaClientProfilesTable).orderBy(desc(carlotaClientProfilesTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(carlotaClientProfilesTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list clients");
  }
});

router.get("/portal/my-account", authMiddleware(), async (req, res) => {
  try {
    const [account] = await db.select().from(clientAccountsTable)
      .where(eq(clientAccountsTable.primaryContactUserId, req.user!.id));
    if (!account) { sendNotFound(res, "Client account"); return; }
    sendSuccess(res, account);
  } catch (err) { handleRouteError(res, err, "Failed to get client account"); }
});

router.get("/portal/documents", authMiddleware(), async (req, res) => {
  try {
    const [account] = await db.select({ id: clientAccountsTable.id }).from(clientAccountsTable)
      .where(eq(clientAccountsTable.primaryContactUserId, req.user!.id));
    if (!account) { sendNotFound(res, "Client account"); return; }
    const rows = await db.select().from(clientDocumentsTable)
      .where(and(eq(clientDocumentsTable.clientAccountId, account.id), eq(clientDocumentsTable.visibility, "client")))
      .orderBy(desc(clientDocumentsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list client documents"); }
});

router.post("/portal/documents", authMiddleware(), portalUpload.single("file"), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const [account] = await db.select({ id: clientAccountsTable.id, organizationId: clientAccountsTable.organizationId }).from(clientAccountsTable)
      .where(eq(clientAccountsTable.primaryContactUserId, req.user!.id));
    if (!account) { sendNotFound(res, "Client account"); return; }

    if (!req.file) {
      res.status(400).json({ error: "No file attached", message: "Please attach a file to upload." });
      return;
    }

    const { category, visibility } = req.body as { category?: string; visibility?: string };
    const mimeType = req.file.mimetype;
    const base64 = req.file.buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const [doc] = await db.insert(clientDocumentsTable).values({
      organizationId: account.organizationId,
      clientAccountId: account.id,
      title: req.file.originalname,
      fileUrl: dataUrl,
      fileType: mimeType,
      visibility: (visibility === "client" || visibility === "private" || visibility === "internal") ? visibility : "client",
    }).returning();

    sendSuccess(res, doc, 201);
  } catch (err) { handleRouteError(res, err, "Failed to upload document"); }
});

router.get("/portal/updates", authMiddleware(), async (req, res) => {
  try {
    const [account] = await db.select({ id: clientAccountsTable.id }).from(clientAccountsTable)
      .where(eq(clientAccountsTable.primaryContactUserId, req.user!.id));
    if (!account) { sendNotFound(res, "Client account"); return; }
    const rows = await db.select().from(clientUpdatesTable)
      .where(eq(clientUpdatesTable.clientAccountId, account.id))
      .orderBy(desc(clientUpdatesTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list client updates"); }
});

router.get("/portal/messages", authMiddleware(), async (req, res) => {
  try {
    const [account] = await db.select({ id: clientAccountsTable.id }).from(clientAccountsTable)
      .where(eq(clientAccountsTable.primaryContactUserId, req.user!.id));
    if (!account) { sendNotFound(res, "Client account"); return; }
    const rows = await db.select().from(clientMessagesTable)
      .where(eq(clientMessagesTable.clientAccountId, account.id))
      .orderBy(desc(clientMessagesTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list client messages"); }
});

router.post("/portal/messages", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const [account] = await db.select({ id: clientAccountsTable.id, organizationId: clientAccountsTable.organizationId }).from(clientAccountsTable)
      .where(eq(clientAccountsTable.primaryContactUserId, req.user!.id));
    if (!account) { sendNotFound(res, "Client account"); return; }

    const body = req.body as { bodyRichtext?: string; body?: string; subject?: string };
    const bodyRichtext = body.bodyRichtext ?? body.body;
    if (!bodyRichtext?.trim()) {
      res.status(400).json({ error: "bodyRichtext is required", message: "Message body cannot be empty." });
      return;
    }

    const [msg] = await db.insert(clientMessagesTable).values({
      bodyRichtext: bodyRichtext.trim(),
      subject: body.subject ?? "Client message",
      clientAccountId: account.id,
      organizationId: account.organizationId,
      senderUserId: req.user!.id,
    }).returning();
    sendSuccess(res, msg, 201);
  } catch (err) { handleRouteError(res, err, "Failed to send message"); }
});

const carlotaLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Carlota Jo Live rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const carlotaCache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const c = carlotaCache.get(key);
  if (c && c.expiry > Date.now()) return Promise.resolve(c.data as T);
  return fetcher().then(data => {
    carlotaCache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = carlotaCache.get(key);
    if (stale) return stale.data as T;
    throw new Error("Data unavailable");
  });
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Carlota/1.0", Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Carlota/1.0", Accept: "text/xml,application/rss+xml,*/*" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}


router.get("/carlota/live/economic-outlook", carlotaLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("carlota-econ", 86400000, async () => {
      try {
        const worldBankRaw = await fetchJson(
          "https://api.worldbank.org/v2/country/US;EU;CN;WLD/indicator/NY.GDP.MKTP.KD.ZG?mrv=2&format=json",
          10000,
        ) as any;
        const entries = worldBankRaw?.[1];
        if (!Array.isArray(entries) || entries.length === 0) throw new Error("No World Bank data");
        const gdpGrowth: Record<string, number | null> = {};
        for (const e of entries) {
          if (e.value !== null) gdpGrowth[e.country?.value ?? e.countryiso3code] = parseFloat(e.value?.toFixed(2));
        }
        return { gdpGrowth, source: "live" };
      } catch {
        return { gdpGrowth: {}, source: "unavailable" };
      }
    });
    sendSuccess(res, {
      source: "World Bank Open Data + IMF Economic Outlook",
      url: "https://api.worldbank.org/",
      indicators: data,
      liveData: data.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch economic outlook"); }
});

router.get("/carlota/live/strategic-news", carlotaLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("carlota-strategy-news", 3600000, async () => {
      try {
        const xml = await fetchText("https://feeds.hbr.org/harvardbusiness", 10000);
        const items: any[] = [];
        for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
          const item = match[1] ?? "";
          const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? item.match(/<title>(.*?)<\/title>/)?.[1] ?? "No title";
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "#";
          const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString();
          const isStrategic = /strategy|CEO|board|leadership|transformation|executive/i.test(title);
          items.push({
            id: `HBR-${items.length}`,
            title: title.trim(),
            source: "Harvard Business Review",
            url: link.trim(),
            date: new Date(date).toISOString().slice(0, 10),
            category: /strategy/i.test(title) ? "strategy" : /ceo|board|leadership/i.test(title) ? "leadership" : "advisory",
            relevance: isStrategic ? "high" : "medium",
            insight: "Live from HBR editorial team",
            liveSource: true,
          });
          if (items.length >= 6) break;
        }
        if (items.length === 0) throw new Error("No HBR articles parsed");
        return { news: items, liveCount: items.length };
      } catch {
        return { news: [], liveCount: 0 };
      }
    });
    sendSuccess(res, {
      source: "Harvard Business Review Live RSS + Carlota Jo Advisory Intelligence",
      count: data.news.length,
      news: data.news,
      liveData: data.liveCount > 0,
      liveArticlesCount: data.liveCount,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch strategic news"); }
});

router.get("/carlota/live/consulting-trends", carlotaLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const trends = [
      { trend: "AI-Enabled Strategy Execution", maturityCurve: "Growth", clientDemand: 94, feeGrowth: 28.4, topFirms: ["McKinsey Digital", "BCG X", "Bain"], carlotaAdvantage: "Independent advisory without Big 4 conflicts of interest" },
      { trend: "ESG Strategy Integration", maturityCurve: "Mainstream", clientDemand: 88, feeGrowth: 18.2, topFirms: ["PwC", "EY", "Deloitte"], carlotaAdvantage: "Board-level ESG governance without audit firm conflicts" },
      { trend: "Geopolitical Risk Advisory", maturityCurve: "Emerging", clientDemand: 81, feeGrowth: 42.1, topFirms: ["Control Risks", "Kissinger Associates", "Eurasia Group"], carlotaAdvantage: "C-suite direct access to sovereign wealth and intelligence networks" },
      { trend: "Digital Transformation Leadership", maturityCurve: "Mature", clientDemand: 76, feeGrowth: 8.7, topFirms: ["Accenture", "Kearney", "Oliver Wyman"], carlotaAdvantage: "Results-focused transformation with accountability metrics" },
      { trend: "Succession & Leadership Advisory", maturityCurve: "Steady", clientDemand: 72, feeGrowth: 12.3, topFirms: ["Spencer Stuart", "Russell Reynolds", "Egon Zehnder"], carlotaAdvantage: "Combined strategic advisory and executive assessment methodology" },
    ];
    sendSuccess(res, {
      source: "Consulting Industry Intelligence — Carlota Jo Research Engine",
      count: trends.length,
      trends,
      marketSize: "$300B+ global management consulting market (2026 estimate)",
      cagr: "6.8% CAGR projected through 2028",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch consulting trends"); }
});

router.get("/carlota/live/world-bank-indicators", carlotaLiveLimit, authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const indicator = (req.query.indicator as string) || "NY.GDP.MKTP.KD.ZG";
    const countries = (req.query.countries as string) || "US;CN;DE;JP;GB";
    const data = await getCached(`carlota-wb-${indicator}-${countries}`, 86400000, async () => {
      try {
        const raw = await fetchJson(
          `https://api.worldbank.org/v2/country/${countries}/indicator/${indicator}?mrv=3&format=json`,
          10000,
        ) as any;
        const entries = raw?.[1];
        if (!Array.isArray(entries)) throw new Error("No World Bank data");
        return {
          indicator,
          data: entries.filter((e: any) => e.value !== null).map((e: any) => ({
            country: e.country?.value,
            countryCode: e.countryiso3code,
            year: e.date,
            value: parseFloat(e.value?.toFixed(3)),
          })),
          source: "live",
        };
      } catch {
        return {
          indicator,
          data: [
            { country: "United States", countryCode: "USA", year: "2023", value: 2.1 },
            { country: "China", countryCode: "CHN", year: "2023", value: 5.2 },
            { country: "Germany", countryCode: "DEU", year: "2023", value: -0.3 },
          ],
          source: "demo",
        };
      }
    });
    sendSuccess(res, {
      source: "World Bank Open Data API",
      url: "https://api.worldbank.org/v2/",
      indicatorCode: indicator,
      count: data.data.length,
      observations: data.data,
      liveData: data.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch World Bank indicators"); }
});



// ── Advisory tool types ────────────────────────────────────────────────────────
type DiagnosticRunBody = {
  companyName?: string;
  industry?: string;
  stage?: string;
  report?: unknown;
  clientId?: string;
};

type ScenarioRunBody = {
  label?: string;
  details?: string;
  context?: string;
  result?: unknown;
};

// ── Seed data ──────────────────────────────────────────────────────────────────

const SEED_ENGAGEMENTS = [
  {
    id: "e1", client: "Luminary Brands", engagement: "Growth Strategy Phase 2",
    status: "active", feeType: "fixed", contractedValue: 84000, invoiced: 42000,
    collected: 42000, costToDate: 28400, forecastedCost: 58000, marginTarget: 38,
    phase: "Strategy Development", rateRealisationPct: 96, writeOffs: 1200,
    scopeCreepHours: 8, startDate: "Jan 2026", endDate: "Jun 2026",
    alerts: ["Scope creep detected: 8 uncompensated hours in brand workshop session"],
  },
  {
    id: "e2", client: "Vertex Capital Partners", engagement: "M&A Advisory",
    status: "active", feeType: "time-and-materials", contractedValue: 120000, invoiced: 28000,
    collected: 28000, costToDate: 19800, forecastedCost: 92000, marginTarget: 42,
    phase: "Discovery & Due Diligence", rateRealisationPct: 100, writeOffs: 0,
    scopeCreepHours: 0, startDate: "Apr 2026", endDate: "Aug 2026", alerts: [],
  },
  {
    id: "e3", client: "Aurelius Private Equity", engagement: "Portfolio Strategy Masterclass",
    status: "complete", feeType: "fixed", contractedValue: 16800, invoiced: 16800,
    collected: 16800, costToDate: 8200, forecastedCost: 8200, marginTarget: 45,
    phase: "Completed", rateRealisationPct: 100, writeOffs: 0,
    scopeCreepHours: 0, startDate: "Mar 2026", endDate: "Mar 2026", alerts: [],
  },
  {
    id: "e4", client: "Oasis Wellness", engagement: "Digital Strategy & DTC Build",
    status: "at-risk", feeType: "fixed", contractedValue: 62000, invoiced: 46500,
    collected: 40300, costToDate: 44200, forecastedCost: 68000, marginTarget: 35,
    phase: "Phase 3 — Implementation", rateRealisationPct: 81, writeOffs: 4800,
    scopeCreepHours: 22, startDate: "Oct 2025", endDate: "Apr 2026",
    alerts: [
      "Budget overrun: forecasted cost £6,000 above contracted value",
      "Rate realisation at 81% — £4,800 written off year-to-date",
      "22 uncompensated hours from scope changes — consider amendment",
    ],
  },
];

const SEED_MARGIN_HISTORY = [
  { month: "Oct", margin: 44 },
  { month: "Nov", margin: 41 },
  { month: "Dec", margin: 38 },
  { month: "Jan", margin: 46 },
  { month: "Feb", margin: 42 },
  { month: "Mar", margin: 51 },
  { month: "Apr", margin: 48 },
];

const SEED_RADAR_SIGNALS = [
  {
    competitor: "McKinsey & Company",
    event: "Launched new AI-native strategy offering targeting mid-market PE-backed businesses",
    impact: "high",
    direction: "threat",
    date: "Apr 15, 2026",
    detail: "McKinsey's QuantumBlack division is now packaging AI diagnostic tooling for sub-$500M revenue businesses — direct overlap with Carlota Jo's core ICP. Pricing reported at £180K+ per engagement.",
  },
  {
    competitor: "Bain & Company",
    event: "PE client portfolio shrinks 12% amid deal slowdown — boutiques gain share",
    impact: "high",
    direction: "opportunity",
    date: "Apr 12, 2026",
    detail: "Bain's PE advisory revenue declined for the second consecutive quarter. Mid-market sponsors are increasingly turning to boutique advisors for cost-efficient strategic counsel during the deal dry spell.",
  },
  {
    competitor: "Roland Berger",
    event: "UK expansion — opened Manchester office targeting northern manufacturing clients",
    impact: "medium",
    direction: "threat",
    date: "Apr 8, 2026",
    detail: "Roland Berger's geographic expansion into UK's northern corridor creates competitive pressure on the manufacturing and family-owned business segments Carlota Jo has been building relationships in.",
  },
  {
    competitor: "Oliver Wyman",
    event: "Financial services team depleted by 15% following mass departure to boutique firms",
    impact: "medium",
    direction: "opportunity",
    date: "Apr 5, 2026",
    detail: "Three senior Oliver Wyman partners left to start independent practices, creating a talent and client gap in UK financial services advisory. Former clients may be in market for boutique alternatives.",
  },
  {
    competitor: "Kearney",
    event: "Pricing increase — fixed-fee strategy engagements up ~20% across UK market",
    impact: "medium",
    direction: "opportunity",
    date: "Mar 28, 2026",
    detail: "Kearney has raised UK engagement minimums to £280K for strategy projects. This leaves a growing value gap for quality boutique advisors at £80K–£180K engagement sizes.",
  },
  {
    competitor: "BCG",
    event: "AI advisory conflict: BCG consulting clients on AI also invest in AI vendors",
    impact: "high",
    direction: "opportunity",
    date: "Mar 22, 2026",
    detail: "Financial Times investigation reveals BCG advises clients on AI transformation while holding equity in AI vendors it recommends. Creates significant trust deficit — reinforces Carlota Jo's independent, conflict-free positioning.",
  },
];

const SEED_ROI_METRICS = {
  caseStudies: [
    {
      client: "Luminary Brands",
      investment: "£84,000",
      returnValue: "£312,000",
      roi: "271%",
      timeframe: "12 months",
      driver: "DTC conversion lift + brand authority",
      contractedValue: 84000,
      returnNumeric: 312000,
    },
    {
      client: "Oasis Wellness",
      investment: "£120,000",
      returnValue: "£610,000",
      roi: "408%",
      timeframe: "18 months",
      driver: "Category authority + earned media",
      contractedValue: 120000,
      returnNumeric: 610000,
    },
    {
      client: "Aurelius PE",
      investment: "£16,800",
      returnValue: "£98,000",
      roi: "483%",
      timeframe: "6 months",
      driver: "Portfolio value creation + leadership uplift",
      contractedValue: 16800,
      returnNumeric: 98000,
    },
    {
      client: "Vertex Capital",
      investment: "£120,000",
      returnValue: "£420,000+",
      roi: "250%+",
      timeframe: "24 months (projected)",
      driver: "M&A advisory — deal value & risk mitigation",
      contractedValue: 120000,
      returnNumeric: 420000,
    },
  ],
  portfolioBenchmarks: {
    avgRoi: 353,
    avgPaybackMonths: 11,
    avgRateRealisationPct: 94,
    blendedMarginPct: 47,
    clientRetentionPct: 88,
    npsScore: 72,
  },
  roiTrendData: [
    { month: "Oct 2025", avgRoi: 210 },
    { month: "Nov 2025", avgRoi: 265 },
    { month: "Dec 2025", avgRoi: 288 },
    { month: "Jan 2026", avgRoi: 310 },
    { month: "Feb 2026", avgRoi: 342 },
    { month: "Mar 2026", avgRoi: 353 },
    { month: "Apr 2026", avgRoi: 371 },
  ],
};

// ── Per-client seed data (advisory tool scoping) ──────────────────────────────

type ClientId = "luminary-brands" | "vertex-capital" | "aurelius-pe" | "oasis-wellness";

const SEED_CLIENTS: { id: ClientId; name: string; industry: string }[] = [
  { id: "luminary-brands", name: "Luminary Brands", industry: "Consumer Brand / DTC" },
  { id: "vertex-capital", name: "Vertex Capital Partners", industry: "Private Equity / M&A" },
  { id: "aurelius-pe", name: "Aurelius Private Equity", industry: "PE Portfolio Operations" },
  { id: "oasis-wellness", name: "Oasis Wellness", industry: "Wellness / Consumer Health" },
];

const CLIENT_NAME_BY_ID: Record<ClientId, string> = {
  "luminary-brands": "Luminary Brands",
  "vertex-capital": "Vertex Capital Partners",
  "aurelius-pe": "Aurelius Private Equity",
  "oasis-wellness": "Oasis Wellness",
};

const CLIENT_MARGIN_HISTORY: Record<ClientId, { month: string; margin: number }[]> = {
  "luminary-brands": [
    { month: "Oct", margin: 48 }, { month: "Nov", margin: 46 }, { month: "Dec", margin: 44 },
    { month: "Jan", margin: 49 }, { month: "Feb", margin: 51 }, { month: "Mar", margin: 53 }, { month: "Apr", margin: 52 },
  ],
  "vertex-capital": [
    { month: "Oct", margin: 38 }, { month: "Nov", margin: 41 }, { month: "Dec", margin: 40 },
    { month: "Jan", margin: 44 }, { month: "Feb", margin: 46 }, { month: "Mar", margin: 49 }, { month: "Apr", margin: 51 },
  ],
  "aurelius-pe": [
    { month: "Oct", margin: 51 }, { month: "Nov", margin: 53 }, { month: "Dec", margin: 52 },
    { month: "Jan", margin: 55 }, { month: "Feb", margin: 56 }, { month: "Mar", margin: 58 }, { month: "Apr", margin: 57 },
  ],
  "oasis-wellness": [
    { month: "Oct", margin: 38 }, { month: "Nov", margin: 35 }, { month: "Dec", margin: 31 },
    { month: "Jan", margin: 33 }, { month: "Feb", margin: 28 }, { month: "Mar", margin: 30 }, { month: "Apr", margin: 27 },
  ],
};

const CLIENT_ROI_BENCHMARKS: Record<ClientId, typeof SEED_ROI_METRICS.portfolioBenchmarks> = {
  "luminary-brands": { avgRoi: 271, avgPaybackMonths: 9, avgRateRealisationPct: 96, blendedMarginPct: 51, clientRetentionPct: 100, npsScore: 78 },
  "vertex-capital": { avgRoi: 250, avgPaybackMonths: 14, avgRateRealisationPct: 100, blendedMarginPct: 47, clientRetentionPct: 100, npsScore: 70 },
  "aurelius-pe": { avgRoi: 483, avgPaybackMonths: 5, avgRateRealisationPct: 100, blendedMarginPct: 57, clientRetentionPct: 100, npsScore: 84 },
  "oasis-wellness": { avgRoi: 408, avgPaybackMonths: 12, avgRateRealisationPct: 81, blendedMarginPct: 27, clientRetentionPct: 100, npsScore: 62 },
};

const CLIENT_ROI_TREND: Record<ClientId, { month: string; avgRoi: number }[]> = {
  "luminary-brands": [
    { month: "Oct 2025", avgRoi: 110 }, { month: "Nov 2025", avgRoi: 145 }, { month: "Dec 2025", avgRoi: 178 },
    { month: "Jan 2026", avgRoi: 210 }, { month: "Feb 2026", avgRoi: 235 }, { month: "Mar 2026", avgRoi: 258 }, { month: "Apr 2026", avgRoi: 271 },
  ],
  "vertex-capital": [
    { month: "Oct 2025", avgRoi: 80 }, { month: "Nov 2025", avgRoi: 105 }, { month: "Dec 2025", avgRoi: 140 },
    { month: "Jan 2026", avgRoi: 168 }, { month: "Feb 2026", avgRoi: 198 }, { month: "Mar 2026", avgRoi: 224 }, { month: "Apr 2026", avgRoi: 250 },
  ],
  "aurelius-pe": [
    { month: "Oct 2025", avgRoi: 220 }, { month: "Nov 2025", avgRoi: 290 }, { month: "Dec 2025", avgRoi: 360 },
    { month: "Jan 2026", avgRoi: 410 }, { month: "Feb 2026", avgRoi: 445 }, { month: "Mar 2026", avgRoi: 470 }, { month: "Apr 2026", avgRoi: 483 },
  ],
  "oasis-wellness": [
    { month: "Oct 2025", avgRoi: 180 }, { month: "Nov 2025", avgRoi: 240 }, { month: "Dec 2025", avgRoi: 285 },
    { month: "Jan 2026", avgRoi: 320 }, { month: "Feb 2026", avgRoi: 358 }, { month: "Mar 2026", avgRoi: 388 }, { month: "Apr 2026", avgRoi: 408 },
  ],
};

const CLIENT_RADAR_SIGNALS: Record<ClientId, typeof SEED_RADAR_SIGNALS> = {
  "luminary-brands": [
    {
      competitor: "Glossier", event: "DTC paid-acquisition costs up 23% across category — direct competitor pulled performance budget",
      impact: "high", direction: "opportunity", date: "Apr 16, 2026",
      detail: "Rising customer acquisition costs across the prestige DTC category create an opening for Luminary's owned-channel strategy. Glossier reportedly cut paid budget 30% in Q1.",
    },
    {
      competitor: "Charlotte Tilbury", event: "Launched private label in two new EU markets — UK pricing held flat",
      impact: "medium", direction: "threat", date: "Apr 9, 2026",
      detail: "Charlotte Tilbury's EU expansion brings new shelf competition for the £40-£75 price tier where Luminary is repositioning. Watch UK Boots assortment changes.",
    },
    {
      competitor: "Drunk Elephant", event: "Negative TikTok sentiment surge — formula reformulation backlash",
      impact: "medium", direction: "opportunity", date: "Apr 3, 2026",
      detail: "Sentiment dropped 18 points week-over-week. Opportunity for Luminary's editorial PR push to capture defectors searching for clean formulation alternatives.",
    },
  ],
  "vertex-capital": [
    {
      competitor: "Bain & Company", event: "PE deal advisory fees down 12% — boutiques gaining mid-market share",
      impact: "high", direction: "opportunity", date: "Apr 12, 2026",
      detail: "Bain's mid-market PE advisory revenue declined for two consecutive quarters. Vertex's deal pipeline sits in the £50M–£200M range Bain is now de-prioritising.",
    },
    {
      competitor: "EY-Parthenon", event: "Lost two senior MDs covering UK industrials — talent gap in core sector",
      impact: "high", direction: "opportunity", date: "Apr 6, 2026",
      detail: "EY-Parthenon's UK industrials practice lost both senior MDs within four weeks. Several portfolio targets in Vertex's pipeline previously bid by EY-P teams.",
    },
    {
      competitor: "Lazard", event: "M&A volumes in UK lower-mid market down 18% YoY — pricing pressure on advisor fees",
      impact: "medium", direction: "threat", date: "Mar 28, 2026",
      detail: "Lazard's UK lower-mid market deal flow contraction is creating pricing pressure. Vertex should expect more aggressive fee proposals from competing sponsors.",
    },
  ],
  "aurelius-pe": [
    {
      competitor: "Apollo Global", event: "Portfolio operating partner team expansion — UK ops focus",
      impact: "high", direction: "threat", date: "Apr 14, 2026",
      detail: "Apollo added 8 operating partners with UK industrials and consumer ops experience. Direct overlap with Aurelius portfolio uplift focus.",
    },
    {
      competitor: "Permira", event: "Closed three portfolio-ops led value creation case studies — published thought leadership",
      impact: "medium", direction: "threat", date: "Apr 7, 2026",
      detail: "Permira's case studies establish them as the go-to PE firm for portfolio operations transformation, narrowing Aurelius' positioning advantage in UK PE LP conversations.",
    },
    {
      competitor: "Triton Partners", event: "Lost two portfolio CEOs to competing GP buyouts in last 60 days",
      impact: "medium", direction: "opportunity", date: "Mar 30, 2026",
      detail: "Triton portfolio leadership turnover creates an opening for Aurelius to recruit experienced operators with mid-market portfolio uplift track records.",
    },
  ],
  "oasis-wellness": [
    {
      competitor: "Holland & Barrett", event: "New private-label supplements line undercuts mid-tier wellness brands by ~30%",
      impact: "high", direction: "threat", date: "Apr 15, 2026",
      detail: "Holland & Barrett's expanded own-brand range targets the £18-£35 price tier where Oasis sits. Visible margin compression risk for Q3.",
    },
    {
      competitor: "Heights", event: "Closed £15M Series B — accelerating UK retail rollout to Boots and Tesco",
      impact: "high", direction: "threat", date: "Apr 8, 2026",
      detail: "Heights' funding war chest enables aggressive shelf-space competition in UK pharmacy and grocery channels — Oasis must accelerate retail strategy.",
    },
    {
      competitor: "AG1 (Athletic Greens)", event: "Subscription churn rising — sentiment shift toward simpler, single-ingredient products",
      impact: "medium", direction: "opportunity", date: "Apr 1, 2026",
      detail: "Consumer fatigue with all-in-one formulas creates opening for Oasis' targeted single-ingredient line. Earned media opportunity in wellness press.",
    },
  ],
};

const CLIENT_COMPETITORS: Record<ClientId, { name: string; score: number; trend: string; share: number }[]> = {
  "luminary-brands": [
    { name: "Glossier", score: 82, trend: "down", share: 14 },
    { name: "Charlotte Tilbury", score: 88, trend: "up", share: 17 },
    { name: "Drunk Elephant", score: 71, trend: "down", share: 9 },
    { name: "Rare Beauty", score: 86, trend: "up", share: 12 },
    { name: "Luminary Brands", score: 74, trend: "up", share: 6 },
  ],
  "vertex-capital": [
    { name: "Bain & Company", score: 79, trend: "down", share: 18 },
    { name: "EY-Parthenon", score: 73, trend: "down", share: 14 },
    { name: "Lazard", score: 81, trend: "flat", share: 12 },
    { name: "Rothschild", score: 84, trend: "up", share: 13 },
    { name: "Vertex Capital Partners", score: 67, trend: "up", share: 5 },
  ],
  "aurelius-pe": [
    { name: "Apollo Global", score: 92, trend: "up", share: 19 },
    { name: "Permira", score: 88, trend: "up", share: 15 },
    { name: "Triton Partners", score: 74, trend: "down", share: 11 },
    { name: "CVC Capital Partners", score: 90, trend: "flat", share: 17 },
    { name: "Aurelius Private Equity", score: 70, trend: "up", share: 6 },
  ],
  "oasis-wellness": [
    { name: "Holland & Barrett", score: 86, trend: "up", share: 22 },
    { name: "Heights", score: 79, trend: "up", share: 8 },
    { name: "AG1 (Athletic Greens)", score: 81, trend: "down", share: 14 },
    { name: "Wild Nutrition", score: 72, trend: "flat", share: 7 },
    { name: "Oasis Wellness", score: 64, trend: "up", share: 4 },
  ],
};

const CLIENT_MARKET_TREND: Record<ClientId, { month: string; you: number; market: number }[]> = {
  "luminary-brands": [
    { month: "Oct", you: 62, market: 70 }, { month: "Nov", you: 65, market: 70 }, { month: "Dec", you: 67, market: 71 },
    { month: "Jan", you: 70, market: 71 }, { month: "Feb", you: 72, market: 72 }, { month: "Mar", you: 73, market: 72 }, { month: "Apr", you: 74, market: 73 },
  ],
  "vertex-capital": [
    { month: "Oct", you: 52, market: 76 }, { month: "Nov", you: 55, market: 75 }, { month: "Dec", you: 58, market: 74 },
    { month: "Jan", you: 60, market: 73 }, { month: "Feb", you: 63, market: 73 }, { month: "Mar", you: 65, market: 72 }, { month: "Apr", you: 67, market: 72 },
  ],
  "aurelius-pe": [
    { month: "Oct", you: 60, market: 84 }, { month: "Nov", you: 62, market: 84 }, { month: "Dec", you: 64, market: 85 },
    { month: "Jan", you: 66, market: 85 }, { month: "Feb", you: 68, market: 86 }, { month: "Mar", you: 69, market: 86 }, { month: "Apr", you: 70, market: 87 },
  ],
  "oasis-wellness": [
    { month: "Oct", you: 54, market: 73 }, { month: "Nov", you: 56, market: 74 }, { month: "Dec", you: 58, market: 74 },
    { month: "Jan", you: 60, market: 75 }, { month: "Feb", you: 61, market: 76 }, { month: "Mar", you: 63, market: 77 }, { month: "Apr", you: 64, market: 77 },
  ],
};

function isValidClientId(value: unknown): value is ClientId {
  return typeof value === "string" && value in CLIENT_NAME_BY_ID;
}

function getClientIdFromQuery(req: Request): ClientId | null {
  const raw = req.query?.clientId;
  if (typeof raw === "string" && isValidClientId(raw)) return raw;
  return null;
}

// ── Engagement P&L endpoints (auth-gated, DB-backed per org) ─────────────────

router.get("/carlota/clients", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { clients: SEED_CLIENTS });
  } catch (err) { handleRouteError(res, err, "Failed to list advisory clients"); }
});

router.get("/carlota/engagements", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.orgs[0]?.orgId ?? null;
    const clientId = getClientIdFromQuery(req);
    const scopeFilter = orgId
      ? eq(carlotaEngagementsTable.organizationId, orgId)
      : eq(carlotaEngagementsTable.createdByUserId, userId);

    let rows = await db.select().from(carlotaEngagementsTable)
      .where(scopeFilter)
      .orderBy(desc(carlotaEngagementsTable.createdAt));

    if (rows.length === 0) {
      const { organizationId, clientAccountId } = await resolveClientScope(userId, orgId);
      await Promise.all(SEED_ENGAGEMENTS.map(async (e, i) => {
        await db.insert(carlotaEngagementsTable).values({
          externalId: `eng-${orgId ?? userId}-${i}`,
          organizationId,
          clientAccountId,
          createdByUserId: userId,
          client: e.client,
          engagement: e.engagement,
          status: e.status,
          feeType: e.feeType,
          contractedValue: String(e.contractedValue),
          invoiced: String(e.invoiced),
          collected: String(e.collected),
          costToDate: String(e.costToDate),
          forecastedCost: String(e.forecastedCost),
          marginTarget: e.marginTarget,
          phase: e.phase,
          rateRealisationPct: e.rateRealisationPct,
          writeOffs: String(e.writeOffs),
          scopeCreepHours: e.scopeCreepHours,
          startDate: e.startDate,
          endDate: e.endDate,
          alerts: e.alerts ?? [],
        }).onConflictDoNothing();
      }));
      rows = await db.select().from(carlotaEngagementsTable)
        .where(scopeFilter)
        .orderBy(desc(carlotaEngagementsTable.createdAt));
    }

    const filteredRows = clientId
      ? rows.filter(r => r.client === CLIENT_NAME_BY_ID[clientId])
      : rows;
    const marginHistory = clientId ? CLIENT_MARGIN_HISTORY[clientId] : SEED_MARGIN_HISTORY;

    sendSuccess(res, {
      engagements: filteredRows.map(r => ({
        ...r,
        id: r.externalId,
        contractedValue: Number(r.contractedValue),
        invoiced: Number(r.invoiced),
        collected: Number(r.collected),
        costToDate: Number(r.costToDate),
        forecastedCost: Number(r.forecastedCost),
        writeOffs: Number(r.writeOffs),
      })),
      marginHistory,
      clientId: clientId ?? null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch engagements"); }
});

// ── Competitive radar signals (auth-gated market intelligence) ─────────────────

const DEFAULT_COMPETITORS = [
  { name: "McKinsey & Company", share: 18 },
  { name: "BCG", share: 15 },
  { name: "Bain & Company", share: 12 },
  { name: "Oliver Wyman", share: 9 },
  { name: "Roland Berger", share: 7 },
  { name: "Kearney", share: 6 },
];

const THREAT_KEYWORDS = /\b(launch|launches|launched|expands?|expanded|expansion|raises?|raised|funding|acquir(e|es|ed|ing|ition)|hires?|hired|partnership|partners? with|wins?|won|growth|grew|profit|surge|breakthrough|deal|contract|appoint|invest)\b/i;
const OPPORTUNITY_KEYWORDS = /\b(layoffs?|cuts?|cut jobs|departures?|departed|resign|resigned|decline|declines|declined|lawsuit|sued|fine|fined|penalt|scandal|conflict|miss|missed|loss|losses|downsiz|shrink|leaves|leaving|exit|departure|investigation|probe|controversy)\b/i;
const HIGH_IMPACT_KEYWORDS = /\b(billion|massive|major|biggest|landmark|unprecedented|crisis|collapse|merger|acquisition|ceo|chief executive|board)\b/i;

function classifySignal(text: string): { direction: "threat" | "opportunity" | "neutral"; impact: "high" | "medium" | "low" } {
  const direction = OPPORTUNITY_KEYWORDS.test(text) ? "opportunity" : THREAT_KEYWORDS.test(text) ? "threat" : "neutral";
  const impact = HIGH_IMPACT_KEYWORDS.test(text) ? "high" : "medium";
  return { direction, impact };
}

function decodeXmlEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}

async function fetchCompetitorNews(competitor: string, max = 5): Promise<Array<{ competitor: string; event: string; impact: "high" | "medium" | "low"; direction: "threat" | "opportunity" | "neutral"; date: string; detail: string; url: string; source: string }>> {
  const q = encodeURIComponent(`"${competitor}" consulting OR strategy OR firm`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-GB&gl=GB&ceid=GB:en`;
  try {
    const xml = await fetchText(url, 8000);
    const items: Array<{ competitor: string; event: string; impact: "high" | "medium" | "low"; direction: "threat" | "opportunity" | "neutral"; date: string; detail: string; url: string; source: string }> = [];
    for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const item = match[1] ?? "";
      const titleRaw = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] ?? "";
      const linkRaw = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "#";
      const dateRaw = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toUTCString();
      const sourceRaw = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? "Google News";
      const descRaw = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] ?? "";
      const title = decodeXmlEntities(titleRaw).trim();
      const description = decodeXmlEntities(descRaw).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (!title) continue;
      const { direction, impact } = classifySignal(`${title} ${description}`);
      const dateObj = new Date(dateRaw);
      items.push({
        competitor,
        event: title,
        impact,
        direction,
        date: isNaN(dateObj.getTime()) ? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        detail: description || `${decodeXmlEntities(sourceRaw)} reports on ${competitor}. Read more for full context.`,
        url: linkRaw.trim(),
        source: decodeXmlEntities(sourceRaw),
      });
      if (items.length >= max) break;
    }
    return items;
  } catch {
    return [];
  }
}

function radarCompetitorScopeFilter(orgId: number | null, userId: number, clientId: ClientId | null) {
  const scopeKey = orgId
    ? eq(carlotaRadarCompetitorsTable.organizationId, orgId)
    : and(
        sql`${carlotaRadarCompetitorsTable.organizationId} IS NULL`,
        eq(carlotaRadarCompetitorsTable.userId, userId),
      );
  const clientKey = clientId
    ? eq(carlotaRadarCompetitorsTable.clientId, clientId)
    : sql`${carlotaRadarCompetitorsTable.clientId} IS NULL`;
  return and(scopeKey, clientKey);
}

router.get("/carlota/radar-competitors", authMiddleware(), validateQuery(carlotaRadarCompetitorsQuerySchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.orgs[0]?.orgId ?? null;
    const clientId = getClientIdFromQuery(req);
    const [row] = await db.select().from(carlotaRadarCompetitorsTable)
      .where(radarCompetitorScopeFilter(orgId, userId, clientId));
    sendSuccess(res, {
      clientId: clientId ?? null,
      competitors: row?.competitors ?? null,
      updatedAt: row?.updatedAt ?? null,
    });
  } catch (err) { handleRouteError(res, err, "Failed to load tracked competitors"); }
});

router.put("/carlota/radar-competitors", authMiddleware(), validateBody(carlotaRadarCompetitorsBodySchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.orgs[0]?.orgId ?? null;
    const body = req.body as { clientId?: string | null; competitors: string[] };
    let clientId: ClientId | null = null;
    if (body.clientId != null && body.clientId !== "") {
      if (!isValidClientId(body.clientId)) {
        sendBadRequest(res, "Invalid clientId — must reference a known advisory client");
        return;
      }
      clientId = body.clientId;
    }
    const seen = new Set<string>();
    const competitors = body.competitors
      .map((c) => c.trim())
      .filter((c) => {
        const k = c.toLowerCase();
        if (!c || seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 12);
    if (competitors.length === 0) {
      sendBadRequest(res, "At least one competitor is required");
      return;
    }
    const [existing] = await db.select().from(carlotaRadarCompetitorsTable)
      .where(radarCompetitorScopeFilter(orgId, userId, clientId));
    let row;
    if (existing) {
      [row] = await db.update(carlotaRadarCompetitorsTable)
        .set({ competitors, updatedAt: new Date() })
        .where(eq(carlotaRadarCompetitorsTable.id, existing.id))
        .returning();
    } else {
      [row] = await db.insert(carlotaRadarCompetitorsTable).values({
        organizationId: orgId,
        userId,
        clientId,
        competitors,
      }).returning();
    }
    sendSuccess(res, {
      clientId: clientId ?? null,
      competitors: row.competitors,
      updatedAt: row.updatedAt,
    });
  } catch (err) { handleRouteError(res, err, "Failed to save tracked competitors"); }
});

function hashRadarSignal(competitor: string, event: string, date: string): string {
  return createHash("sha1").update(`${competitor.toLowerCase()}|${event.toLowerCase()}|${date}`).digest("hex").slice(0, 24);
}

const CARLOTA_RADAR_URL = `${process.env.VITE_APP_URL || "https://carlotajo.com"}/carlota-jo/competitive-radar`;

function digestWindowMs(frequency: string): number {
  if (frequency === "weekly") return 7 * 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

async function flushPendingDigest(prefs: typeof carlotaRadarNotifPrefsTable.$inferSelect, recipientName?: string): Promise<{ sent: number }> {
  const pending = (prefs.pendingDigest ?? []) as CarlotaRadarPendingSignal[];
  if (!prefs.enabled || !prefs.emailEnabled || pending.length === 0 || !prefs.email) {
    if (pending.length > 0) {
      await db.update(carlotaRadarNotifPrefsTable)
        .set({ pendingDigest: [], lastDigestAt: new Date(), updatedAt: new Date() })
        .where(eq(carlotaRadarNotifPrefsTable.id, prefs.id));
    }
    return { sent: 0 };
  }
  const summaries: CarlotaRadarSignalSummary[] = pending.map(p => ({
    competitor: p.competitor,
    event: p.event,
    date: p.date,
    detail: p.detail,
    url: p.url,
    source: p.source,
  }));
  const { subject, html } = buildCarlotaRadarDigestEmail({
    recipientName,
    frequency: prefs.frequency === "weekly" ? "weekly" : "daily",
    signals: summaries,
    radarUrl: CARLOTA_RADAR_URL,
  });
  try {
    const result = await sendEmail({ to: prefs.email, subject, html });
    if (!result.success) {
      logger.warn({ err: result.error, userId: prefs.userId }, "[carlota-radar] digest email failed");
    }
  } catch (err) {
    logger.warn({ err, userId: prefs.userId }, "[carlota-radar] digest email threw");
  }
  await db.update(carlotaRadarNotifPrefsTable)
    .set({ pendingDigest: [], lastDigestAt: new Date(), updatedAt: new Date() })
    .where(eq(carlotaRadarNotifPrefsTable.id, prefs.id));
  return { sent: summaries.length };
}

async function processNewHighImpactSignals(
  userId: number,
  orgId: number | null,
  trackedCompetitors: string[],
  signals: Array<{ competitor: string; event: string; impact: string; direction: string; date: string; detail: string; url?: string; source?: string }>,
  recipientFallbackEmail?: string,
  recipientName?: string,
): Promise<void> {
  try {
    const [prefs] = await db.select().from(carlotaRadarNotifPrefsTable).where(eq(carlotaRadarNotifPrefsTable.userId, userId)).limit(1);
    if (prefs && !prefs.enabled) return;

    const trackedLower = new Set((prefs?.competitors ?? trackedCompetitors).map(c => c.toLowerCase()));
    const candidates = signals
      .filter(s => s.impact === "high" && trackedLower.has(s.competitor.toLowerCase()) && !s.competitor.toLowerCase().includes("(portfolio)"))
      .slice(0, 30);
    if (candidates.length === 0) {
      if (prefs && prefs.frequency !== "instant") {
        const since = prefs.lastDigestAt ? prefs.lastDigestAt.getTime() : 0;
        if (Date.now() - since >= digestWindowMs(prefs.frequency) && (prefs.pendingDigest ?? []).length > 0) {
          await flushPendingDigest(prefs, recipientName);
        }
      }
      return;
    }

    const hashes = candidates.map(s => hashRadarSignal(s.competitor, s.event, s.date));
    const seenRows = await db.select({ signalHash: carlotaRadarSeenSignalsTable.signalHash })
      .from(carlotaRadarSeenSignalsTable)
      .where(and(eq(carlotaRadarSeenSignalsTable.userId, userId), inArray(carlotaRadarSeenSignalsTable.signalHash, hashes)));
    const seenSet = new Set(seenRows.map(r => r.signalHash));
    const fresh = candidates
      .map((s, i) => ({ signal: s, hash: hashes[i] }))
      .filter(x => !seenSet.has(x.hash));
    if (fresh.length === 0) {
      if (prefs && prefs.frequency !== "instant") {
        const since = prefs.lastDigestAt ? prefs.lastDigestAt.getTime() : 0;
        if (Date.now() - since >= digestWindowMs(prefs.frequency) && (prefs.pendingDigest ?? []).length > 0) {
          await flushPendingDigest(prefs, recipientName);
        }
      }
      return;
    }

    // Record as seen (ignore conflicts)
    await db.insert(carlotaRadarSeenSignalsTable)
      .values(fresh.map(f => ({ userId, signalHash: f.hash, competitor: f.signal.competitor })))
      .onConflictDoNothing();

    if (!prefs) {
      // No preferences row → default behaviour: in-app broadcast only, no email.
      broadcastWs("bookings", "carlota-radar-alert", {
        userId,
        signals: fresh.map(f => ({ competitor: f.signal.competitor, event: f.signal.event, date: f.signal.date, url: f.signal.url ?? "", source: f.signal.source ?? "" })),
      });
      return;
    }

    const summaries: CarlotaRadarSignalSummary[] = fresh.map(f => ({
      competitor: f.signal.competitor,
      event: f.signal.event,
      date: f.signal.date,
      detail: f.signal.detail,
      url: f.signal.url,
      source: f.signal.source,
    }));

    if (prefs.inAppEnabled) {
      broadcastWs("bookings", "carlota-radar-alert", { userId, signals: summaries });
    }

    if (prefs.frequency === "instant") {
      if (prefs.emailEnabled) {
        const recipient = prefs.email || recipientFallbackEmail;
        if (recipient) {
          for (const summary of summaries.slice(0, 5)) {
            const { subject, html } = buildCarlotaRadarAlertEmail({ recipientName, signal: summary, radarUrl: CARLOTA_RADAR_URL });
            try {
              const r = await sendEmail({ to: recipient, subject, html });
              if (!r.success) logger.warn({ err: r.error, userId }, "[carlota-radar] instant alert email failed");
            } catch (err) {
              logger.warn({ err, userId }, "[carlota-radar] instant alert email threw");
            }
          }
        }
      }
    } else {
      // Append to pending digest, optionally flush when window elapsed
      const now = new Date();
      const newPending: CarlotaRadarPendingSignal[] = [
        ...((prefs.pendingDigest ?? []) as CarlotaRadarPendingSignal[]),
        ...summaries.map(s => ({
          competitor: s.competitor,
          event: s.event,
          date: s.date,
          detail: s.detail,
          url: s.url ?? "",
          source: s.source ?? "",
          capturedAt: now.toISOString(),
        })),
      ].slice(-100);
      await db.update(carlotaRadarNotifPrefsTable)
        .set({ pendingDigest: newPending, updatedAt: now })
        .where(eq(carlotaRadarNotifPrefsTable.id, prefs.id));

      const since = prefs.lastDigestAt ? prefs.lastDigestAt.getTime() : 0;
      if (Date.now() - since >= digestWindowMs(prefs.frequency)) {
        const [refreshed] = await db.select().from(carlotaRadarNotifPrefsTable).where(eq(carlotaRadarNotifPrefsTable.id, prefs.id)).limit(1);
        if (refreshed) await flushPendingDigest(refreshed, recipientName);
      }
    }
  } catch (err) {
    logger.warn({ err, userId }, "[carlota-radar] processNewHighImpactSignals failed");
  }
}

router.get("/carlota/radar-signals", authMiddleware(), validateQuery(carlotaRadarSignalsQuerySchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.orgs[0]?.orgId ?? null;
    const clientId = getClientIdFromQuery(req);
    const scopeFilter = orgId
      ? eq(carlotaEngagementsTable.organizationId, orgId)
      : eq(carlotaEngagementsTable.createdByUserId, userId);
    const allEngagements = await db.select().from(carlotaEngagementsTable).where(scopeFilter);
    const engagements = clientId
      ? allEngagements.filter(e => e.client === CLIENT_NAME_BY_ID[clientId])
      : allEngagements;
    const atRisk = engagements.filter(e =>
      Number(e.contractedValue) > 0 &&
      (Number(e.costToDate) / Number(e.contractedValue) > 0.85 || (e.scopeCreepHours ?? 0) > 30)
    );
    const portfolioSignals = atRisk.map(e => ({
      competitor: `${e.client} (Portfolio)`,
      event: `${e.engagement} — cost at ${Math.round((Number(e.costToDate) / Number(e.contractedValue)) * 100)}% of contracted value${(e.scopeCreepHours ?? 0) > 30 ? ` with ${e.scopeCreepHours}h scope creep` : ""}`,
      impact: "high" as const,
      direction: "threat" as const,
      date: e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      detail: `Engagement margin at risk. Contracted: £${Number(e.contractedValue).toLocaleString()} — Cost to date: £${Number(e.costToDate).toLocaleString()}. ${(e.scopeCreepHours ?? 0) > 30 ? `Scope creep: ${e.scopeCreepHours}h billed.` : ""}`,
      source: "Portfolio analytics",
      url: "",
    }));

    const clientCompetitorList = clientId ? CLIENT_COMPETITORS[clientId].map(c => c.name) : null;
    const competitorsParam = typeof req.query.competitors === "string" && req.query.competitors.trim().length > 0
      ? String(req.query.competitors).split(",").map(s => s.trim()).filter(Boolean).slice(0, 12)
      : null;
    const competitorList = competitorsParam ?? clientCompetitorList ?? DEFAULT_COMPETITORS.map(c => c.name);
    const defaultShareLookup = new Map(DEFAULT_COMPETITORS.map(c => [c.name.toLowerCase(), c.share]));
    const clientShareLookup = clientId
      ? new Map(CLIENT_COMPETITORS[clientId].map(c => [c.name.toLowerCase(), c.share]))
      : null;
    const shareLookup = (key: string) => clientShareLookup?.get(key) ?? defaultShareLookup.get(key);

    const cacheKey = `carlota-radar-news:${competitorList.map(c => c.toLowerCase()).sort().join("|")}`;
    const newsResult = await getCached(cacheKey, 10 * 60 * 1000, async () => {
      const results = await Promise.all(competitorList.map(name => fetchCompetitorNews(name, 4)));
      return results.flat();
    });

    const liveSignals = (newsResult ?? []).slice(0, 30);
    const liveCount = liveSignals.length;
    const useFallback = liveCount === 0;
    const fallbackSeed = clientId ? CLIENT_RADAR_SIGNALS[clientId] : SEED_RADAR_SIGNALS;
    const newsFeedSignals = useFallback ? fallbackSeed.map(s => ({ ...s, source: "Carlota Jo intel desk", url: "" })) : liveSignals;

    const signalCounts = new Map<string, { threats: number; opportunities: number; total: number }>();
    for (const s of liveSignals) {
      const key = s.competitor.toLowerCase();
      const c = signalCounts.get(key) ?? { threats: 0, opportunities: 0, total: 0 };
      c.total += 1;
      if (s.direction === "threat") c.threats += 1;
      else if (s.direction === "opportunity") c.opportunities += 1;
      signalCounts.set(key, c);
    }

    const competitorEntries = competitorList.map(name => {
      const c = signalCounts.get(name.toLowerCase()) ?? { threats: 0, opportunities: 0, total: 0 };
      const score = Math.max(30, Math.min(95, 50 + c.threats * 7 - c.opportunities * 4 + (shareLookup(name.toLowerCase()) ?? 5)));
      const trend = c.threats > c.opportunities ? "up" : c.opportunities > c.threats ? "down" : "flat";
      const share = shareLookup(name.toLowerCase()) ?? Math.max(2, Math.round(100 / competitorList.length / 1.5));
      return { name, score, trend, share };
    });

    const clientMarketTrend = clientId ? CLIENT_MARKET_TREND[clientId] : null;
    const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    const baseYou = 56;
    const baseMarket = 62;
    const liveBoost = Math.min(8, Math.round(liveCount / 4));
    const marketTrend = clientMarketTrend ?? months.map((m, i) => ({
      month: m,
      you: Math.min(95, baseYou + i * 3 + (i === months.length - 1 ? liveBoost : 0)),
      market: Math.min(95, baseMarket + i),
    }));

    // Fire-and-forget alert dispatch for high-impact signals matching tracked competitors
    if (req.user) {
      const fallbackEmail = req.user.email ?? undefined;
      const recipientName = req.user.displayName;
      void processNewHighImpactSignals(req.user.id, orgId, competitorList, newsFeedSignals, fallbackEmail, recipientName);
    }

    sendSuccess(res, {
      signals: [...portfolioSignals, ...newsFeedSignals],
      portfolioSignalCount: portfolioSignals.length,
      liveSignalCount: liveCount,
      count: portfolioSignals.length + newsFeedSignals.length,
      liveData: !useFallback,
      sourceLabel: useFallback ? "Curated intel desk (live news unavailable)" : "Google News + portfolio analytics",
      lastUpdated: new Date().toISOString(),
      competitors: competitorEntries,
      marketTrend,
      clientId: clientId ?? null,
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch radar signals"); }
});

// ── Radar notification preferences ─────────────────────────────────────────────

const DEFAULT_RADAR_PREFS = {
  enabled: true,
  emailEnabled: true,
  inAppEnabled: true,
  email: null as string | null,
  frequency: "instant" as "instant" | "daily" | "weekly",
  competitors: null as string[] | null,
  pendingDigestCount: 0,
  lastDigestAt: null as string | null,
};

router.get("/carlota/radar/notification-preferences", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const [row] = await db.select().from(carlotaRadarNotifPrefsTable).where(eq(carlotaRadarNotifPrefsTable.userId, userId)).limit(1);
    if (!row) {
      sendSuccess(res, { ...DEFAULT_RADAR_PREFS, email: req.user?.email ?? null, exists: false });
      return;
    }
    sendSuccess(res, {
      enabled: row.enabled,
      emailEnabled: row.emailEnabled,
      inAppEnabled: row.inAppEnabled,
      email: row.email,
      frequency: row.frequency,
      competitors: row.competitors,
      pendingDigestCount: (row.pendingDigest ?? []).length,
      lastDigestAt: row.lastDigestAt ? row.lastDigestAt.toISOString() : null,
      exists: true,
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch radar notification preferences"); }
});

router.put("/carlota/radar/notification-preferences", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.orgs[0]?.orgId ?? null;
    const body = req.body as {
      enabled?: boolean;
      emailEnabled?: boolean;
      inAppEnabled?: boolean;
      email?: string | null;
      frequency?: "instant" | "daily" | "weekly";
      competitors?: string[] | null;
    };

    if (body.email != null && body.email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      sendBadRequest(res, "Invalid email address");
      return;
    }
    if (body.frequency != null && !["instant", "daily", "weekly"].includes(body.frequency)) {
      sendBadRequest(res, "frequency must be instant, daily, or weekly");
      return;
    }
    if (body.competitors != null) {
      if (!Array.isArray(body.competitors) || body.competitors.some(c => typeof c !== "string") || body.competitors.length > 24) {
        sendBadRequest(res, "competitors must be an array of up to 24 strings");
        return;
      }
    }

    const update = {
      enabled: body.enabled ?? true,
      emailEnabled: body.emailEnabled ?? true,
      inAppEnabled: body.inAppEnabled ?? true,
      email: body.email === "" ? null : (body.email ?? null),
      frequency: body.frequency ?? "instant",
      competitors: body.competitors ?? null,
      organizationId: orgId,
      updatedAt: new Date(),
    };

    const [existing] = await db.select().from(carlotaRadarNotifPrefsTable).where(eq(carlotaRadarNotifPrefsTable.userId, userId)).limit(1);
    let row;
    if (existing) {
      [row] = await db.update(carlotaRadarNotifPrefsTable)
        .set(update)
        .where(eq(carlotaRadarNotifPrefsTable.userId, userId))
        .returning();
    } else {
      [row] = await db.insert(carlotaRadarNotifPrefsTable)
        .values({ userId, ...update })
        .returning();
    }
    sendSuccess(res, {
      enabled: row.enabled,
      emailEnabled: row.emailEnabled,
      inAppEnabled: row.inAppEnabled,
      email: row.email,
      frequency: row.frequency,
      competitors: row.competitors,
      pendingDigestCount: (row.pendingDigest ?? []).length,
      lastDigestAt: row.lastDigestAt ? row.lastDigestAt.toISOString() : null,
      exists: true,
    });
  } catch (err) { handleRouteError(res, err, "Failed to update radar notification preferences"); }
});

router.post("/carlota/radar/notification-preferences/flush-digest", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const [prefs] = await db.select().from(carlotaRadarNotifPrefsTable).where(eq(carlotaRadarNotifPrefsTable.userId, userId)).limit(1);
    if (!prefs) {
      sendSuccess(res, { sent: 0, message: "No preferences configured" });
      return;
    }
    const recipientName = (req.user as unknown as { name?: string }).name;
    const result = await flushPendingDigest(prefs, recipientName);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to flush radar digest"); }
});

// ── ROI metrics (auth-gated, engagement-derived analytics) ─────────────────────

router.get("/carlota/roi-metrics", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.orgs[0]?.orgId ?? null;
    const clientId = getClientIdFromQuery(req);
    const scopeFilter = orgId
      ? eq(carlotaEngagementsTable.organizationId, orgId)
      : eq(carlotaEngagementsTable.createdByUserId, userId);
    const allEngagements = await db.select().from(carlotaEngagementsTable).where(scopeFilter);
    const engagements = clientId
      ? allEngagements.filter(e => e.client === CLIENT_NAME_BY_ID[clientId])
      : allEngagements;

    if (clientId) {
      const caseStudies = SEED_ROI_METRICS.caseStudies.filter(cs =>
        cs.client === CLIENT_NAME_BY_ID[clientId] ||
        (clientId === "aurelius-pe" && cs.client === "Aurelius PE")
      );
      let portfolioBenchmarks = CLIENT_ROI_BENCHMARKS[clientId];
      if (engagements.length > 0) {
        const totalContracted = engagements.reduce((s, e) => s + Number(e.contractedValue), 0);
        const totalCost = engagements.reduce((s, e) => s + Number(e.costToDate), 0);
        const blendedMarginPct = totalContracted > 0
          ? Math.round(((totalContracted - totalCost) / totalContracted) * 100)
          : portfolioBenchmarks.blendedMarginPct;
        const avgRateRealisationPct = Math.round(
          engagements.reduce((s, e) => s + (e.rateRealisationPct ?? 100), 0) / engagements.length
        );
        portfolioBenchmarks = { ...portfolioBenchmarks, blendedMarginPct, avgRateRealisationPct };
      }
      sendSuccess(res, {
        caseStudies,
        portfolioBenchmarks,
        roiTrendData: CLIENT_ROI_TREND[clientId],
        clientId,
        fetchedAt: new Date().toISOString(),
      });
      return;
    }

    let portfolioBenchmarks = SEED_ROI_METRICS.portfolioBenchmarks;
    if (engagements.length > 0) {
      const totalContracted = engagements.reduce((s, e) => s + Number(e.contractedValue), 0);
      const totalCost = engagements.reduce((s, e) => s + Number(e.costToDate), 0);
      const blendedMarginPct = totalContracted > 0
        ? Math.round(((totalContracted - totalCost) / totalContracted) * 100)
        : SEED_ROI_METRICS.portfolioBenchmarks.blendedMarginPct;
      const avgRateRealisationPct = Math.round(
        engagements.reduce((s, e) => s + (e.rateRealisationPct ?? 100), 0) / engagements.length
      );
      portfolioBenchmarks = {
        ...SEED_ROI_METRICS.portfolioBenchmarks,
        blendedMarginPct,
        avgRateRealisationPct,
      };
    }
    sendSuccess(res, { ...SEED_ROI_METRICS, portfolioBenchmarks, clientId: null, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch ROI metrics"); }
});

// ── Helpers ────────────────────────────────────────────────────────────────────

async function resolveClientScope(userId: number, orgId: number | null): Promise<{ organizationId: number | null; clientAccountId: number | null }> {
  if (!orgId) return { organizationId: null, clientAccountId: null };
  const [acct] = await db.select({ id: clientAccountsTable.id })
    .from(clientAccountsTable)
    .where(eq(clientAccountsTable.primaryContactUserId, userId))
    .limit(1);
  return { organizationId: orgId, clientAccountId: acct?.id ?? null };
}

// ── Diagnostics (DB-persisted, auth-gated) ─────────────────────────────────────

router.post("/carlota/diagnostics", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const body = req.body as DiagnosticRunBody;
    if (!body.companyName || !body.report) {
      sendBadRequest(res, "companyName and report are required");
      return;
    }
    const userId = req.user!.id;
    const orgId = req.user?.orgs[0]?.orgId ?? null;
    const { organizationId, clientAccountId } = await resolveClientScope(userId, orgId);
    const externalId = "dx-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
    const [row] = await db.insert(carlotaDiagnosticsTable).values({
      externalId,
      organizationId,
      clientAccountId,
      createdByUserId: userId,
      companyName: body.companyName,
      industry: body.industry ?? "",
      stage: body.stage ?? "",
      report: body.report as Record<string, unknown>,
    }).returning();
    sendSuccess(res, { ...row, id: row.externalId }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to save diagnostic"); }
});

router.get("/carlota/diagnostics", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.orgs[0]?.orgId ?? null;
    const filter = orgId
      ? eq(carlotaDiagnosticsTable.organizationId, orgId)
      : eq(carlotaDiagnosticsTable.createdByUserId, userId);
    const rows = await db.select().from(carlotaDiagnosticsTable)
      .where(filter)
      .orderBy(desc(carlotaDiagnosticsTable.createdAt))
      .limit(50);
    const mapped = rows.map(r => ({ ...r, id: r.externalId }));
    sendSuccess(res, { diagnostics: mapped, count: mapped.length });
  } catch (err) { handleRouteError(res, err, "Failed to list diagnostics"); }
});

// ── Scenario runs (DB-persisted, auth-gated) ───────────────────────────────────

router.post("/carlota/scenarios", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const body = req.body as ScenarioRunBody;
    if (!body.label || !body.result) {
      sendBadRequest(res, "label and result are required");
      return;
    }
    const userId = req.user!.id;
    const orgId = req.user?.orgs[0]?.orgId ?? null;
    const { organizationId, clientAccountId } = await resolveClientScope(userId, orgId);
    const externalId = "sc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
    const [row] = await db.insert(carlotaScenariosTable).values({
      externalId,
      organizationId,
      clientAccountId,
      createdByUserId: userId,
      label: body.label,
      details: body.details ?? "",
      context: body.context ?? null,
      result: body.result as Record<string, unknown>,
    }).returning();
    sendSuccess(res, { ...row, id: row.externalId }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to save scenario"); }
});

router.get("/carlota/scenarios", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.orgs[0]?.orgId ?? null;
    const filter = orgId
      ? eq(carlotaScenariosTable.organizationId, orgId)
      : eq(carlotaScenariosTable.createdByUserId, userId);
    const rows = await db.select().from(carlotaScenariosTable)
      .where(filter)
      .orderBy(desc(carlotaScenariosTable.createdAt))
      .limit(50);
    const mapped = rows.map(r => ({ ...r, id: r.externalId }));
    sendSuccess(res, { scenarios: mapped, count: mapped.length });
  } catch (err) { handleRouteError(res, err, "Failed to list scenarios"); }
});

export default router;

