import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Eye,
  Network,
  Pause,
  Play,
  RefreshCw,
  Shield,
  Terminal,
  User,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const AGENT_STATUSES = [
  'idle',
  'investigating',
  'correlating',
  'executing',
  'waiting-approval',
  'completed',
] as const;
type AgentStatus = (typeof AGENT_STATUSES)[number];

interface Alert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  asset: string;
  timestamp: string;
  status: 'new' | 'triaging' | 'contained' | 'resolved' | 'escalated';
  agentAssigned?: string;
  confidence?: number;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentTask?: string;
  alertsHandled: number;
  successRate: number;
  avgTriage: string;
  color: string;
}

interface ReasoningStep {
  id: number;
  step: string;
  result: string;
  confidence: number;
  timestamp: string;
  type: 'query' | 'correlate' | 'decide' | 'execute' | 'notify';
}

const AGENTS: Agent[] = [
  {
    id: 'TRIAGE-1',
    name: 'Sentinel Alpha',
    role: 'Alert Triage & Classification',
    status: 'investigating',
    currentTask: 'Analyzing lateral movement indicators on WORKSTATION-047',
    alertsHandled: 342,
    successRate: 96,
    avgTriage: '47s',
    color: '#ef4444',
  },
  {
    id: 'TRIAGE-2',
    name: 'Sentinel Beta',
    role: 'Threat Correlation Engine',
    status: 'correlating',
    currentTask: 'Correlating 12 alerts across SIEM, EDR, and NetFlow',
    alertsHandled: 287,
    successRate: 94,
    avgTriage: '1m 12s',
    color: '#f97316',
  },
  {
    id: 'RESP-1',
    name: 'Responder Prime',
    role: 'Automated Response Executor',
    status: 'executing',
    currentTask: 'Isolating endpoint DC-FINANCE-03 via EDR API',
    alertsHandled: 156,
    successRate: 99,
    avgTriage: '23s',
    color: '#8b5cf6',
  },
  {
    id: 'HUNT-1',
    name: 'Hunter Apex',
    role: 'Proactive Threat Hunter',
    status: 'idle',
    alertsHandled: 89,
    successRate: 91,
    avgTriage: '3m 44s',
    color: '#3b82f6',
  },
  {
    id: 'COMPL-1',
    name: 'Auditor One',
    role: 'Compliance Evidence Collector',
    status: 'completed',
    currentTask: 'Generated SOC 2 evidence bundle for Q2 audit',
    alertsHandled: 203,
    successRate: 100,
    avgTriage: '2m 08s',
    color: '#10b981',
  },
];

const ALERTS: Alert[] = [
  {
    id: 'ALT-9821',
    title: 'Suspicious PowerShell Execution Chain',
    severity: 'critical',
    source: 'EDR',
    asset: 'WORKSTATION-047',
    timestamp: '14:32:11',
    status: 'triaging',
    agentAssigned: 'Sentinel Alpha',
    confidence: 94,
  },
  {
    id: 'ALT-9820',
    title: 'Lateral Movement via Pass-the-Hash',
    severity: 'critical',
    source: 'SIEM',
    asset: 'DC-FINANCE-03',
    timestamp: '14:31:05',
    status: 'contained',
    agentAssigned: 'Responder Prime',
    confidence: 98,
  },
  {
    id: 'ALT-9819',
    title: 'Unusual DNS Beacon to Known C2 Domain',
    severity: 'high',
    source: 'NDR',
    asset: 'SRV-WEB-12',
    timestamp: '14:28:44',
    status: 'triaging',
    agentAssigned: 'Sentinel Beta',
    confidence: 87,
  },
  {
    id: 'ALT-9818',
    title: 'Brute Force Attack — 47 Failed Logins',
    severity: 'high',
    source: 'SIEM',
    asset: 'VPN-GATEWAY',
    timestamp: '14:22:30',
    status: 'resolved',
    agentAssigned: 'Sentinel Alpha',
    confidence: 100,
  },
  {
    id: 'ALT-9817',
    title: 'Anomalous Data Exfiltration Volume',
    severity: 'high',
    source: 'DLP',
    asset: 'USER-CFO-PC',
    timestamp: '14:18:55',
    status: 'escalated',
    agentAssigned: 'Responder Prime',
    confidence: 76,
  },
  {
    id: 'ALT-9816',
    title: 'Privilege Escalation via Token Impersonation',
    severity: 'medium',
    source: 'EDR',
    asset: 'WORKSTATION-031',
    timestamp: '14:12:10',
    status: 'triaging',
    agentAssigned: 'Sentinel Beta',
    confidence: 81,
  },
  {
    id: 'ALT-9815',
    title: 'Malicious Script Injection in Web Server',
    severity: 'high',
    source: 'WAF',
    asset: 'SRV-WEB-01',
    timestamp: '14:09:22',
    status: 'new',
    confidence: 0,
  },
  {
    id: 'ALT-9814',
    title: 'Unauthorized Access to PII Database',
    severity: 'critical',
    source: 'CASB',
    asset: 'DB-CRM-PROD',
    timestamp: '14:05:17',
    status: 'new',
    confidence: 0,
  },
];

const REASONING_TRACE: ReasoningStep[] = [
  {
    id: 1,
    step: 'Query EDR telemetry for WORKSTATION-047',
    result: 'Found 3 suspicious PowerShell executions with encoded payloads in last 15 min',
    confidence: 89,
    timestamp: '14:32:11',
    type: 'query',
  },
  {
    id: 2,
    step: 'Cross-reference against SIEM for related events',
    result:
      'Correlated with 2 authentication anomalies and 1 privilege escalation attempt on same host',
    confidence: 94,
    timestamp: '14:32:14',
    type: 'correlate',
  },
  {
    id: 3,
    step: 'Check IOC reputation against ThreatIntel feeds',
    result: 'C2 IP 192.168.45.12 matches APT-29 infrastructure fingerprint (Confidence: 91%)',
    confidence: 91,
    timestamp: '14:32:17',
    type: 'query',
  },
  {
    id: 4,
    step: 'Assess asset criticality and blast radius',
    result: 'WORKSTATION-047 has access to Finance VLAN. 14 adjacent assets potentially exposed',
    confidence: 96,
    timestamp: '14:32:19',
    type: 'decide',
  },
  {
    id: 5,
    step: 'Select response playbook',
    result: 'PB-007: APT Lateral Movement Containment selected (match score: 0.97)',
    confidence: 97,
    timestamp: '14:32:21',
    type: 'decide',
  },
  {
    id: 6,
    step: 'Execute: Isolate endpoint via EDR API',
    result: 'PENDING HUMAN APPROVAL — Isolation will cut access for 1 user (critical ops role)',
    confidence: 95,
    timestamp: '14:32:23',
    type: 'execute',
  },
];

const severityColor: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

const statusColor: Record<string, string> = {
  new: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
  triaging: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  contained: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  resolved: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  escalated: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
};

const agentStatusColor: Record<AgentStatus, string> = {
  idle: 'text-zinc-400',
  investigating: 'text-amber-400',
  correlating: 'text-blue-400',
  executing: 'text-purple-400',
  'waiting-approval': 'text-orange-400',
  completed: 'text-emerald-400',
};

const stepTypeIcon: Record<string, typeof Terminal> = {
  query: Terminal,
  correlate: Network,
  decide: Brain,
  execute: Zap,
  notify: Activity,
};

export default function AgenticSOC() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(ALERTS[0]);
  const [autoMode, setAutoMode] = useState(true);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const handleApprove = () => {
    toast.success('Action approved — endpoint isolation executing via EDR API');
  };

  const handleReject = () => {
    toast.error('Action rejected — agent will escalate to human analyst');
  };

  const autonomousCount = ALERTS.filter((a) => !['new', 'escalated'].includes(a.status)).length;
  const autonomousRate = Math.round((autonomousCount / ALERTS.length) * 100);

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-red-400" />
            <h1 className="text-lg font-semibold text-white">
              Agentic SOC — Autonomous Triage & Response
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            AI agents autonomously investigate alerts, correlate data sources, and execute response
            playbooks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setAutoMode(!autoMode);
              toast.success(autoMode ? 'Autonomous mode paused' : 'Autonomous mode active');
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              autoMode
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400',
            )}
          >
            {autoMode ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-pulse" /> Autonomous Active
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" /> Paused
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Autonomous Rate',
            value: `${autonomousRate}%`,
            sub: 'of alerts handled autonomously',
            color: '#10b981',
            icon: Brain,
          },
          {
            label: 'Active Agents',
            value: AGENTS.filter((a) => a.status !== 'idle').length,
            sub: `${AGENTS.length} total deployed`,
            color: '#8b5cf6',
            icon: Cpu,
          },
          {
            label: 'Alerts Queue',
            value: ALERTS.length,
            sub: `${ALERTS.filter((a) => a.status === 'new').length} unassigned`,
            color: '#ef4444',
            icon: AlertTriangle,
          },
          {
            label: 'Avg Triage Time',
            value: '52s',
            sub: 'vs 18min human baseline',
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
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Agent Fleet
          </h2>
          {AGENTS.map((agent) => (
            <div key={agent.id} className="rounded-xl border border-white/8 bg-white/3 p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.color }} />
                    <span className="text-xs font-medium text-white">{agent.name}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 ml-3.5">{agent.role}</div>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium capitalize',
                    agentStatusColor[agent.status],
                  )}
                >
                  {agent.status === 'waiting-approval' ? '⏳ Awaiting Approval' : agent.status}
                </span>
              </div>
              {agent.currentTask && (
                <div className="text-[11px] text-zinc-400 bg-white/5 rounded-lg px-2 py-1.5 mb-2 leading-relaxed">
                  {agent.currentTask}
                </div>
              )}
              <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                <span>{agent.alertsHandled} handled</span>
                <span className="text-emerald-400">{agent.successRate}% success</span>
                <span>{agent.avgTriage} avg</span>
              </div>
            </div>
          ))}
        </div>

        {/* Alert Queue */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Alert Queue
          </h2>
          <div className="space-y-1.5">
            {ALERTS.map((alert) => (
              <button
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-all',
                  selectedAlert?.id === alert.id
                    ? 'border-red-500/40 bg-red-500/5'
                    : 'border-white/8 bg-white/3 hover:bg-white/5',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-medium text-white leading-snug">
                    {alert.title}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border shrink-0',
                      severityColor[alert.severity],
                    )}
                  >
                    {alert.severity}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span>{alert.id}</span>
                  <span>{alert.source}</span>
                  <span>{alert.asset}</span>
                  <span className="ml-auto">{alert.timestamp}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border',
                      statusColor[alert.status],
                    )}
                  >
                    {alert.status}
                  </span>
                  {alert.agentAssigned && (
                    <span className="text-[10px] text-zinc-500">→ {alert.agentAssigned}</span>
                  )}
                  {alert.confidence ? (
                    <span className="text-[10px] text-emerald-400 ml-auto">
                      {alert.confidence}% conf
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reasoning Trace */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Reasoning Trace — {selectedAlert?.id ?? 'Select Alert'}
          </h2>
          {selectedAlert && (
            <div className="rounded-xl border border-white/8 bg-white/3 p-3 mb-3">
              <div className="text-xs font-medium text-white mb-1">{selectedAlert.title}</div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span>{selectedAlert.source}</span>
                <span>·</span>
                <span>{selectedAlert.asset}</span>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            {REASONING_TRACE.map((step, idx) => {
              const Icon = stepTypeIcon[step.type] ?? Terminal;
              const isExpanded = expandedStep === step.id;
              const isLast = idx === REASONING_TRACE.length - 1;
              return (
                <div
                  key={step.id}
                  className={cn(
                    'rounded-xl border p-3 transition-all',
                    isLast && step.type === 'execute'
                      ? 'border-orange-500/40 bg-orange-500/5'
                      : 'border-white/8 bg-white/3',
                  )}
                >
                  <button
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          'w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                          isLast && step.type === 'execute' ? 'bg-orange-500/20' : 'bg-white/5',
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-3 h-3',
                            isLast && step.type === 'execute' ? 'text-orange-400' : 'text-zinc-400',
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-zinc-300 leading-snug">{step.step}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-500">{step.timestamp}</span>
                          <div className="flex-1 h-1 rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-emerald-500/60"
                              style={{ width: `${step.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-emerald-400">{step.confidence}%</span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-2 ml-7 text-[11px] text-zinc-400 bg-white/5 rounded-lg p-2 leading-relaxed">
                      {step.result}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Human-in-the-loop approval */}
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-medium text-orange-300">Human Approval Required</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              Isolate WORKSTATION-047 via EDR API? Action will disconnect 1 user with critical ops
              access.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={handleReject}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
