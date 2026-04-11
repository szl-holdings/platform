import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { executeTool, registerCrossPlatformTools, listTools } from "./tool-registry";
import { createThread, storeMessage, getShortTermMemory, semanticRecall, storeKnowledgeEntity } from "./memory";
import { emitTrace, autoEvaluate, initDefaultSlos } from "./agentops";
import { initializeA2ACards, createTask, updateTaskStatus } from "./a2a";
import type { MastraAgentConfig, AgentExecutionContext, OrchestratorResult, DelegationResult, TraceSpan, GuardrailResult } from "./types";

export type { MastraAgentConfig, AgentExecutionContext, OrchestratorResult };

const agentConfigs = new Map<string, MastraAgentConfig>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadAgentConfigs(): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT agent_id, name, domain, description, system_prompt, model, provider, tools, temperature, max_tokens, enabled
       FROM ai_agent_configs WHERE enabled = TRUE`
    );
    for (const row of result.rows) {
      agentConfigs.set(row.agent_id, {
        agentId: row.agent_id,
        name: row.name,
        domain: row.domain,
        description: row.description || "",
        systemPrompt: row.system_prompt,
        model: row.model,
        provider: row.provider,
        temperature: parseFloat(row.temperature),
        maxTokens: parseInt(row.max_tokens),
        tools: [],
        memory: {
          shortTerm: { maxMessages: 20, ttlMinutes: 60 },
          longTerm: { enabled: true, semanticRecall: true, topK: 5 },
          knowledgeGraph: { enabled: true, extractEntities: true },
        },
        routing: "preferred",
        guardrails: [
          {
            name: "input_sanitizer",
            type: "input",
            validator: async (content) => {
              const dangerousPatterns = [
                /ignore\s+(all\s+)?previous\s+instructions/i,
                /you\s+are\s+now\s+a/i,
                /system\s*:\s*override/i,
              ];
              for (const pattern of dangerousPatterns) {
                if (pattern.test(content)) {
                  return { passed: false, reason: "Prompt injection detected" };
                }
              }
              return { passed: true };
            },
          },
          {
            name: "output_pii_filter",
            type: "output",
            validator: async (content) => {
              const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
              if (ssnPattern.test(content)) {
                return {
                  passed: true,
                  sanitizedContent: content.replace(ssnPattern, "[REDACTED-SSN]"),
                  reason: "PII detected and redacted",
                };
              }
              return { passed: true };
            },
          },
        ],
      });
    }
    logger.info({ count: agentConfigs.size }, "Mastra agent configs loaded");
  } catch (err) {
    logger.error({ err }, "Failed to load agent configs");
  }
}

export async function listAgents(): Promise<MastraAgentConfig[]> {
  if (agentConfigs.size === 0) await loadAgentConfigs();
  return Array.from(agentConfigs.values());
}

export async function getAgent(agentId: string): Promise<MastraAgentConfig | null> {
  if (agentConfigs.size === 0) await loadAgentConfigs();
  return agentConfigs.get(agentId) ?? null;
}

async function runGuardrails(
  guardrails: MastraAgentConfig["guardrails"],
  content: string,
  type: "input" | "output",
  context: AgentExecutionContext
): Promise<GuardrailResult> {
  if (!guardrails?.length) return { passed: true };
  for (const guard of guardrails) {
    if (guard.type !== type && guard.type !== "both") continue;
    const result = await guard.validator(content, context);
    if (!result.passed) return result;
    if (result.sanitizedContent) content = result.sanitizedContent;
  }
  return { passed: true, sanitizedContent: content };
}

function buildToolPrompt(): string {
  const tools = listTools();
  if (tools.length === 0) return "";
  const toolDescs = tools.map(t => `- ${t.name}: ${t.description}`).join("\n");
  return `\n\nYou have access to these tools:\n${toolDescs}\n\nTo call a tool, respond with JSON: {"tool": "tool_name", "input": {...}}\nAfter receiving results, synthesize them into your final response.`;
}

function extractToolCall(content: string): { name: string; input: Record<string, unknown> } | null {
  const match = content.match(/\{[\s\S]*"tool"\s*:\s*"[^"]+"/);
  if (!match) return null;
  try {
    let braceCount = 0;
    let jsonStr = "";
    for (let i = match.index!; i < content.length; i++) {
      if (content[i] === "{") braceCount++;
      if (content[i] === "}") braceCount--;
      jsonStr += content[i];
      if (braceCount === 0) break;
    }
    const parsed = JSON.parse(jsonStr);
    if (parsed.tool) return { name: parsed.tool, input: parsed.input || {} };
  } catch {}
  return null;
}

export async function runAgent(
  agentId: string,
  userMessage: string,
  options: {
    threadId?: string;
    userId?: string;
    context?: Record<string, unknown>;
    maxToolRounds?: number;
    parentRunId?: string;
  } = {}
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const runId = generateId("run");
  const traceId = generateId("trace");
  const threadId = options.threadId ?? generateId("thread");
  const maxToolRounds = options.maxToolRounds ?? 5;

  const config = await getAgent(agentId);
  if (!config) throw new Error(`Agent "${agentId}" not found or disabled`);

  await createThread(threadId, agentId, options.userId);

  const context: AgentExecutionContext = {
    runId, traceId, agentId, domain: config.domain, threadId,
    userId: options.userId, parentRunId: options.parentRunId,
    metadata: options.context || {},
    delegateTo: async (targetAgentId, task) => delegateToAgent(agentId, targetAgentId, task, { runId, traceId }),
    recall: async (query, topK) => semanticRecall(query, { agentId, topK }),
    storeEntity: async (entity) => { await storeKnowledgeEntity(entity, agentId); },
    emitTrace: async (span) => { await emitTrace(runId, agentId, span); },
  };

  await emitTrace(runId, agentId, {
    traceId, spanType: "agent_run", name: `${config.name} run`,
    status: "running", input: { userMessage, options },
  });

  const inputGuard = await runGuardrails(config.guardrails, userMessage, "input", context);
  if (!inputGuard.passed) {
    await emitTrace(runId, agentId, {
      traceId, spanType: "agent_run", name: `${config.name} run`,
      status: "failed", error: inputGuard.reason, latencyMs: Date.now() - startTime,
    });
    throw new Error(`Input guardrail failed: ${inputGuard.reason}`);
  }

  const shortTermMemory = await getShortTermMemory(threadId, config.memory?.shortTerm?.maxMessages ?? 20);
  let semanticContext = "";
  if (config.memory?.longTerm?.semanticRecall) {
    const recalled = await semanticRecall(userMessage, { agentId, topK: config.memory.longTerm.topK });
    if (recalled.length > 0) {
      semanticContext = "\n\nRelevant past context:\n" + recalled.map(r => `[${r.role}]: ${r.content}`).join("\n");
    }
  }

  const toolPrompt = buildToolPrompt();
  const systemPrompt = config.systemPrompt + toolPrompt + semanticContext;

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...shortTermMemory.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: inputGuard.sanitizedContent ?? userMessage },
  ];

  await storeMessage(threadId, "user", userMessage);

  const toolsUsed: string[] = [];
  const delegations: DelegationResult[] = [];
  let totalTokens = 0;
  let finalResponse = "";

  for (let round = 0; round <= maxToolRounds; round++) {
    const inferenceTraceId = generateId("trace");
    const inferStart = Date.now();

    await emitTrace(runId, agentId, {
      traceId: inferenceTraceId, parentTraceId: traceId,
      spanType: "llm_inference", name: `${config.model} inference`,
      status: "running", model: config.model, provider: config.provider,
    });

    let response: any;
    try {
      response = await gatewayInfer({
        model: config.model,
        preferredProvider: config.provider as any,
        messages: messages.map(m => ({ role: m.role as "system" | "user" | "assistant", content: m.content })),
        maxTokens: config.maxTokens,
        strategy: (config.routing as "fastest" | "cheapest" | "preferred" | "fallback") ?? "preferred",
      });
    } catch (err: any) {
      await emitTrace(runId, agentId, {
        traceId: inferenceTraceId, parentTraceId: traceId,
        spanType: "llm_inference", name: `${config.model} inference`,
        status: "failed", error: err.message, latencyMs: Date.now() - inferStart,
        model: config.model, provider: config.provider,
      });
      throw err;
    }

    const inferMs = Date.now() - inferStart;
    const tokens = response.usage?.totalTokens ?? 0;
    totalTokens += tokens;

    await emitTrace(runId, agentId, {
      traceId: inferenceTraceId, parentTraceId: traceId,
      spanType: "llm_inference", name: `${config.model} inference`,
      status: "completed", tokensInput: response.usage?.promptTokens ?? 0,
      tokensOutput: response.usage?.completionTokens ?? 0,
      latencyMs: inferMs, model: response.model, provider: response.provider,
      costUsd: estimateCost(response.model, response.usage),
    });

    const content = response.content || "";
    const toolCall = extractToolCall(content);

    if (!toolCall || round === maxToolRounds) {
      finalResponse = toolCall ? content.replace(/\{[\s\S]*"tool"[\s\S]*\}/, "").trim() || content : content;
      break;
    }

    toolsUsed.push(toolCall.name);
    const toolResult = await executeTool(toolCall.name, toolCall.input, context);

    if (toolCall.name === "delegate_to_agent" && toolResult.output) {
      delegations.push(toolResult.output as DelegationResult);
    }

    messages.push({ role: "assistant", content });
    messages.push({
      role: "tool",
      content: JSON.stringify({
        tool: toolCall.name,
        result: toolResult.output,
        error: toolResult.error,
      }),
    });
  }

  const outputGuard = await runGuardrails(config.guardrails, finalResponse, "output", context);
  if (outputGuard.sanitizedContent) finalResponse = outputGuard.sanitizedContent;

  const latencyMs = Date.now() - startTime;

  await storeMessage(threadId, "assistant", finalResponse, {
    tokensUsed: totalTokens, latencyMs,
    model: config.model, provider: config.provider,
    metadata: { toolsUsed, delegations: delegations.length },
  });

  await emitTrace(runId, agentId, {
    traceId, spanType: "agent_run", name: `${config.name} run`,
    status: "completed", output: { response: finalResponse.slice(0, 500) },
    tokensInput: totalTokens, latencyMs,
    model: config.model, provider: config.provider,
  });

  await recordAgentRun(runId, agentId, config.domain, "completed", startTime, finalResponse.slice(0, 200));
  await autoEvaluate(runId, agentId, finalResponse, latencyMs, totalTokens);

  return {
    runId, agentId, response: finalResponse, toolsUsed,
    tokensUsed: totalTokens, latencyMs,
    model: config.model, provider: config.provider, delegations,
    threadId, traceId,
  };
}

async function delegateToAgent(
  fromAgentId: string,
  toAgentId: string,
  task: string,
  parent: { runId: string; traceId: string }
): Promise<DelegationResult> {
  const delegationTraceId = generateId("trace");
  const start = Date.now();

  await emitTrace(parent.runId, fromAgentId, {
    traceId: delegationTraceId, parentTraceId: parent.traceId,
    spanType: "delegation", name: `Delegate to ${toAgentId}`,
    status: "running", input: { toAgentId, task },
  });

  const a2aTask = await createTask(fromAgentId, toAgentId, { message: task });

  try {
    await updateTaskStatus(a2aTask.taskId, "working");

    const result = await runAgent(toAgentId, task, {
      parentRunId: parent.runId,
      maxToolRounds: 2,
    });

    await updateTaskStatus(a2aTask.taskId, "completed", { response: result.response });

    const delegationResult: DelegationResult = {
      agentId: toAgentId,
      response: result.response,
      toolsUsed: result.toolsUsed,
      latencyMs: Date.now() - start,
      traceId: delegationTraceId,
    };

    await emitTrace(parent.runId, fromAgentId, {
      traceId: delegationTraceId, parentTraceId: parent.traceId,
      spanType: "delegation", name: `Delegate to ${toAgentId}`,
      status: "completed", output: delegationResult, latencyMs: delegationResult.latencyMs,
    });

    return delegationResult;
  } catch (err: any) {
    await updateTaskStatus(a2aTask.taskId, "failed", undefined, err.message);

    await emitTrace(parent.runId, fromAgentId, {
      traceId: delegationTraceId, parentTraceId: parent.traceId,
      spanType: "delegation", name: `Delegate to ${toAgentId}`,
      status: "failed", error: err.message, latencyMs: Date.now() - start,
    });

    return {
      agentId: toAgentId,
      response: `Delegation failed: ${err.message}`,
      toolsUsed: [],
      latencyMs: Date.now() - start,
      traceId: delegationTraceId,
    };
  }
}

function estimateCost(model: string, usage?: { promptTokens?: number; completionTokens?: number }): number {
  if (!usage) return 0;
  const inputTokens = usage.promptTokens ?? 0;
  const outputTokens = usage.completionTokens ?? 0;
  const rates: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 2.5 / 1_000_000, output: 10.0 / 1_000_000 },
    "gpt-4o-mini": { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
    "claude-sonnet-4-20250514": { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
    "claude-haiku-3": { input: 0.25 / 1_000_000, output: 1.25 / 1_000_000 },
  };
  const rate = rates[model] || { input: 1.0 / 1_000_000, output: 3.0 / 1_000_000 };
  return inputTokens * rate.input + outputTokens * rate.output;
}

async function recordAgentRun(
  runId: string, agentId: string, domain: string, status: string,
  startedAt: number, summary?: string
): Promise<void> {
  try {
    const completedAt = Date.now();
    await pool.query(
      `INSERT INTO agent_runs (run_id, agent_id, domain, status, started_at, completed_at, duration_ms, summary, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (run_id) DO UPDATE SET status = $4, completed_at = $6, duration_ms = $7, summary = $8`,
      [runId, agentId, domain, status, startedAt, completedAt, completedAt - startedAt, summary]
    );
  } catch (err) {
    logger.error({ err, runId }, "Failed to record agent run");
  }
}

export async function initializeMastra(): Promise<void> {
  logger.info("Initializing Mastra agent framework...");

  registerCrossPlatformTools();
  await loadAgentConfigs();

  try { await initializeA2ACards(); } catch (err) {
    logger.warn({ err }, "A2A card initialization skipped");
  }

  for (const [agentId] of agentConfigs) {
    try { await initDefaultSlos(agentId); } catch {}
  }

  logger.info({
    agents: agentConfigs.size,
    tools: listTools().length,
  }, "Mastra agent framework initialized");
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
  threadId: string;
  traceId: string;
}
