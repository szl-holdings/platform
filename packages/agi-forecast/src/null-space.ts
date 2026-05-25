/**
 * Null-space projection shim.
 *
 * Formal counterpart: `packages/lean-formulas/Connection/NullSpace.lean`,
 * theorem `null_space_coexistence` (Sodagari–Khawar–Clancy–McGwier,
 * Globecom 2012).
 *
 * Given a channel matrix `A ∈ ℝ^{m×n}` and a candidate signal `v ∈ ℝ^n`,
 * `projectOntoNullSpace(A, v)` returns `P v`, where `P` is the orthogonal
 * projector onto `ker A`. The Lean post-condition is `A (P v) = 0`; the
 * Vitest property test exercises this numerically.
 *
 * Implementation: `P = I − A⁺ A`, where `A⁺` is the Moore–Penrose
 * pseudo-inverse computed by reducing `A` to row-echelon form. For the
 * platform's small (≤ 64-dimensional) coexistence matrices this is more than
 * fast enough; an SVD-based replacement is filed as a follow-up.
 */

export type Matrix = readonly (readonly number[])[];
export type Vector = readonly number[];

const EPS = 1e-10;

function matVec(A: Matrix, v: Vector): number[] {
  const m = A.length;
  if (m === 0) return [];
  const out = new Array<number>(m).fill(0);
  for (let i = 0; i < m; i++) {
    const row = A[i]!;
    let s = 0;
    for (let j = 0; j < row.length; j++) s += row[j]! * v[j]!;
    out[i] = s;
  }
  return out;
}

/**
 * Reduced row-echelon form. Returns the pivot column indices in row order.
 * Mutates `M` in place.
 */
function rrefInPlace(M: number[][]): number[] {
  const rows = M.length;
  if (rows === 0) return [];
  const cols = M[0]!.length;
  const pivots: number[] = [];
  let r = 0;
  for (let c = 0; c < cols && r < rows; c++) {
    let piv = r;
    let pivAbs = Math.abs(M[r]![c]!);
    for (let i = r + 1; i < rows; i++) {
      const a = Math.abs(M[i]![c]!);
      if (a > pivAbs) { pivAbs = a; piv = i; }
    }
    if (pivAbs < EPS) continue;
    if (piv !== r) {
      const tmp = M[r]!; M[r] = M[piv]!; M[piv] = tmp;
    }
    const pv = M[r]![c]!;
    for (let j = c; j < cols; j++) M[r]![j] = M[r]![j]! / pv;
    for (let i = 0; i < rows; i++) {
      if (i === r) continue;
      const f = M[i]![c]!;
      if (Math.abs(f) < EPS) continue;
      for (let j = c; j < cols; j++) M[i]![j] = M[i]![j]! - f * M[r]![j]!;
    }
    pivots.push(c);
    r++;
  }
  return pivots;
}

/**
 * Orthonormal basis for the null-space of `A`, returned as a list of column
 * vectors. Uses Gram–Schmidt on the free-column basis from RREF.
 */
export function nullSpaceBasis(A: Matrix): number[][] {
  const m = A.length;
  if (m === 0) return [];
  const n = A[0]!.length;
  const M: number[][] = A.map((row) => [...row]);
  const pivots = new Set(rrefInPlace(M));
  const free: number[] = [];
  for (let c = 0; c < n; c++) if (!pivots.has(c)) free.push(c);

  const basis: number[][] = [];
  for (const f of free) {
    const v = new Array<number>(n).fill(0);
    v[f] = 1;
    // Pivot rows in M now express pivot column in terms of free columns.
    let pivotRow = 0;
    for (let c = 0; c < n && pivotRow < M.length; c++) {
      if (pivots.has(c)) {
        v[c] = -M[pivotRow]![f]!;
        pivotRow++;
      }
    }
    basis.push(v);
  }

  // Gram–Schmidt orthonormalise.
  const ortho: number[][] = [];
  for (const v of basis) {
    const u = [...v];
    for (const w of ortho) {
      let dot = 0;
      for (let i = 0; i < n; i++) dot += u[i]! * w[i]!;
      for (let i = 0; i < n; i++) u[i] = u[i]! - dot * w[i]!;
    }
    let norm = 0;
    for (let i = 0; i < n; i++) norm += u[i]! * u[i]!;
    norm = Math.sqrt(norm);
    if (norm < EPS) continue;
    for (let i = 0; i < n; i++) u[i] = u[i]! / norm;
    ortho.push(u);
  }
  return ortho;
}

/**
 * Project `v` onto `ker A`. Returns `P v` such that `A (P v) ≈ 0` within
 * numerical tolerance — the post-condition formalised by
 * `Connection/NullSpace.lean`.
 */
export function projectOntoNullSpace(A: Matrix, v: Vector): number[] {
  const basis = nullSpaceBasis(A);
  const n = v.length;
  const out = new Array<number>(n).fill(0);
  for (const w of basis) {
    let dot = 0;
    for (let i = 0; i < n; i++) dot += v[i]! * w[i]!;
    for (let i = 0; i < n; i++) out[i] += dot * w[i]!;
  }
  return out;
}

/** Residual `‖A (P v)‖₂`; should be ≈ 0. */
export function projectionResidual(A: Matrix, v: Vector): number {
  const Pv = projectOntoNullSpace(A, v);
  const r = matVec(A, Pv);
  let s = 0;
  for (const x of r) s += x * x;
  return Math.sqrt(s);
}
