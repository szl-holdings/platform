import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  ArrowRight,
  Brain,
  Cpu,
  Eye,
  Globe,
  Radio,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const NODES = [
  {
    id: 'aegis',
    name: 'Aegis Command',
    role: 'Defense & Intelligence',
    agent: 'Sentinel Engine',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    border: 'border-indigo-400/25',
    x: 50,
    y: 15,
    type: 'cortex',
  },
  {
    id: 'lyte',
    name: 'Lyte',
    role: 'Spinal Cord',
    agent: 'Intelligence Hub',
    color: 'text-[#d4a054]',
    bg: 'bg-[#d4a054]/10',
    border: 'border-[#d4a054]/20',
    x: 50,
    y: 50,
    type: 'hub',
  },
  {
    id: 'vessels',
    name: 'Vessels',
    role: 'Maritime Organ',
    agent: 'Maritime Analyst',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
    x: 17,
    y: 30,
    type: 'organ',
  },
  {
    id: 'msp',
    name: 'Aegis Operations',
    role: 'Managed Services Command',
    agent: 'IT Sentinel',
    color: 'text-[#c45a4a]',
    bg: 'bg-[#c45a4a]/10',
    border: 'border-[#c45a4a]/20',
    x: 5,
    y: 55,
    type: 'organ',
  },
  {
    id: 'terra',
    name: 'Terra',
    role: 'Real Estate Intelligence Organ',
    agent: 'Deal Scout',
    color: 'text-[#6b8f71]',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
    x: 17,
    y: 78,
    type: 'organ',
  },
  {
    id: 'alloy',
    name: 'Alloy',
    role: 'Orchestration Engine',
    agent: 'Intelligence Engine',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
    x: 38,
    y: 85,
    type: 'organ',
  },
  {
    id: 'carlota-jo',
    name: 'Carlota Jo',
    role: 'Advisory Organ',
    agent: 'Advisory Agent',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20',
    x: 62,
    y: 85,
    type: 'organ',
  },
  {
    id: 'szl-holdings',
    name: 'SZL Holdings',
    role: 'Portfolio Organ',
    agent: 'Portfolio Analyst',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    border: 'border-indigo-400/20',
    x: 83,
    y: 78,
    type: 'organ',
  },
  {
    id: 'stephen',
    name: 'Stephen',
    role: 'Brand Organ',
    agent: 'Brand Monitor',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
    x: 95,
    y: 55,
    type: 'organ',
  },
];

const CONNECTIONS = [
  { from: 'aegis', to: 'lyte', weight: 'high' },
  { from: 'lyte', to: 'aegis', weight: 'high' },
  { from: 'lyte', to: 'vessels', weight: 'medium' },
  { from: 'lyte', to: 'terra', weight: 'medium' },
  { from: 'lyte', to: 'alloy', weight: 'medium' },
  { from: 'lyte', to: 'carlota-jo', weight: 'medium' },
  { from: 'lyte', to: 'szl-holdings', weight: 'medium' },
  { from: 'lyte', to: 'stephen', weight: 'low' },
];

interface TrafficPacket {
  id: string;
  fromNode: string;
  toNode: string;
  progress: number;
  type: 'signal' | 'intelligence' | 'policy';
}

const AGENT_ACTIVITY: {
  time: string;
  app: string;
  agent: string;
  action: string;
  type: 'signal' | 'intelligence' | 'policy' | 'reflex';
}[] = [
  {
    time: 'now',
    app: 'Vessels',
    agent: 'Maritime Analyst',
    action: 'Dark vessel alert: MV Poseidon off Strait of Malacca',
    type: 'signal',
  },
  {
    time: '12s',
    app: 'SZL Cortex',
    agent: 'AI Engine',
    action: 'Spawning investigative sub-agent for maritime anomaly',
    type: 'intelligence',
  },
  {
    time: '28s',
    app: 'Command',
    agent: 'Policy Guard',
    action: 'Policy check passed for cross-domain data access',
    type: 'policy',
  },
  {
    time: '45s',
    app: 'Aegis Operations',
    agent: 'IT Sentinel',
    action: 'Auto-remediated memory leak — TKT-4821 closed',
    type: 'reflex',
  },
  {
    time: '1m',
    app: 'Terra',
    agent: 'Deal Scout',
    action: 'Off-market opportunity flagged: Brickell, Miami — $4.2M cap rate 7.1%',
    type: 'signal',
  },
  {
    time: '1m 20s',
    app: 'SZL Cortex',
    agent: 'AI Analyst',
    action: 'Q1 synthesis complete — 94% portfolio health, 3 risk vectors',
    type: 'intelligence',
  },
  {
    time: '2m',
    app: 'Alloy',
    agent: 'Creative Director',
    action: 'Campaign rebalance: +$12K to LinkedIn video segment',
    type: 'reflex',
  },
  {
    time: '2m 30s',
    app: 'Aegis SOC',
    agent: 'Security Sentinel LLM',
    action: 'Blocked external write — agent action escalated for review',
    type: 'policy',
  },
  {
    time: '3m',
    app: 'Carlota Jo',
    agent: 'Advisory Agent',
    action: 'Client briefing ready: Acme Portfolio Q1 2026',
    type: 'intelligence',
  },
  {
    time: '4m',
    app: 'SZL Holdings',
    agent: 'Portfolio Analyst',
    action: 'Health score update: ecosystem posture 87/100 → 89/100',
    type: 'signal',
  },
  {
    time: '5m',
    app: 'Stephen',
    agent: 'Brand Monitor',
    action: 'Reputation alert: negative tweet thread, 4.2K impressions',
    type: 'signal',
  },
];

const MESH_STATS = [
  { label: 'Active Nodes', value: '12', color: 'text-[#6b8f71]' },
  { label: 'Roads Online', value: '10', sub: 'connections', color: 'text-cyan-400' },
  { label: 'Signal Volume', value: '1,247/min', color: 'text-[#d4a054]' },
  { label: 'Avg Latency', value: '84ms', color: 'text-foreground' },
  { label: 'Agents Active', value: '9', color: 'text-violet-400' },
  { label: 'Mesh Health', value: '99.1%', color: 'text-[#6b8f71]' },
];

const TYPE_COLORS = {
  signal: 'text-[#d4a054] bg-[#d4a054]/10',
  intelligence: 'text-violet-400 bg-violet-400/10',
  policy: 'text-[#c8953c] bg-orange-400/10',
  reflex: 'text-[#6b8f71] bg-[#6b8f71]/10',
};

export default function IntelligenceMesh() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((k) => k + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const selectedNodeData = NODES.find((n) => n.id === selectedNode);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-bold text-white">Intelligence Mesh</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#d4a054]/20 text-[#d4a054] border border-[#d4a054]/30">
            Intelligence Mesh
          </span>
        </div>
        <p className="text-sm text-slate-400">
          The Intelligence Network — visualizing the signal mesh connecting all ecosystem apps. Each
          app is an organ, Lyte is the spinal cord, SZL Cortex is the brain.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {MESH_STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"
          >
            <p className={cn('text-2xl font-bold font-display', s.color)}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Network topology */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#d4a054]" />
          Empire Intelligence Mesh — Live Topology
        </h3>
        <div className="relative" style={{ paddingBottom: '56%', minHeight: 300 }}>
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient id="centerGlow">
                <stop offset="0%" stopColor="#d4a054" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#d4a054" stopOpacity="0" />
              </radialGradient>
              <filter id="nodeGlow">
                <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connection lines */}
            {CONNECTIONS.map((conn, i) => {
              const from = NODES.find((n) => n.id === conn.from);
              const to = NODES.find((n) => n.id === conn.to);
              if (!from || !to) return null;
              const isHighlighted = selectedNode === conn.from || selectedNode === conn.to;
              const weight = conn.weight === 'high' ? 0.8 : conn.weight === 'medium' ? 0.5 : 0.3;
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={isHighlighted ? '#d4a054' : '#334155'}
                  strokeWidth={isHighlighted ? weight * 1.5 : weight}
                  strokeDasharray={conn.weight === 'low' ? '2 2' : 'none'}
                  opacity={isHighlighted ? 0.9 : 0.5}
                />
              );
            })}

            {/* Traffic animation dots */}
            {(tick % 3 === 0
              ? CONNECTIONS.slice(0, 4)
              : tick % 3 === 1
                ? CONNECTIONS.slice(2, 6)
                : CONNECTIONS.slice(4, 8)
            ).map((conn, i) => {
              const from = NODES.find((n) => n.id === conn.from);
              const to = NODES.find((n) => n.id === conn.to);
              if (!from || !to) return null;
              const progress = (tick * 0.15 + i * 0.3) % 1;
              const px = from.x + (to.x - from.x) * progress;
              const py = from.y + (to.y - from.y) * progress;
              return <circle key={i} cx={px} cy={py} r="0.8" fill="#d4a054" opacity="0.8" />;
            })}

            {/* Nodes */}
            {NODES.map((node) => {
              const isSelected = selectedNode === node.id;
              const isHub = node.type === 'hub' || node.type === 'cortex';
              const r = node.type === 'cortex' ? 4.5 : node.type === 'hub' ? 3.5 : 2.5;
              const colors: Record<string, string> = {
                'text-[#d4a054]': '#d4a054',
                'text-[#c8953c]': '#c8953c',
                'text-[#c45a4a]': '#c45a4a',
                'text-cyan-400': '#22d3ee',
                'text-[#4a90b8]': '#4a90b8',
                'text-[#6b8f71]': '#6b8f71',
                'text-violet-400': '#a78bfa',
                'text-pink-400': '#f472b6',
                'text-indigo-400': '#818cf8',
                'text-rose-400': '#fb7185',
              };
              const color = colors[node.color] || '#94a3b8';
              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedNode(isSelected ? null : node.id)}
                >
                  {isSelected && (
                    <circle cx={node.x} cy={node.y} r={r + 2.5} fill={color} opacity="0.12" />
                  )}
                  {isHub && <circle cx={node.x} cy={node.y} r={r + 1} fill="url(#centerGlow)" />}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={color}
                    opacity={isSelected ? 1 : 0.75}
                    filter={isHub ? 'url(#nodeGlow)' : undefined}
                  />
                  <circle cx={node.x} cy={node.y} r={r * 0.5} fill="rgba(0,0,0,0.4)" />
                  <text
                    x={node.x}
                    y={node.y + r + 3}
                    textAnchor="middle"
                    fontSize="3.5"
                    fill="rgba(255,255,255,0.7)"
                    fontFamily="monospace"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected node detail */}
        {selectedNodeData && (
          <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  selectedNodeData.bg,
                )}
              >
                <Activity className={cn('w-4 h-4', selectedNodeData.color)} />
              </div>
              <div>
                <p className={cn('text-sm font-bold', selectedNodeData.color)}>
                  {selectedNodeData.name}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedNodeData.role} · Agent: {selectedNodeData.agent}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Connected to{' '}
              {
                CONNECTIONS.filter(
                  (c) => c.from === selectedNodeData.id || c.to === selectedNodeData.id,
                ).length
              }{' '}
              links in the intelligence network. Click another node to explore its connections.
            </p>
          </div>
        )}

        <div className="flex items-center gap-6 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-8 h-0.5 bg-[#d4a054]/60 inline-block rounded" />
            High traffic
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-8 h-0.5 bg-slate-600 inline-block rounded" />
            Normal traffic
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d4a054] inline-block" />
            Data packet in transit
          </span>
          <span className="flex items-center gap-1.5">Click a node to inspect it</span>
        </div>
      </div>

      {/* Agent Activity Feed */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#d4a054]" />
              Agent Activity Feed
              <span className="w-2 h-2 rounded-full bg-[#6b8f71] animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time stream of what the AI agents are doing across all ecosystem apps
            </p>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {AGENT_ACTIVITY.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="text-xs font-mono text-slate-500 w-12 shrink-0 mt-0.5">
                {item.time}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80">{item.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#d4a054]/70">{item.app}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-500">{item.agent}</span>
                </div>
              </div>
              <span
                className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0',
                  TYPE_COLORS[item.type],
                )}
              >
                {item.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
