/**
 * Waveform-signature routing shim.
 *
 * Source: Clark, Ernst, McGwier — *AMC via Waveform Signature*
 * (arXiv:2404.01119). Synthesis dossier row 4 / SYNTHESIS.md.
 *
 * Promotes the "signature distance as routing decision metric" result into
 * a typed Transformation primitive. Given a complex-IQ sample we compute a
 * fixed-length signature vector (cumulants of the analytic envelope and the
 * unit-circle phase distribution) and route to the nearest labelled
 * prototype under the L² metric.
 *
 * The signature is *scale-invariant by construction* (envelope is normalised
 * to unit RMS before cumulants are taken) so a candidate scaled by α > 0
 * routes to the same prototype as the unscaled candidate — the property
 * test in `waveform-signature.test.ts` exercises this.
 */

import { heCoeff3, heCoeff4, rawMoments } from './moments';

export interface ComplexSample {
  readonly i: number;
  readonly q: number;
}

/** Fixed-length waveform signature. The order is part of the contract. */
export interface WaveformSignature {
  readonly envelopeMean: number;
  readonly envelopeVar: number;
  readonly envelopeC3: number;
  readonly envelopeC4: number;
  readonly phaseR: number;        // Kuramoto-style |1/N Σ e^{iθ}|
  readonly phaseDispersion: number; // 1 − r ∈ [0, 1]
}

export const SIGNATURE_DIM = 6 as const;

function envelope(sample: readonly ComplexSample[]): number[] {
  return sample.map((z) => Math.hypot(z.i, z.q));
}

function rms(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x * x;
  return Math.sqrt(s / xs.length);
}

/**
 * Compute the signature of a complex-IQ sample. Empty input maps to the
 * zero signature so downstream nearest-neighbour search degrades gracefully.
 */
export function waveformSignature(sample: readonly ComplexSample[]): WaveformSignature {
  if (sample.length === 0) {
    return Object.freeze({
      envelopeMean: 0, envelopeVar: 0, envelopeC3: 0, envelopeC4: 0,
      phaseR: 0, phaseDispersion: 1,
    });
  }
  const env = envelope(sample);
  const norm = rms(env);
  const envN = norm > 0 ? env.map((e) => e / norm) : env.map(() => 0);
  const m = rawMoments(envN);
  const variance = m.m2 - m.m1 * m.m1;

  let sumCos = 0;
  let sumSin = 0;
  for (const z of sample) {
    const mag = Math.hypot(z.i, z.q);
    if (mag === 0) continue;
    sumCos += z.i / mag;
    sumSin += z.q / mag;
  }
  const r = Math.hypot(sumCos, sumSin) / sample.length;

  return Object.freeze({
    envelopeMean: m.m1,
    envelopeVar: variance,
    envelopeC3: heCoeff3(m),
    envelopeC4: heCoeff4(m),
    phaseR: r,
    phaseDispersion: 1 - r,
  });
}

/** L² distance between two signatures. */
export function signatureDistance(a: WaveformSignature, b: WaveformSignature): number {
  const d = [
    a.envelopeMean - b.envelopeMean,
    a.envelopeVar - b.envelopeVar,
    a.envelopeC3 - b.envelopeC3,
    a.envelopeC4 - b.envelopeC4,
    a.phaseR - b.phaseR,
    a.phaseDispersion - b.phaseDispersion,
  ];
  let s = 0;
  for (const x of d) s += x * x;
  return Math.sqrt(s);
}

export interface LabelledPrototype<L extends string = string> {
  readonly label: L;
  readonly signature: WaveformSignature;
}

export interface RoutingDecision<L extends string = string> {
  readonly label: L;
  readonly distance: number;
  readonly margin: number; // distance to runner-up minus distance to winner
}

/**
 * Nearest-prototype routing — the "decision metric" the dossier promotes.
 * Throws when no prototypes are supplied so callers cannot silently route
 * to a default class.
 */
export function routeToPrototype<L extends string>(
  signature: WaveformSignature,
  prototypes: readonly LabelledPrototype<L>[],
): RoutingDecision<L> {
  if (prototypes.length === 0) {
    throw new Error('routeToPrototype: prototypes must be non-empty');
  }
  let bestIdx = 0;
  let bestDist = signatureDistance(signature, prototypes[0]!.signature);
  let runnerUp = Infinity;
  for (let i = 1; i < prototypes.length; i++) {
    const d = signatureDistance(signature, prototypes[i]!.signature);
    if (d < bestDist) { runnerUp = bestDist; bestDist = d; bestIdx = i; }
    else if (d < runnerUp) { runnerUp = d; }
  }
  return {
    label: prototypes[bestIdx]!.label,
    distance: bestDist,
    margin: Number.isFinite(runnerUp) ? runnerUp - bestDist : Infinity,
  };
}
