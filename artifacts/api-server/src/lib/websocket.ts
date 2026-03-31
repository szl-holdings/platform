import type { IncomingMessage, Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { logger } from "./logger";

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
}

const MAX_WS_CLIENTS = 500;
const clients = new Map<string, SubscribedClient>();
let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    if (clients.size >= MAX_WS_CLIENTS) {
      logger.warn({ clientCount: clients.size, maxClients: MAX_WS_CLIENTS }, "WebSocket: max client limit reached, rejecting connection");
      ws.close(1013, "Server overloaded — try again later");
      return;
    }

    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const client: SubscribedClient = { ws, channels: new Set(), lastPing: Date.now() };
    clients.set(clientId, client);

    logger.debug({ clientId, ip: req.socket.remoteAddress }, "WebSocket client connected");

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type: string; channel?: string };
        if (msg.type === "subscribe" && msg.channel) {
          client.channels.add(msg.channel);
          ws.send(JSON.stringify({ type: "subscribed", channel: msg.channel }));
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

export const WS_CHANNELS = {
  HEALTH: "health",
  INCIDENTS: "incidents",
  METRICS: "metrics",
  NOTIFICATIONS: "notifications",
  FEATURE_FLAGS: "feature-flags",
  JOB_QUEUE: "job-queue",
} as const;
