import { useState, useEffect } from 'react';

interface HealingWorkflow {
  id: string;
  name: string;
  trigger: string;
  phase: 'sense' | 'think' | 'act' | 'verify' | 'idle';
  status: 'active' | 'executing' | 'success' | 'failed' | 'cooldown';
  lastRun: number;
  executionCount: number;
  mttrReduction: number;
  autoResolved: number;
  totalIncidents: number;
  actions: string[];
}

interface RemediationEvent {
  id: string;
  timestamp: number;
  workflow: string;
  phase: 'sense' | 'think' | 'act' | 'verify';
  description: string;
  outcome: 'success' | 'failed' | 'pending';
  durationMs: number;
}

const WORKFLOWS: HealingWorkflow[] = [
  {
    id: 'hw-1', name: 'Pod Crash Loop Recovery', trigger: 'container.restart_count > 3 within 5m',
    phase: 'idle', status: 'active', lastRun: Date.now() - 1200000, executionCount: 47,
    mttrReduction: 89, autoResolved: 42, totalIncidents: 47,
    actions: ['Capture pod logs', 'Analyze OOMKilled vs CrashBackoff', 'Scale memory limits', 'Restart deployment'],
  },
  {
    id: 'hw-2', name: 'High Latency Auto-Scale', trigger: 'http.request.duration_p99 > 500ms for 3m',
    phase: 'sense', status: 'executing', lastRun: Date.now() - 60000, executionCount: 23,
    mttrReduction: 76, autoResolved: 19, totalIncidents: 23,
    actions: ['Validate latency spike pattern', 'Check HPA status', 'Scale replicas +2', 'Verify latency drop'],
  },
  {
    id: 'hw-3', name: 'DB Connection Pool Exhaustion', trigger: 'pg.connections.active / pg.connections.max > 0.9',
    phase: 'idle', status: 'active', lastRun: Date.now() - 3600000, executionCount: 12,
    mttrReduction: 94, autoResolved: 11, totalIncidents: 12,
    actions: ['Kill idle connections', 'Increase pool max', 'Alert if > 95%', 'Failover to read replica'],
  },
  {
    id: 'hw-4', name: 'Certificate Expiry Prevention', trigger: 'tls.cert.days_remaining < 14',
    phase: 'idle', status: 'active', lastRun: Date.now() - 86400000, executionCount: 8,
    mttrReduction: 100, autoResolved: 8, totalIncidents: 8,
    actions: ['Request cert renewal via ACME', 'Validate new cert', 'Deploy to ingress', 'Verify TLS handshake'],
  },
  {
    id: 'hw-5', name: 'Kafka Consumer Lag Recovery', trigger: 'kafka.consumer.lag > 10000 for 5m',
    phase: 'think', status: 'executing', lastRun: Date.now() - 30000, executionCount: 31,
    mttrReduction: 82, autoResolved: 26, totalIncidents: 31,
    actions: ['Assess consumer group health', 'Reset offsets if stuck', 'Scale consumer instances', 'Verify lag decrease'],
  },
  {
    id: 'hw-6', name: 'Disk Space Critical', trigger: 'disk.used_percent > 90',
    phase: 'idle', status: 'active', lastRun: Date.now() - 7200000, executionCount: 19,
    mttrReduction: 71, autoResolved: 14, totalIncidents: 19,
    actions: ['Clean old logs/tmp files', 'Archive cold data to S3', 'Expand volume if EBS', 'Alert if still > 85%'],
  },
];

function generateEvents(): RemediationEvent[] {
  const now = Date.now();
  return Array.from({ length: 16 }, (_, i) => ({
    id: `re-${i}`,
    timestamp: now - i * 45000 - Math.floor(Math.random() * 10000),
    workflow: WORKFLOWS[i % WORKFLOWS.length].name,
    phase: (['sense', 'think', 'act', 'verify'] as const)[i % 4],
    description: [
      'Detected anomalous restart pattern in prod namespace',
      'Analyzing root cause: OOMKilled on checkout-service-7b4',
      'Executing: kubectl scale deployment checkout --replicas=5',
      'Verified: restart count stabilized to 0 over 5m window',
      'Latency spike detected: p99 jumped from 120ms to 780ms',
      'Causal model indicates: upstream DB connection saturation',
      'Executing: HPA scale-up + connection pool increase',
      'Verified: p99 returned to 145ms within 90 seconds',
      'Consumer lag rising: 14,200 messages behind',
      'Root cause: consumer instance OOMKilled, only 2/4 healthy',
      'Executing: restart failed consumers, scale to 6 instances',
      'Verified: lag cleared within 4 minutes',
      'TLS certificate for api.szl.com expires in 12 days',
      'Requesting renewal via Let\'s Encrypt ACME protocol',
      'New certificate deployed to ingress controller',
      'TLS handshake verified on all endpoints',
    ][i],
    outcome: (['success', 'success', 'pending', 'success', 'success', 'failed', 'success', 'success'] as const)[i % 8],
    durationMs: Math.floor(100 + Math.random() * 5000),
  }));
}

function PhasePill({ phase }: { phase: string }) {
  const colors: Record<string, string> = {
    sense: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    think: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    act: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    verify: 'bg-green-500/10 text-green-400 border-green-500/20',
    idle: 'bg-white/5 text-white/30 border-white/10',
  };
  return <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border uppercase ${colors[phase] || colors.idle}`}>{phase}</span>;
}

export function SelfHealingEngine() {
  const [events, setEvents] = useState<RemediationEvent[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setEvents(generateEvents());
    const iv = setInterval(() => {
      setEvents(generateEvents());
      setTick(t => t + 1);
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  const totalAutoResolved = WORKFLOWS.reduce((s, w) => s + w.autoResolved, 0);
  const totalIncidents = WORKFLOWS.reduce((s, w) => s + w.totalIncidents, 0);
  const avgMttr = Math.round(WORKFLOWS.reduce((s, w) => s + w.mttrReduction, 0) / WORKFLOWS.length);
  const activeExecutions = WORKFLOWS.filter(w => w.status === 'executing').length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#f5f5f5]/40 mb-1">A11OY · AUTOMATION · SELF-HEALING</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">Self-Healing Engine</h1>
        <p className="text-sm text-[#f5f5f5]/50 mt-1 max-w-3xl">
          Closed-loop remediation inspired by Elastic's Sense → Think → Act architecture.
          Detects anomalies, reasons about root causes using causal models, executes safe
          automated fixes, and verifies resolution — all without human intervention.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs font-mono font-bold text-blue-400">SENSE</span>
          </div>
          <p className="text-[10px] text-white/30">Ingest telemetry, detect anomalies</p>
        </div>
        <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs font-mono font-bold text-purple-400">THINK</span>
          </div>
          <p className="text-[10px] text-white/30">Causal RCA, plan remediation</p>
        </div>
        <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs font-mono font-bold text-orange-400">ACT</span>
          </div>
          <p className="text-[10px] text-white/30">Execute automated fixes safely</p>
        </div>
        <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs font-mono font-bold text-green-400">VERIFY</span>
          </div>
          <p className="text-[10px] text-white/30">Confirm resolution, close loop</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Auto-Resolved', value: `${totalAutoResolved}/${totalIncidents}`, color: '#4ade80' },
          { label: 'Resolution Rate', value: `${Math.round((totalAutoResolved / totalIncidents) * 100)}%`, color: '#06b6d4' },
          { label: 'Avg MTTR Drop', value: `${avgMttr}%`, color: '#a78bfa' },
          { label: 'Active Workflows', value: WORKFLOWS.length, color: '#c9b787' },
          { label: 'Executing Now', value: activeExecutions, color: activeExecutions > 0 ? '#fb923c' : '#4ade80' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{kpi.label}</p>
            <p className="text-xl font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">Healing Workflows</h2>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {WORKFLOWS.map(w => (
            <div key={w.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${w.status === 'executing' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                  <h3 className="text-xs font-mono font-bold text-white/80">{w.name}</h3>
                  <PhasePill phase={w.phase} />
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-white/30">
                  <span>{w.autoResolved}/{w.totalIncidents} resolved</span>
                  <span className="text-green-400">↓{w.mttrReduction}% MTTR</span>
                </div>
              </div>
              <div className="ml-5 text-[10px] font-mono text-white/25">
                <span className="text-white/40">trigger:</span> {w.trigger}
              </div>
              <div className="ml-5 mt-1 flex flex-wrap gap-1">
                {w.actions.map((a, i) => (
                  <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] text-white/30 border border-white/[0.04]">
                    {i + 1}. {a}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">Remediation Event Feed</h2>
          <span className="text-[10px] font-mono text-white/30">tick {tick} · live</span>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-[#0a0a0f]">
              <tr className="border-b border-white/[0.06] text-white/30">
                <th className="text-left px-5 py-2 font-medium uppercase tracking-wider">Time</th>
                <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Phase</th>
                <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Workflow</th>
                <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Event</th>
                <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">Duration</th>
                <th className="text-right px-5 py-2 font-medium uppercase tracking-wider">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {events.map(e => (
                <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-2 text-white/40 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-3 py-2"><PhasePill phase={e.phase} /></td>
                  <td className="px-3 py-2 text-[#c9b787] whitespace-nowrap">{e.workflow}</td>
                  <td className="px-3 py-2 text-white/50 max-w-xs truncate">{e.description}</td>
                  <td className="px-3 py-2 text-right text-white/40">{e.durationMs}ms</td>
                  <td className="px-5 py-2 text-right">
                    <span className={e.outcome === 'success' ? 'text-green-400' : e.outcome === 'failed' ? 'text-red-400' : 'text-yellow-400'}>
                      {e.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
