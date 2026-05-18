import { useEffect, useMemo, useState } from 'react';
import { apiUrl, fetchJson } from '../cognitive/shared';

interface LiveState { live: boolean }

interface InspectorEntry {
  axis: string;
  label: string;
  current: number;
  weight: number;
  marginalLift: number;
  bindingFactor: number;
}

interface HistoryPoint {
  at: string;
  invariant: number;
  axes: Record<string, number>;
}

interface ForecastPoint {
  at: string;
  mean: number;
  low: number;
  high: number;
}

interface LutarSnapshot {
  formulaId: string;
  formulaName: string;
  generatedAt: string;
  current: {
    invariant: number;
    axes: Record<string, number>;
    at: string;
  };
  drift: {
    delta1h: number | null;
    delta24h: number | null;
    delta7d: number | null;
  };
  history: HistoryPoint[];
  forecast: {
    horizonHours: number;
    confidence: number;
    points: ForecastPoint[];
  };
  inspector: InspectorEntry[];
}

const ACCENT = '#c9b787';
const FORECAST = '#8b7ac8';
const BG = '#0f1014';
const PANEL = '#16181f';
const BORDER = '#23262f';
const FG = '#e6e7ea';
const MUTED = '#8a8f9a';
const GOOD = '#22c55e';
const BAD = '#ef4444';

function classifyDrift(d: number | null): { color: string; arrow: string; label: string } {
  if (d === null) return { color: MUTED, arrow: '·', label: '—' };
  if (Math.abs(d) < 0.001) return { color: MUTED, arrow: '→', label: 'flat' };
  if (d > 0) return { color: GOOD, arrow: '↑', label: `+${d.toFixed(4)}` };
  return { color: BAD, arrow: '↓', label: d.toFixed(4) };
}

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
}

function buildBandPath(
  top: { x: number; y: number }[],
  bot: { x: number; y: number }[],
): string {
  if (top.length === 0) return '';
  const a = top.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const b = [...bot].reverse().map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  return `${a} ${b} Z`;
}

export function LutarGauge() {
  const [snap, setSnap] = useState<LutarSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveState>({ live: false });

  // Subscribe to the SSE stream that the api-server publishes for this
  // formula. Falls back to a one-shot fetch on error so the gauge still
  // renders if EventSource is unavailable or the proxy strips streams.
  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;
    const url = apiUrl('/formulas/lutar-invariant-5/stream?window=48&forecast=12');
    const fallback = () => {
      fetchJson<LutarSnapshot>(apiUrl('/formulas/lutar-invariant-5?window=48&forecast=12'))
        .then((d) => { if (!cancelled) { setSnap(d); setError(null); } })
        .catch((e: Error) => { if (!cancelled) setError(e.message); });
    };
    try {
      es = new EventSource(url);
      es.addEventListener('snapshot', (ev: MessageEvent) => {
        if (cancelled) return;
        try {
          const parsed = JSON.parse(ev.data) as LutarSnapshot;
          setSnap(parsed);
          setError(null);
          setLive({ live: true });
        } catch (e) {
          setError((e as Error).message);
        }
      });
      es.onerror = () => {
        setLive({ live: false });
        if (!snap) fallback();
      };
    } catch {
      fallback();
    }
    return () => {
      cancelled = true;
      if (es) es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plot = useMemo(() => {
    if (!snap) return null;
    const W = 560;
    const H = 180;
    const padX = 32;
    const padY = 18;
    const innerW = W - padX * 2;
    const innerH = H - padY * 2;
    const all = [
      ...snap.history.map((p) => ({ t: new Date(p.at).getTime(), v: p.invariant })),
      ...snap.forecast.points.map((p) => ({ t: new Date(p.at).getTime(), v: p.mean })),
    ];
    if (all.length === 0) return null;
    const t0 = all[0].t;
    const t1 = all[all.length - 1].t;
    const ys = [
      ...snap.history.map((p) => p.invariant),
      ...snap.forecast.points.flatMap((p) => [p.low, p.high]),
    ];
    const yMin = Math.max(0, Math.min(...ys) - 0.02);
    const yMax = Math.min(1, Math.max(...ys) + 0.02);
    const xScale = (t: number) => padX + ((t - t0) / Math.max(1, t1 - t0)) * innerW;
    const yScale = (v: number) => padY + (1 - (v - yMin) / Math.max(1e-6, yMax - yMin)) * innerH;
    const historyPts = snap.history.map((p) => ({
      x: xScale(new Date(p.at).getTime()),
      y: yScale(p.invariant),
    }));
    const forecastMean = snap.forecast.points.map((p) => ({
      x: xScale(new Date(p.at).getTime()),
      y: yScale(p.mean),
    }));
    const forecastTop = snap.forecast.points.map((p) => ({
      x: xScale(new Date(p.at).getTime()),
      y: yScale(p.high),
    }));
    const forecastBot = snap.forecast.points.map((p) => ({
      x: xScale(new Date(p.at).getTime()),
      y: yScale(p.low),
    }));
    const splitX = forecastMean.length > 0
      ? forecastMean[0].x
      : historyPts[historyPts.length - 1]?.x ?? padX;
    return {
      W, H, padX, padY, yMin, yMax,
      historyPath: buildPath(historyPts),
      forecastPath: buildPath(forecastMean),
      bandPath: buildBandPath(forecastTop, forecastBot),
      splitX,
    };
  }, [snap]);

  if (error) {
    return (
      <div style={{ color: BAD, padding: 16, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
        Lutar gauge failed to load: {error}
      </div>
    );
  }
  if (!snap || !plot) {
    return (
      <div style={{ color: MUTED, padding: 16, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
        Loading Lutar Λ₅…
      </div>
    );
  }

  const invariantPct = (snap.current.invariant * 100).toFixed(1);
  const drift24 = classifyDrift(snap.drift.delta24h);
  const drift7 = classifyDrift(snap.drift.delta7d);

  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: 18,
        color: FG,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase' }}>
            Lutar Invariant Λ₅
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, color: ACCENT, lineHeight: 1.1, marginTop: 4 }}>
            {invariantPct}
            <span style={{ fontSize: 14, color: MUTED, marginLeft: 4 }}>/ 100</span>
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
            five-axis trust invariant · Gauß-closed
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
          <DriftBadge label="24h" {...drift24} />
          <DriftBadge label="7d" {...drift7} />
        </div>
      </div>

      <svg viewBox={`0 0 ${plot.W} ${plot.H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0.25, 0.5, 0.75].map((g) => {
          const y = plot.padY + (1 - g) * (plot.H - plot.padY * 2);
          const v = plot.yMin + g * (plot.yMax - plot.yMin);
          return (
            <g key={g}>
              <line x1={plot.padX} x2={plot.W - plot.padX} y1={y} y2={y} stroke={BORDER} strokeDasharray="2 3" />
              <text x={plot.W - plot.padX + 4} y={y + 3} fontSize="9" fill={MUTED}>
                {v.toFixed(2)}
              </text>
            </g>
          );
        })}
        <line
          x1={plot.splitX}
          x2={plot.splitX}
          y1={plot.padY}
          y2={plot.H - plot.padY}
          stroke={FORECAST}
          strokeDasharray="3 3"
          opacity={0.5}
        />
        <path d={plot.bandPath} fill={FORECAST} opacity={0.18} />
        <path d={plot.historyPath} fill="none" stroke={ACCENT} strokeWidth={1.6} />
        <path d={plot.forecastPath} fill="none" stroke={FORECAST} strokeWidth={1.6} strokeDasharray="4 3" />
        <text x={plot.splitX + 4} y={plot.padY + 10} fontSize="9" fill={FORECAST}>
          forecast →
        </text>
      </svg>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 10, letterSpacing: 1.2, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
          What would move Λ₅ — per-axis sensitivity (+0.05)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
          {snap.inspector.map((entry) => (
            <Inspector key={entry.axis} entry={entry} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: MUTED, display: 'flex', justifyContent: 'space-between' }}>
        <span>forecast band = ±1.96σ · window {snap.forecast.horizonHours}h · updated {new Date(snap.generatedAt).toLocaleTimeString()}</span>
        <span style={{ color: live.live ? GOOD : MUTED }}>
          {live.live ? '● live (SSE)' : '○ offline'}
        </span>
      </div>
    </div>
  );
}

function DriftBadge(props: { label: string; color: string; arrow: string } & { label: string }) {
  const { label, color, arrow } = props;
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ color, fontWeight: 600, fontSize: 14 }}>{arrow}</div>
    </div>
  );
}

function Inspector({ entry }: { entry: InspectorEntry }) {
  const lift = entry.marginalLift;
  const liftPct = `${lift >= 0 ? '+' : ''}${(lift * 100).toFixed(2)}%`;
  const barW = Math.min(100, Math.abs(lift) * 1500);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr 88px',
        gap: 10,
        alignItems: 'center',
        padding: '6px 8px',
        background: entry.bindingFactor >= 0.99 ? '#1a1d27' : 'transparent',
        borderLeft: `2px solid ${entry.bindingFactor >= 0.99 ? ACCENT : 'transparent'}`,
        borderRadius: 4,
      }}
    >
      <div style={{ fontSize: 11, color: FG }}>
        {entry.label}
        {entry.bindingFactor >= 0.99 && (
          <span style={{ marginLeft: 6, fontSize: 9, color: ACCENT, letterSpacing: 1 }}>BINDING</span>
        )}
      </div>
      <div style={{ background: '#0a0b10', borderRadius: 3, height: 6, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            width: `${barW}%`,
            height: '100%',
            background: lift >= 0 ? ACCENT : BAD,
            opacity: 0.7 + entry.bindingFactor * 0.3,
          }}
        />
      </div>
      <div style={{ fontSize: 11, textAlign: 'right', color: lift >= 0 ? GOOD : BAD, fontVariantNumeric: 'tabular-nums' }}>
        {liftPct}
      </div>
    </div>
  );
}

export default LutarGauge;
