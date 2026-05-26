import { describe, expect, it } from 'vitest';
import {
  routeToPrototype,
  signatureDistance,
  waveformSignature,
  type ComplexSample,
  type LabelledPrototype,
} from '../waveform-signature';

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function syntheticSample(
  kind: 'qam' | 'fsk',
  n: number,
  rng: () => number,
): ComplexSample[] {
  const out: ComplexSample[] = [];
  for (let k = 0; k < n; k++) {
    if (kind === 'qam') {
      const lvl = [-1, -1 / 3, 1 / 3, 1];
      const i = lvl[Math.floor(rng() * 4)]!;
      const q = lvl[Math.floor(rng() * 4)]!;
      out.push({ i, q });
    } else {
      const f = rng() < 0.5 ? 0.1 : 0.3;
      const phi = 2 * Math.PI * f * k;
      out.push({ i: Math.cos(phi), q: Math.sin(phi) });
    }
  }
  return out;
}

describe('waveform signature (Clark–Ernst–McGwier)', () => {
  it('signature is scale-invariant: αx routes the same as x for α > 0', () => {
    const rng = mulberry32(0xC1A1);
    const proto: LabelledPrototype<'qam' | 'fsk'>[] = [
      { label: 'qam', signature: waveformSignature(syntheticSample('qam', 512, mulberry32(1))) },
      { label: 'fsk', signature: waveformSignature(syntheticSample('fsk', 512, mulberry32(2))) },
    ];
    for (let trial = 0; trial < 50; trial++) {
      const kind = rng() < 0.5 ? 'qam' : 'fsk';
      const x = syntheticSample(kind, 256, mulberry32(trial + 100));
      const alpha = 0.1 + rng() * 5;
      const xScaled = x.map((z) => ({ i: alpha * z.i, q: alpha * z.q }));
      const decA = routeToPrototype(waveformSignature(x), proto);
      const decB = routeToPrototype(waveformSignature(xScaled), proto);
      expect(decA.label).toBe(decB.label);
    }
  });

  it('signatureDistance is a metric (zero on equal, symmetric, triangle)', () => {
    const a = waveformSignature(syntheticSample('qam', 200, mulberry32(11)));
    const b = waveformSignature(syntheticSample('fsk', 200, mulberry32(12)));
    const c = waveformSignature(syntheticSample('qam', 200, mulberry32(13)));
    expect(signatureDistance(a, a)).toBeCloseTo(0, 12);
    expect(signatureDistance(a, b)).toBeCloseTo(signatureDistance(b, a), 12);
    const ab = signatureDistance(a, b);
    const bc = signatureDistance(b, c);
    const ac = signatureDistance(a, c);
    expect(ac).toBeLessThanOrEqual(ab + bc + 1e-9);
  });

  it('routes to the correct labelled prototype for a clearly-separated pair', () => {
    const qamProto = waveformSignature(syntheticSample('qam', 1024, mulberry32(20)));
    const fskProto = waveformSignature(syntheticSample('fsk', 1024, mulberry32(21)));
    const prototypes: LabelledPrototype[] = [
      { label: 'qam', signature: qamProto },
      { label: 'fsk', signature: fskProto },
    ];
    const candidateQam = waveformSignature(syntheticSample('qam', 256, mulberry32(30)));
    const candidateFsk = waveformSignature(syntheticSample('fsk', 256, mulberry32(31)));
    expect(routeToPrototype(candidateQam, prototypes).label).toBe('qam');
    expect(routeToPrototype(candidateFsk, prototypes).label).toBe('fsk');
  });

  it('throws if no prototypes are supplied (no silent default class)', () => {
    const sig = waveformSignature(syntheticSample('qam', 32, mulberry32(99)));
    expect(() => routeToPrototype(sig, [])).toThrow();
  });
});
