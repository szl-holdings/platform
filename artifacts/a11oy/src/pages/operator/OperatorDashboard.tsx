import { useEffect, useState } from 'react';
import { apiUrl, fetchJson } from '../cognitive/shared';
import { LutarGauge } from './LutarGauge';

interface WorkcellPhaseCount {
  phase: string;
  open: number;
  paused: number;
  blocked: number;
}

interface EvalRegression {
  suiteId: string;
  severity: 'minor' | 'major' | 'critical';
  delta: number;
  baselineAvgScore: number;
  latestAvgScore: number;
  detectedAt: string;
}

interface BomAttestationEntry {
  agentId: string;
  agentName: string;
  modelSnapshot: string;
  attestedAt: string;
  verified: boolean;
  diffFromPrior: number;
}

interface PatternMaturityChange {
  patternId: string;
  patternName: string;
  fromStage: string;
  toStage: string;
  usageCount: number;
  changedAt: string;
}

interface SignalVolumeBucket {
  at: string;
  total: number;
  byVertical: Record<string, number>;
}

interface OperatorSnapshot {
  generatedAt: string;
  workcells: {
    totalOpen: number;
    byPhase: WorkcellPhaseCount[];
    slaBreachingCount: number;
  };
  evalRegressions: {
    total: number;
    bySeverity: { critical: number; major: number; minor: number };
    top: EvalRegression[];
  };
  bomAttestations: {
    last24h: number;
    failingVerification: number;
    recent: BomAttestationEntry[];
  };
  patternMaturity: {
    promotionsLast7d: number;
    demotionsLast7d: number;
    recent: PatternMaturityChange[];
  };
  signalVolume: {
    perMinuteNow: number;
    last60mTotal: number;
    sparkline: SignalVolumeBucket[];
    byVertical: Record<string, number>;
  };
  lutar: {
    invariant: number;
    delta24h: number;
    confidenceFloor: number;
  };
}

const ACCENT = '#c9b787';
const BG = '#0a0a0a';
const PANEL = '#16181f';
const PANEL_2 = '#1a1d27';
const BORDER = '#23262f';
const FG = '#e6e7ea';
const MUTED = '#8a8f9a';
const GOOD = '#22c55e';
const WARN = '#f59e0b';
const BAD = '#ef4444';
const VIOLET = '#8b7ac8';

const SEVERITY_COLOR: Record<string, string> = {
  critical: BAD,
  major: WARN,
  minor: MUTED,
};

const STAGE_RANK: Record<string, number> = {
  experimental: 0,
  beta: 1,
  stable: 2,
};

export function OperatorDashboard() {
  const [snap, setSnap] = useState<OperatorSnapshot | null>(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchJson<OperatorSnapshot>(apiUrl('/operator/dashboard'))
      .then((d) => { if (!cancelled) setSnap(d); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const url = apiUrl('/operator/dashboard/stream');
    const es = new EventSource(url);
    es.addEventListener('snapshot', (ev) => {
      try {
        setSnap(JSON.parse((ev as MessageEvent).data) as OperatorSnapshot);
        setLive(true);
        setError(null);
      } catch {
        /* ignore parse errors */
      }
    });
    es.onerror = () => { setLive(false); };
    return () => { es.close(); };
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: BG, color: FG, padding: '28px 32px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: MUTED, textTransform: 'uppercase' }}>
            A11oy · Operator Surface
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: '4px 0 0 0', color: FG }}>
            Operator Dashboard
          </h1>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
            Cross-product roll-up across workcells, alerts, attestations, patterns, and live signal volume.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: MUTED }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: live ? GOOD : MUTED,
            boxShadow: live ? `0 0 8px ${GOOD}` : 'none',
          }} />
          {live ? 'live · streaming' : 'reconnecting…'}
          {snap && (
            <span style={{ marginLeft: 6 }}>
              · {new Date(snap.generatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {error && !snap && (
        <div style={{ color: BAD, padding: 14, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
          Failed to load dashboard: {error}
        </div>
      )}

      {!snap && !error && (
        <div style={{ color: MUTED, padding: 14 }}>Loading operator snapshot…</div>
      )}

      {snap && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <LutarGauge />
            <WorkcellsPanel data={snap.workcells} />
            <EvalRegressionsPanel data={snap.evalRegressions} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SignalVolumePanel data={snap.signalVolume} />
            <BomAttestationsPanel data={snap.bomAttestations} />
            <PatternMaturityPanel data={snap.patternMaturity} />
          </div>
        </div>
      )}
    </div>
  );
}

function Panel({ title, subtitle, right, children }: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 18 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: FG, marginTop: 3 }}>{subtitle}</div>}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

function WorkcellsPanel({ data }: { data: OperatorSnapshot['workcells'] }) {
  const maxOpen = Math.max(1, ...data.byPhase.map((p) => p.open + p.paused + p.blocked));
  return (
    <Panel
      title="Open workcells"
      subtitle={`${data.totalOpen} active across ${data.byPhase.length} phases`}
      right={
        <div style={{ fontSize: 11, color: data.slaBreachingCount > 0 ? BAD : MUTED }}>
          {data.slaBreachingCount} breaching SLA
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 8 }}>
        {data.byPhase.map((p) => {
          const total = p.open + p.paused + p.blocked;
          return (
            <div key={p.phase} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: 10, alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: FG, textTransform: 'capitalize' }}>{p.phase}</div>
              <div style={{ display: 'flex', height: 12, borderRadius: 3, overflow: 'hidden', background: '#0a0b10' }}>
                <div style={{ width: `${(p.open / maxOpen) * 100}%`, background: ACCENT }} />
                <div style={{ width: `${(p.paused / maxOpen) * 100}%`, background: WARN }} />
                <div style={{ width: `${(p.blocked / maxOpen) * 100}%`, background: BAD }} />
              </div>
              <div style={{ fontSize: 11, color: MUTED, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {p.open}<span style={{ color: WARN }}> · {p.paused}</span><span style={{ color: BAD }}> · {p.blocked}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 10, color: MUTED }}>
        <span><Dot color={ACCENT} /> open</span>
        <span><Dot color={WARN} /> paused</span>
        <span><Dot color={BAD} /> blocked</span>
      </div>
    </Panel>
  );
}

function EvalRegressionsPanel({ data }: { data: OperatorSnapshot['evalRegressions'] }) {
  return (
    <Panel
      title="Top eval regressions"
      subtitle={`${data.total} suite${data.total === 1 ? '' : 's'} regressing vs. baseline`}
      right={
        <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
          {(['critical', 'major', 'minor'] as const).map((k) => (
            <span key={k} style={{
              padding: '2px 6px', borderRadius: 3,
              background: `${SEVERITY_COLOR[k]}22`,
              color: SEVERITY_COLOR[k],
              textTransform: 'uppercase', letterSpacing: 1,
            }}>
              {data.bySeverity[k]} {k}
            </span>
          ))}
        </div>
      }
    >
      {data.top.length === 0 && <div style={{ color: MUTED, fontSize: 12 }}>No regressions detected. ✓</div>}
      <div style={{ display: 'grid', gap: 6 }}>
        {data.top.map((r) => (
          <div key={r.suiteId} style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 80px 110px',
            gap: 10, alignItems: 'center',
            padding: '8px 10px', background: PANEL_2, borderRadius: 4,
            borderLeft: `3px solid ${SEVERITY_COLOR[r.severity]}`,
          }}>
            <div style={{ fontSize: 12, color: FG }}>{r.suiteId}</div>
            <div style={{ fontSize: 11, color: BAD, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
              {(r.delta * 100).toFixed(2)}%
            </div>
            <div style={{ fontSize: 11, color: MUTED, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
              {r.baselineAvgScore.toFixed(3)} → {r.latestAvgScore.toFixed(3)}
            </div>
            <div style={{ fontSize: 10, color: MUTED, textAlign: 'right' }}>
              {relativeTime(r.detectedAt)}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function BomAttestationsPanel({ data }: { data: OperatorSnapshot['bomAttestations'] }) {
  return (
    <Panel
      title="Recent BOM attestations"
      subtitle={`${data.last24h} attested in last 24h`}
      right={
        <div style={{ fontSize: 11, color: data.failingVerification > 0 ? BAD : GOOD }}>
          {data.failingVerification > 0
            ? `${data.failingVerification} failing verify`
            : 'all verified'}
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 6 }}>
        {data.recent.map((b) => (
          <div key={`${b.agentId}:${b.attestedAt}`} style={{
            display: 'grid', gridTemplateColumns: '1fr 110px 70px',
            gap: 8, alignItems: 'center',
            padding: '8px 10px', background: PANEL_2, borderRadius: 4,
          }}>
            <div>
              <div style={{ fontSize: 12, color: FG }}>{b.agentName}</div>
              <div style={{ fontSize: 10, color: MUTED, fontFamily: 'ui-monospace, Menlo, monospace' }}>
                {b.modelSnapshot}
              </div>
            </div>
            <div style={{ fontSize: 10, color: MUTED, textAlign: 'right' }}>
              {relativeTime(b.attestedAt)}
            </div>
            <div style={{
              fontSize: 10, textAlign: 'right', letterSpacing: 1,
              color: b.verified ? GOOD : BAD,
              textTransform: 'uppercase',
            }}>
              {b.verified ? '✓ verified' : '✗ failed'}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PatternMaturityPanel({ data }: { data: OperatorSnapshot['patternMaturity'] }) {
  return (
    <Panel
      title="Pattern maturity changes"
      subtitle={`${data.promotionsLast7d} promoted · ${data.demotionsLast7d} demoted (7d)`}
    >
      <div style={{ display: 'grid', gap: 6 }}>
        {data.recent.map((p) => {
          const promoted = STAGE_RANK[p.toStage] > STAGE_RANK[p.fromStage];
          const arrowColor = promoted ? GOOD : STAGE_RANK[p.toStage] < STAGE_RANK[p.fromStage] ? BAD : MUTED;
          return (
            <div key={p.patternId} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              gap: 10, alignItems: 'center',
              padding: '8px 10px', background: PANEL_2, borderRadius: 4,
            }}>
              <div>
                <div style={{ fontSize: 12, color: FG }}>{p.patternName}</div>
                <div style={{ fontSize: 10, color: MUTED }}>
                  {p.usageCount.toLocaleString()} uses · {relativeTime(p.changedAt)}
                </div>
              </div>
              <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 }}>
                {p.fromStage}
              </div>
              <div style={{ fontSize: 11, color: arrowColor, textTransform: 'uppercase', letterSpacing: 1 }}>
                {promoted ? '↑' : STAGE_RANK[p.toStage] < STAGE_RANK[p.fromStage] ? '↓' : '→'} {p.toStage}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function SignalVolumePanel({ data }: { data: OperatorSnapshot['signalVolume'] }) {
  const W = 360;
  const H = 80;
  const maxV = Math.max(1, ...data.sparkline.map((b) => b.total));
  const bw = W / data.sparkline.length;
  const verticals = Object.entries(data.byVertical).sort((a, b) => b[1] - a[1]);
  return (
    <Panel
      title="Live signal volume"
      subtitle={`${data.perMinuteNow.toLocaleString()} signals/min · ${data.last60mTotal.toLocaleString()} last 60m`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {data.sparkline.map((b, i) => {
          const h = (b.total / maxV) * (H - 4);
          return (
            <rect
              key={b.at}
              x={i * bw + 1}
              y={H - h}
              width={Math.max(1, bw - 2)}
              height={h}
              fill={i === data.sparkline.length - 1 ? ACCENT : VIOLET}
              opacity={0.55 + (i / data.sparkline.length) * 0.45}
              rx={1}
            />
          );
        })}
      </svg>
      <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
        {verticals.map(([v, n]) => (
          <div key={v} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 60px', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: FG, textTransform: 'capitalize' }}>{v}</div>
            <div style={{ background: '#0a0b10', height: 6, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${(n / Math.max(1, verticals[0][1])) * 100}%`,
                height: '100%',
                background: VIOLET,
              }} />
            </div>
            <div style={{ fontSize: 11, color: MUTED, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {n.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, marginRight: 6, verticalAlign: 'middle',
    }} />
  );
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default OperatorDashboard;
