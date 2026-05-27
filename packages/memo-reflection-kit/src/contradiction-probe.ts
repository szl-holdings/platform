// Stage 1 ↔ Stage 2 contradiction probe. Re-expressed from the
// sparse-attention-kit contradiction-probe discipline: a cheap consistency
// check between two stage outputs that the orchestrator MUST act on
// (either re-run with longer budget, or fall back to grounding-only
// synthesis). Both branches MUST emit a receipt; silence is a doctrine
// violation.
//
// The probe is a Jaccard agreement over the *fact keysets* surfaced by
// each stage. Each stage names the surfaced facts by their reflection-
// receipt-refs (i.e. content-addressed), so the agreement is over
// content-hashes, never over free-text.

export interface ContradictionProbeInput {
  /** Reflection-refs cited by the Stage 1 grounding responses. */
  readonly stage1FactRefs: ReadonlyArray<string>;
  /** Reflection-refs cited by the Stage 2 entity-supporting facts. */
  readonly stage2FactRefs: ReadonlyArray<string>;
  /** Minimum acceptable Jaccard agreement. Below this, `violated:true`. */
  readonly minAgreement: number;
}

export interface ContradictionProbeOutput {
  readonly agreement: number;
  readonly violated: boolean;
  readonly stage1Only: ReadonlyArray<string>;
  readonly stage2Only: ReadonlyArray<string>;
  readonly intersection: ReadonlyArray<string>;
}

export function probeStage2Contradiction(
  input: ContradictionProbeInput,
): ContradictionProbeOutput {
  const a = new Set(input.stage1FactRefs);
  const b = new Set(input.stage2FactRefs);
  const intersection: string[] = [];
  for (const x of a) if (b.has(x)) intersection.push(x);
  const stage1Only = [...a].filter((x) => !b.has(x));
  const stage2Only = [...b].filter((x) => !a.has(x));
  const unionSize = a.size + b.size - intersection.length;
  const agreement = unionSize === 0 ? 1 : intersection.length / unionSize;
  return {
    agreement,
    violated: agreement < input.minAgreement,
    stage1Only,
    stage2Only,
    intersection,
  };
}
