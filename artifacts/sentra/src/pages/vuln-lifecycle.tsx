import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  BarChart3,
  Bug,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface Vulnerability {
  id: string;
  cve: string;
  title: string;
  cvss: number;
  epss: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-remediation' | 'verified' | 'accepted' | 'false-positive';
  asset: string;
  assetCriticality: 'tier-1' | 'tier-2' | 'tier-3';
  activelyExploited: boolean;
  assignedTo: string;
  dueDate: string;
  discoveredAt: string;
  riskScore: number;
  kev: boolean;
}

const VULNS: Vulnerability[] = [
  {
    id: 'VL-001',
    cve: 'CVE-2024-3400',
    title: 'PAN-OS Command Injection (Global Protect)',
    cvss: 10.0,
    epss: 0.972,
    severity: 'critical',
    status: 'in-remediation',
    asset: 'PERIMETER-FW-01',
    assetCriticality: 'tier-1',
    activelyExploited: true,
    assignedTo: 'Network Team',
    dueDate: 'Apr 17',
    discoveredAt: 'Apr 15 09:12',
    riskScore: 99,
    kev: true,
  },
  {
    id: 'VL-002',
    cve: 'CVE-2024-21762',
    title: 'Fortinet FortiOS SSL-VPN RCE',
    cvss: 9.6,
    epss: 0.947,
    severity: 'critical',
    status: 'open',
    asset: 'VPN-GATEWAY',
    assetCriticality: 'tier-1',
    activelyExploited: true,
    assignedTo: 'Unassigned',
    dueDate: 'Apr 17',
    discoveredAt: 'Apr 15 09:12',
    riskScore: 98,
    kev: true,
  },
  {
    id: 'VL-003',
    cve: 'CVE-2024-4577',
    title: 'PHP CGI Remote Code Execution',
    cvss: 9.8,
    epss: 0.892,
    severity: 'critical',
    status: 'in-remediation',
    asset: 'SRV-WEB-CLUSTER',
    assetCriticality: 'tier-2',
    activelyExploited: true,
    assignedTo: 'DevOps Team',
    dueDate: 'Apr 18',
    discoveredAt: 'Apr 14 16:40',
    riskScore: 94,
    kev: true,
  },
  {
    id: 'VL-004',
    cve: 'CVE-2023-46604',
    title: 'Apache ActiveMQ RCE',
    cvss: 10.0,
    epss: 0.781,
    severity: 'critical',
    status: 'verified',
    asset: 'MIDDLEWARE-01',
    assetCriticality: 'tier-2',
    activelyExploited: false,
    assignedTo: 'App Team',
    dueDate: 'Apr 22',
    discoveredAt: 'Apr 12 11:30',
    riskScore: 88,
    kev: false,
  },
  {
    id: 'VL-005',
    cve: 'CVE-2024-27198',
    title: 'JetBrains TeamCity Auth Bypass',
    cvss: 9.8,
    epss: 0.743,
    severity: 'critical',
    status: 'open',
    asset: 'CI-SERVER-01',
    assetCriticality: 'tier-2',
    activelyExploited: true,
    assignedTo: 'Unassigned',
    dueDate: 'Apr 18',
    discoveredAt: 'Apr 14 14:55',
    riskScore: 91,
    kev: false,
  },
  {
    id: 'VL-006',
    cve: 'CVE-2024-1708',
    title: 'ConnectWise ScreenConnect Path Traversal',
    cvss: 8.4,
    epss: 0.612,
    severity: 'high',
    status: 'in-remediation',
    asset: 'MSP-CONNECTOR',
    assetCriticality: 'tier-2',
    activelyExploited: false,
    assignedTo: 'IT Ops',
    dueDate: 'Apr 25',
    discoveredAt: 'Apr 13 08:20',
    riskScore: 76,
    kev: false,
  },
  {
    id: 'VL-007',
    cve: 'CVE-2023-44487',
    title: 'HTTP/2 Rapid Reset DDoS',
    cvss: 7.5,
    epss: 0.421,
    severity: 'high',
    status: 'accepted',
    asset: 'LOAD-BALANCER',
    assetCriticality: 'tier-2',
    activelyExploited: false,
    assignedTo: 'Network Team',
    dueDate: '—',
    discoveredAt: 'Apr 10 15:00',
    riskScore: 58,
    kev: false,
  },
  {
    id: 'VL-008',
    cve: 'CVE-2024-2961',
    title: 'GNU C Library Buffer Overflow',
    cvss: 8.8,
    epss: 0.234,
    severity: 'high',
    status: 'open',
    asset: 'WORKSTATIONS-FLEET (340)',
    assetCriticality: 'tier-3',
    activelyExploited: false,
    assignedTo: 'Unassigned',
    dueDate: 'May 1',
    discoveredAt: 'Apr 11 12:10',
    riskScore: 52,
    kev: false,
  },
];

const severityColor: Record<string, string> = {
  critical: 'text-[#f5f5f5] bg-[#f5f5f5]/10 border-[#f5f5f5]/30',
  high: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/30',
  medium: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/30',
  low: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/30',
};

const statusConfig: Record<string, string> = {
  open: 'text-[#f5f5f5] bg-[#f5f5f5]/10 border-[#f5f5f5]/30',
  'in-remediation': 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/30',
  verified: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/30',
  accepted: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/30',
  'false-positive': 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
};

function EPSSBadge({ score }: { score: number }) {
  const color =
    score > 0.8 ? '#f5f5f5' : score > 0.5 ? '#c9b787' : score > 0.2 ? '#c9b787' : '#c9b787';
  return (
    <div className="flex items-center gap-1">
      <div className="w-8 h-1.5 rounded-full bg-white/8">
        <div
          className="h-full rounded-full"
          style={{ width: `${score * 100}%`, background: color }}
        />
      </div>
      <span className="text-[10px]" style={{ color }}>
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default function VulnLifecycle() {
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(VULNS[0]);
  const [filter, setFilter] = useState('all');

  const filtered =
    filter === 'all'
      ? VULNS
      : filter === 'kev'
        ? VULNS.filter((v) => v.kev)
        : filter === 'exploited'
          ? VULNS.filter((v) => v.activelyExploited)
          : VULNS.filter((v) => v.status === filter);

  const criticalOpen = VULNS.filter((v) => v.severity === 'critical' && v.status === 'open').length;
  const kevCount = VULNS.filter((v) => v.kev).length;
  const avgRiskScore = Math.round(VULNS.reduce((s, v) => s + v.riskScore, 0) / VULNS.length);

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bug className="w-5 h-5 text-[#c9b787]" />
            <h1 className="text-lg font-semibold text-white">Vulnerability Lifecycle Management</h1>
          </div>
          <p className="text-xs text-zinc-500">
            Risk-based prioritization using EPSS, asset criticality, and KEV intelligence.
            End-to-end remediation tracking from discovery to verification.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Critical Open',
            value: criticalOpen,
            sub: 'requiring immediate action',
            color: '#f5f5f5',
            icon: AlertTriangle,
          },
          {
            label: 'KEV Exposures',
            value: kevCount,
            sub: 'CISA known exploited vulns',
            color: '#f5f5f5',
            icon: Zap,
          },
          {
            label: 'In Remediation',
            value: VULNS.filter((v) => v.status === 'in-remediation').length,
            sub: 'actively being patched',
            color: '#c9b787',
            icon: RefreshCw,
          },
          {
            label: 'Avg Risk Score',
            value: avgRiskScore,
            sub: 'composite EPSS + criticality',
            color: '#8a8a8a',
            icon: BarChart3,
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

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'all', label: 'All' },
          { id: 'open', label: 'Open' },
          { id: 'in-remediation', label: 'In Remediation' },
          { id: 'kev', label: 'KEV Only' },
          { id: 'exploited', label: 'Actively Exploited' },
          { id: 'verified', label: 'Verified' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] border transition-colors',
              filter === f.id
                ? 'bg-[#c9b787]/15 border-[#c9b787]/30 text-[#c9b787]'
                : 'border-white/8 bg-white/3 text-zinc-400 hover:text-zinc-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Vuln List */}
        <div className="xl:col-span-2">
          <div className="space-y-1.5">
            {filtered.map((vuln) => (
              <button
                key={vuln.id}
                onClick={() => setSelectedVuln(vuln)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-all',
                  selectedVuln?.id === vuln.id
                    ? 'border-[#c9b787]/30 bg-[#c9b787]/5'
                    : 'border-white/8 bg-white/3 hover:bg-white/5',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-white">{vuln.title}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{vuln.cve}</span>
                      {vuln.kev && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-[#f5f5f5]/15 border border-[#f5f5f5]/30 text-[#f5f5f5]">
                          KEV
                        </span>
                      )}
                      {vuln.activelyExploited && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-[#c9b787]/15 border border-[#c9b787]/30 text-[#c9b787]">
                          ⚡ Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 flex-wrap">
                      <span>{vuln.asset}</span>
                      <span>·</span>
                      <span>
                        CVSS: <span className="text-white">{vuln.cvss}</span>
                      </span>
                      <span>EPSS:</span>
                      <EPSSBadge score={vuln.epss} />
                      <span>·</span>
                      <span>{vuln.assignedTo}</span>
                      <span>·</span>
                      <span>Due: {vuln.dueDate}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded border',
                        severityColor[vuln.severity],
                      )}
                    >
                      {vuln.severity}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded border',
                        statusConfig[vuln.status],
                      )}
                    >
                      {vuln.status}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] mb-0.5">
                    <span className="text-zinc-500">Risk Score</span>
                    <span className="text-[#c9b787] font-medium">{vuln.riskScore}/100</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${vuln.riskScore}%`,
                        background:
                          vuln.riskScore > 80
                            ? '#f5f5f5'
                            : vuln.riskScore > 60
                              ? '#c9b787'
                              : '#c9b787',
                      }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedVuln && (
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Vuln Detail
            </h2>
            <div className="rounded-xl border border-[#c9b787]/20 bg-white/2 p-4 space-y-4">
              <div>
                <div className="text-sm font-semibold text-white mb-1">{selectedVuln.title}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-400 font-mono">{selectedVuln.cve}</span>
                  {selectedVuln.kev && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5f5f5]/15 border border-[#f5f5f5]/30 text-[#f5f5f5]">
                      CISA KEV
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'CVSS Score',
                    value: selectedVuln.cvss.toString(),
                    color: selectedVuln.cvss >= 9 ? '#f5f5f5' : '#c9b787',
                  },
                  { label: 'Severity', value: selectedVuln.severity, color: '' },
                  { label: 'Asset', value: selectedVuln.asset, color: '' },
                  { label: 'Criticality', value: selectedVuln.assetCriticality, color: '' },
                  { label: 'Assigned To', value: selectedVuln.assignedTo, color: '' },
                  { label: 'Due Date', value: selectedVuln.dueDate, color: '' },
                  { label: 'Discovered', value: selectedVuln.discoveredAt, color: '' },
                  { label: 'Status', value: selectedVuln.status, color: '' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5">
                      {item.label}
                    </div>
                    <div
                      className="text-xs text-white capitalize"
                      style={item.color ? { color: item.color } : {}}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                  EPSS Score (Exploit Prediction)
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selectedVuln.epss * 100}%`,
                        background: selectedVuln.epss > 0.8 ? '#f5f5f5' : '#c9b787',
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold"
                    style={{ color: selectedVuln.epss > 0.8 ? '#f5f5f5' : '#c9b787' }}
                  >
                    {(selectedVuln.epss * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Probability of exploitation in next 30 days
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                  Composite Risk Score
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: selectedVuln.riskScore > 80 ? '#f5f5f5' : '#c9b787' }}
                >
                  {selectedVuln.riskScore}
                  <span className="text-sm text-zinc-500 font-normal">/100</span>
                </div>
                <div className="text-[10px] text-zinc-500">
                  CVSS + EPSS + Asset Criticality + Exploit Activity
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toast.success('Remediation task created and assigned')}
                  className="flex-1 py-1.5 rounded-lg bg-[#c9b787]/10 border border-[#c9b787]/20 text-[#c9b787] text-xs hover:bg-[#c9b787]/20 transition-colors"
                >
                  Assign Remediation
                </button>
                <button
                  onClick={() => toast.success('Vulnerability accepted with risk acknowledgment')}
                  className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs hover:bg-white/8 transition-colors"
                >
                  Accept Risk
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
