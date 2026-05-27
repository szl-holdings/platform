/**
 * Ranked-candidates output shape — re-expressed from MsdialWorkbench's
 * never-collapse-to-one peak identification flow
 * (docs/research/perception-bio-synthesis-2026.md §3).
 *
 * The MsdialWorkbench lesson: the system never silently picks one
 * answer. Every classification ships a *ranked list* of candidates;
 * collapsing to a single label requires writing `cutoffChosenBy`
 * (actor + rationale) into the receipt. `selectAboveCutoff` enforces
 * this at the API boundary — collapsing without `cutoffChosenBy`
 * throws.
 */

export interface Candidate<TLabel> {
  readonly label: TLabel;
  readonly libraryRef?: string;
  readonly matchScore: number;
  readonly mzDelta?: number;
  readonly retentionDelta?: number;
}

export interface RankedCandidates<TLabel> {
  readonly peakRef: string;
  readonly candidates: readonly Candidate<TLabel>[];
  /** Cutoff ∈ [0, 1] applied to `matchScore`. */
  readonly confidenceCutoff: number;
  /** Mandatory provenance for any collapse decision. */
  readonly cutoffChosenBy: { readonly actor: string; readonly rationale: string };
}

export function rankCandidates<TLabel>(candidates: readonly Candidate<TLabel>[]): readonly Candidate<TLabel>[] {
  return [...candidates].sort((a, b) => b.matchScore - a.matchScore);
}

export interface SelectionOptions<TLabel> {
  readonly peakRef: string;
  readonly cutoff: number;
  readonly cutoffChosenBy: { readonly actor: string; readonly rationale: string };
  readonly candidates: readonly Candidate<TLabel>[];
}

export function selectAboveCutoff<TLabel>(opts: SelectionOptions<TLabel>): RankedCandidates<TLabel> {
  if (opts.cutoff < 0 || opts.cutoff > 1) {
    throw new Error(`ranked-candidates: cutoff ${opts.cutoff} out of [0, 1]`);
  }
  if (!opts.cutoffChosenBy?.actor || !opts.cutoffChosenBy?.rationale) {
    throw new Error('ranked-candidates: cutoffChosenBy.{actor,rationale} is mandatory (no collapse without provenance)');
  }
  const ranked = rankCandidates(opts.candidates).filter((c) => c.matchScore >= opts.cutoff);
  return {
    peakRef: opts.peakRef,
    candidates: ranked,
    confidenceCutoff: opts.cutoff,
    cutoffChosenBy: opts.cutoffChosenBy,
  };
}
