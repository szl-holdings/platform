import { Router, type IRouter, type Request, type Response } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
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
  insertDosArticleSchema, insertDosNewsletterSchema, insertDosCarouselProjectSchema,
  insertDosCarouselSlideSchema, insertDosXPostSchema, insertDosCampaignSchema,
  insertDosLeadNoteSchema, insertDosEditorialPillarSchema, insertDosCtaBlockSchema,
  insertDosContentCalendarItemSchema, insertDosDistributionTargetSchema,
  insertDosAuthorProfileSchema, insertDosAutomationRunSchema, insertDosIntegrationStatusSchema,
} from "@szl-holdings/db";
import { eq, desc, asc, and, gte, count, sql } from "drizzle-orm";
import { authMiddleware } from "../../middlewares/auth";
import { sendNotFound, sendBadRequest, sendError } from "../../lib/api-response";
import { listQuerySchema, validateBody, validateQuery } from "../../lib/validation";

const router = Router();
const requireAuth = authMiddleware({ required: true });

router.get("/articles", validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const articles = await db.select().from(dosArticlesTable).orderBy(desc(dosArticlesTable.createdAt)).limit(100);
  res.json(articles);
});

router.get("/articles/:id", validateQuery(listQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const [article] = await db.select().from(dosArticlesTable).where(eq(dosArticlesTable.id, Number(req.params.id)));
  if (!article) return void sendNotFound(res, "Article");
  res.json(article);
});

router.get("/articles/slug/:slug", validateQuery(listQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const [article] = await db.select().from(dosArticlesTable).where(eq(dosArticlesTable.slug, req.params.slug as string));
  if (!article) return void sendNotFound(res, "Article");
  res.json(article);
});

router.post("/articles", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosArticleSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [article] = await db.insert(dosArticlesTable).values(parsed.data).returning();
  res.status(201).json(article);
});

router.patch("/articles/:id", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosArticleSchema.partial().safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [article] = await db.update(dosArticlesTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(dosArticlesTable.id, Number(req.params.id))).returning();
  if (!article) return void sendNotFound(res, "Article");
  res.json(article);
});

router.delete("/articles/:id", validateBody(bodyShape({})), requireAuth, async (req: Request, res: Response): Promise<void> => {
  await db.delete(dosArticlesTable).where(eq(dosArticlesTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.get("/articles/:id/versions", validateQuery(listQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const versions = await db.select().from(dosArticleVersionsTable).where(eq(dosArticleVersionsTable.articleId, Number(req.params.id))).orderBy(desc(dosArticleVersionsTable.createdAt));
  res.json(versions);
});

router.get("/newsletters", validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const newsletters = await db.select().from(dosNewslettersTable).orderBy(desc(dosNewslettersTable.createdAt)).limit(100);
  res.json(newsletters);
});

router.get("/newsletters/:id", validateQuery(listQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const [nl] = await db.select().from(dosNewslettersTable).where(eq(dosNewslettersTable.id, Number(req.params.id)));
  if (!nl) return void sendNotFound(res, "Newsletter");
  res.json(nl);
});

router.post("/newsletters", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosNewsletterSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [nl] = await db.insert(dosNewslettersTable).values(parsed.data).returning();
  res.status(201).json(nl);
});

router.patch("/newsletters/:id", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosNewsletterSchema.partial().safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [nl] = await db.update(dosNewslettersTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(dosNewslettersTable.id, Number(req.params.id))).returning();
  if (!nl) return void sendNotFound(res, "Newsletter");
  res.json(nl);
});

router.delete("/newsletters/:id", validateBody(bodyShape({})), requireAuth, async (req: Request, res: Response): Promise<void> => {
  await db.delete(dosNewslettersTable).where(eq(dosNewslettersTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.get("/carousels", validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const carousels = await db.select().from(dosCarouselProjectsTable).orderBy(desc(dosCarouselProjectsTable.createdAt)).limit(100);
  res.json(carousels);
});

router.get("/carousels/:id", validateQuery(listQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const [c] = await db.select().from(dosCarouselProjectsTable).where(eq(dosCarouselProjectsTable.id, Number(req.params.id)));
  if (!c) return void sendNotFound(res, "Carousel");
  const slides = await db.select().from(dosCarouselSlidesTable).where(eq(dosCarouselSlidesTable.projectId, c.id)).orderBy(asc(dosCarouselSlidesTable.slideNumber));
  res.json({ ...c, slides });
});

const carouselSlideInputSchema = insertDosCarouselSlideSchema.omit({ projectId: true, slideNumber: true });

router.post("/carousels", requireAuth, validateBody(bodyShape({
      "slides": z.unknown().optional(),
    })), async (req: Request, res: Response): Promise<void> => {
  const { slides, ...projectRaw } = req.body;
  const parsed = insertDosCarouselProjectSchema.safeParse(projectRaw);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());

  if (slides !== undefined && slides !== null) {
    if (!Array.isArray(slides)) return void sendBadRequest(res, "slides must be an array");
    for (let i = 0; i < slides.length; i++) {
      const sr = carouselSlideInputSchema.partial().safeParse(slides[i]);
      if (!sr.success) return void sendBadRequest(res, `Invalid slide at index ${i}`, sr.error.flatten());
    }
  }

  const [c] = await db.insert(dosCarouselProjectsTable).values(parsed.data).returning();
  if (Array.isArray(slides) && slides.length > 0) {
    await db.insert(dosCarouselSlidesTable).values(
      (slides as Record<string, unknown>[]).map((s, i) => ({
        ...(carouselSlideInputSchema.partial().parse(s)),
        projectId: c.id,
        slideNumber: i + 1,
      }))
    );
  }
  res.status(201).json(c);
});

router.patch("/carousels/:id", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosCarouselProjectSchema.partial().safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [c] = await db.update(dosCarouselProjectsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(dosCarouselProjectsTable.id, Number(req.params.id))).returning();
  if (!c) return void sendNotFound(res, "Carousel");
  res.json(c);
});

router.get("/x-posts", validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const posts = await db.select().from(dosXPostsTable).orderBy(desc(dosXPostsTable.createdAt)).limit(100);
  res.json(posts);
});

router.get("/x-posts/:id", validateQuery(listQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const [post] = await db.select().from(dosXPostsTable).where(eq(dosXPostsTable.id, Number(req.params.id)));
  if (!post) return void sendNotFound(res, "X post");
  res.json(post);
});

router.post("/x-posts", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosXPostSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [post] = await db.insert(dosXPostsTable).values(parsed.data).returning();
  res.status(201).json(post);
});

router.patch("/x-posts/:id", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosXPostSchema.partial().safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [post] = await db.update(dosXPostsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(dosXPostsTable.id, Number(req.params.id))).returning();
  if (!post) return void sendNotFound(res, "X post");
  res.json(post);
});

router.delete("/x-posts/:id", validateBody(bodyShape({})), requireAuth, async (req: Request, res: Response): Promise<void> => {
  await db.delete(dosXPostsTable).where(eq(dosXPostsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

const xPostQueueSchema = z.object({
  scheduledFor: z.string().datetime().optional(),
});

router.post("/x-posts/:id/queue", requireAuth, validateBody(bodyShape({
      "scheduledFor": z.unknown().optional(),
    })), async (req: Request, res: Response): Promise<void> => {
  const parsed = xPostQueueSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [post] = await db.update(dosXPostsTable)
    .set({ status: "queued", scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : new Date(), updatedAt: new Date() })
    .where(eq(dosXPostsTable.id, Number(req.params.id)))
    .returning();
  if (!post) return void sendNotFound(res, "X post");
  res.json(post);
});

router.get("/campaigns", requireAuth, validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const campaigns = await db.select().from(dosCampaignsTable).orderBy(desc(dosCampaignsTable.createdAt)).limit(100);
  res.json(campaigns);
});

router.post("/campaigns", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosCampaignSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [c] = await db.insert(dosCampaignsTable).values(parsed.data).returning();
  res.status(201).json(c);
});

router.patch("/campaigns/:id", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosCampaignSchema.partial().safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [c] = await db.update(dosCampaignsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(dosCampaignsTable.id, Number(req.params.id))).returning();
  if (!c) return void sendNotFound(res, "Campaign");
  res.json(c);
});

router.get("/campaigns/:id/links", requireAuth, validateQuery(listQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const links = await db.select().from(dosCampaignLinksTable).where(eq(dosCampaignLinksTable.campaignId, Number(req.params.id)));
  res.json(links);
});

const campaignLinkCreateSchema = z.object({
  name: z.string().min(1),
  destination: z.string().url("destination must be a valid URL"),
  source: z.string().min(1),
  medium: z.string().min(1),
  campaign: z.string().min(1),
  content: z.string().optional(),
  term: z.string().optional(),
  owner: z.string().optional(),
  notes: z.string().optional(),
});

router.post("/campaigns/:id/links", requireAuth, validateBody(bodyShape({
      "name": z.unknown().optional(),
      "notes": z.unknown().optional(),
      "owner": z.unknown().optional(),
    })), async (req: Request, res: Response): Promise<void> => {
  const parsed = campaignLinkCreateSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const { source, medium, campaign, content, term, destination } = parsed.data;
  const utmParams = new URLSearchParams();
  utmParams.set("utm_source", source);
  utmParams.set("utm_medium", medium);
  utmParams.set("utm_campaign", campaign);
  if (content) utmParams.set("utm_content", content);
  if (term) utmParams.set("utm_term", term);
  const fullUrl = `${destination}${destination.includes("?") ? "&" : "?"}${utmParams.toString()}`;
  const [link] = await db.insert(dosCampaignLinksTable).values({
    campaignId: Number(req.params.id),
    name: parsed.data.name,
    source,
    medium,
    campaign,
    content: content ?? null,
    term: term ?? null,
    destination,
    fullUrl,
    owner: parsed.data.owner ?? null,
    notes: parsed.data.notes ?? null,
  }).returning();
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

router.get("/leads", requireAuth, validateQuery(listQuerySchema), async (req: Request, res: Response): Promise<void> => {
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

router.post("/leads", validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = LeadCreateSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const data = parsed.data;
  const score = computeLeadScore(data);
  const [lead] = await db.insert(dosLeadsTable).values({ ...data, score } as typeof dosLeadsTable.$inferInsert).returning();
  res.status(201).json(lead);
});

router.patch("/leads/:id", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = LeadCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());

  const [existing] = await db.select().from(dosLeadsTable).where(eq(dosLeadsTable.id, Number(req.params.id)));
  if (!existing) return void sendNotFound(res, "Lead");

  const merged = { ...existing, ...parsed.data };
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
  const [lead] = await db.update(dosLeadsTable).set({ ...parsed.data, score, updatedAt: new Date() }).where(eq(dosLeadsTable.id, Number(req.params.id))).returning();
  res.json(lead);
});

router.delete("/leads/:id", validateBody(bodyShape({})), requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(dosLeadNotesTable).where(eq(dosLeadNotesTable.leadId, id));
  await db.delete(dosLeadsTable).where(eq(dosLeadsTable.id, id));
  res.json({ success: true });
});

router.get("/leads/:id/notes", requireAuth, validateQuery(listQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const notes = await db.select().from(dosLeadNotesTable).where(eq(dosLeadNotesTable.leadId, Number(req.params.id))).orderBy(desc(dosLeadNotesTable.createdAt));
  res.json(notes);
});

router.post("/leads/:id/notes", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosLeadNoteSchema.safeParse({ ...req.body, leadId: Number(req.params.id) });
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [note] = await db.insert(dosLeadNotesTable).values(parsed.data).returning();
  res.status(201).json(note);
});

router.get("/pillars", validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const pillars = await db.select().from(dosEditorialPillarsTable).orderBy(asc(dosEditorialPillarsTable.sortOrder));
  res.json(pillars);
});

router.post("/pillars", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosEditorialPillarSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [p] = await db.insert(dosEditorialPillarsTable).values(parsed.data).returning();
  res.status(201).json(p);
});

router.get("/cta-blocks", validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const blocks = await db.select().from(dosCtaBlocksTable).orderBy(desc(dosCtaBlocksTable.createdAt));
  res.json(blocks);
});

router.post("/cta-blocks", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosCtaBlockSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [b] = await db.insert(dosCtaBlocksTable).values(parsed.data).returning();
  res.status(201).json(b);
});

router.get("/calendar", validateQuery(listQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const items = await db.select().from(dosContentCalendarItemsTable).orderBy(asc(dosContentCalendarItemsTable.scheduledDate)).limit(200);
  res.json(items);
});

router.post("/calendar", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosContentCalendarItemSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [item] = await db.insert(dosContentCalendarItemsTable).values(parsed.data).returning();
  res.status(201).json(item);
});

router.patch("/calendar/:id", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosContentCalendarItemSchema.partial().safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [item] = await db.update(dosContentCalendarItemsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(dosContentCalendarItemsTable.id, Number(req.params.id))).returning();
  if (!item) return void sendNotFound(res, "Calendar item");
  res.json(item);
});

router.get("/distribution", validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const targets = await db.select().from(dosDistributionTargetsTable).orderBy(desc(dosDistributionTargetsTable.createdAt)).limit(200);
  res.json(targets);
});

router.post("/distribution", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosDistributionTargetSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [t] = await db.insert(dosDistributionTargetsTable).values(parsed.data).returning();
  res.status(201).json(t);
});

router.patch("/distribution/:id", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosDistributionTargetSchema.partial().safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [t] = await db.update(dosDistributionTargetsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(dosDistributionTargetsTable.id, Number(req.params.id))).returning();
  if (!t) return void sendNotFound(res, "Distribution target");
  res.json(t);
});

router.get("/settings", requireAuth, validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const settings = await db.select().from(dosSiteSettingsTable).orderBy(asc(dosSiteSettingsTable.category));
  res.json(settings);
});

router.post("/settings", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = SettingWriteSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [s] = await db.insert(dosSiteSettingsTable).values(parsed.data as typeof dosSiteSettingsTable.$inferInsert).returning();
  res.status(201).json(s);
});

router.patch("/settings/:key", requireAuth, validateBody(bodyShape({
      "value": z.unknown().optional(),
    })), async (req: Request, res: Response): Promise<void> => {
  const [s] = await db.update(dosSiteSettingsTable).set({ value: req.body.value, updatedAt: new Date() }).where(eq(dosSiteSettingsTable.key, req.params.key as string)).returning();
  if (!s) return void sendNotFound(res, "Setting");
  res.json(s);
});

router.get("/integrations", requireAuth, validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const integrations = await db.select().from(dosIntegrationStatusTable).orderBy(asc(dosIntegrationStatusTable.provider));
  res.json(integrations);
});

router.post("/integrations/retry/:provider", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const [i] = await db.update(dosIntegrationStatusTable).set({ status: "disconnected", lastError: null, updatedAt: new Date() }).where(eq(dosIntegrationStatusTable.provider, req.params.provider as string)).returning();
  if (!i) return void sendNotFound(res, "Integration");
  res.json(i);
});

router.patch("/integrations/:id", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosIntegrationStatusSchema.partial().safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [i] = await db.update(dosIntegrationStatusTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(dosIntegrationStatusTable.id, Number(req.params.id))).returning();
  if (!i) return void sendNotFound(res, "Integration");
  res.json(i);
});

router.get("/authors", validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const authors = await db.select().from(dosAuthorProfilesTable);
  res.json(authors);
});

router.post("/authors", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosAuthorProfileSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [a] = await db.insert(dosAuthorProfilesTable).values(parsed.data).returning();
  res.status(201).json(a);
});

router.get("/linktree", validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  // Public endpoint — active items only
  const items = await db.select().from(dosLinktreeConfigTable).where(eq(dosLinktreeConfigTable.isActive, true)).orderBy(asc(dosLinktreeConfigTable.sortOrder));
  res.json(items);
});

router.get("/linktree/admin", requireAuth, validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  // Admin endpoint — all items including inactive
  const items = await db.select().from(dosLinktreeConfigTable).orderBy(asc(dosLinktreeConfigTable.sortOrder));
  res.json(items);
});

router.post("/linktree", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = LinktreeItemSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [item] = await db.insert(dosLinktreeConfigTable).values(parsed.data).returning();
  res.status(201).json(item);
});

router.patch("/linktree/:id", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = LinktreeItemSchema.partial().safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [item] = await db.update(dosLinktreeConfigTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(dosLinktreeConfigTable.id, Number(req.params.id))).returning();
  if (!item) return void sendNotFound(res, "Linktree item");
  res.json(item);
});

router.delete("/linktree/:id", validateBody(bodyShape({})), requireAuth, async (req: Request, res: Response): Promise<void> => {
  await db.delete(dosLinktreeConfigTable).where(eq(dosLinktreeConfigTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.get("/automation-runs", validateQuery(listQuerySchema), async (_req: Request, res: Response): Promise<void> => {
  const runs = await db.select().from(dosAutomationRunsTable).orderBy(desc(dosAutomationRunsTable.createdAt)).limit(50);
  res.json(runs);
});

router.post("/automation-runs", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosAutomationRunSchema.safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [run] = await db.insert(dosAutomationRunsTable).values(parsed.data).returning();
  res.status(201).json(run);
});

router.patch("/automation-runs/:id", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
  const parsed = insertDosAutomationRunSchema.partial().safeParse(req.body);
  if (!parsed.success) return void sendBadRequest(res, "Validation failed", parsed.error.flatten());
  const [run] = await db.update(dosAutomationRunsTable).set(parsed.data).where(eq(dosAutomationRunsTable.id, Number(req.params.id))).returning();
  if (!run) return void sendNotFound(res, "Run");
  res.json(run);
});

// ─── Automation Job Executors ─────────────────────────────────────────────────
// These are the server-side job handlers that write real outputs and real metrics.

router.post("/automation-runs/trigger/:jobType", requireAuth, validateBody(bodyShape({})), async (req: Request, res: Response): Promise<void> => {
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
      return void sendBadRequest(res, `Unknown job type: ${jobType}`);
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
    sendError(res, errorMessage, 500, "INTERNAL_ERROR", { run });
  }
});


export function register(r: IRouter): void { r.use(router); }
