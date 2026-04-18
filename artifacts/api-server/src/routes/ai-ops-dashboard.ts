/**
 * AI Operations Dashboard
 *
 * Aggregated view of AI system health: cost, latency, quality metrics,
 * feedback rates, review queue status, and evaluator hook pass rates.
 *
 * Routes:
 *   GET  /ai/ops/summary         — Overall AI operations snapshot
 *   GET  /ai/ops/traces          — Paginated trace list with filters
 *   POST /ai/ops/traces/capture  — Manually capture a trace
 *   GET  /ai/ops/traces/:id      — Single trace detail
 *   PATCH /ai/ops/traces/:id/status — Update trace status
 *   GET  /ai/ops/review-queue/stats — Review queue statistics
 *   GET  /ai/ops/review-queue    — Review queue list with filters
 *   PATCH /ai/ops/review-queue/:id/claim    — Claim item for review
 *   PATCH /ai/ops/review-queue/:id/decision — Record review decision
 *   GET  /ai/ops/evaluators/stats — Aggregated evaluator hook stats
 *   GET  /ai/ops/evaluators      — Registered evaluator hooks
 */

import { Router, type IRouter } from "express";
import {
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  sendForbidden,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import type { AuthenticatedUser } from "../middlewares/auth";
import {
  captureTrace,
  getTrace as getTraceMemory,
  listTraces as listTracesMemory,
  updateTraceStatus,
  aggregateTraces as aggregateTracesMemory,
  listReviewQueue as listReviewQueueMemory,
  getReviewItem as getReviewItemMemory,
  recordReviewDecision,
  markInReview,
  getReviewQueueStats as getReviewQueueStatsMemory,
  listEvaluatorHooks,
  aggregateHookStats,
  enqueueForReview,
  type TraceDomain,
  type TraceStatus,
  type ReviewVerdict,
} from "@szl-holdings/ai-engine";
import {
  isDbAvailable,
  dbListTraces,
  dbGetTrace,
  dbAggregateTraces,
  dbListReviewQueue,
  dbGetReviewItem,
  dbGetReviewQueueStats,
  dbUpdateTraceStatus,
  dbMarkInReview,
  dbRecordReviewDecision,
} from "../lib/ai-evals-db-reader";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getOrgId(user?: AuthenticatedUser): number | undefined {
  return user?.orgs?.[0]?.orgId ?? undefined;
}

function parsePaginationInt(raw: string | undefined, defaultValue: number, max: number): number {
  if (raw == null || raw === "") return defaultValue;
  const n = Number(raw);
  if (!Number.isFinite(n) || Number.isNaN(n)) return defaultValue;
  const floored = Math.floor(n);
  if (floored < 0) return 0;
  if (floored > max) return max;
  return floored;
}

function isGlobalAdmin(user?: AuthenticatedUser): boolean {
  if (!user) return false;
  return user.roles.includes("super_admin") || user.roles.includes("admin");
}

function canAccessOrgResource(user: AuthenticatedUser | undefined, resourceOrgId: number | null | undefined): boolean {
  if (isGlobalAdmin(user)) return true;
  const userOrg = getOrgId(user);
  if (resourceOrgId == null) return false;
  return userOrg != null && userOrg === resourceOrgId;
}

function isMissingTenantScope(user: AuthenticatedUser | undefined): boolean {
  if (isGlobalAdmin(user)) return false;
  return getOrgId(user) == null;
}

router.get(
  "/ai/ops/summary",
  authMiddleware({ required: true }),
  requireRole("analyst", "operator", "admin", "super_admin"),
  async (req, res) => {
    try {
      if (isMissingTenantScope(req.user)) {
        sendForbidden(res, "No organization context — cannot scope AI ops data");
        return;
      }
      const orgId = getOrgId(req.user);
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [traceAggregates, reviewStats] = await Promise.all([
        isDbAvailable()
          ? dbAggregateTraces({ orgId, since })
          : Promise.resolve(aggregateTracesMemory({ orgId, since })),
        isDbAvailable()
          ? dbGetReviewQueueStats(orgId).then(s => s ?? getReviewQueueStatsMemory(orgId))
          : Promise.resolve(getReviewQueueStatsMemory(orgId)),
      ]);
      const hookStats = aggregateHookStats();

      const totalTraces = traceAggregates.reduce((s: number, a: typeof traceAggregates[0]) => s + a.totalTraces, 0);
      const totalCost = traceAggregates.reduce((s: number, a: typeof traceAggregates[0]) => s + a.totalCostUsd, 0);
      const totalReviewRequired = traceAggregates.reduce((s: number, a: typeof traceAggregates[0]) => s + a.reviewRequired, 0);
      const avgLatency = traceAggregates.length > 0
        ? traceAggregates.reduce((s: number, a: typeof traceAggregates[0]) => s + a.avgLatencyMs, 0) / traceAggregates.length
        : 0;
      const avgConfidence = traceAggregates.length > 0
        ? traceAggregates.reduce((s: number, a: typeof traceAggregates[0]) => s + a.avgConfidence, 0) / traceAggregates.length
        : 0;

      const evalPassRates = traceAggregates.filter((a: typeof traceAggregates[0]) => a.evalPassRate != null);
      const overallEvalPassRate = evalPassRates.length > 0
        ? evalPassRates.reduce((s: number, a: typeof traceAggregates[0]) => s + (a.evalPassRate ?? 0), 0) / evalPassRates.length
        : null;

      const adminView = isGlobalAdmin(req.user);
      const evaluatorsSection = adminView ? {
        registered: hookStats.length,
        avgPassRate: hookStats.length > 0
          ? Number((hookStats.reduce((s: number, h: typeof hookStats[0]) => s + h.passRate, 0) / hookStats.length).toFixed(3))
          : null,
      } : undefined;

      sendSuccess(res, {
        period: "last_24h",
        traces: {
          total: totalTraces,
          reviewRequired: totalReviewRequired,
          reviewRate: totalTraces > 0 ? totalReviewRequired / totalTraces : 0,
          avgLatencyMs: Math.round(avgLatency),
          avgConfidence: Number(avgConfidence.toFixed(3)),
          totalCostUsd: Number(totalCost.toFixed(4)),
          evalPassRate: overallEvalPassRate != null ? Number(overallEvalPassRate.toFixed(3)) : null,
        },
        byDomain: traceAggregates,
        reviewQueue: {
          total: reviewStats.total,
          pending: reviewStats.pending,
          inReview: reviewStats.inReview,
          escalated: reviewStats.escalated,
          criticalPending: reviewStats.byPriority.critical,
          highPending: reviewStats.byPriority.high,
        },
        ...(evaluatorsSection !== undefined ? { evaluators: evaluatorsSection } : {}),
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "GET /ai/ops/summary");
    }
  },
);

router.get(
  "/ai/ops/traces",
  authMiddleware({ required: true }),
  requireRole("analyst", "operator", "admin", "super_admin"),
  async (req, res) => {
    try {
      if (isMissingTenantScope(req.user)) {
        sendForbidden(res, "No organization context — cannot scope AI ops data");
        return;
      }
      const orgId = getOrgId(req.user);
      const domain = req.query["domain"] as string | undefined;
      const requiresReviewQ = req.query["requiresReview"] as string | undefined;
      const status = req.query["status"] as string | undefined;
      const riskLevel = req.query["riskLevel"] as string | undefined;
      const sinceQ = req.query["since"] as string | undefined;
      const untilQ = req.query["until"] as string | undefined;
      const limitQ = req.query["limit"] as string | undefined;
      const offsetQ = req.query["offset"] as string | undefined;

      const since = sinceQ ? new Date(sinceQ) : undefined;
      const until = untilQ ? new Date(untilQ) : undefined;

      if (since && isNaN(since.getTime())) {
        sendBadRequest(res, "Invalid 'since' date format — use ISO 8601");
        return;
      }
      if (until && isNaN(until.getTime())) {
        sendBadRequest(res, "Invalid 'until' date format — use ISO 8601");
        return;
      }

      const limit = parsePaginationInt(limitQ, 50, 200);
      const offset = parsePaginationInt(offsetQ, 0, Number.MAX_SAFE_INTEGER);
      const queryOpts = {
        orgId,
        domain: domain as TraceDomain | undefined,
        requiresReview: requiresReviewQ === "true" ? true : requiresReviewQ === "false" ? false : undefined,
        status: status as TraceStatus | undefined,
        riskLevel: riskLevel || undefined,
        since,
        until,
        limit,
        offset,
      };

      if (isDbAvailable()) {
        const { traces, total } = await dbListTraces(queryOpts);
        sendSuccess(res, { traces, count: traces.length, total, limit, offset });
        return;
      }

      const traces = listTracesMemory(queryOpts);
      sendSuccess(res, { traces, count: traces.length, limit, offset });
    } catch (err) {
      handleRouteError(res, err, "GET /ai/ops/traces");
    }
  },
);

router.post(
  "/ai/ops/traces/capture",
  authMiddleware({ required: true }),
  requireRole("operator", "admin", "super_admin"),
  (req, res) => {
    try {
      const input = req.body as Record<string, unknown>;
      if (!input?.model || !input?.modelProvider || !input?.domain || !input?.promptText) {
        sendBadRequest(res, "model, modelProvider, domain, and promptText are required");
        return;
      }

      const orgId = getOrgId(req.user);
      const trace = captureTrace({
        model: String(input.model),
        modelProvider: String(input.modelProvider),
        domain: input.domain as TraceDomain,
        promptText: String(input.promptText),
        orgId: orgId ?? null,
        latencyMs: typeof input.latencyMs === "number" ? input.latencyMs : 0,
        recommendationType: (input.recommendationType as import("@szl-holdings/ai-engine").RecommendationType) ?? "generic",
      });
      sendSuccess(res, trace, 201);
    } catch (err) {
      handleRouteError(res, err, "POST /ai/ops/traces/capture");
    }
  },
);

router.get(
  "/ai/ops/traces/:traceId",
  authMiddleware({ required: true }),
  requireRole("analyst", "operator", "admin", "super_admin"),
  async (req, res) => {
    try {
      const traceId = String(req.params.traceId);
      const trace = isDbAvailable()
        ? (await dbGetTrace(traceId)) ?? getTraceMemory(traceId)
        : getTraceMemory(traceId);
      if (!trace) {
        sendNotFound(res, "trace");
        return;
      }
      if (!canAccessOrgResource(req.user, trace.orgId)) {
        sendNotFound(res, "trace");
        return;
      }
      sendSuccess(res, trace);
    } catch (err) {
      handleRouteError(res, err, "GET /ai/ops/traces/:traceId");
    }
  },
);

router.patch(
  "/ai/ops/traces/:traceId/status",
  authMiddleware({ required: true }),
  requireRole("operator", "admin", "super_admin"),
  async (req, res) => {
    try {
      const body = req.body as { status?: TraceStatus; evalScore?: number; evalPassed?: boolean };
      if (!body.status) {
        sendBadRequest(res, "status is required");
        return;
      }

      const traceId = String(req.params.traceId);
      const existing = isDbAvailable()
        ? (await dbGetTrace(traceId)) ?? getTraceMemory(traceId)
        : getTraceMemory(traceId);
      if (!existing || !canAccessOrgResource(req.user, existing.orgId)) {
        sendNotFound(res, "trace");
        return;
      }

      if (isDbAvailable()) {
        const dbUpdated = await dbUpdateTraceStatus(traceId, body.status, body.evalScore, body.evalPassed);
        if (!dbUpdated) {
          sendNotFound(res, "trace");
          return;
        }
      } else {
        const memUpdated = updateTraceStatus(traceId, body.status, body.evalScore, body.evalPassed);
        if (!memUpdated) {
          sendNotFound(res, "trace");
          return;
        }
      }

      sendSuccess(res, { traceId, status: body.status });
    } catch (err) {
      handleRouteError(res, err, "PATCH /ai/ops/traces/:traceId/status");
    }
  },
);

router.get(
  "/ai/ops/review-queue/stats",
  authMiddleware({ required: true }),
  requireRole("analyst", "operator", "admin", "super_admin"),
  async (req, res) => {
    try {
      if (isMissingTenantScope(req.user)) {
        sendForbidden(res, "No organization context — cannot scope review queue data");
        return;
      }
      const orgId = getOrgId(req.user);
      const stats = isDbAvailable()
        ? (await dbGetReviewQueueStats(orgId)) ?? getReviewQueueStatsMemory(orgId)
        : getReviewQueueStatsMemory(orgId);
      sendSuccess(res, stats);
    } catch (err) {
      handleRouteError(res, err, "GET /ai/ops/review-queue/stats");
    }
  },
);

router.get(
  "/ai/ops/review-queue",
  authMiddleware({ required: true }),
  requireRole("analyst", "operator", "admin", "super_admin"),
  async (req, res) => {
    try {
      if (isMissingTenantScope(req.user)) {
        sendForbidden(res, "No organization context — cannot scope review queue data");
        return;
      }
      const orgId = getOrgId(req.user);
      const domain = req.query["domain"] as string | undefined;
      const status = req.query["status"] as ("pending" | "in_review" | "resolved" | "escalated") | undefined;
      const priority = req.query["priority"] as ("low" | "medium" | "high" | "critical") | undefined;
      const verdict = req.query["verdict"] as ReviewVerdict | undefined;
      const sinceQ = req.query["since"] as string | undefined;
      const untilQ = req.query["until"] as string | undefined;
      const limitQ = req.query["limit"] as string | undefined;
      const offsetQ = req.query["offset"] as string | undefined;

      const since = sinceQ ? new Date(sinceQ) : undefined;
      const until = untilQ ? new Date(untilQ) : undefined;

      if (since && isNaN(since.getTime())) {
        sendBadRequest(res, "Invalid 'since' date format — use ISO 8601");
        return;
      }
      if (until && isNaN(until.getTime())) {
        sendBadRequest(res, "Invalid 'until' date format — use ISO 8601");
        return;
      }

      const limit = parsePaginationInt(limitQ, 50, 200);
      const offset = parsePaginationInt(offsetQ, 0, Number.MAX_SAFE_INTEGER);
      const queryOpts = {
        orgId,
        domain: domain || undefined,
        status,
        priority,
        verdict,
        since,
        until,
        limit,
        offset,
      };

      if (isDbAvailable()) {
        const { items, total } = await dbListReviewQueue(queryOpts);
        sendSuccess(res, { items, count: items.length, total, limit, offset });
        return;
      }

      const items = listReviewQueueMemory(queryOpts);
      sendSuccess(res, { items, count: items.length, limit, offset });
    } catch (err) {
      handleRouteError(res, err, "GET /ai/ops/review-queue");
    }
  },
);

router.patch(
  "/ai/ops/review-queue/:reviewId/claim",
  authMiddleware({ required: true }),
  requireRole("analyst", "operator", "admin", "super_admin"),
  async (req, res) => {
    try {
      const reviewId = String(req.params.reviewId);
      const item = isDbAvailable()
        ? (await dbGetReviewItem(reviewId)) ?? getReviewItemMemory(reviewId)
        : getReviewItemMemory(reviewId);
      if (!item || !canAccessOrgResource(req.user, item.orgId)) {
        sendNotFound(res, "review item");
        return;
      }

      if (isDbAvailable()) {
        const dbClaimed = await dbMarkInReview(reviewId);
        if (!dbClaimed) {
          sendBadRequest(res, "Item cannot be claimed — it may already be in review or resolved");
          return;
        }
      } else {
        const claimed = markInReview(reviewId);
        if (!claimed) {
          sendBadRequest(res, "Item cannot be claimed — it may already be in review or resolved");
          return;
        }
      }
      sendSuccess(res, { reviewId, status: "in_review" });
    } catch (err) {
      handleRouteError(res, err, "PATCH /ai/ops/review-queue/:reviewId/claim");
    }
  },
);

router.patch(
  "/ai/ops/review-queue/:reviewId/decision",
  authMiddleware({ required: true }),
  requireRole("operator", "admin", "super_admin"),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user?.id) {
        sendForbidden(res, "Authentication required");
        return;
      }

      const body = req.body as { verdict?: ReviewVerdict; reviewNotes?: string; escalatedTo?: string };
      const VALID_VERDICTS: ReviewVerdict[] = ["approved", "rejected", "flagged", "escalated", "deferred"];
      if (!body.verdict || !VALID_VERDICTS.includes(body.verdict)) {
        sendBadRequest(res, `verdict must be one of: ${VALID_VERDICTS.join(", ")}`);
        return;
      }

      const reviewId = String(req.params.reviewId);
      const existing = isDbAvailable()
        ? (await dbGetReviewItem(reviewId)) ?? getReviewItemMemory(reviewId)
        : getReviewItemMemory(reviewId);
      if (!existing || !canAccessOrgResource(req.user, existing.orgId)) {
        sendNotFound(res, "review item");
        return;
      }

      if (isDbAvailable()) {
        const dbUpdated = await dbRecordReviewDecision({
          reviewId,
          verdict: body.verdict,
          reviewedBy: user.id,
          reviewNotes: body.reviewNotes,
          escalatedTo: body.escalatedTo,
        });
        if (!dbUpdated) {
          sendNotFound(res, "review item");
          return;
        }
        sendSuccess(res, dbUpdated);
        return;
      }

      const memUpdated = recordReviewDecision({
        reviewId,
        verdict: body.verdict,
        reviewedBy: user.id,
        reviewNotes: body.reviewNotes,
        escalatedTo: body.escalatedTo,
      });
      if (!memUpdated) {
        sendNotFound(res, "review item");
        return;
      }
      sendSuccess(res, memUpdated);
    } catch (err) {
      handleRouteError(res, err, "PATCH /ai/ops/review-queue/:reviewId/decision");
    }
  },
);

router.get(
  "/ai/ops/evaluators/stats",
  authMiddleware({ required: true }),
  requireRole("admin", "super_admin"),
  (_req, res) => {
    try {
      const stats = aggregateHookStats();
      sendSuccess(res, { stats, count: stats.length });
    } catch (err) {
      handleRouteError(res, err, "GET /ai/ops/evaluators/stats");
    }
  },
);

router.get(
  "/ai/ops/evaluators",
  authMiddleware({ required: true }),
  requireRole("admin", "super_admin"),
  (_req, res) => {
    try {
      const hooks = listEvaluatorHooks();
      sendSuccess(res, {
        hooks: hooks.map(h => ({
          id: h.id,
          name: h.name,
          domain: h.domain,
          description: h.description,
          version: h.version,
          registeredAt: h.registeredAt,
        })),
        count: hooks.length,
      });
    } catch (err) {
      handleRouteError(res, err, "GET /ai/ops/evaluators");
    }
  },
);

// ---------------------------------------------------------------------------
// Human feedback capture (thumbs up/down + free text) for AI traces.
// Feedback is stored in memory (per-process) and emitted as a structured log
// so downstream sinks (analytics, eval pipeline) can consume it as ground-truth
// signal. Consumers can later point an external sink at this surface.
// ---------------------------------------------------------------------------

type FeedbackSentiment = "up" | "down";

interface TraceFeedback {
  feedbackId: string;
  traceId: string;
  orgId: number | null;
  userId: number | null;
  sentiment: FeedbackSentiment;
  correction?: string;
  comment?: string;
  recordedAt: string;
}

const feedbackStore: TraceFeedback[] = [];
const MAX_FEEDBACK = 5000;

router.post(
  "/ai/ops/traces/:id/feedback",
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const traceId = String(req.params.id ?? "").trim();
      if (!traceId) {
        sendBadRequest(res, "trace id required");
        return;
      }
      const trace = isDbAvailable()
        ? (await dbGetTrace(traceId)) ?? getTraceMemory(traceId)
        : getTraceMemory(traceId);
      if (!trace) {
        sendNotFound(res, "trace not found");
        return;
      }
      if (!canAccessOrgResource(req.user, trace.orgId ?? null)) {
        sendForbidden(res, "Trace belongs to another tenant");
        return;
      }
      const body = req.body ?? {};
      const sentiment = body.sentiment;
      if (sentiment !== "up" && sentiment !== "down") {
        sendBadRequest(res, "sentiment must be 'up' or 'down'");
        return;
      }
      const correction = typeof body.correction === "string" ? body.correction.slice(0, 2000) : undefined;
      const comment = typeof body.comment === "string" ? body.comment.slice(0, 2000) : undefined;

      const entry: TraceFeedback = {
        feedbackId: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        traceId,
        orgId: trace.orgId ?? null,
        userId: req.user?.id ?? null,
        sentiment,
        correction,
        comment,
        recordedAt: new Date().toISOString(),
      };
      feedbackStore.unshift(entry);
      if (feedbackStore.length > MAX_FEEDBACK) feedbackStore.length = MAX_FEEDBACK;

      let reviewQueued = false;
      if (sentiment === "down") {
        if (isDbAvailable()) {
          await dbUpdateTraceStatus(traceId, "flagged");
        } else {
          updateTraceStatus(traceId, "flagged");
        }
        const existingQueueItems = isDbAvailable()
          ? (await dbListReviewQueue({ orgId: trace.orgId ?? undefined, limit: 200, offset: 0 })).items
          : listReviewQueueMemory({ orgId: trace.orgId ?? undefined });
        const alreadyInQueue = existingQueueItems.some(
          q => q.traceId === traceId && (q.status === "pending" || q.status === "in_review"),
        );
        if (!alreadyInQueue) {
          enqueueForReview({
            trace: { ...trace, requiresReview: true },
            overrideReason: correction
              ? `human_feedback_down: ${correction.slice(0, 200)}`
              : "human_feedback_down",
          });
          reviewQueued = true;
        }
      }

      logger.info(
        {
          event: "ai_feedback_recorded",
          feedbackId: entry.feedbackId,
          traceId,
          orgId: entry.orgId,
          userId: entry.userId,
          domain: trace.domain,
          recommendationType: trace.recommendationType,
          sentiment,
          hasCorrection: Boolean(correction),
          hasComment: Boolean(comment),
          reviewQueued,
        },
        "AI trace feedback recorded",
      );

      sendSuccess(res, { feedback: entry, reviewQueued });
    } catch (err) {
      handleRouteError(res, err, "POST /ai/ops/traces/:id/feedback");
    }
  },
);

router.get(
  "/ai/ops/traces/:id/feedback",
  authMiddleware({ required: true }),
  requireRole("analyst", "operator", "admin", "super_admin"),
  async (req, res) => {
    try {
      const traceId = String(req.params.id ?? "").trim();
      const trace = isDbAvailable()
        ? (await dbGetTrace(traceId)) ?? getTraceMemory(traceId)
        : getTraceMemory(traceId);
      if (!trace) {
        sendNotFound(res, "trace not found");
        return;
      }
      if (!canAccessOrgResource(req.user, trace.orgId ?? null)) {
        sendForbidden(res, "Trace belongs to another tenant");
        return;
      }
      const items = feedbackStore.filter(f => f.traceId === traceId);
      const up = items.filter(i => i.sentiment === "up").length;
      const down = items.filter(i => i.sentiment === "down").length;
      sendSuccess(res, { items, summary: { up, down, total: items.length } });
    } catch (err) {
      handleRouteError(res, err, "GET /ai/ops/traces/:id/feedback");
    }
  },
);

export default router;
