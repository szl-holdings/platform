import { logger } from "./logger";
import { gatewayInfer } from "./ai-gateway";
import { searchKnowledge } from "./rag-pipeline";
import { listTools, executeTool } from "./mastra/tool-registry";
import { listAgentCards, createTask, updateTaskStatus } from "./mastra/a2a";
import { recordLearningEvent } from "./adaptive-learning-recorder";
import type { AgentExecutionContext } from "./mastra/types";

export interface FourLaneRequest {
  query: string;
  agentId: string;
  domain: string;
  context?: Record<string, unknown>;
  runId?: string;
  userId?: string;
  enableRAG?: boolean;
  enableMCP?: boolean;
  enableA2A?: boolean;
  maxToolRounds?: number;
}

export interface LaneMetrics {
  ragLatencyMs?: number;
  ragSourcesFound?: number;
  mcpToolsDiscovered?: number;
  mcpToolsExecuted?: number;
  a2aDelegationsAttempted?: number;
  a2aDelegationsSucceeded?: number;
  llmLatencyMs?: number;
  totalOrchestrationMs?: number;
}

export interface FourLaneResult {
  response: string;
  lanesActivated: string[];
  metrics: LaneMetrics;
  ragContext?: string;
  toolResults?: Record<string, unknown>;
  delegationResults?: Array<{ agentId: string; response: string; latencyMs: number }>;
  tokensUsed: number;
  runId: string;
}

async function discoverMCPTools(domain: string): Promise<Array<{ name: string; description: string }>> {
  const allTools = listTools();
  const domainHints = domain.toLowerCase();

  const relevantTools = allTools.filter(t => {
    const combined = `${t.name} ${t.description}`.toLowerCase();
    return (
      combined.includes(domainHints) ||
      combined.includes("cross") ||
      combined.includes("portfolio") ||
      combined.includes("knowledge") ||
      t.name.includes("query") ||
      t.name.includes("search")
    );
  });

  return relevantTools.slice(0, 5).map(t => ({ name: t.name, description: t.description }));
}

async function pullRAGContext(query: string, domain: string): Promise<{ context: string; sourcesFound: number; latencyMs: number }> {
  const start = Date.now();
  try {
    const results = await searchKnowledge(query, { collection: domain, limit: 3 });

    const allResults = results.length === 0
      ? await searchKnowledge(query, { limit: 3 })
      : results;

    const context = allResults.length > 0
      ? allResults.map((r, i) => `[Context ${i + 1} — relevance ${(r.similarity * 100).toFixed(0)}%]\n${r.content.slice(0, 400)}`).join("\n\n")
      : "";

    return { context, sourcesFound: allResults.length, latencyMs: Date.now() - start };
  } catch (err) {
    logger.warn({ err, domain }, "RAG context pull failed");
    return { context: "", sourcesFound: 0, latencyMs: Date.now() - start };
  }
}

async function discoverA2AAgents(domain: string): Promise<Array<{ agentId: string; name: string; url: string; skills: string[] }>> {
  try {
    const cards = await listAgentCards();
    const relevant = cards.filter(c => {
      const allSkills = ((c.skills || []) as Array<{ id?: string; name?: string }>).map(s => s.id || "").join(" ");
      return c.description.toLowerCase().includes(domain) || allSkills.includes(domain);
    });
    return relevant.slice(0, 3).map(c => ({
      agentId: c.agentId,
      name: c.name,
      url: c.url || "",
      skills: ((c.skills || []) as Array<{ id?: string; name?: string }>).slice(0, 3).map(s => s.id || s.name || ""),
    }));
  } catch {
    return [];
  }
}

async function delegateToA2AAgent(
  clientAgentId: string,
  targetAgentId: string,
  targetUrl: string,
  query: string,
  runId: string
): Promise<{ response: string; latencyMs: number; taskId: string } | null> {
  const task = await createTask(clientAgentId, targetAgentId, { query, runId }, runId);
  const start = Date.now();

  if (!targetUrl) {
    await updateTaskStatus(task.taskId, "failed", undefined, "No URL configured for remote agent");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(`${targetUrl}/tasks/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.taskId, contextId: task.contextId, message: query }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const latencyMs = Date.now() - start;

    if (!resp.ok) {
      await updateTaskStatus(task.taskId, "failed", undefined, `HTTP ${resp.status}`);
      return null;
    }

    const data = await resp.json() as { response?: string; result?: string; output?: string };
    const response = data.response || data.result || data.output || "";
    await updateTaskStatus(task.taskId, "completed", { response });

    return { response, latencyMs, taskId: task.taskId };
  } catch (err) {
    const latencyMs = Date.now() - start;
    await updateTaskStatus(task.taskId, "failed", undefined, String(err));
    logger.warn({ err, targetAgentId, latencyMs }, "A2A delegation failed");
    return null;
  }
}

function needsMCPTool(query: string): { needed: boolean; hint: string } {
  const toolPatterns = [
    { pattern: /portfolio|metrics|stats|count/i, hint: "query_portfolio_metrics" },
    { pattern: /briefing|brief|executive|report/i, hint: "generate_executive_briefing" },
    { pattern: /knowledge|entities|graph/i, hint: "search_knowledge_graph" },
    { pattern: /cross.?domain|correlat/i, hint: "cross_domain_analysis" },
    { pattern: /delegate|agent.*task/i, hint: "delegate_to_agent" },
  ];
  for (const { pattern, hint } of toolPatterns) {
    if (pattern.test(query)) return { needed: true, hint };
  }
  return { needed: false, hint: "" };
}

function needsA2ADelegation(query: string, domain: string): boolean {
  const delegationPatterns = [
    /maritime|vessel|fleet|port/i,
    /threat|incident|security|cyber/i,
    /legal|contract|compliance/i,
    /property|real.?estate|listing/i,
  ];
  if (domain === "general" || domain === "szl") {
    return delegationPatterns.some(p => p.test(query));
  }
  return false;
}

export async function executeWithFourLanes(
  request: FourLaneRequest
): Promise<FourLaneResult> {
  const startTime = Date.now();
  const runId = request.runId || `4lane_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const lanesActivated: string[] = [];
  const metrics: LaneMetrics = {};
  let totalTokens = 0;

  const toolResults: Record<string, unknown> = {};
  const delegationResults: Array<{ agentId: string; response: string; latencyMs: number }> = [];
  let ragContextStr = "";

  logger.info({ runId, agentId: request.agentId, domain: request.domain }, "Four-lane coordinator: starting");

  const enableRAG = request.enableRAG !== false;
  const enableMCP = request.enableMCP !== false;
  const enableA2A = request.enableA2A !== false;

  let ragSourcesFound = 0;
  if (enableRAG) {
    lanesActivated.push("rag");
    const { context, sourcesFound, latencyMs } = await pullRAGContext(request.query, request.domain);
    ragContextStr = context;
    ragSourcesFound = sourcesFound;
    metrics.ragLatencyMs = latencyMs;
    metrics.ragSourcesFound = sourcesFound;

    if (sourcesFound > 0) {
      await recordLearningEvent({
        eventType: "rag_retrieval",
        agentId: request.agentId,
        domain: request.domain,
        runId,
        latencyMs,
        ragSourceCount: sourcesFound,
        successScore: sourcesFound > 0 ? 1.0 : 0.0,
        inputs: { query: request.query.slice(0, 200) },
      });
    }
  }

  let mcpToolsDiscovered = 0;
  let mcpToolsExecuted = 0;
  if (enableMCP) {
    const discoveredTools = await discoverMCPTools(request.domain);
    mcpToolsDiscovered = discoveredTools.length;
    metrics.mcpToolsDiscovered = mcpToolsDiscovered;

    if (mcpToolsDiscovered > 0) {
      lanesActivated.push("mcp");

      const { needed, hint } = needsMCPTool(request.query);
      if (needed && hint) {
        const mockContext: AgentExecutionContext = {
          runId,
          traceId: runId,
          agentId: request.agentId,
          domain: request.domain,
          threadId: `thread_${runId}`,
          metadata: request.context || {},
          delegateTo: async (_agentId: string, _task: string) => ({
            agentId: _agentId,
            response: "",
            toolsUsed: [],
            latencyMs: 0,
            traceId: runId,
          }),
          recall: async () => [],
          storeEntity: async () => {},
          emitTrace: async () => {},
        };

        try {
          const toolInput = hint === "query_portfolio_metrics"
            ? { metrics: ["apps", "agents"] }
            : hint === "cross_domain_analysis"
              ? { domains: ["maritime", "finance"], analysisType: "correlation", timeRangeHours: 24 }
              : {};

          const result = await executeTool(hint, toolInput, mockContext);
          if (!result.error) {
            toolResults[hint] = result.output;
            mcpToolsExecuted++;

            await recordLearningEvent({
              eventType: "tool_call",
              agentId: request.agentId,
              domain: request.domain,
              runId,
              toolsUsed: [hint],
              latencyMs: result.latencyMs,
              successScore: 1.0,
            });
          }
        } catch (err) {
          logger.warn({ err, tool: hint }, "Four-lane: MCP tool execution failed");
        }
      }

      metrics.mcpToolsExecuted = mcpToolsExecuted;
    }
  }

  let a2aDelegationsAttempted = 0;
  let a2aDelegationsSucceeded = 0;
  if (enableA2A && needsA2ADelegation(request.query, request.domain)) {
    const availableAgents = await discoverA2AAgents(request.domain);

    if (availableAgents.length > 0) {
      lanesActivated.push("a2a");
      const targetAgent = availableAgents[0]!;
      a2aDelegationsAttempted = 1;
      metrics.a2aDelegationsAttempted = 1;

      const delegationResult = await delegateToA2AAgent(
        request.agentId,
        targetAgent.agentId,
        targetAgent.url,
        request.query,
        runId
      );

      if (delegationResult) {
        delegationResults.push({
          agentId: targetAgent.agentId,
          response: delegationResult.response,
          latencyMs: delegationResult.latencyMs,
        });
        a2aDelegationsSucceeded = 1;
        metrics.a2aDelegationsSucceeded = 1;

        await recordLearningEvent({
          eventType: "a2a_delegation",
          agentId: request.agentId,
          domain: request.domain,
          runId,
          delegationCount: 1,
          successScore: 1.0,
          latencyMs: delegationResult.latencyMs,
          metadata: { targetAgent: targetAgent.agentId, taskId: delegationResult.taskId },
        });
      } else {
        metrics.a2aDelegationsSucceeded = 0;
        await recordLearningEvent({
          eventType: "a2a_delegation",
          agentId: request.agentId,
          domain: request.domain,
          runId,
          delegationCount: 1,
          successScore: 0.0,
          metadata: { targetAgent: targetAgent.agentId, reason: "delegation_failed" },
        });
      }
    }
  }

  lanesActivated.push("llm");
  const llmStart = Date.now();

  const systemPromptParts = [
    `You are ${request.agentId} — an expert AI agent operating in the ${request.domain} domain as part of SZL Holdings' Alloy intelligence platform.`,
  ];

  if (ragContextStr) {
    systemPromptParts.push(`\n\nRelevant knowledge context (from ${ragSourcesFound} sources):\n${ragContextStr}`);
  }

  if (Object.keys(toolResults).length > 0) {
    systemPromptParts.push(`\n\nMCP tool results:\n${JSON.stringify(toolResults, null, 2)}`);
  }

  if (request.context && Object.keys(request.context).length > 0) {
    systemPromptParts.push(`\n\nAdditional context: ${JSON.stringify(request.context)}`);
  }

  systemPromptParts.push("\n\nProvide a comprehensive, actionable response. Be specific, cite relevant context where available.");

  try {
    const response = await gatewayInfer({
      messages: [
        { role: "system", content: systemPromptParts.join("") },
        { role: "user", content: request.query },
      ],
      maxTokens: 1500,
      strategy: "fastest",
      agentId: request.agentId,
      domain: request.domain,
    });

    totalTokens = response.usage.totalTokens;
    metrics.llmLatencyMs = Date.now() - llmStart;
    metrics.totalOrchestrationMs = Date.now() - startTime;

    await recordLearningEvent({
      eventType: "agent_execution",
      agentId: request.agentId,
      domain: request.domain,
      runId,
      latencyMs: Date.now() - startTime,
      tokensUsed: totalTokens,
      toolsUsed: Object.keys(toolResults),
      delegationCount: a2aDelegationsSucceeded,
      successScore: 1.0,
      ragSourceCount: ragSourcesFound,
    });

    logger.info({
      runId,
      lanesActivated,
      totalMs: metrics.totalOrchestrationMs,
    }, "Four-lane coordinator: complete");

    return {
      response: response.content,
      lanesActivated,
      metrics,
      ragContext: ragContextStr || undefined,
      toolResults: Object.keys(toolResults).length > 0 ? toolResults : undefined,
      delegationResults: delegationResults.length > 0 ? delegationResults : undefined,
      tokensUsed: totalTokens,
      runId,
    };
  } catch (err) {
    logger.error({ err, runId }, "Four-lane coordinator: LLM inference failed");

    await recordLearningEvent({
      eventType: "agent_execution",
      agentId: request.agentId,
      domain: request.domain,
      runId,
      latencyMs: Date.now() - startTime,
      successScore: 0.0,
    });

    throw err;
  }
}
