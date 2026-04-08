import { Router, Request, Response } from "express";
import { z } from "zod";
import { computeLeadScore } from "../lib/lead-scoring";
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

router.get("/campaigns", requireAuth, async (_req: Request, res: Response) => {
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

router.get("/campaigns/:id/links", requireAuth, async (req: Request, res: Response) => {
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

// ─── Zod schemas for admin write paths ───────────────────────────────────────

const LeadCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  stage: z.string().optional(),
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  landingPage: z.string().optional(),
  budget: z.string().optional(),
  message: z.string().optional(),
  interestArea: z.string().optional(),
  visitCount: z.number().int().optional(),
  ctaAfterCarousel: z.boolean().optional(),
});

const LinktreeItemSchema = z.object({
  label: z.string().min(1),
  destination: z.string().url("Destination must be a valid URL"),
  campaignTag: z.string().optional(),
  contentTag: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const SettingWriteSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  category: z.string().optional(),
  label: z.string().optional(),
});

// ─── Lead routes ─────────────────────────────────────────────────────────────

router.get("/leads", requireAuth, async (req: Request, res: Response) => {
  const stage = req.query.stage as string | undefined;
  const campaign = req.query.campaign as string | undefined;
  const period = req.query.period as string | undefined;

  const conditions = [];
  if (stage) conditions.push(eq(dosLeadsTable.stage, stage));
  if (campaign) conditions.push(eq(dosLeadsTable.campaign, campaign));
  if (period === "weekly") conditions.push(gte(dosLeadsTable.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  else if (period === "monthly") conditions.push(gte(dosLeadsTable.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

  const leads = conditions.length > 0
    ? await db.select().from(dosLeadsTable).where(and(...conditions)).orderBy(desc(dosLeadsTable.createdAt)).limit(200)
    : await db.select().from(dosLeadsTable).orderBy(desc(dosLeadsTable.createdAt)).limit(200);
  res.json(leads);
});

router.post("/leads", async (req: Request, res: Response) => {
  const parsed = LeadCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const data = parsed.data;
  const score = computeLeadScore(data);
  const [lead] = await db.insert(dosLeadsTable).values({ ...data, score }).returning();
  res.status(201).json(lead);
});

router.patch("/leads/:id", requireAuth, async (req: Request, res: Response) => {
  const [existing] = await db.select().from(dosLeadsTable).where(eq(dosLeadsTable.id, Number(req.params.id)));
  if (!existing) return res.status(404).json({ error: "Lead not found" });

  const merged = { ...existing, ...req.body };
  const score = computeLeadScore({
    email: merged.email,
    budget: merged.budget,
    source: merged.source,
    medium: merged.medium,
    landingPage: merged.landingPage,
    message: merged.message,
    visitCount: merged.visitCount,
    ctaAfterCarousel: merged.ctaAfterCarousel,
    interestArea: merged.interestArea,
  });
  const [lead] = await db.update(dosLeadsTable).set({ ...req.body, score, updatedAt: new Date() }).where(eq(dosLeadsTable.id, Number(req.params.id))).returning();
  res.json(lead);
});

router.delete("/leads/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await db.delete(dosLeadNotesTable).where(eq(dosLeadNotesTable.leadId, id));
  await db.delete(dosLeadsTable).where(eq(dosLeadsTable.id, id));
  res.json({ success: true });
});

router.get("/leads/:id/notes", requireAuth, async (req: Request, res: Response) => {
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

router.get("/settings", requireAuth, async (_req: Request, res: Response) => {
  const settings = await db.select().from(dosSiteSettingsTable).orderBy(asc(dosSiteSettingsTable.category));
  res.json(settings);
});

router.post("/settings", requireAuth, async (req: Request, res: Response) => {
  const parsed = SettingWriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const [s] = await db.insert(dosSiteSettingsTable).values(parsed.data).returning();
  res.status(201).json(s);
});

router.patch("/settings/:key", requireAuth, async (req: Request, res: Response) => {
  const [s] = await db.update(dosSiteSettingsTable).set({ value: req.body.value, updatedAt: new Date() }).where(eq(dosSiteSettingsTable.key, req.params.key)).returning();
  if (!s) return res.status(404).json({ error: "Setting not found" });
  res.json(s);
});

router.get("/integrations", requireAuth, async (_req: Request, res: Response) => {
  const integrations = await db.select().from(dosIntegrationStatusTable).orderBy(asc(dosIntegrationStatusTable.provider));
  res.json(integrations);
});

router.post("/integrations/retry/:provider", requireAuth, async (req: Request, res: Response) => {
  const [i] = await db.update(dosIntegrationStatusTable).set({ status: "disconnected", lastError: null, updatedAt: new Date() }).where(eq(dosIntegrationStatusTable.provider, req.params.provider)).returning();
  if (!i) return res.status(404).json({ error: "Integration not found" });
  res.json(i);
});

router.patch("/integrations/:id", requireAuth, async (req: Request, res: Response) => {
  const [i] = await db.update(dosIntegrationStatusTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosIntegrationStatusTable.id, Number(req.params.id))).returning();
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
  // Public endpoint — active items only
  const items = await db.select().from(dosLinktreeConfigTable).where(eq(dosLinktreeConfigTable.isActive, true)).orderBy(asc(dosLinktreeConfigTable.sortOrder));
  res.json(items);
});

router.get("/linktree/admin", requireAuth, async (_req: Request, res: Response) => {
  // Admin endpoint — all items including inactive
  const items = await db.select().from(dosLinktreeConfigTable).orderBy(asc(dosLinktreeConfigTable.sortOrder));
  res.json(items);
});

router.post("/linktree", requireAuth, async (req: Request, res: Response) => {
  const parsed = LinktreeItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const [item] = await db.insert(dosLinktreeConfigTable).values(parsed.data).returning();
  res.status(201).json(item);
});

router.patch("/linktree/:id", requireAuth, async (req: Request, res: Response) => {
  const [item] = await db.update(dosLinktreeConfigTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosLinktreeConfigTable.id, Number(req.params.id))).returning();
  if (!item) return res.status(404).json({ error: "Linktree item not found" });
  res.json(item);
});

router.delete("/linktree/:id", requireAuth, async (req: Request, res: Response) => {
  await db.delete(dosLinktreeConfigTable).where(eq(dosLinktreeConfigTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.get("/automation-runs", async (_req: Request, res: Response) => {
  const runs = await db.select().from(dosAutomationRunsTable).orderBy(desc(dosAutomationRunsTable.createdAt)).limit(50);
  res.json(runs);
});

router.post("/automation-runs", requireAuth, async (req: Request, res: Response) => {
  const [run] = await db.insert(dosAutomationRunsTable).values(req.body).returning();
  res.status(201).json(run);
});

router.patch("/automation-runs/:id", requireAuth, async (req: Request, res: Response) => {
  const [run] = await db.update(dosAutomationRunsTable).set(req.body).where(eq(dosAutomationRunsTable.id, Number(req.params.id))).returning();
  if (!run) return res.status(404).json({ error: "Run not found" });
  res.json(run);
});

// ─── Automation Job Executors ─────────────────────────────────────────────────
// These are the server-side job handlers that write real outputs and real metrics.

router.post("/automation-runs/trigger/:jobType", requireAuth, async (req: Request, res: Response) => {
  const { jobType } = req.params;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

  let jobName = "";
  let jobTypeDb: "content-ideation" | "derivative-generation" | "x-queue" | "repurposing" | "weekly-report" | "custom" | "carousel-ideas" | "thought-leadership" | "daily-summary" = "custom";
  let summary = "";
  let itemsCreated = 0;
  let itemsFailed = 0;
  let output: Record<string, unknown> = {};

  try {
    if (jobType === "carousel-ideas") {
      jobName = "Carousel Idea Generator";
      jobTypeDb = "content-ideation";
      // Pull active pillars and generate 3 carousel ideas from favorites first
      const pillars = await db.select().from(dosEditorialPillarsTable).orderBy(desc(dosEditorialPillarsTable.isFavorite), asc(dosEditorialPillarsTable.sortOrder));
      const activePillars = pillars.slice(0, 3);
      const ideaTemplates = [
        { template: "educational-explainer", topicSuffix: "breakdown" },
        { template: "operator-checklist", topicSuffix: "checklist" },
        { template: "contrarian-pov", topicSuffix: "contrarian take" },
      ];
      const created = [];
      for (let i = 0; i < 3; i++) {
        const pillar = activePillars[i % activePillars.length];
        const tmpl = ideaTemplates[i];
        const title = `[Auto] ${pillar?.name || "Business"} — ${tmpl.topicSuffix} (${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
        const item = await db.insert(dosContentCalendarItemsTable).values({
          title,
          contentType: "carousel",
          pillarId: pillar?.id ?? null,
          channel: "linkedin",
          status: "idea",
          notes: `Auto-generated by Carousel Idea Generator. Template suggestion: ${tmpl.template}.`,
        }).returning();
        created.push(item[0]);
        itemsCreated++;
      }
      output = { carouselIdeas: created.map(c => c.title) };
      summary = `Generated ${itemsCreated} carousel ideas from ${activePillars.length} active pillars.`;

    } else if (jobType === "thought-leadership") {
      jobName = "Weekly Thought-Leadership Pack";
      jobTypeDb = "derivative-generation";
      // Generate 4 calendar items: 1 hero carousel, 1 text post, 1 email draft, 1 offer page rec
      const pillars = await db.select().from(dosEditorialPillarsTable).where(eq(dosEditorialPillarsTable.isFavorite, true)).orderBy(asc(dosEditorialPillarsTable.sortOrder));
      const pillar = pillars[0];
      const week = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const items = [
        { title: `[Hero Carousel] ${pillar?.name || "Leadership"} — This Week's Insight (${week})`, contentType: "carousel" as const, notes: "Hero carousel for thought-leadership pack. Generate via Carousel Lab." },
        { title: `[Text Post] ${pillar?.name || "Leadership"} — Founder Perspective (${week})`, contentType: "x-post" as const, notes: "Supporting text post. Adapt from hero carousel key insight." },
        { title: `[Email Draft] CTA Newsletter — ${pillar?.name || "Leadership"} Focus (${week})`, contentType: "newsletter" as const, notes: "CTA email draft. Lead with carousel teaser, CTA to offer page." },
        { title: `[Offer Rec] Review offer page alignment for: ${pillar?.name || "Leadership"} (${week})`, contentType: "other" as const, notes: "Recommendation: ensure current offer page CTA matches this week's theme." },
      ];
      for (const item of items) {
        await db.insert(dosContentCalendarItemsTable).values({
          ...item,
          pillarId: pillar?.id ?? null,
          channel: item.contentType === "carousel" ? "linkedin" : item.contentType === "x-post" ? "x" : "newsletter",
          status: "idea",
        }).returning();
        itemsCreated++;
      }
      output = { packItems: items.map(i => i.title) };
      summary = `Created ${itemsCreated} items: 1 hero carousel, 1 text post, 1 email draft, 1 offer page recommendation.`;

    } else if (jobType === "daily-summary") {
      jobName = "Daily Marketing Summary";
      jobTypeDb = "content-ideation";
      // Pull real metrics from today
      const [pvToday] = await db.select({ count: count() }).from(dosPageViewsTable).where(gte(dosPageViewsTable.createdAt, todayStart));
      const [leadsToday] = await db.select({ count: count() }).from(dosLeadsTable).where(gte(dosLeadsTable.createdAt, todayStart));
      const [openCalItems] = await db.select({ count: count() }).from(dosContentCalendarItemsTable).where(eq(dosContentCalendarItemsTable.status, "idea"));
      const [schedItems] = await db.select({ count: count() }).from(dosContentCalendarItemsTable).where(eq(dosContentCalendarItemsTable.status, "ready"));
      const [xQueued] = await db.select({ count: count() }).from(dosXPostsTable).where(eq(dosXPostsTable.status, "queued"));
      const visits = pvToday?.count ?? 0;
      const leads = leadsToday?.count ?? 0;
      const openTasks = openCalItems?.count ?? 0;
      const scheduledItems = schedItems?.count ?? 0;
      const xQ = xQueued?.count ?? 0;
      output = { visits, leads, openTasks, scheduledItems, xQueued: xQ };
      summary = `Today: ${visits} visits, ${leads} leads, ${openTasks} open tasks, ${scheduledItems} items scheduled, ${xQ} X posts queued.`;
      itemsCreated = 1;

    } else if (jobType === "weekly-report") {
      jobName = "Weekly Executive Report";
      jobTypeDb = "weekly-report";
      // Aggregate from real DB tables
      const weekStart = new Date(weekAgo);
      const [pvCount] = await db.select({ count: count() }).from(dosPageViewsTable).where(gte(dosPageViewsTable.createdAt, weekAgo));
      const [leadCount] = await db.select({ count: count() }).from(dosLeadsTable).where(gte(dosLeadsTable.createdAt, weekAgo));
      const [articleCount] = await db.select({ count: count() }).from(dosArticlesTable).where(and(eq(dosArticlesTable.status, "published"), gte(dosArticlesTable.createdAt, weekAgo)));
      const [carouselCount] = await db.select({ count: count() }).from(dosCarouselProjectsTable).where(gte(dosCarouselProjectsTable.createdAt, weekAgo));
      const [xSent] = await db.select({ count: count() }).from(dosXPostsTable).where(and(eq(dosXPostsTable.status, "sent"), gte(dosXPostsTable.sentAt, weekAgo)));
      const [nlCount] = await db.select({ count: count() }).from(dosNewslettersTable).where(and(eq(dosNewslettersTable.status, "published"), gte(dosNewslettersTable.createdAt, weekAgo)));
      const [autoRuns] = await db.select({ count: count() }).from(dosAutomationRunsTable).where(and(eq(dosAutomationRunsTable.status, "completed"), gte(dosAutomationRunsTable.createdAt, weekAgo)));
      const [followUpQueue] = await db.select({ count: count() }).from(dosLeadsTable).where(eq(dosLeadsTable.stage, "needs-followup"));
      const campaigns = await db.select().from(dosCampaignsTable).where(eq(dosCampaignsTable.status, "active")).orderBy(desc(dosCampaignsTable.totalConversions)).limit(1);
      const bestCampaign = campaigns[0]?.name ?? "No active campaigns";
      const allLeads = await db.select().from(dosLeadsTable).where(gte(dosLeadsTable.createdAt, weekAgo));
      const sourceCounts: Record<string, number> = {};
      for (const lead of allLeads) { const src = lead.source || "Direct"; sourceCounts[src] = (sourceCounts[src] || 0) + 1; }
      const topLeadSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Direct";
      const totalVisits = pvCount?.count ?? 0;
      const totalLeads = leadCount?.count ?? 0;
      const publishedArticles = articleCount?.count ?? 0;
      const carouselsGenerated = carouselCount?.count ?? 0;
      const xPostsSent = xSent?.count ?? 0;
      const newslettersSent = nlCount?.count ?? 0;
      const automationsRun = autoRuns?.count ?? 0;
      const followUp = followUpQueue?.count ?? 0;
      const recommendations: string[] = [];
      if (carouselsGenerated === 0) recommendations.push("No carousels were generated this week. Use Carousel Lab to create 2-3 pieces for next week's queue.");
      else recommendations.push(`Carousels generated: ${carouselsGenerated}. Ensure all ready carousels are exported to aiCarousels and scheduled on LinkedIn.`);
      if (totalLeads === 0) recommendations.push("No new leads this week. Review CTA placement on high-traffic pages and update Linktree priority links.");
      else recommendations.push(`${totalLeads} new lead(s) this week via ${topLeadSource}. Follow up within 48 hours on any warm leads.`);
      if (followUp > 0) recommendations.push(`${followUp} lead(s) in the follow-up queue. Clear this queue before end of week.`);
      if (publishedArticles === 0) recommendations.push("No articles published this week. Consider publishing or scheduling a flagship essay for authority building.");
      recommendations.push("Review the content calendar and ensure next week has at least 3 items in 'Scheduled' status before Friday.");
      output = { totalVisits, totalLeads, bestCampaign, topLeadSource, publishedArticles, carouselsGenerated, xPostsSent, newslettersSent, automationsRun, followUpQueue: followUp, weekStart: weekStart.toISOString().slice(0, 10), weekEnd: now.toISOString().slice(0, 10), recommendations };
      summary = `Weekly report: ${totalVisits} visits, ${totalLeads} leads, ${carouselsGenerated} carousels, top source: ${topLeadSource}.`;
      itemsCreated = 1;

    } else {
      return res.status(400).json({ error: `Unknown job type: ${jobType}` });
    }

    // Write the completed run record — including serialized output for persistence
    const [run] = await db.insert(dosAutomationRunsTable).values({
      jobName,
      jobType: jobTypeDb,
      status: "completed",
      startedAt: now,
      completedAt: new Date(),
      summary,
      output,
      itemsCreated,
      itemsFailed,
    }).returning();

    res.json({ run, output });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const [run] = await db.insert(dosAutomationRunsTable).values({
      jobName: jobName || `Job: ${jobType}`,
      jobType: jobTypeDb,
      status: "failed",
      startedAt: now,
      completedAt: new Date(),
      summary: `Job failed: ${errorMessage}`,
      output: { error: errorMessage },
      itemsCreated: 0,
      itemsFailed: 1,
      errorLog: errorMessage,
    }).returning();
    res.status(500).json({ error: errorMessage, run });
  }
});

// ─── Publishing Endpoints ─────────────────────────────────────────────────────

router.post("/x-posts/:id/publish", requireAuth, async (req: Request, res: Response) => {
  const [post] = await db.select().from(dosXPostsTable).where(eq(dosXPostsTable.id, Number(req.params.id)));
  if (!post) return res.status(404).json({ error: "X post not found" });
  if (post.status === "sent") return res.status(400).json({ error: "Already published" });

  try {
    const { XTwitterAdapter } = await import("@szl-holdings/services");
    const adapter = new XTwitterAdapter();

    if (post.postType === "thread" && post.threadJson) {
      const tweets = (post.threadJson as string[]);
      const results = await adapter.postThread(tweets);
      const firstResult = results[0];
      if (!firstResult?.posted) {
        await db.update(dosXPostsTable).set({ status: "failed", errorMessage: firstResult?.error || "Unknown error", retryCount: (post.retryCount || 0) + 1, updatedAt: new Date() }).where(eq(dosXPostsTable.id, post.id));
        return res.status(502).json({ error: firstResult?.error, results });
      }
      const [updated] = await db.update(dosXPostsTable).set({
        status: "sent", sentAt: new Date(), externalPostId: firstResult.externalPostId || null,
        externalPostUrl: firstResult.externalPostUrl || null, errorMessage: null, updatedAt: new Date(),
      }).where(eq(dosXPostsTable.id, post.id)).returning();
      return res.json({ post: updated, results, mock: firstResult.mock });
    }

    const result = await adapter.postTweet(post.body);
    if (!result.posted) {
      await db.update(dosXPostsTable).set({ status: "failed", errorMessage: result.error || "Unknown error", retryCount: (post.retryCount || 0) + 1, updatedAt: new Date() }).where(eq(dosXPostsTable.id, post.id));
      return res.status(502).json({ error: result.error });
    }
    const [updated] = await db.update(dosXPostsTable).set({
      status: "sent", sentAt: new Date(), externalPostId: result.externalPostId || null,
      externalPostUrl: result.externalPostUrl || null, errorMessage: null, updatedAt: new Date(),
    }).where(eq(dosXPostsTable.id, post.id)).returning();
    res.json({ post: updated, mock: result.mock });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.update(dosXPostsTable).set({ status: "failed", errorMessage: msg, retryCount: (post.retryCount || 0) + 1, updatedAt: new Date() }).where(eq(dosXPostsTable.id, post.id));
    res.status(500).json({ error: msg });
  }
});

router.post("/articles/:id/publish-medium", requireAuth, async (req: Request, res: Response) => {
  const [article] = await db.select().from(dosArticlesTable).where(eq(dosArticlesTable.id, Number(req.params.id)));
  if (!article) return res.status(404).json({ error: "Article not found" });

  try {
    const { MediumAdapter } = await import("@szl-holdings/services");
    const adapter = new MediumAdapter();
    const content = article.bodyMarkdown || article.bodyHtml || "";
    if (!content) return res.status(400).json({ error: "Article has no body content" });

    const result = await adapter.publishArticle({
      title: article.title,
      content,
      contentFormat: article.bodyMarkdown ? "markdown" : "html",
      tags: article.tags as string[] || [],
      publishStatus: (req.body.publishStatus as "public" | "draft" | "unlisted") || "draft",
    });

    if (!result.published) return res.status(502).json({ error: result.error });

    const [updated] = await db.update(dosArticlesTable).set({
      status: "published", mediumStatus: "published", externalUrlMedium: result.externalUrl || null, publishedMediumAt: new Date(), updatedAt: new Date(),
    }).where(eq(dosArticlesTable.id, article.id)).returning();
    res.json({ article: updated, mock: result.mock, externalUrl: result.externalUrl });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/newsletters/:id/publish-substack", requireAuth, async (req: Request, res: Response) => {
  const [nl] = await db.select().from(dosNewslettersTable).where(eq(dosNewslettersTable.id, Number(req.params.id)));
  if (!nl) return res.status(404).json({ error: "Newsletter not found" });

  try {
    const { SubstackAdapter } = await import("@szl-holdings/services");
    const adapter = new SubstackAdapter();
    const body = nl.mainStoryMarkdown || nl.mainStoryHtml || "";
    if (!body) return res.status(400).json({ error: "Newsletter has no body content" });

    const result = await adapter.publishNewsletter({
      title: nl.title,
      subtitle: nl.subtitle || undefined,
      body,
      bodyFormat: nl.mainStoryMarkdown ? "markdown" : "html",
    });

    if (!result.published) return res.status(502).json({ error: result.error });

    const [updated] = await db.update(dosNewslettersTable).set({
      status: "published", substackUrl: result.externalUrl || null, updatedAt: new Date(),
    }).where(eq(dosNewslettersTable.id, nl.id)).returning();
    res.json({ newsletter: updated, mock: result.mock, externalUrl: result.externalUrl });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/carousels/:id/publish-linkedin", requireAuth, async (req: Request, res: Response) => {
  const [carousel] = await db.select().from(dosCarouselProjectsTable).where(eq(dosCarouselProjectsTable.id, Number(req.params.id)));
  if (!carousel) return res.status(404).json({ error: "Carousel not found" });

  try {
    const { LinkedInAdapter } = await import("@szl-holdings/services");
    const adapter = new LinkedInAdapter();
    const caption = carousel.linkedinShortCaption || carousel.linkedinLongCaption || `${carousel.title} — by SZL Holdings`;

    const result = await adapter.sharePost({
      text: caption,
      articleUrl: carousel.ctaUrl || undefined,
      articleTitle: carousel.title,
    });

    if (!result.posted) return res.status(502).json({ error: result.error });

    const [updated] = await db.update(dosCarouselProjectsTable).set({
      status: "published", updatedAt: new Date(),
    }).where(eq(dosCarouselProjectsTable.id, carousel.id)).returning();
    res.json({ carousel: updated, mock: result.mock, externalUrl: result.externalUrl });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── PDF Carousel Export ──────────────────────────────────────────────────────

router.get("/carousels/:id/export-pdf", async (req: Request, res: Response) => {
  const [carousel] = await db.select().from(dosCarouselProjectsTable).where(eq(dosCarouselProjectsTable.id, Number(req.params.id)));
  if (!carousel) return res.status(404).json({ error: "Carousel not found" });

  const slides = await db.select().from(dosCarouselSlidesTable).where(eq(dosCarouselSlidesTable.projectId, carousel.id)).orderBy(asc(dosCarouselSlidesTable.slideNumber));

  try {
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ size: [1080, 1080], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const bgColor = "#080c14";
    const accentColor = "#d4a054";
    const textColor = "#e8e4de";
    const subtextColor = "#8b8579";

    for (let i = 0; i < slides.length; i++) {
      if (i > 0) doc.addPage();
      const slide = slides[i];

      doc.rect(0, 0, 1080, 1080).fill(bgColor);
      doc.rect(0, 0, 1080, 6).fill(accentColor);
      doc.rect(0, 1074, 1080, 6).fill(accentColor);

      if (slide.slideType === "intro") {
        if (slide.tagline) {
          doc.font("Helvetica").fontSize(16).fillColor(accentColor);
          doc.text(slide.tagline.toUpperCase(), 80, 300, { width: 920, align: "center", characterSpacing: 4 });
        }
        doc.font("Helvetica-Bold").fontSize(48).fillColor(textColor);
        doc.text(slide.title || carousel.title, 80, 380, { width: 920, align: "center", lineGap: 8 });
        if (slide.paragraph) {
          doc.font("Helvetica").fontSize(20).fillColor(subtextColor);
          doc.text(slide.paragraph, 120, 560, { width: 840, align: "center", lineGap: 6 });
        }
        doc.font("Helvetica").fontSize(14).fillColor(accentColor);
        doc.text("SZL HOLDINGS", 80, 960, { width: 920, align: "center", characterSpacing: 3 });
      } else if (slide.slideType === "outro") {
        doc.font("Helvetica").fontSize(14).fillColor(accentColor);
        doc.text((slide.tagline || "SZL HOLDINGS").toUpperCase(), 80, 280, { width: 920, align: "center", characterSpacing: 4 });
        doc.font("Helvetica-Bold").fontSize(40).fillColor(textColor);
        doc.text(slide.title || "Thank You", 80, 360, { width: 920, align: "center", lineGap: 8 });
        if (slide.paragraph) {
          doc.font("Helvetica").fontSize(20).fillColor(subtextColor);
          doc.text(slide.paragraph, 120, 520, { width: 840, align: "center", lineGap: 6 });
        }
        if (slide.callToAction) {
          doc.roundedRect(340, 700, 400, 56, 8).fill(accentColor);
          doc.font("Helvetica-Bold").fontSize(18).fillColor(bgColor);
          doc.text(slide.callToAction, 340, 716, { width: 400, align: "center" });
        }
        doc.font("Helvetica").fontSize(12).fillColor(subtextColor);
        doc.text("szlholdings.com", 80, 960, { width: 920, align: "center" });
      } else {
        const slideNum = `${String(slide.slideNumber).padStart(2, "0")}`;
        doc.font("Helvetica").fontSize(64).fillColor(accentColor).opacity(0.15);
        doc.text(slideNum, 80, 80, { width: 920 });
        doc.opacity(1);
        doc.font("Helvetica-Bold").fontSize(36).fillColor(textColor);
        doc.text(slide.title || "", 80, 260, { width: 920, lineGap: 6 });
        doc.moveTo(80, 360).lineTo(200, 360).lineWidth(3).strokeColor(accentColor).stroke();
        if (slide.paragraph) {
          doc.font("Helvetica").fontSize(22).fillColor(subtextColor);
          doc.text(slide.paragraph, 80, 400, { width: 920, lineGap: 8 });
        }
        doc.font("Helvetica").fontSize(12).fillColor(accentColor);
        doc.text(`${slideNum} / ${String(slides.length).padStart(2, "0")}`, 80, 980, { width: 920, align: "right" });
        doc.font("Helvetica").fontSize(11).fillColor(subtextColor);
        doc.text("SZL HOLDINGS", 80, 980);
      }
    }

    await new Promise<void>((resolve) => { doc.on("end", resolve); doc.end(); });
    const pdfBuffer = Buffer.concat(chunks);
    const filename = `${carousel.slug || "carousel"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Linktree Click Tracking ──────────────────────────────────────────────────

router.post("/linktree/:id/click", async (req: Request, res: Response) => {
  const [item] = await db.select().from(dosLinktreeConfigTable).where(eq(dosLinktreeConfigTable.id, Number(req.params.id)));
  if (!item) return res.status(404).json({ error: "Link not found" });
  await db.insert(dosAnalyticsEventsTable).values({
    eventType: "linktree_click",
    eventName: "link_click",
    pagePath: "/link-in-bio",
    metadata: { linkId: item.id, label: item.label, destination: item.destination, campaignTag: item.campaignTag },
  });
  res.json({ ok: true });
});

router.post("/analytics/event", async (req: Request, res: Response) => {
  const [event] = await db.insert(dosAnalyticsEventsTable).values(req.body).returning();
  res.status(201).json(event);
});

router.post("/analytics/pageview", async (req: Request, res: Response) => {
  const [pv] = await db.insert(dosPageViewsTable).values(req.body).returning();
  res.status(201).json(pv);
});

router.get("/analytics/dashboard", requireAuth, async (req: Request, res: Response) => {
  const period = req.query.period === "monthly" ? "monthly" : "weekly";
  const windowMs = period === "monthly" ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const windowStart = new Date(Date.now() - windowMs);

  const [pvCount] = await db.select({ count: count() }).from(dosPageViewsTable).where(gte(dosPageViewsTable.createdAt, windowStart));
  const [leadCount] = await db.select({ count: count() }).from(dosLeadsTable).where(gte(dosLeadsTable.createdAt, windowStart));
  const [articleCount] = await db.select({ count: count() }).from(dosArticlesTable).where(eq(dosArticlesTable.status, "published"));
  const [xQueued] = await db.select({ count: count() }).from(dosXPostsTable).where(eq(dosXPostsTable.status, "queued"));
  const [xSent] = await db.select({ count: count() }).from(dosXPostsTable).where(eq(dosXPostsTable.status, "sent"));
  const [xFailed] = await db.select({ count: count() }).from(dosXPostsTable).where(eq(dosXPostsTable.status, "failed"));
  const [nlReady] = await db.select({ count: count() }).from(dosNewslettersTable).where(eq(dosNewslettersTable.status, "approved"));
  const [autoRuns] = await db.select({ count: count() }).from(dosAutomationRunsTable).where(and(gte(dosAutomationRunsTable.createdAt, windowStart), eq(dosAutomationRunsTable.status, "completed")));

  // Marketing OS specific stats
  const [followupCount] = await db.select({ count: count() }).from(dosLeadsTable).where(eq(dosLeadsTable.stage, "needs-followup"));

  // Top campaign by total clicks
  const campaigns = await db.select().from(dosCampaignsTable).orderBy(desc(dosCampaignsTable.totalClicks)).limit(1);
  const topCampaign = campaigns[0]?.name || null;

  // Top page from page views
  const pageViews = await db.select().from(dosPageViewsTable).where(gte(dosPageViewsTable.createdAt, windowStart)).limit(500);
  const pathCounts: Record<string, number> = {};
  pageViews.forEach(pv => { pathCounts[pv.path] = (pathCounts[pv.path] || 0) + 1; });
  const topPageEntry = Object.entries(pathCounts).sort((a, b) => b[1] - a[1])[0];
  const topPage = topPageEntry?.[0] || null;

  // Automations health
  const failedAutos = await db.select({ count: count() }).from(dosAutomationRunsTable).where(and(gte(dosAutomationRunsTable.createdAt, windowStart), eq(dosAutomationRunsTable.status, "failed")));
  const automationsHealth = (failedAutos[0]?.count ?? 0) > 0 ? "Degraded" : "Healthy";

  res.json({
    period,
    visitsThisWeek: pvCount?.count ?? 0,
    leadsThisWeek: leadCount?.count ?? 0,
    publishedArticles: articleCount?.count ?? 0,
    xQueued: xQueued?.count ?? 0,
    xSentTotal: xSent?.count ?? 0,
    xFailed: xFailed?.count ?? 0,
    newslettersReady: nlReady?.count ?? 0,
    automationsCompletedThisWeek: autoRuns?.count ?? 0,
    leadsNeedingFollowup: followupCount?.count ?? 0,
    topCampaign,
    topPage,
    contentGenerated: articleCount?.count ?? 0,
    automationsHealth,
  });
});

router.delete("/campaigns/:id", requireAuth, async (req: Request, res: Response) => {
  await db.delete(dosCampaignsTable).where(eq(dosCampaignsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

// ─── Seed data ────────────────────────────────────────────────────────────────

router.post("/seed", requireAuth, async (_req: Request, res: Response) => {
  const results: Record<string, unknown> = {};

  // Seed 3 campaigns (idempotent: skip if slugs exist)
  const existingCampaigns = await db.select().from(dosCampaignsTable);
  const existingSlugs = new Set(existingCampaigns.map(c => c.slug));

  const seedCampaigns = [
    { name: "Founder LinkedIn Spring 2025", slug: "founder-linkedin-spring-2025", description: "Founder-led content campaign on LinkedIn targeting enterprise operators and MSP buyers.", status: "active" as const, owner: "Stephen", totalClicks: 142, totalConversions: 8 },
    { name: "Newsletter — Weekly Brief Launch", slug: "newsletter-weekly-brief-launch", description: "Campaign to grow newsletter subscriber base via bio links, X, and Substack cross-posts.", status: "active" as const, owner: "Stephen", totalClicks: 87, totalConversions: 23 },
    { name: "Lyte Product Launch Q2", slug: "lyte-product-launch-q2", description: "Campaign for Lyte product awareness targeting SMB IT teams and MSPs.", status: "draft" as const, owner: "Stephen", totalClicks: 0, totalConversions: 0 },
  ];

  const createdCampaigns: Record<string, number> = {};
  for (const cam of seedCampaigns) {
    if (!existingSlugs.has(cam.slug)) {
      const [c] = await db.insert(dosCampaignsTable).values(cam).returning();
      createdCampaigns[cam.slug] = c.id;
    } else {
      const existing = existingCampaigns.find(c => c.slug === cam.slug);
      if (existing) createdCampaigns[cam.slug] = existing.id;
    }
  }
  results.campaigns = Object.keys(createdCampaigns).length;

  // Seed campaign links for first campaign
  const linkedinCamId = createdCampaigns["founder-linkedin-spring-2025"];
  if (linkedinCamId) {
    const existingLinks = await db.select().from(dosCampaignLinksTable).where(eq(dosCampaignLinksTable.campaignId, linkedinCamId));
    if (existingLinks.length === 0) {
      await db.insert(dosCampaignLinksTable).values([
        { campaignId: linkedinCamId, name: "LinkedIn Bio Link", source: "linkedin", medium: "bio-link", campaign: "founder-linkedin-spring-2025", destination: "https://szlholdings.com", fullUrl: "https://szlholdings.com?utm_source=linkedin&utm_medium=bio-link&utm_campaign=founder-linkedin-spring-2025", clicks: 89, conversions: 4 },
        { campaignId: linkedinCamId, name: "Carousel CTA — Lyte", source: "linkedin", medium: "social", campaign: "founder-linkedin-spring-2025", content: "carousel-lyte-ops", destination: "https://szlholdings.com/lyte", fullUrl: "https://szlholdings.com/lyte?utm_source=linkedin&utm_medium=social&utm_campaign=founder-linkedin-spring-2025&utm_content=carousel-lyte-ops", clicks: 53, conversions: 4 },
      ]);
    }
  }

  // Seed 3 leads (idempotent: skip if emails exist)
  const existingLeads = await db.select().from(dosLeadsTable);
  const existingEmails = new Set(existingLeads.map(l => l.email));

  const seedLeads = [
    {
      name: "Marcus Hendricks",
      email: "marcus@hendricksmsp.com",
      company: "Hendricks MSP",
      role: "CEO",
      interestArea: "Lyte — AI Ops Platform",
      budget: "$2k–5k/mo",
      message: "We've been struggling to scale our NOC operations with our current tooling. Your Lyte platform looks like exactly what we need. Would love to set up a call to discuss pricing and onboarding.",
      source: "linkedin",
      medium: "social",
      campaign: "founder-linkedin-spring-2025",
      landingPage: "/lyte",
      stage: "warm" as const,
      score: 65,
      consent: true,
    },
    {
      name: "Priya Sharma",
      email: "priya@techscale.io",
      company: "TechScale IO",
      role: "VP of Engineering",
      interestArea: "Alloy — Automation Platform",
      budget: "$5k–15k/mo",
      message: "Reached out from your newsletter. We're building internal automation tooling and evaluating partners. Enterprise email, proper budget, and we're serious buyers.",
      source: "newsletter",
      medium: "email",
      campaign: "newsletter-weekly-brief-launch",
      landingPage: "/newsletter",
      stage: "qualified" as const,
      score: 80,
      consent: true,
    },
    {
      name: "Daniel Torres",
      email: "d.torres@gmail.com",
      company: null,
      role: null,
      interestArea: "General Inquiry",
      budget: null,
      message: "Hi, just curious about what SZL Holdings does. Saw you on LinkedIn.",
      source: "linkedin",
      medium: "social",
      campaign: "founder-linkedin-spring-2025",
      landingPage: "/",
      stage: "new" as const,
      score: 5,
      consent: true,
    },
  ];

  let leadsCreated = 0;
  for (const lead of seedLeads) {
    if (!existingEmails.has(lead.email)) {
      await db.insert(dosLeadsTable).values(lead);
      leadsCreated++;
    }
  }
  results.leads = leadsCreated;

  // Seed integration status records
  const existingIntegrations = await db.select().from(dosIntegrationStatusTable);
  const existingProviders = new Set(existingIntegrations.map(i => i.provider));
  const integrationProviders = [
    { provider: "x", authMode: "oauth2" as const, status: "disconnected" as const },
    { provider: "substack", authMode: "api-key" as const, status: "mock" as const },
    { provider: "medium", authMode: "api-key" as const, status: "disconnected" as const },
    { provider: "linkedin", authMode: "oauth2" as const, status: "disconnected" as const },
    { provider: "linktree", authMode: "manual" as const, status: "disconnected" as const },
    { provider: "email", authMode: "api-key" as const, status: "disconnected" as const },
  ];
  let intCreated = 0;
  for (const int of integrationProviders) {
    if (!existingProviders.has(int.provider)) {
      await db.insert(dosIntegrationStatusTable).values(int);
      intCreated++;
    }
  }
  results.integrations = intCreated;

  res.json({ success: true, seeded: results });
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
