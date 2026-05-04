import type { MirrorEvalDisposition, MirrorEvalResult, MirrorEvalScore } from '../types.js';
import { randomUUID } from 'node:crypto';

const EVAL_VERSION = '1.0.0';

export interface MirrorEvalInput {
  targetId: string;
  targetType: 'action' | 'workcell' | 'signal' | 'pce';
  evidenceRefs: string[];
  sourceCoverage: number;
  hasPriorApproval: boolean;
  isDestructive: boolean;
  isDemoMode: boolean;
  actionDescription?: string;
  policyViolations?: string[];
  contextFreshness?: number;
  approvalTier?: string;
  riskLevel?: string;
}

function scoreGroundedness(input: MirrorEvalInput): MirrorEvalScore {
  const score = Math.min(1, input.evidenceRefs.length / 3) * input.sourceCoverage;
  return {
    dimension: 'groundedness',
    score: Math.round(score * 100) / 100,
    rationale:
      score >= 0.7
        ? 'Action is well-grounded in cited evidence.'
        : score >= 0.4
          ? 'Partial evidence found; additional citations recommended.'
          : 'Insufficient evidence grounding. Action may be speculative.',
    flag: score < 0.4 ? 'low_groundedness' : undefined,
  };
}

function scoreEvidenceCoverage(input: MirrorEvalInput): MirrorEvalScore {
  const score = input.sourceCoverage;
  return {
    dimension: 'evidence_coverage',
    score: Math.round(score * 100) / 100,
    rationale:
      score >= 0.8
        ? 'Source coverage is comprehensive.'
        : score >= 0.5
          ? 'Moderate coverage. Some evidence gaps remain.'
          : 'Low evidence coverage. PCE may be blocked.',
    flag: score < 0.5 ? 'low_source_coverage' : undefined,
  };
}

function scoreProportionality(input: MirrorEvalInput): MirrorEvalScore {
  const isHighRisk = input.riskLevel === 'critical' || input.riskLevel === 'high';
  const hasApproval = input.hasPriorApproval;
  const score = isHighRisk && !hasApproval ? 0.3 : isHighRisk && hasApproval ? 0.8 : 1.0;
  return {
    dimension: 'proportionality',
    score,
    rationale:
      score >= 0.8
        ? 'Action scope is proportional to evidence and approval.'
        : 'High-risk action lacks commensurate approval evidence.',
    flag: score < 0.5 ? 'disproportionate_action' : undefined,
  };
}

function scoreReversibility(input: MirrorEvalInput): MirrorEvalScore {
  const score = input.isDestructive ? 0.2 : 0.9;
  return {
    dimension: 'reversibility',
    score,
    rationale: input.isDestructive
      ? 'Action is destructive and cannot be reversed. Extreme caution required.'
      : 'Action is non-destructive and reversible.',
    flag: input.isDestructive ? 'irreversible' : undefined,
  };
}

function scoreCompliance(input: MirrorEvalInput): MirrorEvalScore {
  const violations = input.policyViolations ?? [];
  const score = violations.length === 0 ? 1.0 : Math.max(0, 1 - violations.length * 0.25);
  return {
    dimension: 'compliance',
    score: Math.round(score * 100) / 100,
    rationale:
      violations.length === 0
        ? 'No policy violations detected.'
        : `${violations.length} policy violation(s): ${violations.slice(0, 2).join(', ')}`,
    flag: score < 0.5 ? 'policy_violation' : undefined,
  };
}

function scoreContextFreshness(input: MirrorEvalInput): MirrorEvalScore {
  const freshness = input.contextFreshness ?? 0.9;
  return {
    dimension: 'context_freshness',
    score: Math.round(freshness * 100) / 100,
    rationale:
      freshness >= 0.8
        ? 'Context data is fresh and reliable.'
        : freshness >= 0.5
          ? 'Context data is moderately fresh.'
          : 'Context data may be stale. Recommendation reliability reduced.',
    flag: freshness < 0.5 ? 'stale_context' : undefined,
  };
}

function computeDisposition(scores: MirrorEvalScore[], isDestructive: boolean, isDemoMode: boolean): MirrorEvalDisposition {
  if (isDestructive && isDemoMode) return 'blocked';
  const flags = scores.flatMap((s) => (s.flag ? [s.flag] : []));
  const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  if (flags.includes('irreversible') || flags.includes('policy_violation') || avg < 0.35) return 'blocked';
  if (avg < 0.55) return 'needs_more_evidence';
  return 'pass';
}

export function runMirrorEval(input: MirrorEvalInput): MirrorEvalResult {
  const evalId = `me-${randomUUID().slice(0, 8)}`;

  const scores: MirrorEvalScore[] = [
    scoreGroundedness(input),
    scoreEvidenceCoverage(input),
    scoreProportionality(input),
    scoreReversibility(input),
    scoreCompliance(input),
    scoreContextFreshness(input),
  ];

  const flags = scores.flatMap((s) => (s.flag ? [s.flag] : []));
  const disposition = computeDisposition(scores, input.isDestructive, input.isDemoMode);
  const overallScore = Math.round((scores.reduce((sum, s) => sum + s.score, 0) / scores.length) * 100) / 100;

  return {
    evalId,
    targetId: input.targetId,
    targetType: input.targetType,
    disposition,
    overallScore,
    scores,
    flags,
    evaluatedAt: new Date().toISOString(),
    evaluatorVersion: EVAL_VERSION,
  };
}

const evalStore = new Map<string, MirrorEvalResult>();

async function persistMirrorEval(result: MirrorEvalResult): Promise<void> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { a11oyMirrorEvalResultsTable } = await import('@szl-holdings/db/schema');
    await db.insert(a11oyMirrorEvalResultsTable).values({
      evalId: result.evalId,
      targetId: result.targetId,
      targetType: result.targetType,
      disposition: result.disposition,
      overallScore: String(result.overallScore),
      scores: result.scores as unknown as Record<string, unknown>[],
      flags: result.flags,
      evaluatedAt: new Date(result.evaluatedAt),
      evaluatorVersion: result.evaluatorVersion,
    }).onConflictDoNothing();
  } catch { /* non-fatal */ }
}

export function storeEval(result: MirrorEvalResult): void {
  evalStore.set(result.evalId, result);
  void persistMirrorEval(result);
}

export function getEval(evalId: string): MirrorEvalResult | undefined {
  return evalStore.get(evalId);
}

export function listEvals(limit = 50): MirrorEvalResult[] {
  return [...evalStore.values()].slice(-limit).reverse();
}

export function hydrateMirrorEvalStore(evals: MirrorEvalResult[]): void {
  for (const e of evals) {
    if (!evalStore.has(e.evalId)) evalStore.set(e.evalId, e);
  }
}
