import { Router, type IRouter } from "express";
import { db, commentsTable } from "@szl-holdings/db";
import { eq, and, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

router.get("/comments/activity-feed", authMiddleware({ required: false }), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const entityType = req.query.entityType as string | undefined;

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

router.get("/comments/:entityType/:entityId", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { entityType, entityId } = req.params as Record<string, string>;
    if (!entityType || !entityId) {
      sendBadRequest(res, "entityType and entityId are required");
      return;
    }
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

router.post("/comments/:entityType/:entityId", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { entityType, entityId } = req.params as Record<string, string>;
    const { content, mentions, parentId } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      sendBadRequest(res, "content is required");
      return;
    }

    let authorName = "Anonymous";
    let authorInitials = "AN";
    let authorId: number | undefined;

    if (req.user) {
      authorId = req.user.id;
      authorName = req.user.displayName;
      authorInitials = getInitials(req.user.displayName);
    } else if (req.body.authorName) {
      authorName = String(req.body.authorName).slice(0, 100);
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
        content: content.trim(),
        mentions: Array.isArray(mentions) ? mentions : [],
        parentId: typeof parentId === "number" ? parentId : undefined,
      })
      .returning();

    sendCreated(res, comment);
  } catch (err) {
    handleRouteError(res, err, "Failed to create comment");
  }
});

router.patch("/comments/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { content } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      sendBadRequest(res, "content is required");
      return;
    }

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

router.delete("/comments/:id", authMiddleware({ required: false }), async (req, res) => {
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
