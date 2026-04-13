import { Router, type IRouter, type Request, type Response } from "express";
import { db, billingPlansTable, subscriptionsTable, revenueEventsTable, organizationsTable } from "@szl-holdings/db";
import { eq, desc, and } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { services } from "@szl-holdings/services";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const INTELLIGENCE_FEEDS = {
  "maritime-risk": {
    name: "Weekly Maritime Risk Digest",
    priceEnv: "STRIPE_PRICE_INTEL_MARITIME_WEEKLY",
    interval: "month",
    domain: "maritime",
  },
  "property-pulse": {
    name: "Monthly Property Market Pulse",
    priceEnv: "STRIPE_PRICE_INTEL_PROPERTY_MONTHLY",
    interval: "month",
    domain: "real-estate",
  },
  "legal-landscape": {
    name: "Quarterly Legal Landscape Review",
    priceEnv: "STRIPE_PRICE_INTEL_LEGAL_QUARTERLY",
    interval: "quarter",
    domain: "legal",
  },
  "threat-brief": {
    name: "Weekly Security Threat Brief",
    priceEnv: "STRIPE_PRICE_INTEL_SECURITY_WEEKLY",
    interval: "month",
    domain: "security",
  },
} as const;

const MARKETPLACE_PLANS = {
  "agent-access-monthly": {
    name: "Agent Access — Monthly",
    priceEnv: "STRIPE_PRICE_MARKETPLACE_AGENT_MONTHLY",
    interval: "month",
    description: "Access to individual agent capabilities on a per-run basis",
  },
  "agent-access-annual": {
    name: "Agent Access — Annual",
    priceEnv: "STRIPE_PRICE_MARKETPLACE_AGENT_ANNUAL",
    interval: "year",
    description: "Annual agent access with volume discount",
  },
  "white-label-starter": {
    name: "White-Label Starter",
    priceEnv: "STRIPE_PRICE_MARKETPLACE_WL_STARTER",
    interval: "month",
    description: "White-label deployment for up to 3 agents",
  },
  "white-label-enterprise": {
    name: "White-Label Enterprise",
    priceEnv: "STRIPE_PRICE_MARKETPLACE_WL_ENTERPRISE",
    interval: "month",
    description: "Unlimited white-label deployments with SLA guarantee",
  },
} as const;

router.get("/billing/marketplace/feeds", (_req, res) => {
  const feeds = Object.entries(INTELLIGENCE_FEEDS).map(([feedId, feed]) => ({
    feedId,
    name: feed.name,
    interval: feed.interval,
    domain: feed.domain,
    configured: !!process.env[feed.priceEnv],
    stripePriceEnv: feed.priceEnv,
  }));
  sendSuccess(res, feeds);
});

router.post("/billing/marketplace/subscribe", authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const { feedId, feedName, email, successUrl, cancelUrl } = req.body as {
      feedId?: string;
      feedName?: string;
      email?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!feedId || !successUrl || !cancelUrl) {
      sendBadRequest(res, "feedId, successUrl, and cancelUrl are required");
      return;
    }

    const feed = INTELLIGENCE_FEEDS[feedId as keyof typeof INTELLIGENCE_FEEDS];
    if (!feed) {
      sendBadRequest(res, `Unknown feed "${feedId}". Valid feeds: ${Object.keys(INTELLIGENCE_FEEDS).join(", ")}`);
      return;
    }

    const stripeMode = process.env.STRIPE_SECRET_KEY
      ? process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")
        ? "live"
        : "test"
      : "mock";

    if (stripeMode === "mock") {
      sendSuccess(res, {
        stripeMode: "mock",
        mockMode: true,
        message: "Stripe not configured. Set STRIPE_SECRET_KEY and the corresponding STRIPE_PRICE_INTEL_* environment variables to enable live checkout.",
        feedId,
        feedName: feed.name,
      });
      return;
    }

    const priceId = process.env[feed.priceEnv];
    if (!priceId) {
      sendError(res, `Stripe price not configured for feed "${feedId}". Set ${feed.priceEnv} environment variable.`, 503);
      return;
    }

    let customerId: string | undefined;
    if (email) {
      const existing = await services.stripe.getCustomerByEmail(email);
      if (existing) customerId = existing.id;
    }

    const session = await services.stripe.createCheckoutSession({
      priceId,
      mode: "subscription",
      successUrl,
      cancelUrl,
      customerEmail: customerId ? undefined : email,
      customerId,
      metadata: {
        feedId,
        feedName: feed.name,
        product: "intelligence-feed",
        domain: feed.domain,
      },
    });

    logger.info({ feedId, sessionId: session.id }, "Intelligence feed checkout session created");
    sendSuccess(res, { sessionId: session.id, url: session.url });
  } catch (err) {
    handleRouteError(res, err, "Failed to create intelligence feed subscription checkout");
  }
});

router.get("/billing/marketplace/plans", (_req, res) => {
  const plans = Object.entries(MARKETPLACE_PLANS).map(([planId, plan]) => ({
    planId,
    name: plan.name,
    interval: plan.interval,
    description: plan.description,
    configured: !!process.env[plan.priceEnv],
    stripePriceEnv: plan.priceEnv,
  }));
  sendSuccess(res, plans);
});

router.post("/billing/marketplace/agent-checkout", authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const { planId, agentId, agentName, email, successUrl, cancelUrl } = req.body as {
      planId?: string;
      agentId?: string;
      agentName?: string;
      email?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!planId || !successUrl || !cancelUrl) {
      sendBadRequest(res, "planId, successUrl, and cancelUrl are required");
      return;
    }

    const plan = MARKETPLACE_PLANS[planId as keyof typeof MARKETPLACE_PLANS];
    if (!plan) {
      sendBadRequest(res, `Unknown plan "${planId}". Valid plans: ${Object.keys(MARKETPLACE_PLANS).join(", ")}`);
      return;
    }

    const stripeMode = process.env.STRIPE_SECRET_KEY ? "configured" : "mock";
    if (stripeMode === "mock") {
      sendSuccess(res, {
        stripeMode: "mock",
        mockMode: true,
        message: "Stripe not configured. Set STRIPE_SECRET_KEY to enable live checkout.",
        planId,
        planName: plan.name,
      });
      return;
    }

    const priceId = process.env[plan.priceEnv];
    if (!priceId) {
      sendError(res, `Stripe price not configured for plan "${planId}". Set ${plan.priceEnv}.`, 503);
      return;
    }

    const session = await services.stripe.createCheckoutSession({
      priceId,
      mode: "subscription",
      successUrl,
      cancelUrl,
      customerEmail: email,
      metadata: {
        planId,
        planName: plan.name,
        agentId: agentId ?? "",
        agentName: agentName ?? "",
        product: "marketplace",
      },
    });

    sendSuccess(res, { sessionId: session.id, url: session.url });
  } catch (err) {
    handleRouteError(res, err, "Failed to create marketplace agent checkout");
  }
});

router.post("/billing/marketplace/metered-usage", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { agentId, subscriptionItemId, quantity, action } = req.body as {
      agentId?: string;
      subscriptionItemId?: string;
      quantity?: number;
      action?: "increment" | "set";
    };

    if (!subscriptionItemId || quantity == null) {
      sendBadRequest(res, "subscriptionItemId and quantity are required");
      return;
    }

    const record = await services.stripe.createMeteredUsageRecord(
      subscriptionItemId,
      quantity,
      action ?? "increment",
    );

    try {
      await db.insert(revenueEventsTable).values({
        eventType: "agent.run",
        product: "marketplace",
        amount: null,
        currency: "usd",
        metadata: { agentId: agentId ?? "", quantity: String(quantity), usageRecordId: record.id },
        idempotencyKey: `agent-run-${agentId}-${Date.now()}`,
      }).onConflictDoNothing();
    } catch (_dbErr) {
      logger.warn({ agentId }, "Failed to record metered usage event in DB — non-fatal");
    }

    sendSuccess(res, { usageRecordId: record.id, quantity: record.quantity });
  } catch (err) {
    handleRouteError(res, err, "Failed to report agent metered usage");
  }
});

router.get("/billing/marketplace/revenue", authMiddleware(), async (_req, res) => {
  try {
    const stripeMode = process.env.STRIPE_SECRET_KEY ? "configured" : "mock";

    if (stripeMode === "mock") {
      sendSuccess(res, {
        stripeMode: "mock",
        message: "Connect Stripe to see live revenue data",
        mock: {
          mrr: 36200,
          arr: 434400,
          activeSubscriptions: 45,
          feeds: [
            { feedId: "maritime-risk", subscriptions: 8, mrr: 9600 },
            { feedId: "threat-brief", subscriptions: 6, mrr: 5700 },
            { feedId: "property-pulse", subscriptions: 5, mrr: 4000 },
            { feedId: "legal-landscape", subscriptions: 4, mrr: 7200 },
          ],
        },
      });
      return;
    }

    const analytics = await services.stripe.getRevenueAnalytics();
    sendSuccess(res, { stripeMode, ...analytics });
  } catch (err) {
    handleRouteError(res, err, "Failed to get marketplace revenue analytics");
  }
});

router.get("/billing/marketplace/stripe-config", (_req, res) => {
  const stripeMode = process.env.STRIPE_SECRET_KEY
    ? process.env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "live" : "test"
    : "mock";

  const priceVars = [
    ...Object.entries(INTELLIGENCE_FEEDS).map(([id, f]) => ({
      envVar: f.priceEnv,
      label: `Intelligence Feed — ${f.name}`,
    })),
    ...Object.entries(MARKETPLACE_PLANS).map(([id, p]) => ({
      envVar: p.priceEnv,
      label: `Marketplace — ${p.name}`,
    })),
  ];

  const prices = priceVars.map(({ envVar, label }) => ({
    envVar,
    label,
    configured: !!process.env[envVar],
  }));

  const configured = prices.filter(p => p.configured).length;

  sendSuccess(res, {
    stripeConnected: !!process.env.STRIPE_SECRET_KEY,
    stripeMode,
    priceIdsConfigured: configured,
    priceIdsTotal: prices.length,
    prices,
    instructions:
      stripeMode === "mock"
        ? "Set STRIPE_SECRET_KEY to activate live payments. Then create products in Stripe Dashboard and set each STRIPE_PRICE_INTEL_* and STRIPE_PRICE_MARKETPLACE_* env var to the corresponding price ID."
        : `Stripe is connected in ${stripeMode} mode. ${configured}/${prices.length} marketplace price IDs configured.`,
  });
});

export default router;
