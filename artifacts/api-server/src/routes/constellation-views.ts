/**
 * /constellation/views — per-user saved Constellation filter views.
 *
 * Routes (all require auth):
 *   GET    /constellation/views?domain=:domain   list saved views (optionally scoped by domain)
 *   POST   /constellation/views                  create a saved view
 *   PATCH  /constellation/views/:id              rename or update a saved view's filters
 *   DELETE /constellation/views/:id              delete a saved view
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { db, constellationSavedViewsTable } from "@szl-holdings/db";
import { and, eq, asc } from "drizzle-orm";
import {
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  sendUnauthorized,
  sendNoContent,
  sendConflict,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { perUserApiSlidingLimiter } from "../middlewares/sliding-window-limiter";

const router: IRouter = Router();
router.use(authMiddleware({ required: true }));
router.use(perUserApiSlidingLimiter);

const filtersSchema = z
  .object({
    entityTypeFilter: z.string().nullable().optional(),
    activeOnly: z.boolean().optional(),
    sinceWindow: z.enum(["24h", "7d", "30d", "all"]).optional(),
    searchQuery: z.string().optional(),
  })
  .passthrough();

const NAME_MAX = 80;
const DOMAIN_MAX = 64;

const createSchema = z.object({
  domain: z.string().min(1).max(DOMAIN_MAX),
  name: z.string().min(1).max(NAME_MAX).trim(),
  filters: filtersSchema,
});

const updateSchema = z
  .object({
    name: z.string().min(1).max(NAME_MAX).trim().optional(),
    filters: filtersSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.filters !== undefined, {
    message: "Provide name and/or filters to update",
  });

function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: string; cause?: unknown };
  if (e.code === "23505") return true;
  // drizzle/pg may wrap the underlying postgres error in a `cause`
  if (e.cause && typeof e.cause === "object") {
    return (e.cause as { code?: string }).code === "23505";
  }
  return false;
}

router.get("/constellation/views", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }
    const domainParam = req.query["domain"];
    const conditions = [eq(constellationSavedViewsTable.userId, userId)];
    if (typeof domainParam === "string" && domainParam.length > 0) {
      conditions.push(eq(constellationSavedViewsTable.domain, domainParam));
    }
    const rows = await db
      .select()
      .from(constellationSavedViewsTable)
      .where(and(...conditions))
      .orderBy(asc(constellationSavedViewsTable.name));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Saved view request failed");
  }
});

router.post("/constellation/views", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, "Invalid saved view payload", parsed.error.issues);
      return;
    }
    const { domain, name, filters } = parsed.data;
    try {
      const [row] = await db
        .insert(constellationSavedViewsTable)
        .values({ userId, domain, name, filters })
        .returning();
      sendSuccess(res, row, 201);
    } catch (err) {
      if (isUniqueViolation(err)) {
        sendConflict(res, "A saved view with that name already exists for this domain");
        return;
      }
      throw err;
    }
  } catch (err) {
    handleRouteError(res, err, "Saved view request failed");
  }
});

function parseId(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

router.patch("/constellation/views/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }
    const id = parseId(req.params["id"]);
    if (id === null) {
      sendBadRequest(res, "Invalid saved view id");
      return;
    }
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, "Invalid saved view payload", parsed.error.issues);
      return;
    }
    const patch: { name?: string; filters?: unknown; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (parsed.data.name !== undefined) patch.name = parsed.data.name;
    if (parsed.data.filters !== undefined) patch.filters = parsed.data.filters;
    try {
      const [row] = await db
        .update(constellationSavedViewsTable)
        .set(patch)
        .where(
          and(
            eq(constellationSavedViewsTable.id, id),
            eq(constellationSavedViewsTable.userId, userId),
          ),
        )
        .returning();
      if (!row) {
        sendNotFound(res, "Saved view");
        return;
      }
      sendSuccess(res, row);
    } catch (err) {
      if (isUniqueViolation(err)) {
        sendConflict(res, "A saved view with that name already exists for this domain");
        return;
      }
      throw err;
    }
  } catch (err) {
    handleRouteError(res, err, "Saved view request failed");
  }
});

router.delete("/constellation/views/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }
    const id = parseId(req.params["id"]);
    if (id === null) {
      sendBadRequest(res, "Invalid saved view id");
      return;
    }
    const [row] = await db
      .delete(constellationSavedViewsTable)
      .where(
        and(
          eq(constellationSavedViewsTable.id, id),
          eq(constellationSavedViewsTable.userId, userId),
        ),
      )
      .returning({ id: constellationSavedViewsTable.id });
    if (!row) {
      sendNotFound(res, "Saved view");
      return;
    }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Saved view request failed");
  }
});

export default router;
