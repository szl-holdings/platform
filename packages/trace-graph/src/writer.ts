import { randomUUID } from 'crypto';
import type {
  CitationRecord,
  GuardrailResult,
  MemoryIORecord,
  OperatorComment,
  PlanGraph,
  ReflectionEntry,
  RetrievalRecord,
  RollbackPoint,
  RunGrade,
  ToolCallRecord,
  TraceRecord,
  TraceSpan,
  VerifierDecision,
} from './schema.js';
import type { TraceStore } from './store.js';

export class TraceWriter {
  private store: TraceStore;

  constructor(store: TraceStore) {
    this.store = store;
  }

  startTrace(params: Pick<TraceRecord, 'traceId'> & Partial<TraceRecord>): TraceRecord {
    const trace: TraceRecord = {
      traceId: params.traceId,
      runId: params.runId ?? params.traceId,
      requestId: params.requestId,
      sessionId: params.sessionId,
      workflowId: params.workflowId,
      agentId: params.agentId,
      objective: params.objective,
      selfModelSnapshot: params.selfModelSnapshot,
      worldModelSnapshotRef: params.worldModelSnapshotRef,
      planGraph: params.planGraph,
      model: params.model,
      modelsUsed: params.modelsUsed ?? [],
      promptVersion: params.promptVersion,
      promptVersions: params.promptVersions ?? [],
      toolCalls: params.toolCalls ?? [],
      retrieval: params.retrieval ?? [],
      memoryIO: params.memoryIO ?? [],
      citations: params.citations ?? [],
      guardrailResults: params.guardrailResults ?? [],
      verifierDecisions: params.verifierDecisions ?? [],
      reflections: params.reflections ?? [],
      rollbackPoints: params.rollbackPoints ?? [],
      spans: params.spans ?? [],
      approvals: params.approvals ?? [],
      errors: params.errors ?? [],
      retries: params.retries ?? 0,
      rollbackId: params.rollbackId,
      output: params.output,
      operatorComments: params.operatorComments ?? [],
      grade: params.grade,
      businessImpact: params.businessImpact,
      status: 'running',
      startedAt: new Date().toISOString(),
      metadata: params.metadata ?? {},
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

  appendVerifierDecision(traceId: string, decision: VerifierDecision): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.verifierDecisions.push(decision);
    this.store.save(trace);
  }

  appendReflection(traceId: string, reflection: ReflectionEntry): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.reflections.push(reflection);
    this.store.save(trace);
  }

  addRollbackPoint(traceId: string, point: RollbackPoint): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.rollbackPoints.push(point);
    this.store.save(trace);
  }

  appendSpan(traceId: string, span: TraceSpan): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.spans.push(span);
    this.store.save(trace);
  }

  setPlanGraph(traceId: string, planGraph: PlanGraph): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.planGraph = planGraph;
    this.store.save(trace);
  }

  setSelfModelSnapshot(traceId: string, snapshot: Record<string, unknown>): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.selfModelSnapshot = snapshot;
    this.store.save(trace);
  }

  setWorldModelSnapshotRef(traceId: string, ref: string): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.worldModelSnapshotRef = ref;
    this.store.save(trace);
  }

  setOutput(traceId: string, output: Record<string, unknown>): void {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    trace.output = output;
    this.store.save(trace);
  }

  addOperatorComment(
    traceId: string,
    operatorId: string,
    content: string,
    opts: { spanId?: string; tags?: string[] } = {},
  ): OperatorComment {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    const comment: OperatorComment = {
      commentId: randomUUID(),
      operatorId,
      spanId: opts.spanId,
      content,
      createdAt: new Date().toISOString(),
      tags: opts.tags ?? [],
    };
    trace.operatorComments.push(comment);
    this.store.save(trace);
    return comment;
  }

  gradeRun(traceId: string, grade: Omit<RunGrade, 'gradeId' | 'gradedAt'>): RunGrade {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    const fullGrade: RunGrade = {
      gradeId: randomUUID(),
      gradedAt: new Date().toISOString(),
      ...grade,
    };
    trace.grade = fullGrade;
    this.store.save(trace);
    return fullGrade;
  }

  completeTrace(
    traceId: string,
    params: {
      status?: TraceRecord['status'];
      latencyMs?: number;
      totalTokens?: number;
      costUsd?: number;
      businessImpact?: TraceRecord['businessImpact'];
      output?: Record<string, unknown>;
    } = {},
  ): TraceRecord {
    const trace = this.store.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);
    const completed: TraceRecord = {
      ...trace,
      status: params.status ?? 'completed',
      completedAt: new Date().toISOString(),
      latencyMs: params.latencyMs ?? trace.latencyMs,
      totalTokens: params.totalTokens ?? trace.totalTokens,
      costUsd: params.costUsd ?? trace.costUsd,
      businessImpact: params.businessImpact ?? trace.businessImpact,
      output: params.output ?? trace.output,
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
