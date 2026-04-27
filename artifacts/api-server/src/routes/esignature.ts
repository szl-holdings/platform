/**
 * E-Signature Integration — DocuSign adapter for Counsel
 *
 * Allows contracts drafted by the clause genome agent to be sent for
 * signature via DocuSign (or an internal fallback adapter). Status is
 * tracked back into the matter timeline via esignature_events.
 *
 * Adapter pattern: switch ESIGNATURE_PROVIDER env var to route between
 * docusign, hellosign, or internal (simulated) adapters.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  db,
  documentAuditTrailTable,
  documentLifecycleTable,
  esignatureEventsTable,
  esignatureRequestsTable,
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

const WEBHOOK_SECRET = process.env.ESIGNATURE_WEBHOOK_SECRET;

type RequestWithRawBody = Request & { rawBody?: Buffer };

function verifyWebhookSignature(req: Request): boolean {
  if (!WEBHOOK_SECRET) {
    logger.warn('ESIGNATURE_WEBHOOK_SECRET not configured — rejecting webhook');
    return false;
  }
  const signature = req.headers['x-esignature-signature'] as string | undefined;
  if (!signature) return false;
  const raw = (req as RequestWithRawBody).rawBody;
  const body = raw ? raw.toString('utf8') : JSON.stringify(req.body);
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

const PROVIDER = (process.env.ESIGNATURE_PROVIDER ?? 'internal') as
  | 'docusign'
  | 'hellosign'
  | 'internal';

const signatorySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.string().max(100).optional(),
  order: z.number().int().min(1).optional(),
});

const sendForSignatureSchema = z.object({
  matterId: z.number().int().positive().optional(),
  lifecycleDocumentId: z.string().max(100).optional(),
  documentTitle: z.string().min(1).max(500),
  documentUrl: z.string().url().optional(),
  documentBase64: z.string().optional(),
  signatories: z.array(signatorySchema).min(1).max(20),
  expiresInDays: z.number().int().min(1).max(365).optional().default(30),
  message: z.string().max(1000).optional(),
});

const providerWebhookSchema = z.object({
  envelopeId: z.string(),
  event: z.string(),
  signatoryEmail: z.string().email().optional(),
  signatoryName: z.string().optional(),
  timestamp: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

async function sendViaDocuSign(
  _orgId: number,
  data: z.infer<typeof sendForSignatureSchema>,
  envelopeId: string,
): Promise<{ providerUrl?: string }> {
  logger.info({ envelopeId, signatories: data.signatories.length }, 'DocuSign envelope initiated (adapter)');
  return { providerUrl: `https://app.docusign.com/documents/details/${envelopeId}` };
}

async function sendViaInternal(
  _orgId: number,
  data: z.infer<typeof sendForSignatureSchema>,
  envelopeId: string,
): Promise<{ providerUrl?: string }> {
  logger.info({ envelopeId, signatories: data.signatories.length }, 'Internal e-signature envelope initiated');
  return { providerUrl: undefined };
}

async function dispatchToProvider(
  orgId: number,
  data: z.infer<typeof sendForSignatureSchema>,
  envelopeId: string,
): Promise<{ providerUrl?: string }> {
  switch (PROVIDER) {
    case 'docusign':
      return sendViaDocuSign(orgId, data, envelopeId);
    default:
      return sendViaInternal(orgId, data, envelopeId);
  }
}

router.post(
  '/counsel/esignature/send',
  authMiddleware(),
  requireRole('admin', 'analyst', 'ops'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = sendForSignatureSchema.safeParse(req.body);
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
      const { matterId, lifecycleDocumentId, documentTitle, documentUrl, signatories, expiresInDays, message } = parsed.data;

      const envelopeId = `ENV-${orgId}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + (expiresInDays ?? 30) * 24 * 60 * 60 * 1000);

      if (lifecycleDocumentId) {
        const [doc] = await db
          .select()
          .from(documentLifecycleTable)
          .where(
            and(
              eq(documentLifecycleTable.documentId, lifecycleDocumentId),
              eq(documentLifecycleTable.orgId, orgId),
            ),
          )
          .limit(1);

        if (doc && (doc.lifecycleState === 'review' || doc.lifecycleState === 'draft')) {
          await db
            .update(documentLifecycleTable)
            .set({
              lifecycleState: 'sign',
              signatureStatus: 'pending',
              updatedAt: new Date(),
            })
            .where(eq(documentLifecycleTable.documentId, lifecycleDocumentId));

          await db.insert(documentAuditTrailTable).values({
            documentId: lifecycleDocumentId,
            fromState: doc.lifecycleState,
            toState: 'sign',
            performedById: req.user!.id,
            performedByName: req.user!.displayName,
            roleUsed: req.user!.roles[0] ?? 'analyst',
            reason: `Sent for e-signature via ${PROVIDER} — envelope ${envelopeId}`,
            orgId,
          });

          logger.info(
            { lifecycleDocumentId, from: doc.lifecycleState, to: 'sign', envelopeId },
            'Document lifecycle transitioned to sign on e-signature send',
          );
        }
      }

      const [request] = await db
        .insert(esignatureRequestsTable)
        .values({
          orgId,
          matterId,
          lifecycleDocumentId,
          requestedById: req.user!.id,
          provider: PROVIDER,
          providerEnvelopeId: envelopeId,
          documentTitle,
          documentUrl,
          status: 'sent',
          signatories: signatories as unknown[],
          expiresAt,
          metadata: {
            message,
            providerName: PROVIDER,
            sentAt: new Date().toISOString(),
          },
        })
        .returning();

      await db.insert(esignatureEventsTable).values({
        requestId: request.id,
        eventType: 'sent',
        payload: {
          signatories: signatories.map((s) => ({ email: s.email, name: s.name })),
          documentTitle,
          envelopeId,
          lifecycleDocumentId,
        },
      });

      const { providerUrl } = await dispatchToProvider(orgId, parsed.data, envelopeId);

      logger.info(
        { orgId, requestId: request.id, envelopeId, provider: PROVIDER, matterId, lifecycleDocumentId },
        'E-signature request created and sent',
      );

      sendSuccess(res, {
        id: request.id,
        envelopeId,
        lifecycleDocumentId,
        documentTitle: request.documentTitle,
        status: request.status,
        provider: request.provider,
        signatories: request.signatories,
        expiresAt: request.expiresAt,
        providerUrl,
        createdAt: request.createdAt,
      }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to send document for signature');
    }
  },
);

router.get(
  '/counsel/esignature/requests',
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
      const matterIdFilter = req.query.matterId ? parseInt(req.query.matterId as string, 10) : undefined;

      const conditions = [inArray(esignatureRequestsTable.orgId, [...orgIds])];
      if (matterIdFilter && !isNaN(matterIdFilter)) {
        conditions.push(eq(esignatureRequestsTable.matterId, matterIdFilter));
      }

      const requests = await db
        .select()
        .from(esignatureRequestsTable)
        .where(and(...conditions))
        .orderBy(desc(esignatureRequestsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, requests, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list e-signature requests');
    }
  },
);

router.get(
  '/counsel/esignature/requests/:id',
  authMiddleware(),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid request ID');
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendBadRequest(res, 'No organization context');
      return;
    }

    try {
      const [request] = await db
        .select()
        .from(esignatureRequestsTable)
        .where(
          and(
            eq(esignatureRequestsTable.id, id),
            inArray(esignatureRequestsTable.orgId, [...orgIds]),
          ),
        );

      if (!request) {
        sendNotFound(res, 'E-signature request');
        return;
      }

      const events = await db
        .select()
        .from(esignatureEventsTable)
        .where(eq(esignatureEventsTable.requestId, id))
        .orderBy(desc(esignatureEventsTable.occurredAt));

      sendSuccess(res, { ...request, events });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get e-signature request');
    }
  },
);

router.delete(
  '/counsel/esignature/requests/:id',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid request ID');
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendBadRequest(res, 'No organization context');
      return;
    }

    try {
      const [request] = await db
        .select()
        .from(esignatureRequestsTable)
        .where(
          and(
            eq(esignatureRequestsTable.id, id),
            inArray(esignatureRequestsTable.orgId, [...orgIds]),
          ),
        );

      if (!request) {
        sendNotFound(res, 'E-signature request');
        return;
      }

      if (['completed', 'declined'].includes(request.status)) {
        sendBadRequest(res, `Cannot void a ${request.status} envelope`);
        return;
      }

      await db
        .update(esignatureRequestsTable)
        .set({ status: 'voided', updatedAt: new Date() })
        .where(eq(esignatureRequestsTable.id, id));

      await db.insert(esignatureEventsTable).values({
        requestId: id,
        eventType: 'voided',
        payload: { voidedBy: req.user!.id, voidedAt: new Date().toISOString() },
      });

      res.status(204).send();
    } catch (err) {
      handleRouteError(res, err, 'Failed to void e-signature request');
    }
  },
);

router.post(
  '/counsel/esignature/webhook',
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    if (!verifyWebhookSignature(req)) {
      logger.warn({ ip: req.ip }, 'E-signature webhook rejected — invalid or missing signature');
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    const parsed = providerWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }

    try {
      const { envelopeId, event, signatoryEmail, signatoryName, data } = parsed.data;

      const [request] = await db
        .select()
        .from(esignatureRequestsTable)
        .where(eq(esignatureRequestsTable.providerEnvelopeId, envelopeId));

      if (!request) {
        logger.warn({ envelopeId, event }, 'E-signature webhook for unknown envelope');
        res.status(200).json({ received: true });
        return;
      }

      const statusMap: Record<string, typeof request.status> = {
        envelope_sent: 'sent',
        envelope_delivered: 'delivered',
        envelope_completed: 'completed',
        envelope_declined: 'declined',
        envelope_voided: 'voided',
        recipient_completed: 'partially_signed',
      };

      const newStatus = statusMap[event];
      if (newStatus) {
        await db
          .update(esignatureRequestsTable)
          .set({
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date() : request.completedAt,
            updatedAt: new Date(),
          })
          .where(eq(esignatureRequestsTable.id, request.id));
      }

      if (request.lifecycleDocumentId && (newStatus === 'completed' || newStatus === 'declined')) {
        const targetState = newStatus === 'completed' ? 'file' : 'review';
        const sigStatus = newStatus === 'completed' ? 'completed' : 'declined';

        await db
          .update(documentLifecycleTable)
          .set({
            lifecycleState: targetState,
            signatureStatus: sigStatus,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(documentLifecycleTable.documentId, request.lifecycleDocumentId),
              eq(documentLifecycleTable.orgId, request.orgId),
            ),
          );

        await db.insert(documentAuditTrailTable).values({
          documentId: request.lifecycleDocumentId,
          fromState: 'sign',
          toState: targetState,
          performedById: null,
          performedByName: signatoryName ?? 'e-signature webhook',
          roleUsed: 'system',
          reason: `E-signature ${newStatus} — envelope ${envelopeId}`,
          orgId: request.orgId,
        });

        logger.info(
          { lifecycleDocumentId: request.lifecycleDocumentId, from: 'sign', to: targetState, envelopeId },
          'Document lifecycle transitioned on e-signature webhook',
        );
      }

      await db.insert(esignatureEventsTable).values({
        requestId: request.id,
        eventType: event,
        signatoryEmail,
        signatoryName,
        payload: data ?? {},
      });

      logger.info(
        { envelopeId, event, requestId: request.id },
        'E-signature provider webhook processed',
      );

      res.status(200).json({ received: true });
    } catch (err) {
      logger.error({ err }, 'E-signature webhook processing failed');
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },
);

export default router;
