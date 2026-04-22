import { bodyShape } from '@szl-holdings/contracts/common';
import { carlotaInvoiceEmailLogTable, carlotaInvoicesTable, db } from '@szl-holdings/db';
import { desc, eq } from 'drizzle-orm';
import { type IRouter, type Request, type RequestHandler, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess } from '../lib/api-response';
import {
  buildCarlotaInvoiceEmail,
  CARLOTA_ADMIN_EMAIL,
  type CarlotaInvoiceEmailData,
  sendEmail,
} from '../lib/email';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const invoiceEmailLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Invoice email rate limit exceeded. Please wait a few minutes.' },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

router.post(
  '/booking/invoices/email',
  invoiceEmailLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      amount: z.unknown().optional(),
      ccAdmin: z.unknown().optional(),
      clientName: z.unknown().optional(),
      currency: z.unknown().optional(),
      dueDate: z.unknown().optional(),
      engagement: z.unknown().optional(),
      invoiceId: z.unknown().optional(),
      issuedDate: z.unknown().optional(),
      items: z.unknown().optional(),
      notes: z.unknown().optional(),
      recipientEmail: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<CarlotaInvoiceEmailData> & {
        recipientEmail?: string;
        ccAdmin?: boolean;
      };
      const {
        recipientEmail,
        invoiceId,
        clientName,
        engagement,
        issuedDate,
        dueDate,
        amount,
        currency,
        items,
        notes,
        ccAdmin,
      } = body;

      if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        sendBadRequest(res, 'A valid recipientEmail is required.');
        return;
      }
      if (!invoiceId || !clientName || !engagement || typeof amount !== 'number') {
        sendBadRequest(res, 'invoiceId, clientName, engagement, and amount are required.');
        return;
      }

      const invoiceData: CarlotaInvoiceEmailData = {
        invoiceId,
        clientName,
        engagement,
        issuedDate:
          issuedDate ||
          new Date().toLocaleDateString('en-GB', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        dueDate: dueDate || 'Net 15',
        amount,
        currency: currency || 'GBP',
        items: Array.isArray(items) ? items : undefined,
        notes,
      };

      const html = buildCarlotaInvoiceEmail(invoiceData);
      const symbol =
        invoiceData.currency === 'GBP' ? '£' : invoiceData.currency === 'EUR' ? '€' : '$';
      const subject = `Invoice ${invoiceId} from Carlota Jo Advisory — ${symbol}${amount.toLocaleString()}`;

      const sends: Array<Promise<{ success: boolean; error?: string; messageId?: string }>> = [
        sendEmail({ to: recipientEmail, subject, html, replyTo: CARLOTA_ADMIN_EMAIL }),
      ];
      if (ccAdmin) {
        sends.push(
          sendEmail({
            to: CARLOTA_ADMIN_EMAIL,
            subject: `[copy] ${subject}`,
            html,
            replyTo: recipientEmail,
          }),
        );
      }

      const [primary, adminCopy] = await Promise.all(sends);
      const sentAt = new Date();

      if (!primary.success) {
        const errorMsg = primary.error || 'Email delivery failed';
        logger.warn(
          { error: errorMsg, invoiceId, recipientEmail },
          '[email] Carlota Jo invoice send failed',
        );

        let logPersisted = true;
        try {
          await db.insert(carlotaInvoiceEmailLogTable).values({
            invoiceId,
            recipient: recipientEmail,
            sentAt,
            status: 'failed',
            error: errorMsg,
            messageId: null,
          });
          await db
            .update(carlotaInvoicesTable)
            .set({ lastSendError: errorMsg, updatedAt: new Date() })
            .where(eq(carlotaInvoicesTable.id, invoiceId));
        } catch (dbErr) {
          logPersisted = false;
          logger.warn({ err: dbErr, invoiceId }, '[invoice-email-log] failed to persist failure row');
        }

        res.status(502).json({
          success: false,
          error: errorMsg,
          logPersisted,
          message:
            "We couldn't deliver the invoice email. Please verify the recipient address and try again.",
        });
        return;
      }

      let logPersisted = true;
      try {
        await db.insert(carlotaInvoiceEmailLogTable).values({
          invoiceId,
          recipient: recipientEmail,
          sentAt,
          status: 'sent',
          error: null,
          messageId: primary.messageId ?? null,
        });
        await db
          .update(carlotaInvoicesTable)
          .set({
            status: 'sent',
            sentAt,
            sentTo: recipientEmail,
            lastSendError: null,
            updatedAt: new Date(),
          })
          .where(eq(carlotaInvoicesTable.id, invoiceId));
      } catch (dbErr) {
        logPersisted = false;
        logger.warn({ err: dbErr, invoiceId }, '[invoice-email-log] failed to persist success row');
      }

      res.json({
        success: true,
        messageId: primary.messageId,
        sentTo: recipientEmail,
        sentAt: sentAt.toISOString(),
        adminCopySent: adminCopy?.success ?? false,
        logPersisted,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to email invoice');
    }
  },
);

router.get(
  '/booking/invoices/email-log/:invoiceId',
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const invoiceId = String(req.params.invoiceId);
      const rows = await db
        .select()
        .from(carlotaInvoiceEmailLogTable)
        .where(eq(carlotaInvoiceEmailLogTable.invoiceId, invoiceId))
        .orderBy(desc(carlotaInvoiceEmailLogTable.sentAt));
      if (rows.length === 0) {
        const [invoice] = await db
          .select({ id: carlotaInvoicesTable.id })
          .from(carlotaInvoicesTable)
          .where(eq(carlotaInvoicesTable.id, invoiceId));
        if (!invoice) {
          sendNotFound(res, 'Invoice');
          return;
        }
      }
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to retrieve invoice email log');
    }
  },
);

export default router;
