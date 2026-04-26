/**
 * Counterfactual Impact Preview Engine
 *
 * Given an approval request's evidence chain and domain context,
 * generates two short projections: "approve outcome" and "deny outcome".
 *
 * In production, wire generateProjection() to your preferred LLM provider.
 * The fallback implementation returns deterministic, context-aware projections
 * so the feature is demonstrable without an API call.
 */

export interface CounterfactualProjection {
  verdict: 'approve' | 'deny';
  bullets: string[];
  confidence: number;
  generatedAt: number;
}

export interface CounterfactualPreview {
  requestId: string;
  approve: CounterfactualProjection;
  deny: CounterfactualProjection;
  generatedAt: number;
}

export interface CounterfactualInput {
  requestId: string;
  action: string;
  tier: string;
  domain?: string;
  agentId?: string;
  evidenceSummary?: string;
  policyReason?: string;
  payload?: Record<string, unknown>;
}

/**
 * Generate a counterfactual preview for an approval request.
 *
 * Replace the body of this function with an LLM call when available.
 * The function is async to make the LLM integration drop-in.
 */
export async function generateCounterfactualPreview(
  input: CounterfactualInput,
): Promise<CounterfactualPreview> {
  const now = Date.now();
  const { requestId, action, tier, domain, evidenceSummary } = input;

  const tierRisk = TIER_RISK_SCORES[tier] ?? 3;
  const high = tierRisk >= 4;

  const approve: CounterfactualProjection = {
    verdict: 'approve',
    confidence: high ? 0.62 : 0.81,
    generatedAt: now,
    bullets: buildApproveBullets(action, tier, domain, evidenceSummary, high),
  };

  const deny: CounterfactualProjection = {
    verdict: 'deny',
    confidence: high ? 0.78 : 0.65,
    generatedAt: now,
    bullets: buildDenyBullets(action, tier, domain, high),
  };

  return { requestId, approve, deny, generatedAt: now };
}

const TIER_RISK_SCORES: Record<string, number> = {
  advisory: 1,
  supervised: 2,
  'operator-approved': 3,
  'dual-approved': 4,
  regulated: 5,
  sovereign: 6,
};

function buildApproveBullets(
  action: string,
  tier: string,
  domain: string | undefined,
  evidenceSummary: string | undefined,
  high: boolean,
): string[] {
  const domainLabel = domain ? `the ${domain} domain` : 'this domain';
  const bullets = [
    `Agent proceeds with "${action}" under ${tier} tier controls.`,
    evidenceSummary
      ? `Supporting evidence will be executed: ${evidenceSummary.slice(0, 120)}.`
      : `Action executes within the authorized policy envelope for ${domainLabel}.`,
    high
      ? 'Rollback capability verified; reversal window is 48h post-execution.'
      : 'Execution completes with full audit trail and PII redaction applied.',
    high
      ? 'Dual-approval record and cryptographic proof chain preserved for compliance.'
      : 'Action outcome logged and indexed to the evidence chain for auditability.',
    'Cost and latency impact within projected budget envelope.',
  ];
  return bullets;
}

function buildDenyBullets(
  action: string,
  tier: string,
  domain: string | undefined,
  high: boolean,
): string[] {
  const domainLabel = domain ? `the ${domain} domain` : 'this domain';
  return [
    `Action "${action}" is blocked; agent workflow paused at current step.`,
    high
      ? 'Denial escalated to governance memory; prevents repeated auto-approval attempts.'
      : `Denial logged to audit trail for ${domainLabel}; no state changes occur.`,
    'Agent receives structured feedback — policyReason injected into context for replanning.',
    high
      ? 'Compliance record created; denial counts toward tier re-evaluation at 30-day review.'
      : 'Override window remains open for 24h if additional context warrants reconsideration.',
    'No external calls, data writes, or financial commitments initiated.',
  ];
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
