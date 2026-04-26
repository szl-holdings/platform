import {
  contactSubmissionRepliesTable,
  contactSubmissionsTable,
  db,
  leadStatusTable,
  supportEmailLogTable,
  supportKnowledgeArticlesTable,
} from '@szl-holdings/db';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { IRouter } from 'express';
import { z } from 'zod';
import { sendBadRequest, sendError, sendNotFound, sendSuccess } from '../../lib/api-response.js';
import {
  buildAgentTicketReplyEmail,
  buildTicketStatusEmail,
  generateUnsubscribeToken,
  logNotificationAudit,
  sendEmail,
} from '../../lib/email.js';
import { logger } from '../../lib/logger.js';
import {
  kbArticleArchiveSchema,
  listQuerySchema,
  supportTicketTransitionSchema,
  validateBody,
  validateQuery,
} from '../../lib/validation.js';
import { pool } from '@szl-holdings/db';

const SUPPORT_NOTIFICATIONS_ENABLED = process.env.SUPPORT_EMAIL_NOTIFICATIONS !== 'false';

pool
  .query(
    `CREATE TABLE IF NOT EXISTS support_email_log (
       id SERIAL PRIMARY KEY,
       contact_submission_id INTEGER NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
       recipient TEXT NOT NULL,
       subject TEXT NOT NULL,
       template TEXT NOT NULL,
       previous_status TEXT,
       new_status TEXT,
       delivery_status TEXT NOT NULL,
       provider TEXT,
       message_id TEXT,
       error TEXT,
       sent_at TIMESTAMP NOT NULL DEFAULT NOW()
     )`,
  )
  .then(() =>
    pool.query(
      `CREATE INDEX IF NOT EXISTS idx_support_email_log_ticket_sent
       ON support_email_log (contact_submission_id, sent_at DESC)`,
    ),
  )
  .catch((err) => {
    logger.warn({ err }, '[support] Failed to bootstrap support_email_log table');
  });

async function persistEmailLog(opts: {
  contactSubmissionId: number;
  recipient: string;
  subject: string;
  template: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  deliveryStatus: 'sent' | 'failed';
  provider?: string;
  messageId?: string;
  error?: string;
}): Promise<void> {
  try {
    await db.insert(supportEmailLogTable).values({
      contactSubmissionId: opts.contactSubmissionId,
      recipient: opts.recipient,
      subject: opts.subject,
      template: opts.template,
      previousStatus: opts.previousStatus ?? null,
      newStatus: opts.newStatus ?? null,
      deliveryStatus: opts.deliveryStatus,
      provider: opts.provider ?? null,
      messageId: opts.messageId ?? null,
      error: opts.error ?? null,
    });
  } catch (err) {
    logger.warn({ err, ticketId: opts.contactSubmissionId }, '[support] Failed to persist email log');
  }
}

/** Resolve the configured support notification reply-to email from DB, falling back to env var. */
async function getSupportReplyEmail(): Promise<string> {
  try {
    const result = await pool.query(
      `SELECT notification_email FROM support_notification_settings ORDER BY updated_at DESC LIMIT 1`,
    );
    if (result.rows[0]?.notification_email) return result.rows[0].notification_email as string;
  } catch {
    // Non-fatal — fall back to env var
  }
  return process.env.SZL_INTERNAL_EMAIL || 'inquiries@szlholdings.com';
}

const updateStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'closed', 'lost']).optional(),
  ownerUserId: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional(),
  notify: z.boolean().optional(),
});

const kbArticleSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1).max(300),
  category: z.string().min(1).max(100),
  summary: z.string().min(1).max(1000),
  body: z.string().min(1).max(50000),
  tags: z.array(z.string().max(50)).max(20).default([]),
  isPublished: z.boolean().default(true),
});

const kbArticleUpdateSchema = kbArticleSchema.partial();

const replySchema = z.object({
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(10000),
});

function buildSupportReplyEmail(name: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SZL Holdings</title>
<style>
  body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e5e7eb; }
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
  .logo-mark { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #7c3aed); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
  .logo-mark span { color: white; font-weight: 700; font-size: 12px; }
  .logo-text { font-size: 15px; font-weight: 600; color: #111827; }
  h2 { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px; }
  p { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 16px; }
  .body-block { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 16px 0; font-size: 14px; color: #1f2937; line-height: 1.7; white-space: pre-wrap; }
  .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
  .footer { font-size: 11px; color: #9ca3af; line-height: 1.6; margin-top: 24px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="logo">
      <div class="logo-mark"><span>SZL</span></div>
      <span class="logo-text">SZL Holdings</span>
    </div>
    <h2>Re: Your Inquiry</h2>
    <p>Hello ${name},</p>
    <div class="body-block">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />')}</div>
    <div class="divider"></div>
    <div class="footer">
      <p>SZL Holdings · Washington, D.C. · London · Singapore</p>
      <p>This is a reply to your inquiry. You can respond directly to this email.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

function buildCsvRow(cells: string[]): string {
  return cells.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',');
}

export function register(router: IRouter): void {
  router.get('/admin/support-queue', validateQuery(listQuerySchema), async (req, res) => {
    try {
      const includeResolved = req.query.includeResolved === 'true';
      const format = req.query.format as string | undefined;
      const search = req.query.search as string | undefined;
      const statusFilter = req.query.status as string | undefined;
      const limitParam = parseInt((req.query.limit as string) ?? '100', 10);
      const limit = format === 'csv' ? 5000 : Math.min(Number.isNaN(limitParam) ? 100 : limitParam, 500);

      const conditions = [];
      if (!includeResolved) conditions.push(eq(contactSubmissionsTable.status, 'open'));
      if (search) {
        conditions.push(
          or(
            ilike(contactSubmissionsTable.fullName, `%${search}%`),
            ilike(contactSubmissionsTable.email, `%${search}%`),
            ilike(contactSubmissionsTable.formKey, `%${search}%`),
          )!,
        );
      }
      if (statusFilter && statusFilter !== 'all') {
        conditions.push(
          eq(
            leadStatusTable.status,
            statusFilter as 'new' | 'contacted' | 'qualified' | 'closed' | 'lost',
          ),
        );
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: contactSubmissionsTable.id,
          formKey: contactSubmissionsTable.formKey,
          fullName: contactSubmissionsTable.fullName,
          email: contactSubmissionsTable.email,
          company: contactSubmissionsTable.company,
          message: contactSubmissionsTable.message,
          preferredTimeline: contactSubmissionsTable.preferredTimeline,
          submissionStatus: contactSubmissionsTable.status,
          resolvedAt: contactSubmissionsTable.resolvedAt,
          createdAt: contactSubmissionsTable.createdAt,
          leadStatusId: leadStatusTable.id,
          status: leadStatusTable.status,
          notes: leadStatusTable.notes,
          ownerUserId: leadStatusTable.ownerUserId,
        })
        .from(contactSubmissionsTable)
        .leftJoin(
          leadStatusTable,
          eq(leadStatusTable.contactSubmissionId, contactSubmissionsTable.id),
        )
        .where(whereClause)
        .orderBy(desc(contactSubmissionsTable.createdAt))
        .limit(limit);

      // Fetch extra columns added by migration (not yet in Drizzle schema)
      const ids = rows.map((r) => r.id);
      const extraRows: Map<number, { emailOptOut: boolean; notificationSentAt: string | null }> = new Map();
      if (ids.length > 0) {
        try {
          const extraResult = await pool.query(
            `SELECT cs.id, COALESCE(cs.email_opt_out, false) as email_opt_out, ls.notification_sent_at
             FROM contact_submissions cs
             LEFT JOIN lead_status ls ON ls.contact_submission_id = cs.id
             WHERE cs.id = ANY($1)`,
            [ids],
          );
          for (const row of extraResult.rows) {
            extraRows.set(row.id, {
              emailOptOut: row.email_opt_out === true,
              notificationSentAt: row.notification_sent_at ?? null,
            });
          }
        } catch {
          // columns may not exist yet on older DBs — gracefully degrade
        }
      }

      const tickets = rows.map((r) => {
        const extra = extraRows.get(r.id);
        return {
          id: r.id,
          formKey: r.formKey,
          fullName: r.fullName,
          email: r.email,
          company: r.company,
          message: r.message,
          preferredTimeline: r.preferredTimeline,
          submissionStatus: r.submissionStatus,
          resolvedAt: r.resolvedAt,
          createdAt: r.createdAt,
          leadStatusId: r.leadStatusId,
          status: r.status ?? 'new',
          notes: r.notes,
          ownerUserId: r.ownerUserId,
          emailOptOut: extra?.emailOptOut ?? false,
          notificationSentAt: extra?.notificationSentAt ?? null,
        };
      });

      if (format === 'csv') {
        const header = buildCsvRow([
          'ID',
          'Name',
          'Email',
          'Form',
          'Company',
          'Status',
          'Submission Status',
          'Message',
          'Notes',
          'Owner User ID',
          'Submitted At',
          'Resolved At',
        ]);
        const body = tickets.map((t) =>
          buildCsvRow([
            String(t.id),
            t.fullName,
            t.email,
            t.formKey,
            t.company ?? '',
            t.status,
            t.submissionStatus ?? '',
            (t.message ?? '').replace(/\r?\n/g, ' '),
            (t.notes ?? '').replace(/\r?\n/g, ' '),
            t.ownerUserId != null ? String(t.ownerUserId) : '',
            t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
            t.resolvedAt instanceof Date ? t.resolvedAt.toISOString() : (t.resolvedAt ?? ''),
          ]),
        );
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="support-queue.csv"');
        res.send([header, ...body].join('\r\n'));
        return;
      }

      const [{ total }, [{ openTotal }]] = await Promise.all([
        db
          .select({ total: sql<number>`count(*)::int` })
          .from(contactSubmissionsTable)
          .then((r) => r[0]),
        db
          .select({ openTotal: sql<number>`count(*)::int` })
          .from(contactSubmissionsTable)
          .where(eq(contactSubmissionsTable.status, 'open')),
      ]);

      res.json({ tickets, total, openTotal });
    } catch (err) {
      logger.error({ err }, '[admin/support-queue] GET failed');
      sendError(res, 'Failed to fetch support queue', 500, 'INTERNAL_ERROR');
    }
  });

  router.post(
    '/admin/support-queue/:id/status',
    validateBody(updateStatusSchema),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id as string, 10);
        if (Number.isNaN(id)) {
          sendBadRequest(res, 'Invalid ticket ID');
          return;
        }

        const [submission] = await db
          .select()
          .from(contactSubmissionsTable)
          .where(eq(contactSubmissionsTable.id, id));

        if (!submission) {
          sendNotFound(res, 'Ticket');
          return;
        }

        const { status, ownerUserId, notes, notify } = req.body as {
          status?: string;
          ownerUserId?: number;
          notes?: string;
          notify?: boolean;
        };

        const [existingLead] = await db
          .select()
          .from(leadStatusTable)
          .where(eq(leadStatusTable.contactSubmissionId, id));

        const previousStatus = existingLead?.status;

        let leadRow;
        if (existingLead) {
          const updateData: Record<string, unknown> = { updatedAt: new Date() };
          if (status !== undefined) updateData.status = status;
          if (ownerUserId !== undefined) updateData.ownerUserId = ownerUserId;
          if (notes !== undefined) updateData.notes = notes;
          [leadRow] = await db
            .update(leadStatusTable)
            .set(updateData)
            .where(eq(leadStatusTable.id, existingLead.id))
            .returning();
        } else {
          [leadRow] = await db
            .insert(leadStatusTable)
            .values({
              contactSubmissionId: id,
              status: (status as 'new' | 'contacted' | 'qualified' | 'closed' | 'lost') ?? 'new',
              ownerUserId: ownerUserId ?? null,
              notes: notes ?? null,
            })
            .returning();
        }

        const shouldNotify = notify !== undefined ? notify : SUPPORT_NOTIFICATIONS_ENABLED;
        const statusChanged = status !== undefined && status !== previousStatus;
        const notesAdded = notes !== undefined && notes !== (existingLead?.notes ?? null);
        const emailOptOut = submission.emailOptOut === true;

        const willNotify = shouldNotify && (statusChanged || notesAdded) && leadRow && !emailOptOut;

        if (willNotify && leadRow) {
          const emailPayload = buildTicketStatusEmail({
            name: submission.fullName,
            previousStatus: previousStatus ?? undefined,
            newStatus: leadRow.status,
            notes: notesAdded ? notes : null,
            ticketId: id,
          });
          const unsubToken = generateUnsubscribeToken(submission.email);
          const replyToAddr = await getSupportReplyEmail();

          sendEmail({
            to: submission.email,
            subject: emailPayload.subject,
            html: emailPayload.html,
            text: emailPayload.text,
            replyTo: replyToAddr,
            unsubscribeToken: unsubToken,
          })
            .then(async (result) => {
              if (result.success) {
                logger.info(
                  { id, provider: result.provider },
                  '[admin/support-queue] Status notification email sent',
                );
                await db
                  .update(leadStatusTable)
                  .set({ notificationSentAt: new Date() })
                  .where(eq(leadStatusTable.id, leadRow!.id))
                  .catch(() => {});
              } else {
                logger.warn(
                  { id, error: result.error },
                  '[admin/support-queue] Status notification email failed',
                );
              }
              logNotificationAudit({
                template: 'support_status_change',
                recipient: submission.email,
                subject: emailPayload.subject,
                entityType: 'support_ticket',
                entityId: String(id),
                deliveryStatus: result.success ? 'sent' : 'failed',
                messageId: result.messageId,
                provider: result.provider,
                error: result.error,
              });
              persistEmailLog({
                contactSubmissionId: id,
                recipient: submission.email,
                subject: emailPayload.subject,
                template: 'status_change',
                previousStatus: previousStatus ?? null,
                newStatus: status ?? leadRow!.status,
                deliveryStatus: result.success ? 'sent' : 'failed',
                provider: result.provider,
                messageId: result.messageId,
                error: result.error,
              });
            })
            .catch((err) => {
              logger.error(
                { err, id },
                '[admin/support-queue] Status notification email threw unexpectedly',
              );
              persistEmailLog({
                contactSubmissionId: id,
                recipient: submission.email,
                subject: emailPayload.subject,
                template: 'status_change',
                previousStatus: previousStatus ?? null,
                newStatus: status ?? 'unknown',
                deliveryStatus: 'failed',
                error: String(err),
              });
            });
        }

        res.json({
          success: true,
          leadStatus: leadRow,
          notificationQueued: !!willNotify,
          emailOptOut,
        });
      } catch (err) {
        logger.error({ err }, '[admin/support-queue] POST status failed');
        sendError(res, 'Failed to update ticket status', 500, 'INTERNAL_ERROR');
      }
    },
  );

  router.post(
    '/admin/support-queue/:id/resolve',
    validateBody(supportTicketTransitionSchema),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id as string, 10);
        if (Number.isNaN(id)) {
          sendBadRequest(res, 'Invalid ticket ID');
          return;
        }

        const [updated] = await db
          .update(contactSubmissionsTable)
          .set({ status: 'resolved', resolvedAt: new Date() })
          .where(eq(contactSubmissionsTable.id, id))
          .returning();

        if (!updated) {
          sendNotFound(res, 'Ticket');
          return;
        }

        res.json({ success: true, ticket: updated });
      } catch (err) {
        logger.error({ err }, '[admin/support-queue] POST resolve failed');
        sendError(res, 'Failed to resolve ticket', 500, 'INTERNAL_ERROR');
      }
    },
  );

  router.post(
    '/admin/support-queue/:id/reopen',
    validateBody(supportTicketTransitionSchema),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id as string, 10);
        if (Number.isNaN(id)) {
          sendBadRequest(res, 'Invalid ticket ID');
          return;
        }

        const [updated] = await db
          .update(contactSubmissionsTable)
          .set({ status: 'open', resolvedAt: null })
          .where(eq(contactSubmissionsTable.id, id))
          .returning();

        if (!updated) {
          sendNotFound(res, 'Ticket');
          return;
        }

        res.json({ success: true, ticket: updated });
      } catch (err) {
        logger.error({ err }, '[admin/support-queue] POST reopen failed');
        sendError(res, 'Failed to reopen ticket', 500, 'INTERNAL_ERROR');
      }
    },
  );

  router.post('/admin/support-queue/:id/reply', validateBody(replySchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (Number.isNaN(id)) {
        sendBadRequest(res, 'Invalid ticket ID');
        return;
      }

      const [submission] = await db
        .select()
        .from(contactSubmissionsTable)
        .where(eq(contactSubmissionsTable.id, id));

      if (!submission) {
        sendNotFound(res, 'Ticket');
        return;
      }

      const { subject, body } = req.body as { subject: string; body: string };
      const sentBy = (req as any).user?.displayName ?? (req as any).user?.email ?? 'Admin';
      const emailOptOut = submission.emailOptOut === true;

      if (emailOptOut) {
        res.json({ success: false, sent: false, error: 'Contact has opted out of email notifications' });
        return;
      }

      const unsubToken = generateUnsubscribeToken(submission.email);
      const { subject: emailSubject, html: emailHtml, text: emailText } = buildAgentTicketReplyEmail({
        name: submission.fullName,
        agentReply: body,
        ticketId: id,
        originalSubject: subject,
      });
      const replyToAddr = await getSupportReplyEmail();

      // Persist the reply record BEFORE attempting delivery so that any
      // exception inside sendEmail still leaves an auditable history entry.
      const [savedReply] = await db
        .insert(contactSubmissionRepliesTable)
        .values({
          contactSubmissionId: id,
          subject,
          body,
          sentBy,
          emailSuccess: false,
          messageId: null,
        })
        .returning();

      let emailResult: { success: boolean; messageId?: string; provider?: string; error?: string };
      try {
        emailResult = await sendEmail({
          to: submission.email,
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
          replyTo: replyToAddr,
          unsubscribeToken: unsubToken,
        });
      } catch (sendErr) {
        logger.error({ sendErr, id }, '[admin/support-queue] sendEmail threw unexpectedly');
        emailResult = { success: false, error: String(sendErr) };
      }

      // Update the persisted record with the actual delivery outcome.
      const [updatedReply] = await db
        .update(contactSubmissionRepliesTable)
        .set({
          emailSuccess: emailResult.success,
          messageId: emailResult.messageId ?? null,
        })
        .where(eq(contactSubmissionRepliesTable.id, savedReply.id))
        .returning();

      logNotificationAudit({
        template: 'support_agent_reply',
        recipient: submission.email,
        subject: emailSubject,
        entityType: 'support_ticket',
        entityId: String(id),
        deliveryStatus: emailResult.success ? 'sent' : 'failed',
        messageId: emailResult.messageId,
        provider: emailResult.provider,
        error: emailResult.error,
      });
      await persistEmailLog({
        contactSubmissionId: id,
        recipient: submission.email,
        subject: emailSubject,
        template: 'agent_reply',
        deliveryStatus: emailResult.success ? 'sent' : 'failed',
        provider: emailResult.provider,
        messageId: emailResult.messageId,
        error: emailResult.error,
      });

      if (!emailResult.success) {
        logger.warn({ id, error: emailResult.error }, '[admin/support-queue] Reply email failed');
        res.json({ success: false, sent: false, error: emailResult.error, reply: updatedReply ?? savedReply });
        return;
      }

      res.json({
        success: true,
        sent: true,
        messageId: emailResult.messageId,
        provider: emailResult.provider,
        reply: updatedReply ?? savedReply,
      });
    } catch (err) {
      logger.error({ err }, '[admin/support-queue] POST reply failed');
      sendError(res, 'Failed to send reply', 500, 'INTERNAL_ERROR');
    }
  });

  router.get('/admin/support-queue/:id/replies', async (req, res) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (Number.isNaN(id)) {
        sendBadRequest(res, 'Invalid ticket ID');
        return;
      }

      const [submission] = await db
        .select({ id: contactSubmissionsTable.id })
        .from(contactSubmissionsTable)
        .where(eq(contactSubmissionsTable.id, id));

      if (!submission) {
        sendNotFound(res, 'Ticket');
        return;
      }

      const replies = await db
        .select()
        .from(contactSubmissionRepliesTable)
        .where(eq(contactSubmissionRepliesTable.contactSubmissionId, id))
        .orderBy(asc(contactSubmissionRepliesTable.sentAt));

      res.json({ replies });
    } catch (err) {
      logger.error({ err }, '[admin/support-queue] GET replies failed');
      sendError(res, 'Failed to fetch replies', 500, 'INTERNAL_ERROR');
    }
  });

  // ── Per-ticket email audit log ────────────────────────────────────────────
  router.get('/admin/support-queue/:id/email-log', async (req, res) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (Number.isNaN(id)) {
        sendBadRequest(res, 'Invalid ticket ID');
        return;
      }

      const [submission] = await db
        .select({ id: contactSubmissionsTable.id })
        .from(contactSubmissionsTable)
        .where(eq(contactSubmissionsTable.id, id));

      if (!submission) {
        sendNotFound(res, 'Ticket');
        return;
      }

      const logs = await db
        .select()
        .from(supportEmailLogTable)
        .where(eq(supportEmailLogTable.contactSubmissionId, id))
        .orderBy(desc(supportEmailLogTable.sentAt));

      res.json({ logs });
    } catch (err) {
      logger.error({ err }, '[admin/support-queue] GET email-log failed');
      sendError(res, 'Failed to fetch email log', 500, 'INTERNAL_ERROR');
    }
  });

  // ── Per-contact email opt-out management ──────────────────────────────────
  router.post('/admin/support-queue/:id/opt-out', async (req, res) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (Number.isNaN(id)) { sendBadRequest(res, 'Invalid ticket ID'); return; }
      const body = req.body as { optOut?: boolean };
      const optOut = body.optOut !== false;
      const result = await pool.query(
        `UPDATE contact_submissions SET email_opt_out = $1, email_opt_out_at = $2 WHERE id = $3`,
        [optOut, optOut ? new Date() : null, id],
      );
      if ((result.rowCount ?? 0) === 0) {
        sendNotFound(res, 'Ticket');
        return;
      }
      sendSuccess(res, { id, emailOptOut: optOut });
    } catch (err) {
      logger.error({ err }, '[admin/support-queue] POST opt-out failed');
      sendError(res, 'Failed to update opt-out', 500, 'INTERNAL_ERROR');
    }
  });

  // ── Admin notification email address settings ─────────────────────────────
  router.get('/admin/notification-settings', async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM support_notification_settings ORDER BY updated_at DESC LIMIT 1`,
      );
      sendSuccess(res, result.rows[0] ?? { notification_email: process.env.SZL_INTERNAL_EMAIL || 'team@szlholdings.com' });
    } catch (err) {
      logger.error({ err }, '[admin/notification-settings] GET failed');
      sendError(res, 'Failed to fetch notification settings', 500, 'INTERNAL_ERROR');
    }
  });

  router.put('/admin/notification-settings', async (req, res) => {
    try {
      const body = req.body as { notificationEmail?: string; updatedBy?: string };
      if (!body.notificationEmail) { sendBadRequest(res, 'notificationEmail is required'); return; }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.notificationEmail)) { sendBadRequest(res, 'Invalid email address'); return; }
      // Singleton upsert: the migration seeds id=1; always update that row.
      // If the seed somehow didn't run, insert a new row.
      await pool.query(
        `INSERT INTO support_notification_settings (id, notification_email, updated_at, updated_by)
         VALUES (1, $1, NOW(), $2)
         ON CONFLICT (id) DO UPDATE SET notification_email = EXCLUDED.notification_email,
           updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
        [body.notificationEmail, body.updatedBy ?? null],
      );
      sendSuccess(res, { notificationEmail: body.notificationEmail });
    } catch (err) {
      logger.error({ err }, '[admin/notification-settings] PUT failed');
      sendError(res, 'Failed to update notification settings', 500, 'INTERNAL_ERROR');
    }
  });

  // ── Notification audit log endpoint ───────────────────────────────────────
  router.get('/admin/notification-audit-log', async (req, res) => {
    try {
      const limitParam = parseInt((req.query.limit as string) ?? '100', 10);
      const limit = Math.min(Number.isNaN(limitParam) ? 100 : limitParam, 500);
      const template = req.query.template as string | undefined;
      const recipient = req.query.recipient as string | undefined;
      let q = `SELECT * FROM notification_audit_log WHERE 1=1`;
      const params: unknown[] = [];
      if (template) { params.push(template); q += ` AND template = $${params.length}`; }
      if (recipient) { params.push(`%${recipient}%`); q += ` AND recipient ILIKE $${params.length}`; }
      params.push(limit);
      q += ` ORDER BY sent_at DESC LIMIT $${params.length}`;
      const result = await pool.query(q, params);
      const [{ total }] = (await pool.query(`SELECT COUNT(*)::int as total FROM notification_audit_log`)).rows;
      sendSuccess(res, { logs: result.rows, total });
    } catch (err) {
      logger.error({ err }, '[admin/notification-audit-log] GET failed');
      sendError(res, 'Failed to fetch audit log', 500, 'INTERNAL_ERROR');
    }
  });

  router.get('/admin/kb-articles', async (_req, res) => {
    try {
      const articles = await db
        .select()
        .from(supportKnowledgeArticlesTable)
        .orderBy(desc(supportKnowledgeArticlesTable.updatedAt));
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(supportKnowledgeArticlesTable);
      res.json({ articles, total });
    } catch (err) {
      logger.error({ err }, '[admin/kb-articles] GET failed');
      sendError(res, 'Failed to fetch KB articles', 500, 'INTERNAL_ERROR');
    }
  });

  router.post('/admin/kb-articles', validateBody(kbArticleSchema), async (req, res) => {
    try {
      const data = req.body as z.infer<typeof kbArticleSchema>;
      const [article] = await db.insert(supportKnowledgeArticlesTable).values(data).returning();
      logger.info({ slug: article.slug }, '[admin/kb-articles] Article created');
      res.status(201).json({ article });
    } catch (err: unknown) {
      const pgError = err as { code?: string };
      if (pgError?.code === '23505') {
        sendBadRequest(res, 'An article with that slug already exists');
        return;
      }
      logger.error({ err }, '[admin/kb-articles] POST failed');
      sendError(res, 'Failed to create KB article', 500, 'INTERNAL_ERROR');
    }
  });

  router.patch('/admin/kb-articles/:id', validateBody(kbArticleUpdateSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (Number.isNaN(id)) {
        sendBadRequest(res, 'Invalid article ID');
        return;
      }

      const data = req.body as z.infer<typeof kbArticleUpdateSchema>;
      if (Object.keys(data).length === 0) {
        sendBadRequest(res, 'No fields to update');
        return;
      }

      const [article] = await db
        .update(supportKnowledgeArticlesTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(supportKnowledgeArticlesTable.id, id))
        .returning();

      if (!article) {
        sendNotFound(res, 'KB article');
        return;
      }

      logger.info({ id, slug: article.slug }, '[admin/kb-articles] Article updated');
      res.json({ article });
    } catch (err: unknown) {
      const pgError = err as { code?: string };
      if (pgError?.code === '23505') {
        sendBadRequest(res, 'An article with that slug already exists');
        return;
      }
      logger.error({ err }, '[admin/kb-articles] PATCH failed');
      sendError(res, 'Failed to update KB article', 500, 'INTERNAL_ERROR');
    }
  });

  router.delete(
    '/admin/kb-articles/:id',
    validateBody(kbArticleArchiveSchema),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id as string, 10);
        if (Number.isNaN(id)) {
          sendBadRequest(res, 'Invalid article ID');
          return;
        }

        const [article] = await db
          .update(supportKnowledgeArticlesTable)
          .set({ isPublished: false, updatedAt: new Date() })
          .where(eq(supportKnowledgeArticlesTable.id, id))
          .returning();

        if (!article) {
          sendNotFound(res, 'KB article');
          return;
        }

        logger.info({ id, slug: article.slug }, '[admin/kb-articles] Article archived');
        res.json({ success: true, article });
      } catch (err) {
        logger.error({ err }, '[admin/kb-articles] DELETE failed');
        sendError(res, 'Failed to archive KB article', 500, 'INTERNAL_ERROR');
      }
    },
  );
}
