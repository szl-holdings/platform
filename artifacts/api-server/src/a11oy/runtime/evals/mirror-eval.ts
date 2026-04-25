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

function scoreActionSafety(input: MirrorEvalInput): MirrorEvalScore {
  let score = 1;
  let primaryFlag: string | undefined;

  if (input.isDemoMode && input.isDestructive) {
    score = 0;
    primaryFlag = 'demo_mode_blocked';
  } else if (input.isDestructive) {
    score -= 0.4;
    primaryFlag = 'destructive_action';
  }

  if (input.policyViolations?.length) {
    score -= Math.min(0.5, input.policyViolations.length * 0.1);
    if (!primaryFlag) primaryFlag = 'policy_violations';
  }

  score = Math.max(0, score);
  return {
    dimension: 'action_safety',
    score: Math.round(score * 100) / 100,
    rationale:
      score >= 0.8
        ? 'Action meets safety criteria.'
        : score >= 0.4
          ? 'Action has safety concerns requiring review.'
          : 'Action safety is critically low. Execution blocked.',
    flag: primaryFlag,
  };
}

function scoreHallucinationRisk(input: MirrorEvalInput): MirrorEvalScore {
  let score = 1;
  if (input.evidenceRefs.length === 0) score -= 0.5;
  if (input.sourceCoverage < 0.3) score -= 0.3;
  score = Math.max(0, score);
  return {
    dimension: 'hallucination_risk',
    score: Math.round(score * 100) / 100,
    rationale:
      score >= 0.7
        ? 'Low hallucination risk. Evidence is cited.'
        : 'Elevated hallucination risk due to limited evidence. Review recommended.',
    flag: score < 0.5 ? 'hallucination_risk' : undefined,
  };
}

function scorePolicyCompliance(input: MirrorEvalInput): MirrorEvalScore {
  const violations = input.policyViolations?.length ?? 0;
  const score = Math.max(0, 1 - violations * 0.25);
  return {
    dimension: 'policy_compliance',
    score: Math.round(score * 100) / 100,
    rationale:
      violations === 0
        ? 'No policy violations detected.'
        : `${violations} policy violation(s) found. Review required.`,
    flag: violations > 0 ? 'policy_violation' : undefined,
  };
}

function scoreBusinessImpact(input: MirrorEvalInput): MirrorEvalScore {
  const riskWeight: Record<string, number> = {
    low: 0.9,
    medium: 0.75,
    high: 0.55,
    critical: 0.35,
  };
  const score = riskWeight[input.riskLevel ?? 'medium'] ?? 0.75;
  return {
    dimension: 'business_impact',
    score: Math.round(score * 100) / 100,
    rationale: `Estimated business impact: ${input.riskLevel ?? 'medium'} risk. Impact assessment based on signal context.`,
    flag: score < 0.5 ? 'high_business_impact' : undefined,
  };
}

function scoreActionSpecificity(input: MirrorEvalInput): MirrorEvalScore {
  const desc = input.actionDescription ?? '';
  const wordCount = desc.split(/\s+/).filter(Boolean).length;
  const score = Math.min(1, wordCount / 20);
  return {
    dimension: 'action_specificity',
    score: Math.round(score * 100) / 100,
    rationale:
      score >= 0.8
        ? 'Action is specific and detailed.'
        : score >= 0.5
          ? 'Action description is moderately specific.'
          : 'Action description is too vague. Add more detail.',
    flag: score < 0.4 ? 'vague_action' : undefined,
  };
}

function scoreVerificationReadiness(input: MirrorEvalInput): MirrorEvalScore {
  const score = input.evidenceRefs.length > 0 && input.sourceCoverage > 0.5 ? 0.85 : 0.4;
  return {
    dimension: 'verification_readiness',
    score: Math.round(score * 100) / 100,
    rationale:
      score >= 0.8
        ? 'Sufficient evidence to verify execution outcome.'
        : 'Limited evidence for post-execution verification. Add citations.',
    flag: score < 0.5 ? 'low_verification_readiness' : undefined,
  };
}

function scoreStaleContext(input: MirrorEvalInput): MirrorEvalScore {
  const freshness = input.contextFreshness ?? 1;
  const score = freshness;
  return {
    dimension: 'stale_context',
    score: Math.round(score * 100) / 100,
    rationale:
      score >= 0.8
        ? 'Context is fresh and current.'
        : score >= 0.5
          ? 'Context has some stale elements. Review before proceeding.'
          : 'Context is significantly stale. Refresh before execution.',
    flag: score < 0.5 ? 'stale_context' : undefined,
  };
}

function scoreApprovalCorrectness(input: MirrorEvalInput): MirrorEvalScore {
  const needsApproval = ['executive', 'board'].includes(input.approvalTier ?? '');
  let score = 1;
  if (needsApproval && !input.hasPriorApproval) {
    score = 0;
  }
  return {
    dimension: 'approval_correctness',
    score,
    rationale:
      score === 1
        ? 'Approval status is correct for this action tier.'
        : `Approval required (tier: ${input.approvalTier}) but not yet obtained.`,
    flag: score === 0 ? 'approval_required' : undefined,
  };
}

function scoreRollbackReadiness(input: MirrorEvalInput): MirrorEvalScore {
  const score = input.isDestructive ? 0.4 : 0.9;
  return {
    dimension: 'rollback_readiness',
    score: Math.round(score * 100) / 100,
    rationale:
      score >= 0.8
        ? 'Action can be safely rolled back if needed.'
        : 'Rollback is limited for this action type. Proceed with caution.',
    flag: score < 0.5 ? 'low_rollback_readiness' : undefined,
  };
}

function computeDisposition(scores: MirrorEvalScore[], input: MirrorEvalInput): MirrorEvalDisposition {
  if (input.isDemoMode && input.isDestructive) return 'blocked';

  const flags = scores.map((s) => s.flag).filter(Boolean);
  const overallScore = scores.reduce((s, e) => s + e.score, 0) / scores.length;

  if (flags.includes('demo_mode_blocked')) return 'blocked';
  if (flags.includes('approval_required')) return 'requires_human_review';
  if (flags.includes('low_source_coverage') || flags.includes('low_groundedness')) {
    return overallScore < 0.4 ? 'blocked' : 'needs_more_evidence';
  }
  if (flags.includes('policy_violation') || flags.includes('low_rollback_readiness')) {
    return 'requires_human_review';
  }
  if (overallScore >= 0.75) return 'pass';
  if (overallScore >= 0.55) return 'pass_with_warning';
  if (overallScore >= 0.4) return 'needs_more_evidence';
  if (overallScore >= 0.25) return 'requires_human_review';
  return 'blocked';
}

export function runMirrorEval(input: MirrorEvalInput): MirrorEvalResult {
  const scores = [
    scoreGroundedness(input),
    scoreEvidenceCoverage(input),
    scoreActionSafety(input),
    scoreHallucinationRisk(input),
    scorePolicyCompliance(input),
    scoreBusinessImpact(input),
    scoreActionSpecificity(input),
    scoreVerificationReadiness(input),
    scoreStaleContext(input),
    scoreApprovalCorrectness(input),
    scoreRollbackReadiness(input),
  ];

  const flags = scores.map((s) => s.flag).filter((f): f is string => !!f);
  const overallScore = Math.round((scores.reduce((s, e) => s + e.score, 0) / scores.length) * 100) / 100;
  const disposition = computeDisposition(scores, input);

  return {
    evalId: `eval-${randomUUID().slice(0, 8)}`,
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

export function storeEval(result: MirrorEvalResult): void {
  evalStore.set(result.evalId, result);
}

export function getEval(evalId: string): MirrorEvalResult | undefined {
  return evalStore.get(evalId);
}

export function listEvals(limit = 50): MirrorEvalResult[] {
  return [...evalStore.values()].slice(-limit).reverse();
}
