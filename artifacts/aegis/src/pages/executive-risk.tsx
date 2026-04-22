import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Layers,
  Lock,
  Radio,
  Shield,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const riskTrend = [
  { month: 'Oct', score: 72, incidents: 8 },
  { month: 'Nov', score: 68, incidents: 6 },
  { month: 'Dec', score: 71, incidents: 9 },
  { month: 'Jan', score: 65, incidents: 5 },
  { month: 'Feb', score: 62, incidents: 4 },
  { month: 'Mar', score: 74, incidents: 12 },
];

const vulnTrend = [
  { week: 'Wk 1', critical: 18, high: 45, medium: 112 },
  { week: 'Wk 2', critical: 14, high: 41, medium: 108 },
  { week: 'Wk 3', critical: 11, high: 38, medium: 99 },
  { week: 'Wk 4', critical: 8, high: 33, medium: 91 },
];

const mttrData = [
  { month: 'Oct', mttd: 8.2, mttr: 38 },
  { month: 'Nov', mttd: 6.1, mttr: 31 },
  { month: 'Dec', mttd: 5.4, mttr: 26 },
  { month: 'Jan', mttd: 4.8, mttr: 22 },
  { month: 'Feb', mttd: 4.2, mttr: 18 },
  { month: 'Mar', mttd: 5.1, mttr: 24 },
];

const complianceFrameworks = [
  { name: 'SOC 2 Type II', score: 91, controls: 65, passing: 60, status: 'Compliant' },
  { name: 'NIST 800-53', score: 79, controls: 1000, passing: 790, status: 'In Progress' },
  { name: 'CMMC 2.0', score: 71, controls: 110, passing: 78, status: 'In Progress' },
  { name: 'FedRAMP Moderate', score: 74, controls: 323, passing: 239, status: 'Assessment' },
  { name: 'ISO 27001:2022', score: 82, controls: 93, passing: 76, status: 'In Progress' },
  { name: 'NIS2 / BSI', score: 68, controls: 42, passing: 29, status: 'Remediation' },
];

const topVulns = [
  {
    cve: 'CVE-2024-3400',
    score: 10.0,
    asset: 'Palo Alto FW-EDGE-01',
    status: 'Patch Scheduled',
    days: 4,
  },
  {
    cve: 'CVE-2024-21413',
    score: 9.8,
    asset: 'Exchange SERVER-01',
    status: 'Under Review',
    days: 7,
  },
  {
    cve: 'CVE-2023-46747',
    score: 9.8,
    asset: 'F5 LTM Load Balancer',
    status: 'Mitigated',
    days: 0,
  },
  {
    cve: 'CVE-2024-1709',
    score: 9.8,
    asset: 'ConnectWise ScreenConnect',
    status: 'Patched',
    days: 0,
  },
];

const RISK_REGISTER = [
  {
    id: 'RR-001',
    title: 'APT29 Campaign — Ongoing Breach (Operation Darkwing)',
    category: 'Nation-State Threat',
    likelihood: 'Confirmed',
    impact: 'Critical',
    inherentRisk: 98,
    residualRisk: 61,
    owner: 'CISO',
    status: 'Active Incident',
    dueDate: 'Immediate',
    mitigations: ['IR team deployed', 'DC quarantine', 'CISA notified'],
  },
  {
    id: 'RR-002',
    title: 'Regulatory Non-Compliance — NIS2 / FedRAMP Gaps',
    category: 'Compliance Risk',
    likelihood: 'High',
    impact: 'High',
    inherentRisk: 78,
    residualRisk: 52,
    owner: 'GRC Lead',
    status: 'Remediation',
    dueDate: 'Jun 30, 2025',
    mitigations: ['Gap analysis completed', 'Remediation roadmap approved', '5 controls POA&M'],
  },
  {
    id: 'RR-003',
    title: 'Supply Chain Software — Third-Party SBOM Gaps',
    category: 'Supply Chain',
    likelihood: 'Medium',
    impact: 'High',
    inherentRisk: 68,
    residualRisk: 45,
    owner: 'Vendor Risk',
    status: 'Monitoring',
    dueDate: 'Q3 2025',
    mitigations: ['SBOM program initiated', 'Top 20 vendors assessed', 'GitHub SLSA L2 target'],
  },
  {
    id: 'RR-004',
    title: 'Ransomware Exposure — Backup Integrity Risk',
    category: 'Data Integrity',
    likelihood: 'Medium',
    impact: 'Critical',
    inherentRisk: 72,
    residualRisk: 38,
    owner: 'Infra Lead',
    status: 'Mitigated',
    dueDate: 'Ongoing',
    mitigations: [
      'Immutable backups deployed',
      '3-2-1 strategy validated',
      'Quarterly restore tests',
    ],
  },
  {
    id: 'RR-005',
    title: 'Insider Threat — Privileged Account Abuse',
    category: 'Insider Risk',
    likelihood: 'Low',
    impact: 'High',
    inherentRisk: 55,
    residualRisk: 29,
    owner: 'Identity Team',
    status: 'Controlled',
    dueDate: 'Q2 2025',
    mitigations: ['PAM deployed', 'Just-in-time access', 'UEBA baseline established'],
  },
];

const BOARD_KPIS = [
  {
    label: 'Security Risk Score',
    value: '74',
    sub: '↑ 12 pts (APT29 campaign)',
    color: 'text-red-400',
    icon: Shield,
    delta: 'up-bad',
  },
  {
    label: 'Critical Vulnerabilities',
    value: '8',
    sub: '↓ 10 from Q4 baseline',
    color: 'text-amber-400',
    icon: AlertTriangle,
    delta: 'down-good',
  },
  {
    label: 'MTTD (Detect)',
    value: '5.1 min',
    sub: 'Target: <5 min (Near-target)',
    color: 'text-amber-400',
    icon: Clock,
    delta: 'stable',
  },
  {
    label: 'MTTR (Respond)',
    value: '24 min',
    sub: 'Target: <60 min — Achieved',
    color: 'text-emerald-400',
    icon: Target,
    delta: 'down-good',
  },
  {
    label: 'SOC Coverage',
    value: '99.4%',
    sub: '24×7×365 — Near SLA',
    color: 'text-emerald-400',
    icon: Radio,
    delta: 'stable',
  },
  {
    label: 'Compliance Score',
    value: '77.5%',
    sub: 'Avg across 6 frameworks',
    color: 'text-amber-400',
    icon: Lock,
    delta: 'stable',
  },
  {
    label: 'Open Incidents',
    value: '3',
    sub: '1 critical (APT29)',
    color: 'text-red-400',
    icon: Layers,
    delta: 'up-bad',
  },
  {
    label: 'Board Risk Appetite',
    value: 'Elevated',
    sub: 'Active nation-state threat',
    color: 'text-red-400',
    icon: BarChart3,
    delta: 'up-bad',
  },
];

export default function ExecutiveRisk() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'reports'>('dashboard');

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Executive Risk Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Board-level security posture · APT29 incident · Compliance across 6 frameworks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
            <Radio className="w-3 h-3 animate-pulse" /> ACTIVE INCIDENT
          </div>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-muted-foreground">
            <Download className="w-3.5 h-3.5" /> Export Board Report
          </button>
        </div>
      </div>

      {/* APT Campaign Risk Banner */}
      <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center gap-3 flex-wrap">
        <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-red-300">
            RR-001 ACTIVE — Operation Darkwing (APT29)
          </span>
          <span className="text-[10px] text-muted-foreground ml-2">
            Phase 3: Lateral Movement · CISO notified · CISA coordination initiated
          </span>
        </div>
        <span className="text-[10px] font-mono text-red-400 font-bold shrink-0">
          Inherent Risk: 98 / Residual: 61
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(
          [
            ['dashboard', 'Executive Dashboard'],
            ['register', 'Risk Register'],
            ['reports', 'Board Reports'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {BOARD_KPIS.slice(0, 4).map(({ label, value, sub, color, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {BOARD_KPIS.slice(4).map(({ label, value, sub, color, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Risk Score Trend (6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={155}>
                  <AreaChart data={riskTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[50, 85]} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.1}
                      name="Risk Score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-[9px] text-center text-red-400/60 mt-1">
                  Mar spike due to APT29 active campaign detection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">MTTD / MTTR (minutes)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={155}>
                  <LineChart data={mttrData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mttd"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="MTTD (min)"
                    />
                    <Line
                      type="monotone"
                      dataKey="mttr"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      name="MTTR (min)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Vulnerability Trend (4 Weeks)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={155}>
                  <BarChart data={vulnTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="critical" fill="#ef4444" radius={[2, 2, 0, 0]} name="Critical" />
                    <Bar dataKey="high" fill="#f97316" radius={[2, 2, 0, 0]} name="High" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Compliance Framework Posture
              </h3>
              {complianceFrameworks.map((f) => (
                <Card key={f.name}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold">{f.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{f.score}%</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${f.status === 'Compliant' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : f.status === 'Remediation' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}
                        >
                          {f.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${f.score >= 85 ? 'bg-emerald-500' : f.score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${f.score}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {f.passing}/{f.controls} controls passing
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Critical Open CVEs
              </h3>
              {topVulns.map((v) => (
                <Card key={v.cve}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold">{v.cve}</span>
                          <span
                            className={`text-[10px] font-bold ${v.score >= 9.5 ? 'text-red-400' : 'text-orange-400'}`}
                          >
                            CVSS {v.score}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{v.asset}</p>
                        <p className="text-[10px] mt-1">
                          <span
                            className={
                              v.status === 'Patched' || v.status === 'Mitigated'
                                ? 'text-emerald-400'
                                : v.status === 'Patch Scheduled'
                                  ? 'text-sky-400'
                                  : 'text-amber-400'
                            }
                          >
                            {v.status}
                          </span>
                          {v.days > 0 && (
                            <span className="text-muted-foreground ml-1">in {v.days}d</span>
                          )}
                        </p>
                      </div>
                      {v.status === 'Patched' || v.status === 'Mitigated' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'register' && (
        <div className="space-y-3">
          {RISK_REGISTER.map((risk) => (
            <div
              key={risk.id}
              className={`p-4 rounded-xl border bg-card ${risk.inherentRisk >= 90 ? 'border-red-500/20' : risk.inherentRisk >= 65 ? 'border-amber-500/15' : 'border-border'}`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{risk.id}</span>
                    <span className="text-sm font-bold">{risk.title}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${risk.status === 'Active Incident' ? 'text-red-400 bg-red-500/10 border-red-500/20' : risk.status === 'Mitigated' || risk.status === 'Controlled' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}
                    >
                      {risk.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mb-2">
                    <span>Category: {risk.category}</span>
                    <span>Likelihood: {risk.likelihood}</span>
                    <span>Impact: {risk.impact}</span>
                    <span>Owner: {risk.owner}</span>
                    <span>Due: {risk.dueDate}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {risk.mitigations.map((m) => (
                      <span
                        key={m}
                        className="text-[9px] bg-muted px-2 py-0.5 rounded flex items-center gap-1"
                      >
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Risk Score</div>
                  <div className="flex items-center gap-2">
                    <div>
                      <div
                        className={`text-lg font-bold font-mono ${risk.inherentRisk >= 90 ? 'text-red-400' : risk.inherentRisk >= 65 ? 'text-amber-400' : 'text-orange-400'}`}
                      >
                        {risk.inherentRisk}
                      </div>
                      <div className="text-[8px] text-muted-foreground">Inherent</div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <div>
                      <div
                        className={`text-lg font-bold font-mono ${risk.residualRisk >= 60 ? 'text-orange-400' : risk.residualRisk >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}
                      >
                        {risk.residualRisk}
                      </div>
                      <div className="text-[8px] text-muted-foreground">Residual</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Q1 2025 Board Security Report',
              desc: 'Executive summary, risk posture, APT29 incident briefing, compliance status across 6 frameworks',
              type: 'PDF',
              status: 'Ready',
              date: 'Apr 1, 2025',
              pages: 18,
            },
            {
              title: 'Operation Darkwing — Executive Briefing',
              desc: 'APT29 campaign timeline, affected systems, containment actions, CISA coordination status, residual risks',
              type: 'PDF',
              status: 'Ready',
              date: 'Mar 29, 2025',
              pages: 8,
            },
            {
              title: 'SOC 2 Type II — Audit Report 2024',
              desc: 'Full SOC 2 Type II report with auditor attestation, control matrix, and exception notes',
              type: 'PDF',
              status: 'Ready',
              date: 'Jan 15, 2025',
              pages: 42,
            },
            {
              title: 'CMMC 2.0 Level 2 — Readiness Assessment',
              desc: 'Gap analysis against 110 practices, remediation roadmap, estimated certification timeline',
              type: 'PDF',
              status: 'Draft',
              date: 'Mar 15, 2025',
              pages: 29,
            },
            {
              title: 'FedRAMP Moderate — SSP v2.1',
              desc: 'System Security Plan — current revision for 3PAO assessment submission',
              type: 'PDF',
              status: 'In Review',
              date: 'Mar 20, 2025',
              pages: 187,
            },
            {
              title: 'Annual Penetration Test Report 2024',
              desc: 'External/internal pentest results, 34 findings (2 critical, 9 high), remediation tracking',
              type: 'PDF',
              status: 'Ready',
              date: 'Dec 10, 2024',
              pages: 64,
            },
            {
              title: 'NIS2 Incident Notification — ENISA',
              desc: '72-hour notification template for Operation Darkwing breach (pending submission)',
              type: 'DOC',
              status: 'Pending',
              date: 'Mar 30, 2025',
              pages: 4,
            },
            {
              title: 'Vendor Risk Assessment — Top 20 Suppliers',
              desc: 'Third-party supply chain security assessment: SBOM, software attestation, SOC 2 certificates',
              type: 'XLSX',
              status: 'Ready',
              date: 'Feb 28, 2025',
              pages: 90,
            },
          ].map((report) => (
            <div
              key={report.title}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold">{report.title}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${report.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-400' : report.status === 'Draft' ? 'bg-amber-500/10 text-amber-400' : report.status === 'Pending' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">
                    {report.desc}
                  </p>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span>
                      {report.type} · {report.pages} pages
                    </span>
                    <span>{report.date}</span>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
