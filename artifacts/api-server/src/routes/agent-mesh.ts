import { Router, type IRouter, type Request, type Response } from "express";
import { db, agentMeshDriftSnapshotsTable } from "@szl-holdings/db";
import { and, eq, sql } from "drizzle-orm";
import { runMeshScan, loadMeshState } from "../services/agent-mesh-collector";
import {
  getGatewayLiveSummary,
  getGatewayLatencyBreakdown,
  type GatewayLiveSummaryFilters,
} from "./mcp-gateway";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { gatewayEventBus, type GatewayEventPayload } from "../lib/gateway-event-bus";

const router: IRouter = Router();

const VALID_GATEWAY_DECISIONS = new Set(["allowed", "logged", "blocked", "quarantined"] as const);
type GatewayDecisionFilter = GatewayLiveSummaryFilters["decision"];

function readQueryString(req: Request, key: string): string | undefined {
  const raw = req.query[key];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function approverLabelFromUser(
  user: { displayName?: string | null; email?: string | null } | undefined,
): string {
  const name = user?.displayName?.trim();
  const email = user?.email?.trim();
  if (name && email && name !== email) return `${name} (${email})`;
  return name || email || "operator";
}

function orgIdFromReq(req: Request): number | null {
  const u = req.user as { orgId?: number | string } | undefined;
  if (!u?.orgId) return null;
  const n = typeof u.orgId === "string" ? parseInt(u.orgId, 10) : u.orgId;
  return Number.isFinite(n) ? n : null;
}

router.get("/agent-mesh/state", async (req: Request, res: Response) => {
  try {
    const state = await loadMeshState(orgIdFromReq(req));
    res.json(state);
  } catch (err) {
    logger.warn({ err }, "[agent-mesh] state failed");
    res.status(500).json({ error: "agent-mesh state unavailable" });
  }
});

router.get("/agent-mesh/index", async (req: Request, res: Response) => {
  try {
    const state = await loadMeshState(orgIdFromReq(req));
    if (!state.resilienceIndex) {
      res.status(404).json({ error: "no resilience index — run /agent-mesh/scan first" });
      return;
    }
    res.json(state.resilienceIndex);
  } catch (err) {
    logger.warn({ err }, "[agent-mesh] index failed");
    res.status(500).json({ error: "index unavailable" });
  }
});

router.get("/agent-mesh/gateway", async (req: Request, res: Response) => {
  try {
    const limitRaw = Number(req.query["limit"]);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;
    const filters: GatewayLiveSummaryFilters = {};
    const decisionRaw = readQueryString(req, "decision");
    if (decisionRaw && VALID_GATEWAY_DECISIONS.has(decisionRaw as GatewayDecisionFilter as never)) {
      filters.decision = decisionRaw as GatewayDecisionFilter;
    }
    const agentClass = readQueryString(req, "agentClass");
    if (agentClass) filters.agentClass = agentClass;
    const ruleId = readQueryString(req, "ruleId");
    if (ruleId) filters.ruleId = ruleId;
    const summary = await getGatewayLiveSummary(limit, filters);
    res.json(summary);
  } catch (err) {
    logger.warn({ err }, "[agent-mesh] gateway summary failed");
    res.status(500).json({ error: "agent-mesh gateway unavailable" });
  }
});

router.get("/agent-mesh/gateway/stream", (req: Request, res: Response) => {
  // SSE push channel for newly persisted gateway events. The Containment
  // Rules dashboard subscribes here so filtered views update instantly
  // instead of waiting for the next 30s poll. Optional query params
  // (decision, agentClass, ruleId) match the /agent-mesh/gateway filters
  // so each subscriber only receives events relevant to its current view.
  try {
    const decisionRaw = readQueryString(req, "decision");
    const decisionFilter = decisionRaw && VALID_GATEWAY_DECISIONS.has(decisionRaw as GatewayDecisionFilter as never)
      ? (decisionRaw as GatewayDecisionFilter)
      : undefined;
    const agentClassFilter = readQueryString(req, "agentClass");
    const ruleIdFilter = readQueryString(req, "ruleId");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    res.write(`event: connected\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);

    const matches = (e: GatewayEventPayload): boolean => {
      if (decisionFilter && e.decision !== decisionFilter) return false;
      if (agentClassFilter && e.agentClass !== agentClassFilter) return false;
      if (ruleIdFilter && e.ruleId !== ruleIdFilter) return false;
      return true;
    };

    const unsubscribe = gatewayEventBus.onEvent((e) => {
      if (res.writableEnded) return;
      if (!matches(e)) return;
      try {
        res.write(`event: gateway-event\ndata: ${JSON.stringify(e)}\n\n`);
      } catch {
        /* ignore write errors — close handler will clean up */
      }
    });

    const heartbeat = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(heartbeat);
        unsubscribe();
        return;
      }
      res.write(": heartbeat\n\n");
    }, 25_000);

    const cleanup = () => {
      clearInterval(heartbeat);
      unsubscribe();
    };
    req.on("close", cleanup);
    req.on("error", cleanup);
  } catch (err) {
    logger.warn({ err }, "[agent-mesh] gateway stream failed to start");
    if (!res.headersSent) {
      res.status(500).json({ error: "agent-mesh gateway stream unavailable" });
    } else {
      res.end();
    }
  }
});

router.get("/agent-mesh/gateway/latency", async (req: Request, res: Response) => {
  try {
    const hoursRaw = Number(req.query["hours"]);
    const windowHours = Number.isFinite(hoursRaw) && hoursRaw > 0 && hoursRaw <= 24 * 30
      ? hoursRaw
      : 24;
    const breakdown = await getGatewayLatencyBreakdown(windowHours);
    res.json(breakdown);
  } catch (err) {
    logger.warn({ err }, "[agent-mesh] gateway latency breakdown failed");
    res.status(500).json({ error: "agent-mesh gateway latency unavailable" });
  }
});

router.post(
  "/agent-mesh/drift/:id/approve",
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params["id"] ?? "").trim();
      if (!id) {
        res.status(400).json({ error: "drift snapshot id required" });
        return;
      }

      const orgId = orgIdFromReq(req);
      const approver = approverLabelFromUser(req.user);

      const result = await db
        .update(agentMeshDriftSnapshotsTable)
        .set({ policyApproved: true, approvedBy: approver })
        .where(
          and(
            eq(agentMeshDriftSnapshotsTable.id, id),
            orgId == null
              ? sql`${agentMeshDriftSnapshotsTable.orgId} IS NULL`
              : eq(agentMeshDriftSnapshotsTable.orgId, orgId),
          ),
        )
        .returning({
          id: agentMeshDriftSnapshotsTable.id,
          policyApproved: agentMeshDriftSnapshotsTable.policyApproved,
          approvedBy: agentMeshDriftSnapshotsTable.approvedBy,
          changedBy: agentMeshDriftSnapshotsTable.changedBy,
          configFile: agentMeshDriftSnapshotsTable.configFile,
        });

      const row = result[0];
      if (!row) {
        res.status(404).json({ error: "drift snapshot not found" });
        return;
      }

      logger.info(
        { driftId: id, approvedBy: approver, configFile: row.configFile },
        "[agent-mesh] drift approved",
      );

      res.json({
        id: row.id,
        policyApproved: row.policyApproved,
        approvedBy: row.approvedBy,
        changedBy: row.changedBy,
        configFile: row.configFile,
      });
    } catch (err) {
      logger.warn({ err }, "[agent-mesh] drift approve failed");
      res.status(500).json({ error: "drift approval failed" });
    }
  },
);

router.post("/agent-mesh/scan", async (req: Request, res: Response) => {
  try {
    const extraPaths = Array.isArray(req.body?.paths) ? (req.body.paths as string[]) : [];
    const result = await runMeshScan({ extraPaths, orgId: orgIdFromReq(req) });
    res.json(result);
  } catch (err) {
    logger.error({ err }, "[agent-mesh] scan failed");
    res.status(500).json({ error: "scan failed" });
  }
});

export default router;
