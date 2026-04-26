import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, } from '@szl-holdings/shared-ui/ui/card';
import { cn } from '@szl-holdings/shared-ui/utils';
import { Clock, MapPin, Users } from 'lucide-react';

interface LiveAlert {
  id: number | string;
  title?: string;
  severity?: string;
  description?: string;
  source?: string;
  status?: string;
  createdAt?: string;
  affectedAssets?: string[] | null;
}
interface LiveIncident {
  id: number | string;
  title?: string;
  severity?: string;
  status?: string;
  createdAt?: string;
}

const identityAlerts = [
  {
    id: 'ID-001',
    user: 'j.smith@corp.com',
    type: 'Impossible Travel',
    severity: 'Critical',
    detail: 'Login from New York (08:41) and Moscow (09:03) — 22 min apart, 7400km',
    status: 'Blocked',
    time: '2h ago',
  },
  {
    id: 'ID-002',
    user: 'admin.svc@corp.com',
    type: 'Credential Stuffing',
    severity: 'Critical',
    detail: '847 failed logins from 103.45.x.x range in 4 minutes',
    status: 'Locked',
    time: '3h ago',
  },
  {
    id: 'ID-003',
    user: 'm.rodriguez@corp.com',
    type: 'Anomalous Privilege Escalation',
    severity: 'High',
    detail: 'Standard user account accessed Global Admin role for first time',
    status: 'Revoked',
    time: '5h ago',
  },
  {
    id: 'ID-004',
    user: 'finance.svc@corp.com',
    type: 'After-Hours Access',
    severity: 'Medium',
    detail: 'Service account active 2:14 AM — no maintenance window scheduled',
    status: 'Investigating',
    time: '8h ago',
  },
  {
    id: 'ID-005',
    user: 'k.wilson@corp.com',
    type: 'MFA Bypass Attempt',
    severity: 'High',
    detail: '3 consecutive MFA push rejections followed by successful login via legacy auth',
    status: 'Disabled',
    time: '11h ago',
  },
];

const compromisedAccounts = [
  {
    account: 'j.smith@corp.com',
    riskScore: 97,
    lastActivity: 'Accessing finance ERP',
    location: 'Anomalous — Moscow IP',
    mfaEnabled: true,
  },
  {
    account: 'admin.svc@corp.com',
    riskScore: 94,
    lastActivity: 'Service locked — 847 attempts',
    location: '103.45.67.89',
    mfaEnabled: false,
  },
  {
    account: 'm.rodriguez@corp.com',
    riskScore: 81,
    lastActivity: 'Global Admin role accessed',
    location: 'Internal — 192.168.1.45',
    mfaEnabled: true,
  },
];

const privilegedSessions = [
  {
    user: 'a.thompson@corp.com',
    role: 'Domain Admin',
    started: '14 min ago',
    duration: '14m',
    actions: 23,
    risk: 'Low',
  },
  {
    user: 'devops.svc@corp.com',
    role: 'Azure Contributor',
    started: '1h ago',
    duration: '1h 12m',
    actions: 147,
    risk: 'Medium',
  },
  {
    user: 'backup.svc@corp.com',
    role: 'Backup Operator',
    started: '2h ago',
    duration: '2h 04m',
    actions: 892,
    risk: 'High',
  },
];

const sevColor: Record<string, string> = {
  Critical: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/20',
  High: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/20',
  Medium: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/20',
};

function formatRelative(iso?: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (!t) return '—';
  const ms = Date.now() - t;
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isIdentityRelated(a: LiveAlert): boolean {
  const blob = `${a.title ?? ''} ${a.description ?? ''} ${a.source ?? ''}`.toLowerCase();
  return /identity|account|login|credential|mfa|impossible travel|privilege|oauth|azure ad|okta|sso/.test(
    blob,
  );
}

export default function IdentityThreat() {
  const live = useStandardQuery({
    queryKey: ['identity-threat', 'live'],
    queryFn: () =>
      apiFetch<{ alerts?: LiveAlert[]; incidents?: LiveIncident[] }>('/aegis/live/threats'),
    staleTime: 60_000,
    retry: false,
  });

  const liveAlerts = live.data?.alerts ?? [];
  const liveIncidents = live.data?.incidents ?? [];
  const idAlerts = liveAlerts.filter(isIdentityRelated);
  const liveLoaded = liveAlerts.length + liveIncidents.length > 0;

  const liveIdentityAlerts = idAlerts.slice(0, 5).map((a, i) => ({
    id: String(a.id ?? `LIVE-${i}`),
    user: (a.affectedAssets?.[0]) || a.source || 'unknown.user@corp.com',
    type: a.title ?? 'Identity Anomaly',
    severity: ((a.severity ?? 'Medium').charAt(0).toUpperCase() +
      (a.severity ?? 'Medium').slice(1).toLowerCase()) as 'Critical' | 'High' | 'Medium',
    detail: a.description ?? 'Live identity alert sourced from Aegis',
    status:
      a.status === 'resolved' ? 'Resolved' : a.status === 'acknowledged' ? 'Investigating' : 'Open',
    time: formatRelative(a.createdAt),
  }));

  const displayAlerts =
    liveLoaded && liveIdentityAlerts.length > 0 ? liveIdentityAlerts : identityAlerts;

  const headlineStats = liveLoaded
    ? [
        { label: 'Active Identity Alerts', value: String(idAlerts.length), color: 'text-[#f5f5f5]' },
        { label: 'Total Live Alerts', value: String(liveAlerts.length), color: 'text-[#c9b787]' },
        {
          label: 'Open Incidents',
          value: String(
            liveIncidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length,
          ),
          color: 'text-[#c9b787]',
        },
        { label: 'MFA Coverage', value: '94%', color: 'text-[#c9b787]' },
      ]
    : [
        { label: 'Active Identity Alerts', value: '5', color: 'text-[#f5f5f5]' },
        { label: 'Compromised Accounts', value: '3', color: 'text-[#c9b787]' },
        { label: 'Privileged Sessions', value: '3', color: 'text-[#c9b787]' },
        { label: 'MFA Coverage', value: '94%', color: 'text-[#c9b787]' },
      ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Identity Threat Detection
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Login anomalies, credential compromise, impossible travel, and privileged access alerts
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge
            variant="outline"
            className={`text-[10px] ${liveLoaded ? 'text-[#c9b787] border-[#c9b787]/30' : 'text-[#c9b787] border-[#c9b787]/30'}`}
          >
            {liveLoaded
              ? `Live · /aegis/live/threats · ${liveAlerts.length} alerts streamed`
              : live.isLoading
                ? 'Loading live feed…'
                : 'Live feed unavailable — showing reference set'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {headlineStats.map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Identity Alerts
          </h3>
          <div className="space-y-3">
            {displayAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={alert.severity === 'Critical' ? 'border-[#f5f5f5]/30' : ''}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${alert.severity === 'Critical' ? 'bg-[#f5f5f5]/10' : alert.severity === 'High' ? 'bg-[#c9b787]/10' : 'bg-[#c9b787]/10'}`}
                    >
                      <Users
                        className={`w-4 h-4 ${alert.severity === 'Critical' ? 'text-[#f5f5f5]' : alert.severity === 'High' ? 'text-[#c9b787]' : 'text-[#c9b787]'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold">{alert.user}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${sevColor[alert.severity]}`}
                        >
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{alert.detail}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {alert.time}
                        </span>
                        <span
                          className={`${alert.status === 'Blocked' || alert.status === 'Locked' || alert.status === 'Revoked' || alert.status === 'Disabled' ? 'text-[#c9b787]' : 'text-[#c9b787]'}`}
                        >
                          → {alert.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              High-Risk Accounts
            </h3>
            <div className="space-y-3">
              {compromisedAccounts.map((acct) => (
                <Card key={acct.account} className="border-[#f5f5f5]/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{acct.account}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{acct.lastActivity}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {acct.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#f5f5f5]">{acct.riskScore}</p>
                        <p className="text-[10px] text-muted-foreground">risk score</p>
                        <p
                          className={`text-[10px] mt-0.5 ${acct.mfaEnabled ? 'text-[#c9b787]' : 'text-[#f5f5f5]'}`}
                        >
                          {acct.mfaEnabled ? 'MFA On' : 'No MFA'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Active Privileged Sessions
            </h3>
            <div className="space-y-2">
              {privilegedSessions.map((sess) => (
                <Card key={sess.user}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{sess.user}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {sess.role}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Duration: {sess.duration} · {sess.actions} actions
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${sess.risk === 'High' ? 'text-[#f5f5f5] bg-[#f5f5f5]/10 border-[#f5f5f5]/20' : sess.risk === 'Medium' ? 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/20' : 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/20'}`}
                      >
                        {sess.risk}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#f5f5f5]/20 bg-[#f5f5f5]/5 p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#f5f5f5]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#f5f5f5]">89%</div>
            <div className="text-[11px] text-[#f5f5f5]/60">of breaches involve identity weaknesses (Unit 42, 2025)</div>
          </div>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Identity-based attacks now dominate the threat landscape. Credential theft, privilege escalation, and compromised service accounts are the primary entry vector across ransomware, APT, and insider threat campaigns.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Machine-to-Human Ratio', value: '82:1', sub: 'Machine identities vastly outnumber human accounts', color: '#c9b787' },
          { label: 'Avg Escalation Time', value: '< 40 min', sub: 'From initial compromise to privilege escalation', color: '#f5f5f5' },
          { label: 'Deepfake Attempts (30d)', value: '7', sub: 'Voice/video impersonation attacks detected', color: '#f5f5f5' },
          { label: 'Autonomous Detection', value: '97.3%', sub: 'AI-driven anomaly detection accuracy', color: '#c9b787' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
            <div className="text-[10px] text-zinc-500 mb-1">{m.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Autonomous Identity Anomaly Detection
          </h3>
          <div className="space-y-2">
            {[
              { time: '08:41', event: 'Impossible travel detected — NY → Moscow in 22min', action: 'Account suspended, MFA reset triggered', confidence: 98, severity: 'critical' },
              { time: '09:03', event: 'Service account accessed from new geo for first time', action: 'Risk score elevated, SOC notified', confidence: 94, severity: 'high' },
              { time: '09:15', event: 'Lateral movement pattern — 4 systems in 3 minutes', action: 'Microsegmentation enforced, session terminated', confidence: 96, severity: 'critical' },
              { time: '09:28', event: 'Privilege escalation — standard user → domain admin', action: 'Role revoked, manager notified', confidence: 91, severity: 'high' },
              { time: '10:02', event: 'OAuth token used from unregistered device', action: 'Token revoked, device enrollment required', confidence: 89, severity: 'medium' },
            ].map((evt) => (
              <div key={evt.time + evt.event} className={cn(
                'rounded-xl border p-3',
                evt.severity === 'critical' ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/3' : 'border-white/8 bg-white/3',
              )}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[11px] font-medium text-white">{evt.event}</span>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded border shrink-0',
                    evt.severity === 'critical' ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10' : evt.severity === 'high' ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10' : 'text-zinc-400 border-zinc-700 bg-zinc-800/50',
                  )}>
                    {evt.severity}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {evt.time}</span>
                  <span className="text-[#c9b787]">{evt.action}</span>
                  <span className="ml-auto font-mono">{evt.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Machine Identity Dashboard (82:1 Ratio)
            </h3>
            <div className="space-y-2">
              {[
                { type: 'Service Accounts', count: 1_247, monitored: 1_180, risk: 'low' },
                { type: 'API Keys & Tokens', count: 3_892, monitored: 3_654, risk: 'medium' },
                { type: 'TLS Certificates', count: 847, monitored: 847, risk: 'low' },
                { type: 'SSH Keys', count: 2_341, monitored: 1_987, risk: 'high' },
                { type: 'Service Principals', count: 456, monitored: 423, risk: 'low' },
                { type: 'Managed Identities', count: 1_089, monitored: 1_089, risk: 'low' },
              ].map((mi) => (
                <div key={mi.type} className="rounded-xl border border-white/8 bg-white/3 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-white">{mi.type}</span>
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded border',
                      mi.risk === 'high' ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10' :
                      mi.risk === 'medium' ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10' :
                      'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
                    )}>
                      {mi.risk} risk
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span>{mi.count.toLocaleString()} total</span>
                    <span className="text-[#c9b787]">{mi.monitored.toLocaleString()} monitored</span>
                    <span>{Math.round((mi.monitored / mi.count) * 100)}% coverage</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Deepfake & Synthetic Identity Detection
            </h3>
            <div className="space-y-2">
              {[
                { type: 'Voice Clone Attack', target: 'CFO wire transfer approval', status: 'blocked', method: 'Voice watermark analysis', confidence: 97 },
                { type: 'Video Deepfake', target: 'CEO Zoom impersonation', status: 'blocked', method: 'Liveness detection + metadata analysis', confidence: 99 },
                { type: 'Synthetic Resume', target: 'Engineering candidate screening', status: 'flagged', method: 'Cross-reference identity databases', confidence: 84 },
              ].map((df) => (
                <div key={df.type + df.target} className="rounded-xl border border-[#c9b787]/20 bg-white/3 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-white">{df.type}</span>
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded border',
                      df.status === 'blocked' ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10' : 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
                    )}>
                      {df.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mb-1">{df.target}</div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span>{df.method}</span>
                    <span className="text-[#c9b787] font-mono ml-auto">{df.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
