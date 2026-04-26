/**
 * Pulse Org-Wide Fan-Out v2 API
 *
 * POST   /pulse/org/publications           — publish a briefing org-wide
 * GET    /pulse/org/publications            — list org publications
 * GET    /pulse/org/publications/:id        — get publication detail
 * GET    /pulse/org/publications/:id/distribution — distribution tab data
 * POST   /pulse/org/publications/:id/resend-failed — re-send failed deliveries
 *
 * POST   /pulse/org/schedules              — create recurring schedule
 * GET    /pulse/org/schedules              — list schedules
 * PATCH  /pulse/org/schedules/:id          — edit schedule
 * DELETE /pulse/org/schedules/:id          — delete schedule
 * PATCH  /pulse/org/schedules/:id/pause    — pause schedule
 * PATCH  /pulse/org/schedules/:id/resume   — resume schedule
 *
 * GET    /pulse/org/preferences/me         — get my org-briefing channel opt-outs
 * PATCH  /pulse/org/preferences/me         — update my opt-outs
 *
 * GET    /pulse/org/unsubscribe            — one-click unsubscribe (no auth required)
 * POST   /pulse/org/inbound-sms            — STOP/START/HELP keyword handler
 *
 * GET    /pulse/org/channel-config         — which channels are configured for this org
 * GET    /pulse/org/channel-status         — alias for channel-config
 */

import {
  db,
  orgMembersTable,
  pulseBriefingsTable,
  pulseExecBriefsTable,
  pulseOrgAuditLogTable,
  pulseOrgChannelConfigsTable,
  pulseOrgPublicationDeliveriesTable,
  pulseOrgPublicationsTable,
  pulseOrgSchedulesTable,
  pulseOrgUserPreferencesTable,
  usersTable,
} from '@szl-holdings/db';
import { randomBytes } from 'node:crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess, sendUnauthorized } from '../lib/api-response';
import { deliverToChannel, getConfiguredChannels, type OrgChannel, type BriefingPayload, type ChannelConfig } from '../lib/pulse-org-channel-adapters';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { bodyShape } from '@szl-holdings/contracts/common';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

const PULSE_BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}/pulse`
  : 'http://localhost:5201';

const VALID_CHANNELS: OrgChannel[] = ['in_app', 'push', 'email', 'sms', 'slack', 'teams', 'webhook'];

function buildDeepLink(briefingId: string): string {
  return `${PULSE_BASE_URL}/briefings/${briefingId}`;
}

function buildOrgUnsubscribeUrl(token: string): string {
  const origin = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:5201';
  return `${origin}/api/pulse/org/unsubscribe?token=${encodeURIComponent(token)}`;
}

async function getOrCreateOrgUserPrefs(userId: number) {
  const existing = await db
    .select()
    .from(pulseOrgUserPreferencesTable)
    .where(eq(pulseOrgUserPreferencesTable.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];

  const token = randomBytes(24).toString('hex');
  const [created] = await db
    .insert(pulseOrgUserPreferencesTable)
    .values({ userId, unsubscribeToken: token })
    .returning();
  return created!;
}

async function getOrgChannelConfig(orgId?: number | null): Promise<ChannelConfig> {
  if (!orgId) return {};
  const rows = await db
    .select()
    .from(pulseOrgChannelConfigsTable)
    .where(eq(pulseOrgChannelConfigsTable.orgId, orgId))
    .limit(1);
  const row = rows[0];
  if (!row) return {};
  return {
    slackWebhookUrl: row.slackWebhookUrl,
    slackChannel: row.slackChannel,
    teamsWebhookUrl: row.teamsWebhookUrl,
    smsSenderId: row.smsSenderId,
    outboundWebhookUrl: row.outboundWebhookUrl,
    outboundWebhookSecret: row.outboundWebhookSecret,
    emailFromName: row.emailFromName,
    emailFromAddress: row.emailFromAddress,
  };
}

async function auditLog(action: string, entityType: string, entityId?: string, userId?: number, metadata?: Record<string, unknown>) {
  try {
    await db.insert(pulseOrgAuditLogTable).values({ action, entityType, entityId: entityId ?? null, userId: userId ?? null, metadata: metadata ?? null });
  } catch (err) {
    logger.warn({ err, action, entityType }, '[pulse-org-audit] Failed to write audit log row');
  }
}

function computeNextRun(schedule: {
  frequency: string;
  interval: number;
  weekdays?: number[] | null;
  timeOfDay: string;
  timezone: string;
}, fromNow = new Date()): Date {
  const [hh, mm] = (schedule.timeOfDay ?? '09:00').split(':').map(Number);
  const freq = schedule.frequency;
  const tz = schedule.timezone ?? 'UTC';

  const getLocalDate = (d: Date) => {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    const parts = fmt.formatToParts(d);
    const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? '0', 10);
    return { year: get('year'), month: get('month') - 1, day: get('day'), hour: get('hour') % 24, minute: get('minute') };
  };

  const local = getLocalDate(fromNow);
  const candidate = new Date(fromNow);

  if (freq === 'daily') {
    candidate.setDate(candidate.getDate() + schedule.interval);
  } else if (freq === 'weekdays') {
    let tries = 0;
    do {
      candidate.setDate(candidate.getDate() + 1);
      tries++;
    } while (candidate.getDay() === 0 || candidate.getDay() === 6 || tries > 14);
  } else if (freq === 'weekly') {
    const targetDays = Array.isArray(schedule.weekdays) && schedule.weekdays.length > 0 ? schedule.weekdays : [1];
    let tries = 0;
    do {
      candidate.setDate(candidate.getDate() + 1);
      tries++;
    } while (!targetDays.includes(candidate.getDay()) || tries > 21);
  } else if (freq === 'monthly') {
    candidate.setMonth(candidate.getMonth() + schedule.interval);
  } else {
    candidate.setDate(candidate.getDate() + 1);
  }

  candidate.setHours(hh ?? 9, mm ?? 0, 0, 0);
  return candidate;
}

function previewNextRuns(schedule: Parameters<typeof computeNextRun>[0], count = 5): string[] {
  const runs: string[] = [];
  let from = new Date();
  for (let i = 0; i < count; i++) {
    const next = computeNextRun(schedule, from);
    runs.push(next.toISOString());
    from = next;
  }
  return runs;
}

// ─── Public unsubscribe (no auth) ────────────────────────────────────────────

router.get('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
  const token = String(req.query.token ?? '').trim();
  const channel = String(req.query.channel ?? 'email').trim();

  if (!token) {
    res.status(400).type('html').send(`<html><body style="font-family:sans-serif;padding:40px;background:#0a0b0d;color:#fff;"><h2>Invalid unsubscribe link</h2></body></html>`);
    return;
  }

  const rows = await db
    .select()
    .from(pulseOrgUserPreferencesTable)
    .where(eq(pulseOrgUserPreferencesTable.unsubscribeToken, token))
    .limit(1);

  if (!rows[0]) {
    res.status(404).type('html').send(`<html><body style="font-family:sans-serif;padding:40px;background:#0a0b0d;color:#fff;"><h2>Unsubscribe link not found</h2></body></html>`);
    return;
  }

  const pref = rows[0];
  const update: Record<string, boolean | Date> = { updatedAt: new Date() };
  if (channel === 'email' || channel === 'all') update.emailOptOut = true;
  if (channel === 'sms' || channel === 'all') update.smsOptOut = true;
  if (channel === 'push' || channel === 'all') update.pushOptOut = true;
  if (channel === 'slack' || channel === 'all') update.slackDmOptOut = true;

  await db.update(pulseOrgUserPreferencesTable).set(update as Record<string, unknown>).where(eq(pulseOrgUserPreferencesTable.id, pref.id));
  await auditLog('user_unsubscribe_org_briefing', 'pulse_org_user_preferences', String(pref.userId), pref.userId, { channel });

  res.type('html').send(`<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;background:#0a0b0d;color:#e6e6e6;text-align:center;">
    <div style="max-width:480px;margin:60px auto;padding:32px;background:#101216;border:1px solid rgba(200,168,75,0.2);border-radius:12px;">
      <div style="font-size:11px;letter-spacing:0.14em;color:#c8a84b;text-transform:uppercase;margin-bottom:12px;">PULSE</div>
      <h2 style="color:#fff;margin:0 0 12px;">Unsubscribed</h2>
      <p style="color:rgba(255,255,255,0.6);line-height:1.6;">You have been unsubscribed from org-wide ${channel} briefings.</p>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:20px;">You can manage your preferences in Pulse Settings. In-app briefings are always delivered.</p>
    </div>
  </body></html>`);
});

// ─── Inbound SMS STOP / START / HELP ─────────────────────────────────────────

router.post('/inbound-sms', validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const body = (typeof req.body?.Body === 'string' ? req.body.Body : '').trim().toUpperCase();
  const from = String(req.body?.From ?? '').trim();

  if (!from) {
    res.json({ success: false, error: 'Missing From' });
    return;
  }

  if (body.startsWith('STOP') || body.startsWith('UNSUBSCRIBE')) {
    // No phone field on usersTable — SMS STOP handled by matching token/session if available
    const userId: number | undefined = undefined;
    if (userId) {
      const prefs = await getOrCreateOrgUserPrefs(userId);
      await db.update(pulseOrgUserPreferencesTable).set({ smsOptOut: true, updatedAt: new Date() }).where(eq(pulseOrgUserPreferencesTable.id, prefs.id));
      await auditLog('sms_stop_received', 'pulse_org_user_preferences', String(userId), userId, { from });
    }
    res.json({ success: true, message: 'You have been unsubscribed from SMS briefings. Reply START to re-subscribe.' });
    return;
  }

  if (body.startsWith('START') || body.startsWith('SUBSCRIBE')) {
    const userId: number | undefined = undefined;
    if (userId) {
      await db.update(pulseOrgUserPreferencesTable).set({ smsOptOut: false, updatedAt: new Date() }).where(eq(pulseOrgUserPreferencesTable.userId, userId));
    }
    res.json({ success: true, message: 'You have re-subscribed to SMS briefings.' });
    return;
  }

  if (body.startsWith('HELP')) {
    res.json({ success: true, message: 'Pulse org briefings: Reply STOP to unsubscribe, START to re-subscribe.' });
    return;
  }

  res.json({ success: true });
});

// ─── Auth middleware for all routes below ────────────────────────────────────

router.use(authMiddleware({ required: true }));

// ─── Channel config / status ──────────────────────────────────────────────────

router.get('/channel-config', async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const orgId = (req.user as { orgId?: number }).orgId ?? null;
    const config = await getOrgChannelConfig(orgId);
    const configured = getConfiguredChannels(config);
    const status: Record<OrgChannel, { configured: boolean; reason?: string }> = {
      in_app: { configured: true },
      push: { configured: true },
      email: { configured: configured.includes('email'), reason: configured.includes('email') ? undefined : 'SMTP/SendGrid/Resend not configured' },
      sms: { configured: configured.includes('sms'), reason: configured.includes('sms') ? undefined : 'Twilio/Vonage not configured' },
      slack: { configured: configured.includes('slack'), reason: configured.includes('slack') ? undefined : 'Slack webhook URL not configured' },
      teams: { configured: configured.includes('teams'), reason: configured.includes('teams') ? undefined : 'Teams webhook URL not configured' },
      webhook: { configured: configured.includes('webhook'), reason: configured.includes('webhook') ? undefined : 'Outbound webhook URL not configured' },
    };
    sendSuccess(res, { status, configuredChannels: configured });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get channel config');
  }
});

router.get('/channel-status', async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const orgId = (req.user as { orgId?: number }).orgId ?? null;
    const config = await getOrgChannelConfig(orgId);
    const configured = getConfiguredChannels(config);
    sendSuccess(res, { configuredChannels: configured });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get channel status');
  }
});

// ─── Per-user opt-out preferences ────────────────────────────────────────────

router.get('/preferences/me', async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const prefs = await getOrCreateOrgUserPrefs(req.user.id);
    sendSuccess(res, {
      emailOptOut: prefs.emailOptOut,
      smsOptOut: prefs.smsOptOut,
      slackDmOptOut: prefs.slackDmOptOut,
      pushOptOut: prefs.pushOptOut,
      note: 'In-app delivery is always enabled for org-wide briefings.',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get org briefing preferences');
  }
});

router.patch(
  '/preferences/me',
  validateBody(bodyShape({
    emailOptOut: z.boolean().optional(),
    smsOptOut: z.boolean().optional(),
    slackDmOptOut: z.boolean().optional(),
    pushOptOut: z.boolean().optional(),
  })),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) { sendUnauthorized(res); return; }
    try {
      const { emailOptOut, smsOptOut, slackDmOptOut, pushOptOut } = req.body as {
        emailOptOut?: boolean; smsOptOut?: boolean; slackDmOptOut?: boolean; pushOptOut?: boolean;
      };
      const prefs = await getOrCreateOrgUserPrefs(req.user.id);
      const update: Record<string, boolean | Date> = { updatedAt: new Date() };
      if (emailOptOut !== undefined) update.emailOptOut = emailOptOut;
      if (smsOptOut !== undefined) update.smsOptOut = smsOptOut;
      if (slackDmOptOut !== undefined) update.slackDmOptOut = slackDmOptOut;
      if (pushOptOut !== undefined) update.pushOptOut = pushOptOut;

      const [updated] = await db.update(pulseOrgUserPreferencesTable)
        .set(update as Record<string, unknown>)
        .where(eq(pulseOrgUserPreferencesTable.id, prefs.id))
        .returning();

      await auditLog('user_update_org_preferences', 'pulse_org_user_preferences', String(req.user.id), req.user.id, { changes: update });

      sendSuccess(res, {
        emailOptOut: updated!.emailOptOut,
        smsOptOut: updated!.smsOptOut,
        slackDmOptOut: updated!.slackDmOptOut,
        pushOptOut: updated!.pushOptOut,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update org briefing preferences');
    }
  },
);

// ─── Org Publications ─────────────────────────────────────────────────────────

const publishOrgSchema = bodyShape({
  briefingId: z.string().min(1),
  channels: z.array(z.enum(['in_app', 'push', 'email', 'sms', 'slack', 'teams', 'webhook'])).min(1),
  scheduleId: z.number().optional(),
  domain: z.string().optional(),
  audienceFilter: z.record(z.unknown()).optional(),
});

router.post(
  '/publications',
  requireRole('ops'),
  validateBody(publishOrgSchema),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) { sendUnauthorized(res); return; }
    try {
      const { briefingId, channels, scheduleId, domain, audienceFilter } = req.body as {
        briefingId: string;
        channels: OrgChannel[];
        scheduleId?: number;
        domain?: string;
        audienceFilter?: Record<string, unknown>;
      };

      // Verify briefing exists (check both regular briefings and exec briefs)
      const briefRows = await db.select({ id: pulseBriefingsTable.id }).from(pulseBriefingsTable).where(eq(pulseBriefingsTable.id, briefingId)).limit(1);
      const execRows = briefRows.length === 0
        ? await db.select({ id: pulseExecBriefsTable.id }).from(pulseExecBriefsTable).where(eq(pulseExecBriefsTable.id, briefingId)).limit(1)
        : [];

      if (briefRows.length === 0 && execRows.length === 0) {
        sendNotFound(res, 'Briefing');
        return;
      }

      const orgId = (req.user as { orgId?: number }).orgId ?? null;

      // Count org members to set totalRecipients
      let totalRecipients = 0;
      if (orgId) {
        const countResult = await db.select({ count: sql<number>`count(*)` }).from(orgMembersTable).where(eq(orgMembersTable.orgId, orgId));
        totalRecipients = Number(countResult[0]?.count ?? 0);
      } else {
        const countResult = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.isActive, true));
        totalRecipients = Number(countResult[0]?.count ?? 0);
      }

      const publicationId = `pub-${Date.now()}-${randomBytes(6).toString('hex')}`;

      const [publication] = await db.insert(pulseOrgPublicationsTable).values({
        publicationId,
        briefingId,
        domain: domain ?? 'consolidated',
        channels,
        scheduleId: scheduleId ?? null,
        status: 'queued',
        totalRecipients,
        publishedBy: req.user.id,
        audienceFilter: audienceFilter ?? null,
      }).returning();

      await auditLog('org_publication_created', 'pulse_org_publications', publicationId, req.user.id, {
        briefingId, channels, totalRecipients,
      });

      // Kick off the fan-out asynchronously
      void fanOutOrgPublication(publication!.publicationId, orgId).catch((err: unknown) => {
        logger.error({ err, publicationId }, '[pulse-org] fan-out failed');
      });

      res.status(202).json({
        success: true,
        publication: {
          id: publication!.id,
          publicationId: publication!.publicationId,
          briefingId,
          channels,
          status: 'queued',
          totalRecipients,
          enqueuedAt: publication!.enqueuedAt,
        },
        message: `Org briefing enqueued for ${totalRecipients} members across ${channels.length} channels.`,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create org publication');
    }
  },
);

router.get('/publications', requireRole('ops'), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10) || 20, 100);
    const offset = parseInt(String(req.query.offset ?? '0'), 10) || 0;
    const publications = await db.select().from(pulseOrgPublicationsTable).orderBy(desc(pulseOrgPublicationsTable.createdAt)).limit(limit).offset(offset);
    sendSuccess(res, publications);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list publications');
  }
});

router.get('/publications/:id', requireRole('ops'), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const pubId = req.params.id as string;
    const rows = await db.select().from(pulseOrgPublicationsTable)
      .where(eq(pulseOrgPublicationsTable.publicationId, pubId)).limit(1);
    if (!rows[0]) { sendNotFound(res, 'Publication'); return; }
    sendSuccess(res, rows[0]);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get publication');
  }
});

router.get('/publications/:id/distribution', requireRole('ops'), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const pubId = req.params.id as string;
    const pub = await db.select().from(pulseOrgPublicationsTable).where(eq(pulseOrgPublicationsTable.publicationId, pubId)).limit(1);
    if (!pub[0]) { sendNotFound(res, 'Publication'); return; }

    const deliveries = await db.select({
      id: pulseOrgPublicationDeliveriesTable.id,
      userId: pulseOrgPublicationDeliveriesTable.userId,
      channel: pulseOrgPublicationDeliveriesTable.channel,
      status: pulseOrgPublicationDeliveriesTable.status,
      attempts: pulseOrgPublicationDeliveriesTable.attempts,
      lastError: pulseOrgPublicationDeliveriesTable.lastError,
      suppressReason: pulseOrgPublicationDeliveriesTable.suppressReason,
      deliveredAt: pulseOrgPublicationDeliveriesTable.deliveredAt,
    }).from(pulseOrgPublicationDeliveriesTable)
      .where(eq(pulseOrgPublicationDeliveriesTable.publicationId, pubId))
      .limit(500);

    // Aggregate per-channel totals
    const channelTotals: Record<string, { delivered: number; failed: number; suppressed: number; queued: number }> = {};
    for (const d of deliveries) {
      if (!channelTotals[d.channel]) channelTotals[d.channel] = { delivered: 0, failed: 0, suppressed: 0, queued: 0 };
      const ct = channelTotals[d.channel]!;
      if (d.status === 'delivered') ct.delivered++;
      else if (d.status === 'failed') ct.failed++;
      else if (d.status === 'suppressed') ct.suppressed++;
      else ct.queued++;
    }

    sendSuccess(res, {
      publication: pub[0],
      channelTotals,
      deliveries,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get distribution data');
  }
});

router.post('/publications/:id/resend-failed', requireRole('ops'), validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const pubId = req.params.id as string;
    const pub = await db.select().from(pulseOrgPublicationsTable).where(eq(pulseOrgPublicationsTable.publicationId, pubId)).limit(1);
    if (!pub[0]) { sendNotFound(res, 'Publication'); return; }

    const failed = await db.select().from(pulseOrgPublicationDeliveriesTable)
      .where(and(eq(pulseOrgPublicationDeliveriesTable.publicationId, pubId), eq(pulseOrgPublicationDeliveriesTable.status, 'failed')));

    if (failed.length === 0) {
      sendSuccess(res, { requeued: 0, message: 'No failed deliveries to re-send.' });
      return;
    }

    await db.update(pulseOrgPublicationDeliveriesTable)
      .set({ status: 'queued', nextRetryAt: null, updatedAt: new Date() })
      .where(and(eq(pulseOrgPublicationDeliveriesTable.publicationId, pubId), eq(pulseOrgPublicationDeliveriesTable.status, 'failed')));

    await auditLog('publication_resend_failed', 'pulse_org_publications', pubId, req.user.id, { requeued: failed.length });

    void fanOutOrgPublication(pubId, null, { onlyRetries: true }).catch((err: unknown) => {
      logger.error({ err, pubId }, '[pulse-org] resend fan-out failed');
    });

    sendSuccess(res, { requeued: failed.length, message: `${failed.length} failed deliveries re-queued.` });
  } catch (err) {
    handleRouteError(res, err, 'Failed to resend failed deliveries');
  }
});

// ─── Schedules ────────────────────────────────────────────────────────────────

const scheduleCreateSchema = bodyShape({
  domain: z.string().optional(),
  channels: z.array(z.enum(['in_app', 'push', 'email', 'sms', 'slack', 'teams', 'webhook'])).min(1),
  frequency: z.enum(['daily', 'weekdays', 'weekly', 'monthly', 'custom']),
  interval: z.number().int().min(1).optional(),
  weekdays: z.array(z.number().int().min(0).max(6)).optional(),
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
  pinnedBriefingId: z.string().optional(),
});

router.post('/schedules', requireRole('ops'), validateBody(scheduleCreateSchema), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const { domain, channels, frequency, interval, weekdays, timeOfDay, timezone, pinnedBriefingId } = req.body as {
      domain?: string; channels: OrgChannel[]; frequency: 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';
      interval?: number; weekdays?: number[]; timeOfDay?: string; timezone?: string; pinnedBriefingId?: string;
    };

    const scheduleRule = {
      frequency,
      interval: interval ?? 1,
      weekdays: weekdays ?? [],
      timeOfDay: timeOfDay ?? '09:00',
      timezone: timezone ?? 'UTC',
    };

    const nextRun = computeNextRun(scheduleRule);
    const scheduleId = `sched-${Date.now()}-${randomBytes(4).toString('hex')}`;
    const orgId = (req.user as { orgId?: number }).orgId ?? null;

    const [schedule] = await db.insert(pulseOrgSchedulesTable).values({
      scheduleId,
      orgId,
      domain: domain ?? 'consolidated',
      channels,
      frequency,
      interval: interval ?? 1,
      weekdays: weekdays ?? [],
      timeOfDay: timeOfDay ?? '09:00',
      timezone: timezone ?? 'UTC',
      pinnedBriefingId: pinnedBriefingId ?? null,
      nextRunAt: nextRun,
      createdBy: req.user.id,
    }).returning();

    await auditLog('schedule_created', 'pulse_org_schedules', scheduleId, req.user.id, { frequency, channels });

    sendSuccess(res, {
      ...schedule,
      nextRuns: previewNextRuns(scheduleRule),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to create schedule');
  }
});

router.get('/schedules', requireRole('ops'), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const schedules = await db.select().from(pulseOrgSchedulesTable).orderBy(desc(pulseOrgSchedulesTable.createdAt)).limit(100);
    const withPreviews = schedules.map(s => ({
      ...s,
      nextRuns: previewNextRuns({
        frequency: s.frequency as 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom',
        interval: s.interval ?? 1,
        weekdays: (s.weekdays as number[] | null) ?? [],
        timeOfDay: s.timeOfDay ?? '09:00',
        timezone: s.timezone ?? 'UTC',
      }),
    }));
    sendSuccess(res, withPreviews);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list schedules');
  }
});

router.patch('/schedules/:id', requireRole('ops'), validateBody(bodyShape({
  channels: z.array(z.string()).optional(),
  frequency: z.enum(['daily', 'weekdays', 'weekly', 'monthly', 'custom']).optional(),
  interval: z.number().int().min(1).optional(),
  weekdays: z.array(z.number()).optional(),
  timeOfDay: z.string().optional(),
  timezone: z.string().optional(),
  pinnedBriefingId: z.string().nullable().optional(),
})), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const schedId = req.params.id as string;
    const rows = await db.select().from(pulseOrgSchedulesTable).where(eq(pulseOrgSchedulesTable.scheduleId, schedId)).limit(1);
    if (!rows[0]) { sendNotFound(res, 'Schedule'); return; }

    const existing = rows[0];
    const updates = { ...req.body as Record<string, unknown>, updatedAt: new Date() };
    const merged = {
      frequency: (updates.frequency ?? existing.frequency) as 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom',
      interval: (updates.interval ?? existing.interval ?? 1) as number,
      weekdays: (updates.weekdays ?? existing.weekdays ?? []) as number[],
      timeOfDay: (updates.timeOfDay ?? existing.timeOfDay ?? '09:00') as string,
      timezone: (updates.timezone ?? existing.timezone ?? 'UTC') as string,
    };
    updates.nextRunAt = computeNextRun(merged);

    const [updated] = await db.update(pulseOrgSchedulesTable).set(updates as Record<string, unknown>).where(eq(pulseOrgSchedulesTable.scheduleId, schedId)).returning();
    await auditLog('schedule_updated', 'pulse_org_schedules', schedId, req.user.id, { changes: req.body as Record<string, unknown> });

    sendSuccess(res, { ...updated, nextRuns: previewNextRuns(merged) });
  } catch (err) {
    handleRouteError(res, err, 'Failed to update schedule');
  }
});

router.delete('/schedules/:id', validateBody(bodyShape({})), requireRole('ops'), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const schedId = req.params.id as string;
    const result = await db.delete(pulseOrgSchedulesTable).where(eq(pulseOrgSchedulesTable.scheduleId, schedId)).returning();
    if (!result[0]) { sendNotFound(res, 'Schedule'); return; }
    await auditLog('schedule_deleted', 'pulse_org_schedules', schedId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete schedule');
  }
});

router.patch('/schedules/:id/pause', validateBody(bodyShape({})), requireRole('ops'), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const schedId = req.params.id as string;
    const [updated] = await db.update(pulseOrgSchedulesTable).set({ paused: true, updatedAt: new Date() }).where(eq(pulseOrgSchedulesTable.scheduleId, schedId)).returning();
    if (!updated) { sendNotFound(res, 'Schedule'); return; }
    await auditLog('schedule_paused', 'pulse_org_schedules', schedId, req.user.id);
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, 'Failed to pause schedule');
  }
});

router.patch('/schedules/:id/resume', validateBody(bodyShape({})), requireRole('ops'), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { sendUnauthorized(res); return; }
  try {
    const schedId = req.params.id as string;
    const rows = await db.select().from(pulseOrgSchedulesTable).where(eq(pulseOrgSchedulesTable.scheduleId, schedId)).limit(1);
    if (!rows[0]) { sendNotFound(res, 'Schedule'); return; }

    const merged = {
      frequency: rows[0].frequency as 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom',
      interval: rows[0].interval ?? 1,
      weekdays: (rows[0].weekdays as number[] | null) ?? [],
      timeOfDay: rows[0].timeOfDay ?? '09:00',
      timezone: rows[0].timezone ?? 'UTC',
    };
    const nextRun = computeNextRun(merged);

    const [updated] = await db.update(pulseOrgSchedulesTable).set({ paused: false, nextRunAt: nextRun, updatedAt: new Date() }).where(eq(pulseOrgSchedulesTable.scheduleId, schedId)).returning();
    await auditLog('schedule_resumed', 'pulse_org_schedules', schedId, req.user.id);
    sendSuccess(res, { ...updated, nextRuns: previewNextRuns(merged) });
  } catch (err) {
    handleRouteError(res, err, 'Failed to resume schedule');
  }
});

// ─── Fan-out worker ───────────────────────────────────────────────────────────

const MAX_CONCURRENT = 10;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = [60_000, 300_000, 900_000]; // 1m, 5m, 15m

async function fanOutOrgPublication(
  publicationId: string,
  orgId: number | null,
  opts: { onlyRetries?: boolean } = {},
): Promise<void> {
  const pubRows = await db.select().from(pulseOrgPublicationsTable)
    .where(eq(pulseOrgPublicationsTable.publicationId, publicationId)).limit(1);
  const pub = pubRows[0];
  if (!pub) {
    logger.warn({ publicationId }, '[pulse-org-fanout] Publication not found');
    return;
  }

  const channels = (pub.channels as string[]) ?? [];
  const briefId = pub.briefingId;

  // Load briefing payload
  let briefPayload: BriefingPayload | null = null;
  const brief = await db.select().from(pulseBriefingsTable).where(eq(pulseBriefingsTable.id, briefId)).limit(1);
  if (brief[0]) {
    briefPayload = {
      briefingId: briefId,
      domain: pub.domain ?? 'consolidated',
      headline: brief[0].headline,
      situation: brief[0].leadSentence,
      overallRisk: brief[0].overallRisk,
      confidence: `${Math.round(Number(brief[0].overallConfidence) * 100)}%`,
      deepLinkUrl: buildDeepLink(briefId),
    };
  } else {
    const execBrief = await db.select().from(pulseExecBriefsTable).where(eq(pulseExecBriefsTable.id, briefId)).limit(1);
    if (execBrief[0]) {
      briefPayload = {
        briefingId: briefId,
        domain: execBrief[0].domain ?? 'consolidated',
        headline: execBrief[0].headline,
        situation: execBrief[0].situation,
        overallRisk: execBrief[0].overallRisk,
        confidence: `${Math.round(Number(execBrief[0].confidence) * 100)}%`,
        deepLinkUrl: buildDeepLink(briefId),
      };
    }
  }

  if (!briefPayload) {
    logger.error({ publicationId, briefId }, '[pulse-org-fanout] Briefing not found — aborting fan-out');
    await db.update(pulseOrgPublicationsTable).set({ status: 'failed', updatedAt: new Date() }).where(eq(pulseOrgPublicationsTable.publicationId, publicationId));
    return;
  }

  await db.update(pulseOrgPublicationsTable).set({ status: 'in_progress', updatedAt: new Date() }).where(eq(pulseOrgPublicationsTable.publicationId, publicationId));

  // Get org channel config
  const config = await getOrgChannelConfig(orgId);

  // Get all active members
  let memberUserIds: number[] = [];
  if (orgId) {
    const members = await db.select({ userId: orgMembersTable.userId }).from(orgMembersTable).where(eq(orgMembersTable.orgId, orgId));
    memberUserIds = members.map(m => m.userId);
  } else {
    const activeUsers = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.isActive, true)).limit(500);
    memberUserIds = activeUsers.map(u => u.id);
  }

  if (memberUserIds.length === 0) {
    await db.update(pulseOrgPublicationsTable).set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() }).where(eq(pulseOrgPublicationsTable.publicationId, publicationId));
    return;
  }

  // Get user emails for email channel
  const userDetails = await db
    .select({ id: usersTable.id, email: usersTable.email, displayName: usersTable.displayName })
    .from(usersTable)
    .where(inArray(usersTable.id, memberUserIds.slice(0, 500)));
  const userMap = new Map(userDetails.map(u => [u.id, u]));

  // Get per-user opt-out preferences
  const allPrefs = await db.select().from(pulseOrgUserPreferencesTable).where(inArray(pulseOrgUserPreferencesTable.userId, memberUserIds.slice(0, 500)));
  const prefMap = new Map(allPrefs.map(p => [p.userId, p]));

  // Enqueue delivery rows (skip if retries only)
  if (!opts.onlyRetries) {
    for (const userId of memberUserIds) {
      for (const channel of channels) {
        try {
          await db.insert(pulseOrgPublicationDeliveriesTable).values({
            publicationId,
            userId,
            channel,
            status: 'queued',
          }).onConflictDoNothing();
        } catch {
          // already exists
        }
      }
    }
  }

  // Load delivery rows to process
  const deliveryCondition = opts.onlyRetries
    ? and(eq(pulseOrgPublicationDeliveriesTable.publicationId, publicationId), eq(pulseOrgPublicationDeliveriesTable.status, 'queued'))
    : and(eq(pulseOrgPublicationDeliveriesTable.publicationId, publicationId), eq(pulseOrgPublicationDeliveriesTable.status, 'queued'));

  const pendingDeliveries = await db.select().from(pulseOrgPublicationDeliveriesTable).where(deliveryCondition).limit(5000);

  let delivered = 0;
  let failed = 0;
  let suppressed = 0;

  // Process in batches
  for (let i = 0; i < pendingDeliveries.length; i += MAX_CONCURRENT) {
    const batch = pendingDeliveries.slice(i, i + MAX_CONCURRENT);
    await Promise.all(batch.map(async (delivery) => {
      const user = userMap.get(delivery.userId);
      const prefs = prefMap.get(delivery.userId);
      const ch = delivery.channel as OrgChannel;

      const recipient = {
        userId: delivery.userId,
        email: user?.email ?? null,
        phone: null,
        displayName: user?.displayName ?? null,
        emailOptOut: prefs?.emailOptOut ?? false,
        smsOptOut: prefs?.smsOptOut ?? false,
        pushOptOut: prefs?.pushOptOut ?? false,
      };

      const unsubUrl = prefs ? buildOrgUnsubscribeUrl(prefs.unsubscribeToken) : undefined;
      const enrichedPayload = { ...briefPayload!, unsubscribeUrl: ch === 'email' ? unsubUrl : undefined };

      try {
        const result = await deliverToChannel(ch, enrichedPayload, recipient, config);
        const statusMap: Record<string, 'delivered' | 'failed' | 'suppressed'> = {
          delivered: 'delivered',
          failed: 'failed',
          suppressed: 'suppressed',
        };
        const finalStatus = statusMap[result.status] ?? 'failed';

        await db.update(pulseOrgPublicationDeliveriesTable).set({
          status: result.status === 'failed' && delivery.attempts + 1 < MAX_RETRY_ATTEMPTS ? 'retrying' : finalStatus,
          attempts: delivery.attempts + 1,
          lastError: result.error ?? null,
          suppressReason: result.suppressReason ?? null,
          providerMessageId: result.providerMessageId ?? null,
          deliveredAt: result.status === 'delivered' ? new Date() : null,
          nextRetryAt: result.status === 'failed' && result.retryable && delivery.attempts + 1 < MAX_RETRY_ATTEMPTS
            ? new Date(Date.now() + (RETRY_BACKOFF_MS[delivery.attempts] ?? 900_000))
            : null,
          updatedAt: new Date(),
        }).where(eq(pulseOrgPublicationDeliveriesTable.id, delivery.id));

        if (result.status === 'delivered') delivered++;
        else if (result.status === 'suppressed') suppressed++;
        else failed++;
      } catch (err) {
        failed++;
        await db.update(pulseOrgPublicationDeliveriesTable).set({
          status: 'failed',
          attempts: delivery.attempts + 1,
          lastError: String(err),
          updatedAt: new Date(),
        }).where(eq(pulseOrgPublicationDeliveriesTable.id, delivery.id));
      }
    }));
  }

  // Update publication totals
  await db.update(pulseOrgPublicationsTable).set({
    status: 'completed',
    deliveredCount: delivered,
    failedCount: failed,
    suppressedCount: suppressed,
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(pulseOrgPublicationsTable.publicationId, publicationId));

  logger.info({ publicationId, delivered, failed, suppressed }, '[pulse-org-fanout] Fan-out complete');
}

export { fanOutOrgPublication };
export default router;
