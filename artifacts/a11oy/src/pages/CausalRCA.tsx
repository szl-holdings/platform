import { useState, useEffect } from 'react';

interface CausalNode {
  id: string;
  service: string;
  metric: string;
  value: number;
  baseline: number;
  deviation: number;
  isRootCause: boolean;
  confidence: number;
  depth: number;
  children: string[];
}

interface CausalIncident {
  id: string;
  timestamp: number;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'investigating' | 'root-caused' | 'remediating' | 'resolved';
  rootCause: string;
  affectedServices: string[];
  causalChain: CausalNode[];
  mttrMs: number;
  counterfactuals: string[];
}

const SERVICES = ['checkout', 'auth', 'inventory', 'payments', 'notifications', 'search', 'cdn', 'postgres', 'redis', 'kafka'] as const;

function generateIncidents(): CausalIncident[] {
  const now = Date.now();
  return [
    {
      id: 'ci-1',
      timestamp: now - 300000,
      title: 'Checkout latency spike — 5x above p99 baseline',
      severity: 'critical',
      status: 'root-caused',
      rootCause: 'PostgreSQL connection pool exhaustion caused by leaked connections in payments service',
      affectedServices: ['checkout', 'payments', 'postgres'],
      causalChain: [
        { id: 'cn-1', service: 'postgres', metric: 'pg.connections.active', value: 95, baseline: 40, deviation: 137.5, isRootCause: true, confidence: 0.94, depth: 0, children: ['cn-2'] },
        { id: 'cn-2', service: 'payments', metric: 'http.request.duration_p99', value: 2400, baseline: 150, deviation: 1500, isRootCause: false, confidence: 0.88, depth: 1, children: ['cn-3'] },
        { id: 'cn-3', service: 'checkout', metric: 'http.request.duration_p99', value: 3200, baseline: 200, deviation: 1500, isRootCause: false, confidence: 0.91, depth: 2, children: [] },
      ],
      mttrMs: 180000,
      counterfactuals: [
        'If pg.connections.max increased to 200, predicted latency impact: -85%',
        'If payments service connection pooling fixed, predicted p99: ~180ms',
        'If read replicas active, predicted checkout impact: negligible',
      ],
    },
    {
      id: 'ci-2',
      timestamp: now - 1800000,
      title: 'Auth service error rate surge — 12% of requests failing',
      severity: 'high',
      status: 'resolved',
      rootCause: 'Redis primary node memory pressure causing eviction of session tokens',
      affectedServices: ['auth', 'redis', 'checkout', 'search'],
      causalChain: [
        { id: 'cn-4', service: 'redis', metric: 'redis.memory.used_percent', value: 98, baseline: 65, deviation: 50.8, isRootCause: true, confidence: 0.91, depth: 0, children: ['cn-5'] },
        { id: 'cn-5', service: 'auth', metric: 'http.error_rate', value: 12.3, baseline: 0.1, deviation: 12200, isRootCause: false, confidence: 0.87, depth: 1, children: ['cn-6', 'cn-7'] },
        { id: 'cn-6', service: 'checkout', metric: 'http.error_rate', value: 8.1, baseline: 0.05, deviation: 16100, isRootCause: false, confidence: 0.83, depth: 2, children: [] },
        { id: 'cn-7', service: 'search', metric: 'http.error_rate', value: 3.2, baseline: 0.1, deviation: 3100, isRootCause: false, confidence: 0.79, depth: 2, children: [] },
      ],
      mttrMs: 420000,
      counterfactuals: [
        'If redis.maxmemory increased 2x, predicted memory: 49% (safe)',
        'If session TTL reduced from 24h to 4h, predicted eviction rate: 0%',
        'If auth fallback to DB-backed sessions, predicted error rate: 0.3%',
      ],
    },
    {
      id: 'ci-3',
      timestamp: now - 7200000,
      title: 'Kafka consumer lag causing stale inventory data',
      severity: 'medium',
      status: 'resolved',
      rootCause: 'Consumer group rebalance storm due to aggressive session timeout (10s)',
      affectedServices: ['kafka', 'inventory', 'search'],
      causalChain: [
        { id: 'cn-8', service: 'kafka', metric: 'kafka.consumer.rebalance_rate', value: 14, baseline: 0.1, deviation: 13900, isRootCause: true, confidence: 0.89, depth: 0, children: ['cn-9'] },
        { id: 'cn-9', service: 'inventory', metric: 'kafka.consumer.lag', value: 45000, baseline: 200, deviation: 22400, isRootCause: false, confidence: 0.86, depth: 1, children: ['cn-10'] },
        { id: 'cn-10', service: 'search', metric: 'search.stale_results_ratio', value: 8.5, baseline: 0.1, deviation: 8400, isRootCause: false, confidence: 0.82, depth: 2, children: [] },
      ],
      mttrMs: 300000,
      counterfactuals: [
        'If session.timeout.ms increased to 45s, predicted rebalance rate: 0.2/min',
        'If consumer instances scaled from 4 to 8, predicted lag: < 500',
        'If partition count increased, predicted throughput: +150%',
      ],
    },
  ];
}

function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500' };
  return <div className={`w-2 h-2 rounded-full ${colors[severity] || colors.low} ${severity === 'critical' ? 'animate-pulse' : ''}`} />;
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    investigating: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'root-caused': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    remediating: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
  };
  return <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border uppercase ${colors[status] || ''}`}>{status}</span>;
}

export function CausalRCA() {
  const [incidents, setIncidents] = useState<CausalIncident[]>([]);
  const [selected, setSelected] = useState<CausalIncident | null>(null);

  useEffect(() => {
    const inc = generateIncidents();
    setIncidents(inc);
    setSelected(inc[0]);
  }, []);

  const avgMttr = incidents.length ? Math.round(incidents.reduce((s, x) => s + x.mttrMs, 0) / incidents.length / 60000) : 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#f5f5f5]/40 mb-1">A11OY · INTELLIGENCE · CAUSAL RCA</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">Causal Root-Cause Analysis</h1>
        <p className="text-sm text-[#f5f5f5]/50 mt-1 max-w-3xl">
          Structural causal models for incident diagnosis — inspired by Causely's causal reasoning
          platform. Encodes service dependency graphs as directed acyclic graphs (DAGs) to trace
          anomaly propagation and identify true root causes, not just symptoms.
          Counterfactual "what-if" analysis for remediation planning.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Incidents', value: incidents.filter(i => i.status !== 'resolved').length, color: '#ef4444' },
          { label: 'Avg MTTR', value: `${avgMttr}m`, color: '#06b6d4' },
          { label: 'Auto-Diagnosed', value: `${incidents.length}/${incidents.length}`, color: '#4ade80' },
          { label: 'Services Modeled', value: SERVICES.length, color: '#c9b787' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{kpi.label}</p>
            <p className="text-xl font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">Incidents</h2>
          </div>
          <div className="divide-y divide-white/[0.03] max-h-[500px] overflow-y-auto">
            {incidents.map(inc => (
              <button key={inc.id} type="button"
                className={`w-full text-left px-4 py-3 cursor-pointer transition-colors ${selected?.id === inc.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
                onClick={() => setSelected(inc)}>
                <div className="flex items-center gap-2 mb-1">
                  <SeverityDot severity={inc.severity} />
                  <StatusPill status={inc.status} />
                </div>
                <p className="text-xs font-bold text-white/80">{inc.title}</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {new Date(inc.timestamp).toLocaleTimeString()} · {inc.affectedServices.length} services
                </p>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <SeverityDot severity={selected.severity} />
                <h2 className="text-sm font-mono font-semibold text-white/80">{selected.title}</h2>
                <StatusPill status={selected.status} />
              </div>
              <div className="p-3 rounded bg-red-500/5 border border-red-500/10 mb-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-red-400/60 mb-1">ROOT CAUSE</p>
                <p className="text-xs text-white/70">{selected.rootCause}</p>
              </div>

              <h3 className="text-xs font-mono uppercase tracking-wider text-white/50 mb-3">Causal Chain (DAG)</h3>
              <div className="space-y-2">
                {selected.causalChain.map((node, i) => (
                  <div key={node.id} className="flex items-start gap-3" style={{ paddingLeft: node.depth * 24 }}>
                    {node.depth > 0 && (
                      <div className="flex items-center gap-1 text-white/15 flex-shrink-0">
                        <span className="text-[10px] font-mono">└→</span>
                      </div>
                    )}
                    <div className={`flex-1 p-3 rounded border ${node.isRootCause ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#c9b787]">{node.service}</span>
                          {node.isRootCause && (
                            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">ROOT CAUSE</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-white/30">{(node.confidence * 100).toFixed(0)}% confidence</span>
                      </div>
                      <p className="text-[10px] font-mono text-white/50 mt-1">
                        {node.metric}: <span className="text-white/70">{node.value}</span>
                        <span className="text-white/25"> (baseline: {node.baseline}, +{node.deviation.toFixed(0)}%)</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/50 mb-3">Counterfactual Analysis</h3>
              <p className="text-[10px] font-mono text-white/30 mb-3">What-if scenarios generated by causal structural model</p>
              <div className="space-y-2">
                {selected.counterfactuals.map((cf, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] font-mono text-purple-400 flex-shrink-0 mt-0.5">↳</span>
                    <p className="text-[11px] text-white/50">{cf}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
