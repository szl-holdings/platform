/**
 * Bounded-Byzantine swarm consensus tally — re-expressed from Shield AI's
 * Hivemind posture (distributed agreement under intermittent connectivity).
 * See docs/research/electrodynamics-synthesis-2026.md §6.
 *
 *   "The tally itself is the auditable artifact — not the agreed value alone."
 *
 * Pure deterministic tally. No transport, no network layer.
 */

export interface SwarmVote {
  readonly memberId: string;
  /** Canonical-JSON string of the proposal payload. */
  readonly proposalCanonical: string;
  /** Hex hash of the vote (memberId + proposalCanonical). */
  readonly voteHash: string;
  /** Hex signature of voteHash. */
  readonly signature: string;
}

export interface TallyRule {
  readonly memberCount: number;
  /** Maximum tolerated Byzantine members; default ⌊(n-1)/3⌋. */
  readonly byzantineTolerance: number;
}

export type ConsensusVerdict =
  | { readonly kind: 'agreed'; readonly proposalCanonical: string; readonly supportingVotes: number }
  | { readonly kind: 'no-quorum'; readonly reason: string; readonly topProposalSupport: number };

export interface ConsensusResult {
  readonly tallyId: string;
  readonly memberCount: number;
  readonly byzantineTolerance: number;
  readonly votesHash: string;
  readonly verdict: ConsensusVerdict;
}

/** Default Byzantine tolerance: ⌊(n-1)/3⌋. */
export function defaultByzantineTolerance(memberCount: number): number {
  if (memberCount <= 0) return 0;
  return Math.floor((memberCount - 1) / 3);
}

/**
 * Required supporting votes for an agreed verdict under bounded-Byzantine
 * agreement: 2f + 1 where f = byzantineTolerance.
 */
export function quorumThreshold(byzantineTolerance: number): number {
  return 2 * byzantineTolerance + 1;
}

/** Stable hash placeholder; consumers pass in the actual hasher. */
export type HashFn = (s: string) => string;

/**
 * Deterministic tally. Input vote order does not affect the output —
 * we sort by memberId before hashing.
 */
export function tally(
  votes: readonly SwarmVote[],
  rule: TallyRule,
  hasher: HashFn,
  tallyId: string,
): ConsensusResult {
  if (!Number.isInteger(rule.memberCount) || rule.memberCount < 0) {
    throw new Error(`swarm-consensus: memberCount must be a non-negative integer, got ${rule.memberCount}`);
  }
  if (!Number.isInteger(rule.byzantineTolerance) || rule.byzantineTolerance < 0) {
    throw new Error(
      `swarm-consensus: byzantineTolerance must be a non-negative integer, got ${rule.byzantineTolerance}`,
    );
  }
  if (rule.byzantineTolerance * 3 + 1 > rule.memberCount && rule.memberCount > 0) {
    throw new Error(
      `swarm-consensus: rule violates bounded-Byzantine: 3f+1 > n (f=${rule.byzantineTolerance}, n=${rule.memberCount})`,
    );
  }
  const sortedVotes = [...votes].sort((a, b) => a.memberId.localeCompare(b.memberId));
  const votesHash = hasher(
    sortedVotes
      .map((v) => `${v.memberId}|${v.voteHash}|${v.signature}`)
      .join('\n'),
  );

  const support = new Map<string, number>();
  const seenMembers = new Set<string>();
  for (const v of sortedVotes) {
    if (seenMembers.has(v.memberId)) continue;
    seenMembers.add(v.memberId);
    support.set(v.proposalCanonical, (support.get(v.proposalCanonical) ?? 0) + 1);
  }

  let topProposal: string | undefined;
  let topSupport = 0;
  for (const [proposal, count] of support) {
    if (count > topSupport) {
      topSupport = count;
      topProposal = proposal;
    }
  }

  const threshold = quorumThreshold(rule.byzantineTolerance);
  if (topProposal !== undefined && topSupport >= threshold) {
    return {
      tallyId,
      memberCount: rule.memberCount,
      byzantineTolerance: rule.byzantineTolerance,
      votesHash,
      verdict: { kind: 'agreed', proposalCanonical: topProposal, supportingVotes: topSupport },
    };
  }
  return {
    tallyId,
    memberCount: rule.memberCount,
    byzantineTolerance: rule.byzantineTolerance,
    votesHash,
    verdict: {
      kind: 'no-quorum',
      reason: `top proposal had ${topSupport} supporting votes, threshold ${threshold} (2f+1 with f=${rule.byzantineTolerance})`,
      topProposalSupport: topSupport,
    },
  };
}
