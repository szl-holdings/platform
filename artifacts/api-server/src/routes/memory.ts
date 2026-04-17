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
import { InMemoryStore } from "@workspace/memory-fabric/store";
import { applyRetentionDefaults, isExpired, checkSensitivity } from "@workspace/memory-fabric/retention";
import { MemoryEntrySchema } from "@workspace/memory-fabric/types";
import type { MemoryEntry } from "@workspace/memory-fabric/types";

const router: IRouter = Router();

const memoryStore = new InMemoryStore();

router.get("/memory", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { tier, key, scopeId, tags, includeStale } = req.query as {
      tier?: string;
      key?: string;
      scopeId?: string;
      tags?: string;
      includeStale?: string;
    };
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const tagList = tags ? tags.split(",").filter(Boolean) : undefined;

    const entries = memoryStore.list({
      tier: tier as MemoryEntry["tier"] | undefined,
      key,
      scopeId,
      tags: tagList,
      includeStale: includeStale === "true",
    });

    const paged = entries.slice(offset, offset + limit);

    sendSuccess(res, { data: paged, total: entries.length, limit, offset });
  } catch (err) {
    handleRouteError(res, err, "memory:list");
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
    sendSuccess(res, entry);
  } catch (err) {
    handleRouteError(res, err, "memory:get");
  }
});

router.post("/memory", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();
    const body = req.body as Partial<MemoryEntry>;
    const entryInput = {
      id: body.id ?? randomUUID(),
      tier: body.tier,
      key: body.key,
      value: body.value,
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

    logger.info({ id: withRetention.id, tier: withRetention.tier, key: withRetention.key }, "Memory record written");

    sendCreated(res, withRetention);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      sendBadRequest(res, "Invalid memory entry", err);
      return;
    }
    handleRouteError(res, err, "memory:create");
  }
});

router.put("/memory/:id", authMiddleware(), async (req: Request, res: Response) => {
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

router.delete("/memory/:id", authMiddleware(), requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
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
});

router.post("/memory/evict-expired", authMiddleware(), requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const count = memoryStore.evictExpired();
    logger.info({ count }, "Memory eviction completed");
    sendSuccess(res, { evicted: count });
  } catch (err) {
    handleRouteError(res, err, "memory:evict");
  }
});

router.get("/memory/stats/summary", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const tiers = [
      "session", "workflow", "entity", "artifact",
      "executive", "domain", "operator-feedback", "long-term",
    ] as const;
    const stats: Record<string, number> = {};
    for (const tier of tiers) {
      stats[tier] = memoryStore.count(tier);
    }
    sendSuccess(res, { total: memoryStore.count(), byTier: stats });
  } catch (err) {
    handleRouteError(res, err, "memory:stats");
  }
});

export default router;
