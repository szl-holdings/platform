import type { Request, Response } from "express";
import { logger } from "./logger";
import { SENSITIVE_CHANNELS, PUBLIC_CHANNELS } from "./websocket";

interface SseClient {
  res: Response;
  channel: string;
  userId: string | null;
  platformRole: string | null;
  tenantId: string | null;
  connectedAt: number;
}

const sseClients = new Map<string, SseClient>();
let totalSseConnections = 0;

export function handleSseConnection(req: Request, res: Response): void {
  const channel = req.query["channel"] as string | undefined;
  if (!channel) {
    res.status(400).json({ error: "Missing channel parameter" });
    return;
  }

  const isSensitive = SENSITIVE_CHANNELS.has(channel);
  if (isSensitive && !req.isAuthenticated?.()) {
    const user = (req as Request & { user?: { id: number; platformRole?: string } }).user;
    if (!user) {
      res.status(401).json({ error: "Authentication required for this channel" });
      return;
    }
  }

  const user = (req as Request & { user?: { id: number; platformRole?: string; tenantId?: string } }).user;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  totalSseConnections++;
  const clientId = `sse-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const client: SseClient = {
    res,
    channel,
    userId: user ? String(user.id) : null,
    platformRole: (user as { platformRole?: string } | undefined)?.platformRole ?? null,
    tenantId: (user as { tenantId?: string } | undefined)?.tenantId ?? null,
    connectedAt: Date.now(),
  };
  sseClients.set(clientId, client);

  sendSseEvent(res, "connected", { clientId, channel, timestamp: Date.now() });

  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat);
      sseClients.delete(clientId);
      return;
    }
    res.write(": heartbeat\n\n");
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
    logger.debug({ clientId, channel }, "SSE client disconnected");
  });

  req.on("error", () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });

  logger.debug({ clientId, channel }, "SSE client connected");
}

function sendSseEvent(res: Response, event: string, data: unknown): void {
  try {
    if (!res.writableEnded) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  } catch {
    /* ignore write errors */
  }
}

export function publishToSse(
  channel: string,
  event: string,
  data: unknown,
  tenantId?: string | null,
): void {
  for (const [clientId, client] of sseClients) {
    if (client.channel !== channel) continue;
    if (tenantId && client.tenantId && client.tenantId !== tenantId) continue;
    if (client.res.writableEnded) {
      sseClients.delete(clientId);
      continue;
    }
    sendSseEvent(client.res, event, { channel, event, data, timestamp: Date.now() });
  }
}

export function getSseStats() {
  const channelCounts: Record<string, number> = {};
  for (const client of sseClients.values()) {
    channelCounts[client.channel] = (channelCounts[client.channel] ?? 0) + 1;
  }
  return {
    connections: sseClients.size,
    totalConnectionsEver: totalSseConnections,
    channelCounts,
  };
}
