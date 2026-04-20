import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Eye,
  Network,
  Play,
  RefreshCw,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

interface AttackChain {
  id: string;
  name: string;
  actor: string;
  tactics: string[];
  status: 'completed' | 'running' | 'queued' | 'failed';
  detectionRate: number;
  blockedSteps: number;
  totalSteps: number;
  duration: string;
  riskReduction: number;
  aiGenerated: boolean;
}

interface AttackStep {
  id: number;
  technique: string;
  techniqueId: string;
  tactic: string;
  outcome: 'detected' | 'blocked' | 'succeeded' | 'partial';
  tool: string;
  details: string;
}

const ATTACK_CHAINS: AttackChain[] = [
  {
    id: 'AE-001',
    name: 'APT-29 Cozy Bear Campaign',
    actor: 'APT-29',
    tactics: ['Initial Access', 'Execution', 'Persistence', 'Lateral Movement', 'Exfiltration'],
    status: 'completed',
    detectionRate: 87,
    blockedSteps: 13,
    totalSteps: 15,
    duration: '4m 31s',
    riskReduction: 23,
    aiGenerated: false,
  },
  {
    id: 'AE-002',
    name: 'FIN7 Financial Targeting',
    actor: 'FIN7',
    tactics: ['Spearphishing', 'Exploitation', 'Credential Access', 'Collection'],
    status: 'running',
    detectionRate: 72,
    blockedSteps: 7,
    totalSteps: 12,
    duration: 'ongoing',
    riskReduction: 0,
    aiGenerated: true,
  },
  {
    id: 'AE-003',
    name: 'ALPHV Ransomware Chain',
    actor: 'ALPHV/BlackCat',
    tactics: ['Access Broker', 'Lateral Movement', 'Defense Evasion', 'Impact'],
    status: 'completed',
    detectionRate: 94,
    blockedSteps: 16,
    totalSteps: 17,
    duration: '6m 15s',
    riskReduction: 31,
    aiGenerated: true,
  },
  {
    id: 'AE-004',
    name: 'AI-Generated Novel Attack (Apr 15)',
    actor: 'AI Synthesized',
    tactics: ['Supply Chain', 'Living-off-the-Land', 'Persistence', 'Exfiltration'],
    status: 'queued',
    detectionRate: 0,
    blockedSteps: 0,
    totalSteps: 14,
    duration: '—',
    riskReduction: 0,
    aiGenerated: true,
  },
  {
    id: 'AE-005',
    name: 'SolarWinds-Style Supply Chain',
    actor: 'Nation-State (Synthetic)',
    tactics: ['Trusted Relationship', 'Valid Accounts', 'Persistence', 'Collection'],
    status: 'failed',
    detectionRate: 45,
    blockedSteps: 5,
    totalSteps: 11,
    duration: '2m 08s',
    riskReduction: 0,
    aiGenerated: false,
  },
];

const SELECTED_STEPS: AttackStep[] = [
  {
    id: 1,
    technique: 'Spearphishing Attachment',
    techniqueId: 'T1566.001',
    tactic: 'Initial Access',
    outcome: 'detected',
    tool: 'Cobalt Strike stager',
    details: 'Malicious DOCX with macro detected by email gateway. Quarantined in <2s.',
  },
  {
    id: 2,
    technique: 'PowerShell Encoded Command',
    techniqueId: 'T1059.001',
    tactic: 'Execution',
    outcome: 'blocked',
    tool: 'PowerShell (encoded)',
    details: 'EDR blocked Base64-encoded PowerShell dropper via script block logging.',
  },
  {
    id: 3,
    technique: 'Scheduled Task Creation',
    techniqueId: 'T1053.005',
    tactic: 'Persistence',
    outcome: 'succeeded',
    tool: 'schtasks.exe',
    details: 'MISSED: Scheduled task created via LOLBin. No behavioral alert fired.',
  },
  {
    id: 4,
    technique: 'LSASS Memory Dump',
    techniqueId: 'T1003.001',
    tactic: 'Credential Access',
    outcome: 'detected',
    tool: 'Mimikatz',
    details: 'EDR alerted on LSASS access. Hash captured before block (partial success).',
  },
  {
    id: 5,
    technique: 'Pass-the-Hash via SMB',
    techniqueId: 'T1550.002',
    tactic: 'Lateral Movement',
    outcome: 'succeeded',
    tool: 'Impacket',
    details: 'MISSED: PtH via SMB to DC-02 succeeded. Lateral movement not detected.',
  },
  {
    id: 6,
    technique: 'Volume Shadow Copy Delete',
    techniqueId: 'T1490',
    tactic: 'Impact',
    outcome: 'blocked',
    tool: 'vssadmin.exe',
    details: 'Backup deletion blocked by EDR behavioral rule. Backups preserved.',
  },
];

const outcomeConfig: Record<
  string,
  { color: string; bg: string; label: string; icon: typeof CheckCircle }
> = {
  detected: { color: '#f59e0b', bg: 'bg-amber-500/10', label: 'Detected', icon: Eye },
  blocked: { color: '#10b981', bg: 'bg-emerald-500/10', label: 'Blocked', icon: Shield },
  succeeded: { color: '#ef4444', bg: 'bg-red-500/10', label: 'Succeeded ⚠', icon: AlertTriangle },
  partial: { color: '#f97316', bg: 'bg-orange-500/10', label: 'Partial', icon: Activity },
};

const statusColor: Record<string, string> = {
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  running: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  queued: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
  failed: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const MITRE_COVERAGE = [
  { tactic: 'Initial Access', coverage: 91 },
  { tactic: 'Execution', coverage: 88 },
  { tactic: 'Persistence', coverage: 74 },
  { tactic: 'Privilege Escalation', coverage: 81 },
  { tactic: 'Defense Evasion', coverage: 63 },
  { tactic: 'Credential Access', coverage: 79 },
  { tactic: 'Discovery', coverage: 72 },
  { tactic: 'Lateral Movement', coverage: 68 },
  { tactic: 'Collection', coverage: 85 },
  { tactic: 'Exfiltration', coverage: 82 },
  { tactic: 'Impact', coverage: 94 },
];

export default function AdversaryEngine() {
  const [selectedChain, setSelectedChain] = useState<AttackChain | null>(ATTACK_CHAINS[0]);
  const [running, setRunning] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleRunChain = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      toast.success('Attack chain launched against Digital Twin — live infrastructure unaffected');
    }, 2500);
  };

  const handleGenerateChain = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success(
        'AI synthesized new attack chain based on current threat landscape intelligence — 14 steps, 4 tactics',
      );
    }, 3000);
  };

  const completedChains = ATTACK_CHAINS.filter((c) => c.status === 'completed');
  const avgDetectionRate = Math.round(
    completedChains.reduce((s, c) => s + c.detectionRate, 0) / completedChains.length,
  );
  const avgCoverage = Math.round(
    MITRE_COVERAGE.reduce((s, c) => s + c.coverage, 0) / MITRE_COVERAGE.length,
  );

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-red-400" />
            <h1 className="text-lg font-semibold text-white">Adversary Emulation Engine</h1>
          </div>
          <p className="text-xs text-zinc-500">
            Automated MITRE ATT&CK-mapped attack simulations. AI generates attack chains from
            current threat intelligence. Purple team exercises identify control gaps before real
            attackers do.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateChain}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-medium hover:bg-purple-500/25 transition-colors"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating AI Chain...
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5" /> AI Generate Chain
              </>
            )}
          </button>
          <button
            onClick={handleRunChain}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors"
          >
            {running ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Launching...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Run Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Avg Detection Rate',
            value: `${avgDetectionRate}%`,
            sub: 'across completed simulations',
            color: '#10b981',
            icon: Eye,
          },
          {
            label: 'MITRE Coverage',
            value: `${avgCoverage}%`,
            sub: 'across 11 tactics',
            color: '#3b82f6',
            icon: Target,
          },
          {
            label: 'Simulations Run',
            value: ATTACK_CHAINS.filter((c) => c.status !== 'queued').length,
            sub: 'this month',
            color: '#8b5cf6',
            icon: Activity,
          },
          {
            label: 'Control Gaps Found',
            value: 7,
            sub: 'requiring remediation',
            color: '#ef4444',
            icon: AlertTriangle,
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-2xl font-bold text-white">{m.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Attack Chains */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Attack Chains
          </h2>
          <div className="space-y-1.5">
            {ATTACK_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => setSelectedChain(chain)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-all',
                  selectedChain?.id === chain.id
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-white/8 bg-white/3 hover:bg-white/5',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-medium text-white leading-snug">
                    {chain.name}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border shrink-0',
                      statusColor[chain.status],
                    )}
                  >
                    {chain.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-1.5">
                  <span>{chain.actor}</span>
                  {chain.aiGenerated && <span className="text-purple-400">✨ AI</span>}
                </div>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {chain.tactics.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[9px] px-1 py-0.5 rounded bg-white/5 border border-white/8 text-zinc-400"
                    >
                      {t}
                    </span>
                  ))}
                  {chain.tactics.length > 3 && (
                    <span className="text-[9px] text-zinc-500">+{chain.tactics.length - 3}</span>
                  )}
                </div>
                {chain.status === 'completed' && (
                  <div className="flex items-center gap-3 text-[10px]">
                    <span
                      className={cn(
                        chain.detectionRate >= 80 ? 'text-emerald-400' : 'text-orange-400',
                      )}
                    >
                      {chain.detectionRate}% detected
                    </span>
                    <span className="text-zinc-500">
                      {chain.blockedSteps}/{chain.totalSteps} blocked
                    </span>
                    <span className="text-zinc-500">{chain.duration}</span>
                  </div>
                )}
                {chain.status === 'running' && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-full h-1 rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-amber-400/60 animate-pulse"
                        style={{ width: `${(chain.blockedSteps / chain.totalSteps) * 100}%` }}
                      />
                    </div>
                    <span className="text-amber-400 shrink-0">
                      {chain.blockedSteps}/{chain.totalSteps}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Step-by-Step Trace */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Execution Trace — {selectedChain?.id}
          </h2>
          <div className="space-y-1.5">
            {SELECTED_STEPS.map((step) => {
              const oc = outcomeConfig[step.outcome];
              const Icon = oc.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    'rounded-xl border p-3',
                    step.outcome === 'succeeded'
                      ? 'border-red-500/20 bg-red-500/5'
                      : 'border-white/8 bg-white/3',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        oc.bg,
                      )}
                    >
                      <Icon className="w-3 h-3" style={{ color: oc.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div>
                          <span className="text-[11px] font-medium text-white">
                            {step.technique}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono ml-2">
                            {step.techniqueId}
                          </span>
                        </div>
                        <span
                          className="text-[9px] px-1 py-0.5 rounded shrink-0"
                          style={{
                            color: oc.color,
                            background: oc.bg.replace('bg-', 'bg-').replace('/10', '/20'),
                          }}
                        >
                          {oc.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mb-1">
                        {step.tactic} · {step.tool}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-relaxed">
                        {step.details}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MITRE Coverage */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            MITRE ATT&CK Coverage
          </h2>
          <div className="rounded-xl border border-white/8 bg-white/3 p-4 mb-3">
            <div className="space-y-2.5">
              {MITRE_COVERAGE.map((tactic) => (
                <div key={tactic.tactic}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">{tactic.tactic}</span>
                    <span
                      className={cn(
                        'font-medium',
                        tactic.coverage >= 85
                          ? 'text-emerald-400'
                          : tactic.coverage >= 70
                            ? 'text-amber-400'
                            : 'text-red-400',
                      )}
                    >
                      {tactic.coverage}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${tactic.coverage}%`,
                        background:
                          tactic.coverage >= 85
                            ? '#10b981'
                            : tactic.coverage >= 70
                              ? '#f59e0b'
                              : '#ef4444',
                        opacity: 0.7,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Overall Coverage</span>
              <span className="text-emerald-400 font-bold">{avgCoverage}%</span>
            </div>
          </div>

          {/* Gap Summary */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
            <div className="text-[11px] font-semibold text-red-300 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Coverage Gaps Requiring Attention
            </div>
            <div className="space-y-2">
              {[
                {
                  gap: 'Defense Evasion (63%) — LOLBin abuse not adequately detected',
                  priority: 'high',
                },
                {
                  gap: 'Lateral Movement (68%) — PtH and WMI pivot uncovered',
                  priority: 'critical',
                },
                {
                  gap: 'Persistence (74%) — Scheduled task creation via schtasks missed',
                  priority: 'high',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]">
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0 mt-1.5',
                      item.priority === 'critical' ? 'bg-red-400' : 'bg-orange-400',
                    )}
                  />
                  <span className="text-zinc-400 leading-relaxed">{item.gap}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => toast.success('Remediation plan generated for coverage gaps')}
              className="mt-2 text-[10px] text-red-400 hover:text-red-300"
            >
              Generate remediation plan →
            </button>
          </div>

          {/* Threat Landscape Feed */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 mt-3">
            <div className="text-[11px] font-semibold text-purple-300 mb-2 flex items-center gap-1.5">
              <Brain className="w-3 h-3" /> AI Attack Chain Sources
            </div>
            <div className="space-y-1.5 text-[10px] text-zinc-500">
              {[
                'MITRE ATT&CK v15 Framework (851 techniques)',
                'CISA Known Exploited Vulnerabilities (KEV)',
                'AlienVault OTX — 142 active threat feeds',
                'FS-ISAC Financial Threat Intelligence',
                'Real-time APT campaign telemetry (last 30d)',
              ].map((src) => (
                <div key={src} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-purple-400 shrink-0" />
                  {src}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
