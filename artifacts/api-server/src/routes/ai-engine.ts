import { Router } from "express";
import { logger } from "../lib/logger";
import {
  routeModel,
  getRouteConfig,
  getModelSlots,
  chatCompletionWithFallback,
  structuredCompletion,
  validateActionDecision,
  validateRiskDecision,
  validateTriageDecision,
  validateExtractedEntities,
  safeFallbackDecision,
  ALLOY_TOOL_DEFINITIONS,
  executeToolCall,
  checkToolPolicy,
  alloyRetrieval,
  runEvals,
  GOLDEN_SET,
  type HFChatMessage,
  type RouteClass,
  type ActionDecision,
  type TriageDecision,
  type ExtractedEntities,
} from "@workspace/ai-engine";

const router = Router();
const auditLog: Array<Record<string, unknown>> = [];
const MAX_AUDIT_LOG = 500;

function writeAudit(entry: Record<string, unknown>): void {
  auditLog.unshift({ ...entry, timestamp: new Date().toISOString() });
  if (auditLog.length > MAX_AUDIT_LOG) auditLog.length = MAX_AUDIT_LOG;
}

router.get("/ai/health", (_req, res) => {
  const config = getRouteConfig();
  const token = process.env["HF_TOKEN"] || process.env["HUGGINGFACE_API_KEY"];
  res.json({
    status: token ? "configured" : "no_token",
    provider: config.config.executionMode,
    models: config.models,
    routes: Object.keys(config.routes),
    retrieval: alloyRetrieval.getStats(),
    config: {
      structuredOutputs: config.config.useStructuredOutputs,
      functionCalling: config.config.useFunctionCalling,
      streaming: config.config.enableStreaming,
      executionMode: config.config.executionMode,
      approvalForHighRisk: config.config.requireApprovalForHighRisk,
    },
    auditLogSize: auditLog.length,
  });
});

router.get("/ai/models", (_req, res) => {
  const slots = getModelSlots();
  const config = getRouteConfig();
  res.json({
    slots,
    routes: config.routes,
    provider: process.env["HF_PROVIDER"] || "huggingface",
    tokenConfigured: !!(process.env["HF_TOKEN"] || process.env["HUGGINGFACE_API_KEY"]),
  });
});

router.post("/ai/respond", async (req, res) => {
  const start = Date.now();
  try {
    const { messages, model, maxTokens, routeClass } = req.body as {
      messages?: Array<{ role: string; content: string }>;
      model?: string;
      maxTokens?: number;
      routeClass?: RouteClass;
    };

    if (!messages?.length) {
      res.status(400).json({ error: "messages array required" });
      return;
    }

    const route = routeModel(routeClass || "reasoning", { model, maxTokens });
    const chatMessages: HFChatMessage[] = [
      {
        role: "system",
        content: "You are Alloy, the AI execution fabric for Lyte — SZL Holdings' business observability platform. Produce structured, actionable intelligence. When the context demands a decision, provide a recommended action with confidence, evidence, and approval requirements. Never return a naked paragraph where a decision object is needed.",
      },
      ...messages.map(m => ({ role: m.role as HFChatMessage["role"], content: m.content })),
    ];

    const completion = await chatCompletionWithFallback(chatMessages, route);

    writeAudit({
      endpoint: "respond",
      model: completion.model,
      provider: completion.provider,
      latencyMs: completion.latencyMs,
      tokenUsage: completion.usage,
      inputLength: messages.map(m => m.content).join("").length,
    });

    res.json({
      content: completion.content,
      model: completion.model,
      provider: completion.provider,
      usage: completion.usage,
      latencyMs: completion.latencyMs,
      finishReason: completion.finishReason,
    });
  } catch (err) {
    logger.error({ err }, "AI respond error");
    res.status(500).json({ error: "AI inference failed", fallback: safeFallbackDecision(err instanceof Error ? err.message : "Unknown error") });
  }
});

router.post("/ai/triage", async (req, res) => {
  try {
    const { input, context } = req.body as { input?: string; context?: string };
    if (!input) { res.status(400).json({ error: "input required" }); return; }

    const route = routeModel("triage");
    const messages: HFChatMessage[] = [
      {
        role: "system",
        content: `You are Alloy's triage engine. Analyze the input and produce a structured triage decision as JSON with these fields:
- priority: "P0" | "P1" | "P2" | "P3" | "P4"
- urgency: "immediate" | "urgent" | "standard" | "deferred"
- category: string (e.g. "security", "infrastructure", "compliance", "maritime", "financial")
- subcategory: string or null
- routeTo: string (team or role to handle this)
- routeReason: string
- summary: string (1-2 sentence summary)
- keyEntities: array of {type, value, confidence}
- suggestedActions: array of {action, reason, confidence}
- requiresHumanReview: boolean
- confidence: number 0-1`,
      },
      { role: "user", content: context ? `Context: ${context}\n\nInput: ${input}` : input },
    ];

    const { result, raw, completion } = await structuredCompletion<TriageDecision>(messages, route, validateTriageDecision);

    writeAudit({
      endpoint: "triage",
      model: completion.model,
      provider: completion.provider,
      latencyMs: completion.latencyMs,
      priority: result.priority,
      routeTo: result.routeTo,
      confidence: result.confidence,
      rawOutput: raw.slice(0, 1000),
    });

    res.json({ decision: result, model: completion.model, latencyMs: completion.latencyMs });
  } catch (err) {
    logger.error({ err }, "AI triage error");
    res.status(500).json({
      error: "Triage failed",
      fallback: {
        priority: "P2",
        urgency: "standard",
        category: "unknown",
        routeTo: "operations",
        summary: "Automated triage unavailable — manual review required",
        requiresHumanReview: true,
        confidence: 0,
      },
    });
  }
});

router.post("/ai/extract", async (req, res) => {
  try {
    const { input, entityTypes } = req.body as { input?: string; entityTypes?: string[] };
    if (!input) { res.status(400).json({ error: "input required" }); return; }

    const route = routeModel("extraction");
    const messages: HFChatMessage[] = [
      {
        role: "system",
        content: `You are Alloy's entity extraction engine. Extract structured entities from the input. Return JSON with:
- entities: array of {type, value, confidence, context, normalizedValue}
  Types: ${entityTypes?.join(", ") || "person, organization, location, asset, vulnerability, indicator, date, amount, reference"}
- relationships: array of {from, to, relationType, confidence}
- summary: brief summary of extracted information
- confidence: overall confidence 0-1`,
      },
      { role: "user", content: input },
    ];

    const { result, completion } = await structuredCompletion<ExtractedEntities>(messages, route, validateExtractedEntities);

    writeAudit({ endpoint: "extract", model: completion.model, latencyMs: completion.latencyMs, entityCount: result.entities.length });

    res.json({ result, model: completion.model, latencyMs: completion.latencyMs });
  } catch (err) {
    logger.error({ err }, "AI extract error");
    res.status(500).json({ error: "Extraction failed", fallback: { entities: [], relationships: [], summary: "Extraction unavailable", confidence: 0 } });
  }
});

router.post("/ai/plan", async (req, res) => {
  try {
    const { objective, context, constraints } = req.body as { objective?: string; context?: string; constraints?: string[] };
    if (!objective) { res.status(400).json({ error: "objective required" }); return; }

    const route = routeModel("planning");
    const messages: HFChatMessage[] = [
      {
        role: "system",
        content: `You are Alloy's planning engine. Create a multi-step execution plan. Return JSON with:
- action: primary recommended action
- actionType: "approve" | "escalate" | "defer" | "route" | "close" | "investigate"
- confidence: 0-1
- evidence: array of {source, sourceType, content, relevanceScore}
- impactedOwner: who is affected (string or null)
- approvalRequired: boolean
- approvalLevel: "none" | "operator" | "manager" | "executive"
- deadline: ISO date string or null
- sla: string or null
- reasoning: detailed reasoning
- alternatives: array of {action, confidence, tradeoff}

Consider constraints: ${constraints?.join("; ") || "none specified"}`,
      },
      { role: "user", content: context ? `Context: ${context}\n\nObjective: ${objective}` : objective },
    ];

    const { result, raw, completion } = await structuredCompletion<ActionDecision>(messages, route, validateActionDecision);

    writeAudit({
      endpoint: "plan",
      model: completion.model,
      latencyMs: completion.latencyMs,
      actionType: result.actionType,
      approvalRequired: result.approvalRequired,
      confidence: result.confidence,
      rawOutput: raw.slice(0, 1000),
    });

    res.json({ plan: result, model: completion.model, latencyMs: completion.latencyMs });
  } catch (err) {
    logger.error({ err }, "AI plan error");
    res.status(500).json({ error: "Planning failed", fallback: safeFallbackDecision(err instanceof Error ? err.message : "Unknown error") });
  }
});

router.post("/ai/retrieve", async (req, res) => {
  try {
    const { query, topK, method } = req.body as { query?: string; topK?: number; method?: "semantic" | "keyword" | "hybrid" };
    if (!query) { res.status(400).json({ error: "query required" }); return; }

    const k = Math.min(topK || 12, 50);
    const result = alloyRetrieval.retrieveHybrid(query, null, k);
    const evidence = alloyRetrieval.toEvidenceItems(result.chunks);

    res.json({
      chunks: result.chunks.map(c => ({
        id: c.id,
        content: c.content.slice(0, 500),
        source: c.source,
        sourceType: c.sourceType,
        score: c.score,
        matchType: c.matchType,
      })),
      evidence,
      query: result.query,
      method: result.method,
      totalIndexed: result.totalIndexed,
      latencyMs: result.latencyMs,
    });
  } catch (err) {
    logger.error({ err }, "AI retrieve error");
    res.status(500).json({ error: "Retrieval failed", chunks: [], evidence: [] });
  }
});

router.post("/ai/tools/preview", async (req, res) => {
  try {
    const { toolName, arguments: args } = req.body as { toolName?: string; arguments?: Record<string, unknown> };
    if (!toolName) { res.status(400).json({ error: "toolName required" }); return; }

    const policy = checkToolPolicy(toolName, args || {});
    const toolDef = ALLOY_TOOL_DEFINITIONS.find(t => t.function.name === toolName);

    res.json({
      toolName,
      exists: !!toolDef,
      definition: toolDef?.function || null,
      policy: {
        allowed: policy.allowed,
        requiresApproval: policy.requiresApproval,
        reason: policy.reason,
      },
      dryRun: true,
      proposedAction: { tool: toolName, args: args || {} },
    });
  } catch (err) {
    logger.error({ err }, "AI tools preview error");
    res.status(500).json({ error: "Tool preview failed" });
  }
});

router.post("/ai/tools/execute", async (req, res) => {
  try {
    const { toolName, arguments: args, calledBy } = req.body as {
      toolName?: string;
      arguments?: Record<string, unknown>;
      calledBy?: string;
    };
    if (!toolName) { res.status(400).json({ error: "toolName required" }); return; }

    const result = await executeToolCall(toolName, args || {}, calledBy || "api");

    writeAudit({
      endpoint: "tools/execute",
      toolName,
      success: result.success,
      auditEntry: result.auditEntry,
    });

    res.json(result);
  } catch (err) {
    logger.error({ err }, "AI tools execute error");
    res.status(500).json({ error: "Tool execution failed" });
  }
});

router.get("/ai/audit", (_req, res) => {
  const limit = Math.min(parseInt(String(_req.query.limit) || "50", 10), 200);
  const offset = parseInt(String(_req.query.offset) || "0", 10);
  res.json({
    total: auditLog.length,
    offset,
    limit,
    entries: auditLog.slice(offset, offset + limit),
  });
});

router.get("/ai/tools", (_req, res) => {
  res.json({
    tools: ALLOY_TOOL_DEFINITIONS.map(t => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
      policy: checkToolPolicy(t.function.name, {}),
    })),
    executionMode: process.env["AI_EXECUTION_MODE"] || "propose_only",
    approvalRequired: (process.env["AI_REQUIRE_APPROVAL_FOR_HIGH_RISK"] ?? "true") === "true",
  });
});

router.post("/ai/evals/run", async (req, res) => {
  try {
    const { categories, testIds } = req.body as { categories?: string[]; testIds?: string[] };

    const report = await runEvals(
      async (input, category) => {
        const route = routeModel(category === "risk_extraction" ? "reasoning" : category === "owner_assignment" ? "triage" : "reasoning");
        const messages: HFChatMessage[] = [
          { role: "system", content: "You are Alloy's AI engine. Respond with valid JSON matching the required schema." },
          { role: "user", content: input || "Generate a safe fallback response." },
        ];
        try {
          const completion = await chatCompletionWithFallback(messages, route);
          let parsed: Record<string, unknown>;
          try {
            const match = completion.content.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : {};
          } catch {
            parsed = {};
          }
          return { output: parsed, model: completion.model, latencyMs: completion.latencyMs };
        } catch {
          return { output: safeFallbackDecision("eval-error") as unknown as Record<string, unknown>, model: "fallback", latencyMs: 0 };
        }
      },
      { categories, testIds },
    );

    res.json(report);
  } catch (err) {
    logger.error({ err }, "AI evals error");
    res.status(500).json({ error: "Evaluation run failed" });
  }
});

router.get("/ai/evals/golden-set", (_req, res) => {
  res.json({
    total: GOLDEN_SET.length,
    byCategory: GOLDEN_SET.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    tests: GOLDEN_SET.map(t => ({ id: t.id, category: t.category, inputPreview: t.input.slice(0, 100), assertionCount: t.assertions.length })),
  });
});

router.post("/ai/retrieval/ingest", async (req, res) => {
  try {
    const { content, source, sourceType, metadata } = req.body as {
      content?: string;
      source?: string;
      sourceType?: string;
      metadata?: Record<string, unknown>;
    };
    if (!content || !source) { res.status(400).json({ error: "content and source required" }); return; }

    const chunks = alloyRetrieval.ingest(content, source, (sourceType || "playbook") as any, metadata);
    res.json({ ingested: chunks.length, source, stats: alloyRetrieval.getStats() });
  } catch (err) {
    logger.error({ err }, "AI retrieval ingest error");
    res.status(500).json({ error: "Ingestion failed" });
  }
});

export default router;
