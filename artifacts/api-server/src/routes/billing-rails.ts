/**
 * billing-rails.ts — ACH and Crypto payment rail routes.
 *
 * Endpoints:
 *  GET  /billing/rails/status              — rail availability + demo flags
 *  GET  /billing/rails/payment-methods     — list org's rail payment methods
 *  POST /billing/ach/link-token            — create Plaid Link token
 *  POST /billing/ach/exchange-token        — exchange Plaid public token → ACH method
 *  POST /billing/ach/charge                — charge an invoice via ACH
 *  POST /billing/crypto/charge             — open Coinbase Commerce checkout for an invoice
 *  POST /billing/webhooks/plaid            — Plaid item webhooks
 *  POST /billing/webhooks/coinbase         — Coinbase Commerce charge webhooks
 *  POST /billing/rails/charge-invoice      — unified chargeInvoice facade
 */

import { db, invoicesTable, organizationsTable } from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { actorFromReq, writeBillingAudit } from '../lib/billing-audit';
import { logger } from '../lib/logger';
import {
  addPaymentMethod,
  chargeInvoice,
  getPaymentMethods,
  getRailStatus,
  handleRailWebhook,
} from '../lib/payment-rail-adapter';
import { createLinkToken, exchangePublicToken, verifyPlaidWebhookSignature } from '../lib/plaid-adapter';
import { verifyCoinbaseWebhookSignature } from '../lib/coinbase-adapter';
import { authMiddleware, parseIdParam } from '../middlewares/auth';
import { assertTenantAccess } from '../middlewares/tenant-scope';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import {
  achExchangeTokenSchema,
  achLinkTokenSchema,
  billingRailChargeInvoiceSchema,
  billingRailCryptoChargeSchema,
  validateBody,
} from '../lib/validation';

const router: IRouter = Router();

// ─── Rail status ──────────────────────────────────────────────────────────────

router.get('/billing/rails/status', (_req, res) => {
  sendSuccess(res, getRailStatus());
});

// ─── Payment methods ──────────────────────────────────────────────────────────

router.get('/billing/rails/payment-methods', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = req.tenantOrgId;
    if (!orgId) {
      sendForbidden(res, 'No organization context');
      return;
    }
    const methods = await getPaymentMethods(orgId);
    sendSuccess(res, methods);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list payment methods');
  }
});

// ─── ACH: Plaid Link token ────────────────────────────────────────────────────

router.post(
  '/billing/ach/link-token',
  authMiddleware(),
  validateBody(achLinkTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const { redirectUri } = req.body as { redirectUri?: string };

      const result = await createLinkToken({
        clientUserId: String(orgId),
        clientName: 'SZL Holdings',
        redirectUri,
      });

      void writeBillingAudit({
        req,
        orgId,
        ...actorFromReq(req),
        action: 'ach.link_token.created',
        resource: 'plaid_link',
        after: { demo: result.demo ?? false },
      });

      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create Plaid Link token');
    }
  },
);

// ─── ACH: Exchange public token ────────────────────────────────────────────────

router.post(
  '/billing/ach/exchange-token',
  authMiddleware(),
  validateBody(achExchangeTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const { publicToken, accountId } = req.body as { publicToken: string; accountId: string };

      const exchangeResult = await exchangePublicToken(publicToken, accountId);

      const addResult = await addPaymentMethod(orgId, {
        rail: 'ach',
        processorToken: exchangeResult.processorToken,
        accountId: exchangeResult.accountId,
        institutionName: exchangeResult.institutionName,
        accountName: exchangeResult.accountName,
        accountMask: exchangeResult.accountMask,
        plaidItemId: exchangeResult.itemId,
        demo: exchangeResult.demo,
      });

      if (!addResult.success) {
        sendBadRequest(res, addResult.error ?? 'Failed to add bank account');
        return;
      }

      void writeBillingAudit({
        req,
        orgId,
        ...actorFromReq(req),
        action: 'ach.bank_account.added',
        resource: 'billing_rail_account',
        resourceId: String(addResult.data?.id),
        after: {
          institutionName: exchangeResult.institutionName,
          accountMask: exchangeResult.accountMask,
          demo: exchangeResult.demo ?? false,
        },
      });

      sendSuccess(res, {
        id: addResult.data?.id,
        rail: 'ach',
        label: addResult.data?.label,
        status: addResult.data?.status,
        demo: exchangeResult.demo ?? false,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to exchange Plaid token');
    }
  },
);

// ─── ACH: Charge invoice ──────────────────────────────────────────────────────

router.post(
  '/billing/ach/charge',
  authMiddleware(),
  validateBody(billingRailChargeInvoiceSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const { invoiceId, paymentMethodId } = req.body as { invoiceId: number; paymentMethodId: number };

      const result = await chargeInvoice(invoiceId, 'ach', paymentMethodId, orgId);

      if (!result.success) {
        sendBadRequest(res, result.error ?? 'ACH charge failed');
        return;
      }

      sendSuccess(res, result.data);
    } catch (err) {
      handleRouteError(res, err, 'Failed to charge invoice via ACH');
    }
  },
);

// ─── Crypto: Create Coinbase Commerce charge ──────────────────────────────────

router.post(
  '/billing/crypto/charge',
  authMiddleware(),
  validateBody(billingRailCryptoChargeSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const { invoiceId } = req.body as { invoiceId: number };

      const [invoice] = await db
        .select()
        .from(invoicesTable)
        .where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.orgId, orgId)));

      if (!invoice) {
        sendNotFound(res, 'Invoice');
        return;
      }

      if (invoice.status === 'paid') {
        sendBadRequest(res, 'Invoice is already paid');
        return;
      }

      if (invoice.status === 'void') {
        sendBadRequest(res, 'Invoice is void');
        return;
      }

      const [cryptoMethod] = await getPaymentMethods(orgId).then((methods) =>
        methods.filter((m) => m.rail === 'crypto'),
      );

      let paymentMethodId: number;

      if (cryptoMethod) {
        paymentMethodId = cryptoMethod.id;
      } else {
        const addResult = await addPaymentMethod(orgId, { rail: 'crypto', demo: !process.env.COINBASE_COMMERCE_API_KEY });
        if (!addResult.success || !addResult.data) {
          sendBadRequest(res, 'Failed to initialize crypto payment method');
          return;
        }
        paymentMethodId = addResult.data.id;
      }

      const result = await chargeInvoice(invoiceId, 'crypto', paymentMethodId, orgId);

      if (!result.success) {
        sendBadRequest(res, result.error ?? 'Crypto charge failed');
        return;
      }

      sendSuccess(res, result.data);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create crypto charge');
    }
  },
);

// ─── Unified charge invoice facade ────────────────────────────────────────────

router.post(
  '/billing/rails/charge-invoice',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const { invoiceId, rail, paymentMethodId } = req.body as {
        invoiceId: number;
        rail: 'ach' | 'crypto' | 'card';
        paymentMethodId: number;
      };

      if (!invoiceId || !rail || !paymentMethodId) {
        sendBadRequest(res, 'invoiceId, rail, and paymentMethodId are required');
        return;
      }

      if (rail !== 'ach' && rail !== 'crypto' && rail !== 'card') {
        sendBadRequest(res, 'rail must be "ach", "crypto", or "card"');
        return;
      }

      const result = await chargeInvoice(invoiceId, rail, paymentMethodId, orgId);

      if (!result.success) {
        sendBadRequest(res, result.error ?? 'Charge failed');
        return;
      }

      sendSuccess(res, result.data);
    } catch (err) {
      handleRouteError(res, err, 'Failed to charge invoice');
    }
  },
);

// ─── Plaid webhook ─────────────────────────────────────────────────────────────

// Registered at /webhooks/plaid (NOT under /billing to bypass tenantScope)
router.post('/webhooks/plaid', async (req: Request, res: Response) => {
  try {
    // Belt-and-suspenders: reject early when Plaid is configured live but
    // the webhook secret is absent (misconfiguration). The adapter also enforces
    // this, but an explicit 503 here gives operators a clearer signal than a 400.
    if (process.env.PLAID_CLIENT_ID && !process.env.PLAID_WEBHOOK_SECRET) {
      logger.error('[billing-rails] Live Plaid configured but PLAID_WEBHOOK_SECRET not set — rejecting webhook');
      res.status(503).json({ error: 'Plaid webhook endpoint not configured — contact your administrator' });
      return;
    }

    const rawBody =
      (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ??
      JSON.stringify(req.body);
    const signatureHeader = req.headers['plaid-verification'] as string | undefined;

    if (!verifyPlaidWebhookSignature(rawBody, signatureHeader)) {
      logger.warn('[billing-rails] Plaid webhook signature verification failed');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payload = req.body as Record<string, unknown>;
    const result = await handleRailWebhook('plaid', payload);

    logger.info({ action: result.action }, '[billing-rails] Plaid webhook processed');
    res.json({ received: true, action: result.action });
  } catch (err) {
    logger.error({ err }, '[billing-rails] Plaid webhook error');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ─── Coinbase Commerce webhook ──────────────────────────────────────────────────

// Registered at /webhooks/coinbase (NOT under /billing to bypass tenantScope)
router.post('/webhooks/coinbase', async (req: Request, res: Response) => {
  try {
    // Belt-and-suspenders: reject early when Coinbase Commerce is configured live
    // but the webhook secret is absent (misconfiguration). The adapter also enforces
    // this, but an explicit 503 gives operators a clearer operational signal.
    if (process.env.COINBASE_COMMERCE_API_KEY && !process.env.COINBASE_COMMERCE_WEBHOOK_SECRET) {
      logger.error('[billing-rails] Live Coinbase configured but COINBASE_COMMERCE_WEBHOOK_SECRET not set — rejecting webhook');
      res.status(503).json({ error: 'Coinbase webhook endpoint not configured — contact your administrator' });
      return;
    }

    const rawBody =
      (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ??
      JSON.stringify(req.body);
    const signatureHeader = req.headers['x-cc-webhook-signature'] as string | undefined;

    try {
      verifyCoinbaseWebhookSignature(rawBody, signatureHeader);
    } catch (sigErr) {
      logger.warn({ err: sigErr }, '[billing-rails] Coinbase webhook signature verification failed');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const event = req.body as Record<string, unknown>;
    const payload: Record<string, unknown> = {
      id: event['id'],
      type: (event['event'] as Record<string, unknown>)?.['type'] ?? event['type'],
      data: (event['event'] as Record<string, unknown>)?.['data'] ?? event['data'],
    };

    const result = await handleRailWebhook('coinbase', payload);

    logger.info({ action: result.action }, '[billing-rails] Coinbase webhook processed');
    res.json({ received: true, action: result.action });
  } catch (err) {
    logger.error({ err }, '[billing-rails] Coinbase webhook error');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
