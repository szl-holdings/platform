import { Router, Request, Response } from "express";
import {
  db,
  dosArticlesTable, dosArticleVersionsTable, dosNewslettersTable,
  dosCarouselProjectsTable, dosCarouselSlidesTable, dosXPostsTable,
  dosCampaignsTable, dosCampaignLinksTable, dosLeadsTable, dosLeadNotesTable,
  dosEditorialPillarsTable, dosCtaBlocksTable, dosContentCalendarItemsTable,
  dosDistributionTargetsTable, dosPublicationUrlsTable, dosAuthorProfilesTable,
  dosSiteSettingsTable, dosIntegrationStatusTable, dosAutomationRunsTable,
  dosLinktreeConfigTable, dosPageViewsTable, dosAnalyticsEventsTable,
} from "@szl-holdings/db";
import { eq, desc, asc, and, gte, count } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const requireAuth = authMiddleware({ required: true });

router.get("/articles", async (_req: Request, res: Response) => {
  const articles = await db.select().from(dosArticlesTable).orderBy(desc(dosArticlesTable.createdAt)).limit(100);
  res.json(articles);
});

router.get("/articles/:id", async (req: Request, res: Response) => {
  const [article] = await db.select().from(dosArticlesTable).where(eq(dosArticlesTable.id, Number(req.params.id)));
  if (!article) return res.status(404).json({ error: "Article not found" });
  res.json(article);
});

router.get("/articles/slug/:slug", async (req: Request, res: Response) => {
  const [article] = await db.select().from(dosArticlesTable).where(eq(dosArticlesTable.slug, req.params.slug));
  if (!article) return res.status(404).json({ error: "Article not found" });
  res.json(article);
});

router.post("/articles", requireAuth, async (req: Request, res: Response) => {
  const [article] = await db.insert(dosArticlesTable).values(req.body).returning();
  res.status(201).json(article);
});

router.patch("/articles/:id", requireAuth, async (req: Request, res: Response) => {
  const [article] = await db.update(dosArticlesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosArticlesTable.id, Number(req.params.id))).returning();
  if (!article) return res.status(404).json({ error: "Article not found" });
  res.json(article);
});

router.delete("/articles/:id", requireAuth, async (req: Request, res: Response) => {
  await db.delete(dosArticlesTable).where(eq(dosArticlesTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.get("/articles/:id/versions", async (req: Request, res: Response) => {
  const versions = await db.select().from(dosArticleVersionsTable).where(eq(dosArticleVersionsTable.articleId, Number(req.params.id))).orderBy(desc(dosArticleVersionsTable.createdAt));
  res.json(versions);
});

router.get("/newsletters", async (_req: Request, res: Response) => {
  const newsletters = await db.select().from(dosNewslettersTable).orderBy(desc(dosNewslettersTable.createdAt)).limit(100);
  res.json(newsletters);
});

router.get("/newsletters/:id", async (req: Request, res: Response) => {
  const [nl] = await db.select().from(dosNewslettersTable).where(eq(dosNewslettersTable.id, Number(req.params.id)));
  if (!nl) return res.status(404).json({ error: "Newsletter not found" });
  res.json(nl);
});

router.post("/newsletters", requireAuth, async (req: Request, res: Response) => {
  const [nl] = await db.insert(dosNewslettersTable).values(req.body).returning();
  res.status(201).json(nl);
});

router.patch("/newsletters/:id", requireAuth, async (req: Request, res: Response) => {
  const [nl] = await db.update(dosNewslettersTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosNewslettersTable.id, Number(req.params.id))).returning();
  if (!nl) return res.status(404).json({ error: "Newsletter not found" });
  res.json(nl);
});

router.delete("/newsletters/:id", requireAuth, async (req: Request, res: Response) => {
  await db.delete(dosNewslettersTable).where(eq(dosNewslettersTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.get("/carousels", async (_req: Request, res: Response) => {
  const carousels = await db.select().from(dosCarouselProjectsTable).orderBy(desc(dosCarouselProjectsTable.createdAt)).limit(100);
  res.json(carousels);
});

router.get("/carousels/:id", async (req: Request, res: Response) => {
  const [c] = await db.select().from(dosCarouselProjectsTable).where(eq(dosCarouselProjectsTable.id, Number(req.params.id)));
  if (!c) return res.status(404).json({ error: "Carousel not found" });
  const slides = await db.select().from(dosCarouselSlidesTable).where(eq(dosCarouselSlidesTable.projectId, c.id)).orderBy(asc(dosCarouselSlidesTable.slideNumber));
  res.json({ ...c, slides });
});

router.post("/carousels", requireAuth, async (req: Request, res: Response) => {
  const { slides, ...project } = req.body;
  const [c] = await db.insert(dosCarouselProjectsTable).values(project).returning();
  if (slides?.length) {
    await db.insert(dosCarouselSlidesTable).values(slides.map((s: Record<string, unknown>, i: number) => ({ ...s, projectId: c.id, slideNumber: i + 1 })));
  }
  res.status(201).json(c);
});

router.patch("/carousels/:id", requireAuth, async (req: Request, res: Response) => {
  const [c] = await db.update(dosCarouselProjectsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosCarouselProjectsTable.id, Number(req.params.id))).returning();
  if (!c) return res.status(404).json({ error: "Carousel not found" });
  res.json(c);
});

router.get("/x-posts", async (_req: Request, res: Response) => {
  const posts = await db.select().from(dosXPostsTable).orderBy(desc(dosXPostsTable.createdAt)).limit(100);
  res.json(posts);
});

router.get("/x-posts/:id", async (req: Request, res: Response) => {
  const [post] = await db.select().from(dosXPostsTable).where(eq(dosXPostsTable.id, Number(req.params.id)));
  if (!post) return res.status(404).json({ error: "X post not found" });
  res.json(post);
});

router.post("/x-posts", requireAuth, async (req: Request, res: Response) => {
  const [post] = await db.insert(dosXPostsTable).values(req.body).returning();
  res.status(201).json(post);
});

router.patch("/x-posts/:id", requireAuth, async (req: Request, res: Response) => {
  const [post] = await db.update(dosXPostsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosXPostsTable.id, Number(req.params.id))).returning();
  if (!post) return res.status(404).json({ error: "X post not found" });
  res.json(post);
});

router.delete("/x-posts/:id", requireAuth, async (req: Request, res: Response) => {
  await db.delete(dosXPostsTable).where(eq(dosXPostsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.post("/x-posts/:id/queue", requireAuth, async (req: Request, res: Response) => {
  const [post] = await db.update(dosXPostsTable).set({ status: "queued", scheduledFor: req.body.scheduledFor || new Date(), updatedAt: new Date() }).where(eq(dosXPostsTable.id, Number(req.params.id))).returning();
  if (!post) return res.status(404).json({ error: "X post not found" });
  res.json(post);
});

router.get("/campaigns", async (_req: Request, res: Response) => {
  const campaigns = await db.select().from(dosCampaignsTable).orderBy(desc(dosCampaignsTable.createdAt)).limit(100);
  res.json(campaigns);
});

router.post("/campaigns", requireAuth, async (req: Request, res: Response) => {
  const [c] = await db.insert(dosCampaignsTable).values(req.body).returning();
  res.status(201).json(c);
});

router.patch("/campaigns/:id", requireAuth, async (req: Request, res: Response) => {
  const [c] = await db.update(dosCampaignsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosCampaignsTable.id, Number(req.params.id))).returning();
  if (!c) return res.status(404).json({ error: "Campaign not found" });
  res.json(c);
});

router.get("/campaigns/:id/links", async (req: Request, res: Response) => {
  const links = await db.select().from(dosCampaignLinksTable).where(eq(dosCampaignLinksTable.campaignId, Number(req.params.id)));
  res.json(links);
});

router.post("/campaigns/:id/links", requireAuth, async (req: Request, res: Response) => {
  const { source, medium, campaign, content, term, destination, name } = req.body;
  const params = new URLSearchParams();
  if (source) params.set("utm_source", source);
  if (medium) params.set("utm_medium", medium);
  if (campaign) params.set("utm_campaign", campaign);
  if (content) params.set("utm_content", content);
  if (term) params.set("utm_term", term);
  const fullUrl = `${destination}${destination.includes("?") ? "&" : "?"}${params.toString()}`;
  const [link] = await db.insert(dosCampaignLinksTable).values({ ...req.body, campaignId: Number(req.params.id), fullUrl }).returning();
  res.status(201).json(link);
});

router.get("/leads", async (req: Request, res: Response) => {
  const stage = req.query.stage as string | undefined;
  let query = db.select().from(dosLeadsTable).orderBy(desc(dosLeadsTable.createdAt)).limit(100);
  if (stage) {
    const leads = await db.select().from(dosLeadsTable).where(eq(dosLeadsTable.stage, stage)).orderBy(desc(dosLeadsTable.createdAt)).limit(100);
    return res.json(leads);
  }
  const leads = await query;
  res.json(leads);
});

router.post("/leads", async (req: Request, res: Response) => {
  let score = 0;
  const { email, budget, message, source } = req.body;
  if (email && !email.includes("gmail") && !email.includes("yahoo") && !email.includes("hotmail")) score += 20;
  if (budget) score += 15;
  if (source === "offer-page") score += 15;
  if (message && message.length > 50) score += 5;
  const [lead] = await db.insert(dosLeadsTable).values({ ...req.body, score }).returning();
  res.status(201).json(lead);
});

router.patch("/leads/:id", requireAuth, async (req: Request, res: Response) => {
  const [lead] = await db.update(dosLeadsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosLeadsTable.id, Number(req.params.id))).returning();
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json(lead);
});

router.get("/leads/:id/notes", async (req: Request, res: Response) => {
  const notes = await db.select().from(dosLeadNotesTable).where(eq(dosLeadNotesTable.leadId, Number(req.params.id))).orderBy(desc(dosLeadNotesTable.createdAt));
  res.json(notes);
});

router.post("/leads/:id/notes", requireAuth, async (req: Request, res: Response) => {
  const [note] = await db.insert(dosLeadNotesTable).values({ ...req.body, leadId: Number(req.params.id) }).returning();
  res.status(201).json(note);
});

router.get("/pillars", async (_req: Request, res: Response) => {
  const pillars = await db.select().from(dosEditorialPillarsTable).orderBy(asc(dosEditorialPillarsTable.sortOrder));
  res.json(pillars);
});

router.post("/pillars", requireAuth, async (req: Request, res: Response) => {
  const [p] = await db.insert(dosEditorialPillarsTable).values(req.body).returning();
  res.status(201).json(p);
});

router.get("/cta-blocks", async (_req: Request, res: Response) => {
  const blocks = await db.select().from(dosCtaBlocksTable).orderBy(desc(dosCtaBlocksTable.createdAt));
  res.json(blocks);
});

router.post("/cta-blocks", requireAuth, async (req: Request, res: Response) => {
  const [b] = await db.insert(dosCtaBlocksTable).values(req.body).returning();
  res.status(201).json(b);
});

router.get("/calendar", async (req: Request, res: Response) => {
  const items = await db.select().from(dosContentCalendarItemsTable).orderBy(asc(dosContentCalendarItemsTable.scheduledDate)).limit(200);
  res.json(items);
});

router.post("/calendar", requireAuth, async (req: Request, res: Response) => {
  const [item] = await db.insert(dosContentCalendarItemsTable).values(req.body).returning();
  res.status(201).json(item);
});

router.patch("/calendar/:id", requireAuth, async (req: Request, res: Response) => {
  const [item] = await db.update(dosContentCalendarItemsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosContentCalendarItemsTable.id, Number(req.params.id))).returning();
  if (!item) return res.status(404).json({ error: "Calendar item not found" });
  res.json(item);
});

router.get("/distribution", async (_req: Request, res: Response) => {
  const targets = await db.select().from(dosDistributionTargetsTable).orderBy(desc(dosDistributionTargetsTable.createdAt)).limit(200);
  res.json(targets);
});

router.post("/distribution", requireAuth, async (req: Request, res: Response) => {
  const [t] = await db.insert(dosDistributionTargetsTable).values(req.body).returning();
  res.status(201).json(t);
});

router.patch("/distribution/:id", requireAuth, async (req: Request, res: Response) => {
  const [t] = await db.update(dosDistributionTargetsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosDistributionTargetsTable.id, Number(req.params.id))).returning();
  if (!t) return res.status(404).json({ error: "Distribution target not found" });
  res.json(t);
});

router.get("/settings", async (_req: Request, res: Response) => {
  const settings = await db.select().from(dosSiteSettingsTable).orderBy(asc(dosSiteSettingsTable.category));
  res.json(settings);
});

router.post("/settings", requireAuth, async (req: Request, res: Response) => {
  const [s] = await db.insert(dosSiteSettingsTable).values(req.body).returning();
  res.status(201).json(s);
});

router.patch("/settings/:key", requireAuth, async (req: Request, res: Response) => {
  const [s] = await db.update(dosSiteSettingsTable).set({ value: req.body.value, updatedAt: new Date() }).where(eq(dosSiteSettingsTable.key, req.params.key)).returning();
  if (!s) return res.status(404).json({ error: "Setting not found" });
  res.json(s);
});

router.get("/integrations", async (_req: Request, res: Response) => {
  const integrations = await db.select().from(dosIntegrationStatusTable).orderBy(asc(dosIntegrationStatusTable.provider));
  res.json(integrations);
});

router.post("/integrations/retry/:provider", requireAuth, async (req: Request, res: Response) => {
  const [i] = await db.update(dosIntegrationStatusTable).set({ status: "disconnected", lastError: null, updatedAt: new Date() }).where(eq(dosIntegrationStatusTable.provider, req.params.provider)).returning();
  if (!i) return res.status(404).json({ error: "Integration not found" });
  res.json(i);
});

router.get("/authors", async (_req: Request, res: Response) => {
  const authors = await db.select().from(dosAuthorProfilesTable);
  res.json(authors);
});

router.post("/authors", requireAuth, async (req: Request, res: Response) => {
  const [a] = await db.insert(dosAuthorProfilesTable).values(req.body).returning();
  res.status(201).json(a);
});

router.get("/linktree", async (_req: Request, res: Response) => {
  const items = await db.select().from(dosLinktreeConfigTable).where(eq(dosLinktreeConfigTable.isActive, true)).orderBy(asc(dosLinktreeConfigTable.sortOrder));
  res.json(items);
});

router.post("/linktree", requireAuth, async (req: Request, res: Response) => {
  const [item] = await db.insert(dosLinktreeConfigTable).values(req.body).returning();
  res.status(201).json(item);
});

router.get("/automation-runs", async (_req: Request, res: Response) => {
  const runs = await db.select().from(dosAutomationRunsTable).orderBy(desc(dosAutomationRunsTable.createdAt)).limit(50);
  res.json(runs);
});

router.post("/analytics/event", async (req: Request, res: Response) => {
  const [event] = await db.insert(dosAnalyticsEventsTable).values(req.body).returning();
  res.status(201).json(event);
});

router.post("/analytics/pageview", async (req: Request, res: Response) => {
  const [pv] = await db.insert(dosPageViewsTable).values(req.body).returning();
  res.status(201).json(pv);
});

router.get("/analytics/dashboard", async (_req: Request, res: Response) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [pvCount] = await db.select({ count: count() }).from(dosPageViewsTable).where(gte(dosPageViewsTable.createdAt, weekAgo));
  const [leadCount] = await db.select({ count: count() }).from(dosLeadsTable).where(gte(dosLeadsTable.createdAt, weekAgo));
  const [articleCount] = await db.select({ count: count() }).from(dosArticlesTable).where(eq(dosArticlesTable.status, "published"));
  const [xQueued] = await db.select({ count: count() }).from(dosXPostsTable).where(eq(dosXPostsTable.status, "queued"));
  const [xSent] = await db.select({ count: count() }).from(dosXPostsTable).where(eq(dosXPostsTable.status, "sent"));
  const [xFailed] = await db.select({ count: count() }).from(dosXPostsTable).where(eq(dosXPostsTable.status, "failed"));
  const [nlReady] = await db.select({ count: count() }).from(dosNewslettersTable).where(eq(dosNewslettersTable.status, "approved"));
  const [autoRuns] = await db.select({ count: count() }).from(dosAutomationRunsTable).where(and(gte(dosAutomationRunsTable.createdAt, weekAgo), eq(dosAutomationRunsTable.status, "completed")));

  res.json({
    visitsThisWeek: pvCount?.count ?? 0,
    leadsThisWeek: leadCount?.count ?? 0,
    publishedArticles: articleCount?.count ?? 0,
    xQueued: xQueued?.count ?? 0,
    xSentTotal: xSent?.count ?? 0,
    xFailed: xFailed?.count ?? 0,
    newslettersReady: nlReady?.count ?? 0,
    automationsCompletedThisWeek: autoRuns?.count ?? 0,
  });
});

router.get("/articles/published/list", async (_req: Request, res: Response) => {
  const articles = await db.select({
    id: dosArticlesTable.id,
    title: dosArticlesTable.title,
    slug: dosArticlesTable.slug,
    excerpt: dosArticlesTable.excerpt,
    coverImageUrl: dosArticlesTable.coverImageUrl,
    readTimeMinutes: dosArticlesTable.readTimeMinutes,
    tags: dosArticlesTable.tags,
    publishedSiteAt: dosArticlesTable.publishedSiteAt,
    articleType: dosArticlesTable.articleType,
  }).from(dosArticlesTable).where(eq(dosArticlesTable.siteStatus, "published")).orderBy(desc(dosArticlesTable.publishedSiteAt)).limit(50);
  res.json(articles);
});

export default router;
