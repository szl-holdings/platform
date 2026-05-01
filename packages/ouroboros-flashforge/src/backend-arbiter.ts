/**
 * Primitive 62 — Backend arbiter
 *
 * Inspired by FlashInfer's multi-backend selection (FlashAttention-2/3,
 * cuDNN, CUTLASS, TensorRT-LLM) — automatically pick the best backend
 * for a given (op, target) pair. We lift this to deterministic policy
 * arbitration over any set of declared backends.
 */

export interface BackendOffer {
  backend: string;
  op: string;
  target: string;
  cost: number; // lower is better
  admits: boolean;
}

export type ArbiterPolicy = "min-cost" | "first-admit" | "deterministic-tiebreak";

export interface ArbitrationReceipt {
  op: string;
  target: string;
  considered: BackendOffer[];
  chosen: BackendOffer | null;
  policy: ArbiterPolicy;
  rationale: string;
}

export function arbitrate(
  offers: BackendOffer[],
  op: string,
  target: string,
  policy: ArbiterPolicy = "min-cost"
): ArbitrationReceipt {
  const eligible = offers.filter(
    (o) => o.op === op && o.target === target && o.admits
  );
  if (eligible.length === 0) {
    return {
      op,
      target,
      considered: offers.filter((o) => o.op === op && o.target === target),
      chosen: null,
      policy,
      rationale: `no admissible backend for ${op}::${target}`,
    };
  }

  let chosen: BackendOffer;
  if (policy === "first-admit") {
    chosen = eligible[0];
  } else {
    // min-cost and deterministic-tiebreak both sort by cost,
    // then break ties by backend name lexicographically
    const sorted = [...eligible].sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a.backend.localeCompare(b.backend);
    });
    chosen = sorted[0];
  }

  return {
    op,
    target,
    considered: eligible,
    chosen,
    policy,
    rationale: `${policy}: chose ${chosen.backend} (cost=${chosen.cost}) of ${eligible.length} admissible backend(s)`,
  };
}
