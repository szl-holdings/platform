/**
 * Cross-Agent Consensus Quorum
 *
 * For T3+ (dual-approved and above) decisions, spawns N independent
 * AI evaluators that each assess the same pending action using different
 * system prompts. Evaluators return a verdict (approve / deny / escalate)
 * with reasoning and a confidence score.
 *
 * Disagreement among evaluators (no simple majority) auto-escalates.
 * Replace runEvaluator() with real LLM calls in production.
 */

export type QuorumVerdict = 'approve' | 'deny' | 'escalate';

export interface EvaluatorResult {
  evaluatorId: string;
  persona: string;
  verdict: QuorumVerdict;
  reasoning: string;
  confidence: number;
  latencyMs: number;
}

export interface QuorumResult {
  requestId: string;
  quorumVerdict: QuorumVerdict;
  majority: boolean;
  autoEscalated: boolean;
  evaluators: EvaluatorResult[];
  tally: { approve: number; deny: number; escalate: number };
  completedAt: number;
}

export interface QuorumInput {
  requestId: string;
  action: string;
  tier: string;
  domain?: string;
  policyReason?: string;
  evidenceSummary?: string;
  payload?: Record<string, unknown>;
  evaluatorCount?: number;
}

const EVALUATOR_PERSONAS = [
  {
    id: 'risk-auditor',
    persona: 'Risk Auditor',
    bias: 'conservative',
    description: 'Prioritizes risk containment and regulatory compliance.',
  },
  {
    id: 'ops-efficiency',
    persona: 'Operations Lead',
    bias: 'permissive',
    description: 'Weighs operational continuity and business impact.',
  },
  {
    id: 'security-analyst',
    persona: 'Security Analyst',
    bias: 'conservative',
    description: 'Focuses on threat surface, blast radius, and attack vectors.',
  },
  {
    id: 'compliance-officer',
    persona: 'Compliance Officer',
    bias: 'neutral',
    description: 'Evaluates against regulatory frameworks and policy text.',
  },
  {
    id: 'exec-sponsor',
    persona: 'Executive Sponsor',
    bias: 'permissive',
    description: 'Weighs strategic value and organizational reputation.',
  },
];

function simulateEvaluator(
  persona: (typeof EVALUATOR_PERSONAS)[0],
  input: QuorumInput,
  seed: number,
): EvaluatorResult {
  const start = Date.now();
  const tierRisk = TIER_RISK_SCORES[input.tier] ?? 3;
  const rng = deterministicRandom(seed);

  let baseApproveProb: number;
  if (persona.bias === 'conservative') {
    baseApproveProb = Math.max(0.1, 0.6 - tierRisk * 0.08);
  } else if (persona.bias === 'permissive') {
    baseApproveProb = Math.min(0.9, 0.7 - tierRisk * 0.04);
  } else {
    baseApproveProb = 0.55 - tierRisk * 0.06;
  }

  const roll = rng();
  let verdict: QuorumVerdict;
  if (roll < baseApproveProb) {
    verdict = 'approve';
  } else if (roll < baseApproveProb + 0.15) {
    verdict = 'escalate';
  } else {
    verdict = 'deny';
  }

  const confidence = 0.55 + rng() * 0.35;
  const reasoning = buildReasoning(persona, verdict, input, tierRisk);
  const latencyMs = 120 + Math.floor(rng() * 280);

  return {
    evaluatorId: persona.id,
    persona: persona.persona,
    verdict,
    reasoning,
    confidence: Math.round(confidence * 100) / 100,
    latencyMs: Date.now() - start + latencyMs,
  };
}

function buildReasoning(
  persona: (typeof EVALUATOR_PERSONAS)[0],
  verdict: QuorumVerdict,
  input: QuorumInput,
  tierRisk: number,
): string {
  const { action, tier, domain, policyReason } = input;
  const domainLabel = domain ? ` in the ${domain} domain` : '';
  const context = policyReason ? ` Policy trigger: ${policyReason}.` : '';

  if (verdict === 'approve') {
    return `[${persona.persona}] Action "${action}"${domainLabel} falls within acceptable parameters for ${tier} tier. Evidence chain supports proceeding; risk level ${tierRisk}/6 is within authorized threshold.${context}`;
  }
  if (verdict === 'escalate') {
    return `[${persona.persona}] Action "${action}"${domainLabel} requires additional review at risk level ${tierRisk}/6. Confidence insufficient for autonomous approval; escalating to human arbiter.${context}`;
  }
  return `[${persona.persona}] Action "${action}"${domainLabel} should be denied. Risk profile ${tierRisk}/6 exceeds ${persona.description.toLowerCase()} acceptable range.${context}`;
}

function deterministicRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0xffffffff);
  };
}

const TIER_RISK_SCORES: Record<string, number> = {
  advisory: 1,
  supervised: 2,
  'operator-approved': 3,
  'dual-approved': 4,
  regulated: 5,
  sovereign: 6,
};

const TIERS_REQUIRING_QUORUM = new Set(['dual-approved', 'regulated', 'sovereign']);

export function tierRequiresQuorum(tier: string): boolean {
  return TIERS_REQUIRING_QUORUM.has(tier);
}

/**
 * Run a consensus quorum for a pending approval request.
 * For production, replace the body with real async LLM calls.
 */
export async function runConsensusQuorum(input: QuorumInput): Promise<QuorumResult> {
  const count = Math.min(Math.max(input.evaluatorCount ?? 3, 2), 5);
  const personas = EVALUATOR_PERSONAS.slice(0, count);

  const seed = input.requestId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const evaluators: EvaluatorResult[] = personas.map((p, i) =>
    simulateEvaluator(p, input, seed + i * 37),
  );

  const tally = { approve: 0, deny: 0, escalate: 0 };
  for (const ev of evaluators) {
    tally[ev.verdict]++;
  }

  const majority = count > 0 ? Math.max(...Object.values(tally)) > count / 2 : false;
  let quorumVerdict: QuorumVerdict;
  let autoEscalated = false;

  if (!majority) {
    quorumVerdict = 'escalate';
    autoEscalated = true;
  } else {
    const [topVerdict] = Object.entries(tally).sort(([, a], [, b]) => b - a) as [
      [QuorumVerdict, number],
    ];
    quorumVerdict = topVerdict[0];
  }

  return {
    requestId: input.requestId,
    quorumVerdict,
    majority,
    autoEscalated,
    evaluators,
    tally,
    completedAt: Date.now(),
  };
}
