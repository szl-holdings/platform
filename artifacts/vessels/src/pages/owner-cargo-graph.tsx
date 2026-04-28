import { color } from '@szl-holdings/design-system';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  Anchor,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  Info,
  MapPin,
  Network,
  Package,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { OwnerCargoForceGraph } from '../components/owner-cargo-force-graph';

const ACCENT = 'var(--gi-accent-blue)';
const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

interface Provenance {
  confidence: number;
  verifierApproved: boolean;
  attestation: string;
  freshness: { fetchedAt: string };
}

interface GraphNode {
  id: string;
  type: 'vessel' | 'owner' | 'charterer' | 'port' | 'cargo';
  label: string;
  subtype?: string;
  flag?: string;
  imo?: string;
  country?: string;
  riskTier?: string;
  sanctionExposure?: boolean;
  creditRating?: string;
  congestionLevel?: string;
  cargoCategory?: string;
  cargoTonnes?: number;
  hazardClass?: string;
  provenance?: Provenance;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
}

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  byType: Record<string, number>;
  sanctionExposureVessels: number;
  highRiskOwners: number;
  uniqueCargoTypes: number;
  hazardousCargoVessels: number;
}

interface GraphData {
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  stats: GraphStats;
  provenance: Provenance;
}

const TYPE_CONFIG: Record<
  string,
  {
    color: string;
    bg: string;
    border: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    label: string;
  }
> = {
  vessel: {
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.25)',
    icon: Anchor,
    label: 'Vessel',
  },
  owner: {
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.25)',
    icon: Building2,
    label: 'Owner',
  },
  charterer: {
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.25)',
    icon: Building2,
    label: 'Charterer',
  },
  port: {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.25)',
    icon: MapPin,
    label: 'Port',
  },
  cargo: {
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.08)',
    border: 'rgba(251,146,60,0.25)',
    icon: Package,
    label: 'Cargo',
  },
};

const RISK_COLORS: Record<string, string> = {
  low: color.accent.green,
  medium: color.accent.amber,
  high: color.accent.amber,
  critical: color.accent.red,
};

function NodeCard({
  node,
  selected,
  onClick,
}: {
  node: GraphNode;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = TYPE_CONFIG[node.type] ?? TYPE_CONFIG.vessel;
  const Icon = cfg.icon;
  const isSanctioned = node.sanctionExposure;
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left rounded-xl p-3 transition-all border',
        selected ? 'ring-2 ring-sky-400/50' : '',
      )}
      style={{
        background: selected ? cfg.bg : 'rgba(15,31,56,0.7)',
        borderColor: isSanctioned
          ? 'rgba(239,68,68,0.4)'
          : selected
            ? cfg.border
            : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 p-1.5 rounded-lg" style={{ background: cfg.bg }}>
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-sky-100 truncate">{node.label}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] uppercase tracking-wider" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            {node.flag && <span className="text-[9px] text-sky-400/50">{node.flag}</span>}
            {node.country && <span className="text-[9px] text-sky-400/50">{node.country}</span>}
            {node.cargoCategory && (
              <span className="text-[9px] text-orange-400/60 capitalize">
                {node.cargoCategory.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
        {isSanctioned && (
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
        )}
        {node.hazardClass && !isSanctioned && (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
        )}
        {node.riskTier && !isSanctioned && !node.hazardClass && (
          <div
            className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
            style={{ background: RISK_COLORS[node.riskTier] ?? '#888' }}
          />
        )}
      </div>
      {node.provenance && (
        <div className="mt-1.5 flex items-center gap-1">
          {node.provenance.verifierApproved ? (
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400/60" />
          ) : (
            <Info className="w-2.5 h-2.5 text-amber-400/60" />
          )}
          <span className="text-[9px] text-sky-400/40">
            {Math.round(node.provenance.confidence * 100)}% conf.
          </span>
        </div>
      )}
    </button>
  );
}

function EdgeList({
  edges,
  nodes,
  sourceId,
}: {
  edges: GraphEdge[];
  nodes: GraphNode[];
  sourceId: string;
}) {
  const connected = edges.filter((e) => e.source === sourceId || e.target === sourceId);
  if (!connected.length) return <p className="text-sky-400/40 text-[11px]">No connections</p>;
  return (
    <div className="space-y-1">
      {connected.map((e, i) => {
        const otherId = e.source === sourceId ? e.target : e.source;
        const other = nodes.find((n) => n.id === otherId);
        const direction = e.source === sourceId ? '→' : '←';
        return (
          <div key={i} className="flex items-center gap-1.5 text-[10px] text-sky-300/70">
            <ChevronRight className="w-2.5 h-2.5 text-sky-400/40" />
            <span className="text-sky-400/40">{direction}</span>
            <span className="text-sky-400/60 italic">{e.label.replace(/_/g, ' ')}</span>
            <span className="text-sky-100 truncate">{other?.label ?? otherId}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function OwnerCargoGraphPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/vessels/cognitive/owner-graph`);
      if (r.ok) setData((await r.json()) as GraphData);
    } catch {
      /* non-fatal — API may require auth */
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const nodes = data?.graph.nodes ?? [];
  const edges = data?.graph.edges ?? [];
  const filtered = typeFilter === 'all' ? nodes : nodes.filter((n) => n.type === typeFilter);

  // For the interactive graph, when a single type is selected we still want to
  // keep its 1-hop neighborhood visible so the relationships remain legible.
  const graphNodes = useMemo(() => {
    if (typeFilter === 'all') return nodes;
    const focusIds = new Set(filtered.map((n) => n.id));
    const neighborIds = new Set<string>();
    for (const e of edges) {
      if (focusIds.has(e.source)) neighborIds.add(e.target);
      if (focusIds.has(e.target)) neighborIds.add(e.source);
    }
    return nodes.filter((n) => focusIds.has(n.id) || neighborIds.has(n.id));
  }, [nodes, edges, filtered, typeFilter]);

  const graphNodeIds = useMemo(() => new Set(graphNodes.map((n) => n.id)), [graphNodes]);
  const visibleEdgeCount = useMemo(
    () =>
      edges.reduce(
        (acc, e) => acc + (graphNodeIds.has(e.source) && graphNodeIds.has(e.target) ? 1 : 0),
        0,
      ),
    [edges, graphNodeIds],
  );

  // If the active filter excludes the currently-selected node, clear the
  // selection so the graph doesn't get stuck in a dimmed state with no
  // incident edges to highlight.
  useEffect(() => {
    if (selected && !graphNodeIds.has(selected.id)) setSelected(null);
  }, [graphNodeIds, selected]);

  const typeColors: Record<string, string> = useMemo(
    () => Object.fromEntries(Object.entries(TYPE_CONFIG).map(([k, v]) => [k, v.color])),
    [],
  );

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1400, margin: '0 auto' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-5 h-5" style={{ color: ACCENT }} />
            <h1 className="text-xl font-semibold text-sky-100">Owner–Port–Cargo Graph</h1>
            <Badge variant="outline" className="text-[9px] border-sky-500/30 text-sky-400/70">
              CONSTELLATION
            </Badge>
          </div>
          <p className="text-xs text-sky-400/60">
            Vessel ownership chains, beneficial owners, charterers, cargo manifests, and port call
            relationships — rendered via CONSTELLATION with full provenance.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-sky-400 border border-sky-500/20 hover:border-sky-500/40 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-7 gap-3 mb-5">
          {[
            { label: 'Total Nodes', value: data.stats.totalNodes, color: ACCENT },
            { label: 'SEXTANT', value: data.stats.byType.vessel ?? 0, color: '#38bdf8' },
            { label: 'Cargo Types', value: data.stats.uniqueCargoTypes ?? 0, color: '#fb923c' },
            {
              label: 'Hazardous Cargo',
              value: data.stats.hazardousCargoVessels ?? 0,
              color: '#fbbf24',
            },
            {
              label: 'Sanction Exposure',
              value: data.stats.sanctionExposureVessels,
              color: '#f87171',
            },
            { label: 'High-Risk Owners', value: data.stats.highRiskOwners, color: '#c084fc' },
            {
              label: 'Total Edges',
              value: data.stats.totalEdges ?? edges.length,
              color: '#94a3b8',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3 border border-sky-500/10"
              style={{ background: 'rgba(10,22,40,0.8)' }}
            >
              <div className="text-[9px] text-sky-400/50 uppercase tracking-wider mb-1">
                {s.label}
              </div>
              <div className="text-xl font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.provenance && (
        <div
          className="flex items-center gap-3 mb-5 px-3 py-2 rounded-lg border border-emerald-500/15"
          style={{ background: 'rgba(52,211,153,0.04)' }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-emerald-300/70 font-medium">
            {data.provenance.attestation}
          </span>
          <span className="text-[10px] text-sky-400/40">·</span>
          <span className="text-[10px] text-sky-400/50">
            {Math.round(data.provenance.confidence * 100)}% confidence
          </span>
          <span className="text-[10px] text-sky-400/40">·</span>
          <span className="text-[10px] text-sky-400/40">
            Fetched {new Date(data.provenance.freshness.fetchedAt).toLocaleTimeString()}
          </span>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(['all', 'vessel', 'owner', 'charterer', 'cargo', 'port'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] border transition-colors capitalize',
              typeFilter === t
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                : 'border-sky-500/10 text-sky-400/50 hover:text-sky-300/70',
            )}
          >
            {t === 'all' ? 'All Entity Types' : t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div
            className="rounded-xl border border-sky-500/10 overflow-hidden"
            style={{ background: 'rgba(10,22,40,0.8)' }}
          >
            <div className="px-4 py-2 border-b border-sky-500/10 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-sky-400/40 font-medium">
                Interactive Ownership · Cargo · Port Graph
              </span>
              <span className="text-[10px] text-sky-400/40">
                {graphNodes.length} nodes · {visibleEdgeCount} edges
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64 text-sky-400/40 text-sm">
                Loading graph intelligence…
              </div>
            ) : graphNodes.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sky-400/40 text-sm">
                No entities in this category
              </div>
            ) : (
              <OwnerCargoForceGraph
                nodes={graphNodes}
                edges={edges}
                selectedId={selected?.id ?? null}
                onSelect={(n) => {
                  if (!n) {
                    setSelected(null);
                    return;
                  }
                  // Resolve to the full GraphNode (with provenance, etc.) from the page's data set.
                  const full = nodes.find((x) => x.id === n.id) ?? null;
                  setSelected(full);
                }}
                height={520}
                typeColors={typeColors}
              />
            )}
          </div>

          <div
            className="mt-3 rounded-xl border border-sky-500/10 p-3"
            style={{ background: 'rgba(10,22,40,0.6)' }}
          >
            <div className="text-[10px] text-sky-400/50 uppercase tracking-wider mb-2">
              Entities ({filtered.length})
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {filtered.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  selected={selected?.id === node.id}
                  onClick={() => setSelected(selected?.id === node.id ? null : node)}
                />
              ))}
              {filtered.length === 0 && (
                <p className="col-span-3 text-sky-400/40 text-xs text-center py-6">
                  No entities in this category
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-3">
          <div
            className="rounded-xl border border-sky-500/10 p-4"
            style={{ background: 'rgba(10,22,40,0.8)' }}
          >
            {selected ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  {(() => {
                    const cfg = TYPE_CONFIG[selected.type] ?? TYPE_CONFIG.vessel;
                    const Icon = cfg.icon;
                    return (
                      <div className="p-2 rounded-lg" style={{ background: cfg.bg }}>
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="text-sm font-medium text-sky-100">{selected.label}</div>
                    <div className="text-[10px] text-sky-400/50 capitalize">{selected.type}</div>
                  </div>
                </div>
                <div className="space-y-3 text-[11px]">
                  {selected.flag && (
                    <div className="flex justify-between">
                      <span className="text-sky-400/50">Flag State</span>
                      <span className="text-sky-200">{selected.flag}</span>
                    </div>
                  )}
                  {selected.country && (
                    <div className="flex justify-between">
                      <span className="text-sky-400/50">Country</span>
                      <span className="text-sky-200">{selected.country}</span>
                    </div>
                  )}
                  {selected.imo && (
                    <div className="flex justify-between">
                      <span className="text-sky-400/50">IMO</span>
                      <span className="text-sky-200 font-mono">{selected.imo}</span>
                    </div>
                  )}
                  {selected.subtype && (
                    <div className="flex justify-between">
                      <span className="text-sky-400/50">Vessel Type</span>
                      <span className="text-sky-200">{selected.subtype}</span>
                    </div>
                  )}
                  {selected.riskTier && (
                    <div className="flex justify-between">
                      <span className="text-sky-400/50">Risk Tier</span>
                      <span
                        style={{ color: RISK_COLORS[selected.riskTier] }}
                        className="font-medium capitalize"
                      >
                        {selected.riskTier}
                      </span>
                    </div>
                  )}
                  {selected.creditRating && (
                    <div className="flex justify-between">
                      <span className="text-sky-400/50">Credit Rating</span>
                      <span className="text-sky-200">{selected.creditRating}</span>
                    </div>
                  )}
                  {selected.congestionLevel && (
                    <div className="flex justify-between">
                      <span className="text-sky-400/50">Port Congestion</span>
                      <span
                        className="capitalize"
                        style={{
                          color:
                            selected.congestionLevel === 'high'
                              ? '#f87171'
                              : selected.congestionLevel === 'medium'
                                ? '#fbbf24'
                                : '#34d399',
                        }}
                      >
                        {selected.congestionLevel}
                      </span>
                    </div>
                  )}
                  {selected.cargoCategory && (
                    <div className="flex justify-between">
                      <span className="text-sky-400/50">Cargo Category</span>
                      <span className="text-orange-300 capitalize">
                        {selected.cargoCategory.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                  {selected.cargoTonnes !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sky-400/50">Cargo Tonnes</span>
                      <span className="text-sky-200">
                        {selected.cargoTonnes.toLocaleString()} mt
                      </span>
                    </div>
                  )}
                  {selected.hazardClass && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-300 font-medium">{selected.hazardClass}</span>
                    </div>
                  )}
                  {selected.sanctionExposure && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-red-300 font-medium">Sanction Exposure Detected</span>
                    </div>
                  )}
                  {selected.provenance && (
                    <div className="pt-2 border-t border-sky-500/10">
                      <div className="text-[10px] text-sky-400/50 mb-1.5">Provenance</div>
                      <div className="flex items-center gap-1.5">
                        {selected.provenance.verifierApproved ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Shield className="w-3 h-3 text-amber-400" />
                        )}
                        <span className="text-[10px] text-sky-300/60">
                          {selected.provenance.attestation}
                        </span>
                      </div>
                      <div className="text-[10px] text-sky-400/40 mt-0.5">
                        {Math.round(selected.provenance.confidence * 100)}% confidence
                      </div>
                      <div className="text-[10px] text-sky-400/30 mt-0.5">
                        {new Date(selected.provenance.freshness.fetchedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-sky-500/10">
                    <div className="text-[10px] text-sky-400/50 mb-2">Graph Connections</div>
                    <EdgeList edges={edges} nodes={nodes} sourceId={selected.id} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Eye className="w-6 h-6 text-sky-400/30 mb-2" />
                <p className="text-sky-400/40 text-sm">Select an entity to inspect</p>
                <p className="text-sky-400/25 text-xs mt-1">
                  Owners, vessels, charterers, cargo, ports
                </p>
              </div>
            )}
          </div>

          <div
            className="rounded-xl border border-sky-500/10 p-4"
            style={{ background: 'rgba(10,22,40,0.8)' }}
          >
            <div className="text-[10px] text-sky-400/50 uppercase tracking-wider mb-3">
              Entity Legend
            </div>
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
              const Icon = cfg.icon;
              const count = nodes.filter((n) => n.type === type).length;
              return (
                <div key={type} className="flex items-center gap-2 mb-1.5">
                  <div className="p-1 rounded" style={{ background: cfg.bg }}>
                    <Icon className="w-2.5 h-2.5" style={{ color: cfg.color }} />
                  </div>
                  <span className="text-[11px] text-sky-300/70 capitalize">{type}</span>
                  <span className="ml-auto text-[10px] text-sky-400/40">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
