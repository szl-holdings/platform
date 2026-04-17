import type { EvalCase, EvalRunReport } from "./runtime.js";

export interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime: number;
  status: "ok" | "error" | "timeout";
  attributes?: Record<string, unknown>;
  events?: Array<{ name: string; timestamp: number; attributes?: Record<string, unknown> }>;
}

export interface Trace {
  traceId: string;
  rootSpan: TraceSpan;
  spans: TraceSpan[];
  durationMs: number;
  status: "ok" | "error" | "partial";
  domain?: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

export function summarizeTrace(trace: Trace): {
  spanCount: number;
  errorCount: number;
  durationMs: number;
  status: string;
  toolCalls: string[];
  agentSteps: number;
} {
  const errorCount = trace.spans.filter((s) => s.status === "error").length;
  const toolCalls = trace.spans
    .filter((s) => s.name.startsWith("tool:") || s.attributes?.type === "tool-call")
    .map((s) => s.name);
  const agentSteps = trace.spans.filter((s) => s.attributes?.type === "agent-step").length;

  return {
    spanCount: trace.spans.length,
    errorCount,
    durationMs: trace.durationMs,
    status: trace.status,
    toolCalls,
    agentSteps,
  };
}

export function matchTraceToCase(
  trace: Trace,
  evalCase: EvalCase,
): { matched: boolean; confidence: number; notes: string[] } {
  const notes: string[] = [];
  let score = 0;

  if (trace.domain === evalCase.domain) {
    score += 0.4;
  } else {
    notes.push(`Domain mismatch: trace=${trace.domain} case=${evalCase.domain}`);
  }

  const caseId = evalCase.id;
  const hasRef = trace.spans.some(
    (s) => s.attributes?.caseId === caseId || s.attributes?.evalCaseId === caseId,
  );
  if (hasRef) {
    score += 0.6;
  } else {
    notes.push("No direct case reference in trace spans");
  }

  return {
    matched: score >= 0.5,
    confidence: score,
    notes,
  };
}

export function buildTraceStore(traces: Trace[]): Map<string, Record<string, unknown>> {
  const store = new Map<string, Record<string, unknown>>();
  for (const trace of traces) {
    const summary = summarizeTrace(trace);
    store.set(trace.traceId, {
      traceId: trace.traceId,
      ...summary,
      metadata: trace.metadata,
    });
  }
  return store;
}

export function gradeRunWithTraces(
  report: EvalRunReport,
  traces: Trace[],
): {
  tracedCases: number;
  untracedCases: number;
  traceErrorRate: number;
  avgSpanCount: number;
  traceAugmentedReport: EvalRunReport;
} {
  const traceMap = new Map<string, Trace>(traces.map((t) => [t.traceId, t]));
  let tracedCases = 0;
  let totalSpans = 0;
  let traceErrors = 0;

  const augmentedResults = report.caseResults.map((result) => {
    if (!result.traceId) return result;
    const trace = traceMap.get(result.traceId);
    if (!trace) return result;

    tracedCases++;
    const summary = summarizeTrace(trace);
    totalSpans += summary.spanCount;
    traceErrors += summary.errorCount;

    return {
      ...result,
      graderDetails: {
        ...result.graderDetails,
        traceSpans: summary.spanCount,
        traceErrors: summary.errorCount,
        traceStatus: trace.status,
        toolCalls: summary.toolCalls,
      },
    };
  });

  const untracedCases = report.caseResults.length - tracedCases;
  const traceErrorRate = tracedCases > 0 ? traceErrors / tracedCases : 0;
  const avgSpanCount = tracedCases > 0 ? totalSpans / tracedCases : 0;

  return {
    tracedCases,
    untracedCases,
    traceErrorRate,
    avgSpanCount,
    traceAugmentedReport: { ...report, caseResults: augmentedResults },
  };
}
