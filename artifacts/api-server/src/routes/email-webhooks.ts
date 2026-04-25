import { Router, type Request, type Response } from 'express';
import { db, notificationPreferencesTable, usersTable } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { addEmailSuppression, verifyUnsubscribeToken } from '../lib/email.js';

const router = Router();

function validateSendGridSignature(req: Request): boolean {
  const secret = process.env.SENDGRID_WEBHOOK_SECRET;
  if (!secret) return true;
  const provided = req.headers['authorization'];
  return provided === secret;
}

function validateResendSignature(req: Request): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true;
  const provided = req.headers['svix-signature'] ?? req.headers['resend-signature'];
  return typeof provided === 'string' && provided.length > 0;
}

router.post('/email-webhooks/sendgrid', async (req: Request, res: Response) => {
  if (!validateSendGridSignature(req)) {
    logger.warn('[email-webhook/sendgrid] Invalid authorization header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const events: unknown[] = Array.isArray(req.body) ? req.body : [req.body];
  let processed = 0;

  for (const event of events) {
    if (!event || typeof event !== 'object') continue;
    const e = event as Record<string, unknown>;
    const eventType = String(e.event ?? '');
    const email = String(e.email ?? '');
    if (!email) continue;

    if (eventType === 'bounce') {
      await addEmailSuppression(email, 'bounce', {
        providerEventId: String(e.sg_event_id ?? ''),
        provider: 'sendgrid',
        detail: `type=${e.type ?? ''} status=${e.status ?? ''}`,
      });
      processed++;
    } else if (eventType === 'spamreport') {
      await addEmailSuppression(email, 'complaint', {
        providerEventId: String(e.sg_event_id ?? ''),
        provider: 'sendgrid',
        detail: 'spam report',
      });
      processed++;
    } else if (eventType === 'unsubscribe') {
      await addEmailSuppression(email, 'unsubscribe', {
        providerEventId: String(e.sg_event_id ?? ''),
        provider: 'sendgrid',
        detail: 'unsubscribe event',
      });
      processed++;
    }
  }

  logger.info({ processed, total: events.length }, '[email-webhook/sendgrid] Processed events');
  return res.status(200).json({ ok: true, processed });
});

router.post('/email-webhooks/resend', async (req: Request, res: Response) => {
  if (!validateResendSignature(req)) {
    logger.warn('[email-webhook/resend] Invalid signature');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body as Record<string, unknown>;
  const eventType = String(body.type ?? '');
  const data = (body.data ?? {}) as Record<string, unknown>;
  const email = String(
    (data.to as string[] | undefined)?.[0] ?? data.to ?? '',
  );

  if (!email) {
    return res.status(200).json({ ok: true, processed: 0 });
  }

  let processed = 0;

  if (eventType === 'email.bounced') {
    await addEmailSuppression(email, 'bounce', {
      providerEventId: String(data.email_id ?? ''),
      provider: 'resend',
      detail: String(data.bounce?.message ?? 'hard bounce'),
    });
    processed++;
  } else if (eventType === 'email.complained') {
    await addEmailSuppression(email, 'complaint', {
      providerEventId: String(data.email_id ?? ''),
      provider: 'resend',
      detail: 'spam complaint',
    });
    processed++;
  }

  logger.info({ processed, eventType }, '[email-webhook/resend] Processed event');
  return res.status(200).json({ ok: true, processed });
});

router.get('/notifications/unsubscribe', async (req: Request, res: Response) => {
  const email = String(req.query.e ?? '');
  const token = String(req.query.t ?? '');

  if (!email || !token) {
    return res.status(400).send('Invalid unsubscribe link.');
  }

  const valid = verifyUnsubscribeToken(email, token);
  if (!valid) {
    logger.warn({ email }, '[notif-unsubscribe] Invalid token');
    return res.status(400).send('Invalid or expired unsubscribe link.');
  }

  try {
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (user) {
      await db
        .insert(notificationPreferencesTable)
        .values({ userId: user.id, emailEnabled: false })
        .onConflictDoUpdate({
          target: notificationPreferencesTable.userId,
          set: { emailEnabled: false, updatedAt: new Date() },
        });
      logger.info({ email, userId: user.id }, '[notif-unsubscribe] email_enabled set to false');
    } else {
      logger.warn({ email }, '[notif-unsubscribe] No user found for email, skipping preference update');
    }
  } catch (err) {
    logger.error({ email, err }, '[notif-unsubscribe] Failed to update notification preferences');
    return res.status(500).send('Something went wrong. Please try again or contact us at inquiries@szlholdings.com.');
  }

  const resubscribeUrl = `${process.env.APP_URL || 'https://szlholdings.com'}/api/notifications/resubscribe?e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`;
  const settingsUrl = `${process.env.APP_URL || 'https://szlholdings.com'}/settings?tab=account`;

  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Unsubscribed from Notifications</title>
    <style>body{font-family:-apple-system,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#374151;}h1{font-size:20px;}p{color:#6b7280;line-height:1.6;}a.undo{display:inline-block;margin-top:8px;padding:8px 20px;background:#c9a84c;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;font-size:14px;}a.undo:hover{background:#b8963f;}</style>
    </head>
    <body>
      <h1>You've been unsubscribed from notification emails.</h1>
      <p>Your preference has been saved — <strong>${email}</strong> will no longer receive notification emails from SZL Holdings.</p>
      <p>Changed your mind? <a class="undo" href="${resubscribeUrl}">Undo — re-subscribe</a></p>
      <p>You can also manage your preferences from your <a href="${settingsUrl}">notification settings</a>.</p>
    </body>
    </html>
  `);
});

router.get('/notifications/resubscribe', async (req: Request, res: Response) => {
  const email = String(req.query.e ?? '');
  const token = String(req.query.t ?? '');

  if (!email || !token) {
    return res.status(400).send('Invalid re-subscribe link.');
  }

  const valid = verifyUnsubscribeToken(email, token);
  if (!valid) {
    logger.warn({ email }, '[notif-resubscribe] Invalid token');
    return res.status(400).send('Invalid or expired re-subscribe link.');
  }

  try {
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (user) {
      await db
        .insert(notificationPreferencesTable)
        .values({ userId: user.id, emailEnabled: true })
        .onConflictDoUpdate({
          target: notificationPreferencesTable.userId,
          set: { emailEnabled: true, updatedAt: new Date() },
        });
      logger.info({ email, userId: user.id }, '[notif-resubscribe] email_enabled set to true');
    } else {
      logger.warn({ email }, '[notif-resubscribe] No user found for email, skipping preference update');
    }
  } catch (err) {
    logger.error({ email, err }, '[notif-resubscribe] Failed to update notification preferences');
    return res.status(500).send('Something went wrong. Please try again or contact us at inquiries@szlholdings.com.');
  }

  const settingsUrl = `${process.env.APP_URL || 'https://szlholdings.com'}/settings?tab=account`;

  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Re-subscribed to Notifications</title>
    <style>body{font-family:-apple-system,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#374151;}h1{font-size:20px;}p{color:#6b7280;line-height:1.6;}</style>
    </head>
    <body>
      <h1>You're re-subscribed to notification emails.</h1>
      <p><strong>${email}</strong> will resume receiving notification emails from SZL Holdings.</p>
      <p>You can manage your email preferences at any time from your <a href="${settingsUrl}">notification settings</a>.</p>
    </body>
    </html>
  `);
});

router.get('/email/unsubscribe', async (req: Request, res: Response) => {
  const email = String(req.query.e ?? '');
  const token = String(req.query.t ?? '');

  if (!email || !token) {
    return res.status(400).send('Invalid unsubscribe link.');
  }

  const valid = verifyUnsubscribeToken(email, token);
  if (!valid) {
    logger.warn({ email }, '[email-unsubscribe] Invalid token');
    return res.status(400).send('Invalid or expired unsubscribe link.');
  }

  await addEmailSuppression(email, 'unsubscribe', { provider: 'self-service' });
  logger.info({ email }, '[email-unsubscribe] Address unsubscribed');

  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Unsubscribed</title>
    <style>body{font-family:-apple-system,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#374151;}h1{font-size:20px;}p{color:#6b7280;line-height:1.6;}</style>
    </head>
    <body>
      <h1>You've been unsubscribed.</h1>
      <p>Your email address <strong>${email}</strong> has been removed from our mailing list. You will no longer receive transactional emails from SZL Holdings.</p>
      <p>If this was a mistake, contact us at <a href="mailto:inquiries@szlholdings.com">inquiries@szlholdings.com</a>.</p>
    </body>
    </html>
  `);
});

export default router;
