import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import {
  Activity,
  AlertTriangle,
  Cloud,
  Crosshair,
  Eye,
  FileSearch,
  Layers,
  Lock,
  Monitor,
  Radio,
  Server,
  Shield,
  Users,
  Wifi,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const telemetryStreams = [
  {
    name: 'Endpoint',
    icon: Monitor,
    events24h: 1247841,
    alerts: 34,
    critical: 5,
    color: '#3b82f6',
    trend: '+12%',
  },
  {
    name: 'Network',
    icon: Wifi,
    events24h: 3892341,
    alerts: 18,
    critical: 2,
    color: '#06b6d4',
    trend: '+8%',
  },
  {
    name: 'Identity',
    icon: Users,
    events24h: 247890,
    alerts: 12,
    critical: 3,
    color: '#8b5cf6',
    trend: '+31%',
  },
  {
    name: 'Cloud',
    icon: Cloud,
    events24h: 892134,
    alerts: 9,
    critical: 1,
    color: '#22c55e',
    trend: '+5%',
  },
];

const correlatedAlerts = [
  {
    id: 'XDR-001',
    title: 'APT29 Lateral Movement — Multi-Stage Campaign',
    severity: 'Critical',
    sources: ['Endpoint', 'Network', 'Identity'],
    confidence: 97,
    entities: ['WORKSTATION-142', 'DC-PROD-03', 'user.jsmith'],
    timeline: 'Operation Darkwing — Phase 3',
    status: 'Active',
    mitre: ['T1021.002', 'T1550', 'T1078'],
    campaign: 'SZL Darkwing',
  },
  {
    id: 'XDR-002',
    title: 'Credential Compromise + Cloud Escalation (APT29)',
    severity: 'Critical',
    sources: ['Identity', 'Cloud'],
    confidence: 94,
    entities: ['user.mrodriguez', 'Azure AD', 'S3-prod-backup'],
    timeline: 'Operation Darkwing — Phase 2',
    status: 'Investigating',
    mitre: ['T1078.004', 'T1530', 'T1555'],
    campaign: 'SZL Darkwing',
  },
  {
    id: 'XDR-003',
    title: 'C2 Beaconing — DNS + TLS Fingerprint (APT29 Infra)',
    severity: 'High',
    sources: ['Network', 'Endpoint'],
    confidence: 88,
    entities: ['192.168.10.45', 'LAPTOP-778', 'apt29.c2.domain'],
    timeline: '6h 01m ago',
    status: 'Investigating',
    mitre: ['T1071.001', 'T1573', 'T1105'],
    campaign: 'SZL Darkwing',
  },
  {
    id: 'XDR-004',
    title: 'Data Staging for Exfiltration — S3 Bucket Upload',
    severity: 'High',
    sources: ['Endpoint', 'Network', 'Cloud'],
    confidence: 82,
    entities: ['FILE-SHARE-01', 'BACKUP-SRV-02', 's3://szl-backups-prod'],
    timeline: '11h ago — contained',
    status: 'Contained',
    mitre: ['T1074', 'T1567.002', 'T1039'],
    campaign: 'SZL Darkwing',
  },
  {
    id: 'XDR-005',
    title: 'LSASS Memory Dump — Credential Harvesting',
    severity: 'Critical',
    sources: ['Endpoint'],
    confidence: 99,
    entities: ['DC-PROD-03', 'WORKSTATION-142'],
    timeline: 'Phase 1 — initial access',
    status: 'Remediated',
    mitre: ['T1003.001', 'T1059.001'],
    campaign: 'SZL Darkwing',
  },
];

const entityRisk = [
  { entity: 'WORKSTATION-142', type: 'Endpoint', risk: 97, events: 3247, status: 'Compromised' },
  { entity: 'user.jsmith', type: 'Identity', risk: 94, events: 847, status: 'Anomalous' },
  { entity: 'DC-PROD-03', type: 'Server', risk: 88, events: 12891, status: 'Under Review' },
  { entity: '192.168.10.45', type: 'IP', risk: 79, events: 18341, status: 'Suspicious' },
  { entity: 'user.mrodriguez', type: 'Identity', risk: 76, events: 521, status: 'Anomalous' },
  { entity: 's3://szl-backups-prod', type: 'Cloud', risk: 71, events: 234, status: 'At Risk' },
];

const timelineData = [
  { hour: '00:00', endpoint: 12, network: 28, identity: 8, cloud: 5 },
  { hour: '02:00', endpoint: 8, network: 18, identity: 5, cloud: 3 },
  { hour: '04:00', endpoint: 6, network: 14, identity: 4, cloud: 2 },
  { hour: '06:00', endpoint: 15, network: 22, identity: 9, cloud: 4 },
  { hour: '08:00', endpoint: 48, network: 72, identity: 34, cloud: 18 },
  { hour: '10:00', endpoint: 82, network: 134, identity: 67, cloud: 31 },
  { hour: '11:47', endpoint: 156, network: 245, identity: 124, cloud: 58 },
  { hour: '12:00', endpoint: 94, network: 187, identity: 89, cloud: 42 },
  { hour: '14:00', endpoint: 71, network: 148, identity: 54, cloud: 28 },
  { hour: '16:00', endpoint: 88, network: 162, identity: 71, cloud: 35 },
  { hour: '18:00', endpoint: 42, network: 91, identity: 38, cloud: 19 },
  { hour: '20:00', endpoint: 28, network: 54, identity: 21, cloud: 11 },
  { hour: '22:00', endpoint: 19, network: 38, identity: 14, cloud: 7 },
];

const sevColor: Record<string, string> = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const APT_CAMPAIGN_PHASES = [
  {
    phase: 1,
    name: 'Initial Access',
    status: 'completed',
    technique: 'T1566.001 Spearphishing',
    time: 'Mar 12, 14:23',
    color: '#ef4444',
  },
  {
    phase: 2,
    name: 'Credential Harvest',
    status: 'completed',
    technique: 'T1003.001 LSASS Dump',
    time: 'Mar 15, 09:41',
    color: '#ef4444',
  },
  {
    phase: 3,
    name: 'Lateral Movement',
    status: 'active',
    technique: 'T1021.002 SMB Admin Shares',
    time: 'Mar 29, NOW',
    color: '#f97316',
  },
  {
    phase: 4,
    name: 'Data Staging',
    status: 'detected',
    technique: 'T1074 Data Staged',
    time: 'Mar 29, 11h ago',
    color: '#f59e0b',
  },
  {
    phase: 5,
    name: 'Exfiltration',
    status: 'prevented',
    technique: 'T1567.002 Exfil to Cloud',
    time: 'Blocked',
    color: '#10b981',
  },
];

export default function XDRConsole() {
  const [selected, setSelected] = useState(correlatedAlerts[0]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Unified XDR Console
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            Cross-source telemetry correlation — endpoint, network, identity, and cloud
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
            <Radio className="w-3 h-3 animate-pulse" /> ACTIVE APT CAMPAIGN
          </div>
          <div className="text-[10px] text-white/30 font-mono">Operation Darkwing · APT29</div>
        </div>
      </div>

      {/* APT Campaign Timeline Banner */}
      <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-3">
        <div className="text-[9px] uppercase tracking-wider font-bold text-red-400/60 mb-2">
          Active Campaign — Operation Darkwing (APT29 / Cozy Bear)
        </div>
        <div className="flex items-center gap-0 overflow-x-auto pb-1">
          {APT_CAMPAIGN_PHASES.map((phase, i) => (
            <div key={phase.phase} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold`}
                  style={{
                    background: `${phase.color}20`,
                    border: `1px solid ${phase.color}40`,
                    color: phase.color,
                  }}
                >
                  {phase.phase}
                </div>
                <div className="text-[9px] font-semibold text-white/70 text-center max-w-[80px]">
                  {phase.name}
                </div>
                <div className="text-[8px] text-white/25 text-center max-w-[80px]">
                  {phase.status}
                </div>
              </div>
              {i < APT_CAMPAIGN_PHASES.length - 1 && (
                <div
                  className="w-8 h-px mx-1 shrink-0"
                  style={{ background: 'rgba(239,68,68,0.2)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {telemetryStreams.map((stream) => {
          const Icon = stream.icon;
          return (
            <Card key={stream.name}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: stream.color }} />
                    <span className="text-sm font-semibold">{stream.name}</span>
                  </div>
                  <span className="text-xs text-red-400 font-bold">{stream.critical} critical</span>
                </div>
                <p className="text-xl font-bold font-mono">{stream.events24h.toLocaleString()}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-muted-foreground">{stream.alerts} alerts</p>
                  <span className="text-[10px] text-emerald-400">{stream.trend}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-blue-400" /> Cross-Source Alert Timeline (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
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
                    dataKey="endpoint"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.15}
                    stackId="a"
                    name="Endpoint"
                  />
                  <Area
                    type="monotone"
                    dataKey="network"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.15}
                    stackId="a"
                    name="Network"
                  />
                  <Area
                    type="monotone"
                    dataKey="identity"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.15}
                    stackId="a"
                    name="Identity"
                  />
                  <Area
                    type="monotone"
                    dataKey="cloud"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.15}
                    stackId="a"
                    name="Cloud"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="text-[9px] text-center text-amber-400/70 mt-1">
                ↑ Spike at 11:47 UTC correlates with Phase 3 lateral movement activity
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-red-400" /> Correlated Alerts — Multi-Source
                (Operation Darkwing)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {correlatedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelected(alert)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selected.id === alert.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold truncate">{alert.title}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${sevColor[alert.severity]}`}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {alert.sources.map((s) => (
                          <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                        {alert.mitre.slice(0, 2).map((m) => (
                          <span
                            key={m}
                            className="text-[9px] font-mono bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{alert.timeline}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-primary">{alert.confidence}%</p>
                      <p className="text-[10px] text-muted-foreground">confidence</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Entity Risk Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {entityRisk.map((e) => (
                <div key={e.entity} className="p-2.5 rounded-lg bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold font-mono">{e.entity}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {e.type} · {e.events.toLocaleString()} events
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${e.risk >= 90 ? 'text-red-400' : e.risk >= 75 ? 'text-orange-400' : 'text-amber-400'}`}
                      >
                        {e.risk}
                      </p>
                      <p
                        className={`text-[10px] ${e.status === 'Compromised' ? 'text-red-400' : e.status === 'Anomalous' ? 'text-amber-400' : 'text-sky-400'}`}
                      >
                        {e.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${e.risk >= 90 ? 'bg-red-500' : e.risk >= 75 ? 'bg-orange-500' : 'bg-amber-500'}`}
                      style={{ width: `${e.risk}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Alert Detail — {selected.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs font-semibold">{selected.title}</p>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Campaign</p>
                <span className="text-[10px] font-mono text-red-400">{selected.campaign}</span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Affected Entities</p>
                {selected.entities.map((e) => (
                  <div key={e} className="flex items-center gap-1.5 text-xs py-0.5">
                    <Eye className="w-3 h-3 text-primary" />
                    {e}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">MITRE ATT&CK</p>
                <div className="flex flex-wrap gap-1">
                  {selected.mitre.map((m) => (
                    <span
                      key={m}
                      className="text-[9px] font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-2 py-1 rounded border ${selected.status === 'Active' ? 'bg-red-500/10 text-red-400 border-red-500/20' : selected.status === 'Contained' || selected.status === 'Remediated' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}
                >
                  {selected.status}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
