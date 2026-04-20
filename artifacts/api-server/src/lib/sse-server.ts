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

  attachSseClient(req, res, channel);
}

/**
 * Attach an already-authenticated request to the SSE registry on a fixed
 * channel. Used by purpose-built endpoints (e.g. /api/guardian/ledger/stream)
 * that have already enforced their own auth/role checks via Express
 * middleware and just need the SSE plumbing.
 *
 * `opts.tenantId` overrides the tenant scope used for delivery filtering by
 * `publishToSse`. Pass `null` (or omit) to leave the client unscoped — those
 * clients act as "see-all" subscribers (typically admins). Pass a string to
 * restrict the client to events published with the matching tenant id.
 */
export function attachSseClient(
  req: Request,
  res: Response,
  channel: string,
  opts?: { tenantId?: string | null },
): void {
  const user = (req as Request & { user?: { id: number; platformRole?: string; tenantId?: string } }).user;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  totalSseConnections++;
  const clientId = `sse-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tenantOverrideProvided = opts !== undefined && Object.prototype.hasOwnProperty.call(opts, "tenantId");
  const tenantId = tenantOverrideProvided
    ? (opts!.tenantId ?? null)
    : ((user as { tenantId?: string } | undefined)?.tenantId ?? null);
  const client: SseClient = {
    res,
    channel,
    userId: user ? String(user.id) : null,
    platformRole: (user as { platformRole?: string } | undefined)?.platformRole ?? null,
    tenantId,
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
  opts?: { adminOnly?: boolean },
): void {
  const adminOnly = opts?.adminOnly === true;
  for (const [clientId, client] of sseClients) {
    if (client.channel !== channel) continue;
    // Admin-only events: only deliver to clients that are unscoped (admins).
    // A scoped client (non-admin) MUST NOT receive admin-only events even if
    // a tenantId was also supplied.
    if (adminOnly && client.tenantId !== null) continue;
    // Tenant-scoped delivery: a publish targeted at tenant X must NOT reach a
    // client scoped to tenant Y. Unscoped clients (admins) still receive it.
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
