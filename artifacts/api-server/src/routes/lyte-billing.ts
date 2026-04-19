import { Router, type IRouter, type Request, type Response } from "express";
import { db, subscriptionsTable, organizationsTable, billingPlansTable, invoicesTable, revenueEventsTable } from "@szl-holdings/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { services } from "@szl-holdings/services";
import { logger } from "../lib/logger";
import { requireStripeLive } from "../lib/stripe-gate";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

const router: IRouter = Router();

const LYTE_PLANS = {
  "lyte-pilot-monthly": {
    priceEnv: "STRIPE_PRICE_LYTE_PILOT_MONTHLY",
    name: "Lyte Pilot — Monthly",
    interval: "month",
    amount: 2_500_00,
  },
  "lyte-pilot-annual": {
    priceEnv: "STRIPE_PRICE_LYTE_PILOT_ANNUAL",
    name: "Lyte Pilot — Annual",
    interval: "year",
    amount: 25_000_00,
  },
  "lyte-growth-monthly": {
    priceEnv: "STRIPE_PRICE_LYTE_GROWTH_MONTHLY",
    name: "Lyte Growth — Monthly",
    interval: "month",
    amount: 5_000_00,
  },
  "lyte-enterprise-annual": {
    priceEnv: "STRIPE_PRICE_LYTE_ENTERPRISE_ANNUAL",
    name: "Lyte Enterprise — Annual",
    interval: "year",
    amount: 60_000_00,
  },
} as const;

async function logRevenueEvent(
  eventType: typeof revenueEventsTable.$inferSelect["eventType"],
  params: {
    customerId?: string;
    subscriptionId?: string;
    invoiceId?: string;
    amount?: number;
    currency?: string;
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
  },
) {
  try {
    await db.insert(revenueEventsTable).values({
      eventType,
      product: "lyte",
      customerId: params.customerId,
      subscriptionId: params.subscriptionId,
      invoiceId: params.invoiceId,
      amount: params.amount != null ? String(params.amount) : null,
      currency: params.currency ?? "usd",
      idempotencyKey: params.idempotencyKey,
      metadata: params.metadata ?? null,
    }).onConflictDoNothing();
  } catch (err) {
    logger.warn({ err, eventType }, "Failed to log revenue event (idempotency conflict or DB error)");
  }
}

router.get("/lyte/billing/plans", (_req, res) => {
  const plans = Object.entries(LYTE_PLANS).map(([planId, plan]) => ({
    planId,
    name: plan.name,
    interval: plan.interval,
    amount: plan.amount,
    configured: !!process.env[plan.priceEnv],
    stripePriceEnv: plan.priceEnv,
  }));
  sendSuccess(res, plans);
});

router.post("/lyte/billing/pilot-checkout", validateBody(jsonObjectBodySchema), authMiddleware({ required: false }), requireStripeLive, async (req: Request, res: Response) => {
  try {
    const { planId, email, companyName, contactName, successUrl, cancelUrl } = req.body as {
      planId?: string;
      email?: string;
      companyName?: string;
      contactName?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!planId || !successUrl || !cancelUrl) {
      sendBadRequest(res, "planId, successUrl, and cancelUrl are required");
      return;
    }

    const plan = LYTE_PLANS[planId as keyof typeof LYTE_PLANS];
    if (!plan) {
      sendBadRequest(res, `Unknown Lyte plan "${planId}". Valid: ${Object.keys(LYTE_PLANS).join(", ")}`);
      return;
    }

    let customerId: string | undefined;
    if (email) {
      const existing = await services.stripe.getCustomerByEmail(email);
      customerId = existing?.id;

      if (!customerId) {
        const customer = await services.stripe.createCustomer(
          email,
          contactName ?? companyName ?? email,
          { product: "lyte", planId, company: companyName ?? "" },
        );
        customerId = customer.id;

        await logRevenueEvent("pilot.created", {
          customerId,
          metadata: { planId, email, companyName },
        });
      }
    }

    const priceId = process.env[plan.priceEnv];
    if (!priceId && services.stripe.isLive) {
      sendError(res, `Stripe price not configured for plan "${planId}". Set ${plan.priceEnv}.`, 503);
      return;
    }

    if (!services.stripe.isLive || !priceId) {
      sendSuccess(res, {
        status: "demo",
        message: `Demo mode: Lyte pilot checkout for ${plan.name}. Set STRIPE_SECRET_KEY and ${plan.priceEnv} to activate.`,
        planId,
        planName: plan.name,
        amount: plan.amount,
        customerId: customerId ?? null,
      });
      return;
    }

    const session = await services.stripe.createCheckoutSession({
      priceId,
      mode: "subscription",
      successUrl,
      cancelUrl,
      customerId,
      customerEmail: customerId ? undefined : email,
      metadata: { planId, planName: plan.name, product: "lyte", companyName: companyName ?? "" },
    });

    sendSuccess(res, { sessionId: session.id, url: session.url, customerId: customerId ?? null });
  } catch (err) {
    handleRouteError(res, err, "Failed to create Lyte pilot checkout");
  }
});

router.post("/lyte/billing/create-invoice", validateBody(jsonObjectBodySchema), authMiddleware(), requireRole("admin", "super_admin", "ops"), requireStripeLive, async (req: Request, res: Response) => {
  try {
    const { customerId, email, companyName, lineItems, dueDate, notes } = req.body as {
      customerId?: string;
      email?: string;
      companyName?: string;
      lineItems?: Array<{ description: string; amount: number; currency?: string }>;
      dueDate?: number;
      notes?: string;
    };

    if ((!customerId && !email) || !lineItems?.length) {
      sendBadRequest(res, "customerId or email, and lineItems are required");
      return;
    }

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && email) {
      const existing = await services.stripe.getCustomerByEmail(email);
      if (existing) {
        resolvedCustomerId = existing.id;
      } else {
        const customer = await services.stripe.createCustomer(email, companyName ?? email, { product: "lyte" });
        resolvedCustomerId = customer.id;
      }
    }

    if (!services.stripe.isLive) {
      sendSuccess(res, {
        status: "demo",
        message: "Demo mode: invoice creation requires live Stripe credentials.",
        customerId: resolvedCustomerId,
      });
      return;
    }

    const invoice = await services.stripe.createInvoice(resolvedCustomerId!, lineItems!, {
      dueDate,
      notes,
      metadata: { product: "lyte", companyName: companyName ?? "" },
    });

    const totalAmount = lineItems!.reduce((sum, li) => sum + li.amount, 0);

    await db.insert(invoicesTable).values({
      orgId: 1,
      stripeInvoiceId: invoice.id,
      amount: String(totalAmount / 100),
      currency: "usd",
      status: "open",
    }).catch(() => {});

    await logRevenueEvent("invoice.paid", {
      customerId: resolvedCustomerId,
      invoiceId: invoice.id,
      amount: totalAmount,
      idempotencyKey: `invoice-created-${invoice.id}`,
      metadata: { companyName, notes },
    });

    sendSuccess(res, {
      invoiceId: invoice.id,
      status: invoice.status,
      hostedUrl: invoice.hostedInvoiceUrl,
      pdfUrl: invoice.invoicePdf,
      customerId: resolvedCustomerId,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to create Lyte invoice");
  }
});

router.get("/lyte/billing/revenue-events", authMiddleware(), requireRole("admin", "super_admin", "ops", "analyst"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 200);
    const events = await db
      .select()
      .from(revenueEventsTable)
      .where(eq(revenueEventsTable.product, "lyte"))
      .orderBy(desc(revenueEventsTable.occurredAt))
      .limit(limit);
    sendSuccess(res, events);
  } catch (err) {
    handleRouteError(res, err, "Failed to list Lyte revenue events");
  }
});

router.get("/lyte/billing/pilot-metrics", authMiddleware(), requireRole("admin", "super_admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const subs = await db.select().from(subscriptionsTable);
    const totalPilots = subs.length;
    const activePilots = subs.filter(s => s.status === "active").length;
    const trialingPilots = subs.filter(s => s.status === "trialing").length;
    const pastDuePilots = subs.filter(s => s.status === "past_due").length;

    const [eventCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(revenueEventsTable)
      .where(eq(revenueEventsTable.product, "lyte"));

    const recentEvents = await db
      .select()
      .from(revenueEventsTable)
      .where(eq(revenueEventsTable.product, "lyte"))
      .orderBy(desc(revenueEventsTable.occurredAt))
      .limit(10);

    sendSuccess(res, {
      totalPilots,
      activePilots,
      trialingPilots,
      pastDuePilots,
      totalRevenueEvents: eventCountRow?.count ?? 0,
      revenueEvents: recentEvents,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get Lyte pilot metrics");
  }
});

router.post("/lyte/billing/webhooks/failed-payment", authMiddleware({ required: false }), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { subscriptionId, customerId, invoiceId, amount, currency } = req.body as {
      subscriptionId?: string;
      customerId?: string;
      invoiceId?: string;
      amount?: number;
      currency?: string;
    };

    if (subscriptionId) {
      await db
        .update(subscriptionsTable)
        .set({ status: "past_due", updatedAt: new Date() })
        .where(eq(subscriptionsTable.stripeSubscriptionId, subscriptionId));
    }

    await logRevenueEvent("invoice.payment_failed", {
      customerId,
      subscriptionId,
      invoiceId,
      amount,
      currency,
      idempotencyKey: invoiceId ? `payment-failed-${invoiceId}` : undefined,
      metadata: { failedAt: new Date().toISOString() },
    });

    logger.warn({ subscriptionId, customerId, invoiceId }, "Lyte payment failed — subscription marked past_due");

    sendSuccess(res, {
      status: "recorded",
      message: "Payment failure recorded. Customer should be contacted within 24 hours.",
      subscriptionStatus: "past_due",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to handle Lyte payment failure");
  }
});

export default router;
