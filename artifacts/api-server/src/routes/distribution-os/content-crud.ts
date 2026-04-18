import { Router, type IRouter, type Request, type Response } from "express";
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
  type LeadStage = "new" | "qualified" | "warm" | "needs-followup" | "proposal-candidate" | "closed-won" | "closed-lost";
  if (stage) conditions.push(eq(dosLeadsTable.stage, stage as LeadStage));
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
  const [lead] = await db.insert(dosLeadsTable).values({ ...data, score } as typeof dosLeadsTable.$inferInsert).returning();
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
  const [s] = await db.insert(dosSiteSettingsTable).values(parsed.data as typeof dosSiteSettingsTable.$inferInsert).returning();
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


export function register(r: IRouter): void { r.use(router); }
