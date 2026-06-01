/**
 * Primitive 67 — Sparse-attention mask
 *
 * Inspired by DeepSeek V3.2-Exp's DeepSeek Sparse Attention (DSA),
 * which selects a fine-grained subset of tokens to attend to instead
 * of all of them, preserving quality while reducing cost. Lifted
 * here: a mask declares which prior receipts a new claim is allowed
 * to depend on. Anything outside the mask cannot influence the
 * claim's verdict; this is checked, not assumed.
 */

export interface AttentionMask {
  claimId: string;
  attended: Set<string>; // receipt ids the claim may consult
  totalAvailable: number;
  rationale: string;
}

export interface MaskInput {
  claimId: string;
  available: string[]; // all receipt ids in scope
  attended: string[]; // subset declared
  rationale: string;
}

export function buildMask(input: MaskInput): AttentionMask {
  const avail = new Set(input.available);
  const att = new Set(input.attended);
  for (const a of att) {
    if (!avail.has(a)) {
      throw new Error(`attended receipt ${a} not in available set`);
    }
  }
  return {
    claimId: input.claimId,
    attended: att,
    totalAvailable: avail.size,
    rationale: input.rationale,
  };
}

export interface DependencyCheck {
  claimId: string;
  ok: boolean;
  outsideMask: string[];
  insideMask: string[];
  sparsity: number; // 1 - attended/totalAvailable
  rationale: string;
}

export function checkDependency(
  mask: AttentionMask,
  observedDeps: string[]
): DependencyCheck {
  const outside = observedDeps.filter((d) => !mask.attended.has(d));
  const inside = observedDeps.filter((d) => mask.attended.has(d));
  const sparsity = mask.totalAvailable === 0
    ? 0
    : 1 - mask.attended.size / mask.totalAvailable;
  return {
    claimId: mask.claimId,
    ok: outside.length === 0,
    outsideMask: outside,
    insideMask: inside,
    sparsity,
    rationale:
      outside.length === 0
        ? `dependency clean: all ${inside.length} observed deps in mask, sparsity ${sparsity.toFixed(3)}`
        : `dependency violated: ${outside.length} dep(s) outside declared mask`,
  };
}
