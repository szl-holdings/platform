import { Router, type Request, type Response } from "express";
import { validateQuery, listQuerySchema } from "../lib/validation.js";
import { handleSseConnection, getSseStats } from "../lib/sse-server";
import { getWsStats, getPresence, getMessagesSince } from "../lib/websocket";
import { getPrismBridgeStats } from "../lib/prism-bus-bridge";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/realtime/sse", (req: Request, res: Response) => {
  handleSseConnection(req, res);
});

router.get("/realtime/health", async (_req: Request, res: Response) => {
  try {
    const wsStats = getWsStats();
    const sseStats = getSseStats();
    const bridgeStats = getPrismBridgeStats();

    const totalConnections = wsStats.connections + sseStats.connections;
    const anomalies: string[] = [];

    if (wsStats.slowConsumers > 0) {
      anomalies.push(`${wsStats.slowConsumers} slow consumer(s) with buffered messages`);
    }
    if (wsStats.messagesPerMinute > 10_000) {
      anomalies.push(`High throughput: ${wsStats.messagesPerMinute} msg/min`);
    }

    res.json({
      status: anomalies.length === 0 ? "healthy" : "warning",
      timestamp: new Date().toISOString(),
      websocket: {
        connections: wsStats.connections,
        totalConnectionsEver: wsStats.totalConnectionsEver,
        messagesPerMinute: wsStats.messagesPerMinute,
        totalPublished: wsStats.totalPublished,
        historySize: wsStats.historySize,
        slowConsumers: wsStats.slowConsumers,
        channelSubscriptions: wsStats.channelSubscriptions,
        presence: wsStats.presenceSummary,
        uptimeSecs: wsStats.uptimeSecs,
      },
      sse: sseStats,
      bridge: bridgeStats,
      totalConnections,
      anomalies,
    });
  } catch (err) {
    logger.error({ err }, "Error generating realtime health stats");
    res.status(500).json({ error: "Failed to get realtime stats" });
  }
});

router.get("/realtime/presence/:channel", authMiddleware({ required: false }), (req: Request, res: Response) => {
  const { channel } = req.params;
  const presence = getPresence(channel as string);
  res.json({
    channel,
    count: presence.length,
    users: presence.map((u) => ({ userId: u.userId, since: u.since })),
    timestamp: new Date().toISOString(),
  });
});

router.get("/realtime/history/:channel", authMiddleware({ required: true }), validateQuery(listQuerySchema), (req: Request, res: Response) => {
  const { channel } = req.params;
  const sinceSeq = parseInt(req.query["since"] as string ?? "0", 10);
  const limit = Math.min(parseInt(req.query["limit"] as string ?? "50", 10), 200);
  const messages = getMessagesSince(channel as string, sinceSeq || 0, limit);
  res.json({
    channel,
    messages,
    count: messages.length,
    timestamp: new Date().toISOString(),
  });
});

export default router;
