import { Router, type IRouter } from "express";
import { db, commentsTable } from "@szl-holdings/db";
import { eq, and, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
import { jsonObjectBodySchema, validateBody, validateParams, validateQuery } from "../lib/validation";
import { z } from "zod";

const router: IRouter = Router();

const commentBodySchema = z.object({
  content: z.string().min(1, "content is required").max(10000).trim(),
  mentions: z.array(z.string()).optional().default([]),
  parentId: z.number().int().positive().optional(),
  authorName: z.string().max(100).trim().optional(),
});

const activityFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  entityType: z.string().max(100).optional(),
});

const entityParamsSchema = z.object({
  entityType: z.string().min(1).max(100),
  entityId: z.string().min(1).max(100),
});

const commentIdParamsSchema = z.object({
  id: z.string().min(1),
});

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

router.get("/comments/activity-feed", authMiddleware({ required: false }), validateQuery(activityFeedQuerySchema), async (req, res) => {
  try {
    const { limit, entityType } = req.query as unknown as z.infer<typeof activityFeedQuerySchema>;

    const whereClause = entityType
      ? and(eq(commentsTable.isDeleted, false), eq(commentsTable.entityType, entityType))
      : eq(commentsTable.isDeleted, false);

    const comments = await db
      .select()
      .from(commentsTable)
      .where(whereClause)
      .orderBy(desc(commentsTable.createdAt))
      .limit(limit);

    sendSuccess(res, comments);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch activity feed");
  }
});

router.get("/comments/:entityType/:entityId", authMiddleware({ required: false }), validateParams(entityParamsSchema), async (req, res) => {
  try {
    const { entityType, entityId } = req.params as z.infer<typeof entityParamsSchema>;
    const comments = await db
      .select()
      .from(commentsTable)
      .where(
        and(
          eq(commentsTable.entityType, entityType),
          eq(commentsTable.entityId, entityId),
          eq(commentsTable.isDeleted, false)
        )
      )
      .orderBy(desc(commentsTable.createdAt));
    sendSuccess(res, comments);
  } catch (err) {
    handleRouteError(res, err, "Failed to list comments");
  }
});

router.post("/comments/:entityType/:entityId", authMiddleware({ required: false }), validateParams(entityParamsSchema), validateBody(commentBodySchema), async (req, res) => {
  try {
    const { entityType, entityId } = req.params as z.infer<typeof entityParamsSchema>;
    const { content, mentions, parentId, authorName: bodyAuthorName } = req.body as z.infer<typeof commentBodySchema>;

    let authorName = "Anonymous";
    let authorInitials = "AN";
    let authorId: number | undefined;

    if (req.user) {
      authorId = req.user.id;
      authorName = req.user.displayName;
      authorInitials = getInitials(req.user.displayName);
    } else if (bodyAuthorName) {
      authorName = bodyAuthorName;
      authorInitials = getInitials(authorName);
    }

    const [comment] = await db
      .insert(commentsTable)
      .values({
        entityType,
        entityId,
        authorId,
        authorName,
        authorInitials,
        content,
        mentions: mentions ?? [],
        parentId,
      })
      .returning();

    sendCreated(res, comment);
  } catch (err) {
    handleRouteError(res, err, "Failed to create comment");
  }
});

const commentUpdateSchema = z.object({
  content: z.string().min(1, "content is required").max(10000).trim(),
});

router.patch("/comments/:id", authMiddleware({ required: false }), validateParams(commentIdParamsSchema), validateBody(commentUpdateSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { content } = req.body as z.infer<typeof commentUpdateSchema>;

    const [existing] = await db.select().from(commentsTable).where(eq(commentsTable.id, id));
    if (!existing) { sendNotFound(res, "Comment"); return; }

    if (req.user) {
      if (existing.authorId === null) {
        res.status(403).json({ success: false, error: "Forbidden: this comment was created anonymously and cannot be edited by an authenticated user" });
        return;
      }
      if (existing.authorId !== req.user.id) {
        res.status(403).json({ success: false, error: "Forbidden: you can only edit your own comments" });
        return;
      }
    } else {
      res.status(401).json({ success: false, error: "Unauthorized: sign in to edit comments" });
      return;
    }

    const [updated] = await db
      .update(commentsTable)
      .set({ content: content.trim(), updatedAt: new Date() })
      .where(eq(commentsTable.id, id))
      .returning();

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update comment");
  }
});

router.delete("/comments/:id", validateBody(jsonObjectBodySchema), authMiddleware({ required: false }), validateParams(commentIdParamsSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [existing] = await db.select().from(commentsTable).where(eq(commentsTable.id, id));
    if (!existing) { sendNotFound(res, "Comment"); return; }

    if (req.user) {
      if (existing.authorId === null) {
        res.status(403).json({ success: false, error: "Forbidden: this comment was created anonymously and cannot be deleted by an authenticated user" });
        return;
      }
      if (existing.authorId !== req.user.id) {
        res.status(403).json({ success: false, error: "Forbidden: you can only delete your own comments" });
        return;
      }
    } else {
      res.status(401).json({ success: false, error: "Unauthorized: sign in to delete comments" });
      return;
    }

    await db.update(commentsTable).set({ isDeleted: true }).where(eq(commentsTable.id, id));
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete comment");
  }
});

export default router;
