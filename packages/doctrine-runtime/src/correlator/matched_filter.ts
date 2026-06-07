/**
 * matched_filter.ts — runtime counterpart of
 * Lutar/Correlator/MatchedFilter.lean.
 *
 * The matched filter is the maximum-SNR optimal linear detector in
 * additive white Gaussian noise.  It is the operational engine of
 * Shannon's noisy-channel coding theorem and the canonical correlator
 * pattern shared by:
 *   • Bell Labs 1950s 300-baud modem receivers (Shannon's IRE peers).
 *   • P300 brain-computer interface spellers (Farwell-Donchin 1988).
 *   • CASPER-class radio astronomy correlation pipelines.
 *
 * Citations:
 *   • North 1943 (RCA PTR-6C; reprinted Proc. IEEE 51:1016
 *     DOI 10.1109/PROC.1963.2383)
 *   • Bode-Shannon 1950, Proc. IRE 38:417 DOI 10.1109/JRPROC.1950.231821
 *   • Farwell-Donchin 1988, EEG Clin. Neurophysiol. 70:510
 *     DOI 10.1016/0013-4694(88)90149-6
 *   • Fazel-Rezai et al. 2012, Front. Neuroeng. 5:14
 *     DOI 10.3389/fneng.2012.00014
 *
 * Innovation beyond attribution: the matched filter is named here as
 * the operational engine of the audit-closure operator over receipt
 * templates — no AI-doctrine prior art for this framing.
 */

export type Signal = readonly number[];

/** Discrete-time correlation: dot product of two equal-length signals. */
export function correlate(template: Signal, received: Signal): number {
  const n = Math.min(template.length, received.length);
  if (template.length !== received.length) return 0;
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += template[i] * received[i];
  return sum;
}

/** Self-correlation = signal energy. */
export function energy(s: Signal): number {
  return correlate(s, s);
}

/** Threshold detection over the correlation output. */
export function detect(template: Signal, received: Signal, threshold: number): boolean {
  return correlate(template, received) >= threshold;
}

/** SNR in decibels: 10·log10(P_signal / P_noise). */
export function snrDb(signalPower: number, noisePower: number): number {
  if (noisePower <= 0) throw new Error('snrDb: noisePower must be > 0');
  return 10 * Math.log10(signalPower / noisePower);
}

/** Canonical doctrine template: 4 alternating ±1 samples. */
export const DOCTRINE_TEMPLATE: Signal = [1, -1, 1, -1];
