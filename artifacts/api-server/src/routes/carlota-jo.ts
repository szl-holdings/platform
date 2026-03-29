import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  carlotaInquiriesTable,
  carlotaReservationsTable,
  carlotaServicesTable,
  carlotaClientProfilesTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError, sendBadRequest, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
import { services } from "@workspace/services";
import { logger } from "../lib/logger";

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
    const id = parseInt(req.params.id, 10);
    const [row] = await db.select().from(carlotaInquiriesTable).where(eq(carlotaInquiriesTable.id, id));
    if (!row) { sendNotFound(res, "Inquiry"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get inquiry");
  }
});

router.patch("/booking/inquiries/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [row] = await db.update(carlotaInquiriesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(carlotaInquiriesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Inquiry"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update inquiry");
  }
});

router.delete("/booking/inquiries/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
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
    const id = parseInt(req.params.id, 10);
    const [row] = await db.select().from(carlotaReservationsTable).where(eq(carlotaReservationsTable.id, id));
    if (!row) { sendNotFound(res, "Reservation"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get reservation");
  }
});

router.patch("/booking/reservations/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [row] = await db.update(carlotaReservationsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(carlotaReservationsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Reservation"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update reservation");
  }
});

router.delete("/booking/reservations/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
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
    const id = parseInt(req.params.id, 10);
    const [row] = await db.update(carlotaServicesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(carlotaServicesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Service"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update service");
  }
});

router.delete("/booking/services/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [row] = await db.delete(carlotaServicesTable).where(eq(carlotaServicesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Service"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete service");
  }
});

router.get("/booking/clients", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(carlotaClientProfilesTable).orderBy(desc(carlotaClientProfilesTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(carlotaClientProfilesTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list clients");
  }
});

router.post("/stripe/checkout", async (req: Request, res: Response) => {
  try {
    const { tierId, tierName, service, email, successUrl, cancelUrl } = req.body as {
      tierId?: string; tierName?: string; service?: string;
      email?: string; successUrl?: string; cancelUrl?: string;
    };

    if (!tierId || !successUrl || !cancelUrl) {
      res.status(400).json({ error: "tierId, successUrl, and cancelUrl are required" });
      return;
    }

    const tierPricing: Record<string, string> = {
      "strategy-session": process.env.STRIPE_PRICE_STRATEGY_SESSION || "",
      "portfolio-review": process.env.STRIPE_PRICE_PORTFOLIO_REVIEW || "",
      "advisory-retainer": process.env.STRIPE_PRICE_ADVISORY_RETAINER || "",
    };

    const priceId = tierPricing[tierId];
    if (!priceId) {
      res.status(400).json({ error: `No Stripe price configured for tier "${tierId}". Set the corresponding STRIPE_PRICE_* environment variable.` });
      return;
    }

    const session = await services.stripe.createCheckoutSession({
      priceId,
      mode: "payment",
      successUrl,
      cancelUrl,
      customerEmail: email,
      metadata: { tierId: tierId || "", tierName: tierName || "", service: service || "" },
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      status: session.status,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to initiate checkout");
  }
});

export default router;
