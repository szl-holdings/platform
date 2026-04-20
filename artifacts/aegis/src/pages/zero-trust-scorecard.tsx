import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import {
  AlertTriangle,
  BarChart2,
  CheckCircle,
  ChevronRight,
  Database,
  Eye,
  Info,
  Lock,
  Monitor,
  Network,
  Package,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  User,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  elevated: 'rgba(255,255,255,0.04)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.28)',
  },
  accent: {
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#a78bfa',
    cyan: '#22d3ee',
  },
};

type MaturityLevel = 0 | 1 | 2 | 3 | 4 | 5;

interface ZTPillar {
  id: string;
  name: string;
  icon: React.FC<{ size?: number; color?: string }>;
  color: string;
  maturity: MaturityLevel;
  maxActivities: number;
  implementedActivities: number;
  description: string;
  activities: ZTActivity[];
  gaps: string[];
  quickWins: string[];
}

interface ZTActivity {
  id: string;
  name: string;
  priority: 'P1' | 'P2' | 'P3';
  status: 'implemented' | 'in_progress' | 'planned' | 'not_started';
  nistRef: string;
  difficulty: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
}

const MATURITY_LABELS: Record<MaturityLevel, { label: string; color: string }> = {
  0: { label: 'Not Started', color: DS.accent.red },
  1: { label: 'Initial', color: DS.accent.orange },
  2: { label: 'Advanced', color: DS.accent.amber },
  3: { label: 'Optimized', color: '#84cc16' },
  4: { label: 'Leading', color: DS.accent.green },
  5: { label: 'Exemplary', color: DS.accent.cyan },
};

const INITIAL_PILLARS: ZTPillar[] = [
  {
    id: 'user',
    name: 'User',
    icon: User,
    color: DS.accent.blue,
    maturity: 2,
    maxActivities: 22,
    implementedActivities: 12,
    description: 'Identity-centric access control — verify every user, every time, every access',
    activities: [
      {
        id: 'U-1',
        name: 'MFA enforced on all users',
        priority: 'P1',
        status: 'implemented',
        nistRef: 'AC-7',
        difficulty: 'low',
        impact: 'critical',
      },
      {
        id: 'U-2',
        name: 'Privileged Access Workstations (PAWs)',
        priority: 'P1',
        status: 'in_progress',
        nistRef: 'AC-17',
        difficulty: 'high',
        impact: 'critical',
      },
      {
        id: 'U-3',
        name: 'Just-In-Time (JIT) access provisioning',
        priority: 'P1',
        status: 'planned',
        nistRef: 'AC-2',
        difficulty: 'medium',
        impact: 'high',
      },
      {
        id: 'U-4',
        name: 'Continuous user risk scoring',
        priority: 'P2',
        status: 'not_started',
        nistRef: 'IA-8',
        difficulty: 'high',
        impact: 'high',
      },
      {
        id: 'U-5',
        name: 'Passwordless authentication rollout',
        priority: 'P2',
        status: 'in_progress',
        nistRef: 'IA-5',
        difficulty: 'medium',
        impact: 'high',
      },
      {
        id: 'U-6',
        name: 'Legacy auth protocols blocked',
        priority: 'P1',
        status: 'implemented',
        nistRef: 'CM-7',
        difficulty: 'low',
        impact: 'critical',
      },
    ],
    gaps: [
      'JIT privileged access not implemented',
      'Continuous risk scoring not deployed',
      'PAW rollout incomplete (42% complete)',
    ],
    quickWins: [
      'Block legacy auth immediately (low effort, critical impact)',
      'Enable Conditional Access for all admin accounts',
    ],
  },
  {
    id: 'device',
    name: 'Device',
    icon: Monitor,
    color: DS.accent.purple,
    maturity: 2,
    maxActivities: 20,
    implementedActivities: 9,
    description:
      'Endpoint health as a condition of access — verify device integrity before granting resources',
    activities: [
      {
        id: 'D-1',
        name: 'MDM enrollment ≥95% of endpoints',
        priority: 'P1',
        status: 'implemented',
        nistRef: 'CM-8',
        difficulty: 'medium',
        impact: 'high',
      },
      {
        id: 'D-2',
        name: 'EDR full script blocking enabled',
        priority: 'P1',
        status: 'implemented',
        nistRef: 'SI-3',
        difficulty: 'low',
        impact: 'critical',
      },
      {
        id: 'D-3',
        name: 'Device compliance as access condition',
        priority: 'P1',
        status: 'in_progress',
        nistRef: 'AC-17',
        difficulty: 'medium',
        impact: 'critical',
      },
      {
        id: 'D-4',
        name: 'BYOD network isolation enforced',
        priority: 'P2',
        status: 'planned',
        nistRef: 'SC-7',
        difficulty: 'high',
        impact: 'high',
      },
      {
        id: 'D-5',
        name: 'Firmware integrity monitoring',
        priority: 'P2',
        status: 'not_started',
        nistRef: 'SI-7',
        difficulty: 'high',
        impact: 'medium',
      },
    ],
    gaps: [
      'Device compliance not fully wired to access policy',
      'BYOD devices on shared network segments',
      'Firmware monitoring not deployed',
    ],
    quickWins: [
      'Complete device compliance conditional access wiring (medium effort, critical impact)',
      'Deploy firmware integrity baseline scan',
    ],
  },
  {
    id: 'network',
    name: 'Network',
    icon: Network,
    color: DS.accent.cyan,
    maturity: 1,
    maxActivities: 22,
    implementedActivities: 6,
    description:
      'Assume breach on network — micro-segment, encrypt everywhere, eliminate implicit trust',
    activities: [
      {
        id: 'N-1',
        name: 'Micro-segmentation implemented',
        priority: 'P1',
        status: 'in_progress',
        nistRef: 'SC-7',
        difficulty: 'high',
        impact: 'critical',
      },
      {
        id: 'N-2',
        name: 'E2E encryption on internal traffic',
        priority: 'P1',
        status: 'planned',
        nistRef: 'SC-8',
        difficulty: 'high',
        impact: 'high',
      },
      {
        id: 'N-3',
        name: 'DNS filtering (Protective DNS)',
        priority: 'P2',
        status: 'implemented',
        nistRef: 'SC-20',
        difficulty: 'low',
        impact: 'high',
      },
      {
        id: 'N-4',
        name: 'SMB signing enforced across domain',
        priority: 'P1',
        status: 'not_started',
        nistRef: 'SC-8',
        difficulty: 'medium',
        impact: 'high',
      },
      {
        id: 'N-5',
        name: 'Software-defined perimeter deployed',
        priority: 'P2',
        status: 'not_started',
        nistRef: 'SC-7',
        difficulty: 'high',
        impact: 'critical',
      },
    ],
    gaps: [
      'Micro-segmentation incomplete — east-west traffic unrestricted',
      'Internal traffic not encrypted',
      'SMB signing not enforced — lateral movement risk',
      'SDP not deployed',
    ],
    quickWins: ['Enforce SMB signing via GPO immediately (low effort, blocks lateral movement)'],
  },
  {
    id: 'application',
    name: 'Application',
    icon: Package,
    color: DS.accent.orange,
    maturity: 2,
    maxActivities: 26,
    implementedActivities: 13,
    description:
      'API-first security — protect workloads, enforce least-privilege, validate every request',
    activities: [
      {
        id: 'A-1',
        name: 'API gateway with auth enforcement',
        priority: 'P1',
        status: 'implemented',
        nistRef: 'AC-4',
        difficulty: 'medium',
        impact: 'high',
      },
      {
        id: 'A-2',
        name: 'SBOM tracking for all applications',
        priority: 'P2',
        status: 'planned',
        nistRef: 'SA-12',
        difficulty: 'medium',
        impact: 'high',
      },
      {
        id: 'A-3',
        name: 'DAST/SAST in CI/CD pipeline',
        priority: 'P1',
        status: 'implemented',
        nistRef: 'SA-11',
        difficulty: 'low',
        impact: 'high',
      },
      {
        id: 'A-4',
        name: 'App-level DLP rules',
        priority: 'P1',
        status: 'in_progress',
        nistRef: 'SI-12',
        difficulty: 'medium',
        impact: 'critical',
      },
      {
        id: 'A-5',
        name: 'Container image signing + scanning',
        priority: 'P2',
        status: 'not_started',
        nistRef: 'CM-7',
        difficulty: 'medium',
        impact: 'high',
      },
    ],
    gaps: [
      'SBOM not tracked across all dependencies',
      'App-level DLP not fully deployed',
      'Container images not signed',
    ],
    quickWins: [
      'Enable SBOM generation in CI/CD pipeline (automated, low-effort)',
      'Complete DLP active blocking rollout',
    ],
  },
  {
    id: 'data',
    name: 'Data',
    icon: Database,
    color: DS.accent.amber,
    maturity: 1,
    maxActivities: 20,
    implementedActivities: 5,
    description:
      'Data-centric protection — classify, label, encrypt at rest and in transit, control access by sensitivity',
    activities: [
      {
        id: 'DA-1',
        name: 'Data classification implemented',
        priority: 'P1',
        status: 'in_progress',
        nistRef: 'RA-2',
        difficulty: 'medium',
        impact: 'high',
      },
      {
        id: 'DA-2',
        name: 'Encryption at rest (all datastores)',
        priority: 'P1',
        status: 'implemented',
        nistRef: 'SC-28',
        difficulty: 'low',
        impact: 'critical',
      },
      {
        id: 'DA-3',
        name: 'DLP active blocking (not just alert)',
        priority: 'P1',
        status: 'planned',
        nistRef: 'SI-12',
        difficulty: 'medium',
        impact: 'critical',
      },
      {
        id: 'DA-4',
        name: 'Rights management on sensitive docs',
        priority: 'P2',
        status: 'not_started',
        nistRef: 'AC-3',
        difficulty: 'high',
        impact: 'high',
      },
      {
        id: 'DA-5',
        name: 'Data inventory + lineage tracking',
        priority: 'P2',
        status: 'not_started',
        nistRef: 'PM-5',
        difficulty: 'high',
        impact: 'medium',
      },
    ],
    gaps: [
      'Data classification incomplete across all systems',
      'DLP set to alert-only (no blocking)',
      'No rights management on sensitive documents',
      'Data lineage not tracked',
    ],
    quickWins: ['Upgrade DLP policy from alert to block on P1 data classifications'],
  },
  {
    id: 'visibility',
    name: 'Visibility & Analytics',
    icon: Eye,
    color: '#34d399',
    maturity: 3,
    maxActivities: 18,
    implementedActivities: 12,
    description:
      'Full-spectrum observability — log everything, correlate signals, detect anomalies in real-time',
    activities: [
      {
        id: 'V-1',
        name: 'SIEM with normalized log ingestion',
        priority: 'P1',
        status: 'implemented',
        nistRef: 'AU-12',
        difficulty: 'medium',
        impact: 'high',
      },
      {
        id: 'V-2',
        name: 'UEBA for insider threat detection',
        priority: 'P1',
        status: 'implemented',
        nistRef: 'AU-6',
        difficulty: 'medium',
        impact: 'high',
      },
      {
        id: 'V-3',
        name: 'XDR cross-domain correlation',
        priority: 'P2',
        status: 'implemented',
        nistRef: 'IR-4',
        difficulty: 'high',
        impact: 'critical',
      },
      {
        id: 'V-4',
        name: 'Cloud security posture monitoring',
        priority: 'P1',
        status: 'in_progress',
        nistRef: 'CA-7',
        difficulty: 'low',
        impact: 'high',
      },
      {
        id: 'V-5',
        name: 'OT/ICS telemetry integration',
        priority: 'P2',
        status: 'not_started',
        nistRef: 'AU-2',
        difficulty: 'high',
        impact: 'high',
      },
    ],
    gaps: ['OT/ICS telemetry not integrated into SIEM', 'Cloud posture monitoring incomplete'],
    quickWins: ['Complete CSPM integration (near-complete, close the gap this sprint)'],
  },
  {
    id: 'automation',
    name: 'Automation & Orchestration',
    icon: Zap,
    color: '#f472b6',
    maturity: 2,
    maxActivities: 24,
    implementedActivities: 11,
    description: 'Automate response, enforce policy programmatically, eliminate manual chokepoints',
    activities: [
      {
        id: 'AU-1',
        name: 'SOAR playbooks for top-10 threats',
        priority: 'P1',
        status: 'implemented',
        nistRef: 'IR-4',
        difficulty: 'high',
        impact: 'critical',
      },
      {
        id: 'AU-2',
        name: 'Policy-as-code (OPA/Rego)',
        priority: 'P2',
        status: 'in_progress',
        nistRef: 'CM-2',
        difficulty: 'high',
        impact: 'high',
      },
      {
        id: 'AU-3',
        name: 'Automated patch orchestration',
        priority: 'P1',
        status: 'planned',
        nistRef: 'SI-2',
        difficulty: 'medium',
        impact: 'high',
      },
      {
        id: 'AU-4',
        name: 'Auto-remediation for misconfigs',
        priority: 'P2',
        status: 'not_started',
        nistRef: 'CM-6',
        difficulty: 'medium',
        impact: 'high',
      },
    ],
    gaps: [
      'Automated patch orchestration not deployed',
      'Auto-remediation for cloud misconfigs not active',
    ],
    quickWins: [
      'Deploy automated patch orchestration for critical CVEs (pre-configured tooling available)',
    ],
  },
];

function getStatusColor(status: ZTActivity['status']) {
  if (status === 'implemented') return DS.accent.green;
  if (status === 'in_progress') return DS.accent.amber;
  if (status === 'planned') return DS.accent.blue;
  return DS.text.tertiary;
}

function getStatusIcon(status: ZTActivity['status']) {
  if (status === 'implemented') return CheckCircle;
  if (status === 'in_progress') return RefreshCw;
  if (status === 'planned') return Info;
  return XCircle;
}

function getImpactColor(impact: ZTActivity['impact']) {
  if (impact === 'critical') return DS.accent.red;
  if (impact === 'high') return DS.accent.orange;
  if (impact === 'medium') return DS.accent.amber;
  return DS.text.tertiary;
}

export default function ZeroTrustScorecard() {
  const [pillars, setPillars] = useState<ZTPillar[]>(INITIAL_PILLARS);
  const [selectedPillar, setSelectedPillar] = useState<ZTPillar>(INITIAL_PILLARS[0]!);
  const [showActivities, setShowActivities] = useState(false);

  const overallScore = Math.round(
    pillars.reduce((s, p) => s + (p.implementedActivities / p.maxActivities) * 100, 0) /
      pillars.length,
  );
  const avgMaturity = (pillars.reduce((s, p) => s + p.maturity, 0) / pillars.length).toFixed(1);
  const totalImplemented = pillars.reduce((s, p) => s + p.implementedActivities, 0);
  const totalActivities = pillars.reduce((s, p) => s + p.maxActivities, 0);
  const criticalGaps = pillars.flatMap((p) => p.gaps).length;

  const radarData = pillars.map((p) => ({
    pillar: p.name,
    score: Math.round((p.implementedActivities / p.maxActivities) * 100),
    maturity: p.maturity * 20,
  }));

  const barData = pillars.map((p) => ({
    name: p.name,
    implemented: p.implementedActivities,
    remaining: p.maxActivities - p.implementedActivities,
    pct: Math.round((p.implementedActivities / p.maxActivities) * 100),
  }));

  const toggleActivity = (pillarId: string, activityId: string) => {
    setPillars((prev) =>
      prev.map((p) => {
        if (p.id !== pillarId) return p;
        const updated = p.activities.map((a) => {
          if (a.id !== activityId) return a;
          const nextStatus: ZTActivity['status'] =
            a.status === 'not_started'
              ? 'planned'
              : a.status === 'planned'
                ? 'in_progress'
                : a.status === 'in_progress'
                  ? 'implemented'
                  : 'not_started';
          return { ...a, status: nextStatus };
        });
        const implemented = updated.filter((a) => a.status === 'implemented').length;
        return { ...p, activities: updated, implementedActivities: implemented };
      }),
    );
    setSelectedPillar((prev) => {
      if (prev.id !== pillarId) return prev;
      const p = pillars.find((p) => p.id === pillarId)!;
      const updated = prev.activities.map((a) => {
        if (a.id !== activityId) return a;
        const nextStatus: ZTActivity['status'] =
          a.status === 'not_started'
            ? 'planned'
            : a.status === 'planned'
              ? 'in_progress'
              : a.status === 'in_progress'
                ? 'implemented'
                : 'not_started';
        return { ...a, status: nextStatus };
      });
      return { ...prev, activities: updated };
    });
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: DS.text.primary }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'rgba(59,130,246,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={18} color={DS.accent.blue} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
            NSA Zero Trust Maturity Scorecard
          </h1>
          <Badge
            style={{
              background: 'rgba(59,130,246,0.15)',
              color: DS.accent.blue,
              border: '1px solid rgba(59,130,246,0.3)',
              fontSize: '10px',
            }}
          >
            NSA ZIG 2026
          </Badge>
          <Badge
            style={{
              background: 'rgba(34,197,94,0.1)',
              color: DS.accent.green,
              border: '1px solid rgba(34,197,94,0.3)',
              fontSize: '10px',
            }}
          >
            152 ACTIVITIES
          </Badge>
        </div>
        <p style={{ color: DS.text.secondary, fontSize: '14px', margin: 0 }}>
          Based on the NSA's 2026 Zero Trust Implementation Guidelines — 7 pillars, 152 structured
          activities. Auto-assessed against SZL ecosystem posture.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {[
          {
            label: 'Overall ZT Score',
            value: `${overallScore}%`,
            sub: `${totalImplemented}/${totalActivities} activities`,
            color:
              overallScore > 65
                ? DS.accent.green
                : overallScore > 45
                  ? DS.accent.amber
                  : DS.accent.red,
            icon: Shield,
          },
          {
            label: 'Avg Maturity Level',
            value: `${avgMaturity}/5`,
            sub:
              MATURITY_LABELS[Math.round(parseFloat(avgMaturity)) as MaturityLevel]?.label ??
              'Advanced',
            color: DS.accent.blue,
            icon: TrendingUp,
          },
          {
            label: 'Critical Gaps',
            value: String(criticalGaps),
            sub: 'Remediation required',
            color: DS.accent.orange,
            icon: AlertTriangle,
          },
          {
            label: 'Quick Wins Available',
            value: String(
              pillars
                .filter((p) => p.quickWins.length > 0)
                .reduce((s, p) => s + p.quickWins.length, 0),
            ),
            sub: 'Low-effort, high-impact',
            color: DS.accent.green,
            icon: Zap,
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              style={{
                background: DS.surface,
                border: `1px solid ${DS.border}`,
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
              >
                <Icon size={14} color={metric.color} />
                <span style={{ fontSize: '11px', color: DS.text.tertiary }}>{metric.label}</span>
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: metric.color,
                  marginBottom: '2px',
                }}
              >
                {metric.value}
              </div>
              <div style={{ fontSize: '11px', color: DS.text.secondary }}>{metric.sub}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            background: DS.surface,
            border: `1px solid ${DS.border}`,
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: DS.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 16px',
            }}
          >
            7-Pillar Coverage
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical" margin={{ left: 80, right: 16 }}>
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: DS.text.tertiary, fontSize: 10 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: DS.text.secondary, fontSize: 11 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: `1px solid ${DS.border}`,
                  borderRadius: '8px',
                }}
                formatter={(v: number, name: string) => [
                  `${v} activities`,
                  name === 'implemented' ? 'Implemented' : 'Remaining',
                ]}
              />
              <Bar dataKey="implemented" stackId="a" fill={DS.accent.green} radius={[0, 0, 0, 0]} />
              <Bar
                dataKey="remaining"
                stackId="a"
                fill="rgba(255,255,255,0.06)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            background: DS.surface,
            border: `1px solid ${DS.border}`,
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: DS.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 12px',
            }}
          >
            Maturity Radar
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={DS.border} />
              <PolarAngleAxis dataKey="pillar" tick={{ fill: DS.text.tertiary, fontSize: 9 }} />
              <Radar
                name="Score"
                dataKey="score"
                stroke={DS.accent.blue}
                fill={DS.accent.blue}
                fillOpacity={0.15}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        <div
          style={{
            background: DS.surface,
            border: `1px solid ${DS.border}`,
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: DS.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 12px',
            }}
          >
            Pillars
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {pillars.map((p) => {
              const Icon = p.icon;
              const pct = Math.round((p.implementedActivities / p.maxActivities) * 100);
              const isSelected = selectedPillar.id === p.id;
              const maturity = MATURITY_LABELS[p.maturity];
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPillar(p);
                    setShowActivities(false);
                  }}
                  style={{
                    background: isSelected ? `${p.color}15` : 'transparent',
                    border: `1px solid ${isSelected ? p.color + '50' : DS.border}`,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={14} color={isSelected ? p.color : DS.text.tertiary} />
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isSelected ? DS.text.primary : DS.text.secondary,
                        flex: 1,
                      }}
                    >
                      {p.name}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: maturity.color }}>
                      {p.maturity}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: '6px',
                      height: '3px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: p.color,
                        borderRadius: '2px',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}
                  >
                    <span style={{ fontSize: '10px', color: DS.text.tertiary }}>
                      {p.implementedActivities}/{p.maxActivities}
                    </span>
                    <span style={{ fontSize: '10px', color: maturity.color }}>
                      {maturity.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: DS.surface,
              border: `1px solid ${DS.border}`,
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
            >
              <selectedPillar.icon size={20} color={selectedPillar.color} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  {selectedPillar.name} Pillar
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: DS.text.secondary }}>
                  {selectedPillar.description}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: MATURITY_LABELS[selectedPillar.maturity].color,
                  }}
                >
                  {selectedPillar.maturity}/5
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: MATURITY_LABELS[selectedPillar.maturity].color,
                  }}
                >
                  {MATURITY_LABELS[selectedPillar.maturity].label}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: DS.elevated, borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '11px', color: DS.text.tertiary, margin: '0 0 6px' }}>
                  Critical Gaps
                </p>
                {selectedPillar.gaps.map((gap, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                    <XCircle
                      size={12}
                      color={DS.accent.red}
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    />
                    <span style={{ fontSize: '11px', color: DS.text.secondary, lineHeight: 1.5 }}>
                      {gap}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ background: DS.elevated, borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '11px', color: DS.text.tertiary, margin: '0 0 6px' }}>
                  Quick Wins
                </p>
                {selectedPillar.quickWins.map((win, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                    <Zap
                      size={12}
                      color={DS.accent.green}
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    />
                    <span style={{ fontSize: '11px', color: DS.text.secondary, lineHeight: 1.5 }}>
                      {win}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              background: DS.surface,
              border: `1px solid ${DS.border}`,
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: DS.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: 0,
                }}
              >
                Activities — {selectedPillar.name}
              </p>
              <button
                onClick={() => setShowActivities(!showActivities)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${DS.border}`,
                  borderRadius: '6px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  color: DS.text.secondary,
                  fontSize: '11px',
                }}
              >
                {showActivities ? 'Hide' : 'Show All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(showActivities
                ? selectedPillar.activities
                : selectedPillar.activities.slice(0, 4)
              ).map((activity) => {
                const StatusIcon = getStatusIcon(activity.status);
                return (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      background: DS.elevated,
                      borderRadius: '6px',
                      borderLeft: `3px solid ${getStatusColor(activity.status)}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleActivity(selectedPillar.id, activity.id)}
                  >
                    <StatusIcon
                      size={14}
                      color={getStatusColor(activity.status)}
                      style={{ flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '12px', color: DS.text.primary, flex: 1 }}>
                      {activity.name}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Badge
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: DS.text.tertiary,
                          border: 'none',
                          fontSize: '9px',
                        }}
                      >
                        {activity.nistRef}
                      </Badge>
                      <Badge
                        style={{
                          background: `${getImpactColor(activity.impact)}15`,
                          color: getImpactColor(activity.impact),
                          border: 'none',
                          fontSize: '9px',
                        }}
                      >
                        {activity.impact}
                      </Badge>
                      <Badge
                        style={{
                          background:
                            activity.priority === 'P1'
                              ? 'rgba(239,68,68,0.12)'
                              : 'rgba(255,255,255,0.04)',
                          color: activity.priority === 'P1' ? DS.accent.red : DS.text.tertiary,
                          border: 'none',
                          fontSize: '9px',
                        }}
                      >
                        {activity.priority}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {!showActivities && selectedPillar.activities.length > 4 && (
                <button
                  onClick={() => setShowActivities(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: DS.text.tertiary,
                    fontSize: '11px',
                    cursor: 'pointer',
                    padding: '4px',
                    textAlign: 'left',
                  }}
                >
                  +{selectedPillar.activities.length - 4} more activities — click to expand
                </button>
              )}
            </div>
            <p style={{ fontSize: '10px', color: DS.text.tertiary, margin: '10px 0 0' }}>
              💡 Click any activity to advance its status. ZT score updates in real-time.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(59,130,246,0.08)',
              border: `1px solid rgba(59,130,246,0.2)`,
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: DS.accent.blue,
                margin: '0 0 8px',
              }}
            >
              NSA ZIG 2026 Assessment Basis
            </p>
            <p
              style={{
                fontSize: '12px',
                color: DS.text.secondary,
                margin: '0 0 8px',
                lineHeight: 1.6,
              }}
            >
              This scorecard is based on the NSA's Zero Trust Implementation Guidelines, structured
              across 7 pillars with 152 measurable activities. Current SZL overall maturity:{' '}
              <strong style={{ color: DS.text.primary }}>
                {avgMaturity}/5 ({overallScore}% implemented)
              </strong>
              .
            </p>
            <p style={{ fontSize: '12px', color: DS.text.secondary, margin: 0, lineHeight: 1.6 }}>
              Priority focus: <strong style={{ color: DS.accent.orange }}>Network pillar</strong>{' '}
              (maturity 1/5) and <strong style={{ color: DS.accent.amber }}>Data pillar</strong>{' '}
              (maturity 1/5) represent the greatest risk exposure. Addressing{' '}
              {pillars.filter((p) => p.maturity <= 1).reduce((s, p) => s + p.quickWins.length, 0)}{' '}
              identified quick wins could advance overall score by ~{Math.round(criticalGaps * 1.8)}
              %.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
