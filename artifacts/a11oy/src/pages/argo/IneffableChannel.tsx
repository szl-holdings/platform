import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { LATENT_CLUSTERS, LATENT_POINTS, ARGO_DOMAINS } from '../../data/argo';

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

const POINT_COLORS = {
  query: '#60a5fa',
  response: '#22c55e',
  correction: '#f97316',
  boundary: '#ef4444',
};

// Deterministic seeded scatter layout — positions come from LATENT_CLUSTERS/LATENT_POINTS
// No Math.random() at render time
const SVG_W = 600;
const SVG_H = 400;
const pad = (v: number, axis: 'x' | 'y') => axis === 'x' ? v * SVG_W : v * SVG_H;

export function IneffableChannel() {
  const [veilLifted, setVeilLifted] = useState(false);
  const [autonomyDepth, setAutonomyDepth] = useState(4);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  const hoveredClusterData = hoveredCluster ? LATENT_CLUSTERS.find(c => c.id === hoveredCluster) : null;
  const hoveredPointData = hoveredPoint ? LATENT_POINTS.find(p => p.id === hoveredPoint) : null;

  return (
    <Layout>
      <PageHeader
        label="ARGO · INEFFABLE CHANNEL"
        title="Ineffable Channel"
        subtitle="Visualization of the high-dimensional latent reasoning bus between agents. UMAP-style deterministic scatter of message embeddings with post-hoc natural-language translations. Translation Veil toggle and Karpathy Autonomy Depth Dial gate how much of the reasoning is revealed."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="ACTIVE CLUSTERS" value={LATENT_CLUSTERS.length} sub="reasoning clusters" accent={GOLD} />
        <KpiCard label="MESSAGE POINTS" value={LATENT_POINTS.length} sub="embedded messages" accent={GOLD} />
        <KpiCard label="CHANNEL UTIL." value="73%" sub="of capacity" accent={GOLD} />
        <KpiCard label="AVG CONFIDENCE" value="88.3%" sub="translation fidelity" accent={GOLD} />
      </div>

      {/* Controls */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#5e5e5e' }}>Translation Veil</div>
              <button
                onClick={() => setVeilLifted(v => !v)}
                className="text-xs font-mono px-4 py-2 rounded-lg"
                style={{
                  background: veilLifted ? 'rgba(201,183,135,0.12)' : 'rgba(255,255,255,0.04)',
                  color: veilLifted ? GOLD : '#8a8a8a',
                  border: `1px solid ${veilLifted ? 'rgba(201,183,135,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer',
                }}
              >
                {veilLifted ? '🔓 Veil Lifted — translations visible' : '🔒 Veil Down — latent dance only'}
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-[240px]">
            <div className="flex justify-between mb-1">
              <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#5e5e5e' }}>Karpathy Autonomy Depth Dial</div>
              <div className="text-[10px] font-mono" style={{ color: GOLD }}>{autonomyDepth} / 10</div>
            </div>
            <input
              type="range" min={1} max={10} value={autonomyDepth}
              onChange={e => setAutonomyDepth(Number(e.target.value))}
              style={{ width: '100%', height: 4, appearance: 'none', background: `linear-gradient(to right, #6b7280 0%, #60a5fa 40%, #fbbf24 60%, #c9b787 100%)`, borderRadius: 2, outline: 'none', cursor: 'pointer' }}
            />
            <div className="flex justify-between mt-1 text-[8px] font-mono" style={{ color: '#5e5e5e' }}>
              <span>Minimal</span>
              <span>Standard</span>
              <span>Sovereign</span>
            </div>
          </div>
          <div className="text-[10px]" style={{ color: '#5e5e5e' }}>
            Depth {autonomyDepth} reveals translations for clusters requiring ≤{autonomyDepth} depth
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Main scatter visualization */}
        <div className="lg:col-span-2">
          <SectionTitle>Latent Embedding Space (Seeded Deterministic Layout)</SectionTitle>
          <div className="rounded-xl overflow-hidden" style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.06)' }}>
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', display: 'block' }}>
              {/* Grid */}
              {[0.25, 0.5, 0.75].map(v => (
                <g key={v}>
                  <line x1={pad(v, 'x')} y1={0} x2={pad(v, 'x')} y2={SVG_H} stroke="rgba(255,255,255,0.03)" />
                  <line x1={0} y1={pad(v, 'y')} x2={SVG_W} y2={pad(v, 'y')} stroke="rgba(255,255,255,0.03)" />
                </g>
              ))}

              {/* Cluster halos */}
              {LATENT_CLUSTERS.map(cl => {
                const dom = ARGO_DOMAINS.find(d => d.id === cl.domain);
                const isHovered = hoveredCluster === cl.id;
                return (
                  <circle
                    key={cl.id}
                    cx={pad(cl.x, 'x')} cy={pad(cl.y, 'y')}
                    r={cl.radius * SVG_W * 0.6}
                    fill={`${dom?.color ?? GOLD}12`}
                    stroke={dom?.color ?? GOLD}
                    strokeOpacity={isHovered ? 0.6 : 0.2}
                    strokeWidth={isHovered ? 1.5 : 0.8}
                    onMouseEnter={() => setHoveredCluster(cl.id)}
                    onMouseLeave={() => setHoveredCluster(null)}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}

              {/* Cluster labels */}
              {LATENT_CLUSTERS.map(cl => {
                const dom = ARGO_DOMAINS.find(d => d.id === cl.domain);
                return (
                  <text
                    key={`lbl-${cl.id}`}
                    x={pad(cl.x, 'x')} y={pad(cl.y, 'y') - cl.radius * SVG_W * 0.6 - 6}
                    textAnchor="middle"
                    fill={dom?.color ?? GOLD}
                    fontSize={9}
                    fontFamily="monospace"
                    opacity={0.7}
                  >
                    {cl.label}
                  </text>
                );
              })}

              {/* Latent points */}
              {LATENT_POINTS.map(pt => {
                const isHovered = hoveredPoint === pt.id;
                return (
                  <circle
                    key={pt.id}
                    cx={pad(pt.x, 'x')} cy={pad(pt.y, 'y')}
                    r={isHovered ? 6 : 4}
                    fill={POINT_COLORS[pt.messageType]}
                    fillOpacity={isHovered ? 1 : 0.75}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={1}
                    onMouseEnter={() => setHoveredPoint(pt.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3 text-[9px]">
            {Object.entries(POINT_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span style={{ color: '#5e5e5e' }}>{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hover panel + cluster list */}
        <div className="flex flex-col gap-4">
          {/* Tooltip panel */}
          <Card>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#5e5e5e' }}>
              {hoveredCluster ? 'Cluster Detail' : hoveredPoint ? 'Message Detail' : 'Hover a cluster or message point'}
            </div>
            {hoveredClusterData && (
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: '#f5f5f5' }}>{hoveredClusterData.label}</div>
                <div className="text-[9px] font-mono mb-2" style={{ color: ARGO_DOMAINS.find(d => d.id === hoveredClusterData.domain)?.color ?? GOLD }}>
                  {ARGO_DOMAINS.find(d => d.id === hoveredClusterData.domain)?.label} · confidence {(hoveredClusterData.confidence * 100).toFixed(0)}%
                </div>
                {(veilLifted && autonomyDepth >= hoveredClusterData.autonomyDepthRequired) ? (
                  <p className="text-[10px] leading-relaxed" style={{ color: '#c5c5c5' }}>{hoveredClusterData.translation}</p>
                ) : (
                  <div className="text-[10px] italic" style={{ color: '#5e5e5e' }}>
                    {!veilLifted ? 'Lift the Translation Veil to view reasoning.' : `Requires Autonomy Depth ≥${hoveredClusterData.autonomyDepthRequired}. Current: ${autonomyDepth}.`}
                  </div>
                )}
                <div className="text-[9px] font-mono mt-2" style={{ color: '#5e5e5e' }}>
                  Linked: <Link href={`${BASE}/proof`} style={{ color: GOLD }}>{hoveredClusterData.linkedProof} →</Link>
                </div>
              </div>
            )}
            {hoveredPointData && !hoveredClusterData && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: POINT_COLORS[hoveredPointData.messageType] }} />
                  <span className="text-[9px] font-mono" style={{ color: POINT_COLORS[hoveredPointData.messageType] }}>{hoveredPointData.messageType}</span>
                </div>
                {(veilLifted && autonomyDepth >= 3) ? (
                  <p className="text-[10px] leading-relaxed" style={{ color: '#c5c5c5' }}>{hoveredPointData.translation}</p>
                ) : (
                  <div className="text-[10px] italic" style={{ color: '#5e5e5e' }}>
                    {!veilLifted ? 'Lift the Translation Veil to view message content.' : 'Requires Autonomy Depth ≥3.'}
                  </div>
                )}
              </div>
            )}
            {!hoveredCluster && !hoveredPoint && (
              <div className="text-[10px]" style={{ color: '#3a3a3a' }}>Move cursor over the embedding space to inspect clusters and message points.</div>
            )}
          </Card>

          {/* Cluster index */}
          <SectionTitle>Cluster Index</SectionTitle>
          <div className="flex flex-col gap-2">
            {LATENT_CLUSTERS.map(cl => {
              const dom = ARGO_DOMAINS.find(d => d.id === cl.domain);
              const canReveal = veilLifted && autonomyDepth >= cl.autonomyDepthRequired;
              return (
                <div
                  key={cl.id}
                  className="rounded-lg px-3 py-2 cursor-pointer"
                  style={{ background: hoveredCluster === cl.id ? 'rgba(201,183,135,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hoveredCluster === cl.id ? 'rgba(201,183,135,0.15)' : 'rgba(255,255,255,0.05)'}` }}
                  onMouseEnter={() => setHoveredCluster(cl.id)}
                  onMouseLeave={() => setHoveredCluster(null)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: dom?.color ?? GOLD }} />
                    <span className="text-[10px] font-semibold" style={{ color: '#f5f5f5' }}>{cl.label}</span>
                    <span className="text-[9px] font-mono ml-auto" style={{ color: '#5e5e5e' }}>depth≥{cl.autonomyDepthRequired}</span>
                  </div>
                  {canReveal ? (
                    <div className="text-[9px] leading-relaxed line-clamp-2" style={{ color: '#8a8a8a' }}>{cl.translation.slice(0, 80)}…</div>
                  ) : (
                    <div className="text-[9px] italic" style={{ color: '#3a3a3a' }}>Latent representation — veil active</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-[10px] flex-wrap">
        <Link href={`${BASE}/argo`} className="font-mono" style={{ color: '#8a8a8a' }}>← Argo Bridge</Link>
        <Link href={`${BASE}/proof`} className="font-mono" style={{ color: GOLD }}>Proof Chain →</Link>
        <Link href={`${BASE}/karpathy-evolution`} className="font-mono" style={{ color: GOLD }}>Karpathy Evolution →</Link>
        <Link href={`${BASE}/argo/forge`} className="font-mono" style={{ color: GOLD }}>Distillation Forge →</Link>
      </div>
    </Layout>
  );
}
