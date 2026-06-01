import { useState } from 'react';

interface OacResource {
  id: string;
  kind: string;
  name: string;
  namespace: string;
  version: number;
  status: 'synced' | 'drifted' | 'pending' | 'error';
  lastApplied: number;
  source: 'terraform' | 'yaml' | 'api' | 'ui';
  spec: string;
}

interface AuditEntry {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  resource: string;
  diff: string;
}

const RESOURCES: OacResource[] = [
  {
    id: 'oac-1', kind: 'Monitor', name: 'api-latency-p99', namespace: 'production',
    version: 12, status: 'synced', lastApplied: Date.now() - 3600000, source: 'terraform',
    spec: `resource "a11oy_monitor" "api_latency_p99" {\n  name      = "API Latency P99"\n  query     = "avg:http.request.duration{service:api}.p99"\n  threshold = 500\n  window    = "5m"\n  severity  = "critical"\n  notify    = ["#ops-alerts", "pagerduty:api-team"]\n}`,
  },
  {
    id: 'oac-2', kind: 'Dashboard', name: 'sre-golden-signals', namespace: 'production',
    version: 8, status: 'synced', lastApplied: Date.now() - 7200000, source: 'yaml',
    spec: `apiVersion: a11oy.io/v1\nkind: Dashboard\nmetadata:\n  name: sre-golden-signals\n  namespace: production\nspec:\n  panels:\n    - title: Latency\n      query: "avg:http.request.duration{env:prod}"\n    - title: Traffic\n      query: "sum:http.request.count{env:prod}"\n    - title: Errors\n      query: "sum:http.error.count{env:prod}"\n    - title: Saturation\n      query: "avg:system.cpu.percent{env:prod}"`,
  },
  {
    id: 'oac-3', kind: 'SLO', name: 'checkout-availability', namespace: 'production',
    version: 5, status: 'synced', lastApplied: Date.now() - 86400000, source: 'terraform',
    spec: `resource "a11oy_slo" "checkout_avail" {\n  name        = "Checkout Availability"\n  target      = 99.95\n  window      = "30d"\n  good_events = "count:http.request{service:checkout,status:2xx}"\n  total_events = "count:http.request{service:checkout}"\n  burn_alert {\n    fast_burn = { threshold = 14.4, window = "1h" }\n    slow_burn = { threshold = 6, window = "6h" }\n  }\n}`,
  },
  {
    id: 'oac-4', kind: 'Workflow', name: 'pod-crash-recovery', namespace: 'production',
    version: 3, status: 'drifted', lastApplied: Date.now() - 172800000, source: 'yaml',
    spec: `apiVersion: a11oy.io/v1\nkind: HealingWorkflow\nmetadata:\n  name: pod-crash-recovery\nspec:\n  trigger:\n    metric: container.restart_count\n    condition: "> 3 within 5m"\n  actions:\n    - capture_logs\n    - analyze_oom\n    - scale_memory\n    - restart_deployment\n  verification:\n    metric: container.restart_count\n    condition: "= 0 for 5m"`,
  },
  {
    id: 'oac-5', kind: 'AlertRule', name: 'disk-space-critical', namespace: 'infrastructure',
    version: 6, status: 'synced', lastApplied: Date.now() - 14400000, source: 'api',
    spec: `{\n  "kind": "AlertRule",\n  "name": "disk-space-critical",\n  "query": "max:disk.used_percent{*} by {host}",\n  "threshold": 90,\n  "type": "threshold",\n  "severity": "high",\n  "escalation": {\n    "after": "15m",\n    "to": "pagerduty:infra-team"\n  }\n}`,
  },
  {
    id: 'oac-6', kind: 'SyntheticMetric', name: 'business-checkout-conversion', namespace: 'analytics',
    version: 2, status: 'synced', lastApplied: Date.now() - 28800000, source: 'terraform',
    spec: `resource "a11oy_synthetic_metric" "checkout_conv" {\n  name       = "checkout_conversion_rate"\n  expression = "COUNT(logs WHERE event=checkout.complete) / COUNT(logs WHERE event=checkout.start) * 100"\n  source     = "logs"\n  mode       = "streaming"\n  unit       = "%"\n}`,
  },
];

const AUDIT_LOG: AuditEntry[] = [
  { id: 'ae-1', timestamp: Date.now() - 1800000, actor: 'ci-pipeline', action: 'apply', resource: 'Monitor/api-latency-p99', diff: '+threshold = 500 (was 400)' },
  { id: 'ae-2', timestamp: Date.now() - 3600000, actor: 'sre-team', action: 'create', resource: 'SLO/checkout-availability', diff: '+target = 99.95%' },
  { id: 'ae-3', timestamp: Date.now() - 7200000, actor: 'terraform-cloud', action: 'apply', resource: 'Dashboard/sre-golden-signals', diff: '+panel: Saturation' },
  { id: 'ae-4', timestamp: Date.now() - 14400000, actor: 'api-user', action: 'update', resource: 'AlertRule/disk-space-critical', diff: '+escalation.after = 15m (was 30m)' },
  { id: 'ae-5', timestamp: Date.now() - 86400000, actor: 'ci-pipeline', action: 'plan', resource: 'Workflow/pod-crash-recovery', diff: 'drift detected: manual UI edit overrode spec' },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    synced: 'bg-green-500/10 text-green-400 border-green-500/20',
    drifted: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border uppercase ${colors[status] || ''}`}>{status}</span>;
}

function KindBadge({ kind }: { kind: string }) {
  const colors: Record<string, string> = {
    Monitor: 'text-blue-400',
    Dashboard: 'text-purple-400',
    SLO: 'text-green-400',
    Workflow: 'text-orange-400',
    AlertRule: 'text-red-400',
    SyntheticMetric: 'text-cyan-400',
  };
  return <span className={`text-[10px] font-mono font-bold ${colors[kind] || 'text-white/50'}`}>{kind}</span>;
}

export function ObservabilityAsCode() {
  const [selected, setSelected] = useState<OacResource | null>(RESOURCES[0]);
  const synced = RESOURCES.filter(r => r.status === 'synced').length;
  const drifted = RESOURCES.filter(r => r.status === 'drifted').length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#f5f5f5]/40 mb-1">A11OY · PLATFORM · OBSERVABILITY AS CODE</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">Observability as Code</h1>
        <p className="text-sm text-[#f5f5f5]/50 mt-1 max-w-3xl">
          Define monitors, dashboards, SLOs, healing workflows, and synthetic metrics declaratively
          via Terraform, YAML, or API. Full version control, drift detection, CI/CD integration,
          and audit trails. Your entire observability stack as reviewable, testable infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Resources', value: RESOURCES.length, color: '#06b6d4' },
          { label: 'Synced', value: synced, color: '#4ade80' },
          { label: 'Drifted', value: drifted, color: drifted > 0 ? '#fb923c' : '#4ade80' },
          { label: 'Providers', value: '3', color: '#a78bfa' },
          { label: 'Audit Events', value: AUDIT_LOG.length, color: '#c9b787' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{kpi.label}</p>
            <p className="text-xl font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">Resources</h2>
          </div>
          <div className="divide-y divide-white/[0.03] max-h-[500px] overflow-y-auto">
            {RESOURCES.map(res => (
              <button key={res.id} type="button"
                className={`w-full text-left px-4 py-3 cursor-pointer transition-colors ${selected?.id === res.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
                onClick={() => setSelected(res)}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <KindBadge kind={res.kind} />
                    <span className="text-xs font-mono font-bold text-white/80">{res.name}</span>
                  </div>
                  <StatusBadge status={res.status} />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-white/25">
                  <span>{res.namespace}</span>
                  <span>v{res.version}</span>
                  <span>{res.source}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
          {selected ? (
            <>
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <KindBadge kind={selected.kind} />
                  <span className="text-sm font-mono font-bold text-white/80">{selected.name}</span>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-white/30">
                  <span>v{selected.version}</span>
                  <span>via {selected.source}</span>
                </div>
              </div>
              <div className="p-4">
                <pre className="text-[11px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap bg-white/[0.02] rounded p-4 border border-white/[0.04] overflow-x-auto">
                  {selected.spec}
                </pre>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-white/30 text-sm font-mono">
              Select a resource to view its specification
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">Audit Trail</h2>
          <p className="text-[10px] font-mono text-white/30 mt-0.5">Every change tracked, versioned, and reviewable</p>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {AUDIT_LOG.map(entry => (
            <div key={entry.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-white/30 w-20 flex-shrink-0">
                  {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  entry.action === 'apply' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  entry.action === 'create' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  entry.action === 'update' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-orange-500/10 text-orange-400 border-orange-500/20'
                }`}>{entry.action}</span>
                <span className="text-xs font-mono text-white/60">{entry.resource}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-white/30">
                <span>{entry.actor}</span>
                <span className="text-white/20">{entry.diff}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
