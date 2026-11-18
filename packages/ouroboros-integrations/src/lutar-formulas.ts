import {
  PHYSICAL_CONSTANTS,
  ROYAL_CUBIT_M,
  PI_RHIND,
  Q_I_INCA,
  Q_M_MAYA,
  Q_IC_ICHING,
  Q_V_VEDIC,
  Q_D_DOGON,
  Q_GT_GOBEKLI,
  E8_DIM,
  E8_TRIALITY,
  A_PLANCK,
} from "./codex-constants.js";

const { c, k_B } = PHYSICAL_CONSTANTS;
const LN2 = Math.LN2;

/** Runtime numeric domain checks; these assert no formal historical theorem. */
function finiteInputs(
  input: unknown,
  required: readonly string[],
  optional: readonly string[],
  family: string,
): void {
  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(family + ": input must be an object.");
  }
  const obj = input as Record<string, unknown>;
  for (const key of required) {
    if (typeof obj[key] !== "number" || !Number.isFinite(obj[key])) {
      throw new Error(family + ": " + key + " must be finite.");
    }
  }
  for (const key of optional) {
    const value = obj[key];
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value))) {
      throw new Error(family + ": " + key + " must be finite.");
    }
  }
}

function finiteResult(value: number, family: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(family + ": invalid numeric result or overflow.");
  }
  return value;
}

const BASE_FIELDS = ["E", "M", "I", "T"];
const BASE_WEIGHTS = ["alpha", "beta", "gamma"];
const V2_FIELDS = ["R", "Chi", "Psi", "Phi"];
const V2_WEIGHTS = ["delta", "epsilon", "zeta", "eta"];
const V4_FIELDS = ["R", "Chi", "Psi", "W", "Phi_IIT", "N_Noether"];
const V4_WEIGHTS = [
  "delta", "epsilon", "zeta", "eta", "theta", "iota",
  "kappa", "lambda", "mu", "seked",
];
const V5_WEIGHTS = ["theta_M", "theta_IC", "theta_V", "theta_D", "theta_GT"];

export interface LutarV1Input {
  E: number;
  M: number;
  I: number;
  T: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
}

export interface LutarV2Input extends LutarV1Input {
  R: number;
  Chi: number;
  Psi: number;
  Phi: number;
  delta?: number;
  epsilon?: number;
  zeta?: number;
  eta?: number;
}

export interface LutarV3Input extends LutarV2Input {
  seked?: number;
  theta?: number;
  iota?: number;
}

export interface LutarV4Input {
  E: number;
  M: number;
  I: number;
  T: number;
  R: number;
  Chi: number;
  Psi: number;
  W: number;
  Phi_IIT: number;
  N_Noether: number;
  seked?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  delta?: number;
  epsilon?: number;
  zeta?: number;
  eta?: number;
  theta?: number;
  iota?: number;
  kappa?: number;
  lambda?: number;
  mu?: number;
}

export interface LutarV5Input extends LutarV4Input {
  theta_M?: number;
  theta_IC?: number;
  theta_V?: number;
  theta_D?: number;
  theta_GT?: number;
}

export interface LutarV6Input extends LutarV5Input {
  aeon_n: number;
  Omega_n: number;
  twistor_Z: [number, number, number, number];
  bekenstein_area_m2: number;
  enforce_bekenstein?: boolean;
}

export interface LutarV6Result extends LutarResult {
  aeon: number;
  Omega_n: number;
  spacetime: [number, number, number, number];
  L5: number;
  L6: number;
  bekenstein_bound: number;
  bekenstein_ok: boolean;
}

export interface LutarResult {
  version: string;
  value: number;
  terms: Record<string, number>;
  closureSatisfied: boolean;
}

export function lutarV1(input: LutarV1Input): LutarResult {
  finiteInputs(input, BASE_FIELDS, BASE_WEIGHTS, "LutarV1");
  const alpha = input.alpha ?? 1;
  const beta = input.beta ?? 1;
  const gamma = input.gamma ?? 1;

  const energyTerm = alpha * input.E;
  const massTerm = beta * input.M * c * c;
  const infoTerm = gamma * input.I * k_B * input.T * LN2;

  const value = energyTerm + massTerm + infoTerm;

  return {
    version: "v1",
    value: finiteResult(value, "LutarV1"),
    terms: {
      "alpha*E": energyTerm,
      "beta*M*c^2": massTerm,
      "gamma*I*k_B*T*ln2": infoTerm,
    },
    closureSatisfied: true,
  };
}

export function lutarV2(input: LutarV2Input): LutarResult {
  finiteInputs(input, [...BASE_FIELDS, ...V2_FIELDS], [...BASE_WEIGHTS, ...V2_WEIGHTS], "LutarV2");
  if (!Number.isInteger(input.Phi)) {
    throw new Error("Phi (winding) must be integer.");
  }

  const alpha = input.alpha ?? 1;
  const beta = input.beta ?? 1;
  const gamma = input.gamma ?? 1;
  const delta = input.delta ?? 1;
  const epsilon = input.epsilon ?? 1;
  const zeta = input.zeta ?? 1;
  const eta = input.eta ?? 1;

  const energyTerm = alpha * input.E;
  const massTerm = beta * input.M * c * c;
  const infoTerm = gamma * input.I * k_B * input.T * LN2;
  const rahabTerm = delta * input.R;
  const templeTerm = epsilon * input.Chi;
  const priscaTerm = zeta * input.Psi;
  const windingTerm = eta * input.Phi;

  const value =
    energyTerm +
    massTerm +
    infoTerm +
    rahabTerm +
    templeTerm +
    priscaTerm +
    windingTerm;

  return {
    version: "v2",
    value: finiteResult(value, "LutarV2"),
    terms: {
      "alpha*E": energyTerm,
      "beta*M*c^2": massTerm,
      "gamma*I*k_B*T*ln2": infoTerm,
      "delta*R": rahabTerm,
      "epsilon*Chi": templeTerm,
      "zeta*Psi": priscaTerm,
      "eta*Phi": windingTerm,
    },
    closureSatisfied: Number.isInteger(input.Phi),
  };
}

export function lutarV3(input: LutarV3Input): LutarResult {
  finiteInputs(input, [], ["seked", "theta", "iota"], "LutarV3");
  const seked = input.seked ?? 1.0;
  const theta = input.theta ?? 1;
  const iota = input.iota ?? 1;

  const v2 = lutarV2(input);
  const Q_E = seked * ROYAL_CUBIT_M * PI_RHIND;
  const egyptTerm = theta * Q_E;
  const incaTerm = iota * Q_I_INCA;

  return {
    version: "v3",
    value: finiteResult(v2.value + egyptTerm + incaTerm, "LutarV3"),
    terms: {
      ...v2.terms,
      "theta*Q_E": egyptTerm,
      "iota*Q_I": incaTerm,
    },
    closureSatisfied: v2.closureSatisfied && Q_I_INCA === 8,
  };
}

export function lutarV4(input: LutarV4Input): LutarResult {
  finiteInputs(input, [...BASE_FIELDS, ...V4_FIELDS], [...BASE_WEIGHTS, ...V4_WEIGHTS], "LutarV4");
  if (!Number.isInteger(input.W)) {
    throw new Error("W (winding) must be integer.");
  }
  if (input.Phi_IIT < 0) {
    throw new Error("Phi_IIT must be non-negative.");
  }
  if (!Number.isInteger(input.N_Noether) || input.N_Noether < 0) {
    throw new Error("N_Noether must be non-negative integer.");
  }

  const alpha = input.alpha ?? 1;
  const beta = input.beta ?? 1;
  const gamma = input.gamma ?? 1;
  const delta = input.delta ?? 1;
  const epsilon = input.epsilon ?? 1;
  const zeta = input.zeta ?? 1;
  const eta = input.eta ?? 1;
  const theta = input.theta ?? 1;
  const iota = input.iota ?? 1;
  const kappa = input.kappa ?? 1;
  const lam = input.lambda ?? 1;
  const mu = input.mu ?? 1;
  const seked = input.seked ?? 1.0;

  const energyTerm = alpha * input.E;
  const massTerm = beta * input.M * c * c;
  const infoTerm = gamma * input.I * k_B * input.T * LN2;
  const rahabTerm = delta * input.R;
  const templeTerm = epsilon * input.Chi;
  const priscaTerm = zeta * input.Psi;
  const windingTerm = eta * input.W;
  const Q_E = seked * ROYAL_CUBIT_M * PI_RHIND;
  const egyptTerm = theta * Q_E;
  const incaTerm = iota * Q_I_INCA;
  const Omega_E8 = E8_DIM / E8_TRIALITY;
  const e8Term = kappa * Omega_E8;
  const iitTerm = lam * input.Phi_IIT;
  const noetherTerm = mu * input.N_Noether;

  const value =
    energyTerm +
    massTerm +
    infoTerm +
    rahabTerm +
    templeTerm +
    priscaTerm +
    windingTerm +
    egyptTerm +
    incaTerm +
    e8Term +
    iitTerm +
    noetherTerm;

  return {
    version: "v4",
    value: finiteResult(value, "LutarV4"),
    terms: {
      "alpha*E": energyTerm,
      "beta*M*c^2": massTerm,
      "gamma*I*k_B*T*ln2": infoTerm,
      "delta*R": rahabTerm,
      "epsilon*Chi": templeTerm,
      "zeta*Psi": priscaTerm,
      "eta*W": windingTerm,
      "theta*Q_E": egyptTerm,
      "iota*Q_I": incaTerm,
      "kappa*Omega_E8": e8Term,
      "lambda*Phi_IIT": iitTerm,
      "mu*N_Noether": noetherTerm,
    },
    closureSatisfied: Number.isInteger(input.W) && input.Phi_IIT >= 0,
  };
}

export function lutarV5(input: LutarV5Input): LutarResult {
  finiteInputs(input, [], V5_WEIGHTS, "LutarV5");
  const theta_M = input.theta_M ?? 1;
  const theta_IC = input.theta_IC ?? 1;
  const theta_V = input.theta_V ?? 1;
  const theta_D = input.theta_D ?? 1;
  const theta_GT = input.theta_GT ?? 1;

  const v4 = lutarV4(input);

  const mayaTerm = theta_M * Q_M_MAYA;
  const ichingTerm = theta_IC * Q_IC_ICHING;
  const vedicTerm = theta_V * Q_V_VEDIC;
  const dogonTerm = theta_D * Q_D_DOGON;
  const gobekliTerm = theta_GT * Q_GT_GOBEKLI;

  return {
    version: "v5",
    value: finiteResult(v4.value + mayaTerm + ichingTerm + vedicTerm + dogonTerm + gobekliTerm, "LutarV5"),
    terms: {
      ...v4.terms,
      "theta_M*Q_M": mayaTerm,
      "theta_IC*Q_IC": ichingTerm,
      "theta_V*Q_V": vedicTerm,
      "theta_D*Q_D": dogonTerm,
      "theta_GT*Q_GT": gobekliTerm,
    },
    closureSatisfied: v4.closureSatisfied,
  };
}

export function rhindCircleArea(d: number): number {
  return ((8.0 / 9.0) * d) ** 2;
}

export function rhindCylinderVolume(d: number, h: number): number {
  return (64.0 / 81.0) * d * d * h;
}

export function rhindTruncatedPyramid(a: number, b: number, h: number): number {
  return (h / 3.0) * (a * a + a * b + b * b);
}

/** Two different modeled ratios; neither assumes uniform historical distribution. */
export function incaHuacasPerCeque(): number {
  return Q_I_INCA; // 328 / 41 = 8, per ceque.
}

export function incaCequeHuacasPerDay(): number {
  return 328 / 365.24; // per modeled solar day, NOT per ceque.
}

export function mayaLongCount(
  b: number,
  k: number,
  t: number,
  w: number,
  d: number,
): number {
  return b * 144000 + k * 7200 + t * 360 + w * 20 + d;
}

export function mayaCalendarRound(): number {
  return 18980;
}

export function iChingIndex(yao: number[]): number {
  return yao.reduce((sum, y, i) => sum + y * 2 ** i, 0);
}

export function vedicSqrt2(): number {
  return 1 + 1 / 3 + 1 / (3 * 4) - 1 / (3 * 4 * 34);
}

export function templeChi(cubits: number, dpc: number = 1.0): number {
  return cubits * dpc;
}

export function newJerusalemVolumeKm3(): number {
  return ((12000 * 185) / 1000.0) ** 3;
}

export function ouroboros<T>(x: T, transform: (v: T) => T, n: number): T {
  let result = x;
  for (let i = 0; i < n; i++) {
    result = transform(result);
  }
  return result;
}

export function noetherClosureCheck(dL_dt: number, tol: number = 1e-9): boolean {
  return Math.abs(dL_dt) < tol;
}

export function twistorProject(Z: [number, number, number, number]): [number, number, number, number] {
  return [Z[0] + Z[2], Z[0] - Z[2], Z[1] + Z[3], Z[1] - Z[3]];
}

/**
 * DPI receipt-chain entropy bound (renamed from bekensteinBound per F1-4 errata).
 *
 * NOTE: This function uses the physical area formula (area_m2 / 4A_Planck),
 * which was historically called the "Bekenstein gate". The F1-4 errata
 * (ouroboros-thesis/CHANGELOG.md) clarify that the physical Bekenstein bound
 * (2πRE/ℏc·ln2) is NOT the bound implemented in the SZL codebase. The
 * receipt-chain DPI bound is dpiEntropyBound = sizeBytes * 8 bits
 * (Lutar/DPI/DPIBound.lean). This function is the area-parameterised gate;
 * use dpiEntropyBound (Lean-anchored) for byte-count admission.
 *
 * Mirrors (partially): Lutar.DPI.dpiAdmit (Lutar/DPI/DPIBound.lean).
 * Author: Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · Doctrine v11 LOCKED 749/14/163.
 */
export function dpiBound(area_m2: number): number {
  return area_m2 / (4.0 * A_PLANCK);
}

export function dpiCheck(S_total_nats: number, area_m2: number): { ok: boolean; bound: number } {
  const bound = dpiBound(area_m2);
  return { ok: S_total_nats <= bound, bound };
}

/** @deprecated Use dpiBound. F1-4 errata: physical Bekenstein name retracted. */
export const bekensteinBound = dpiBound;

/** @deprecated Use dpiCheck. F1-4 errata: physical Bekenstein name retracted. */
export const bekensteinCheck = dpiCheck;

export function conformalRescale(L_value: number, Omega: number): number {
  return Omega * Omega * L_value;
}

export function aeonRecurrence(L6_n: number, Omega_n: number): number {
  return conformalRescale(L6_n, Omega_n);
}

export function lutarV6(input: LutarV6Input): LutarV6Result {
  finiteInputs(input, ["aeon_n", "Omega_n", "bekenstein_area_m2"], [], "LutarV6");
  if (!Array.isArray(input.twistor_Z) || input.twistor_Z.length !== 4 ||
      input.twistor_Z.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
    throw new Error("LutarV6: twistor_Z must contain four finite numbers.");
  }
  if (input.bekenstein_area_m2 < 0 ||
      (input.enforce_bekenstein !== undefined &&
        typeof input.enforce_bekenstein !== "boolean")) {
    throw new Error("LutarV6: area or enforcement flag invalid.");
  }
  if (!Number.isInteger(input.aeon_n) || input.aeon_n < 0) {
    throw new Error("aeon_n must be non-negative integer.");
  }
  if (!Number.isFinite(input.Omega_n) || input.Omega_n <= 0) {
    throw new Error("Omega_n must be > 0.");
  }

  const spacetime = twistorProject(input.twistor_Z);
  if (spacetime.some((v) => !Number.isFinite(v))) {
    throw new Error("LutarV6: spacetime numeric overflow.");
  }
  const v5 = lutarV5(input);
  const L5_val = v5.value;
  const L6_val = finiteResult(conformalRescale(L5_val, input.Omega_n), "LutarV6");

  const enforce = input.enforce_bekenstein ?? true;
  const gamma = input.gamma ?? 1;
  const lam = input.lambda ?? 1;
  const S_total = Math.abs(gamma * input.I * k_B * input.T * LN2) + Math.abs(lam * (input.Phi_IIT ?? 0));
  finiteResult(S_total, "LutarV6");
  const bek = bekensteinCheck(S_total, input.bekenstein_area_m2);

  if (enforce && !bek.ok) {
    throw new Error(`Bekenstein violation: ${S_total} > ${bek.bound}`);
  }

  return {
    version: "v6",
    value: L6_val,
    terms: {
      ...v5.terms,
      "Omega_n^2": input.Omega_n * input.Omega_n,
      "conformal_rescale": L6_val,
    },
    closureSatisfied: v5.closureSatisfied,
    aeon: input.aeon_n,
    Omega_n: input.Omega_n,
    spacetime,
    L5: L5_val,
    L6: L6_val,
    bekenstein_bound: bek.bound,
    bekenstein_ok: bek.ok,
  };
}

export interface LutarOmegaInput {
  L_values: [number, number, number, number, number, number];
  weights?: [number, number, number, number, number, number];
}

export interface LutarOmegaResult extends LutarResult {
  L_values: number[];
  weights: number[];
  closureTheorem: string;
}

export function adaptiveWeights(H: number): [number, number, number, number, number, number] {
  if (!Number.isFinite(H)) {
    throw new Error("adaptiveWeights: H must be finite.");
  }
  // Stable softmax: subtract the maximal exponent to prevent Inf / Inf -> NaN.
  const logits = Array.from({ length: 6 }, (_, k) => (k + 1) * H);
  if (logits.some((value) => !Number.isFinite(value))) {
    throw new Error("adaptiveWeights: exponent overflow.");
  }
  const maxLogit = Math.max(...logits);
  const raw = logits.map((value) => Math.exp(value - maxLogit));
  const total = raw.reduce((a, b) => a + b, 0);
  return raw.map((value) => value / total) as [number, number, number, number, number, number];
}

export function lutarOmega(input: LutarOmegaInput): LutarOmegaResult {
  if (input == null || !Array.isArray(input.L_values)) {
    throw new Error("LutarOmega: L_values must be an array.");
  }
  const { L_values } = input;
  if (L_values.length !== 6) {
    throw new Error("L_values must have exactly 6 entries (v1..v6).");
  }

  const weights: [number, number, number, number, number, number] =
    input.weights ?? [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6];

  if (weights.length !== 6) {
    throw new Error("weights must have exactly 6 entries.");
  }
  if (L_values.some((v) => typeof v !== "number" || !Number.isFinite(v)) ||
      weights.some((w) => typeof w !== "number" || !Number.isFinite(w))) {
    throw new Error("LutarOmega: values and weights must be finite.");
  }
  if (weights.some((w) => w < 0)) {
    throw new Error("weights must be non-negative.");
  }
  const wSum = weights.reduce((a, b) => a + b, 0);
  if (Math.abs(wSum - 1.0) > 1e-9) {
    throw new Error(`weights must sum to 1 (got ${wSum}).`);
  }

  const value = finiteResult(L_values.reduce((sum, L, i) => sum + weights[i] * L, 0), "LutarOmega");

  const terms: Record<string, number> = {};
  for (let i = 0; i < 6; i++) {
    terms[`w${i + 1}*L${i + 1}`] = weights[i] * L_values[i];
  }

  return {
    version: "omega",
    value,
    terms,
    closureSatisfied: true,
    L_values: [...L_values],
    weights: [...weights],
    closureTheorem:
      "If each L_k satisfies Noether and dw_k/dt = 0, then dL_Omega/dt = 0",
  };
}

export interface EvaluateAllInput extends LutarV6Input {}

export function evaluateAll(input: EvaluateAllInput): {
  L1: number;
  L2: number;
  L3: number;
  L4: number;
  L5: number;
  L6: number;
  values: [number, number, number, number, number, number];
} {
  const r1 = lutarV1(input);
  const r2 = lutarV2({ ...input, Phi: input.W });
  const r3 = lutarV3({ ...input, Phi: input.W });
  const r4 = lutarV4(input);
  const r5 = lutarV5(input);
  const r6 = lutarV6(input);
  return {
    L1: r1.value,
    L2: r2.value,
    L3: r3.value,
    L4: r4.value,
    L5: r5.value,
    L6: r6.L6,
    values: [r1.value, r2.value, r3.value, r4.value, r5.value, r6.L6],
  };
}

export interface LutarV7Input extends LutarV6Input {
  omegaWeights?: [number, number, number, number, number, number];
  huftCoupling?: number;
}

export interface LutarV7Result extends LutarResult {
  L_Omega: number;
  L_values: number[];
  bianchiDeviation: number;
  bianchiClosed: boolean;
  fiberCurvature: number[];
  covariantDerivative: number[];
  huftCoupling: number;
  unificationStrength: number;
}

export function lutarV7(input: LutarV7Input): LutarV7Result {
  const all = evaluateAll(input);
  const L = all.values;

  const omegaResult = lutarOmega({
    L_values: L,
    weights: input.omegaWeights,
  });
  const L_Omega = omegaResult.value;

  const coupling = input.huftCoupling ?? 1.0;
  if (!Number.isFinite(coupling) || coupling <= 0) {
    throw new Error("huftCoupling must be > 0.");
  }

  const dL: number[] = [];
  for (let i = 0; i < L.length - 1; i++) {
    dL.push(L[i + 1] - L[i]);
  }

  const d2L: number[] = [];
  for (let i = 0; i < dL.length - 1; i++) {
    d2L.push(dL[i + 1] - dL[i]);
  }

  const curvatureNormSq = dL.reduce((s, d) => s + d * d, 0);
  const bianchiNormSq = d2L.reduce((s, d) => s + d * d, 0);

  const epsilon = 1e-30;
  const bianchiDeviation = finiteResult(bianchiNormSq / (curvatureNormSq + epsilon), "LutarV7");

  const L7 = finiteResult(L_Omega * Math.exp(-coupling * bianchiDeviation), "LutarV7");

  const unificationStrength = Math.exp(-coupling * bianchiDeviation);

  const terms: Record<string, number> = {
    ...omegaResult.terms,
    bianchi_deviation: bianchiDeviation,
    fiber_curvature_norm: Math.sqrt(curvatureNormSq),
    covariant_derivative_norm: Math.sqrt(bianchiNormSq),
    huft_coupling: coupling,
    unification_strength: unificationStrength,
    "exp(-kappa*B)": unificationStrength,
  };

  return {
    version: "v7",
    value: L7,
    terms,
    closureSatisfied: omegaResult.closureSatisfied && bianchiDeviation < 0.01,
    L_Omega,
    L_values: [...L],
    bianchiDeviation,
    bianchiClosed: bianchiDeviation < 0.01,
    fiberCurvature: dL,
    covariantDerivative: d2L,
    huftCoupling: coupling,
    unificationStrength,
  };
}

export function traverseCodexEdges(
  edges: readonly { from: string; to: string; type: string }[],
  start: string,
  relation?: string,
  maxDepth: number = 3,
): { from: string; to: string; type: string }[] {
  const visited = new Set<string>([start]);
  const frontier: [string, number][] = [[start, 0]];
  const path: { from: string; to: string; type: string }[] = [];

  while (frontier.length > 0) {
    const [n, d] = frontier.shift()!;
    if (d >= maxDepth) continue;
    for (const e of edges) {
      if (e.from === n && (relation === undefined || e.type === relation)) {
        path.push(e);
        if (!visited.has(e.to)) {
          visited.add(e.to);
          frontier.push([e.to, d + 1]);
        }
      }
    }
  }
  return path;
}
