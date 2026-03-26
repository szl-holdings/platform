import { Router, type IRouter, type Request, type Response } from "express";
import { db, billingPlansTable, subscriptionsTable, invoicesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { services } from "@workspace/services";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/billing/plans", authMiddleware(), async (_req, res) => {
  try {
    const plans = await db.select().from(billingPlansTable).orderBy(billingPlansTable.name);
    sendSuccess(res, plans);
  } catch (err) {
    handleRouteError(res, err, "Failed to list billing plans");
  }
});

router.get("/billing/plans/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [plan] = await db.select().from(billingPlansTable).where(eq(billingPlansTable.id, id));
    if (!plan) {
      sendNotFound(res, "Billing plan");
      return;
    }
    sendSuccess(res, plan);
  } catch (err) {
    handleRouteError(res, err, "Failed to get billing plan");
  }
});

router.get("/billing/subscriptions", authMiddleware(), requireRole("operator", "analyst"), async (_req, res) => {
  try {
    const subs = await db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt));
    sendSuccess(res, subs);
  } catch (err) {
    handleRouteError(res, err, "Failed to list subscriptions");
  }
});

router.get("/billing/invoices", authMiddleware(), requireRole("operator", "analyst"), async (_req, res) => {
  try {
    const invs = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt));
    sendSuccess(res, invs);
  } catch (err) {
    handleRouteError(res, err, "Failed to list invoices");
  }
});

router.get("/billing/products", async (_req, res) => {
  try {
    const products = await services.stripe.listProducts();
    sendSuccess(res, products);
  } catch (err) {
    handleRouteError(res, err, "Failed to list Stripe products");
  }
});

router.post("/billing/checkout", async (req: Request, res: Response) => {
  try {
    const { priceId, mode, successUrl, cancelUrl, customerEmail } = req.body as {
      priceId: string;
      mode?: "subscription" | "payment";
      successUrl: string;
      cancelUrl: string;
      customerEmail?: string;
    };

    if (!priceId || !successUrl || !cancelUrl) {
      sendBadRequest(res, "priceId, successUrl, and cancelUrl are required");
      return;
    }

    let customerId: string | undefined;
    if (customerEmail) {
      const existing = await services.stripe.getCustomerByEmail(customerEmail);
      if (existing) {
        customerId = existing.id;
      }
    }

    const session = await services.stripe.createCheckoutSession({
      priceId,
      mode: mode ?? "subscription",
      successUrl,
      cancelUrl,
      customerEmail: customerId ? undefined : customerEmail,
      customerId,
    });

    sendSuccess(res, { sessionId: session.id, url: session.url });
  } catch (err) {
    logger.error({ err }, "Failed to create checkout session");
    handleRouteError(res, err, "Failed to create checkout session");
  }
});

router.get("/billing/subscription-status", async (req: Request, res: Response) => {
  try {
    const customerEmail = req.query.email as string | undefined;
    const customerId = req.query.customerId as string | undefined;

    if (!customerEmail && !customerId) {
      sendSuccess(res, { subscribed: false, subscription: null });
      return;
    }

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && customerEmail) {
      const customer = await services.stripe.getCustomerByEmail(customerEmail);
      if (!customer) {
        sendSuccess(res, { subscribed: false, subscription: null });
        return;
      }
      resolvedCustomerId = customer.id;
    }

    const subscriptions = await services.stripe.listCustomerSubscriptions(resolvedCustomerId!);
    const active = subscriptions.find((s) => s.status === "active" || s.status === "trialing");

    sendSuccess(res, {
      subscribed: !!active,
      subscription: active ?? null,
      allSubscriptions: subscriptions,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get subscription status");
    handleRouteError(res, err, "Failed to get subscription status");
  }
});

router.post("/billing/customer-portal", async (req: Request, res: Response) => {
  try {
    const { customerId, returnUrl } = req.body as {
      customerId: string;
      returnUrl: string;
    };

    if (!customerId || !returnUrl) {
      sendBadRequest(res, "customerId and returnUrl are required");
      return;
    }

    const session = await services.stripe.createCustomerPortalSession(customerId, returnUrl);
    sendSuccess(res, { url: session.url });
  } catch (err) {
    logger.error({ err }, "Failed to create customer portal session");
    handleRouteError(res, err, "Failed to create customer portal session");
  }
});

router.get("/billing/checkout-session/:sessionId", async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    if (!sessionId) {
      sendBadRequest(res, "sessionId is required");
      return;
    }

    const session = await services.stripe.getCheckoutSession(sessionId);
    if (!session) {
      sendNotFound(res, "Checkout session");
      return;
    }

    sendSuccess(res, session);
  } catch (err) {
    handleRouteError(res, err, "Failed to get checkout session");
  }
});

router.get("/billing/stripe-invoices", async (req: Request, res: Response) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const invoices = await services.stripe.listInvoices(customerId);
    sendSuccess(res, invoices);
  } catch (err) {
    handleRouteError(res, err, "Failed to list Stripe invoices");
  }
});

router.post("/billing/webhooks", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string | undefined;
    const rawBody = JSON.stringify(req.body);
    const { verified, event } = await services.stripe.verifyWebhookPayload(rawBody, signature);

    if (!verified || !event) {
      logger.warn("Webhook signature verification failed");
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    const eventType = event.type as string;

    if (!eventType) {
      sendBadRequest(res, "Invalid webhook event");
      return;
    }

    logger.info({ eventType, eventId: event.id }, "Stripe webhook received");

    const eventData = (event.data as Record<string, unknown>)?.object as Record<string, unknown> | undefined;

    switch (eventType) {
      case "checkout.session.completed": {
        const session = eventData;
        if (!session) break;
        logger.info({ sessionId: session.id, customerId: session.customer }, "Checkout completed");

        if (session.subscription) {
          const sub = await services.stripe.getSubscription(session.subscription as string);
          if (sub) {
            try {
              await db.insert(subscriptionsTable).values({
                orgId: 1,
                planId: 1,
                status: "active",
                stripeSubscriptionId: sub.id,
                currentPeriodStart: new Date(sub.currentPeriodStart * 1000),
                currentPeriodEnd: new Date(sub.currentPeriodEnd * 1000),
              });
            } catch (dbErr) {
              logger.warn({ dbErr }, "Subscription may already exist in DB");
            }
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = eventData;
        if (!sub) break;
        logger.info({ subscriptionId: sub.id, status: sub.status }, "Subscription updated");

        const existing = await db
          .select()
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.stripeSubscriptionId, sub.id as string));

        if (existing.length > 0) {
          await db
            .update(subscriptionsTable)
            .set({
              status: sub.status === "active" ? "active" : sub.status === "trialing" ? "trialing" : sub.status === "past_due" ? "past_due" : "canceled",
              currentPeriodStart: new Date((sub.current_period_start as number) * 1000),
              currentPeriodEnd: new Date((sub.current_period_end as number) * 1000),
              canceledAt: sub.canceled_at ? new Date((sub.canceled_at as number) * 1000) : null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptionsTable.stripeSubscriptionId, sub.id as string));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = eventData;
        if (!sub) break;
        logger.info({ subscriptionId: sub.id }, "Subscription deleted");

        await db
          .update(subscriptionsTable)
          .set({
            status: "canceled",
            canceledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(subscriptionsTable.stripeSubscriptionId, sub.id as string));
        break;
      }

      case "invoice.paid": {
        const invoice = eventData;
        if (!invoice) break;
        logger.info({ invoiceId: invoice.id }, "Invoice paid");

        try {
          await db.insert(invoicesTable).values({
            orgId: 1,
            stripeInvoiceId: invoice.id as string,
            amount: ((invoice.amount_paid as number) / 100).toFixed(2),
            currency: invoice.currency as string,
            status: "paid",
            paidAt: new Date(),
          });
        } catch (dbErr) {
          logger.warn({ dbErr }, "Invoice may already exist in DB");
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = eventData;
        if (!invoice) break;
        logger.info({ invoiceId: invoice.id }, "Invoice payment failed");

        if (invoice.subscription) {
          await db
            .update(subscriptionsTable)
            .set({ status: "past_due", updatedAt: new Date() })
            .where(eq(subscriptionsTable.stripeSubscriptionId, invoice.subscription as string));
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = eventData;
        if (!pi) break;
        logger.info({ paymentIntentId: pi.id, amount: pi.amount }, "Payment intent succeeded");
        break;
      }

      default:
        logger.info({ eventType }, "Unhandled webhook event type");
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Webhook processing error");
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
