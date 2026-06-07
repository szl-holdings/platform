/**
 * Primitive 33 — Gowers uniformity norm U^{k+1}(F_p^n).
 *
 * Source: Jamneshan, Shalom, Tao, Math. Ann. 394:11 (2026), §1.
 *   "‖f‖_{U^{k+1}(G)}^{2^{k+1}} = E_{x,h_1,...,h_{k+1}}
 *      ∏_{ω ∈ {0,1}^{k+1}} C^{|ω|} f(x + ω · ⃗h)"
 *
 * Implementation: explicit cube-product computation over F_p^n.
 * For runtime use we do this for n ≤ 14 (2^14 = 16384) and k ≤ 5; beyond that
 * we return an estimator flag rather than the exact norm. The point of the
 * primitive in our runtime is the gate (STRUCTURED vs UNIFORM), not raw
 * spectral analysis.
 */

export type DomainSpec = {
  p: number; // characteristic (we accept any small prime; the paper specialises p=2)
  n: number; // exponent: domain is F_p^n
};

export type GowersGateVerdict = "STRUCTURED" | "UNIFORM" | "ESTIMATED";

export interface GowersGateInput {
  domain: DomainSpec;
  k: number; // we compute U^{k+1}
  /** Function f: F_p^n → unit disk, length p^n, complex as [re, im] pairs. */
  values: Array<[number, number]>;
  /** Detection threshold η (Conjecture 1.1). Default 0.05. */
  eta?: number;
  /** Hard cap to switch to estimator path. */
  maxExactDomain?: number;
}

export interface GowersGateResult {
  verdict: GowersGateVerdict;
  norm: number;
  eta: number;
  reason: string;
  exact: boolean;
}

const cMul = (a: [number, number], b: [number, number]): [number, number] => [
  a[0] * b[0] - a[1] * b[1],
  a[0] * b[1] + a[1] * b[0],
];
const cConj = (a: [number, number]): [number, number] => [a[0], -a[1]];

function intToVec(idx: number, p: number, n: number): number[] {
  const v = new Array<number>(n);
  let x = idx;
  for (let i = 0; i < n; i++) {
    v[i] = x % p;
    x = Math.floor(x / p);
  }
  return v;
}
function vecToInt(v: number[], p: number): number {
  let x = 0;
  for (let i = v.length - 1; i >= 0; i--) x = x * p + v[i];
  return x;
}
function vecAddMod(a: number[], b: number[], p: number): number[] {
  const out = new Array<number>(a.length);
  for (let i = 0; i < a.length; i++) out[i] = (a[i] + b[i]) % p;
  return out;
}

export function gowersNorm(input: GowersGateInput): GowersGateResult {
  const { domain, k, values } = input;
  const eta = input.eta ?? 0.05;
  const maxExact = input.maxExactDomain ?? 4096; // |G| ≤ 4096 for full enumeration
  const G = Math.pow(domain.p, domain.n);
  if (values.length !== G) {
    throw new Error(`values length ${values.length} != p^n = ${G}.`);
  }
  if (k < 1 || !Number.isInteger(k)) throw new Error("k must be a positive integer.");
  if (G > maxExact) {
    // Estimator path: cheap proxy via mean |f|^{2^{k+1}}.
    let s = 0;
    for (const v of values) s += Math.pow(v[0] * v[0] + v[1] * v[1], Math.pow(2, k));
    const proxy = Math.pow(s / G, 1 / Math.pow(2, k + 1));
    const verdict: GowersGateVerdict = "ESTIMATED";
    return {
      verdict,
      norm: proxy,
      eta,
      reason: "Domain too large for exact enumeration; proxy used (no STRUCTURED claim emitted).",
      exact: false,
    };
  }

  const p = domain.p;
  const n = domain.n;
  const dims = k + 1;
  const cubeCount = 1 << dims; // 2^{k+1}

  // E_{x, h_1,...,h_{k+1}} ∏_ω C^{|ω|} f(x + ω·h)
  let sumRe = 0;
  let sumIm = 0;
  // We enumerate over G^{k+2}. Cap the workload.
  const total = Math.pow(G, dims + 1);
  if (total > 5_000_000) {
    return {
      verdict: "ESTIMATED",
      norm: NaN,
      eta,
      reason: `Cube enumeration ${total.toExponential(2)} exceeds 5e6; estimator path required.`,
      exact: false,
    };
  }

  // Pre-decompose indices into vectors once.
  const idxToVec: number[][] = new Array(G);
  for (let i = 0; i < G; i++) idxToVec[i] = intToVec(i, p, n);

  const enumerate = (depth: number, accum: number[][]): void => {
    if (depth === dims + 1) {
      const x = accum[0];
      // For each ω ∈ {0,1}^{dims}, build x + Σ ω_j h_j.
      let prodRe = 1,
        prodIm = 0;
      for (let omegaMask = 0; omegaMask < cubeCount; omegaMask++) {
        let pt = x.slice();
        let weight = 0;
        for (let j = 0; j < dims; j++) {
          if ((omegaMask >> j) & 1) {
            pt = vecAddMod(pt, accum[j + 1], p);
            weight += 1;
          }
        }
        const ptIdx = vecToInt(pt, p);
        let v = values[ptIdx];
        if (weight % 2 === 1) v = cConj(v);
        const m = cMul([prodRe, prodIm], v);
        prodRe = m[0];
        prodIm = m[1];
      }
      sumRe += prodRe;
      sumIm += prodIm;
      return;
    }
    for (let i = 0; i < G; i++) {
      accum[depth] = idxToVec[i];
      enumerate(depth + 1, accum);
    }
  };

  enumerate(0, new Array(dims + 1));
  const denom = Math.pow(G, dims + 1);
  const meanRe = sumRe / denom;
  // The Gowers cube average is real and non-negative; imaginary part should be ~0.
  const norm = Math.pow(Math.max(0, meanRe), 1 / cubeCount);

  const verdict: GowersGateVerdict = norm >= eta ? "STRUCTURED" : "UNIFORM";
  return {
    verdict,
    norm,
    eta,
    reason:
      verdict === "STRUCTURED"
        ? `‖f‖_{U^{${k + 1}}} = ${norm.toFixed(6)} ≥ η = ${eta}; polynomial structure asserted.`
        : `‖f‖_{U^{${k + 1}}} = ${norm.toFixed(6)} < η = ${eta}; pseudo-random.`,
    exact: true,
  };
}
