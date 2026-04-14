import { Router, Request, Response } from "express";
import { db, dosArticlesTable, dosLeadsTable } from "@szl-holdings/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { dosApiKeyAuth } from "../middlewares/dos-api-key-auth";
import { readLimiter } from "../middlewares/rate-limiters";

const router = Router();

router.use(dosApiKeyAuth);
router.use(readLimiter);

router.get("/content", async (req: Request, res: Response): Promise<void> => {
  const { type = "article", limit = "20", offset = "0" } = req.query as Record<string, string>;
  const lim = Math.min(Number(limit) || 20, 100);
  const off = Math.max(Number(offset) || 0, 0);

  if (type !== "article") {
    res.json({ data: [], total: 0, note: `Type '${type}' not yet available via public API` });
    return;
  }

  const articles = await db.select({
    id: dosArticlesTable.id,
    title: dosArticlesTable.title,
    slug: dosArticlesTable.slug,
    excerpt: dosArticlesTable.excerpt,
    publishedAt: dosArticlesTable.publishedSiteAt,
  }).from(dosArticlesTable)
    .where(eq(dosArticlesTable.siteStatus, "published"))
    .orderBy(desc(dosArticlesTable.publishedSiteAt))
    .limit(lim).offset(off);

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(dosArticlesTable).where(eq(dosArticlesTable.siteStatus, "published"));
  res.json({ data: articles.map(a => ({ ...a, type: "article" })), total: count ?? 0, limit: lim, offset: off });
});

router.get("/subscribers", async (req: Request, res: Response): Promise<void> => {
  const { segment, source, limit = "50", offset = "0" } = req.query as Record<string, string>;
  const lim = Math.min(Number(limit) || 50, 100);
  const off = Math.max(Number(offset) || 0, 0);

  const conditions = [];
  if (segment) conditions.push(sql`${dosLeadsTable.stage} = ${segment}`);
  if (source) conditions.push(sql`${dosLeadsTable.source} = ${source}`);

  const leads = conditions.length
    ? await db.select({ id: dosLeadsTable.id, email: dosLeadsTable.email, source: dosLeadsTable.source, stage: dosLeadsTable.stage, createdAt: dosLeadsTable.createdAt }).from(dosLeadsTable).where(and(...conditions)).limit(lim).offset(off)
    : await db.select({ id: dosLeadsTable.id, email: dosLeadsTable.email, source: dosLeadsTable.source, stage: dosLeadsTable.stage, createdAt: dosLeadsTable.createdAt }).from(dosLeadsTable).limit(lim).offset(off);

  const [{ count }] = conditions.length
    ? await db.select({ count: sql<number>`count(*)::int` }).from(dosLeadsTable).where(and(...conditions))
    : await db.select({ count: sql<number>`count(*)::int` }).from(dosLeadsTable);

  res.json({ data: leads.map(l => ({ id: l.id, email: l.email, source: l.source || "direct", segment: l.stage, joinedAt: l.createdAt })), total: count ?? 0, limit: lim, offset: off });
});

router.post("/subscribers", async (req: Request, res: Response): Promise<void> => {
  const { email, source } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "valid email required" });
    return;
  }
  const existing = await db.select({ id: dosLeadsTable.id }).from(dosLeadsTable).where(eq(dosLeadsTable.email, email)).limit(1);
  if (existing.length) {
    res.json({ id: existing[0].id, email, alreadySubscribed: true });
    return;
  }
  const [lead] = await db.insert(dosLeadsTable).values({ email, source: source || "api", stage: "new", score: 10, tags: [] }).returning();
  res.status(201).json({ id: lead.id, email: lead.email, magicLinkSent: false });
});

router.get("/analytics/summary", async (req: Request, res: Response): Promise<void> => {
  const [articleCount] = await db.select({ count: sql<number>`count(*)::int` }).from(dosArticlesTable).where(eq(dosArticlesTable.siteStatus, "published"));
  const [subscriberCount] = await db.select({ count: sql<number>`count(*)::int` }).from(dosLeadsTable);
  res.json({
    publishedArticles: articleCount?.count ?? 0,
    totalSubscribers: subscriberCount?.count ?? 0,
    activePlatforms: 5,
    periodNote: "Aggregated lifetime metrics. Per-platform analytics available in the dashboard.",
  });
});

export default router;
