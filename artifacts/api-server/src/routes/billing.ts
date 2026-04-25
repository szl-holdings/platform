import {
  billingPlansTable,
  db,
  entitlementOverridesTable,
  entitlementsTable,
  fulfillmentsTable,
  invoicesTable,
  organizationsTable,
  revenueEventsTable,
  subscriptionsTable,
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

      let customerId: string | undefined;
      if (customerEmail) {
        const existing = await services.stripe.getCustomerByEmail(customerEmail);
        if (existing) {
          customerId = existing.id;
        }
      }

      const session = await services.stripe.createCheckoutSession({
        priceId,
        mode: mode ?? 'subscription',
        successUrl,
        cancelUrl,
        customerEmail: customerId ? undefined : customerEmail,
        customerId,
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
      const user = (req as unknown as { user?: { email?: string; id?: string } }).user;
      const userEmail = user?.email;
      if (!userEmail) {
        sendBadRequest(res, 'Authenticated user email required for billing portal');
        return;
      }
      const customer = await services.stripe.getCustomerByEmail(userEmail);
      if (!customer) {
        sendBadRequest(res, 'No Stripe customer record found — complete a checkout first');
        return;
      }
      const session = await services.stripe.createCustomerPortalSession(customer.id, returnUrl);
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

      logger.info({ eventType, eventId: event.id }, 'Stripe webhook received');

      const eventData = (event.data as Record<string, unknown>)?.object as
        | Record<string, unknown>
        | undefined;

      switch (eventType) {
        case 'checkout.session.completed': {
          const session = eventData;
          if (!session) break;
          logger.info(
            { sessionId: session.id, customerId: session.customer, mode: session.mode },
            'Checkout completed',
          );

          if (session.mode === 'payment') {
            const metadata = session.metadata as Record<string, string> | undefined;
            try {
              await db
                .insert(fulfillmentsTable)
                .values({
                  stripeSessionId: session.id as string,
                  stripePaymentIntentId: session.payment_intent as string | undefined,
                  product: metadata?.product ?? metadata?.service ?? 'carlota-jo',
                  tierId: metadata?.tierId ?? 'unknown',
                  tierName: metadata?.tierName ?? 'Unknown',
                  customerEmail:
                    (session.customer_details as Record<string, string> | undefined)?.email ??
                    (session.customer_email as string | undefined) ??
                    null,
                  amount: session.amount_total
                    ? String((session.amount_total as number) / 100)
                    : null,
                  currency: (session.currency as string) ?? 'usd',
                  status: 'fulfilled',
                  fulfilledAt: new Date(),
                  metadata: { eventId: event.id, sessionMetadata: metadata },
                })
                .onConflictDoNothing();
              logger.info(
                { sessionId: session.id, tierId: metadata?.tierId },
                'One-time fulfillment recorded',
              );
            } catch (dbErr) {
              logger.warn({ dbErr }, 'Fulfillment may already exist in DB');
            }
            break;
          }

          if (session.subscription) {
            const sub = await services.stripe.getSubscription(session.subscription as string);
            if (sub) {
              try {
                const metadata = session.metadata as Record<string, string> | undefined;
                let orgId = metadata?.orgId ? parseInt(metadata.orgId, 10) : undefined;
                let planId = metadata?.planId ? parseInt(metadata.planId, 10) : undefined;

                if (!orgId) {
                  const [firstOrg] = await db.select().from(organizationsTable).limit(1);
                  orgId = firstOrg?.id ?? 1;
                }
                if (!planId) {
                  const [firstPlan] = await db.select().from(billingPlansTable).limit(1);
                  planId = firstPlan?.id ?? 1;
                }

                await db.insert(subscriptionsTable).values({
                  orgId,
                  planId,
                  status: 'active',
                  stripeSubscriptionId: sub.id,
                  currentPeriodStart: new Date(sub.currentPeriodStart * 1000),
                  currentPeriodEnd: new Date(sub.currentPeriodEnd * 1000),
                });
              } catch (dbErr) {
                logger.warn({ dbErr }, 'Subscription may already exist in DB');
              }
            }
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const sub = eventData;
          if (!sub) break;
          logger.info({ subscriptionId: sub.id, status: sub.status }, 'Subscription updated');

          const existing = await db
            .select()
            .from(subscriptionsTable)
            .where(eq(subscriptionsTable.stripeSubscriptionId, sub.id as string));

          if (existing.length > 0) {
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
                currentPeriodStart: new Date((sub.current_period_start as number) * 1000),
                currentPeriodEnd: new Date((sub.current_period_end as number) * 1000),
                canceledAt: sub.canceled_at ? new Date((sub.canceled_at as number) * 1000) : null,
                updatedAt: new Date(),
              })
              .where(eq(subscriptionsTable.stripeSubscriptionId, sub.id as string));
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = eventData;
          if (!sub) break;
          logger.info({ subscriptionId: sub.id }, 'Subscription deleted');

          await db
            .update(subscriptionsTable)
            .set({
              status: 'canceled',
              canceledAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(subscriptionsTable.stripeSubscriptionId, sub.id as string));
          break;
        }

        case 'invoice.paid': {
          const invoice = eventData;
          if (!invoice) break;
          logger.info({ invoiceId: invoice.id }, 'Invoice paid');

          try {
            const metadata = invoice.metadata as Record<string, string> | undefined;
            let orgId = metadata?.orgId ? parseInt(metadata.orgId, 10) : undefined;
            if (!orgId) {
              const [firstOrg] = await db.select().from(organizationsTable).limit(1);
              orgId = firstOrg?.id ?? 1;
            }

            await db
              .insert(invoicesTable)
              .values({
                orgId,
                stripeInvoiceId: invoice.id as string,
                amount: ((invoice.amount_paid as number) / 100).toFixed(2),
                currency: invoice.currency as string,
                status: 'paid',
                paidAt: new Date(),
              })
              .onConflictDoNothing();
          } catch (dbErr) {
            logger.warn({ dbErr }, 'Invoice may already exist in DB');
          }

          await db
            .insert(revenueEventsTable)
            .values({
              eventType: 'invoice.paid',
              product:
                (invoice.metadata as Record<string, string> | undefined)?.product ?? 'platform',
              customerId: invoice.customer as string | undefined,
              subscriptionId: invoice.subscription as string | undefined,
              invoiceId: invoice.id as string | undefined,
              amount: invoice.amount_paid ? String((invoice.amount_paid as number) / 100) : null,
              currency: (invoice.currency as string) ?? 'usd',
              idempotencyKey: `invoice-paid-${event.id}`,
              metadata: { eventId: event.id },
            })
            .onConflictDoNothing();
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = eventData;
          if (!invoice) break;
          logger.info({ invoiceId: invoice.id }, 'Invoice payment failed');

          if (invoice.subscription) {
            await db
              .update(subscriptionsTable)
              .set({ status: 'past_due', updatedAt: new Date() })
              .where(eq(subscriptionsTable.stripeSubscriptionId, invoice.subscription as string));
          }

          await db
            .insert(revenueEventsTable)
            .values({
              eventType: 'invoice.payment_failed',
              product: 'platform',
              customerId: invoice.customer as string | undefined,
              subscriptionId: invoice.subscription as string | undefined,
              invoiceId: invoice.id as string | undefined,
              amount: invoice.amount_due ? String((invoice.amount_due as number) / 100) : null,
              currency: (invoice.currency as string) ?? 'usd',
              idempotencyKey: `payment-failed-${event.id}`,
              metadata: { eventId: event.id },
            })
            .onConflictDoNothing();
          break;
        }

        case 'payment_intent.succeeded': {
          const pi = eventData;
          if (!pi) break;
          logger.info({ paymentIntentId: pi.id, amount: pi.amount }, 'Payment intent succeeded');
          break;
        }

        default:
          logger.info({ eventType }, 'Unhandled webhook event type');
      }

      res.json({ received: true });
    } catch (err) {
      logger.error({ err }, 'Webhook processing error');
      sendError(res, 'Webhook processing failed', 500, 'WEBHOOK_ERROR');
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

      await db
        .update(subscriptionsTable)
        .set({
          status: cancelImmediately
            ? 'canceled'
            : updated.status === 'active'
              ? 'active'
              : 'canceled',
          canceledAt: cancelImmediately ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.stripeSubscriptionId, subscriptionId));

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

export default router;
