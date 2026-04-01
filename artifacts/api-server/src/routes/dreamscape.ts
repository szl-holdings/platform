// Creative Workflows routes (file: dreamscape.ts — legacy filename, module now known as creative-workflows)
import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import {
  db,
  dreamscapeCampaignsTable,
  dreamscapeScriptsTable,
  dreamscapeStoryboardsTable,
  dreamscapeVoiceAssetsTable,
  dreamscapeCampaignAssetsTable,
  dreamscapeReviewsTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dreamscape/campaigns", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(dreamscapeCampaignsTable).orderBy(desc(dreamscapeCampaignsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(dreamscapeCampaignsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list campaigns");
  }
});

router.post("/dreamscape/campaigns", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeCampaignsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create campaign");
  }
});

router.get("/dreamscape/campaigns/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(dreamscapeCampaignsTable).where(eq(dreamscapeCampaignsTable.id, id));
    if (!row) { sendNotFound(res, "Campaign"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get campaign");
  }
});

router.patch("/dreamscape/campaigns/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(dreamscapeCampaignsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dreamscapeCampaignsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Campaign"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update campaign");
  }
});

router.delete("/dreamscape/campaigns/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(dreamscapeCampaignsTable).where(eq(dreamscapeCampaignsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Campaign"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete campaign");
  }
});

router.get("/dreamscape/campaigns/:id/scripts", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(dreamscapeScriptsTable).where(eq(dreamscapeScriptsTable.campaignId, id)).orderBy(desc(dreamscapeScriptsTable.updatedAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list scripts");
  }
});

router.post("/dreamscape/scripts", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeScriptsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create script");
  }
});

router.get("/dreamscape/scripts/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(dreamscapeScriptsTable).where(eq(dreamscapeScriptsTable.id, id));
    if (!row) { sendNotFound(res, "Script"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get script");
  }
});

router.patch("/dreamscape/scripts/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(dreamscapeScriptsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dreamscapeScriptsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Script"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update script");
  }
});

router.delete("/dreamscape/scripts/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(dreamscapeScriptsTable).where(eq(dreamscapeScriptsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Script"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete script");
  }
});

router.get("/dreamscape/campaigns/:id/storyboards", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(dreamscapeStoryboardsTable).where(eq(dreamscapeStoryboardsTable.campaignId, id)).orderBy(dreamscapeStoryboardsTable.sceneNumber);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list storyboards");
  }
});

router.post("/dreamscape/storyboards", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeStoryboardsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create storyboard");
  }
});

router.patch("/dreamscape/storyboards/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(dreamscapeStoryboardsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dreamscapeStoryboardsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Storyboard"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update storyboard");
  }
});

router.delete("/dreamscape/storyboards/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(dreamscapeStoryboardsTable).where(eq(dreamscapeStoryboardsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Storyboard"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete storyboard");
  }
});

router.get("/dreamscape/campaigns/:id/voice-assets", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(dreamscapeVoiceAssetsTable).where(eq(dreamscapeVoiceAssetsTable.campaignId, id)).orderBy(desc(dreamscapeVoiceAssetsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list voice assets");
  }
});

router.post("/dreamscape/voice-assets", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeVoiceAssetsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create voice asset");
  }
});

router.patch("/dreamscape/voice-assets/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(dreamscapeVoiceAssetsTable).set(req.body).where(eq(dreamscapeVoiceAssetsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Voice asset"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update voice asset");
  }
});

router.delete("/dreamscape/voice-assets/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(dreamscapeVoiceAssetsTable).where(eq(dreamscapeVoiceAssetsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Voice asset"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete voice asset");
  }
});

router.get("/dreamscape/campaigns/:id/assets", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(dreamscapeCampaignAssetsTable).where(eq(dreamscapeCampaignAssetsTable.campaignId, id)).orderBy(desc(dreamscapeCampaignAssetsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list campaign assets");
  }
});

router.post("/dreamscape/campaign-assets", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeCampaignAssetsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create campaign asset");
  }
});

router.delete("/dreamscape/campaign-assets/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(dreamscapeCampaignAssetsTable).where(eq(dreamscapeCampaignAssetsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Campaign asset"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete campaign asset");
  }
});

router.get("/dreamscape/campaigns/:id/reviews", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(dreamscapeReviewsTable).where(eq(dreamscapeReviewsTable.campaignId, id)).orderBy(desc(dreamscapeReviewsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list reviews");
  }
});

router.post("/dreamscape/reviews", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeReviewsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create review");
  }
});

router.patch("/dreamscape/reviews/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(dreamscapeReviewsTable).set(req.body).where(eq(dreamscapeReviewsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Review"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update review");
  }
});

router.delete("/dreamscape/reviews/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(dreamscapeReviewsTable).where(eq(dreamscapeReviewsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Review"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete review");
  }
});

const dreamLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Dreamscape rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const DREAM_CACHE_MAX_SIZE = 100;
const dreamCache = new Map<string, { data: unknown; expiry: number }>();
function dreamCacheSet(key: string, value: { data: unknown; expiry: number }) {
  dreamCache.delete(key);
  dreamCache.set(key, value);
  if (dreamCache.size > DREAM_CACHE_MAX_SIZE) {
    const lruKey = dreamCache.keys().next().value;
    if (lruKey) dreamCache.delete(lruKey);
  }
}
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const c = dreamCache.get(key);
  if (c && c.expiry > Date.now()) {
    dreamCache.delete(key);
    dreamCache.set(key, c);
    return Promise.resolve(c.data as T);
  }
  return fetcher().then(data => {
    dreamCacheSet(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = dreamCache.get(key);
    if (stale) return stale.data as T;
    throw new Error("Data unavailable");
  });
}

async function fetchText(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Dreamscape/1.0", Accept: "text/xml,application/rss+xml,*/*" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Dreamscape/1.0", Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

const DEMO_CREATIVE_TRENDS = [
  { trend: "AI-Generated Short Films", platform: "YouTube + Instagram", growth: "+340%", audienceReach: "2.4B", sentiment: 0.71, contentType: "video", tools: ["RunwayML", "Pika Labs", "Kling AI"] },
  { trend: "Immersive Brand Storytelling", platform: "Meta + TikTok", growth: "+128%", audienceReach: "1.8B", sentiment: 0.68, contentType: "interactive", tools: ["Unreal Engine", "Unity", "SparkAR"] },
  { trend: "AI-Narrated Podcast Campaigns", platform: "Spotify + Apple", growth: "+92%", audienceReach: "680M", sentiment: 0.64, contentType: "audio", tools: ["ElevenLabs", "Murf AI", "LOVO"] },
  { trend: "Dynamic Hyper-Personalization", platform: "Email + Programmatic", growth: "+215%", audienceReach: "4.2B", sentiment: 0.77, contentType: "multi-channel", tools: ["Jasper", "Copy.ai", "Persado"] },
  { trend: "Creator Economy Partnerships", platform: "TikTok + YouTube", growth: "+167%", audienceReach: "3.1B", sentiment: 0.73, contentType: "influencer", tools: ["Grin", "AspireIQ", "Upfluence"] },
];

const DEMO_MEDIA_SIGNALS = [
  { platform: "YouTube", metric: "avgViewDuration", value: 4.2, unit: "minutes", benchmark: 3.8, trend: "+10.5%", insight: "Long-form content outperforming 2025 baseline" },
  { platform: "Instagram", metric: "reelEngagementRate", value: 8.4, unit: "%", benchmark: 6.2, trend: "+35.5%", insight: "Reel carousels driving 2x engagement vs single images" },
  { platform: "LinkedIn", metric: "thoughtLeadershipCTR", value: 3.1, unit: "%", benchmark: 2.4, trend: "+29.2%", insight: "Founder-authored content outperforming brand pages" },
  { platform: "TikTok", metric: "completionRate", value: 42.3, unit: "%", benchmark: 38.1, trend: "+11.0%", insight: "Hook optimization in first 2 seconds critical for completion" },
];

router.get("/dreamscape/live/creative-trends", dreamLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const news = await getCached("dreamscape-creative-trends", 3600000, async () => {
      try {
        const xml = await fetchText("https://feeds.feedburner.com/Marketingland", 8000);
        if (!xml.includes("<item>")) throw new Error("No items in feed");
        const items: any[] = [];
        for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
          const item = match[1] ?? "";
          const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? item.match(/<title>(.*?)<\/title>/)?.[1];
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "#";
          const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
          if (!title) continue;
          const isAI = /ai|artificial intelligence|machine learning|automation/i.test(title);
          items.push({ id: `MCL-${items.length}`, title: title.trim(), url: link.trim(), publishedAt: new Date(date).toISOString(), category: isAI ? "ai-content" : "creative", source: "Marketing Land RSS", liveSource: true });
          if (items.length >= 6) break;
        }
        return { liveItems: items, liveCount: items.length };
      } catch {
        return { liveItems: [], liveCount: 0 };
      }
    });

    sendSuccess(res, {
      source: "Content Marketing Industry Intelligence",
      creativeTrends: DEMO_CREATIVE_TRENDS,
      liveNews: news.liveItems,
      liveNewsCount: news.liveCount,
      totalTrends: DEMO_CREATIVE_TRENDS.length,
      aiContentAdoptionPct: 73,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch creative trends"); }
});

router.get("/dreamscape/live/media-signals", dreamLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "Cross-Platform Media Analytics Intelligence",
      count: DEMO_MEDIA_SIGNALS.length,
      signals: DEMO_MEDIA_SIGNALS,
      overallEngagementIndex: 74.2,
      benchmarkPeriod: "Q4 2025",
      insightSummary: "AI-assisted content production shows +47% engagement uplift across measured platforms.",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch media signals"); }
});

router.get("/dreamscape/live/ai-creative-tools", dreamLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const tools = await getCached("dreamscape-hf-video", 3600000, async () => {
      try {
        const raw = await fetchJson(
          "https://huggingface.co/api/models?pipeline_tag=text-to-video&sort=likes&limit=8&direction=-1",
          8000,
        ) as any;
        if (!Array.isArray(raw) || raw.length === 0) throw new Error("No HF models");
        return raw.map((m: any) => ({
          id: m.id,
          author: m.id?.split("/")?.[0] ?? "unknown",
          task: m.pipeline_tag ?? "text-to-video",
          likes: m.likes ?? 0,
          downloads: m.downloads ?? 0,
          tags: (m.tags ?? []).slice(0, 4),
          lastModified: m.lastModified ?? "",
          openSource: true,
          source: "live",
        }));
      } catch {
        return [
          { id: "stabilityai/stable-video-diffusion-img2vid", author: "stabilityai", task: "image-to-video", likes: 2341, downloads: 890000, tags: ["diffusion", "video", "image2video"], openSource: true, source: "demo" },
          { id: "damo-vilab/text-to-video-ms-1.7b", author: "damo-vilab", task: "text-to-video", likes: 1876, downloads: 423000, tags: ["video", "diffusion", "text2video"], openSource: true, source: "demo" },
          { id: "THUDM/CogVideoX-5b", author: "THUDM", task: "text-to-video", likes: 1234, downloads: 287000, tags: ["video", "cogvideo", "generation"], openSource: true, source: "demo" },
        ];
      }
    });
    sendSuccess(res, {
      source: "HuggingFace Hub — AI Creative Tools Discovery",
      category: "Video Generation & Creative AI",
      count: tools.length,
      tools,
      liveData: tools.length > 0 && tools[0]?.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch AI creative tools"); }
});

export default router;
