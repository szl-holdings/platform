import { color } from '@szl-holdings/design-system';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitBranch,
  Info,
  Layers,
  Package,
  Search,
  Shield,
  Users,
  X,
  ZapOff,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useEntityGraph, type EntityGraphEdge, type EntityGraphNode } from '@/data/api';

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
    color: 'text-[#c9a85c]',
    bg: 'bg-[#c9b787]/10',
    border: 'border-[#c9b787]/20',
    label: 'Deliverable',
  },
  signal: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Signal',
  },
  recommendation: {
    icon: <Info className="w-3.5 h-3.5" />,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    label: 'Recommendation',
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

const ALL_STATUSES = ['active', 'stalled', 'blocked', 'void', 'pending', 'at_risk', 'cleared'];
const ALL_TYPES = Object.keys(NODE_TYPE_CONFIG);

function NodeCard({
  node,
  selected,
  dimmed,
  onClick,
}: {
  node: EntityGraphNode;
  selected: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  const cfg = NODE_TYPE_CONFIG[node.type];
  const sts = STATUS_CONFIG[node.status];
  if (!cfg) return null;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${node.label} — ${node.status}`}
      aria-pressed={selected}
      className={`absolute rounded-lg border cursor-pointer transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${cfg.bg} ${cfg.border} ${selected ? 'ring-2 ring-amber-400/50 scale-105 z-20' : dimmed ? 'opacity-30' : 'hover:scale-[1.02] hover:ring-1 ring-amber-400/20 z-10'}`}
      style={{ left: node.x - 70, top: node.y - 36, width: 140 }}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
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

function EdgeLine({
  edge,
  nodes,
  dimmed,
}: {
  edge: EntityGraphEdge;
  nodes: EntityGraphNode[];
  dimmed: boolean;
}) {
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
    <g opacity={dimmed ? 0.15 : 1}>
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
  const { data: graphData, isLoading: graphLoading, error: graphError } = useEntityGraph();
  const nodes: EntityGraphNode[] = graphData?.nodes ?? [];
  const edges: EntityGraphEdge[] = graphData?.edges ?? [];

  const [selected, setSelected] = useState<EntityGraphNode | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());

  const activeTypeFilters = typeFilters.size > 0 ? typeFilters : new Set(ALL_TYPES);
  const activeStatusFilters = statusFilters.size > 0 ? statusFilters : new Set(ALL_STATUSES);

  const filteredNodes = useMemo(() => {
    const q = search.toLowerCase().trim();
    return nodes.filter((n) => {
      if (!activeTypeFilters.has(n.type)) return false;
      if (!activeStatusFilters.has(n.status)) return false;
      if (q && !n.label.toLowerCase().includes(q) && !(n.sublabel?.toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [nodes, search, typeFilters, statusFilters, activeTypeFilters, activeStatusFilters]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (e) => filteredNodeIds.has(e.sourceId) && filteredNodeIds.has(e.targetId),
      ),
    [edges, filteredNodeIds],
  );

  const connectedToSelected = useMemo(() => {
    if (!selected) return new Set<string>();
    const ids = new Set<string>();
    edges.forEach((e) => {
      if (e.sourceId === selected.id) ids.add(e.targetId);
      if (e.targetId === selected.id) ids.add(e.sourceId);
    });
    ids.add(selected.id);
    return ids;
  }, [selected, edges]);

  function toggleTypeFilter(t: string) {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }

  function toggleStatusFilter(s: string) {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  const nodeTypeFilter = new Set(nodes.map((n) => n.type));

  const canvasWidth = 860;
  const canvasHeight = 640;

  if (graphLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-xs text-amber-400/50 font-mono animate-pulse">Loading entity graph…</p>
      </div>
    );
  }

  if (graphError) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-xs text-red-400 font-mono">Failed to load entity graph.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-3 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-amber-100 font-display">Entity Graph</h1>
          <p className="text-xs text-amber-400/50 mt-0.5">
            {filteredNodes.length} entities · {visibleEdges.length} relationships
            {(typeFilters.size > 0 || statusFilters.size > 0 || search) && (
              <span className="ml-1 text-amber-400/30">(filtered)</span>
            )}
          </p>
        </div>
        {/* Status legend */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded border border-amber-500/15 bg-amber-500/5">
          {(['active', 'stalled', 'blocked', 'void'] as const).map((s) => {
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

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-6 pb-3 shrink-0">
        {/* Search */}
        <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/15 rounded-lg px-2.5 py-1.5 min-w-[180px]">
          <Search className="w-3 h-3 text-amber-400/40 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entities…"
            className="bg-transparent text-[11px] text-amber-100 placeholder-amber-400/30 focus:outline-none flex-1 min-w-0"
            aria-label="Search entities"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-amber-400/40 hover:text-amber-300">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="h-3 w-px bg-amber-500/15" />

        {/* Type filters */}
        {Object.entries(NODE_TYPE_CONFIG)
          .filter(([k]) => nodeTypeFilter.has(k))
          .map(([k, v]) => {
            const active = typeFilters.has(k);
            return (
              <button
                key={k}
                onClick={() => toggleTypeFilter(k)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono transition-all ${
                  active
                    ? `${v.color} ${v.bg} ${v.border} opacity-100`
                    : 'text-amber-400/35 bg-amber-500/3 border-amber-500/10 hover:opacity-70'
                }`}
              >
                {v.icon}
                {v.label}
              </button>
            );
          })}

        <div className="h-3 w-px bg-amber-500/15" />

        {/* Status filters */}
        {(['stalled', 'blocked', 'void', 'active'] as const).map((s) => {
          const sts = STATUS_CONFIG[s]!;
          const active = statusFilters.has(s);
          return (
            <button
              key={s}
              onClick={() => toggleStatusFilter(s)}
              aria-pressed={active}
              className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-mono transition-all ${
                active
                  ? `${sts.color} bg-amber-500/8 border-amber-500/20`
                  : 'text-amber-400/35 bg-amber-500/3 border-amber-500/10 hover:opacity-70'
              }`}
            >
              <span className={sts.color}>{sts.icon}</span>
              {s}
            </button>
          );
        })}

        {(typeFilters.size > 0 || statusFilters.size > 0 || search) && (
          <button
            onClick={() => {
              setTypeFilters(new Set());
              setStatusFilters(new Set());
              setSearch('');
            }}
            className="text-[10px] text-amber-400/40 hover:text-amber-300 flex items-center gap-1 px-2 py-1 rounded border border-amber-500/10 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Graph canvas + detail panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative overflow-auto">
          {filteredNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Search className="w-8 h-8 text-amber-400/20 mx-auto mb-2" />
                <p className="text-sm text-amber-400/40">No entities match your filters</p>
                <button
                  onClick={() => {
                    setTypeFilters(new Set());
                    setStatusFilters(new Set());
                    setSearch('');
                  }}
                  className="mt-2 text-[11px] text-amber-400/50 hover:text-amber-300 underline"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
              <svg
                width={canvasWidth}
                height={canvasHeight}
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" opacity={0.5} />
                  </marker>
                </defs>
                {visibleEdges.map((edge) => {
                  const dimmed =
                    selected !== null &&
                    edge.sourceId !== selected.id &&
                    edge.targetId !== selected.id;
                  return (
                    <EdgeLine key={edge.id} edge={edge} nodes={nodes} dimmed={dimmed} />
                  );
                })}
              </svg>
              {filteredNodes.map((node) => {
                const dimmed = selected !== null && !connectedToSelected.has(node.id);
                return (
                  <NodeCard
                    key={node.id}
                    node={node}
                    selected={selected?.id === node.id}
                    dimmed={dimmed}
                    onClick={() => setSelected(selected?.id === node.id ? null : node)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div
            className="w-72 shrink-0 border-l border-amber-500/10 bg-[hsl(220_30%_4%)] overflow-y-auto"
            role="complementary"
            aria-label="Entity detail"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-amber-400/40 uppercase">Entity Detail</p>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close detail panel"
                  className="text-amber-400/40 hover:text-amber-300 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
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

                    {/* Provenance panel */}
                    <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3">
                      <p className="text-[9px] font-mono text-amber-400/40 mb-2 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        PROVENANCE
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-amber-400/40">Entity ID</span>
                          <span className="text-amber-200/60 font-mono text-[9px] truncate ml-2">
                            {selected.id}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-amber-400/40">Source</span>
                          <span className="text-amber-200/70 font-mono text-[9px] truncate ml-2">
                            {graphData?.provenance?.source ?? 'lyte_entity_nodes'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-amber-400/40">Freshness</span>
                          <span
                            className={`font-mono ${selected.freshness === 'live' ? 'text-emerald-400' : selected.freshness === 'stale' ? 'text-orange-400' : selected.freshness === 'expired' ? 'text-red-400' : 'text-amber-400'}`}
                          >
                            {selected.freshness}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono text-amber-400/40 mb-2">
                        CONNECTED TO ({connectedToSelected.size - 1})
                      </p>
                      <div className="space-y-1">
                        {edges
                          .filter(
                            (e) => e.sourceId === selected.id || e.targetId === selected.id,
                          )
                          .map((e) => {
                            const otherId =
                              e.sourceId === selected.id ? e.targetId : e.sourceId;
                            const other = nodes.find((n) => n.id === otherId);
                            const edgeColor = EDGE_STATUS_COLOR[e.status] ?? '#f59e0b';
                            return other ? (
                              <button
                                key={e.id}
                                className="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-amber-500/5 transition-colors text-left"
                                onClick={() => setSelected(other)}
                              >
                                <span
                                  className="text-[9px] font-mono shrink-0"
                                  style={{ color: edgeColor }}
                                >
                                  {e.sourceId === selected.id ? '→' : '←'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] text-amber-100/80 truncate">
                                    {other.label}
                                  </p>
                                  <p className="text-[9px] font-mono text-amber-400/30 truncate">
                                    {e.label}
                                  </p>
                                </div>
                              </button>
                            ) : null;
                          })}
                      </div>
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
