import { Router, type IRouter } from "express";
import { db, pool, feedbackTable, feedbackSurveyPrefsTable } from "@szl-holdings/db";
import { desc, eq, sql, and, gte, lt } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import type { Request, Response } from "express";
import { feedbackNpsSchema, feedbackContextualSchema, validateBody } from "../lib/validation";
import { z } from "zod";

const feedbackRouter: IRouter = Router();

feedbackRouter.use("/feedback", authMiddleware({ required: false }));

feedbackRouter.post("/feedback/nps", validateBody(feedbackNpsSchema), async (req: Request, res: Response) => {
  try {
    const { score, comment, appName, pageUrl, userRole } = req.body as z.infer<typeof feedbackNpsSchema>;

    const userId: number | null = (req as unknown as { user?: { id: number } }).user?.id ?? null;

    const [entry] = await db.insert(feedbackTable).values({
      userId,
      type: "nps",
      score,
      comment: comment ?? null,
      appName: appName ?? null,
      pageUrl: pageUrl ?? null,
      userRole: userRole ?? null,
      dismissed: false,
    }).returning();

    if (userId) {
      await db
        .insert(feedbackSurveyPrefsTable)
        .values({ userId, lastNpsSurveyAt: new Date(), npsSnoozedUntil: null })
        .onConflictDoUpdate({
          target: feedbackSurveyPrefsTable.userId,
          set: { lastNpsSurveyAt: new Date(), npsSnoozedUntil: null, updatedAt: new Date() },
        });
    }

    res.status(201).json({ success: true, id: entry.id });
  } catch (err) {
    console.error("POST /feedback/nps error:", err);
    res.status(500).json({ error: "Failed to submit NPS feedback" });
  }
});

feedbackRouter.post("/feedback/contextual", validateBody(feedbackContextualSchema), async (req: Request, res: Response) => {
  try {
    const { sentiment, comment, appName, pageUrl, userRole } = req.body as z.infer<typeof feedbackContextualSchema>;

    const userId: number | null = (req as unknown as { user?: { id: number } }).user?.id ?? null;

    const [entry] = await db.insert(feedbackTable).values({
      userId,
      type: "contextual",
      score: null,
      sentiment,
      comment: comment ?? null,
      appName: appName ?? null,
      pageUrl: pageUrl ?? null,
      userRole: userRole ?? null,
      dismissed: false,
    }).returning();

    res.status(201).json({ success: true, id: entry.id });
  } catch (err) {
    console.error("POST /feedback/contextual error:", err);
    res.status(500).json({ error: "Failed to submit contextual feedback" });
  }
});

const dismissSchema = z.object({ snoozeDays: z.number().int().min(1).max(365).default(7) });

feedbackRouter.post("/feedback/dismiss", validateBody(dismissSchema), async (req: Request, res: Response) => {
  try {
    const userId: number | null = (req as unknown as { user?: { id: number } }).user?.id ?? null;
    const { snoozeDays } = req.body as z.infer<typeof dismissSchema>;

    if (userId) {
      const snoozedUntil = new Date(Date.now() + snoozeDays * 24 * 60 * 60 * 1000);
      await db
        .insert(feedbackSurveyPrefsTable)
        .values({ userId, npsSnoozedUntil: snoozedUntil })
        .onConflictDoUpdate({
          target: feedbackSurveyPrefsTable.userId,
          set: { npsSnoozedUntil: snoozedUntil, updatedAt: new Date() },
        });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("POST /feedback/dismiss error:", err);
    res.status(500).json({ error: "Failed to dismiss survey" });
  }
});

feedbackRouter.get("/feedback/nps-eligibility", async (req: Request, res: Response) => {
  try {
    const userId: number | null = (req as unknown as { user?: { id: number } }).user?.id ?? null;

    if (!userId) {
      res.json({ eligible: true });
      return;
    }

    const prefs = await db
      .select()
      .from(feedbackSurveyPrefsTable)
      .where(eq(feedbackSurveyPrefsTable.userId, userId))
      .limit(1);

    const pref = prefs[0];

    if (!pref) {
      res.json({ eligible: true });
      return;
    }

    if (pref.npsOptOut) {
      res.json({ eligible: false, reason: "opted_out" });
      return;
    }

    if (pref.npsSnoozedUntil && new Date(pref.npsSnoozedUntil) > new Date()) {
      res.json({ eligible: false, reason: "snoozed", until: pref.npsSnoozedUntil });
      return;
    }

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    if (pref.lastNpsSurveyAt && new Date(pref.lastNpsSurveyAt) > ninetyDaysAgo) {
      res.json({ eligible: false, reason: "too_soon", lastSurveyAt: pref.lastNpsSurveyAt });
      return;
    }

    res.json({ eligible: true });
  } catch (err) {
    console.error("GET /feedback/nps-eligibility error:", err);
    res.status(500).json({ error: "Failed to check NPS eligibility" });
  }
});

feedbackRouter.use("/admin/feedback", authMiddleware());
feedbackRouter.use("/admin/feedback", requireRole("admin"));

feedbackRouter.get("/admin/feedback/analytics", async (_req: Request, res: Response) => {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [npsStats] = await db
      .select({
        total: sql<number>`COUNT(*)::int`,
        avgScore: sql<number>`ROUND(AVG(${feedbackTable.score}), 1)`,
        promoters: sql<number>`COUNT(*) FILTER (WHERE ${feedbackTable.score} >= 9)::int`,
        passives: sql<number>`COUNT(*) FILTER (WHERE ${feedbackTable.score} >= 7 AND ${feedbackTable.score} <= 8)::int`,
        detractors: sql<number>`COUNT(*) FILTER (WHERE ${feedbackTable.score} <= 6)::int`,
      })
      .from(feedbackTable)
      .where(and(eq(feedbackTable.type, "nps"), gte(feedbackTable.createdAt, ninetyDaysAgo)));

    const promoters = npsStats.promoters ?? 0;
    const detractors = npsStats.detractors ?? 0;
    const total = npsStats.total ?? 0;
    const npsScore = total > 0
      ? Math.round(((promoters - detractors) / total) * 100)
      : null;

    const npsOverTime = await db
      .select({
        week: sql<string>`DATE_TRUNC('week', ${feedbackTable.createdAt})::date::text`,
        avgScore: sql<number>`ROUND(AVG(${feedbackTable.score}), 1)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(feedbackTable)
      .where(and(eq(feedbackTable.type, "nps"), gte(feedbackTable.createdAt, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))))
      .groupBy(sql`DATE_TRUNC('week', ${feedbackTable.createdAt})`)
      .orderBy(sql`DATE_TRUNC('week', ${feedbackTable.createdAt})`);

    const sentimentBreakdown = await db
      .select({
        sentiment: feedbackTable.sentiment,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(feedbackTable)
      .where(eq(feedbackTable.type, "contextual"))
      .groupBy(feedbackTable.sentiment);

    const perAppNps = await db
      .select({
        appName: feedbackTable.appName,
        avgScore: sql<number>`ROUND(AVG(${feedbackTable.score}), 1)`,
        count: sql<number>`COUNT(*)::int`,
        promoters: sql<number>`COUNT(*) FILTER (WHERE ${feedbackTable.score} >= 9)::int`,
        detractors: sql<number>`COUNT(*) FILTER (WHERE ${feedbackTable.score} <= 6)::int`,
      })
      .from(feedbackTable)
      .where(eq(feedbackTable.type, "nps"))
      .groupBy(feedbackTable.appName)
      .orderBy(sql`COUNT(*) DESC`);

    const recentComments = await db
      .select({
        id: feedbackTable.id,
        type: feedbackTable.type,
        score: feedbackTable.score,
        sentiment: feedbackTable.sentiment,
        comment: feedbackTable.comment,
        appName: feedbackTable.appName,
        pageUrl: feedbackTable.pageUrl,
        userRole: feedbackTable.userRole,
        createdAt: feedbackTable.createdAt,
      })
      .from(feedbackTable)
      .where(sql`${feedbackTable.comment} IS NOT NULL AND ${feedbackTable.comment} != ''`)
      .orderBy(desc(feedbackTable.createdAt))
      .limit(20);

    const [contextualTotals] = await db
      .select({
        total: sql<number>`COUNT(*)::int`,
        positive: sql<number>`COUNT(*) FILTER (WHERE ${feedbackTable.sentiment} = 'positive')::int`,
        negative: sql<number>`COUNT(*) FILTER (WHERE ${feedbackTable.sentiment} = 'negative')::int`,
        neutral: sql<number>`COUNT(*) FILTER (WHERE ${feedbackTable.sentiment} = 'neutral')::int`,
      })
      .from(feedbackTable)
      .where(eq(feedbackTable.type, "contextual"));

    res.json({
      nps: {
        score: npsScore,
        avgScore: npsStats.avgScore,
        total,
        promoters,
        passives: npsStats.passives ?? 0,
        detractors,
        promoterPct: total > 0 ? Math.round((promoters / total) * 100) : 0,
        detractorPct: total > 0 ? Math.round((detractors / total) * 100) : 0,
        passivePct: total > 0 ? Math.round(((npsStats.passives ?? 0) / total) * 100) : 0,
      },
      npsOverTime,
      perAppNps,
      contextual: {
        total: contextualTotals.total,
        positive: contextualTotals.positive,
        negative: contextualTotals.negative,
        neutral: contextualTotals.neutral,
      },
      sentimentBreakdown,
      recentComments,
    });
  } catch (err) {
    console.error("GET /admin/feedback/analytics error:", err);
    res.status(500).json({ error: "Failed to load feedback analytics" });
  }
});

feedbackRouter.get("/admin/feedback/list", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query["page"] as string) ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query["limit"] as string) ?? "25", 10)));
    const offset = (page - 1) * limit;
    const type = req.query["type"] as string | undefined;
    const appName = req.query["appName"] as string | undefined;

    const conditions = [];
    if (type === "nps" || type === "contextual") conditions.push(eq(feedbackTable.type, type));
    if (appName) conditions.push(eq(feedbackTable.appName, appName));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [entries, [countResult]] = await Promise.all([
      db
        .select()
        .from(feedbackTable)
        .where(whereClause)
        .orderBy(desc(feedbackTable.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(feedbackTable)
        .where(whereClause),
    ]);

    res.json({
      data: entries,
      pagination: {
        total: countResult.count,
        page,
        limit,
        pages: Math.ceil(countResult.count / limit),
      },
    });
  } catch (err) {
    console.error("GET /admin/feedback/list error:", err);
    res.status(500).json({ error: "Failed to list feedback" });
  }
});

export { feedbackRouter };
