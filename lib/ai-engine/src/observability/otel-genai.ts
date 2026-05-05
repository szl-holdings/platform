/**
 * OpenTelemetry GenAI Semantic Conventions Emitter
 *
 * Emits OTel GenAI semconv spans for every model call, tool call, subagent spawn,
 * hook decision, and plan signing. Mirrors the same data to ProofLedger so OTel
 * and Proof Chain are dual outputs of the same instrumentation.
 *
 * Attribute names follow OTel GenAI semconv 1.28.0:
 *   gen_ai.system, gen_ai.request.model, gen_ai.usage.input_tokens,
 *   gen_ai.usage.output_tokens, gen_ai.agent.name, gen_ai.operation.name
 *
 * A11oy extensions (custom):
 *   gen_ai.a11oy.session_id, gen_ai.a11oy.proof_packet_id,
 *   gen_ai.a11oy.hook_decisions, gen_ai.a11oy.trust_tier
 */

import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GenAIOperation =
  | 'chat'
  | 'tool_call'
  | 'subagent_spawn'
  | 'hook_decision'
  | 'plan_sign'
  | 'memory_write'
  | 'skill_invoke';

export interface GenAISpan {
  span_id: string;
  trace_id: string;
  parent_span_id?: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  status: 'ok' | 'error';
  attributes: GenAIAttributes;
}

export interface GenAIAttributes {
  'gen_ai.system'?: string;
  'gen_ai.request.model'?: string;
  'gen_ai.usage.input_tokens'?: number;
  'gen_ai.usage.output_tokens'?: number;
  'gen_ai.agent.name'?: string;
  'gen_ai.operation.name': GenAIOperation;
  'gen_ai.tool.name'?: string;
  'gen_ai.hook.event'?: string;
  'gen_ai.hook.action'?: string;
  'gen_ai.plan.id'?: string;
  'gen_ai.plan.signed'?: boolean;
  'gen_ai.skill.id'?: string;
  'gen_ai.a11oy.session_id'?: string;
  'gen_ai.a11oy.proof_packet_id'?: string;
  'gen_ai.a11oy.hook_decisions'?: string;
  'gen_ai.a11oy.trust_tier'?: number;
  'gen_ai.a11oy.subagent_id'?: string;
  'gen_ai.a11oy.memory_tier'?: string;
  error?: string;
  [key: string]: unknown;
}

export interface SpanOptions {
  operation: GenAIOperation;
  session_id?: string;
  proof_packet_id?: string;
  parent_span_id?: string;
  attributes?: Partial<GenAIAttributes>;
}

// ---------------------------------------------------------------------------
// In-process span store (bounded ring buffer)
// ---------------------------------------------------------------------------

const MAX_SPANS = 5000;
const spanStore: GenAISpan[] = [];

export function getRecentSpans(limit = 50, operation?: GenAIOperation): GenAISpan[] {
  const spans = operation ? spanStore.filter(s => s.attributes['gen_ai.operation.name'] === operation) : spanStore;
  return spans.slice(0, limit);
}

export function getSpansBySession(session_id: string): GenAISpan[] {
  return spanStore.filter(s => s.attributes['gen_ai.a11oy.session_id'] === session_id);
}

// ---------------------------------------------------------------------------
// Active trace context (simple per-async-context tracking)
// ---------------------------------------------------------------------------

const activeTraceIds = new Map<string, string>();

export function startTrace(session_id?: string): { trace_id: string; session_id: string } {
  const trace_id = randomUUID();
  const sid = session_id ?? randomUUID();
  if (session_id) activeTraceIds.set(session_id, trace_id);
  return { trace_id, session_id: sid };
}

// ---------------------------------------------------------------------------
// Core span recorder
// ---------------------------------------------------------------------------

async function mirrorToProofLedger(span: GenAISpan): Promise<void> {
  try {
    const { tagAIContent } = await import('@szl-holdings/proof-chain');
    await tagAIContent({
      contentId: `otel-${span.span_id}`,
      contentType: 'otel_genai_span',
      sourceClass: 'system_computed',
      correlationId: span.attributes['gen_ai.a11oy.session_id'] ?? span.trace_id,
      serviceAttribution: span.attributes['gen_ai.agent.name'] ?? 'ai-engine',
      metadata: {
        operation: span.attributes['gen_ai.operation.name'],
        model: span.attributes['gen_ai.request.model'],
        duration_ms: span.duration_ms,
        proof_packet_id: span.attributes['gen_ai.a11oy.proof_packet_id'],
      },
    });
  } catch {
    // ProofLedger is best-effort
  }
}

export async function recordSpan(
  trace_id: string,
  options: SpanOptions,
  work: () => Promise<{ attributes?: Partial<GenAIAttributes>; error?: string }>,
): Promise<GenAISpan> {
  const span_id = randomUUID().slice(0, 16);
  const start_time = new Date().toISOString();
  const startMs = Date.now();

  let resultAttributes: Partial<GenAIAttributes> = {};
  let status: 'ok' | 'error' = 'ok';
  let errorMsg: string | undefined;

  try {
    const result = await work();
    resultAttributes = result.attributes ?? {};
    if (result.error) { status = 'error'; errorMsg = result.error; }
  } catch (err) {
    status = 'error';
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  const span: GenAISpan = {
    span_id,
    trace_id,
    parent_span_id: options.parent_span_id,
    name: `${options.operation}`,
    start_time,
    end_time: new Date().toISOString(),
    duration_ms: Date.now() - startMs,
    status,
    attributes: {
      'gen_ai.operation.name': options.operation,
      'gen_ai.a11oy.session_id': options.session_id,
      'gen_ai.a11oy.proof_packet_id': options.proof_packet_id,
      ...options.attributes,
      ...resultAttributes,
      ...(errorMsg ? { error: errorMsg } : {}),
    },
  };

  spanStore.unshift(span);
  if (spanStore.length > MAX_SPANS) spanStore.length = MAX_SPANS;

  void mirrorToProofLedger(span);

  return span;
}

// ---------------------------------------------------------------------------
// Convenience recorders
// ---------------------------------------------------------------------------

export async function recordModelCall(params: {
  trace_id: string;
  session_id?: string;
  agent_name: string;
  model: string;
  system: string;
  input_tokens?: number;
  output_tokens?: number;
  trust_tier?: number;
  proof_packet_id?: string;
  parent_span_id?: string;
  work: () => Promise<{ input_tokens?: number; output_tokens?: number; error?: string }>;
}): Promise<GenAISpan> {
  return recordSpan(
    params.trace_id,
    {
      operation: 'chat',
      session_id: params.session_id,
      proof_packet_id: params.proof_packet_id,
      parent_span_id: params.parent_span_id,
      attributes: {
        'gen_ai.system': params.system,
        'gen_ai.request.model': params.model,
        'gen_ai.agent.name': params.agent_name,
        'gen_ai.a11oy.trust_tier': params.trust_tier,
      },
    },
    async () => {
      const result = await params.work();
      return {
        attributes: {
          'gen_ai.usage.input_tokens': result.input_tokens ?? params.input_tokens,
          'gen_ai.usage.output_tokens': result.output_tokens ?? params.output_tokens,
        },
        error: result.error,
      };
    },
  );
}

export async function recordToolCall(params: {
  trace_id: string;
  session_id?: string;
  agent_name: string;
  tool_name: string;
  trust_tier?: number;
  proof_packet_id?: string;
  parent_span_id?: string;
  work: () => Promise<{ error?: string }>;
}): Promise<GenAISpan> {
  return recordSpan(
    params.trace_id,
    {
      operation: 'tool_call',
      session_id: params.session_id,
      proof_packet_id: params.proof_packet_id,
      parent_span_id: params.parent_span_id,
      attributes: {
        'gen_ai.agent.name': params.agent_name,
        'gen_ai.tool.name': params.tool_name,
        'gen_ai.a11oy.trust_tier': params.trust_tier,
      },
    },
    params.work,
  );
}

export async function recordSubagentSpawn(params: {
  trace_id: string;
  session_id?: string;
  parent_agent: string;
  subagent_id: string;
  model: string;
  trust_tier?: number;
  proof_packet_id?: string;
  parent_span_id?: string;
  work: () => Promise<{ error?: string }>;
}): Promise<GenAISpan> {
  return recordSpan(
    params.trace_id,
    {
      operation: 'subagent_spawn',
      session_id: params.session_id,
      proof_packet_id: params.proof_packet_id,
      parent_span_id: params.parent_span_id,
      attributes: {
        'gen_ai.agent.name': params.parent_agent,
        'gen_ai.request.model': params.model,
        'gen_ai.a11oy.subagent_id': params.subagent_id,
        'gen_ai.a11oy.trust_tier': params.trust_tier,
      },
    },
    params.work,
  );
}

export async function recordHookDecision(params: {
  trace_id: string;
  session_id?: string;
  hook_id: string;
  event: string;
  action: string;
  proof_packet_id?: string;
}): Promise<GenAISpan> {
  return recordSpan(
    params.trace_id,
    {
      operation: 'hook_decision',
      session_id: params.session_id,
      proof_packet_id: params.proof_packet_id,
      attributes: {
        'gen_ai.agent.name': params.hook_id,
        'gen_ai.hook.event': params.event,
        'gen_ai.hook.action': params.action,
      },
    },
    async () => ({}),
  );
}

export async function recordPlanSign(params: {
  trace_id: string;
  session_id?: string;
  plan_id: string;
  agent_name: string;
  proof_packet_id?: string;
}): Promise<GenAISpan> {
  return recordSpan(
    params.trace_id,
    {
      operation: 'plan_sign',
      session_id: params.session_id,
      proof_packet_id: params.proof_packet_id,
      attributes: {
        'gen_ai.agent.name': params.agent_name,
        'gen_ai.plan.id': params.plan_id,
        'gen_ai.plan.signed': true,
      },
    },
    async () => ({}),
  );
}

export async function recordSkillInvoke(params: {
  trace_id: string;
  session_id?: string;
  skill_id: string;
  agent_name: string;
  proof_packet_id?: string;
  work: () => Promise<{ error?: string }>;
}): Promise<GenAISpan> {
  return recordSpan(
    params.trace_id,
    {
      operation: 'skill_invoke',
      session_id: params.session_id,
      proof_packet_id: params.proof_packet_id,
      attributes: {
        'gen_ai.agent.name': params.agent_name,
        'gen_ai.skill.id': params.skill_id,
      },
    },
    params.work,
  );
}
