import { EmptyState } from '@szl-holdings/shared-ui/EmptyState';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  Database,
  Eye,
  Network,
  Play,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface HuntAgent {
  id: string;
  name: string;
  specialty: string;
  status: 'idle' | 'hypothesizing' | 'querying' | 'analyzing' | 'reporting';
  huntsCompleted: number;
  novelPatterns: number;
  learningScore: number;
  currentHunt?: string;
  color: string;
}

interface HuntReport {
  id: string;
  name: string;
  hypothesis: string;
  agent: string;
  status: 'active' | 'completed' | 'escalated';
  dataSources: string[];
  queriesRun: number;
  timeframe: string;
  findings: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  ttd: string;
  iocCount: number;
}

const AGENTS: HuntAgent[] = [
  {
    id: 'HA-001',
    name: 'Apex Hunter',
    specialty: 'Lateral Movement & Persistence',
    status: 'querying',
    huntsCompleted: 142,
    novelPatterns: 23,
    learningScore: 94,
    currentHunt: 'HUNT-0041: Unusual WMI subscription activity in Finance VLAN',
    color: '#ef4444',
  },
  {
    id: 'HA-002',
    name: 'Sigma Scout',
    specialty: 'C2 & Exfiltration Patterns',
    status: 'analyzing',
    huntsCompleted: 98,
    novelPatterns: 17,
    learningScore: 91,
    currentHunt: 'HUNT-0040: DNS beacon analysis across 3 suspect hosts',
    color: '#8b5cf6',
  },
  {
    id: 'HA-003',
    name: 'Delta Probe',
    specialty: 'Identity & Credential Attacks',
    status: 'hypothesizing',
    huntsCompleted: 67,
    novelPatterns: 11,
    learningScore: 87,
    currentHunt: 'HUNT-0039: Generating hypotheses from Kerberoasting indicators',
    color: '#3b82f6',
  },
  {
    id: 'HA-004',
    name: 'Echo Ranger',
    specialty: 'Cloud & SaaS Threats',
    status: 'idle',
    huntsCompleted: 45,
    novelPatterns: 8,
    learningScore: 83,
    color: '#10b981',
  },
  {
    id: 'HA-005',
    name: 'Foxtrot',
    specialty: 'Supply Chain & Third-Party Risk',
    status: 'reporting',
    huntsCompleted: 29,
    novelPatterns: 5,
    learningScore: 79,
    currentHunt: 'HUNT-0038: Generating report on NPM dependency anomalies',
    color: '#f97316',
  },
];

const HUNTS: HuntReport[] = [
  {
    id: 'HUNT-0041',
    name: 'WMI Subscription Abuse',
    hypothesis:
      'Attacker using WMI event subscriptions for persistence — consistent with APT32 post-exploitation kit',
    agent: 'Apex Hunter',
    status: 'active',
    dataSources: ['EDR', 'SIEM', 'Sysmon'],
    queriesRun: 34,
    timeframe: 'Last 72h',
    findings:
      '2 unauthorized WMI subscriptions found on FINANCE-WS-03 and FINANCE-WS-07. Payloads match known Cobalt Strike dropper pattern.',
    severity: 'critical',
    ttd: '—',
    iocCount: 7,
  },
  {
    id: 'HUNT-0040',
    name: 'DNS Beaconing Pattern',
    hypothesis:
      'Periodic DNS queries to algorithmically generated domains indicate DGA-based C2 communication',
    agent: 'Sigma Scout',
    status: 'active',
    dataSources: ['NDR', 'DNS Logs', 'Threat Intel'],
    queriesRun: 89,
    timeframe: 'Last 7 days',
    findings:
      'SRV-WEB-12 sending 847 queries/day to rotating .ru TLD domains. Shannon entropy analysis: 4.2 (DGA threshold: 3.8)',
    severity: 'high',
    ttd: '—',
    iocCount: 12,
  },
  {
    id: 'HUNT-0038',
    name: 'NPM Supply Chain Risk',
    hypothesis:
      'Recent npm package updates in CI/CD pipeline contain malicious post-install scripts',
    agent: 'Foxtrot',
    status: 'completed',
    dataSources: ['CI/CD Logs', 'Package Registry', 'SBOM'],
    queriesRun: 156,
    timeframe: 'Last 30 days',
    findings:
      "3 packages with unusual postinstall hooks identified. Package 'build-tools-helper@2.1.4' communicates with external IP on install.",
    severity: 'high',
    ttd: '4h 22m',
    iocCount: 4,
  },
  {
    id: 'HUNT-0036',
    name: 'Kerberoasting Campaign',
    hypothesis:
      'Service account enumeration and ticket requests indicate targeted Kerberoasting pre-compromise',
    agent: 'Delta Probe',
    status: 'completed',
    dataSources: ['AD Logs', 'SIEM', 'EDR'],
    queriesRun: 67,
    timeframe: 'Last 14 days',
    findings:
      '14 TGS requests for high-value service accounts from 3 workstations. One account (svc-backup) had RC4 encryption forced.',
    severity: 'critical',
    ttd: '2h 18m',
    iocCount: 18,
  },
  {
    id: 'HUNT-0034',
    name: 'Anomalous OAuth Grant',
    hypothesis:
      'Malicious OAuth app granted excessive permissions to exfiltrate Microsoft 365 data',
    agent: 'Echo Ranger',
    status: 'escalated',
    dataSources: ['M365 Audit', 'Azure AD', 'CASB'],
    queriesRun: 43,
    timeframe: 'Last 21 days',
    findings:
      "App 'DriveSyncHelper' granted Mail.Read and Files.ReadWrite.All by 3 users. App publisher unverified. 4.2GB data accessed in 48h.",
    severity: 'critical',
    ttd: '6h 05m',
    iocCount: 9,
  },
];

const statusConfig: Record<string, string> = {
  idle: 'text-zinc-400',
  hypothesizing: 'text-blue-400',
  querying: 'text-amber-400',
  analyzing: 'text-purple-400',
  reporting: 'text-emerald-400',
};

const huntStatusColor: Record<string, string> = {
  active: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  escalated: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const severityColor: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-blue-400',
};

export default function HuntAgents() {
  const [selectedHunt, setSelectedHunt] = useState<HuntReport | null>(HUNTS[0]);
  const [launching, setLaunching] = useState(false);

  const handleLaunchHunt = () => {
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      toast.success(
        'New hunt launched: HUNT-0042 — Agent Delta Probe formulating hypotheses from latest IOC feed',
      );
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold text-white">Threat Hunters</h1>
          </div>
          <p className="text-xs text-zinc-500">
            AI agents formulate hypotheses, query SIEM/EDR/network data, identify novel attack
            patterns, and generate hunt reports. Agents learn from previous investigations.
          </p>
        </div>
        <button
          onClick={handleLaunchHunt}
          disabled={launching}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
        >
          {launching ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Launching...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Launch New Hunt
            </>
          )}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Active Hunts',
            value: HUNTS.filter((h) => h.status === 'active').length,
            sub: 'running in parallel',
            color: '#f59e0b',
            icon: Search,
          },
          {
            label: 'Hunts Completed',
            value: HUNTS.filter((h) => h.status !== 'active').length,
            sub: 'this month',
            color: '#10b981',
            icon: CheckCircle,
          },
          {
            label: 'Novel Patterns',
            value: AGENTS.reduce((s, a) => s + a.novelPatterns, 0),
            sub: 'unique TTPs identified',
            color: '#8b5cf6',
            icon: Brain,
          },
          {
            label: 'Avg Detection Time',
            value: '3h 42m',
            sub: 'vs 11 days industry avg',
            color: '#3b82f6',
            icon: Clock,
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
        {/* Agent Fleet */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Hunt Agent Fleet
          </h2>
          <div className="space-y-2">
            {AGENTS.map((agent) => (
              <div key={agent.id} className="rounded-xl border border-white/8 bg-white/3 p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: agent.color }}
                      />
                      <span className="text-xs font-medium text-white">{agent.name}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 ml-3">{agent.specialty}</div>
                  </div>
                  <span
                    className={cn('text-[10px] font-medium capitalize', statusConfig[agent.status])}
                  >
                    {agent.status}
                  </span>
                </div>
                {agent.currentHunt && (
                  <div className="text-[10px] text-zinc-400 bg-white/5 rounded px-2 py-1.5 mb-2 leading-relaxed">
                    {agent.currentHunt}
                  </div>
                )}
                <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                  <span>{agent.huntsCompleted} hunts</span>
                  <span className="text-purple-400">{agent.novelPatterns} novel patterns</span>
                </div>
                <div className="mt-1.5">
                  <div className="flex items-center justify-between text-[10px] mb-0.5">
                    <span className="text-zinc-500">Learning Score</span>
                    <span style={{ color: agent.color }}>{agent.learningScore}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${agent.learningScore}%`, background: agent.color + '80' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hunt Reports List */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Hunt Reports
          </h2>
          <div className="space-y-1.5">
            {HUNTS.length === 0 && (
              <EmptyState
                icon={CheckCircle}
                headline="No hunts in flight"
                description="Hunt agents are idle — launch a new hunt to formulate fresh hypotheses."
                accentColor="#10b981"
                compact
              />
            )}
            {HUNTS.map((hunt) => (
              <button
                key={hunt.id}
                onClick={() => setSelectedHunt(hunt)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-all',
                  selectedHunt?.id === hunt.id
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-white/8 bg-white/3 hover:bg-white/5',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-medium text-white leading-snug">
                    {hunt.name}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border shrink-0',
                      huntStatusColor[hunt.status],
                    )}
                  >
                    {hunt.status}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mb-1.5 leading-relaxed line-clamp-2">
                  {hunt.hypothesis}
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className={severityColor[hunt.severity]}>{hunt.severity}</span>
                  <span className="text-zinc-500">{hunt.agent}</span>
                  <span className="text-zinc-500 ml-auto">{hunt.queriesRun} queries</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Hunt Detail */}
        {selectedHunt && (
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Hunt Detail — {selectedHunt.id}
            </h2>
            <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-4">
              <div>
                <div className="text-sm font-semibold text-white mb-1">{selectedHunt.name}</div>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded border',
                    huntStatusColor[selectedHunt.status],
                  )}
                >
                  {selectedHunt.status}
                </span>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                  Hypothesis
                </div>
                <div className="text-xs text-zinc-300 leading-relaxed bg-white/5 rounded-lg p-2">
                  {selectedHunt.hypothesis}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                    Agent
                  </div>
                  <div className="text-xs text-white">{selectedHunt.agent}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                    Severity
                  </div>
                  <div
                    className={cn(
                      'text-xs font-medium capitalize',
                      severityColor[selectedHunt.severity],
                    )}
                  >
                    {selectedHunt.severity}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                    Queries Run
                  </div>
                  <div className="text-xs text-white">{selectedHunt.queriesRun}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                    Timeframe
                  </div>
                  <div className="text-xs text-white">{selectedHunt.timeframe}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                    IOCs Found
                  </div>
                  <div className="text-xs text-red-400 font-medium">{selectedHunt.iocCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                    Time to Detect
                  </div>
                  <div className="text-xs text-white">{selectedHunt.ttd}</div>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                  Data Sources
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedHunt.dataSources.map((ds) => (
                    <span
                      key={ds}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300"
                    >
                      {ds}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                  Key Findings
                </div>
                <div className="text-[11px] text-zinc-300 leading-relaxed bg-white/5 rounded-lg p-2">
                  {selectedHunt.findings}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toast.success('Hunt escalated to Incident Response team')}
                  className="flex-1 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                >
                  Escalate
                </button>
                <button
                  onClick={() => toast.success('Hunt report generated and exported to PDF')}
                  className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs hover:bg-white/8 transition-colors"
                >
                  Export Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
