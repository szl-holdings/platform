import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { logger } from "../lib/logger";
import { defaultMemoryStore } from "@workspace/memory-fabric/store";
import {
  applyRetentionDefaults,
  redactEntry,
} from "@workspace/memory-fabric/retention";
import {
  summarizeEpisodes,
  distillLessons,
  enforceRetention,
  applyFreshnessDecay,
} from "@workspace/memory-fabric/behaviors";
import { MemoryEntrySchema, MemoryTypeSchema } from "@workspace/memory-fabric/types";
import type { MemoryEntry, MemoryType, SensitivityLevel } from "@workspace/memory-fabric/types";
import { jsonObjectBodySchema, listQuerySchema, validateBody, validateQuery } from "../lib/validation";

const router: IRouter = Router();

const memoryStore = defaultMemoryStore;

const ALL_MEMORY_TYPES: MemoryType[] = [
  "working", "session", "episodic", "semantic", "workflow",
  "entity", "artifact", "operator-feedback", "executive", "skill",
];

function validateTier(tier: string | undefined): MemoryType | undefined | "invalid" {
  if (!tier) return undefined;
  const parsed = MemoryTypeSchema.safeParse(tier);
  return parsed.success ? parsed.data : "invalid";
}

function getRequesterSensitivity(req: Request): SensitivityLevel {
  const role = req.user?.roles?.[0] ?? "user";
  if (role === "super_admin" || role === "admin") return "restricted";
  if (role === "analyst") return "confidential";
  if (role === "operator") return "internal";
  return "public";
}

router.get("/memory", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { tier, key, scopeId, tags, includeStale, minConfidence, search, sortBy } = req.query as {
      tier?: string;
      key?: string;
      scopeId?: string;
      tags?: string;
      includeStale?: string;
      minConfidence?: string;
      search?: string;
      sortBy?: string;
    };
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const validatedTier = validateTier(tier);
    if (validatedTier === "invalid") {
      sendBadRequest(res, `Invalid tier '${tier}'. Must be one of: ${ALL_MEMORY_TYPES.join(", ")}`);
      return;
    }

    const tagList = tags ? tags.split(",").filter(Boolean) : undefined;
    const requesterSensitivity = getRequesterSensitivity(req);

    const entries = memoryStore.list({
      tier: validatedTier,
      key,
      scopeId,
      tags: tagList,
      includeStale: includeStale === "true",
      minConfidence: minConfidence ? parseFloat(minConfidence) : undefined,
      search,
      sortBy: sortBy as "confidence" | "freshness" | "default" | undefined,
    });

    const redacted = entries
      .map((e) => redactEntry(e, requesterSensitivity))
      .filter((e): e is MemoryEntry => e !== null);

    const paged = redacted.slice(offset, offset + limit);

    sendSuccess(res, { data: paged, total: redacted.length, limit, offset });
  } catch (err) {
    handleRouteError(res, err, "memory:list");
  }
});

router.get("/memory/search", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { q, tier } = req.query as { q?: string; tier?: string };
    if (!q) {
      sendBadRequest(res, "Query parameter `q` is required");
      return;
    }
    const validatedTier = validateTier(tier);
    if (validatedTier === "invalid") {
      sendBadRequest(res, `Invalid tier '${tier}'. Must be one of: ${ALL_MEMORY_TYPES.join(", ")}`);
      return;
    }
    const requesterSensitivity = getRequesterSensitivity(req);
    const results = memoryStore.search(q, validatedTier);
    const redacted = results
      .map((e) => redactEntry(e, requesterSensitivity))
      .filter((e): e is MemoryEntry => e !== null);
    sendSuccess(res, { data: redacted, total: redacted.length });
  } catch (err) {
    handleRouteError(res, err, "memory:search");
  }
});

router.get("/memory/stats/summary", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const stats: Record<string, number> = {};
    for (const type of ALL_MEMORY_TYPES) {
      stats[type] = memoryStore.count(type);
    }
    sendSuccess(res, { total: memoryStore.count(), byType: stats });
  } catch (err) {
    handleRouteError(res, err, "memory:stats");
  }
});

router.get("/memory/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const entry = memoryStore.get(id);
    if (!entry) {
      sendNotFound(res, "MemoryEntry");
      return;
    }
    const requesterSensitivity = getRequesterSensitivity(req);
    const redacted = redactEntry(entry, requesterSensitivity);
    if (!redacted) {
      sendNotFound(res, "MemoryEntry");
      return;
    }
    sendSuccess(res, redacted);
  } catch (err) {
    handleRouteError(res, err, "memory:get");
  }
});

router.post("/memory", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();
    const body = req.body as Partial<MemoryEntry>;
    const entryInput = {
      id: body.id ?? randomUUID(),
      tier: body.tier,
      memoryType: body.memoryType ?? body.tier,
      key: body.key,
      value: body.value,
      summary: body.summary,
      provenance: {
        source: body.provenance?.source ?? "api",
        sourceId: body.provenance?.sourceId,
        author: body.provenance?.author ?? req.user?.displayName,
        method: body.provenance?.method ?? "human",
        createdAt: now,
      },
      freshness: {
        lastUpdatedAt: now,
        isStale: false,
      },
      confidence: body.confidence,
      sensitivity: body.sensitivity,
      retention: body.retention,
      linkedEntities: body.linkedEntities,
      linkedTraces: body.linkedTraces,
      linkedActions: body.linkedActions,
      tags: body.tags,
      scopeId: body.scopeId,
      metadata: body.metadata,
    };

    const parsed = MemoryEntrySchema.parse(entryInput);
    const withRetention = applyRetentionDefaults(parsed);
    memoryStore.put(withRetention);

    logger.info(
      { id: withRetention.id, tier: withRetention.tier, key: withRetention.key },
      "Memory record written"
    );

    sendCreated(res, withRetention);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      sendBadRequest(res, "Invalid memory entry", err);
      return;
    }
    handleRouteError(res, err, "memory:create");
  }
});

router.put("/memory/:id", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const existing = memoryStore.get(id);
    if (!existing) {
      sendNotFound(res, "MemoryEntry");
      return;
    }

    const body = req.body as Partial<MemoryEntry>;
    const now = new Date().toISOString();
    const updated: MemoryEntry = {
      ...existing,
      ...body,
      id,
      freshness: {
        ...existing.freshness,
        lastUpdatedAt: now,
        isStale: false,
      },
    };

    memoryStore.put(updated);
    logger.info({ id, tier: updated.tier }, "Memory record updated");
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "memory:update");
  }
});

router.delete(
  "/memory/:id", validateBody(jsonObjectBodySchema),
  authMiddleware(),
  requireRole("admin", "super_admin"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const deleted = memoryStore.delete(id);
      if (!deleted) {
        sendNotFound(res, "MemoryEntry");
        return;
      }
      logger.info({ id }, "Memory record deleted");
      sendSuccess(res, { deleted: true, id });
    } catch (err) {
      handleRouteError(res, err, "memory:delete");
    }
  }
);

router.post(
  "/memory/evict-expired", validateBody(jsonObjectBodySchema),
  authMiddleware(),
  requireRole("admin", "super_admin"),
  async (_req: Request, res: Response) => {
    try {
      const count = memoryStore.evictExpired();
      logger.info({ count }, "Memory eviction completed");
      sendSuccess(res, { evicted: count });
    } catch (err) {
      handleRouteError(res, err, "memory:evict");
    }
  }
);

router.post(
  "/memory/behaviors/summarize-episodes",
  authMiddleware(),
  requireRole("admin", "super_admin"),
  validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
    try {
      const { scopeId, minEpisodes } = req.body as { scopeId: string; minEpisodes?: number };
      if (!scopeId) {
        sendBadRequest(res, "scopeId is required");
        return;
      }
      const result = summarizeEpisodes(memoryStore, scopeId, { minEpisodes });
      if (!result) {
        sendSuccess(res, { summarized: false, reason: "Not enough episodes to summarize" });
        return;
      }
      logger.info({ scopeId, collapsedCount: result.collapsedIds.length }, "Episodes summarized");
      sendSuccess(res, { summarized: true, summary: result.summary, collapsedIds: result.collapsedIds });
    } catch (err) {
      handleRouteError(res, err, "memory:summarize-episodes");
    }
  }
);

router.post(
  "/memory/behaviors/distill-lessons",
  authMiddleware(),
  requireRole("admin", "super_admin"),
  validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
    try {
      const { minFeedback } = req.body as { minFeedback?: number };
      const result = distillLessons(memoryStore, { minFeedback });
      if (!result) {
        sendSuccess(res, { distilled: false, reason: "Not enough high-quality feedback to distill" });
        return;
      }
      logger.info({ sourceCount: result.sourceIds.length }, "Lessons distilled");
      sendSuccess(res, { distilled: true, lesson: result.lesson, sourceIds: result.sourceIds });
    } catch (err) {
      handleRouteError(res, err, "memory:distill-lessons");
    }
  }
);

router.post(
  "/memory/behaviors/enforce-retention", validateBody(jsonObjectBodySchema),
  authMiddleware(),
  requireRole("admin", "super_admin"),
  async (_req: Request, res: Response) => {
    try {
      const result = enforceRetention(memoryStore);
      logger.info(result, "Retention enforced");
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, "memory:enforce-retention");
    }
  }
);

router.post(
  "/memory/behaviors/decay-freshness",
  authMiddleware(),
  requireRole("admin", "super_admin"),
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const { halfLifeDays, staleThreshold } = req.body as { halfLifeDays?: number; staleThreshold?: number };
      const result = applyFreshnessDecay(memoryStore, { halfLifeDays, staleThreshold });
      logger.info(result, "Freshness decay applied");
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, "memory:decay-freshness");
    }
  }
);

router.post(
  "/memory/:id/pin",
  authMiddleware(),
  requireRole("admin", "super_admin", "ops"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const entry = memoryStore.get(id);
      if (!entry) { sendNotFound(res, "MemoryEntry"); return; }

      const pinned = { ...entry, retention: { ...entry.retention, pinned: true } };
      memoryStore.put(pinned);
      logger.info({ id }, "Memory entry pinned");
      sendSuccess(res, pinned);
    } catch (err) {
      handleRouteError(res, err, "memory:pin");
    }
  }
);

router.delete(
  "/memory/:id/pin",
  authMiddleware(),
  requireRole("admin", "super_admin"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const entry = memoryStore.get(id);
      if (!entry) { sendNotFound(res, "MemoryEntry"); return; }

      const unpinned = { ...entry, retention: { ...entry.retention, pinned: false } };
      memoryStore.put(unpinned);
      logger.info({ id }, "Memory entry unpinned");
      sendSuccess(res, unpinned);
    } catch (err) {
      handleRouteError(res, err, "memory:unpin");
    }
  }
);

router.get(
  "/memory/tiers/overview",
  authMiddleware(),
  async (_req: Request, res: Response) => {
    try {
      const TIER_DEFS: Array<{ tier: MemoryType; label: string; description: string; retentionPolicy: string }> = [
        { tier: "working", label: "Ephemeral Run", description: "In-flight data for a single agent run; discarded when the run completes.", retentionPolicy: "ephemeral" },
        { tier: "session", label: "Session", description: "Context shared across steps within a user or agent session.", retentionPolicy: "session-scoped" },
        { tier: "episodic", label: "Workspace Episodes", description: "Event records and observations scoped to a workspace; compacted into semantic memory.", retentionPolicy: "workflow-scoped" },
        { tier: "entity", label: "Entity", description: "Durable facts about specific entities (vessels, properties, clients, assets).", retentionPolicy: "persistent" },
        { tier: "skill", label: "Long-term Pattern", description: "Distilled lessons and playbooks derived from high-confidence episodic evidence.", retentionPolicy: "archival" },
        { tier: "semantic", label: "Semantic", description: "Summarised knowledge extracted from episodes.", retentionPolicy: "persistent" },
        { tier: "workflow", label: "Workflow", description: "Workflow execution state and cross-step context.", retentionPolicy: "workflow-scoped" },
        { tier: "artifact", label: "Artifact", description: "Generated artifacts (documents, drafts) linked to actions.", retentionPolicy: "persistent" },
        { tier: "operator-feedback", label: "Operator Feedback", description: "Structured feedback from operators used to distill lessons.", retentionPolicy: "persistent" },
        { tier: "executive", label: "Executive", description: "High-level summaries surfaced in executive briefings.", retentionPolicy: "persistent" },
      ];

      const overview = TIER_DEFS.map(def => ({
        ...def,
        count: memoryStore.count(def.tier),
        pinnedCount: memoryStore.list({ tier: def.tier, includeStale: true }).filter(e => e.retention.pinned).length,
        staleCount: memoryStore.list({ tier: def.tier, includeStale: true }).filter(e => e.freshness.isStale).length,
      }));

      sendSuccess(res, { tiers: overview, totalEntries: memoryStore.count() });
    } catch (err) {
      handleRouteError(res, err, "memory:tiers-overview");
    }
  }
);

export default router;
