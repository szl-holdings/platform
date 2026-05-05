import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { DREAM_CYCLES } from '../../data/psyche/dreams';
import type { DreamYield, DreamCycle } from '../../data/psyche/dreams';

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
};

const YIELD_COLORS: Record<DreamYield, string> = {
  insight: '#22c55e',
  'no-op': '#4b5563',
  'contradiction-found': '#f97316',
  'hazard-found': '#ef4444',
};

const YIELD_LABELS: Record<DreamYield, string> = {
  insight: 'Insight',
  'no-op': 'No-op',
  'contradiction-found': 'Contradiction',
  'hazard-found': 'Hazard',
};

const CLUSTER_COLORS = ['#c9b787', '#60a5fa', '#a78bfa', '#22c55e', '#f97316', '#38bdf8', '#4ade80', '#e879f9', '#fb923c'];

function LatentScatterPlot({ cycle }: { cycle: DreamCycle }) {
  const clusters = Array.from(new Set(cycle.latentPoints.map(p => p.cluster)));
  const clusterColorMap = Object.fromEntries(clusters.map((c, i) => [c, CLUSTER_COLORS[i % CLUSTER_COLORS.length]]));
  const W = 240;
  const H = 200;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 8 }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(f => (
        <g key={f}>
          <line x1={f * W} y1={0} x2={f * W} y2={H} stroke="rgba(255,255,255,0.04)" />
          <line x1={0} y1={f * H} x2={W} y2={f * H} stroke="rgba(255,255,255,0.04)" />
        </g>
      ))}
      {/* Points */}
      {cycle.latentPoints.map(pt => {
        const cx = pt.x * W;
        const cy = (1 - pt.y) * H;
        const r = 2 + pt.intensity * 5;
        const color = clusterColorMap[pt.cluster] ?? '#8a8a8a';
        return (
          <circle key={pt.id} cx={cx} cy={cy} r={r} fill={color} opacity={0.55 + pt.intensity * 0.35} />
        );
      })}
      {/* Cluster labels */}
      {clusters.slice(0, 4).map((cl, i) => {
        const pts = cycle.latentPoints.filter(p => p.cluster === cl);
        if (!pts.length) return null;
        const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length * W;
        const my = (1 - pts.reduce((s, p) => s + p.y, 0) / pts.length) * H;
        return (
          <text key={cl} x={mx} y={my - 8} textAnchor="middle" fontSize={6} fill={clusterColorMap[cl]} opacity={0.75}>
            {cl.replace(/-/g, ' ')}
          </text>
        );
      })}
    </svg>
  );
}

export function DreamAtlas() {
  const [yieldFilter, setYieldFilter] = useState<DreamYield | 'all'>('all');
  const [selectedCycle, setSelectedCycle] = useState<DreamCycle | null>(null);

  const yieldTypes: DreamYield[] = ['insight', 'contradiction-found', 'hazard-found', 'no-op'];
  const yieldCounts = yieldTypes.reduce((acc, y) => {
    acc[y] = DREAM_CYCLES.filter(d => d.yieldClass === y).length;
    return acc;
  }, {} as Record<DreamYield, number>);

  const filtered = yieldFilter === 'all' ? DREAM_CYCLES : DREAM_CYCLES.filter(d => d.yieldClass === yieldFilter);

  const totalDuration = DREAM_CYCLES.reduce((s, d) => s + d.durationMinutes, 0);
  const withForgeRef = DREAM_CYCLES.filter(d => d.argoForgeRef).length;

  return (
    <Layout>
      <PageHeader
        label="PSYCHE — DREAM ATLAS"
        title="Dream Atlas"
        subtitle="Nightly dream cycle observatory — synthetic self-play replay, latent space scatter, and morning insights. Cycles that yield insights are filed as Distillation Forge candidates. Hazards and contradictions feed the Genesis Ledger extinction tracker."
        status="LIVE"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="TOTAL CYCLES" value={DREAM_CYCLES.length} sub={`${(totalDuration / 60).toFixed(0)}h total runtime`} accent="#a78bfa" />
        <KpiCard label="INSIGHTS YIELDED" value={yieldCounts.insight} sub="filed as candidates" accent="#22c55e" />
        <KpiCard label="CONTRADICTIONS" value={yieldCounts['contradiction-found']} sub="fed to Genesis Ledger" accent="#f97316" />
        <KpiCard label="HAZARDS FOUND" value={yieldCounts['hazard-found']} sub="policy reviews triggered" accent="#ef4444" />
      </div>

      {/* Cross-links */}
      <div className="mb-6 flex items-center gap-3 text-[11px] font-mono" style={{ color: T.muted }}>
        <Link href={b('/psyche')}><span className="cursor-pointer hover:opacity-80" style={{ color: T.dim }}>← ANIMA</span></Link>
        <span style={{ color: T.border }}>·</span>
        <Link href={b('/psyche/genesis')}><span className="cursor-pointer hover:opacity-80" style={{ color: GOLD }}>→ GENESIS LEDGER</span></Link>
        <span style={{ color: T.border }}>·</span>
        <Link href={b('/argo/distillation-forge')}><span className="cursor-pointer hover:opacity-80" style={{ color: '#60a5fa' }}>→ DISTILLATION FORGE</span></Link>
      </div>

      {/* Argo Forge cross-reference banner */}
      {withForgeRef > 0 && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)' }}>
          <div className="text-[10px] font-mono mb-1" style={{ color: '#60a5fa' }}>ARGO FORGE CONNECTION</div>
          <div className="text-sm" style={{ color: T.text }}>
            {withForgeRef} dream cycle{withForgeRef > 1 ? 's' : ''} have been filed as Distillation Forge candidates.
            Cycles with the <span style={{ color: '#60a5fa' }}>FORGE REF</span> badge are awaiting ratification.
          </div>
          <div className="mt-2 flex gap-3 flex-wrap text-[10px] font-mono" style={{ color: '#60a5fa' }}>
            {DREAM_CYCLES.filter(d => d.argoForgeRef).map(d => (
              <span key={d.id}>{d.insightId} → {d.argoForgeRef}</span>
            ))}
          </div>
        </div>
      )}

      {/* Yield filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setYieldFilter('all')}
          className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
          style={{ background: yieldFilter === 'all' ? GOLD : T.surface, color: yieldFilter === 'all' ? '#0a0e1a' : T.muted, border: `1px solid ${T.border}` }}
        >
          ALL ({DREAM_CYCLES.length})
        </button>
        {yieldTypes.map(y => (
          <button
            key={y}
            onClick={() => setYieldFilter(yieldFilter === y ? 'all' : y)}
            className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
            style={{
              background: yieldFilter === y ? `${YIELD_COLORS[y]}20` : T.surface,
              color: yieldFilter === y ? YIELD_COLORS[y] : T.muted,
              border: `1px solid ${yieldFilter === y ? YIELD_COLORS[y] + '44' : T.border}`,
            }}
          >
            {YIELD_LABELS[y]} ({yieldCounts[y]})
          </button>
        ))}
      </div>

      {/* Selected cycle detail */}
      {selectedCycle && (
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${YIELD_COLORS[selectedCycle.yieldClass]}20`, color: YIELD_COLORS[selectedCycle.yieldClass] }}>
                  {YIELD_LABELS[selectedCycle.yieldClass]}
                </span>
                {selectedCycle.argoForgeRef && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
                    FORGE REF: {selectedCycle.argoForgeRef}
                  </span>
                )}
              </div>
              <div className="text-lg font-semibold" style={{ color: T.text }}>Dream Cycle {selectedCycle.cycleNumber} — {selectedCycle.night}</div>
              <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>{selectedCycle.insightId} · {selectedCycle.durationMinutes}m runtime · {selectedCycle.domains.join(', ')}</div>
            </div>
            <button onClick={() => setSelectedCycle(null)} className="text-[10px] font-mono" style={{ color: T.muted }}>CLOSE</button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-mono mb-2" style={{ color: T.muted }}>MORNING INSIGHT</div>
              <p className="text-[12px] leading-relaxed mb-4" style={{ color: T.dim }}>{selectedCycle.morningInsight}</p>
              <div className="text-[10px] font-mono mb-2" style={{ color: T.muted }}>SOURCE EXPERIENCES ({selectedCycle.sourceExperiences.length})</div>
              <div className="flex flex-col gap-2">
                {selectedCycle.sourceExperiences.map(exp => (
                  <div key={exp.id} className="p-2 rounded-lg" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="text-[10px] mb-0.5" style={{ color: T.dim }}>{exp.description}</div>
                    <div className="text-[9px] font-mono" style={{ color: T.muted }}>{exp.domain} · {exp.proofRef}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono mb-2" style={{ color: T.muted }}>LATENT SPACE SCATTER ({selectedCycle.latentPoints.length} points)</div>
              <LatentScatterPlot cycle={selectedCycle} />
              <div className="mt-2 text-[10px]" style={{ color: T.muted }}>
                {Array.from(new Set(selectedCycle.latentPoints.map(p => p.cluster))).slice(0, 4).map((cl, i) => (
                  <span key={cl} className="mr-3" style={{ color: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>● {cl.replace(/-/g, ' ')}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Cycle grid */}
      <SectionTitle>Cycle History</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(cycle => {
          const yieldColor = YIELD_COLORS[cycle.yieldClass];
          const isSelected = selectedCycle?.id === cycle.id;
          return (
            <div
              key={cycle.id}
              className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01]"
              style={{
                background: isSelected ? `${yieldColor}0a` : T.surface,
                border: `1px solid ${isSelected ? yieldColor + '44' : T.border}`,
              }}
              onClick={() => setSelectedCycle(isSelected ? null : cycle)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${yieldColor}18`, color: yieldColor }}>
                      {YIELD_LABELS[cycle.yieldClass]}
                    </span>
                    {cycle.argoForgeRef && (
                      <span className="text-[9px] font-mono" style={{ color: '#60a5fa' }}>FORGE</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: T.text }}>Cycle {cycle.cycleNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono" style={{ color: T.dim }}>{cycle.durationMinutes}m</div>
                  <div className="text-[9px]" style={{ color: T.muted }}>{cycle.night}</div>
                </div>
              </div>

              {/* Miniature scatter */}
              <svg width="100%" viewBox="0 0 120 80" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 6, marginBottom: 8 }}>
                {cycle.latentPoints.map(pt => {
                  const clusters = Array.from(new Set(cycle.latentPoints.map(p => p.cluster)));
                  const ci = clusters.indexOf(pt.cluster);
                  const color = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];
                  return (
                    <circle key={pt.id} cx={pt.x * 120} cy={(1 - pt.y) * 80} r={1.5 + pt.intensity * 3} fill={color} opacity={0.5 + pt.intensity * 0.4} />
                  );
                })}
              </svg>

              <p className="text-[10px] line-clamp-2 leading-relaxed" style={{ color: T.muted }}>{cycle.morningInsight}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {cycle.domains.map(d => (
                  <span key={d} className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.muted }}>{d}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

export default DreamAtlas;
