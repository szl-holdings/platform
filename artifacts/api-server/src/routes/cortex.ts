/**
 * CORTEX Voice — AI command routing via multi-agent orchestrator.
 *
 * POST /cortex/query — route a natural-language command to the relevant
 *   domain agent(s) and return a synthesized response with confidence score,
 *   routing metadata, and suggested follow-up actions.
 */

import { Router, type IRouter } from "express";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { perUserWriteSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { orchestrate } from "../lib/multi-agent-orchestrator";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DOMAIN_ROUTE_KEYWORDS: Record<string, string[]> = {
  vessels: ["vessel", "ship", "fleet", "maritime", "cargo", "ais", "port", "charter"],
  firestorm: ["threat", "attack", "cve", "vulnerability", "incident", "security", "breach", "malware"],
  terra: ["property", "real estate", "cap rate", "distress", "portfolio", "land", "commercial", "residential"],
  lyte: ["slo", "latency", "incident", "service", "infrastructure", "deployment", "observability", "uptime"],
  inca: ["model", "experiment", "ai", "training", "benchmark", "research", "dataset", "neural"],
  msp: ["client", "ticket", "sla", "service desk", "managed service", "support"],
};

function inferDomains(query: string): string[] {
  const lower = query.toLowerCase();
  const matched: string[] = [];
  for (const [domain, keywords] of Object.entries(DOMAIN_ROUTE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(domain);
    }
  }
  return matched.length > 0 ? matched.slice(0, 3) : ["vessels", "firestorm", "terra"];
}

router.post(
  "/cortex/query",
  authMiddleware({ required: false }),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    const { query, sessionId, domains: requestedDomains } = req.body ?? {};

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      sendBadRequest(res, "query is required");
      return;
    }

    if (query.length > 1000) {
      sendBadRequest(res, "query too long (max 1000 characters)");
      return;
    }

    try {
      const domains = Array.isArray(requestedDomains) && requestedDomains.length > 0
        ? requestedDomains
        : inferDomains(query);

      logger.info({ query: query.substring(0, 100), domains, sessionId }, "[CORTEX] Processing query");

      const result = await orchestrate({
        query: query.trim(),
        domains,
        depth: "standard",
        sessionId,
      });

      const routingMetadata = {
        inferredDomains: domains,
        agentSteps: result.steps.map((s) => ({
          domain: s.domain,
          task: s.task,
          status: s.status,
          durationMs: s.durationMs,
        })),
        totalTokens: result.totalTokens,
        totalCostUsd: result.totalCostUsd,
      };

      const suggestedActions: Array<{ label: string; path: string }> = [];
      if (domains.includes("vessels")) suggestedActions.push({ label: "Open Fleet Command", path: "/vessels/" });
      if (domains.includes("firestorm")) suggestedActions.push({ label: "Open SOC Command", path: "/firestorm/" });
      if (domains.includes("terra")) suggestedActions.push({ label: "Open Terra Intelligence", path: "/terra/" });
      if (domains.includes("lyte")) suggestedActions.push({ label: "Open Lyte Command", path: "/lyte-command-center/" });

      sendSuccess(res, {
        orchestrationId: result.orchestrationId,
        query,
        summary: result.synthesis,
        confidence: result.confidence,
        status: result.status,
        domains,
        routing: routingMetadata,
        actions: suggestedActions.slice(0, 3),
        durationMs: result.totalDurationMs,
      });
    } catch (err) {
      handleRouteError(res, err, "CORTEX query failed");
    }
  }
);

router.get(
  "/cortex/domains",
  authMiddleware({ required: false }),
  (_req, res) => {
    sendSuccess(res, {
      domains: Object.entries(DOMAIN_ROUTE_KEYWORDS).map(([id, keywords]) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        keywords: keywords.slice(0, 4),
      })),
    });
  }
);

export default router;
