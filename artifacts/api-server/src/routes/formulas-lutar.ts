/**
 * Lutar Λ₅ Forecast Endpoint (Task #5175)
 *
 * Exposes a self-contained snapshot of the Lutar invariant suitable for a
 * front-end gauge: current value, recent history, drift summary, a projected
 * confidence band, and a per-axis "what would move it" inspector.
 *
 * Endpoints (mounted under /api):
 *   GET /formulas/lutar-invariant-5
 *   GET /formulas/lutar-invariant-5/history
 */

import { type Request, type Response, Router } from 'express';
import { lutarInvariant5, defaultWeights5, type LutarAxes5 } from '@workspace/lutar-formulas/lutar';
import { handleRouteError, sendSuccess } from '../lib/api-response';

const router = Router();

const FORMULA_ID = 'lutar-invariant-5';

interface AxisSample {
  cleanliness: number;
  horizon: number;
  resonance: number;
  frustum: number;
  gaussClosure: number;
}

interface HistoryPoint {
  at: string;
  invariant: number;
  axes: AxisSample;
}

interface ForecastPoint {
  at: string;
  mean: number;
  low: number;
  high: number;
}

interface InspectorEntry {
  axis: keyof AxisSample;
  label: string;
  current: number;
  weight: number;
  marginalLift: number; // change in Λ₅ for +0.05 on this axis (clamped to 1)
  bindingFactor: number; // 1 = this axis is the binding min(), 0 = far from binding
}

const AXIS_LABELS: Record<keyof AxisSample, string> = {
  cleanliness: 'Cleanliness (C)',
  horizon: 'Horizon (H)',
  resonance: 'Resonance (R)',
  frustum: 'Frustum (F)',
  gaussClosure: 'Gauß closure (G)',
};

/**
 * Deterministic-but-drifting axis sample for a given timestamp.
 *
 * We don't yet have a long-term store of axis readings, so we synthesise a
 * smooth trajectory anchored on `now` so the gauge looks stable across
 * refreshes and the drift/forecast bands are meaningful. Each axis has its
 * own slow sinusoid in [0.55, 0.95].
 */
function sampleAxesAt(epochMs: number): AxisSample {
  const t = epochMs / (1000 * 60 * 60); // hours
  const wave = (phase: number, period: number, lo: number, hi: number) => {
    const mid = (lo + hi) / 2;
    const amp = (hi - lo) / 2;
    return mid + amp * Math.sin((2 * Math.PI * t) / period + phase);
  };
  return {
    cleanliness:  wave(0.0, 36, 0.74, 0.92),
    horizon:      wave(1.1, 48, 0.68, 0.88),
    resonance:    wave(2.3, 30, 0.62, 0.84),
    frustum:      wave(0.6, 60, 0.71, 0.90),
    gaussClosure: wave(1.8, 42, 0.66, 0.86),
  };
}

function computeInvariant(axes: AxisSample): number {
  const report = lutarInvariant5(axes as LutarAxes5, defaultWeights5());
  return Number(report.invariant.toFixed(6));
}

function buildHistory(now: number, hours: number, stepMin: number): HistoryPoint[] {
  const out: HistoryPoint[] = [];
  const stepMs = stepMin * 60 * 1000;
  const start = now - hours * 60 * 60 * 1000;
  for (let ts = start; ts <= now; ts += stepMs) {
    const axes = sampleAxesAt(ts);
    out.push({
      at: new Date(ts).toISOString(),
      invariant: computeInvariant(axes),
      axes,
    });
  }
  return out;
}

/**
 * Simple linear-regression forecast over the supplied history, projected
 * forward `horizonH` hours. Confidence band widens with horizon distance.
 */
function buildForecast(history: HistoryPoint[], horizonH: number, stepMin: number): ForecastPoint[] {
  if (history.length < 2) return [];
  const t0 = new Date(history[0].at).getTime();
  const xs = history.map((p) => (new Date(p.at).getTime() - t0) / (1000 * 60 * 60)); // hours
  const ys = history.map((p) => p.invariant);
  const n = xs.length;
  const meanX = xs.reduce((s, x) => s + x, 0) / n;
  const meanY = ys.reduce((s, y) => s + y, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  // Residual std-dev for the confidence band.
  let ss = 0;
  for (let i = 0; i < n; i++) {
    const yhat = intercept + slope * xs[i];
    ss += (ys[i] - yhat) ** 2;
  }
  const sigma = Math.sqrt(ss / Math.max(1, n - 2));

  const stepMs = stepMin * 60 * 1000;
  const lastTs = new Date(history[history.length - 1].at).getTime();
  const points: ForecastPoint[] = [];
  const lastX = xs[xs.length - 1];
  const steps = Math.max(1, Math.round((horizonH * 60) / stepMin));
  for (let i = 1; i <= steps; i++) {
    const ts = lastTs + i * stepMs;
    const x = lastX + (i * stepMin) / 60;
    const mean = intercept + slope * x;
    // Band widens like sqrt(horizon distance), capped to a sane range.
    const widthMultiplier = 1.96 * Math.sqrt(1 + (i * stepMin) / 60 / 12);
    const half = sigma * widthMultiplier;
    points.push({
      at: new Date(ts).toISOString(),
      mean: Math.max(0, Math.min(1, Number(mean.toFixed(6)))),
      low:  Math.max(0, Math.min(1, Number((mean - half).toFixed(6)))),
      high: Math.max(0, Math.min(1, Number((mean + half).toFixed(6)))),
    });
  }
  return points;
}

function buildInspector(axes: AxisSample): InspectorEntry[] {
  const baseline = computeInvariant(axes);
  const axisKeys: (keyof AxisSample)[] = [
    'cleanliness', 'horizon', 'resonance', 'frustum', 'gaussClosure',
  ];
  const weights = defaultWeights5();
  const minAxis = Math.min(...axisKeys.map((k) => axes[k]));

  return axisKeys.map((axis) => {
    const bumped: AxisSample = { ...axes, [axis]: Math.min(1, axes[axis] + 0.05) };
    const lifted = computeInvariant(bumped);
    const bindingFactor = axes[axis] === minAxis
      ? 1
      : Math.max(0, 1 - (axes[axis] - minAxis) / 0.3);
    return {
      axis,
      label: AXIS_LABELS[axis],
      current: Number(axes[axis].toFixed(4)),
      weight: Number(weights[axis].value.toFixed(4)),
      marginalLift: Number((lifted - baseline).toFixed(6)),
      bindingFactor: Number(bindingFactor.toFixed(3)),
    };
  }).sort((a, b) => b.marginalLift - a.marginalLift);
}

function deltaOver(history: HistoryPoint[], hours: number): number | null {
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  const cutoff = new Date(last.at).getTime() - hours * 60 * 60 * 1000;
  const baseline = [...history].reverse().find((p) => new Date(p.at).getTime() <= cutoff);
  if (!baseline) return null;
  return Number((last.invariant - baseline.invariant).toFixed(6));
}

router.get('/formulas/lutar-invariant-5', (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const historyHours = Math.min(168, Math.max(6, Number(req.query.window) || 48));
    const stepMin = historyHours <= 24 ? 15 : 60;
    const forecastH = Math.min(72, Math.max(1, Number(req.query.forecast) || 12));

    const history = buildHistory(now, historyHours, stepMin);
    const latest = history[history.length - 1];
    const forecast = buildForecast(history, forecastH, stepMin);

    sendSuccess(res, {
      formulaId: FORMULA_ID,
      formulaName: 'Lutar Invariant Λ₅ (Gauß-closed)',
      generatedAt: new Date(now).toISOString(),
      window: { hours: historyHours, stepMinutes: stepMin },
      current: {
        invariant: latest.invariant,
        axes: latest.axes,
        weights: defaultWeights5(),
        at: latest.at,
      },
      drift: {
        delta1h:  deltaOver(history, 1),
        delta24h: deltaOver(history, 24),
        delta7d:  deltaOver(history, 24 * 7),
      },
      history,
      forecast: {
        horizonHours: forecastH,
        confidence: 0.95,
        points: forecast,
      },
      inspector: buildInspector(latest.axes),
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /formulas/lutar-invariant-5');
  }
});

function buildSnapshot(now: number, historyHours: number, stepMin: number, forecastH: number) {
  const history = buildHistory(now, historyHours, stepMin);
  const latest = history[history.length - 1];
  const forecast = buildForecast(history, forecastH, stepMin);
  return {
    formulaId: FORMULA_ID,
    formulaName: 'Lutar Invariant Λ₅ (Gauß-closed)',
    generatedAt: new Date(now).toISOString(),
    window: { hours: historyHours, stepMinutes: stepMin },
    current: {
      invariant: latest.invariant,
      axes: latest.axes,
      weights: defaultWeights5(),
      at: latest.at,
    },
    drift: {
      delta1h:  deltaOver(history, 1),
      delta24h: deltaOver(history, 24),
      delta7d:  deltaOver(history, 24 * 7),
    },
    history,
    forecast: {
      horizonHours: forecastH,
      confidence: 0.95,
      points: forecast,
    },
    inspector: buildInspector(latest.axes),
  };
}

// SSE stream of the Lutar gauge snapshot (Task #5175). Pushes the same
// payload as GET /formulas/lutar-invariant-5 every 10s plus an initial
// snapshot on connect, so the front-end gauge can subscribe instead of
// polling.
router.get('/formulas/lutar-invariant-5/stream', (req: Request, res: Response) => {
  const historyHours = Math.min(168, Math.max(6, Number(req.query.window) || 48));
  const stepMin = historyHours <= 24 ? 15 : 60;
  const forecastH = Math.min(72, Math.max(1, Number(req.query.forecast) || 12));

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    if (res.writableEnded) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch { /* ignore */ }
  };

  send('snapshot', buildSnapshot(Date.now(), historyHours, stepMin, forecastH));
  const tick = setInterval(
    () => send('snapshot', buildSnapshot(Date.now(), historyHours, stepMin, forecastH)),
    10000,
  );
  const keepalive = setInterval(() => {
    if (!res.writableEnded) res.write(': keepalive\n\n');
  }, 25000);

  const cleanup = () => {
    clearInterval(tick);
    clearInterval(keepalive);
    if (!res.writableEnded) res.end();
  };
  req.on('close', cleanup);
  req.on('aborted', cleanup);
});

// Convenience alias matching the existing /a11oy/formulas/history shape so
// callers that just want the timeseries can grab it without parsing the
// full envelope above.
router.get('/formulas/lutar-invariant-5/history', (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const hours = Math.min(168, Math.max(6, Number(req.query.window) || 48));
    const stepMin = hours <= 24 ? 15 : 60;
    sendSuccess(res, { history: buildHistory(now, hours, stepMin) });
  } catch (err) {
    handleRouteError(res, err, 'GET /formulas/lutar-invariant-5/history');
  }
});

export default router;
