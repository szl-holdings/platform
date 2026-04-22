import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Clock,
  Eye,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { type AccessEvent, buildBaseline, computeRiskAssessment } from '@/lib/sentinel-analytics';

const SENTINEL_ACCENT = '#8b5cf6';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'normal';
type AnomalyType =
  | 'data-exfil'
  | 'off-hours'
  | 'privilege-escalation'
  | 'lateral-movement'
  | 'bulk-access'
  | 'unusual-auth';

interface StatCard {
  label: string;
  value: number;
  color: string;
  sub: string;
  pulse?: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  title: string;
  department: string;
  riskScore: number;
  riskLevel: RiskLevel;
  lastSeen: string;
  baselineDeviation: number;
  anomalies: Anomaly[];
  recentActivity: ActivityEvent[];
  indicators: string[];
}

interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: 'critical' | 'high' | 'medium';
  timestamp: number;
  description: string;
  evidence: string;
  mitre?: string;
}

interface ActivityEvent {
  id: string;
  time: string;
  action: string;
  resource: string;
  location: string;
  anomalous: boolean;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#eab308',
  normal: '#6b7280',
};

const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  'data-exfil': 'Data Exfiltration Indicator',
  'off-hours': 'Off-Hours Activity',
  'privilege-escalation': 'Privilege Escalation',
  'lateral-movement': 'Lateral Movement',
  'bulk-access': 'Bulk Data Access',
  'unusual-auth': 'Unusual Authentication',
};

const USERS: UserProfile[] = [
  {
    id: 'u001',
    name: 'M. Rodriguez',
    title: 'VP Finance',
    department: 'Finance',
    riskScore: 94,
    riskLevel: 'critical',
    lastSeen: '2m ago',
    baselineDeviation: 312,
    indicators: [
      'Bulk data access 3x baseline',
      'Personal cloud uploads detected',
      'Off-hours access pattern',
      'Competitor LinkedIn contacts',
    ],
    anomalies: [
      {
        id: 'a1',
        type: 'bulk-access',
        severity: 'critical',
        timestamp: Date.now() - 3 * 60000,
        description: '264 documents accessed in 48h — 3.1× weekly baseline',
        evidence:
          'SharePoint audit: 264 unique file accesses across Finance, Strategy, M&A folders. Peak access: 02:00-04:00 UTC Saturday.',
        mitre: 'T1005',
      },
      {
        id: 'a2',
        type: 'data-exfil',
        severity: 'critical',
        timestamp: Date.now() - 45 * 60000,
        description: "12.4GB uploaded to personal OneDrive — labeled 'personal photos'",
        evidence:
          'DLP: OneDrive sync from FINANCE-WS-11. Volume 12,400MB. Filenames inconsistent with personal content — includes .xlsx, .pptx, .docx',
        mitre: 'T1567.002',
      },
      {
        id: 'a3',
        type: 'off-hours',
        severity: 'high',
        timestamp: Date.now() - 2 * 3600000,
        description: 'Access 22:00-03:00 UTC on 17 of last 30 days — 0× in previous 6 months',
        evidence:
          'Identity governance log: 17 off-hours sessions, avg 2h 14m duration. Accessing M&A and strategic planning documents.',
        mitre: 'T1078',
      },
      {
        id: 'a4',
        type: 'unusual-auth',
        severity: 'medium',
        timestamp: Date.now() - 8 * 3600000,
        description: 'Login from unknown device — iPhone 15 not registered in MDM',
        evidence:
          'Azure AD conditional access log: new device sign-in, MFA completed, device compliance: unknown. IP: 198.51.100.x (residential ISP)',
        mitre: undefined,
      },
    ],
    recentActivity: [
      {
        id: 'r1',
        time: '02:14',
        action: 'File Download Bulk',
        resource: 'M&A_Pipeline_2025.xlsx (47MB)',
        location: 'SharePoint / Strategy',
        anomalous: true,
      },
      {
        id: 'r2',
        time: '02:08',
        action: 'OneDrive Sync',
        resource: '264 files → Personal OneDrive',
        location: 'Cloud Storage',
        anomalous: true,
      },
      {
        id: 'r3',
        time: '01:47',
        action: 'Document Access',
        resource: 'Board_Compensation_Committee_Dec.pptx',
        location: 'SharePoint / HR',
        anomalous: true,
      },
      {
        id: 'r4',
        time: '01:31',
        action: 'Search Query',
        resource: '"acquisition targets" "revenue 50M+"',
        location: 'SharePoint Search',
        anomalous: true,
      },
      {
        id: 'r5',
        time: 'Yesterday 18:12',
        action: 'Legitimate Login',
        resource: 'Outlook / Teams',
        location: 'Office Network',
        anomalous: false,
      },
    ],
  },
  {
    id: 'u002',
    name: 'K. Tanaka',
    title: 'Senior DevOps Engineer',
    department: 'Engineering',
    riskScore: 76,
    riskLevel: 'high',
    lastSeen: '28m ago',
    baselineDeviation: 187,
    indicators: [
      'Privilege escalation via sudo',
      'Access to production DB outside change window',
      'VPN connection from unexpected geo',
    ],
    anomalies: [
      {
        id: 'b1',
        type: 'privilege-escalation',
        severity: 'high',
        timestamp: Date.now() - 28 * 60000,
        description: 'Root access on PROD-DB-03 at 03:44 UTC outside change window',
        evidence:
          'Sudo log: 3 root commands on prod database server. No associated change ticket. Window: Saturday 03:44 UTC. Accessed customer_data table.',
        mitre: 'T1548.003',
      },
      {
        id: 'b2',
        type: 'unusual-auth',
        severity: 'high',
        timestamp: Date.now() - 5 * 3600000,
        description: 'VPN connection from Romania — home geo baseline: US/California',
        evidence:
          'VPN log: new connection from IP 185.220.x.x (Bucharest, RO). Device fingerprint matches registered laptop but geo anomaly score: 98/100.',
        mitre: 'T1078.004',
      },
      {
        id: 'b3',
        type: 'lateral-movement',
        severity: 'medium',
        timestamp: Date.now() - 7 * 3600000,
        description: 'SSH connections to 8 hosts not in normal access baseline',
        evidence:
          'PAM log: SSH access to PROD-DB-01, PROD-DB-02, PROD-APP-04 through PROD-APP-11. No associated deployment pipeline activity.',
        mitre: 'T1021.004',
      },
    ],
    recentActivity: [
      {
        id: 'r1',
        time: '03:44',
        action: 'Root Escalation',
        resource: 'sudo su — PROD-DB-03',
        location: 'Production Cluster',
        anomalous: true,
      },
      {
        id: 'r2',
        time: '03:38',
        action: 'SSH Login',
        resource: 'PROD-DB-03 (prod database)',
        location: 'Production Network',
        anomalous: true,
      },
      {
        id: 'r3',
        time: '03:22',
        action: 'VPN Connect',
        resource: 'Corporate VPN — Bucharest, RO',
        location: 'External / Unknown',
        anomalous: true,
      },
      {
        id: 'r4',
        time: 'Yesterday 16:45',
        action: 'Code Deploy',
        resource: 'api-gateway v2.4.1 → staging',
        location: 'CI/CD Pipeline',
        anomalous: false,
      },
    ],
  },
  {
    id: 'u003',
    name: 'P. Okafor',
    title: 'Security Analyst II',
    department: 'SOC',
    riskScore: 44,
    riskLevel: 'medium',
    lastSeen: '5m ago',
    baselineDeviation: 78,
    indicators: [
      'Accessed 3 alerts outside assigned shift',
      'Ran 4 threat hunting queries on executive email accounts',
    ],
    anomalies: [
      {
        id: 'c1',
        type: 'bulk-access',
        severity: 'medium',
        timestamp: Date.now() - 5 * 60000,
        description: '4 SIEM queries targeting executive email metadata — outside case scope',
        evidence:
          "SIEM audit: queries with filter 'user:ceo OR user:cfo OR user:cso'. No open case referenced. Analyst assigned to P2 incident INC-2847.",
        mitre: undefined,
      },
    ],
    recentActivity: [
      {
        id: 'r1',
        time: 'Now',
        action: 'SIEM Query',
        resource: 'user:ceo,cfo,cso email metadata',
        location: 'SIEM Platform',
        anomalous: true,
      },
      {
        id: 'r2',
        time: '12m ago',
        action: 'Alert Review',
        resource: 'SEN-0428 (APT29 campaign)',
        location: 'SOC Dashboard',
        anomalous: false,
      },
    ],
  },
  {
    id: 'u004',
    name: 'L. Chen',
    title: 'Product Manager',
    department: 'Product',
    riskScore: 12,
    riskLevel: 'low',
    lastSeen: '1h ago',
    baselineDeviation: 14,
    indicators: [],
    anomalies: [],
    recentActivity: [
      {
        id: 'r1',
        time: '1h ago',
        action: 'Document Edit',
        resource: 'Product Roadmap Q3 2025',
        location: 'Confluence',
        anomalous: false,
      },
      {
        id: 'r2',
        time: '3h ago',
        action: 'Jira Update',
        resource: 'Epic: Enterprise Dashboard v2',
        location: 'Jira',
        anomalous: false,
      },
    ],
  },
  {
    id: 'u005',
    name: 'R. Patel',
    title: 'HR Director',
    department: 'Human Resources',
    riskScore: 8,
    riskLevel: 'normal',
    lastSeen: '30m ago',
    baselineDeviation: 5,
    indicators: [],
    anomalies: [],
    recentActivity: [
      {
        id: 'r1',
        time: '30m ago',
        action: 'Workday Update',
        resource: 'Performance review cycle',
        location: 'HR Systems',
        anomalous: false,
      },
    ],
  },
];

const ANOMALY_TIMELINE = [
  {
    time: 'Now',
    userId: 'u001',
    type: 'data-exfil',
    severity: 'critical',
    text: 'M. Rodriguez — 12.4GB personal cloud upload (OneDrive) · DLP flagged',
    mitre: 'T1567.002',
  },
  {
    time: '28m',
    userId: 'u002',
    type: 'privilege-escalation',
    severity: 'high',
    text: 'K. Tanaka — Root access PROD-DB-03 outside change window',
    mitre: 'T1548.003',
  },
  {
    time: '3h',
    userId: 'u001',
    type: 'off-hours',
    severity: 'high',
    text: 'M. Rodriguez — Off-hours SharePoint access: 264 documents, M&A & Strategy folders',
    mitre: 'T1005',
  },
  {
    time: '5h',
    userId: 'u002',
    type: 'unusual-auth',
    severity: 'high',
    text: 'K. Tanaka — VPN login from Bucharest, RO (geo anomaly 98/100)',
    mitre: 'T1078.004',
  },
  {
    time: '8h',
    userId: 'u001',
    type: 'unusual-auth',
    severity: 'medium',
    text: 'M. Rodriguez — New unregistered device sign-in (iPhone 15, non-MDM)',
    mitre: undefined,
  },
  {
    time: 'Now',
    userId: 'u003',
    type: 'bulk-access',
    severity: 'medium',
    text: 'P. Okafor — SIEM queries targeting CEO/CFO/CSO email metadata',
    mitre: undefined,
  },
];

const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
};

function RiskBar({ score }: { score: number }) {
  const color =
    score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 35 ? '#f59e0b' : '#6b7280';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono font-bold w-5 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

// ─── Raw access event fixtures feeding the analytics engine ──────────────────
const USER_ACCESS_EVENTS: Record<string, AccessEvent[]> = {
  u001: [
    ...Array.from({ length: 264 }, (_, i) => ({
      timestamp: Date.now() - i * 3600000 * 0.33,
      resourceType: 'document' as const,
      sensitivity:
        i % 3 === 0
          ? ('confidential' as const)
          : i % 5 === 0
            ? ('restricted' as const)
            : ('internal' as const),
      bytesTransferred: Math.floor(50_000 + Math.random() * 2_000_000),
      offHours: i < 180,
      geoKey: 'us-ca-sf',
      deviceManaged: !(i > 240 ),
      approvedNetwork: true,
    })),
    {
      timestamp: Date.now() - 1800000,
      resourceType: 'cloud-storage' as const,
      sensitivity: 'confidential' as const,
      bytesTransferred: 13_333_000_000,
      offHours: true,
      geoKey: 'us-ca-sf',
      deviceManaged: false,
      approvedNetwork: false,
    },
  ],
  u002: Array.from({ length: 42 }, (_, i) => ({
      timestamp: Date.now() - i * 1800000,
      resourceType: 'database' as const,
      sensitivity: i < 5 ? ('restricted' as const) : ('confidential' as const),
      bytesTransferred: Math.floor(100_000 + Math.random() * 500_000),
      offHours: i < 8,
      geoKey: i < 6 ? 'ro-bucharest' : 'us-ca-sf',
      deviceManaged: true,
      approvedNetwork: !(i < 6 ),
    })),
  u003: Array.from({ length: 14 }, (_, i) => ({
    timestamp: Date.now() - i * 900000,
    resourceType: 'api' as const,
    sensitivity: i < 4 ? ('confidential' as const) : ('internal' as const),
    offHours: false,
    geoKey: 'us-ca-sf',
    deviceManaged: true,
    approvedNetwork: true,
  })),
  u004: Array.from({ length: 8 }, (_, i) => ({
    timestamp: Date.now() - i * 7200000,
    resourceType: 'document' as const,
    sensitivity: 'internal' as const,
    offHours: false,
    geoKey: 'us-ca-sf',
    deviceManaged: true,
    approvedNetwork: true,
  })),
  u005: Array.from({ length: 6 }, (_, i) => ({
    timestamp: Date.now() - i * 10800000,
    resourceType: 'document' as const,
    sensitivity: 'internal' as const,
    offHours: false,
    geoKey: 'us-ca-sf',
    deviceManaged: true,
    approvedNetwork: true,
  })),
};

const USER_BASELINES: Record<string, ReturnType<typeof buildBaseline>> = {};
for (const [uid] of Object.entries(USER_ACCESS_EVENTS)) {
  const normalEvents: AccessEvent[] = Array.from({ length: 40 }, (_, i) => ({
    timestamp: Date.now() - ((i + 14) * 86400000) / 2,
    resourceType: 'document' as const,
    sensitivity: 'internal' as const,
    bytesTransferred: 200_000,
    offHours: false,
    geoKey: 'us-ca-sf',
    deviceManaged: true,
    approvedNetwork: true,
  }));
  USER_BASELINES[uid] = buildBaseline(uid, normalEvents, 90);
}

export default function SentinelBehavioral() {
  const [selectedUser, setSelectedUser] = useState<UserProfile>(USERS[0]);
  const [pulse, setPulse] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const analyticsResults = useMemo(() => {
    const results: Record<string, ReturnType<typeof computeRiskAssessment>> = {};
    for (const user of USERS) {
      const events = USER_ACCESS_EVENTS[user.id] ?? [];
      const baseline = USER_BASELINES[user.id];
      if (baseline) {
        results[user.id] = computeRiskAssessment(user.id, events, baseline, 7);
      }
    }
    return results;
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => (p + 1) % 100), 150);
    return () => clearInterval(t);
  }, []);

  const filteredUsers = USERS.filter(
    (u) =>
      !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const computedRisk = (userId: string) => analyticsResults[userId];
  const criticalCount = USERS.filter(
    (u) => (computedRisk(u.id)?.riskScore ?? u.riskScore) >= 80,
  ).length;
  const highCount = USERS.filter((u) => {
    const s = computedRisk(u.id)?.riskScore ?? u.riskScore;
    return s >= 60 && s < 80;
  }).length;
  const monitoredCount = USERS.length;

  return (
    <div className="min-h-screen p-5 space-y-5" style={{ background: '#080B12' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-3.5 h-3.5" style={{ color: SENTINEL_ACCENT }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: SENTINEL_ACCENT }}
            >
              SENTINEL · Behavioral Analytics
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[8px] font-bold animate-pulse"
              style={{ background: 'rgba(139,92,246,0.15)', color: SENTINEL_ACCENT }}
            >
              LIVE
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">SENTINEL Insider Threat Engine</h1>
          <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
            FBI-inspired behavioral analytics — baseline profiling, anomaly detection, and insider
            threat risk scoring across all monitored identities
          </p>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
            Behavioral scan
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${pulse}%`, background: SENTINEL_ACCENT }}
              />
            </div>
            <span className="text-[9px] font-mono" style={{ color: SENTINEL_ACCENT }}>
              {pulse}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(
          [
            {
              label: 'Monitored Users',
              value: monitoredCount,
              color: SENTINEL_ACCENT,
              sub: 'active identities',
            },
            {
              label: 'Critical Risk',
              value: criticalCount,
              color: '#ef4444',
              sub: 'immediate investigation',
              pulse: criticalCount > 0,
            },
            {
              label: 'Elevated Risk',
              value: highCount,
              color: '#f97316',
              sub: 'enhanced monitoring',
            },
            {
              label: 'Anomalies Today',
              value: ANOMALY_TIMELINE.length,
              color: '#f59e0b',
              sub: 'behavioral deviations',
            },
          ] as StatCard[]
        ).map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4"
            style={{ borderColor: `${c.color}20`, background: `${c.color}06` }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-2xl font-bold font-mono" style={{ color: c.color }}>
                {c.value}
              </span>
              {c.pulse && (
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: c.color }}
                />
              )}
            </div>
            <div className="text-[10px] font-semibold text-center text-white">{c.label}</div>
            <div className="text-[9px] text-center mt-0.5" style={{ color: DS.text.muted }}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div
          className="col-span-4 rounded-xl border"
          style={{ borderColor: DS.border, background: DS.surface }}
        >
          <div
            className="px-4 py-3 border-b flex items-center gap-2"
            style={{ borderColor: DS.border }}
          >
            <Users className="w-3.5 h-3.5" style={{ color: SENTINEL_ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">
              Behavioral Risk Heatmap
            </span>
          </div>
          <div className="px-3 py-2 border-b" style={{ borderColor: DS.border }}>
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <Search className="w-3 h-3" style={{ color: DS.text.muted }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users…"
                className="flex-1 bg-transparent text-[11px] outline-none"
                style={{ color: DS.text.primary }}
              />
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
            {filteredUsers.map((u) => {
              const cr = computedRisk(u.id);
              const score = cr?.riskScore ?? u.riskScore;
              const level = (cr?.riskLevel ?? u.riskLevel) as RiskLevel;
              const deviation = cr?.baselineDeviation ?? u.baselineDeviation;
              const anomalyCount = (cr?.anomalies.length ?? 0) + u.anomalies.length;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="w-full text-left px-4 py-3 transition-colors hover:bg-white/[0.02]"
                  style={{
                    background: selectedUser.id === u.id ? 'rgba(139,92,246,0.06)' : 'transparent',
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="text-[11px] font-semibold text-white">{u.name}</div>
                      <div className="text-[9px]" style={{ color: DS.text.muted }}>
                        {u.title} · {u.department}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase"
                        style={{ background: `${RISK_COLORS[level]}15`, color: RISK_COLORS[level] }}
                      >
                        {level}
                      </span>
                      <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                        +{Math.round(deviation)}% dev
                      </span>
                    </div>
                  </div>
                  <RiskBar score={score} />
                  {anomalyCount > 0 && (
                    <div
                      className="text-[8px] mt-1.5 flex items-center gap-1"
                      style={{ color: RISK_COLORS[level] }}
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {anomalyCount} anomaly{anomalyCount !== 1 ? 's' : ''} detected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-8 space-y-4">
          {(() => {
            const cr = computedRisk(selectedUser.id);
            const score = cr?.riskScore ?? selectedUser.riskScore;
            const level = (cr?.riskLevel ?? selectedUser.riskLevel) as RiskLevel;
            const deviation = cr?.baselineDeviation ?? selectedUser.baselineDeviation;
            const computedAnomalies = cr?.anomalies ?? [];
            const totalAnomalyCount = computedAnomalies.length + selectedUser.anomalies.length;
            return (
              <>
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: `${RISK_COLORS[level]}25`,
                    background: `${RISK_COLORS[level]}04`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[8px] px-2 py-0.5 rounded font-bold uppercase"
                          style={{
                            background: `${RISK_COLORS[level]}15`,
                            color: RISK_COLORS[level],
                          }}
                        >
                          {level} risk
                        </span>
                        <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                          Last seen {selectedUser.lastSeen}
                        </span>
                        {cr && (
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(139,92,246,0.12)', color: SENTINEL_ACCENT }}
                          >
                            Engine scored
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-bold text-white">{selectedUser.name}</h2>
                      <p className="text-[11px]" style={{ color: DS.text.muted }}>
                        {selectedUser.title} · {selectedUser.department}
                      </p>
                      {cr && (
                        <div
                          className="flex gap-3 mt-2 text-[9px]"
                          style={{ color: DS.text.muted }}
                        >
                          {Object.entries(cr.factorScores).map(([k, v]) => (
                            <span key={k} className="font-mono">
                              {k
                                .replace(/([A-Z])/g, ' $1')
                                .replace('Risk', '')
                                .trim()}
                              :{' '}
                              <span
                                style={{
                                  color: v > 60 ? '#ef4444' : v > 35 ? '#f59e0b' : '#6b7280',
                                }}
                              >
                                {Math.round(v)}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div
                        className="text-3xl font-bold font-mono"
                        style={{ color: RISK_COLORS[level] }}
                      >
                        {Math.round(score)}
                      </div>
                      <div
                        className="text-[9px] uppercase tracking-wider"
                        style={{ color: DS.text.muted }}
                      >
                        Risk Score
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
                        +{Math.round(deviation)}% vs baseline
                      </div>
                    </div>
                  </div>
                  {selectedUser.indicators.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.indicators.map((ind) => (
                        <span
                          key={ind}
                          className="text-[9px] px-2 py-0.5 rounded-full"
                          style={{
                            background: `${RISK_COLORS[level]}15`,
                            color: RISK_COLORS[level],
                          }}
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {totalAnomalyCount > 0 ? (
                  <div
                    className="rounded-xl border"
                    style={{ borderColor: DS.border, background: DS.surface }}
                  >
                    <div
                      className="flex items-center gap-2 px-4 py-3 border-b"
                      style={{ borderColor: DS.border }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: SENTINEL_ACCENT }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                        Behavioral Anomalies — Investigation Evidence
                      </span>
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded font-bold ml-auto"
                        style={{ background: 'rgba(139,92,246,0.15)', color: SENTINEL_ACCENT }}
                      >
                        {totalAnomalyCount} findings
                      </span>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                      {/* Engine-computed anomalies from behavioral analytics */}
                      {computedAnomalies.map((anomaly) => (
                        <div key={anomaly.id} className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-1.5 h-full min-h-[60px] rounded-full shrink-0"
                              style={{ background: SEV_COLORS[anomaly.severity] ?? '#6b7280' }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-[7px] px-1 py-0.5 rounded font-bold"
                                  style={{
                                    background: 'rgba(139,92,246,0.12)',
                                    color: SENTINEL_ACCENT,
                                  }}
                                >
                                  ENGINE
                                </span>
                                <span
                                  className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                                  style={{
                                    background: `${SEV_COLORS[anomaly.severity] ?? '#6b7280'}15`,
                                    color: SEV_COLORS[anomaly.severity] ?? '#6b7280',
                                  }}
                                >
                                  {anomaly.severity.toUpperCase()}
                                </span>
                                <span
                                  className="text-[9px] font-mono"
                                  style={{ color: SENTINEL_ACCENT }}
                                >
                                  {anomaly.type.replace(/-/g, ' ')}
                                </span>
                                {anomaly.mitreTechnique && (
                                  <span
                                    className="text-[8px] font-mono"
                                    style={{ color: DS.text.muted }}
                                  >
                                    {anomaly.mitreTechnique}
                                  </span>
                                )}
                                <span
                                  className="text-[8px] font-mono ml-auto"
                                  style={{ color: DS.text.muted }}
                                >
                                  z={anomaly.zScore.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-[11px] font-semibold text-white mb-1.5">
                                {anomaly.description}
                              </div>
                              <div
                                className="text-[10px] p-2 rounded-lg"
                                style={{
                                  background: 'rgba(139,92,246,0.06)',
                                  color: DS.text.secondary,
                                  fontFamily: 'monospace',
                                }}
                              >
                                {anomaly.evidenceNarrative}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Static analyst-authored anomaly evidence */}
                      {selectedUser.anomalies.map((anomaly) => (
                        <div key={anomaly.id} className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-1.5 h-full min-h-[60px] rounded-full shrink-0"
                              style={{ background: SEV_COLORS[anomaly.severity] }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-[7px] px-1 py-0.5 rounded font-bold"
                                  style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    color: DS.text.muted,
                                  }}
                                >
                                  ANALYST
                                </span>
                                <span
                                  className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                                  style={{
                                    background: `${SEV_COLORS[anomaly.severity]}15`,
                                    color: SEV_COLORS[anomaly.severity],
                                  }}
                                >
                                  {anomaly.severity.toUpperCase()}
                                </span>
                                <span
                                  className="text-[9px] font-mono"
                                  style={{ color: SENTINEL_ACCENT }}
                                >
                                  {ANOMALY_TYPE_LABELS[anomaly.type]}
                                </span>
                                {anomaly.mitre && (
                                  <span
                                    className="text-[8px] font-mono"
                                    style={{ color: DS.text.muted }}
                                  >
                                    {anomaly.mitre}
                                  </span>
                                )}
                                <span
                                  className="text-[8px] ml-auto"
                                  style={{ color: DS.text.muted }}
                                >
                                  {Math.round((Date.now() - anomaly.timestamp) / 60000)}m ago
                                </span>
                              </div>
                              <div className="text-[11px] font-semibold text-white mb-1.5">
                                {anomaly.description}
                              </div>
                              <div
                                className="text-[10px] p-2 rounded-lg"
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  color: DS.text.muted,
                                  fontFamily: 'monospace',
                                }}
                              >
                                {anomaly.evidence}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-xl border p-8 text-center"
                    style={{ borderColor: DS.border, background: DS.surface }}
                  >
                    <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: '#6b7280' }} />
                    <p className="text-[11px]" style={{ color: DS.text.muted }}>
                      No behavioral anomalies detected for this user
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: DS.text.muted }}>
                      Activity within normal baseline parameters
                    </p>
                  </div>
                )}
              </>
            );
          })()}

          <div
            className="rounded-xl border"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ borderColor: DS.border }}
            >
              <Activity className="w-3.5 h-3.5" style={{ color: SENTINEL_ACCENT }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                Recent Activity Timeline
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
              {selectedUser.recentActivity.map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-12 shrink-0">
                    <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                      {event.time}
                    </span>
                  </div>
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${event.anomalous ? 'animate-pulse' : ''}`}
                    style={{ background: event.anomalous ? '#ef4444' : '#6b7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold"
                        style={{
                          color: event.anomalous
                            ? 'rgba(255,255,255,0.9)'
                            : 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {event.action}
                      </span>
                      {event.anomalous && (
                        <span
                          className="text-[8px] px-1 py-0.5 rounded"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                        >
                          ANOMALOUS
                        </span>
                      )}
                    </div>
                    <div className="text-[9px]" style={{ color: DS.text.muted }}>
                      {event.resource} · {event.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border" style={{ borderColor: DS.border, background: DS.surface }}>
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{ borderColor: DS.border }}
        >
          <Clock className="w-3.5 h-3.5" style={{ color: SENTINEL_ACCENT }} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white">
            Enterprise Anomaly Timeline
          </span>
          <span className="text-[8px] font-mono ml-auto" style={{ color: SENTINEL_ACCENT }}>
            Live · rolling 24h
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
          {ANOMALY_TIMELINE.map((item, i) => {
            const user = USERS.find((u) => u.id === item.userId);
            return (
              <button
                key={i}
                onClick={() => {
                  const u = USERS.find((x) => x.id === item.userId);
                  if (u) setSelectedUser(u);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-10 shrink-0">
                  <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                    {item.time}
                  </span>
                </div>
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: SEV_COLORS[item.severity],
                    boxShadow:
                      item.severity === 'critical'
                        ? `0 0 6px ${SEV_COLORS[item.severity]}60`
                        : 'none',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-semibold text-white">
                      {user?.name ?? item.userId}
                    </span>
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded"
                      style={{
                        background: `${SEV_COLORS[item.severity]}12`,
                        color: SEV_COLORS[item.severity],
                      }}
                    >
                      {item.severity.toUpperCase()}
                    </span>
                    {item.mitre && (
                      <span className="text-[8px] font-mono" style={{ color: SENTINEL_ACCENT }}>
                        {item.mitre}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px]" style={{ color: DS.text.muted }}>
                    {item.text}
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: DS.text.muted }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
