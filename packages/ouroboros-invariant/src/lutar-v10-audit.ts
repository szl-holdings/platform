/**
 * Lutar v10 — The Audit Closure Operator Λ₁₀.
 *
 * v10 of the Ouroboros thesis chain promotes the v1..v9 convention from
 * a guideline into a contract. For each layer L_k in the Lutar family,
 * define an indicator product over six artefact dimensions:
 *
 *     A_k = L_k · ∏_{j∈J} 𝟙[j_k]
 *
 * where J = { CODE, CODEX, API, TEST, THESIS, SURFACE }:
 *
 *   CODE     — an exported function in @workspace/ouroboros-invariant
 *   CODEX    — a typed knowledge-graph node in the Supreme Codex
 *   API      — a POST /api/ouroboros/lutar/v{k} route on the LaaS API
 *   TEST     — a contract test in the lutar-invariant test suite
 *   THESIS   — a section in the canonical thesis document
 *   SURFACE  — a row in the A11oy `/thesis` page's FORMULA_ROWS
 *
 * The Audit Closure Operator is
 *
 *     Λ₁₀ = Σ_k A_k
 *
 * and the **closure ratio** is
 *
 *     ρ = Λ₁₀ / Σ_k L_k.
 *
 * **Closure theorem.** ρ = 1 iff every M_{k,j} = 1 (the artefact matrix
 * has no zero cell). Proof: A_k = L_k · ∏_j M_{k,j}. If every M_{k,j} = 1
 * then ∏ = 1 and A_k = L_k, hence Σ A_k = Σ L_k and ρ = 1. Conversely,
 * if any M_{k,j} = 0 then for that k, ∏ = 0 so A_k = 0 < L_k (assuming
 * L_k > 0), making Σ A_k < Σ L_k and ρ < 1. ∎
 *
 * The function returns the broken (k, j) pairs as a `missingArtifacts`
 * array, so a failing audit names its own remediation.
 *
 * This file is the runtime referent for v10 of the Ouroboros thesis.
 */

export type ArtifactDimension =
  | "CODE"
  | "CODEX"
  | "API"
  | "TEST"
  | "THESIS"
  | "SURFACE";

export const ARTIFACT_DIMENSIONS: readonly ArtifactDimension[] = [
  "CODE",
  "CODEX",
  "API",
  "TEST",
  "THESIS",
  "SURFACE",
] as const;

/**
 * One layer's row in the artefact matrix M.
 *
 * `layer` is the layer name (e.g. "v1", "v2", ..., "omega").
 * `lambdaValue` is L_k — the value of the underlying Lutar invariant at
 * that layer for some reference axis tuple (typically all-ones, which
 * gives L_k = 1 for every k, so Λ₁₀ becomes a pure layer count).
 * `artifacts` is the indicator vector — a record from each dimension
 * to {0, 1} or boolean.
 */
export interface LutarLayerArtifacts {
  readonly layer: string;
  readonly lambdaValue: number;
  readonly artifacts: Readonly<Record<ArtifactDimension, boolean>>;
}

export interface MissingArtifact {
  readonly layer: string;
  readonly dimension: ArtifactDimension;
}

export interface LutarV10AuditReport {
  /** Λ₁₀ = Σ A_k (sum of audited layer values). */
  readonly lambda10: number;
  /** Σ L_k (sum of underlying layer values). */
  readonly lambdaSum: number;
  /** Closure ratio ρ = Λ₁₀ / Σ L_k ∈ [0, 1]. */
  readonly rho: number;
  /** True iff every artefact present (ρ = 1 within float tolerance). */
  readonly auditClosed: boolean;
  /** All (layer, dimension) cells where M_{k,j} = 0. */
  readonly missingArtifacts: readonly MissingArtifact[];
  /** Per-layer contributions A_k = L_k · ∏_j 𝟙[j_k]. */
  readonly perLayerA: ReadonlyArray<{ layer: string; A: number; complete: boolean }>;
  /** Echo of input artefact matrix for audit trails. */
  readonly matrix: readonly LutarLayerArtifacts[];
}

/**
 * Compute the Audit Closure Operator Λ₁₀ over a Lutar family artefact
 * matrix.
 *
 * Throws if any lambdaValue is non-finite or negative, or if any layer
 * is missing one of the six required dimension keys.
 */
export function lutarV10Audit(
  matrix: readonly LutarLayerArtifacts[]
): LutarV10AuditReport {
  if (matrix.length === 0) {
    throw new Error("lutarV10Audit: matrix must contain at least one layer");
  }

  // Validate
  for (const row of matrix) {
    if (!Number.isFinite(row.lambdaValue) || row.lambdaValue < 0) {
      throw new Error(
        `lutarV10Audit: layer ${row.layer} lambdaValue=${row.lambdaValue} must be finite and ≥ 0`
      );
    }
    for (const dim of ARTIFACT_DIMENSIONS) {
      if (!(dim in row.artifacts)) {
        throw new Error(
          `lutarV10Audit: layer ${row.layer} is missing dimension ${dim}`
        );
      }
    }
  }

  // Compute per-layer A_k and collect missing cells
  let lambda10 = 0;
  let lambdaSum = 0;
  const missing: MissingArtifact[] = [];
  const perLayerA: Array<{ layer: string; A: number; complete: boolean }> = [];

  for (const row of matrix) {
    lambdaSum += row.lambdaValue;
    let product = 1;
    for (const dim of ARTIFACT_DIMENSIONS) {
      const present = row.artifacts[dim] === true;
      if (!present) {
        product = 0;
        missing.push({ layer: row.layer, dimension: dim });
      }
    }
    const A = row.lambdaValue * product;
    lambda10 += A;
    perLayerA.push({ layer: row.layer, A, complete: product === 1 });
  }

  const rho = lambdaSum > 0 ? lambda10 / lambdaSum : 0;
  const eps = 1e-12;
  const auditClosed = Math.abs(rho - 1) < eps && missing.length === 0;

  return {
    lambda10,
    lambdaSum,
    rho,
    auditClosed,
    missingArtifacts: missing,
    perLayerA,
    matrix,
  };
}

/**
 * Helper: build an all-present artefact row (all six dimensions = true).
 */
export function fullArtifactRow(
  layer: string,
  lambdaValue = 1
): LutarLayerArtifacts {
  return {
    layer,
    lambdaValue,
    artifacts: {
      CODE: true,
      CODEX: true,
      API: true,
      TEST: true,
      THESIS: true,
      SURFACE: true,
    },
  };
}

/**
 * Helper: build an artefact row with some dimensions missing.
 */
export function partialArtifactRow(
  layer: string,
  present: Partial<Record<ArtifactDimension, boolean>>,
  lambdaValue = 1
): LutarLayerArtifacts {
  const artifacts: Record<ArtifactDimension, boolean> = {
    CODE: false,
    CODEX: false,
    API: false,
    TEST: false,
    THESIS: false,
    SURFACE: false,
  };
  for (const dim of ARTIFACT_DIMENSIONS) {
    artifacts[dim] = present[dim] === true;
  }
  return { layer, lambdaValue, artifacts };
}
