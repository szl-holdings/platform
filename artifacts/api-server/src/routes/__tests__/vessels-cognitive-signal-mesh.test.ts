/**
 * /vessels/cognitive/signal-mesh/:voyageRef — server-side snapshot lock (#5563).
 *
 * Locks the shape of the dark-vessel signal-mesh endpoint that feeds both
 * the Vessels Perception Twin tab and the Vessels-Pitch DarkVesselDetection
 * slide. Without this snapshot, a future edit to VOYAGE_SNAPSHOTS or to the
 * per-category derivation rules in vessels-cognitive.ts could silently
 * change the live peak-detector ranking shown to the user.
 *
 * The peak-ranker itself is already fixture-locked at the package level
 * (packages/vessels-perception-viz/src/__tests__/peak-ranking.test.ts).
 * This spec locks the *endpoint output* that feeds it: stream IDs,
 * categories, point counts, AND the peak-detector ranking computed from
 * the real endpoint payload.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { rankSignalsByPeak } from '../../../../../packages/vessels-perception-viz/src/ranked-signal-mesh';

// Auth is `{ required: false }` on this route — pass-through is fine.
vi.mock('../../middlewares/auth', () => ({
  authMiddleware:
    () =>
    (_req: Request, _res: Response, next: NextFunction): void => {
      next();
    },
}));

let app: ReturnType<typeof express>;

beforeAll(async () => {
  const mod = await import('../vessels-cognitive');
  app = express();
  app.use(express.json());
  app.use(mod.default);
});

interface SignalSeriesPoint {
  x: number;
  intensity: number;
}
interface SignalStream {
  streamId: string;
  label: string;
  category: 'traffic' | 'risk' | 'comp' | 'port';
  units?: string;
  source: string;
  series: SignalSeriesPoint[];
}
interface SignalMeshResponse {
  voyageRef: string;
  vessel: { imo: string; name: string; flag: string };
  window: { from: string; to: string; snapshotCount: number; samplesPerStream: number };
  streams: SignalStream[];
}

describe('GET /vessels/cognitive/signal-mesh/:voyageRef', () => {
  it('returns the four canonical streams for VOY-2026-001 with locked shape', async () => {
    const res = await request(app).get('/vessels/cognitive/signal-mesh/VOY-2026-001');
    expect(res.status).toBe(200);

    const body = res.body as SignalMeshResponse;
    expect(body.voyageRef).toBe('VOY-2026-001');
    expect(body.vessel).toEqual({ imo: '9234567', name: 'Pacific Guardian', flag: 'LR' });
    expect(body.window.snapshotCount).toBe(8);
    expect(body.window.samplesPerStream).toBe(21);

    // Stream IDs, categories, and point counts are part of the contract
    // that the Perception Twin tab and Dark-Vessel slide depend on.
    expect(body.streams.map((s) => s.streamId)).toEqual([
      'ais-density',
      'sts-rendezvous',
      'sanctions-hits',
      'port-congestion',
    ]);
    expect(body.streams.map((s) => s.category)).toEqual(['traffic', 'risk', 'comp', 'port']);
    for (const s of body.streams) {
      expect(s.series).toHaveLength(21);
      expect(s.source).toBeTruthy();
      for (const p of s.series) {
        expect(typeof p.x).toBe('number');
        expect(typeof p.intensity).toBe('number');
        expect(Number.isFinite(p.intensity)).toBe(true);
      }
    }
  });

  it('aliases /latest to VOY-2026-001', async () => {
    const res = await request(app).get('/vessels/cognitive/signal-mesh/latest');
    expect(res.status).toBe(200);
    expect((res.body as SignalMeshResponse).voyageRef).toBe('VOY-2026-001');
  });

  it('locks the peak-detector ranking computed from the endpoint payload', async () => {
    // Snapshot the ranked order so any future drift in VOYAGE_SNAPSHOTS or
    // per-category derivation rules forces an explicit review. The
    // peak-ranker itself is fixture-locked separately — this lock catches
    // changes upstream of it.
    const res = await request(app).get('/vessels/cognitive/signal-mesh/VOY-2026-001');
    const body = res.body as SignalMeshResponse;

    const ranked = rankSignalsByPeak(
      body.streams.map((s) => ({
        streamId: s.streamId,
        label: s.label,
        units: s.units,
        category: s.category,
        series: s.series,
      })),
      { halfWindow: 3 },
    );

    expect(ranked.map((r) => r.streamId)).toEqual([
      'sanctions-hits',
      'sts-rendezvous',
      'port-congestion',
      'ais-density',
    ]);

    // Composite scores must remain monotonically non-increasing.
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.composite).toBeGreaterThanOrEqual(ranked[i]!.composite);
    }
  });
});
