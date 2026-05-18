/**
 * Distress Engine — Account distress scoring & recommended plays.
 *
 * Backed by `/api/a11oy/stubs/distress-engine` via `useApiData`.
 */

import { useMemo, useState } from 'react';
import { Activity, ArrowDown, ArrowUp, Minus, Radio } from 'lucide-react';
import { useApiData } from '../../hooks/useApiData';
import { DataStateBadge } from '../../components/ui/DataStateBadge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { KpiCard } from '../../components/ui/KpiCard';

type Band = 'severe' | 'elevated' | 'watch' | 'stable';

interface Driver {
  label: string;
  weight: number;
  trend: 'up' | 'down' | 'flat';
}

interface DistressSignal {
  id: string;
  account: string;
  segment: 'enterprise' | 'mid-market' | 'smb';
  region: string;
  ownerId: string;
  score: number;
  band: Band;
  drivers: Driver[];
  arrAtRisk: number;
  daysSinceLastEngagement: number;
  recommendedPlay: string;
  lastUpdated: string;
}

interface Payload {
  signals: DistressSignal[];
  totals: { arrAtRisk: number; bands: Record<string, number> };
}

const BAND_COLOR: Record<Band, string> = {
  severe: '#ef4444',
  elevated: '#f97316',
  watch: '#f59e0b',
  stable: '#22c55e',
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function TrendIcon({ trend }: { trend: Driver['trend'] }) {
  if (trend === 'up') return <ArrowUp size={11} style={{ color: '#ef4444' }} />;
  if (trend === 'down') return <ArrowDown size={11} style={{ color: '#22c55e' }} />;
  return <Minus size={11} style={{ color: '#9ca3af' }} />;
}

export default function DistressEnginePage() {
  const { data, loading, error, source } = useApiData<Payload>('/stubs/distress-engine');
  const [filter, setFilter] = useState<Band | 'all'>('all');

  const badgeState = loading ? 'loading' : error ? 'error' : source === 'demo' ? 'demo' : 'live';

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data.signals;
    return data.signals.filter((s) => s.band === filter);
  }, [data, filter]);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <PageHeader
          breadcrumbs={[{ label: 'Operations' }, { label: 'Distress Engine' }]}
          title="Distress Engine"
          description="Account-level distress scoring with weighted drivers, ARR at risk, and recommended recovery plays."
        />
        <div style={{ paddingTop: 6 }}><DataStateBadge state={badgeState} /></div>
      </div>

      {error && (
        <div style={{ padding: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', borderRadius: 6, margin: '16px 0', fontSize: 13 }}>
          Failed to load distress signals: {error}
        </div>
      )}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginTop: 20 }}>
            <KpiCard label="ARR at risk" value={formatCurrency(data.totals.arrAtRisk)} color="#d4a054" />
            <KpiCard label="Severe" value={data.totals.bands.severe ?? 0} color={BAND_COLOR.severe} />
            <KpiCard label="Elevated" value={data.totals.bands.elevated ?? 0} color={BAND_COLOR.elevated} />
            <KpiCard label="Watch" value={data.totals.bands.watch ?? 0} color={BAND_COLOR.watch} />
            <KpiCard label="Stable" value={data.totals.bands.stable ?? 0} color={BAND_COLOR.stable} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 12 }}>
            {(['all', 'severe', 'elevated', 'watch', 'stable'] as const).map((b) => (
              <button
                type="button"
                key={b}
                onClick={() => setFilter(b)}
                style={{
                  padding: '5px 10px',
                  border: `1px solid ${filter === b ? '#8b7ac8' : 'rgba(255,255,255,0.12)'}`,
                  background: filter === b ? 'rgba(139,122,200,0.15)' : 'transparent',
                  color: filter === b ? '#c4b5fd' : '#9ca3af',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {b}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 11, color: '#6b7280' }}>
              <Radio size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {filtered.length} of {data.signals.length} signals
            </span>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((s) => (
              <Card key={s.id} accent={BAND_COLOR[s.band]}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#e5e7eb' }}>{s.account}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          color: BAND_COLOR[s.band],
                          background: `${BAND_COLOR[s.band]}18`,
                          border: `1px solid ${BAND_COLOR[s.band]}40`,
                          padding: '2px 7px',
                          borderRadius: 3,
                        }}
                      >
                        {s.band}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {s.segment} · {s.region} · last touch {s.daysSinceLastEngagement}d ago
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <span style={{ fontSize: 38, fontWeight: 800, color: BAND_COLOR[s.band], lineHeight: 1 }}>{s.score}</span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>distress score</span>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af' }}>
                      <span style={{ color: '#d4a054', fontWeight: 700 }}>{formatCurrency(s.arrAtRisk)}</span> ARR at risk
                    </div>
                    <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(139,122,200,0.08)', border: '1px solid rgba(139,122,200,0.25)', borderRadius: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#c4b5fd', marginBottom: 4, textTransform: 'uppercase' }}>
                        Recommended play
                      </div>
                      <div style={{ fontSize: 13, color: '#e5e7eb', lineHeight: 1.5 }}>{s.recommendedPlay}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>
                      Drivers
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {s.drivers.map((d, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: '#e5e7eb', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <TrendIcon trend={d.trend} />
                              {d.label}
                            </span>
                            <span style={{ color: '#6b7280' }}>{Math.round(d.weight * 100)}%</span>
                          </div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${d.weight * 100}%`, height: '100%', background: BAND_COLOR[s.band], opacity: 0.7 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 14, fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Activity size={11} /> updated {new Date(s.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', fontSize: 13 }}>
                  No accounts match the selected band.
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
