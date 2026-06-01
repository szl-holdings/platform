/**
 * Primitive 82 — Edge-aggregation receipt (Menace)
 *
 * Inspired by Anduril Menace: complex data aggregation executed
 * directly at the tactical edge — austere, contested, distant. The
 * lift: every aggregation produced at the edge must carry a
 * disconnection-tolerance receipt — proof it works without an uplink.
 *
 * The pattern: a sliding-window aggregator that buffers locally,
 * emits at policy intervals, and ALWAYS marks output with the
 * connectivity state at emission. Dashboards downstream can then
 * trust-rank by connectivity history.
 *
 * Source: anduril.com/news/...steel-knight (Menace edge compute).
 * No Anduril code lifted.
 */

export type Connectivity = "online" | "intermittent" | "offline";

export interface EdgeSample {
  ts: number;
  value: number;
  connectivity: Connectivity;
}

export interface EdgeAggregate {
  windowStart: number;
  windowEnd: number;
  count: number;
  mean: number;
  min: number;
  max: number;
  worstConnectivity: Connectivity;
  trustScore: number; // 0..1, lower if window had any offline period
}

const CONN_RANK: Record<Connectivity, number> = { online: 1.0, intermittent: 0.6, offline: 0.2 };

export function aggregateEdge(samples: EdgeSample[]): EdgeAggregate {
  if (samples.length === 0) {
    throw new Error("cannot aggregate empty sample window");
  }
  const sorted = [...samples].sort((a, b) => a.ts - b.ts);
  let sum = 0;
  let mn = Infinity;
  let mx = -Infinity;
  let worst: Connectivity = "online";
  let worstRank = 1;
  for (const s of sorted) {
    sum += s.value;
    if (s.value < mn) mn = s.value;
    if (s.value > mx) mx = s.value;
    const r = CONN_RANK[s.connectivity];
    if (r < worstRank) {
      worstRank = r;
      worst = s.connectivity;
    }
  }
  // trustScore: average of per-sample connectivity ranks.
  const trustSum = sorted.reduce((s, x) => s + CONN_RANK[x.connectivity], 0);
  const trust = trustSum / sorted.length;
  return {
    windowStart: sorted[0].ts,
    windowEnd: sorted[sorted.length - 1].ts,
    count: sorted.length,
    mean: sum / sorted.length,
    min: mn,
    max: mx,
    worstConnectivity: worst,
    trustScore: trust,
  };
}

// Disconnection-tolerance gate — refuses to emit when the window
// is below trustFloor and policy says fail-closed.
export function emitGate(agg: EdgeAggregate, trustFloor: number, failClosed: boolean): { emit: boolean; reason: string } {
  if (agg.trustScore >= trustFloor) return { emit: true, reason: "trust above floor" };
  if (failClosed) return { emit: false, reason: `trust ${agg.trustScore.toFixed(3)} below floor ${trustFloor} (fail-closed)` };
  return { emit: true, reason: "trust below floor but fail-open policy" };
}
