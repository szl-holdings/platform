import { logger } from "./logger";
import { gatewayInfer, type GatewayRequest, type GatewayResponse } from "./ai-gateway";
import { pool } from "@szl-holdings/db";

export interface AgentConfig {
  agentId: string;
  name: string;
  domain: string;
  description: string | null;
  systemPrompt: string;
  model: string;
  provider: string;
  tools: string[];
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (input: Record<string, unknown>, context: AgentContext) => Promise<unknown>;
}

export interface AgentContext {
  agentId: string;
  domain: string;
  conversationId?: string;
  userId?: string;
  runId: string;
  parentRunId?: string;
  metadata: Record<string, unknown>;
}

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface ToolResult {
  toolCallId: string;
  name: string;
  output: unknown;
  error?: string;
}

export interface OrchestratorResult {
  runId: string;
  agentId: string;
  response: string;
  toolsUsed: string[];
  tokensUsed: number;
  latencyMs: number;
  model: string;
  provider: string;
  delegations: DelegationResult[];
}

interface DelegationResult {
  agentId: string;
  task: string;
  response: string;
  latencyMs: number;
}

const toolRegistry = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
  toolRegistry.set(tool.name, tool);
  logger.info({ tool: tool.name }, "Registered agent tool");
}

async function loadAgentConfig(agentId: string): Promise<AgentConfig | null> {
  try {
    const result = await pool.query(
      `SELECT agent_id, name, domain, description, system_prompt, model, provider, tools, temperature, max_tokens, enabled
       FROM ai_agent_configs WHERE agent_id = $1 AND enabled = TRUE`,
      [agentId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      agentId: row.agent_id,
      name: row.name,
      domain: row.domain,
      description: row.description,
      systemPrompt: row.system_prompt,
      model: row.model,
      provider: row.provider,
      tools: row.tools || [],
      temperature: row.temperature,
      maxTokens: row.max_tokens,
      enabled: row.enabled,
    };
  } catch (err) {
    logger.error({ err, agentId }, "Failed to load agent config");
    return null;
  }
}

export async function listAgents(): Promise<AgentConfig[]> {
  try {
    const result = await pool.query(
      `SELECT agent_id, name, domain, description, system_prompt, model, provider, tools, temperature, max_tokens, enabled
       FROM ai_agent_configs WHERE enabled = TRUE ORDER BY domain`
    );
    return result.rows.map(row => ({
      agentId: row.agent_id,
      name: row.name,
      domain: row.domain,
      description: row.description,
      systemPrompt: row.system_prompt,
      model: row.model,
      provider: row.provider,
      tools: row.tools || [],
      temperature: row.temperature,
      maxTokens: row.max_tokens,
      enabled: row.enabled,
    }));
  } catch (err) {
    logger.error({ err }, "Failed to list agents");
    return [];
  }
}

function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildToolDescriptions(toolNames: string[]): string {
  const descriptions: string[] = [];
  for (const name of toolNames) {
    const tool = toolRegistry.get(name);
    if (tool) {
      descriptions.push(`- ${tool.name}: ${tool.description}`);
    }
  }
  if (descriptions.length === 0) return "";
  return `\n\nAvailable tools:\n${descriptions.join("\n")}\n\nTo use a tool, respond with JSON in this format:\n{"tool": "tool_name", "input": {...}}\n\nAfter receiving tool results, synthesize them into your final response.`;
}

async function recordRun(
  runId: string,
  agentId: string,
  domain: string,
  status: string,
  startedAt: number,
  summary?: string,
  error?: string
): Promise<void> {
  try {
    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;
    await pool.query(
      `INSERT INTO agent_runs (run_id, agent_id, domain, status, started_at, completed_at, duration_ms, summary, error, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (run_id) DO UPDATE SET status = $4, completed_at = $6, duration_ms = $7, summary = $8, error = $9`,
      [runId, agentId, domain, status, startedAt, completedAt, durationMs, summary, error]
    );
  } catch (err) {
    logger.error({ err, runId }, "Failed to record agent run");
  }
}

async function saveMessage(
  conversationId: string,
  role: string,
  content: string,
  model?: string,
  provider?: string,
  tokensUsed?: number,
  latencyMs?: number
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO ai_messages (conversation_id, role, content, model, provider, tokens_used, latency_ms, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [conversationId, role, content, model, provider, tokensUsed, latencyMs]
    );
  } catch (err) {
    logger.error({ err, conversationId }, "Failed to save message");
  }
}

async function ensureConversation(conversationId: string, agentId: string, domain: string, userId?: string): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO ai_conversations (conversation_id, agent_id, domain, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (conversation_id) DO UPDATE SET updated_at = NOW()`,
      [conversationId, agentId, domain, userId]
    );
  } catch (err) {
    logger.error({ err, conversationId }, "Failed to ensure conversation");
  }
}

async function getConversationHistory(conversationId: string, limit = 20): Promise<AgentMessage[]> {
  try {
    const result = await pool.query(
      `SELECT role, content FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [conversationId, limit]
    );
    return result.rows.reverse().map(row => ({
      role: row.role as AgentMessage["role"],
      content: row.content,
    }));
  } catch {
    return [];
  }
}

function extractToolCall(content: string): ToolCall | null {
  const jsonMatch = content.match(/\{[\s\S]*"tool"\s*:\s*"[^"]+"/);
  if (!jsonMatch) return null;
  try {
    let jsonStr = jsonMatch[0];
    let braceCount = 0;
    for (let i = 0; i < content.length; i++) {
      if (i < jsonMatch.index!) continue;
      if (content[i] === "{") braceCount++;
      if (content[i] === "}") braceCount--;
      if (braceCount === 0) {
        jsonStr = content.slice(jsonMatch.index!, i + 1);
        break;
      }
    }
    const parsed = JSON.parse(jsonStr);
    if (parsed.tool && typeof parsed.tool === "string") {
      return {
        id: `tc_${Date.now()}`,
        name: parsed.tool,
        input: parsed.input || {},
      };
    }
  } catch {}
  return null;
}

export async function runAgent(
  agentId: string,
  userMessage: string,
  options: {
    conversationId?: string;
    userId?: string;
    context?: Record<string, unknown>;
    maxToolRounds?: number;
  } = {}
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const runId = generateRunId();
  const maxToolRounds = options.maxToolRounds ?? 3;

  const config = await loadAgentConfig(agentId);
  if (!config) {
    throw new Error(`Agent "${agentId}" not found or disabled`);
  }

  const conversationId = options.conversationId ?? `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await ensureConversation(conversationId, agentId, config.domain, options.userId);

  const history = options.conversationId ? await getConversationHistory(conversationId) : [];

  const toolDescriptions = buildToolDescriptions(config.tools);
  const systemPrompt = config.systemPrompt + toolDescriptions;

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  await saveMessage(conversationId, "user", userMessage);

  const toolsUsed: string[] = [];
  const delegations: DelegationResult[] = [];
  let totalTokens = 0;
  let finalResponse = "";
  let lastModel = config.model;
  let lastProvider = config.provider;

  for (let round = 0; round <= maxToolRounds; round++) {
    const request: GatewayRequest = {
      messages: messages as any,
      model: config.model,
      maxTokens: config.maxTokens,
      agentId: config.agentId,
      domain: config.domain,
      strategy: "fastest",
    };

    let gatewayResult: GatewayResponse;
    try {
      gatewayResult = await gatewayInfer(request);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Inference failed";
      await recordRun(runId, agentId, config.domain, "failed", startTime, undefined, errorMsg);
      throw err;
    }

    totalTokens += gatewayResult.usage.totalTokens;
    lastModel = gatewayResult.model;
    lastProvider = gatewayResult.provider;
    finalResponse = gatewayResult.content;

    const toolCall = extractToolCall(gatewayResult.content);
    if (!toolCall || round === maxToolRounds) {
      break;
    }

    const tool = toolRegistry.get(toolCall.name);
    if (!tool || !config.tools.includes(toolCall.name)) {
      messages.push({
        role: "assistant",
        content: gatewayResult.content,
      });
      messages.push({
        role: "user",
        content: `Tool "${toolCall.name}" is not available. Please provide your response without using that tool.`,
      });
      continue;
    }

    toolsUsed.push(toolCall.name);

    let toolOutput: unknown;
    const toolStart = Date.now();
    try {
      const context: AgentContext = {
        agentId: config.agentId,
        domain: config.domain,
        conversationId,
        userId: options.userId,
        runId,
        metadata: options.context || {},
      };
      toolOutput = await tool.handler(toolCall.input, context);

      await pool.query(
        `INSERT INTO ai_tool_executions (run_id, agent_id, tool_name, input, output, status, duration_ms, created_at)
         VALUES ($1, $2, $3, $4, $5, 'completed', $6, NOW())`,
        [runId, agentId, toolCall.name, JSON.stringify(toolCall.input), JSON.stringify(toolOutput), Date.now() - toolStart]
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Tool execution failed";
      toolOutput = { error: errorMsg };

      await pool.query(
        `INSERT INTO ai_tool_executions (run_id, agent_id, tool_name, input, status, duration_ms, error, created_at)
         VALUES ($1, $2, $3, $4, 'failed', $5, $6, NOW())`,
        [runId, agentId, toolCall.name, JSON.stringify(toolCall.input), Date.now() - toolStart, errorMsg]
      );
    }

    if (toolCall.name === "delegate_to_agent") {
      const delegation = toolOutput as DelegationResult;
      if (delegation && delegation.agentId) {
        delegations.push(delegation);
      }
    }

    messages.push({
      role: "assistant",
      content: gatewayResult.content,
    });
    messages.push({
      role: "user",
      content: `Tool result for "${toolCall.name}":\n${JSON.stringify(toolOutput, null, 2)}\n\nPlease incorporate this information into your response.`,
    });
  }

  const cleanResponse = finalResponse.replace(/\{[\s\S]*"tool"\s*:\s*"[^"]+[\s\S]*?\}/g, "").trim() || finalResponse;

  await saveMessage(conversationId, "assistant", cleanResponse, lastModel, lastProvider, totalTokens, Date.now() - startTime);
  await recordRun(runId, agentId, config.domain, "completed", startTime, cleanResponse.slice(0, 200));

  return {
    runId,
    agentId,
    response: cleanResponse,
    toolsUsed,
    tokensUsed: totalTokens,
    latencyMs: Date.now() - startTime,
    model: lastModel,
    provider: lastProvider,
    delegations,
  };
}

export async function orchestrateWorkflow(
  workflowSteps: { agentId: string; task: string; dependsOn?: number[] }[],
  options: { userId?: string; context?: Record<string, unknown> } = {}
): Promise<{ workflowId: string; results: OrchestratorResult[]; totalLatencyMs: number }> {
  const workflowId = `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  const results: OrchestratorResult[] = new Array(workflowSteps.length);
  const completed = new Set<number>();

  await pool.query(
    `INSERT INTO ai_workflows (workflow_id, name, description, steps, status, created_by, started_at, created_at)
     VALUES ($1, $2, $3, $4, 'running', $5, NOW(), NOW())`,
    [workflowId, "Multi-agent workflow", `${workflowSteps.length} steps`, JSON.stringify(workflowSteps), options.userId]
  );

  while (completed.size < workflowSteps.length) {
    const runnable: number[] = [];
    for (let i = 0; i < workflowSteps.length; i++) {
      if (completed.has(i)) continue;
      const deps = workflowSteps[i].dependsOn || [];
      if (deps.every(d => completed.has(d))) {
        runnable.push(i);
      }
    }

    if (runnable.length === 0) {
      throw new Error("Workflow deadlock: no runnable steps");
    }

    const stepResults = await Promise.allSettled(
      runnable.map(async (stepIndex) => {
        const step = workflowSteps[stepIndex];
        let enrichedTask = step.task;

        if (step.dependsOn) {
          for (const depIndex of step.dependsOn) {
            if (results[depIndex]) {
              enrichedTask += `\n\nContext from previous step (${workflowSteps[depIndex].agentId}): ${results[depIndex].response.slice(0, 500)}`;
            }
          }
        }

        const result = await runAgent(step.agentId, enrichedTask, {
          userId: options.userId,
          context: { ...options.context, workflowId, stepIndex },
        });

        return { stepIndex, result };
      })
    );

    for (const outcome of stepResults) {
      if (outcome.status === "fulfilled") {
        const { stepIndex, result } = outcome.value;
        results[stepIndex] = result;
        completed.add(stepIndex);
      } else {
        logger.error({ err: outcome.reason }, "Workflow step failed");
        throw outcome.reason;
      }
    }

    await pool.query(
      `UPDATE ai_workflows SET current_step = $1, results = $2, updated_at = NOW() WHERE workflow_id = $3`,
      [completed.size, JSON.stringify(results.filter(Boolean).map(r => ({ agentId: r.agentId, response: r.response.slice(0, 300) }))), workflowId]
    );
  }

  await pool.query(
    `UPDATE ai_workflows SET status = 'completed', completed_at = NOW(), results = $1 WHERE workflow_id = $2`,
    [JSON.stringify(results.map(r => ({ agentId: r.agentId, response: r.response.slice(0, 500), toolsUsed: r.toolsUsed }))), workflowId]
  );

  return {
    workflowId,
    results,
    totalLatencyMs: Date.now() - startTime,
  };
}

export function registerCrossplatformTools(): void {
  registerTool({
    name: "delegate_to_agent",
    description: "Delegate a task to a domain-specific agent. Use this to get specialized analysis from Vessels (maritime), Aegis (cybersecurity), Lyte (AI/ML ops), Terra (real estate), PRISM (legal), or Carlota Jo (consulting).",
    parameters: { agentId: "string", task: "string" },
    handler: async (input, context) => {
      const targetAgent = input.agentId as string;
      const task = input.task as string;
      const delegateStart = Date.now();
      const result = await runAgent(targetAgent, task, {
        userId: context.userId,
        context: { ...context.metadata, delegatedFrom: context.agentId, parentRunId: context.runId },
        maxToolRounds: 1,
      });
      return {
        agentId: targetAgent,
        task,
        response: result.response,
        latencyMs: Date.now() - delegateStart,
      } satisfies DelegationResult;
    },
  });

  registerTool({
    name: "cross_platform_query",
    description: "Query data across all SZL Holdings platforms. Returns aggregate statistics and recent activity from the database.",
    parameters: { query_type: "string (overview|metrics|recent_activity)" },
    handler: async (input) => {
      const queryType = (input.query_type as string) || "overview";
      try {
        if (queryType === "metrics") {
          const tableCount = await pool.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'");
          const agentCount = await pool.query("SELECT COUNT(*) as count FROM ai_agent_configs WHERE enabled = TRUE");
          const recentRuns = await pool.query("SELECT COUNT(*) as count FROM agent_runs WHERE created_at > NOW() - INTERVAL '24 hours'");
          return {
            totalTables: parseInt(tableCount.rows[0].count),
            activeAgents: parseInt(agentCount.rows[0].count),
            runsLast24h: parseInt(recentRuns.rows[0].count),
            platforms: ["Vessels", "Aegis", "Lyte", "Terra", "PRISM Counsel", "Carlota Jo", "SZL Holdings"],
          };
        }
        return { type: queryType, status: "operational", timestamp: new Date().toISOString() };
      } catch {
        return { error: "Query failed" };
      }
    },
  });

  registerTool({
    name: "executive_briefing",
    description: "Generate an executive briefing by querying the status of all platforms and summarizing key metrics.",
    parameters: { focus: "string (optional - maritime|security|ai|realestate|legal|all)" },
    handler: async (input) => {
      const focus = (input.focus as string) || "all";
      try {
        const agents = await pool.query("SELECT agent_id, name, domain FROM ai_agent_configs WHERE enabled = TRUE ORDER BY domain");
        const recentRuns = await pool.query(
          "SELECT agent_id, status, COUNT(*) as count FROM agent_runs WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY agent_id, status ORDER BY count DESC LIMIT 20"
        );
        const recentKnowledge = await pool.query(
          "SELECT domain, type, title, confidence FROM agent_knowledge ORDER BY created_at DESC LIMIT 10"
        );
        return {
          focus,
          activeAgents: agents.rows,
          recentActivity: recentRuns.rows,
          latestIntelligence: recentKnowledge.rows,
          generatedAt: new Date().toISOString(),
        };
      } catch {
        return { focus, status: "data unavailable", generatedAt: new Date().toISOString() };
      }
    },
  });

  registerTool({
    name: "portfolio_overview",
    description: "Get a comprehensive overview of the SZL Holdings portfolio including all platforms, their status, and key metrics.",
    parameters: {},
    handler: async () => {
      return {
        holding: "SZL Holdings",
        founder: "Stephen Lutar",
        platforms: [
          { name: "Vessels", domain: "maritime", status: "live", description: "Fleet intelligence & AIS tracking", metrics: "214+ vessels monitored" },
          { name: "Aegis", domain: "cybersecurity", status: "live", description: "Unified SOC & threat correlation", metrics: "Enterprise-grade defense" },
          { name: "Lyte", domain: "ai-ops", status: "live", description: "AI/ML operations command", metrics: "$4.17M AI portfolio" },
          { name: "Terra", domain: "real-estate", status: "live", description: "Pipeline intelligence & deal flow", metrics: "Market analytics engine" },
          { name: "PRISM Counsel", domain: "legal", status: "live", description: "Matter management & billing", metrics: "Case tracking system" },
          { name: "Carlota Jo", domain: "consulting", status: "live", description: "Luxury advisory platform", metrics: "High-touch client management" },
        ],
        infrastructure: {
          databaseTables: 375,
          apiEndpoints: "1,618+",
          stack: "Full TypeScript — zero JavaScript",
          architecture: "Monorepo with shared services",
        },
        aiCapabilities: {
          agents: 7,
          orchestration: "Multi-agent with delegation",
          rag: "pgvector-powered knowledge retrieval",
          providers: ["OpenAI GPT-5.2", "Anthropic Claude", "Gemini"],
        },
      };
    },
  });

  logger.info("Registered cross-platform agent tools");
}
