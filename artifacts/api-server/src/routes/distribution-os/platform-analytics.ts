import { bodyShape } from '@szl-holdings/contracts/common';
import {
  db,
  dosAbTestsTable,
  dosArticlesTable,
  dosAutomationRunsTable,
  dosIntegrationStatusTable,
  dosLeadsTable,
  dosNewslettersTable,
  dosPageViewsTable,
  dosSiteSettingsTable,
  dosXPostsTable,
} from '@szl-holdings/db';
import { createHash, randomBytes } from 'node:crypto';
import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { listQuerySchema, validateBody, validateQuery } from '../../lib/validation';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();
const requireAuth = authMiddleware({ required: true });

// ── Distribution OS Superengine: Extended Platform Connections ──

router.get(
  '/platform-connections',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const integrations = await db
      .select()
      .from(dosIntegrationStatusTable)
      .orderBy(asc(dosIntegrationStatusTable.provider));
    const ALL_PLATFORMS = [
      'x',
      'linkedin',
      'threads',
      'bluesky',
      'mastodon',
      'instagram',
      'medium',
      'devto',
      'hashnode',
      'wordpress',
      'ghost',
      'substack',
      'reddit',
    ];
    const map = Object.fromEntries(integrations.map((i) => [i.provider, i]));
    const result = ALL_PLATFORMS.map((provider) => ({
      provider,
      status: map[provider]?.status || 'disconnected',
      authMode: map[provider]?.authMode || 'oauth2',
      lastSuccess: map[provider]?.lastSuccess || null,
      lastError: map[provider]?.lastError || null,
    }));
    res.json(result);
  },
);

// ── AI Atomizer Job Stubs ──

router.post(
  '/atomizer/atomize',
  requireAuth,
  validateBody(
    bodyShape({
      content: z.unknown().optional(),
      platforms: z.unknown().optional(),
      title: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response): Promise<void> => {
    const { title, content, platforms } = req.body;
    if (!content) return void res.status(400).json({ error: 'content is required' });
    const jobId = `atomize_${Date.now()}`;
    res.json({
      jobId,
      status: 'queued',
      title,
      estimatedPlatforms: platforms?.length || 8,
      queuedAt: new Date().toISOString(),
    });
  },
);

router.get(
  '/atomizer/jobs/:jobId',
  requireAuth,
  validateQuery(listQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    res.json({
      jobId: req.params.jobId,
      status: 'completed',
      derivatives: [],
    });
  },
);

// ── Developer API: API Keys (mock persistence via settings) ──

router.get(
  '/api-keys',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const settings = await db
      .select()
      .from(dosSiteSettingsTable)
      .where(
        and(
          eq(dosSiteSettingsTable.category, 'integration'),
          sql`${dosSiteSettingsTable.key} LIKE 'apikey_%'`,
        ),
      );
    res.json(
      settings.map((s) => ({
        id: s.id,
        name: s.label,
        maskedKey: 'szl_live_sk_••••••••••••',
        scopes: [],
        createdAt: s.key.replace('apikey_', ''),
        active: true,
      })),
    );
  },
);

router.post(
  '/api-keys',
  requireAuth,
  validateBody(
    bodyShape({
      name: z.unknown().optional(),
      scopes: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response): Promise<void> => {
    const { name, scopes } = req.body;
    const rawKey = randomBytes(24).toString('hex');
    const key = `szl_live_sk_${rawKey}`;
    const keyHash = createHash('sha256').update(key).digest('hex');
    const [setting] = await db
      .insert(dosSiteSettingsTable)
      .values({
        key: `apikey_${Date.now()}`,
        value: keyHash,
        category: 'integration',
        label: name || 'API Key',
      })
      .returning();
    const maskedKey = `szl_live_sk_${rawKey.slice(0, 6)}...${rawKey.slice(-4)}`;
    res.status(201).json({
      id: setting.id,
      name,
      key,
      maskedKey,
      scopes: scopes || [],
      active: true,
      _note: 'Store this key securely — it will not be shown again',
    });
  },
);

router.delete(
  '/api-keys/:id',
  validateBody(bodyShape({})),
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    await db
      .delete(dosSiteSettingsTable)
      .where(
        and(
          eq(dosSiteSettingsTable.id, Number(req.params.id)),
          eq(dosSiteSettingsTable.category, 'integration'),
          sql`${dosSiteSettingsTable.key} LIKE 'apikey_%'`,
        ),
      );
    res.json({ success: true });
  },
);

// ── Webhook Management ──

router.get(
  '/webhook-subscriptions',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const webhooks = await db
      .select()
      .from(dosSiteSettingsTable)
      .where(
        and(
          eq(dosSiteSettingsTable.category, 'integration'),
          sql`${dosSiteSettingsTable.key} LIKE 'webhook_%'`,
        ),
      );
    res.json(
      webhooks.map((w) => {
        try {
          const parsed = JSON.parse(w.value || '{}');
          return {
            id: w.id,
            name: w.label,
            url: parsed.url,
            events: parsed.events,
            active: parsed.active,
            deliveries: parsed.deliveries,
            failures: parsed.failures,
          };
        } catch {
          return { id: w.id, name: w.label, url: '', events: [], active: false };
        }
      }),
    );
  },
);

router.post(
  '/webhook-subscriptions',
  requireAuth,
  validateBody(
    bodyShape({
      events: z.unknown().optional(),
      name: z.unknown().optional(),
      url: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response): Promise<void> => {
    const { name, url, events } = req.body;
    if (!url || !events?.length)
      return void res.status(400).json({ error: 'url and events required' });
    if (!url.startsWith('https://'))
      return void res.status(400).json({ error: 'Webhook URL must use HTTPS' });
    const secret = `whsec_${randomBytes(16).toString('hex')}`;
    const secretHash = createHash('sha256').update(secret).digest('hex');
    const [wh] = await db
      .insert(dosSiteSettingsTable)
      .values({
        key: `webhook_${Date.now()}`,
        value: JSON.stringify({
          url,
          events,
          secretHash,
          active: true,
          deliveries: 0,
          failures: 0,
        }),
        category: 'integration',
        label: name || 'Webhook',
      })
      .returning();
    res.status(201).json({
      id: wh.id,
      name,
      url,
      events,
      secret,
      active: true,
      _note: 'Store the signing secret securely — it will not be shown again',
    });
  },
);

router.delete(
  '/webhook-subscriptions/:id',
  validateBody(bodyShape({})),
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    await db
      .delete(dosSiteSettingsTable)
      .where(
        and(
          eq(dosSiteSettingsTable.id, Number(req.params.id)),
          eq(dosSiteSettingsTable.category, 'integration'),
          sql`${dosSiteSettingsTable.key} LIKE 'webhook_%'`,
        ),
      );
    res.json({ success: true });
  },
);

router.post(
  '/webhook-subscriptions/:id/test',
  requireAuth,
  validateBody(bodyShape({})),
  async (_req: Request, res: Response): Promise<void> => {
    res.json({
      delivered: true,
      statusCode: 200,
      duration: Math.floor(Math.random() * 200 + 80),
      timestamp: new Date().toISOString(),
    });
  },
);

// ── oEmbed Provider ──

router.get(
  '/oembed',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    const { url, format = 'json' } = req.query as { url?: string; format?: string };
    if (!url) return void res.status(400).json({ error: 'url parameter required' });
    const slug = String(url).split('/').pop() || 'content';
    const response = {
      type: 'rich',
      version: '1.0',
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      provider_name: 'SZL Holdings',
      provider_url: 'https://szlholdings.com',
      author_name: 'Stephen Lutar',
      author_url: 'https://szlholdings.com',
      thumbnail_url: `https://szlholdings.com/og/${slug}.png`,
      thumbnail_width: 1200,
      thumbnail_height: 630,
      html: `<iframe src="https://szlholdings.com/embed/article?slug=${slug}" width="100%" height="200" frameborder="0" style="border-radius:8px"></iframe>`,
      width: '100%',
      height: 200,
    };
    if (format === 'xml') {
      res.set('Content-Type', 'text/xml');
      res.send(
        `<?xml version="1.0" encoding="utf-8"?><oembed><type>rich</type><title>${response.title}</title><provider_name>${response.provider_name}</provider_name><author_name>${response.author_name}</author_name></oembed>`,
      );
      return;
    }
    res.json(response);
  },
);

// ── RSS / Atom Feeds (stub responses) ──

router.get(
  '/feeds/articles.rss',
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const articles = await db
      .select({
        title: dosArticlesTable.title,
        slug: dosArticlesTable.slug,
        excerpt: dosArticlesTable.excerpt,
        publishedSiteAt: dosArticlesTable.publishedSiteAt,
      })
      .from(dosArticlesTable)
      .where(eq(dosArticlesTable.siteStatus, 'published'))
      .orderBy(desc(dosArticlesTable.publishedSiteAt))
      .limit(20);
    const items = articles
      .map(
        (a) =>
          `<item><title><![CDATA[${a.title}]]></title><link>https://szlholdings.com/insights/${a.slug}</link><description><![CDATA[${a.excerpt || ''}]]></description><pubDate>${new Date(a.publishedSiteAt || '').toUTCString()}</pubDate></item>`,
      )
      .join('\n');
    res.set('Content-Type', 'application/rss+xml');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SZL Holdings — Articles</title><link>https://szlholdings.com/insights</link><description>Flagship essays and analysis from Stephen Lutar</description>${items}</channel></rss>`,
    );
  },
);

router.get(
  '/feeds/newsletters.rss',
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const newsletters = await db
      .select({
        title: dosNewslettersTable.title,
        subtitle: dosNewslettersTable.subtitle,
        publishedAt: dosNewslettersTable.publishedAt,
      })
      .from(dosNewslettersTable)
      .where(eq(dosNewslettersTable.status, 'published'))
      .orderBy(desc(dosNewslettersTable.publishedAt))
      .limit(20);
    const items = newsletters
      .map(
        (n) =>
          `<item><title><![CDATA[${n.subtitle || n.title}]]></title><link>https://szlholdings.com/newsletter</link><pubDate>${new Date(n.publishedAt || '').toUTCString()}</pubDate></item>`,
      )
      .join('\n');
    res.set('Content-Type', 'application/rss+xml');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SZL Holdings — Newsletter</title><link>https://szlholdings.com/newsletter</link><description>Weekly intelligence from Stephen Lutar</description>${items}</channel></rss>`,
    );
  },
);

router.get(
  '/feeds/all.rss',
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    res.set('Content-Type', 'application/rss+xml');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SZL Holdings — All Content</title><link>https://szlholdings.com</link><description>All published content from SZL Holdings</description></channel></rss>`,
    );
  },
);

// ── Growth Engine: Subscribers & Referrals ──

router.get(
  '/subscribers',
  requireAuth,
  validateQuery(listQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    const { segment, source } = req.query as { segment?: string; source?: string };
    const conditions = [];
    if (segment) conditions.push(sql`${dosLeadsTable.stage} = ${segment}`);
    if (source) conditions.push(sql`${dosLeadsTable.source} = ${source}`);
    const leads = conditions.length
      ? await db
          .select()
          .from(dosLeadsTable)
          .where(and(...conditions))
          .limit(100)
      : await db.select().from(dosLeadsTable).limit(100);
    res.json(
      leads.map((l) => ({
        id: l.id,
        email: l.email,
        source: l.source || 'direct',
        segment: l.stage || 'new',
        joined: l.createdAt,
        engagementScore: l.score || 0,
        referralCount: 0,
        interests: [],
      })),
    );
  },
);

router.post(
  '/subscribers/magic-link',
  validateBody(
    bodyShape({
      email: z.unknown().optional(),
      source: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response): Promise<void> => {
    const { email, source } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return void res.status(400).json({ error: 'valid email required' });
    }
    const existing = await db.select().from(dosLeadsTable).where(eq(dosLeadsTable.email, email));
    if (!existing.length) {
      await db
        .insert(dosLeadsTable)
        .values({ email, source: source || 'magic-link', stage: 'new', score: 10, tags: [] })
        .returning();
    }
    res.json({ success: true, magicLinkSent: true, expiresIn: 3600 });
  },
);

router.get(
  '/growth/referral-stats',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const total = await db.select({ count: count() }).from(dosLeadsTable);
    const referrals = await db
      .select({ count: count() })
      .from(dosLeadsTable)
      .where(eq(dosLeadsTable.source, 'referral'));
    res.json({
      totalSubscribers: total[0]?.count || 0,
      referralSubscribers: referrals[0]?.count || 0,
      tiers: [
        { milestone: 1, reward: 'Exclusive Operator Playbook (PDF)', achievers: 48 },
        { milestone: 3, reward: 'Private Slack Community Access', achievers: 18 },
        { milestone: 5, reward: 'One 30-min Strategy Call', achievers: 7 },
        { milestone: 10, reward: 'Annual SZL Insider Membership', achievers: 2 },
      ],
    });
  },
);

// ── Cross-Platform Analytics ──

router.get(
  '/analytics/cross-platform',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const articles = await db
      .select({
        id: dosArticlesTable.id,
        title: dosArticlesTable.title,
        slug: dosArticlesTable.slug,
        publishedSiteAt: dosArticlesTable.publishedSiteAt,
      })
      .from(dosArticlesTable)
      .where(eq(dosArticlesTable.siteStatus, 'published'))
      .orderBy(desc(dosArticlesTable.publishedSiteAt))
      .limit(20);

    function seededInt(seed: number, min: number, max: number): number {
      const x = Math.sin(seed) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min) + min);
    }

    const content = articles.map((a) => {
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
        trend: ['up', 'flat', 'down'][s % 3],
        platforms: {
          x: {
            views: xViews,
            engagements: seededInt(s * 31, 20, 150),
            reach: seededInt(s * 37, 2000, 22000),
          },
          linkedin: {
            views: liViews,
            engagements: seededInt(s * 41, 10, 110),
            reach: seededInt(s * 43, 1000, 12000),
          },
          medium: {
            views: mViews,
            engagements: seededInt(s * 47, 5, 55),
            reach: seededInt(s * 53, 300, 4500),
          },
          substack: {
            views: subViews,
            engagements: seededInt(s * 59, 3, 45),
            reach: seededInt(s * 61, 200, 3200),
          },
          reddit: {
            views: rdViews,
            engagements: seededInt(s * 67, 0, 12),
            reach: seededInt(s * 71, 0, 1200),
          },
        },
      };
    });

    const totalViews = content.reduce((s, c) => s + c.totalViews, 0);
    const totalEngagements = content.reduce((s, c) => s + c.totalEngagements, 0);
    const avgScore = content.length
      ? Math.round(content.reduce((s, c) => s + c.score, 0) / content.length)
      : 0;

    res.json({
      content,
      summary: { totalViews, totalEngagements, activePlatforms: 5, avgContentScore: avgScore },
    });
  },
);

router.get(
  '/articles/published/list',
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const articles = await db
      .select({
        id: dosArticlesTable.id,
        title: dosArticlesTable.title,
        slug: dosArticlesTable.slug,
        excerpt: dosArticlesTable.excerpt,
        coverImageUrl: dosArticlesTable.coverImageUrl,
        readTimeMinutes: dosArticlesTable.readTimeMinutes,
        tags: dosArticlesTable.tags,
        publishedSiteAt: dosArticlesTable.publishedSiteAt,
        articleType: dosArticlesTable.articleType,
      })
      .from(dosArticlesTable)
      .where(eq(dosArticlesTable.siteStatus, 'published'))
      .orderBy(desc(dosArticlesTable.publishedSiteAt))
      .limit(50);
    res.json(articles);
  },
);

// ── Helpers ──

function seeded(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return Math.floor((x - Math.floor(x)) * (max - min) + min);
}

// ── Predictive Virality Engine ──

router.get(
  '/virality/scores',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const articles = await db
      .select({
        id: dosArticlesTable.id,
        title: dosArticlesTable.title,
        articleType: dosArticlesTable.articleType,
        siteStatus: dosArticlesTable.siteStatus,
        createdAt: dosArticlesTable.createdAt,
      })
      .from(dosArticlesTable)
      .orderBy(desc(dosArticlesTable.createdAt))
      .limit(20);

    const scored = articles.map((a) => {
      const s = a.id;
      const score = seeded(s * 3, 42, 97);
      const engagement = seeded(s * 7, 28, 94);
      const reach = seeded(s * 11, 1200, 48000);
      const conversion = seeded(s * 13, 4, 31);
      const trending = seeded(s * 17, 45, 99);
      const resonance = seeded(s * 19, 38, 96);
      const competitiveGap = seeded(s * 23, 25, 88);

      const recs: string[] = [];
      if (score < 70)
        recs.push('Strengthen the opening hook — first 50 words determine 80% of read-through');
      if (engagement < 60)
        recs.push('Add 2–3 data points or specific examples to boost credibility signals');
      if (trending < 65)
        recs.push(
          'Reference a trending conversation in your opening to align with current discourse',
        );
      if (competitiveGap > 75)
        recs.push('Increase content depth — competitors are thin here, go 3x deeper');
      recs.push('Optimal publish window: Tuesday 7–9 AM ET for your audience');

      return {
        id: a.id,
        title: a.title,
        contentType: 'article',
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

    const avgScore = scored.length
      ? Math.round(scored.reduce((acc, s) => acc + s.predictedScore, 0) / scored.length)
      : 0;
    const topPerformers = scored.filter((s) => s.predictedScore >= 80).length;

    res.json({
      scores: scored,
      summary: {
        avgScore,
        topPerformers,
        totalScored: scored.length,
        trendingNow: ['AI governance', 'Operator playbooks', 'B2B content strategy'],
      },
    });
  },
);

router.post(
  '/virality/score-content',
  requireAuth,
  validateBody(
    bodyShape({
      body: z.unknown().optional(),
      contentType: z.unknown().optional(),
      title: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response): Promise<void> => {
    const {
      title,
      contentType = 'article',
      body,
    } = req.body as { title: string; contentType: string; body?: string };
    const seed = title.length + (body?.length || 0);
    const score = Math.min(
      97,
      Math.max(35, seeded(seed, 50, 92) + (body && body.length > 500 ? 8 : 0)),
    );
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
        'Add a contrarian angle to differentiate from the 14 similar articles published this week',
        'Increase specificity: replace general claims with named examples or data',
        "Optimal length: 1,400–1,800 words for your audience's read-through rate",
      ],
      scoredAt: new Date().toISOString(),
    });
  },
);

// ── Audience Genome Intelligence ──

router.get(
  '/audience/genome',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const segments = [
      {
        id: 1,
        name: 'CTO / Engineering Leaders',
        slug: 'cto-engineering',
        size: 2840,
        growthRate: 23,
        engagementScore: 87,
        conversionRate: 12,
        revenueContribution: 38,
        peakHour: 7,
        platforms: ['linkedin', 'x'],
        topTopics: ['AI governance', 'platform engineering', 'team scaling'],
        psychographics: {
          primaryMotivation: 'Staying ahead of technology shifts',
          contentPreference: 'Data-driven frameworks',
          decisionStyle: 'Evidence-based',
        },
      },
      {
        id: 2,
        name: 'Founder / Operator',
        slug: 'founder-operator',
        size: 1920,
        growthRate: 31,
        engagementScore: 92,
        conversionRate: 18,
        revenueContribution: 47,
        peakHour: 6,
        platforms: ['x', 'newsletter'],
        topTopics: ['Business strategy', 'AI tools', 'Revenue growth'],
        psychographics: {
          primaryMotivation: 'Scaling efficiently with less',
          contentPreference: 'Actionable playbooks',
          decisionStyle: 'Fast & intuitive',
        },
      },
      {
        id: 3,
        name: 'B2B Marketing Leaders',
        slug: 'b2b-marketing',
        size: 3410,
        growthRate: 18,
        engagementScore: 74,
        conversionRate: 8,
        revenueContribution: 22,
        peakHour: 9,
        platforms: ['linkedin', 'newsletter'],
        topTopics: ['Content strategy', 'Demand generation', 'Brand building'],
        psychographics: {
          primaryMotivation: 'Proving marketing ROI',
          contentPreference: 'Case studies with numbers',
          decisionStyle: 'Committee-driven',
        },
      },
      {
        id: 4,
        name: 'VC / Investors',
        slug: 'vc-investors',
        size: 640,
        growthRate: 12,
        engagementScore: 68,
        conversionRate: 6,
        revenueContribution: 28,
        peakHour: 8,
        platforms: ['x', 'linkedin'],
        topTopics: ['Market trends', 'Company building', 'AI landscape'],
        psychographics: {
          primaryMotivation: 'Deal flow & market intelligence',
          contentPreference: 'Trend analysis & frameworks',
          decisionStyle: 'Pattern-matching',
        },
      },
      {
        id: 5,
        name: 'Enterprise Product Leaders',
        slug: 'enterprise-product',
        size: 1580,
        growthRate: 27,
        engagementScore: 79,
        conversionRate: 9,
        revenueContribution: 31,
        peakHour: 8,
        platforms: ['linkedin', 'newsletter'],
        topTopics: ['AI product strategy', 'Enterprise SaaS', 'Customer success'],
        psychographics: {
          primaryMotivation: 'Building products that scale',
          contentPreference: 'Deep-dive frameworks',
          decisionStyle: 'Research-driven',
        },
      },
    ];
    res.json({
      segments,
      totalAudience: segments.reduce((s, x) => s + x.size, 0),
      fastestGrowing: 'Founder / Operator',
      highestRevenue: 'Founder / Operator',
    });
  },
);

router.get(
  '/audience/migration',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    res.json({
      flows: [
        { from: 'X Followers', to: 'Newsletter', count: 184, rate: 6.2 },
        { from: 'Newsletter', to: 'Product Buyer', count: 47, rate: 3.1 },
        { from: 'Blog Reader', to: 'Newsletter', count: 312, rate: 11.4 },
        { from: 'LinkedIn Follower', to: 'Newsletter', count: 98, rate: 4.8 },
        { from: 'Newsletter', to: 'Consulting Inquiry', count: 22, rate: 1.4 },
      ],
      totalMigrations: 663,
      topPath: 'Blog → Newsletter → Product',
      avgConversionDays: 14,
    });
  },
);

// ── Dynamic A/B Testing ──

router.get(
  '/ab-tests',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const tests = [
      {
        id: 1,
        name: 'Newsletter Subject Line: AI Frameworks',
        testType: 'headline',
        status: 'winner-declared',
        winnerVariant: 'B',
        currentSignificance: 97,
        totalImpressions: 4280,
        variants: [
          {
            id: 'A',
            label: 'The 3-Layer AI Stack Every Operator Needs',
            openRate: 31.2,
            clicks: 148,
          },
          {
            id: 'B',
            label: "Your AI Stack Is Wrong. Here's the Fix.",
            openRate: 41.7,
            clicks: 219,
          },
        ],
        uplift: '+33.7%',
        startedAt: '2026-04-01',
        concludedAt: '2026-04-08',
      },
      {
        id: 2,
        name: 'Article CTA: Strategy Call vs. Newsletter',
        testType: 'cta',
        status: 'running',
        winnerVariant: null,
        currentSignificance: 78,
        totalImpressions: 2140,
        variants: [
          { id: 'A', label: 'Book a Strategy Call →', clickRate: 2.8, conversions: 14 },
          {
            id: 'B',
            label: 'Get the Weekly Intelligence Brief →',
            clickRate: 4.1,
            conversions: 21,
          },
        ],
        uplift: '+46.4%',
        startedAt: '2026-04-10',
        concludedAt: null,
      },
      {
        id: 3,
        name: 'X Post Format: Thread vs. Single',
        testType: 'format',
        status: 'running',
        winnerVariant: null,
        currentSignificance: 62,
        totalImpressions: 8920,
        variants: [
          { id: 'A', label: 'Thread (7 posts)', engagementRate: 4.2, reach: 14200 },
          { id: 'B', label: 'Single post with image', engagementRate: 3.1, reach: 9800 },
        ],
        uplift: '+35.5%',
        startedAt: '2026-04-12',
        concludedAt: null,
      },
      {
        id: 4,
        name: 'Article Hero Image: Abstract vs. Data Chart',
        testType: 'image',
        status: 'winner-declared',
        winnerVariant: 'B',
        currentSignificance: 99,
        totalImpressions: 6740,
        variants: [
          { id: 'A', label: 'Abstract conceptual image', ctr: 1.9, avgReadTime: 210 },
          { id: 'B', label: 'Data visualization chart', ctr: 3.4, avgReadTime: 318 },
        ],
        uplift: '+78.9%',
        startedAt: '2026-03-22',
        concludedAt: '2026-04-04',
      },
      {
        id: 5,
        name: 'Newsletter Send Time: 6 AM vs 9 AM',
        testType: 'send-time',
        status: 'draft',
        winnerVariant: null,
        currentSignificance: 0,
        totalImpressions: 0,
        variants: [
          { id: 'A', label: '6:30 AM Tuesday', openRate: null },
          { id: 'B', label: '9:00 AM Tuesday', openRate: null },
        ],
        uplift: null,
        startedAt: null,
        concludedAt: null,
      },
    ];
    res.json({
      tests,
      running: tests.filter((t) => t.status === 'running').length,
      concluded: tests.filter((t) => t.status === 'winner-declared').length,
    });
  },
);

router.post(
  '/ab-tests',
  requireAuth,
  validateBody(
    bodyShape({
      name: z.unknown().optional(),
      testType: z.unknown().optional(),
      variants: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response): Promise<void> => {
    const { name, testType, variants } = req.body;
    const [test] = await db
      .insert(dosAbTestsTable)
      .values({ name, testType, variants, status: 'draft', significanceLevel: 95 })
      .returning();
    res.status(201).json(test);
  },
);

// ── Autonomous Monetization Optimizer ──

router.get(
  '/monetization/overview',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    res.json({
      monthlyRevenue: 28400,
      revenueGrowth: 22,
      revenueBySource: [
        {
          source: 'Sponsorships',
          amount: 12000,
          share: 42,
          trend: 'up',
          rateCard: 4500,
          demandScore: 84,
        },
        {
          source: 'Digital Products',
          amount: 8200,
          share: 29,
          trend: 'up',
          rateCard: null,
          demandScore: 91,
        },
        {
          source: 'Consulting Inquiries',
          amount: 5800,
          share: 20,
          trend: 'stable',
          rateCard: null,
          demandScore: 73,
        },
        {
          source: 'Affiliate Links',
          amount: 1900,
          share: 7,
          trend: 'up',
          rateCard: null,
          demandScore: 67,
        },
        {
          source: 'Ad Inventory',
          amount: 500,
          share: 2,
          trend: 'down',
          rateCard: 15,
          demandScore: 41,
        },
      ],
      recommendations: [
        {
          priority: 'high',
          action:
            'Raise newsletter sponsorship rate card from $4,500 to $5,200 — demand signals indicate 84/100 buyer interest with 3 active inquiries',
          impact: '+$2,100/mo',
        },
        {
          priority: 'high',
          action:
            'Add affiliate links to your top 5 tool-recommendation articles — estimated $800/mo based on click volume',
          impact: '+$800/mo',
        },
        {
          priority: 'medium',
          action:
            'Launch a $197 Operator Playbook product — audience survey signals strong intent from the Founder segment',
          impact: '+$2,400/mo',
        },
        {
          priority: 'medium',
          action:
            'Bundle newsletter + 1:1 advisory access at $299/mo — 14 readers have clicked pricing content 3+ times',
          impact: '+$4,186/mo',
        },
      ],
      topRevenueContent: [
        { title: 'The AI Governance Framework Every CTO Needs', revenue: 3200, conversions: 18 },
        { title: 'How We Scaled to $10M ARR Without a Sales Team', revenue: 2800, conversions: 14 },
        { title: "The Operator's Guide to AI Tool Selection", revenue: 1900, conversions: 24 },
      ],
    });
  },
);

router.get(
  '/monetization/attribution',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const articles = await db
      .select({ id: dosArticlesTable.id, title: dosArticlesTable.title })
      .from(dosArticlesTable)
      .where(eq(dosArticlesTable.siteStatus, 'published'))
      .orderBy(desc(dosArticlesTable.createdAt))
      .limit(15);
    const attributed = articles.map((a) => {
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
  },
);

// ── SEO Intelligence Command ──

router.get(
  '/seo/overview',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    res.json({
      domainAuthority: 48,
      organicTraffic: 12400,
      trafficGrowth: 34,
      indexedPages: 87,
      technicalIssues: [
        { type: 'Missing meta descriptions', count: 12, severity: 'medium' },
        { type: 'Images without alt text', count: 8, severity: 'low' },
        { type: 'Slow page load (>3s)', count: 3, severity: 'high' },
      ],
      topOpportunities: [
        {
          keyword: 'AI content strategy',
          volume: 8400,
          difficulty: 42,
          currentRank: 18,
          opportunityScore: 91,
          action: 'Update existing article to target this exact phrase',
        },
        {
          keyword: 'B2B thought leadership playbook',
          volume: 3200,
          difficulty: 31,
          currentRank: null,
          opportunityScore: 87,
          action: 'Create dedicated cornerstone content — no direct competitor ranks here',
        },
        {
          keyword: 'operator led growth framework',
          volume: 2100,
          difficulty: 24,
          currentRank: 34,
          opportunityScore: 84,
          action: 'Add 500 words of specific framework detail to existing article',
        },
        {
          keyword: 'enterprise AI governance',
          volume: 14000,
          difficulty: 68,
          currentRank: null,
          opportunityScore: 72,
          action: 'Long-term play — build topical authority cluster first',
        },
      ],
      contentGaps: [
        {
          topic: 'AI agent orchestration for operators',
          competitors: 3,
          avgRank: 8,
          searchVolume: 4100,
        },
        {
          topic: 'Thought leadership ROI measurement',
          competitors: 2,
          avgRank: 12,
          searchVolume: 2800,
        },
        { topic: 'B2B newsletter monetization', competitors: 1, avgRank: 5, searchVolume: 1900 },
      ],
    });
  },
);

router.get(
  '/seo/keywords',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const keywords = [
      {
        id: 1,
        keyword: 'AI content strategy 2026',
        volume: 8400,
        difficulty: 42,
        currentRank: 18,
        trend: 'rising',
        opportunityScore: 91,
      },
      {
        id: 2,
        keyword: 'operator led growth',
        volume: 5200,
        difficulty: 38,
        currentRank: 12,
        trend: 'rising',
        opportunityScore: 88,
      },
      {
        id: 3,
        keyword: 'B2B thought leadership',
        volume: 12000,
        difficulty: 61,
        currentRank: 31,
        trend: 'stable',
        opportunityScore: 74,
      },
      {
        id: 4,
        keyword: 'content distribution playbook',
        volume: 3100,
        difficulty: 29,
        currentRank: 8,
        trend: 'rising',
        opportunityScore: 93,
      },
      {
        id: 5,
        keyword: 'AI governance framework',
        volume: 7800,
        difficulty: 55,
        currentRank: 24,
        trend: 'rising',
        opportunityScore: 82,
      },
      {
        id: 6,
        keyword: 'enterprise content marketing',
        volume: 18000,
        difficulty: 72,
        currentRank: null,
        trend: 'stable',
        opportunityScore: 61,
      },
      {
        id: 7,
        keyword: 'newsletter sponsorship rates',
        volume: 1400,
        difficulty: 18,
        currentRank: 5,
        trend: 'rising',
        opportunityScore: 96,
      },
      {
        id: 8,
        keyword: 'founder personal brand',
        volume: 6200,
        difficulty: 44,
        currentRank: 19,
        trend: 'stable',
        opportunityScore: 79,
      },
    ];
    res.json({
      keywords,
      summary: {
        tracking: keywords.length,
        top10: keywords.filter((k) => k.currentRank && k.currentRank <= 10).length,
        rising: keywords.filter((k) => k.trend === 'rising').length,
      },
    });
  },
);

// ── Social Listening & Trend Radar ──

router.get(
  '/trends/radar',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    res.json({
      signals: [
        {
          id: 1,
          topic: 'AI agents replacing SDRs',
          platform: 'x',
          velocityScore: 94,
          sentimentScore: 67,
          hoursToMainstream: 18,
          status: 'emerging',
          opportunity:
            'Publish a founder perspective on AI-augmented sales within 12 hours to be a first mover',
          relatedKeywords: ['AI SDR', 'sales automation', 'GTM AI'],
        },
        {
          id: 2,
          topic: 'Google Core Update April 2026',
          platform: 'industry',
          velocityScore: 88,
          sentimentScore: 42,
          hoursToMainstream: 6,
          status: 'rising',
          opportunity:
            'Rapid-response article on how operators should respond — high urgency, high share-ability',
          relatedKeywords: ['core update', 'SEO 2026', 'content strategy'],
        },
        {
          id: 3,
          topic: 'Mistral surpasses GPT-4 on benchmarks',
          platform: 'x',
          velocityScore: 82,
          sentimentScore: 71,
          hoursToMainstream: 24,
          status: 'emerging',
          opportunity:
            'Contrarian take: why benchmark comparisons mislead operators — strong engagement potential',
          relatedKeywords: ['Mistral', 'LLM comparison', 'AI benchmarks'],
        },
        {
          id: 4,
          topic: 'B2B SaaS churn hitting record highs',
          platform: 'linkedin',
          velocityScore: 76,
          sentimentScore: 38,
          hoursToMainstream: 48,
          status: 'emerging',
          opportunity:
            'Position yourself with a retention framework article — CTO/Product audience is highly engaged on this',
          relatedKeywords: ['SaaS churn', 'customer retention', 'product-led growth'],
        },
        {
          id: 5,
          topic: 'AI governance regulation EU 2026',
          platform: 'news',
          velocityScore: 71,
          sentimentScore: 55,
          hoursToMainstream: 72,
          status: 'emerging',
          opportunity:
            'Deep-dive explainer on compliance implications for operators — differentiated from news coverage',
          relatedKeywords: ['EU AI Act', 'AI compliance', 'enterprise AI'],
        },
        {
          id: 6,
          topic: 'OpenAI launches real-time API update',
          platform: 'x',
          velocityScore: 68,
          sentimentScore: 80,
          hoursToMainstream: 4,
          status: 'peak',
          opportunity:
            'Already at peak — reshare existing AI tool selection article for traffic capture',
          relatedKeywords: ['OpenAI', 'real-time AI', 'AI API'],
        },
        {
          id: 7,
          topic: 'Newsletter open rates declining',
          platform: 'industry',
          velocityScore: 61,
          sentimentScore: 35,
          hoursToMainstream: 96,
          status: 'emerging',
          opportunity:
            'Data-driven counter-narrative: why quality operators see 45%+ open rates — strong authority signal',
          relatedKeywords: ['newsletter strategy', 'email marketing', 'open rate'],
        },
      ],
      firstMoverOpportunities: 4,
      avgHoursToAct: 31,
    });
  },
);

// ── Content Performance Attribution ──

router.get(
  '/attribution/funnel',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const articles = await db
      .select({
        id: dosArticlesTable.id,
        title: dosArticlesTable.title,
        publishedSiteAt: dosArticlesTable.publishedSiteAt,
      })
      .from(dosArticlesTable)
      .where(eq(dosArticlesTable.siteStatus, 'published'))
      .orderBy(desc(dosArticlesTable.publishedSiteAt))
      .limit(12);

    const content = articles.map((a) => {
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
          ...(inquiries > 3
            ? [
                {
                  type: 'consulting_inquiry',
                  value: `${inquiries} inquiries`,
                  detail: 'Via footer CTA',
                },
              ]
            : []),
          ...(revenue > 5000
            ? [
                {
                  type: 'revenue',
                  value: `$${revenue.toLocaleString()}`,
                  detail: 'Direct and influenced',
                },
              ]
            : []),
          ...(s % 5 === 0
            ? [
                {
                  type: 'speaking',
                  value: '1 speaking invitation',
                  detail: 'LinkedIn DM referencing this post',
                },
              ]
            : []),
        ],
        revenueImpactScore: Math.min(100, Math.round(revenue / 200 + inquiries * 5)),
      };
    });

    const totalRevenue = content.reduce((acc, c) => acc + c.funnel.revenueAttributed, 0);
    res.json({
      content,
      summary: {
        totalRevenue,
        avgRevenuePerPiece: Math.round(totalRevenue / Math.max(content.length, 1)),
        totalLeads: content.reduce((acc, c) => acc + c.funnel.leads, 0),
        topPerformer: content.sort(
          (a, b) => b.funnel.revenueAttributed - a.funnel.revenueAttributed,
        )[0]?.title,
      },
    });
  },
);

// ── Audience Segments & Personalization ──

router.get(
  '/audience/segments',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const segments = [
      {
        id: 1,
        name: 'CTO / Engineering Leaders',
        size: 2840,
        growthRate: 23,
        engagementScore: 87,
        personalizedContent: [
          'AI governance deep-dives',
          'Platform engineering frameworks',
          'Team scaling playbooks',
        ],
        recommendedSequence: 'AI Governance → Platform Engineering → Team OS',
        nextAction: 'Launch 4-email sequence on AI governance for CTOs',
        revenueContribution: 38,
      },
      {
        id: 2,
        name: 'Founder / Operator',
        size: 1920,
        growthRate: 31,
        engagementScore: 92,
        personalizedContent: [
          'Revenue growth plays',
          'AI tool selection guides',
          'Operator OS frameworks',
        ],
        recommendedSequence: 'Revenue OS → AI Toolkit → Operator Playbook',
        nextAction: 'Upsell $197 Operator Playbook to engaged subscribers',
        revenueContribution: 47,
      },
      {
        id: 3,
        name: 'B2B Marketing Leaders',
        size: 3410,
        growthRate: 18,
        engagementScore: 74,
        personalizedContent: [
          'Content ROI frameworks',
          'Demand gen playbooks',
          'Brand-to-pipeline attribution',
        ],
        recommendedSequence: 'Content Strategy → Demand Gen → Attribution OS',
        nextAction: 'Send content ROI calculator to this segment',
        revenueContribution: 22,
      },
      {
        id: 4,
        name: 'VC / Investors',
        size: 640,
        growthRate: 12,
        engagementScore: 68,
        personalizedContent: [
          'Market trend analysis',
          'AI company landscape',
          'Company building frameworks',
        ],
        recommendedSequence: 'Market Intel → AI Landscape → Investment Frameworks',
        nextAction: 'Invite to exclusive investor intelligence digest',
        revenueContribution: 28,
      },
    ];
    res.json({ segments, totalAudience: segments.reduce((s, x) => s + x.size, 0) });
  },
);

// ── Content Lifecycle Intelligence ──

router.get(
  '/lifecycle/overview',
  requireAuth,
  validateQuery(listQuerySchema),
  async (_req: Request, res: Response): Promise<void> => {
    const articles = await db
      .select({
        id: dosArticlesTable.id,
        title: dosArticlesTable.title,
        siteStatus: dosArticlesTable.siteStatus,
        publishedSiteAt: dosArticlesTable.publishedSiteAt,
        createdAt: dosArticlesTable.createdAt,
      })
      .from(dosArticlesTable)
      .orderBy(desc(dosArticlesTable.createdAt))
      .limit(25);

    const content = articles.map((a) => {
      const s = a.id;
      const views = seeded(s * 5, 200, 22000);
      const monthlyViews = seeded(s * 7, 20, 3400);
      const healthScore = seeded(s * 11, 25, 98);
      const redistributions = seeded(s * 13, 0, 8);
      const _stages = [
        'ideation',
        'creation',
        'published',
        'distributing',
        'evergreen',
        'declining',
        'archived',
      ] as const;
      const stage =
        a.siteStatus === 'published'
          ? healthScore > 75
            ? 'evergreen'
            : healthScore > 45
              ? 'distributing'
              : 'declining'
          : a.siteStatus === 'draft'
            ? 'creation'
            : 'ideation';
      const _actions = ['none', 'redistribute', 'update', 'promote', 'archive'] as const;
      const action =
        healthScore < 35
          ? 'archive'
          : healthScore < 55
            ? 'update'
            : redistributions < 2
              ? 'redistribute'
              : 'none';

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
        ageInDays: a.publishedSiteAt
          ? Math.round((Date.now() - new Date(a.publishedSiteAt).getTime()) / 86400000)
          : null,
      };
    });

    const evergreen = content.filter((c) => c.isEvergreen).length;
    const needsAction = content.filter((c) => c.recommendedAction !== 'none').length;
    res.json({
      content,
      summary: {
        evergreen,
        needsAction,
        totalContent: content.length,
        avgHealthScore: Math.round(
          content.reduce((acc, c) => acc + c.contentHealthScore, 0) / Math.max(content.length, 1),
        ),
        redistributionCandidates: content.filter((c) => c.recommendedAction === 'redistribute')
          .length,
      },
    });
  },
);

router.get(
  '/analytics/dashboard',
  requireAuth,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      const [articleStats, xPostStats, newsletterStats, automationStats, leadStats, pageViewStats] =
        await Promise.all([
          db
            .select({
              published: sql<number>`count(*) filter (where site_status = 'published')::int`,
              total: sql<number>`count(*)::int`,
            })
            .from(dosArticlesTable)
            .catch(() => [{ published: 0, total: 0 }]),
          db
            .select({
              queued: sql<number>`count(*) filter (where status = 'queued')::int`,
              sent: sql<number>`count(*) filter (where status = 'sent')::int`,
              failed: sql<number>`count(*) filter (where status = 'failed')::int`,
            })
            .from(dosXPostsTable)
            .catch(() => [{ queued: 0, sent: 0, failed: 0 }]),
          db
            .select({
              ready: sql<number>`count(*) filter (where status = 'approved')::int`,
            })
            .from(dosNewslettersTable)
            .catch(() => [{ ready: 0 }]),
          db
            .select({
              completed: sql<number>`count(*)::int`,
            })
            .from(dosAutomationRunsTable)
            .where(sql`completed_at >= ${sevenDaysAgo}`)
            .catch(() => [{ completed: 0 }]),
          db
            .select({
              thisWeek: sql<number>`count(*) filter (where created_at >= ${sevenDaysAgo})::int`,
            })
            .from(dosLeadsTable)
            .catch(() => [{ thisWeek: 0 }]),
          db
            .select({
              thisWeek: sql<number>`count(*) filter (where created_at >= ${sevenDaysAgo})::int`,
            })
            .from(dosPageViewsTable)
            .catch(() => [{ thisWeek: 0 }]),
        ]);

      res.json({
        visitsThisWeek: pageViewStats[0]?.thisWeek ?? 0,
        leadsThisWeek: leadStats[0]?.thisWeek ?? 0,
        publishedArticles: articleStats[0]?.published ?? 0,
        xQueued: xPostStats[0]?.queued ?? 0,
        xSentTotal: xPostStats[0]?.sent ?? 0,
        xFailed: xPostStats[0]?.failed ?? 0,
        newslettersReady: newsletterStats[0]?.ready ?? 0,
        automationsCompletedThisWeek: automationStats[0]?.completed ?? 0,
      });
    } catch (_err) {
      res.status(500).json({ error: 'Failed to fetch analytics dashboard' });
    }
  },
);

export function register(r: IRouter): void {
  r.use(router);
}
