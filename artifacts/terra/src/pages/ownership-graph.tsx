import { useStandardQuery } from '@szl-holdings/api-client-react';

import {
  AlertTriangle,
  Building2,
  ChevronRight,
  GitBranch,
  HelpCircle,
  Info,
  Landmark,
  RefreshCw,
  Shield,
  Tag,
  User,
} from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#40856a';
const API = '/api';

function fetchOwnershipGraph(propertyId?: string) {
  const url = propertyId
    ? `${API}/terra/cognitive/ownership-graph?propertyId=${encodeURIComponent(propertyId)}`
    : `${API}/terra/cognitive/ownership-graph`;
  return fetch(url)
    .then((r) => r.json())
    .then((d) => d.data ?? d);
}

function ConfidencePill({ value }: { value: number }) {
  const color = value >= 0.85 ? '#40856a' : value >= 0.65 ? '#c8a060' : '#c04a2a';
  const label = value >= 0.85 ? 'High' : value >= 0.65 ? 'Medium' : 'Low';
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
    >
      {label} {(value * 100).toFixed(0)}%
    </span>
  );
}

function ProvenanceTag({ source, traceRef }: { source: string; traceRef: string }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 text-[10px] font-mono"
      style={{ color: 'rgba(255,255,255,0.3)' }}
    >
      <Tag className="w-3 h-3" />
      <span>{source}</span>
      <span className="opacity-50">·</span>
      <span style={{ color: 'rgba(64,133,106,0.6)' }}>{traceRef}</span>
    </div>
  );
}

const NODE_COLORS: Record<string, string> = {
  entity: '#4a7dc8',
  person: '#c8a060',
  property: '#40856a',
  lender: '#c04a2a',
};

const NODE_ICONS: Record<string, typeof Building2> = {
  entity: Building2,
  person: User,
  property: Landmark,
  lender: Shield,
};

function UnresolvedOwnerBadge() {
  return (
    <span
      className="group relative inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-mono cursor-default select-none"
      style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.25)', color: '#94a3b8' }}
    >
      <HelpCircle className="w-2.5 h-2.5 flex-shrink-0" />
      Unresolved owner
      <span
        className="pointer-events-none absolute bottom-full left-0 mb-1.5 w-52 rounded-lg px-2.5 py-2 text-[10px] leading-snug opacity-0 group-hover:opacity-100 transition-opacity z-10"
        style={{
          background: '#0e1117',
          border: '1px solid rgba(148,163,184,0.2)',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <span className="font-semibold" style={{ color: '#94a3b8' }}>Placeholder entity.</span>{' '}
        The beneficial owner of this node could not be resolved from registry data. Ownership
        attribution is low confidence and should be verified against primary sources.
      </span>
    </span>
  );
}

function NodeCard({
  node,
  selected,
  onSelect,
}: {
  node: any;
  selected: boolean;
  onSelect: () => void;
}) {
  const isUnresolved = node.riskFlag === 'unresolved_owner';
  const color = isUnresolved ? '#64748b' : (NODE_COLORS[node.type] ?? '#64748b');
  const Icon = NODE_ICONS[node.type] ?? Building2;
  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-lg p-3 transition-all"
      style={{
        background: isUnresolved
          ? selected
            ? 'rgba(148,163,184,0.08)'
            : 'rgba(148,163,184,0.03)'
          : selected
            ? `${color}18`
            : 'rgba(255,255,255,0.02)',
        border: isUnresolved
          ? `1px dashed ${selected ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.18)'}`
          : `1px solid ${selected ? `${color}50` : 'rgba(255,255,255,0.06)'}`,
        opacity: isUnresolved ? 0.8 : 1,
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="p-1.5 rounded-md flex-shrink-0"
          style={{ background: isUnresolved ? 'rgba(148,163,184,0.08)' : `${color}20` }}
        >
          {isUnresolved ? (
            <HelpCircle className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
          ) : (
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-medium truncate"
              style={{ color: isUnresolved ? '#94a3b8' : '#e8edf8' }}
            >
              {node.label}
            </span>
            {isUnresolved && <UnresolvedOwnerBadge />}
            {node.riskFlag && !isUnresolved && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                style={{ background: '#c04a2a20', color: '#c04a2a' }}
              >
                {node.riskFlag}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[9px] uppercase tracking-wider font-mono"
              style={{ color: isUnresolved ? 'rgba(148,163,184,0.5)' : `${color}80` }}
            >
              {node.type}
            </span>
            {node.ownershipPct != null && (
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {node.ownershipPct}% ownership
              </span>
            )}
            {node.loanAmount != null && (
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                ${(node.loanAmount / 1e6).toFixed(1)}M · LTV {(node.ltv * 100).toFixed(1)}%
              </span>
            )}
          </div>
          {node.jurisdiction && (
            <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {node.jurisdiction}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function EdgeRow({ edge, nodes }: { edge: any; nodes: any[] }) {
  const fromNode = nodes.find((n) => n.id === edge.from);
  const toNode = nodes.find((n) => n.id === edge.to);
  return (
    <div
      className="flex items-center gap-2 text-[10px] py-1.5 border-b"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      <span className="font-medium truncate max-w-[120px]" style={{ color: '#e8edf8' }}>
        {fromNode?.label ?? edge.from}
      </span>
      <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
      <span
        className="font-mono px-1.5 py-0.5 rounded text-[9px]"
        style={{ background: 'rgba(255,255,255,0.05)', color: ACCENT }}
      >
        {edge.label}
      </span>
      <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
      <span className="font-medium truncate max-w-[120px]" style={{ color: '#e8edf8' }}>
        {toNode?.label ?? edge.to}
      </span>
      <span className="ml-auto font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {(edge.weight * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default function OwnershipGraphPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const { data, isLoading, refetch } = useStandardQuery({
    queryKey: ['terra-ownership-graph'],
    queryFn: () => fetchOwnershipGraph(),
  });

  const graph = data?.graph;
  const nodes: any[] = graph?.nodes ?? [];
  const edges: any[] = graph?.edges ?? [];
  const prov = data?.provenance;
  const summary = data?.summary;
  const riskFlags = data?.riskFlags ?? [];
  const selNode = nodes.find((n) => n.id === selectedNode);

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-4 h-4" style={{ color: ACCENT }} />
            <h1 className="text-xl font-semibold" style={{ color: '#e8edf8' }}>
              Ownership Graph
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Entity-level ownership map with beneficial owner resolution, lien stack, and risk flags
            — backed by CONSTELLATION.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Graph
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Entity Nodes ({nodes.length})
                </div>
                {nodes.some((n) => n.riskFlag === 'unresolved_owner') && (
                  <div className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: '#64748b' }}>
                    <span
                      className="inline-block w-3 border-t"
                      style={{ borderStyle: 'dashed', borderColor: 'rgba(148,163,184,0.35)' }}
                    />
                    <HelpCircle className="w-2.5 h-2.5" />
                    <span>
                      {nodes.filter((n) => n.riskFlag === 'unresolved_owner').length} unresolved owner
                      {nodes.filter((n) => n.riskFlag === 'unresolved_owner').length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    selected={selectedNode === node.id}
                    onSelect={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  />
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="text-xs font-semibold mb-3 uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Relationships ({edges.length})
              </div>
              {edges.map((edge) => (
                <EdgeRow key={edge.id} edge={edge} nodes={nodes} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {summary && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="text-xs font-semibold mb-3 uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Summary
                </div>
                <div className="space-y-2">
                  {(
                    [
                      { label: 'Total Entities', value: summary.totalEntities, warn: false, dim: false },
                      {
                        label: 'Offshore Vehicles',
                        value: summary.offshoreVehicles,
                        warn: summary.offshoreVehicles > 0,
                        dim: false,
                      },
                      {
                        label: 'Unresolved Owners',
                        value: summary.unresolvedOwners ?? 0,
                        warn: (summary.unresolvedOwners ?? 0) > 0,
                        dim: true,
                      },
                      { label: 'Total Debt', value: `$${(summary.totalDebt / 1e6).toFixed(1)}M`, warn: false, dim: false },
                      {
                        label: 'Combined LTV',
                        value:
                          summary.combinedLtv != null
                            ? `${(summary.combinedLtv * 100).toFixed(1)}%`
                            : 'N/A',
                        warn: (summary.combinedLtv ?? 0) > 0.75,
                        dim: false,
                      },
                    ] as { label: string; value: string | number; warn: boolean; dim: boolean }[]
                  ).map((r) => (
                    <div
                      key={r.label}
                      className="flex justify-between items-center text-xs py-1.5 border-b"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                    >
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {r.label}
                        {r.label === 'Unresolved Owners' && r.warn && (
                          <HelpCircle
                            className="inline w-2.5 h-2.5 ml-1 -mt-0.5"
                            style={{ color: '#64748b' }}
                          />
                        )}
                      </span>
                      <span
                        className="font-semibold font-mono"
                        style={{
                          color: r.dim
                            ? r.warn
                              ? '#94a3b8'
                              : 'rgba(255,255,255,0.3)'
                            : r.warn
                              ? '#c8a060'
                              : '#e8edf8',
                        }}
                      >
                        {String(r.value)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div
                    className="text-[10px] font-semibold mb-2 uppercase tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    Ultimate Beneficial Owners
                  </div>
                  {(summary.ultimateBeneficialOwners ?? []).map((ubo: any) => (
                    <div key={ubo.id} className="flex items-center gap-2 py-1">
                      <User className="w-3 h-3" style={{ color: '#c8a060' }} />
                      <span className="text-xs" style={{ color: '#e8edf8' }}>
                        {ubo.name}
                      </span>
                      <span
                        className="ml-auto text-[10px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        {ubo.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {riskFlags.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(192,74,42,0.04)',
                  border: '1px solid rgba(192,74,42,0.15)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#c04a2a' }} />
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#c04a2a' }}
                  >
                    Risk Flags ({riskFlags.length})
                  </span>
                </div>
                {riskFlags.map((f: any, i: number) => (
                  <div
                    key={i}
                    className="text-xs py-2 border-b"
                    style={{ borderColor: 'rgba(192,74,42,0.1)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    <span className="font-medium" style={{ color: '#e8edf8' }}>
                      {f.entity}
                    </span>
                    <span
                      className="ml-2 text-[9px] px-1.5 py-0.5 rounded font-mono"
                      style={{ background: '#c04a2a20', color: '#c04a2a' }}
                    >
                      {f.flag}
                    </span>
                    <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Severity: {f.severity}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selNode && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${NODE_COLORS[selNode.type] ?? '#64748b'}30`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-3.5 h-3.5" style={{ color: NODE_COLORS[selNode.type] }} />
                  <span className="text-xs font-semibold" style={{ color: '#e8edf8' }}>
                    Node Detail
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  {Object.entries(selNode)
                    .filter(([k]) => !['id', 'riskFlag'].includes(k))
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                        <span className="font-mono" style={{ color: '#e8edf8' }}>
                          {String(v)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {prov && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Provenance
                  </span>
                  <ConfidencePill value={prov.confidence} />
                </div>
                <ProvenanceTag source={prov.source} traceRef={prov.traceRef} />
                <div className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {prov.runtime} · {new Date(prov.generatedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
