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
  seq: number;
  tenantId?: string | null;
}

interface SubscribedClient {
  ws: WebSocket;
  channels: Set<string>;
  lastPing: number;
  platformRole: string | null;
  userId: string | null;
  tenantId: string | null;
  lastSeqByChannel: Map<string, number>;
  sendBuffer: string[];
  rateLimitBucket: { count: number; windowStart: number };
  isSlowConsumer: boolean;
}

const MAX_WS_CLIENTS = 500;
const MAX_BUFFER_SIZE = 100;
const RATE_LIMIT_PER_MIN = 300;
const RATE_LIMIT_WINDOW_MS = 60_000;

const clients = new Map<string, SubscribedClient>();
let wss: WebSocketServer | null = null;

let globalSeq = 0;
function nextSeq(): number {
  return ++globalSeq;
}

const MESSAGE_HISTORY_SIZE = 500;
const messageHistory: ChannelMessage[] = [];

function recordHistory(msg: ChannelMessage): void {
  messageHistory.push(msg);
  if (messageHistory.length > MESSAGE_HISTORY_SIZE) {
    messageHistory.shift();
  }
}

export function getMessagesSince(channel: string, sinceSeq: number, limit = 100): ChannelMessage[] {
  return messageHistory
    .filter((m) => m.channel === channel && m.seq > sinceSeq)
    .slice(-limit);
}

const presenceMap = new Map<string, Map<string, { userId: string; displayName?: string; since: number }>>();

function addPresence(channel: string, clientId: string, userId: string, displayName?: string): void {
  if (!presenceMap.has(channel)) presenceMap.set(channel, new Map());
  presenceMap.get(channel)!.set(clientId, { userId, displayName, since: Date.now() });
  broadcastPresence(channel);
}

function removePresence(clientId: string): void {
  for (const [channel, channelPresence] of presenceMap) {
    if (channelPresence.has(clientId)) {
      channelPresence.delete(clientId);
      broadcastPresence(channel);
    }
  }
}

export function getPresence(channel: string): Array<{ userId: string; displayName?: string; since: number }> {
  const map = presenceMap.get(channel);
  if (!map) return [];
  return Array.from(map.values());
}

function broadcastPresence(channel: string): void {
  const presence = getPresence(channel);
  const payload = JSON.stringify({
    type: "presence",
    channel,
    data: { count: presence.length, users: presence },
    timestamp: Date.now(),
  });
  for (const client of clients.values()) {
    if (client.channels.has(channel) && client.ws.readyState === WebSocket.OPEN) {
      try { client.ws.send(payload); } catch { /* ignore */ }
    }
  }
}

export const SENSITIVE_CHANNELS = new Set([
  "aegis-incidents",
  "aegis:alert-feed",
  "workflow-runs",
  "bookings",
  "lyte-metrics",
  "lyte:metrics-stream",
  "vessel-positions",
  "vessels:fleet-positions",
  "terra-signals",
  "nexus:intelligence-feed",
  "monte-carlo:progress",
]);

export const PUBLIC_CHANNELS = new Set([
  "health",
  "notifications",
  "feature-flags",
]);

const CHANNEL_ALLOWED_ROLES: Record<string, Set<string>> = {
  "aegis-incidents": new Set(["founder_admin", "platform_admin", "operator", "analyst", "ops_manager"]),
  "aegis:alert-feed": new Set(["founder_admin", "platform_admin", "operator", "analyst", "ops_manager"]),
  "workflow-runs": new Set(["founder_admin", "platform_admin", "operator", "ops_manager"]),
  "bookings": new Set(["founder_admin", "platform_admin", "service_coordinator", "sales_delivery_user"]),
  "lyte-metrics": new Set(["founder_admin", "platform_admin", "operator", "ops_manager", "analyst"]),
  "lyte:metrics-stream": new Set(["founder_admin", "platform_admin", "operator", "ops_manager", "analyst"]),
  "vessel-positions": new Set(["founder_admin", "platform_admin", "maritime_ops_user", "ops_manager", "operator"]),
  "vessels:fleet-positions": new Set(["founder_admin", "platform_admin", "maritime_ops_user", "ops_manager", "operator"]),
  "terra-signals": new Set(["founder_admin", "platform_admin", "sales_delivery_user", "analyst", "ops_manager"]),
  "nexus:intelligence-feed": new Set(["founder_admin", "platform_admin", "analyst", "ops_manager"]),
  "monte-carlo:progress": new Set(["founder_admin", "platform_admin", "super_admin", "admin", "operator", "analyst", "ops_manager"]),
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

export function issueWsTicket(userId: number | string, platformRole: string, tenantId?: string): string {
  const expiry = Date.now() + WS_TICKET_TTL_MS;
  const payload = `${userId}:${expiry}:${platformRole}:${tenantId ?? ""}`;
  const sig = signTicket(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

interface TicketClaims {
  userId: string;
  platformRole: string;
  tenantId: string | null;
}

function verifyWsTicket(ticket: string): TicketClaims | null {
  try {
    const decoded = Buffer.from(ticket, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length < 4) return null;
    const sig = parts.pop()!;
    const tenantId = parts.pop() ?? null;
    const payload = parts.join(":");
    const expected = signTicket(payload);
    const expiry = parseInt(parts[1]!, 10);
    if (Date.now() > expiry) return null;
    const sigBuffer = Buffer.from(sig, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
    return { userId: parts[0]!, platformRole: parts[2]!, tenantId: tenantId || null };
  } catch {
    return null;
  }
}

interface ResolvedAuth {
  authorized: boolean;
  platformRole: string | null;
  userId: string | null;
  tenantId: string | null;
}

async function resolveToken(token: string): Promise<ResolvedAuth> {
  if (INTERNAL_TOKEN && token === INTERNAL_TOKEN) {
    return { authorized: true, platformRole: "founder_admin", userId: "0", tenantId: null };
  }
  const claims = verifyWsTicket(token);
  if (claims) {
    return { authorized: true, platformRole: claims.platformRole, userId: claims.userId, tenantId: claims.tenantId };
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
    if (row) return { authorized: true, platformRole: row.platformRole ?? null, userId: String(row.userId), tenantId: null };
  } catch {
    /* ignore db errors */
  }
  return { authorized: false, platformRole: null, userId: null, tenantId: null };
}

function isRoleAllowedForChannel(platformRole: string | null, channel: string): boolean {
  const allowed = CHANNEL_ALLOWED_ROLES[channel];
  if (!allowed) return !SENSITIVE_CHANNELS.has(channel);
  if (!platformRole) return false;
  return allowed.has(platformRole);
}

function isRateLimited(client: SubscribedClient): boolean {
  const now = Date.now();
  const bucket = client.rateLimitBucket;
  if (now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    bucket.count = 1;
    bucket.windowStart = now;
    return false;
  }
  if (bucket.count >= RATE_LIMIT_PER_MIN) return true;
  bucket.count++;
  return false;
}

function sendToClient(clientId: string, client: SubscribedClient, payload: string): void {
  if (client.ws.readyState !== WebSocket.OPEN) return;
  if (client.isSlowConsumer) {
    if (client.sendBuffer.length < MAX_BUFFER_SIZE) {
      client.sendBuffer.push(payload);
    }
    return;
  }
  try {
    client.ws.send(payload, (err) => {
      if (err) {
        logger.warn({ clientId, err }, "WS send error — buffering");
        client.isSlowConsumer = true;
        if (client.sendBuffer.length < MAX_BUFFER_SIZE) {
          client.sendBuffer.push(payload);
        }
      }
    });
  } catch {
    client.isSlowConsumer = true;
  }
}

function drainBuffer(clientId: string, client: SubscribedClient): void {
  if (!client.isSlowConsumer || client.sendBuffer.length === 0) return;
  const batch = client.sendBuffer.splice(0, 10);
  let allSent = true;
  for (const payload of batch) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(payload);
      } catch {
        client.sendBuffer.unshift(...batch.slice(batch.indexOf(payload)));
        allSent = false;
        break;
      }
    }
  }
  if (allSent && client.sendBuffer.length === 0) {
    client.isSlowConsumer = false;
    logger.debug({ clientId }, "WS client buffer drained — resumed normal delivery");
  }
}

let totalPublished = 0;
let totalConnections = 0;
const publishedPerChannel = new Map<string, number>();
const GLOBAL_ADMIN_ROLES = new Set(["founder_admin", "platform_admin"]);

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    if (clients.size >= MAX_WS_CLIENTS) {
      logger.warn({ clientCount: clients.size, maxClients: MAX_WS_CLIENTS }, "WebSocket: max client limit reached, rejecting connection");
      ws.close(1013, "Server overloaded — try again later");
      return;
    }

    totalConnections++;
    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const client: SubscribedClient = {
      ws,
      channels: new Set(),
      lastPing: Date.now(),
      platformRole: null,
      userId: null,
      tenantId: null,
      lastSeqByChannel: new Map(),
      sendBuffer: [],
      rateLimitBucket: { count: 0, windowStart: Date.now() },
      isSlowConsumer: false,
    };
    clients.set(clientId, client);

    logger.debug({ clientId, ip: req.socket.remoteAddress }, "WebSocket client connected");

    ws.on("message", async (raw) => {
      if (isRateLimited(client)) {
        ws.send(JSON.stringify({ type: "error", code: "rate_limited", message: "Too many messages — slow down" }));
        return;
      }

      try {
        const msg = JSON.parse(raw.toString()) as {
          type: string;
          channel?: string;
          token?: string;
          sinceSeq?: number;
          displayName?: string;
        };

        if (msg.type === "subscribe" && msg.channel) {
          const isSensitive = SENSITIVE_CHANNELS.has(msg.channel);

          if (isSensitive) {
            const token = msg.token;
            if (!token) {
              ws.send(JSON.stringify({ type: "error", code: "unauthorized", message: `Channel ${msg.channel} requires auth` }));
              return;
            }
            const auth = await resolveToken(token);
            if (!auth.authorized) {
              ws.send(JSON.stringify({ type: "error", code: "unauthorized", message: `Invalid or expired token for channel ${msg.channel}` }));
              return;
            }
            if (!isRoleAllowedForChannel(auth.platformRole, msg.channel)) {
              ws.send(JSON.stringify({ type: "error", code: "forbidden", message: `Your role does not have access to channel ${msg.channel}` }));
              return;
            }
            client.platformRole = auth.platformRole;
            client.userId = auth.userId;
            client.tenantId = auth.tenantId;
          }

          client.channels.add(msg.channel);

          if (client.userId) {
            addPresence(msg.channel, clientId, client.userId, msg.displayName);
          }

          const sinceSeq = msg.sinceSeq ?? 0;
          const missed = sinceSeq > 0 ? getMessagesSince(msg.channel, sinceSeq, 50) : [];

          ws.send(JSON.stringify({
            type: "subscribed",
            channel: msg.channel,
            currentSeq: globalSeq,
            missedMessages: missed,
          }));

          logger.debug({ clientId, channel: msg.channel }, "Client subscribed");

        } else if (msg.type === "unsubscribe" && msg.channel) {
          client.channels.delete(msg.channel);
          removePresenceForChannel(clientId, msg.channel);
          ws.send(JSON.stringify({ type: "unsubscribed", channel: msg.channel }));

        } else if (msg.type === "ping") {
          client.lastPing = Date.now();
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));

        } else if (msg.type === "catchup" && msg.channel && msg.sinceSeq !== undefined) {
          const missed = getMessagesSince(msg.channel, msg.sinceSeq, 100);
          ws.send(JSON.stringify({ type: "catchup_response", channel: msg.channel, messages: missed }));
        }
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      clients.delete(clientId);
      removePresence(clientId);
      logger.debug({ clientId }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.warn({ clientId, err }, "WebSocket client error");
      clients.delete(clientId);
      removePresence(clientId);
    });

    ws.send(JSON.stringify({ type: "connected", clientId, timestamp: Date.now(), serverSeq: globalSeq }));
  });

  const HEARTBEAT_INTERVAL_MS = 30_000;
  const STALE_CLIENT_TIMEOUT_MS = 90_000;
  const DRAIN_INTERVAL_MS = 5_000;

  const heartbeatInterval = setInterval(() => {
    const now = Date.now();
    for (const [clientId, client] of clients) {
      if (now - client.lastPing > STALE_CLIENT_TIMEOUT_MS) {
        logger.debug({ clientId }, "Terminating stale WebSocket client");
        client.ws.terminate();
        clients.delete(clientId);
        removePresence(clientId);
        continue;
      }
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({ type: "ping", timestamp: now }));
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  const drainInterval = setInterval(() => {
    for (const [clientId, client] of clients) {
      if (client.isSlowConsumer && client.sendBuffer.length > 0) {
        drainBuffer(clientId, client);
      }
    }
  }, DRAIN_INTERVAL_MS);

  heartbeatInterval.unref();
  drainInterval.unref();

  logger.info("WebSocket server initialized at /ws");
}

function removePresenceForChannel(clientId: string, channel: string): void {
  const channelPresence = presenceMap.get(channel);
  if (channelPresence?.has(clientId)) {
    channelPresence.delete(clientId);
    broadcastPresence(channel);
  }
}

export function publish(channel: string, event: string, data: unknown, tenantId?: string | null): void {
  if (!wss) return;

  totalPublished++;
  publishedPerChannel.set(channel, (publishedPerChannel.get(channel) ?? 0) + 1);

  const seq = nextSeq();
  const message: ChannelMessage = {
    channel,
    event,
    data,
    timestamp: Date.now(),
    seq,
    tenantId: tenantId ?? null,
  };

  recordHistory(message);

  const payload = JSON.stringify({ type: "message", ...message });

  for (const [clientId, client] of clients) {
    if (!client.channels.has(channel)) continue;

    if (tenantId != null) {
      const isGlobalAdmin = client.tenantId === null && GLOBAL_ADMIN_ROLES.has(client.platformRole ?? "");
      if (!isGlobalAdmin && client.tenantId !== tenantId) continue;
    } else if (channel === "monte-carlo:progress") {
      const isGlobalAdmin = GLOBAL_ADMIN_ROLES.has(client.platformRole ?? "");
      if (!isGlobalAdmin) continue;
    }

    sendToClient(clientId, client, payload);
    client.lastSeqByChannel.set(channel, seq);
  }
}

export function getConnectedClientCount(): number {
  return clients.size;
}

const startTime = Date.now();
let throughputSamples: { ts: number; count: number }[] = [];
let lastThroughputCount = 0;

export function getWsStats() {
  const now = Date.now();

  const currentCount = totalPublished;
  throughputSamples.push({ ts: now, count: currentCount - lastThroughputCount });
  lastThroughputCount = currentCount;
  throughputSamples = throughputSamples.filter((s) => now - s.ts < 60_000);

  const msgsPerMin = throughputSamples.reduce((sum, s) => sum + s.count, 0);

  const channelSubscriptions: Record<string, number> = {};
  for (const client of clients.values()) {
    for (const ch of client.channels) {
      channelSubscriptions[ch] = (channelSubscriptions[ch] ?? 0) + 1;
    }
  }

  const presenceSummary: Record<string, number> = {};
  for (const [ch, map] of presenceMap) {
    if (map.size > 0) presenceSummary[ch] = map.size;
  }

  const slowConsumers = Array.from(clients.values()).filter((c) => c.isSlowConsumer).length;

  return {
    connections: clients.size,
    totalConnectionsEver: totalConnections,
    channels: Object.keys(WS_CHANNELS).length,
    messagesPerMinute: msgsPerMin,
    totalPublished,
    historySize: messageHistory.length,
    channelSubscriptions,
    presenceSummary,
    slowConsumers,
    uptimeSecs: Math.round((Date.now() - startTime) / 1000),
  };
}

export const WS_CHANNELS = {
  HEALTH: "health",
  INCIDENTS: "incidents",
  AEGIS_INCIDENTS: "aegis-incidents",
  AEGIS_ALERT_FEED: "aegis:alert-feed",
  METRICS: "metrics",
  NOTIFICATIONS: "notifications",
  FEATURE_FLAGS: "feature-flags",
  JOB_QUEUE: "job-queue",
  WORKFLOW_RUNS: "workflow-runs",
  VESSEL_POSITIONS: "vessel-positions",
  VESSELS_FLEET_POSITIONS: "vessels:fleet-positions",
  TERRA_SIGNALS: "terra-signals",
  LYTE_METRICS: "lyte-metrics",
  LYTE_METRICS_STREAM: "lyte:metrics-stream",
  BOOKINGS: "bookings",
  NEXUS_INTELLIGENCE_FEED: "nexus:intelligence-feed",
  MONTE_CARLO_PROGRESS: "monte-carlo:progress",
} as const;
