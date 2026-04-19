/**
 * Decision Runtime API
 *
 * Real endpoints backed by Postgres tables under /api/decisions/cards/* and /api/decisions/simulate-policy.
 * All state-changing endpoints (approve / reject / request-changes) require an authenticated session.
 * Every state transition writes an audit event with actor, timestamp, and reason.
 *
 * Routes:
 *   GET  /decisions/cards                        — list decision cards (with filters)
 *   GET  /decisions/cards/:id                    — get card with full proof-chain
 *   POST /decisions/cards/:id/approve            — approve a card (auth required)
 *   POST /decisions/cards/:id/reject             — reject a card (auth required)
 *   POST /decisions/cards/:id/request-changes    — request changes on a card (auth required)
 *   POST /decisions/simulate-policy              — simulate policy without persisting (auth required)
 *
 * NOTE: Mounted early in routes/index.ts (before ai.register) because copilotRouter is mounted
 * in ai.register without a path prefix and applies tenantScope({ required: true }) globally.
 *
 * GET list and GET /:id are whitelisted in global-auth-enforcer.ts so unauthenticated viewers
 * can see the demo workspace (ws-demo-001). All mutating routes require auth.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod/v4";
import { authMiddleware, type AuthenticatedUser } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { db, PgPool, drizzleConnect } from "@szl-holdings/db";
import {
  decisionsRuntimeTable,
  decisionEvidenceTable,
  decisionValidationsTable,
  decisionRunsTable,
  decisionAuditEventsTable,
} from "@szl-holdings/db";
import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { evaluateDecisionPolicy } from "../services/decision-policy-engine";
import type { DecisionInput } from "../services/decision-policy-engine";
import { runAdversarialValidation } from "../services/decision-adversarial-validation";
import type { AdversarialValidationInput, EvidenceItem } from "../services/decision-adversarial-validation";
import { seedDecisionsIfEmpty } from "../services/decision-seed";
import { randomUUID } from "crypto";

// ─── Dedicated pool for decision-runtime routes ────────────────────────────────
// Separate from the main pool so autonomous agents saturating the primary pool
// never block the Decision Center UI. Short timeouts ensure fast failure.
const decisionsPool = new PgPool({
  connectionString: process.env.DATABASE_URL,
  max: 4,
  min: 0,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  statement_timeout: 8000,
});
const ddb = drizzleConnect(decisionsPool);

const router: IRouter = Router();
const noAuth = authMiddleware({ required: false });
const requireAuth = authMiddleware({ required: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWorkspaceId(user: AuthenticatedUser | undefined): string {
  return user?.orgs[0]?.orgId ? `ws-org-${user.orgs[0].orgId}` : "ws-demo-001";
}

function getActorId(user: AuthenticatedUser | undefined): string {
  return user ? `user:${user.id}` : "system:anonymous";
}

function getActorDisplay(user: AuthenticatedUser | undefined): string {
  return user ? (user.displayName || user.email || `User ${user.id}`) : "Anonymous";
}

// ─── Seed on demand (idempotent, non-blocking) ───────────────────────────────
// The seed kicks off asynchronously on first request — never blocks a route
// handler. The first GET /decisions/cards may return [] if seed hasn't finished.

let seedStarted = false;
function kickoffSeed() {
  if (seedStarted) return;
  seedStarted = true;
  seedDecisionsIfEmpty().catch(err => {
    logger.warn({ err }, "Decision seed failed");
    seedStarted = false; // allow retry on next request
  });
}

// ─── Fail-fast query helper ────────────────────────────────────────────────────
// Wraps a DB query promise in a timeout so the route never hangs indefinitely
// waiting for a pool connection when autonomous agents saturate the pool.
function withQueryTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`DB query timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ─── Response schemas (typed API boundaries) ─────────────────────────────────
// Validating response shapes ensures the API contract is enforced at runtime,
// not just at TypeScript compile time. Any mismatch between DB schema and API
// contract is surfaced as a 500 rather than silently returning wrong data.

const cardSummarySchema = z.object({
  id: z.number(),
  cardId: z.string(),
  domain: z.string(),
  title: z.string(),
  summary: z.string(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  autonomyMode: z.enum(["observe", "recommend", "draft", "execute-with-approval", "auto-execute"]),
  status: z.string(),
  policyState: z.string().nullable(),
  freshness: z.string().nullable(),
  confidence: z.number().nullable(),
  entityScope: z.array(z.string()).nullable(),
  recommendedAction: z.string().nullable(),
  owner: z.string().nullable(),
  priority: z.number().nullable(),
  evidenceCount: z.number(),
  validationSummary: z.unknown().nullable(),
  auditEventId: z.string().nullable(),
  generatedAt: z.unknown(),
  reviewedAt: z.unknown().nullable(),
  reviewedBy: z.string().nullable(),
});

const listResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(cardSummarySchema),
  total: z.number(),
});

const transitionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    cardId: z.string(),
    previousStatus: z.string(),
    newStatus: z.string(),
    eventId: z.string(),
    reviewedBy: z.string(),
    reviewedAt: z.string(),
  }),
});

function validateResponse<T>(schema: z.ZodType<T>, data: unknown, routeName: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    logger.warn({ issues: result.error.issues, routeName }, "Response schema validation failed");
    throw new Error(`Response contract violation in ${routeName}`);
  }
  return result.data;
}

// ─── GET /decisions/cards ──────────────────────────────────────────────────────
// Single SQL query with LEFT JOIN aggregate to count evidence — avoids N+1 queries.

router.get("/decisions/cards", noAuth, async (req: Request, res: Response) => {
  kickoffSeed();
  try {
    const workspaceId = getWorkspaceId(req.user);

    const severityFilter = req.query.severity as string | undefined;
    const domainFilter = req.query.domain as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const autonomyModeFilter = req.query.autonomyMode as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    // Build raw SQL with parameterized filters — single query with LEFT JOIN for evidence counts.
    const extraFilters: string[] = [];
    const params: unknown[] = [workspaceId];
    if (severityFilter) { extraFilters.push(`AND dr.severity = $${params.push(severityFilter)}`); }
    if (domainFilter) { extraFilters.push(`AND dr.domain = $${params.push(domainFilter)}`); }
    if (statusFilter) { extraFilters.push(`AND dr.status = $${params.push(statusFilter)}`); }
    if (autonomyModeFilter) { extraFilters.push(`AND dr.autonomy_mode = $${params.push(autonomyModeFilter)}`); }

    const rawSql = `
      SELECT
        dr.id, dr.card_id, dr.domain, dr.title, dr.summary, dr.severity,
        dr.autonomy_mode, dr.status, dr.policy_state, dr.freshness, dr.confidence,
        dr.entity_scope, dr.recommended_action, dr.owner, dr.priority,
        dr.validation_summary, dr.audit_event_id, dr.generated_at,
        dr.reviewed_at, dr.reviewed_by,
        COALESCE(ev.cnt, 0)::int AS evidence_count
      FROM decisions_runtime dr
      LEFT JOIN (
        SELECT card_id, COUNT(*) AS cnt
        FROM decision_evidence
        WHERE workspace_id = $1
        GROUP BY card_id
      ) ev ON ev.card_id = dr.card_id
      WHERE dr.workspace_id = $1
      ${extraFilters.join(" ")}
      ORDER BY dr.priority DESC, dr.created_at DESC
      LIMIT ${limit}
    `;

    const result = await withQueryTimeout(decisionsPool.query(rawSql, params));
    const rows: Record<string, unknown>[] = result.rows;

    const data = rows.map((r) => ({
      id: r.id,
      cardId: r.card_id,
      domain: r.domain,
      title: r.title,
      summary: r.summary,
      severity: r.severity,
      autonomyMode: r.autonomy_mode,
      status: r.status,
      policyState: r.policy_state,
      freshness: r.freshness,
      confidence: r.confidence,
      entityScope: r.entity_scope,
      recommendedAction: r.recommended_action,
      owner: r.owner,
      priority: r.priority,
      evidenceCount: r.evidence_count,
      validationSummary: r.validation_summary,
      auditEventId: r.audit_event_id,
      generatedAt: r.generated_at,
      reviewedAt: r.reviewed_at,
      reviewedBy: r.reviewed_by,
    }));

    const responseBody = validateResponse(listResponseSchema, { success: true as const, data, total: data.length }, "GET /decisions/cards");
    return res.json(responseBody);
  } catch (err) {
    logger.error({ err }, "GET /decisions/cards error");
    const msg = err instanceof Error && err.message.includes("timed out")
      ? "Decision list temporarily unavailable — server is under load, please retry"
      : "Failed to list decisions";
    return res.status(503).json({ error: msg, retryable: true });
  }
});

// ─── GET /decisions/cards/:id ──────────────────────────────────────────────────

router.get("/decisions/cards/:id", noAuth, async (req: Request, res: Response) => {
  try {
    kickoffSeed();
    const workspaceId = getWorkspaceId(req.user);
    const { id } = req.params;

    // Support both numeric id and cardId
    let card = null;
    if (/^\d+$/.test(id)) {
      const rows = await withQueryTimeout(ddb
        .select()
        .from(decisionsRuntimeTable)
        .where(and(
          eq(decisionsRuntimeTable.id, parseInt(id, 10)),
          eq(decisionsRuntimeTable.workspaceId, workspaceId),
        ))
        .limit(1));
      card = rows[0] ?? null;
    } else {
      const rows = await withQueryTimeout(ddb
        .select()
        .from(decisionsRuntimeTable)
        .where(and(
          eq(decisionsRuntimeTable.cardId, id),
          eq(decisionsRuntimeTable.workspaceId, workspaceId),
        ))
        .limit(1));
      card = rows[0] ?? null;
    }

    if (!card) {
      return res.status(404).json({ error: "Decision card not found" });
    }

    const [evidence, validations, runs, auditEvents] = await withQueryTimeout(Promise.all([
      ddb.select().from(decisionEvidenceTable)
        .where(and(
          eq(decisionEvidenceTable.cardId, card.cardId),
          eq(decisionEvidenceTable.workspaceId, workspaceId),
        ))
        .orderBy(asc(decisionEvidenceTable.orderIdx)),
      ddb.select().from(decisionValidationsTable)
        .where(and(
          eq(decisionValidationsTable.cardId, card.cardId),
          eq(decisionValidationsTable.workspaceId, workspaceId),
        ))
        .orderBy(asc(decisionValidationsTable.createdAt)),
      ddb.select().from(decisionRunsTable)
        .where(and(
          eq(decisionRunsTable.cardId, card.cardId),
          eq(decisionRunsTable.workspaceId, workspaceId),
        ))
        .orderBy(desc(decisionRunsTable.createdAt))
        .limit(1),
      ddb.select().from(decisionAuditEventsTable)
        .where(and(
          eq(decisionAuditEventsTable.cardId, card.cardId),
          eq(decisionAuditEventsTable.workspaceId, workspaceId),
        ))
        .orderBy(asc(decisionAuditEventsTable.occurredAt)),
    ]));

    return res.json({
      success: true,
      data: {
        card: {
          id: card.id,
          cardId: card.cardId,
          domain: card.domain,
          title: card.title,
          summary: card.summary,
          severity: card.severity,
          autonomyMode: card.autonomyMode,
          status: card.status,
          policyState: card.policyState,
          freshness: card.freshness,
          confidence: card.confidence,
          entityScope: card.entityScope,
          recommendedAction: card.recommendedAction,
          reasoning: card.reasoning,
          owner: card.owner,
          priority: card.priority,
          policyEvaluation: card.policyEvaluation,
          validationSummary: card.validationSummary,
          auditEventId: card.auditEventId,
          generatedAt: card.generatedAt,
          reviewedAt: card.reviewedAt,
          reviewedBy: card.reviewedBy,
          reviewNote: card.reviewNote,
        },
        evidence: evidence.map(e => ({
          id: e.id,
          label: e.label,
          value: e.value,
          source: e.source,
          excerpt: e.excerpt,
          sourceType: e.sourceType,
          freshness: e.freshness,
          confidence: e.confidence,
          capturedAt: e.capturedAt,
        })),
        validations: validations.map(v => ({
          id: v.id,
          checkType: v.checkType,
          passed: v.passed,
          explanation: v.explanation,
          severity: v.severity,
          metadata: v.metadata,
          ranAt: v.ranAt,
        })),
        runTrace: runs[0] ? {
          runId: runs[0].runId,
          steps: runs[0].steps,
          totalLatencyMs: runs[0].totalLatencyMs,
          totalInputTokens: runs[0].totalInputTokens,
          totalOutputTokens: runs[0].totalOutputTokens,
          estimatedCostUsd: runs[0].estimatedCostUsd,
          modelsCalled: runs[0].modelsCalled,
          toolsCalled: runs[0].toolsCalled,
          status: runs[0].status,
          startedAt: runs[0].startedAt,
          completedAt: runs[0].completedAt,
        } : null,
        auditTrail: auditEvents.map(a => ({
          eventId: a.eventId,
          eventType: a.eventType,
          actorId: a.actorId,
          actorType: a.actorType,
          actorDisplay: a.actorDisplay,
          reason: a.reason,
          previousStatus: a.previousStatus,
          newStatus: a.newStatus,
          occurredAt: a.occurredAt,
        })),
      },
    });
  } catch (err) {
    logger.error({ err }, "GET /decisions/cards/:id error");
    return res.status(500).json({ error: "Failed to get decision" });
  }
});

// ─── Shared state-transition helper ──────────────────────────────────────────

const actionSchema = z.object({
  reason: z.string().optional(),
  note: z.string().optional(),
});

async function transitionCard(
  req: Request,
  res: Response,
  newStatus: "approved" | "rejected" | "changes-requested",
  eventType: "card.approved" | "card.rejected" | "card.changes_requested",
) {
  try {
    kickoffSeed();
    // Auth is enforced upstream by requireAuth middleware — req.user is guaranteed.
    // Scope to the authenticated user's workspace; never trust body.workspaceId.
    const workspaceId = getWorkspaceId(req.user);
    const { id } = req.params;

    const parsed = actionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    }

    const conditions = [eq(decisionsRuntimeTable.workspaceId, workspaceId)];
    if (/^\d+$/.test(id)) {
      conditions.push(eq(decisionsRuntimeTable.id, parseInt(id, 10)));
    } else {
      conditions.push(eq(decisionsRuntimeTable.cardId, id));
    }

    const rows = await withQueryTimeout(ddb
      .select()
      .from(decisionsRuntimeTable)
      .where(and(...conditions))
      .limit(1));

    const card = rows[0];
    if (!card) {
      return res.status(404).json({ error: "Decision card not found" });
    }

    const previousStatus = card.status;
    const actorId = getActorId(req.user);
    const actorDisplay = getActorDisplay(req.user);
    const reason = parsed.data.reason ?? parsed.data.note ?? "";
    const eventId = `audit-${card.cardId}-${eventType}-${Date.now()}`;

    // Both mutation and audit event must succeed or both must roll back — no silent mutations.
    await withQueryTimeout(ddb.transaction(async (tx) => {
      await tx
        .update(decisionsRuntimeTable)
        .set({
          status: newStatus,
          reviewedAt: new Date(),
          reviewedBy: actorDisplay,
          reviewNote: reason || null,
          updatedAt: new Date(),
        })
        .where(and(...conditions));

      await tx.insert(decisionAuditEventsTable).values({
        eventId,
        cardId: card.cardId,
        workspaceId,
        eventType,
        actorId,
        actorType: "human",
        actorDisplay,
        reason: reason || null,
        previousStatus,
        newStatus,
        occurredAt: new Date(),
      });
    }));

    logger.info({ cardId: card.cardId, eventType, actorId, newStatus }, "Decision card state transition");

    const responseBody = validateResponse(transitionResponseSchema, {
      success: true as const,
      data: {
        cardId: card.cardId,
        previousStatus,
        newStatus,
        eventId,
        reviewedBy: actorDisplay,
        reviewedAt: new Date().toISOString(),
      },
    }, `POST /decisions/cards/:id/${eventType}`);
    return res.json(responseBody);
  } catch (err) {
    logger.error({ err }, `${eventType} error`);
    return res.status(500).json({ error: "Failed to process action" });
  }
}

// ─── POST /decisions/cards/:id/approve ────────────────────────────────────────

router.post("/decisions/cards/:id/approve", requireAuth, async (req: Request, res: Response) => {
  return transitionCard(req, res, "approved", "card.approved");
});

// ─── POST /decisions/cards/:id/reject ─────────────────────────────────────────

router.post("/decisions/cards/:id/reject", requireAuth, async (req: Request, res: Response) => {
  return transitionCard(req, res, "rejected", "card.rejected");
});

// ─── POST /decisions/cards/:id/request-changes ────────────────────────────────

router.post("/decisions/cards/:id/request-changes", requireAuth, async (req: Request, res: Response) => {
  return transitionCard(req, res, "changes-requested", "card.changes_requested");
});

// ─── POST /decisions/cards/:id/validate-and-promote ───────────────────────────
// Runs all six adversarial validation checks against the current card evidence,
// persists validation records, and promotes to ready-for-review only if all
// required checks pass. State transition + audit write are atomic.

router.post("/decisions/cards/:id/validate-and-promote", requireAuth, async (req: Request, res: Response) => {
  try {
    kickoffSeed();
    const workspaceId = getWorkspaceId(req.user);
    const { id } = req.params;

    const conditions = [eq(decisionsRuntimeTable.workspaceId, workspaceId)];
    if (/^\d+$/.test(id)) {
      conditions.push(eq(decisionsRuntimeTable.id, parseInt(id, 10)));
    } else {
      conditions.push(eq(decisionsRuntimeTable.cardId, id));
    }

    const rows = await withQueryTimeout(ddb.select().from(decisionsRuntimeTable).where(and(...conditions)).limit(1));
    const card = rows[0];
    if (!card) return res.status(404).json({ error: "Decision card not found" });

    if (card.status === "approved" || card.status === "rejected") {
      return res.status(409).json({ error: `Cannot promote a card in "${card.status}" status` });
    }

    // Load evidence rows to build adversarial validation input
    const evidenceRows = await withQueryTimeout(
      ddb.select().from(decisionEvidenceTable).where(
        and(eq(decisionEvidenceTable.cardId, card.cardId), eq(decisionEvidenceTable.workspaceId, workspaceId))
      )
    );

    const evidence: EvidenceItem[] = evidenceRows.map(ev => ({
      type: (ev.evidenceType ?? "doc") as EvidenceItem["type"],
      source: ev.source ?? "unknown",
      content: String(ev.content ?? ""),
      timestamp: (ev.retrievedAt ?? new Date()).toISOString(),
      confidence: typeof ev.confidence === "number" ? ev.confidence : 0.8,
    }));

    const validationInput: AdversarialValidationInput = {
      cardId: card.cardId,
      title: card.title,
      summary: card.summary,
      severity: card.severity as AdversarialValidationInput["severity"],
      autonomyMode: card.autonomyMode as AdversarialValidationInput["autonomyMode"],
      confidence: typeof card.confidence === "number" ? card.confidence : 0.8,
      recommendedAction: card.recommendedAction ?? undefined,
      evidence,
    };

    const validationResult = runAdversarialValidation(validationInput);
    const actorId = getActorId(req.user);
    const actorDisplay = getActorDisplay(req.user);
    const now = new Date();

    if (!validationResult.allPassed) {
      return res.status(422).json({
        success: false,
        error: "Adversarial validation failed — card cannot be promoted",
        blockingFailures: validationResult.blockingFailures.map(c => ({
          checkType: c.checkType,
          explanation: c.explanation,
          severity: c.severity,
        })),
        warnings: validationResult.warnings.map(c => ({ checkType: c.checkType, explanation: c.explanation })),
      });
    }

    // All checks passed — atomically persist validations + transition + audit event
    const eventId = `audit-${card.cardId}-card.promoted-${Date.now()}`;
    await withQueryTimeout(ddb.transaction(async (tx) => {
      // Delete old validation results and reinsert fresh ones — simpler than upsert
      // since there's no unique(cardId, checkType) constraint on the table.
      await tx.delete(decisionValidationsTable).where(
        and(eq(decisionValidationsTable.cardId, card.cardId), eq(decisionValidationsTable.workspaceId, workspaceId))
      );
      for (const check of validationResult.checks) {
        await tx.insert(decisionValidationsTable).values({
          cardId: card.cardId,
          workspaceId,
          checkType: check.checkType,
          passed: check.passed,
          explanation: check.explanation,
          severity: check.severity,
          metadata: (check.metadata ?? {}) as Record<string, unknown>,
        });
      }

      await tx.update(decisionsRuntimeTable).set({
        status: "ready-for-review",
        validationSummary: {
          allPassed: validationResult.allPassed,
          checkCount: validationResult.checks.length,
          blockingFailures: validationResult.blockingFailures.length,
          warnings: validationResult.warnings.length,
        },
        updatedAt: now,
      }).where(and(...conditions));

      await tx.insert(decisionAuditEventsTable).values({
        eventId,
        cardId: card.cardId,
        workspaceId,
        eventType: "card.promoted",
        actorId,
        actorType: "human",
        actorDisplay,
        reason: `All ${validationResult.checks.length} adversarial checks passed`,
        previousStatus: card.status,
        newStatus: "ready-for-review",
        occurredAt: now,
      });
    }));

    logger.info({ cardId: card.cardId, actorId, checksRun: validationResult.checks.length }, "Card promoted to ready-for-review");

    return res.json({
      success: true,
      data: {
        cardId: card.cardId,
        previousStatus: card.status,
        newStatus: "ready-for-review",
        eventId,
        checksRun: validationResult.checks.length,
        validationSummary: {
          allPassed: validationResult.allPassed,
          checkCount: validationResult.checks.length,
          blockingFailures: 0,
          warnings: validationResult.warnings.length,
        },
      },
    });
  } catch (err) {
    logger.error({ err }, "POST /decisions/cards/:id/validate-and-promote error");
    return res.status(500).json({ error: "Failed to validate and promote card" });
  }
});

// ─── POST /decisions/simulate-policy ──────────────────────────────────────────
// Policy simulation: requires auth. workspaceId is always derived from the
// authenticated user's org — never trusted from the request body.

const simulatePolicySchema = z.object({
  severity: z.enum(["critical", "high", "medium", "low"]),
  autonomyMode: z.enum(["observe", "recommend", "draft", "execute-with-approval", "auto-execute"]),
  recommendedAction: z.string().optional(),
  confidence: z.number().min(0).max(1),
  domain: z.string().optional(),
});

router.post("/decisions/simulate-policy", requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = simulatePolicySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    }

    // Always derive workspaceId from the authenticated user — never from request body.
    const workspaceId = getWorkspaceId(req.user);
    const decisionInput: DecisionInput = {
      cardId: `sim-${randomUUID()}`,
      workspaceId,
      severity: parsed.data.severity,
      autonomyMode: parsed.data.autonomyMode,
      recommendedAction: parsed.data.recommendedAction,
      confidence: parsed.data.confidence,
    };

    const evaluation = await evaluateDecisionPolicy(decisionInput, { simulationMode: true });

    return res.json({
      success: true,
      data: {
        simulationMode: true,
        evaluation,
        input: {
          severity: parsed.data.severity,
          autonomyMode: parsed.data.autonomyMode,
          recommendedAction: parsed.data.recommendedAction,
          confidence: parsed.data.confidence,
        },
      },
    });
  } catch (err) {
    logger.error({ err }, "POST /decisions/simulate-policy error");
    return res.status(500).json({ error: "Failed to simulate policy" });
  }
});

export default router;
