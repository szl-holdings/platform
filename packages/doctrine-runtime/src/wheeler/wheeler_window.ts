/**
 * wheeler_window.ts — runtime counterpart of Lutar/Wheeler/DelayedChoiceClosure.lean
 *
 * Implements the Wheeler-window audit-closure operator: receipts that
 * arrive within W ticks of span end may re-label the span; later receipts
 * are rejected.
 *
 * Mirror invariants of the Lean module (kernel-checked there):
 *   T1 — closeLabel is idempotent on admissible receipts.
 *   T2 — receipts closing after endAt + W return Bot.
 *   T3 — receipts closing at endAt are admissible.
 *   T4 — receipts closing at endAt + W (exactly) are admissible.
 *   T5 — receipts closing before endAt are rejected (no pre-cognition).
 *   T6 — receipts with the wrong span id are rejected.
 *
 * Citations: Wheeler 1978 (Marlow ed.); Jacques et al. 2007
 * (DOI 10.1126/science.1136303); Manning et al. 2015
 * (DOI 10.1038/nphys3343); Ma–Kofler–Zeilinger 2016
 * (DOI 10.1103/RevModPhys.88.015005).
 *
 * Innovation beyond attribution: the bounded-window operational form is
 * novel — Wheeler's gedanken is a non-operational thought experiment.
 */

export type Tick = number;
export type SpanId = number;

export enum DoctrineLabel {
  Bot = 'Bot',
  L1 = 'L1',
  L2 = 'L2',
  Top = 'Top',
}

export interface Span {
  readonly id: SpanId;
  readonly start: Tick;
  readonly endAt: Tick;
}

export interface Receipt {
  readonly span: SpanId;
  readonly closeAt: Tick;
  readonly label: DoctrineLabel;
}

/** Wheeler window size, in ticks. Mirrors `Lutar.Wheeler.W`. */
export const WHEELER_WINDOW_W: Tick = 1000;

export function admissible(s: Span, r: Receipt): boolean {
  return (
    r.span === s.id &&
    s.endAt <= r.closeAt &&
    r.closeAt <= s.endAt + WHEELER_WINDOW_W
  );
}

export function closeLabel(s: Span, r: Receipt): DoctrineLabel {
  return admissible(s, r) ? r.label : DoctrineLabel.Bot;
}

/**
 * Streaming variant: given a span and a finite stream of candidate
 * receipts, return the *last admissible* label.  Models "the choice that
 * actually closed the window."
 */
export function closeStream(s: Span, receipts: readonly Receipt[]): DoctrineLabel {
  let label: DoctrineLabel = DoctrineLabel.Bot;
  for (const r of receipts) {
    if (admissible(s, r)) label = r.label;
  }
  return label;
}

/**
 * Deterministic test predicate — useful for property-based testing.  Pure,
 * total, decidable; matches the Lean `admissible` exactly.
 */
export function admissibleDeterministic(s: Span, r: Receipt): boolean {
  return admissible(s, r);
}
