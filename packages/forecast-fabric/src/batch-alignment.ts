/**
 * Cross-run series alignment with typed cross-run links.
 *
 * Re-expressed from MsdialWorkbench's batch-alignment surface
 * (docs/research/perception-bio-synthesis-2026.md §3): "this peak in
 * run 12 is the same compound as run 3's peak" becomes a typed
 * `AlignedTo = { runId, peakId, residual }` link, never a free-text
 * annotation.
 *
 * The matcher is greedy on the nearest-neighbour-within-tolerance
 * basis; the residual is the (signed) distance between matched
 * anchors. This is intentionally simple — heavier alignment (DTW,
 * profile-likelihood) lands behind the same `align()` adapter when
 * needed.
 */

export interface BatchAnchor {
  readonly runId: string;
  readonly anchorId: string;
  /** Position along the alignment axis (e.g. retention time, x-coord). */
  readonly position: number;
}

export interface AlignedTo {
  readonly runId: string;
  readonly anchorId: string;
  readonly residual: number;
}

export interface Alignment {
  readonly referenceRunId: string;
  readonly tolerance: number;
  /** Map of `${runId}::${anchorId}` → its link in the reference run. */
  readonly links: ReadonlyMap<string, AlignedTo>;
}

export interface AlignBatchOptions {
  readonly referenceRunId: string;
  readonly tolerance: number;
}

export function alignBatch(
  runs: ReadonlyMap<string, readonly BatchAnchor[]>,
  options: AlignBatchOptions,
): Alignment {
  const refAnchors = runs.get(options.referenceRunId);
  if (!refAnchors) {
    throw new Error(`forecast-fabric/batch-alignment: reference run "${options.referenceRunId}" not in batch`);
  }
  const refSorted = [...refAnchors].sort((a, b) => a.position - b.position);

  const links = new Map<string, AlignedTo>();
  for (const [runId, anchors] of runs) {
    if (runId === options.referenceRunId) continue;
    for (const a of anchors) {
      const best = findNearest(refSorted, a.position, options.tolerance);
      if (!best) continue;
      links.set(`${runId}::${a.anchorId}`, {
        runId: options.referenceRunId,
        anchorId: best.anchorId,
        residual: a.position - best.position,
      });
    }
  }
  return { referenceRunId: options.referenceRunId, tolerance: options.tolerance, links };
}

function findNearest(sorted: readonly BatchAnchor[], target: number, tolerance: number): BatchAnchor | undefined {
  let best: BatchAnchor | undefined;
  let bestAbs = Infinity;
  for (const a of sorted) {
    const d = Math.abs(a.position - target);
    if (d > tolerance) {
      if (a.position - target > tolerance) break; // sorted: anything later is even further
      continue;
    }
    if (d < bestAbs) {
      best = a;
      bestAbs = d;
    }
  }
  return best;
}
