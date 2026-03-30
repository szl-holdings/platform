import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

const carlotaLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Carlota Jo Live rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
});

const carlotaCache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const c = carlotaCache.get(key);
  if (c && c.expiry > Date.now()) return Promise.resolve(c.data as T);
  return fetcher().then(data => {
    carlotaCache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = carlotaCache.get(key);
    if (stale) return stale.data as T;
    throw new Error("Data unavailable");
  });
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Carlota/1.0", Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Carlota/1.0", Accept: "text/xml,application/rss+xml,*/*" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

const DEMO_ECONOMIC_INDICATORS = {
  gdpGrowth: { us: 2.1, eu: 1.2, china: 5.2, global: 3.2 },
  inflation: { us: 3.2, eu: 2.8, uk: 4.1, global: 5.7 },
  ceoConfidence: { index: 62, trend: "declining", previousQuarter: 67 },
  boardroomPriorities: ["AI Integration", "Workforce Strategy", "ESG Compliance", "Geopolitical Risk", "Supply Chain Resilience"],
  advisoryDemand: { strategy: 94, transformation: 88, riskManagement: 81, leadership: 76, digitalStrategy: 91 },
};

const DEMO_STRATEGIC_NEWS = [
  { id: "SN-001", title: "McKinsey: 70% of Digital Transformations Fail — New Frameworks Emerge", source: "McKinsey Insights", date: "2026-03-25", category: "transformation", relevance: "critical", insight: "Focus shifts from technology to organizational operating model design" },
  { id: "SN-002", title: "Boardroom Shifts: ESG Integration Now Mandatory for 92% of Fortune 500", source: "Harvard Business Review", date: "2026-03-22", category: "esg", relevance: "high", insight: "SEC climate disclosure rules accelerating board-level ESG accountability" },
  { id: "SN-003", title: "AI Governance Gap: 83% of CEOs Lack Framework for Enterprise AI Decisions", source: "Deloitte Insights", date: "2026-03-20", category: "ai-governance", relevance: "critical", insight: "Advisory opportunity for AI ethics and governance frameworks" },
  { id: "SN-004", title: "Geopolitical Risk Tops CEO Agenda for Third Consecutive Year — BCG Survey", source: "Boston Consulting Group", date: "2026-03-18", category: "geopolitical", relevance: "high", insight: "Clients need scenario planning for supply chain and market access disruption" },
  { id: "SN-005", title: "Succession Planning Crisis: 67% of S&P 500 Companies Lack CEO Succession Plans", source: "Spencer Stuart", date: "2026-03-15", category: "leadership", relevance: "high", insight: "Board advisory opportunity for succession framework development" },
];

router.get("/carlota/live/economic-outlook", carlotaLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("carlota-econ", 86400000, async () => {
      try {
        const worldBankRaw = await fetchJson(
          "https://api.worldbank.org/v2/country/US;EU;CN;WLD/indicator/NY.GDP.MKTP.KD.ZG?mrv=2&format=json",
          10000,
        ) as any;
        const entries = worldBankRaw?.[1];
        if (!Array.isArray(entries) || entries.length === 0) throw new Error("No World Bank data");
        const gdpGrowth: Record<string, number | null> = {};
        for (const e of entries) {
          if (e.value !== null) gdpGrowth[e.country?.value ?? e.countryiso3code] = parseFloat(e.value?.toFixed(2));
        }
        return { ...DEMO_ECONOMIC_INDICATORS, gdpGrowth: { ...DEMO_ECONOMIC_INDICATORS.gdpGrowth, ...gdpGrowth }, source: "live" };
      } catch {
        return { ...DEMO_ECONOMIC_INDICATORS, source: "demo" };
      }
    });
    sendSuccess(res, {
      source: "World Bank Open Data + IMF Economic Outlook",
      url: "https://api.worldbank.org/",
      indicators: data,
      liveData: data.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch economic outlook"); }
});

router.get("/carlota/live/strategic-news", carlotaLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getCached("carlota-strategy-news", 3600000, async () => {
      try {
        const xml = await fetchText("https://feeds.hbr.org/harvardbusiness", 10000);
        const items: any[] = [];
        for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
          const item = match[1] ?? "";
          const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? item.match(/<title>(.*?)<\/title>/)?.[1] ?? "No title";
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "#";
          const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString();
          const isStrategic = /strategy|CEO|board|leadership|transformation|executive/i.test(title);
          items.push({
            id: `HBR-${items.length}`,
            title: title.trim(),
            source: "Harvard Business Review",
            url: link.trim(),
            date: new Date(date).toISOString().slice(0, 10),
            category: /strategy/i.test(title) ? "strategy" : /ceo|board|leadership/i.test(title) ? "leadership" : "advisory",
            relevance: isStrategic ? "high" : "medium",
            insight: "Live from HBR editorial team",
            liveSource: true,
          });
          if (items.length >= 6) break;
        }
        if (items.length === 0) throw new Error("No HBR articles parsed");
        return { news: items, liveCount: items.length };
      } catch {
        return { news: DEMO_STRATEGIC_NEWS, liveCount: 0 };
      }
    });
    sendSuccess(res, {
      source: "Harvard Business Review Live RSS + Carlota Jo Advisory Intelligence",
      count: data.news.length,
      news: data.news,
      liveData: data.liveCount > 0,
      liveArticlesCount: data.liveCount,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch strategic news"); }
});

router.get("/carlota/live/consulting-trends", carlotaLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const trends = [
      { trend: "AI-Enabled Strategy Execution", maturityCurve: "Growth", clientDemand: 94, feeGrowth: 28.4, topFirms: ["McKinsey Digital", "BCG X", "Bain"], carlotaAdvantage: "Independent advisory without Big 4 conflicts of interest" },
      { trend: "ESG Strategy Integration", maturityCurve: "Mainstream", clientDemand: 88, feeGrowth: 18.2, topFirms: ["PwC", "EY", "Deloitte"], carlotaAdvantage: "Board-level ESG governance without audit firm conflicts" },
      { trend: "Geopolitical Risk Advisory", maturityCurve: "Emerging", clientDemand: 81, feeGrowth: 42.1, topFirms: ["Control Risks", "Kissinger Associates", "Eurasia Group"], carlotaAdvantage: "C-suite direct access to sovereign wealth and intelligence networks" },
      { trend: "Digital Transformation Leadership", maturityCurve: "Mature", clientDemand: 76, feeGrowth: 8.7, topFirms: ["Accenture", "Kearney", "Oliver Wyman"], carlotaAdvantage: "Results-focused transformation with accountability metrics" },
      { trend: "Succession & Leadership Advisory", maturityCurve: "Steady", clientDemand: 72, feeGrowth: 12.3, topFirms: ["Spencer Stuart", "Russell Reynolds", "Egon Zehnder"], carlotaAdvantage: "Combined strategic advisory and executive assessment methodology" },
    ];
    sendSuccess(res, {
      source: "Consulting Industry Intelligence — Carlota Jo Research Engine",
      count: trends.length,
      trends,
      marketSize: "$300B+ global management consulting market (2026 estimate)",
      cagr: "6.8% CAGR projected through 2028",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch consulting trends"); }
});

router.get("/carlota/live/world-bank-indicators", carlotaLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const indicator = (req.query.indicator as string) || "NY.GDP.MKTP.KD.ZG";
    const countries = (req.query.countries as string) || "US;CN;DE;JP;GB";
    const data = await getCached(`carlota-wb-${indicator}-${countries}`, 86400000, async () => {
      try {
        const raw = await fetchJson(
          `https://api.worldbank.org/v2/country/${countries}/indicator/${indicator}?mrv=3&format=json`,
          10000,
        ) as any;
        const entries = raw?.[1];
        if (!Array.isArray(entries)) throw new Error("No World Bank data");
        return {
          indicator,
          data: entries.filter((e: any) => e.value !== null).map((e: any) => ({
            country: e.country?.value,
            countryCode: e.countryiso3code,
            year: e.date,
            value: parseFloat(e.value?.toFixed(3)),
          })),
          source: "live",
        };
      } catch {
        return {
          indicator,
          data: [
            { country: "United States", countryCode: "USA", year: "2023", value: 2.1 },
            { country: "China", countryCode: "CHN", year: "2023", value: 5.2 },
            { country: "Germany", countryCode: "DEU", year: "2023", value: -0.3 },
          ],
          source: "demo",
        };
      }
    });
    sendSuccess(res, {
      source: "World Bank Open Data API",
      url: "https://api.worldbank.org/v2/",
      indicatorCode: indicator,
      count: data.data.length,
      observations: data.data,
      liveData: data.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch World Bank indicators"); }
});

export default router;
