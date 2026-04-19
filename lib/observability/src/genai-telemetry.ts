/**
 * GenAI Telemetry — OpenTelemetry GenAI Semantic Conventions
 * Tracks model calls, tool calls, agent steps, retrieval events,
 * approval events, artifact jobs, and execution runs.
 * Compatible with Langfuse trace export format.
 */

export type GenAISpanKind =
  | "model_call"
  | "tool_call"
  | "agent_step"
  | "retrieval"
  | "approval"
  | "artifact_job"
  | "execution_run";

export type GenAISpanStatus = "ok" | "error" | "pending" | "cancelled";

export interface GenAIModelCallSpan {
  kind: "model_call";
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  model: string;
  modelProvider: string;
  routeClass: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  costEstimateUsd: number;
  usedFallback: boolean;
  status: GenAISpanStatus;
  error?: string;
  correlationId?: string;
  tenantId?: number | string;
  orgId?: number | null;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface GenAIToolCallSpan {
  kind: "tool_call";
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  latencyMs: number;
  status: GenAISpanStatus;
  error?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  policyApplied?: string;
  approvalRequired?: boolean;
  correlationId?: string;
  timestamp: number;
}

export interface GenAIAgentStepSpan {
  kind: "agent_step";
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  agentId: string;
  agentDomain: string;
  stepIndex: number;
  stepType: "think" | "plan" | "tool_select" | "execute" | "summarize" | "escalate";
  inputSummary?: string;
  outputSummary?: string;
  latencyMs: number;
  status: GenAISpanStatus;
  error?: string;
  correlationId?: string;
  timestamp: number;
}

export interface GenAIRetrievalSpan {
  kind: "retrieval";
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  query: string;
  engine: string;
  chunksRetrieved: number;
  chunksUsed: number;
  topScore?: number;
  latencyMs: number;
  status: GenAISpanStatus;
  error?: string;
  correlationId?: string;
  timestamp: number;
}

export interface GenAIApprovalSpan {
  kind: "approval";
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  decisionId: string;
  decisionType: string;
  requiredApprovalLevel: string;
  approvedByUserId?: number;
  approvalDelayMs?: number;
  outcome: "approved" | "rejected" | "pending" | "auto_approved" | "escalated";
  overrideApplied?: boolean;
  correlationId?: string;
  timestamp: number;
}

export interface GenAIArtifactJobSpan {
  kind: "artifact_job";
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  jobId: string;
  jobType: string;
  artifactType?: string;
  latencyMs: number;
  status: GenAISpanStatus;
  error?: string;
  outputSize?: number;
  exportSafe?: boolean;
  correlationId?: string;
  timestamp: number;
}

export interface GenAIExecutionRunSpan {
  kind: "execution_run";
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  runId: string;
  executionType: string;
  domain: string;
  latencyMs: number;
  status: GenAISpanStatus;
  error?: string;
  retryCount?: number;
  totalModelCalls?: number;
  totalToolCalls?: number;
  totalCostUsd?: number;
  correlationId?: string;
  timestamp: number;
}

export type GenAISpan =
  | GenAIModelCallSpan
  | GenAIToolCallSpan
  | GenAIAgentStepSpan
  | GenAIRetrievalSpan
  | GenAIApprovalSpan
  | GenAIArtifactJobSpan
  | GenAIExecutionRunSpan;

export interface LangfuseTrace {
  id: string;
  name: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  input?: unknown;
  output?: unknown;
  createdAt: string;
}

export interface LangfuseObservation {
  traceId: string;
  type: "SPAN" | "GENERATION" | "EVENT";
  name: string;
  startTime: string;
  endTime?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
  level?: "DEBUG" | "DEFAULT" | "WARNING" | "ERROR";
  model?: string;
  usage?: {
    input?: number;
    output?: number;
    total?: number;
    unit?: "TOKENS" | "CHARACTERS" | "MILLISECONDS";
  };
  statusMessage?: string;
}

function generateSpanId(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

const MAX_SPANS = 2000;
const MAX_TOKEN_SAMPLES = 1000;

export interface GenAITelemetrySnapshot {
  windowMs: number;
  totalSpans: number;
  byKind: Record<GenAISpanKind, number>;
  modelCalls: {
    count: number;
    totalTokens: number;
    totalCostUsd: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    errorRate: number;
    fallbackRate: number;
    byModel: Record<string, { count: number; totalTokens: number; totalCostUsd: number; avgLatencyMs: number }>;
  };
  toolCalls: {
    count: number;
    avgLatencyMs: number;
    errorRate: number;
    highRiskCount: number;
    approvalRequired: number;
    byTool: Record<string, { count: number; errorRate: number }>;
  };
  agentSteps: {
    count: number;
    avgLatencyMs: number;
    byDomain: Record<string, number>;
    byStepType: Record<string, number>;
  };
  retrievals: {
    count: number;
    avgLatencyMs: number;
    avgChunksRetrieved: number;
    avgChunksUsed: number;
    avgTopScore: number;
  };
  approvals: {
    count: number;
    avgDelayMs: number;
    approved: number;
    rejected: number;
    overrides: number;
    pending: number;
  };
  artifactJobs: {
    count: number;
    avgLatencyMs: number;
    errorRate: number;
  };
  executionRuns: {
    count: number;
    avgLatencyMs: number;
    avgRetries: number;
    errorRate: number;
  };
}

class GenAITelemetryCollector {
  private spans: GenAISpan[] = [];
  private traceId: string = generateSpanId();
  private handlers: Array<(span: GenAISpan) => void | Promise<void>> = [];

  generateTraceId(): string {
    return generateSpanId();
  }

  generateSpanId(): string {
    return generateSpanId();
  }

  recordSpan(span: GenAISpan): void {
    this.spans.push(span);
    if (this.spans.length > MAX_SPANS) {
      this.spans.splice(0, this.spans.length - MAX_SPANS);
    }
    for (const handler of this.handlers) {
      try {
        void handler(span);
      } catch {
      }
    }
  }

  registerHandler(handler: (span: GenAISpan) => void | Promise<void>): void {
    this.handlers.push(handler);
  }

  recordModelCall(params: Omit<GenAIModelCallSpan, "kind" | "spanId">): GenAIModelCallSpan {
    const span: GenAIModelCallSpan = {
      kind: "model_call",
      spanId: generateSpanId(),
      ...params,
    };
    this.recordSpan(span);
    return span;
  }

  recordToolCall(params: Omit<GenAIToolCallSpan, "kind" | "spanId">): GenAIToolCallSpan {
    const span: GenAIToolCallSpan = {
      kind: "tool_call",
      spanId: generateSpanId(),
      ...params,
    };
    this.recordSpan(span);
    return span;
  }

  recordAgentStep(params: Omit<GenAIAgentStepSpan, "kind" | "spanId">): GenAIAgentStepSpan {
    const span: GenAIAgentStepSpan = {
      kind: "agent_step",
      spanId: generateSpanId(),
      ...params,
    };
    this.recordSpan(span);
    return span;
  }

  recordRetrieval(params: Omit<GenAIRetrievalSpan, "kind" | "spanId">): GenAIRetrievalSpan {
    const span: GenAIRetrievalSpan = {
      kind: "retrieval",
      spanId: generateSpanId(),
      ...params,
    };
    this.recordSpan(span);
    return span;
  }

  recordApproval(params: Omit<GenAIApprovalSpan, "kind" | "spanId">): GenAIApprovalSpan {
    const span: GenAIApprovalSpan = {
      kind: "approval",
      spanId: generateSpanId(),
      ...params,
    };
    this.recordSpan(span);
    return span;
  }

  recordArtifactJob(params: Omit<GenAIArtifactJobSpan, "kind" | "spanId">): GenAIArtifactJobSpan {
    const span: GenAIArtifactJobSpan = {
      kind: "artifact_job",
      spanId: generateSpanId(),
      ...params,
    };
    this.recordSpan(span);
    return span;
  }

  recordExecutionRun(params: Omit<GenAIExecutionRunSpan, "kind" | "spanId">): GenAIExecutionRunSpan {
    const span: GenAIExecutionRunSpan = {
      kind: "execution_run",
      spanId: generateSpanId(),
      ...params,
    };
    this.recordSpan(span);
    return span;
  }

  getSpans(windowMs = 300_000): GenAISpan[] {
    const cutoff = Date.now() - windowMs;
    return this.spans.filter(s => s.timestamp >= cutoff);
  }

  getSpansByTrace(traceId: string): GenAISpan[] {
    return this.spans.filter(s => s.traceId === traceId);
  }

  getSnapshot(windowMs = 300_000): GenAITelemetrySnapshot {
    const recent = this.getSpans(windowMs);

    const byKind: Record<GenAISpanKind, number> = {
      model_call: 0,
      tool_call: 0,
      agent_step: 0,
      retrieval: 0,
      approval: 0,
      artifact_job: 0,
      execution_run: 0,
    };

    for (const s of recent) byKind[s.kind]++;

    const modelSpans = recent.filter((s): s is GenAIModelCallSpan => s.kind === "model_call");
    const toolSpans = recent.filter((s): s is GenAIToolCallSpan => s.kind === "tool_call");
    const agentSpans = recent.filter((s): s is GenAIAgentStepSpan => s.kind === "agent_step");
    const retrievalSpans = recent.filter((s): s is GenAIRetrievalSpan => s.kind === "retrieval");
    const approvalSpans = recent.filter((s): s is GenAIApprovalSpan => s.kind === "approval");
    const artifactSpans = recent.filter((s): s is GenAIArtifactJobSpan => s.kind === "artifact_job");
    const runSpans = recent.filter((s): s is GenAIExecutionRunSpan => s.kind === "execution_run");

    const avgMs = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
    const p95 = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    };

    const byModel: GenAITelemetrySnapshot["modelCalls"]["byModel"] = {};
    for (const s of modelSpans) {
      if (!byModel[s.model]) byModel[s.model] = { count: 0, totalTokens: 0, totalCostUsd: 0, avgLatencyMs: 0 };
      byModel[s.model]!.count++;
      byModel[s.model]!.totalTokens += s.totalTokens;
      byModel[s.model]!.totalCostUsd += s.costEstimateUsd;
    }
    for (const [, v] of Object.entries(byModel)) {
      const modelKey = Object.keys(byModel).find(k => byModel[k] === v) ?? "";
      v.avgLatencyMs = avgMs(modelSpans.filter(s => s.model === modelKey).map(s => s.latencyMs));
    }

    const byTool: GenAITelemetrySnapshot["toolCalls"]["byTool"] = {};
    for (const s of toolSpans) {
      if (!byTool[s.toolName]) byTool[s.toolName] = { count: 0, errorRate: 0 };
      byTool[s.toolName]!.count++;
    }
    for (const [toolName, v] of Object.entries(byTool)) {
      const toolAll = toolSpans.filter(s => s.toolName === toolName);
      const toolErrors = toolAll.filter(s => s.status === "error").length;
      v.errorRate = toolAll.length > 0 ? toolErrors / toolAll.length : 0;
    }

    const byDomain: Record<string, number> = {};
    const byStepType: Record<string, number> = {};
    for (const s of agentSpans) {
      byDomain[s.agentDomain] = (byDomain[s.agentDomain] ?? 0) + 1;
      byStepType[s.stepType] = (byStepType[s.stepType] ?? 0) + 1;
    }

    return {
      windowMs,
      totalSpans: recent.length,
      byKind,
      modelCalls: {
        count: modelSpans.length,
        totalTokens: modelSpans.reduce((s, v) => s + v.totalTokens, 0),
        totalCostUsd: modelSpans.reduce((s, v) => s + v.costEstimateUsd, 0),
        avgLatencyMs: avgMs(modelSpans.map(s => s.latencyMs)),
        p95LatencyMs: p95(modelSpans.map(s => s.latencyMs)),
        errorRate: modelSpans.length > 0 ? modelSpans.filter(s => s.status === "error").length / modelSpans.length : 0,
        fallbackRate: modelSpans.length > 0 ? modelSpans.filter(s => s.usedFallback).length / modelSpans.length : 0,
        byModel,
      },
      toolCalls: {
        count: toolSpans.length,
        avgLatencyMs: avgMs(toolSpans.map(s => s.latencyMs)),
        errorRate: toolSpans.length > 0 ? toolSpans.filter(s => s.status === "error").length / toolSpans.length : 0,
        highRiskCount: toolSpans.filter(s => s.riskLevel === "high" || s.riskLevel === "critical").length,
        approvalRequired: toolSpans.filter(s => s.approvalRequired).length,
        byTool,
      },
      agentSteps: {
        count: agentSpans.length,
        avgLatencyMs: avgMs(agentSpans.map(s => s.latencyMs)),
        byDomain,
        byStepType,
      },
      retrievals: {
        count: retrievalSpans.length,
        avgLatencyMs: avgMs(retrievalSpans.map(s => s.latencyMs)),
        avgChunksRetrieved: retrievalSpans.length > 0 ? retrievalSpans.reduce((s, v) => s + v.chunksRetrieved, 0) / retrievalSpans.length : 0,
        avgChunksUsed: retrievalSpans.length > 0 ? retrievalSpans.reduce((s, v) => s + v.chunksUsed, 0) / retrievalSpans.length : 0,
        avgTopScore: retrievalSpans.length > 0 ? retrievalSpans.reduce((s, v) => s + (v.topScore ?? 0), 0) / retrievalSpans.length : 0,
      },
      approvals: {
        count: approvalSpans.length,
        avgDelayMs: avgMs(approvalSpans.filter(s => s.approvalDelayMs != null).map(s => s.approvalDelayMs!)),
        approved: approvalSpans.filter(s => s.outcome === "approved" || s.outcome === "auto_approved").length,
        rejected: approvalSpans.filter(s => s.outcome === "rejected").length,
        overrides: approvalSpans.filter(s => s.overrideApplied).length,
        pending: approvalSpans.filter(s => s.outcome === "pending").length,
      },
      artifactJobs: {
        count: artifactSpans.length,
        avgLatencyMs: avgMs(artifactSpans.map(s => s.latencyMs)),
        errorRate: artifactSpans.length > 0 ? artifactSpans.filter(s => s.status === "error").length / artifactSpans.length : 0,
      },
      executionRuns: {
        count: runSpans.length,
        avgLatencyMs: avgMs(runSpans.map(s => s.latencyMs)),
        avgRetries: runSpans.length > 0 ? runSpans.reduce((s, v) => s + (v.retryCount ?? 0), 0) / runSpans.length : 0,
        errorRate: runSpans.length > 0 ? runSpans.filter(s => s.status === "error").length / runSpans.length : 0,
      },
    };
  }

  exportLangfuseTrace(traceId: string, name: string, metadata?: Record<string, unknown>): {
    trace: LangfuseTrace;
    observations: LangfuseObservation[];
  } {
    const spans = this.getSpansByTrace(traceId);

    const trace: LangfuseTrace = {
      id: traceId,
      name,
      ...(metadata !== undefined ? { metadata } : {}),
      createdAt: new Date().toISOString(),
    };

    const observations: LangfuseObservation[] = spans.map(span => {
      const base = {
        traceId,
        startTime: new Date(span.timestamp).toISOString(),
        metadata: { spanId: span.spanId, correlationId: ("correlationId" in span ? span.correlationId : undefined) },
      };

      if (span.kind === "model_call") {
        return {
          ...base,
          type: "GENERATION" as const,
          name: `model_call:${span.model}`,
          endTime: new Date(span.timestamp + span.latencyMs).toISOString(),
          model: span.model,
          usage: { input: span.promptTokens, output: span.completionTokens, total: span.totalTokens, unit: "TOKENS" as const },
          level: span.status === "error" ? "ERROR" as const : "DEFAULT" as const,
          ...(span.error !== undefined ? { statusMessage: span.error } : {}),
        };
      }

      if (span.kind === "tool_call") {
        return {
          ...base,
          type: "SPAN" as const,
          name: `tool_call:${span.toolName}`,
          endTime: new Date(span.timestamp + span.latencyMs).toISOString(),
          input: span.toolInput,
          output: span.toolOutput,
          level: span.status === "error" ? "ERROR" as const : "DEFAULT" as const,
        };
      }

      if (span.kind === "retrieval") {
        return {
          ...base,
          type: "SPAN" as const,
          name: `retrieval:${span.engine}`,
          endTime: new Date(span.timestamp + span.latencyMs).toISOString(),
          input: { query: span.query },
          output: { chunksRetrieved: span.chunksRetrieved, chunksUsed: span.chunksUsed, topScore: span.topScore },
          level: span.status === "error" ? "ERROR" as const : "DEFAULT" as const,
        };
      }

      return {
        ...base,
        type: "EVENT" as const,
        name: `${span.kind}:${span.spanId}`,
        level: "DEFAULT" as const,
      };
    });

    return { trace, observations };
  }

  perAppDashboard(appSlug: string, windowMs = 300_000): {
    appSlug: string;
    windowMs: number;
    snapshot: GenAITelemetrySnapshot;
    recentErrors: Array<{ spanId: string; kind: GenAISpanKind; error: string; timestamp: number }>;
  } {
    const snapshot = this.getSnapshot(windowMs);
    const recent = this.getSpans(windowMs);
    const recentErrors = recent
      .filter(s => ("error" in s) && s.error)
      .slice(-20)
      .map(s => ({
        spanId: s.spanId,
        kind: s.kind,
        error: ("error" in s && s.error) ? s.error : "unknown",
        timestamp: s.timestamp,
      }));

    return { appSlug, windowMs, snapshot, recentErrors };
  }
}

export const genAITelemetry = new GenAITelemetryCollector();
