import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
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
} from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError, sendBadRequest, parsePagination } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { services } from "@workspace/services";
import { logger } from "../lib/logger";
import { broadcastWs, pubsub, CARLOTA_EVENTS } from "../lib/pubsub-bridge.js";
import {
  sendEmail,
  buildCarlotaContactAckEmail,
  buildCarlotaInquiryNotificationEmail,
  CARLOTA_ADMIN_EMAIL,
} from "../lib/email";

const portalUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router: IRouter = Router();

router.get("/booking/inquiries", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(carlotaInquiriesTable).orderBy(desc(carlotaInquiriesTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(carlotaInquiriesTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list inquiries");
  }
});

router.post("/booking/inquiries", async (req: Request, res: Response) => {
  try {
    const { name, email, company, phone, service, message } = req.body as {
      name?: string; email?: string; company?: string; phone?: string; service?: string; message?: string;
    };

    if (!name || !email || !message) {
      res.status(400).json({ error: "Name, email, and message are required" });
      return;
    }

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

router.patch("/booking/inquiries/:id", authMiddleware(), async (req, res) => {
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

router.delete("/booking/inquiries/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.delete(carlotaInquiriesTable).where(eq(carlotaInquiriesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Inquiry"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete inquiry");
  }
});

router.get("/booking/reservations", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(carlotaReservationsTable).orderBy(desc(carlotaReservationsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(carlotaReservationsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list reservations");
  }
});

router.post("/booking/reservations", async (req: Request, res: Response) => {
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

router.patch("/booking/reservations/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.update(carlotaReservationsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(carlotaReservationsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Reservation"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update reservation");
  }
});

router.delete("/booking/reservations/:id", authMiddleware(), async (req, res) => {
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

router.post("/booking/invoices", async (req: Request, res: Response) => {
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

router.get("/booking/services", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(carlotaServicesTable).orderBy(carlotaServicesTable.sortOrder).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(carlotaServicesTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list services");
  }
});

router.post("/booking/services", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(carlotaServicesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create service");
  }
});

router.patch("/booking/services/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.update(carlotaServicesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(carlotaServicesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Service"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update service");
  }
});

router.delete("/booking/services/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [row] = await db.delete(carlotaServicesTable).where(eq(carlotaServicesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Service"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete service");
  }
});

router.get("/booking/clients", authMiddleware(), requireRole("admin", "editor", "exec"), async (req, res) => {
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

router.post("/portal/documents", authMiddleware(), portalUpload.single("file"), async (req, res) => {
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

router.post("/portal/messages", authMiddleware(), async (req, res) => {
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

const DEMO_ECONOMIC_INDICATORS = {
  gdpGrowth: { us: 2.1, eu: 1.2, china: 5.2, global: 3.2 },
  inflation: { us: 3.2, eu: 2.8, uk: 4.1, global: 5.7 },
  ceoConfidence: { index: 62, trend: "declining", previousQuarter: 67 },
  boardroomPriorities: ["AI Integration", "Workforce Strategy", "ESG Compliance", "Geopolitical Risk", "Supply Chain Resilience"],
  advisoryDemand: { strategy: 94, transformation: 88, riskManagement: 81, leadership: 76, digitalStrategy: 91 },
};

const DEMO_STRATEGIC_NEWS = [
  { id: "SN-001", title: "McKinsey: 70% of Digital Transformations Fail — New Frameworks Emerge", source: "McKinsey Insights", date: "2026-03-25", category: "transformation", relevance: "critical", insight: "Focus shifts from technology to organizational operating model design" },
  { id: "SN-002", title: "Boardroom Shifts: ESG Integration Now Mandatory for 92% of Fortune 500", source: "Harvard Business Review", date: "2026-03-22", category: "esg", relevance: "high", insight: "SEC climate disclosure rules accelerating board-level ESG accountability" },
  { id: "SN-003", title: "AI Governance Gap: 83% of CEOs Lack Framework for Enterprise AI Decisions", source: "Deloitte Insights", date: "2026-03-20", category: "ai-governance", relevance: "critical", insight: "Advisory opportunity for AI ethics and governance frameworks" },
  { id: "SN-004", title: "Geopolitical Risk Tops CEO Agenda for Third Consecutive Year — BCG Survey", source: "Boston Consulting Group", date: "2026-03-18", category: "geopolitical", relevance: "high", insight: "Clients need scenario planning for supply chain and market access disruption" },
  { id: "SN-005", title: "Succession Planning Crisis: 67% of S&P 500 Companies Lack CEO Succession Plans", source: "Spencer Stuart", date: "2026-03-15", category: "leadership", relevance: "high", insight: "Board advisory opportunity for succession framework development" },
];

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
        return { ...DEMO_ECONOMIC_INDICATORS, gdpGrowth: { ...DEMO_ECONOMIC_INDICATORS.gdpGrowth, ...gdpGrowth }, source: "live" };
      } catch {
        return { ...DEMO_ECONOMIC_INDICATORS, source: "demo" };
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
        return { news: DEMO_STRATEGIC_NEWS, liveCount: 0 };
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

router.get("/carlota/live/world-bank-indicators", carlotaLiveLimit, authMiddleware({ required: false }), async (req, res) => {
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

export default router;
