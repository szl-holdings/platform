/**
 * Primitive 68 — Expert router
 *
 * Inspired by Kimi K2's 384-expert MoE with top-8 selection per token,
 * GLM-4.5/4.6 (32B active of 355B total), and Qwen3-235B-A22B. The
 * architectural pattern: route each input to a small subset of
 * experts via learned gating. Lifted: route each claim to a small
 * subset of declared verifiers, and require at least one to admit.
 *
 * Difference from naive multi-vote: we record per-expert receipts,
 * track which experts were even *eligible*, and refuse silent
 * fallthrough to a default expert.
 */

export interface Expert {
  id: string;
  domains: string[]; // e.g., ["math", "code"]
}

export interface RouteInput {
  claimId: string;
  domain: string;
  topK: number;
  affinity: Map<string, number>; // expertId -> score; higher is closer
}

export interface RouteReceipt {
  claimId: string;
  domain: string;
  eligible: Expert[];
  selected: Expert[];
  rationale: string;
}

export function route(
  experts: Expert[],
  input: RouteInput
): RouteReceipt {
  if (input.topK < 1) throw new Error("topK must be >= 1");
  const eligible = experts.filter((e) => e.domains.includes(input.domain));
  if (eligible.length === 0) {
    return {
      claimId: input.claimId,
      domain: input.domain,
      eligible: [],
      selected: [],
      rationale: `no expert covers domain ${input.domain}`,
    };
  }
  const scored = eligible
    .map((e) => ({ e, s: input.affinity.get(e.id) ?? -Infinity }))
    .sort((a, b) => {
      if (a.s !== b.s) return b.s - a.s;
      return a.e.id.localeCompare(b.e.id);
    });
  const selected = scored.slice(0, input.topK).map((x) => x.e);
  return {
    claimId: input.claimId,
    domain: input.domain,
    eligible,
    selected,
    rationale: `selected ${selected.length}/${eligible.length} expert(s) by affinity, top-${input.topK}`,
  };
}

export interface ExpertVerdict {
  expertId: string;
  admits: boolean;
  rationale: string;
}

export interface QuorumReceipt {
  claimId: string;
  verdicts: ExpertVerdict[];
  admitted: number;
  refused: number;
  quorumMet: boolean;
  rationale: string;
}

export function tallyVerdicts(
  claimId: string,
  verdicts: ExpertVerdict[],
  minAdmits: number
): QuorumReceipt {
  const admitted = verdicts.filter((v) => v.admits).length;
  const refused = verdicts.length - admitted;
  const quorumMet = admitted >= minAdmits;
  return {
    claimId,
    verdicts,
    admitted,
    refused,
    quorumMet,
    rationale: quorumMet
      ? `quorum met: ${admitted}/${verdicts.length} admit (>= ${minAdmits})`
      : `quorum NOT met: only ${admitted}/${verdicts.length} admit (< ${minAdmits})`,
  };
}
