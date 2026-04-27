import { randomUUID } from 'node:crypto';

export type GateVerdict = 'pass' | 'warn' | 'reject' | 'force_clarification';

export interface GateResult {
  gateId: string;
  gateName: string;
  verdict: GateVerdict;
  confidence: number;
  reason: string;
  suggestedAction: string | null;
  metrics: Record<string, number>;
  timestamp: string;
}

export interface GateAuditEntry {
  entryId: string;
  gateName: string;
  agentId: string;
  verdict: GateVerdict;
  reason: string;
  query: string;
  timestamp: string;
}

const MAX_AUDIT = 2000;
const gateAuditLog: GateAuditEntry[] = [];

function recordGateAudit(
  gateName: string,
  agentId: string,
  verdict: GateVerdict,
  reason: string,
  query: string,
): void {
  gateAuditLog.push({
    entryId: `ga_${randomUUID().slice(0, 8)}`,
    gateName,
    agentId,
    verdict,
    reason,
    query: query.slice(0, 200),
    timestamp: new Date().toISOString(),
  });
  if (gateAuditLog.length > MAX_AUDIT) {
    gateAuditLog.splice(0, gateAuditLog.length - MAX_AUDIT);
  }
}

export function getGateAuditLog(limit = 50): GateAuditEntry[] {
  return gateAuditLog.slice(-limit).reverse();
}

export function getGateStats(): {
  totalChecks: number;
  byGate: Record<string, { total: number; pass: number; warn: number; reject: number; clarify: number }>;
} {
  const byGate: Record<string, { total: number; pass: number; warn: number; reject: number; clarify: number }> = {};

  for (const entry of gateAuditLog) {
    if (!byGate[entry.gateName]) {
      byGate[entry.gateName] = { total: 0, pass: 0, warn: 0, reject: 0, clarify: 0 };
    }
    const stats = byGate[entry.gateName]!;
    stats.total++;
    if (entry.verdict === 'pass') stats.pass++;
    else if (entry.verdict === 'warn') stats.warn++;
    else if (entry.verdict === 'reject') stats.reject++;
    else if (entry.verdict === 'force_clarification') stats.clarify++;
  }

  return { totalChecks: gateAuditLog.length, byGate };
}

export function runThinkGate(
  agentId: string,
  query: string,
  proposedAction: string,
  confidence: number,
  complexity: number,
  strictness = 0.5,
): GateResult {
  const confidenceToComplexity = complexity > 0 ? confidence / complexity : confidence;
  const threshold = 0.3 + (strictness * 0.5);

  let verdict: GateVerdict = 'pass';
  let reason = 'Confidence-to-complexity ratio adequate';
  let suggestedAction: string | null = null;

  const hasExplicitAssumptions = /assum|because|given that|considering/i.test(proposedAction);
  const surfacesAmbiguity = /unclear|uncertain|ambiguous|might|could be/i.test(proposedAction);

  const assumptionScore = hasExplicitAssumptions ? 0.3 : 0;
  const ambiguityScore = surfacesAmbiguity ? 0.2 : 0;
  const effectiveRatio = confidenceToComplexity + assumptionScore + ambiguityScore;

  if (effectiveRatio < threshold * 0.5) {
    verdict = 'force_clarification';
    reason = `Confidence-to-complexity ratio (${effectiveRatio.toFixed(2)}) critically below threshold (${threshold.toFixed(2)}). Agent must clarify before proceeding.`;
    suggestedAction = 'Request additional context or decompose the problem further';
  } else if (effectiveRatio < threshold) {
    verdict = 'warn';
    reason = `Confidence-to-complexity ratio (${effectiveRatio.toFixed(2)}) below threshold (${threshold.toFixed(2)}). Proceeding with caution.`;
    suggestedAction = 'Consider surfacing assumptions explicitly';
  }

  if (!hasExplicitAssumptions && confidence < 0.6 && strictness > 0.5) {
    if (verdict === 'pass') {
      verdict = 'warn';
      reason = 'No explicit assumptions stated despite moderate confidence. Think Gate recommends stating assumptions.';
      suggestedAction = 'State assumptions before proceeding';
    }
  }

  const result: GateResult = {
    gateId: `tg_${randomUUID().slice(0, 8)}`,
    gateName: 'ThinkGate',
    verdict,
    confidence,
    reason,
    suggestedAction,
    metrics: {
      confidenceToComplexity: effectiveRatio,
      threshold,
      rawConfidence: confidence,
      complexity,
      assumptionScore,
      ambiguityScore,
    },
    timestamp: new Date().toISOString(),
  };

  recordGateAudit('ThinkGate', agentId, verdict, reason, query);
  return result;
}

export function runSimplicityGate(
  agentId: string,
  query: string,
  proposedStepCount: number,
  historicalAvgSteps: number,
  strictness = 0.5,
): GateResult {
  const ratio = historicalAvgSteps > 0 ? proposedStepCount / historicalAvgSteps : 1;
  const maxRatio = 1.5 + ((1 - strictness) * 2);

  let verdict: GateVerdict = 'pass';
  let reason = `Proposed plan (${proposedStepCount} steps) aligns with historical pattern (${historicalAvgSteps.toFixed(1)} avg)`;
  let suggestedAction: string | null = null;

  if (ratio > maxRatio * 1.5) {
    verdict = 'reject';
    reason = `Proposed plan (${proposedStepCount} steps) is ${ratio.toFixed(1)}x the historical average (${historicalAvgSteps.toFixed(1)}). Simplicity Gate rejects — force simplification.`;
    suggestedAction = `Reduce to ${Math.ceil(historicalAvgSteps * maxRatio)} steps or fewer`;
  } else if (ratio > maxRatio) {
    verdict = 'warn';
    reason = `Proposed plan (${proposedStepCount} steps) exceeds expected complexity (max ratio ${maxRatio.toFixed(1)}x). Consider simplifying.`;
    suggestedAction = 'Review whether all steps are necessary';
  }

  if (proposedStepCount === 1 && historicalAvgSteps > 3) {
    if (verdict === 'pass') {
      verdict = 'warn';
      reason = `Single-step plan for a historically complex task (avg ${historicalAvgSteps.toFixed(1)} steps). May be oversimplified.`;
      suggestedAction = 'Verify the single step covers all required sub-tasks';
    }
  }

  const result: GateResult = {
    gateId: `sg_${randomUUID().slice(0, 8)}`,
    gateName: 'SimplicityGate',
    verdict,
    confidence: Math.max(0, 1 - Math.abs(ratio - 1) * 0.3),
    reason,
    suggestedAction,
    metrics: {
      proposedSteps: proposedStepCount,
      historicalAvg: historicalAvgSteps,
      complexityRatio: ratio,
      maxAllowedRatio: maxRatio,
    },
    timestamp: new Date().toISOString(),
  };

  recordGateAudit('SimplicityGate', agentId, verdict, reason, query);
  return result;
}

export function runSurgicalScopeGate(
  agentId: string,
  query: string,
  declaredScope: string[],
  proposedChanges: string[],
  strictness = 0.5,
): GateResult {
  const outOfScope = proposedChanges.filter(change => {
    const changeLower = change.toLowerCase();
    return !declaredScope.some(scope => changeLower.includes(scope.toLowerCase()));
  });

  const scopeViolationRatio = proposedChanges.length > 0
    ? outOfScope.length / proposedChanges.length
    : 0;

  const threshold = 0.3 - (strictness * 0.2);

  let verdict: GateVerdict = 'pass';
  let reason = 'All proposed changes within declared scope';
  let suggestedAction: string | null = null;

  if (scopeViolationRatio > threshold + 0.3) {
    verdict = 'reject';
    reason = `${outOfScope.length}/${proposedChanges.length} proposed changes are outside declared scope: ${outOfScope.slice(0, 3).join(', ')}. Surgical Scope Gate blocks "while I\'m here" scope creep.`;
    suggestedAction = `Remove out-of-scope changes and create separate tasks for: ${outOfScope.slice(0, 3).join(', ')}`;
  } else if (scopeViolationRatio > threshold) {
    verdict = 'warn';
    reason = `${outOfScope.length} change(s) may be outside declared scope: ${outOfScope.slice(0, 2).join(', ')}`;
    suggestedAction = 'Verify these changes are necessary for the declared objective';
  }

  const result: GateResult = {
    gateId: `ssg_${randomUUID().slice(0, 8)}`,
    gateName: 'SurgicalScopeGate',
    verdict,
    confidence: 1 - scopeViolationRatio,
    reason,
    suggestedAction,
    metrics: {
      declaredScopeSize: declaredScope.length,
      proposedChangeCount: proposedChanges.length,
      outOfScopeCount: outOfScope.length,
      scopeViolationRatio,
      threshold,
    },
    timestamp: new Date().toISOString(),
  };

  recordGateAudit('SurgicalScopeGate', agentId, verdict, reason, query);
  return result;
}

export function runGoalVerificationGate(
  agentId: string,
  query: string,
  declaredSuccessCriteria: string[],
  outputContent: string,
  strictness = 0.5,
): GateResult {
  if (declaredSuccessCriteria.length === 0) {
    const result: GateResult = {
      gateId: `gvg_${randomUUID().slice(0, 8)}`,
      gateName: 'GoalVerificationGate',
      verdict: 'warn',
      confidence: 0.5,
      reason: 'No success criteria declared. Agent output cannot be verified against goals.',
      suggestedAction: 'Define explicit success criteria before completing the task',
      metrics: { criteriaCount: 0, metCount: 0, metRatio: 0 },
      timestamp: new Date().toISOString(),
    };
    recordGateAudit('GoalVerificationGate', agentId, 'warn', result.reason, query);
    return result;
  }

  const outputLower = outputContent.toLowerCase();
  const metCriteria = declaredSuccessCriteria.filter(criterion => {
    const keywords = criterion.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchCount = keywords.filter(kw => outputLower.includes(kw)).length;
    return keywords.length > 0 && matchCount / keywords.length >= 0.5;
  });

  const metRatio = metCriteria.length / declaredSuccessCriteria.length;
  const threshold = 0.5 + (strictness * 0.3);

  let verdict: GateVerdict = 'pass';
  let reason = `${metCriteria.length}/${declaredSuccessCriteria.length} success criteria met (${(metRatio * 100).toFixed(0)}%)`;
  let suggestedAction: string | null = null;

  if (metRatio < threshold * 0.5) {
    verdict = 'reject';
    const unmet = declaredSuccessCriteria.filter(c => !metCriteria.includes(c));
    reason = `Only ${metCriteria.length}/${declaredSuccessCriteria.length} criteria met. Unmet: ${unmet.slice(0, 3).join('; ')}`;
    suggestedAction = 'Revise output to address unmet success criteria before marking complete';
  } else if (metRatio < threshold) {
    verdict = 'warn';
    reason = `${metCriteria.length}/${declaredSuccessCriteria.length} criteria met — below verification threshold (${(threshold * 100).toFixed(0)}%)`;
    suggestedAction = 'Review unmet criteria and determine if output is sufficient';
  }

  const result: GateResult = {
    gateId: `gvg_${randomUUID().slice(0, 8)}`,
    gateName: 'GoalVerificationGate',
    verdict,
    confidence: metRatio,
    reason,
    suggestedAction,
    metrics: {
      criteriaCount: declaredSuccessCriteria.length,
      metCount: metCriteria.length,
      metRatio,
      threshold,
    },
    timestamp: new Date().toISOString(),
  };

  recordGateAudit('GoalVerificationGate', agentId, verdict, reason, query);
  return result;
}

export function runAllGates(params: {
  agentId: string;
  query: string;
  proposedAction: string;
  confidence: number;
  complexity: number;
  proposedStepCount: number;
  historicalAvgSteps: number;
  declaredScope: string[];
  proposedChanges: string[];
  successCriteria: string[];
  outputContent: string;
  strictness?: number;
}): {
  overallVerdict: GateVerdict;
  gates: GateResult[];
  blockedBy: string[];
} {
  const strictness = params.strictness ?? 0.5;

  const gates = [
    runThinkGate(params.agentId, params.query, params.proposedAction, params.confidence, params.complexity, strictness),
    runSimplicityGate(params.agentId, params.query, params.proposedStepCount, params.historicalAvgSteps, strictness),
    runSurgicalScopeGate(params.agentId, params.query, params.declaredScope, params.proposedChanges, strictness),
    runGoalVerificationGate(params.agentId, params.query, params.successCriteria, params.outputContent, strictness),
  ];

  const blockedBy = gates.filter(g => g.verdict === 'reject').map(g => g.gateName);
  const hasClarification = gates.some(g => g.verdict === 'force_clarification');

  let overallVerdict: GateVerdict = 'pass';
  if (blockedBy.length > 0) {
    overallVerdict = 'reject';
  } else if (hasClarification) {
    overallVerdict = 'force_clarification';
  } else if (gates.some(g => g.verdict === 'warn')) {
    overallVerdict = 'warn';
  }

  return { overallVerdict, gates, blockedBy };
}
