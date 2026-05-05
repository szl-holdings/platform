import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Network,
  RefreshCw,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { MOCK_TOPOLOGY } from './data';
import { ECOSYSTEM_ACCENT } from './layout';
import type { TopologyData, TopologyNode } from './types';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const apiUrl = (path: string) => `${BASE}/api${path}`;

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url, { credentials: 'include' }).then((r) =>
    r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
  );
}

function GovernancePill({ status }: { status: string }) {
  const config =
    status === 'critical'
      ? { color: '#ef4444', label: 'CRITICAL' }
      : status === 'elevated'
        ? { color: '#f59e0b', label: 'ELEVATED' }
        : { color: '#22c55e', label: 'STANDARD' };
  return (
    <span
      className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase"
      style={{ background: `${config.color}18`, color: config.color, border: `1px solid ${config.color}30` }}
    >
      {config.label}
    </span>
  );
}

function PolictyTierPill({ tier }: { tier: string }) {
  const color =
    tier === 'critical'
      ? '#ef4444'
      : tier === 'operator-assisted'
        ? '#f59e0b'
        : '#22c55e';
  return (
    <span
      className="text-[8px] font-mono px-1.5 py-0.5 rounded"
      style={{ background: `${color}12`, color, border: `1px solid ${color}20` }}
    >
      {tier}
    </span>
  );
}

function NodeCard({
  node,
  isSelected,
  onClick,
}: {
  node: TopologyNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isGateway = node.kind === 'gateway';

  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg p-3 transition-all w-full"
      style={{
        background: isSelected
          ? `${node.color}10`
          : isGateway
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isSelected ? node.color + '40' : isGateway ? node.color + '20' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isSelected ? `0 0 0 1px ${node.color}20` : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: node.color }}
          />
          <span
            className="text-[10px] font-semibold leading-tight"
            style={{ color: isSelected ? node.color : 'rgba(255,255,255,0.85)' }}
          >
            {node.name}
          </span>
        </div>
        <GovernancePill status={node.governanceStatus} />
      </div>

      <p
        className="text-[9px] leading-relaxed mb-2.5 line-clamp-2"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        {node.description}
      </p>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-[8px] uppercase tracking-wide mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Tools
          </div>
          <div className="text-[11px] font-bold font-mono" style={{ color: node.color }}>
            {node.toolCount}
          </div>
        </div>
        <div>
          <div className="text-[8px] uppercase tracking-wide mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Calls/24h
          </div>
          <div className="text-[11px] font-bold font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {node.callsLast24h.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[8px] uppercase tracking-wide mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Avg ms
          </div>
          <div className="text-[11px] font-bold font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {node.avgLatencyMs != null ? node.avgLatencyMs : '—'}
          </div>
        </div>
      </div>
    </button>
  );
}

function NodeDetail({ node, onClose }: { node: TopologyNode; onClose: () => void }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: `${node.color}08`,
        border: `1px solid ${node.color}25`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: node.color }} />
            <span className="text-[12px] font-bold" style={{ color: node.color }}>
              {node.name}
            </span>
          </div>
          <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {node.description}
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-lg p-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="text-[8px] uppercase tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Governance
          </div>
          <GovernancePill status={node.governanceStatus} />
        </div>
        <div
          className="rounded-lg p-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="text-[8px] uppercase tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Policy Tier
          </div>
          <PolictyTierPill tier={node.policyTier} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Tools Exposed', value: String(node.toolCount), icon: Zap },
          { label: 'Calls (24h)', value: node.callsLast24h.toLocaleString(), icon: Activity },
          { label: 'Avg Latency', value: node.avgLatencyMs != null ? `${node.avgLatencyMs}ms` : '—', icon: Clock },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-lg p-2.5 flex flex-col gap-1"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-1">
                <Icon className="w-2.5 h-2.5" style={{ color: node.color }} />
                <span className="text-[8px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {stat.label}
                </span>
              </div>
              <span className="text-[13px] font-bold font-mono" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {stat.value}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="rounded-lg p-2.5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="text-[8px] uppercase tracking-wide mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Endpoint
        </div>
        <code className="text-[9px] font-mono" style={{ color: node.color }}>
          {node.endpoint}
        </code>
      </div>
    </div>
  );
}

function TopologyVisual({ nodes, onSelectNode }: {
  nodes: TopologyNode[];
  onSelectNode: (node: TopologyNode) => void;
}) {
  const gateway = nodes.find((n) => n.kind === 'gateway');
  const domains = nodes.filter((n) => n.kind === 'domain');

  if (!gateway) return null;

  // Simple radial layout: gateway in center, domains around it
  const cx = 50;
  const cy = 50;
  const radius = 35;

  const domainPositions = domains.map((_, i) => {
    const angle = (i / domains.length) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  return (
    <div className="relative w-full" style={{ paddingBottom: '60%' }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Edges from gateway to each domain */}
        {domains.map((domain, i) => {
          const pos = domainPositions[i];
          return (
            <line
              key={domain.id}
              x1={cx}
              y1={cy}
              x2={pos.x}
              y2={pos.y}
              stroke={domain.color}
              strokeWidth="0.3"
              strokeOpacity="0.3"
              strokeDasharray="1,1"
            />
          );
        })}

        {/* Domain nodes */}
        {domains.map((domain, i) => {
          const pos = domainPositions[i];
          return (
            <g
              key={domain.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectNode(domain)}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r="5"
                fill={domain.color}
                fillOpacity="0.15"
                stroke={domain.color}
                strokeWidth="0.4"
                strokeOpacity="0.6"
              />
              <circle cx={pos.x} cy={pos.y} r="1.5" fill={domain.color} fillOpacity="0.9" />
              <text
                x={pos.x}
                y={pos.y + 7.5}
                textAnchor="middle"
                fontSize="3"
                fill="rgba(255,255,255,0.6)"
                fontFamily="monospace"
              >
                {domain.domain.slice(0, 8)}
              </text>
            </g>
          );
        })}

        {/* Gateway node (center) */}
        <g style={{ cursor: 'pointer' }} onClick={() => onSelectNode(gateway)}>
          <circle
            cx={cx}
            cy={cy}
            r="8"
            fill={gateway.color}
            fillOpacity="0.12"
            stroke={gateway.color}
            strokeWidth="0.5"
            strokeOpacity="0.7"
          />
          <circle
            cx={cx}
            cy={cy}
            r="4"
            fill={gateway.color}
            fillOpacity="0.2"
            stroke={gateway.color}
            strokeWidth="0.3"
          />
          <circle cx={cx} cy={cy} r="2" fill={gateway.color} fillOpacity="0.9" />
          <text
            x={cx}
            y={cy + 11}
            textAnchor="middle"
            fontSize="2.8"
            fill={gateway.color}
            fontFamily="monospace"
            fontWeight="bold"
          >
            GATEWAY
          </text>
        </g>
      </svg>
    </div>
  );
}

export function TopologyMapPage() {
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<TopologyData>({
    queryKey: ['ecosystem', 'topology'],
    queryFn: () => fetchJson(apiUrl('/ecosystem/topology')),
    staleTime: 30_000,
    retry: 0,
  });

  const topology = data ?? (isError ? MOCK_TOPOLOGY : undefined);
  const nodes = topology?.nodes ?? [];
  const gateway = nodes.find((n) => n.kind === 'gateway');
  const domains = nodes.filter((n) => n.kind === 'domain');
  const totalTools = nodes.reduce((sum, n) => sum + n.toolCount, 0);
  const totalCalls = nodes.reduce((sum, n) => sum + n.callsLast24h, 0);

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'MCP Servers', value: String(nodes.length), color: ECOSYSTEM_ACCENT, icon: Network },
          { label: 'Tools Exposed', value: String(totalTools), color: '#22d3ee', icon: Zap },
          { label: 'Calls / 24h', value: totalCalls.toLocaleString(), color: '#8b7ac8', icon: Activity },
          {
            label: 'Governance',
            value: domains.filter((n) => n.governanceStatus !== 'standard').length > 0 ? 'ELEVATED' : 'NOMINAL',
            color: domains.filter((n) => n.governanceStatus !== 'standard').length > 0 ? '#f59e0b' : '#22c55e',
            icon: Shield,
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-lg p-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                style={{ background: `${kpi.color}12`, border: `1px solid ${kpi.color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <div>
                <div className="text-[8px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {kpi.label}
                </div>
                <div className="text-[14px] font-bold font-mono" style={{ color: kpi.color }}>
                  {isLoading ? '…' : kpi.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
          MCP Ecosystem Topology
        </h2>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-mono transition-all hover:opacity-80"
          style={{
            background: `${ECOSYSTEM_ACCENT}12`,
            border: `1px solid ${ECOSYSTEM_ACCENT}28`,
            color: ECOSYSTEM_ACCENT,
          }}
        >
          <RefreshCw className="w-2.5 h-2.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Visual topology */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-[9px] font-mono mb-4 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Click any node to inspect · Gateway in center · Domain servers radially arranged
          </p>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,162,39,0.25)', borderTopColor: ECOSYSTEM_ACCENT }} />
            </div>
          ) : (
            <TopologyVisual
              nodes={nodes}
              onSelectNode={(n) => setSelectedNode((prev) => (prev?.id === n.id ? null : n))}
            />
          )}
        </div>

        {/* Node detail / list */}
        <div className="flex flex-col gap-3">
          {selectedNode ? (
            <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
          ) : null}

          {/* Gateway highlight */}
          {gateway && (
            <NodeCard
              node={gateway}
              isSelected={selectedNode?.id === gateway.id}
              onClick={() => setSelectedNode((p) => (p?.id === gateway.id ? null : gateway))}
            />
          )}

          {/* Domain servers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {domains.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                onClick={() => setSelectedNode((p) => (p?.id === node.id ? null : node))}
              />
            ))}
          </div>
        </div>
      </div>

      {isError && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded text-[9px] font-mono"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}
        >
          <AlertTriangle className="w-3 h-3 shrink-0" />
          API unavailable — showing synthetic topology data. Connect to a live environment for real-time data.
        </div>
      )}
    </div>
  );
}
