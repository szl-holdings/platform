/**
 * Evidence Graph Read API
 *
 * Exposes the signal mesh evidence graph to any product surface.
 * Most routes are read-only and reflect state derived from the signal pipeline.
 * The exception is POST /evidence-graph/recommendations/:id/decision, which
 * lets operators record an Approve/Reject/Escalate/Defer decision on a
 * recommendation; that handler updates status, persists the decision, and
 * emits an outcome signal back into the mesh.
 *
 * Routes:
 *   GET /evidence-graph/recommendations          — list recommendations (filterable)
 *   GET /evidence-graph/recommendations/:id      — get one recommendation + evidence chain
 *   GET /evidence-graph/why/:entityId            — "why does the system believe X?" for entity
 *   GET /evidence-graph/signals                  — live signal bus snapshot
 *   GET /evidence-graph/entities                 — entity registry snapshot
 *   GET /evidence-graph/status                   — mesh health / counts
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  defaultEvidenceGraphQuery,
  defaultRecommendationStore,
  type RecommendationDecision,
} from "@szl-holdings/evidence-graph";
import { defaultSignalBus } from "@szl-holdings/signal-mesh";
import { defaultEntityRegistry } from "@workspace/ontology";
import type { Recommendation, EntitySnapshot } from "@workspace/ontology";
// Import Signal/createSignal directly from the Zod-based module to avoid the
// name collision in `@workspace/ontology` (signals.js vs signal.js).
import { createSignal, type Signal } from "@workspace/ontology/signal";
import { authMiddleware } from "../middlewares/auth";
import { perUserApiSlidingLimiter } from "../middlewares/sliding-window-limiter";
import {
  sendSuccess,
  sendNotFound,
  sendBadRequest,
  sendForbidden,
  handleRouteError,
} from "../lib/api-response";

import { anyQuerySchema, validateBody, validateQuery } from "../lib/validation";

const decisionBodySchema = z.object({
  decision: z.enum(["approve", "reject", "escalate", "defer"]),
  justification: z.string().trim().max(2000).optional(),
});
const router: IRouter = Router();
const auth = authMiddleware();
const rateLimit = perUserApiSlidingLimiter;

router.get("/evidence-graph/recommendations", validateQuery(anyQuerySchema), auth, rateLimit, (req, res) => {
  try {
    const { domain, status, limit, offset } = req.query as Record<string, string | undefined>;

    const recommendations = defaultEvidenceGraphQuery.listRecommendations({
      domain: domain as Recommendation["domain"] | undefined,
      status: status as Recommendation["status"] | undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    sendSuccess(res, {
      recommendations,
      total: recommendations.length,
      meta: { meshVersion: "1.0.0", retrievedAt: new Date().toISOString() },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to list recommendations");
  }
});

router.get("/evidence-graph/recommendations/:id", auth, rateLimit, (req, res) => {
  try {
    const { id } = req.params;
    if (!id) { sendNotFound(res, "Recommendation"); return; }

    const chain = defaultEvidenceGraphQuery.getEvidenceChain(id);
    if (!chain) { sendNotFound(res, "Recommendation"); return; }

    sendSuccess(res, {
      chain,
      meta: { meshVersion: "1.0.0", retrievedAt: new Date().toISOString() },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get recommendation");
  }
});

router.get("/evidence-graph/recommendations/:id/decisions", auth, rateLimit, (req, res) => {
  try {
    const { id } = req.params;
    if (!id) { sendNotFound(res, "Recommendation"); return; }
    const rec = defaultRecommendationStore.get(id);
    if (!rec) { sendNotFound(res, "Recommendation"); return; }

    sendSuccess(res, {
      decisions: defaultRecommendationStore.listDecisions(id),
      recommendationId: id,
      meta: { meshVersion: "1.0.0", retrievedAt: new Date().toISOString() },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to list decisions");
  }
});

const DECISION_TO_STATUS: Record<
  "approve" | "reject" | "escalate" | "defer",
  Recommendation["status"]
> = {
  approve: "accepted",
  reject: "rejected",
  // Escalate / defer keep the recommendation actionable but record the
  // operator's intervention via the decision log + outcome signal.
  escalate: "pending",
  defer: "pending",
};

router.post(
  "/evidence-graph/recommendations/:id/decision",
  auth,
  rateLimit,
  validateBody(decisionBodySchema),
  (req, res) => {
    try {
      const { id } = req.params;
      if (!id) { sendNotFound(res, "Recommendation"); return; }

      const rec = defaultRecommendationStore.get(id);
      if (!rec) { sendNotFound(res, "Recommendation"); return; }

      const { decision, justification } = req.body as z.infer<typeof decisionBodySchema>;
      const policyOutcome = rec.policyEvaluation.outcome;

      // Hard-block: operators cannot act from this surface; admins must override.
      if (policyOutcome === "block") {
        sendForbidden(
          res,
          "Recommendation is blocked by policy and cannot be actioned from Evidence Explorer.",
        );
        return;
      }

      // Approvals on require-approval policies must carry a written justification.
      const justificationRequired =
        decision === "approve" && policyOutcome === "require-approval";
      const trimmed = justification?.trim();
      if (justificationRequired && (!trimmed || trimmed.length < 4)) {
        sendBadRequest(
          res,
          "Policy requires a written justification (≥ 4 chars) to approve this recommendation.",
        );
        return;
      }

      const previousStatus = rec.status;
      const newStatus = DECISION_TO_STATUS[decision];

      // Don't clobber a terminal status with a no-op transition. A second
      // decision on an already-resolved rec is recorded but status sticks.
      const isTerminal = ["accepted", "rejected", "completed", "failed", "expired"]
        .includes(previousStatus);
      const effectiveStatus: Recommendation["status"] = isTerminal ? previousStatus : newStatus;
      if (!isTerminal && effectiveStatus !== previousStatus) {
        defaultRecommendationStore.updateStatus(id, effectiveStatus);
      }

      const actorId = req.user?.id?.toString() ?? "anonymous";
      const actorRole = req.user?.roles?.[0];
      const tenantId = req.user?.orgs?.[0]?.orgId?.toString();

      const decidedAt = new Date().toISOString();
      const record: RecommendationDecision = {
        decisionId: randomUUID(),
        recommendationId: id,
        decision,
        actorId,
        actorRole,
        justification: trimmed,
        policyOutcome,
        previousStatus,
        newStatus: effectiveStatus,
        decidedAt,
      };
      defaultRecommendationStore.recordDecision(record);

      // Emit an outcome signal so the action is captured by the audit /
      // telemetry pipeline and downstream consumers (analytics, Atlas, etc.).
      try {
        const outcome: Signal = createSignal({
          source: "human",
          type: "outcome",
          domain: rec.domain,
          occurredAt: decidedAt,
          freshness: 1,
          confidence: 1,
          severity: decision === "reject" || decision === "escalate" ? "high" : "info",
          entityRefs: rec.entityRefs,
          tenantId,
          rawPayload: {
            recommendationId: id,
            decision,
            decisionId: record.decisionId,
            previousStatus,
            newStatus: effectiveStatus,
            actorId,
            justification: trimmed,
            policyOutcome,
            sourceSurface: "evidence-explorer",
          },
          tags: [
            "recommendation-decision",
            `decision:${decision}`,
            `domain:${rec.domain}`,
          ],
          provenance: {
            sourceService: "api-server",
            correlationId: id,
          },
        });
        defaultSignalBus.publish(outcome);
      } catch (e) {
        // Signal emission must not block the operator action — log and continue.
        console.error("[evidence-graph] outcome signal publish failed:", e);
      }

      const chain = defaultEvidenceGraphQuery.getEvidenceChain(id);
      sendSuccess(res, {
        decision: record,
        recommendation: defaultRecommendationStore.get(id),
        chain,
        decisions: defaultRecommendationStore.listDecisions(id),
        meta: { meshVersion: "1.0.0", recordedAt: decidedAt },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to record decision");
    }
  },
);

router.get("/evidence-graph/why/:entityId", auth, rateLimit, (req, res) => {
  try {
    const { entityId } = req.params;
    if (!entityId) { sendNotFound(res, "Entity"); return; }

    const why = defaultEvidenceGraphQuery.why(entityId);
    sendSuccess(res, {
      why,
      meta: { meshVersion: "1.0.0", retrievedAt: new Date().toISOString() },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get entity evidence");
  }
});

router.get("/evidence-graph/signals", validateQuery(anyQuerySchema), auth, rateLimit, (req, res) => {
  try {
    const { domain, type, tenantId, limit } = req.query as Record<string, string | undefined>;

    const signals = defaultSignalBus.snapshot({
      domain: domain as Signal["domain"] | undefined,
      type: type as Signal["type"] | undefined,
      tenantId,
      limit: limit ? parseInt(limit, 10) : 100,
    });

    sendSuccess(res, {
      signals,
      total: signals.length,
      busCount: defaultSignalBus.count(),
      meta: { meshVersion: "1.0.0", retrievedAt: new Date().toISOString() },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get signals");
  }
});

router.get("/evidence-graph/entities", validateQuery(anyQuerySchema), auth, rateLimit, (req, res) => {
  try {
    const { domain, entityType, health } = req.query as Record<string, string | undefined>;

    const entities = defaultEntityRegistry.list({
      domain: domain as EntitySnapshot["domain"] | undefined,
      entityType: entityType as EntitySnapshot["entityType"] | undefined,
      health: health as EntitySnapshot["health"] | undefined,
    });

    sendSuccess(res, {
      entities,
      total: entities.length,
      meta: { meshVersion: "1.0.0", retrievedAt: new Date().toISOString() },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get entities");
  }
});

router.get("/evidence-graph/status", auth, rateLimit, (_req, res) => {
  try {
    const DOMAINS: Signal["domain"][] = ["maritime", "real-estate", "legal", "security", "finance", "platform", "ai"];
    const evidenceItems = defaultEvidenceGraphQuery.listEvidence({ limit: 5000 });
    const recommendations = defaultEvidenceGraphQuery.listRecommendations({ limit: 5000 });
    const entities = defaultEntityRegistry.list();

    sendSuccess(res, {
      status: "live",
      meshVersion: "1.0.0",
      counts: {
        signals: defaultSignalBus.count(),
        evidenceItems: evidenceItems.length,
        recommendations: recommendations.length,
        entities: entities.length,
      },
      domainBreakdown: {
        signals: Object.fromEntries(
          DOMAINS.map((d) => [d, defaultSignalBus.snapshot({ domain: d, limit: 10000 }).length]),
        ),
        recommendations: Object.fromEntries(
          DOMAINS.map((d) => [d, recommendations.filter((r) => r.domain === d).length]),
        ),
      },
      retrievedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get mesh status");
  }
});

/**
 * GET /evidence-graph/stream
 *
 * Server-Sent Events stream for the evidence graph.
 * Emits three event types as soon as they occur:
 *   - `signal`         — every signal published to the bus
 *   - `recommendation` — every recommendation save / status change
 *   - `status`         — periodic mesh counts (every 15s + on connect)
 *
 * Heartbeat comments are sent every 25s to keep proxies from closing the
 * connection.
 */
router.get("/evidence-graph/stream", auth, (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const write = (event: string, payload: unknown) => {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      // socket likely closed; cleanup will run via "close"
    }
  };

  const buildStatus = () => {
    const DOMAINS: Signal["domain"][] = ["maritime", "real-estate", "legal", "security", "finance", "platform", "ai"];
    const evidenceItems = defaultEvidenceGraphQuery.listEvidence({ limit: 5000 });
    const recommendations = defaultEvidenceGraphQuery.listRecommendations({ limit: 5000 });
    const entities = defaultEntityRegistry.list();
    return {
      status: "live",
      meshVersion: "1.0.0",
      counts: {
        signals: defaultSignalBus.count(),
        evidenceItems: evidenceItems.length,
        recommendations: recommendations.length,
        entities: entities.length,
      },
      domainBreakdown: {
        signals: Object.fromEntries(
          DOMAINS.map((d) => [d, defaultSignalBus.snapshot({ domain: d, limit: 10000 }).length]),
        ),
        recommendations: Object.fromEntries(
          DOMAINS.map((d) => [d, recommendations.filter((r) => r.domain === d).length]),
        ),
      },
      retrievedAt: new Date().toISOString(),
    };
  };

  // Initial status snapshot so clients reflect counts immediately.
  write("status", buildStatus());

  const signalSub = defaultSignalBus.on("*", (signal) => {
    write("signal", signal);
  });

  const recSub = defaultRecommendationStore.on(({ kind, recommendation }) => {
    write("recommendation", { kind, recommendation });
  });

  const statusInterval = setInterval(() => {
    write("status", buildStatus());
  }, 15_000);

  const heartbeat = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch { /* ignored */ }
  }, 25_000);

  req.on("close", () => {
    signalSub.unsubscribe();
    recSub.unsubscribe();
    clearInterval(statusInterval);
    clearInterval(heartbeat);
    try { res.end(); } catch { /* ignored */ }
  });
});

export default router;
