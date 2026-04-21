import { color } from '@szl-holdings/design-system';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitBranch,
  Info,
  Layers,
  Package,
  Shield,
  Users,
  ZapOff,
} from 'lucide-react';
import { useState } from 'react';
import { type EntityEdge, type EntityNode, entityEdges, entityNodes } from '@/data/seed';

const NODE_TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; border: string; label: string }
> = {
  opportunity: {
    icon: <Package className="w-3.5 h-3.5" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Opportunity',
  },
  approval_chain: {
    icon: <GitBranch className="w-3.5 h-3.5" />,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    label: 'Approval Chain',
  },
  project: {
    icon: <Layers className="w-3.5 h-3.5" />,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    label: 'Project',
  },
  stakeholder: {
    icon: <Users className="w-3.5 h-3.5" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    label: 'Stakeholder',
  },
  deliverable: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    label: 'Deliverable',
  },
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  active: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-400' },
  stalled: { icon: <Clock className="w-3 h-3" />, color: 'text-orange-400' },
  blocked: { icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-400' },
  at_risk: { icon: <AlertTriangle className="w-3 h-3" />, color: 'text-orange-400' },
  void: { icon: <ZapOff className="w-3 h-3" />, color: 'text-red-500' },
  pending: { icon: <Clock className="w-3 h-3" />, color: 'text-sky-400' },
  cleared: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-400' },
};

const EDGE_STATUS_COLOR: Record<string, string> = {
  active: color.accent.green,
  stalled: color.accent.amber,
  broken: color.accent.red,
};

function NodeCard({
  node,
  selected,
  onClick,
}: {
  node: EntityNode;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = NODE_TYPE_CONFIG[node.type];
  const sts = STATUS_CONFIG[node.status];
  if (!cfg) return null;
  return (
    <div
      className={`absolute rounded-lg border cursor-pointer transition-all duration-150 select-none ${cfg.bg} ${cfg.border} ${selected ? 'ring-2 ring-amber-400/50 scale-105' : 'hover:scale-102 hover:ring-1 ring-amber-400/20'}`}
      style={{ left: node.x - 70, top: node.y - 36, width: 140, zIndex: selected ? 10 : 1 }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 px-2.5 py-2">
        <span className={cfg.color}>{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-amber-100 truncate leading-tight">
            {node.label}
          </p>
          {node.sublabel && (
            <p className={`text-[9px] font-mono truncate ${sts?.color ?? 'text-amber-400/40'}`}>
              {node.sublabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EdgeLine({ edge, nodes }: { edge: EntityEdge; nodes: EntityNode[] }) {
  const src = nodes.find((n) => n.id === edge.sourceId);
  const tgt = nodes.find((n) => n.id === edge.targetId);
  if (!src || !tgt) return null;

  const x1 = src.x;
  const y1 = src.y;
  const x2 = tgt.x;
  const y2 = tgt.y;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const color = EDGE_STATUS_COLOR[edge.status] ?? '#f59e0b';
  const dashArray = edge.status === 'broken' ? '6,4' : edge.strength === 'weak' ? '4,4' : undefined;

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={edge.strength === 'strong' ? 1.5 : 1}
        strokeDasharray={dashArray}
        opacity={0.6}
        markerEnd="url(#arrow)"
      />
      <text x={mx} y={my - 4} textAnchor="middle" fontSize="8" fill={color} opacity={0.7}>
        {edge.label}
      </text>
    </g>
  );
}

export default function EntityGraphPage() {
  const [selected, setSelected] = useState<EntityNode | null>(null);

  const nodeTypeFilter = new Set(entityNodes.map((n) => n.type));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-amber-100 font-display">Entity Graph</h1>
          <p className="text-xs text-amber-400/50 mt-0.5">
            Vantex Acquisition — Stalled Approval Chain scenario · {entityNodes.length} entities ·{' '}
            {entityEdges.length} relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded border border-amber-500/15 bg-amber-500/5">
            {['active', 'stalled', 'blocked', 'void'].map((s) => {
              const sts = STATUS_CONFIG[s]!;
              return (
                <div key={s} className="flex items-center gap-1">
                  <span className={sts.color}>{sts.icon}</span>
                  <span className={`text-[9px] font-mono ${sts.color}`}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 px-6 pb-3 shrink-0">
        {Object.entries(NODE_TYPE_CONFIG)
          .filter(([k]) => nodeTypeFilter.has(k as never))
          .map(([k, v]) => (
            <div
              key={k}
              className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono ${v.color} ${v.bg} ${v.border}`}
            >
              {v.icon}
              {v.label}
            </div>
          ))}
        <div className="flex items-center gap-3 px-2 py-1 rounded border border-amber-500/15 bg-amber-500/5 text-[9px] font-mono text-amber-400/50">
          <span className="flex items-center gap-1">
            <span className="inline-block w-6 h-0.5 bg-emerald-400 opacity-60" /> active
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-6 border-t-2 border-dashed border-orange-400 opacity-60" />{' '}
            stalled
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-6 border-t-2 border-dashed border-red-400 opacity-60" />{' '}
            broken
          </span>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative overflow-auto">
          <div className="relative" style={{ width: 800, height: 620 }}>
            <svg width="800" height="620" className="absolute inset-0 pointer-events-none">
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" opacity={0.5} />
                </marker>
              </defs>
              {entityEdges.map((edge) => (
                <EdgeLine key={edge.id} edge={edge} nodes={entityNodes} />
              ))}
            </svg>
            {entityNodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                selected={selected?.id === node.id}
                onClick={() => setSelected(selected?.id === node.id ? null : node)}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 border-l border-amber-500/10 bg-[hsl(220_30%_4%)] overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-amber-400/40 uppercase">Entity Detail</p>
                <button
                  onClick={() => setSelected(null)}
                  className="text-amber-400/40 hover:text-amber-300 text-xs"
                >
                  ✕
                </button>
              </div>

              {(() => {
                const cfg = NODE_TYPE_CONFIG[selected.type]!;
                const sts = STATUS_CONFIG[selected.status]!;
                return (
                  <>
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg ${cfg.bg} border ${cfg.border}`}
                    >
                      <span className={cfg.color}>{cfg.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-amber-100">{selected.label}</p>
                        <p className={`text-[10px] font-mono ${sts?.color ?? 'text-amber-400/40'}`}>
                          {selected.status}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { l: 'Type', v: cfg.label },
                        { l: 'Policy State', v: selected.policyState },
                        { l: 'Confidence', v: `${Math.round(selected.confidence * 100)}%` },
                        { l: 'Freshness', v: selected.freshness },
                      ].map(({ l, v }) => (
                        <div key={l} className="flex justify-between text-[11px]">
                          <span className="text-amber-400/40">{l}</span>
                          <span className="text-amber-200/70 font-mono">{v}</span>
                        </div>
                      ))}
                    </div>

                    {selected.sublabel && (
                      <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3">
                        <p className="text-[9px] font-mono text-amber-400/40 mb-1">STATUS NOTE</p>
                        <p className="text-xs text-amber-100/70">{selected.sublabel}</p>
                      </div>
                    )}

                    {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                      <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3 space-y-1.5">
                        <p className="text-[9px] font-mono text-amber-400/40 mb-1">METADATA</p>
                        {Object.entries(selected.metadata).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[10px]">
                            <span className="text-amber-400/40">{k}</span>
                            <span className="text-amber-200/70 font-mono">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <p className="text-[9px] font-mono text-amber-400/40 mb-2">CONNECTED TO</p>
                      {entityEdges
                        .filter((e) => e.sourceId === selected.id || e.targetId === selected.id)
                        .map((e) => {
                          const other = entityNodes.find(
                            (n) => n.id === (e.sourceId === selected.id ? e.targetId : e.sourceId),
                          );
                          return other ? (
                            <div key={e.id} className="flex items-center gap-2 py-1.5">
                              <span className="text-[9px] font-mono text-amber-400/30">
                                {e.sourceId === selected.id ? '→' : '←'}
                              </span>
                              <div>
                                <p className="text-[11px] text-amber-100/80">{other.label}</p>
                                <p className="text-[9px] font-mono text-amber-400/30">{e.label}</p>
                              </div>
                            </div>
                          ) : null;
                        })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
