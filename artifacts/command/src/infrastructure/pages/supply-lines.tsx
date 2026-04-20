import { ClassificationBadge } from '@imp/components/classification-badge';
import { type Classification, getClassificationColor, SUPPLY_ROUTES } from '@imp/lib/imperium-data';
import { cn } from '@imp/lib/utils';
import { Activity, AlertTriangle, ArrowRight, Network, TrendingUp, Wifi, Zap } from 'lucide-react';
import React, { useState } from 'react';

function LatencyBar({ ms, max = 1500 }: { ms: number; max?: number }) {
  const pct = Math.min((ms / max) * 100, 100);
  const color = ms < 20 ? '#4ade80' : ms < 100 ? '#a3e635' : ms < 500 ? '#facc15' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-[10px] w-12 text-right" style={{ color }}>
        {ms}ms
      </span>
    </div>
  );
}

function ThroughputBar({ rps, max = 3500 }: { rps: number; max?: number }) {
  const pct = Math.min((rps / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: '#60a5fa' }}
        />
      </div>
      <span className="font-mono text-[10px] w-14 text-right text-blue-400">
        {rps.toLocaleString()} RPS
      </span>
    </div>
  );
}

function ErrorBadge({ rate }: { rate: number }) {
  const pct = (rate * 100).toFixed(2);
  const color =
    rate === 0 ? '#4ade80' : rate < 0.01 ? '#a3e635' : rate < 0.05 ? '#facc15' : '#ef4444';
  return (
    <span className="font-mono text-[10px]" style={{ color }}>
      {pct}%
    </span>
  );
}

function RouteCard({ route }: { route: (typeof SUPPLY_ROUTES)[0] }) {
  const [hover, setHover] = useState(false);
  const classColor = getClassificationColor(route.classification);
  const isSevered = route.status !== 'ACTIVE';

  return (
    <div
      className={cn(
        'imperial-card rounded-lg p-4 transition-all cursor-pointer',
        hover && 'border-gold/30',
        isSevered && 'border-red-900/50 bg-red-950/20',
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Route header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            backgroundColor: isSevered ? '#ef4444' : classColor,
            boxShadow: `0 0 6px ${isSevered ? '#ef4444' : classColor}80`,
          }}
        />
        <div className="flex-1 min-w-0 flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-200 truncate">{route.from}</span>
          <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
          <span className="font-semibold text-slate-200 truncate">{route.to}</span>
        </div>
        {isSevered && (
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
        )}
      </div>

      {/* Protocol */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] text-slate-500 bg-white/3 px-2 py-0.5 rounded">
          {route.protocol}
        </span>
        <ClassificationBadge classification={route.classification} size="xs" />
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
          <span>Latency</span>
          <span>Throughput</span>
          <span>Error Rate</span>
        </div>
        <div className="grid grid-cols-3 gap-2 items-center">
          <div>
            <LatencyBar ms={route.latencyMs} />
          </div>
          <div>
            <ThroughputBar rps={route.throughputRps} />
          </div>
          <div className="flex justify-end">
            <ErrorBadge rate={route.errorRate} />
          </div>
        </div>
      </div>

      {/* Severed alert */}
      {isSevered && (
        <div className="mt-3 px-3 py-2 rounded bg-red-950/40 border border-red-900/40">
          <div className="text-[10px] font-mono text-red-400 font-bold tracking-widest">
            ⚠ SUPPLY LINE SEVERED — PARTITION DETECTED
          </div>
        </div>
      )}
    </div>
  );
}

function TopologyDiagram() {
  const nodes = [
    { id: 'fd', label: 'Front Door', sub: 'szlholdings.com', x: 50, y: 5, color: '#c9a227' },
    { id: 'api', label: 'Container App', sub: 'API Server', x: 50, y: 35, color: '#60a5fa' },
    { id: 'pg', label: 'PostgreSQL', sub: 'Private VNet', x: 20, y: 65, color: '#f87171' },
    { id: 'redis', label: 'Redis Cache', sub: 'Private Endpoint', x: 45, y: 65, color: '#fb923c' },
    { id: 'kv', label: 'Key Vault', sub: 'Security Perimeter', x: 70, y: 65, color: '#c9a227' },
    { id: 'swa', label: 'Static Web Apps', sub: '×18 apps', x: 82, y: 35, color: '#4ade80' },
    { id: 'sb', label: 'Service Bus', sub: '9 queues', x: 20, y: 35, color: '#a78bfa' },
  ];

  const edges = [
    { from: 'fd', to: 'api' },
    { from: 'fd', to: 'swa' },
    { from: 'api', to: 'pg' },
    { from: 'api', to: 'redis' },
    { from: 'api', to: 'kv' },
    { from: 'api', to: 'sb' },
  ];

  return (
    <div className="imperial-card rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4" style={{ color: '#c9a227' }} />
        <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">
          Supply Route Topology
        </span>
      </div>
      <div className="relative w-full" style={{ paddingBottom: '50%', minHeight: '200px' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 75">
          {/* Edges */}
          {edges.map((e) => {
            const from = nodes.find((n) => n.id === e.from)!;
            const to = nodes.find((n) => n.id === e.to)!;
            return (
              <line
                key={`${e.from}-${e.to}`}
                x1={from.x}
                y1={from.y + 4}
                x2={to.x}
                y2={to.y - 1}
                stroke="rgba(201,162,39,0.2)"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            );
          })}
          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="4"
                fill={`${node.color}25`}
                stroke={node.color}
                strokeWidth="0.5"
              />
              <text
                x={node.x}
                y={node.y + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="2"
                fill={node.color}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {node.label.slice(0, 4).toUpperCase()}
              </text>
              <text
                x={node.x}
                y={node.y + 6}
                textAnchor="middle"
                fontSize="1.8"
                fill="rgba(148,163,184,0.6)"
                fontFamily="monospace"
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function SupplyLines() {
  const severed = SUPPLY_ROUTES.filter((r) => r.status !== 'ACTIVE');
  const active = SUPPLY_ROUTES.filter((r) => r.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Network className="w-5 h-5" style={{ color: '#c9a227' }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Network Topology
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Network topology — data flows rendered as service mesh routes with live latency/throughput
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Routes', value: active.length, color: '#4ade80', icon: Wifi },
          {
            label: 'Severed Lines',
            value: severed.length,
            color: severed.length > 0 ? '#ef4444' : '#4ade80',
            icon: AlertTriangle,
          },
          {
            label: 'Total Throughput',
            value: `${(SUPPLY_ROUTES.reduce((a, r) => a + r.throughputRps, 0) / 1000).toFixed(1)}K RPS`,
            color: '#60a5fa',
            icon: TrendingUp,
          },
          {
            label: 'Avg Latency',
            value: `${Math.round(SUPPLY_ROUTES.filter((r) => r.latencyMs < 500).reduce((a, r) => a + r.latencyMs, 0) / active.length)}ms`,
            color: '#c9a227',
            icon: Activity,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="imperial-card rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="font-mono text-xl font-bold" style={{ color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <TopologyDiagram />

      {/* Severed lines alert */}
      {severed.length > 0 && (
        <div className="rounded-lg p-3 border border-red-900/50 bg-red-950/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="font-display text-xs tracking-[0.15em] text-red-400 uppercase">
              {severed.length} Supply Line{severed.length > 1 ? 's' : ''} Severed
            </span>
          </div>
          {severed.map((r) => (
            <div key={r.id} className="text-xs text-red-300">
              {r.from} → {r.to}
            </div>
          ))}
        </div>
      )}

      {/* Route cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="w-4 h-4" style={{ color: '#c9a227' }} />
          <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">
            All Supply Routes ({SUPPLY_ROUTES.length})
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SUPPLY_ROUTES.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      </div>
    </div>
  );
}
