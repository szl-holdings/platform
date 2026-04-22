// Aegis Intelligence routes (formerly known as INCA — route paths and table names retain the inca prefix for backwards compatibility)
import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import {
  db,
  incaProjectsTable,
  incaExperimentsTable,
  incaModelsTable,
  incaInsightsTable,
} from "@szl-holdings/db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
import { listQuerySchema, validateBody, validateQuery } from "../lib/validation";

import { bodyShape } from "@szl-holdings/contracts/common";
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

router.get("/inca/projects", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
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

router.post("/inca/projects", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(incaProjectsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create project");
  }
});

router.patch("/inca/projects/:id", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(incaProjectsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(incaProjectsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Project"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update project");
  }
});

router.delete("/inca/projects/:id", validateBody(bodyShape({})), authMiddleware(), async (req, res) => {
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

router.get("/inca/experiments", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(incaExperimentsTable).orderBy(desc(incaExperimentsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(incaExperimentsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list experiments");
  }
});

router.post("/inca/experiments", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(incaExperimentsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create experiment");
  }
});

router.patch("/inca/experiments/:id", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(incaExperimentsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(incaExperimentsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Experiment"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update experiment");
  }
});

router.delete("/inca/experiments/:id", validateBody(bodyShape({})), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(incaExperimentsTable).where(eq(incaExperimentsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Experiment"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete experiment");
  }
});

router.get("/inca/models", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(incaModelsTable).orderBy(desc(incaModelsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(incaModelsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list models");
  }
});

router.post("/inca/models", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(incaModelsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create model");
  }
});

router.patch("/inca/models/:id", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(incaModelsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(incaModelsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Model"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update model");
  }
});

router.delete("/inca/models/:id", validateBody(bodyShape({})), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(incaModelsTable).where(eq(incaModelsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Model"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete model");
  }
});

router.get("/inca/insights", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(incaInsightsTable).orderBy(desc(incaInsightsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(incaInsightsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list insights");
  }
});

router.post("/inca/insights", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(incaInsightsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create insight");
  }
});

router.delete("/inca/insights/:id", validateBody(bodyShape({})), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(incaInsightsTable).where(eq(incaInsightsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Insight"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete insight");
  }
});

router.get("/inca/search", validateQuery(listQuerySchema), async (req, res) => {
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

router.get("/inca/provider/models", async (_req, res) => {
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

router.get("/inca/live/arxiv", incaLiveLimit, authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const query = (req.query.q as string) || "large language model";
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 8, 15);
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

router.get("/inca/live/semantic-scholar", incaLiveLimit, authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const query = (req.query.q as string) || "transformer architecture";
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 8, 15);
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

router.get("/inca/live/paperswithcode", incaLiveLimit, authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
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

router.get("/inca/live/huggingface-models", incaLiveLimit, authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const task = (req.query.task as string) || "text-generation";
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 20);
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
