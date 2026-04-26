import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, } from '@szl-holdings/shared-ui/ui/card';
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
    </div>
  );
}
