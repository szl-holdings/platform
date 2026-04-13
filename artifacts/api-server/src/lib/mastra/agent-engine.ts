import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { executeTool, registerCrossPlatformTools, registerGitHubTools, listTools } from "./tool-registry";
import { createThread, storeMessage, getShortTermMemory, semanticRecall, storeKnowledgeEntity } from "./memory";
import { emitTrace, autoEvaluate, initDefaultSlos } from "./agentops";
import { initializeA2ACards, createTask, updateTaskStatus } from "./a2a";
import { registerGitHubIntegration } from "./external-integrations";
import { ensureActionAuditTable } from "./action-audit";
import { ensureDocumentIntelligenceTables } from "./document-intelligence";
import { ensureTriggerTables, registerDefaultTriggers } from "./event-triggers";
import { registerCapabilityMeshTools, ensureCapabilityRegistryTable, registerMultimodalTools } from "./capability-mesh";
import { ensureSkillsRegistryTable } from "./skills-registry";
import { ensureSkillRuntimeTables } from "./skill-runtime";
import { ensureAgentActivityTable } from "./agent-activity";
import {
  registerMcpModule,
  buildMcpGatewayRouter,
} from "./mcp-gateway/index";
import { vesselsMcpModule } from "./mcp-gateway/vessels-module";
import { aegisMcpModule } from "./mcp-gateway/aegis-module";
import { terraMcpModule } from "./mcp-gateway/terra-module";
import { prismMcpModule } from "./mcp-gateway/prism-module";
import { alloyMcpModule } from "./mcp-gateway/alloy-module";
import { githubMcpModule } from "./mcp-gateway/github-module";
import type { MastraAgentConfig, AgentExecutionContext, DelegationResult, TraceSpan, GuardrailResult, CognitiveRunMetadata } from "./types";
import { classifyRequest } from "./cognitive-router";
import { runTreeOfThought, runPlanCritique, runMonteCarlo, buildPlanningTrace } from "./advanced-planner";
import { runMetacognitiveAssessment, runSelfReflection, generateClarifyingQuestion } from "./metacognition";
import { recordOutcome, getActiveStrategyProfile, updateProfileMetrics, ensureSelfEvolutionTables } from "./self-evolution";
import { diagnoseFailure, generateRecoveryPlan, recordRecoveryAttempt, updateRecoveryOutcome, ensureFailureRecoveryTables } from "./failure-recovery";
import { recordToolChain, ensureDynamicToolTables } from "./dynamic-tools";
import { getOrCreateIntentStack, updateIntentStack, extractIntent, buildIntentContext, ensureIntentTables } from "./intent-graph";
import { requiresConsensus, runConsensusVerification } from "./consensus-verification";
import { getOrCreateUserProfile, buildPersonalizationContext, buildPersonalizedSystemPrompt, recordInteraction, ensurePersonalizationTables } from "./personalization";
import { ensureProactiveTables } from "./proactive-intelligence";
import { assessQueryComplexity, generateExecutionPlan } from "./cognitive-engine";
import { buildPersonalizedContext, storeEpisodicMemory, ensureMemoryPersistenceTables } from "./memory-persistence";
import { ensureGatewayIntelligenceTables } from "../ai-gateway-intelligence";

export { buildMcpGatewayRouter };

export type { MastraAgentConfig, AgentExecutionContext };

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
    skipCognitive?: boolean;
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

  const sanitizedMessage = inputGuard.sanitizedContent ?? userMessage;

  const isCognitiveRun = !options.skipCognitive && !options.parentRunId;

  const cognitiveMetadata: CognitiveRunMetadata = {
    cognitiveMode: "system1",
    complexityScore: 0,
    planningStrategy: "direct",
    riskLevel: "low",
  };

  let cognitiveClassification: Awaited<ReturnType<typeof classifyRequest>> | null = null;
  let intentStack: Awaited<ReturnType<typeof getOrCreateIntentStack>> | null = null;
  let personalizationCtx: ReturnType<typeof buildPersonalizationContext> | null = null;
  let activeStrategyProfile: Awaited<ReturnType<typeof getActiveStrategyProfile>> = null;

  if (isCognitiveRun) {
    [cognitiveClassification, intentStack, activeStrategyProfile] = await Promise.all([
      classifyRequest(sanitizedMessage, config.domain, options.context),
      getOrCreateIntentStack(threadId, options.userId),
      getActiveStrategyProfile(agentId),
    ]);

    cognitiveMetadata.cognitiveMode = cognitiveClassification.mode;
    cognitiveMetadata.complexityScore = cognitiveClassification.complexityScore;
    cognitiveMetadata.planningStrategy = cognitiveClassification.planningStrategy;
    cognitiveMetadata.riskLevel = cognitiveClassification.riskLevel;

    if (options.userId) {
      const [userProfile] = await Promise.all([
        getOrCreateUserProfile(options.userId),
        recordInteraction(options.userId, sanitizedMessage, config.domain),
      ]);
      personalizationCtx = buildPersonalizationContext(userProfile);
      cognitiveMetadata.personalizationApplied = true;
    }

    if (intentStack) {
      const intentExtraction = await extractIntent(
        sanitizedMessage,
        intentStack.primaryIntent?.intent,
        []
      );
      intentStack = await updateIntentStack(intentStack, intentExtraction, Date.now());
      cognitiveMetadata.intentPreserved = true;
    }
  }

  const shortTermMemory = await getShortTermMemory(threadId, config.memory?.shortTerm?.maxMessages ?? 20);
  let semanticContext = "";
  if (config.memory?.longTerm?.semanticRecall) {
    const recalled = await semanticRecall(sanitizedMessage, { agentId, topK: config.memory.longTerm.topK });
    if (recalled.length > 0) {
      semanticContext = "\n\nRelevant past context:\n" + recalled.map(r => `[${r.role}]: ${r.content}`).join("\n");
    }
  }

  let personalizedContext = "";
  if (options.userId) {
    try {
      personalizedContext = await buildPersonalizedContext(options.userId, agentId, userMessage.slice(0, 120));
    } catch { }
  }

  let cognitivePlan = "";
  try {
    const complexity = assessQueryComplexity(userMessage);
    if (complexity.mode === "system2" || complexity.requiresDeepThinking) {
      const plan = await generateExecutionPlan(userMessage, agentId, listTools().map(t => t.name), context);
      if (plan?.steps?.length) {
        cognitivePlan = `\n\n[Reasoning Plan — ${complexity.complexity}]:\n${plan.steps.slice(0, 4).map((s, i) => `${i + 1}. ${s.action}`).join("\n")}`;
      }
    }
  } catch { }

  const toolPrompt = buildToolPrompt();
  let systemPrompt = config.systemPrompt;

  if (activeStrategyProfile?.systemPromptVariant) {
    systemPrompt = activeStrategyProfile.systemPromptVariant;
  }

  if (personalizationCtx) {
    systemPrompt = buildPersonalizedSystemPrompt(systemPrompt, personalizationCtx);
  }

  if (intentStack) {
    const intentCtx = buildIntentContext(intentStack);
    if (intentCtx) systemPrompt += "\n\n[SESSION CONTEXT]\n" + intentCtx;
  }

  systemPrompt += toolPrompt + semanticContext + personalizedContext + cognitivePlan;

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...shortTermMemory.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: sanitizedMessage },
  ];

  await storeMessage(threadId, "user", userMessage);

  let finalResponse = "";
  const toolsUsed: string[] = [];
  const delegations: DelegationResult[] = [];
  let totalTokens = 0;
  let executionError: Error | null = null;

  if (isCognitiveRun && cognitiveClassification && cognitiveClassification.mode === "system2") {
    const strategy = cognitiveClassification.planningStrategy;
    const sysCtx = messages.find(m => m.role === "system")?.content || config.systemPrompt;

    try {
      let planResult: any;
      let planningTrace: Awaited<ReturnType<typeof buildPlanningTrace>> | null = null;

      if (strategy === "tot") {
        planResult = await runTreeOfThought(sanitizedMessage, sysCtx);
        finalResponse = planResult.finalReasoning;
        planningTrace = await buildPlanningTrace("tot", planResult);
      } else if (strategy === "plan_critique") {
        planResult = await runPlanCritique(sanitizedMessage, sysCtx);
        finalResponse = planResult.revisedPlan;
        planningTrace = await buildPlanningTrace("plan_critique", planResult);
      } else if (strategy === "monte_carlo") {
        planResult = await runMonteCarlo(sanitizedMessage, sysCtx);
        finalResponse = planResult.expectedOutcome;
        planningTrace = await buildPlanningTrace("monte_carlo", planResult);
      }

      if (planningTrace) {
        cognitiveMetadata.planningTrace = planningTrace;
      }
    } catch (err: any) {
      logger.warn({ err, strategy }, "Advanced planning failed, falling back to standard execution");
    }
  }

  if (!finalResponse) {
    let recoveryAttemptId: string | null = null;

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

        if (isCognitiveRun && round === 0) {
          const diagnosis = await diagnoseFailure(err.message, sanitizedMessage, agentId, toolsUsed);
          if (diagnosis.isRecoverable && diagnosis.recoveryStrategy !== "abort") {
            const recoveryPlan = await generateRecoveryPlan(sanitizedMessage, diagnosis, config.systemPrompt, toolsUsed);
            const attempt = await recordRecoveryAttempt(runId, agentId, err.message, diagnosis, recoveryPlan);
            recoveryAttemptId = attempt.attemptId;
            cognitiveMetadata.recoveryAttempted = true;
            finalResponse = recoveryPlan;
            break;
          }
        }
        executionError = err;
        break;
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
      let toolResult = await executeTool(toolCall.name, toolCall.input, context);

      if (toolResult.error && isCognitiveRun) {
        const diagnosis = await diagnoseFailure(toolResult.error, sanitizedMessage, agentId, toolsUsed);
        if (diagnosis.isRecoverable && diagnosis.recoveryStrategy === "fallback") {
          const recoveryPlan = await generateRecoveryPlan(sanitizedMessage, diagnosis, config.systemPrompt, toolsUsed);
          const attempt = await recordRecoveryAttempt(runId, agentId, toolResult.error, diagnosis, recoveryPlan);
          recoveryAttemptId = attempt.attemptId;
          cognitiveMetadata.recoveryAttempted = true;
        }
      }

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

    if (recoveryAttemptId && finalResponse) {
      await updateRecoveryOutcome(recoveryAttemptId, "succeeded", finalResponse.slice(0, 200));
    }
  }

  if (executionError && !finalResponse) {
    throw executionError;
  }

  if (isCognitiveRun && finalResponse) {
    const metacogState = await runMetacognitiveAssessment(
      sanitizedMessage,
      finalResponse,
      config.domain,
      { toolErrors: 0 }
    );
    cognitiveMetadata.metacognitiveState = metacogState;

    if (metacogState.recommendedAction === "clarify" && metacogState.ambiguityLevel === "high") {
      const question = await generateClarifyingQuestion(sanitizedMessage, metacogState.ambiguityLevel, metacogState.knowledgeGaps);
      finalResponse = `${finalResponse}\n\n---\n*To provide a more accurate response, could you clarify: ${question}*`;
    }

    if (cognitiveClassification?.requiresConsensus || requiresConsensus(config.domain, cognitiveClassification?.riskLevel || "low")) {
      try {
        const consensus = await runConsensusVerification(sanitizedMessage, config.systemPrompt, config.domain);
        if (consensus.analysis.consensusReached && consensus.analysis.consensusScore > 0.75) {
          finalResponse = consensus.finalResponse;
          cognitiveMetadata.consensusUsed = true;
        }
      } catch (err) {
        logger.warn({ err }, "Consensus verification failed, using original response");
      }
    }

    if (metacogState.confidence > 0.6) {
      const reflection = await runSelfReflection(sanitizedMessage, finalResponse, config.systemPrompt);
      if (reflection.shouldCorrect && reflection.correctedResponse) {
        finalResponse = reflection.correctedResponse;
      }
    }
  }

  const outputGuard = await runGuardrails(config.guardrails, finalResponse, "output", context);
  if (outputGuard.sanitizedContent) finalResponse = outputGuard.sanitizedContent;

  const latencyMs = Date.now() - startTime;

  await storeMessage(threadId, "assistant", finalResponse, {
    tokensUsed: totalTokens, latencyMs,
    model: config.model, provider: config.provider,
    metadata: { toolsUsed, delegations: delegations.length, cognitiveMode: cognitiveMetadata.cognitiveMode },
  });

  await emitTrace(runId, agentId, {
    traceId, spanType: "agent_run", name: `${config.name} run`,
    status: "completed", output: { response: finalResponse.slice(0, 500) },
    tokensInput: totalTokens, latencyMs,
    model: config.model, provider: config.provider,
    metadata: { cognitiveMetadata },
  });

  await recordAgentRun(runId, agentId, config.domain, "completed", startTime, finalResponse.slice(0, 200));

  const evalResult = await autoEvaluate(runId, agentId, finalResponse, latencyMs, totalTokens);

  if (isCognitiveRun) {
    const successScore = (evalResult.quality + evalResult.latency) / 2;
    await Promise.allSettled([
      recordOutcome({
        runId, agentId,
        profileId: activeStrategyProfile?.profileId || "default",
        successScore, latencyMs, toolsUsed,
        feedbackSignals: { quality: evalResult.quality, latency: evalResult.latency, cost: evalResult.cost },
      }),
      updateProfileMetrics(agentId, successScore),
      toolsUsed.length >= 2 ? recordToolChain(toolsUsed, agentId, latencyMs) : Promise.resolve(),
    ]);
  }

  if (options.userId) {
    storeEpisodicMemory({
      userId: options.userId,
      agentId,
      topic: userMessage.slice(0, 120),
      summary: userMessage.slice(0, 200),
      outcome: finalResponse.slice(0, 400),
      keyEntities: toolsUsed.slice(0, 5),
      importanceScore: toolsUsed.length > 0 ? 0.8 : 0.5,
    }).catch(() => { });
  }

  return {
    runId, agentId, response: finalResponse, toolsUsed,
    tokensUsed: totalTokens, latencyMs,
    model: config.model, provider: config.provider, delegations,
    threadId, traceId,
    cognitiveMetadata,
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
  logger.info("Initializing Mastra agent framework with Cognitive Core...");

  registerCrossPlatformTools();
  registerGitHubIntegration();
  registerGitHubTools();
  registerCapabilityMeshTools();
  registerMultimodalTools();
  await ensureCapabilityRegistryTable();
  await loadAgentConfigs();

  try { await initializeA2ACards(); } catch (err) {
    logger.warn({ err }, "A2A card initialization skipped");
  }

  for (const [agentId] of agentConfigs) {
    try { await initDefaultSlos(agentId); } catch {}
  }

  registerMcpModule(vesselsMcpModule);
  registerMcpModule(aegisMcpModule);
  registerMcpModule(terraMcpModule);
  registerMcpModule(prismMcpModule);
  registerMcpModule(alloyMcpModule);
  registerMcpModule(githubMcpModule);

  await Promise.allSettled([
    ensureActionAuditTable(),
    ensureDocumentIntelligenceTables(),
    ensureTriggerTables(),
    ensureSkillsRegistryTable(),
    ensureSkillRuntimeTables(),
    ensureAgentActivityTable(),
    ensureSelfEvolutionTables(),
    ensureFailureRecoveryTables(),
    ensureDynamicToolTables(),
    ensureIntentTables(),
    ensurePersonalizationTables(),
    ensureProactiveTables(),
    ensureMemoryPersistenceTables(),
    ensureGatewayIntelligenceTables(),
  ]);

  registerDefaultTriggers();

  logger.info({
    agents: agentConfigs.size,
    tools: listTools().length,
    mcpModules: 6,
    actionEngine: "initialized",
    skillsEngine: "initialized",
    agentActivity: "initialized",
    cognitiveCore: "active",
    modules: [
      "cognitive-router", "advanced-planner", "metacognition",
      "self-evolution", "failure-recovery", "dynamic-tools",
      "intent-graph", "consensus-verification", "personalization",
      "proactive-intelligence",
    ],
  }, "Mastra agent framework initialized with Skills Engine + MCP Gateway v2 + Cognitive Core (6th Ring)");
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
  cognitiveMetadata?: CognitiveRunMetadata;
}
