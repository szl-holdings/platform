import {
  billingAuditLogTable,
  billingPaymentMethodsTable,
  billingPlansTable,
  billingRefundRequestsTable,
  db,
  entitlementOverridesTable,
  entitlementsTable,
  fulfillmentsTable,
  invoicesTable,
  organizationsTable,
  revenueEventsTable,
  subscriptionsTable,
  usageEventsTable,
} from '@szl-holdings/db';
import { services } from '@szl-holdings/services';
import { and, desc, eq, gt, inArray, isNull, or } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import type { z } from 'zod';
import {
  handleRouteError,
  parsePagination,
  sendBadRequest,
  sendError,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { actorFromReq, writeBillingAudit } from '../lib/billing-audit';
import { dispatchWebhookEvent } from '../lib/billing-webhook';
import { logger } from '../lib/logger';
import { isFlagEnabled } from '../lib/platform-flags';
import { requireStripeLive } from '../lib/stripe-gate';
import {
  billingAegisEnterpriseQuoteSchema,
  billingAegisInvoiceSchema,
  billingCheckoutSchema,
  billingCommandSubscribeSchema,
  billingCustomerPortalSchema,
  billingMeteredUsageSchema,
  billingPortalSessionSchema,
  billingSyncPlansSchema,
  cancelSubscriptionSchema,
  listQuerySchema,
  planSubscribeSchema,
  stripeCheckoutSchema,
  stripeWebhookBodySchema,
  updateSubscriptionSchema,
  validateBody,
  validateQuery,
} from '../lib/validation';
import { authMiddleware, parseIdParam, requireRole } from '../middlewares/auth';
import {
  assertTenantAccess,
  getUserOrgIds,
  recordTenantIsolationViolation,
} from '../middlewares/tenant-scope';

const router: IRouter = Router();

router.get('/billing/plans', authMiddleware(), async (_req, res) => {
  try {
    const plans = await db.select().from(billingPlansTable).orderBy(billingPlansTable.name);
    sendSuccess(res, plans);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list billing plans');
  }
});

router.get('/billing/plans/:id', authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [plan] = await db.select().from(billingPlansTable).where(eq(billingPlansTable.id, id));
    if (!plan) {
      sendNotFound(res, 'Billing plan');
      return;
    }
    sendSuccess(res, plan);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get billing plan');
  }
});

router.get(
  '/billing/subscriptions',
  authMiddleware(),
  requireRole('ops', 'analyst'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) {
        sendSuccess(res, [], 200, { page: 1, limit: 50, offset: 0 });
        return;
      }
      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const subs = await db
        .select()
        .from(subscriptionsTable)
        .where(orgIds !== null ? inArray(subscriptionsTable.orgId, [...orgIds]) : undefined)
        .orderBy(desc(subscriptionsTable.createdAt))
        .limit(limit)
        .offset(offset);
      sendSuccess(res, subs, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list subscriptions');
    }
  },
);

router.get(
  '/billing/invoices',
  authMiddleware(),
  requireRole('ops', 'analyst'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) {
        sendSuccess(res, [], 200, { page: 1, limit: 50, offset: 0 });
        return;
      }
      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const invs = await db
        .select()
        .from(invoicesTable)
        .where(orgIds !== null ? inArray(invoicesTable.orgId, [...orgIds]) : undefined)
        .orderBy(desc(invoicesTable.createdAt))
        .limit(limit)
        .offset(offset);
      sendSuccess(res, invs, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list invoices');
    }
  },
);

router.get('/billing/products', async (_req, res) => {
  try {
    const products = await services.stripe.listProducts();
    sendSuccess(res, products);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list Stripe products');
  }
});

router.post(
  '/billing/checkout',
  validateBody(billingCheckoutSchema),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { priceId, mode, successUrl, cancelUrl, customerEmail } = req.body as z.infer<
        typeof billingCheckoutSchema
      >;

      const orgId = req.tenantOrgId ?? null;

      // Tenant-scoped customer resolution:
      // - Authenticated (orgId present): use the org's canonical billingCustomerId.
      //   If no mapping exists yet, call createCustomer (ALWAYS creates a new Stripe
      //   customer; never email-based lookup) so that each org gets its own isolated
      //   Stripe customer even if multiple orgs share an email identity.
      // - Unauthenticated (orgId absent): email-based lookup is an acceptable
      //   fallback (no org context to isolate).
      let customerId: string | undefined;
      if (orgId) {
        const [org] = await db
          .select({ billingCustomerId: organizationsTable.billingCustomerId })
          .from(organizationsTable)
          .where(eq(organizationsTable.id, orgId));

        if (org?.billingCustomerId) {
          customerId = org.billingCustomerId;
        } else if (customerEmail) {
          // Deliberately NOT using ensureCustomer (which does getCustomerByEmail
          // first) to prevent cross-tenant customer reuse when email identities overlap.
          const customer = await services.stripe.createCustomer(customerEmail, undefined, {
            orgId: String(orgId),
          });
          customerId = customer.id;
          await db
            .update(organizationsTable)
            .set({ billingCustomerId: customerId })
            .where(eq(organizationsTable.id, orgId));
        }
      } else if (customerEmail) {
        const existing = await services.stripe.getCustomerByEmail(customerEmail);
        if (existing) customerId = existing.id;
      }

      // Idempotency key strategy:
      // - Client-provided key: scoped to org to prevent cross-tenant replay.
      // - No client key: derive deterministically from org + priceId so server-
      //   side retries converge on the same Stripe session rather than creating
      //   duplicates (UUID fallback is intentionally removed here).
      const clientKey = req.headers['x-idempotency-key'] as string | undefined;
      const idempotencyKey = clientKey
        ? `checkout-${orgId ?? 'anon'}-${clientKey}`
        : `checkout-${orgId ?? 'anon'}-${priceId}`;

      const session = await services.stripe.createCheckoutSession({
        priceId,
        mode: mode ?? 'subscription',
        successUrl,
        cancelUrl,
        customerEmail: customerId ? undefined : customerEmail,
        customerId,
        metadata: { orgId: String(orgId ?? ''), idempotencyKey },
        idempotencyKey,
      });

      void writeBillingAudit({
        req,
        orgId,
        ...actorFromReq(req),
        action: 'checkout.initiated',
        resource: 'checkout_session',
        resourceId: session.id,
        stripeCustomerId: customerId ?? null,
        idempotencyKey,
        after: { priceId, mode: mode ?? 'subscription', sessionId: session.id },
      });

      sendSuccess(res, { sessionId: session.id, url: session.url });
    } catch (err) {
      logger.error({ err }, 'Failed to create checkout session');
      handleRouteError(res, err, 'Failed to create checkout session');
    }
  },
);

router.get(
  '/billing/subscription-status',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const [org] = await db
        .select({ billingCustomerId: organizationsTable.billingCustomerId })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, orgId));

      const resolvedCustomerId = org?.billingCustomerId;
      if (!resolvedCustomerId) {
        sendSuccess(res, { subscribed: false, subscription: null, allSubscriptions: [] });
        return;
      }

      const subscriptions = await services.stripe.listCustomerSubscriptions(resolvedCustomerId);
      const active = subscriptions.find((s) => s.status === 'active' || s.status === 'trialing');

      sendSuccess(res, {
        subscribed: !!active,
        subscription: active ?? null,
        allSubscriptions: subscriptions,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to get subscription status');
      handleRouteError(res, err, 'Failed to get subscription status');
    }
  },
);

router.post(
  '/billing/customer-portal',
  authMiddleware(),
  validateBody(billingCustomerPortalSchema),
  requireStripeLive,
  async (req: Request, res: Response) => {
    const portalEnabled = await isFlagEnabled('pilot_customer_portal_enabled');
    if (!portalEnabled) {
      sendForbidden(res, 'Feature not available: pilot_customer_portal_enabled');
      return;
    }
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const [org] = await db
        .select({ billingCustomerId: organizationsTable.billingCustomerId })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, orgId));

      const ownedCustomerId = org?.billingCustomerId;
      if (!ownedCustomerId) {
        sendBadRequest(res, 'No Stripe customer record found for this organization');
        return;
      }

      const { returnUrl } = req.body as z.infer<typeof billingCustomerPortalSchema>;
      const session = await services.stripe.createCustomerPortalSession(ownedCustomerId, returnUrl);

      void writeBillingAudit({
        req,
        orgId,
        ...actorFromReq(req),
        action: 'portal.opened',
        resource: 'billing_portal',
        stripeCustomerId: ownedCustomerId,
        after: { portalUrl: session.url },
      });

      sendSuccess(res, { url: session.url });
    } catch (err) {
      logger.error({ err }, 'Failed to create customer portal session');
      handleRouteError(res, err, 'Failed to create customer portal session');
    }
  },
);

router.post(
  '/billing/portal-session',
  validateBody(billingPortalSessionSchema),
  authMiddleware(),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const returnUrl =
        (req.body as { returnUrl?: string }).returnUrl ?? req.headers.referer ?? '/';

      // Use org-scoped billingCustomerId — never resolve by user email to
      // avoid cross-tenant customer binding if email identities overlap.
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const [org] = await db
        .select({ billingCustomerId: organizationsTable.billingCustomerId })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, orgId));

      const ownedCustomerId = org?.billingCustomerId;
      if (!ownedCustomerId) {
        sendBadRequest(res, 'No Stripe customer record found — complete a checkout first');
        return;
      }

      const session = await services.stripe.createCustomerPortalSession(ownedCustomerId, returnUrl);
      void writeBillingAudit({
        req,
        orgId,
        ...actorFromReq(req),
        action: 'portal.session.created',
        resource: 'customer_portal',
        resourceId: null,
        stripeCustomerId: ownedCustomerId,
        after: { url: session.url, returnUrl },
      });
      sendSuccess(res, { url: session.url });
    } catch (err) {
      logger.error({ err }, 'Failed to create portal session');
      handleRouteError(res, err, 'Failed to create portal session');
    }
  },
);

router.get(
  '/billing/checkout-session/:sessionId',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId as string;
      if (!sessionId) {
        sendBadRequest(res, 'sessionId is required');
        return;
      }

      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const [org] = await db
        .select({ billingCustomerId: organizationsTable.billingCustomerId })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, orgId));

      const ownedCustomerId = org?.billingCustomerId;
      if (!ownedCustomerId) {
        sendForbidden(res, 'No Stripe customer record found for this organization');
        return;
      }

      const session = await services.stripe.getCheckoutSession(sessionId);
      if (!session) {
        sendNotFound(res, 'Checkout session');
        return;
      }

      const sessionCustomer =
        typeof session.customer === 'string'
          ? session.customer
          : (session.customer as { id?: string } | null)?.id ?? null;

      if (sessionCustomer !== ownedCustomerId) {
        recordTenantIsolationViolation(
          req,
          req.user,
          orgId,
          `checkout-session customer mismatch: session=${sessionCustomer} org=${ownedCustomerId}`,
        );
        sendForbidden(res, 'Checkout session does not belong to your organization');
        return;
      }

      sendSuccess(res, session);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get checkout session');
    }
  },
);

router.get(
  '/billing/stripe-invoices',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const [org] = await db
        .select({ billingCustomerId: organizationsTable.billingCustomerId })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, orgId));

      const ownedCustomerId = org?.billingCustomerId;
      if (!ownedCustomerId) {
        sendSuccess(res, []);
        return;
      }

      const invoices = await services.stripe.listInvoices(ownedCustomerId);
      sendSuccess(res, invoices);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list Stripe invoices');
    }
  },
);

router.get('/billing/stripe-config', async (_req, res) => {
  try {
    const stripeMode = process.env.STRIPE_SECRET_KEY
      ? process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')
        ? 'live'
        : 'test'
      : 'mock';

    const priceVars = [
      { key: 'STRIPE_PRICE_SZL_PRO_MONTHLY', label: 'SZL Holdings — Pro (Monthly)' },
      { key: 'STRIPE_PRICE_SZL_PRO_ANNUAL', label: 'SZL Holdings — Pro (Annual)' },
      { key: 'STRIPE_PRICE_COMMAND_PRO_MONTHLY', label: 'Command — Pro (Monthly)' },
      { key: 'STRIPE_PRICE_COMMAND_PRO_ANNUAL', label: 'Command — Pro (Annual)' },
      { key: 'STRIPE_PRICE_VESSELS_ENTERPRISE_MONTHLY', label: 'Vessels — Enterprise (Monthly)' },
      { key: 'STRIPE_PRICE_VESSELS_ENTERPRISE_ANNUAL', label: 'Vessels — Enterprise (Annual)' },
      { key: 'STRIPE_PRICE_PULSE_EXECUTIVE_MONTHLY', label: 'Pulse — Executive (Monthly)' },
      { key: 'STRIPE_PRICE_PULSE_EXECUTIVE_ANNUAL', label: 'Pulse — Executive (Annual)' },
      { key: 'STRIPE_PRICE_TERRA_STARTER_MONTHLY', label: 'Terra — Starter (Monthly)' },
      { key: 'STRIPE_PRICE_TERRA_STARTER_ANNUAL', label: 'Terra — Starter (Annual)' },
      { key: 'STRIPE_PRICE_TERRA_PRO_MONTHLY', label: 'Terra — Pro (Monthly)' },
      { key: 'STRIPE_PRICE_TERRA_PRO_ANNUAL', label: 'Terra — Pro (Annual)' },
      { key: 'STRIPE_PRICE_TERRA_ENTERPRISE_MONTHLY', label: 'Terra — Enterprise (Monthly)' },
      { key: 'STRIPE_PRICE_TERRA_ENTERPRISE_ANNUAL', label: 'Terra — Enterprise (Annual)' },
      { key: 'STRIPE_PRICE_SENTRA_TEAM_MONTHLY', label: 'Sentra — Team (Monthly)' },
      { key: 'STRIPE_PRICE_SENTRA_TEAM_ANNUAL', label: 'Sentra — Team (Annual)' },
      { key: 'STRIPE_PRICE_COUNSEL_TEAM_MONTHLY', label: 'Counsel — Team (Monthly)' },
      { key: 'STRIPE_PRICE_COUNSEL_TEAM_ANNUAL', label: 'Counsel — Team (Annual)' },
      { key: 'STRIPE_PRICE_AEGIS_ENTERPRISE', label: 'Aegis — Enterprise' },
      { key: 'STRIPE_PRICE_STRATEGY_SESSION', label: 'Carlota Jo — Strategy Session' },
      { key: 'STRIPE_PRICE_PORTFOLIO_REVIEW', label: 'Carlota Jo — Portfolio Review' },
      { key: 'STRIPE_PRICE_ADVISORY_RETAINER', label: 'Carlota Jo — Advisory Retainer' },
    ];

    const prices = priceVars.map(({ key, label }) => ({
      envVar: key,
      label,
      configured: !!process.env[key],
    }));

    const configured = prices.filter((p) => p.configured).length;

    sendSuccess(res, {
      stripeConnected: !!process.env.STRIPE_SECRET_KEY,
      stripeMode,
      webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      priceIdsConfigured: configured,
      priceIdsTotal: prices.length,
      prices,
      instructions:
        stripeMode === 'mock'
          ? 'Set STRIPE_SECRET_KEY secret to activate live payment processing. Then create products in Stripe and set each STRIPE_PRICE_* env var to the corresponding Stripe price ID.'
          : `Stripe is connected in ${stripeMode} mode. ${configured}/${prices.length} price IDs are configured.`,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get Stripe config');
  }
});

router.post(
  '/billing/webhooks',
  validateBody(stripeWebhookBodySchema),
  async (req: Request, res: Response) => {
    try {
      const signature = req.headers['stripe-signature'] as string | undefined;
      const rawBody =
        (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ??
        JSON.stringify(req.body);
      const { verified, event } = await services.stripe.verifyWebhookPayload(rawBody, signature);

      if (!verified || !event) {
        logger.warn('Webhook signature verification failed');
        sendBadRequest(res, 'Invalid webhook signature');
        return;
      }

      const eventType = event.type as string;
      if (!eventType) {
        sendBadRequest(res, 'Invalid webhook event');
        return;
      }

      logger.info({ eventType, eventId: event.id }, '[webhook] Stripe event received');

      const { duplicate } = await dispatchWebhookEvent({
        id: event.id as string,
        type: eventType,
        data: { object: (event.data as Record<string, unknown>)?.['object'] as Record<string, unknown> },
      });

      if (duplicate) {
        res.json({ received: true, duplicate: true });
        return;
      }

      res.json({ received: true, duplicate: false });
      return;
    } catch (err) {
      logger.error({ err }, '[webhook] Webhook processing error');
      sendError(res, 'Webhook processing failed', 500, 'WEBHOOK_ERROR');
      return;
    }

  },
);

router.post(
  '/stripe/checkout',
  validateBody(stripeCheckoutSchema),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { tierId, tierName, service, email, successUrl, cancelUrl } = req.body as z.infer<
        typeof stripeCheckoutSchema
      >;

      const tierPricing: Record<string, string> = {
        'strategy-session': process.env.STRIPE_PRICE_STRATEGY_SESSION || '',
        'portfolio-review': process.env.STRIPE_PRICE_PORTFOLIO_REVIEW || '',
        'advisory-retainer': process.env.STRIPE_PRICE_ADVISORY_RETAINER || '',
      };

      const priceId = tierPricing[tierId];
      if (!priceId) {
        sendBadRequest(
          res,
          `No Stripe price configured for tier "${tierId}". Set the corresponding STRIPE_PRICE_* environment variable.`,
        );
        return;
      }

      const session = await services.stripe.createCheckoutSession({
        priceId,
        mode: 'payment',
        successUrl,
        cancelUrl,
        customerEmail: email,
        metadata: { tierId: tierId || '', tierName: tierName || '', service: service || '' },
      });

      void writeBillingAudit({
        req,
        orgId: req.tenantOrgId ?? null,
        ...actorFromReq(req),
        action: 'checkout.initiated',
        resource: 'checkout_session',
        resourceId: session.id,
        stripeCustomerId: null,
        after: { sessionId: session.id, tierId, tierName, service, product: 'carlota-jo' },
      });

      res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
        status: session.status,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to initiate checkout');
    }
  },
);

const COMMAND_PLANS = {
  'command-pro-monthly': {
    priceEnv: 'STRIPE_PRICE_COMMAND_PRO_MONTHLY',
    name: 'Command Pro (Monthly)',
    interval: 'month',
  },
  'command-pro-annual': {
    priceEnv: 'STRIPE_PRICE_COMMAND_PRO_ANNUAL',
    name: 'Command Pro (Annual)',
    interval: 'year',
  },
} as const;

router.get('/billing/command/plans', (_req, res) => {
  const plans = Object.entries(COMMAND_PLANS).map(([planId, plan]) => ({
    planId,
    name: plan.name,
    interval: plan.interval,
    configured: !!process.env[plan.priceEnv],
    stripePriceEnv: plan.priceEnv,
  }));
  sendSuccess(res, plans);
});

router.post(
  '/billing/command/subscribe',
  validateBody(billingCommandSubscribeSchema),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { planId, email, successUrl, cancelUrl } = req.body as z.infer<
        typeof billingCommandSubscribeSchema
      >;

      const plan = COMMAND_PLANS[planId as keyof typeof COMMAND_PLANS];
      if (!plan) {
        sendBadRequest(
          res,
          `Unknown Command plan "${planId}". Valid: ${Object.keys(COMMAND_PLANS).join(', ')}`,
        );
        return;
      }

      const priceId = process.env[plan.priceEnv];
      if (!priceId) {
        sendError(res, `Stripe price not configured for "${planId}". Set ${plan.priceEnv}.`, 503);
        return;
      }

      const session = await services.stripe.createCheckoutSession({
        priceId,
        mode: 'subscription',
        successUrl,
        cancelUrl,
        customerEmail: email,
        metadata: { planId, planName: plan.name, product: 'command' },
      });

      void writeBillingAudit({
        req,
        orgId: req.tenantOrgId ?? null,
        ...actorFromReq(req),
        action: 'checkout.initiated',
        resource: 'checkout_session',
        resourceId: session.id,
        stripeCustomerId: null,
        after: { sessionId: session.id, planId, planName: plan.name, product: 'command' },
      });

      sendSuccess(res, { sessionId: session.id, url: session.url });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create Command subscription checkout');
    }
  },
);

const TERRA_PLANS = {
  'terra-starter-monthly': {
    priceEnv: 'STRIPE_PRICE_TERRA_STARTER_MONTHLY',
    name: 'Terra Starter (Monthly)',
    interval: 'month',
  },
  'terra-starter-annual': {
    priceEnv: 'STRIPE_PRICE_TERRA_STARTER_ANNUAL',
    name: 'Terra Starter (Annual)',
    interval: 'year',
  },
  'terra-pro-monthly': {
    priceEnv: 'STRIPE_PRICE_TERRA_PRO_MONTHLY',
    name: 'Terra Pro (Monthly)',
    interval: 'month',
  },
  'terra-pro-annual': {
    priceEnv: 'STRIPE_PRICE_TERRA_PRO_ANNUAL',
    name: 'Terra Pro (Annual)',
    interval: 'year',
  },
  'terra-enterprise-monthly': {
    priceEnv: 'STRIPE_PRICE_TERRA_ENTERPRISE_MONTHLY',
    name: 'Terra Enterprise (Monthly)',
    interval: 'month',
  },
  'terra-enterprise-annual': {
    priceEnv: 'STRIPE_PRICE_TERRA_ENTERPRISE_ANNUAL',
    name: 'Terra Enterprise (Annual)',
    interval: 'year',
  },
} as const;

router.get('/billing/terra/plans', (_req, res) => {
  const plans = Object.entries(TERRA_PLANS).map(([planId, plan]) => ({
    planId,
    name: plan.name,
    interval: plan.interval,
    configured: !!process.env[plan.priceEnv],
    stripePriceEnv: plan.priceEnv,
  }));
  sendSuccess(res, plans);
});

router.post(
  '/billing/terra/subscribe',
  validateBody(planSubscribeSchema),
  authMiddleware({ required: false }),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { planId, email, successUrl, cancelUrl } = req.body as z.infer<
        typeof planSubscribeSchema
      >;

      const plan = TERRA_PLANS[planId as keyof typeof TERRA_PLANS];
      if (!plan) {
        sendBadRequest(
          res,
          `Unknown Terra plan "${planId}". Valid plans: ${Object.keys(TERRA_PLANS).join(', ')}`,
        );
        return;
      }

      const priceId = process.env[plan.priceEnv];
      if (!priceId) {
        sendError(
          res,
          `Stripe price not configured for plan "${planId}". Set ${plan.priceEnv}.`,
          503,
        );
        return;
      }

      const session = await services.stripe.createCheckoutSession({
        priceId,
        mode: 'subscription',
        successUrl,
        cancelUrl,
        customerEmail: email,
        metadata: { planId, planName: plan.name, product: 'terra' },
      });

      void writeBillingAudit({
        req,
        orgId: req.tenantOrgId ?? null,
        ...actorFromReq(req),
        action: 'checkout.initiated',
        resource: 'checkout_session',
        resourceId: session.id,
        stripeCustomerId: null,
        after: { sessionId: session.id, planId, planName: plan.name, product: 'terra' },
      });

      sendSuccess(res, { sessionId: session.id, url: session.url });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create Terra subscription checkout');
    }
  },
);

router.post(
  '/billing/terra/metered-usage',
  validateBody(billingMeteredUsageSchema),
  authMiddleware(),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { subscriptionItemId, quantity, action, timestamp } = req.body as {
        subscriptionItemId?: string;
        quantity?: number;
        action?: 'increment' | 'set';
        timestamp?: number;
      };

      if (!subscriptionItemId || quantity == null) {
        sendBadRequest(res, 'subscriptionItemId and quantity are required');
        return;
      }

      const record = await services.stripe.createMeteredUsageRecord(
        subscriptionItemId,
        quantity,
        action ?? 'increment',
        timestamp,
      );

      sendSuccess(res, { usageRecordId: record.id, quantity: record.quantity });
    } catch (err) {
      handleRouteError(res, err, 'Failed to report metered usage');
    }
  },
);

async function handleAegisEnterpriseQuote(req: Request, res: Response): Promise<void> {
  try {
    const { companyName, email, contactName, seats, addOns, notes, successUrl, cancelUrl } =
      req.body as {
        companyName?: string;
        email?: string;
        contactName?: string;
        seats?: number;
        addOns?: string[];
        notes?: string;
        successUrl?: string;
        cancelUrl?: string;
      };

    if (!email || !companyName) {
      sendBadRequest(res, 'email and companyName are required');
      return;
    }

    const customer = await services.stripe.createCustomer(email, contactName ?? companyName, {
      company: companyName,
      product: 'aegis',
      requestType: 'enterprise-quote',
      seats: String(seats ?? 0),
      addOns: (addOns ?? []).join(', '),
    });

    if (services.stripe.isLive) {
      const enterprisePriceId = process.env.STRIPE_PRICE_AEGIS_ENTERPRISE;

      if (enterprisePriceId && successUrl && cancelUrl) {
        const session = await services.stripe.createCheckoutSession({
          priceId: enterprisePriceId,
          mode: 'subscription',
          customerId: customer.id,
          successUrl,
          cancelUrl,
          metadata: { product: 'aegis', companyName, notes: notes ?? '' },
        });
        sendSuccess(res, {
          status: 'checkout',
          customerId: customer.id,
          sessionId: session.id,
          url: session.url,
        });
        return;
      }

      const baseAmount = seats ? Math.max(seats, 10) * 990_00 : 990_00;
      const lineItems = [
        {
          description: `Aegis Enterprise — ${seats ?? 1} seat${(seats ?? 1) !== 1 ? 's' : ''}`,
          amount: baseAmount,
          currency: 'usd',
        },
        ...(addOns ?? []).map((addon) => ({
          description: `Add-on: ${addon}`,
          amount: 50_00,
          currency: 'usd',
        })),
      ];

      const invoice = await services.stripe.createInvoice(customer.id, lineItems, {
        notes:
          notes ??
          `Enterprise inquiry from ${companyName}. Add-ons requested: ${(addOns ?? []).join(', ') || 'none'}.`,
        metadata: { product: 'aegis', companyName, requestType: 'enterprise-quote' },
      });

      sendSuccess(res, {
        status: 'invoiced',
        customerId: customer.id,
        invoiceId: invoice.id,
        invoiceStatus: invoice.status,
        hostedInvoiceUrl: invoice.hostedInvoiceUrl,
        message:
          'Enterprise invoice sent to your email. An Aegis specialist will follow up within 1 business day.',
      });
      return;
    }

    sendSuccess(res, {
      status: 'pending',
      customerId: customer.id,
      message:
        'Enterprise quote request received. A team member will contact you within 1 business day.',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to create enterprise quote');
  }
}

router.post(
  '/billing/aegis/enterprise-quote',
  validateBody(billingAegisEnterpriseQuoteSchema),
  authMiddleware({ required: false }),
  requireStripeLive,
  handleAegisEnterpriseQuote,
);

router.post(
  '/billing/sync-plans',
  validateBody(billingSyncPlansSchema),
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      if (!services.stripe.isLive) {
        sendBadRequest(res, 'Stripe must be connected (STRIPE_SECRET_KEY set) to sync plans');
        return;
      }

      const products = await services.stripe.listProducts();
      const upserted: Array<{
        slug: string;
        name: string;
        stripePriceId: string | null;
        action: 'created' | 'updated' | 'skipped';
      }> = [];

      for (const product of products) {
        if (!product.active) continue;

        const primaryPrice =
          product.prices.find((p) => p.interval === 'month') ?? product.prices[0];
        if (!primaryPrice) {
          upserted.push({
            slug: product.id,
            name: product.name,
            stripePriceId: null,
            action: 'skipped',
          });
          continue;
        }

        const slug = product.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const priceMonthly = String((primaryPrice.amount / 100).toFixed(2));

        const [existing] = await db
          .select()
          .from(billingPlansTable)
          .where(
            or(
              eq(billingPlansTable.slug, slug),
              eq(billingPlansTable.stripePriceId, primaryPrice.id),
            ),
          );

        if (existing) {
          await db
            .update(billingPlansTable)
            .set({
              name: product.name,
              stripePriceId: primaryPrice.id,
              priceMonthly,
              isActive: true,
            })
            .where(eq(billingPlansTable.id, existing.id));
          upserted.push({
            slug,
            name: product.name,
            stripePriceId: primaryPrice.id,
            action: 'updated',
          });
        } else {
          await db.insert(billingPlansTable).values({
            name: product.name,
            slug,
            description: product.description ?? null,
            stripePriceId: primaryPrice.id,
            priceMonthly,
            isActive: true,
          });
          upserted.push({
            slug,
            name: product.name,
            stripePriceId: primaryPrice.id,
            action: 'created',
          });
        }
      }

      sendSuccess(res, { synced: upserted.length, plans: upserted });
    } catch (err) {
      handleRouteError(res, err, 'Failed to sync billing plans from Stripe');
    }
  },
);

router.post(
  '/billing/cancel-subscription',
  validateBody(cancelSubscriptionSchema),
  authMiddleware(),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { subscriptionId, cancelImmediately } = req.body as z.infer<
        typeof cancelSubscriptionSchema
      >;

      if (!services.stripe.isLive) {
        sendSuccess(res, {
          status: 'canceled',
          subscriptionId,
          message: cancelImmediately
            ? 'Subscription canceled immediately (demo mode)'
            : 'Subscription set to cancel at period end (demo mode)',
        });
        return;
      }

      const updated = await services.stripe.cancelSubscription(subscriptionId, {
        cancelImmediately,
      });
      if (!updated) {
        sendNotFound(res, 'Subscription');
        return;
      }

      const newStatus = cancelImmediately ? 'canceled' : updated.status === 'active' ? 'active' : 'canceled';
      await db
        .update(subscriptionsTable)
        .set({
          status: newStatus,
          canceledAt: cancelImmediately ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.stripeSubscriptionId, subscriptionId));

      void writeBillingAudit({
        req,
        orgId: req.tenantOrgId ?? null,
        ...actorFromReq(req),
        action: cancelImmediately ? 'subscription.canceled' : 'subscription.cancel_scheduled',
        resource: 'subscription',
        resourceId: subscriptionId,
        stripeSubscriptionId: subscriptionId,
        after: {
          status: newStatus,
          cancelImmediately,
          cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
        },
      });

      sendSuccess(res, {
        status: updated.status,
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
        currentPeriodEnd: updated.currentPeriodEnd,
        message: cancelImmediately
          ? 'Subscription canceled immediately'
          : 'Subscription will cancel at end of current billing period',
      });
    } catch (err) {
      logger.error({ err }, 'Failed to cancel subscription');
      handleRouteError(res, err, 'Failed to cancel subscription');
    }
  },
);

router.post(
  '/billing/update-subscription',
  validateBody(updateSubscriptionSchema),
  authMiddleware(),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { subscriptionId, newPriceId } = req.body as z.infer<typeof updateSubscriptionSchema>;

      if (!services.stripe.isLive) {
        sendSuccess(res, {
          status: 'active',
          subscriptionId,
          newPriceId,
          message: 'Subscription plan updated (demo mode)',
        });
        return;
      }

      const updated = await services.stripe.updateSubscriptionPlan(subscriptionId, newPriceId);
      if (!updated) {
        sendNotFound(res, 'Subscription');
        return;
      }

      void writeBillingAudit({
        req,
        orgId: req.tenantOrgId ?? null,
        ...actorFromReq(req),
        action: 'subscription.plan_changed',
        resource: 'subscription',
        resourceId: subscriptionId,
        stripeSubscriptionId: subscriptionId,
        after: { status: updated.status, newPriceId, currentPeriodEnd: updated.currentPeriodEnd },
      });

      sendSuccess(res, {
        status: updated.status,
        priceId: updated.priceId,
        currentPeriodEnd: updated.currentPeriodEnd,
        message: 'Subscription plan updated with immediate proration',
      });
    } catch (err) {
      logger.error({ err }, 'Failed to update subscription');
      handleRouteError(res, err, 'Failed to update subscription');
    }
  },
);

router.get(
  '/billing/revenue-analytics',
  authMiddleware(),
  requireRole('ops', 'analyst', 'admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      if (!services.stripe.isLive) {
        const [subCount, invoiceSum] = await Promise.all([
          db.select().from(subscriptionsTable),
          db.select().from(invoicesTable),
        ]);

        const activeLocal = subCount.filter((s) => s.status === 'active').length;
        const trialingLocal = subCount.filter((s) => s.status === 'trialing').length;
        const pastDueLocal = subCount.filter((s) => s.status === 'past_due').length;
        const canceledLocal = subCount.filter((s) => s.status === 'canceled').length;
        const totalRevenue = invoiceSum
          .filter((i) => i.status === 'paid')
          .reduce((sum, i) => sum + parseFloat(String(i.amount)), 0);

        const plans = await db.select().from(billingPlansTable);
        const planMap = Object.fromEntries(plans.map((p) => [p.id, p]));

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        let localMrr = 0;
        for (const sub of subCount.filter((s) => s.status === 'active')) {
          const plan = planMap[sub.planId];
          if (plan?.priceMonthly) localMrr += parseFloat(String(plan.priceMonthly));
        }

        const newThisMonth = subCount.filter(
          (s) => s.createdAt >= monthStart && (s.status === 'active' || s.status === 'trialing'),
        ).length;
        const canceledThisMonth = subCount.filter(
          (s) => s.canceledAt && s.canceledAt >= monthStart,
        ).length;

        sendSuccess(res, {
          source: 'database',
          stripeMode: 'mock',
          mrr: Math.round(localMrr * 100),
          arr: Math.round(localMrr * 12 * 100),
          activeSubscriptions: activeLocal,
          trialingSubscriptions: trialingLocal,
          pastDueSubscriptions: pastDueLocal,
          canceledSubscriptions: canceledLocal,
          canceledThisMonth,
          newSubscriptionsThisMonth: newThisMonth,
          churnRate: 0,
          totalLifetimeRevenue: Math.round(totalRevenue * 100),
          recentInvoices: [],
        });
        return;
      }

      const analytics = await services.stripe.getRevenueAnalytics();
      const [subCount, invoiceSum] = await Promise.all([
        db.select().from(subscriptionsTable),
        db.select().from(invoicesTable),
      ]);

      const canceledLocal = subCount.filter((s) => s.status === 'canceled').length;
      const totalRevenue = invoiceSum
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + parseFloat(String(i.amount)), 0);

      sendSuccess(res, {
        source: 'stripe',
        stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test',
        ...analytics,
        canceledSubscriptions: canceledLocal,
        totalLifetimeRevenue: Math.round(totalRevenue * 100),
      });
    } catch (err) {
      logger.error({ err }, 'Failed to get revenue analytics');
      handleRouteError(res, err, 'Failed to get revenue analytics');
    }
  },
);

router.post(
  '/billing/aegis/invoice',
  validateBody(billingAegisInvoiceSchema),
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { customerId, lineItems, dueDate, notes } = req.body as {
        customerId?: string;
        lineItems?: Array<{ description: string; amount: number; currency?: string }>;
        dueDate?: number;
        notes?: string;
      };

      if (!customerId || !lineItems?.length) {
        sendBadRequest(res, 'customerId and lineItems are required');
        return;
      }

      const invoice = await services.stripe.createInvoice(customerId, lineItems, {
        dueDate,
        notes,
        metadata: { product: 'aegis' },
      });

      sendSuccess(res, {
        invoiceId: invoice.id,
        status: invoice.status,
        hostedUrl: invoice.hostedInvoiceUrl,
        pdfUrl: invoice.invoicePdf,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create and send invoice');
    }
  },
);

const SENTRA_PLANS = {
  'sentra-team-monthly': {
    priceEnv: 'STRIPE_PRICE_SENTRA_TEAM_MONTHLY',
    name: 'Sentra Team (Monthly)',
    interval: 'month',
  },
  'sentra-team-annual': {
    priceEnv: 'STRIPE_PRICE_SENTRA_TEAM_ANNUAL',
    name: 'Sentra Team (Annual)',
    interval: 'year',
  },
} as const;

router.get('/billing/sentra/plans', (_req, res) => {
  const plans = Object.entries(SENTRA_PLANS).map(([planId, plan]) => ({
    planId,
    name: plan.name,
    interval: plan.interval,
    configured: !!process.env[plan.priceEnv],
    stripePriceEnv: plan.priceEnv,
  }));
  sendSuccess(res, plans);
});

router.post(
  '/billing/sentra/subscribe',
  validateBody(planSubscribeSchema),
  authMiddleware({ required: false }),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { planId, email, successUrl, cancelUrl } = req.body as z.infer<typeof planSubscribeSchema>;
      const plan = SENTRA_PLANS[planId as keyof typeof SENTRA_PLANS];
      if (!plan) {
        sendBadRequest(res, `Unknown Sentra plan "${planId}". Valid: ${Object.keys(SENTRA_PLANS).join(', ')}`);
        return;
      }
      const priceId = process.env[plan.priceEnv];
      if (!priceId) {
        sendError(res, `Stripe price not configured for "${planId}". Set ${plan.priceEnv}.`, 503);
        return;
      }
      const session = await services.stripe.createCheckoutSession({
        priceId,
        mode: 'subscription',
        successUrl,
        cancelUrl,
        customerEmail: email,
        metadata: { planId, planName: plan.name, product: 'sentra' },
      });
      void writeBillingAudit({
        req,
        orgId: req.tenantOrgId ?? null,
        ...actorFromReq(req),
        action: 'checkout.initiated',
        resource: 'checkout_session',
        resourceId: session.id,
        stripeCustomerId: null,
        after: { sessionId: session.id, planId, planName: plan.name, product: 'sentra' },
      });
      sendSuccess(res, { sessionId: session.id, url: session.url });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create Sentra subscription checkout');
    }
  },
);

const COUNSEL_PLANS = {
  'counsel-team-monthly': {
    priceEnv: 'STRIPE_PRICE_COUNSEL_TEAM_MONTHLY',
    name: 'Counsel Team (Monthly)',
    interval: 'month',
  },
  'counsel-team-annual': {
    priceEnv: 'STRIPE_PRICE_COUNSEL_TEAM_ANNUAL',
    name: 'Counsel Team (Annual)',
    interval: 'year',
  },
} as const;

router.get('/billing/counsel/plans', (_req, res) => {
  const plans = Object.entries(COUNSEL_PLANS).map(([planId, plan]) => ({
    planId,
    name: plan.name,
    interval: plan.interval,
    configured: !!process.env[plan.priceEnv],
    stripePriceEnv: plan.priceEnv,
  }));
  sendSuccess(res, plans);
});

router.post(
  '/billing/counsel/subscribe',
  validateBody(planSubscribeSchema),
  authMiddleware({ required: false }),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { planId, email, successUrl, cancelUrl } = req.body as z.infer<typeof planSubscribeSchema>;
      const plan = COUNSEL_PLANS[planId as keyof typeof COUNSEL_PLANS];
      if (!plan) {
        sendBadRequest(res, `Unknown Counsel plan "${planId}". Valid: ${Object.keys(COUNSEL_PLANS).join(', ')}`);
        return;
      }
      const priceId = process.env[plan.priceEnv];
      if (!priceId) {
        sendError(res, `Stripe price not configured for "${planId}". Set ${plan.priceEnv}.`, 503);
        return;
      }
      const session = await services.stripe.createCheckoutSession({
        priceId,
        mode: 'subscription',
        successUrl,
        cancelUrl,
        customerEmail: email,
        metadata: { planId, planName: plan.name, product: 'counsel' },
      });
      void writeBillingAudit({
        req,
        orgId: req.tenantOrgId ?? null,
        ...actorFromReq(req),
        action: 'checkout.initiated',
        resource: 'checkout_session',
        resourceId: session.id,
        stripeCustomerId: null,
        after: { sessionId: session.id, planId, planName: plan.name, product: 'counsel' },
      });
      sendSuccess(res, { sessionId: session.id, url: session.url });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create Counsel subscription checkout');
    }
  },
);

const PULSE_PLANS = {
  'pulse-executive-monthly': {
    priceEnv: 'STRIPE_PRICE_PULSE_EXECUTIVE_MONTHLY',
    name: 'Pulse Executive (Monthly)',
    interval: 'month',
  },
  'pulse-executive-annual': {
    priceEnv: 'STRIPE_PRICE_PULSE_EXECUTIVE_ANNUAL',
    name: 'Pulse Executive (Annual)',
    interval: 'year',
  },
} as const;

router.get('/billing/pulse/plans', (_req, res) => {
  const plans = Object.entries(PULSE_PLANS).map(([planId, plan]) => ({
    planId,
    name: plan.name,
    interval: plan.interval,
    configured: !!process.env[plan.priceEnv],
    stripePriceEnv: plan.priceEnv,
  }));
  sendSuccess(res, plans);
});

router.post(
  '/billing/pulse/subscribe',
  validateBody(planSubscribeSchema),
  authMiddleware({ required: false }),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { planId, email, successUrl, cancelUrl } = req.body as z.infer<typeof planSubscribeSchema>;
      const plan = PULSE_PLANS[planId as keyof typeof PULSE_PLANS];
      if (!plan) {
        sendBadRequest(res, `Unknown Pulse plan "${planId}". Valid: ${Object.keys(PULSE_PLANS).join(', ')}`);
        return;
      }
      const priceId = process.env[plan.priceEnv];
      if (!priceId) {
        sendError(res, `Stripe price not configured for "${planId}". Set ${plan.priceEnv}.`, 503);
        return;
      }
      const session = await services.stripe.createCheckoutSession({
        priceId,
        mode: 'subscription',
        successUrl,
        cancelUrl,
        customerEmail: email,
        metadata: { planId, planName: plan.name, product: 'pulse' },
      });
      void writeBillingAudit({
        req,
        orgId: req.tenantOrgId ?? null,
        ...actorFromReq(req),
        action: 'checkout.initiated',
        resource: 'checkout_session',
        resourceId: session.id,
        stripeCustomerId: null,
        after: { sessionId: session.id, planId, planName: plan.name, product: 'pulse' },
      });
      sendSuccess(res, { sessionId: session.id, url: session.url });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create Pulse subscription checkout');
    }
  },
);

const SZL_PLANS = {
  'szl-pro-monthly': {
    priceEnv: 'STRIPE_PRICE_SZL_PRO_MONTHLY',
    name: 'SZL Pro (Monthly)',
    interval: 'month',
  },
  'szl-pro-annual': {
    priceEnv: 'STRIPE_PRICE_SZL_PRO_ANNUAL',
    name: 'SZL Pro (Annual)',
    interval: 'year',
  },
} as const;

router.get('/billing/szl/plans', (_req, res) => {
  const plans = Object.entries(SZL_PLANS).map(([planId, plan]) => ({
    planId,
    name: plan.name,
    interval: plan.interval,
    configured: !!process.env[plan.priceEnv],
    stripePriceEnv: plan.priceEnv,
  }));
  sendSuccess(res, plans);
});

router.post(
  '/billing/szl/subscribe',
  validateBody(planSubscribeSchema),
  authMiddleware({ required: false }),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { planId, email, successUrl, cancelUrl } = req.body as z.infer<typeof planSubscribeSchema>;
      const plan = SZL_PLANS[planId as keyof typeof SZL_PLANS];
      if (!plan) {
        sendBadRequest(res, `Unknown SZL plan "${planId}". Valid: ${Object.keys(SZL_PLANS).join(', ')}`);
        return;
      }
      const priceId = process.env[plan.priceEnv];
      if (!priceId) {
        sendError(res, `Stripe price not configured for "${planId}". Set ${plan.priceEnv}.`, 503);
        return;
      }
      const session = await services.stripe.createCheckoutSession({
        priceId,
        mode: 'subscription',
        successUrl,
        cancelUrl,
        customerEmail: email,
        metadata: { planId, planName: plan.name, product: 'szl' },
      });
      void writeBillingAudit({
        req,
        orgId: req.tenantOrgId ?? null,
        ...actorFromReq(req),
        action: 'checkout.initiated',
        resource: 'checkout_session',
        resourceId: session.id,
        stripeCustomerId: null,
        after: { sessionId: session.id, planId, planName: plan.name, product: 'szl' },
      });
      sendSuccess(res, { sessionId: session.id, url: session.url });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create SZL Pro checkout');
    }
  },
);

const VESSELS_PLANS = {
  'vessels-enterprise-monthly': {
    priceEnv: 'STRIPE_PRICE_VESSELS_ENTERPRISE_MONTHLY',
    name: 'Vessels Enterprise (Monthly)',
    interval: 'month',
  },
  'vessels-enterprise-annual': {
    priceEnv: 'STRIPE_PRICE_VESSELS_ENTERPRISE_ANNUAL',
    name: 'Vessels Enterprise (Annual)',
    interval: 'year',
  },
} as const;

router.get('/billing/vessels/plans', (_req, res) => {
  const plans = Object.entries(VESSELS_PLANS).map(([planId, plan]) => ({
    planId,
    name: plan.name,
    interval: plan.interval,
    configured: !!process.env[plan.priceEnv],
    stripePriceEnv: plan.priceEnv,
  }));
  sendSuccess(res, plans);
});

router.post(
  '/billing/vessels/subscribe',
  validateBody(planSubscribeSchema),
  authMiddleware({ required: false }),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const { planId, email, successUrl, cancelUrl } = req.body as z.infer<typeof planSubscribeSchema>;
      const plan = VESSELS_PLANS[planId as keyof typeof VESSELS_PLANS];
      if (!plan) {
        sendBadRequest(res, `Unknown Vessels plan "${planId}". Valid: ${Object.keys(VESSELS_PLANS).join(', ')}`);
        return;
      }
      const priceId = process.env[plan.priceEnv];
      if (!priceId) {
        sendError(res, `Stripe price not configured for "${planId}". Set ${plan.priceEnv}.`, 503);
        return;
      }
      const session = await services.stripe.createCheckoutSession({
        priceId,
        mode: 'subscription',
        successUrl,
        cancelUrl,
        customerEmail: email,
        metadata: { planId, planName: plan.name, product: 'vessels' },
      });
      void writeBillingAudit({
        req,
        orgId: req.tenantOrgId ?? null,
        ...actorFromReq(req),
        action: 'checkout.initiated',
        resource: 'checkout_session',
        resourceId: session.id,
        stripeCustomerId: null,
        after: { sessionId: session.id, planId, planName: plan.name, product: 'vessels' },
      });
      sendSuccess(res, { sessionId: session.id, url: session.url });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create Vessels subscription checkout');
    }
  },
);

router.get(
  '/billing/entitlements/check',
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const featureKey = req.query.featureKey as string | undefined;
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : undefined;

      if (!featureKey) {
        sendBadRequest(res, 'featureKey is required');
        return;
      }

      const resolvedOrgId = orgId ?? (req.user as { orgId?: number })?.orgId ?? undefined;

      if (req.user && resolvedOrgId && !assertTenantAccess(req, res, resolvedOrgId)) return;

      const now = new Date();

      if (resolvedOrgId) {
        const [override] = await db
          .select()
          .from(entitlementOverridesTable)
          .where(
            and(
              eq(entitlementOverridesTable.orgId, resolvedOrgId),
              eq(entitlementOverridesTable.featureKey, featureKey),
              or(isNull(entitlementOverridesTable.expiresAt), gt(entitlementOverridesTable.expiresAt, now)),
            ),
          )
          .limit(1);

        if (override) {
          sendSuccess(res, {
            granted: override.granted,
            source: 'override',
            featureKey,
            plan: null,
          });
          return;
        }

        const activeSubs = await db
          .select({ planId: subscriptionsTable.planId })
          .from(subscriptionsTable)
          .where(
            and(
              eq(subscriptionsTable.orgId, resolvedOrgId),
              or(
                eq(subscriptionsTable.status, 'active'),
                eq(subscriptionsTable.status, 'trialing'),
              ),
            ),
          );

        if (activeSubs.length > 0) {
          const planIds = activeSubs.map((s) => s.planId);
          const entitlementRows = await db
            .select()
            .from(entitlementsTable)
            .where(eq(entitlementsTable.featureKey, featureKey));

          const granted = entitlementRows.some((e) => planIds.includes(e.planId));
          const plan = granted
            ? (await db.select().from(billingPlansTable).where(eq(billingPlansTable.id, planIds[0]!)).limit(1))[0]?.slug ?? null
            : null;

          sendSuccess(res, {
            granted,
            source: 'subscription',
            featureKey,
            plan,
          });
          return;
        }
      }

      sendSuccess(res, { granted: false, source: 'none', featureKey, plan: null });
    } catch (err) {
      handleRouteError(res, err, 'Failed to check entitlement');
    }
  },
);

router.get(
  '/billing/fulfillments',
  authMiddleware(),
  requireRole('ops', 'admin', 'super_admin'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) {
        sendSuccess(res, [], 200, { page: 1, limit: 50, offset: 0 });
        return;
      }
      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const rows = await db
        .select()
        .from(fulfillmentsTable)
        .where(orgIds !== null ? inArray(fulfillmentsTable.orgId, [...orgIds]) : undefined)
        .orderBy(desc(fulfillmentsTable.createdAt))
        .limit(limit)
        .offset(offset);
      sendSuccess(res, rows, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list fulfillments');
    }
  },
);

router.get(
  '/billing/admin/orgs/:orgId/subscription',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      const subs = await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.orgId, orgId))
        .orderBy(desc(subscriptionsTable.createdAt));
      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.id, orgId));
      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }

      let stripeCustomer = null;
      if (org.billingCustomerId && services.stripe.isLive) {
        try {
          stripeCustomer = await services.stripe.getCustomerByEmail(org.billingCustomerId);
        } catch {
          stripeCustomer = null;
        }
      }

      sendSuccess(res, { org, subscriptions: subs, stripeCustomer });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get org subscription');
    }
  },
);

router.post(
  '/billing/admin/orgs/:orgId/subscription/resync',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  requireStripeLive,
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.id, orgId));
      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }
      if (!org.billingCustomerId) {
        sendBadRequest(res, 'Organization has no Stripe customer ID. billingCustomerId must be set.');
        return;
      }
      const stripeSubs = await services.stripe.listCustomerSubscriptions(org.billingCustomerId);
      let synced = 0;
      for (const sub of stripeSubs) {
        const [existing] = await db
          .select()
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.stripeSubscriptionId, sub.id));
        if (existing) {
          await db
            .update(subscriptionsTable)
            .set({
              status:
                sub.status === 'active'
                  ? 'active'
                  : sub.status === 'trialing'
                    ? 'trialing'
                    : sub.status === 'past_due'
                      ? 'past_due'
                      : 'canceled',
              currentPeriodStart: new Date(sub.currentPeriodStart * 1000),
              currentPeriodEnd: new Date(sub.currentPeriodEnd * 1000),
              updatedAt: new Date(),
            })
            .where(eq(subscriptionsTable.stripeSubscriptionId, sub.id));
        } else {
          const [firstPlan] = await db.select().from(billingPlansTable).limit(1);
          await db.insert(subscriptionsTable).values({
            orgId,
            planId: firstPlan?.id ?? 1,
            status: sub.status === 'active' ? 'active' : sub.status === 'trialing' ? 'trialing' : 'canceled',
            stripeSubscriptionId: sub.id,
            currentPeriodStart: new Date(sub.currentPeriodStart * 1000),
            currentPeriodEnd: new Date(sub.currentPeriodEnd * 1000),
          });
        }
        synced++;
      }
      sendSuccess(res, { synced, stripeSubscriptions: stripeSubs.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to resync subscription');
    }
  },
);

router.get(
  '/billing/admin/orgs/:orgId/entitlements',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      const overrides = await db
        .select()
        .from(entitlementOverridesTable)
        .where(eq(entitlementOverridesTable.orgId, orgId))
        .orderBy(desc(entitlementOverridesTable.createdAt));
      sendSuccess(res, overrides);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get entitlement overrides');
    }
  },
);

router.post(
  '/billing/admin/orgs/:orgId/entitlements',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      const { featureKey, granted, reason, expiresAt } = req.body as {
        featureKey: string;
        granted: boolean;
        reason?: string;
        expiresAt?: string;
      };
      if (!featureKey) {
        sendBadRequest(res, 'featureKey is required');
        return;
      }

      const existing = await db
        .select()
        .from(entitlementOverridesTable)
        .where(
          and(
            eq(entitlementOverridesTable.orgId, orgId),
            eq(entitlementOverridesTable.featureKey, featureKey),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(entitlementOverridesTable)
          .set({
            granted: granted ?? true,
            reason: reason ?? null,
            grantedBy: req.user?.id ?? null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(entitlementOverridesTable.orgId, orgId),
              eq(entitlementOverridesTable.featureKey, featureKey),
            ),
          );
        sendSuccess(res, { action: 'updated', featureKey, granted });
      } else {
        await db.insert(entitlementOverridesTable).values({
          orgId,
          featureKey,
          granted: granted ?? true,
          reason: reason ?? null,
          grantedBy: req.user?.id ?? null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        });
        sendSuccess(res, { action: 'created', featureKey, granted });
      }
    } catch (err) {
      handleRouteError(res, err, 'Failed to set entitlement override');
    }
  },
);

router.delete(
  '/billing/admin/orgs/:orgId/entitlements/:featureKey',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      const featureKey = req.params.featureKey as string;
      await db
        .delete(entitlementOverridesTable)
        .where(
          and(
            eq(entitlementOverridesTable.orgId, orgId),
            eq(entitlementOverridesTable.featureKey, featureKey),
          ),
        );
      sendSuccess(res, { deleted: true, featureKey });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete entitlement override');
    }
  },
);

// ─── Payment methods ──────────────────────────────────────────────────────────
// Read-only endpoint: does NOT use requireStripeLive because the StripeAdapter
// already returns route-appropriate demo fixtures when isLive=false. Using the
// middleware would short-circuit with a checkout-shaped payload which breaks the
// billing-client's usePaymentMethods hook in demo mode.

router.get(
  '/billing/payment-methods',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const [org] = await db
        .select({ billingCustomerId: organizationsTable.billingCustomerId })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, orgId));

      const ownedCustomerId = org?.billingCustomerId;
      if (!ownedCustomerId) {
        sendSuccess(res, []);
        return;
      }

      // In demo mode, the adapter returns a structured fixture; no special
      // branch is needed here.
      const methods = await services.stripe.listPaymentMethods(ownedCustomerId);

      // Write-through cache: mirror Stripe payment methods to canonical DB table.
      // Fire-and-forget; failures are non-fatal (stale cache is acceptable).
      if (methods.length > 0 && services.stripe.isLive) {
        void Promise.all(
          methods.map((pm) =>
            db
              .insert(billingPaymentMethodsTable)
              .values({
                orgId,
                stripePaymentMethodId: pm.id,
                stripeCustomerId: ownedCustomerId,
                type: pm.type,
                brand: pm.brand ?? null,
                last4: pm.last4 ?? null,
                expMonth: pm.expMonth ?? null,
                expYear: pm.expYear ?? null,
                isDefault: pm.isDefault,
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: billingPaymentMethodsTable.stripePaymentMethodId,
                set: {
                  brand: pm.brand ?? null,
                  last4: pm.last4 ?? null,
                  expMonth: pm.expMonth ?? null,
                  expYear: pm.expYear ?? null,
                  isDefault: pm.isDefault,
                  updatedAt: new Date(),
                },
              })
              .catch((err: Error) =>
                logger.warn({ err, pmId: pm.id }, '[billing] payment_methods cache write failed (non-fatal)'),
              ),
          ),
        );
      }

      sendSuccess(res, methods);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list payment methods');
    }
  },
);

// ─── Refund request ───────────────────────────────────────────────────────────
// Does NOT use requireStripeLive so that in demo mode the adapter's createRefund
// returns a properly shaped fixture (`{ id: 're_demo_...', status: 'succeeded'
// }`) instead of the middleware's generic checkout payload.
// Idempotency key is derived from tenant + charge/PI reference + client key so
// that network retries with the same key converge on a single Stripe refund.

router.post(
  '/billing/refund-request',
  authMiddleware(),
  requireRole('ops'),
  async (req: Request, res: Response) => {
    try {
      const { chargeId, paymentIntentId, amount, reason, notes } = req.body as {
        chargeId?: string;
        paymentIntentId?: string;
        amount?: number;
        reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
        notes?: string;
      };

      if (!chargeId && !paymentIntentId) {
        sendBadRequest(res, 'chargeId or paymentIntentId is required');
        return;
      }

      const orgId = req.tenantOrgId ?? null;

      // ── Live-write gate ───────────────────────────────────────────────────
      // In live Stripe mode, verify the billing feature flag is enabled before
      // issuing any refund. Demo mode (isLive=false) uses a fixture and skips
      // this guard so the demo shape is always returned correctly.
      if (services.stripe.isLive) {
        const billingEnabled = await isFlagEnabled('live_stripe_billing_enabled');
        if (!billingEnabled) {
          sendError(res, 'Live billing is not yet enabled for this environment', 503, 'BILLING_DISABLED');
          return;
        }
      }

      // ── Live-mode org context guard ───────────────────────────────────────
      // In live mode, a bound org (tenantOrgId) is mandatory so we can enforce
      // per-tenant ownership checks before calling Stripe. An ops user without
      // a linked org must be rejected here — allowing the call to proceed would
      // let them issue a refund against any charge, bypassing tenant isolation.
      if (services.stripe.isLive && !orgId) {
        sendBadRequest(
          res,
          'Organization context is required for refund requests in live mode',
        );
        return;
      }

      // ── Tenant ownership check ────────────────────────────────────────────
      // Verify the charge/PI belongs to this org's Stripe customer before
      // issuing a refund.
      //
      // In live mode:
      //   - org MUST have a billingCustomerId; if missing, reject (400) —
      //     an unmapped org could otherwise refund arbitrary charges.
      //   - resolveChargeCustomer is called to confirm the charge's customer
      //     matches the org's canonical customer.
      //
      // In demo mode (isLive=false): resolveChargeCustomer returns null so the
      // whole block is skipped and we proceed with the fixture response.
      if (orgId && services.stripe.isLive) {
        const [org] = await db
          .select({ billingCustomerId: organizationsTable.billingCustomerId })
          .from(organizationsTable)
          .where(eq(organizationsTable.id, orgId));

        const ownedCustomerId = org?.billingCustomerId;

        if (!ownedCustomerId) {
          sendBadRequest(
            res,
            'Organization has no Stripe billing customer — complete a checkout first before requesting refunds',
          );
          return;
        }

        const chargeCustomerId = await services.stripe.resolveChargeCustomer({
          chargeId,
          paymentIntentId,
        });
        if (chargeCustomerId && chargeCustomerId !== ownedCustomerId) {
          void writeBillingAudit({
            req,
            orgId,
            ...actorFromReq(req),
            action: 'refund.denied',
            resource: 'refund',
            resourceId: chargeId ?? paymentIntentId ?? 'unknown',
            stripeCustomerId: ownedCustomerId,
            after: {
              reason: 'cross-tenant ownership mismatch',
              chargeCustomerId,
              ownedCustomerId,
            },
          });
          sendForbidden(res, 'Charge does not belong to this organization');
          return;
        }
      }

      const clientKey = req.headers['x-idempotency-key'] as string | undefined;
      const refundRef = chargeId ?? paymentIntentId ?? 'unknown';
      // Idempotency key is derived from tenant + charge/PI reference so that
      // server-side retries for the same org+charge converge on a single Stripe
      // refund. UUID fallback is intentionally avoided — clients that need to
      // issue multiple partial refunds on the same charge must supply distinct
      // x-idempotency-key headers.
      const idempotencyKey = clientKey
        ? `refund-${orgId ?? 'anon'}-${clientKey}`
        : `refund-${orgId ?? 'anon'}-${refundRef}`;

      const refund = await services.stripe.createRefund({
        chargeId: chargeId as string,
        paymentIntentId,
        amount,
        reason: reason === 'other' ? undefined : reason,
        idempotencyKey,
      });

      // Persist canonical refund record for this org (fire-and-forget, non-fatal).
      // orgId is required by the DB constraint; skip insert if absent.
      if (orgId) {
        void (async () => {
          try {
            await db
              .insert(billingRefundRequestsTable)
              .values({
                orgId,
                stripeChargeId: chargeId ?? null,
                stripeRefundId: refund.id,
                stripePaymentIntentId: paymentIntentId ?? null,
                amount: amount != null ? String(amount) : null,
                currency: refund.currency ?? 'usd',
                reason: (reason === 'other' ? 'other' : reason) ?? 'requested_by_customer',
                status: 'completed',
                notes: notes ?? null,
                idempotencyKey,
                processedAt: new Date(),
              })
              .onConflictDoNothing();
          } catch (insertErr) {
            logger.warn({ err: insertErr }, '[billing] Failed to persist billing_refund_requests row (non-fatal)');
          }
        })();
      }

      void writeBillingAudit({
        req,
        orgId,
        ...actorFromReq(req),
        action: 'refund.requested',
        resource: 'refund',
        resourceId: refund.id,
        stripeCustomerId: null,
        after: { refundId: refund.id, status: refund.status, notes, idempotencyKey },
      });

      sendSuccess(res, { id: refund.id, status: refund.status });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create refund');
    }
  },
);

// ─── Tax breakdown (stub) ─────────────────────────────────────────────────────

router.get(
  '/billing/tax-breakdown/:invoiceId',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const invoiceId = req.params.invoiceId;
      if (!invoiceId) {
        sendBadRequest(res, 'invoiceId is required');
        return;
      }

      // Tax engine integration is handled by a dedicated task. Until then
      // return a zeroed stub so the billing-client's useTaxBreakdown hook
      // receives a well-typed response rather than a 404.
      sendSuccess(res, {
        taxAmountExclusive: 0,
        taxAmountInclusive: 0,
        currency: 'usd',
        jurisdiction: null,
        taxType: null,
        taxRate: 0,
        invoiceId,
        stub: true,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get tax breakdown');
    }
  },
);

// ─── Usage events ─────────────────────────────────────────────────────────────

router.get(
  '/billing/usage',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const featureKey = (req.query['featureKey'] as string | undefined) ?? undefined;

      const rows = await db
        .select({
          id: usageEventsTable.id,
          featureKey: usageEventsTable.featureKey,
          quantity: usageEventsTable.quantity,
          recordedAt: usageEventsTable.recordedAt,
        })
        .from(usageEventsTable)
        .where(
          featureKey
            ? and(
                eq(usageEventsTable.orgId, orgId),
                eq(usageEventsTable.featureKey, featureKey),
              )
            : eq(usageEventsTable.orgId, orgId),
        )
        .orderBy(desc(usageEventsTable.recordedAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, rows, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list usage events');
    }
  },
);

// ─── Billing audit log ────────────────────────────────────────────────────────
// Exposes the billing_audit_log table for ops/admin review. Always org-scoped
// so a tenant can only query their own events. super_admin may omit orgId to
// list across all orgs (useful for global support tooling).

router.get(
  '/billing/audit',
  authMiddleware(),
  requireRole('ops', 'admin', 'super_admin'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      const isSuperAdmin = req.user?.role === 'super_admin';

      if (!orgId && !isSuperAdmin) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const action = (req.query['action'] as string | undefined) ?? undefined;

      const whereConditions = [
        orgId ? eq(billingAuditLogTable.orgId, orgId) : undefined,
        action ? eq(billingAuditLogTable.action, action) : undefined,
      ].filter(Boolean);

      const rows = await db
        .select({
          id: billingAuditLogTable.id,
          orgId: billingAuditLogTable.orgId,
          actorId: billingAuditLogTable.actorId,
          actorEmail: billingAuditLogTable.actorEmail,
          action: billingAuditLogTable.action,
          resource: billingAuditLogTable.resource,
          resourceId: billingAuditLogTable.resourceId,
          stripeCustomerId: billingAuditLogTable.stripeCustomerId,
          after: billingAuditLogTable.after,
          ipAddress: billingAuditLogTable.ipAddress,
          createdAt: billingAuditLogTable.createdAt,
        })
        .from(billingAuditLogTable)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(billingAuditLogTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, rows, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list billing audit log');
    }
  },
);

export default router;
