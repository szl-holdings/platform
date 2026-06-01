import { type VerifierDecision, verify } from '@workspace/verifier';
import type { StructuredExecutiveBrief } from './types.js';

export interface GateResult {
  status: 'passed' | 'revision_required';
  decision: VerifierDecision;
  feedback: string | null;
}

export function gateBrief(
  brief: Omit<
    StructuredExecutiveBrief,
    'id' | 'generatedAt' | 'verifierStatus' | 'verifierFeedback' | 'sourceTraceIds' | 'briefingId'
  >,
): GateResult {
  const claims = brief.whatWeBelieve.map((b) => ({
    text: b.claim,
    citationIds: b.citationIds,
    supported: b.supported,
  }));

  const citations = brief.whyCitations.map((c) => ({
    id: c.id,
    sourceId: c.sourceId,
    quote: c.quote,
    verified: c.verified,
  }));

  const requiredFields = [
    'headline',
    'situation',
    'whatWeBelieve',
    'whyCitations',
    'whatWeRecommend',
    'autonomyTier',
    'confidence',
  ];
  const providedFields: string[] = [];
  if (brief.headline?.trim()) providedFields.push('headline');
  if (brief.situation?.trim()) providedFields.push('situation');
  if (brief.whatWeBelieve?.length > 0) providedFields.push('whatWeBelieve');
  if (brief.whyCitations?.length > 0) providedFields.push('whyCitations');
  if (brief.whatWeRecommend?.length > 0) providedFields.push('whatWeRecommend');
  if (brief.autonomyTier) providedFields.push('autonomyTier');
  if (brief.confidence !== undefined) providedFields.push('confidence');

  const decision: VerifierDecision = verify(
    {
      text: `${brief.headline}\n\n${brief.situation}`,
      claims,
      citations,
      confidence: brief.confidence,
      requiredFields,
      providedFields,
    },
    {
      domain: brief.domain,
      disabledChecks: [],
    },
  );

  const passed = decision.action === 'approve' || decision.action === 'revise';
  const blocked = decision.action === 'block' || decision.action === 'escalate';

  const feedbackParts: string[] = [];
  for (const r of (decision as any).results ?? []) {
    if (r.outcome === 'fail' || r.outcome === 'blocked') {
      feedbackParts.push(`[${r.check}] ${r.reasoning ?? r.outcome}`);
    }
  }

  return {
    status: blocked ? 'revision_required' : passed ? 'passed' : 'revision_required',
    decision,
    feedback: feedbackParts.length > 0 ? feedbackParts.join('; ') : null,
  };
}
