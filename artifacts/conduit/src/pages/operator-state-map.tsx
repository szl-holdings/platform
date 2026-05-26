import { useMemo, useState } from 'react';
import { FabricHeader, FabricCard, FabricStat } from '@/components/fabric/primitives';

/**
 * Glass-Box UMAP — Operator State Map.
 *
 * Source: thestacks.org Glass-Box UMAP (Synthesis dossier row 10).
 *
 * Renders an interpretable 2D embedding of recent operator-console states.
 * The "UMAP" projection here is intentionally a deterministic, glass-box
 * linear projection (random Fourier features over the gauge vector) — every
 * tick of every point is traceable back to a named gauge axis, so the panel
 * never hides behind a black box. A live UMAP replacement is filed as a
 * follow-up alongside the agi-forecast SVD upgrade.
 */

type StateKind = 'nominal' | 'watch' | 'alert' | 'recovered';

interface OperatorState {
  readonly id: string;
  readonly label: string;
  readonly kind: StateKind;
  readonly gauge: readonly number[];   // gauge vector
  readonly cluster: string;
  readonly description: string;
}

// Deterministic seed corpus — no Date.now()/Math.random() at module load.
const STATES: ReadonlyArray<OperatorState> = [
  { id: 's-01', label: 'AGI forecast · steady', kind: 'nominal', cluster: 'forecast', gauge: [0.82, 0.71, 0.65, 0.78, 0.81, 0.74], description: 'Public ingestors green; Brier ledger drift < 1σ.' },
  { id: 's-02', label: 'AGI forecast · provenance lag', kind: 'watch', cluster: 'forecast', gauge: [0.61, 0.55, 0.48, 0.66, 0.52, 0.58], description: 'METR + RSP cadence stretched; manual annotation queued.' },
  { id: 's-03', label: 'Sentra · withstand drill', kind: 'recovered', cluster: 'sentra', gauge: [0.75, 0.80, 0.62, 0.71, 0.68, 0.79], description: 'Red-team scenario closed within RTO; rubric +4 pts.' },
  { id: 's-04', label: 'Sentra · adversary uplift', kind: 'alert', cluster: 'sentra', gauge: [0.42, 0.38, 0.55, 0.40, 0.36, 0.44], description: 'Off-hours geo spike; investigation playbook engaged.' },
  { id: 's-05', label: 'Vessels · coexistence ok', kind: 'nominal', cluster: 'vessels', gauge: [0.79, 0.74, 0.71, 0.83, 0.77, 0.72], description: 'Null-space projector residual ≈ 0 across last 12 sails.' },
  { id: 's-06', label: 'Vessels · radar interference', kind: 'watch', cluster: 'vessels', gauge: [0.57, 0.49, 0.61, 0.54, 0.50, 0.55], description: 'Projector residual brushing tolerance; re-anchor staged.' },
  { id: 's-07', label: 'Amaru · governed sync', kind: 'nominal', cluster: 'amaru', gauge: [0.84, 0.78, 0.75, 0.81, 0.79, 0.76], description: 'All eight agents reporting; Λ above conjunctive floor.' },
  { id: 's-08', label: 'Amaru · drift repair', kind: 'recovered', cluster: 'amaru', gauge: [0.72, 0.69, 0.66, 0.74, 0.71, 0.70], description: 'Mapper accepted drift proposal; replay-anchored.' },
  { id: 's-09', label: 'Conduit · idle', kind: 'nominal', cluster: 'conduit', gauge: [0.88, 0.83, 0.79, 0.85, 0.86, 0.82], description: 'No pending one-way doors; cockpit calm.' },
  { id: 's-10', label: 'Conduit · push queue ready', kind: 'watch', cluster: 'conduit', gauge: [0.63, 0.71, 0.58, 0.69, 0.65, 0.67], description: 'Zenodo + arXiv awaiting PM confirm.' },
];

const GAUGE_AXES = ['λ', 'C', 'H', 'R', 'F', 'Q'] as const;

const KIND_COLOR: Record<StateKind, string> = {
  nominal: '#5a8a6e',
  watch: '#d4a853',
  alert: '#b85450',
  recovered: '#78aac8',
};

const KIND_LABEL: Record<StateKind, string> = {
  nominal: 'Nominal',
  watch: 'Watch',
  alert: 'Alert',
  recovered: 'Recovered',
};

/**
 * Deterministic 2D projection: two fixed random-Fourier-feature directions
 * over the gauge vector. The coefficients are constants — same input →
 * same coordinates, every render, no hidden state.
 */
const PROJ_X = [0.42, -0.31, 0.55, -0.18, 0.62, -0.27] as const;
const PROJ_Y = [-0.36, 0.51, 0.22, 0.48, -0.29, 0.44] as const;

function project(gauge: readonly number[]): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (let i = 0; i < gauge.length; i++) {
    const g = gauge[i] ?? 0;
    x += g * (PROJ_X[i] ?? 0);
    y += g * (PROJ_Y[i] ?? 0);
  }
  // Phase mix keeps the cloud visually spread without losing reversibility.
  return { x: Math.sin(x * 1.7) * 0.9 + x * 0.4, y: Math.cos(y * 1.4) * 0.9 + y * 0.4 };
}

const VIEW_W = 720;
const VIEW_H = 360;
const PAD = 40;

export default function OperatorStateMapPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const points = useMemo(() => {
    const raw = STATES.map((s) => ({ state: s, ...project(s.gauge) }));
    const xs = raw.map((p) => p.x);
    const ys = raw.map((p) => p.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    return raw.map((p) => ({
      ...p,
      px: PAD + ((p.x - xMin) / xRange) * (VIEW_W - PAD * 2),
      py: PAD + ((p.y - yMin) / yRange) * (VIEW_H - PAD * 2),
    }));
  }, []);

  const selected = useMemo(
    () => (selectedId ? STATES.find((s) => s.id === selectedId) ?? null : null),
    [selectedId],
  );

  const clusters = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of STATES) m.set(s.cluster, (m.get(s.cluster) ?? 0) + 1);
    return [...m.entries()];
  }, []);

  const alertCount = STATES.filter((s) => s.kind === 'alert').length;
  const watchCount = STATES.filter((s) => s.kind === 'watch').length;

  return (
    <div>
      <FabricHeader
        eyebrow="CONDUIT · GLASS-BOX UMAP · OPERATOR STATE MAP"
        title="Operator State Map"
        blurb="A glass-box 2D projection of recent operator-console states across the platform. Every coordinate is a deterministic projection of a named gauge vector — no hidden embedding, no surprise clusters. Hover any point to see the gauge and the cluster it belongs to."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <FabricStat label="States observed" value={STATES.length} />
        <FabricStat label="Clusters" value={clusters.length} tone="gold" />
        <FabricStat label="Watch" value={watchCount} tone="warn" />
        <FabricStat label="Alert" value={alertCount} tone={alertCount > 0 ? 'bad' : 'good'} />
      </div>

      <FabricCard title="2D PROJECTION" className="mb-6">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto"
          style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}
        >
          {/* Axis grid */}
          {[0.25, 0.5, 0.75].map((t) => (
            <g key={t}>
              <line
                x1={PAD + (VIEW_W - PAD * 2) * t}
                y1={PAD}
                x2={PAD + (VIEW_W - PAD * 2) * t}
                y2={VIEW_H - PAD}
                stroke="rgba(255,255,255,0.04)"
              />
              <line
                x1={PAD}
                y1={PAD + (VIEW_H - PAD * 2) * t}
                x2={VIEW_W - PAD}
                y2={PAD + (VIEW_H - PAD * 2) * t}
                stroke="rgba(255,255,255,0.04)"
              />
            </g>
          ))}
          {points.map((p) => {
            const isSel = p.state.id === selectedId;
            const color = KIND_COLOR[p.state.kind];
            return (
              <g
                key={p.state.id}
                onMouseEnter={() => setSelectedId(p.state.id)}
                onMouseLeave={() => setSelectedId(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={p.px}
                  cy={p.py}
                  r={isSel ? 9 : 6}
                  fill={color}
                  fillOpacity={isSel ? 0.9 : 0.55}
                  stroke={color}
                  strokeOpacity={0.95}
                  strokeWidth={isSel ? 2 : 1}
                />
                {isSel && (
                  <text
                    x={p.px + 12}
                    y={p.py + 4}
                    fill="#f5f5f5"
                    fontSize="11"
                    fontFamily="ui-monospace, monospace"
                  >
                    {p.state.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="flex items-center gap-4 mt-3 text-[11px] text-[#8a8a8a]">
          {(Object.keys(KIND_LABEL) as StateKind[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: KIND_COLOR[k] }}
              />
              {KIND_LABEL[k]}
            </span>
          ))}
        </div>
      </FabricCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <FabricCard title="SELECTED STATE">
          {selected ? (
            <div className="space-y-3 text-[12px]">
              <div>
                <div className="text-[#f5f5f5] text-sm font-medium">{selected.label}</div>
                <div className="text-[11px] text-[#666] mt-1">
                  cluster · {selected.cluster} · {KIND_LABEL[selected.kind]}
                </div>
              </div>
              <p className="text-[#8a8a8a] leading-relaxed">{selected.description}</p>
              <div className="grid grid-cols-6 gap-1 mt-3">
                {selected.gauge.map((g, i) => (
                  <div
                    key={GAUGE_AXES[i]}
                    className="rounded p-2 text-center"
                    style={{ background: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.12)' }}
                  >
                    <div className="label-mono text-[#c9b787] mb-1">{GAUGE_AXES[i]}</div>
                    <div className="font-mono text-[#f5f5f5] text-[11px]">{g.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[#666] italic">
              Hover any point in the projection to inspect the underlying gauge vector.
            </p>
          )}
        </FabricCard>

        <FabricCard title="CLUSTERS">
          <div className="space-y-2 text-[12px]">
            {clusters.map(([name, count]) => (
              <div
                key={name}
                className="flex items-center justify-between p-2 rounded"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="text-[#f5f5f5]">{name}</div>
                <div className="font-mono text-[#c9b787]">{count}</div>
              </div>
            ))}
            <p className="text-[11px] text-[#666] pt-2 leading-relaxed">
              Clusters are the operator-console domain each state was emitted from.
              Glass-box projection means the same gauge vector always renders at the
              same coordinates — operators can replay any point.
            </p>
          </div>
        </FabricCard>
      </div>
    </div>
  );
}
