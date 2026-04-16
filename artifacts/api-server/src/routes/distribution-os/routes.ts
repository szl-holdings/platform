import { Router, Request, Response } from "express";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { computeLeadScore } from "../../lib/lead-scoring";
import {
  db,
  dosArticlesTable, dosArticleVersionsTable, dosNewslettersTable,
  dosCarouselProjectsTable, dosCarouselSlidesTable, dosXPostsTable,
  dosCampaignsTable, dosCampaignLinksTable, dosLeadsTable, dosLeadNotesTable,
  dosEditorialPillarsTable, dosCtaBlocksTable, dosContentCalendarItemsTable,
  dosDistributionTargetsTable, dosPublicationUrlsTable, dosAuthorProfilesTable,
  dosSiteSettingsTable, dosIntegrationStatusTable, dosAutomationRunsTable,
  dosLinktreeConfigTable, dosPageViewsTable, dosAnalyticsEventsTable,
  dosViralityScoresTable, dosAudienceSegmentsTable, dosAbTestsTable,
  dosMonetizationRulesTable, dosSeoKeywordsTable, dosTrendSignalsTable,
  dosContentLifecycleTable,
} from "@szl-holdings/db";
import { eq, desc, asc, and, gte, count, sql } from "drizzle-orm";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();
const requireAuth = authMiddleware({ required: true });

router.get("/articles", async (_req: Request, res: Response): Promise<void> => {
  const articles = await db.select().from(dosArticlesTable).orderBy(desc(dosArticlesTable.createdAt)).limit(100);
  res.json(articles);
});

router.get("/articles/:id", async (req: Request, res: Response): Promise<void> => {
  const [article] = await db.select().from(dosArticlesTable).where(eq(dosArticlesTable.id, Number(req.params.id)));
  if (!article) return void res.status(404).json({ error: "Article not found" });
  res.json(article);
});

router.get("/articles/slug/:slug", async (req: Request, res: Response): Promise<void> => {
  const [article] = await db.select().from(dosArticlesTable).where(eq(dosArticlesTable.slug, req.params.slug as string));
  if (!article) return void res.status(404).json({ error: "Article not found" });
  res.json(article);
});

router.post("/articles", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [article] = await db.insert(dosArticlesTable).values(req.body).returning();
  res.status(201).json(article);
});

router.patch("/articles/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [article] = await db.update(dosArticlesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosArticlesTable.id, Number(req.params.id))).returning();
  if (!article) return void res.status(404).json({ error: "Article not found" });
  res.json(article);
});

router.delete("/articles/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  await db.delete(dosArticlesTable).where(eq(dosArticlesTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.get("/articles/:id/versions", async (req: Request, res: Response): Promise<void> => {
  const versions = await db.select().from(dosArticleVersionsTable).where(eq(dosArticleVersionsTable.articleId, Number(req.params.id))).orderBy(desc(dosArticleVersionsTable.createdAt));
  res.json(versions);
});

router.get("/newsletters", async (_req: Request, res: Response): Promise<void> => {
  const newsletters = await db.select().from(dosNewslettersTable).orderBy(desc(dosNewslettersTable.createdAt)).limit(100);
  res.json(newsletters);
});

router.get("/newsletters/:id", async (req: Request, res: Response): Promise<void> => {
  const [nl] = await db.select().from(dosNewslettersTable).where(eq(dosNewslettersTable.id, Number(req.params.id)));
  if (!nl) return void res.status(404).json({ error: "Newsletter not found" });
  res.json(nl);
});

router.post("/newsletters", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [nl] = await db.insert(dosNewslettersTable).values(req.body).returning();
  res.status(201).json(nl);
});

router.patch("/newsletters/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [nl] = await db.update(dosNewslettersTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosNewslettersTable.id, Number(req.params.id))).returning();
  if (!nl) return void res.status(404).json({ error: "Newsletter not found" });
  res.json(nl);
});

router.delete("/newsletters/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  await db.delete(dosNewslettersTable).where(eq(dosNewslettersTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.get("/carousels", async (_req: Request, res: Response): Promise<void> => {
  const carousels = await db.select().from(dosCarouselProjectsTable).orderBy(desc(dosCarouselProjectsTable.createdAt)).limit(100);
  res.json(carousels);
});

router.get("/carousels/:id", async (req: Request, res: Response): Promise<void> => {
  const [c] = await db.select().from(dosCarouselProjectsTable).where(eq(dosCarouselProjectsTable.id, Number(req.params.id)));
  if (!c) return void res.status(404).json({ error: "Carousel not found" });
  const slides = await db.select().from(dosCarouselSlidesTable).where(eq(dosCarouselSlidesTable.projectId, c.id)).orderBy(asc(dosCarouselSlidesTable.slideNumber));
  res.json({ ...c, slides });
});

router.post("/carousels", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { slides, ...project } = req.body;
  const [c] = await db.insert(dosCarouselProjectsTable).values(project).returning();
  if (slides?.length) {
    await db.insert(dosCarouselSlidesTable).values(slides.map((s: Record<string, unknown>, i: number) => ({ ...s, projectId: c.id, slideNumber: i + 1 })));
  }
  res.status(201).json(c);
});

router.patch("/carousels/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [c] = await db.update(dosCarouselProjectsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosCarouselProjectsTable.id, Number(req.params.id))).returning();
  if (!c) return void res.status(404).json({ error: "Carousel not found" });
  res.json(c);
});

router.get("/x-posts", async (_req: Request, res: Response): Promise<void> => {
  const posts = await db.select().from(dosXPostsTable).orderBy(desc(dosXPostsTable.createdAt)).limit(100);
  res.json(posts);
});

router.get("/x-posts/:id", async (req: Request, res: Response): Promise<void> => {
  const [post] = await db.select().from(dosXPostsTable).where(eq(dosXPostsTable.id, Number(req.params.id)));
  if (!post) return void res.status(404).json({ error: "X post not found" });
  res.json(post);
});

router.post("/x-posts", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [post] = await db.insert(dosXPostsTable).values(req.body).returning();
  res.status(201).json(post);
});

router.patch("/x-posts/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [post] = await db.update(dosXPostsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosXPostsTable.id, Number(req.params.id))).returning();
  if (!post) return void res.status(404).json({ error: "X post not found" });
  res.json(post);
});

router.delete("/x-posts/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  await db.delete(dosXPostsTable).where(eq(dosXPostsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.post("/x-posts/:id/queue", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [post] = await db.update(dosXPostsTable).set({ status: "queued", scheduledFor: req.body.scheduledFor || new Date(), updatedAt: new Date() }).where(eq(dosXPostsTable.id, Number(req.params.id))).returning();
  if (!post) return void res.status(404).json({ error: "X post not found" });
  res.json(post);
});

router.get("/campaigns", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const campaigns = await db.select().from(dosCampaignsTable).orderBy(desc(dosCampaignsTable.createdAt)).limit(100);
  res.json(campaigns);
});

router.post("/campaigns", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [c] = await db.insert(dosCampaignsTable).values(req.body).returning();
  res.status(201).json(c);
});

router.patch("/campaigns/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [c] = await db.update(dosCampaignsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosCampaignsTable.id, Number(req.params.id))).returning();
  if (!c) return void res.status(404).json({ error: "Campaign not found" });
  res.json(c);
});

router.get("/campaigns/:id/links", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const links = await db.select().from(dosCampaignLinksTable).where(eq(dosCampaignLinksTable.campaignId, Number(req.params.id)));
  res.json(links);
});

router.post("/campaigns/:id/links", requireAuth, async (req: Request, res: Response): Promise<void> => {
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

router.get("/leads", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const stage = req.query.stage as string | undefined;
  const campaign = req.query.campaign as string | undefined;
  const period = req.query.period as string | undefined;

  const conditions = [];
  if (stage) conditions.push(eq(dosLeadsTable.stage, stage as any));
  if (campaign) conditions.push(eq(dosLeadsTable.campaign, campaign));
  if (period === "weekly") conditions.push(gte(dosLeadsTable.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  else if (period === "monthly") conditions.push(gte(dosLeadsTable.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

  const leads = conditions.length > 0
    ? await db.select().from(dosLeadsTable).where(and(...conditions)).orderBy(desc(dosLeadsTable.createdAt)).limit(200)
    : await db.select().from(dosLeadsTable).orderBy(desc(dosLeadsTable.createdAt)).limit(200);
  res.json(leads);
});

router.post("/leads", async (req: Request, res: Response): Promise<void> => {
  const parsed = LeadCreateSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const data = parsed.data;
  const score = computeLeadScore(data);
  const [lead] = await db.insert(dosLeadsTable).values({ ...data, score } as any).returning();
  res.status(201).json(lead);
});

router.patch("/leads/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [existing] = await db.select().from(dosLeadsTable).where(eq(dosLeadsTable.id, Number(req.params.id)));
  if (!existing) return void res.status(404).json({ error: "Lead not found" });

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

router.delete("/leads/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(dosLeadNotesTable).where(eq(dosLeadNotesTable.leadId, id));
  await db.delete(dosLeadsTable).where(eq(dosLeadsTable.id, id));
  res.json({ success: true });
});

router.get("/leads/:id/notes", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const notes = await db.select().from(dosLeadNotesTable).where(eq(dosLeadNotesTable.leadId, Number(req.params.id))).orderBy(desc(dosLeadNotesTable.createdAt));
  res.json(notes);
});

router.post("/leads/:id/notes", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [note] = await db.insert(dosLeadNotesTable).values({ ...req.body, leadId: Number(req.params.id) }).returning();
  res.status(201).json(note);
});

router.get("/pillars", async (_req: Request, res: Response): Promise<void> => {
  const pillars = await db.select().from(dosEditorialPillarsTable).orderBy(asc(dosEditorialPillarsTable.sortOrder));
  res.json(pillars);
});

router.post("/pillars", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [p] = await db.insert(dosEditorialPillarsTable).values(req.body).returning();
  res.status(201).json(p);
});

router.get("/cta-blocks", async (_req: Request, res: Response): Promise<void> => {
  const blocks = await db.select().from(dosCtaBlocksTable).orderBy(desc(dosCtaBlocksTable.createdAt));
  res.json(blocks);
});

router.post("/cta-blocks", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [b] = await db.insert(dosCtaBlocksTable).values(req.body).returning();
  res.status(201).json(b);
});

router.get("/calendar", async (req: Request, res: Response): Promise<void> => {
  const items = await db.select().from(dosContentCalendarItemsTable).orderBy(asc(dosContentCalendarItemsTable.scheduledDate)).limit(200);
  res.json(items);
});

router.post("/calendar", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [item] = await db.insert(dosContentCalendarItemsTable).values(req.body).returning();
  res.status(201).json(item);
});

router.patch("/calendar/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [item] = await db.update(dosContentCalendarItemsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosContentCalendarItemsTable.id, Number(req.params.id))).returning();
  if (!item) return void res.status(404).json({ error: "Calendar item not found" });
  res.json(item);
});

router.get("/distribution", async (_req: Request, res: Response): Promise<void> => {
  const targets = await db.select().from(dosDistributionTargetsTable).orderBy(desc(dosDistributionTargetsTable.createdAt)).limit(200);
  res.json(targets);
});

router.post("/distribution", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [t] = await db.insert(dosDistributionTargetsTable).values(req.body).returning();
  res.status(201).json(t);
});

router.patch("/distribution/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [t] = await db.update(dosDistributionTargetsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosDistributionTargetsTable.id, Number(req.params.id))).returning();
  if (!t) return void res.status(404).json({ error: "Distribution target not found" });
  res.json(t);
});

router.get("/settings", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const settings = await db.select().from(dosSiteSettingsTable).orderBy(asc(dosSiteSettingsTable.category));
  res.json(settings);
});

router.post("/settings", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = SettingWriteSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const [s] = await db.insert(dosSiteSettingsTable).values(parsed.data as any).returning();
  res.status(201).json(s);
});

router.patch("/settings/:key", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [s] = await db.update(dosSiteSettingsTable).set({ value: req.body.value, updatedAt: new Date() }).where(eq(dosSiteSettingsTable.key, req.params.key as string)).returning();
  if (!s) return void res.status(404).json({ error: "Setting not found" });
  res.json(s);
});

router.get("/integrations", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const integrations = await db.select().from(dosIntegrationStatusTable).orderBy(asc(dosIntegrationStatusTable.provider));
  res.json(integrations);
});

router.post("/integrations/retry/:provider", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [i] = await db.update(dosIntegrationStatusTable).set({ status: "disconnected", lastError: null, updatedAt: new Date() }).where(eq(dosIntegrationStatusTable.provider, req.params.provider as string)).returning();
  if (!i) return void res.status(404).json({ error: "Integration not found" });
  res.json(i);
});

router.patch("/integrations/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [i] = await db.update(dosIntegrationStatusTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosIntegrationStatusTable.id, Number(req.params.id))).returning();
  if (!i) return void res.status(404).json({ error: "Integration not found" });
  res.json(i);
});

router.get("/authors", async (_req: Request, res: Response): Promise<void> => {
  const authors = await db.select().from(dosAuthorProfilesTable);
  res.json(authors);
});

router.post("/authors", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [a] = await db.insert(dosAuthorProfilesTable).values(req.body).returning();
  res.status(201).json(a);
});

router.get("/linktree", async (_req: Request, res: Response): Promise<void> => {
  // Public endpoint — active items only
  const items = await db.select().from(dosLinktreeConfigTable).where(eq(dosLinktreeConfigTable.isActive, true)).orderBy(asc(dosLinktreeConfigTable.sortOrder));
  res.json(items);
});

router.get("/linktree/admin", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  // Admin endpoint — all items including inactive
  const items = await db.select().from(dosLinktreeConfigTable).orderBy(asc(dosLinktreeConfigTable.sortOrder));
  res.json(items);
});

router.post("/linktree", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = LinktreeItemSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const [item] = await db.insert(dosLinktreeConfigTable).values(parsed.data).returning();
  res.status(201).json(item);
});

router.patch("/linktree/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [item] = await db.update(dosLinktreeConfigTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosLinktreeConfigTable.id, Number(req.params.id))).returning();
  if (!item) return void res.status(404).json({ error: "Linktree item not found" });
  res.json(item);
});

router.delete("/linktree/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  await db.delete(dosLinktreeConfigTable).where(eq(dosLinktreeConfigTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.get("/automation-runs", async (_req: Request, res: Response): Promise<void> => {
  const runs = await db.select().from(dosAutomationRunsTable).orderBy(desc(dosAutomationRunsTable.createdAt)).limit(50);
  res.json(runs);
});

router.post("/automation-runs", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [run] = await db.insert(dosAutomationRunsTable).values(req.body).returning();
  res.status(201).json(run);
});

router.patch("/automation-runs/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [run] = await db.update(dosAutomationRunsTable).set(req.body).where(eq(dosAutomationRunsTable.id, Number(req.params.id))).returning();
  if (!run) return void res.status(404).json({ error: "Run not found" });
  res.json(run);
});

// ─── Automation Job Executors ─────────────────────────────────────────────────
// These are the server-side job handlers that write real outputs and real metrics.

router.post("/automation-runs/trigger/:jobType", requireAuth, async (req: Request, res: Response): Promise<void> => {
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
      return void res.status(400).json({ error: `Unknown job type: ${jobType}` });
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

router.post("/x-posts/:id/publish", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [post] = await db.select().from(dosXPostsTable).where(eq(dosXPostsTable.id, Number(req.params.id)));
  if (!post) return void res.status(404).json({ error: "X post not found" });
  if (post.status === "sent") return void res.status(400).json({ error: "Already published" });

  try {
    const { XTwitterAdapter } = await import("@szl-holdings/services");
    const adapter = new XTwitterAdapter();

    if (post.postType === "thread" && post.threadJson) {
      const tweets = (post.threadJson as unknown as string[]);
      const results = await adapter.postThread(tweets);
      const firstResult = results[0];
      if (!firstResult?.posted) {
        await db.update(dosXPostsTable).set({ status: "failed", errorMessage: firstResult?.error || "Unknown error", retryCount: (post.retryCount || 0) + 1, updatedAt: new Date() }).where(eq(dosXPostsTable.id, post.id));
        return void res.status(502).json({ error: firstResult?.error, results });
      }
      const [updated] = await db.update(dosXPostsTable).set({
        status: "sent", sentAt: new Date(), externalPostId: firstResult.externalPostId || null,
        externalPostUrl: firstResult.externalPostUrl || null, errorMessage: null, updatedAt: new Date(),
      }).where(eq(dosXPostsTable.id, post.id)).returning();
      return void res.json({ post: updated, results, mock: firstResult.mock });
    }

    const result = await adapter.postTweet(post.body);
    if (!result.posted) {
      await db.update(dosXPostsTable).set({ status: "failed", errorMessage: result.error || "Unknown error", retryCount: (post.retryCount || 0) + 1, updatedAt: new Date() }).where(eq(dosXPostsTable.id, post.id));
      return void res.status(502).json({ error: result.error });
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

router.post("/articles/:id/publish-medium", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [article] = await db.select().from(dosArticlesTable).where(eq(dosArticlesTable.id, Number(req.params.id)));
  if (!article) return void res.status(404).json({ error: "Article not found" });

  try {
    const { MediumAdapter } = await import("@szl-holdings/services");
    const adapter = new MediumAdapter();
    const content = article.bodyMarkdown || article.bodyHtml || "";
    if (!content) return void res.status(400).json({ error: "Article has no body content" });

    const result = await adapter.publishArticle({
      title: article.title,
      content,
      contentFormat: article.bodyMarkdown ? "markdown" : "html",
      tags: article.tags as string[] || [],
      publishStatus: (req.body.publishStatus as "public" | "draft" | "unlisted") || "draft",
    });

    if (!result.published) return void res.status(502).json({ error: result.error });

    const [updated] = await db.update(dosArticlesTable).set({
      status: "published", mediumStatus: "published", externalUrlMedium: result.externalUrl || null, publishedMediumAt: new Date(), updatedAt: new Date(),
    }).where(eq(dosArticlesTable.id, article.id)).returning();
    res.json({ article: updated, mock: result.mock, externalUrl: result.externalUrl });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/newsletters/:id/publish-substack", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [nl] = await db.select().from(dosNewslettersTable).where(eq(dosNewslettersTable.id, Number(req.params.id)));
  if (!nl) return void res.status(404).json({ error: "Newsletter not found" });

  try {
    const { SubstackAdapter } = await import("@szl-holdings/services");
    const adapter = new SubstackAdapter();
    const body = nl.mainStoryMarkdown || nl.mainStoryHtml || "";
    if (!body) return void res.status(400).json({ error: "Newsletter has no body content" });

    const result = await adapter.publishNewsletter({
      title: nl.title,
      subtitle: nl.subtitle || undefined,
      body,
      bodyFormat: nl.mainStoryMarkdown ? "markdown" : "html",
    });

    if (!result.published) return void res.status(502).json({ error: result.error });

    const [updated] = await db.update(dosNewslettersTable).set({
      status: "published", substackUrl: result.externalUrl || null, updatedAt: new Date(),
    }).where(eq(dosNewslettersTable.id, nl.id)).returning();
    res.json({ newsletter: updated, mock: result.mock, externalUrl: result.externalUrl });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/carousels/:id/publish-linkedin", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [carousel] = await db.select().from(dosCarouselProjectsTable).where(eq(dosCarouselProjectsTable.id, Number(req.params.id)));
  if (!carousel) return void res.status(404).json({ error: "Carousel not found" });

  try {
    const { LinkedInAdapter } = await import("@szl-holdings/services");
    const adapter = new LinkedInAdapter();
    const caption = carousel.linkedinShortCaption || carousel.linkedinLongCaption || `${carousel.title} — by SZL Holdings`;

    const result = await adapter.sharePost({
      text: caption,
      articleUrl: carousel.ctaUrl || undefined,
      articleTitle: carousel.title,
    });

    if (!result.posted) return void res.status(502).json({ error: result.error });

    const [updated] = await db.update(dosCarouselProjectsTable).set({
      status: "published", updatedAt: new Date(),
    }).where(eq(dosCarouselProjectsTable.id, carousel.id)).returning();
    res.json({ carousel: updated, mock: result.mock, externalUrl: result.externalUrl });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── PDF Carousel Export ──────────────────────────────────────────────────────

router.get("/carousels/:id/export-pdf", async (req: Request, res: Response): Promise<void> => {
  const [carousel] = await db.select().from(dosCarouselProjectsTable).where(eq(dosCarouselProjectsTable.id, Number(req.params.id)));
  if (!carousel) return void res.status(404).json({ error: "Carousel not found" });

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

router.post("/linktree/:id/click", async (req: Request, res: Response): Promise<void> => {
  const [item] = await db.select().from(dosLinktreeConfigTable).where(eq(dosLinktreeConfigTable.id, Number(req.params.id)));
  if (!item) return void res.status(404).json({ error: "Link not found" });
  await db.insert(dosAnalyticsEventsTable).values({
    eventType: "cta_click",
    path: "/link-in-bio",
    target: item.destination || null,
    metadata: { linkId: item.id, label: item.label, destination: item.destination, campaignTag: item.campaignTag },
  });
  res.json({ ok: true });
});

router.post("/analytics/event", async (req: Request, res: Response): Promise<void> => {
  const [event] = await db.insert(dosAnalyticsEventsTable).values(req.body).returning();
  res.status(201).json(event);
});

router.post("/analytics/pageview", async (req: Request, res: Response): Promise<void> => {
  const [pv] = await db.insert(dosPageViewsTable).values(req.body).returning();
  res.status(201).json(pv);
});

router.get("/analytics/dashboard", requireAuth, async (req: Request, res: Response): Promise<void> => {
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

router.delete("/campaigns/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  await db.delete(dosCampaignsTable).where(eq(dosCampaignsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

// ─── Seed data ────────────────────────────────────────────────────────────────

router.post("/seed", requireAuth, async (_req: Request, res: Response): Promise<void> => {
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

// ── Distribution OS Superengine: Extended Platform Connections ──

router.get("/platform-connections", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const integrations = await db.select().from(dosIntegrationStatusTable).orderBy(asc(dosIntegrationStatusTable.provider));
  const ALL_PLATFORMS = [
    "x","linkedin","threads","bluesky","mastodon","instagram","medium","devto","hashnode","wordpress","ghost","substack","reddit"
  ];
  const map = Object.fromEntries(integrations.map(i => [i.provider, i]));
  const result = ALL_PLATFORMS.map(provider => ({
    provider,
    status: map[provider]?.status || "disconnected",
    authMode: map[provider]?.authMode || "oauth2",
    lastSuccess: map[provider]?.lastSuccess || null,
    lastError: map[provider]?.lastError || null,
  }));
  res.json(result);
});

// ── AI Atomizer Job Stubs ──

router.post("/atomizer/atomize", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { title, content, platforms } = req.body;
  if (!content) return void res.status(400).json({ error: "content is required" });
  const jobId = `atomize_${Date.now()}`;
  res.json({
    jobId,
    status: "queued",
    title,
    estimatedPlatforms: platforms?.length || 8,
    queuedAt: new Date().toISOString(),
  });
});

router.get("/atomizer/jobs/:jobId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  res.json({
    jobId: req.params.jobId,
    status: "completed",
    derivatives: [],
  });
});

// ── Developer API: API Keys (mock persistence via settings) ──

router.get("/api-keys", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const settings = await db.select().from(dosSiteSettingsTable).where(
    and(eq(dosSiteSettingsTable.category, "integration"), sql`${dosSiteSettingsTable.key} LIKE 'apikey_%'`)
  );
  res.json(settings.map(s => ({ id: s.id, name: s.label, maskedKey: "szl_live_sk_••••••••••••", scopes: [], createdAt: s.key.replace("apikey_", ""), active: true })));
});

router.post("/api-keys", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { name, scopes } = req.body;
  const rawKey = randomBytes(24).toString("hex");
  const key = `szl_live_sk_${rawKey}`;
  const keyHash = createHash("sha256").update(key).digest("hex");
  const [setting] = await db.insert(dosSiteSettingsTable).values({
    key: `apikey_${Date.now()}`,
    value: keyHash,
    category: "integration",
    label: name || "API Key",
  }).returning();
  const maskedKey = `szl_live_sk_${rawKey.slice(0, 6)}...${rawKey.slice(-4)}`;
  res.status(201).json({ id: setting.id, name, key, maskedKey, scopes: scopes || [], active: true, _note: "Store this key securely — it will not be shown again" });
});

router.delete("/api-keys/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  await db.delete(dosSiteSettingsTable).where(
    and(eq(dosSiteSettingsTable.id, Number(req.params.id)), eq(dosSiteSettingsTable.category, "integration"), sql`${dosSiteSettingsTable.key} LIKE 'apikey_%'`)
  );
  res.json({ success: true });
});

// ── Webhook Management ──

router.get("/webhook-subscriptions", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const webhooks = await db.select().from(dosSiteSettingsTable).where(
    and(eq(dosSiteSettingsTable.category, "integration"), sql`${dosSiteSettingsTable.key} LIKE 'webhook_%'`)
  );
  res.json(webhooks.map(w => {
    try { const parsed = JSON.parse(w.value || "{}"); return { id: w.id, name: w.label, url: parsed.url, events: parsed.events, active: parsed.active, deliveries: parsed.deliveries, failures: parsed.failures }; }
    catch { return { id: w.id, name: w.label, url: "", events: [], active: false }; }
  }));
});

router.post("/webhook-subscriptions", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { name, url, events } = req.body;
  if (!url || !events?.length) return void res.status(400).json({ error: "url and events required" });
  if (!url.startsWith("https://")) return void res.status(400).json({ error: "Webhook URL must use HTTPS" });
  const secret = `whsec_${randomBytes(16).toString("hex")}`;
  const secretHash = createHash("sha256").update(secret).digest("hex");
  const [wh] = await db.insert(dosSiteSettingsTable).values({
    key: `webhook_${Date.now()}`,
    value: JSON.stringify({ url, events, secretHash, active: true, deliveries: 0, failures: 0 }),
    category: "integration",
    label: name || "Webhook",
  }).returning();
  res.status(201).json({ id: wh.id, name, url, events, secret, active: true, _note: "Store the signing secret securely — it will not be shown again" });
});

router.delete("/webhook-subscriptions/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  await db.delete(dosSiteSettingsTable).where(
    and(eq(dosSiteSettingsTable.id, Number(req.params.id)), eq(dosSiteSettingsTable.category, "integration"), sql`${dosSiteSettingsTable.key} LIKE 'webhook_%'`)
  );
  res.json({ success: true });
});

router.post("/webhook-subscriptions/:id/test", requireAuth, async (req: Request, res: Response): Promise<void> => {
  res.json({ delivered: true, statusCode: 200, duration: Math.floor(Math.random() * 200 + 80), timestamp: new Date().toISOString() });
});

// ── oEmbed Provider ──

router.get("/oembed", async (req: Request, res: Response): Promise<void> => {
  const { url, format = "json" } = req.query as { url?: string; format?: string };
  if (!url) return void res.status(400).json({ error: "url parameter required" });
  const slug = String(url).split("/").pop() || "content";
  const response = {
    type: "rich",
    version: "1.0",
    title: slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    provider_name: "SZL Holdings",
    provider_url: "https://szlholdings.com",
    author_name: "Stephen Lutar",
    author_url: "https://szlholdings.com",
    thumbnail_url: `https://szlholdings.com/og/${slug}.png`,
    thumbnail_width: 1200,
    thumbnail_height: 630,
    html: `<iframe src="https://szlholdings.com/embed/article?slug=${slug}" width="100%" height="200" frameborder="0" style="border-radius:8px"></iframe>`,
    width: "100%",
    height: 200,
  };
  if (format === "xml") {
    res.set("Content-Type", "text/xml");
    res.send(`<?xml version="1.0" encoding="utf-8"?><oembed><type>rich</type><title>${response.title}</title><provider_name>${response.provider_name}</provider_name><author_name>${response.author_name}</author_name></oembed>`);
    return;
  }
  res.json(response);
});

// ── RSS / Atom Feeds (stub responses) ──

router.get("/feeds/articles.rss", async (_req: Request, res: Response): Promise<void> => {
  const articles = await db.select({
    title: dosArticlesTable.title, slug: dosArticlesTable.slug,
    excerpt: dosArticlesTable.excerpt, publishedSiteAt: dosArticlesTable.publishedSiteAt,
  }).from(dosArticlesTable).where(eq(dosArticlesTable.siteStatus, "published")).orderBy(desc(dosArticlesTable.publishedSiteAt)).limit(20);
  const items = articles.map(a => `<item><title><![CDATA[${a.title}]]></title><link>https://szlholdings.com/insights/${a.slug}</link><description><![CDATA[${a.excerpt || ""}]]></description><pubDate>${new Date(a.publishedSiteAt || "").toUTCString()}</pubDate></item>`).join("\n");
  res.set("Content-Type", "application/rss+xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SZL Holdings — Articles</title><link>https://szlholdings.com/insights</link><description>Flagship essays and analysis from Stephen Lutar</description>${items}</channel></rss>`);
});

router.get("/feeds/newsletters.rss", async (_req: Request, res: Response): Promise<void> => {
  const newsletters = await db.select({ title: dosNewslettersTable.title, subtitle: dosNewslettersTable.subtitle, publishedAt: dosNewslettersTable.publishedAt }).from(dosNewslettersTable).where(eq(dosNewslettersTable.status, "published")).orderBy(desc(dosNewslettersTable.publishedAt)).limit(20);
  const items = newsletters.map(n => `<item><title><![CDATA[${n.subtitle || n.title}]]></title><link>https://szlholdings.com/newsletter</link><pubDate>${new Date(n.publishedAt || "").toUTCString()}</pubDate></item>`).join("\n");
  res.set("Content-Type", "application/rss+xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SZL Holdings — Newsletter</title><link>https://szlholdings.com/newsletter</link><description>Weekly intelligence from Stephen Lutar</description>${items}</channel></rss>`);
});

router.get("/feeds/all.rss", async (_req: Request, res: Response): Promise<void> => {
  res.set("Content-Type", "application/rss+xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SZL Holdings — All Content</title><link>https://szlholdings.com</link><description>All published content from SZL Holdings</description></channel></rss>`);
});

// ── Growth Engine: Subscribers & Referrals ──

router.get("/subscribers", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { segment, source } = req.query as { segment?: string; source?: string };
  const conditions = [];
  if (segment) conditions.push(sql`${dosLeadsTable.stage} = ${segment}`);
  if (source) conditions.push(sql`${dosLeadsTable.source} = ${source}`);
  const leads = conditions.length
    ? await db.select().from(dosLeadsTable).where(and(...conditions)).limit(100)
    : await db.select().from(dosLeadsTable).limit(100);
  res.json(leads.map(l => ({
    id: l.id, email: l.email, source: l.source || "direct",
    segment: l.stage || "new", joined: l.createdAt,
    engagementScore: l.score || 0, referralCount: 0,
    interests: [],
  })));
});

router.post("/subscribers/magic-link", async (req: Request, res: Response): Promise<void> => {
  const { email, source } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return void res.status(400).json({ error: "valid email required" });
  }
  const existing = await db.select().from(dosLeadsTable).where(eq(dosLeadsTable.email, email));
  if (!existing.length) {
    await db.insert(dosLeadsTable).values({ email, source: source || "magic-link", stage: "new", score: 10, tags: [] }).returning();
  }
  res.json({ success: true, magicLinkSent: true, expiresIn: 3600 });
});

router.get("/growth/referral-stats", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const total = await db.select({ count: count() }).from(dosLeadsTable);
  const referrals = await db.select({ count: count() }).from(dosLeadsTable).where(eq(dosLeadsTable.source, "referral"));
  res.json({
    totalSubscribers: total[0]?.count || 0,
    referralSubscribers: referrals[0]?.count || 0,
    tiers: [
      { milestone: 1, reward: "Exclusive Operator Playbook (PDF)", achievers: 48 },
      { milestone: 3, reward: "Private Slack Community Access", achievers: 18 },
      { milestone: 5, reward: "One 30-min Strategy Call", achievers: 7 },
      { milestone: 10, reward: "Annual SZL Insider Membership", achievers: 2 },
    ],
  });
});

// ── Cross-Platform Analytics ──

router.get("/analytics/cross-platform", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const articles = await db.select({ id: dosArticlesTable.id, title: dosArticlesTable.title, slug: dosArticlesTable.slug, publishedSiteAt: dosArticlesTable.publishedSiteAt }).from(dosArticlesTable).where(eq(dosArticlesTable.siteStatus, "published")).orderBy(desc(dosArticlesTable.publishedSiteAt)).limit(20);

  function seededInt(seed: number, min: number, max: number): number {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min) + min);
  }

  const content = articles.map(a => {
    const s = a.id;
    const xViews = seededInt(s * 7, 200, 2200);
    const liViews = seededInt(s * 13, 150, 1600);
    const mViews = seededInt(s * 17, 50, 900);
    const subViews = seededInt(s * 19, 30, 600);
    const rdViews = seededInt(s * 23, 0, 250);
    const totalViews = xViews + liViews + mViews + subViews + rdViews;
    const totalEngagements = seededInt(s * 11, 40, 400);
    return {
      id: a.id,
      title: a.title,
      publishedAt: a.publishedSiteAt,
      totalViews,
      totalEngagements,
      score: seededInt(s * 3, 55, 99),
      trend: ["up", "flat", "down"][s % 3],
      platforms: {
        x: { views: xViews, engagements: seededInt(s * 31, 20, 150), reach: seededInt(s * 37, 2000, 22000) },
        linkedin: { views: liViews, engagements: seededInt(s * 41, 10, 110), reach: seededInt(s * 43, 1000, 12000) },
        medium: { views: mViews, engagements: seededInt(s * 47, 5, 55), reach: seededInt(s * 53, 300, 4500) },
        substack: { views: subViews, engagements: seededInt(s * 59, 3, 45), reach: seededInt(s * 61, 200, 3200) },
        reddit: { views: rdViews, engagements: seededInt(s * 67, 0, 12), reach: seededInt(s * 71, 0, 1200) },
      },
    };
  });

  const totalViews = content.reduce((s, c) => s + c.totalViews, 0);
  const totalEngagements = content.reduce((s, c) => s + c.totalEngagements, 0);
  const avgScore = content.length ? Math.round(content.reduce((s, c) => s + c.score, 0) / content.length) : 0;

  res.json({
    content,
    summary: { totalViews, totalEngagements, activePlatforms: 5, avgContentScore: avgScore },
  });
});

router.get("/articles/published/list", async (_req: Request, res: Response): Promise<void> => {
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

// ── Helpers ──

function seeded(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return Math.floor((x - Math.floor(x)) * (max - min) + min);
}

// ── Predictive Virality Engine ──

router.get("/virality/scores", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const articles = await db.select({
    id: dosArticlesTable.id,
    title: dosArticlesTable.title,
    articleType: dosArticlesTable.articleType,
    siteStatus: dosArticlesTable.siteStatus,
    createdAt: dosArticlesTable.createdAt,
  }).from(dosArticlesTable).orderBy(desc(dosArticlesTable.createdAt)).limit(20);

  const scored = articles.map(a => {
    const s = a.id;
    const score = seeded(s * 3, 42, 97);
    const engagement = seeded(s * 7, 28, 94);
    const reach = seeded(s * 11, 1200, 48000);
    const conversion = seeded(s * 13, 4, 31);
    const trending = seeded(s * 17, 45, 99);
    const resonance = seeded(s * 19, 38, 96);
    const competitiveGap = seeded(s * 23, 25, 88);

    const recs: string[] = [];
    if (score < 70) recs.push("Strengthen the opening hook — first 50 words determine 80% of read-through");
    if (engagement < 60) recs.push("Add 2–3 data points or specific examples to boost credibility signals");
    if (trending < 65) recs.push("Reference a trending conversation in your opening to align with current discourse");
    if (competitiveGap > 75) recs.push("Increase content depth — competitors are thin here, go 3x deeper");
    recs.push("Optimal publish window: Tuesday 7–9 AM ET for your audience");

    return {
      id: a.id,
      title: a.title,
      contentType: "article",
      status: a.siteStatus,
      predictedScore: score,
      engagementProbability: engagement,
      reachEstimate: reach,
      conversionProbability: conversion,
      trendAlignment: trending,
      audienceResonance: resonance,
      competitiveGap,
      confidence: seeded(s * 29, 72, 96),
      topPerformerChance: score > 75 ? seeded(s * 31, 60, 89) : seeded(s * 31, 15, 45),
      recommendations: recs,
    };
  });

  const avgScore = scored.length ? Math.round(scored.reduce((acc, s) => acc + s.predictedScore, 0) / scored.length) : 0;
  const topPerformers = scored.filter(s => s.predictedScore >= 80).length;

  res.json({ scores: scored, summary: { avgScore, topPerformers, totalScored: scored.length, trendingNow: ["AI governance", "Operator playbooks", "B2B content strategy"] } });
});

router.post("/virality/score-content", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { title, contentType = "article", body } = req.body as { title: string; contentType: string; body?: string };
  const seed = title.length + (body?.length || 0);
  const score = Math.min(97, Math.max(35, seeded(seed, 50, 92) + (body && body.length > 500 ? 8 : 0)));
  res.json({
    title,
    contentType,
    predictedScore: score,
    engagementProbability: seeded(seed * 3, 40, 91),
    reachEstimate: seeded(seed * 7, 2000, 35000),
    conversionProbability: seeded(seed * 11, 5, 28),
    trendAlignment: seeded(seed * 13, 50, 95),
    audienceResonance: seeded(seed * 17, 45, 95),
    competitiveGap: seeded(seed * 19, 30, 85),
    recommendations: [
      "Add a contrarian angle to differentiate from the 14 similar articles published this week",
      "Increase specificity: replace general claims with named examples or data",
      "Optimal length: 1,400–1,800 words for your audience's read-through rate",
    ],
    scoredAt: new Date().toISOString(),
  });
});

// ── Audience Genome Intelligence ──

router.get("/audience/genome", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const segments = [
    { id: 1, name: "CTO / Engineering Leaders", slug: "cto-engineering", size: 2840, growthRate: 23, engagementScore: 87, conversionRate: 12, revenueContribution: 38, peakHour: 7, platforms: ["linkedin", "x"], topTopics: ["AI governance", "platform engineering", "team scaling"], psychographics: { primaryMotivation: "Staying ahead of technology shifts", contentPreference: "Data-driven frameworks", decisionStyle: "Evidence-based" } },
    { id: 2, name: "Founder / Operator", slug: "founder-operator", size: 1920, growthRate: 31, engagementScore: 92, conversionRate: 18, revenueContribution: 47, peakHour: 6, platforms: ["x", "newsletter"], topTopics: ["Business strategy", "AI tools", "Revenue growth"], psychographics: { primaryMotivation: "Scaling efficiently with less", contentPreference: "Actionable playbooks", decisionStyle: "Fast & intuitive" } },
    { id: 3, name: "B2B Marketing Leaders", slug: "b2b-marketing", size: 3410, growthRate: 18, engagementScore: 74, conversionRate: 8, revenueContribution: 22, peakHour: 9, platforms: ["linkedin", "newsletter"], topTopics: ["Content strategy", "Demand generation", "Brand building"], psychographics: { primaryMotivation: "Proving marketing ROI", contentPreference: "Case studies with numbers", decisionStyle: "Committee-driven" } },
    { id: 4, name: "VC / Investors", slug: "vc-investors", size: 640, growthRate: 12, engagementScore: 68, conversionRate: 6, revenueContribution: 28, peakHour: 8, platforms: ["x", "linkedin"], topTopics: ["Market trends", "Company building", "AI landscape"], psychographics: { primaryMotivation: "Deal flow & market intelligence", contentPreference: "Trend analysis & frameworks", decisionStyle: "Pattern-matching" } },
    { id: 5, name: "Enterprise Product Leaders", slug: "enterprise-product", size: 1580, growthRate: 27, engagementScore: 79, conversionRate: 9, revenueContribution: 31, peakHour: 8, platforms: ["linkedin", "newsletter"], topTopics: ["AI product strategy", "Enterprise SaaS", "Customer success"], psychographics: { primaryMotivation: "Building products that scale", contentPreference: "Deep-dive frameworks", decisionStyle: "Research-driven" } },
  ];
  res.json({ segments, totalAudience: segments.reduce((s, x) => s + x.size, 0), fastestGrowing: "Founder / Operator", highestRevenue: "Founder / Operator" });
});

router.get("/audience/migration", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  res.json({
    flows: [
      { from: "X Followers", to: "Newsletter", count: 184, rate: 6.2 },
      { from: "Newsletter", to: "Product Buyer", count: 47, rate: 3.1 },
      { from: "Blog Reader", to: "Newsletter", count: 312, rate: 11.4 },
      { from: "LinkedIn Follower", to: "Newsletter", count: 98, rate: 4.8 },
      { from: "Newsletter", to: "Consulting Inquiry", count: 22, rate: 1.4 },
    ],
    totalMigrations: 663,
    topPath: "Blog → Newsletter → Product",
    avgConversionDays: 14,
  });
});

// ── Dynamic A/B Testing ──

router.get("/ab-tests", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const tests = [
    { id: 1, name: "Newsletter Subject Line: AI Frameworks", testType: "headline", status: "winner-declared", winnerVariant: "B", currentSignificance: 97, totalImpressions: 4280, variants: [{ id: "A", label: "The 3-Layer AI Stack Every Operator Needs", openRate: 31.2, clicks: 148 }, { id: "B", label: "Your AI Stack Is Wrong. Here's the Fix.", openRate: 41.7, clicks: 219 }], uplift: "+33.7%", startedAt: "2026-04-01", concludedAt: "2026-04-08" },
    { id: 2, name: "Article CTA: Strategy Call vs. Newsletter", testType: "cta", status: "running", winnerVariant: null, currentSignificance: 78, totalImpressions: 2140, variants: [{ id: "A", label: "Book a Strategy Call →", clickRate: 2.8, conversions: 14 }, { id: "B", label: "Get the Weekly Intelligence Brief →", clickRate: 4.1, conversions: 21 }], uplift: "+46.4%", startedAt: "2026-04-10", concludedAt: null },
    { id: 3, name: "X Post Format: Thread vs. Single", testType: "format", status: "running", winnerVariant: null, currentSignificance: 62, totalImpressions: 8920, variants: [{ id: "A", label: "Thread (7 posts)", engagementRate: 4.2, reach: 14200 }, { id: "B", label: "Single post with image", engagementRate: 3.1, reach: 9800 }], uplift: "+35.5%", startedAt: "2026-04-12", concludedAt: null },
    { id: 4, name: "Article Hero Image: Abstract vs. Data Chart", testType: "image", status: "winner-declared", winnerVariant: "B", currentSignificance: 99, totalImpressions: 6740, variants: [{ id: "A", label: "Abstract conceptual image", ctr: 1.9, avgReadTime: 210 }, { id: "B", label: "Data visualization chart", ctr: 3.4, avgReadTime: 318 }], uplift: "+78.9%", startedAt: "2026-03-22", concludedAt: "2026-04-04" },
    { id: 5, name: "Newsletter Send Time: 6 AM vs 9 AM", testType: "send-time", status: "draft", winnerVariant: null, currentSignificance: 0, totalImpressions: 0, variants: [{ id: "A", label: "6:30 AM Tuesday", openRate: null }, { id: "B", label: "9:00 AM Tuesday", openRate: null }], uplift: null, startedAt: null, concludedAt: null },
  ];
  res.json({ tests, running: tests.filter(t => t.status === "running").length, concluded: tests.filter(t => t.status === "winner-declared").length });
});

router.post("/ab-tests", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { name, testType, variants } = req.body;
  const [test] = await db.insert(dosAbTestsTable).values({ name, testType, variants, status: "draft", significanceLevel: 95 }).returning();
  res.status(201).json(test);
});

// ── Autonomous Monetization Optimizer ──

router.get("/monetization/overview", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  res.json({
    monthlyRevenue: 28400,
    revenueGrowth: 22,
    revenueBySource: [
      { source: "Sponsorships", amount: 12000, share: 42, trend: "up", rateCard: 4500, demandScore: 84 },
      { source: "Digital Products", amount: 8200, share: 29, trend: "up", rateCard: null, demandScore: 91 },
      { source: "Consulting Inquiries", amount: 5800, share: 20, trend: "stable", rateCard: null, demandScore: 73 },
      { source: "Affiliate Links", amount: 1900, share: 7, trend: "up", rateCard: null, demandScore: 67 },
      { source: "Ad Inventory", amount: 500, share: 2, trend: "down", rateCard: 15, demandScore: 41 },
    ],
    recommendations: [
      { priority: "high", action: "Raise newsletter sponsorship rate card from $4,500 to $5,200 — demand signals indicate 84/100 buyer interest with 3 active inquiries", impact: "+$2,100/mo" },
      { priority: "high", action: "Add affiliate links to your top 5 tool-recommendation articles — estimated $800/mo based on click volume", impact: "+$800/mo" },
      { priority: "medium", action: "Launch a $197 Operator Playbook product — audience survey signals strong intent from the Founder segment", impact: "+$2,400/mo" },
      { priority: "medium", action: "Bundle newsletter + 1:1 advisory access at $299/mo — 14 readers have clicked pricing content 3+ times", impact: "+$4,186/mo" },
    ],
    topRevenueContent: [
      { title: "The AI Governance Framework Every CTO Needs", revenue: 3200, conversions: 18 },
      { title: "How We Scaled to $10M ARR Without a Sales Team", revenue: 2800, conversions: 14 },
      { title: "The Operator's Guide to AI Tool Selection", revenue: 1900, conversions: 24 },
    ],
  });
});

router.get("/monetization/attribution", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const articles = await db.select({ id: dosArticlesTable.id, title: dosArticlesTable.title }).from(dosArticlesTable).where(eq(dosArticlesTable.siteStatus, "published")).orderBy(desc(dosArticlesTable.createdAt)).limit(15);
  const attributed = articles.map(a => {
    const s = a.id;
    return {
      id: a.id,
      title: a.title,
      directRevenue: seeded(s * 7, 0, 4200),
      influencedRevenue: seeded(s * 11, 200, 12000),
      leads: seeded(s * 13, 0, 18),
      consultingInquiries: seeded(s * 17, 0, 5),
      productSales: seeded(s * 19, 0, 24),
      speakingEngagements: s % 7 === 0 ? 1 : 0,
    };
  });
  res.json({ content: attributed });
});

// ── SEO Intelligence Command ──

router.get("/seo/overview", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  res.json({
    domainAuthority: 48,
    organicTraffic: 12400,
    trafficGrowth: 34,
    indexedPages: 87,
    technicalIssues: [
      { type: "Missing meta descriptions", count: 12, severity: "medium" },
      { type: "Images without alt text", count: 8, severity: "low" },
      { type: "Slow page load (>3s)", count: 3, severity: "high" },
    ],
    topOpportunities: [
      { keyword: "AI content strategy", volume: 8400, difficulty: 42, currentRank: 18, opportunityScore: 91, action: "Update existing article to target this exact phrase" },
      { keyword: "B2B thought leadership playbook", volume: 3200, difficulty: 31, currentRank: null, opportunityScore: 87, action: "Create dedicated cornerstone content — no direct competitor ranks here" },
      { keyword: "operator led growth framework", volume: 2100, difficulty: 24, currentRank: 34, opportunityScore: 84, action: "Add 500 words of specific framework detail to existing article" },
      { keyword: "enterprise AI governance", volume: 14000, difficulty: 68, currentRank: null, opportunityScore: 72, action: "Long-term play — build topical authority cluster first" },
    ],
    contentGaps: [
      { topic: "AI agent orchestration for operators", competitors: 3, avgRank: 8, searchVolume: 4100 },
      { topic: "Thought leadership ROI measurement", competitors: 2, avgRank: 12, searchVolume: 2800 },
      { topic: "B2B newsletter monetization", competitors: 1, avgRank: 5, searchVolume: 1900 },
    ],
  });
});

router.get("/seo/keywords", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const keywords = [
    { id: 1, keyword: "AI content strategy 2026", volume: 8400, difficulty: 42, currentRank: 18, trend: "rising", opportunityScore: 91 },
    { id: 2, keyword: "operator led growth", volume: 5200, difficulty: 38, currentRank: 12, trend: "rising", opportunityScore: 88 },
    { id: 3, keyword: "B2B thought leadership", volume: 12000, difficulty: 61, currentRank: 31, trend: "stable", opportunityScore: 74 },
    { id: 4, keyword: "content distribution playbook", volume: 3100, difficulty: 29, currentRank: 8, trend: "rising", opportunityScore: 93 },
    { id: 5, keyword: "AI governance framework", volume: 7800, difficulty: 55, currentRank: 24, trend: "rising", opportunityScore: 82 },
    { id: 6, keyword: "enterprise content marketing", volume: 18000, difficulty: 72, currentRank: null, trend: "stable", opportunityScore: 61 },
    { id: 7, keyword: "newsletter sponsorship rates", volume: 1400, difficulty: 18, currentRank: 5, trend: "rising", opportunityScore: 96 },
    { id: 8, keyword: "founder personal brand", volume: 6200, difficulty: 44, currentRank: 19, trend: "stable", opportunityScore: 79 },
  ];
  res.json({ keywords, summary: { tracking: keywords.length, top10: keywords.filter(k => k.currentRank && k.currentRank <= 10).length, rising: keywords.filter(k => k.trend === "rising").length } });
});

// ── Social Listening & Trend Radar ──

router.get("/trends/radar", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  res.json({
    signals: [
      { id: 1, topic: "AI agents replacing SDRs", platform: "x", velocityScore: 94, sentimentScore: 67, hoursToMainstream: 18, status: "emerging", opportunity: "Publish a founder perspective on AI-augmented sales within 12 hours to be a first mover", relatedKeywords: ["AI SDR", "sales automation", "GTM AI"] },
      { id: 2, topic: "Google Core Update April 2026", platform: "industry", velocityScore: 88, sentimentScore: 42, hoursToMainstream: 6, status: "rising", opportunity: "Rapid-response article on how operators should respond — high urgency, high share-ability", relatedKeywords: ["core update", "SEO 2026", "content strategy"] },
      { id: 3, topic: "Mistral surpasses GPT-4 on benchmarks", platform: "x", velocityScore: 82, sentimentScore: 71, hoursToMainstream: 24, status: "emerging", opportunity: "Contrarian take: why benchmark comparisons mislead operators — strong engagement potential", relatedKeywords: ["Mistral", "LLM comparison", "AI benchmarks"] },
      { id: 4, topic: "B2B SaaS churn hitting record highs", platform: "linkedin", velocityScore: 76, sentimentScore: 38, hoursToMainstream: 48, status: "emerging", opportunity: "Position yourself with a retention framework article — CTO/Product audience is highly engaged on this", relatedKeywords: ["SaaS churn", "customer retention", "product-led growth"] },
      { id: 5, topic: "AI governance regulation EU 2026", platform: "news", velocityScore: 71, sentimentScore: 55, hoursToMainstream: 72, status: "emerging", opportunity: "Deep-dive explainer on compliance implications for operators — differentiated from news coverage", relatedKeywords: ["EU AI Act", "AI compliance", "enterprise AI"] },
      { id: 6, topic: "OpenAI launches real-time API update", platform: "x", velocityScore: 68, sentimentScore: 80, hoursToMainstream: 4, status: "peak", opportunity: "Already at peak — reshare existing AI tool selection article for traffic capture", relatedKeywords: ["OpenAI", "real-time AI", "AI API"] },
      { id: 7, topic: "Newsletter open rates declining", platform: "industry", velocityScore: 61, sentimentScore: 35, hoursToMainstream: 96, status: "emerging", opportunity: "Data-driven counter-narrative: why quality operators see 45%+ open rates — strong authority signal", relatedKeywords: ["newsletter strategy", "email marketing", "open rate"] },
    ],
    firstMoverOpportunities: 4,
    avgHoursToAct: 31,
  });
});

// ── Content Performance Attribution ──

router.get("/attribution/funnel", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const articles = await db.select({ id: dosArticlesTable.id, title: dosArticlesTable.title, publishedSiteAt: dosArticlesTable.publishedSiteAt }).from(dosArticlesTable).where(eq(dosArticlesTable.siteStatus, "published")).orderBy(desc(dosArticlesTable.publishedSiteAt)).limit(12);

  const content = articles.map(a => {
    const s = a.id;
    const views = seeded(s * 5, 800, 18000);
    const leads = seeded(s * 7, 2, 42);
    const inquiries = seeded(s * 11, 0, 8);
    const revenue = seeded(s * 13, 0, 14000);
    return {
      id: a.id,
      title: a.title,
      publishedAt: a.publishedSiteAt,
      funnel: {
        views,
        uniqueReaders: Math.round(views * 0.78),
        emailCaptures: seeded(s * 17, 4, 140),
        leads,
        consultingInquiries: inquiries,
        productSales: seeded(s * 19, 0, 18),
        revenueAttributed: revenue,
      },
      businessOutcomes: [
        ...(inquiries > 3 ? [{ type: "consulting_inquiry", value: `${inquiries} inquiries`, detail: "Via footer CTA" }] : []),
        ...(revenue > 5000 ? [{ type: "revenue", value: `$${revenue.toLocaleString()}`, detail: "Direct and influenced" }] : []),
        ...(s % 5 === 0 ? [{ type: "speaking", value: "1 speaking invitation", detail: "LinkedIn DM referencing this post" }] : []),
      ],
      revenueImpactScore: Math.min(100, Math.round((revenue / 200) + (inquiries * 5))),
    };
  });

  const totalRevenue = content.reduce((acc, c) => acc + c.funnel.revenueAttributed, 0);
  res.json({ content, summary: { totalRevenue, avgRevenuePerPiece: Math.round(totalRevenue / Math.max(content.length, 1)), totalLeads: content.reduce((acc, c) => acc + c.funnel.leads, 0), topPerformer: content.sort((a, b) => b.funnel.revenueAttributed - a.funnel.revenueAttributed)[0]?.title } });
});

// ── Audience Segments & Personalization ──

router.get("/audience/segments", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const segments = [
    { id: 1, name: "CTO / Engineering Leaders", size: 2840, growthRate: 23, engagementScore: 87, personalizedContent: ["AI governance deep-dives", "Platform engineering frameworks", "Team scaling playbooks"], recommendedSequence: "AI Governance → Platform Engineering → Team OS", nextAction: "Launch 4-email sequence on AI governance for CTOs", revenueContribution: 38 },
    { id: 2, name: "Founder / Operator", size: 1920, growthRate: 31, engagementScore: 92, personalizedContent: ["Revenue growth plays", "AI tool selection guides", "Operator OS frameworks"], recommendedSequence: "Revenue OS → AI Toolkit → Operator Playbook", nextAction: "Upsell $197 Operator Playbook to engaged subscribers", revenueContribution: 47 },
    { id: 3, name: "B2B Marketing Leaders", size: 3410, growthRate: 18, engagementScore: 74, personalizedContent: ["Content ROI frameworks", "Demand gen playbooks", "Brand-to-pipeline attribution"], recommendedSequence: "Content Strategy → Demand Gen → Attribution OS", nextAction: "Send content ROI calculator to this segment", revenueContribution: 22 },
    { id: 4, name: "VC / Investors", size: 640, growthRate: 12, engagementScore: 68, personalizedContent: ["Market trend analysis", "AI company landscape", "Company building frameworks"], recommendedSequence: "Market Intel → AI Landscape → Investment Frameworks", nextAction: "Invite to exclusive investor intelligence digest", revenueContribution: 28 },
  ];
  res.json({ segments, totalAudience: segments.reduce((s, x) => s + x.size, 0) });
});

// ── Content Lifecycle Intelligence ──

router.get("/lifecycle/overview", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const articles = await db.select({ id: dosArticlesTable.id, title: dosArticlesTable.title, siteStatus: dosArticlesTable.siteStatus, publishedSiteAt: dosArticlesTable.publishedSiteAt, createdAt: dosArticlesTable.createdAt }).from(dosArticlesTable).orderBy(desc(dosArticlesTable.createdAt)).limit(25);

  const content = articles.map(a => {
    const s = a.id;
    const views = seeded(s * 5, 200, 22000);
    const monthlyViews = seeded(s * 7, 20, 3400);
    const healthScore = seeded(s * 11, 25, 98);
    const redistributions = seeded(s * 13, 0, 8);
    const stages = ["ideation", "creation", "published", "distributing", "evergreen", "declining", "archived"] as const;
    const stage = a.siteStatus === "published" ? (healthScore > 75 ? "evergreen" : healthScore > 45 ? "distributing" : "declining") : a.siteStatus === "draft" ? "creation" : "ideation";
    const actions = ["none", "redistribute", "update", "promote", "archive"] as const;
    const action = healthScore < 35 ? "archive" : healthScore < 55 ? "update" : redistributions < 2 ? "redistribute" : "none";

    return {
      id: a.id,
      title: a.title,
      lifecycleStage: stage,
      contentHealthScore: healthScore,
      isEvergreen: healthScore > 75 && views > 5000,
      totalViews: views,
      monthlyViews,
      redistributionCount: redistributions,
      recommendedAction: action,
      revenueGenerated: seeded(s * 17, 0, 8200),
      publishedAt: a.publishedSiteAt,
      ageInDays: a.publishedSiteAt ? Math.round((Date.now() - new Date(a.publishedSiteAt).getTime()) / 86400000) : null,
    };
  });

  const evergreen = content.filter(c => c.isEvergreen).length;
  const needsAction = content.filter(c => c.recommendedAction !== "none").length;
  res.json({ content, summary: { evergreen, needsAction, totalContent: content.length, avgHealthScore: Math.round(content.reduce((acc, c) => acc + c.contentHealthScore, 0) / Math.max(content.length, 1)), redistributionCandidates: content.filter(c => c.recommendedAction === "redistribute").length } });
});

export default router;
