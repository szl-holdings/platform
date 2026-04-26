import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  GitMerge,
  Layers,
  Network,
  RefreshCw,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type PipelineStage = {
  id: string;
  label: string;
  count: number;
  avgTime: string;
  status: 'active' | 'idle' | 'overloaded';
  icon: typeof Brain;
};

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'ingest', label: 'Ingest & Normalize', count: 14_832, avgTime: '0.3s', status: 'active', icon: Database },
  { id: 'enrich', label: 'ML Enrichment', count: 14_832, avgTime: '1.2s', status: 'active', icon: Brain },
  { id: 'correlate', label: 'Alert Correlation', count: 4_291, avgTime: '2.1s', status: 'active', icon: GitMerge },
  { id: 'smartscore', label: 'SmartScore Prioritize', count: 4_291, avgTime: '0.8s', status: 'active', icon: TrendingUp },
  { id: 'triage', label: 'Auto-Triage', count: 3_847, avgTime: '4.7s', status: 'active', icon: Zap },
  { id: 'respond', label: 'Autonomous Response', count: 2_104, avgTime: '12.3s', status: 'active', icon: Shield },
];

type SmartScoreAlert = {
  id: string;
  title: string;
  score: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  triageTime: string;
  resolution: string;
  correlatedAlerts: number;
};

const SMARTSCORE_ALERTS: SmartScoreAlert[] = [
  { id: 'SSA-0001', title: 'Ransomware Pre-Encryption Behavior Chain', score: 98, severity: 'critical', source: 'EDR + SIEM + NDR', triageTime: '8s', resolution: 'Isolated 3 endpoints via EDR API', correlatedAlerts: 47 },
  { id: 'SSA-0002', title: 'APT29 C2 Beacon — Cobalt Strike Profile', score: 96, severity: 'critical', source: 'NDR + Threat Intel', triageTime: '12s', resolution: 'Blocked C2 domain, quarantined host', correlatedAlerts: 23 },
  { id: 'SSA-0003', title: 'Credential Harvesting via LSASS Dump', score: 94, severity: 'critical', source: 'EDR + Identity', triageTime: '6s', resolution: 'Disabled account, forced password reset', correlatedAlerts: 15 },
  { id: 'SSA-0004', title: 'Supply Chain — Compromised NPM Package', score: 89, severity: 'high', source: 'SCA + SIEM', triageTime: '18s', resolution: 'Quarantined artifact, notified DevSecOps', correlatedAlerts: 8 },
  { id: 'SSA-0005', title: 'Data Exfiltration via DNS Tunneling', score: 87, severity: 'high', source: 'NDR + DLP', triageTime: '22s', resolution: 'Blocked DNS queries, initiated forensics', correlatedAlerts: 12 },
  { id: 'SSA-0006', title: 'Privilege Escalation — Token Impersonation', score: 82, severity: 'high', source: 'EDR', triageTime: '14s', resolution: 'Revoked token, isolated workstation', correlatedAlerts: 6 },
];

type MLModelCluster = {
  category: string;
  count: number;
  accuracy: number;
  status: 'operational' | 'retraining' | 'degraded';
  lastUpdated: string;
};

const ML_MODEL_CLUSTERS: MLModelCluster[] = [
  { category: 'Behavioral Analytics', count: 487, accuracy: 97.3, status: 'operational', lastUpdated: '2h ago' },
  { category: 'Network Anomaly Detection', count: 342, accuracy: 96.8, status: 'operational', lastUpdated: '4h ago' },
  { category: 'Malware Classification', count: 291, accuracy: 98.1, status: 'operational', lastUpdated: '1h ago' },
  { category: 'Identity Threat Detection', count: 256, accuracy: 95.4, status: 'retraining', lastUpdated: '6h ago' },
  { category: 'Phishing & Social Engineering', count: 198, accuracy: 97.9, status: 'operational', lastUpdated: '3h ago' },
  { category: 'Cloud Security Posture', count: 384, accuracy: 96.2, status: 'operational', lastUpdated: '2h ago' },
  { category: 'Insider Threat Models', count: 167, accuracy: 94.7, status: 'operational', lastUpdated: '5h ago' },
  { category: 'Supply Chain Risk', count: 143, accuracy: 95.1, status: 'operational', lastUpdated: '8h ago' },
  { category: 'IoT/OT Anomaly', count: 312, accuracy: 93.8, status: 'degraded', lastUpdated: '12h ago' },
  { category: 'Encrypted Traffic Analysis', count: 234, accuracy: 96.5, status: 'operational', lastUpdated: '1h ago' },
];

const TOTAL_MODELS = ML_MODEL_CLUSTERS.reduce((s, c) => s + c.count, 0);

type AgentiXAgent = {
  id: string;
  name: string;
  phase: 'plan' | 'reason' | 'execute' | 'monitor';
  task: string;
  alertsProcessed: number;
  mttr: string;
  confidence: number;
  status: 'active' | 'idle' | 'cooldown';
};

const AGENTIX_WORKFORCE: AgentiXAgent[] = [
  { id: 'AX-001', name: 'Precision Triage Alpha', phase: 'execute', task: 'Auto-closing 12 low-confidence alerts', alertsProcessed: 1_847, mttr: '8s', confidence: 97, status: 'active' },
  { id: 'AX-002', name: 'Correlation Engine Beta', phase: 'reason', task: 'Cross-referencing 47 alerts across 3 data sources', alertsProcessed: 1_293, mttr: '14s', confidence: 94, status: 'active' },
  { id: 'AX-003', name: 'Response Orchestrator', phase: 'execute', task: 'Executing PB-042: Endpoint Isolation Playbook', alertsProcessed: 892, mttr: '23s', confidence: 96, status: 'active' },
  { id: 'AX-004', name: 'Threat Hunter Gamma', phase: 'plan', task: 'Planning proactive hunt for APT29 indicators', alertsProcessed: 567, mttr: '3m 12s', confidence: 88, status: 'active' },
  { id: 'AX-005', name: 'Evidence Collector', phase: 'monitor', task: 'Monitoring forensic chain-of-custody for INC-2847', alertsProcessed: 423, mttr: '45s', confidence: 99, status: 'active' },
  { id: 'AX-006', name: 'Compliance Auditor', phase: 'execute', task: 'Generating SOC 2 evidence artifacts', alertsProcessed: 312, mttr: '2m 08s', confidence: 100, status: 'cooldown' },
];

const PHASE_COLORS: Record<string, string> = {
  plan: '#c9b787',
  reason: '#8a8a8a',
  execute: '#f5f5f5',
  monitor: '#c9b787',
};

function AnimatedCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame: number;
    const step = Math.max(1, Math.floor(target / 40));
    const tick = () => {
      setVal((v) => {
        if (v >= target) return target;
        const next = Math.min(v + step, target);
        if (next < target) frame = requestAnimationFrame(tick);
        return next;
      });
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <>{val.toLocaleString()}</>;
}

export default function AutonomousSOCCommand() {
  const [selectedAlert, setSelectedAlert] = useState<SmartScoreAlert | null>(null);
  const [pipelinePulse, setPipelinePulse] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setPipelinePulse((p) => p + 1), 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-[#f5f5f5]" />
            <h1 className="text-lg font-semibold text-white">Autonomous SOC Command</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#c9b787]/30 bg-[#c9b787]/10 text-[#c9b787] font-mono uppercase">
              Precision AI
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Real-time autonomous detection & response pipeline — SmartScore prioritization, {TOTAL_MODELS.toLocaleString()}+ ML models, sub-30s incident resolution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] text-[#c9b787]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
            Autonomous Mode Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'ML Models Active', value: TOTAL_MODELS, sub: 'across 10 clusters', color: '#8a8a8a', icon: Cpu },
          { label: 'Alerts Ingested (24h)', value: 14_832, sub: '71% auto-resolved', color: '#f5f5f5', icon: AlertTriangle },
          { label: 'Avg SmartScore Time', value: '0.8s', sub: 'dynamic risk scoring', color: '#c9b787', icon: TrendingUp },
          { label: 'Auto-Triage Rate', value: '89%', sub: 'closed < 30s', color: '#c9b787', icon: Zap },
          { label: 'MTTR (Autonomous)', value: '18s', sub: 'vs 45m manual baseline', color: '#c9b787', icon: Clock },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {typeof m.value === 'number' ? <AnimatedCounter target={m.value} /> : m.value}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#c9b787]" />
          Detection & Response Pipeline
        </h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isActive = pipelinePulse % PIPELINE_STAGES.length === i;
            return (
              <div key={stage.id} className="flex items-center gap-1 shrink-0">
                <div className={cn(
                  'rounded-xl border p-3 transition-all min-w-[140px]',
                  isActive ? 'border-[#c9b787]/40 bg-[#c9b787]/5' : 'border-white/8 bg-white/3',
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: isActive ? '#c9b787' : '#8a8a8a' }} />
                    <span className="text-[10px] font-medium text-white">{stage.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white font-mono">{stage.count.toLocaleString()}</span>
                    <span className="text-[10px] text-zinc-500">{stage.avgTime}</span>
                  </div>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className={cn('w-3.5 h-3.5 shrink-0 transition-colors', isActive ? 'text-[#c9b787]' : 'text-zinc-700')} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#f5f5f5]" />
            SmartScore — Dynamic Risk Prioritization
          </h2>
          <div className="space-y-2">
            {SMARTSCORE_ALERTS.map((alert) => (
              <button
                key={alert.id}
                onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-all',
                  selectedAlert?.id === alert.id
                    ? 'border-[#f5f5f5]/30 bg-[#f5f5f5]/5'
                    : alert.severity === 'critical'
                      ? 'border-[#f5f5f5]/15 bg-white/3 hover:bg-white/5'
                      : 'border-white/8 bg-white/3 hover:bg-white/5',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-medium text-white leading-snug">{alert.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'text-sm font-bold font-mono',
                      alert.score >= 95 ? 'text-[#f5f5f5]' : alert.score >= 85 ? 'text-[#c9b787]' : 'text-zinc-400',
                    )}>
                      {alert.score}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 flex-wrap">
                  <span className={cn(
                    'px-1.5 py-0.5 rounded border',
                    alert.severity === 'critical' ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10' : 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
                  )}>
                    {alert.severity}
                  </span>
                  <span>{alert.source}</span>
                  <span className="text-[#c9b787]">Triaged in {alert.triageTime}</span>
                  <span>{alert.correlatedAlerts} correlated</span>
                </div>
                {selectedAlert?.id === alert.id && (
                  <div className="mt-3 pt-3 border-t border-white/8">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#c9b787]" />
                      <span className="text-[11px] text-[#c9b787] font-medium">Autonomous Resolution</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{alert.resolution}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-500">
                      <span>Correlated {alert.correlatedAlerts} alerts into 1 case</span>
                      <span>Sources: {alert.source}</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-[#8a8a8a]" />
              ML Model Fleet — {TOTAL_MODELS.toLocaleString()} Models
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {ML_MODEL_CLUSTERS.map((cluster) => (
                <div key={cluster.category} className={cn(
                  'rounded-xl border p-3',
                  cluster.status === 'degraded' ? 'border-[#c9b787]/30 bg-[#c9b787]/5' : 'border-white/8 bg-white/3',
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-white truncate">{cluster.category}</span>
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded border',
                      cluster.status === 'operational' ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10'
                        : cluster.status === 'retraining' ? 'text-[#8a8a8a] border-[#8a8a8a]/30 bg-[#8a8a8a]/10'
                        : 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
                    )}>
                      {cluster.status}
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <span className="text-sm font-bold text-white font-mono">{cluster.count}</span>
                      <span className="text-[10px] text-zinc-500 ml-1">models</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#c9b787] font-mono">{cluster.accuracy}%</span>
                      <span className="text-[9px] text-zinc-600 block">accuracy</span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-[#c9b787]/50" style={{ width: `${cluster.accuracy}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-[#c9b787]" />
          AgentiX — Autonomous Agent Workforce
          <span className="text-[9px] text-zinc-600 font-mono ml-auto">Plan → Reason → Execute → Monitor</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {AGENTIX_WORKFORCE.map((agent) => (
            <div key={agent.id} className={cn(
              'rounded-xl border p-3 transition-all',
              agent.status === 'active' ? 'border-white/8 bg-white/3' : 'border-white/5 bg-white/[0.015]',
            )}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${PHASE_COLORS[agent.phase]}15`, border: `1px solid ${PHASE_COLORS[agent.phase]}30` }}>
                    <Bot className="w-3 h-3" style={{ color: PHASE_COLORS[agent.phase] }} />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-white block">{agent.name}</span>
                    <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: PHASE_COLORS[agent.phase] }}>{agent.phase}</span>
                  </div>
                </div>
                <span className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded border',
                  agent.status === 'active' ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10'
                    : agent.status === 'cooldown' ? 'text-[#8a8a8a] border-[#8a8a8a]/30 bg-[#8a8a8a]/10'
                    : 'text-zinc-500 border-zinc-700 bg-zinc-800/50',
                )}>
                  {agent.status}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mb-2 leading-relaxed">{agent.task}</p>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                <span>{agent.alertsProcessed.toLocaleString()} processed</span>
                <span className="text-[#c9b787]">MTTR: {agent.mttr}</span>
                <span className="ml-auto font-mono">{agent.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#c9b787]/20 bg-[#c9b787]/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitMerge className="w-4 h-4 text-[#c9b787]" />
          <span className="text-xs font-semibold text-[#c9b787]">Alert-to-Case Correlation Engine</span>
          <span className="text-[9px] text-zinc-500 font-mono ml-auto">Real-time · 47 → 1 case compression</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Raw Alerts (24h)', value: '14,832', color: '#f5f5f5' },
            { label: 'After Dedup', value: '4,291', color: '#c9b787' },
            { label: 'Correlated Cases', value: '312', color: '#c9b787' },
            { label: 'Compression Ratio', value: '47:1', color: '#8a8a8a' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
