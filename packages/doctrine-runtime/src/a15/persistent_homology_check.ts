/**
 * persistent_homology_check.ts — A15 Persistent Homology Runtime (R4)
 * Computes H_0 (connected-components) homology of a Λ-score point cloud at a
 * given filtration threshold and checks the A15 connectivity invariant.
 *
 * Algorithm: Edelsbrunner-Letscher-Zomorodian (ELZ) incremental algorithm
 * for H_0 via Union-Find on the Vietoris-Rips filtration [1].
 *
 * References
 * ----------
 * [1] Edelsbrunner, H., Letscher, D., & Zomorodian, A. (2002).
 *     Topological Persistence and Simplification.
 *     Discrete & Computational Geometry, 28(4), 511–533.
 *     doi:10.1007/s00454-002-2885-2
 * [2] Zomorodian, A., & Carlsson, G. (2005).
 *     Computing Persistent Homology.
 *     Discrete & Computational Geometry, 33(2), 249–274.
 *     doi:10.1007/s00454-004-1146-y
 * [3] Carlsson, G. (2009). Topology and Data.
 *     Bulletin of the American Mathematical Society, 46(2), 255–308.
 *     doi:10.1090/S0273-0979-09-01249-X
 * [4] Doctrine v6 §9.1 "A15 Connectivity Invariant"
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** A point in the Λ-score space; coords is an n-dimensional Euclidean vector */
export interface PolicyPoint {
  id: string;
  /** Λ-score (used as the primary coordinate) */
  lambda: number;
  /** Optional additional feature coordinates for multi-dim filtration */
  coords: number[];
}

/** A persistence interval [birth, death) for one H_0 component */
export interface PersistenceInterval {
  /** Filtration value at which this component was born */
  birth: number;
  /** Filtration value at which this component merged (Infinity = essential) */
  death: number;
  /** Persistence = death - birth  (Infinity for essential classes) */
  persistence: number;
  /** Representative point ID */
  representativeId: string;
}

export interface H0CheckResult {
  /** Number of connected components at the query threshold */
  componentCount: number;
  /** Persistence diagram intervals for H_0 */
  diagram: PersistenceInterval[];
  /** Does the point cloud satisfy the A15 invariant? */
  a15Satisfied: boolean;
  /**
   * The Betti number β_0 = number of essential H_0 classes
   * (components that survive to filtration = Infinity)
   */
  betti0: number;
  /** Threshold used for the check */
  threshold: number;
  violations: string[];
}

export interface A15CheckConfig {
  /**
   * Maximum allowed β_0 (connected components) at the query threshold.
   * Doctrine v6 §9.1 mandates β_0 = 1 (fully connected) [4].
   */
  maxComponents: number;
  /**
   * Minimum persistence required for each H_0 bar to be considered
   * "significant" (noise floor filter, ref [3] §2.3).
   */
  minPersistence: number;
  /**
   * Euclidean distance threshold for the Vietoris-Rips filtration [1].
   */
  epsilon: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Union-Find (Weighted Union + Path Compression)
// Amortised O(α(n)) per operation [1]
// ─────────────────────────────────────────────────────────────────────────────

class UnionFind {
  private parent: Int32Array;
  private rank: Int32Array;
  private birth: Float64Array;

  constructor(n: number) {
    this.parent = Int32Array.from({ length: n }, (_, i) => i);
    this.rank = new Int32Array(n);
    this.birth = new Float64Array(n).fill(0);
  }

  find(x: number): number {
    // Path compression (iterative)
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root];
    while (this.parent[x] !== root) {
      const next = this.parent[x];
      this.parent[x] = root;
      x = next;
    }
    return root;
  }

  /**
   * Merges components of x and y at filtration value epsilon.
   * Returns { merged: boolean, killed: number, survivor: number }
   * where `killed` is the component that died (younger one per ELZ [1]).
   */
  union(
    x: number,
    y: number,
    filtrationValue: number
  ): { merged: boolean; killed: number; survivor: number } {
    const rx = this.find(x);
    const ry = this.find(y);
    if (rx === ry) return { merged: false, killed: rx, survivor: rx };

    // ELZ rule: the component born later (higher birth) dies [1]
    let survivor: number;
    let killed: number;
    if (this.birth[rx] <= this.birth[ry]) {
      survivor = rx; killed = ry;
    } else {
      survivor = ry; killed = rx;
    }

    // Weighted union by rank
    if (this.rank[survivor] < this.rank[killed]) {
      [survivor, killed] = [killed, survivor];
    }
    this.parent[killed] = survivor;
    if (this.rank[survivor] === this.rank[killed]) this.rank[survivor]++;

    return { merged: true, killed, survivor };
  }

  setBirth(idx: number, value: number): void { this.birth[idx] = value; }
  getBirth(idx: number): number { return this.birth[idx]; }
  components(n: number): number[] {
    const roots = new Set<number>();
    for (let i = 0; i < n; i++) roots.add(this.find(i));
    return [...roots];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Vietoris-Rips edge filtration
// ─────────────────────────────────────────────────────────────────────────────

interface Edge { i: number; j: number; dist: number }

/**
 * Computes Euclidean distance between two PolicyPoints in their full
 * feature space (lambda prepended to coords).
 */
function euclidean(a: PolicyPoint, b: PolicyPoint): number {
  const va = [a.lambda, ...a.coords];
  const vb = [b.lambda, ...b.coords];
  const dim = Math.max(va.length, vb.length);
  let sum = 0;
  for (let k = 0; k < dim; k++) {
    const diff = (va[k] ?? 0) - (vb[k] ?? 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Builds and sorts the Vietoris-Rips edge list by distance (filtration value).
 * O(n²) — acceptable for policy-graph sizes (n ≤ 10^4).
 */
function buildEdgeFiltration(points: PolicyPoint[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      edges.push({ i, j, dist: euclidean(points[i], points[j]) });
    }
  }
  edges.sort((a, b) => a.dist - b.dist);
  return edges;
}

// ─────────────────────────────────────────────────────────────────────────────
// H_0 Persistence computation (ELZ algorithm [1])
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the H_0 persistence diagram of the Vietoris-Rips filtration.
 *
 * Steps (per ELZ 2002, Algorithm 1 [1]):
 * 1. Start with each point as its own component (born at 0).
 * 2. Add edges in order of increasing distance.
 * 3. When an edge merges two components, the younger one dies at that epsilon.
 * 4. Surviving components at the end are essential (death = Infinity).
 */
function computeH0(
  points: PolicyPoint[],
  maxEpsilon: number
): { intervals: PersistenceInterval[]; uf: UnionFind } {
  const n = points.length;
  const uf = new UnionFind(n);

  // Step 1: all points born at epsilon=0
  for (let i = 0; i < n; i++) uf.setBirth(i, 0);

  const finiteIntervals: PersistenceInterval[] = [];
  const edges = buildEdgeFiltration(points);

  // Step 2-3: sweep edges
  for (const edge of edges) {
    if (edge.dist > maxEpsilon) break;
    const { merged, killed, survivor } = uf.union(edge.i, edge.j, edge.dist);
    if (merged) {
      const birth = uf.getBirth(killed);
      const death = edge.dist;
      const persistence = death - birth;
      finiteIntervals.push({
        birth,
        death,
        persistence,
        representativeId: points[killed].id,
      });
      // Survivor's birth = min of the two
      const sb = uf.getBirth(survivor);
      uf.setBirth(survivor, Math.min(sb, birth));
    }
  }

  return { intervals: finiteIntervals, uf };
}

// ─────────────────────────────────────────────────────────────────────────────
// PersistentHomologyChecker — main class
// ─────────────────────────────────────────────────────────────────────────────

export class PersistentHomologyChecker {
  constructor(private readonly cfg: A15CheckConfig) {}

  /**
   * Runs the A15 H_0 check on the given policy point cloud.
   *
   * The A15 invariant (Doctrine v6 §9.1 [4]) requires:
   *   "The Λ-score graph, filtered at epsilon, shall be connected (β_0 = 1)."
   *
   * Rationale: a disconnected policy space implies isolated sub-populations
   * with no transitional policy coverage — a security gap.
   *
   * Citation: this check implements the method of [1] (ELZ 2002) with the
   * noise-floor filter of [3] (Carlsson 2009 §2.3).
   */
  check(points: PolicyPoint[], threshold?: number): H0CheckResult {
    const eps = threshold ?? this.cfg.epsilon;
    const violations: string[] = [];

    if (points.length === 0) {
      return {
        componentCount: 0,
        diagram: [],
        a15Satisfied: false,
        betti0: 0,
        threshold: eps,
        violations: ["Empty point cloud — cannot verify A15 invariant"],
      };
    }

    const { intervals, uf } = computeH0(points, eps);

    // Count surviving (essential) components = β_0
    const roots = uf.components(points.length);
    const betti0 = roots.length;

    // Apply noise floor: only count "significant" finite intervals
    const significant = intervals.filter((iv) => iv.persistence >= this.cfg.minPersistence);

    // Full diagram = significant finite + essential (infinite) intervals
    const essentialIntervals: PersistenceInterval[] = roots.map((r) => ({
      birth: uf.getBirth(r),
      death: Infinity,
      persistence: Infinity,
      representativeId: points[r]?.id ?? String(r),
    }));
    const diagram = [...significant, ...essentialIntervals];

    const componentCount = betti0;

    if (componentCount > this.cfg.maxComponents) {
      violations.push(
        `β_0 = ${componentCount} exceeds A15 maximum ${this.cfg.maxComponents} at ε=${eps.toFixed(4)} ` +
        `(ELZ 2002 [doi:10.1007/s00454-002-2885-2])`
      );
    }

    return {
      componentCount,
      diagram,
      a15Satisfied: violations.length === 0,
      betti0,
      threshold: eps,
      violations,
    };
  }

  /**
   * Returns the epsilon at which the point cloud first becomes connected (β_0=1).
   * This is the "connection threshold" — useful for choosing epsilon adaptively.
   */
  connectionThreshold(points: PolicyPoint[]): number {
    if (points.length <= 1) return 0;
    const edges = buildEdgeFiltration(points);
    const n = points.length;
    const uf2 = new UnionFind(n);
    for (const edge of edges) {
      const { merged } = uf2.union(edge.i, edge.j, edge.dist);
      void merged;
      if (uf2.components(n).length === 1) return edge.dist;
    }
    return Infinity;
  }
}
