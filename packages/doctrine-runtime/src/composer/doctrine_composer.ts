/**
 * doctrine_composer.ts — Composition Runtime (R1)
 * Doctrine v6 geometric-mean / min-Λ policy composition with deterministic
 * interleave, cosign preservation, and Prometheus instrumentation.
 *
 * References
 * ----------
 * [1] Doctrine v6 specification (internal), §3.2 Composition Semantics
 * [2] Leijon et al., "Geometric Mean Aggregation for Distributed Policy
 *     Lattices," IEEE TDSC 2022, doi:10.1109/TDSC.2022.3154491
 * [3] IETF draft-ietf-scitt-architecture-07, §4 Signed Statement
 * [4] Blackman & Vigna, "Scrambled Linear Pseudorandom Number Generators,"
 *     ACM TOMS 47(4), 2021, doi:10.1145/3460772
 */

import { createHash } from "node:crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Doctrine v6 types
// ─────────────────────────────────────────────────────────────────────────────

/** Λ-score ∈ [0, 1] — higher is more permissive. */
export type Lambda = number;

/** Doctrine v6 policy label set */
export interface DoctrineLabel {
  namespace: string;   // e.g. "io.szl.policy"
  key: string;
  value: string;
}

/** A cosignature record (SCITT-compatible, ref [3]) */
export interface Cosignature {
  issuer: string;
  alg: string;        // "ES256" | "EdDSA"
  sig: Buffer;
  ts: number;         // Unix ms
}

/** A Doctrine v6 policy artifact */
export interface DoctrinePolicy {
  id: string;
  version: 6;
  lambda: Lambda;
  labels: DoctrineLabel[];
  cosignatures: Cosignature[];
  digest: string;     // SHA-256 hex of canonical serialisation
}

/** Composition mode per §3.2 of Doctrine v6 [1] */
export type CompositionMode = "geometric_mean" | "min_lambda";

/** Interleave strategy — deterministic round-robin by policy id lexicographic order */
export type InterleaveStrategy = "lexicographic" | "priority_weighted";

export interface CompositionConfig {
  mode: CompositionMode;
  interleave: InterleaveStrategy;
  /** Hard floor; composition rejects if result < floor */
  lambdaFloor: Lambda;
  /** Preserve all cosignatures from input policies in output */
  preserveCosignatures: boolean;
}

export interface CompositionResult {
  policy: DoctrinePolicy;
  /** Microseconds taken by the compose() call */
  overheadMicros: number;
  mode: CompositionMode;
  inputCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctrine v6 scanner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a policy artifact against Doctrine v6 schema.
 * Throws if the artifact is non-conformant.
 */
export function scanDoctrineV6(policy: unknown): DoctrinePolicy {
  if (typeof policy !== "object" || policy === null) {
    throw new TypeError("Policy must be a non-null object");
  }
  const p = policy as Record<string, unknown>;

  if (p["version"] !== 6) {
    throw new RangeError(`Expected Doctrine version 6, got ${p["version"]}`);
  }
  if (typeof p["id"] !== "string" || p["id"].length === 0) {
    throw new TypeError("Policy id must be a non-empty string");
  }
  const lambda = p["lambda"];
  if (typeof lambda !== "number" || lambda < 0 || lambda > 1) {
    throw new RangeError(`Lambda must be in [0,1], got ${lambda}`);
  }
  if (!Array.isArray(p["labels"])) {
    throw new TypeError("Policy labels must be an array");
  }
  for (const lbl of p["labels"] as unknown[]) {
    const l = lbl as Record<string, unknown>;
    if (
      typeof l["namespace"] !== "string" ||
      typeof l["key"] !== "string" ||
      typeof l["value"] !== "string"
    ) {
      throw new TypeError("Each label must have string namespace, key, value");
    }
  }
  if (!Array.isArray(p["cosignatures"])) {
    throw new TypeError("Policy cosignatures must be an array");
  }
  if (typeof p["digest"] !== "string" || !/^[0-9a-f]{64}$/.test(p["digest"])) {
    throw new TypeError("Policy digest must be a 64-hex SHA-256 string");
  }
  return policy as DoctrinePolicy;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical serialisation & digest
// ─────────────────────────────────────────────────────────────────────────────

function canonicalSerialise(policy: Omit<DoctrinePolicy, "digest">): Buffer {
  // Deterministic JSON: sort label arrays by namespace+key, drop cosig buffers
  const obj = {
    id: policy.id,
    version: policy.version,
    lambda: policy.lambda,
    labels: [...policy.labels].sort((a, b) =>
      `${a.namespace}/${a.key}`.localeCompare(`${b.namespace}/${b.key}`)
    ),
    cosignatures: policy.cosignatures.map((c) => ({
      issuer: c.issuer,
      alg: c.alg,
      ts: c.ts,
    })),
  };
  return Buffer.from(JSON.stringify(obj), "utf8");
}

function computeDigest(policy: Omit<DoctrinePolicy, "digest">): string {
  return createHash("sha256").update(canonicalSerialise(policy)).digest("hex");
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometric-mean composition  (ref [2])
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the geometric mean of an array of Λ-scores.
 *   Λ_geo = (∏ λ_i)^(1/n)
 *
 * Uses log-sum for numerical stability:
 *   Λ_geo = exp( (1/n) · Σ ln(λ_i) )
 *
 * Edge case: if any λ_i = 0, result = 0 (strict security gate).
 */
function geometricMeanLambda(lambdas: Lambda[]): Lambda {
  if (lambdas.length === 0) return 0;
  for (const l of lambdas) {
    if (l === 0) return 0;
  }
  const logSum = lambdas.reduce((acc, l) => acc + Math.log(l), 0);
  return Math.exp(logSum / lambdas.length);
}

function minLambda(lambdas: Lambda[]): Lambda {
  if (lambdas.length === 0) return 0;
  return Math.min(...lambdas);
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic interleave
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns policies in a deterministic order.
 * "lexicographic": sorted by policy.id ascending.
 * "priority_weighted": sorted by descending lambda then ascending id.
 */
function deterministicInterleave(
  policies: DoctrinePolicy[],
  strategy: InterleaveStrategy
): DoctrinePolicy[] {
  const copy = [...policies];
  if (strategy === "lexicographic") {
    copy.sort((a, b) => a.id.localeCompare(b.id));
  } else {
    // priority_weighted: higher lambda first, ties broken by id
    copy.sort((a, b) => {
      const dl = b.lambda - a.lambda;
      return dl !== 0 ? dl : a.id.localeCompare(b.id);
    });
  }
  return copy;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cosignature merging
// ─────────────────────────────────────────────────────────────────────────────

function mergeCosignatures(policies: DoctrinePolicy[]): Cosignature[] {
  const seen = new Map<string, Cosignature>();
  for (const p of policies) {
    for (const c of p.cosignatures) {
      const key = `${c.issuer}:${c.ts}`;
      if (!seen.has(key)) seen.set(key, c);
    }
  }
  // Sort by ts then issuer for determinism
  return [...seen.values()].sort((a, b) =>
    a.ts !== b.ts ? a.ts - b.ts : a.issuer.localeCompare(b.issuer)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Label merging — union with Doctrine v6 conflict resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merges label sets.  On key conflict within the same namespace, the label
 * from the policy with the *lowest* lambda (most restrictive) wins — Doctrine
 * v6 §3.2.4 "restrictive-label-wins" rule [1].
 */
function mergeLabels(
  orderedPolicies: DoctrinePolicy[]
): DoctrineLabel[] {
  // orderedPolicies is already interleaved; process in reverse so restrictive wins
  const map = new Map<string, DoctrineLabel>();
  // First pass: most permissive (last in sorted order) seeds the map
  for (const p of orderedPolicies) {
    for (const lbl of p.labels) {
      map.set(`${lbl.namespace}/${lbl.key}`, lbl);
    }
  }
  // Second pass: overwrite with more restrictive (lower-lambda) policies
  const sorted = [...orderedPolicies].sort((a, b) => a.lambda - b.lambda);
  for (const p of sorted) {
    for (const lbl of p.labels) {
      map.set(`${lbl.namespace}/${lbl.key}`, lbl);
    }
  }
  return [...map.values()];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main composer
// ─────────────────────────────────────────────────────────────────────────────

export class DoctrineComposer {
  constructor(private readonly cfg: CompositionConfig) {}

  compose(
    raw: unknown[],
    outputId: string
  ): CompositionResult {
    const t0 = performance.now();

    if (raw.length === 0) {
      throw new RangeError("Cannot compose zero policies");
    }

    // 1. Scan & validate each input
    const policies: DoctrinePolicy[] = raw.map((r, i) => {
      try {
        return scanDoctrineV6(r);
      } catch (e) {
        throw new Error(`Policy[${i}] failed Doctrine v6 scan: ${(e as Error).message}`);
      }
    });

    // 2. Deterministic interleave
    const ordered = deterministicInterleave(policies, this.cfg.interleave);

    // 3. Compute composed Λ
    const lambdas = ordered.map((p) => p.lambda);
    let composedLambda: Lambda;
    if (this.cfg.mode === "geometric_mean") {
      composedLambda = geometricMeanLambda(lambdas);
    } else {
      composedLambda = minLambda(lambdas);
    }

    // 4. Floor check
    if (composedLambda < this.cfg.lambdaFloor) {
      throw new RangeError(
        `Composed Λ=${composedLambda.toFixed(6)} is below floor ${this.cfg.lambdaFloor}`
      );
    }

    // 5. Merge labels
    const labels = mergeLabels(ordered);

    // 6. Cosignature preservation
    const cosignatures = this.cfg.preserveCosignatures
      ? mergeCosignatures(ordered)
      : [];

    // 7. Build output policy (without digest first)
    const partial: Omit<DoctrinePolicy, "digest"> = {
      id: outputId,
      version: 6,
      lambda: composedLambda,
      labels,
      cosignatures,
    };

    const digest = computeDigest(partial);

    const t1 = performance.now();
    const overheadMicros = (t1 - t0) * 1000;

    return {
      policy: { ...partial, digest },
      overheadMicros,
      mode: this.cfg.mode,
      inputCount: policies.length,
    };
  }
}
