/**
 * Alloy Meridian — Founder Intent Vector
 *
 * Stores and retrieves the governed strategy memory that aligns all
 * Meridian agent decisions to doctrine, risk tolerance, and timing.
 * This is the "north star" the governance-sentinel uses to evaluate
 * whether a proposed action is on-doctrine.
 */

export interface DoctrineVector {
  dimension: string;
  value: string;
  weight: number;
  updatedAt: string;
}

export interface RiskTolerance {
  domain: string;
  maxAcceptableRisk: number;
  preferredMitigationStyle: 'avoid' | 'transfer' | 'mitigate' | 'accept';
  notes: string;
}

export interface TimingPreference {
  horizon: 'immediate' | 'near_term' | 'mid_term' | 'long_term';
  windowDays: number;
  urgencyBias: 'act_fast' | 'deliberate' | 'opportunistic';
}

export interface FounderIntentVector {
  version: string;
  updatedAt: string;
  missionStatement: string;
  coreDoctrines: DoctrineVector[];
  riskTolerances: RiskTolerance[];
  timingPreferences: TimingPreference[];
  prohibitedActions: string[];
  requiredApprovals: string[];
  strategicPriorities: Array<{ priority: string; weight: number; timeframe: string }>;
  decisionPrinciples: string[];
}

export const FOUNDER_INTENT: FounderIntentVector = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  missionStatement:
    'Build governed, evidence-backed operational intelligence that enables SZL Holdings to make better decisions faster — always with explicit platform state, audit trails, and human confirmation for external actions.',
  coreDoctrines: [
    {
      dimension: 'evidence_over_assumption',
      value:
        'Every recommendation must cite sources, confidence scores, and the signal chain that produced it.',
      weight: 1.0,
      updatedAt: new Date().toISOString(),
    },
    {
      dimension: 'human_in_the_loop',
      value:
        'No agent may send external messages, spend money, change access, delete data, or deploy without explicit human approval.',
      weight: 1.0,
      updatedAt: new Date().toISOString(),
    },
    {
      dimension: 'explicit_platform_state',
      value:
        'The current state of all systems must be legible. No hidden or implicit state transitions.',
      weight: 0.9,
      updatedAt: new Date().toISOString(),
    },
    {
      dimension: 'audit_trail_completeness',
      value:
        'Every model call, decision, approval, and outcome must be recorded in the Flight Recorder.',
      weight: 1.0,
      updatedAt: new Date().toISOString(),
    },
    {
      dimension: 'read_first_external_access',
      value:
        'When querying external MCP servers, read before writing. Never mutate external state without governance approval.',
      weight: 0.95,
      updatedAt: new Date().toISOString(),
    },
    {
      dimension: 'rollback_by_default',
      value:
        'Every recommended action must include a tested rollback path before execution is approved.',
      weight: 0.9,
      updatedAt: new Date().toISOString(),
    },
  ],
  riskTolerances: [
    {
      domain: 'infrastructure',
      maxAcceptableRisk: 0.3,
      preferredMitigationStyle: 'mitigate',
      notes: 'Zero tolerance for data loss. Moderate tolerance for brief service degradation.',
    },
    {
      domain: 'security',
      maxAcceptableRisk: 0.1,
      preferredMitigationStyle: 'avoid',
      notes: 'P0 for critical CVEs. No acceptable window for known exploitable vulnerabilities.',
    },
    {
      domain: 'finance',
      maxAcceptableRisk: 0.25,
      preferredMitigationStyle: 'mitigate',
      notes: 'Revenue-affecting decisions require CFO sign-off above $10k threshold.',
    },
    {
      domain: 'growth',
      maxAcceptableRisk: 0.45,
      preferredMitigationStyle: 'accept',
      notes: 'Higher risk tolerance for customer acquisition experiments.',
    },
    {
      domain: 'legal',
      maxAcceptableRisk: 0.05,
      preferredMitigationStyle: 'avoid',
      notes: 'Legal actions require external counsel review.',
    },
  ],
  timingPreferences: [
    {
      horizon: 'immediate',
      windowDays: 1,
      urgencyBias: 'act_fast',
    },
    {
      horizon: 'near_term',
      windowDays: 14,
      urgencyBias: 'deliberate',
    },
    {
      horizon: 'mid_term',
      windowDays: 90,
      urgencyBias: 'opportunistic',
    },
    {
      horizon: 'long_term',
      windowDays: 365,
      urgencyBias: 'deliberate',
    },
  ],
  prohibitedActions: [
    'Send emails or messages to external parties without approval',
    'Execute financial transactions without CFO sign-off',
    'Modify production access controls without security review',
    'Delete production data of any kind',
    'Deploy to production without CI passing and rollback plan',
    'Publish content on social or public channels without brand approval',
  ],
  requiredApprovals: [
    'Any external MCP mutation (create/update/delete/send/publish/payment/permission)',
    'Financial commitments above $500',
    'Production deployments',
    'Access control changes',
    'Customer communications',
    'Data deletion requests',
  ],
  strategicPriorities: [
    {
      priority: 'Platform reliability and uptime',
      weight: 1.0,
      timeframe: 'ongoing',
    },
    {
      priority: 'Revenue growth and customer retention',
      weight: 0.9,
      timeframe: 'Q3 2026',
    },
    {
      priority: 'Security posture hardening',
      weight: 0.85,
      timeframe: 'ongoing',
    },
    {
      priority: 'Cognitive observability depth',
      weight: 0.8,
      timeframe: 'H2 2026',
    },
    {
      priority: 'Domain pack expansion (maritime, legal, real estate)',
      weight: 0.75,
      timeframe: 'H2 2026',
    },
  ],
  decisionPrinciples: [
    'When in doubt, read before acting.',
    'Propose and record before executing.',
    'Rollback paths are required, not optional.',
    'Confidence below 0.7 requires human review.',
    'Contradictory signals block automated execution.',
    'Decisions made under time pressure must be logged as such.',
    'No single agent can approve its own actions.',
  ],
};

/**
 * Recommendation completeness contract.
 *
 * Every recommendation produced by a Meridian agent must satisfy this
 * contract before it can enter the Counterfactual Ledger or be surfaced
 * to a human decision-maker. This enforces the `evidence_over_assumption`
 * and `rollback_by_default` doctrines at the data layer.
 */
export interface RecommendationCompleteness {
  sources: string[];
  confidence: number;
  owner: string;
  nextAction: string;
  rollbackPath: string;
  [key: string]: unknown;
}

export interface CompletenessValidationResult {
  valid: boolean;
  violations: string[];
  blockedBy: string[];
}

/**
 * Validates that a recommendation satisfies the Founder Intent completeness
 * contract before it can be approved or executed.
 *
 * Hard-fails (blocks) when:
 * - sources is empty → violates evidence_over_assumption doctrine
 * - confidence < 0.5 → below minimum threshold for any action
 * - owner is missing → no accountable party defined
 * - nextAction is missing → incomplete operational spec
 * - rollbackPath is missing for any non-read-only action → violates rollback_by_default
 *
 * Returns { valid: false, violations, blockedBy } when constraints are unmet.
 */
export function validateRecommendationCompleteness(
  rec: Partial<RecommendationCompleteness>,
): CompletenessValidationResult {
  const violations: string[] = [];
  const blockedBy: string[] = [];

  if (!rec.sources || rec.sources.length === 0) {
    violations.push('Missing sources: every recommendation must cite the signals that produced it.');
    blockedBy.push('evidence_over_assumption');
  }

  if (rec.confidence === undefined || rec.confidence === null) {
    violations.push('Missing confidence score.');
    blockedBy.push('evidence_over_assumption');
  } else if (rec.confidence < 0.5) {
    violations.push(
      `Confidence too low (${rec.confidence.toFixed(2)}). Minimum 0.50 required; human review mandatory below 0.70.`,
    );
    blockedBy.push('evidence_over_assumption');
  }

  if (!rec.owner || rec.owner.trim().length === 0) {
    violations.push('Missing owner: every recommendation requires a named accountable party.');
    blockedBy.push('explicit_platform_state');
  }

  if (!rec.nextAction || rec.nextAction.trim().length === 0) {
    violations.push('Missing nextAction: the immediate human action must be specified.');
    blockedBy.push('explicit_platform_state');
  }

  if (!rec.rollbackPath || rec.rollbackPath.trim().length === 0) {
    violations.push(
      'Missing rollbackPath: every proposed action must include a tested rollback path before approval.',
    );
    blockedBy.push('rollback_by_default');
  }

  return {
    valid: violations.length === 0,
    violations,
    blockedBy,
  };
}

export function evaluateAgainstDoctrine(
  proposedAction: string,
  domain: string,
): { compliant: boolean; violations: string[]; approvalRequired: boolean; notes: string } {
  const violations: string[] = [];
  let approvalRequired = false;

  for (const prohibited of FOUNDER_INTENT.prohibitedActions) {
    if (proposedAction.toLowerCase().includes('delete') && prohibited.includes('delete')) {
      violations.push(`Prohibited: ${prohibited}`);
    }
    if (proposedAction.toLowerCase().includes('send') && prohibited.includes('Send emails')) {
      violations.push(`Prohibited: ${prohibited}`);
      approvalRequired = true;
    }
  }

  const tolerance = FOUNDER_INTENT.riskTolerances.find((t) => t.domain === domain);
  if (tolerance && tolerance.maxAcceptableRisk < 0.15) {
    approvalRequired = true;
  }

  const matchedApprovals = FOUNDER_INTENT.requiredApprovals.filter(
    (a) =>
      proposedAction.toLowerCase().includes('create') ||
      proposedAction.toLowerCase().includes('delete') ||
      proposedAction.toLowerCase().includes('deploy'),
  );

  if (matchedApprovals.length > 0) approvalRequired = true;

  return {
    compliant: violations.length === 0,
    violations,
    approvalRequired,
    notes:
      violations.length > 0
        ? 'Action blocked by Founder Intent doctrine. Human approval required.'
        : approvalRequired
          ? 'Action is within doctrine but requires explicit approval before execution.'
          : 'Action is compliant with Founder Intent doctrine. May proceed.',
  };
}
