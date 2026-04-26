/**
 * Billing — Chargeback & Dispute Management
 *
 * Pulls dispute data from Stripe (via webhook + polling), surfaces it in
 * billing admin with a response workflow and audit trail.
 *
 * Dispute lifecycle:
 *   needs_response → operator responds with evidence → under_review → won|lost
 */

import {
  billingDisputeAuditTable,
  billingDisputesTable,
  db,
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
import { getUserOrgIds } from '../middlewares/tenant-scope';
import { bodyShape } from '@szl-holdings/contracts/common';

const router: IRouter = Router();

const disputeRespondSchema = z.object({
  responseNotes: z.string().min(1).max(5000),
  evidence: z.object({
    customerEmailAddress: z.string().email().optional(),
    customerName: z.string().max(300).optional(),
    productDescription: z.string().max(2000).optional(),
    refundPolicy: z.string().max(2000).optional(),
    serviceDate: z.string().optional(),
    shippingAddress: z.string().max(500).optional(),
    uncategorizedText: z.string().max(10000).optional(),
  }).optional(),
});

const syncStripeDisputeSchema = z.object({
  stripeDisputeId: z.string().min(1),
  orgId: z.number().int().positive(),
});

router.get(
  '/billing/disputes',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'ops'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendSuccess(res, []);
      return;
    }

    try {
      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const statusFilter = req.query.status as string | undefined;

      const conditions = [inArray(billingDisputesTable.orgId, [...orgIds])];
      if (statusFilter) {
        conditions.push(
          eq(
            billingDisputesTable.status,
            statusFilter as typeof billingDisputesTable.$inferSelect.status,
          ),
        );
      }

      const disputes = await db
        .select()
        .from(billingDisputesTable)
        .where(and(...conditions))
        .orderBy(desc(billingDisputesTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, disputes, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list billing disputes');
    }
  },
);

router.get(
  '/billing/disputes/:id',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'ops'),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid dispute ID');
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendBadRequest(res, 'No organization context');
      return;
    }

    try {
      const [dispute] = await db
        .select()
        .from(billingDisputesTable)
        .where(
          and(
            eq(billingDisputesTable.id, id),
            inArray(billingDisputesTable.orgId, [...orgIds]),
          ),
        );

      if (!dispute) {
        sendNotFound(res, 'Dispute');
        return;
      }

      const auditEntries = await db
        .select()
        .from(billingDisputeAuditTable)
        .where(eq(billingDisputeAuditTable.disputeId, id))
        .orderBy(desc(billingDisputeAuditTable.occurredAt));

      sendSuccess(res, { ...dispute, auditTrail: auditEntries });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get dispute');
    }
  },
);

router.post(
  '/billing/disputes/:id/respond',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'ops'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid dispute ID');
      return;
    }

    const parsed = disputeRespondSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendBadRequest(res, 'No organization context');
      return;
    }

    try {
      const [dispute] = await db
        .select()
        .from(billingDisputesTable)
        .where(
          and(
            eq(billingDisputesTable.id, id),
            inArray(billingDisputesTable.orgId, [...orgIds]),
          ),
        );

      if (!dispute) {
        sendNotFound(res, 'Dispute');
        return;
      }

      if (!['needs_response', 'warning_needs_response'].includes(dispute.status)) {
        sendBadRequest(res, `Dispute status is '${dispute.status}' — response not accepted in this state`);
        return;
      }

      const { responseNotes, evidence } = parsed.data;

      await db
        .update(billingDisputesTable)
        .set({
          responseNotes,
          evidenceSubmitted: evidence ?? {},
          respondedAt: new Date(),
          respondedById: req.user!.id,
          status: 'under_review',
          updatedAt: new Date(),
        })
        .where(eq(billingDisputesTable.id, id));

      await db.insert(billingDisputeAuditTable).values({
        disputeId: id,
        action: 'evidence_submitted',
        performedById: req.user!.id,
        notes: responseNotes,
        metadata: { evidenceKeys: evidence ? Object.keys(evidence) : [] },
      });

      logger.info(
        { disputeId: id, stripeDisputeId: dispute.stripeDisputeId, userId: req.user!.id },
        'Dispute response submitted',
      );

      sendSuccess(res, {
        id,
        status: 'under_review',
        respondedAt: new Date(),
        message: 'Response submitted. Stripe will review within 2-3 business days.',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to submit dispute response');
    }
  },
);

router.post(
  '/billing/disputes/stripe-sync',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = syncStripeDisputeSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
      return;
    }

    try {
      const { stripeDisputeId, orgId } = parsed.data;

      const [existing] = await db
        .select()
        .from(billingDisputesTable)
        .where(eq(billingDisputesTable.stripeDisputeId, stripeDisputeId));

      if (existing) {
        sendSuccess(res, { id: existing.id, synced: false, message: 'Dispute already tracked' });
        return;
      }

      const [dispute] = await db
        .insert(billingDisputesTable)
        .values({
          orgId,
          stripeDisputeId,
          amount: '0',
          currency: 'usd',
          status: 'needs_response',
          isChargeback: 1,
          stripeRawData: { synced: true, stripeDisputeId },
        })
        .returning();

      await db.insert(billingDisputeAuditTable).values({
        disputeId: dispute.id,
        action: 'synced_from_stripe',
        performedById: req.user!.id,
        notes: 'Manually synced from Stripe',
      });

      sendSuccess(res, { id: dispute.id, synced: true }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to sync Stripe dispute');
    }
  },
);

router.post(
  '/billing/disputes/stripe-webhook',
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const event = req.body as {
        type?: string;
        data?: { object?: Record<string, unknown> };
      };

      if (!event.type?.startsWith('charge.dispute')) {
        res.status(200).json({ received: true, handled: false });
        return;
      }

      const disputeObject = event.data?.object as Record<string, unknown> | undefined;
      if (!disputeObject) {
        res.status(200).json({ received: true, handled: false });
        return;
      }

      const stripeDisputeId = disputeObject.id as string;
      const status = disputeObject.status as string;
      const amount = disputeObject.amount as number;
      const currency = disputeObject.currency as string;
      const reason = disputeObject.reason as string | undefined;

      const statusMap: Record<string, string> = {
        warning_needs_response: 'warning_needs_response',
        warning_under_review: 'warning_under_review',
        warning_closed: 'warning_closed',
        needs_response: 'needs_response',
        under_review: 'under_review',
        charge_refunded: 'charge_refunded',
        won: 'won',
        lost: 'lost',
      };

      const mappedStatus = statusMap[status] ?? 'needs_response';

      const [existing] = await db
        .select()
        .from(billingDisputesTable)
        .where(eq(billingDisputesTable.stripeDisputeId, stripeDisputeId));

      if (existing) {
        await db
          .update(billingDisputesTable)
          .set({
            status: mappedStatus as typeof existing.status,
            amount: (amount / 100).toFixed(2),
            currency,
            reason,
            stripeRawData: disputeObject,
            updatedAt: new Date(),
            closedAt: ['won', 'lost', 'charge_refunded', 'warning_closed'].includes(mappedStatus)
              ? new Date()
              : existing.closedAt,
            outcome: mappedStatus === 'won' ? 'won' : mappedStatus === 'lost' ? 'lost' : existing.outcome,
          })
          .where(eq(billingDisputesTable.id, existing.id));

        await db.insert(billingDisputeAuditTable).values({
          disputeId: existing.id,
          action: `stripe_event_${event.type}`,
          notes: `Stripe status: ${status}`,
          metadata: { eventType: event.type, stripeStatus: status },
        });
      } else {
        logger.warn({ stripeDisputeId, eventType: event.type }, 'Stripe dispute webhook for untracked dispute');
      }

      res.status(200).json({ received: true, handled: true });
    } catch (err) {
      logger.error({ err }, 'Stripe dispute webhook failed');
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },
);

export default router;
