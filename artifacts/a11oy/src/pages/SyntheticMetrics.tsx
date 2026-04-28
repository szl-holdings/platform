import { useState } from 'react';

interface SyntheticMetric {
  id: string;
  name: string;
  expression: string;
  source: 'logs' | 'traces' | 'events' | 'spans';
  computeMode: 'on-the-fly' | 'materialized' | 'streaming';
  lastValue: number;
  unit: string;
  costSavings: number;
  queryCount24h: number;
  latencyMs: number;
  createdBy: string;
}

interface LineageNode {
  id: string;
  type: 'metric' | 'log' | 'trace' | 'service' | 'slo';
  name: string;
  upstream: string[];
  downstream: string[];
}

const SYNTHETIC_METRICS: SyntheticMetric[] = [
  { id: 'sm-1', name: 'http.error_rate_5xx', expression: 'COUNT(logs WHERE status >= 500) / COUNT(logs WHERE path LIKE "/api/*") * 100', source: 'logs', computeMode: 'on-the-fly', lastValue: 2.3, unit: '%', costSavings: 840, queryCount24h: 1247, latencyMs: 12, createdBy: 'ops-team' },
  { id: 'sm-2', name: 'p99_checkout_latency', expression: 'PERCENTILE(spans.duration, 0.99) WHERE service = "checkout"', source: 'traces', computeMode: 'streaming', lastValue: 342, unit: 'ms', costSavings: 1200, queryCount24h: 892, latencyMs: 8, createdBy: 'platform-eng' },
  { id: 'sm-3', name: 'auth_failure_rate', expression: 'COUNT(events WHERE event_type = "auth.failure") / COUNT(events WHERE event_type LIKE "auth.*") * 100', source: 'events', computeMode: 'on-the-fly', lastValue: 0.8, unit: '%', costSavings: 560, queryCount24h: 2341, latencyMs: 15, createdBy: 'security' },
  { id: 'sm-4', name: 'db_slow_query_ratio', expression: 'COUNT(spans WHERE db.duration > 500ms) / COUNT(spans WHERE db.system IS NOT NULL) * 100', source: 'spans', computeMode: 'materialized', lastValue: 4.7, unit: '%', costSavings: 980, queryCount24h: 567, latencyMs: 3, createdBy: 'dba-team' },
  { id: 'sm-5', name: 'cache_hit_ratio', expression: '(COUNT(logs WHERE cache_result = "hit") / COUNT(logs WHERE cache_result IS NOT NULL)) * 100', source: 'logs', computeMode: 'streaming', lastValue: 94.2, unit: '%', costSavings: 720, queryCount24h: 3456, latencyMs: 5, createdBy: 'infra' },
  { id: 'sm-6', name: 'k8s_pod_restart_rate', expression: 'SUM(events.restart_count) WHERE k8s.namespace IN ("prod","staging") / INTERVAL(1h)', source: 'events', computeMode: 'on-the-fly', lastValue: 0.3, unit: '/hr', costSavings: 440, queryCount24h: 789, latencyMs: 18, createdBy: 'sre-team' },
  { id: 'sm-7', name: 'grpc_deadline_exceeded', expression: 'COUNT(spans WHERE grpc.status_code = 4) / COUNT(spans WHERE rpc.system = "grpc") * 100', source: 'spans', computeMode: 'streaming', lastValue: 1.1, unit: '%', costSavings: 650, queryCount24h: 1123, latencyMs: 7, createdBy: 'backend-eng' },
  { id: 'sm-8', name: 'business_order_value_p50', expression: 'PERCENTILE(logs.order_total, 0.50) WHERE service = "commerce"', source: 'logs', computeMode: 'materialized', lastValue: 67.50, unit: '$', costSavings: 1500, queryCount24h: 445, latencyMs: 22, createdBy: 'analytics' },
];

const LINEAGE_NODES: LineageNode[] = [
  { id: 'ln-1', type: 'log', name: 'nginx.access_log', upstream: [], downstream: ['ln-5', 'ln-6'] },
  { id: 'ln-2', type: 'trace', name: 'checkout.spans', upstream: [], downstream: ['ln-5', 'ln-7'] },
  { id: 'ln-3', type: 'service', name: 'auth-service', upstream: [], downstream: ['ln-6'] },
  { id: 'ln-4', type: 'log', name: 'postgres.slow_query_log', upstream: [], downstream: ['ln-7'] },
  { id: 'ln-5', type: 'metric', name: 'http.error_rate_5xx', upstream: ['ln-1', 'ln-2'], downstream: ['ln-8'] },
  { id: 'ln-6', type: 'metric', name: 'auth_failure_rate', upstream: ['ln-1', 'ln-3'], downstream: ['ln-8'] },
  { id: 'ln-7', type: 'metric', name: 'db_slow_query_ratio', upstream: ['ln-2', 'ln-4'], downstream: ['ln-9'] },
  { id: 'ln-8', type: 'slo', name: 'SLO: API Availability 99.9%', upstream: ['ln-5', 'ln-6'], downstream: [] },
  { id: 'ln-9', type: 'slo', name: 'SLO: DB Latency p99 < 200ms', upstream: ['ln-7'], downstream: [] },
];

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    logs: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    traces: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    events: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    spans: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };
  return <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border uppercase ${colors[source] || colors.logs}`}>{source}</span>;
}

function ModeBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    'on-the-fly': 'bg-green-500/10 text-green-400 border-green-500/20',
    materialized: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    streaming: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };
  return <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border ${colors[mode] || ''}`}>{mode}</span>;
}

export function SyntheticMetrics() {
  const totalSavings = SYNTHETIC_METRICS.reduce((s, m) => s + m.costSavings, 0);
  const totalQueries = SYNTHETIC_METRICS.reduce((s, m) => s + m.queryCount24h, 0);
  const avgLatency = Math.round(SYNTHETIC_METRICS.reduce((s, m) => s + m.latencyMs, 0) / SYNTHETIC_METRICS.length);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#f5f5f5]/40 mb-1">A11OY · OBSERVABILITY · SYNTHETIC METRICS</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">Synthetic Metrics Engine</h1>
        <p className="text-sm text-[#f5f5f5]/50 mt-1 max-w-3xl">
          Define metrics at query time from raw logs, traces, and events — no new instrumentation
          or ingestion required. Inspired by Dash0's synthetic metrics architecture.
          Every metric includes full lineage tracing back to its source telemetry.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Synthetic Metrics', value: SYNTHETIC_METRICS.length, color: '#06b6d4' },
          { label: 'Queries / 24h', value: totalQueries.toLocaleString(), color: '#a78bfa' },
          { label: 'Avg Latency', value: `${avgLatency}ms`, color: avgLatency > 15 ? '#fb923c' : '#4ade80' },
          { label: 'Cost Saved / mo', value: `$${totalSavings.toLocaleString()}`, color: '#4ade80' },
          { label: 'SLOs Tracked', value: LINEAGE_NODES.filter(n => n.type === 'slo').length, color: '#c9b787' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{kpi.label}</p>
            <p className="text-xl font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">Metric Registry</h2>
          <p className="text-[10px] font-mono text-white/30 mt-0.5">Click to inspect expression and lineage</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/30">
                <th className="text-left px-5 py-2 font-medium uppercase tracking-wider">Metric</th>
                <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Source</th>
                <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Mode</th>
                <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">Value</th>
                <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">Queries/24h</th>
                <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">Latency</th>
                <th className="text-right px-5 py-2 font-medium uppercase tracking-wider">Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {SYNTHETIC_METRICS.map(m => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-2">
                    <div>
                      <p className="font-bold text-white/80">{m.name}</p>
                      <p className="text-[10px] text-white/25 mt-0.5 max-w-sm truncate group-hover:whitespace-normal group-hover:text-white/40 transition-all">{m.expression}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2"><SourceBadge source={m.source} /></td>
                  <td className="px-3 py-2"><ModeBadge mode={m.computeMode} /></td>
                  <td className="px-3 py-2 text-right text-white/70">{m.lastValue}{m.unit}</td>
                  <td className="px-3 py-2 text-right text-white/50">{m.queryCount24h.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-white/50">{m.latencyMs}ms</td>
                  <td className="px-5 py-2 text-right text-green-400">${m.costSavings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70 mb-4">Metric Lineage Graph</h2>
          <p className="text-[10px] font-mono text-white/30 mb-4">Data source → Synthetic metric → SLO dependency chain</p>
          <div className="space-y-2">
            {LINEAGE_NODES.map(node => (
              <div key={node.id} className="flex items-center gap-3 p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 ${
                  node.type === 'log' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  node.type === 'trace' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                  node.type === 'service' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                  node.type === 'metric' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                  {node.type === 'log' ? 'LOG' : node.type === 'trace' ? 'TRC' : node.type === 'service' ? 'SVC' : node.type === 'metric' ? 'MET' : 'SLO'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white/70">{node.name}</p>
                  <p className="text-[10px] text-white/25">
                    {node.upstream.length > 0 && `← ${node.upstream.length} upstream`}
                    {node.upstream.length > 0 && node.downstream.length > 0 && ' · '}
                    {node.downstream.length > 0 && `→ ${node.downstream.length} downstream`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70 mb-4">SLO Automation Status</h2>
          <p className="text-[10px] font-mono text-white/30 mb-4">Automated SLO tracking via synthetic metric lineage</p>
          <div className="space-y-3">
            {LINEAGE_NODES.filter(n => n.type === 'slo').map(slo => {
              const budget = 95 + Math.random() * 4.9;
              const consumed = 10 + Math.random() * 80;
              return (
                <div key={slo.id} className="p-3 rounded bg-white/[0.02] border border-white/[0.04] space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white/80">{slo.name}</p>
                    <span className={`text-xs font-mono ${consumed < 70 ? 'text-green-400' : consumed < 90 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {consumed.toFixed(1)}% budget consumed
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${consumed}%`,
                      background: consumed < 70 ? '#4ade80' : consumed < 90 ? '#facc15' : '#ef4444',
                    }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/30">
                    <span>Target: {budget.toFixed(2)}%</span>
                    <span>{slo.upstream.length} contributing metrics</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded bg-white/[0.02] border border-white/[0.04]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-white/50 mb-2">Cost-Aware Monitoring</h3>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Synthetic metrics eliminate $
              {totalSavings.toLocaleString()}/month in ingestion costs by computing
              derived metrics on-the-fly from existing telemetry. Each metric shows per-query
              cost attribution and budget tracking against data usage plans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
