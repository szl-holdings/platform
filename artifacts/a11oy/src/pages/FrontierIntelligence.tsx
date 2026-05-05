import { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell,
} from 'recharts';
import { COMPETITOR_LANES, DIMENSIONS, CAPABILITY_GAPS } from '@szl-holdings/frontier-mythos';
import type { CompetitorLane } from '@szl-holdings/frontier-mythos';
import { ResearchCitationPanel } from './frontier/ResearchCitationPanel';
import type { Citation } from './frontier/ResearchCitationPanel';

const API_BASE = '/api';

interface IntelAlert {
  id: string;
  laneId: string;
  champion: string;
  title: string;
  summary: string;
  link?: string;
  publishedAt: string;
  recommendation?: string;
}

interface IntelStatus {
  monitored: number;
  alertsLast24h: number;
  lastUpdated: string;
}

const GOLD = '#c9b787';
const DIM = '#8a8a8a';
const DEEP = '#0a0a0a';

const LANE_INTERNAL_NAMES: Record<string, string> = {
  'lane-a': 'OpenAI / GPT',
  'lane-b': 'Anthropic / Claude',
  'lane-c': 'Microsoft / Copilot',
  'lane-d': 'Palantir',
  'lane-e': 'Datadog / New Relic',
};

const LANE_CITATIONS: Citation[] = COMPETITOR_LANES.filter(l => l.id !== 'a11oy').map(l => ({
  id: `cite-lane-${l.id}`,
  lab: LANE_INTERNAL_NAMES[l.id] ?? l.laneLabel,
  kind: 'company' as const,
  title: `${LANE_INTERNAL_NAMES[l.id] ?? l.laneLabel} — Internal capability assessment`,
  sourceName: 'Internal Competitive Intelligence',
  sourceUrl: '#',
  excerpt: `This lane (${l.laneLabel}) is assessed as: ${l.archetype}. Scores across 8 dimensions are A11oy's internal analyst estimates based on public product documentation and market research. Not for external distribution.`,
  date: 'May 2026',
}));

function RadarViz({ lanes }: { lanes: CompetitorLane[] }) {
  const data = DIMENSIONS.map((d, i) => {
    const entry: Record<string, string | number> = { dimension: d };
    lanes.forEach(c => { entry[c.id] = c.scores[i]; });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: '#8a8a8a', fontSize: 10, fontFamily: 'ui-monospace, monospace' }}
        />
        {lanes.map(c => (
          <Radar
            key={c.id}
            name={c.laneLabel}
            dataKey={c.id}
            stroke={c.color}
            fill={c.color}
            fillOpacity={c.id === 'a11oy' ? 0.18 : 0.04}
            strokeWidth={c.id === 'a11oy' ? 2 : 1}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}

function PositioningMatrix() {
  return (
    <div className="relative w-full" style={{ height: 320, backgroundColor: 'var(--color-a11oy-deep)', borderRadius: 8, border: '1px solid var(--color-a11oy-border)' }}>
      <div className="absolute inset-0 p-4">
        <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>← Less Governed</div>
        <div className="absolute right-4 top-4 text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>More Governed →</div>
        <div className="absolute bottom-4 left-4 text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Model-layer only</div>
        <div className="absolute bottom-4 right-4 text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Enterprise-grade</div>
        <div className="absolute top-1/2 left-4 text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', transform: 'rotate(-90deg) translateX(-50%)' }}>Agentic</div>
        {COMPETITOR_LANES.map(p => (
          <div
            key={p.id}
            className="absolute flex flex-col items-center"
            style={{
              left: `${p.posX}%`,
              bottom: `${p.posY}%`,
              transform: 'translate(-50%, 50%)',
            }}
          >
            <div
              className="rounded-full flex items-center justify-center font-mono font-bold"
              style={{
                width: p.dotSize * 3,
                height: p.dotSize * 3,
                backgroundColor: `${p.color}22`,
                border: `2px solid ${p.color}`,
                color: p.color,
                fontSize: 9,
                boxShadow: p.id === 'a11oy' ? `0 0 20px ${p.color}44` : undefined,
              }}
            >
              {p.id === 'a11oy' ? '⬡' : '●'}
            </div>
            <div className="text-center mt-1" style={{ fontSize: 9, color: p.color, whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace' }}>
              {p.laneLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GapBar({ a11oy, nearest, nearestLabel, color }: { a11oy: number; nearest: number; nearestLabel: string; color: string }) {
  const data = [
    { name: 'A11oy', value: a11oy, fill: '#c9b787' },
    { name: nearestLabel, value: nearest, fill: color },
  ];
  return (
    <ResponsiveContainer width="100%" height={60}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis type="category" dataKey="name" tick={{ fill: '#8a8a8a', fontSize: 10 }} width={60} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={10}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={i === 0 ? 1 : 0.5} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FrontierIntelligence() {
  const [activeCompetitors, setActiveCompetitors] = useState<string[]>(['a11oy', 'lane-a', 'lane-b', 'lane-d']);
  const [alerts, setAlerts] = useState<IntelAlert[]>([]);
  const [intelStatus, setIntelStatus] = useState<IntelStatus | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  const fetchIntel = useCallback(async () => {
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      const [alertsRes, statusRes] = await Promise.allSettled([
        fetch(`${API_BASE}/competitive-intel/alerts`),
        fetch(`${API_BASE}/competitive-intel/status`),
      ]);

      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const body = await alertsRes.value.json() as { data?: IntelAlert[]; alerts?: IntelAlert[] };
        setAlerts(body.data ?? body.alerts ?? []);
      } else {
        const msg = alertsRes.status === 'rejected'
          ? String(alertsRes.reason)
          : `HTTP ${alertsRes.value.status}`;
        setAlertsError(msg);
      }

      if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
        const body = await statusRes.value.json() as { data?: IntelStatus } & IntelStatus;
        setIntelStatus(body.data ?? (body.monitored !== undefined ? body : null));
      }
    } catch (e) {
      setAlertsError(String(e));
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => { fetchIntel(); }, [fetchIntel]);

  const toggleComp = (id: string) => {
    if (id === 'a11oy') return;
    setActiveCompetitors(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const visibleLanes = COMPETITOR_LANES.filter(c => activeCompetitors.includes(c.id));

  const BASE_URL = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  const FRONTIER_NAV = [
    { label: 'Signal Feed', path: '/frontier/feed' },
    { label: 'Mythos Index', path: '/frontier/mythos' },
    { label: 'Capability Proposals', path: '/frontier/proposals' },
    { label: 'Benchmarks', path: '/frontier/benchmarks' },
    { label: 'Recalibration Memos', path: '/frontier/memos' },
    { label: 'Scanners', path: '/frontier/scanners' },
    { label: 'System Health', path: '/frontier/system' },
  ];

  return (
    <Layout>
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24,
        padding: '10px 14px', borderRadius: 8,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: DEEP === '#0a0a0a' ? '#5e5e5e' : DEEP, letterSpacing: '0.1em', textTransform: 'uppercase', alignSelf: 'center', marginRight: 4 }}>
          Frontier /
        </span>
        {FRONTIER_NAV.map(n => (
          <Link
            key={n.path}
            href={`${BASE_URL}${n.path}`}
            style={{
              fontSize: 11, fontFamily: 'ui-monospace, monospace',
              color: DIM, textDecoration: 'none',
              padding: '4px 10px', borderRadius: 4,
              border: `1px solid rgba(255,255,255,0.07)`,
              background: 'transparent',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {n.label}
          </Link>
        ))}
      </div>

      <PageHeader
        label="FRONTIER INTELLIGENCE"
        title="Competitive Positioning Matrix"
        subtitle="A11oy is not trying to replace the enterprise. A11oy is the governed intelligence layer that lets the enterprise observe, decide, approve, execute, verify, and learn across every operational domain."
        status="LIVE"
      />

      <div className="mb-5 px-4 py-2.5 rounded-lg text-xs border flex items-center gap-2" style={{ backgroundColor: 'rgba(90,90,120,0.08)', borderColor: 'rgba(140,140,200,0.2)', color: 'rgba(180,180,220,0.7)' }}>
        <span style={{ opacity: 0.7 }}>ⓘ</span>
        <span>Internal analysis — competitor capability scores are A11oy's own assessments based on publicly available product documentation and market research. Live alerts are sourced from the competitive intel API.</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="CAPABILITY LEAD" value="+58pts" sub="vs nearest on proof chains" accent={GOLD} />
        <KpiCard label="UNIQUE LANE" value="1 of 1" sub="governed agentic execution" accent={GOLD} />
        <KpiCard label="DIMENSIONS" value="8" sub="capability axes measured" accent={GOLD} />
        <KpiCard label="COMPETITORS" value="5" sub="mapped and assessed" accent={DIM} />
      </div>

      <div className="p-4 rounded-xl mb-8 border" style={{ backgroundColor: 'rgba(201,183,135,0.04)', borderColor: 'rgba(201,183,135,0.2)' }}>
        <div className="text-sm font-semibold mb-2" style={{ color: GOLD }}>The A11oy Doctrine</div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          "A11oy is the governed intelligence layer that lets the enterprise observe, decide, approve, execute, verify, and learn across every operational domain. No competitor occupies this lane."
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          {['Agentic execution', 'Proof-carrying governance', 'Business observability', 'Human-in-the-loop', 'Outcome verification'].map(t => (
            <span key={t} className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.08)', border: '1px solid rgba(201,183,135,0.15)', color: GOLD }}>{t}</span>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SectionTitle>8-Dimension Capability Radar</SectionTitle>
          <Card>
            <div className="flex flex-wrap gap-2 mb-4">
              {COMPETITOR_LANES.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleComp(c.id)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-mono transition-all"
                  style={{
                    backgroundColor: activeCompetitors.includes(c.id) ? `${c.color}18` : 'var(--color-a11oy-muted)',
                    color: activeCompetitors.includes(c.id) ? c.color : 'var(--color-a11oy-text-ghost)',
                    border: `1px solid ${activeCompetitors.includes(c.id) ? c.color + '40' : 'var(--color-a11oy-border)'}`,
                    cursor: c.id === 'a11oy' ? 'default' : 'pointer',
                    opacity: c.id === 'a11oy' ? 1 : undefined,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c.color, flexShrink: 0, display: 'inline-block' }} />
                  {c.laneLabel}
                </button>
              ))}
            </div>
            <RadarViz lanes={visibleLanes} />
            <div className="mt-3 text-xs text-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              Scores are analyst assessments based on published capabilities and public documentation. Toggle competitors above.
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <SectionTitle>Lane Profiles</SectionTitle>
          {COMPETITOR_LANES.filter(c => c.id !== 'a11oy').map(c => {
            const avg = Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length);
            return (
              <div
                key={c.id}
                className="rounded-lg border p-3 cursor-pointer transition-all"
                style={{
                  backgroundColor: activeCompetitors.includes(c.id) ? `${c.color}08` : 'var(--color-a11oy-card)',
                  borderColor: activeCompetitors.includes(c.id) ? `${c.color}30` : 'var(--color-a11oy-border)',
                }}
                onClick={() => toggleComp(c.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: c.color }}>{c.laneLabel}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>avg {avg}</span>
                </div>
                <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c.archetype}</div>
                <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                  <div className="h-1 rounded-full" style={{ width: `${avg}%`, backgroundColor: c.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div>
          <SectionTitle>Strategic Positioning Map</SectionTitle>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <PositioningMatrix />
            <div className="p-3 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)', borderTop: '1px solid var(--color-a11oy-border)' }}>
              X-axis: Governance depth · Y-axis: Agentic execution capability. A11oy occupies the only position combining both.
            </div>
          </Card>
        </div>

        <div>
          <SectionTitle>Capability Gap Analysis</SectionTitle>
          <div className="flex flex-col gap-3">
            {CAPABILITY_GAPS.map((gap, i) => {
              const nearestLane = COMPETITOR_LANES.find(c => c.id === gap.nearestLaneId);
              return (
                <Card key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold" style={{ color: GOLD }}>{gap.dimension}</span>
                    <span className="text-xs font-mono" style={{ color: GOLD }}>+{gap.a11oy - gap.nearestScore} pts lead</span>
                  </div>
                  <GapBar a11oy={gap.a11oy} nearest={gap.nearestScore} nearestLabel={nearestLane?.laneLabel ?? 'Nearest'} color={nearestLane?.color ?? DIM} />
                  <p className="text-xs mt-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{gap.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <SectionTitle>Full Dimension Scores</SectionTitle>
      <div className="rounded-lg border overflow-hidden mb-8" style={{ borderColor: 'var(--color-a11oy-border)' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
              <th className="text-left px-4 py-3 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 10, letterSpacing: '0.08em' }}>DIMENSION</th>
              {COMPETITOR_LANES.map(c => (
                <th key={c.id} className="text-center px-3 py-3 font-mono" style={{ color: c.color, fontSize: 10 }}>{c.laneLabel}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIMENSIONS.map((dim, di) => (
              <tr key={dim} style={{ backgroundColor: di % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)', borderBottom: '1px solid var(--color-a11oy-border)' }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{dim}</td>
                {COMPETITOR_LANES.map(c => {
                  const score = c.scores[di];
                  const isA11oy = c.id === 'a11oy';
                  return (
                    <td key={c.id} className="px-3 py-2.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono font-semibold" style={{ color: isA11oy ? GOLD : score >= 70 ? 'var(--color-a11oy-text-sub)' : 'var(--color-a11oy-text-ghost)' }}>
                          {score}
                        </span>
                        <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                          <div className="h-1 rounded-full" style={{ width: `${score}%`, backgroundColor: isA11oy ? GOLD : c.color, opacity: isA11oy ? 1 : 0.5 }} />
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr style={{ backgroundColor: 'rgba(201,183,135,0.06)', borderTop: '2px solid rgba(201,183,135,0.2)' }}>
              <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: GOLD }}>AVG SCORE</td>
              {COMPETITOR_LANES.map(c => {
                const avg = Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length);
                return (
                  <td key={c.id} className="px-3 py-3 text-center font-mono font-bold" style={{ color: c.id === 'a11oy' ? GOLD : 'var(--color-a11oy-text-ghost)' }}>
                    {avg}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-4 rounded-xl border mb-8" style={{ backgroundColor: 'rgba(201,183,135,0.03)', borderColor: 'rgba(201,183,135,0.15)' }}>
        <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>METHODOLOGY NOTE</div>
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Scores represent capability assessments based on publicly available product documentation, published research, and market analysis. All competitor assessments are A11oy's internal view. Assessments are updated as new capability data becomes available.
        </p>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <SectionTitle>Live Competitive Intel Feed</SectionTitle>
        {intelStatus && (
          <div className="text-xs font-mono flex items-center gap-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            <span>{intelStatus.monitored} lanes monitored</span>
            <span style={{ color: GOLD }}>{intelStatus.alertsLast24h} alerts / 24h</span>
          </div>
        )}
      </div>

      {alertsLoading && (
        <div className="rounded-lg border p-6 flex items-center gap-3 mb-8" style={{ borderColor: 'var(--color-a11oy-border)', backgroundColor: 'var(--color-a11oy-card)' }}>
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${GOLD}60`, borderTopColor: 'transparent' }} />
          <span className="text-sm font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading competitive intel feed...</span>
        </div>
      )}

      {!alertsLoading && alertsError && (
        <div className="rounded-lg border p-4 mb-8" style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)' }}>
          <div className="text-sm font-mono mb-1" style={{ color: '#ef4444' }}>Feed unavailable — {alertsError}</div>
          <button
            onClick={fetchIntel}
            className="text-xs font-mono underline mt-1"
            style={{ color: 'var(--color-a11oy-text-ghost)' }}
          >
            Retry
          </button>
        </div>
      )}

      {!alertsLoading && !alertsError && alerts.length === 0 && (
        <div className="rounded-lg border p-4 mb-8 text-sm font-mono" style={{ borderColor: 'var(--color-a11oy-border)', backgroundColor: 'var(--color-a11oy-card)', color: 'var(--color-a11oy-text-ghost)' }}>
          No active competitive intelligence alerts.
        </div>
      )}

      {!alertsLoading && !alertsError && alerts.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-3 mb-8">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className="rounded-lg border p-4"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-a11oy-text)' }}>{alert.title}</div>
                <div className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)' }}>
                  {alert.champion}
                </div>
              </div>
              <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{alert.summary}</div>
              {alert.recommendation && (
                <div className="text-xs px-2 py-1.5 rounded mt-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', color: 'var(--color-a11oy-text-ghost)', borderLeft: `2px solid ${GOLD}40` }}>
                  A11oy response: {alert.recommendation}
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {alert.laneId} · {new Date(alert.publishedAt).toLocaleDateString()}
                </div>
                {alert.link && (
                  <a href={alert.link} target="_blank" rel="noopener noreferrer" className="text-xs font-mono underline" style={{ color: GOLD }}>
                    Source →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ResearchCitationPanel
        citations={LANE_CITATIONS}
        title="Intelligence Sources — Internal Competitive Research"
      />
    </Layout>
  );
}
