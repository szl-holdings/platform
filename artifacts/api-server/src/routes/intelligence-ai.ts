import crypto from "crypto";
import express, { Router, type IRouter } from "express";
import { services } from "@szl-holdings/services";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@szl-holdings/integrations-openai-ai-server";
import { anthropic } from "@szl-holdings/integrations-anthropic-ai";
import { getCached, aiRateLimit, intelRateLimit, fetchOtxThreats, fetchNvdCves, fetchRssNews, fetchGdeltGeopolitical, type ThreatItem, type CveItem, type GeoEvent } from "./intelligence-cache";

const router: IRouter = Router();

const DOMAIN_AGENTS: Record<string, { name: string; systemPrompt: string; model: string; provider: "openai" | "anthropic" }> = {
  maritime: { name: "Helmsman", provider: "anthropic", model: "claude-sonnet-4-6", systemPrompt: `You are Helmsman, a world-class maritime intelligence analyst with expertise in fleet operations, AIS vessel tracking, maritime security, route risk assessment, and sanctions compliance. You analyze real-time vessel data, weather patterns, and geopolitical threats affecting shipping lanes. Use nautical terminology. Cite COLREGS, SOLAS, MARPOL where relevant. You have deep knowledge of IMO regulations, Windward-style dark vessel detection, AIS gap analysis, and OFAC/UN sanctions lists. Be precise about positions, speeds, headings, and maritime regulations. Today's date: ${new Date().toISOString().split("T")[0]}.` },
  security: { name: "Sentinel", provider: "anthropic", model: "claude-sonnet-4-6", systemPrompt: `You are Sentinel, an elite cybersecurity intelligence analyst modeled after CrowdStrike Charlotte AI's autonomous SOC capabilities. You specialize in threat analysis, CVE assessment, incident triage, adversary simulation, and security posture evaluation. Use MITRE ATT&CK framework, CVSS scoring, NIST CSF, and CIS Controls. You can map CVEs to TTPs, generate remediation playbooks, and produce executive threat briefings. Be direct, technical, and action-oriented. Today's date: ${new Date().toISOString().split("T")[0]}.` },
  research: { name: "INCA", provider: "openai", model: "gpt-5.2", systemPrompt: `You are INCA, an AI research scientist with HuggingFace-grade expertise in machine learning, AI model evaluation, benchmarking, and academic literature. You can evaluate model quality, analyze research papers, compare architectures, generate model cards, and provide cutting-edge AI insights. You understand transformer architectures, evaluation metrics (MMLU, HumanEval, HellaSwag), and the model leaderboard landscape. Cite your reasoning and be technically precise. Today's date: ${new Date().toISOString().split("T")[0]}.` },
  creative: { name: "Muse", provider: "openai", model: "gpt-5.2", systemPrompt: `You are Muse, a world-class creative director and brand strategist with expertise across film production, advertising, social media, and brand voice development. You generate compelling campaign copy, scripts, creative briefs, brand voice guidelines, and content strategies. Your work rivals top agencies like Wieden+Kennedy and BBDO. You understand audience psychology, cultural trends, and multi-channel campaign architecture. Be creative, bold, and strategically grounded. Today's date: ${new Date().toISOString().split("T")[0]}.` },
  operations: { name: "Terra", provider: "openai", model: "gpt-5.2", systemPrompt: `You are Terra, a Tesla-grade operations intelligence engineer specializing in infrastructure anomaly detection, predictive analytics, SRE best practices, and cost forecasting. You analyze signals across distributed systems, detect anomalies using behavioral baselines, predict infrastructure failures, and generate cost optimization recommendations. Be data-driven, quantitative, and action-oriented. Use SRE terminology and reference SLOs/SLAs/error budgets. Today's date: ${new Date().toISOString().split("T")[0]}.` },
  realestate: { name: "Terra AI", provider: "openai", model: "gpt-5.2", systemPrompt: `You are Terra AI, a PropTech intelligence analyst with HouseCanary-grade expertise in real estate market analysis, property valuation, climate risk assessment, and investment analysis. You synthesize economic indicators, demographic trends, climate data, and comparable sales to generate investment insights. Reference World Bank indicators, FEMA flood risk data, and census demographics. Be precise about valuations, cap rates, IRR, and risk factors. Today's date: ${new Date().toISOString().split("T")[0]}.` },
  msp: { name: "MSP Ops", provider: "openai", model: "gpt-5.2", systemPrompt: `You are MSP Ops, an expert managed service provider operations analyst inspired by NinjaOne and ConnectWise intelligence. You specialize in ticket triage, SLA management, client health scoring, NOC automation, and IT operations optimization. You classify ticket severity, predict SLA breach risk, recommend auto-routing, and generate incident response playbooks. You understand ITIL frameworks, MSP metrics (MRR, churn, client NPS), and security compliance. Today's date: ${new Date().toISOString().split("T")[0]}.` },
  compliance: { name: "Compass", provider: "anthropic", model: "claude-sonnet-4-6", systemPrompt: `You are Compass, an organizational readiness and compliance expert with deep knowledge of NIST CSF, ISO 27001, SOC 2, FedRAMP, CMMC, and HIPAA frameworks. You evaluate security posture, identify control gaps, generate risk assessments, and provide actionable improvement roadmaps. You benchmark organizations against industry standards and produce executive summaries for board-level reporting. Be structured, precise, and cite specific framework controls. Today's date: ${new Date().toISOString().split("T")[0]}.` },
  strategic: { name: "Carlota AI", provider: "anthropic", model: "claude-sonnet-4-6", systemPrompt: `You are Carlota AI, a McKinsey-caliber strategic advisor with expertise in market strategy, competitive intelligence, organizational transformation, and ROI analysis. You synthesize market data, competitive landscapes, and financial models to generate boardroom-ready strategic recommendations. You understand go-to-market strategy, pricing architecture, supply chain optimization, and digital transformation. Be direct, data-driven, and action-oriented. Today's date: ${new Date().toISOString().split("T")[0]}.` },
  platform: { name: "Alloy", provider: "openai", model: "gpt-5.2", systemPrompt: `You are Alloy, a Palantir-grade platform intelligence orchestrator with full visibility across the SZL ecosystem. You correlate intelligence across maritime, security, research, real estate, and operations domains to surface cross-cutting insights. You can diagnose system health, analyze connector status, interpret platform metrics, and generate cross-domain correlation analysis. Be authoritative, synthesizing, and operationally focused. Today's date: ${new Date().toISOString().split("T")[0]}.` },
};

router.post("/intelligence/ai/summarize", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.summarization(text);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to summarize text"); }
});

router.post("/intelligence/ai/sentiment", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.sentimentAnalysis(text);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to analyze sentiment"); }
});

router.post("/intelligence/ai/ner", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.namedEntityRecognition(text);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to extract entities"); }
});

router.post("/intelligence/ai/classify", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text, labels } = req.body;
    if (!text || !labels) { sendError(res, "Text and labels are required", 400); return; }
    const result = await services.huggingface.zeroShotClassification(text, labels);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to classify text"); }
});

router.post("/intelligence/ai/translate", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.translation(text, { sourceLang, targetLang });
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to translate text"); }
});

router.post("/intelligence/ai/generate-image", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) { sendError(res, "Prompt is required", 400); return; }
    const result = await services.huggingface.imageGeneration(prompt);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to generate image"); }
});

router.post("/intelligence/ai/chat", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { sessionId, message, messages, systemPrompt, maxTokens } = req.body;
    const ownerId = req.user?.id;
    const sid = sessionId || crypto.randomUUID();
    if (messages && Array.isArray(messages)) {
      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
      if (!lastUserMsg) { sendError(res, "No user message found in messages array", 400); return; }
      const systemMsg = messages.find((m: { role: string }) => m.role === "system");
      const priorTurns = messages.filter((m: { role: string }) => m.role !== "system").slice(0, -1) as Array<{ role: string; content: string }>;
      services.huggingface.initSessionFromHistory(sid, priorTurns, { systemPrompt: systemMsg?.content, ownerId: ownerId !== undefined ? String(ownerId) : undefined });
      const hfResult = await services.huggingface.chat(sid, lastUserMsg.content, { systemPrompt: systemMsg?.content, maxTokens, ownerId: ownerId !== undefined ? String(ownerId) : undefined });
      sendSuccess(res, { content: hfResult.reply, model: hfResult.model, provider: "huggingface", tier: hfResult.tier, sessionId: sid, usage: { promptTokens: 0, completionTokens: 0 } });
      return;
    }
    if (!message) { sendError(res, "Either 'message' (string) or 'messages' (array) is required", 400); return; }
    const result = await services.huggingface.chat(sid, message, { systemPrompt, maxTokens, ownerId: ownerId !== undefined ? String(ownerId) : undefined });
    sendSuccess(res, { content: result.reply, model: result.model, provider: "huggingface", tier: result.tier, sessionId: sid, usage: { promptTokens: 0, completionTokens: 0 } });
  } catch (err) { handleRouteError(res, err, "Failed to generate chat response"); }
});

router.get("/intelligence/ai/chat/:sessionId/history", aiRateLimit, authMiddleware({ required: true }), async (req, res) => {
  try {
    const requesterId: string = String(req.user?.id ?? "");
    const history = services.huggingface.getChatHistory(String(req.params.sessionId), requesterId);
    sendSuccess(res, { sessionId: String(req.params.sessionId), messages: history });
  } catch (err) { handleRouteError(res, err, "Failed to get chat history"); }
});

router.delete("/intelligence/ai/chat/:sessionId", aiRateLimit, authMiddleware({ required: true }), async (req, res) => {
  try {
    const requesterId: string = String(req.user?.id ?? "");
    const cleared = services.huggingface.clearChatSession(String(req.params.sessionId), requesterId);
    if (!cleared) { sendError(res, "Session not found or access denied", 403); return; }
    sendSuccess(res, { sessionId: String(req.params.sessionId), cleared });
  } catch (err) { handleRouteError(res, err, "Failed to clear chat session"); }
});

router.post("/intelligence/ai/reason", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { prompt, maxTokens, steps } = req.body;
    if (!prompt) { sendError(res, "Prompt is required", 400); return; }
    const result = await services.huggingface.reasoning(prompt, { maxTokens, steps: steps ?? true });
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to generate reasoning response"); }
});

router.post("/intelligence/ai/transcribe", express.raw({ type: ["audio/*", "application/octet-stream"], limit: "25mb" }), aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      sendError(res, "Audio data is required. Send raw audio bytes with Content-Type: audio/wav (or audio/mpeg, application/octet-stream). Max 25MB.", 400); return;
    }
    const language = (req.query as Record<string, string>).language;
    const result = await services.huggingface.transcription(req.body, { language });
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to transcribe audio"); }
});

router.post("/intelligence/ai/embed", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.embedding(text);
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to generate embedding"); }
});

router.post("/intelligence/ai/semantic-search", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { query, documents, topK } = req.body;
    if (!query || !documents || !Array.isArray(documents)) { sendError(res, "Query and documents array are required", 400); return; }
    const results = await services.huggingface.semanticSearch(query, documents, { topK });
    sendSuccess(res, { query, results, totalDocuments: documents.length });
  } catch (err) { handleRouteError(res, err, "Failed to perform semantic search"); }
});

router.post("/intelligence/ai/analyze-document", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { text, classificationLabels } = req.body;
    if (!text) { sendError(res, "Text is required", 400); return; }
    const result = await services.huggingface.analyzeDocument(text, { classificationLabels });
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Failed to analyze document"); }
});

router.get("/intelligence/ai/stream", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  const prompt = (req.query.prompt as string) || "";
  if (!prompt) { sendError(res, "Prompt query parameter is required", 400); return; }
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  try {
    const maxTokens = parseInt(req.query.maxTokens as string) || 512;
    for await (const token of services.huggingface.streamTextGeneration(prompt, { maxTokens })) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch {
    res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
  }
  res.end();
});

router.get("/intelligence/ai/health", intelRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const healthStatus = services.huggingface.getHealthStatus();
    const probe = (req.query as Record<string, string>).probe === "true";
    if (probe) {
      const probeResults = await services.huggingface.probeModelAvailability();
      sendSuccess(res, { ...healthStatus, modelProbes: probeResults });
    } else {
      sendSuccess(res, healthStatus);
    }
  } catch (err) { handleRouteError(res, err, "Failed to get AI health status"); }
});

router.post("/intelligence/ai/chat/stream", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { messages, model, maxTokens } = req.body;
    if (!messages || !Array.isArray(messages)) { sendError(res, "Messages array is required", 400); return; }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    let closed = false;
    req.on("close", () => { closed = true; });
    try {
      for await (const chunk of services.ai.streamChatCompletion(messages, { model, maxTokens })) {
        if (closed) break;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
    } catch {
      if (!closed) res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
    }
    if (!closed) { res.write("data: [DONE]\n\n"); res.end(); }
  } catch (err) { handleRouteError(res, err, "Failed to stream chat completion"); }
});

router.post("/intelligence/ai/threat-briefing", aiRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const threats = await getCached("threats", 300000, fetchOtxThreats);
    const topThreats = threats.slice(0, 5);
    const briefingText = topThreats.map((t: ThreatItem) => `${t.name}: ${t.description} (${t.severity})`).join(". ");
    const [sentiment, entities, summary] = await Promise.all([
      services.huggingface.sentimentAnalysis(briefingText),
      services.huggingface.namedEntityRecognition(briefingText),
      services.huggingface.summarization(briefingText),
    ]);
    sendSuccess(res, { threats: topThreats, analysis: { sentiment, entities, summary }, generatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to generate threat briefing"); }
});

router.post("/intelligence/ai/situation-report", aiRateLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const [threats, cves, news] = await Promise.all([
      getCached("threats", 300000, fetchOtxThreats),
      getCached("cves", 600000, fetchNvdCves),
      getCached("news", 300000, fetchRssNews),
    ]);
    const geoEvents = await getCached("geopolitical", 300000, fetchGdeltGeopolitical).catch(() => [] as GeoEvent[]);
    const context = [
      `Active threats: ${threats.length}`,
      `Critical CVEs: ${cves.filter((c: CveItem) => c.severity === "CRITICAL").length}`,
      `Geopolitical events: ${geoEvents.length}`,
      `Recent news: ${news.slice(0, 3).map((n: { title: string }) => n.title).join("; ")}`,
    ].join(". ");
    const summary = await services.huggingface.summarization(`Current situation report: ${context}. ${geoEvents.map((e: GeoEvent) => e.title).join(". ")}`);
    sendSuccess(res, { summary, stats: { totalThreats: threats.length, criticalCves: cves.filter((c: CveItem) => c.severity === "CRITICAL").length, activeAnomalies: 0, geoEvents: geoEvents.length }, generatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to generate situation report"); }
});

router.post("/intelligence/ai/risk-prediction", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { scenario } = req.body;
    const predictions = [
      { factor: "Cyber Attack Probability", current: 0.34, projected30d: 0.41, projected90d: 0.38, trend: "increasing" },
      { factor: "Supply Chain Disruption", current: 0.22, projected30d: 0.28, projected90d: 0.25, trend: "increasing" },
      { factor: "Regulatory Compliance Gap", current: 0.15, projected30d: 0.12, projected90d: 0.08, trend: "decreasing" },
      { factor: "Insider Threat Index", current: 0.18, projected30d: 0.20, projected90d: 0.19, trend: "stable" },
      { factor: "Infrastructure Failure Risk", current: 0.08, projected30d: 0.07, projected90d: 0.06, trend: "decreasing" },
    ];
    const classification = await services.huggingface.zeroShotClassification(scenario || "Evaluate overall platform risk posture for next quarter", ["low_risk", "moderate_risk", "high_risk", "critical_risk"]);
    sendSuccess(res, { predictions, aiClassification: classification, scenario: scenario || "Default quarterly assessment", generatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to generate risk prediction"); }
});

router.post("/intelligence/ai/content-ideas", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { topic } = req.body;
    const classification = await services.huggingface.zeroShotClassification(topic || "technology innovation", ["thought_leadership", "product_marketing", "educational", "case_study", "social_media"]);
    const inputTopic = topic || "technology innovation";
    const ideas = [
      { title: `The Future of ${inputTopic} in Enterprise Security`, format: "Long-form article", audience: "C-Suite", estimatedEngagement: "high", trendAlignment: classification?.scores?.[0] ? Math.round(classification.scores[0] * 100) : null },
      { title: `How ${inputTopic} is Reshaping Maritime Operations`, format: "Video series", audience: "Industry professionals", estimatedEngagement: "very high", trendAlignment: null },
      { title: `${inputTopic}: A Practical Implementation Guide`, format: "Whitepaper", audience: "Technical leaders", estimatedEngagement: "medium", trendAlignment: null },
    ];
    sendSuccess(res, { ideas, trendingTopics: [], contentTypeRecommendation: classification, generatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to generate content ideas"); }
});

router.post("/intelligence/ai/domain-agent", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { agentId, messages, maxTokens = 2048, stream = false } = req.body as { agentId: string; messages: Array<{ role: "user" | "assistant" | "system"; content: string }>; maxTokens?: number; stream?: boolean };
    if (!agentId || !messages || !Array.isArray(messages)) { sendError(res, "agentId and messages array are required", 400); return; }
    const agent = DOMAIN_AGENTS[agentId];
    if (!agent) { sendError(res, `Unknown agent: ${agentId}. Available: ${Object.keys(DOMAIN_AGENTS).join(", ")}`, 400); return; }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.setHeader("X-Accel-Buffering", "no"); res.flushHeaders();
      try {
        if (agent.provider === "anthropic") {
          const nonSystem = messages.filter(m => m.role !== "system");
          const streamResp = anthropic.messages.stream({ model: agent.model, max_tokens: maxTokens, system: agent.systemPrompt, messages: nonSystem as any });
          for await (const event of streamResp) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              res.write(`data: ${JSON.stringify({ content: event.delta.text, agent: agentId, agentName: agent.name })}\n\n`);
            }
          }
        } else {
          const streamResp = await openai.chat.completions.create({ model: agent.model, max_completion_tokens: maxTokens, messages: [{ role: "system" as const, content: agent.systemPrompt }, ...messages] as Parameters<typeof openai.chat.completions.create>[0]["messages"], stream: true });
          for await (const chunk of streamResp) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) res.write(`data: ${JSON.stringify({ content: delta, agent: agentId, agentName: agent.name })}\n\n`);
          }
        }
        res.write(`data: ${JSON.stringify({ done: true, agent: agentId, agentName: agent.name, model: agent.model, provider: agent.provider })}\n\n`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Agent inference failed";
        res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      }
      res.end(); return;
    }

    let content = "";
    const startTime = Date.now();
    if (agent.provider === "anthropic") {
      const nonSystem = messages.filter(m => m.role !== "system");
      const result = await anthropic.messages.create({ model: agent.model, max_tokens: maxTokens, system: agent.systemPrompt, messages: nonSystem as any });
      content = result.content[0]?.type === "text" ? result.content[0].text : "";
    } else {
      const result = await openai.chat.completions.create({ model: agent.model, max_completion_tokens: maxTokens, messages: [{ role: "system" as const, content: agent.systemPrompt }, ...messages] as Parameters<typeof openai.chat.completions.create>[0]["messages"] });
      content = result.choices[0]?.message?.content ?? "";
    }
    sendSuccess(res, { content, agent: agentId, agentName: agent.name, model: agent.model, provider: agent.provider, latencyMs: Date.now() - startTime, generatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Domain agent inference failed"); }
});

router.post("/intelligence/ai/campaign-copy", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { topic, tone = "professional", format = "full-campaign", brand } = req.body as { topic: string; tone?: string; format?: string; brand?: string };
    if (!topic) { sendError(res, "Topic is required", 400); return; }
    const toneMap: Record<string, string> = { corporate: "formal, authoritative, enterprise-grade", professional: "polished, credible, sophisticated", conversational: "warm, approachable, human", bold: "provocative, disruptive, high-energy" };
    const toneDesc = toneMap[tone] || toneMap.professional;
    const systemPrompt = DOMAIN_AGENTS.creative!.systemPrompt;
    const userPrompt = `Generate a complete ${format} campaign for: "${topic}"\n\nTone: ${toneDesc}${brand ? `\nBrand: ${brand}` : ""}\n\nProvide:\n1. Campaign Headline (punchy, memorable)\n2. Subheadline (supporting context)\n3. Body Copy (2-3 compelling paragraphs)\n4. CTA (strong call-to-action)\n5. Social Media Variants (3 posts for LinkedIn, Twitter/X, Instagram)\n6. Email Subject Line + Preview Text\n7. Brand Voice Notes\n\nFormat as structured sections with clear headers.`;
    res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.setHeader("X-Accel-Buffering", "no"); res.flushHeaders();
    const stream = await openai.chat.completions.create({ model: "gpt-5.2", max_completion_tokens: 2048, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], stream: true });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true, model: "gpt-5.2", provider: "openai" })}\n\n`);
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Campaign copy generation failed";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

router.post("/intelligence/ai/risk-assessment", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { context, frameworks = ["NIST CSF", "ISO 27001", "SOC 2"], dimension } = req.body as { context?: string; frameworks?: string[]; dimension?: string };
    const systemPrompt = DOMAIN_AGENTS.compliance!.systemPrompt;
    const userPrompt = `Perform a comprehensive organizational readiness and risk assessment.\n\n${context ? `Organization Context: ${context}` : ""}\n${dimension ? `Focus Dimension: ${dimension}` : ""}\nApplicable Frameworks: ${frameworks.join(", ")}\n\nProvide:\n1. Executive Summary (2-3 sentences)\n2. Readiness Score by dimension (Cybersecurity, Cloud Infrastructure, Data Governance, AI/ML Maturity, Compliance, Operations) — each scored 0-100\n3. Top 5 Risk Factors with probability and impact\n4. Key Gaps vs ${frameworks[0]} requirements\n5. Priority Recommendations (ranked by impact/effort)\n6. 90-Day Action Plan\n\nUse precise language with specific control references where applicable.`;
    const startTime = Date.now();
    const result = await anthropic.messages.create({ model: "claude-sonnet-4-6", max_tokens: 3000, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] });
    const content = result.content[0]?.type === "text" ? result.content[0].text : "";
    sendSuccess(res, { assessment: content, frameworks, model: "claude-sonnet-4-6", provider: "anthropic", latencyMs: Date.now() - startTime, generatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Risk assessment failed"); }
});

router.post("/intelligence/ai/advisory", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { messages, context } = req.body as { messages: Array<{ role: "user" | "assistant"; content: string }>; context?: string };
    if (!messages || !Array.isArray(messages)) { sendError(res, "Messages are required", 400); return; }
    const systemPrompt = DOMAIN_AGENTS.strategic!.systemPrompt + (context ? `\n\nClient Context: ${context}` : "");
    res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.setHeader("X-Accel-Buffering", "no"); res.flushHeaders();
    const stream = anthropic.messages.stream({ model: "claude-sonnet-4-6", max_tokens: 2048, system: systemPrompt, messages: messages as any });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true, model: "claude-sonnet-4-6", provider: "anthropic" })}\n\n`);
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Advisory response failed";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

router.post("/intelligence/ai/ticket-triage", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { subject, description, client, category } = req.body as { subject: string; description?: string; client?: string; category?: string };
    if (!subject) { sendError(res, "Ticket subject is required", 400); return; }
    const systemPrompt = DOMAIN_AGENTS.msp!.systemPrompt;
    const userPrompt = `Triage this IT support ticket:\n\nSubject: ${subject}\n${client ? `Client: ${client}` : ""}\n${category ? `Category: ${category}` : ""}\n${description ? `Description: ${description}` : ""}\n\nProvide:\n1. Priority: critical/high/medium/low — with justification\n2. Estimated Resolution Time\n3. Recommended Assignee Type (network specialist, security analyst, desktop support, etc.)\n4. SLA Risk: on-track/at-risk/breach-likely\n5. Root Cause Hypothesis (2-3 most likely causes)\n6. Immediate Actions (first 3 steps)\n7. Similar Incidents Pattern (if this looks like a pattern)\n\nBe concise and action-oriented.`;
    const startTime = Date.now();
    const result = await openai.chat.completions.create({ model: "gpt-5.2", max_completion_tokens: 800, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] });
    const content = result.choices[0]?.message?.content ?? "";
    sendSuccess(res, { triage: content, subject, model: "gpt-5.2", provider: "openai", latencyMs: Date.now() - startTime, generatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Ticket triage failed"); }
});

router.post("/intelligence/ai/readiness-summary", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { scores, topGaps } = req.body as { scores?: Record<string, number>; topGaps?: string[] };
    const systemPrompt = DOMAIN_AGENTS.compliance!.systemPrompt;
    const scoresText = scores ? Object.entries(scores).map(([k, v]) => `${k}: ${v}%`).join(", ") : "Cybersecurity: 82%, Cloud: 78%, Data Gov: 64%, AI/ML: 71%, Compliance: 76%, Operations: 80%";
    const userPrompt = `Generate an executive readiness summary for this organization:\n\nCurrent Scores: ${scoresText}\n${topGaps ? `Top Gaps: ${topGaps.join(", ")}` : ""}\n\nProvide a concise (3-4 paragraph) executive summary that:\n1. Highlights current strengths and positioning vs industry benchmarks\n2. Identifies the 2-3 most critical improvement areas\n3. Projects where scores could reach in 6 months with focused effort\n4. Provides specific, actionable recommendations ranked by ROI\n\nUse professional board-level language. Be specific about numbers and timelines.`;
    res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); res.setHeader("X-Accel-Buffering", "no"); res.flushHeaders();
    const stream = anthropic.messages.stream({ model: "claude-sonnet-4-6", max_tokens: 1500, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true, model: "claude-sonnet-4-6", provider: "anthropic" })}\n\n`);
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Summary generation failed";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

router.post("/intelligence/ai/dark-vessel-analysis", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { vessel, aiGapHours, behaviorPatterns, lastKnownPosition } = req.body as { vessel?: string; aiGapHours?: number; behaviorPatterns?: string[]; lastKnownPosition?: string };
    const systemPrompt = DOMAIN_AGENTS.maritime!.systemPrompt;
    const userPrompt = `Analyze this potential dark vessel (AIS gap detected):\n\n${vessel ? `Vessel: ${vessel}` : "Unknown vessel"}\nAIS Gap Duration: ${aiGapHours ?? 24} hours\n${lastKnownPosition ? `Last Known Position: ${lastKnownPosition}` : ""}\n${behaviorPatterns?.length ? `Behavior Patterns: ${behaviorPatterns.join(", ")}` : ""}\n\nPerform Windward-grade dark vessel analysis:\n1. Risk Assessment (1-10 scale) with justification\n2. Most Likely Cause of AIS Gap (sanctions evasion/technical failure/piracy/deception)\n3. Probable Position Estimate using dead reckoning\n4. Cross-reference with sanctioned vessel patterns\n5. Recommended Actions (flag authority notification, satellite tracking, port alert)\n6. Confidence Level and data gaps\n\nUse IMCO and OFAC screening terminology.`;
    const startTime = Date.now();
    const result = await anthropic.messages.create({ model: "claude-sonnet-4-6", max_tokens: 1500, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] });
    const content = result.content[0]?.type === "text" ? result.content[0].text : "";
    sendSuccess(res, { analysis: content, vessel, aiGapHours, model: "claude-sonnet-4-6", provider: "anthropic", latencyMs: Date.now() - startTime, generatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Dark vessel analysis failed"); }
});

router.post("/intelligence/ai/threat-triage", aiRateLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { threat, cveIds, affectedSystems, severity } = req.body as { threat?: string; cveIds?: string[]; affectedSystems?: string[]; severity?: string };
    const systemPrompt = DOMAIN_AGENTS.security!.systemPrompt;
    const userPrompt = `Perform autonomous incident triage for this security threat:\n\n${threat ? `Threat Description: ${threat}` : ""}\n${severity ? `Reported Severity: ${severity}` : ""}\n${cveIds?.length ? `CVE IDs: ${cveIds.join(", ")}` : ""}\n${affectedSystems?.length ? `Affected Systems: ${affectedSystems.join(", ")}` : ""}\n\nGenerate a CrowdStrike Charlotte-grade triage response:\n1. Confirmed Severity (CRITICAL/HIGH/MEDIUM/LOW) with CVSS score\n2. MITRE ATT&CK Mapping (Tactic + Technique IDs)\n3. Blast Radius Assessment\n4. Immediate Containment Actions (first 15 minutes)\n5. Remediation Playbook (prioritized steps)\n6. Executive Briefing (2-3 sentences for leadership)\n7. Estimated Mean Time to Remediate\n\nBe precise, tactical, and time-sensitive.`;
    const startTime = Date.now();
    const result = await anthropic.messages.create({ model: "claude-sonnet-4-6", max_tokens: 2000, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] });
    const content = result.content[0]?.type === "text" ? result.content[0].text : "";
    sendSuccess(res, { triage: content, model: "claude-sonnet-4-6", provider: "anthropic", latencyMs: Date.now() - startTime, generatedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Threat triage failed"); }
});

export default router;
