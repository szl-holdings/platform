import crypto from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { db, pool } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, asc, desc } from "drizzle-orm";
import { services } from "@workspace/services";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const alloyChatRouter: IRouter = Router();

const aiLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AlloyChat rate limit exceeded. Please try again later." },
  validate: { xForwardedForHeader: false, ip: false },
});

// ─── Ensure KB / advisory / comparison tables exist ───────────────────────────

async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alloy_chat_kb_documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_url TEXT,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL DEFAULT 0,
      total_chunks INTEGER NOT NULL DEFAULT 1,
      embedding TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS alloy_chat_advisories (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      metadata JSONB,
      generated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS alloy_chat_comparisons (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      results JSONB NOT NULL,
      ratings JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

ensureTables().catch(() => {});

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface AdminOverview {
  system?: { memoryUsage?: { heapUsed: number }; uptime?: number; nodeVersion?: string };
  database?: { status?: string; connections?: number };
  storage?: { status?: string };
  counts?: { activeApps?: number; apps?: number; liveConnectors?: number; connectors?: number };
}

interface AdminHealth {
  status?: string;
  summary?: { healthy?: number; degraded?: number; down?: number };
  checks?: Array<{ status: string; name: string; details: string }>;
}

interface AdminConnectors {
  summary?: { total?: number; liveConfigured?: number; mockedDemoMode?: number; manualRequired?: number };
  connectors?: Array<{ status: string; name: string }>;
}

interface AdminFeatureFlags {
  flags?: Array<{ enabled: boolean; key: string }>;
}

type ModelProvider = "auto" | "openai" | "anthropic";

function routeModel(content: string, provider: ModelProvider): { provider: "openai" | "anthropic"; model: string; reason: string } {
  if (provider === "anthropic") {
    return { provider: "anthropic", model: "claude-sonnet-4-6", reason: "User selected Claude" };
  }
  if (provider === "openai") {
    return { provider: "openai", model: "gpt-5.2", reason: "User selected GPT-5.2" };
  }

  const lowerContent = content.toLowerCase();
  const analysisKeywords = ["analyze", "analysis", "explain", "why", "how does", "debug", "diagnose", "review", "assess", "reason", "what's wrong", "root cause", "investigate", "compare"];
  const codeKeywords = ["code", "script", "function", "query", "sql", "python", "javascript", "typescript", "implement", "write a", "generate"];

  if (analysisKeywords.some(k => lowerContent.includes(k)) || codeKeywords.some(k => lowerContent.includes(k))) {
    return { provider: "anthropic", model: "claude-sonnet-4-6", reason: "Claude selected for analysis/reasoning task" };
  }

  return { provider: "openai", model: "gpt-5.2", reason: "GPT-5.2 selected for general operations query" };
}

async function buildSystemPrompt(req: Request): Promise<string> {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  let systemContext = "";

  try {
    if (devDomain) {
      const baseUrl = `https://${devDomain}`;
      const [overviewRes, healthRes, connectorsRes, flagsRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/admin/overview`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok ? r.json() : null),
        fetch(`${baseUrl}/api/admin/system-health`, { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : null),
        fetch(`${baseUrl}/api/admin/connectors`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok ? r.json() : null),
        fetch(`${baseUrl}/api/admin/feature-flags`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok ? r.json() : null),
      ]);

      const overview = overviewRes.status === "fulfilled" ? overviewRes.value as AdminOverview : null;
      const health = healthRes.status === "fulfilled" ? healthRes.value as AdminHealth : null;
      const connectors = connectorsRes.status === "fulfilled" ? connectorsRes.value as AdminConnectors : null;
      const featureFlags = flagsRes.status === "fulfilled" ? flagsRes.value as AdminFeatureFlags : null;

      if (overview) {
        const mem = overview.system?.memoryUsage;
        const memMB = mem ? Math.round(mem.heapUsed / 1024 / 1024) : "?";
        systemContext += `\n## Live System State (as of ${new Date().toISOString()})\n`;
        systemContext += `- Uptime: ${Math.round((overview.system?.uptime ?? 0) / 60)} minutes\n`;
        systemContext += `- Node.js: ${overview.system?.nodeVersion}\n`;
        systemContext += `- Memory: ${memMB}MB heap used\n`;
        systemContext += `- Database: ${overview.database?.status ?? "unknown"} (${overview.database?.connections ?? 0} connections)\n`;
        systemContext += `- Storage: ${overview.storage?.status ?? "unknown"}\n`;
        systemContext += `- Apps: ${overview.counts?.activeApps ?? 0}/${overview.counts?.apps ?? 0} active\n`;
        systemContext += `- Live Connectors: ${overview.counts?.liveConnectors ?? 0}/${overview.counts?.connectors ?? 0}\n`;
      }

      if (health) {
        systemContext += `\n## System Health\n`;
        systemContext += `- Overall Status: ${health.status}\n`;
        systemContext += `- Healthy: ${health.summary?.healthy}, Degraded: ${health.summary?.degraded}, Down: ${health.summary?.down}\n`;
        const issues = (health.checks ?? []).filter((c: { status: string; name: string; details: string }) => c.status !== "healthy");
        if (issues.length > 0) {
          systemContext += `- Issues:\n`;
          for (const issue of issues.slice(0, 8)) {
            systemContext += `  - ${issue.name} (${issue.status}): ${issue.details}\n`;
          }
        }
      }

      if (connectors) {
        const summary = connectors.summary;
        systemContext += `\n## Connector Status\n`;
        systemContext += `- Total: ${summary?.total}, Live: ${summary?.liveConfigured}, Demo: ${summary?.mockedDemoMode}, Manual Required: ${summary?.manualRequired}\n`;
        const liveOnes = (connectors.connectors ?? []).filter((c: { status: string; name: string }) => c.status === "LIVE_CONFIGURED").map((c: { name: string }) => c.name);
        const demoOnes = (connectors.connectors ?? []).filter((c: { status: string; name: string }) => c.status === "MOCKED_DEMO_MODE").map((c: { name: string }) => c.name);
        if (liveOnes.length > 0) systemContext += `- Live: ${liveOnes.join(", ")}\n`;
        if (demoOnes.length > 0) systemContext += `- Demo mode: ${demoOnes.join(", ")}\n`;
      }

      if (featureFlags) {
        const enabled = (featureFlags.flags ?? []).filter((f: { enabled: boolean; key: string }) => f.enabled).map((f: { key: string }) => f.key);
        const disabled = (featureFlags.flags ?? []).filter((f: { enabled: boolean; key: string }) => !f.enabled).map((f: { key: string }) => f.key);
        systemContext += `\n## Feature Flags\n`;
        systemContext += `- Enabled: ${enabled.join(", ") || "none"}\n`;
        systemContext += `- Disabled: ${disabled.join(", ") || "none"}\n`;
      }
    }
  } catch {
    systemContext = "\n(Live system state unavailable at this time)\n";
  }

  return `You are AlloyChat, an AI-powered operations assistant for the SZL Admin Control Plane — a multi-tenant platform that orchestrates 14+ production applications.

## Your Role
You help SZL engineers and operators manage infrastructure, debug issues, interpret metrics, understand system state, and navigate the platform. You are direct, precise, and actionable.

## SZL Ecosystem
The platform includes these registered applications:
- Admin Control Plane (this interface) — system administration dashboard
- API Server — REST API backend powering all apps
- Project List — portfolio project management
- Vessel Tracker — maritime fleet tracking with real-time AIS data
- Firestorm Security — red team simulation and security assessment platform
- Stephen Lutar — personal portfolio and case study site
- INCA AI Research — AI research command center with publication tracking
- Terra Real Estate — real estate portfolio intelligence and analytics
- MSP Command Center — managed service provider operations dashboard
- SZL Holdings — family office investment management
- Vessels Maritime Intelligence — vessel fleet management and compliance
- Readiness Report — organizational readiness assessment platform
- Lyte Command Center — ITOps signal processing and incident response
- Dreamscape Creative Engine — AI-powered creative campaign platform
- Carlota Jo Consulting — consulting services booking and management
- Component Preview Server — design system component library

## Capabilities
You can explain system health, interpret connector status, explain feature flags, review infrastructure configuration, suggest diagnostic steps, help write admin queries, and answer ops questions about any of the above apps.

## Behavior
- Be concise and actionable. Lead with the answer, then explain.
- Use markdown formatting for readability: **bold** for emphasis, \`code\` for commands/values, tables for comparisons.
- When you identify a problem, suggest specific remediation steps.
- If you don't have enough data, say so clearly rather than guessing.
- You can see live system state below. Use it to give current, accurate answers.
${systemContext}

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  return magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

function chunkText(text: string, chunkSize = 400): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks.length ? chunks : [text];
}

// ─── Conversation endpoints (from HEAD — streaming, persistent history) ────────

alloyChatRouter.get("/alloy-chat/conversations", async (_req: Request, res: Response) => {
  try {
    const convos = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt))
      .limit(50);
    res.json({ conversations: convos });
  } catch {
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

alloyChatRouter.post("/alloy-chat/conversations", async (req: Request, res: Response) => {
  try {
    const { title } = req.body as { title?: string };
    const [newConvo] = await db
      .insert(conversations)
      .values({ title: title ?? "New Chat" })
      .returning();
    res.status(201).json(newConvo);
  } catch {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

alloyChatRouter.get("/alloy-chat/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params["id"]!), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid conversation ID" }); return; }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));
    res.json({ messages: msgs });
  } catch {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

alloyChatRouter.delete("/alloy-chat/conversations/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params["id"]!), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid conversation ID" }); return; }
    await db.delete(conversations).where(eq(conversations.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

alloyChatRouter.post("/alloy-chat/conversations/:id/messages", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params["id"]!), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid conversation ID" }); return; }

  const { content, provider = "auto" } = req.body as { content: string; provider?: ModelProvider };
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Message content is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    await db.insert(messages).values({ conversationId: id, role: "user", content: content.trim() });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt))
      .limit(40);

    const systemPrompt = await buildSystemPrompt(req);
    const { provider: chosenProvider, model, reason } = routeModel(content, provider as ModelProvider);

    res.write(`data: ${JSON.stringify({ type: "model", provider: chosenProvider, model, reason })}\n\n`);

    const chatMessages = history.slice(0, -1).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    chatMessages.push({ role: "user", content: content.trim() });

    let fullResponse = "";

    if (chosenProvider === "anthropic") {
      const stream = anthropic.messages.stream({
        model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: chatMessages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          fullResponse += event.delta.text;
          res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
        }
      }
    } else {
      const stream = await openai.chat.completions.create({
        model,
        max_completion_tokens: 8192,
        messages: [{ role: "system", content: systemPrompt }, ...chatMessages],
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }
    }

    if (fullResponse) {
      await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });

      const convo = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
      if (convo[0]?.title === "New Chat" && chatMessages.length === 1) {
        const titleWords = content.trim().split(" ").slice(0, 6).join(" ");
        await db
          .update(conversations)
          .set({ title: titleWords.length > 3 ? titleWords : "Chat session" })
          .where(eq(conversations.id, id));
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
    res.end();
  }
});

alloyChatRouter.get("/alloy-chat/suggested-prompts", async (_req: Request, res: Response) => {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const defaultPrompts = [
    "What's the current system health status?",
    "Which integrations are in demo mode?",
    "Show me all registered apps and their status",
    "What feature flags are currently enabled?",
    "How many active database connections are there?",
    "List recent webhook events",
    "Which connectors need manual configuration?",
    "Summarize the integration health for all apps",
  ];

  try {
    if (!devDomain) { res.json({ prompts: defaultPrompts }); return; }

    const [healthRes, connectorsRes] = await Promise.allSettled([
      fetch(`https://${devDomain}/api/admin/system-health`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok ? r.json() : null),
      fetch(`https://${devDomain}/api/admin/connectors`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok ? r.json() : null),
    ]);

    const health = healthRes.status === "fulfilled" ? healthRes.value as AdminHealth : null;
    const connectors = connectorsRes.status === "fulfilled" ? connectorsRes.value as AdminConnectors : null;

    const contextualPrompts: string[] = [];
    if (health?.status === "degraded" || health?.status === "down") contextualPrompts.push("Diagnose the current system health issues");
    if ((health?.summary?.degraded ?? 0) > 0) contextualPrompts.push(`What's causing the ${health!.summary!.degraded} degraded service(s)?`);
    if ((connectors?.summary?.manualRequired ?? 0) > 0) contextualPrompts.push(`Which connectors need configuration and how do I set them up?`);
    if ((connectors?.summary?.mockedDemoMode ?? 0) > 0) contextualPrompts.push(`Which integrations are in demo mode and what data is simulated?`);

    res.json({ prompts: [...contextualPrompts, ...defaultPrompts].slice(0, 8) });
  } catch {
    res.json({ prompts: defaultPrompts });
  }
});

// ─── Image Generation (Task #57) ──────────────────────────────────────────────

alloyChatRouter.post("/alloy-chat/image-generate", aiLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { prompt, provider = "huggingface", size = "512x512", enhance = true } = req.body as {
      prompt: string;
      provider?: "openai" | "huggingface";
      size?: string;
      enhance?: boolean;
    };

    if (!prompt) { sendError(res, "Prompt is required", 400); return; }

    let finalPrompt = prompt;
    if (enhance) {
      try {
        const enhancedResult = await services.ai.chatCompletion([
          { role: "system", content: "You are an image prompt enhancer. Take the user's prompt and improve it to produce a better AI image. Add details about style, lighting, composition, quality. Return ONLY the enhanced prompt, nothing else. Keep it under 200 words." },
          { role: "user", content: prompt },
        ], { maxTokens: 200 });
        if (enhancedResult.content && enhancedResult.content.length > 10) {
          finalPrompt = enhancedResult.content;
        }
      } catch {
      }
    }

    const startTime = Date.now();

    if (provider === "openai") {
      const openaiKey = process.env["OPENAI_API_KEY"];
      const replitProxyKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
      const replitProxyUrl = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
      const apiKey = openaiKey || replitProxyKey;
      const baseUrl = openaiKey ? "https://api.openai.com/v1" : replitProxyUrl;

      if (!apiKey || !baseUrl) { sendError(res, "OpenAI not configured. Please use HuggingFace provider.", 400); return; }

      const openaiSize = "1024x1024";
      const response = await fetch(`${baseUrl}/images/generations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "gpt-image-1", prompt: finalPrompt, n: 1, size: openaiSize, response_format: "b64_json" }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI image generation failed: ${response.status} ${errText}`);
      }

      const data = await response.json() as { data: Array<{ b64_json: string }> };
      const b64 = data.data[0]?.b64_json;
      if (!b64) throw new Error("No image data returned from OpenAI");

      sendSuccess(res, {
        imageBase64: b64, mimeType: "image/png", provider: "openai", model: "gpt-image-1",
        originalPrompt: prompt, enhancedPrompt: finalPrompt, generationTimeMs: Date.now() - startTime, size: openaiSize,
      });
      return;
    }

    const result = await services.huggingface.imageGeneration(finalPrompt);
    sendSuccess(res, {
      imageBase64: result.imageBase64, mimeType: result.mimeType, provider: "huggingface", model: result.model, tier: result.tier,
      originalPrompt: prompt, enhancedPrompt: finalPrompt, generationTimeMs: Date.now() - startTime, size,
    });
  } catch (err) { handleRouteError(res, err, "Failed to generate image"); }
});

// ─── Knowledge Base (Task #57) ────────────────────────────────────────────────

alloyChatRouter.post("/alloy-chat/kb/ingest", aiLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { title, content, sourceType = "text", sourceUrl } = req.body as {
      title: string; content: string; sourceType?: string; sourceUrl?: string;
    };

    if (!title || !content) { sendError(res, "Title and content are required", 400); return; }

    const chunks = chunkText(content, 400);
    const docGroupId = crypto.randomUUID();
    const insertedIds: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!;
      const id = `${docGroupId}-chunk-${i}`;

      let embeddingStr: string | null = null;
      try {
        const embResult = await services.huggingface.embedding(chunk);
        embeddingStr = JSON.stringify(embResult.embedding);
      } catch {
      }

      await pool.query(
        `INSERT INTO alloy_chat_kb_documents (id, title, source_type, source_url, content, chunk_index, total_chunks, embedding, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding, updated_at = NOW()`,
        [id, title, sourceType, sourceUrl || null, chunk, i, chunks.length, embeddingStr],
      );
      insertedIds.push(id);
    }

    sendSuccess(res, { docGroupId, title, chunksCreated: chunks.length, ids: insertedIds });
  } catch (err) { handleRouteError(res, err, "Failed to ingest document"); }
});

alloyChatRouter.get("/alloy-chat/kb/documents", aiLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT title, source_type, source_url,
             MIN(created_at) as created_at,
             MAX(updated_at) as updated_at,
             COUNT(*) as chunk_count,
             SPLIT_PART(id, '-chunk-', 1) as doc_group_id
      FROM alloy_chat_kb_documents
      GROUP BY title, source_type, source_url, SPLIT_PART(id, '-chunk-', 1)
      ORDER BY MIN(created_at) DESC
    `);
    sendSuccess(res, { documents: result.rows });
  } catch (err) { handleRouteError(res, err, "Failed to list KB documents"); }
});

alloyChatRouter.delete("/alloy-chat/kb/documents/:groupId", aiLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await pool.query(`DELETE FROM alloy_chat_kb_documents WHERE id LIKE $1 RETURNING id`, [`${groupId}%`]);
    sendSuccess(res, { deleted: result.rowCount });
  } catch (err) { handleRouteError(res, err, "Failed to delete KB document"); }
});

alloyChatRouter.post("/alloy-chat/kb/retrieve", aiLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { query, topK = 5 } = req.body as { query: string; topK?: number };
    if (!query) { sendError(res, "Query is required", 400); return; }

    let queryEmbedding: number[] | null = null;
    try {
      const embResult = await services.huggingface.embedding(query);
      queryEmbedding = embResult.embedding;
    } catch {
    }

    const allDocs = await pool.query(`SELECT id, title, content, embedding, source_type, source_url FROM alloy_chat_kb_documents`);

    if (allDocs.rows.length === 0) { sendSuccess(res, { chunks: [], context: "" }); return; }

    type RankedChunk = { id: string; title: string; content: string; score: number; source_type: string; source_url?: string };
    let rankedChunks: RankedChunk[];

    if (queryEmbedding) {
      rankedChunks = allDocs.rows
        .map((row: any) => {
          let score = 0;
          if (row.embedding) {
            try { score = cosineSimilarity(queryEmbedding!, JSON.parse(row.embedding) as number[]); } catch { }
          }
          return { id: row.id, title: row.title, content: row.content, score, source_type: row.source_type, source_url: row.source_url };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    } else {
      const queryLower = query.toLowerCase();
      rankedChunks = allDocs.rows
        .map((row: any) => {
          const words = queryLower.split(/\s+/);
          const matches = words.filter((w: string) => (row.content as string).toLowerCase().includes(w)).length;
          return { id: row.id, title: row.title, content: row.content, score: matches / words.length, source_type: row.source_type, source_url: row.source_url };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    }

    const context = rankedChunks.map(c => `[${c.title}]:\n${c.content}`).join("\n\n---\n\n");
    sendSuccess(res, { chunks: rankedChunks, context });
  } catch (err) { handleRouteError(res, err, "Failed to retrieve from knowledge base"); }
});

// ─── Autonomous Advisory (Task #57) ───────────────────────────────────────────

alloyChatRouter.post("/alloy-chat/advisory/generate", aiLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const devDomain = process.env.REPLIT_DEV_DOMAIN;
    const baseUrl = devDomain ? `https://${devDomain}` : `http://localhost:${process.env.PORT || 8080}`;

    const [healthRes, connectorRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/admin/system-health`, { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
      fetch(`${baseUrl}/api/admin/connectors`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()),
    ]);

    const health = healthRes.status === "fulfilled" ? healthRes.value : null;
    const connectors = connectorRes.status === "fulfilled" ? connectorRes.value : null;

    const contextData = {
      systemHealth: health ? (health as any)?.data?.status ?? (health as any)?.status : "unknown",
      checks: health ? ((health as any)?.data?.checks ?? (health as any)?.checks)?.length ?? 0 : 0,
      unhealthyChecks: health ? ((health as any)?.data?.checks ?? (health as any)?.checks)?.filter((c: any) => c.status !== "healthy").length ?? 0 : 0,
      connectorsSummary: connectors ? (connectors as any)?.data?.summary ?? (connectors as any)?.summary : null,
      timestamp: new Date().toISOString(),
    };

    const systemPrompt = `You are AlloyChat's autonomous advisory engine for SZL Admin Control Plane. 
Generate a concise operational briefing based on the ecosystem data. 
Categorize it as one of: security, performance, integration_health, trend_analysis, operational.
Respond in JSON format: { "category": string, "title": string, "content": string, "severity": "info"|"warning"|"alert"|"critical" }`;

    const userPrompt = `Generate an advisory briefing based on this ecosystem snapshot:
- System health: ${contextData.systemHealth}
- Total checks: ${contextData.checks}
- Unhealthy checks: ${contextData.unhealthyChecks}
- Connector summary: ${JSON.stringify(contextData.connectorsSummary)}
- Time: ${contextData.timestamp}

Provide actionable insights. This is advisory only — no changes are executed automatically.`;

    let advisoryData: { category: string; title: string; content: string; severity: string };

    try {
      const result = await services.ai.chatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ], { maxTokens: 512 });

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        advisoryData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in response");
      }
    } catch {
      const unhealthy = contextData.unhealthyChecks || 0;
      advisoryData = {
        category: "operational",
        title: unhealthy > 0 ? `${unhealthy} System Check(s) Need Attention` : "System Operating Normally",
        content: unhealthy > 0
          ? `Advisory: ${unhealthy} checks are not healthy. Review the System Health page for details. No automated actions taken — this is advisory only.`
          : `All monitored systems appear healthy. ${contextData.checks} checks passed. Continue monitoring as scheduled.`,
        severity: unhealthy > 2 ? "alert" : unhealthy > 0 ? "warning" : "info",
      };
    }

    const id = `adv-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    await pool.query(
      `INSERT INTO alloy_chat_advisories (id, category, title, content, severity, is_read, metadata, generated_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, $6, NOW())`,
      [id, advisoryData.category || "operational", advisoryData.title, advisoryData.content, advisoryData.severity || "info", JSON.stringify(contextData)],
    );

    sendSuccess(res, { id, ...advisoryData, generatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to generate advisory"); }
});

alloyChatRouter.get("/alloy-chat/advisory/list", aiLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const limit = parseInt((req.query as Record<string, string>).limit || "20");
    const result = await pool.query(
      `SELECT id, category, title, content, severity, is_read, metadata, generated_at FROM alloy_chat_advisories ORDER BY generated_at DESC LIMIT $1`,
      [limit],
    );
    const unreadCount = result.rows.filter((r: any) => !r.is_read).length;
    sendSuccess(res, { advisories: result.rows, unreadCount });
  } catch (err) { handleRouteError(res, err, "Failed to list advisories"); }
});

alloyChatRouter.post("/alloy-chat/advisory/:id/read", aiLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    await pool.query(`UPDATE alloy_chat_advisories SET is_read = TRUE WHERE id = $1`, [req.params.id]);
    sendSuccess(res, { id: req.params.id, isRead: true });
  } catch (err) { handleRouteError(res, err, "Failed to mark advisory as read"); }
});

alloyChatRouter.post("/alloy-chat/advisory/read-all", aiLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    await pool.query(`UPDATE alloy_chat_advisories SET is_read = TRUE`);
    sendSuccess(res, { updated: true });
  } catch (err) { handleRouteError(res, err, "Failed to mark all advisories as read"); }
});

// ─── Model Comparison (Task #57) ──────────────────────────────────────────────

alloyChatRouter.post("/alloy-chat/compare", aiLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { prompt, models = ["openai", "anthropic", "huggingface"], systemPrompt } = req.body as {
      prompt: string;
      models?: Array<"openai" | "anthropic" | "huggingface">;
      systemPrompt?: string;
    };

    if (!prompt) { sendError(res, "Prompt is required", 400); return; }

    const sysMsgContent = systemPrompt || "You are a helpful AI assistant. Respond concisely and accurately.";
    const chatMsgs: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: sysMsgContent },
      { role: "user", content: prompt },
    ];

    const results: Record<string, { content: string; model: string; provider: string; responseTimeMs: number; usage: { promptTokens: number; completionTokens: number }; error?: string }> = {};

    await Promise.all(models.map(async (provider) => {
      const start = Date.now();
      try {
        if (provider === "openai") {
          const apiKey = process.env["OPENAI_API_KEY"] || process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
          const baseUrl = process.env["OPENAI_API_KEY"] ? "https://api.openai.com/v1" : process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
          if (!apiKey || !baseUrl) {
            results[provider] = { content: "", model: "gpt-4o-mini", provider: "openai", responseTimeMs: 0, usage: { promptTokens: 0, completionTokens: 0 }, error: "OpenAI not configured" };
            return;
          }
          const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: chatMsgs, max_tokens: 512 }),
          });
          const data = await resp.json() as any;
          results[provider] = { content: data.choices?.[0]?.message?.content || "", model: data.model || "gpt-4o-mini", provider: "openai", responseTimeMs: Date.now() - start, usage: { promptTokens: data.usage?.prompt_tokens || 0, completionTokens: data.usage?.completion_tokens || 0 } };
        } else if (provider === "anthropic") {
          const anthropicKey = process.env["ANTHROPIC_API_KEY"];
          if (!anthropicKey) {
            results[provider] = { content: "", model: "claude-3-haiku", provider: "anthropic", responseTimeMs: 0, usage: { promptTokens: 0, completionTokens: 0 }, error: "Anthropic not configured" };
            return;
          }
          const systemMsg = chatMsgs.find(m => m.role === "system");
          const nonSystemMsgs = chatMsgs.filter(m => m.role !== "system");
          const body: Record<string, unknown> = { model: "claude-3-haiku-20240307", max_tokens: 512, messages: nonSystemMsgs };
          if (systemMsg) body["system"] = systemMsg.content;
          const resp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
            body: JSON.stringify(body),
          });
          const data = await resp.json() as any;
          results[provider] = { content: data.content?.[0]?.text || "", model: data.model || "claude-3-haiku", provider: "anthropic", responseTimeMs: Date.now() - start, usage: { promptTokens: data.usage?.input_tokens || 0, completionTokens: data.usage?.output_tokens || 0 } };
        } else {
          const hfResult = await services.huggingface.textGeneration(prompt, { maxTokens: 512 });
          results[provider] = { content: hfResult.text, model: hfResult.model, provider: "huggingface", responseTimeMs: Date.now() - start, usage: { promptTokens: 0, completionTokens: 0 } };
        }
      } catch (e) {
        results[provider] = { content: "", model: provider, provider, responseTimeMs: Date.now() - start, usage: { promptTokens: 0, completionTokens: 0 }, error: e instanceof Error ? e.message : String(e) };
      }
    }));

    const id = `cmp-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    try {
      await pool.query(`INSERT INTO alloy_chat_comparisons (id, prompt, results, ratings, created_at) VALUES ($1, $2, $3, $4, NOW())`,
        [id, prompt, JSON.stringify(results), JSON.stringify({})]);
    } catch {
    }

    sendSuccess(res, { id, prompt, results, createdAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to run model comparison"); }
});

alloyChatRouter.post("/alloy-chat/compare/:id/rate", aiLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { provider, rating } = req.body as { provider: string; rating: "up" | "down" };
    if (!provider || !rating) { sendError(res, "Provider and rating are required", 400); return; }
    await pool.query(
      `UPDATE alloy_chat_comparisons SET ratings = COALESCE(ratings, '{}'::jsonb) || $2::jsonb WHERE id = $1`,
      [req.params.id, JSON.stringify({ [provider]: rating })],
    );
    sendSuccess(res, { id: req.params.id, provider, rating });
  } catch (err) { handleRouteError(res, err, "Failed to save rating"); }
});

// ─── Chat with KB Context (Task #57 — fallback for non-streaming chat path) ───

alloyChatRouter.post("/alloy-chat/chat-with-context", aiLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { messages: chatMsgs, useKnowledgeBase = true, maxTokens = 1024 } = req.body as {
      messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
      useKnowledgeBase?: boolean;
      maxTokens?: number;
    };

    if (!chatMsgs || !Array.isArray(chatMsgs)) { sendError(res, "Messages array is required", 400); return; }

    const lastUserMsg = [...chatMsgs].reverse().find(m => m.role === "user");
    if (!lastUserMsg) { sendError(res, "No user message found", 400); return; }

    let augmentedMessages = [...chatMsgs];

    if (useKnowledgeBase) {
      try {
        let kbEmbedding: number[] | null = null;
        try {
          const embResult = await services.huggingface.embedding(lastUserMsg.content);
          kbEmbedding = embResult.embedding;
        } catch {
        }

        const allDocs = await pool.query(`SELECT id, title, content, embedding FROM alloy_chat_kb_documents LIMIT 200`);

        if (allDocs.rows.length > 0) {
          type Chunk = { title: string; content: string; score: number };
          let relevantChunks: Chunk[];

          if (kbEmbedding) {
            relevantChunks = allDocs.rows
              .map((row: any) => {
                let score = 0;
                if (row.embedding) {
                  try { score = cosineSimilarity(kbEmbedding!, JSON.parse(row.embedding) as number[]); } catch { }
                }
                return { title: row.title, content: row.content, score };
              })
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)
              .filter(c => c.score > 0.1);
          } else {
            const queryLower = lastUserMsg.content.toLowerCase();
            relevantChunks = allDocs.rows
              .map((row: any) => {
                const words = queryLower.split(/\s+/);
                const matches = words.filter((w: string) => (row.content as string).toLowerCase().includes(w)).length;
                return { title: row.title, content: row.content, score: matches / words.length };
              })
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)
              .filter(c => c.score > 0.1);
          }

          if (relevantChunks.length > 0) {
            const kbContext = relevantChunks.map(c => `[Knowledge Base: ${c.title}]\n${c.content}`).join("\n\n---\n\n");
            const systemMsg = augmentedMessages.find(m => m.role === "system");
            if (systemMsg) {
              augmentedMessages = augmentedMessages.map(m =>
                m.role === "system" ? { ...m, content: `${m.content}\n\nRelevant context from knowledge base:\n${kbContext}` } : m,
              );
            } else {
              augmentedMessages = [
                { role: "system", content: `You are AlloyChat, an AI-powered admin assistant for SZL Admin Control Plane.\n\nRelevant context from knowledge base:\n${kbContext}` },
                ...augmentedMessages,
              ];
            }
          }
        }
      } catch {
      }
    }

    const result = await services.ai.chatCompletion(augmentedMessages, { maxTokens });
    sendSuccess(res, { content: result.content, model: result.model, provider: result.provider, usage: result.usage });
  } catch (err) { handleRouteError(res, err, "Failed to generate chat response with context"); }
});

export default alloyChatRouter;
