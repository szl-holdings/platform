import type { TraceRecord, TraceSpan, ToolCallRecord, RetrievalRecord, MemoryIORecord, CitationRecord, GuardrailResult } from "./schema.js";
import type { TraceStore } from "./store.js";

export class TraceWriter {
  private store: TraceStore;

  constructor(store: TraceStore) {
    this.store = store;
  }

  startTrace(params: Pick<TraceRecord, "traceId" | "sessionId" | "workflowId" | "agentId" | "model" | "promptVersion" | "requestId"> & Partial<TraceRecord>): TraceRecord {
    const { traceId, requestId, sessionId, workflowId, agentId, model, promptVersion, ...rest } = params;
    const trace: TraceRecord = {
      traceId,
      requestId,
      sessionId,
      workflowId,
      agentId,
      model,
      promptVersion,
      toolCalls: [],
      retrieval: [],
      memoryIO: [],
      citations: [],
      guardrailResults: [],
      spans: [],
      approvals: [],
      errors: [],
      retries: 0,
      status: "running",
      startedAt: new Date().toISOString(),
      metadata: {},
      ...rest,
    };
    this.store.save(trace);
    return trace;
  }

  appendToolCall(traceId: string, record: ToolCallRecord): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.toolCalls.push(record);
    this.store.save(trace);
  }

  appendRetrieval(traceId: string, record: RetrievalRecord): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.retrieval.push(record);
    this.store.save(trace);
  }

  appendMemoryIO(traceId: string, record: MemoryIORecord): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.memoryIO.push(record);
    this.store.save(trace);
  }

  appendCitation(traceId: string, record: CitationRecord): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.citations.push(record);
    this.store.save(trace);
  }

  appendGuardrailResult(traceId: string, result: GuardrailResult): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.guardrailResults.push(result);
    this.store.save(trace);
  }

  appendSpan(traceId: string, span: TraceSpan): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.spans.push(span);
    this.store.save(trace);
  }

  completeTrace(traceId: string, params: { status?: TraceRecord["status"]; latencyMs?: number; totalTokens?: number; costUsd?: number; businessImpact?: TraceRecord["businessImpact"] } = {}): TraceRecord {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    const completed: TraceRecord = {
      ...trace,
      status: params.status ?? "completed",
      completedAt: new Date().toISOString(),
      latencyMs: params.latencyMs ?? trace.latencyMs,
      totalTokens: params.totalTokens ?? trace.totalTokens,
      costUsd: params.costUsd ?? trace.costUsd,
      businessImpact: params.businessImpact ?? trace.businessImpact,
    };
    this.store.save(completed);
    return completed;
  }

  recordError(traceId: string, code: string, message: string): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.errors.push({ code, message, timestamp: new Date().toISOString() });
    this.store.save(trace);
  }
}
