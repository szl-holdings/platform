import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

const lyteLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Lyte Live rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
});

const lyteCache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const c = lyteCache.get(key);
  if (c && c.expiry > Date.now()) return Promise.resolve(c.data as T);
  return fetcher().then(data => {
    lyteCache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = lyteCache.get(key);
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
      headers: { "User-Agent": "SZL-Lyte/1.0", Accept: "text/xml,application/rss+xml,*/*" },
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
      headers: { "User-Agent": "SZL-Lyte/1.0", Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

function parseRssToNews(xml: string, source: string, maxItems = 8): any[] {
  const items: any[] = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const item = match[1] ?? "";
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? item.match(/<title>(.*?)<\/title>/)?.[1] ?? "No title";
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "#";
    const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString();
    const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]?.replace(/<[^>]+>/g, "").slice(0, 200) ?? "";
    items.push({
      id: `${source}-${items.length}`,
      title: title.trim(),
      url: link.trim(),
      publishedAt: new Date(date).toISOString(),
      summary: description.trim(),
      source,
    });
    if (items.length >= maxItems) break;
  }
  return items;
}

router.get("/lyte/live/tech-news", lyteLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const news = await getCached("lyte-tech-news", 600000, async () => {
      const [tcXml, vrXml] = await Promise.allSettled([
        fetchText("https://techcrunch.com/feed/", 10000),
        fetchText("https://www.theverge.com/rss/index.xml", 10000),
      ]);
      const tcItems = tcXml.status === "fulfilled" ? parseRssToNews(tcXml.value, "TechCrunch", 5) : [];
      const vrItems = vrXml.status === "fulfilled" ? parseRssToNews(vrXml.value, "The Verge", 5) : [];
      const combined = [...tcItems, ...vrItems].sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
      return { items: combined, liveCount: tcItems.length + vrItems.length };
    });
    sendSuccess(res, {
      source: "TechCrunch + The Verge Live RSS Feeds",
      count: news.items.length,
      liveItemsCount: news.liveCount,
      news: news.items,
      liveData: news.liveCount > 0,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch tech news"); }
});

router.get("/lyte/live/bls-employment", lyteLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("lyte-bls", 86400000, async () => {
      try {
        const raw = await fetchJson(
          "https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000",
          8000,
        ) as any;
        if (raw?.status !== "REQUEST_SUCCEEDED") throw new Error("BLS API error");
        const series = raw?.Results?.series?.[0]?.data;
        if (!Array.isArray(series) || series.length === 0) throw new Error("No BLS data");
        const latest = series[0];
        const prev = series[1];
        return {
          unemploymentRate: parseFloat(latest.value),
          period: `${latest.periodName} ${latest.year}`,
          previousPeriod: `${prev?.periodName} ${prev?.year}`,
          previousRate: parseFloat(prev?.value ?? latest.value),
          trend: parseFloat(latest.value) < parseFloat(prev?.value ?? "9999") ? "improving" : "worsening",
          historicalData: series.slice(0, 12).map((d: any) => ({
            period: `${d.periodName} ${d.year}`,
            rate: parseFloat(d.value),
          })),
          source: "live",
        };
      } catch {
        return {
          unemploymentRate: 3.7,
          period: "February 2026",
          previousPeriod: "January 2026",
          previousRate: 4.0,
          trend: "improving",
          historicalData: [
            { period: "Feb 2026", rate: 3.7 },
            { period: "Jan 2026", rate: 4.0 },
            { period: "Dec 2025", rate: 4.2 },
            { period: "Nov 2025", rate: 4.1 },
          ],
          source: "demo",
        };
      }
    });
    sendSuccess(res, {
      source: "Bureau of Labor Statistics — Unemployment Rate (LNS14000000)",
      url: "https://www.bls.gov/cps/",
      data,
      liveData: data.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch BLS employment data"); }
});

router.get("/lyte/live/github-trending", lyteLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const language = (req.query.language as string) || "TypeScript";
    const data = await getCached(`lyte-github-${language}`, 3600000, async () => {
      try {
        const raw = await fetchJson(
          `https://api.github.com/search/repositories?q=language:${encodeURIComponent(language)}+created:>2026-01-01&sort=stars&order=desc&per_page=8`,
          8000,
        ) as any;
        if (!Array.isArray(raw?.items)) throw new Error("No GitHub data");
        return raw.items.map((r: any) => ({
          name: r.full_name,
          description: r.description?.slice(0, 150) ?? "",
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language,
          topics: r.topics?.slice(0, 4) ?? [],
          url: r.html_url,
          createdAt: r.created_at,
          pushedAt: r.pushed_at,
          source: "live",
        }));
      } catch {
        return [
          { name: "vercel/ai", description: "Build AI-powered applications with React, Svelte, Vue, and Solid", stars: 8924, forks: 1123, language: "TypeScript", topics: ["ai", "llm", "streaming"], url: "https://github.com/vercel/ai", source: "demo" },
          { name: "openai/openai-node", description: "The official Node.js / Typescript library for the OpenAI API", stars: 7234, forks: 891, language: "TypeScript", topics: ["openai", "api", "sdk"], url: "https://github.com/openai/openai-node", source: "demo" },
        ];
      }
    });
    sendSuccess(res, {
      source: "GitHub Public API — Trending Repositories",
      url: "https://github.com/explore",
      language,
      count: data.length,
      repositories: data,
      liveData: data.length > 0 && data[0]?.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch GitHub trending data"); }
});

export default router;
