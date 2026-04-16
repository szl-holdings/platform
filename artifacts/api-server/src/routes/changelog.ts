import { Router, type Request, type Response } from "express";
import { db } from "../lib/db";
import { changelogEntriesTable } from "@szl-holdings/db";
import { desc, eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const changelogRouter = Router();

changelogRouter.get("/changelog", async (_req: Request, res: Response) => {
  try {
    const entries = await db
      .select()
      .from(changelogEntriesTable)
      .where(eq(changelogEntriesTable.published, "true"))
      .orderBy(desc(changelogEntriesTable.date))
      .limit(50);

    res.json({
      entries: entries.map((e) => ({
        id: e.id,
        version: e.version,
        title: e.title,
        date: e.date?.toISOString() ?? e.createdAt.toISOString(),
        category: e.category,
        body: e.body,
        tags: e.tags ?? [],
      })),
    });
  } catch (err) {
    logger.error({ err }, "[changelog] Failed to fetch entries");
    res.status(500).json({ error: "Failed to fetch changelog" });
  }
});

changelogRouter.post("/changelog", async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: { role?: string } }).user;
    if (!user || !["platform_owner", "super_admin"].includes(user.role ?? "")) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const { version, title, date, category, body, tags } = req.body as {
      version?: string;
      title?: string;
      date?: string;
      category?: string;
      body?: string;
      tags?: string[];
    };

    if (!version || !title || !body) {
      res.status(400).json({ error: "version, title, and body are required" });
      return;
    }

    const validCategories = ["feature", "improvement", "bugfix", "security", "breaking"] as const;
    const resolvedCategory = validCategories.includes(category as any)
      ? (category as (typeof validCategories)[number])
      : "feature";

    const [entry] = await db
      .insert(changelogEntriesTable)
      .values({
        version,
        title,
        date: date ? new Date(date) : new Date(),
        category: resolvedCategory,
        body,
        tags: tags ?? [],
      })
      .returning();

    res.status(201).json({ entry });
  } catch (err) {
    logger.error({ err }, "[changelog] Failed to create entry");
    res.status(500).json({ error: "Failed to create changelog entry" });
  }
});

export default changelogRouter;
