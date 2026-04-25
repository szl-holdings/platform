
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  Brain,
  CheckCircle,
  ChevronDown,
  Clock,
  Database,
  Globe,
  Info,
  Lock,
  MessageSquare,
  Network,
  Play,
  Plus,
  Search,
  Server,
  Shield,
  Target,
  Terminal,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { type MitreStageCoverage, NARRATIVE_INCIDENTS } from './adversary-narrative-engine';

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.25)',
  },
  high: {
    label: 'High',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.25)',
  },
  medium: {
    label: 'Medium',
    color: '#eab308',
    bg: 'rgba(234,179,8,0.1)',
    border: 'rgba(234,179,8,0.25)',
  },
  low: {
    label: 'Low',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.25)',
  },
};

const STATUS_CONFIG = {
  open: { label: 'Open', color: '#ef4444' },
  in_progress: { label: 'In Progress', color: '#f97316' },
  contained: { label: 'Contained', color: '#eab308' },
  resolved: { label: 'Resolved', color: '#22c55e' },
  closed: { label: 'Closed', color: '#64748b' },
};

const XDR_INCIDENTS = [
  {
    id: 'INC-2041',
    title: 'APT41 Lateral Movement — Credential Harvest + LSASS Dump',
    severity: 'critical',
    status: 'in_progress',
    assignee: 'M. Chen',
    createdAt: '14m ago',
    updatedAt: '2m ago',
    alertCount: 23,
    affectedAssets: 7,
    domains: ['endpoint', 'identity', 'cloud'],
    tactics: ['Credential Access', 'Lateral Movement', 'Defense Evasion'],
    confidence: 94,
    description:
      'Suspected APT41 actor deployed credential harvesting tooling on WS-PROD-012, followed by lateral movement to DC-EAST-01. LSASS memory dump detected, Kerberoasting activity observed across 6 service accounts.',
    timeline: [
      { time: '14:22', event: 'Initial detection — LSASS dump on WS-PROD-012', type: 'detection' },
      {
        time: '14:24',
        event: 'Lateral movement to DC-EAST-01 via Pass-the-Hash',
        type: 'activity',
      },
      { time: '14:31', event: 'Kerberoasting activity — 6 SPNs targeted', type: 'activity' },
      { time: '14:38', event: 'Incident created, analyst M. Chen assigned', type: 'system' },
      { time: '14:41', event: 'WS-PROD-012 isolated from network', type: 'response' },
    ],
    entities: [
      { type: 'endpoint', name: 'WS-PROD-012', risk: 'critical', action: 'isolated' },
      { type: 'endpoint', name: 'DC-EAST-01', risk: 'high', action: 'monitoring' },
      { type: 'identity', name: 'svc_backup', risk: 'critical', action: 'disabled' },
      { type: 'identity', name: 'admin.liu', risk: 'high', action: 'mfa_reset' },
      { type: 'cloud', name: 'aws-prod-east', risk: 'medium', action: 'auditing' },
    ],
    linkedAlerts: 23,
    notes: [
      {
        author: 'M. Chen',
        time: '14:40',
        content:
          'Confirmed LSASS dump via ProcDump. Hash extracted. Pivoting to check AD for golden ticket artifacts.',
      },
      {
        author: 'K. Singh',
        time: '14:43',
        content: 'AD logs show unusual LDAP query volume from DC-EAST-01. Possible domain recon.',
      },
    ],
  },
  {
    id: 'INC-2039',
    title: 'Ransomware Staging — Encrypted Volume Mount + Shadow Copy Deletion',
    severity: 'critical',
    status: 'contained',
    assignee: 'K. Singh',
    createdAt: '2h ago',
    updatedAt: '22m ago',
    alertCount: 47,
    affectedAssets: 12,
    domains: ['endpoint', 'storage'],
    tactics: ['Impact', 'Defense Evasion', 'Execution'],
    confidence: 98,
    description:
      'Ransomware staging behavior detected across file server cluster. Volume shadow copies deleted, encrypted volume mounted, batch file execution observed. Containment applied to 12 endpoints.',
    timeline: [
      { time: '12:08', event: 'Shadow copy deletion on FS-CLUSTER-03', type: 'detection' },
      { time: '12:11', event: 'Encrypted volume mount attempt blocked', type: 'response' },
      {
        time: '12:14',
        event: 'Lateral spread to 11 additional endpoints detected',
        type: 'activity',
      },
      { time: '12:19', event: 'Mass containment applied across cluster', type: 'response' },
      {
        time: '12:35',
        event: 'Ransomware family identified: BlackCat/ALPHV variant',
        type: 'intel',
      },
    ],
    entities: [
      { type: 'endpoint', name: 'FS-CLUSTER-03', risk: 'critical', action: 'isolated' },
      { type: 'endpoint', name: 'FS-CLUSTER-04', risk: 'critical', action: 'isolated' },
      { type: 'storage', name: 'NAS-PROD-01', risk: 'high', action: 'read_only' },
    ],
    linkedAlerts: 47,
    notes: [
      {
        author: 'K. Singh',
        time: '12:21',
        content:
          'ALPHV variant confirmed. Using intermittent encryption pattern — some files skipped. Recovery feasibility high.',
      },
    ],
  },
  {
    id: 'INC-2038',
    title: 'Supply Chain Compromise — Malicious npm Package in CI Pipeline',
    severity: 'high',
    status: 'in_progress',
    assignee: 'J. Park',
    createdAt: '4h ago',
    updatedAt: '1h ago',
    alertCount: 9,
    affectedAssets: 3,
    domains: ['cloud', 'endpoint'],
    tactics: ['Initial Access', 'Execution', 'Persistence'],
    confidence: 81,
    description:
      'Malicious npm package detected in CI/CD pipeline. Package `react-utils-pro` (v3.2.1) contains obfuscated payload executing on build server. Potential secrets exfiltration via DNS tunnel.',
    timeline: [
      { time: '10:14', event: 'Malicious package detected in npm install', type: 'detection' },
      { time: '10:22', event: 'DNS tunneling activity from BUILD-SRV-02', type: 'activity' },
      { time: '10:35', event: 'Build server isolated, package blocklisted', type: 'response' },
    ],
    entities: [
      { type: 'endpoint', name: 'BUILD-SRV-02', risk: 'high', action: 'isolated' },
      { type: 'cloud', name: 'github-actions', risk: 'medium', action: 'auditing' },
      { type: 'identity', name: 'ci_svc_account', risk: 'high', action: 'rotated' },
    ],
    linkedAlerts: 9,
    notes: [],
  },
  {
    id: 'INC-2037',
    title: 'BEC Attack — Executive Impersonation + Wire Transfer Attempt',
    severity: 'high',
    status: 'resolved',
    assignee: 'A. Reyes',
    createdAt: '8h ago',
    updatedAt: '3h ago',
    alertCount: 4,
    affectedAssets: 2,
    domains: ['identity', 'email'],
    tactics: ['Initial Access', 'Social Engineering'],
    confidence: 89,
    description:
      'Business email compromise attempt targeting CFO. Attacker spoofed CEO email (similar domain typo) and requested $240K wire transfer. Finance team flagged anomaly before execution.',
    timeline: [],
    entities: [
      { type: 'identity', name: 'cfo@szlholdings.com', risk: 'medium', action: 'monitoring' },
    ],
    linkedAlerts: 4,
    notes: [],
  },
  {
    id: 'INC-2035',
    title: 'Cloud IAM Escalation — Overprivileged Role Assumption in AWS',
    severity: 'medium',
    status: 'resolved',
    assignee: 'M. Chen',
    createdAt: '1d ago',
    updatedAt: '18h ago',
    alertCount: 6,
    affectedAssets: 4,
    domains: ['cloud', 'identity'],
    tactics: ['Privilege Escalation', 'Discovery'],
    confidence: 76,
    description:
      'Service account assumed overprivileged IAM role in AWS production environment. CloudTrail shows unauthorized DescribeInstances and ListBuckets calls across 3 regions.',
    timeline: [],
    entities: [{ type: 'cloud', name: 'aws-prod-west', risk: 'medium', action: 'remediated' }],
    linkedAlerts: 6,
    notes: [],
  },
];

const ENTITY_ICONS = {
  endpoint: Server,
  identity: User,
  cloud: Globe,
  storage: Database,
  email: MessageSquare,
  network: Network,
};

const ENTITY_COLORS = {
  endpoint: '#a78bfa',
  identity: '#60a5fa',
  cloud: '#34d399',
  storage: '#fbbf24',
  email: '#f87171',
  network: '#38bdf8',
};

const ACTION_BADGES: Record<string, { label: string; color: string }> = {
  isolated: { label: 'Isolated', color: '#ef4444' },
  monitoring: { label: 'Monitoring', color: '#f97316' },
  disabled: { label: 'Disabled', color: '#ef4444' },
  mfa_reset: { label: 'MFA Reset', color: '#eab308' },
  auditing: { label: 'Auditing', color: '#60a5fa' },
  rotated: { label: 'Rotated', color: '#22c55e' },
  read_only: { label: 'Read Only', color: '#a78bfa' },
  remediated: { label: 'Remediated', color: '#22c55e' },
};

const TIMELINE_ICONS = {
  detection: AlertTriangle,
  activity: Activity,
  response: Shield,
  intel: Target,
  system: Bell,
};

const TIMELINE_COLORS = {
  detection: '#ef4444',
  activity: '#f97316',
  response: '#22c55e',
  intel: '#a78bfa',
  system: '#60a5fa',
};

const DOMAIN_LABELS: Record<string, string> = {
  endpoint: 'Endpoint',
  identity: 'Identity',
  cloud: 'Cloud',
  storage: 'Storage',
  email: 'Email',
  network: 'Network',
};

const NARRATIVE_COVERAGE_CONFIG: Record<
  MitreStageCoverage,
  { color: string; bg: string; border: string; label: string; icon: typeof CheckCircle }
> = {
  evidenced: {
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    label: 'Evidenced',
    icon: CheckCircle,
  },
  inferred: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    label: 'Inferred',
    icon: Brain,
  },
  missing: {
    color: '#64748b',
    bg: 'rgba(100,116,139,0.05)',
    border: 'rgba(100,116,139,0.15)',
    label: 'Missing',
    icon: Info,
  },
};

const NARRATIVE_OBS_CONFIG: Record<string, string> = {
  log: '#60a5fa',
  alert: '#f87171',
  network: '#34d399',
  file: '#fbbf24',
  process: '#a78bfa',
  identity: '#38bdf8',
};

export default function XDRIncidentWorkbench() {
  const [selectedId, setSelectedId] = useState<string>(XDR_INCIDENTS[0].id);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, _setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [newNote, setNewNote] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'narrative'>('overview');
  const [expandedNarrativeStep, setExpandedNarrativeStep] = useState<number | null>(null);

  const selected = XDR_INCIDENTS.find((i) => i.id === selectedId) ?? XDR_INCIDENTS[0];

  const filtered = XDR_INCIDENTS.filter((inc) => {
    const matchSearch =
      !search ||
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.id.toLowerCase().includes(search.toLowerCase());
    const matchSev = filterSeverity === 'all' || inc.severity === filterSeverity;
    const matchStat = filterStatus === 'all' || inc.status === filterStatus;
    return matchSearch && matchSev && matchStat;
  });

  const sev = SEVERITY_CONFIG[selected.severity as keyof typeof SEVERITY_CONFIG];
  const stat = STATUS_CONFIG[selected.status as keyof typeof STATUS_CONFIG];

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--color-aegis-surface, #060e1a)' }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: 'rgba(239,68,68,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)' }}
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">XDR Incident Workbench</h1>
            <p className="text-[10px] text-white/30">
              Incident-centric analyst workspace — cross-domain entity linking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded border text-[10px]"
            style={{
              borderColor: 'rgba(239,68,68,0.2)',
              color: '#ef4444',
              background: 'rgba(239,68,68,0.06)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />2 Critical Active
          </div>
          <Button
            size="sm"
            className="h-7 text-[11px] gap-1.5"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
            }}
          >
            <Plus className="w-3 h-3" /> Create Incident
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Incident List */}
        <div
          className="w-[300px] shrink-0 border-r flex flex-col overflow-hidden"
          style={{ borderColor: 'rgba(239,68,68,0.08)' }}
        >
          {/* Filters */}
          <div
            className="p-3 space-y-2 border-b shrink-0"
            style={{ borderColor: 'rgba(239,68,68,0.08)' }}
          >
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <Search className="w-3 h-3 text-white/30" />
              <input
                className="flex-1 bg-transparent text-[11px] text-white placeholder:text-white/20 outline-none"
                placeholder="Search incidents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {['all', 'critical', 'high', 'medium'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className="px-2 py-0.5 rounded text-[9px] font-medium border transition-all"
                  style={{
                    borderColor:
                      filterSeverity === s && s !== 'all'
                        ? (SEVERITY_CONFIG[s as keyof typeof SEVERITY_CONFIG]?.border ??
                          'rgba(255,255,255,0.15)')
                        : 'rgba(255,255,255,0.08)',
                    color:
                      filterSeverity === s
                        ? s === 'all'
                          ? '#fff'
                          : SEVERITY_CONFIG[s as keyof typeof SEVERITY_CONFIG]?.color
                        : 'rgba(255,255,255,0.3)',
                    background:
                      filterSeverity === s
                        ? s === 'all'
                          ? 'rgba(255,255,255,0.06)'
                          : SEVERITY_CONFIG[s as keyof typeof SEVERITY_CONFIG]?.bg
                        : 'transparent',
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Incident List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map((inc) => {
              const s = SEVERITY_CONFIG[inc.severity as keyof typeof SEVERITY_CONFIG];
              const st = STATUS_CONFIG[inc.status as keyof typeof STATUS_CONFIG];
              const isSelected = inc.id === selectedId;
              return (
                <button
                  key={inc.id}
                  onClick={() => {
                    setSelectedId(inc.id);
                    setActiveDetailTab('overview');
                    setExpandedNarrativeStep(null);
                  }}
                  className="w-full text-left p-3 border-b transition-all"
                  style={{
                    borderColor: 'rgba(255,255,255,0.04)',
                    background: isSelected ? `${s.bg}` : 'transparent',
                    borderLeft: isSelected ? `2px solid ${s.color}` : '2px solid transparent',
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[9px] font-mono" style={{ color: s.color }}>
                      {inc.id}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px]" style={{ color: st.color }}>
                        ● {st.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/80 font-medium leading-tight mb-2 line-clamp-2">
                    {inc.title}
                  </p>
                  <div className="flex items-center gap-2 text-[9px] text-white/30">
                    <span>{inc.assignee}</span>
                    <span>·</span>
                    <span>{inc.alertCount} alerts</span>
                    <span>·</span>
                    <span>{inc.updatedAt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Panel — Incident Detail */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Incident Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-mono text-white/40">{selected.id}</span>
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-bold border"
                    style={{ color: sev.color, borderColor: sev.border, background: sev.bg }}
                  >
                    {sev.label.toUpperCase()}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] border"
                    style={{
                      color: stat.color,
                      borderColor: `${stat.color}30`,
                      background: `${stat.color}10`,
                    }}
                  >
                    {stat.label}
                  </span>
                  <span className="text-[9px] text-white/30">
                    Confidence: <span style={{ color: sev.color }}>{selected.confidence}%</span>
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mb-1">{selected.title}</h2>
                <p className="text-[11px] text-white/40 leading-relaxed">{selected.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  className="h-7 text-[11px] gap-1.5"
                  style={{
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#ef4444',
                  }}
                >
                  <Lock className="w-3 h-3" /> Contain
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[11px] gap-1.5"
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    color: '#22c55e',
                  }}
                >
                  <CheckCircle className="w-3 h-3" /> Resolve
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-5 gap-3">
              {[
                {
                  label: 'Linked Alerts',
                  value: selected.alertCount,
                  icon: Bell,
                  color: '#f97316',
                },
                {
                  label: 'Affected Assets',
                  value: selected.affectedAssets,
                  icon: Server,
                  color: '#a78bfa',
                },
                {
                  label: 'Domains',
                  value: selected.domains.length,
                  icon: Network,
                  color: '#60a5fa',
                },
                { label: 'Assigned To', value: selected.assignee, icon: User, color: '#34d399' },
                { label: 'Created', value: selected.createdAt, icon: Clock, color: '#94a3b8' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 border"
                  style={{
                    borderColor: 'rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3" style={{ color }} />
                    <span className="text-[9px] text-white/30">{label}</span>
                  </div>
                  <p className="text-sm font-bold text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Detail Tab Bar */}
            <div
              className="flex items-center gap-1 border-b pb-3"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              {[
                { id: 'overview' as const, label: 'Overview', icon: Activity },
                { id: 'narrative' as const, label: 'Narrative', icon: BookOpen },
              ].map((tab) => {
                const isActive = activeDetailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveDetailTab(tab.id);
                      setExpandedNarrativeStep(null);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all',
                      isActive
                        ? 'text-violet-300'
                        : 'text-white/35 hover:text-white/55 border-transparent',
                    )}
                    style={
                      isActive
                        ? {
                            background: 'rgba(139,92,246,0.1)',
                            borderColor: 'rgba(139,92,246,0.25)',
                          }
                        : {}
                    }
                  >
                    <tab.icon className="w-3 h-3" />
                    {tab.label}
                    {tab.id === 'narrative' &&
                      (() => {
                        const narInc = NARRATIVE_INCIDENTS.find((n) => n.id === selected.id);
                        if (!narInc) return null;
                        return (
                          <span
                            className="px-1 py-0.5 rounded text-[9px] font-bold"
                            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
                          >
                            {narInc.steps.length}
                          </span>
                        );
                      })()}
                  </button>
                );
              })}
            </div>

            {activeDetailTab === 'overview' && (
              <>
                {/* Tactics + Domains */}
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[9px] text-white/30 mb-1.5">MITRE ATT&CK Tactics</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selected.tactics.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[9px] font-medium border"
                          style={{
                            color: '#a78bfa',
                            borderColor: 'rgba(167,139,250,0.2)',
                            background: 'rgba(167,139,250,0.08)',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 mb-1.5">Cross-Domain Scope</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selected.domains.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-0.5 rounded text-[9px] font-medium border"
                          style={{
                            color: '#60a5fa',
                            borderColor: 'rgba(96,165,250,0.2)',
                            background: 'rgba(96,165,250,0.08)',
                          }}
                        >
                          {DOMAIN_LABELS[d] ?? d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Entity Graph */}
                {selected.entities.length > 0 && (
                  <div
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: 'rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <Network className="w-3.5 h-3.5 text-blue-400" /> Entity Graph — Linked
                        Assets
                      </h3>
                      <span className="text-[9px] text-white/30">
                        {selected.entities.length} entities
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {selected.entities.map((entity, idx) => {
                        const Icon =
                          ENTITY_ICONS[entity.type as keyof typeof ENTITY_ICONS] ?? Server;
                        const color =
                          ENTITY_COLORS[entity.type as keyof typeof ENTITY_COLORS] ?? '#fff';
                        const actionBadge = ACTION_BADGES[entity.action] ?? {
                          label: entity.action,
                          color: '#64748b',
                        };
                        const riskSev =
                          SEVERITY_CONFIG[entity.risk as keyof typeof SEVERITY_CONFIG];
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1.5">
                            <div className="relative">
                              <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center border"
                                style={{ borderColor: `${color}25`, background: `${color}10` }}
                              >
                                <Icon className="w-5 h-5" style={{ color }} />
                              </div>
                              <div
                                className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-[#060e1a]"
                                style={{ background: riskSev?.color ?? '#64748b' }}
                              />
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] font-mono text-white/70">{entity.name}</p>
                              <p className="text-[8px]" style={{ color: actionBadge.color }}>
                                {actionBadge.label}
                              </p>
                            </div>
                            {idx < selected.entities.length - 1 && (
                              <div
                                className="hidden md:block absolute translate-x-16 w-6 h-px"
                                style={{ background: 'rgba(255,255,255,0.1)' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Timeline + Notes */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Attack Timeline */}
                  {selected.timeline.length > 0 && (
                    <div
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: 'rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Attack Timeline
                      </h3>
                      <div className="space-y-3">
                        {selected.timeline.map((event, idx) => {
                          const Icon =
                            TIMELINE_ICONS[event.type as keyof typeof TIMELINE_ICONS] ?? Activity;
                          const color =
                            TIMELINE_COLORS[event.type as keyof typeof TIMELINE_COLORS] ?? '#fff';
                          return (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="flex flex-col items-center">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                  style={{ background: `${color}15` }}
                                >
                                  <Icon className="w-2.5 h-2.5" style={{ color }} />
                                </div>
                                {idx < selected.timeline.length - 1 && (
                                  <div
                                    className="w-px h-4 mt-1"
                                    style={{ background: 'rgba(255,255,255,0.06)' }}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pb-1">
                                <span className="text-[9px] font-mono text-white/30 mr-2">
                                  {event.time}
                                </span>
                                <span className="text-[10px] text-white/60 leading-tight">
                                  {event.event}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Analyst Notes */}
                  <div
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: 'rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Analyst Notes
                    </h3>
                    <div className="space-y-3 mb-3">
                      {selected.notes.length === 0 && (
                        <p className="text-[10px] text-white/20">
                          No notes yet — add your investigation findings below.
                        </p>
                      )}
                      {selected.notes.map((note, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg p-3 border"
                          style={{
                            borderColor: 'rgba(255,255,255,0.05)',
                            background: 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <span className="text-[7px] text-blue-400 font-bold">
                                {note.author[0]}
                              </span>
                            </div>
                            <span className="text-[9px] text-white/50 font-medium">
                              {note.author}
                            </span>
                            <span className="text-[8px] text-white/20">{note.time}</span>
                          </div>
                          <p className="text-[10px] text-white/60 leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add investigation note…"
                        className="flex-1 bg-white/5 border border-white/08 rounded-lg px-3 py-1.5 text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-blue-500/30"
                      />
                      <button
                        onClick={() => setNewNote('')}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium"
                        style={{
                          background: 'rgba(96,165,250,0.15)',
                          border: '1px solid rgba(96,165,250,0.25)',
                          color: '#60a5fa',
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Response Actions */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: 'rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.01)',
                  }}
                >
                  <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Unified Response Console —
                    One-Click Actions
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { label: 'Isolate Host', icon: Lock, color: '#ef4444' },
                      { label: 'Block Hash', icon: Shield, color: '#f97316' },
                      { label: 'Kill Process', icon: X, color: '#ef4444' },
                      { label: 'Reset Creds', icon: User, color: '#eab308' },
                      { label: 'Capture Memory', icon: Database, color: '#a78bfa' },
                      { label: 'Run Playbook', icon: Play, color: '#22c55e' },
                    ].map(({ label, icon: Icon, color }) => (
                      <button
                        key={label}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:border-opacity-60"
                        style={{ borderColor: `${color}20`, background: `${color}06` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                        <span
                          className="text-[9px] font-medium text-center leading-tight"
                          style={{ color: `${color}cc` }}
                        >
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Narrative Tab Panel */}
            {activeDetailTab === 'narrative' &&
              (() => {
                const narInc = NARRATIVE_INCIDENTS.find((n) => n.id === selected.id);
                if (!narInc)
                  return (
                    <div
                      className="rounded-xl border p-8 text-center"
                      style={{
                        borderColor: 'rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <Brain className="w-8 h-8 mx-auto mb-3 text-white/10" />
                      <p className="text-xs text-white/30 font-medium">
                        Narrative not yet synthesized
                      </p>
                      <p className="text-[10px] text-white/15 mt-1">
                        Aegis is correlating evidence streams for this incident.
                      </p>
                    </div>
                  );
                const evidencedCount = narInc.steps.filter(
                  (s) => s.coverage === 'evidenced',
                ).length;
                const inferredCount = narInc.steps.filter((s) => s.coverage === 'inferred').length;
                const missingCount = narInc.steps.filter((s) => s.coverage === 'missing').length;
                const stagesByStep = narInc.steps.map((s) => ({
                  stage: s.mitreStage,
                  coverage: s.coverage,
                }));
                return (
                  <div className="space-y-4">
                    {/* Narrative Meta Bar */}
                    <div
                      className="rounded-xl border p-3 flex items-center gap-4 flex-wrap"
                      style={{
                        borderColor: 'rgba(139,92,246,0.15)',
                        background: 'rgba(139,92,246,0.04)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-[10px] font-bold text-violet-300">
                          {narInc.actor}
                        </span>
                      </div>
                      <div className="h-3 w-px bg-white/10" />
                      <span className="text-[9px] text-white/40">
                        Confidence{' '}
                        <span className="text-white/70 font-medium">{narInc.confidence}%</span>
                      </span>
                      <div className="h-3 w-px bg-white/10" />
                      <span className="text-[9px] text-white/40">
                        {narInc.steps.length} narrative steps
                      </span>
                      <div className="h-3 w-px bg-white/10" />
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded border"
                          style={{
                            color: '#10b981',
                            borderColor: 'rgba(16,185,129,0.25)',
                            background: 'rgba(16,185,129,0.08)',
                          }}
                        >
                          {evidencedCount} evidenced
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded border"
                          style={{
                            color: '#f59e0b',
                            borderColor: 'rgba(245,158,11,0.25)',
                            background: 'rgba(245,158,11,0.08)',
                          }}
                        >
                          {inferredCount} inferred
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded border"
                          style={{
                            color: '#64748b',
                            borderColor: 'rgba(100,116,139,0.2)',
                            background: 'rgba(100,116,139,0.05)',
                          }}
                        >
                          {missingCount} missing
                        </span>
                      </div>
                      <div className="ml-auto">
                        <a
                          href={`/adversary-narrative?incident=${narInc.id}`}
                          className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all hover:brightness-110"
                          style={{
                            color: '#a78bfa',
                            borderColor: 'rgba(139,92,246,0.25)',
                            background: 'rgba(139,92,246,0.1)',
                          }}
                        >
                          <BookOpen className="w-3 h-3" />
                          Full Narrative Engine
                        </a>
                      </div>
                    </div>

                    {/* MITRE Coverage Strip */}
                    <div
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: 'rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <p className="text-[9px] uppercase tracking-widest text-white/25 font-bold mb-2">
                        MITRE ATT&CK Coverage
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {stagesByStep.map((m, mi) => {
                          const cfg = NARRATIVE_COVERAGE_CONFIG[m.coverage];
                          const CovIcon = cfg.icon;
                          return (
                            <div
                              key={`${m.stage}-${mi}`}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px]"
                              style={{
                                color: cfg.color,
                                borderColor: cfg.border,
                                background: cfg.bg,
                              }}
                            >
                              <CovIcon className="w-2.5 h-2.5" />
                              <span className="font-medium">{m.stage}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Narrative Steps */}
                    <div
                      className="rounded-xl border overflow-hidden"
                      style={{
                        borderColor: 'rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <div
                        className="px-4 py-3 border-b"
                        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                      >
                        <h3 className="text-xs font-bold text-white flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-violet-400" /> Attack Narrative —
                          Chronological Steps
                        </h3>
                      </div>
                      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        {narInc.steps.map((step, idx) => {
                          const isExpanded = expandedNarrativeStep === idx;
                          const confidenceColor =
                            step.confidence >= 85
                              ? '#10b981'
                              : step.confidence >= 65
                                ? '#f59e0b'
                                : '#ef4444';
                          return (
                            <div
                              key={step.seq}
                              className="divide-y"
                              style={{ borderColor: 'rgba(255,255,255,0.03)' }}
                            >
                              <button
                                onClick={() => setExpandedNarrativeStep(isExpanded ? null : idx)}
                                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/[0.01] transition-colors"
                              >
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold"
                                  style={{
                                    background: 'rgba(139,92,246,0.15)',
                                    color: '#a78bfa',
                                    border: '1px solid rgba(139,92,246,0.25)',
                                  }}
                                >
                                  {step.seq}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span className="text-[10px] font-bold text-white">
                                      {step.title}
                                    </span>
                                    <span className="text-[8px] font-mono text-white/25">
                                      {step.timestamp}
                                    </span>
                                    <span
                                      className="text-[8px] px-1.5 py-0.5 rounded"
                                      style={{
                                        background: `${confidenceColor}15`,
                                        color: confidenceColor,
                                      }}
                                    >
                                      {step.confidence}% confidence
                                    </span>
                                    {step.mitreTechniqueId && (
                                      <span
                                        className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                                        style={{
                                          background: 'rgba(167,139,250,0.1)',
                                          color: '#a78bfa',
                                        }}
                                      >
                                        {step.mitreTechniqueId}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">
                                    {step.description}
                                  </p>
                                </div>
                                <ChevronDown
                                  className={cn(
                                    'w-3.5 h-3.5 text-white/30 shrink-0 mt-1 transition-transform',
                                    isExpanded && 'rotate-180',
                                  )}
                                />
                              </button>
                              {isExpanded && (
                                <div
                                  className="px-4 py-3 space-y-3"
                                  style={{ background: 'rgba(0,0,0,0.2)' }}
                                >
                                  <p className="text-[10px] text-white/55 leading-relaxed">
                                    {step.description}
                                  </p>
                                  {step.observables.length > 0 && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-widest text-white/20 font-bold mb-2">
                                        Evidence Observables
                                      </p>
                                      <div className="space-y-1.5">
                                        {step.observables.map((obs, oi) => {
                                          const obColor =
                                            NARRATIVE_OBS_CONFIG[obs.type] ?? '#94a3b8';
                                          return (
                                            <div
                                              key={oi}
                                              className="flex items-center gap-2 p-2 rounded-lg"
                                              style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.04)',
                                              }}
                                            >
                                              <Terminal
                                                className="w-3 h-3 shrink-0"
                                                style={{ color: obColor }}
                                              />
                                              <span
                                                className="text-[9px] font-mono"
                                                style={{ color: obColor }}
                                              >
                                                {obs.type}
                                              </span>
                                              <span className="text-[9px] font-mono text-white/50 truncate">
                                                {obs.excerpt}
                                              </span>
                                              <span className="ml-auto text-[8px] text-white/25">
                                                {obs.source}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {step.iocs.length > 0 && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-widest text-white/20 font-bold mb-2">
                                        IOCs
                                      </p>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {step.iocs.map((ioc, ii) => (
                                          <span
                                            key={ii}
                                            className="text-[8px] font-mono px-2 py-0.5 rounded border"
                                            style={{
                                              color: '#fbbf24',
                                              borderColor: 'rgba(251,191,36,0.2)',
                                              background: 'rgba(251,191,36,0.06)',
                                            }}
                                          >
                                            {ioc}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>
    </div>
  );
}
