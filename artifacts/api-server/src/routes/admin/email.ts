import type { IRouter } from 'express';
import { z } from 'zod';
import {
  addEmailSuppression,
  buildAlertFiredEmail,
  buildNotificationDigestEmail,
  buildOrgInviteEmail,
  buildPasswordResetEmail,
  buildVerifyEmailTemplate,
  buildWelcomeEmail,
  generateUnsubscribeToken,
  isEmailSuppressed,
  sendEmail,
} from '../../lib/email.js';
import { sendBadRequest, sendError } from '../../lib/api-response.js';
import { logger } from '../../lib/logger.js';
import { validateBody, validateQuery } from '../../lib/validation.js';

let _suppressionPool: import('pg').Pool | null = null;
function suppressionPool(): import('pg').Pool {
  if (!_suppressionPool) {
    const { PgPool } = require('@szl-holdings/db') as typeof import('@szl-holdings/db');
    _suppressionPool = new PgPool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 10_000,
    }) as unknown as import('pg').Pool;
  }
  return _suppressionPool;
}

const testSendSchema = z.object({
  to: z.string().email(),
  template: z
    .enum(['welcome', 'alert', 'invite', 'digest', 'reset', 'verify'])
    .default('welcome'),
});

const suppressionAddSchema = z.object({
  email: z.string().email(),
  reason: z.enum(['bounce', 'complaint', 'unsubscribe', 'manual']),
  detail: z.string().max(500).optional(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export function register(router: IRouter) {
  router.post(
    '/admin/email/test-send',
    validateBody(testSendSchema),
    async (req, res) => {
      const { to, template } = req.body as z.infer<typeof testSendSchema>;

      logger.info({ to, template }, '[admin/email] Sending test email');

      const unsubscribeToken = generateUnsubscribeToken(to);
      let subject = '';
      let html = '';
      let text: string | undefined;

      switch (template) {
        case 'welcome': {
          subject = 'Welcome to SZL Holdings (test)';
          html = buildWelcomeEmail('Test User', to);
          break;
        }
        case 'alert': {
          const built = buildAlertFiredEmail({
            ruleName: 'Test Alert Rule',
            severity: 'warning',
            metricName: 'api.error_rate',
            metricValue: 4.2,
            condition: '>',
            threshold: 3,
          });
          subject = built.subject;
          html = built.html;
          text = built.text;
          break;
        }
        case 'invite': {
          html = buildOrgInviteEmail({
            orgName: 'SZL Holdings',
            inviteUrl: 'https://szlholdings.com/accept-invite',
            role: 'member',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            invitedByName: 'Admin',
          });
          subject = "You've been invited to SZL Holdings (test)";
          break;
        }
        case 'digest': {
          html = buildNotificationDigestEmail({
            userName: 'Test User',
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            notifications: [
              {
                title: 'Sample notification',
                message: 'This is a test digest notification.',
                type: 'info',
                actionUrl: null,
                createdAt: new Date().toISOString(),
              },
            ],
          });
          subject = 'Your Daily Digest — Test (test)';
          break;
        }
        case 'reset': {
          html = buildPasswordResetEmail('Test User', 'https://szlholdings.com/reset?token=test');
          subject = 'Reset Your Password (test)';
          break;
        }
        case 'verify': {
          html = buildVerifyEmailTemplate('Test User', 'https://szlholdings.com/verify?token=test');
          subject = 'Verify Your Email Address (test)';
          break;
        }
      }

      try {
        const result = await sendEmail({
          to,
          subject,
          html,
          ...(text ? { text } : {}),
          unsubscribeToken,
        });

        if (!result.success) {
          logger.warn({ to, template, error: result.error }, '[admin/email] Test send failed');
          return res.status(200).json({ success: false, error: result.error });
        }

        return res.status(200).json({
          success: true,
          messageId: result.messageId,
          provider: result.provider,
          template,
          to,
        });
      } catch (err) {
        logger.error({ err, to, template }, '[admin/email] Test send threw');
        return sendError(res, 'Failed to send test email');
      }
    },
  );

  router.get(
    '/admin/email/suppressions',
    validateQuery(listQuerySchema),
    async (req, res) => {
      const { limit, offset } = req.query as unknown as z.infer<typeof listQuerySchema>;
      try {
        const [rowsResult, countResult] = await Promise.all([
          suppressionPool().query<{
            id: number;
            email: string;
            reason: string;
            provider_event_id: string | null;
            provider: string | null;
            detail: string | null;
            suppressed_at: Date;
          }>(
            `SELECT id, email, reason, provider_event_id, provider, detail, suppressed_at
             FROM email_suppressions
             ORDER BY suppressed_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset],
          ),
          suppressionPool().query<{ count: number }>(
            'SELECT COUNT(*)::int AS count FROM email_suppressions',
          ),
        ]);
        return res.status(200).json({
          suppressions: rowsResult.rows,
          total: countResult.rows[0]?.count ?? 0,
        });
      } catch (err) {
        logger.error({ err }, '[admin/email] Failed to list suppressions');
        return sendError(res, 'Failed to fetch suppression list');
      }
    },
  );

  router.post(
    '/admin/email/suppressions',
    validateBody(suppressionAddSchema),
    async (req, res) => {
      const { email, reason, detail } = req.body as z.infer<typeof suppressionAddSchema>;
      await addEmailSuppression(email, reason, { detail, provider: 'admin' });
      return res.status(201).json({ ok: true, email, reason });
    },
  );

  router.delete('/admin/email/suppressions/:email', async (req, res) => {
    const email = decodeURIComponent(req.params.email).toLowerCase().trim();
    try {
      await suppressionPool().query(
        'DELETE FROM email_suppressions WHERE email = $1',
        [email],
      );
      return res.status(200).json({ ok: true, email });
    } catch (err) {
      logger.error({ err, email }, '[admin/email] Failed to delete suppression');
      return sendError(res, 'Failed to delete suppression');
    }
  });

  router.get('/admin/email/suppressed/:email', async (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const suppressed = await isEmailSuppressed(email);
    return res.status(200).json({ email, suppressed });
  });
}
