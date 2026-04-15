import { LRUCache } from "lru-cache";
import { Expo, type ExpoPushMessage, type ExpoPushTicket, type ExpoPushReceiptId } from "expo-server-sdk";
import {
  db,
  pool,
  pushTokensTable,
  pushReceiptsTable,
  pushNotificationHistoryTable,
  pushNotificationPreferencesTable,
  scheduledNotificationsTable,
} from "@szl-holdings/db";
import { eq, and, inArray, lt, sql } from "drizzle-orm";
import { logger } from "./logger";
import type { NotificationTemplate } from "./push-templates";

const expo = new Expo({});

export type PushMessagePayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: "default" | null;
  channelId?: string;
};

export type SendResult = {
  sent: number;
  failed: number;
  tickets: ExpoPushTicket[];
  historyId?: number;
};

// ─── Per-user rate limiting ───────────────────────────────────────────────────

const USER_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const USER_RATE_LIMIT_MAX = 10;
const userRateBuckets = new LRUCache<number, { count: number; windowStart: number }>({ max: 10000 });

// userId is nullable for anonymous device tokens (e.g. public apps without auth).
// Anonymous tokens bypass per-user rate limiting — they are deduplicated by token
// uniqueness in push_tokens and cannot be attributed to a specific user.
export function isUserRateLimited(userId: number | null): boolean {
  if (userId === null) return false;
  const now = Date.now();
  const bucket = userRateBuckets.get(userId);
  if (!bucket || now - bucket.windowStart > USER_RATE_LIMIT_WINDOW_MS) {
    userRateBuckets.set(userId, { count: 1, windowStart: now });
    return false;
  }
  if (bucket.count >= USER_RATE_LIMIT_MAX) {
    logger.warn({ userId, count: bucket.count }, "[expo-push] User rate limit exceeded — suppressing push");
    return true;
  }
  bucket.count++;
  return false;
}

// ─── Template → category mapping ─────────────────────────────────────────────

const TEMPLATE_CATEGORY_MAP: Record<NotificationTemplate, string> = {
  aegis_threat_alert: "threats",
  aegis_incident_update: "incidents",
  aegis_system_health: "health",
  vessels_vessel_alert: "vessel_alerts",
  vessels_compliance_warning: "compliance",
  vessels_port_arrival: "port_arrivals",
  terra_deal_update: "deal_updates",
  terra_listing_change: "listing_changes",
  terra_distress_signal: "distress_signals",
  carlota_session_reminder: "sessions",
  carlota_document_upload: "documents",
  carlota_message: "messages",
  lyte_kpi_alert: "kpi_alerts",
  lyte_escalation: "escalations",
  lyte_milestone: "milestones",
  szl_portfolio_alert: "portfolio_alerts",
  szl_investor_update: "investor_updates",
  stephen_content_published: "content_published",
  stephen_venture_update: "venture_updates",
};

// ─── Preference check ─────────────────────────────────────────────────────────

// Anonymous tokens (userId=null) have no per-user preferences — always allowed.
async function isPreferenceAllowed(userId: number | null, appId: string, category: string): Promise<boolean> {
  if (userId === null) return true;
  try {
    const [pref] = await db
      .select({ enabled: pushNotificationPreferencesTable.enabled })
      .from(pushNotificationPreferencesTable)
      .where(
        and(
          eq(pushNotificationPreferencesTable.userId, userId),
          eq(pushNotificationPreferencesTable.appId, appId),
          eq(pushNotificationPreferencesTable.category, category)
        )
      );
    if (pref !== undefined) return pref.enabled;

    const [appPref] = await db
      .select({ enabled: pushNotificationPreferencesTable.enabled })
      .from(pushNotificationPreferencesTable)
      .where(
        and(
          eq(pushNotificationPreferencesTable.userId, userId),
          eq(pushNotificationPreferencesTable.appId, appId),
          eq(pushNotificationPreferencesTable.category, "all")
        )
      );
    if (appPref !== undefined) return appPref.enabled;
  } catch {
    // preference lookup failure is non-fatal; default to allowed
  }
  return true;
}

// ─── Token lookups ────────────────────────────────────────────────────────────

async function getActiveTokensForUser(userId: number): Promise<string[]> {
  const rows = await db
    .select({ token: pushTokensTable.token })
    .from(pushTokensTable)
    .where(and(eq(pushTokensTable.userId, userId), eq(pushTokensTable.isActive, true)));
  return rows.map((r) => r.token);
}

async function getActiveTokensForApp(appId: string): Promise<{ token: string; userId: number | null }[]> {
  const rows = await db
    .select({ token: pushTokensTable.token, userId: pushTokensTable.userId })
    .from(pushTokensTable)
    .where(and(eq(pushTokensTable.appId, appId), eq(pushTokensTable.isActive, true)));
  return rows;
}

async function getAllActiveTokens(): Promise<{ token: string; userId: number | null }[]> {
  const rows = await db
    .select({ token: pushTokensTable.token, userId: pushTokensTable.userId })
    .from(pushTokensTable)
    .where(eq(pushTokensTable.isActive, true));
  return rows;
}

// ─── Public send helpers ──────────────────────────────────────────────────────

export async function sendPushToUser(
  userId: number,
  payload: PushMessagePayload,
  opts?: { templateId?: string; appId?: string }
): Promise<SendResult> {
  if (isUserRateLimited(userId)) {
    return { sent: 0, failed: 0, tickets: [] };
  }

  if (opts?.templateId && opts?.appId) {
    const template = opts.templateId as NotificationTemplate;
    const category = TEMPLATE_CATEGORY_MAP[template];
    if (category) {
      const allowed = await isPreferenceAllowed(userId, opts.appId, category);
      if (!allowed) {
        logger.debug({ userId, appId: opts.appId, category }, "[expo-push] Notification suppressed by user preference");
        return { sent: 0, failed: 0, tickets: [] };
      }
    }
  }

  const tokens = await getActiveTokensForUser(userId);
  const appId = opts?.appId ?? "unknown";
  const tokenUserMap = new Map(tokens.map((t) => [t, userId]));
  return sendToTokens(tokens, payload, {
    target: "user",
    userId,
    appId,
    templateId: opts?.templateId,
    tokenUserMap,
  });
}

export async function sendPushToApp(
  appId: string,
  payload: PushMessagePayload,
  opts?: { templateId?: string }
): Promise<SendResult> {
  const rows = await getActiveTokensForApp(appId);

  const category = opts?.templateId
    ? TEMPLATE_CATEGORY_MAP[opts.templateId as NotificationTemplate]
    : undefined;

  const eligibleRows = (
    await Promise.all(
      rows.map(async (r) => {
        if (isUserRateLimited(r.userId)) return null;
        if (category) {
          const allowed = await isPreferenceAllowed(r.userId, appId, category);
          if (!allowed) return null;
        }
        return r;
      })
    )
  ).filter((r): r is { token: string; userId: number | null } => r !== null);

  logger.debug(
    { total: rows.length, eligible: eligibleRows.length },
    "[expo-push] App push after rate-limit + preference filtering"
  );

  const tokenUserMap = new Map<string, number>();
  eligibleRows.forEach((r) => { if (r.userId !== null) tokenUserMap.set(r.token, r.userId); });
  const tokens = eligibleRows.map((r) => r.token);
  return sendToTokens(tokens, payload, {
    target: "app",
    appId,
    templateId: opts?.templateId,
    tokenUserMap,
  });
}

export async function sendPushBroadcast(
  payload: PushMessagePayload,
  opts?: { templateId?: string }
): Promise<SendResult> {
  const rows = await getAllActiveTokens();

  const eligibleRows = (
    await Promise.all(
      rows.map(async (r) => {
        if (isUserRateLimited(r.userId)) return null;
        return r;
      })
    )
  ).filter((r): r is { token: string; userId: number | null } => r !== null);

  const tokenUserMap = new Map<string, number>();
  eligibleRows.forEach((r) => { if (r.userId !== null) tokenUserMap.set(r.token, r.userId); });
  const tokens = eligibleRows.map((r) => r.token);
  return sendToTokens(tokens, payload, {
    target: "broadcast",
    appId: "broadcast",
    templateId: opts?.templateId,
    tokenUserMap,
  });
}

// ─── Core send engine ─────────────────────────────────────────────────────────

async function storeHistory(params: {
  userId?: number;
  appId: string;
  templateId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  target: "user" | "app" | "broadcast" | "scheduled";
  tokensSent: number;
  tokensFailed: number;
}): Promise<number | undefined> {
  try {
    const status: "sent" | "partial" | "failed" | "pending" =
      params.tokensSent > 0 && params.tokensFailed === 0
        ? "sent"
        : params.tokensSent === 0
          ? "failed"
          : "partial";
    const [row] = await db
      .insert(pushNotificationHistoryTable)
      .values({
        userId: params.userId ?? null,
        appId: params.appId,
        templateId: params.templateId ?? null,
        title: params.title,
        body: params.body,
        data: params.data ?? null,
        target: params.target,
        tokensSent: params.tokensSent,
        tokensFailed: params.tokensFailed,
        tokensDelivered: 0,
        deliveryStatus: status,
      })
      .returning({ id: pushNotificationHistoryTable.id });
    return row?.id;
  } catch (err) {
    logger.warn({ err }, "[expo-push] Failed to store push notification history");
    return undefined;
  }
}

async function storeReceipts(
  ticketIdToToken: Map<string, string>,
  appId: string,
  templateId?: string,
  historyId?: number,
  tokenUserMap?: Map<string, number>
): Promise<void> {
  if (ticketIdToToken.size === 0) return;
  try {
    await db.insert(pushReceiptsTable).values(
      Array.from(ticketIdToToken.entries()).map(([ticketId, token]) => ({
        ticketId,
        historyId: historyId ?? null,
        userId: tokenUserMap?.get(token) ?? null,
        token,
        appId,
        templateId: templateId ?? null,
        status: "pending" as const,
      }))
    );
  } catch (err) {
    logger.warn({ err }, "[expo-push] Failed to store push receipts");
  }
}

async function sendToTokens(
  tokens: string[],
  payload: PushMessagePayload,
  opts: {
    target: "user" | "app" | "broadcast" | "scheduled";
    appId: string;
    userId?: number;
    templateId?: string;
    tokenUserMap?: Map<string, number>;
  }
): Promise<SendResult> {
  if (tokens.length === 0) {
    await storeHistory({
      userId: opts.userId,
      appId: opts.appId,
      templateId: opts.templateId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      target: opts.target,
      tokensSent: 0,
      tokensFailed: 0,
    });
    return { sent: 0, failed: 0, tickets: [] };
  }

  const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
  const invalidTokens = tokens.filter((t) => !Expo.isExpoPushToken(t));

  if (invalidTokens.length > 0) {
    logger.warn({ count: invalidTokens.length }, "[expo-push] Invalid tokens found, deactivating");
    await deactivateTokens(invalidTokens);
  }

  if (validTokens.length === 0) {
    await storeHistory({
      userId: opts.userId,
      appId: opts.appId,
      templateId: opts.templateId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      target: opts.target,
      tokensSent: 0,
      tokensFailed: invalidTokens.length,
    });
    return { sent: 0, failed: invalidTokens.length, tickets: [] };
  }

  const messages: ExpoPushMessage[] = validTokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: payload.sound ?? "default",
    badge: payload.badge,
    channelId: payload.channelId ?? "default",
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const allTickets: ExpoPushTicket[] = [];
  let failed = 0;
  const ticketIdToToken = new Map<string, string>();

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      allTickets.push(...tickets);

      const badTokens: string[] = [];
      tickets.forEach((ticket, i) => {
        const token = (chunk[i] as ExpoPushMessage).to as string;
        if (ticket.status === "ok") {
          ticketIdToToken.set(ticket.id, token);
        } else {
          const errTicket = ticket as { status: "error"; message: string; details?: { error?: string } };
          logger.warn({ error: errTicket.message, details: errTicket.details }, "[expo-push] Ticket error");
          failed++;
          if (errTicket.details?.error === "DeviceNotRegistered") {
            badTokens.push(token);
          }
        }
      });

      if (badTokens.length > 0) {
        await deactivateTokens(badTokens);
      }
    } catch (err) {
      logger.error({ err }, "[expo-push] Failed to send chunk");
      failed += chunk.length;
    }
  }

  const sent = allTickets.filter((t) => t.status === "ok").length;
  logger.info({ sent, failed, total: validTokens.length }, "[expo-push] Push notifications sent");

  const historyId = await storeHistory({
    userId: opts.userId,
    appId: opts.appId,
    templateId: opts.templateId,
    title: payload.title,
    body: payload.body,
    data: payload.data,
    target: opts.target,
    tokensSent: sent,
    tokensFailed: failed + invalidTokens.length,
  });

  await storeReceipts(ticketIdToToken, opts.appId, opts.templateId, historyId, opts.tokenUserMap);

  return { sent, failed, tickets: allTickets, historyId };
}

async function deactivateTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  try {
    await db
      .update(pushTokensTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(inArray(pushTokensTable.token, tokens));
  } catch (err) {
    logger.warn({ err }, "[expo-push] Failed to deactivate tokens");
  }
}

// ─── Receipt verification (background job) ────────────────────────────────────

// Reset receipts stuck in 'processing' longer than 10 min so they are retried.
async function requeueStuckReceipts(): Promise<void> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  try {
    await pool.query(
      `UPDATE push_receipts SET status = 'pending', checked_at = NULL
       WHERE status = 'processing' AND checked_at < $1`,
      [tenMinutesAgo]
    );
  } catch (err) {
    logger.warn({ err }, "[expo-push] Failed to requeue stuck processing receipts");
  }
}

export async function verifyPushReceipts(): Promise<void> {
  try {
    // Phase 0: Requeue receipts stuck in 'processing' (from a crashed/stalled run).
    await requeueStuckReceipts();

    // Phase 1: Atomically claim up to 100 pending receipts using
    // FOR UPDATE SKIP LOCKED — ensures concurrent workers claim disjoint sets.
    const claimResult = await pool.query<{
      id: number;
      ticket_id: string;
      token: string;
      history_id: number | null;
    }>(
      `UPDATE push_receipts
       SET status = 'processing', checked_at = NOW()
       WHERE id IN (
         SELECT id FROM push_receipts
         WHERE status = 'pending'
         ORDER BY created_at
         LIMIT 100
         FOR UPDATE SKIP LOCKED
       )
       RETURNING id, ticket_id, token, history_id`
    );

    const pendingReceipts = claimResult.rows.map((r) => ({
      id: r.id,
      ticketId: r.ticket_id,
      token: r.token,
      historyId: r.history_id ?? undefined,
    }));

    if (pendingReceipts.length === 0) return;

    const receiptIds = pendingReceipts.map((r) => r.ticketId) as ExpoPushReceiptId[];
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

    const historyDeliveredCounts = new Map<number, number>();
    const historyFailedCounts = new Map<number, number>();
    const processedTicketIds = new Set<string>();

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        const badTokens: string[] = [];

        for (const [receiptId, receipt] of Object.entries(receipts)) {
          const pending = pendingReceipts.find((r) => r.ticketId === receiptId);
          processedTicketIds.add(receiptId);

          if (receipt.status === "ok") {
            await db
              .update(pushReceiptsTable)
              .set({ status: "ok", checkedAt: new Date() })
              .where(eq(pushReceiptsTable.ticketId, receiptId));

            if (pending?.historyId) {
              historyDeliveredCounts.set(
                pending.historyId,
                (historyDeliveredCounts.get(pending.historyId) ?? 0) + 1
              );
            }
          } else if (receipt.status === "error") {
            const errReceipt = receipt as { status: "error"; message: string; details?: { error?: string } };
            await db
              .update(pushReceiptsTable)
              .set({
                status: "error",
                errorCode: errReceipt.details?.error ?? "unknown",
                errorMessage: errReceipt.message,
                checkedAt: new Date(),
              })
              .where(eq(pushReceiptsTable.ticketId, receiptId));

            if (pending?.historyId) {
              historyFailedCounts.set(
                pending.historyId,
                (historyFailedCounts.get(pending.historyId) ?? 0) + 1
              );
            }

            if (errReceipt.details?.error === "DeviceNotRegistered" && pending?.token) {
              badTokens.push(pending.token);
            }

            logger.warn(
              { receiptId, error: errReceipt.message, details: errReceipt.details },
              "[expo-push] Receipt error"
            );
          }
        }

        if (badTokens.length > 0) {
          await deactivateTokens(badTokens);
          logger.info({ count: badTokens.length }, "[expo-push] Deactivated bad tokens from receipts");
        }
      } catch (err) {
        logger.warn({ err }, "[expo-push] Failed to fetch receipt chunk");
      }
    }

    // Requeue claimed receipts that Expo did not return (receipt not ready yet).
    // These will be retried in the next polling cycle.
    const unprocessedIds = pendingReceipts
      .filter((r) => !processedTicketIds.has(r.ticketId))
      .map((r) => r.ticketId);

    if (unprocessedIds.length > 0) {
      try {
        await db
          .update(pushReceiptsTable)
          .set({ status: "pending", checkedAt: null })
          .where(inArray(pushReceiptsTable.ticketId, unprocessedIds));
        logger.debug({ count: unprocessedIds.length }, "[expo-push] Requeued receipts not yet available from Expo");
      } catch (err) {
        logger.warn({ err }, "[expo-push] Failed to requeue unprocessed receipts");
      }
    }

    // Cumulatively update delivered/failed counts and recompute deliveryStatus.
    const allHistoryIds = new Set<number>();
    historyDeliveredCounts.forEach((_, k) => allHistoryIds.add(k));
    historyFailedCounts.forEach((_, k) => allHistoryIds.add(k));
    for (const historyId of allHistoryIds) {
      try {
        const deliveredDelta = historyDeliveredCounts.get(historyId) ?? 0;
        const failedDelta = historyFailedCounts.get(historyId) ?? 0;

        // Fetch current values to derive the new deliveryStatus
        const [current] = await db
          .select({
            tokensSent: pushNotificationHistoryTable.tokensSent,
            tokensFailed: pushNotificationHistoryTable.tokensFailed,
            tokensDelivered: pushNotificationHistoryTable.tokensDelivered,
          })
          .from(pushNotificationHistoryTable)
          .where(eq(pushNotificationHistoryTable.id, historyId));

        if (!current) continue;

        const newDelivered = current.tokensDelivered + deliveredDelta;
        const newFailed = current.tokensFailed + failedDelta;
        const newStatus: "sent" | "partial" | "failed" =
          newFailed === 0
            ? "sent"
            : newDelivered === 0
              ? "failed"
              : "partial";

        await db
          .update(pushNotificationHistoryTable)
          .set({
            tokensDelivered: newDelivered,
            tokensFailed: newFailed,
            deliveryStatus: newStatus,
          })
          .where(eq(pushNotificationHistoryTable.id, historyId));
      } catch (err) {
        logger.warn({ err, historyId }, "[expo-push] Failed to update history counts from receipts");
      }
    }

    logger.info({ checked: pendingReceipts.length }, "[expo-push] Receipt verification complete");
  } catch (err) {
    logger.warn({ err }, "[expo-push] Receipt verification failed");
  }
}

// ─── Scheduled notification processor (background job) ───────────────────────

export async function processScheduledNotifications(): Promise<void> {
  try {
    const now = new Date();

    const due = await db
      .select()
      .from(scheduledNotificationsTable)
      .where(
        and(
          eq(scheduledNotificationsTable.status, "pending"),
          lt(scheduledNotificationsTable.sendAt, now)
        )
      )
      .limit(20);

    if (due.length === 0) return;

    for (const job of due) {
      try {
        // Atomically claim the job by guarding on status='pending'. If another
        // process already claimed it, .returning() will be empty — skip safely.
        const [claimed] = await db
          .update(scheduledNotificationsTable)
          .set({ status: "processing", updatedAt: new Date() })
          .where(
            and(
              eq(scheduledNotificationsTable.id, job.id),
              eq(scheduledNotificationsTable.status, "pending")
            )
          )
          .returning({ id: scheduledNotificationsTable.id });

        if (!claimed) {
          logger.debug({ jobId: job.id }, "[expo-push] Scheduled job already claimed — skipping");
          continue;
        }

        let payload: PushMessagePayload;
        const templateId = job.template ?? undefined;

        if (templateId) {
          const { buildPushMessage } = await import("./push-templates.js");
          const template = templateId as NotificationTemplate;
          payload = buildPushMessage(template, (job.vars as Record<string, string | number>) ?? {});
        } else if (job.title && job.body) {
          payload = {
            title: job.title,
            body: job.body,
            data: (job.data as Record<string, unknown>) ?? {},
            sound: "default",
          };
        } else {
          throw new Error("Scheduled notification has neither template nor title+body");
        }

        let result: SendResult;
        if (job.target === "user" && job.userId) {
          result = await sendPushToUser(job.userId, payload, {
            templateId,
            appId: job.appId ?? "unknown",
          });
        } else if (job.target === "app" && job.appId) {
          result = await sendPushToApp(job.appId, payload, { templateId });
        } else {
          result = await sendPushBroadcast(payload, { templateId });
        }

        await db
          .update(scheduledNotificationsTable)
          .set({
            status: "sent",
            processedAt: new Date(),
            attempts: job.attempts + 1,
            updatedAt: new Date(),
          })
          .where(eq(scheduledNotificationsTable.id, job.id));

        logger.info({ jobId: job.id, sent: result.sent, failed: result.failed }, "[expo-push] Scheduled notification sent");
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        await db
          .update(scheduledNotificationsTable)
          .set({
            status: job.attempts >= 2 ? "failed" : "pending",
            attempts: job.attempts + 1,
            errorMessage: errMessage,
            updatedAt: new Date(),
          })
          .where(eq(scheduledNotificationsTable.id, job.id));
        logger.warn({ err, jobId: job.id }, "[expo-push] Scheduled notification failed");
      }
    }

    logger.info({ processed: due.length }, "[expo-push] Scheduled notifications processed");
  } catch (err) {
    logger.warn({ err }, "[expo-push] Scheduled notification processing failed");
  }
}

export { expo };
