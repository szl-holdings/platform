/**
 * Same-label connected-component detection via union-find.
 *
 * Two particles join the same cluster iff:
 *   1. they share a `label`, AND
 *   2. centre-to-centre distance ≤ r_i + r_j + ε.
 *
 * Returns one cluster per connected component, with stable member ids.
 * Property: ∑ cluster.size = particles.length (no particle is lost or
 * counted twice). This is the Lean lemma in
 * `packages/lean-formulas/Perception/PeakScore.lean` (statement:
 * `partition_total_size`).
 */

import type { Particle } from './verlet-step.js';

export interface Cluster {
  readonly clusterId: number;
  readonly label: string;
  readonly memberIds: readonly string[];
  readonly size: number;
  readonly centroid: readonly [number, number];
}

export interface ClusterDetectOptions {
  /** Distance epsilon added to (r_i + r_j). */
  readonly epsilon?: number;
}

export function detectClusters(
  particles: readonly Particle[],
  options: ClusterDetectOptions = {},
): Cluster[] {
  const eps = options.epsilon ?? 0;
  const n = particles.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  const find = (x: number): number => {
    let r = x;
    while (parent[r] !== r) r = parent[r]!;
    let cur = x;
    while (parent[cur] !== r) {
      const next = parent[cur]!;
      parent[cur] = r;
      cur = next;
    }
    return r;
  };
  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = particles[i]!;
      const b = particles[j]!;
      if (a.label !== b.label) continue;
      const dx = a.position[0] - b.position[0];
      const dy = a.position[1] - b.position[1];
      const r = a.radius + b.radius + eps;
      if (dx * dx + dy * dy <= r * r) union(i, j);
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    const g = groups.get(r);
    if (g) g.push(i);
    else groups.set(r, [i]);
  }

  let nextId = 0;
  const clusters: Cluster[] = [];
  for (const [, indices] of groups) {
    let cx = 0;
    let cy = 0;
    for (const idx of indices) {
      cx += particles[idx]!.position[0];
      cy += particles[idx]!.position[1];
    }
    const k = indices.length;
    clusters.push({
      clusterId: nextId++,
      label: particles[indices[0]!]!.label,
      memberIds: indices.map((i) => particles[i]!.id),
      size: k,
      centroid: [cx / k, cy / k],
    });
  }
  return clusters;
}
