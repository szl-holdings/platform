/**
 * Fixture-locked ranking test. Freezes the order of streams under a
 * fixed surface so the signal-mesh's ranking can never silently drift.
 * If this snapshot ever changes the new order must be reviewed —
 * peak-detector weights are versioned as receipt class
 * `peak.detection.v1`.
 */

import { describe, expect, it } from 'vitest';
import { rankSignalsByPeak, type SignalSeriesInput } from '../ranked-signal-mesh.js';

function bump(center: number, height: number, n = 21): { x: number; intensity: number }[] {
  const pts: { x: number; intensity: number }[] = [];
  for (let i = 0; i < n; i++) {
    const x = i - n / 2;
    const baseline = 1.0;
    const noise = 0.05 * Math.sin(i * 1.7);
    pts.push({ x: center + x, intensity: baseline + height * Math.exp(-(x * x) / 4) + noise });
  }
  return pts;
}

const STREAMS: readonly SignalSeriesInput[] = [
  { streamId: 'ais-density',     label: 'AIS density',     category: 'traffic', series: bump(0, 4.5) },
  { streamId: 'port-congestion', label: 'Port congestion', category: 'port',    series: bump(0, 2.2) },
  { streamId: 'sanctions-hits',  label: 'Sanctions hits',  category: 'comp',    series: bump(0, 6.1) },
  { streamId: 'sts-rendezvous',  label: 'STS rendezvous',  category: 'risk',    series: bump(0, 1.4) },
];

describe('rankSignalsByPeak — fixture lock', () => {
  const ranked = rankSignalsByPeak(STREAMS, { halfWindow: 3 });

  it('keeps every input stream that has a detectable peak', () => {
    expect(ranked.length).toBe(STREAMS.length);
  });

  it('locks the ranking order by composite score', () => {
    expect(ranked.map((r) => r.streamId)).toEqual([
      'sanctions-hits',
      'ais-density',
      'port-congestion',
      'sts-rendezvous',
    ]);
  });

  it('emits composite scores in monotonically non-increasing order', () => {
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.composite).toBeGreaterThanOrEqual(ranked[i]!.composite);
    }
  });
});
