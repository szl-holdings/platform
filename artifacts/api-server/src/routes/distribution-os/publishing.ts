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



export function register(r: IRouter): void { r.use(router); }
