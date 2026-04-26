/**
 * International Payment Rails — SEPA and BACS payment method management
 *
 * SEPA (Single Euro Payments Area) — EUR bank debit for EU customers
 * BACS (Bankers' Automated Clearing Services) — GBP bank debit for UK customers
 *
 * Both flow through Stripe's payment method APIs with proper currency and
 * settlement tracking. Methods are stored in the international_payment_methods
 * table and linked to org subscriptions via the billing foundation.
 */

import {
  db,
  internationalPaymentMethodsTable,
  internationalPaymentsTable,
} from '@szl-holdings/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody, validateQuery, listQuerySchema, parsePagination } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { getUserOrgIds, assertTenantAccess } from '../middlewares/tenant-scope';
import { bodyShape } from '@szl-holdings/contracts/common';

const router: IRouter = Router();

const sepaSetupSchema = z.object({
  iban: z.string().min(15).max(34),
  bankName: z.string().max(200).optional(),
  currency: z.literal('eur').default('eur'),
  setAsDefault: z.boolean().optional().default(false),
  mandateAccepted: z.boolean().refine((v) => v === true, {
    message: 'SEPA direct debit mandate must be explicitly accepted',
  }),
});

const bacsSetupSchema = z.object({
  accountNumber: z.string().min(6).max(8),
  sortCode: z.string().regex(/^\d{6}$/, 'Sort code must be 6 digits'),
  bankName: z.string().max(200).optional(),
  currency: z.literal('gbp').default('gbp'),
  setAsDefault: z.boolean().optional().default(false),
  mandateAccepted: z.boolean().refine((v) => v === true, {
    message: 'BACS direct debit mandate must be explicitly accepted',
  }),
});

const paymentInitiateSchema = z.object({
  paymentMethodId: z.number().int().positive(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal'),
  description: z.string().max(500).optional(),
});

function maskIban(iban: string): string {
  if (iban.length < 8) return '****';
  return `${iban.slice(0, 4)}****${iban.slice(-4)}`;
}

router.post(
  '/billing/intl/sepa/setup',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = sepaSetupSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendBadRequest(res, 'No organization context');
      return;
    }
    const orgId = [...orgIds][0];

    try {
      const { iban, bankName, currency, setAsDefault, mandateAccepted } = parsed.data;

      if (setAsDefault) {
        await db
          .update(internationalPaymentMethodsTable)
          .set({ isDefault: false })
          .where(
            and(
              eq(internationalPaymentMethodsTable.orgId, orgId),
              eq(internationalPaymentMethodsTable.type, 'sepa_debit'),
            ),
          );
      }

      const [method] = await db
        .insert(internationalPaymentMethodsTable)
        .values({
          orgId,
          type: 'sepa_debit',
          currency,
          status: 'pending',
          lastFour: iban.slice(-4),
          bankName,
          iban: maskIban(iban),
          mandateReference: `SEPA-${orgId}-${Date.now()}`,
          mandateAcceptedAt: mandateAccepted ? new Date() : null,
          isDefault: setAsDefault ?? false,
          metadata: { setupInitiatedAt: new Date().toISOString() },
        })
        .returning();

      logger.info({ orgId, methodId: method.id, type: 'sepa_debit' }, 'SEPA payment method registered');

      sendSuccess(res, {
        id: method.id,
        type: 'sepa_debit',
        currency: method.currency,
        lastFour: method.lastFour,
        bankName: method.bankName,
        status: method.status,
        mandateReference: method.mandateReference,
        mandateAcceptedAt: method.mandateAcceptedAt,
        isDefault: method.isDefault,
      }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to set up SEPA payment method');
    }
  },
);

router.post(
  '/billing/intl/bacs/setup',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = bacsSetupSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendBadRequest(res, 'No organization context');
      return;
    }
    const orgId = [...orgIds][0];

    try {
      const { accountNumber, sortCode, bankName, currency, setAsDefault, mandateAccepted } = parsed.data;

      if (setAsDefault) {
        await db
          .update(internationalPaymentMethodsTable)
          .set({ isDefault: false })
          .where(
            and(
              eq(internationalPaymentMethodsTable.orgId, orgId),
              eq(internationalPaymentMethodsTable.type, 'bacs_debit'),
            ),
          );
      }

      const [method] = await db
        .insert(internationalPaymentMethodsTable)
        .values({
          orgId,
          type: 'bacs_debit',
          currency,
          status: 'pending',
          lastFour: accountNumber.slice(-4),
          bankName,
          sortCode,
          mandateReference: `BACS-${orgId}-${Date.now()}`,
          mandateAcceptedAt: mandateAccepted ? new Date() : null,
          isDefault: setAsDefault ?? false,
          metadata: {
            setupInitiatedAt: new Date().toISOString(),
            sortCodeMasked: `${sortCode.slice(0, 2)}-**-**`,
          },
        })
        .returning();

      logger.info({ orgId, methodId: method.id, type: 'bacs_debit' }, 'BACS payment method registered');

      sendSuccess(res, {
        id: method.id,
        type: 'bacs_debit',
        currency: method.currency,
        lastFour: method.lastFour,
        sortCode: `${sortCode.slice(0, 2)}-**-**`,
        bankName: method.bankName,
        status: method.status,
        mandateReference: method.mandateReference,
        mandateAcceptedAt: method.mandateAcceptedAt,
        isDefault: method.isDefault,
      }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to set up BACS payment method');
    }
  },
);

router.get(
  '/billing/intl/payment-methods',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendSuccess(res, []);
      return;
    }

    try {
      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const typeFilter = req.query.type as string | undefined;

      const conditions = [inArray(internationalPaymentMethodsTable.orgId, [...orgIds])];
      if (typeFilter && ['sepa_debit', 'bacs_debit', 'ach_debit'].includes(typeFilter)) {
        conditions.push(eq(internationalPaymentMethodsTable.type, typeFilter as 'sepa_debit' | 'bacs_debit' | 'ach_debit'));
      }

      const methods = await db
        .select()
        .from(internationalPaymentMethodsTable)
        .where(and(...conditions))
        .orderBy(desc(internationalPaymentMethodsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, methods.map((m) => ({
        id: m.id,
        type: m.type,
        currency: m.currency,
        status: m.status,
        lastFour: m.lastFour,
        bankName: m.bankName,
        sortCode: m.sortCode,
        iban: m.iban,
        mandateReference: m.mandateReference,
        mandateAcceptedAt: m.mandateAcceptedAt,
        isDefault: m.isDefault,
        createdAt: m.createdAt,
      })), 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list international payment methods');
    }
  },
);

router.delete(
  '/billing/intl/payment-methods/:id',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid payment method ID');
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendBadRequest(res, 'No organization context');
      return;
    }

    try {
      const [method] = await db
        .select()
        .from(internationalPaymentMethodsTable)
        .where(
          and(
            eq(internationalPaymentMethodsTable.id, id),
            inArray(internationalPaymentMethodsTable.orgId, [...orgIds]),
          ),
        );

      if (!method) {
        sendNotFound(res, 'Payment method');
        return;
      }

      await db
        .update(internationalPaymentMethodsTable)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(internationalPaymentMethodsTable.id, id));

      res.status(204).send();
    } catch (err) {
      handleRouteError(res, err, 'Failed to cancel payment method');
    }
  },
);

router.post(
  '/billing/intl/payments/initiate',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = paymentInitiateSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendBadRequest(res, 'No organization context');
      return;
    }
    const orgId = [...orgIds][0];

    try {
      const { paymentMethodId, amount, description } = parsed.data;

      const [method] = await db
        .select()
        .from(internationalPaymentMethodsTable)
        .where(
          and(
            eq(internationalPaymentMethodsTable.id, paymentMethodId),
            eq(internationalPaymentMethodsTable.orgId, orgId),
            eq(internationalPaymentMethodsTable.status, 'active'),
          ),
        );

      if (!method) {
        sendNotFound(res, 'Active payment method');
        return;
      }

      const [payment] = await db
        .insert(internationalPaymentsTable)
        .values({
          orgId,
          paymentMethodId: method.id,
          amount,
          currency: method.currency,
          description,
          status: 'initiated',
          metadata: {
            initiatedAt: new Date().toISOString(),
            paymentType: method.type,
          },
        })
        .returning();

      logger.info({ orgId, paymentId: payment.id, amount, currency: method.currency }, 'International payment initiated');

      sendSuccess(res, {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        description: payment.description,
        paymentType: method.type,
        createdAt: payment.createdAt,
        expectedSettlement: method.type === 'sepa_debit'
          ? '1-2 business days'
          : method.type === 'bacs_debit'
          ? '3-5 business days'
          : '1-3 business days',
      }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to initiate international payment');
    }
  },
);

router.get(
  '/billing/intl/payments',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendSuccess(res, []);
      return;
    }

    try {
      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const payments = await db
        .select()
        .from(internationalPaymentsTable)
        .where(inArray(internationalPaymentsTable.orgId, [...orgIds]))
        .orderBy(desc(internationalPaymentsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, payments, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list international payments');
    }
  },
);

router.get('/billing/intl/rails', (_req: Request, res: Response) => {
  sendSuccess(res, {
    rails: [
      {
        id: 'sepa_debit',
        name: 'SEPA Direct Debit',
        region: 'EU',
        currency: 'EUR',
        settlementDays: '1-2',
        mandateRequired: true,
        description:
          'Single Euro Payments Area direct debit. Available for EU-based organizations. Supports EUR transactions across 36 SEPA member countries.',
      },
      {
        id: 'bacs_debit',
        name: 'BACS Direct Debit',
        region: 'UK',
        currency: 'GBP',
        settlementDays: '3-5',
        mandateRequired: true,
        description:
          'Bankers Automated Clearing Services. Available for UK-based organizations. Standard UK bank-to-bank direct debit scheme.',
      },
      {
        id: 'ach_debit',
        name: 'ACH Direct Debit',
        region: 'US',
        currency: 'USD',
        settlementDays: '1-3',
        mandateRequired: false,
        description:
          'Automated Clearing House. Standard US bank-to-bank transfer network for domestic USD transactions.',
      },
    ],
  });
});

export default router;
