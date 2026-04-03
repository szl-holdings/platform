import type { IncomingMessage, Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { logger } from "./logger";
import { db, sessionsTable, usersTable } from "@szl-holdings/db";
import { eq, gt, and } from "drizzle-orm";

export interface ChannelMessage {
  channel: string;
  event: string;
  data: unknown;
  timestamp: number;
}

interface SubscribedClient {
  ws: WebSocket;
  channels: Set<string>;
  lastPing: number;
  platformRole: string | null;
}

const MAX_WS_CLIENTS = 100;
const clients = new Map<string, SubscribedClient>();
let wss: WebSocketServer | null = null;

export const SENSITIVE_CHANNELS = new Set([
  "aegis-incidents",
  "workflow-runs",
  "bookings",
  "lyte-metrics",
  "vessel-positions",
  "terra-signals",
]);

export const PUBLIC_CHANNELS = new Set([
  "health",
  "notifications",
  "feature-flags",
]);

const CHANNEL_ALLOWED_ROLES: Record<string, Set<string>> = {
  "aegis-incidents": new Set(["founder_admin", "platform_admin", "operator", "analyst", "ops_manager"]),
  "workflow-runs": new Set(["founder_admin", "platform_admin", "operator", "ops_manager"]),
  "bookings": new Set(["founder_admin", "platform_admin", "service_coordinator", "sales_delivery_user"]),
  "lyte-metrics": new Set(["founder_admin", "platform_admin", "operator", "ops_manager", "analyst"]),
  "vessel-positions": new Set(["founder_admin", "platform_admin", "maritime_ops_user", "ops_manager", "operator"]),
  "terra-signals": new Set(["founder_admin", "platform_admin", "sales_delivery_user", "analyst", "ops_manager"]),
};

const INTERNAL_TOKEN = process.env["ALLOY_INTERNAL_TOKEN"];
const _rawSessionSecret = process.env["SESSION_SECRET"];
if (!_rawSessionSecret) {
  logger.warn("SESSION_SECRET is not set — WS ticket signing will use a per-process ephemeral secret. Set SESSION_SECRET in production.");
}
const SESSION_SECRET_VAL = _rawSessionSecret ?? randomBytes(64).toString("hex");
const WS_TICKET_TTL_MS = 5 * 60 * 1000;

function signTicket(payload: string): string {
  return createHmac("sha256", SESSION_SECRET_VAL).update(payload).digest("hex");
}

export function issueWsTicket(userId: number | string, platformRole: string): string {
  const expiry = Date.now() + WS_TICKET_TTL_MS;
  const payload = `${userId}:${expiry}:${platformRole}`;
  const sig = signTicket(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

interface TicketClaims {
  userId: string;
  platformRole: string;
}

function verifyWsTicket(ticket: string): TicketClaims | null {
  try {
    const decoded = Buffer.from(ticket, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length < 4) return null;
    const sig = parts.pop()!;
    const payload = parts.join(":");
    const expected = signTicket(payload);
    const expiry = parseInt(parts[1]!, 10);
    if (Date.now() > expiry) return null;
    const sigBuffer = Buffer.from(sig, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
    return { userId: parts[0]!, platformRole: parts[2]! };
  } catch {
    return null;
  }
}

async function resolveToken(token: string): Promise<{ authorized: boolean; platformRole: string | null }> {
  if (INTERNAL_TOKEN && token === INTERNAL_TOKEN) {
    return { authorized: true, platformRole: "founder_admin" };
  }
  const claims = verifyWsTicket(token);
  if (claims) {
    return { authorized: true, platformRole: claims.platformRole };
  }
  try {
    const [row] = await db
      .select({ userId: sessionsTable.userId, platformRole: usersTable.platformRole })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId))
      .where(
        and(
          eq(sessionsTable.token, token),
          gt(sessionsTable.expiresAt, new Date())
        )
      )
      .limit(1);
    if (row) return { authorized: true, platformRole: row.platformRole ?? null };
  } catch {
  }
  return { authorized: false, platformRole: null };
}

function isRoleAllowedForChannel(platformRole: string | null, channel: string): boolean {
  const allowed = CHANNEL_ALLOWED_ROLES[channel];
  if (!allowed) return !SENSITIVE_CHANNELS.has(channel);
  if (!platformRole) return false;
  return allowed.has(platformRole);
}

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    if (clients.size >= MAX_WS_CLIENTS) {
      logger.warn({ clientCount: clients.size, maxClients: MAX_WS_CLIENTS }, "WebSocket: max client limit reached, rejecting connection");
      ws.close(1013, "Server overloaded — try again later");
      return;
    }

    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const client: SubscribedClient = { ws, channels: new Set(), lastPing: Date.now(), platformRole: null };
    clients.set(clientId, client);

    logger.debug({ clientId, ip: req.socket.remoteAddress }, "WebSocket client connected");

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type: string; channel?: string; token?: string };

        if (msg.type === "subscribe" && msg.channel) {
          const isSensitive = SENSITIVE_CHANNELS.has(msg.channel);

          if (isSensitive) {
            const token = msg.token;
            if (!token) {
              ws.send(JSON.stringify({ type: "error", code: "unauthorized", message: `Channel ${msg.channel} requires a valid auth token` }));
              return;
            }
            const { authorized, platformRole } = await resolveToken(token);
            if (!authorized) {
              ws.send(JSON.stringify({ type: "error", code: "unauthorized", message: `Invalid or expired token for channel ${msg.channel}` }));
              return;
            }
            if (!isRoleAllowedForChannel(platformRole, msg.channel)) {
              ws.send(JSON.stringify({ type: "error", code: "forbidden", message: `Your role does not have access to channel ${msg.channel}` }));
              return;
            }
            client.platformRole = platformRole;
          }

          client.channels.add(msg.channel);
          ws.send(JSON.stringify({ type: "subscribed", channel: msg.channel }));
          logger.debug({ clientId, channel: msg.channel }, "Client subscribed");
        } else if (msg.type === "unsubscribe" && msg.channel) {
          client.channels.delete(msg.channel);
          ws.send(JSON.stringify({ type: "unsubscribed", channel: msg.channel }));
        } else if (msg.type === "ping") {
          client.lastPing = Date.now();
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        }
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      clients.delete(clientId);
      logger.debug({ clientId }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.warn({ clientId, err }, "WebSocket client error");
      clients.delete(clientId);
    });

    ws.send(JSON.stringify({ type: "connected", clientId, timestamp: Date.now() }));
  });

  const HEARTBEAT_INTERVAL_MS = 30_000;
  const STALE_CLIENT_TIMEOUT_MS = 90_000;

  const heartbeatInterval = setInterval(() => {
    const now = Date.now();
    for (const [clientId, client] of clients) {
      if (now - client.lastPing > STALE_CLIENT_TIMEOUT_MS) {
        logger.debug({ clientId }, "Terminating stale WebSocket client");
        client.ws.terminate();
        clients.delete(clientId);
        continue;
      }
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({ type: "ping", timestamp: now }));
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  heartbeatInterval.unref();

  logger.info("WebSocket server initialized at /ws");
}

export function publish(channel: string, event: string, data: unknown): void {
  if (!wss) return;

  const message: ChannelMessage = {
    channel,
    event,
    data,
    timestamp: Date.now(),
  };

  const payload = JSON.stringify({ type: "message", ...message });

  for (const client of clients.values()) {
    if (client.channels.has(channel) && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(payload);
      } catch (err) {
        logger.warn({ err }, "Failed to send WebSocket message");
      }
    }
  }
}

export function getConnectedClientCount(): number {
  return clients.size;
}

export function getWsStats(): { connections: number; channels: number; messagesPerMinute: number } {
  return {
    connections: clients.size,
    channels: Object.keys(WS_CHANNELS).length,
    messagesPerMinute: 0,
  };
}

export const WS_CHANNELS = {
  HEALTH: "health",
  INCIDENTS: "incidents",
  AEGIS_INCIDENTS: "aegis-incidents",
  METRICS: "metrics",
  NOTIFICATIONS: "notifications",
  FEATURE_FLAGS: "feature-flags",
  JOB_QUEUE: "job-queue",
  WORKFLOW_RUNS: "workflow-runs",
  VESSEL_POSITIONS: "vessel-positions",
  TERRA_SIGNALS: "terra-signals",
  LYTE_METRICS: "lyte-metrics",
  BOOKINGS: "bookings",
} as const;
