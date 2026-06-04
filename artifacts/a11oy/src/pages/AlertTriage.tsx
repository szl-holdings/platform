import { useState, useEffect } from 'react';

interface TriagedAlert {
  id: string;
  timestamp: number;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  service: string;
  metric: string;
  mlScore: number;
  noiseScore: number;
  correlationGroup: string | null;
  explanation: string;
  suggestedAction: string;
  status: 'open' | 'acknowledged' | 'auto-resolved' | 'suppressed';
  causalContext: string;
}

function generateAlerts(): TriagedAlert[] {
  const now = Date.now();
  return [
    { id: 'ta-1', timestamp: now - 30000, title: 'CPU spike on checkout-service-7b4', severity: 'high', service: 'checkout', metric: 'cpu.system.percent', mlScore: 92, noiseScore: 8, correlationGroup: 'CG-001', explanation: 'Sustained CPU increase correlates with 3x traffic spike from marketing campaign launch. Pattern matches seasonal event-driven load.', suggestedAction: 'Auto-scale HPA target to 12 replicas', status: 'open', causalContext: 'Root cause: traffic surge from email campaign (10:00 UTC blast). Causal chain: email_click → checkout_page_load → cpu_spike.' },
    { id: 'ta-2', timestamp: now - 45000, title: 'HTTP 5xx rate above threshold', severity: 'critical', service: 'payments', metric: 'http.error_rate_5xx', mlScore: 97, noiseScore: 3, correlationGroup: 'CG-001', explanation: 'Error spike tied to upstream database connection saturation. Not an independent alert — correlated with CG-001 checkout CPU alert.', suggestedAction: 'Increase pg connection pool max_connections', status: 'open', causalContext: 'Root cause: pg.connections.active at 95% capacity. Payments service waiting for DB connections, timing out after 30s.' },
    { id: 'ta-3', timestamp: now - 120000, title: 'Redis memory above 90%', severity: 'medium', service: 'redis', metric: 'redis.memory.used_percent', mlScore: 74, noiseScore: 26, correlationGroup: null, explanation: 'Gradual memory growth over 48h. Toto forecaster predicts breach of 95% threshold in ~6 hours. Likely cache key accumulation without TTL.', suggestedAction: 'Audit keys without TTL; set default expiry policy', status: 'acknowledged', causalContext: 'Trend analysis: linear growth at 0.8%/hr. No upstream anomaly — internal cache policy issue.' },
    { id: 'ta-4', timestamp: now - 300000, title: 'DNS resolution latency spike', severity: 'low', service: 'cdn', metric: 'dns.resolution_time', mlScore: 31, noiseScore: 69, correlationGroup: null, explanation: 'Transient spike lasting 45 seconds. Pattern matches known ISP route flap noise. ML classifier: 69% probability of false positive.', suggestedAction: 'Suppress — noise pattern', status: 'suppressed', causalContext: 'No downstream impact detected. Historical: 12 similar events in past 30 days, all self-resolved.' },
    { id: 'ta-5', timestamp: now - 600000, title: 'Kafka consumer lag growing', severity: 'high', service: 'kafka', metric: 'kafka.consumer.lag', mlScore: 85, noiseScore: 15, correlationGroup: 'CG-002', explanation: 'Consumer group "inventory-sync" lagging. 2 of 4 consumers unhealthy after OOM kills. Self-healing workflow triggered.', suggestedAction: 'Self-healing in progress: restart consumers + scale', status: 'auto-resolved', causalContext: 'Root cause: memory limit too low for batch processing spike. Self-healing engine resolved in 3m 12s.' },
    { id: 'ta-6', timestamp: now - 900000, title: 'Auth token validation failures', severity: 'medium', service: 'auth', metric: 'auth.validation.failures', mlScore: 68, noiseScore: 32, correlationGroup: null, explanation: 'Spike in JWT validation failures from mobile clients. Clock skew detected on mobile app v3.2.1 builds.', suggestedAction: 'Add 30s clock skew tolerance to JWT validator', status: 'open', causalContext: 'Mobile app clock sync issue. Not a security threat — legitimate requests with slightly expired tokens.' },
    { id: 'ta-7', timestamp: now - 1200000, title: 'Search index replication delay', severity: 'low', service: 'search', metric: 'es.replication.lag_ms', mlScore: 42, noiseScore: 58, correlationGroup: null, explanation: 'Elasticsearch cross-cluster replication delayed by 800ms. Within acceptable bounds for search use case.', suggestedAction: 'Monitor — within SLO tolerance', status: 'suppressed', causalContext: 'Network congestion between us-east-1 and eu-west-1. Expected during peak hours.' },
    { id: 'ta-8', timestamp: now - 1500000, title: 'Notification service queue depth', severity: 'medium', service: 'notifications', metric: 'queue.depth', mlScore: 71, noiseScore: 29, correlationGroup: 'CG-001', explanation: 'Queue depth increase correlated with CG-001 traffic spike. Notifications are queued, not dropped. Will clear as traffic normalizes.', suggestedAction: 'No action — self-resolving with traffic normalization', status: 'acknowledged', causalContext: 'Downstream effect of marketing campaign surge. Queue is bounded, no data loss risk.' },
  ];
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-400 border-green-500/20',
  };
  return <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border uppercase ${colors[severity] || ''}`}>{severity}</span>;
}

function NoiseBar({ noise }: { noise: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${noise}%`, background: noise > 50 ? '#ef4444' : noise > 30 ? '#facc15' : '#4ade80' }} />
      </div>
      <span className="text-[10px] font-mono" style={{ color: noise > 50 ? '#ef4444' : noise > 30 ? '#facc15' : '#4ade80' }}>{noise}%</span>
    </div>
  );
}

export function AlertTriage() {
  const [alerts, setAlerts] = useState<TriagedAlert[]>([]);
  const [selected, setSelected] = useState<TriagedAlert | null>(null);

  useEffect(() => {
    const a = generateAlerts();
    setAlerts(a);
    setSelected(a[0]);
  }, []);

  const totalAlerts = alerts.length;
  const suppressed = alerts.filter(a => a.status === 'suppressed').length;
  const autoResolved = alerts.filter(a => a.status === 'auto-resolved').length;
  const correlationGroups = new Set(alerts.filter(a => a.correlationGroup).map(a => a.correlationGroup)).size;
  const noiseReduction = suppressed + autoResolved;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#f5f5f5]/40 mb-1">A11OY · INTELLIGENCE · ALERT TRIAGE</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">AI Alert Triage</h1>
        <p className="text-sm text-[#f5f5f5]/50 mt-1 max-w-3xl">
          ML-powered alert prioritization, noise suppression, and correlation grouping.
          Each alert includes causal context, LLM-generated explanation, and suggested
          remediation. Reduces alert fatigue by correlating related signals and suppressing
          known-noise patterns.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Alerts', value: totalAlerts, color: '#06b6d4' },
          { label: 'Noise Reduced', value: `${noiseReduction}/${totalAlerts}`, color: '#4ade80' },
          { label: 'Corr. Groups', value: correlationGroups, color: '#a78bfa' },
          { label: 'Auto-Resolved', value: autoResolved, color: '#4ade80' },
          { label: 'Suppressed', value: suppressed, color: '#facc15' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{kpi.label}</p>
            <p className="text-xl font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
          <div className="p-4 border-b border-white/[0.06] sticky top-0 bg-[#0a0a0f] z-10">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">Alert Queue</h2>
            <p className="text-[10px] font-mono text-white/30">Ranked by ML priority score</p>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {[...alerts].sort((a, b) => b.mlScore - a.mlScore).map(alert => (
              <button key={alert.id} type="button"
                className={`w-full text-left px-4 py-3 cursor-pointer transition-colors ${selected?.id === alert.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'} ${alert.status === 'suppressed' ? 'opacity-40' : ''}`}
                onClick={() => setSelected(alert)}>
                <div className="flex items-center justify-between mb-1">
                  <SeverityBadge severity={alert.severity} />
                  <div className="flex items-center gap-2">
                    {alert.correlationGroup && (
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">{alert.correlationGroup}</span>
                    )}
                    <span className={`text-[10px] font-mono ${alert.status === 'auto-resolved' ? 'text-green-400' : alert.status === 'suppressed' ? 'text-white/30' : 'text-white/50'}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs font-bold text-white/80 mb-1">{alert.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#c9b787]">{alert.service}</span>
                  <NoiseBar noise={alert.noiseScore} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <SeverityBadge severity={selected.severity} />
                <h2 className="text-sm font-mono font-bold text-white/80">{selected.title}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] font-mono text-white/30 mb-0.5">ML Priority</p>
                  <p className="text-lg font-mono font-bold" style={{ color: selected.mlScore > 80 ? '#ef4444' : selected.mlScore > 60 ? '#fb923c' : '#4ade80' }}>{selected.mlScore}</p>
                </div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] font-mono text-white/30 mb-0.5">Noise Probability</p>
                  <NoiseBar noise={selected.noiseScore} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1">AI Explanation</p>
                  <p className="text-[11px] text-white/60 leading-relaxed">{selected.explanation}</p>
                </div>
                <div className="p-3 rounded bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1">Causal Context</p>
                  <p className="text-[11px] text-white/60 leading-relaxed">{selected.causalContext}</p>
                </div>
                <div className="p-3 rounded bg-[#c9b787]/5 border border-[#c9b787]/10">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#c9b787]/60 mb-1">Suggested Action</p>
                  <p className="text-[11px] text-[#c9b787]/80 leading-relaxed">{selected.suggestedAction}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
