import { randomUUID } from 'node:crypto';
import { createHmac } from 'node:crypto';
import { eq, and, lte, inArray } from 'drizzle-orm';
import {
  db,
  outboundDeliveriesTable,
  outboundChannelConfigsTable,
  outboundAuditLogTable,
} from '@szl-holdings/db';
import { logger } from '../lib/logger';

export type OutboundChannel = 'webhook' | 'email' | 'sms' | 'slack' | 'teams' | 'discord' | 'siem' | 'custom';

export interface DeliveryRequest {
  channel: OutboundChannel;
  sourceDomain: string;
  sourceEvent: string;
  sourceSignalId?: string;
  recipient?: string;
  payload: Record<string, unknown>;
  channelConfig?: Record<string, unknown>;
  orgId?: string;
  createdBy?: string;
  maxAttempts?: number;
}

export interface DeliveryResult {
  deliveryId: string;
  status: 'delivered' | 'failed' | 'queued';
  providerMessageId?: string;
  error?: string;
  retryable?: boolean;
}

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^\[::1\]$/,
  /^\[fe80:/i,
  /^\[fc00:/i,
  /^\[fd/i,
  /^metadata\.google\.internal$/i,
];

function isBlockedUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname;
    return BLOCKED_HOST_PATTERNS.some((p) => p.test(hostname));
  } catch {
    return true;
  }
}

async function deliverWebhook(
  url: string,
  payload: Record<string, unknown>,
  secret?: string,
): Promise<DeliveryResult> {
  const deliveryId = randomUUID();

  if (isBlockedUrl(url)) {
    return { deliveryId, status: 'failed', error: 'Webhook URL targets a blocked private/internal network', retryable: false };
  }

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Outbound-Event': String(payload.event ?? 'outbound.delivery'),
    'X-Delivery-Id': deliveryId,
  };

  if (secret) {
    headers['X-Signature-SHA256'] = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  }

  const resp = await fetch(url, { method: 'POST', headers, body });
  if (!resp.ok) {
    const respBody = await resp.text().catch(() => '');
    return {
      deliveryId,
      status: 'failed',
      error: `Webhook returned ${resp.status}: ${respBody.slice(0, 200)}`,
      retryable: resp.status >= 500,
    };
  }
  return { deliveryId, status: 'delivered', providerMessageId: `webhook-${Date.now()}` };
}

async function deliverSlack(
  webhookUrl: string,
  payload: Record<string, unknown>,
): Promise<DeliveryResult> {
  const deliveryId = randomUUID();
  if (isBlockedUrl(webhookUrl)) {
    return { deliveryId, status: 'failed', error: 'Slack webhook URL targets a blocked private/internal network', retryable: false };
  }
  const block = {
    attachments: [
      {
        color: '#c8a84b',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: String(payload.title ?? 'Notification') },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: String(payload.message ?? payload.body ?? JSON.stringify(payload).slice(0, 500)),
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Source: *${payload.sourceDomain ?? 'platform'}* | Event: *${payload.sourceEvent ?? 'notification'}*`,
              },
            ],
          },
        ],
      },
    ],
  };

  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(block),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    return { deliveryId, status: 'failed', error: `Slack ${resp.status}: ${body}`, retryable: resp.status >= 500 };
  }
  return { deliveryId, status: 'delivered', providerMessageId: `slack-${Date.now()}` };
}

async function deliverTeams(
  webhookUrl: string,
  payload: Record<string, unknown>,
): Promise<DeliveryResult> {
  const deliveryId = randomUUID();
  if (isBlockedUrl(webhookUrl)) {
    return { deliveryId, status: 'failed', error: 'Teams webhook URL targets a blocked private/internal network', retryable: false };
  }
  const card = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            { type: 'TextBlock', text: String(payload.title ?? 'Notification'), weight: 'Bolder', size: 'Medium' },
            { type: 'TextBlock', text: String(payload.message ?? payload.body ?? ''), wrap: true, isSubtle: true },
            {
              type: 'FactSet',
              facts: [
                { title: 'Source', value: String(payload.sourceDomain ?? 'platform') },
                { title: 'Event', value: String(payload.sourceEvent ?? 'notification') },
              ],
            },
          ],
        },
      },
    ],
  };

  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    return { deliveryId, status: 'failed', error: `Teams ${resp.status}: ${body}`, retryable: resp.status >= 500 };
  }
  return { deliveryId, status: 'delivered', providerMessageId: `teams-${Date.now()}` };
}

async function deliverDiscord(
  webhookUrl: string,
  payload: Record<string, unknown>,
): Promise<DeliveryResult> {
  const deliveryId = randomUUID();
  if (isBlockedUrl(webhookUrl)) {
    return { deliveryId, status: 'failed', error: 'Discord webhook URL targets a blocked private/internal network', retryable: false };
  }
  const embed = {
    embeds: [
      {
        title: String(payload.title ?? 'Notification'),
        description: String(payload.message ?? payload.body ?? ''),
        color: 0xc8a84b,
        fields: [
          { name: 'Source', value: String(payload.sourceDomain ?? 'platform'), inline: true },
          { name: 'Event', value: String(payload.sourceEvent ?? 'notification'), inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(embed),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    return { deliveryId, status: 'failed', error: `Discord ${resp.status}: ${body}`, retryable: resp.status >= 500 };
  }
  return { deliveryId, status: 'delivered', providerMessageId: `discord-${Date.now()}` };
}

async function deliverEmail(
  payload: Record<string, unknown>,
): Promise<DeliveryResult> {
  const deliveryId = randomUUID();
  try {
    const { sendEmail } = await import('../lib/email');
    const to = String(payload.recipient ?? payload.to ?? '');
    if (!to) return { deliveryId, status: 'failed', error: 'No recipient email', retryable: false };

    await sendEmail({
      to,
      subject: String(payload.subject ?? payload.title ?? 'Notification'),
      html: String(payload.html ?? payload.body ?? payload.message ?? ''),
      text: String(payload.text ?? payload.message ?? ''),
    });
    return { deliveryId, status: 'delivered', providerMessageId: `email-${Date.now()}` };
  } catch (err) {
    return { deliveryId, status: 'failed', error: String(err), retryable: true };
  }
}

async function deliverSms(
  payload: Record<string, unknown>,
): Promise<DeliveryResult> {
  const deliveryId = randomUUID();
  const phone = String(payload.recipient ?? payload.phone ?? payload.to ?? '');
  if (!phone) return { deliveryId, status: 'failed', error: 'No recipient phone', retryable: false };

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return { deliveryId, status: 'failed', error: 'SMS provider not configured', retryable: false };
  }

  try {
    const { default: twilio } = await import('twilio').catch(() => ({ default: null }));
    if (!twilio) return { deliveryId, status: 'failed', error: 'Twilio not available', retryable: false };

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msg = await client.messages.create({
      body: String(payload.message ?? payload.body ?? payload.title ?? ''),
      from: String(payload.from ?? process.env.TWILIO_PHONE_NUMBER ?? ''),
      to: phone,
    });
    return { deliveryId, status: 'delivered', providerMessageId: msg.sid };
  } catch (err) {
    return { deliveryId, status: 'failed', error: String(err), retryable: true };
  }
}

async function executeDelivery(
  channel: OutboundChannel,
  payload: Record<string, unknown>,
  channelConfig?: Record<string, unknown>,
): Promise<DeliveryResult> {
  const config = channelConfig ?? {};

  switch (channel) {
    case 'webhook': {
      const url = String(config.url ?? config.webhookUrl ?? '');
      if (!url) return { deliveryId: randomUUID(), status: 'failed', error: 'No webhook URL', retryable: false };
      return deliverWebhook(url, payload, config.secret as string | undefined);
    }
    case 'slack': {
      const url = String(config.webhookUrl ?? process.env.SLACK_WEBHOOK_URL ?? '');
      if (!url) return { deliveryId: randomUUID(), status: 'failed', error: 'No Slack webhook URL', retryable: false };
      return deliverSlack(url, payload);
    }
    case 'teams': {
      const url = String(config.webhookUrl ?? process.env.TEAMS_WEBHOOK_URL ?? '');
      if (!url) return { deliveryId: randomUUID(), status: 'failed', error: 'No Teams webhook URL', retryable: false };
      return deliverTeams(url, payload);
    }
    case 'discord': {
      const url = String(config.webhookUrl ?? process.env.DISCORD_WEBHOOK_URL ?? '');
      if (!url) return { deliveryId: randomUUID(), status: 'failed', error: 'No Discord webhook URL', retryable: false };
      return deliverDiscord(url, payload);
    }
    case 'email':
      return deliverEmail(payload);
    case 'sms':
      return deliverSms(payload);
    default:
      return { deliveryId: randomUUID(), status: 'failed', error: `Unsupported channel: ${channel}`, retryable: false };
  }
}

async function resolveChannelConfig(
  channel: OutboundChannel,
  orgId?: string,
  providedConfig?: Record<string, unknown>,
): Promise<Record<string, unknown> | undefined> {
  if (providedConfig && Object.keys(providedConfig).length > 0) return providedConfig;

  try {
    const conditions = [
      eq(outboundChannelConfigsTable.channel, channel),
      eq(outboundChannelConfigsTable.enabled, 'true'),
    ];
    if (orgId) {
      conditions.push(eq(outboundChannelConfigsTable.orgId, orgId));
    }

    const [dbConfig] = await db
      .select()
      .from(outboundChannelConfigsTable)
      .where(and(...conditions))
      .limit(1);

    if (dbConfig) {
      return dbConfig.config as Record<string, unknown>;
    }
  } catch (err) {
    logger.debug({ err, channel, orgId }, '[outbound-gateway] channel config resolution failed');
  }

  return undefined;
}

export async function submitDelivery(request: DeliveryRequest): Promise<DeliveryResult> {
  const deliveryId = randomUUID();

  try {
    await db.insert(outboundDeliveriesTable).values({
      deliveryId,
      channel: request.channel,
      status: 'queued',
      sourceDomain: request.sourceDomain,
      sourceEvent: request.sourceEvent,
      sourceSignalId: request.sourceSignalId ?? null,
      recipient: request.recipient ?? null,
      payload: request.payload,
      channelConfig: request.channelConfig ?? null,
      attempts: 0,
      maxAttempts: request.maxAttempts ?? 3,
      orgId: request.orgId ?? null,
      createdBy: request.createdBy ?? null,
    });

    await db
      .update(outboundDeliveriesTable)
      .set({ status: 'delivering', attempts: 1, updatedAt: new Date() })
      .where(eq(outboundDeliveriesTable.deliveryId, deliveryId));

    const resolvedConfig = await resolveChannelConfig(request.channel, request.orgId, request.channelConfig);

    const mergedPayload = { ...request.payload };
    if (request.recipient) {
      mergedPayload.recipient = request.recipient;
      if (!mergedPayload.to) mergedPayload.to = request.recipient;
      if (!mergedPayload.phone && request.channel === 'sms') mergedPayload.phone = request.recipient;
    }

    const result = await executeDelivery(request.channel, mergedPayload, resolvedConfig);

    await db
      .update(outboundDeliveriesTable)
      .set({
        status: result.status === 'delivered' ? 'delivered' : 'failed',
        providerMessageId: result.providerMessageId ?? null,
        lastError: result.error ?? null,
        deliveredAt: result.status === 'delivered' ? new Date() : null,
        nextRetryAt:
          result.status === 'failed' && result.retryable
            ? new Date(Date.now() + 60_000)
            : null,
        updatedAt: new Date(),
      })
      .where(eq(outboundDeliveriesTable.deliveryId, deliveryId));

    await db.insert(outboundAuditLogTable).values({
      deliveryId,
      action: result.status === 'delivered' ? 'delivery_success' : 'delivery_failed',
      channel: request.channel,
      status: result.status,
      metadata: {
        sourceDomain: request.sourceDomain,
        sourceEvent: request.sourceEvent,
        providerMessageId: result.providerMessageId,
        error: result.error,
      },
      orgId: request.orgId ?? null,
    });

    logger.info(
      { deliveryId, channel: request.channel, status: result.status },
      '[outbound-gateway] delivery processed',
    );

    return { ...result, deliveryId };
  } catch (err) {
    logger.error({ err, deliveryId }, '[outbound-gateway] delivery submission failed');
    return { deliveryId, status: 'failed', error: String(err), retryable: true };
  }
}

export async function retryFailedDeliveries(orgId?: string): Promise<number> {
  try {
    const conditions = [
      eq(outboundDeliveriesTable.status, 'failed'),
      lte(outboundDeliveriesTable.nextRetryAt, new Date()),
    ];
    if (orgId) {
      conditions.push(eq(outboundDeliveriesTable.orgId, orgId));
    }

    const pending = await db
      .select()
      .from(outboundDeliveriesTable)
      .where(and(...conditions))
      .limit(50);

    let retried = 0;
    for (const delivery of pending) {
      if (delivery.attempts >= delivery.maxAttempts) {
        await db
          .update(outboundDeliveriesTable)
          .set({ status: 'failed', nextRetryAt: null, updatedAt: new Date() })
          .where(eq(outboundDeliveriesTable.deliveryId, delivery.deliveryId));
        continue;
      }

      await db
        .update(outboundDeliveriesTable)
        .set({
          status: 'retrying',
          attempts: delivery.attempts + 1,
          updatedAt: new Date(),
        })
        .where(eq(outboundDeliveriesTable.deliveryId, delivery.deliveryId));

      const resolvedRetryConfig = await resolveChannelConfig(
        delivery.channel as OutboundChannel,
        delivery.orgId ?? undefined,
        (delivery.channelConfig as Record<string, unknown>) ?? undefined,
      );
      const result = await executeDelivery(
        delivery.channel as OutboundChannel,
        delivery.payload as Record<string, unknown>,
        resolvedRetryConfig,
      );

      const backoffMs = Math.min(60_000 * Math.pow(2, delivery.attempts), 3_600_000);
      await db
        .update(outboundDeliveriesTable)
        .set({
          status: result.status === 'delivered' ? 'delivered' : 'failed',
          providerMessageId: result.providerMessageId ?? delivery.providerMessageId,
          lastError: result.error ?? delivery.lastError,
          deliveredAt: result.status === 'delivered' ? new Date() : null,
          nextRetryAt:
            result.status === 'failed' && result.retryable && delivery.attempts + 1 < delivery.maxAttempts
              ? new Date(Date.now() + backoffMs)
              : null,
          updatedAt: new Date(),
        })
        .where(eq(outboundDeliveriesTable.deliveryId, delivery.deliveryId));

      await db.insert(outboundAuditLogTable).values({
        deliveryId: delivery.deliveryId,
        action: result.status === 'delivered' ? 'retry_success' : 'retry_failed',
        channel: delivery.channel,
        status: result.status,
        metadata: { attempt: delivery.attempts + 1, error: result.error },
        orgId: delivery.orgId,
      });

      retried++;
    }

    if (retried > 0) {
      logger.info({ retried }, '[outbound-gateway] retried failed deliveries');
    }
    return retried;
  } catch (err) {
    logger.error({ err }, '[outbound-gateway] retry sweep failed');
    return 0;
  }
}

export async function getDeliveryStats(orgId?: string): Promise<{
  total: number;
  delivered: number;
  failed: number;
  queued: number;
  retrying: number;
  byChannel: Record<string, number>;
}> {
  const filter = orgId ? eq(outboundDeliveriesTable.orgId, orgId) : undefined;
  const rows = await db
    .select()
    .from(outboundDeliveriesTable)
    .where(filter);

  const byChannel: Record<string, number> = {};
  let delivered = 0;
  let failed = 0;
  let queued = 0;
  let retrying = 0;

  for (const row of rows) {
    byChannel[row.channel] = (byChannel[row.channel] ?? 0) + 1;
    if (row.status === 'delivered') delivered++;
    else if (row.status === 'failed') failed++;
    else if (row.status === 'queued') queued++;
    else if (row.status === 'retrying') retrying++;
  }

  return { total: rows.length, delivered, failed, queued, retrying, byChannel };
}
