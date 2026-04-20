import type { EvaluationRequest, PolicyEvaluationResult } from '@szl-holdings/policy-engine';
import { checkAction } from '@szl-holdings/policy-engine';
import type {
  CheckResult,
  DomainRule,
  ProposedAction,
  VerifierContext,
  VerifierOutput,
} from './types.js';

/**
 * A single verifier check. Receives the output and context and returns a
 * CheckResult. May return `undefined` to opt out (when no relevant input).
 */
export type Check = (output: VerifierOutput, context: VerifierContext) => CheckResult | undefined;

// ---------------------------------------------------------------------------
// 1. Evidence sufficiency — every claim must carry at least N citations.
// ---------------------------------------------------------------------------

export const evidenceSufficiencyCheck: Check = (output, ctx) => {
  const claims = output.claims;
  if (!claims || claims.length === 0) return undefined;
  const min = ctx.evidenceMinPerClaim;
  const undercited = claims.filter((c) => c.citationIds.length < min);
  if (undercited.length === 0) {
    return {
      name: 'evidence-sufficiency',
      outcome: 'pass',
      score: 1,
      message: `All ${claims.length} claim(s) have ≥ ${min} citation(s).`,
    };
  }
  const ratio = 1 - undercited.length / claims.length;
  return {
    name: 'evidence-sufficiency',
    outcome: 'fail',
    score: ratio,
    message: `${undercited.length}/${claims.length} claim(s) lack the required ${min} citation(s).`,
    evidence: { undercited: undercited.map((c) => c.text) },
    recommendedAction: 'request_more_evidence',
  };
};

// ---------------------------------------------------------------------------
// 2. Citation fidelity — referenced citations must exist and be verified.
// ---------------------------------------------------------------------------

export const citationFidelityCheck: Check = (output) => {
  const claims = output.claims;
  const citations = output.citations ?? [];
  if (!claims || claims.length === 0) return undefined;
  const citationsById = new Map(citations.map((c) => [c.id, c]));
  const missing: string[] = [];
  const unverified: string[] = [];
  for (const claim of claims) {
    for (const cid of claim.citationIds) {
      const cite = citationsById.get(cid);
      if (!cite) {
        missing.push(cid);
        continue;
      }
      if (cite.verified === false) unverified.push(cid);
    }
  }
  if (missing.length === 0 && unverified.length === 0) {
    return {
      name: 'citation-fidelity',
      outcome: 'pass',
      score: 1,
      message: 'All citation references resolve and are verified.',
    };
  }
  const totalRefs = claims.reduce((s, c) => s + c.citationIds.length, 0) || 1;
  const score = Math.max(0, 1 - (missing.length + unverified.length) / totalRefs);
  return {
    name: 'citation-fidelity',
    outcome: missing.length > 0 ? 'fail' : 'warn',
    score,
    message: `${missing.length} missing, ${unverified.length} unverified citation(s).`,
    evidence: { missing, unverified },
    recommendedAction: missing.length > 0 ? 'revise' : 'request_more_evidence',
  };
};

// ---------------------------------------------------------------------------
// 3. Unsupported claims — claims explicitly flagged supported=false.
// ---------------------------------------------------------------------------

export const unsupportedClaimsCheck: Check = (output) => {
  const claims = output.claims;
  if (!claims || claims.length === 0) return undefined;
  const unsupported = claims.filter((c) => c.supported === false);
  if (unsupported.length === 0) {
    return {
      name: 'unsupported-claims',
      outcome: 'pass',
      score: 1,
      message: 'No claims flagged unsupported.',
    };
  }
  const score = 1 - unsupported.length / claims.length;
  return {
    name: 'unsupported-claims',
    outcome: 'fail',
    score,
    message: `${unsupported.length}/${claims.length} claim(s) marked unsupported.`,
    evidence: { unsupported: unsupported.map((c) => c.text) },
    recommendedAction: 'revise',
  };
};

// ---------------------------------------------------------------------------
// 4. Hallucination signals — heuristic markers in text or claims without citations.
// ---------------------------------------------------------------------------

const HALLUCINATION_MARKERS = [
  '[citation needed]',
  "i don't have access",
  'i cannot verify',
  'as an ai',
  'i made that up',
];

export const hallucinationSignalsCheck: Check = (output, ctx) => {
  const text = output.text?.toLowerCase() ?? '';
  const markersFound = HALLUCINATION_MARKERS.filter((m) => text.includes(m));
  const claims = output.claims ?? [];
  const uncited = claims.filter((c) => c.citationIds.length === 0).length;
  const exceededUncited = uncited > ctx.maxUncitedClaims;

  if (markersFound.length === 0 && !exceededUncited) {
    return {
      name: 'hallucination-signals',
      outcome: 'pass',
      score: 1,
      message: 'No hallucination markers detected.',
    };
  }
  const severity = markersFound.length > 0 ? 'fail' : 'warn';
  const score = Math.max(0, 1 - 0.25 * markersFound.length - (exceededUncited ? 0.25 : 0));
  return {
    name: 'hallucination-signals',
    outcome: severity,
    score,
    message: [
      markersFound.length > 0 ? `Markers: ${markersFound.join(', ')}.` : '',
      exceededUncited ? `${uncited} uncited claim(s) exceed limit ${ctx.maxUncitedClaims}.` : '',
    ]
      .filter(Boolean)
      .join(' '),
    evidence: { markers: markersFound, uncitedClaims: uncited },
    recommendedAction: severity === 'fail' ? 'revise' : 'request_more_evidence',
  };
};

// ---------------------------------------------------------------------------
// 5. Internal contradiction — both halves of a contradiction pair appear.
// ---------------------------------------------------------------------------

export const internalContradictionCheck: Check = (output, ctx) => {
  if (ctx.contradictionPairs.length === 0) return undefined;
  const text = output.text?.toLowerCase() ?? '';
  if (!text) return undefined;
  const hits = ctx.contradictionPairs.filter(
    ([a, b]) => text.includes(a.toLowerCase()) && text.includes(b.toLowerCase()),
  );
  if (hits.length === 0) {
    return {
      name: 'internal-contradiction',
      outcome: 'pass',
      score: 1,
      message: `No contradictions among ${ctx.contradictionPairs.length} pair(s).`,
    };
  }
  return {
    name: 'internal-contradiction',
    outcome: 'fail',
    score: 0,
    message: `${hits.length} contradicting pair(s) co-occur in output.`,
    evidence: { pairs: hits },
    recommendedAction: 'revise',
  };
};

// ---------------------------------------------------------------------------
// 6. Policy compliance — delegate to @workspace/policy-engine.
// ---------------------------------------------------------------------------

function isEvaluationRequest(value: unknown): value is EvaluationRequest {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['action'] === 'string' &&
    typeof v['subject'] === 'object' &&
    typeof v['resource'] === 'object'
  );
}

export const policyComplianceCheck: Check = (_output, ctx) => {
  if (!isEvaluationRequest(ctx.policyRequest)) return undefined;
  const result: PolicyEvaluationResult = checkAction(ctx.policyRequest);
  if (result.allowed && !result.requiresApproval) {
    return {
      name: 'policy-compliance',
      outcome: 'pass',
      score: 1,
      message: result.reasoning,
      evidence: { matched: result.matchedPolicies },
    };
  }
  if (result.effect === 'block') {
    return {
      name: 'policy-compliance',
      outcome: 'blocked',
      score: 0,
      message: result.reasoning,
      evidence: { violations: result.violations },
      recommendedAction: 'block',
    };
  }
  if (result.effect === 'escalate') {
    return {
      name: 'policy-compliance',
      outcome: 'warn',
      score: 0.4,
      message: result.reasoning,
      evidence: { escalateTo: result.escalationTarget },
      recommendedAction: 'escalate',
    };
  }
  if (result.requiresApproval) {
    return {
      name: 'policy-compliance',
      outcome: 'warn',
      score: 0.6,
      message: result.reasoning,
      evidence: { requiredApproverRole: result.requiredApproverRole },
      recommendedAction: 'route_to_human_review',
    };
  }
  return {
    name: 'policy-compliance',
    outcome: 'pass',
    score: 1,
    message: result.reasoning,
  };
};

// ---------------------------------------------------------------------------
// 7. Domain rule compliance — operator-style rule list against metadata.
// ---------------------------------------------------------------------------

function evalRule(rule: DomainRule, value: unknown): boolean {
  switch (rule.operator) {
    case 'eq':
      return value === rule.value;
    case 'neq':
      return value !== rule.value;
    case 'gt':
      return typeof value === 'number' && value > (rule.value as number);
    case 'gte':
      return typeof value === 'number' && value >= (rule.value as number);
    case 'lt':
      return typeof value === 'number' && value < (rule.value as number);
    case 'lte':
      return typeof value === 'number' && value <= (rule.value as number);
    case 'in':
      return Array.isArray(rule.value) && (rule.value as unknown[]).includes(value);
    case 'not_in':
      return Array.isArray(rule.value) && !(rule.value as unknown[]).includes(value);
    case 'contains':
      return typeof value === 'string' && value.includes(String(rule.value));
    case 'matches':
      return typeof value === 'string' && new RegExp(String(rule.value)).test(value);
    default:
      return false;
  }
}

export const domainRuleComplianceCheck: Check = (output, ctx) => {
  if (ctx.domainRules.length === 0) return undefined;
  const meta = output.metadata ?? {};
  const violations: { ruleId: string; severity: DomainRule['severity']; message?: string }[] = [];
  for (const rule of ctx.domainRules) {
    if (!evalRule(rule, meta[rule.field])) {
      violations.push({ ruleId: rule.id, severity: rule.severity, message: rule.description });
    }
  }
  if (violations.length === 0) {
    return {
      name: 'domain-rule-compliance',
      outcome: 'pass',
      score: 1,
      message: `All ${ctx.domainRules.length} domain rule(s) satisfied.`,
    };
  }
  const blocked = violations.some((v) => v.severity === 'blocked');
  const failed = violations.some((v) => v.severity === 'fail');
  const outcome = blocked ? 'blocked' : failed ? 'fail' : 'warn';
  const score = Math.max(0, 1 - violations.length / ctx.domainRules.length);
  return {
    name: 'domain-rule-compliance',
    outcome,
    score,
    message: `${violations.length}/${ctx.domainRules.length} domain rule(s) violated.`,
    evidence: { violations },
    recommendedAction: blocked ? 'block' : failed ? 'revise' : 'escalate',
  };
};

// ---------------------------------------------------------------------------
// 8. Action safety — refuse critical+irreversible+broad-blast actions.
// ---------------------------------------------------------------------------

export const actionSafetyCheck: Check = (output) => {
  const action: ProposedAction | undefined = output.proposedAction;
  if (!action) return undefined;
  const reasons: string[] = [];
  if (action.risk === 'critical' && !action.reversible) {
    reasons.push('Critical risk action is not reversible.');
  }
  if (action.risk === 'critical' && action.blastRadius === 'global') {
    reasons.push('Critical risk action has global blast radius.');
  }
  if (action.risk === 'high' && !action.reversible) {
    reasons.push('High risk action is not reversible.');
  }
  if (reasons.length === 0) {
    return {
      name: 'action-safety',
      outcome: 'pass',
      score: 1,
      message: `Action ${action.kind} is within safety bounds.`,
    };
  }
  const blocking = reasons.some((r) => r.startsWith('Critical'));
  return {
    name: 'action-safety',
    outcome: blocking ? 'blocked' : 'warn',
    score: blocking ? 0 : 0.5,
    message: reasons.join(' '),
    evidence: { action },
    recommendedAction: blocking ? 'block' : 'route_to_human_review',
  };
};

// ---------------------------------------------------------------------------
// 9. Output completeness — required fields must all be present.
// ---------------------------------------------------------------------------

export const outputCompletenessCheck: Check = (output) => {
  const required = output.requiredFields;
  if (!required || required.length === 0) return undefined;
  const provided = new Set(output.providedFields ?? []);
  const missing = required.filter((f) => !provided.has(f));
  if (missing.length === 0) {
    return {
      name: 'output-completeness',
      outcome: 'pass',
      score: 1,
      message: `All ${required.length} required field(s) present.`,
    };
  }
  const score = 1 - missing.length / required.length;
  return {
    name: 'output-completeness',
    outcome: 'fail',
    score,
    message: `Missing required field(s): ${missing.join(', ')}.`,
    evidence: { missing },
    recommendedAction: 'revise',
  };
};

// ---------------------------------------------------------------------------
// 10. Confidence calibration — self-reported confidence vs. historical accuracy.
// ---------------------------------------------------------------------------

export const confidenceCalibrationCheck: Check = (output, ctx) => {
  if (output.confidence === undefined || output.historicalAccuracy === undefined) {
    return undefined;
  }
  const drift = Math.abs(output.confidence - output.historicalAccuracy);
  if (drift <= ctx.calibrationTolerance) {
    return {
      name: 'confidence-calibration',
      outcome: 'pass',
      score: 1 - drift,
      message: `Confidence drift ${drift.toFixed(2)} within tolerance ${ctx.calibrationTolerance}.`,
    };
  }
  // Over-confident relative to track record is a stronger signal than
  // under-confident.
  const overconfident = output.confidence > output.historicalAccuracy;
  return {
    name: 'confidence-calibration',
    outcome: 'warn',
    score: Math.max(0, 1 - drift),
    message: `${overconfident ? 'Over' : 'Under'}-confident by ${drift.toFixed(2)} (tolerance ${ctx.calibrationTolerance}).`,
    evidence: { confidence: output.confidence, historicalAccuracy: output.historicalAccuracy },
    recommendedAction: overconfident ? 'escalate' : 'revise',
  };
};

// ---------------------------------------------------------------------------
// Built-in check registry
// ---------------------------------------------------------------------------

export interface RegisteredCheck {
  name: string;
  fn: Check;
}

export const BUILT_IN_CHECKS: RegisteredCheck[] = [
  { name: 'evidence-sufficiency', fn: evidenceSufficiencyCheck },
  { name: 'citation-fidelity', fn: citationFidelityCheck },
  { name: 'unsupported-claims', fn: unsupportedClaimsCheck },
  { name: 'hallucination-signals', fn: hallucinationSignalsCheck },
  { name: 'internal-contradiction', fn: internalContradictionCheck },
  { name: 'policy-compliance', fn: policyComplianceCheck },
  { name: 'domain-rule-compliance', fn: domainRuleComplianceCheck },
  { name: 'action-safety', fn: actionSafetyCheck },
  { name: 'output-completeness', fn: outputCompletenessCheck },
  { name: 'confidence-calibration', fn: confidenceCalibrationCheck },
];
