import { createLogger } from "./logger.js";

const logger = createLogger("nvidia-adapters:agent-profiler");

export interface AgentProfileEntry {
  agentId: string;
  agentTier: string;
  traceId: string;
  domain?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  steps: AgentStepProfile[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  toolsUsed: string[];
  modelsUsed: string[];
  status: "running" | "completed" | "failed" | "timed_out";
  errorMessage?: string;
  performanceGrade?: "A" | "B" | "C" | "D" | "F";
}

export interface AgentStepProfile {
  stepId: string;
  stepIndex: number;
  type: "llm_call" | "tool_call" | "retrieval" | "planning" | "delegation";
  model?: string;
  tool?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  success: boolean;
  errorMessage?: string;
}

export interface ProfileSummary {
  agentId: string;
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  avgTotalCostUsd: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  p95DurationMs: number;
  p99DurationMs: number;
  topTools: Array<{ tool: string; count: number }>;
  topModels: Array<{ model: string; count: number }>;
  gradeDist: Record<string, number>;
}

function gradePerformance(entry: AgentProfileEntry): AgentProfileEntry["performanceGrade"] {
  if (!entry.completedAt) return undefined;
  const durationMs = entry.durationMs ?? 0;
  const success = entry.status === "completed";

  if (!success) return "F";
  if (durationMs < 1000 && entry.totalCostUsd < 0.01) return "A";
  if (durationMs < 5000 && entry.totalCostUsd < 0.10) return "B";
  if (durationMs < 15000 && entry.totalCostUsd < 0.50) return "C";
  if (durationMs < 30000) return "D";
  return "F";
}

class AgentProfiler {
  private entries: Map<string, AgentProfileEntry> = new Map();
  private completed: AgentProfileEntry[] = [];
  private readonly MAX_COMPLETED = 10_000;

  startTrace(params: {
    agentId: string;
    agentTier: string;
    traceId?: string;
    domain?: string;
  }): string {
    const traceId = params.traceId ?? `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: AgentProfileEntry = {
      agentId: params.agentId,
      agentTier: params.agentTier,
      traceId,
      domain: params.domain,
      startedAt: new Date().toISOString(),
      steps: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      toolsUsed: [],
      modelsUsed: [],
      status: "running",
    };
    this.entries.set(traceId, entry);
    logger.debug({ traceId, agentId: params.agentId, tier: params.agentTier }, "Agent trace started");
    return traceId;
  }

  recordStep(traceId: string, step: Omit<AgentStepProfile, "stepId" | "stepIndex">): string {
    const entry = this.entries.get(traceId);
    if (!entry) throw new Error(`Trace '${traceId}' not found`);

    const stepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fullStep: AgentStepProfile = { ...step, stepId, stepIndex: entry.steps.length };

    entry.steps.push(fullStep);

    if (step.inputTokens) entry.totalInputTokens += step.inputTokens;
    if (step.outputTokens) entry.totalOutputTokens += step.outputTokens;
    if (step.costUsd) entry.totalCostUsd += step.costUsd;
    if (step.tool && !entry.toolsUsed.includes(step.tool)) entry.toolsUsed.push(step.tool);
    if (step.model && !entry.modelsUsed.includes(step.model)) entry.modelsUsed.push(step.model);

    return stepId;
  }

  completeStep(traceId: string, stepId: string, outcome: { success: boolean; errorMessage?: string; durationMs?: number }): void {
    const entry = this.entries.get(traceId);
    if (!entry) return;
    const step = entry.steps.find(s => s.stepId === stepId);
    if (!step) return;
    step.completedAt = new Date().toISOString();
    step.success = outcome.success;
    step.errorMessage = outcome.errorMessage;
    if (outcome.durationMs !== undefined) step.durationMs = outcome.durationMs;
  }

  endTrace(traceId: string, status: AgentProfileEntry["status"], errorMessage?: string): AgentProfileEntry {
    const entry = this.entries.get(traceId);
    if (!entry) throw new Error(`Trace '${traceId}' not found`);

    entry.completedAt = new Date().toISOString();
    entry.status = status;
    entry.errorMessage = errorMessage;
    entry.durationMs = new Date(entry.completedAt).getTime() - new Date(entry.startedAt).getTime();
    entry.performanceGrade = gradePerformance(entry);

    this.entries.delete(traceId);
    this.completed.unshift(entry);
    if (this.completed.length > this.MAX_COMPLETED) this.completed.length = this.MAX_COMPLETED;

    logger.info({
      traceId,
      agentId: entry.agentId,
      status,
      durationMs: entry.durationMs,
      grade: entry.performanceGrade,
      steps: entry.steps.length,
      costUsd: entry.totalCostUsd.toFixed(6),
    }, "Agent trace complete");

    return entry;
  }

  getTrace(traceId: string): AgentProfileEntry | undefined {
    return this.entries.get(traceId) ?? this.completed.find(e => e.traceId === traceId);
  }

  getHistory(filters: { agentId?: string; tier?: string; status?: string; limit?: number } = {}): AgentProfileEntry[] {
    let results = this.completed;
    if (filters.agentId) results = results.filter(e => e.agentId === filters.agentId);
    if (filters.tier) results = results.filter(e => e.agentTier === filters.tier);
    if (filters.status) results = results.filter(e => e.status === filters.status);
    return results.slice(0, filters.limit ?? 100);
  }

  getSummary(agentId: string): ProfileSummary | undefined {
    const records = this.completed.filter(e => e.agentId === agentId && e.durationMs !== undefined);
    if (records.length === 0) return undefined;

    const durations = records.map(r => r.durationMs ?? 0).sort((a, b) => a - b);
    const p95Idx = Math.floor(records.length * 0.95);
    const p99Idx = Math.floor(records.length * 0.99);

    const toolCounts: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};
    const gradeDist: Record<string, number> = {};

    for (const r of records) {
      for (const t of r.toolsUsed) toolCounts[t] = (toolCounts[t] ?? 0) + 1;
      for (const m of r.modelsUsed) modelCounts[m] = (modelCounts[m] ?? 0) + 1;
      if (r.performanceGrade) gradeDist[r.performanceGrade] = (gradeDist[r.performanceGrade] ?? 0) + 1;
    }

    return {
      agentId,
      totalRuns: records.length,
      successRate: records.filter(r => r.status === "completed").length / records.length,
      avgDurationMs: durations.reduce((s, d) => s + d, 0) / records.length,
      avgTotalCostUsd: records.reduce((s, r) => s + r.totalCostUsd, 0) / records.length,
      avgInputTokens: records.reduce((s, r) => s + r.totalInputTokens, 0) / records.length,
      avgOutputTokens: records.reduce((s, r) => s + r.totalOutputTokens, 0) / records.length,
      p95DurationMs: durations[Math.min(p95Idx, durations.length - 1)] ?? 0,
      p99DurationMs: durations[Math.min(p99Idx, durations.length - 1)] ?? 0,
      topTools: Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tool, count]) => ({ tool, count })),
      topModels: Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([model, count]) => ({ model, count })),
      gradeDist,
    };
  }

  getActiveTraces(): AgentProfileEntry[] {
    return Array.from(this.entries.values());
  }
}

export const agentProfiler = new AgentProfiler();
export { AgentProfiler };
