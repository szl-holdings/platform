/**
 * Gauß Least-Squares Network Adjustment — Primitive 17.
 *
 * Source: Carl Friedrich Gauß, Theoria combinationis observationum
 *   erroribus minimis obnoxiae (1823); applied in the Hannoversche
 *   Landesvermessung (Gauß Nachlass, Cod. Ms. Gauß, sections
 *   "Geodäsie 165–170 — Netzausgleichungen").
 *
 *   SUB Göttingen Kalliope finding-aid: DE-611-BF-61709
 *   GND 104234644.
 *
 * Problem: an over-determined linear system A x = b has no exact solution
 * when A has more rows than columns. Gauß's least-squares method finds
 * the unique x* that minimises the residual norm
 *
 *     x* = arg min ||A x − b||²
 *
 * solving the normal equations  Aᵀ A x* = Aᵀ b. The residual norm
 * ||A x* − b|| is the closure defect of the witness network: zero
 * means the witnesses are mutually consistent up to noise; large means
 * the network is broken.
 *
 * In Ouroboros: a fleet of N witnesses each measures one or more linear
 * functionals of an unknown trust state. We solve for the maximum-
 * likelihood state (under Gaussian noise) and report the closure defect
 * as the Gauß axis G ∈ [0, 1].
 *
 * No external linear-algebra dependency. We use a Cholesky-style
 * factorisation of the normal matrix Aᵀ A; for the workloads the runtime
 * sees (≤ 32 unknowns) this is exact and stable.
 */

export interface LeastSquaresInput {
  /** Design matrix A of shape m × n with m ≥ n. Row i = witness i's linear functional. */
  readonly A: ReadonlyArray<ReadonlyArray<number>>;
  /** Observation vector b of length m. */
  readonly b: ReadonlyArray<number>;
}

export interface LeastSquaresReport {
  /** The unique minimiser x* of length n. */
  readonly solution: number[];
  /** Per-row residual r = A x* − b, length m. */
  readonly residuals: number[];
  /** ||r||_2 — the closure defect. */
  readonly residualNorm: number;
  /** ||r||_∞ — the worst single-witness residual. */
  readonly maxResidual: number;
  /** Number of witnesses (rows). */
  readonly m: number;
  /** Number of unknowns (columns). */
  readonly n: number;
  /** True iff the normal matrix was numerically positive-definite. */
  readonly normalsPositiveDefinite: boolean;
}

/**
 * Solve A x = b in the least-squares sense via the normal equations.
 *
 * Throws on degenerate input: empty matrix, ragged rows, m < n, or a
 * singular normal matrix (rank-deficient design).
 */
export function leastSquares(input: LeastSquaresInput): LeastSquaresReport {
  const A = input.A;
  const b = input.b;
  const m = A.length;
  if (m === 0) throw new Error("gauss.leastSquares: empty design matrix");
  const n = A[0]!.length;
  if (n === 0) throw new Error("gauss.leastSquares: zero columns in A");
  if (b.length !== m) throw new Error("gauss.leastSquares: b length must equal row count of A");
  if (m < n) throw new Error("gauss.leastSquares: requires m ≥ n (over-determined system)");
  for (let i = 0; i < m; i++) {
    if (A[i]!.length !== n) throw new Error(`gauss.leastSquares: row ${i} has wrong width`);
    for (const v of A[i]!) {
      if (!Number.isFinite(v)) throw new Error("gauss.leastSquares: non-finite entry in A");
    }
    if (!Number.isFinite(b[i]!)) throw new Error("gauss.leastSquares: non-finite entry in b");
  }

  // Build the normal system N = AᵀA (n×n) and rhs = Aᵀb (n).
  const N: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const rhs: number[] = Array(n).fill(0);
  for (let i = 0; i < m; i++) {
    const row = A[i]!;
    const bi = b[i]!;
    for (let j = 0; j < n; j++) {
      const aij = row[j]!;
      rhs[j]! += aij * bi;
      for (let k = j; k < n; k++) {
        N[j]![k]! += aij * row[k]!;
      }
    }
  }
  // Mirror upper to lower (N is symmetric).
  for (let j = 0; j < n; j++) {
    for (let k = 0; k < j; k++) N[j]![k] = N[k]![j]!;
  }

  // Cholesky factorisation: N = L Lᵀ.
  const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  let positiveDefinite = true;
  for (let j = 0; j < n; j++) {
    let diag = N[j]![j]!;
    for (let k = 0; k < j; k++) diag -= L[j]![k]! * L[j]![k]!;
    if (diag <= 0 || !Number.isFinite(diag)) {
      positiveDefinite = false;
      break;
    }
    L[j]![j] = Math.sqrt(diag);
    for (let i = j + 1; i < n; i++) {
      let s = N[i]![j]!;
      for (let k = 0; k < j; k++) s -= L[i]![k]! * L[j]![k]!;
      L[i]![j] = s / L[j]![j]!;
    }
  }
  if (!positiveDefinite) {
    throw new Error(
      "gauss.leastSquares: normal matrix is not positive-definite (rank-deficient design)",
    );
  }

  // Forward solve L y = rhs.
  const y: number[] = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = rhs[i]!;
    for (let k = 0; k < i; k++) s -= L[i]![k]! * y[k]!;
    y[i] = s / L[i]![i]!;
  }
  // Back solve Lᵀ x = y.
  const x: number[] = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i]!;
    for (let k = i + 1; k < n; k++) s -= L[k]![i]! * x[k]!;
    x[i] = s / L[i]![i]!;
  }

  // Residuals r = A x − b.
  const residuals: number[] = Array(m).fill(0);
  let maxR = 0;
  let sumSq = 0;
  for (let i = 0; i < m; i++) {
    let pred = 0;
    const row = A[i]!;
    for (let j = 0; j < n; j++) pred += row[j]! * x[j]!;
    const r = pred - b[i]!;
    residuals[i] = r;
    sumSq += r * r;
    const ar = Math.abs(r);
    if (ar > maxR) maxR = ar;
  }

  return {
    solution: x,
    residuals,
    residualNorm: Math.sqrt(sumSq),
    maxResidual: maxR,
    m,
    n,
    normalsPositiveDefinite: true,
  };
}

/**
 * Reduce a least-squares report to the Gauß closure axis G ∈ [0, 1].
 *
 *   G = exp(−||r||₂² / (m · σ²))
 *
 * where σ is the operator-supplied noise scale. Defaults σ = 1, which
 * gives G = 1 only for a perfectly closed network (zero residuals) and
 * decays smoothly. The exponential form keeps G in (0, 1]. A diverging
 * residual norm pushes G → 0; a perfectly closed network has G = 1.
 */
export function gaussClosureAxis(
  report: LeastSquaresReport,
  noiseSigma = 1,
): number {
  if (!Number.isFinite(noiseSigma) || noiseSigma <= 0) {
    throw new Error("gaussClosureAxis: noiseSigma must be a positive finite number");
  }
  if (report.m === 0) return 1;
  const meanSq = (report.residualNorm * report.residualNorm) / report.m;
  const value = Math.exp(-meanSq / (noiseSigma * noiseSigma));
  return Math.max(0, Math.min(1, value));
}
