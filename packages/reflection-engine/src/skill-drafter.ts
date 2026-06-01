import type { TraceRecord } from '@workspace/trace-graph';
import type { QualityScore } from './scorer.js';
import type { CandidateSkill, FailureMode } from './types.js';

const CANDIDATE_SKILL_QUALITY_THRESHOLD = 0.8;
const MIN_TOOL_CALLS_FOR_SKILL = 2;

export function shouldDraftSkill(
  trace: TraceRecord,
  score: QualityScore,
  failureMode: FailureMode,
): boolean {
  if (score.overall < CANDIDATE_SKILL_QUALITY_THRESHOLD) return false;
  if (failureMode !== 'no_failure') return false;
  if (trace.toolCalls.length < MIN_TOOL_CALLS_FOR_SKILL) return false;
  return true;
}

export function draftCandidateSkill(trace: TraceRecord, score: QualityScore): CandidateSkill {
  const tools = [...new Set(trace.toolCalls.map((t) => t.toolName))];
  const agentId = trace.agentId ?? 'unknown';

  const keywords: string[] = [agentId, ...tools.map((t) => t.toLowerCase())];
  if (trace.model) keywords.push(trace.model.toLowerCase());

  const workflowId = trace.workflowId ?? '';
  const domain = inferDomainFromTrace(trace);

  const skillId = `candidate_${agentId}_${workflowId || trace.traceId.slice(0, 8)}_${Date.now()}`;

  const inputFields = deriveInputFields(trace);
  const outputFields = deriveOutputFields(trace);

  return {
    skillId,
    name: `Auto-drafted: ${domain} ${agentId} pattern`,
    description:
      `Candidate skill derived from high-quality trace ${trace.traceId}. ` +
      `Agent: ${agentId}. Tools: ${tools.join(', ')}. ` +
      `Quality score: ${(score.overall * 100).toFixed(0)}/100.`,
    category: inferCategory(trace),
    triggerKeywords: [...new Set(keywords.filter((k) => k.length > 2))],
    inputFields,
    outputFields,
    estimatedTokens: trace.totalTokens ?? 800,
    derivedFromTraceId: trace.traceId,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
}

function inferDomainFromTrace(trace: TraceRecord): string {
  const metadata = trace.metadata as Record<string, unknown>;
  if (typeof metadata.domain === 'string') return metadata.domain;
  const agentId = (trace.agentId ?? '').toLowerCase();
  if (agentId.includes('security') || agentId.includes('sentinel')) return 'security';
  if (agentId.includes('maritime') || agentId.includes('vessel') || agentId.includes('helmsman'))
    return 'maritime';
  if (agentId.includes('research') || agentId.includes('inca')) return 'research';
  if (agentId.includes('terra') || agentId.includes('real-estate')) return 'real-estate';
  if (agentId.includes('alloy') || agentId.includes('orchestrat')) return 'orchestration';
  return 'general';
}

function inferCategory(trace: TraceRecord): CandidateSkill['category'] {
  const tools = trace.toolCalls.map((t) => t.toolName.toLowerCase()).join(' ');
  const agentId = (trace.agentId ?? '').toLowerCase();
  if (tools.includes('search') || tools.includes('retriev') || tools.includes('query'))
    return 'research';
  if (tools.includes('analyz') || tools.includes('score') || tools.includes('detect'))
    return 'analysis';
  if (tools.includes('generat') || tools.includes('draft') || tools.includes('write'))
    return 'generation';
  if (tools.includes('extract') || tools.includes('parse')) return 'extraction';
  if (tools.includes('validate') || tools.includes('check') || tools.includes('verify'))
    return 'validation';
  if (tools.includes('monitor') || tools.includes('alert') || tools.includes('watch'))
    return 'monitoring';
  if (agentId.includes('orchestrat') || agentId.includes('alloy')) return 'orchestration';
  return 'synthesis';
}

function deriveInputFields(trace: TraceRecord): string[] {
  const fields = new Set<string>();
  for (const tc of trace.toolCalls) {
    if (tc.inputHash) fields.add('input_context');
  }
  for (const r of trace.retrieval) {
    if (r.query) fields.add('query');
    fields.add('retrieval_source');
  }
  if (trace.agentId) fields.add('agent_context');
  if (fields.size === 0) fields.add('input_description');
  return Array.from(fields);
}

function deriveOutputFields(trace: TraceRecord): string[] {
  const fields = new Set<string>();
  for (const tc of trace.toolCalls) {
    if (tc.outputHash) fields.add('tool_output');
  }
  for (const _c of trace.citations) {
    fields.add('citations');
  }
  if (trace.businessImpact) {
    fields.add('business_impact');
  }
  if (fields.size === 0) fields.add('result');
  return Array.from(fields);
}
