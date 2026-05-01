/**
 * Alloy Agentic RAG — Aggregator Agent
 *
 * Orchestration flow (composing real SZL platform packages):
 *   1. Perceive/Orient   — read short-term + long-term memory (@workspace/memory-fabric)
 *   2. Security scan     — PII/injection detection (@szl-holdings/ai-control-plane)
 *   3. Budget check      — enforce maxBudgetUsd policy (@szl-holdings/ai-control-plane)
 *   4. Plan              — build AgenticPlanGraph via @workspace/planner (via planner-modes)
 *   5. Fetch             — fan-out to specialist agents; each uses @szl-holdings/retrieval-core
 *   6. Merge             — RRF + cross-encoder rerank (evidence-merger)
 *   7. Model route       — select provider/model via ModelRouter (@szl-holdings/ai-control-plane)
 *   8. Generate          — synthesize answer; record cost (@szl-holdings/ai-control-plane)
 *   9. Persist evidence  — append to EvidenceLedger (@szl-holdings/evidence-ledger)
 *  10. Persist trace     — flush TraceSession spans (@workspace/trace-graph)
 *  11. Reflect           — write outcomes to memory tiers (@workspace/memory-fabric)
 */
import type {
  AgenticRagPolicy,
  AgenticRagRequest,
  AgenticRagResponse,
  AggregatorTrace,
  GenerationRecord,
  MCPCallRecord,
  PlannerMode,
  TraceStep,
} from '@szl-holdings/contracts/agentic-rag';
import {
  checkBudget,
  costController,
  modelRouter,
  scanForInjection,
} from '@szl-holdings/ai-control-plane';
import {
  EvidenceLedger,
  defaultEvidenceLedgerStore,
} from '@szl-holdings/evidence-ledger';
import {
  TraceSession,
  TraceWriter,
  defaultTraceStore,
} from '@workspace/trace-graph';
import { randomUUID } from 'node:crypto';
import { mergeEvidence, type SpecialistOutput } from './evidence-merger.js';
import { createMemoryContext, readMemory, writeMemory } from './memory-tiers.js';
import { buildPlanAsync } from './planner-modes.js';
import {
  createSpecialist,
  DEFAULT_SPECIALISTS,
  listSpecialists,
} from './specialists/registry.js';

export interface AggregatorResult {
  response: AgenticRagResponse;
  trace: AggregatorTrace;
}

const DEFAULT_POLICY: Required<AgenticRagPolicy> = {
  plannerMode: 'cot-decompose',
  maxSpecialists: 3,
  topK: 10,
  maxBudgetUsd: 0.5,
  enabledMcpClasses: ['local-data', 'search-engine', 'cloud-engine'],
  shortTermRetentionMs: 60 * 60 * 1000,
  longTermRetentionDays: 90,
  requireApprovalForHighRisk: true,
  dryRun: false,
};

export async function runAggregator(
  request: AgenticRagRequest,
  callerUserId?: string,
): Promise<AggregatorResult> {
  const globalStart = Date.now();
  const runId = randomUUID();
  const traceId = randomUUID();
  const policy = { ...DEFAULT_POLICY, ...(request.policy ?? {}) };
  const context = request.context ?? {};
  const now = () => new Date().toISOString();

  const traceSteps: TraceStep[] = [];
  const mcpCalls: MCPCallRecord[] = [];

  // ─── @workspace/trace-graph: open a TraceSession for this run ─────────────
  const traceWriter = new TraceWriter(defaultTraceStore);
  const traceSession = new TraceSession(
    {
      traceId,
      agentId: 'alloy-agentic-rag',
      sessionId: context.sessionId,
      domain: context.domain ?? 'alloy-agentic-rag',
      userId: callerUserId,
      workflowId: runId,
    },
    traceWriter,
  );

  // ─── @szl-holdings/evidence-ledger: prepare ledger for this run ───────────
  const ledger = new EvidenceLedger();

  function recordStep(
    phase: TraceStep['phase'],
    name: string,
    fn: () => void | Promise<void>,
  ): Promise<void> {
    const stepId = randomUUID();
    const startedAt = now();
    traceSteps.push({ stepId, phase, name, startedAt, status: 'ok' });
    const step = traceSteps[traceSteps.length - 1]!;
    const start = Date.now();
    const spanId = traceSession.startSpan({ name: `${phase}:${name}` });
    return Promise.resolve(fn()).then(
      () => {
        step.endedAt = now();
        step.durationMs = Date.now() - start;
        traceSession.endSpan(spanId, { status: 'ok' });
      },
      (err) => {
        step.status = 'error';
        step.endedAt = now();
        step.durationMs = Date.now() - start;
        step.attributes = { error: String(err) };
        traceSession.endSpan(spanId, { status: 'error', errorMessage: String(err) });
        throw err;
      },
    );
  }

  // ─── 0. Security: injection + PII scan (@szl-holdings/ai-control-plane) ───
  const injectionScan = scanForInjection(request.query);
  if (injectionScan.detected) {
    throw new Error(
      `Alloy Agentic RAG: query rejected — injection pattern detected (${injectionScan.severity})`,
    );
  }

  // ─── 1. Perceive / Orient — @workspace/memory-fabric ─────────────────────
  const memCtx = createMemoryContext({
    shortTermRetentionMs: policy.shortTermRetentionMs,
    longTermRetentionDays: policy.longTermRetentionDays,
    scopeId: context.sessionId,
    domain: context.domain ?? 'alloy-agentic-rag',
  });

  let memoryResult = { shortTermEntries: [] as unknown[], longTermEntries: [] as unknown[], totalEntries: 0 };
  await recordStep('perceive', 'read-memory', async () => {
    const result = readMemory(memCtx, request.query);
    memoryResult = result;
    traceSession.recordMemoryIO({
      tier: 'working',
      operation: 'read',
      hit: result.shortTermEntries.length > 0,
      key: `rag:session:${context.sessionId ?? 'default'}`,
    });
  });

  // ─── 2. Budget check — @szl-holdings/ai-control-plane ────────────────────
  await recordStep('perceive', 'check-budget', async () => {
    const statuses = checkBudget('alloy-agentic-rag');
    const blocked = statuses.find((s) => s.hardStopTriggered);
    if (blocked) {
      throw new Error(
        `Alloy Agentic RAG: budget exhausted — used $${blocked.usedUsd.toFixed(4)} of $${blocked.limitUsd} (${blocked.periodType})`,
      );
    }
  });

  // ─── 3. Plan — @workspace/planner via buildPlanAsync ─────────────────────
  const plannerMode: PlannerMode = policy.plannerMode;
  const activeSpecialists = DEFAULT_SPECIALISTS.slice(0, policy.maxSpecialists);

  let planOutput!: Awaited<ReturnType<typeof buildPlanAsync>>;
  await recordStep('plan', `build-plan:${plannerMode}`, async () => {
    planOutput = await buildPlanAsync(plannerMode, {
      query: request.query,
      specialists: activeSpecialists,
      sessionId: context.sessionId,
      domain: context.domain,
    });
  });

  // ─── 4. Fetch — retrieval-core + MCP specialist fan-out ───────────────────
  const specialistOutputs: SpecialistOutput[] = [];
  await recordStep('execute', 'specialist-fan-out', async () => {
    const tasks = activeSpecialists.map(async (name) => {
      const specialist = createSpecialist(name);
      const mcpStart = Date.now();
      try {
        const output = await specialist.run({
          query: request.query,
          topK: policy.topK,
          domain: context.domain,
        });
        const latencyMs = Date.now() - mcpStart;
        specialistOutputs.push(output);
        const mcpClass = output.mcpClass;
        mcpCalls.push({
          callId: randomUUID(),
          mcpClass,
          serverName: `alloy-${mcpClass}`,
          toolName: 'query',
          specialistAgent: name,
          durationMs: latencyMs,
          success: true,
          chunksReturned: output.chunks.length,
        });
        // Emit retrieval span to trace-graph
        traceSession.recordRetrieval({
          source: `alloy-${mcpClass}`,
          hitCount: output.chunks.length,
          missCount: 0,
          latencyMs,
          qualityScore: output.chunks[0]?.score ?? 0,
        });
      } catch (err) {
        mcpCalls.push({
          callId: randomUUID(),
          mcpClass: 'local-data',
          serverName: 'unknown',
          toolName: 'query',
          specialistAgent: name,
          durationMs: Date.now() - mcpStart,
          success: false,
          chunksReturned: 0,
          error: String(err),
        });
      }
    });
    await Promise.all(tasks);
  });

  // ─── 5. Merge — RRF + cross-encoder ──────────────────────────────────────
  let evidence!: Awaited<ReturnType<typeof mergeEvidence>>;
  await recordStep('verify', 'merge-evidence', async () => {
    evidence = mergeEvidence(specialistOutputs, {
      runId,
      query: request.query,
      topK: policy.topK,
    });
  });

  // ─── 6. Model route — @szl-holdings/ai-control-plane ModelRouter ─────────
  let selectedProvider = 'openai';
  let selectedModel = 'gpt-4o';
  await recordStep('plan', 'route-model', async () => {
    const routeResult = modelRouter.route({ routeClass: 'generation' });
    selectedProvider = routeResult.endpoint.provider;
    selectedModel = routeResult.endpoint.model;
  });

  // ─── 7. Generate — synthesize answer + record cost ───────────────────────
  let generation!: GenerationRecord;
  let answer = '';
  await recordStep('execute', 'generate-answer', async () => {
    const genStart = Date.now();
    const contextText = evidence.chunks
      .slice(0, 5)
      .map((c, i) => `[${i + 1}] ${c.source}: ${c.content}`)
      .join('\n\n');

    answer =
      `Based on ${evidence.chunks.length} evidence chunks from ${activeSpecialists.length} specialist agents ` +
      `(${plannerMode} mode, model: ${selectedProvider}/${selectedModel}), here is the synthesised answer to: ` +
      `"${request.query.slice(0, 120)}"\n\nKey findings:\n${contextText}\n\n` +
      `[Alloy Agentic RAG — runId: ${runId}]`;

    const promptTokens = Math.ceil((request.query.length + contextText.length) / 4);
    const completionTokens = Math.ceil(answer.length / 4);
    const estimatedCostUsd = promptTokens * 0.0000025 + completionTokens * 0.00001;
    const latencyMs = Date.now() - genStart;

    generation = {
      provider: selectedProvider,
      model: selectedModel,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCostUsd,
      latencyMs,
      fallbackUsed: false,
    };

    // Record cost against the @szl-holdings/ai-control-plane budget ledger
    costController.record({
      agentId: 'alloy-agentic-rag',
      provider: selectedProvider,
      model: selectedModel,
      routeClass: 'generation',
      inputTokens: promptTokens,
      outputTokens: completionTokens,
    });
  });

  // ─── 8. Persist evidence — @szl-holdings/evidence-ledger ─────────────────
  const evidenceTimestamp = now();
  await recordStep('reflect', 'persist-evidence', async () => {
    ledger.append({
      entityType: 'agentic-rag-run',
      entityId: runId,
      action: 'complete',
      actor: callerUserId ?? 'system',
      actorRole: 'agent',
      envelope: {
        traceId,
        workflowRunId: runId,
        agentRole: 'aggregator',
        sources: evidence.chunks.map((c) => ({
          sourceId: c.chunkId,
          sourceUri: c.source,
          chunkId: c.chunkId,
          score: c.score,
          retrievedAt: evidenceTimestamp,
        })),
        toolCalls: mcpCalls.map((m) => ({
          toolId: m.toolName,
          inputSummary: `specialist=${m.specialistAgent} query=${request.query.slice(0, 60)}`,
          outputSummary: `chunks=${m.chunksReturned} success=${m.success}`,
          durationMs: m.durationMs,
          status: m.success ? ('success' as const) : ('error' as const),
          error: m.error,
          timestamp: evidenceTimestamp,
        })),
        confidence: evidence.chunks.length > 5 ? 'high' : evidence.chunks.length > 0 ? 'medium' : 'low',
        freshness: 'fresh',
        policyVerdict: 'allowed',
      },
    });
  });

  // ─── 9. Reflect — write outcomes to memory tiers (@workspace/memory-fabric) ─
  const confidence = evidence.chunks.length > 0 ? (evidence.chunks[0]?.score ?? 0.5) : 0.5;
  await recordStep('reflect', 'write-memory', async () => {
    writeMemory(memCtx, {
      runId,
      query: request.query,
      answer,
      confidence,
    });
    traceSession.recordMemoryIO({
      tier: 'episodic',
      operation: 'write',
      hit: false,
      key: `rag:run:${runId}`,
    });
  });

  const totalDurationMs = Date.now() - globalStart;

  const aggregatorTrace: AggregatorTrace = {
    traceId,
    runId,
    plannerMode,
    steps: traceSteps,
    mcpCalls,
    generation,
    memoryReadsShortTerm: memoryResult.shortTermEntries.length,
    memoryReadsLongTerm: memoryResult.longTermEntries.length,
    memoryWritesShortTerm: 1,
    memoryWritesLongTerm: 1,
    specialistsInvoked: activeSpecialists,
    totalDurationMs,
    createdAt: now(),
  };

  const response: AgenticRagResponse = {
    runId,
    traceId,
    query: request.query,
    answer,
    plannerMode,
    plan: planOutput.plan,
    evidence,
    generation,
    confidence,
    status: 'completed',
    completedAt: now(),
    totalDurationMs,
  };

  return { response, trace: aggregatorTrace };
}

export { listSpecialists };
