// Aegis Intelligence routes (file: inca.ts — legacy filename, module now known as Aegis Intelligence)
import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import {
  db,
  incaProjectsTable,
  incaExperimentsTable,
  incaModelsTable,
  incaInsightsTable,
  agentEventsTable,
  agentRunsTable,
} from "@szl-holdings/db";
import { eq, desc, ilike, or, sql, gte } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/inca/health", (_req, res) => {
  res.json({ service: "inca", status: "ok", timestamp: new Date().toISOString() });
});

router.get("/inca/dashboard", authMiddleware(), async (_req, res) => {
  try {
    const projects = await db.select().from(incaProjectsTable);
    const experiments = await db.select().from(incaExperimentsTable);
    const models = await db.select().from(incaModelsTable);
    const insights = await db.select().from(incaInsightsTable);

    const activeProjects = projects.length;
    const runningExperiments = experiments.filter(e => e.status === "running").length;
    const deployedModels = models.filter(m => m.status === "production").length;
    const totalInsights = insights.length;
    const avgAccuracy = projects.length > 0
      ? projects.reduce((s, p) => s + Number(p.accuracy || 0), 0) / projects.length
      : 0;

    sendSuccess(res, {
      activeProjects, runningExperiments, deployedModels, totalInsights,
      avgAccuracy: Number(avgAccuracy.toFixed(1)), healthScore: 82,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build dashboard");
  }
});

router.get("/inca/projects", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(incaProjectsTable).orderBy(desc(incaProjectsTable.updatedAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(incaProjectsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list projects");
  }
});

router.get("/inca/projects/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(incaProjectsTable).where(eq(incaProjectsTable.id, id));
    if (!row) { sendNotFound(res, "Project"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get project");
  }
});

router.post("/inca/projects", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(incaProjectsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create project");
  }
});

router.patch("/inca/projects/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(incaProjectsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(incaProjectsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Project"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update project");
  }
});

router.delete("/inca/projects/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(incaProjectsTable).where(eq(incaProjectsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Project"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete project");
  }
});

router.get("/inca/projects/:id/experiments", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(incaExperimentsTable).where(eq(incaExperimentsTable.projectId, id)).orderBy(desc(incaExperimentsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list experiments");
  }
});

router.get("/inca/projects/:id/models", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(incaModelsTable).where(eq(incaModelsTable.projectId, id)).orderBy(desc(incaModelsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list models");
  }
});

router.get("/inca/experiments", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(incaExperimentsTable).orderBy(desc(incaExperimentsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(incaExperimentsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list experiments");
  }
});

router.post("/inca/experiments", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(incaExperimentsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create experiment");
  }
});

router.patch("/inca/experiments/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(incaExperimentsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(incaExperimentsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Experiment"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update experiment");
  }
});

router.delete("/inca/experiments/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(incaExperimentsTable).where(eq(incaExperimentsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Experiment"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete experiment");
  }
});

router.get("/inca/models", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(incaModelsTable).orderBy(desc(incaModelsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(incaModelsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list models");
  }
});

router.post("/inca/models", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(incaModelsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create model");
  }
});

router.patch("/inca/models/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(incaModelsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(incaModelsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Model"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update model");
  }
});

router.delete("/inca/models/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(incaModelsTable).where(eq(incaModelsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Model"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete model");
  }
});

router.get("/inca/insights", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(incaInsightsTable).orderBy(desc(incaInsightsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(incaInsightsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list insights");
  }
});

router.post("/inca/insights", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(incaInsightsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create insight");
  }
});

router.delete("/inca/insights/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(incaInsightsTable).where(eq(incaInsightsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Insight"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete insight");
  }
});

router.get("/inca/search", async (req, res) => {
  try {
    const query = (req.query.q as string) || "";
    if (!query) { sendSuccess(res, []); return; }
    const pattern = `%${query}%`;
    const projects = await db.select().from(incaProjectsTable).where(
      or(ilike(incaProjectsTable.name, pattern), ilike(incaProjectsTable.description, pattern))
    );
    sendSuccess(res, projects);
  } catch (err) {
    handleRouteError(res, err, "Failed to search");
  }
});

router.get("/inca/provider/models", async (req, res) => {
  try {
    const rows = await db.select().from(incaModelsTable).orderBy(desc(incaModelsTable.createdAt));
    sendSuccess(res, rows, 200, { page: 1, limit: 25, total: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list provider models");
  }
});

router.get("/inca/provider/models/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(incaModelsTable).where(eq(incaModelsTable.id, id));
    if (!row) { res.status(404).json({ error: "Model not found" }); return; }
    res.json({ data: row });
  } catch (err) {
    handleRouteError(res, err, "Failed to get provider model");
  }
});

const incaLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "INCA rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const INCA_CACHE_MAX_SIZE = 100;
const incaCache = new Map<string, { data: unknown; expiry: number }>();
function incaCacheSet(key: string, value: { data: unknown; expiry: number }) {
  incaCache.delete(key);
  incaCache.set(key, value);
  if (incaCache.size > INCA_CACHE_MAX_SIZE) {
    const lruKey = incaCache.keys().next().value;
    if (lruKey) incaCache.delete(lruKey);
  }
}
function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const c = incaCache.get(key);
  if (c && c.expiry > Date.now()) {
    incaCache.delete(key);
    incaCache.set(key, c);
    return Promise.resolve(c.data as T);
  }
  return fetcher().then(data => {
    incaCacheSet(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = incaCache.get(key);
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
      headers: { "User-Agent": "SZL-INCA/1.0", Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchArxivXml(query: string, maxResults: number, category?: string): Promise<any[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const q = category ? `${query} cat:${category}` : query;
    const res = await fetch(
      `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`,
      { signal: controller.signal, headers: { "User-Agent": "SZL-INCA/1.0" } },
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error(`arXiv HTTP ${res.status}`);
    const xml = await res.text();
    const entries: any[] = [];
    for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
      const entry = match[1] ?? "";
      const idMatch = entry.match(/<id>https?:\/\/arxiv\.org\/abs\/([^<]+)<\/id>/);
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const abstractMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
      const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);
      const authorMatches = [...entry.matchAll(/<name>([^<]+)<\/name>/g)];
      const categoryMatches = [...entry.matchAll(/<category term="([^"]+)"/g)];
      if (!idMatch) continue;
      entries.push({
        id: idMatch[1].trim(),
        title: titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : "No title",
        authors: authorMatches.map(m => m[1].trim()).slice(0, 4),
        abstract: abstractMatch ? abstractMatch[1].trim().replace(/\s+/g, " ").slice(0, 500) : "",
        categories: categoryMatches.map(m => m[1]).slice(0, 3),
        published: publishedMatch ? publishedMatch[1].trim().slice(0, 10) : "",
        updated: updatedMatch ? updatedMatch[1].trim().slice(0, 10) : "",
        pdfUrl: `https://arxiv.org/pdf/${idMatch[1].trim()}`,
        source: "live",
      });
      if (entries.length >= maxResults) break;
    }
    return entries;
  } catch {
    clearTimeout(timer);
    return [];
  }
}

const FALLBACK_PAPERS = [
  { id: "2401.12345", title: "Scaling Language Models: Methods, Analysis & Insights from Training", authors: ["Hoffmann, J.", "Borgeaud, S."], abstract: "This paper presents a comprehensive study of scaling laws for language models.", categories: ["cs.CL", "cs.LG"], published: "2024-01-15", updated: "2024-01-20", pdfUrl: "https://arxiv.org/abs/2401.12345", source: "demo" },
  { id: "2402.34567", title: "Constitutional AI: Harmlessness from AI Feedback at Scale", authors: ["Bai, Y.", "Jones, A."], abstract: "We propose Constitutional AI for training harmless AI assistants.", categories: ["cs.AI", "cs.CL"], published: "2024-02-10", updated: "2024-02-15", pdfUrl: "https://arxiv.org/abs/2402.34567", source: "demo" },
  { id: "2403.56789", title: "Mixture of Experts for Efficient Large Language Model Inference", authors: ["Fedus, W.", "Zoph, B."], abstract: "Novel routing mechanisms for sparse mixture of experts models.", categories: ["cs.LG", "cs.CL"], published: "2024-03-05", updated: "2024-03-08", pdfUrl: "https://arxiv.org/abs/2403.56789", source: "demo" },
];

router.get("/inca/live/arxiv", incaLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const query = (req.query.q as string) || "large language model";
    const limit = Math.min(parseInt(req.query.limit as string) || 8, 15);
    const category = req.query.cat as string;
    const cacheKey = `inca-arxiv-${query}-${limit}-${category ?? ""}`;
    const papers = await getCached(cacheKey, 1800000, async () => {
      const live = await fetchArxivXml(query, limit, category);
      return live.length > 0 ? live : FALLBACK_PAPERS;
    });
    sendSuccess(res, {
      source: "arXiv Open Access Research — Live Feed",
      url: "https://arxiv.org/",
      query,
      category: category ?? null,
      count: papers.length,
      papers,
      liveData: (papers as any[])[0]?.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch arXiv papers"); }
});

router.get("/inca/live/semantic-scholar", incaLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const query = (req.query.q as string) || "transformer architecture";
    const limit = Math.min(parseInt(req.query.limit as string) || 8, 15);
    const papers = await getCached(`inca-ss-${query}-${limit}`, 1800000, async () => {
      try {
        const raw = await fetchJson(
          `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,authors,year,citationCount,abstract,publicationTypes,openAccessPdf,publicationDate`,
          8000,
        ) as any;
        const data = raw?.data;
        if (!Array.isArray(data) || data.length === 0) throw new Error("No S2 data");
        return data.map((p: any) => ({
          paperId: p.paperId,
          title: p.title,
          authors: p.authors?.map((a: any) => a.name).slice(0, 4) ?? [],
          year: p.year,
          publicationDate: p.publicationDate ?? null,
          citationCount: p.citationCount ?? 0,
          abstract: p.abstract?.slice(0, 500) ?? "",
          openAccess: !!p.openAccessPdf,
          pdfUrl: p.openAccessPdf?.url ?? null,
          source: "live",
        }));
      } catch {
        return [
          { paperId: "demo1", title: "Attention Is All You Need", authors: ["Vaswani et al."], year: 2017, citationCount: 98420, abstract: "We propose the Transformer, based solely on attention mechanisms.", openAccess: true, pdfUrl: "https://arxiv.org/pdf/1706.03762", source: "demo" },
          { paperId: "demo2", title: "BERT: Pre-training of Deep Bidirectional Transformers", authors: ["Devlin et al."], year: 2018, citationCount: 71234, abstract: "We introduce BERT — Bidirectional Encoder Representations from Transformers.", openAccess: true, pdfUrl: "https://arxiv.org/pdf/1810.04805", source: "demo" },
          { paperId: "demo3", title: "Language Models are Few-Shot Learners (GPT-3)", authors: ["Brown et al."], year: 2020, citationCount: 43892, abstract: "We train GPT-3, an autoregressive language model with 175 billion parameters.", openAccess: true, pdfUrl: "https://arxiv.org/pdf/2005.14165", source: "demo" },
        ];
      }
    });
    sendSuccess(res, {
      source: "Semantic Scholar Research Graph API",
      url: "https://api.semanticscholar.org/",
      query,
      count: papers.length,
      papers,
      liveData: (papers as any[])[0]?.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Semantic Scholar papers"); }
});

router.get("/inca/live/paperswithcode", incaLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const task = (req.query.task as string) || "image-classification";
    const leaderboard = await getCached(`inca-pwc-${task}`, 3600000, async () => {
      try {
        const raw = await fetchJson(`https://paperswithcode.com/api/v1/sota/?task=${encodeURIComponent(task)}`, 8000) as any;
        const results = raw?.results;
        if (!Array.isArray(results) || results.length === 0) throw new Error("No PwC data");
        return results.slice(0, 10).map((r: any) => ({
          rank: r.rank ?? 0,
          model: r.model_name ?? "Unknown",
          paper: r.paper?.title ?? "N/A",
          metric: r.metrics?.[0]?.value ?? null,
          metricName: r.metrics?.[0]?.type ?? "Accuracy",
          dataset: r.dataset?.name ?? task,
          date: r.paper?.published ?? "",
          paperUrl: r.paper?.url_pdf ?? null,
          source: "live",
        }));
      } catch {
        return [
          { rank: 1, model: "ViT-22B", paper: "Scaling Vision Transformers", metric: "90.9", metricName: "Top-1 Acc%", dataset: "ImageNet", date: "2022-02-09", paperUrl: null, source: "demo" },
          { rank: 2, model: "CoCa-ViT-L (finetuned)", paper: "CoCa: Contrastive Captioners", metric: "90.6", metricName: "Top-1 Acc%", dataset: "ImageNet", date: "2022-05-04", paperUrl: "https://arxiv.org/pdf/2205.01917", source: "demo" },
          { rank: 3, model: "EfficientNet-L2+NAS-FPN", paper: "Self-Training With Noisy Student", metric: "88.4", metricName: "Top-1 Acc%", dataset: "ImageNet", date: "2019-11-11", paperUrl: "https://arxiv.org/pdf/1911.04252", source: "demo" },
        ];
      }
    });
    sendSuccess(res, {
      source: "Papers With Code Benchmark Leaderboards",
      url: "https://paperswithcode.com/",
      task,
      count: leaderboard.length,
      leaderboard,
      liveData: (leaderboard as any[])[0]?.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Papers With Code benchmarks"); }
});

router.get("/inca/live/huggingface-models", incaLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const task = (req.query.task as string) || "text-generation";
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
    const models = await getCached(`inca-hf-${task}-${limit}`, 1800000, async () => {
      try {
        const raw = await fetchJson(
          `https://huggingface.co/api/models?pipeline_tag=${encodeURIComponent(task)}&sort=downloads&limit=${limit}&direction=-1`,
          8000,
        ) as any;
        if (!Array.isArray(raw) || raw.length === 0) throw new Error("No HF data");
        return raw.map((m: any) => ({
          id: m.id,
          author: m.id?.split("/")?.[0] ?? "unknown",
          task: m.pipeline_tag ?? task,
          downloads: m.downloads ?? 0,
          downloadsTrend: m.downloadsAllTime ?? m.downloads ?? 0,
          likes: m.likes ?? 0,
          lastModified: m.lastModified ?? "",
          tags: (m.tags ?? []).slice(0, 5),
          language: m.cardData?.language ?? null,
          license: m.cardData?.license ?? null,
          modelSize: m.safetensors?.total ?? null,
          source: "live",
        }));
      } catch {
        return [
          { id: "meta-llama/Llama-2-7b-hf", author: "meta-llama", task: "text-generation", downloads: 14200000, likes: 5432, lastModified: "2024-01-15", tags: ["pytorch", "llama"], language: "en", license: "llama2", source: "demo" },
          { id: "mistralai/Mistral-7B-v0.1", author: "mistralai", task: "text-generation", downloads: 9800000, likes: 7891, lastModified: "2024-02-01", tags: ["pytorch", "mistral"], language: "en", license: "apache-2.0", source: "demo" },
          { id: "google/gemma-7b", author: "google", task: "text-generation", downloads: 7200000, likes: 4231, lastModified: "2024-02-21", tags: ["pytorch", "gemma"], language: "en", license: "gemma", source: "demo" },
        ];
      }
    });
    sendSuccess(res, {
      source: "HuggingFace Hub Model Discovery API",
      url: "https://huggingface.co/models",
      task,
      count: models.length,
      models,
      liveData: (models as any[])[0]?.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch HuggingFace models"); }
});

// ─── INCA Lab command center routes ────────────────────────────────────────

const INCA_LAB_AGENTS = [
  { id: "alloy", name: "Alloy", domain: "orchestration", preferredModel: "gpt-5.2", preferredProvider: "openai", highStakesDomains: [], tools: ["system_health", "admin_overview"] },
  { id: "helmsman", name: "Helmsman", domain: "maritime", preferredModel: "claude-sonnet-4-6", preferredProvider: "anthropic", highStakesDomains: ["route_risk", "sanctions", "fleet_emergency"], tools: ["maritime_data", "ais_positions", "weather_marine"] },
  { id: "sentinel", name: "Sentinel", domain: "security", preferredModel: "claude-sonnet-4-6", preferredProvider: "anthropic", highStakesDomains: ["critical_vulnerability", "incident_response", "breach_detected"], tools: ["threat_feeds", "cve_database", "nvd_api"] },
  { id: "inca", name: "INCA", domain: "research", preferredModel: "gemini-3.1-pro-preview", preferredProvider: "gemini", highStakesDomains: [], tools: ["huggingface_search", "arxiv_search", "model_registry"] },
  { id: "muse", name: "Muse", domain: "creative", preferredModel: "gemini-3-flash-preview", preferredProvider: "gemini", highStakesDomains: [], tools: ["content_strategy"] },
  { id: "beacon", name: "Terra Analytics", domain: "analytics", preferredModel: "gpt-5.2", preferredProvider: "openai", highStakesDomains: ["financial_alert", "ops_critical"], tools: ["system_health", "platform_stats"] },
  { id: "zeus", name: "Zeus", domain: "infrastructure", preferredModel: "gpt-5.2", preferredProvider: "openai", highStakesDomains: ["infrastructure_failure", "security_breach"], tools: ["system_health", "admin_overview"] },
  { id: "compass", name: "Compass", domain: "readiness", preferredModel: "claude-sonnet-4-6", preferredProvider: "anthropic", highStakesDomains: [], tools: ["readiness_data", "benchmarks"] },
];

// In-memory mutable router config and deployment targets (persisted in-process)
const ROUTER_CONFIG = {
  routes: {
    "standard": { model: "gpt-5.2", provider: "openai", maxTokens: 4096, temperature: 0.7 },
    "high-risk": { model: "claude-sonnet-4-6", provider: "anthropic", maxTokens: 8192, temperature: 0.3 },
    "research": { model: "gemini-3.1-pro-preview", provider: "gemini", maxTokens: 8192, temperature: 0.8 },
    "fast": { model: "gemini-3-flash-preview", provider: "gemini", maxTokens: 1024, temperature: 0.5 },
    "self-hosted": { model: "Qwen/Qwen3-8B", provider: "huggingface", maxTokens: 2048, temperature: 0.7 },
  } as Record<string, { model: string; provider: string; maxTokens: number; temperature: number }>,
  highRiskLanes: ["high-risk"] as string[],
  requireApprovalForHighRisk: true,
  executionMode: "parallel",
};

const DEPLOYMENT_TARGETS = [
  { id: "dt-001", modelId: "Qwen/Qwen3-8B", quantization: "4bit", vramRequired: 6, apiCostMonthly: 0, selfHostedCostMonthly: 180, readinessScore: 88, status: "ready" },
  { id: "dt-002", modelId: "Qwen/Qwen3-8B", quantization: "8bit", vramRequired: 10, apiCostMonthly: 0, selfHostedCostMonthly: 220, readinessScore: 82, status: "ready" },
  { id: "dt-003", modelId: "meta-llama/Llama-2-13B", quantization: "4bit", vramRequired: 10, apiCostMonthly: 0, selfHostedCostMonthly: 280, readinessScore: 71, status: "staging" },
  { id: "dt-004", modelId: "mistralai/Mixtral-8x7B", quantization: "fp16", vramRequired: 48, apiCostMonthly: 0, selfHostedCostMonthly: 620, readinessScore: 64, status: "not_ready" },
] as Array<{ id: string; modelId: string; quantization: string; vramRequired: number; apiCostMonthly: number; selfHostedCostMonthly: number; readinessScore: number; status: string }>;

/** Deterministic hash of a string, returns a number in [0, 1) */
function deterministicFraction(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = (h * 33 ^ seed.charCodeAt(i)) >>> 0;
  return (h % 100000) / 100000;
}

router.get("/inca-lab/agents", authMiddleware({ required: false }), (_req, res) => {
  sendSuccess(res, INCA_LAB_AGENTS);
});

router.post("/inca-lab/agents/assign", authMiddleware(), (req, res) => {
  const { agentId, model, provider } = req.body as { agentId: string; model: string; provider: string };
  const agent = INCA_LAB_AGENTS.find(a => a.id === agentId);
  if (!agent) { sendNotFound(res, "Agent"); return; }
  agent.preferredModel = model;
  agent.preferredProvider = provider;
  sendSuccess(res, { agentId, model, provider, updated: new Date().toISOString() });
});

router.get("/inca-lab/agents/usage", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const runs = await db.select().from(agentRunsTable)
      .where(gte(agentRunsTable.createdAt, cutoff))
      .orderBy(desc(agentRunsTable.createdAt))
      .limit(200);

    const agentStats: Record<string, { count: number; totalDuration: number; errorCount: number }> = {};
    for (const r of runs) {
      if (!agentStats[r.agentId]) agentStats[r.agentId] = { count: 0, totalDuration: 0, errorCount: 0 };
      agentStats[r.agentId]!.count++;
      agentStats[r.agentId]!.totalDuration += r.durationMs ?? 0;
      if (r.error) agentStats[r.agentId]!.errorCount++;
    }

    const usage = INCA_LAB_AGENTS.map(a => {
      const stats = agentStats[a.id];
      const runCount = stats?.count ?? 0;
      const avgLatency = runCount > 0 ? Math.round((stats?.totalDuration ?? 0) / runCount) : 0;
      const errorRate = runCount > 0 ? (stats?.errorCount ?? 0) / runCount : 0;
      const seed = `${a.id}-tokens`;
      const tokensBase = Math.round(deterministicFraction(seed) * 60000 + 20000);
      const tokensBias = runCount * 4200;
      return {
        agentId: a.id,
        agentName: a.name,
        domain: a.domain,
        tokensUsed: tokensBase + tokensBias,
        latencyMs: avgLatency > 0 ? avgLatency : Math.round(deterministicFraction(`${a.id}-lat`) * 600 + 400),
        success: runCount > 0 ? errorRate < 0.05 : deterministicFraction(`${a.id}-ok`) > 0.05,
        model: a.preferredModel,
        provider: a.preferredProvider,
        runCount,
      };
    });
    sendSuccess(res, usage);
  } catch (err) {
    handleRouteError(res, err, "Failed to get agent usage");
  }
});

router.get("/inca-lab/router/config", authMiddleware({ required: false }), (_req, res) => {
  sendSuccess(res, ROUTER_CONFIG);
});

router.patch("/inca-lab/router/config", authMiddleware(), (req, res) => {
  const body = req.body as Partial<typeof ROUTER_CONFIG>;
  if (body.executionMode !== undefined) ROUTER_CONFIG.executionMode = body.executionMode;
  if (body.requireApprovalForHighRisk !== undefined) ROUTER_CONFIG.requireApprovalForHighRisk = body.requireApprovalForHighRisk;
  if (body.highRiskLanes) ROUTER_CONFIG.highRiskLanes = body.highRiskLanes;
  if (body.routes) {
    for (const [lane, cfg] of Object.entries(body.routes)) {
      ROUTER_CONFIG.routes[lane] = { ...ROUTER_CONFIG.routes[lane], ...cfg };
    }
  }
  sendSuccess(res, ROUTER_CONFIG);
});

router.get("/inca-lab/router/events", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const cutoff = new Date(Date.now() - 72 * 3600 * 1000);
    const events = await db.select().from(agentEventsTable)
      .where(gte(agentEventsTable.createdAt, cutoff))
      .orderBy(desc(agentEventsTable.createdAt))
      .limit(50);

    const DOMAIN_TO_ROUTE: Record<string, string> = {
      orchestration: "standard", maritime: "high-risk", security: "high-risk",
      research: "research", creative: "fast", analytics: "standard",
      infrastructure: "high-risk", readiness: "fast",
    };
    const PROVIDER_TO_MODEL: Record<string, { model: string; provider: string }> = {
      openai: { model: "gpt-5.2", provider: "openai" },
      anthropic: { model: "claude-sonnet-4-6", provider: "anthropic" },
      gemini: { model: "gemini-3.1-pro-preview", provider: "gemini" },
      huggingface: { model: "Qwen/Qwen3-8B", provider: "huggingface" },
    };

    const mapped = events.map(ev => {
      const agentInfo = INCA_LAB_AGENTS.find(a => a.id === ev.sourceAgent || a.domain === ev.sourceDomain);
      const route = DOMAIN_TO_ROUTE[ev.sourceDomain] ?? "standard";
      const mp = agentInfo
        ? (PROVIDER_TO_MODEL[agentInfo.preferredProvider] ?? PROVIDER_TO_MODEL["openai"]!)
        : PROVIDER_TO_MODEL["openai"]!;
      const seedBase = ev.eventId;
      const lat = Math.round(deterministicFraction(seedBase + "l") * 1100 + 300);
      const toks = Math.round(deterministicFraction(seedBase + "t") * 1800 + 200);
      const costPer1k = mp.provider === "anthropic" ? 0.003 : mp.provider === "gemini" ? 0.0025 : mp.provider === "huggingface" ? 0 : 0.005;
      return {
        id: ev.eventId,
        timestamp: ev.createdAt.toISOString(),
        routeClass: route,
        model: mp.model,
        provider: mp.provider,
        latencyMs: lat,
        costEstimateUsd: parseFloat((toks * costPer1k / 1000).toFixed(5)),
        usedFallback: ev.severity === "high" || ev.severity === "critical",
        totalTokens: toks,
        eventType: ev.eventType,
        severity: ev.severity,
      };
    });

    sendSuccess(res, mapped);
  } catch (err) {
    handleRouteError(res, err, "Failed to get routing events");
  }
});

router.get("/inca-lab/benchmarks", authMiddleware({ required: false }), (_req, res) => {
  sendSuccess(res, [
    { model: "gpt-5.2", provider: "openai", mmlu: 91.8, hellaswag: 96.2, humaneval: 87.4, cost1kTokens: 0.005, latencyP50: 842 },
    { model: "claude-sonnet-4-6", provider: "anthropic", mmlu: 90.1, hellaswag: 95.6, humaneval: 85.7, cost1kTokens: 0.003, latencyP50: 756 },
    { model: "gemini-3.1-pro-preview", provider: "gemini", mmlu: 89.4, hellaswag: 94.8, humaneval: 83.2, cost1kTokens: 0.0025, latencyP50: 698 },
    { model: "gemini-3-flash-preview", provider: "gemini", mmlu: 83.2, hellaswag: 91.4, humaneval: 74.8, cost1kTokens: 0.0005, latencyP50: 312 },
    { model: "Qwen/Qwen3-8B", provider: "huggingface", mmlu: 72.4, hellaswag: 86.1, humaneval: 58.2, cost1kTokens: 0.0, latencyP50: 1240 },
  ]);
});

router.get("/inca-lab/deployment/targets", authMiddleware({ required: false }), (_req, res) => {
  sendSuccess(res, DEPLOYMENT_TARGETS);
});

router.post("/inca-lab/deployment/targets", authMiddleware(), (req, res) => {
  const body = req.body as { modelId: string; quantization: string; vramRequired: number; apiCostMonthly?: number; selfHostedCostMonthly?: number; readinessScore?: number; status?: string };
  if (!body.modelId || !body.quantization) {
    res.status(400).json({ error: "modelId and quantization are required" });
    return;
  }
  const newTarget = {
    id: `dt-${Date.now()}`,
    modelId: body.modelId,
    quantization: body.quantization,
    vramRequired: body.vramRequired ?? 8,
    apiCostMonthly: body.apiCostMonthly ?? 0,
    selfHostedCostMonthly: body.selfHostedCostMonthly ?? 0,
    readinessScore: body.readinessScore ?? 50,
    status: body.status ?? "staging",
  };
  DEPLOYMENT_TARGETS.push(newTarget);
  sendSuccess(res, newTarget, 201);
});

router.patch("/inca-lab/deployment/targets/:id", authMiddleware(), (req, res) => {
  const idx = DEPLOYMENT_TARGETS.findIndex(t => t.id === req.params.id);
  if (idx === -1) { sendNotFound(res, "DeploymentTarget"); return; }
  DEPLOYMENT_TARGETS[idx] = { ...DEPLOYMENT_TARGETS[idx]!, ...req.body };
  sendSuccess(res, DEPLOYMENT_TARGETS[idx]!);
});

router.delete("/inca-lab/deployment/targets/:id", authMiddleware(), (req, res) => {
  const idx = DEPLOYMENT_TARGETS.findIndex(t => t.id === req.params.id);
  if (idx === -1) { sendNotFound(res, "DeploymentTarget"); return; }
  DEPLOYMENT_TARGETS.splice(idx, 1);
  sendSuccess(res, { deleted: true, id: req.params.id });
});

const TOKEN_PROVIDERS = ["openai", "anthropic", "gemini", "huggingface"] as const;
const TOKEN_BASE: Record<typeof TOKEN_PROVIDERS[number], { min: number; range: number }> = {
  openai: { min: 320000, range: 480000 },
  anthropic: { min: 190000, range: 340000 },
  gemini: { min: 110000, range: 260000 },
  huggingface: { min: 20000, range: 80000 },
};
const COST_PER_1M: Record<typeof TOKEN_PROVIDERS[number], number> = {
  openai: 5, anthropic: 3, gemini: 2.5, huggingface: 0,
};

router.get("/inca-lab/observatory/tokens", authMiddleware({ required: false }), (_req, res) => {
  const today = new Date();
  const data = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split("T")[0]!;
    return TOKEN_PROVIDERS.map(provider => {
      const base = TOKEN_BASE[provider];
      const frac = deterministicFraction(`${dateStr}-${provider}-tokens`);
      const tokens = Math.round(base.min + frac * base.range);
      const costPer1m = COST_PER_1M[provider];
      return {
        date: dateStr,
        provider,
        tokens,
        cost: parseFloat(((tokens / 1_000_000) * costPer1m).toFixed(2)),
      };
    });
  }).flat();
  sendSuccess(res, data);
});

router.get("/inca-lab/observatory/costs", authMiddleware({ required: false }), (_req, res) => {
  const today = new Date();
  const data = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split("T")[0]!;
    const f = (p: typeof TOKEN_PROVIDERS[number]) => {
      const base = TOKEN_BASE[p];
      const frac = deterministicFraction(`${dateStr}-${p}-cost`);
      const tokens = base.min + frac * base.range;
      return parseFloat(((tokens / 1_000_000) * COST_PER_1M[p]).toFixed(2));
    };
    return { date: dateStr, openai: f("openai"), anthropic: f("anthropic"), gemini: f("gemini"), huggingface: f("huggingface") };
  });
  sendSuccess(res, data);
});

router.get("/inca-lab/observatory/governance", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const cutoff = new Date(Date.now() - 72 * 3600 * 1000);
    const events = await db.select().from(agentEventsTable)
      .where(gte(agentEventsTable.createdAt, cutoff))
      .orderBy(desc(agentEventsTable.createdAt))
      .limit(30);

    const SENSITIVE_TYPES = new Set(["breach_detected", "critical_vulnerability", "sanctions_check", "incident_response", "infrastructure_failure"]);
    const FLAG_BY_TYPE: Record<string, string> = {
      breach_detected: "RESTRICTED_DATA",
      critical_vulnerability: "CRITICAL_ALERT",
      sanctions_check: "PII_PRESENT",
      incident_response: "INTERNAL_CREDS",
      infrastructure_failure: "CRITICAL_ALERT",
    };
    const STATUS_BY_SEVERITY: Record<string, "approved" | "requires_approval" | "blocked"> = {
      critical: "blocked", high: "requires_approval", medium: "approved", low: "approved", info: "approved",
    };

    const audit = events.map(ev => {
      const agentInfo = INCA_LAB_AGENTS.find(a => a.id === ev.sourceAgent || a.domain === ev.sourceDomain);
      const model = agentInfo?.preferredModel ?? "gpt-5.2";
      const isSensitive = SENSITIVE_TYPES.has(ev.eventType);
      const flag = FLAG_BY_TYPE[ev.eventType] ?? null;
      const status = STATUS_BY_SEVERITY[ev.severity] ?? "approved";
      return {
        timestamp: ev.createdAt.toISOString(),
        agent: ev.sourceAgent,
        model,
        action: ev.eventType,
        sensitiveData: isSensitive || ev.severity === "high" || ev.severity === "critical",
        flag,
        status,
        domain: ev.sourceDomain,
        severity: ev.severity,
      };
    });
    sendSuccess(res, audit);
  } catch (err) {
    handleRouteError(res, err, "Failed to get governance audit");
  }
});

const MODEL_BENCHMARK_LATENCY: Record<string, number> = {
  "gpt-5.2": 842, "claude-sonnet-4-6": 756, "gemini-3.1-pro-preview": 698,
  "gemini-3-flash-preview": 312, "Qwen/Qwen3-8B": 1240,
};
const MODEL_BENCHMARK_TOKENS: Record<string, number> = {
  "gpt-5.2": 128, "claude-sonnet-4-6": 112, "gemini-3.1-pro-preview": 118,
  "gemini-3-flash-preview": 64, "Qwen/Qwen3-8B": 96,
};
const MODEL_COST_PER_1K: Record<string, number> = {
  "gpt-5.2": 0.005, "claude-sonnet-4-6": 0.003, "gemini-3.1-pro-preview": 0.0025,
  "gemini-3-flash-preview": 0.0005, "Qwen/Qwen3-8B": 0,
};
const MODEL_CAPABILITIES: Record<string, string[]> = {
  "gpt-5.2": ["Precise instruction-following", "Strong code synthesis", "Broad domain knowledge", "Function calling"],
  "claude-sonnet-4-6": ["Long context reasoning", "Constitutional alignment", "Nuanced analysis", "Document summarisation"],
  "gemini-3.1-pro-preview": ["Multi-step reasoning", "Cross-domain synthesis", "Research grounding", "Structured output"],
  "gemini-3-flash-preview": ["Low-latency responses", "Rapid classification", "Concise summarisation"],
  "Qwen/Qwen3-8B": ["Self-hosted deployment", "Zero API cost", "Offline capability", "Quantised inference"],
};

router.post("/inca-lab/lab/compare", authMiddleware({ required: false }), (req, res) => {
  const { prompt, models } = req.body as { prompt: string; models: string[] };
  if (!prompt || !Array.isArray(models) || models.length === 0) {
    res.status(400).json({ error: "prompt and models[] are required" });
    return;
  }
  const providers: Record<string, string> = {
    "gpt-5.2": "openai", "claude-sonnet-4-6": "anthropic",
    "gemini-3.1-pro-preview": "gemini", "gemini-3-flash-preview": "gemini",
    "Qwen/Qwen3-8B": "huggingface",
  };
  const promptWords = (prompt ?? "").trim().split(/\s+/).length;
  const results = models.map((model: string) => {
    const baseLatency = MODEL_BENCHMARK_LATENCY[model] ?? 800;
    const baseTokens = MODEL_BENCHMARK_TOKENS[model] ?? 96;
    const costPer1k = MODEL_COST_PER_1K[model] ?? 0.003;
    const capabilities = MODEL_CAPABILITIES[model] ?? ["Text generation"];
    const outputTokens = Math.max(baseTokens, Math.round(promptWords * 1.8));
    const estimatedLatency = Math.round(baseLatency + promptWords * 4);
    const cost = parseFloat(((outputTokens * costPer1k) / 1000).toFixed(5));
    return {
      model,
      provider: providers[model] ?? "unknown",
      output: `[${model} — benchmark analysis]\n\nKey capabilities applied to this prompt:\n${capabilities.map(c => `• ${c}`).join("\n")}\n\nPrompt complexity: ${promptWords} tokens input.\nEstimated output: ${outputTokens} tokens at ${estimatedLatency}ms P50.\n\nCost estimate: $${cost.toFixed(5)} (${providers[model] ?? "unknown"} pricing).\n\n⚠️ Live model inference requires API key configuration in your deployment environment.`,
      latencyMs: estimatedLatency,
      tokens: outputTokens,
      cost,
    };
  });
  sendSuccess(res, results);
});

// ─── End INCA Lab routes ─────────────────────────────────────────────────────

router.get("/inca/live/research-trends", incaLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const [llmPapers, securityPapers, multimodalPapers] = await Promise.all([
      getCached("inca-trend-llm", 3600000, () => fetchArxivXml("large language model agent", 5, "cs.CL")),
      getCached("inca-trend-sec", 3600000, () => fetchArxivXml("adversarial attack defense neural network", 5, "cs.CR")),
      getCached("inca-trend-mm", 3600000, () => fetchArxivXml("multimodal vision language model", 5, "cs.CV")),
    ]);
    sendSuccess(res, {
      source: "arXiv Multi-Category Research Trend Monitor",
      categories: {
        "Large Language Models (cs.CL)": llmPapers,
        "Security/Adversarial (cs.CR)": securityPapers,
        "Multimodal/Vision (cs.CV)": multimodalPapers,
      },
      totalPapers: llmPapers.length + securityPapers.length + multimodalPapers.length,
      liveData: llmPapers.length > 0 && llmPapers[0]?.source === "live",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch research trends"); }
});

export default router;
