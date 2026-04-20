import { db, webPushSubscriptionsTable } from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';
import webpush from 'web-push';
import { logger } from './logger';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:platform@szlholdings.com';

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    logger.warn('[web-push] VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set — web push disabled');
    return false;
  }
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    return true;
  } catch (err) {
    logger.warn({ err }, '[web-push] Failed to configure VAPID details');
    return false;
  }
}

export function getVapidPublicKey(): string | undefined {
  return VAPID_PUBLIC_KEY;
}

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
}

export interface SendWebPushResult {
  sent: number;
  failed: number;
  deactivated: number;
}

export async function sendWebPushToAll(payload: WebPushPayload): Promise<SendWebPushResult> {
  if (!ensureVapidConfigured()) {
    return { sent: 0, failed: 0, deactivated: 0 };
  }

  let subs: (typeof webPushSubscriptionsTable.$inferSelect)[];
  try {
    subs = await db
      .select()
      .from(webPushSubscriptionsTable)
      .where(eq(webPushSubscriptionsTable.isActive, true));
  } catch (err) {
    logger.warn({ err }, '[web-push] Failed to query subscriptions');
    return { sent: 0, failed: 0, deactivated: 0 };
  }

  if (subs.length === 0) return { sent: 0, failed: 0, deactivated: 0 };

  return sendToSubscriptions(subs, payload);
}

export async function sendWebPushToApp(
  appId: string,
  payload: WebPushPayload,
): Promise<SendWebPushResult> {
  if (!ensureVapidConfigured()) {
    return { sent: 0, failed: 0, deactivated: 0 };
  }

  let subs: (typeof webPushSubscriptionsTable.$inferSelect)[];
  try {
    subs = await db
      .select()
      .from(webPushSubscriptionsTable)
      .where(
        and(
          eq(webPushSubscriptionsTable.isActive, true),
          eq(webPushSubscriptionsTable.appId, appId),
        ),
      );
  } catch (err) {
    logger.warn({ err }, '[web-push] Failed to query subscriptions for app');
    return { sent: 0, failed: 0, deactivated: 0 };
  }

  if (subs.length === 0) return { sent: 0, failed: 0, deactivated: 0 };
  return sendToSubscriptions(subs, payload);
}

async function sendToSubscriptions(
  subs: (typeof webPushSubscriptionsTable.$inferSelect)[],
  payload: WebPushPayload,
): Promise<SendWebPushResult> {
  let sent = 0;
  let failed = 0;
  const toDeactivate: string[] = [];

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? '/favicon.svg',
    badge: payload.badge ?? '/favicon.svg',
    tag: payload.tag,
    data: {
      ...payload.data,
      actionUrl: payload.actionUrl,
    },
  });

  const sendResults = await Promise.allSettled(
    subs.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };
      try {
        await webpush.sendNotification(pushSub, notificationPayload, {
          TTL: 86400,
        });
        return { success: true, endpoint: sub.endpoint };
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          return { success: false, gone: true, endpoint: sub.endpoint };
        }
        return { success: false, gone: false, endpoint: sub.endpoint, err };
      }
    }),
  );

  for (const result of sendResults) {
    if (result.status === 'fulfilled') {
      const val = result.value;
      if (val.success) {
        sent++;
      } else {
        failed++;
        if (val.gone) {
          toDeactivate.push(val.endpoint);
        } else {
          logger.warn(
            { endpoint: val.endpoint?.slice(0, 40), err: (val as { err?: unknown }).err },
            '[web-push] Push send failed',
          );
        }
      }
    } else {
      failed++;
    }
  }

  if (toDeactivate.length > 0) {
    for (const endpoint of toDeactivate) {
      await db
        .update(webPushSubscriptionsTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(webPushSubscriptionsTable.endpoint, endpoint))
        .catch((err) => logger.warn({ err }, '[web-push] Failed to deactivate subscription'));
    }
    logger.info({ count: toDeactivate.length }, '[web-push] Deactivated expired subscriptions');
  }

  logger.info({ sent, failed, total: subs.length }, '[web-push] Push dispatch complete');
  return { sent, failed, deactivated: toDeactivate.length };
}
