import { Router, type IRouter } from "express";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { gatewayInfer, getGatewayStatus, isValidStrategy, isValidProvider } from "../lib/ai-gateway";
import type { RoutingStrategy } from "../lib/ai-gateway";
import { inferenceTelemetry } from "../lib/inference-telemetry";
import type { InferenceProvider } from "../lib/inference-telemetry";
import { providerHealth } from "../lib/provider-health";
import { getRegistrySummary, getAllModelCards, getModelCard, getAllAgentIds } from "../lib/model-registry";
import { orchestrate, getOrchestratorCapabilities } from "../lib/multi-agent-orchestrator";
import type { OrchestrationDepth } from "../lib/multi-agent-orchestrator";
import { executePipeline, listPipelines, getPipelineConfig } from "../lib/intelligence-pipelines";
import type { ChatMessage } from "@workspace/services";
import type { Request, Response } from "express";

const VALID_DEPTHS = new Set<OrchestrationDepth>(["shallow", "standard", "deep"]);

function isValidDepth(d: string): d is OrchestrationDepth {
  return VALID_DEPTHS.has(d as OrchestrationDepth);
}

const nimbusRouter: IRouter = Router();

nimbusRouter.get("/nimbus/health", (_req, res) => {
  res.json({ service: "nimbus", status: "ok", version: "2.0.0", timestamp: new Date().toISOString() });
});

nimbusRouter.get("/nimbus/status", (_req, res) => {
  try {
    const gateway = getGatewayStatus();
    const health = providerHealth.getSummary();
    const registry = getRegistrySummary();
    const telemetry = inferenceTelemetry.getSummary();

    sendSuccess(res, {
      service: "nimbus",
      version: "2.0.0",
      gateway,
      providerHealth: health,
      registry: { totalAgents: registry.agents.length, freshness: registry.freshness },
      telemetry: {
        totalInferences: telemetry.totalInferences,
        totalTokens: telemetry.totalTokens,
        avgLatencyMs: telemetry.avgLatencyMs,
        successRate: telemetry.successRate,
        throughputPerMinute: telemetry.throughputPerMinute,
      },
    });
  } catch (err) { handleRouteError(res, err, "Failed to get Nimbus status"); }
});

nimbusRouter.post("/nimbus/gateway/infer", authMiddleware(), async (req, res) => {
  try {
    const { messages, model, maxTokens, agentId, domain, preferredProvider, strategy, timeoutMs, maxRetries } = req.body as {
      messages?: ChatMessage[];
      model?: string;
      maxTokens?: number;
      agentId?: string;
      domain?: string;
      preferredProvider?: string;
      strategy?: string;
      timeoutMs?: number;
      maxRetries?: number;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      sendError(res, "messages array is required", 400);
      return;
    }

    if (strategy && !isValidStrategy(strategy)) {
      sendError(res, `Invalid strategy "${strategy}". Valid: fastest, cheapest, preferred, fallback`, 400);
      return;
    }

    if (preferredProvider && !isValidProvider(preferredProvider)) {
      sendError(res, `Invalid provider "${preferredProvider}". Valid: openai, anthropic, replit-proxy, gemini, huggingface`, 400);
      return;
    }

    const validatedStrategy: RoutingStrategy | undefined = strategy && isValidStrategy(strategy) ? strategy : undefined;
    const validatedProvider: InferenceProvider | undefined = preferredProvider && isValidProvider(preferredProvider) ? preferredProvider : undefined;

    const response = await gatewayInfer({
      messages,
      model,
      maxTokens,
      agentId: agentId ?? "api-caller",
      domain: domain ?? "general",
      preferredProvider: validatedProvider,
      strategy: validatedStrategy,
      timeoutMs,
      maxRetries,
    });

    sendSuccess(res, response);
  } catch (err) { handleRouteError(res, err, "Gateway inference failed"); }
});

nimbusRouter.get("/nimbus/gateway/status", (_req, res) => {
  try {
    sendSuccess(res, getGatewayStatus());
  } catch (err) { handleRouteError(res, err, "Failed to get gateway status"); }
});

nimbusRouter.get("/nimbus/registry", (_req, res) => {
  try {
    sendSuccess(res, getRegistrySummary());
  } catch (err) { handleRouteError(res, err, "Failed to get registry"); }
});

nimbusRouter.get("/nimbus/registry/models", (_req, res) => {
  try {
    sendSuccess(res, getAllModelCards());
  } catch (err) { handleRouteError(res, err, "Failed to list model cards"); }
});

nimbusRouter.get("/nimbus/registry/models/:agentId", (req, res) => {
  try {
    const agentId = req.params.agentId as string;
    const knownAgents = getAllAgentIds();
    if (!knownAgents.includes(agentId)) {
      sendError(res, "Model not found", 404);
      return;
    }
    const card = getModelCard(agentId);
    sendSuccess(res, card);
  } catch (err) { handleRouteError(res, err, "Failed to get model card"); }
});

nimbusRouter.get("/nimbus/telemetry", (req, res) => {
  try {
    const windowMs = parseInt(req.query.window as string) || 3600000;
    sendSuccess(res, inferenceTelemetry.getSummary(windowMs));
  } catch (err) { handleRouteError(res, err, "Failed to get telemetry"); }
});

nimbusRouter.get("/nimbus/telemetry/providers", (req, res) => {
  try {
    const windowMs = parseInt(req.query.window as string) || 3600000;
    sendSuccess(res, inferenceTelemetry.getProviderStats(windowMs));
  } catch (err) { handleRouteError(res, err, "Failed to get provider stats"); }
});

nimbusRouter.get("/nimbus/telemetry/models", (req, res) => {
  try {
    const windowMs = parseInt(req.query.window as string) || 3600000;
    sendSuccess(res, inferenceTelemetry.getModelStats(windowMs));
  } catch (err) { handleRouteError(res, err, "Failed to get model stats"); }
});

nimbusRouter.get("/nimbus/telemetry/records", (req, res) => {
  try {
    const windowMs = parseInt(req.query.window as string) || 3600000;
    const provider = req.query.provider as string | undefined;
    const agentId = req.query.agentId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const validatedProvider: InferenceProvider | undefined =
      provider && isValidProvider(provider) ? provider : undefined;

    sendSuccess(res, inferenceTelemetry.getRecords({ windowMs, provider: validatedProvider, agentId, limit }));
  } catch (err) { handleRouteError(res, err, "Failed to get telemetry records"); }
});

nimbusRouter.get("/nimbus/providers/health", (_req, res) => {
  try {
    sendSuccess(res, providerHealth.getSummary());
  } catch (err) { handleRouteError(res, err, "Failed to get provider health"); }
});

nimbusRouter.post("/nimbus/providers/:provider/reset", authMiddleware(), (req, res) => {
  try {
    const provider = req.params.provider as string;
    if (!isValidProvider(provider)) {
      sendError(res, `Invalid provider "${provider}". Valid: openai, anthropic, replit-proxy, gemini, huggingface`, 400);
      return;
    }
    providerHealth.reset(provider);
    sendSuccess(res, { provider, status: "reset" });
  } catch (err) { handleRouteError(res, err, "Failed to reset provider"); }
});

nimbusRouter.post("/nimbus/orchestrate", authMiddleware(), async (req, res) => {
  try {
    const { query, domains, depth, sessionId } = req.body as {
      query?: string;
      domains?: string[];
      depth?: string;
      sessionId?: string;
    };

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      sendError(res, "query is required", 400);
      return;
    }

    if (depth && !isValidDepth(depth)) {
      sendError(res, `Invalid depth "${depth}". Valid: shallow, standard, deep`, 400);
      return;
    }

    const validatedDepth: OrchestrationDepth | undefined =
      depth && isValidDepth(depth) ? depth : undefined;

    const result = await orchestrate({
      query: query.trim(),
      domains,
      depth: validatedDepth,
      sessionId,
    });

    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Orchestration failed"); }
});

nimbusRouter.get("/nimbus/orchestrate/capabilities", (_req, res) => {
  try {
    sendSuccess(res, getOrchestratorCapabilities());
  } catch (err) { handleRouteError(res, err, "Failed to get orchestrator capabilities"); }
});

nimbusRouter.get("/nimbus/pipelines", (_req, res) => {
  try {
    sendSuccess(res, listPipelines());
  } catch (err) { handleRouteError(res, err, "Failed to list pipelines"); }
});

nimbusRouter.get("/nimbus/pipelines/:pipelineId", (req, res) => {
  try {
    const config = getPipelineConfig(req.params.pipelineId as string);
    if (!config) { sendError(res, "Pipeline not found", 404); return; }
    sendSuccess(res, config);
  } catch (err) { handleRouteError(res, err, "Failed to get pipeline config"); }
});

nimbusRouter.post("/nimbus/pipelines/:pipelineId/execute", authMiddleware(), async (req, res) => {
  try {
    const pipelineId = req.params.pipelineId as string;
    const { input } = req.body as { input?: string };

    if (!input || typeof input !== "string" || input.trim().length === 0) {
      sendError(res, "input is required", 400);
      return;
    }

    const config = getPipelineConfig(pipelineId);
    if (!config) { sendError(res, "Pipeline not found", 404); return; }

    const result = await executePipeline(pipelineId, input.trim());
    sendSuccess(res, result);
  } catch (err) { handleRouteError(res, err, "Pipeline execution failed"); }
});

async function handleRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const { context, domain, depth } = req.body as {
      context?: string;
      domain?: string;
      depth?: string;
    };

    if (!context || typeof context !== "string" || context.trim().length === 0) {
      sendError(res, "context is required", 400);
      return;
    }

    if (depth && !isValidDepth(depth)) {
      sendError(res, `Invalid depth "${depth}". Valid: shallow, standard, deep`, 400);
      return;
    }

    const systemPrompt = `You are the Nimbus Recommendation Engine for the SZL Holdings platform. Given operational context, generate actionable recommendations.

Respond with a JSON array of recommendations. Each must have:
- "id": unique string
- "title": brief title
- "domain": relevant domain (vessels/firestorm/terra/lyte/inca/msp/dreamscape/general)
- "score": 0-100 priority score
- "confidence": 0-1 confidence level
- "severity": "critical" | "high" | "medium" | "low"
- "reasoning": 1-2 sentence explanation
- "recommended_action": specific action to take
- "estimated_impact": expected outcome
- "timeframe": "immediate" | "short-term" | "medium-term" | "long-term"

Generate 3-5 recommendations, prioritized by score. Return ONLY the JSON array.`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Domain: ${domain ?? "general"}\nDepth: ${depth ?? "standard"}\n\nContext:\n${context.trim()}` },
    ];

    const response = await gatewayInfer({
      messages,
      agentId: "nimbus-recommendation-engine",
      domain: domain ?? "general",
      strategy: "preferred",
      preferredProvider: "anthropic",
      maxTokens: 1500,
    });

    let recommendations: unknown[];
    try {
      const cleaned = response.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Response is not a non-empty JSON array");
      }
      const REQUIRED_FIELDS = ["id", "title", "score", "reasoning", "recommended_action"] as const;
      for (const rec of parsed) {
        if (typeof rec !== "object" || rec === null) throw new Error("Recommendation item is not an object");
        for (const field of REQUIRED_FIELDS) {
          if (!(field in rec)) throw new Error(`Missing required field: ${field}`);
        }
      }
      recommendations = parsed;
    } catch (parseErr) {
      logger.warn({ error: parseErr instanceof Error ? parseErr.message : String(parseErr) }, "Recommendation output validation failed — returning structured error");
      res.status(422).json({
        success: false,
        error: "AI response did not conform to expected recommendation schema",
        rawPreview: response.content.slice(0, 500),
        model: response.model,
        provider: response.provider,
      });
      return;
    }

    const telemetryRecord = inferenceTelemetry.getRecords({ limit: 1 })[0];
    const estimatedCost = telemetryRecord?.estimatedCostUsd ?? 0;

    sendSuccess(res, {
      recommendations,
      metadata: {
        model: response.model,
        provider: response.provider,
        latencyMs: response.routing.totalLatencyMs,
        telemetryId: response.telemetryId,
        estimatedCostUsd: estimatedCost,
        domain: domain ?? "general",
        depth: depth ?? "standard",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) { handleRouteError(res, err, "Recommendation generation failed"); }
}

nimbusRouter.post("/nimbus/recommendations", authMiddleware(), handleRecommendations);
nimbusRouter.post("/core/recommendations", authMiddleware(), handleRecommendations);

export default nimbusRouter;
