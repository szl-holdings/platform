import { Router, type Request, type Response } from "express";
import { db, analyticsSessionsTable, analyticsPageViewsTable, analyticsConversionsTable, analyticsGoalsTable, dosAnalyticsEventsTable } from "@szl-holdings/db";
import { eq, desc, gte, lte, and, count, sql, isNotNull } from "drizzle-orm";
import { adminGuard } from "../middlewares/admin-guard";

const router = Router();

router.use("/analytics-lake", adminGuard);

function parseDateRange(req: Request): { from: Date; to: Date } {
  const days = parseInt(req.query["days"] as string ?? "7", 10);
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to };
}

router.get("/analytics-lake/sessions", async (req: Request, res: Response) => {
  try {
    const { from, to } = parseDateRange(req);
    const page = parseInt(req.query["page"] as string ?? "1", 10);
    const limit = Math.min(parseInt(req.query["limit"] as string ?? "50", 10), 200);
    const offset = (page - 1) * limit;
    const channel = req.query["channel"] as string | undefined;
    const converted = req.query["converted"] as string | undefined;

    const conditions = [
      gte(analyticsSessionsTable.sessionStart, from),
      lte(analyticsSessionsTable.sessionStart, to),
    ];
    if (channel) conditions.push(eq(analyticsSessionsTable.channel, channel));
    if (converted === "true") conditions.push(eq(analyticsSessionsTable.converted, true));
    if (converted === "false") conditions.push(eq(analyticsSessionsTable.converted, false));

    const sessions = await db.select()
      .from(analyticsSessionsTable)
      .where(and(...conditions))
      .orderBy(desc(analyticsSessionsTable.sessionStart))
      .limit(limit)
      .offset(offset);

    const totalResult = await db.select({ count: count() })
      .from(analyticsSessionsTable)
      .where(and(...conditions));

    res.json({
      sessions,
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("[analytics-lake] sessions error:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.get("/analytics-lake/sessions/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sessions = await db.select()
      .from(analyticsSessionsTable)
      .where(eq(analyticsSessionsTable.id, id))
      .limit(1);

    if (sessions.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const pageViews = await db.select()
      .from(analyticsPageViewsTable)
      .where(eq(analyticsPageViewsTable.sessionId, id))
      .orderBy(analyticsPageViewsTable.enterAt);

    const conversions = await db.select()
      .from(analyticsConversionsTable)
      .where(eq(analyticsConversionsTable.sessionId, id))
      .orderBy(analyticsConversionsTable.createdAt);

    const rawEvents = await db.select()
      .from(dosAnalyticsEventsTable)
      .where(eq(dosAnalyticsEventsTable.sessionId, id))
      .orderBy(dosAnalyticsEventsTable.createdAt)
      .limit(500);

    const pageViewsWithEvents = pageViews.map(pv => {
      const pvEnterMs = pv.enterAt?.getTime() ?? 0;
      const pvExitMs = pv.exitAt?.getTime() ?? pvEnterMs + (pv.durationSeconds ?? 0) * 1000;
      const events = rawEvents.filter(e => {
        const t = e.createdAt?.getTime() ?? 0;
        return t >= pvEnterMs && (pvExitMs === pvEnterMs ? t <= pvEnterMs + 30_000 : t <= pvExitMs);
      });
      return { ...pv, events };
    });

    res.json({
      session: sessions[0],
      pageViews: pageViewsWithEvents,
      conversions,
      rawEvents,
    });
  } catch (err) {
    console.error("[analytics-lake] session detail error:", err);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

router.get("/analytics-lake/active-visitors", async (_req: Request, res: Response) => {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [result] = await db.select({
      count: sql<number>`count(distinct ${analyticsSessionsTable.visitorId})`,
    })
      .from(analyticsSessionsTable)
      .where(gte(analyticsSessionsTable.sessionEnd, fiveMinAgo));

    res.json({ activeVisitors: result?.count ?? 0, windowMinutes: 5 });
  } catch (err) {
    console.error("[analytics-lake] active-visitors error:", err);
    res.status(500).json({ error: "Failed to fetch active visitors" });
  }
});

router.get("/analytics-lake/overview", async (req: Request, res: Response) => {
  try {
    const { from, to } = parseDateRange(req);

    const conditions = [
      gte(analyticsSessionsTable.sessionStart, from),
      lte(analyticsSessionsTable.sessionStart, to),
    ];

    const [totalSessions] = await db.select({ count: count() })
      .from(analyticsSessionsTable)
      .where(and(...conditions));

    const [totalPageViews] = await db.select({ count: count() })
      .from(analyticsPageViewsTable)
      .where(and(
        gte(analyticsPageViewsTable.enterAt, from),
        lte(analyticsPageViewsTable.enterAt, to),
      ));

    const [totalConversions] = await db.select({ count: count() })
      .from(analyticsConversionsTable)
      .where(and(
        gte(analyticsConversionsTable.createdAt, from),
        lte(analyticsConversionsTable.createdAt, to),
      ));

    const [convertedSessions] = await db.select({ count: count() })
      .from(analyticsSessionsTable)
      .where(and(...conditions, eq(analyticsSessionsTable.converted, true)));

    const [bouncedSessions] = await db.select({ count: count() })
      .from(analyticsSessionsTable)
      .where(and(...conditions, eq(analyticsSessionsTable.bounced, true)));

    const sessionCount = totalSessions?.count ?? 0;
    const conversionCount = convertedSessions?.count ?? 0;
    const bounceCount = bouncedSessions?.count ?? 0;

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [activeNow] = await db.select({
      count: sql<number>`count(distinct ${analyticsSessionsTable.visitorId})`,
    })
      .from(analyticsSessionsTable)
      .where(gte(analyticsSessionsTable.sessionEnd, fiveMinAgo));

    const channelData = await db.select({
      channel: analyticsSessionsTable.channel,
      count: count(),
    })
      .from(analyticsSessionsTable)
      .where(and(...conditions))
      .groupBy(analyticsSessionsTable.channel);

    const deviceData = await db.select({
      deviceType: analyticsSessionsTable.deviceType,
      count: count(),
    })
      .from(analyticsSessionsTable)
      .where(and(...conditions))
      .groupBy(analyticsSessionsTable.deviceType);

    const browserData = await db.select({
      browser: analyticsSessionsTable.browser,
      count: count(),
    })
      .from(analyticsSessionsTable)
      .where(and(...conditions))
      .groupBy(analyticsSessionsTable.browser);

    const topPagesData = await db.select({
      path: analyticsPageViewsTable.path,
      views: count(),
      uniqueVisitors: sql<number>`count(distinct ${analyticsPageViewsTable.visitorId})`,
      avgDurationSeconds: sql<number>`round(avg(${analyticsPageViewsTable.durationSeconds}))`,
      bounces: sql<number>`count(case when ${analyticsPageViewsTable.durationSeconds} < 10 and ${analyticsPageViewsTable.clickCount} = 0 then 1 end)`,
    })
      .from(analyticsPageViewsTable)
      .where(and(
        gte(analyticsPageViewsTable.enterAt, from),
        lte(analyticsPageViewsTable.enterAt, to),
      ))
      .groupBy(analyticsPageViewsTable.path)
      .orderBy(desc(count()))
      .limit(20);

    const topPagesWithBounceRate = topPagesData.map(p => ({
      ...p,
      bounceRate: p.views > 0 ? ((p.bounces / p.views) * 100).toFixed(1) : "0.0",
    }));

    const utmData = await db.select({
      utmSource: analyticsSessionsTable.utmSource,
      utmMedium: analyticsSessionsTable.utmMedium,
      utmCampaign: analyticsSessionsTable.utmCampaign,
      count: count(),
    })
      .from(analyticsSessionsTable)
      .where(and(...conditions, isNotNull(analyticsSessionsTable.utmSource)))
      .groupBy(
        analyticsSessionsTable.utmSource,
        analyticsSessionsTable.utmMedium,
        analyticsSessionsTable.utmCampaign,
      )
      .orderBy(desc(count()))
      .limit(20);

    const recentVisitors = await db.select({
      visitorId: analyticsSessionsTable.visitorId,
      path: analyticsSessionsTable.entryPath,
      channel: analyticsSessionsTable.channel,
      sessionStart: analyticsSessionsTable.sessionStart,
      sessionEnd: analyticsSessionsTable.sessionEnd,
      pageCount: analyticsSessionsTable.pageCount,
      converted: analyticsSessionsTable.converted,
    })
      .from(analyticsSessionsTable)
      .where(and(...conditions))
      .orderBy(desc(analyticsSessionsTable.sessionStart))
      .limit(20);

    const durationSamples = await db.select({ duration: analyticsSessionsTable.durationSeconds })
      .from(analyticsSessionsTable)
      .where(and(...conditions, isNotNull(analyticsSessionsTable.durationSeconds)))
      .limit(500);

    const avgDuration = durationSamples.length > 0
      ? Math.round(durationSamples.reduce((s, r) => s + (r.duration ?? 0), 0) / durationSamples.length)
      : 0;

    const durationBuckets = [
      { label: "0-10s", count: 0 },
      { label: "10-30s", count: 0 },
      { label: "30-60s", count: 0 },
      { label: "1-3m", count: 0 },
      { label: "3-10m", count: 0 },
      { label: "10m+", count: 0 },
    ];
    for (const { duration } of durationSamples) {
      const d = duration ?? 0;
      if (d < 10) durationBuckets[0].count++;
      else if (d < 30) durationBuckets[1].count++;
      else if (d < 60) durationBuckets[2].count++;
      else if (d < 180) durationBuckets[3].count++;
      else if (d < 600) durationBuckets[4].count++;
      else durationBuckets[5].count++;
    }

    const funnelData = {
      visit: sessionCount,
      engage: sessionCount - bounceCount,
      convert: conversionCount,
    };

    const uniqueVisitors = await db.select({
      count: sql<number>`count(distinct ${analyticsSessionsTable.visitorId})`,
    })
      .from(analyticsSessionsTable)
      .where(and(...conditions));

    res.json({
      totalSessions: sessionCount,
      totalPageViews: totalPageViews?.count ?? 0,
      totalConversions: totalConversions?.count ?? 0,
      uniqueVisitors: uniqueVisitors[0]?.count ?? 0,
      activeNow: activeNow?.count ?? 0,
      conversionRate: sessionCount > 0 ? ((conversionCount / sessionCount) * 100).toFixed(2) : "0.00",
      bounceRate: sessionCount > 0 ? ((bounceCount / sessionCount) * 100).toFixed(2) : "0.00",
      avgSessionDurationSeconds: avgDuration,
      channels: channelData,
      devices: deviceData,
      browsers: browserData,
      topPages: topPagesWithBounceRate,
      utmCampaigns: utmData,
      recentVisitors,
      durationHistogram: durationBuckets,
      funnel: funnelData,
    });
  } catch (err) {
    console.error("[analytics-lake] overview error:", err);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

router.get("/analytics-lake/goals", async (req: Request, res: Response) => {
  try {
    const goals = await db.select().from(analyticsGoalsTable).orderBy(desc(analyticsGoalsTable.createdAt));
    res.json({ goals });
  } catch (err) {
    console.error("[analytics-lake] goals error:", err);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

router.post("/analytics-lake/goals", async (req: Request, res: Response) => {
  try {
    const { name, description, triggerEvent, urlMatch, propertyConditions, value, currency } = req.body as {
      name?: string;
      description?: string;
      triggerEvent?: string;
      urlMatch?: string;
      propertyConditions?: Record<string, unknown>;
      value?: number;
      currency?: string;
    };

    if (!name || !triggerEvent) {
      res.status(400).json({ error: "name and triggerEvent are required" });
      return;
    }

    const [goal] = await db.insert(analyticsGoalsTable).values({
      name,
      description,
      triggerEvent,
      urlMatch,
      propertyConditions: propertyConditions ?? {},
      value,
      currency: currency ?? "USD",
      active: true,
    }).returning();

    res.status(201).json({ goal });
  } catch (err) {
    console.error("[analytics-lake] create goal error:", err);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

router.patch("/analytics-lake/goals/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] ?? "0", 10);
    const updates = req.body as Partial<{
      name: string;
      description: string;
      triggerEvent: string;
      urlMatch: string;
      propertyConditions: Record<string, unknown>;
      value: number;
      currency: string;
      active: boolean;
    }>;

    const [goal] = await db.update(analyticsGoalsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(analyticsGoalsTable.id, id))
      .returning();

    if (!goal) {
      res.status(404).json({ error: "Goal not found" });
      return;
    }

    res.json({ goal });
  } catch (err) {
    console.error("[analytics-lake] update goal error:", err);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

router.delete("/analytics-lake/goals/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] ?? "0", 10);
    await db.delete(analyticsGoalsTable).where(eq(analyticsGoalsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error("[analytics-lake] delete goal error:", err);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

router.get("/analytics-lake/goals/:id/performance", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] ?? "0", 10);
    const { from, to } = parseDateRange(req);

    const [goal] = await db.select().from(analyticsGoalsTable).where(eq(analyticsGoalsTable.id, id)).limit(1);
    if (!goal) {
      res.status(404).json({ error: "Goal not found" });
      return;
    }

    const conversions = await db.select()
      .from(analyticsConversionsTable)
      .where(and(
        eq(analyticsConversionsTable.goalId, id),
        gte(analyticsConversionsTable.createdAt, from),
        lte(analyticsConversionsTable.createdAt, to),
      ))
      .orderBy(analyticsConversionsTable.createdAt);

    const totalConversions = conversions.length;
    const avgTimeToConversion = conversions.length > 0
      ? Math.round(conversions.reduce((s, c) => s + (c.timeToConversionSeconds ?? 0), 0) / conversions.length)
      : 0;

    const byDay: Record<string, number> = {};
    for (const c of conversions) {
      const day = c.createdAt.toISOString().split("T")[0] ?? "";
      byDay[day] = (byDay[day] ?? 0) + 1;
    }

    const [totalSessions] = await db.select({ count: count() })
      .from(analyticsSessionsTable)
      .where(and(
        gte(analyticsSessionsTable.sessionStart, from),
        lte(analyticsSessionsTable.sessionStart, to),
      ));

    const completionRate = (totalSessions?.count ?? 0) > 0
      ? ((totalConversions / (totalSessions?.count ?? 1)) * 100).toFixed(2)
      : "0.00";

    res.json({
      goal,
      totalConversions,
      completionRate,
      avgTimeToConversionSeconds: avgTimeToConversion,
      byDay,
    });
  } catch (err) {
    console.error("[analytics-lake] goal performance error:", err);
    res.status(500).json({ error: "Failed to fetch goal performance" });
  }
});

export default router;
