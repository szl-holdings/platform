/**
 * Primitive 71 — Multi-token prediction with verification
 *
 * Inspired by MiMo's "Multiple-Token Prediction as an additional
 * training objective, which enhances model performance and accelerates
 * inference" — and by speculative-decoding patterns more broadly
 * (FlashInfer's "chain speculative sampling support"). Architectural
 * insight: emit several tokens at once but verify them as a block;
 * accept the longest verified prefix. Lifted: a claim emitter
 * proposes N candidate next-claims, a verifier checks each, and the
 * accepted prefix is the longest contiguous run of admits from the
 * head.
 */

export interface CandidateClaim {
  index: number;
  claimId: string;
  payload: unknown;
}

export interface CandidateVerdict {
  index: number;
  admits: boolean;
  rationale: string;
}

export interface MtpReceipt {
  proposed: number;
  acceptedPrefix: number; // longest contiguous head admit run
  acceptedClaims: CandidateClaim[];
  firstRejection: CandidateVerdict | null;
  rationale: string;
}

export function verifyBlock(
  candidates: CandidateClaim[],
  verdicts: CandidateVerdict[]
): MtpReceipt {
  if (candidates.length === 0) {
    throw new Error("no candidates");
  }
  if (candidates.length !== verdicts.length) {
    throw new Error("candidates and verdicts length differ");
  }
  // sort by index defensively
  const c = [...candidates].sort((a, b) => a.index - b.index);
  const v = [...verdicts].sort((a, b) => a.index - b.index);
  for (let i = 0; i < c.length; i++) {
    if (c[i].index !== i || v[i].index !== i) {
      throw new Error(`expected contiguous indices 0..N-1`);
    }
  }
  let prefix = 0;
  let firstRejection: CandidateVerdict | null = null;
  for (let i = 0; i < v.length; i++) {
    if (v[i].admits) {
      prefix++;
    } else {
      firstRejection = v[i];
      break;
    }
  }
  return {
    proposed: c.length,
    acceptedPrefix: prefix,
    acceptedClaims: c.slice(0, prefix),
    firstRejection,
    rationale:
      prefix === c.length
        ? `all ${c.length} candidate(s) admitted`
        : `accepted prefix ${prefix}/${c.length}; first rejection at index ${firstRejection?.index}`,
  };
}
