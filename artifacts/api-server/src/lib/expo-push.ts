import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { db, pushTokensTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from "./logger";

const expo = new Expo({ useFcmV1: true });

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
};

async function getActiveTokensForUser(userId: number): Promise<string[]> {
  const rows = await db
    .select({ token: pushTokensTable.token })
    .from(pushTokensTable)
    .where(and(eq(pushTokensTable.userId, userId), eq(pushTokensTable.isActive, true)));
  return rows.map((r) => r.token);
}

async function getActiveTokensForApp(appId: string): Promise<{ token: string; userId: number }[]> {
  const rows = await db
    .select({ token: pushTokensTable.token, userId: pushTokensTable.userId })
    .from(pushTokensTable)
    .where(and(eq(pushTokensTable.appId, appId), eq(pushTokensTable.isActive, true)));
  return rows;
}

export async function sendPushToUser(userId: number, payload: PushMessagePayload): Promise<SendResult> {
  const tokens = await getActiveTokensForUser(userId);
  return sendToTokens(tokens, payload);
}

export async function sendPushToApp(appId: string, payload: PushMessagePayload): Promise<SendResult> {
  const rows = await getActiveTokensForApp(appId);
  const tokens = rows.map((r) => r.token);
  return sendToTokens(tokens, payload);
}

export async function sendPushBroadcast(payload: PushMessagePayload): Promise<SendResult> {
  const rows = await db
    .select({ token: pushTokensTable.token })
    .from(pushTokensTable)
    .where(eq(pushTokensTable.isActive, true));
  const tokens = rows.map((r) => r.token);
  return sendToTokens(tokens, payload);
}

async function sendToTokens(tokens: string[], payload: PushMessagePayload): Promise<SendResult> {
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, tickets: [] };
  }

  const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
  const invalidTokens = tokens.filter((t) => !Expo.isExpoPushToken(t));

  if (invalidTokens.length > 0) {
    logger.warn({ invalidTokens }, "[expo-push] Invalid tokens found, skipping");
    await deactivateTokens(invalidTokens);
  }

  if (validTokens.length === 0) {
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

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      allTickets.push(...tickets);

      const errorTokens: string[] = [];
      tickets.forEach((ticket, i) => {
        if (ticket.status === "error") {
          const errorDetails = ticket as { status: "error"; message: string; details?: { error?: string } };
          logger.warn({ error: errorDetails.message, details: errorDetails.details }, "[expo-push] Ticket error");
          failed++;
          if (errorDetails.details?.error === "DeviceNotRegistered") {
            errorTokens.push(validTokens[i]);
          }
        }
      });

      if (errorTokens.length > 0) {
        await deactivateTokens(errorTokens);
      }
    } catch (err) {
      logger.error({ err }, "[expo-push] Failed to send chunk");
      failed += chunk.length;
    }
  }

  const sent = allTickets.filter((t) => t.status === "ok").length;
  logger.info({ sent, failed, total: validTokens.length }, "[expo-push] Push notifications sent");

  return { sent, failed, tickets: allTickets };
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

export { expo };
