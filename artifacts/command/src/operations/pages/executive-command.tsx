import { useDemoMode } from '@lyte/lib/demo-mode';
import { cn } from '@lyte/lib/utils';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Cpu,
  Database,
  Eye,
  FileText,
  GitBranch,
  Hash,
  Heart,
  Layers,
  Play,
  Radio,
  Server,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { GovernedDecisionSummary } from '../components/governed-decision/decision-summary-card';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e', panel: '#0e1219' };
const BORDER = {
  subtle: 'rgba(255,255,255,0.04)',
  muted: 'rgba(255,255,255,0.06)',
  accent: 'rgba(45,212,191,0.12)',
};
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const ELECTRIC = '#2dd4bf';
const ELECTRIC_DIM = 'rgba(45,212,191,0.12)';

type PackStatus = 'healthy' | 'degraded' | 'warning' | 'offline';

interface PackSignal {
  pack: string;
  label: string;
  color: string;
  status: PackStatus;
  health: number;
  openItems: number;
  criticalCount: number;
  lastSignal: string;
  riskValue: string;
  trend: 'up' | 'down' | 'stable';
}

const PACK_SIGNALS: PackSignal[] = [
  {
    pack: 'PRISM',
    label: 'Portfolio Intelligence',
    color: '#d4a054',
    status: 'warning',
    health: 71,
    openItems: 14,
    criticalCount: 3,
    lastSignal: '4m ago',
    riskValue: '$5.03M',
    trend: 'down',
  },
  {
    pack: 'Terra',
    label: 'Real Estate Intelligence',
    color: '#a07848',
    status: 'healthy',
    health: 88,
    openItems: 6,
    criticalCount: 0,
    lastSignal: '11m ago',
    riskValue: '$1.2M',
    trend: 'stable',
  },
  {
    pack: 'Vessels',
    label: 'Fleet Command',
    color: '#38bdf8',
    status: 'degraded',
    health: 52,
    openItems: 21,
    criticalCount: 5,
    lastSignal: '2m ago',
    riskValue: '$8.7M',
    trend: 'down',
  },
  {
    pack: 'Aegis',
    label: 'Defense & Intelligence',
    color: '#4f6ef7',
    status: 'healthy',
    health: 94,
    openItems: 3,
    criticalCount: 0,
    lastSignal: '28m ago',
    riskValue: '$0.4M',
    trend: 'up',
  },
];

const PRESSURE_ITEMS = [
  {
    pack: 'Vessels',
    title: 'Fleet ETA compliance gap — 3 vessels outside SLA',
    severity: 'critical',
    age: '6h',
    impact: '$2.1M',
    owner: 'Fleet Ops',
    stage: 'Escalated',
    dueDate: 'Today',
    risk: 'SLA Breach',
  },
  {
    pack: 'PRISM',
    title: 'Ownership conflict detected in accounts receivable',
    severity: 'high',
    age: '14h',
    impact: '$890K',
    owner: 'Finance',
    stage: 'Review',
    dueDate: 'Apr 17',
    risk: 'Ownership Gap',
  },
  {
    pack: 'Vessels',
    title: 'Fuel surcharge approval chain stalled',
    severity: 'high',
    age: '22h',
    impact: '$450K',
    owner: 'Fleet Ops',
    stage: 'Approval Pending',
    dueDate: 'Overdue',
    risk: 'Process Stall',
  },
  {
    pack: 'PRISM',
    title: 'Executive approval pending — Q2 pricing revision',
    severity: 'high',
    age: '31h',
    impact: '$1.2M',
    owner: 'Operations',
    stage: 'Approval Pending',
    dueDate: 'Overdue',
    risk: 'Revenue Risk',
  },
  {
    pack: 'Terra',
    title: 'Lease renewal document missing signature block',
    severity: 'medium',
    age: '2d',
    impact: '$320K',
    owner: 'Legal',
    stage: 'In Progress',
    dueDate: 'Apr 18',
    risk: 'Compliance',
  },
];

const MOVEMENT_ITEMS = [
  {
    pack: 'Aegis',
    title: 'Security posture audit completed — 94% score',
    type: 'milestone',
    time: '1h ago',
  },
  {
    pack: 'Terra',
    title: 'Portfolio appraisal cycle closed — 6 assets reviewed',
    type: 'completion',
    time: '3h ago',
  },
  {
    pack: 'PRISM',
    title: 'Q1 executive digest generated and distributed',
    type: 'completion',
    time: '5h ago',
  },
  {
    pack: 'Vessels',
    title: 'Vessel M/V Meridian departed — Cape Town bound',
    type: 'event',
    time: '7h ago',
  },
  {
    pack: 'Aegis',
    title: 'Threat brief updated — 3 new indicators catalogued',
    type: 'milestone',
    time: '9h ago',
  },
];

const PENDING_APPROVALS = [
  {
    id: 'A-1041',
    title: 'Q2 pricing revision — PRISM portfolio',
    requestedBy: 'Operations',
    age: '31h',
    urgency: 'high',
    evidence: 'Revenue model v4.2, Q1 actuals PDF',
    confidence: 88,
    approvalChain: [
      {
        actor: 'Sarah Chen',
        role: 'Director',
        action: 'submitted',
        time: '31h ago',
        status: 'done',
      },
      {
        actor: 'Michael Torres',
        role: 'VP Finance',
        action: 'approved',
        time: '28h ago',
        status: 'done',
      },
      { actor: 'Stephen Lutar', role: 'CXO', action: 'pending', time: '—', status: 'pending' },
    ],
  },
  {
    id: 'A-1038',
    title: 'Fuel surcharge rate increase — Vessels fleet',
    requestedBy: 'Fleet Ops',
    age: '22h',
    urgency: 'high',
    evidence: 'Bunker cost analysis, IMO compliance brief',
    confidence: 92,
    approvalChain: [
      { actor: 'Fleet Command', role: 'Ops', action: 'submitted', time: '22h ago', status: 'done' },
      { actor: 'Stephen Lutar', role: 'CXO', action: 'pending', time: '—', status: 'pending' },
    ],
  },
  {
    id: 'A-1033',
    title: 'Terra asset refinancing — Building 7A',
    requestedBy: 'Finance',
    age: '4d',
    urgency: 'medium',
    evidence: 'Asset valuation report, bank term sheet',
    confidence: 76,
    approvalChain: [
      {
        actor: 'Terra Finance',
        role: 'Finance',
        action: 'submitted',
        time: '4d ago',
        status: 'done',
      },
      { actor: 'Risk Committee', role: 'Risk', action: 'review', time: '2d ago', status: 'review' },
      { actor: 'Stephen Lutar', role: 'CXO', action: 'pending', time: '—', status: 'pending' },
    ],
  },
  {
    id: 'A-1029',
    title: 'New vendor onboarding — security services',
    requestedBy: 'Aegis',
    age: '6d',
    urgency: 'low',
    evidence: 'Vendor SOC2 report, pricing proposal',
    confidence: 84,
    approvalChain: [
      { actor: 'Aegis Ops', role: 'Ops', action: 'submitted', time: '6d ago', status: 'done' },
      { actor: 'Procurement', role: 'Proc', action: 'approved', time: '5d ago', status: 'done' },
      { actor: 'Stephen Lutar', role: 'CXO', action: 'pending', time: '—', status: 'pending' },
    ],
  },
];

const SERVICE_HEALTH = [
  { name: 'API Gateway', status: 'healthy', latency: '34ms', uptime: '99.97%' },
  { name: 'Auth Service', status: 'healthy', latency: '12ms', uptime: '100%' },
  { name: 'PRISM Engine', status: 'warning', latency: '218ms', uptime: '98.1%' },
  { name: 'Vessels Feed', status: 'degraded', latency: '2.1s', uptime: '91.4%' },
  { name: 'Terra Data', status: 'healthy', latency: '67ms', uptime: '99.88%' },
  { name: 'Aegis Intel', status: 'healthy', latency: '44ms', uptime: '99.99%' },
];

const OPERATING_LOOP = [
  {
    id: 'observe',
    label: 'Observe',
    icon: Eye,
    count: 44,
    active: true,
    description: '44 active signals',
  },
  {
    id: 'evaluate',
    label: 'Evaluate',
    icon: BarChart3,
    count: 18,
    active: true,
    description: '18 under analysis',
  },
  {
    id: 'decide',
    label: 'Decide',
    icon: Target,
    count: 8,
    active: true,
    description: '8 decision items',
  },
  {
    id: 'approve',
    label: 'Approve',
    icon: CheckCircle2,
    count: 4,
    active: true,
    description: '4 pending approval',
  },
  { id: 'act', label: 'Act', icon: Play, count: 12, active: true, description: '12 in motion' },
  {
    id: 'prove',
    label: 'Prove',
    icon: CheckCheck,
    count: 31,
    active: true,
    description: '31 evidenced',
  },
];

function statusColor(s: PackStatus) {
  return s === 'healthy'
    ? '#22c55e'
    : s === 'warning'
      ? '#d4a054'
      : s === 'degraded'
        ? '#c45a4a'
        : '#6b7280';
}

function statusLabel(s: PackStatus) {
  return s === 'healthy'
    ? 'Healthy'
    : s === 'warning'
      ? 'Warning'
      : s === 'degraded'
        ? 'Degraded'
        : 'Offline';
}

function serviceStatusColor(s: string) {
  return s === 'healthy' ? '#22c55e' : s === 'warning' ? '#d4a054' : '#c45a4a';
}

function SeverityBadge({ sev }: { sev: string }) {
  const cfg: Record<string, { fg: string; bg: string }> = {
    critical: { fg: '#c45a4a', bg: 'rgba(196,90,74,0.09)' },
    high: { fg: '#c8953c', bg: 'rgba(200,149,60,0.09)' },
    medium: { fg: '#d4a054', bg: 'rgba(212,160,84,0.09)' },
    low: { fg: TEXT.tertiary, bg: 'rgba(255,255,255,0.04)' },
  };
  const c = cfg[sev] ?? cfg.medium;
  return (
    <span
      className="text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wide"
      style={{ color: c.fg, background: c.bg }}
    >
      {sev}
    </span>
  );
}

function PackCard({ p }: { p: PackSignal }) {
  const sc = statusColor(p.status);
  const TrendIcon = p.trend === 'up' ? TrendingUp : p.trend === 'down' ? TrendingDown : Activity;
  return (
    <div
      className="rounded-md p-3.5 flex flex-col gap-2.5 relative overflow-hidden transition-all hover:border-opacity-30"
      style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${p.color}60, ${p.color}20)` }}
      />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold tracking-wider" style={{ color: p.color }}>
              {p.pack}
            </span>
            <span className="w-1 h-1 rounded-full" style={{ background: sc }} />
            <span className="text-[8px]" style={{ color: sc }}>
              {statusLabel(p.status)}
            </span>
          </div>
          <p className="text-[9px]" style={{ color: TEXT.secondary }}>
            {p.label}
          </p>
        </div>
        <TrendIcon
          className="w-3.5 h-3.5 shrink-0 mt-0.5"
          style={{
            color: p.trend === 'up' ? '#22c55e' : p.trend === 'down' ? '#c45a4a' : TEXT.tertiary,
          }}
        />
      </div>

      <div
        className="relative h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${p.health}%`,
            background: `linear-gradient(90deg, ${p.color}80, ${p.color})`,
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          {
            k: 'Health',
            v: `${p.health}%`,
            c: p.health > 75 ? '#22c55e' : p.health > 50 ? '#d4a054' : '#c45a4a',
          },
          { k: 'Open', v: String(p.openItems), c: p.openItems > 15 ? '#c45a4a' : TEXT.secondary },
          {
            k: 'Critical',
            v: String(p.criticalCount),
            c: p.criticalCount > 0 ? '#c45a4a' : '#22c55e',
          },
        ].map((r) => (
          <div
            key={r.k}
            className="rounded p-1.5 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER.subtle}` }}
          >
            <div className="text-[11px] font-mono font-semibold" style={{ color: r.c }}>
              {r.v}
            </div>
            <div
              className="text-[7px] uppercase tracking-widest mt-0.5"
              style={{ color: TEXT.muted }}
            >
              {r.k}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[8px]">
        <span style={{ color: TEXT.tertiary }}>
          Risk Value{' '}
          <span className="font-mono" style={{ color: '#c8953c' }}>
            {p.riskValue}
          </span>
        </span>
        <span style={{ color: TEXT.muted }}>Signal {p.lastSignal}</span>
      </div>
    </div>
  );
}

function OperatingLoopRail() {
  return (
    <div
      className="rounded-md px-4 py-3"
      style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <CircleDot className="w-3 h-3" style={{ color: ELECTRIC }} />
        <span
          className="text-[9px] font-medium uppercase tracking-widest"
          style={{ color: TEXT.muted }}
        >
          Operating Loop — Observe → Evaluate → Decide → Approve → Act → Prove
        </span>
      </div>
      <div className="flex items-center gap-0">
        {OPERATING_LOOP.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === OPERATING_LOOP.length - 1;
          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <div className="flex-1 min-w-0 group cursor-default">
                <div
                  className="rounded px-2 py-2 flex flex-col items-center gap-1 transition-all hover:border-opacity-40"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${step.active ? ELECTRIC + '20' : BORDER.subtle}`,
                  }}
                  title={step.description}
                >
                  <div className="flex items-center gap-1">
                    <Icon
                      className="w-3 h-3"
                      style={{ color: step.active ? ELECTRIC : TEXT.muted }}
                    />
                    <span
                      className="text-[9px] font-medium"
                      style={{ color: step.active ? TEXT.secondary : TEXT.muted }}
                    >
                      {step.label}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-mono font-bold"
                    style={{
                      color: step.active ? (step.count > 0 ? ELECTRIC : '#22c55e') : TEXT.muted,
                    }}
                  >
                    {step.count}
                  </span>
                </div>
              </div>
              {!isLast && (
                <ArrowRight className="w-2.5 h-2.5 shrink-0 mx-0.5" style={{ color: TEXT.muted }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServiceHealthStrip() {
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
      >
        <div className="flex items-center gap-2">
          <Server className="w-3 h-3" style={{ color: TEXT.tertiary }} />
          <span className="text-[10px] font-medium" style={{ color: TEXT.secondary }}>
            Service Health
          </span>
          <span
            className="text-[8px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e' }}
          >
            {SERVICE_HEALTH.filter((s) => s.status === 'healthy').length}/{SERVICE_HEALTH.length}{' '}
            Healthy
          </span>
        </div>
        <Link href="/operations/topology">
          <span className="text-[8px] flex items-center gap-1" style={{ color: TEXT.tertiary }}>
            Full topology <ChevronRight className="w-2.5 h-2.5" />
          </span>
        </Link>
      </div>
      <div
        className="grid grid-cols-3 md:grid-cols-6 divide-x"
        style={{ borderColor: BORDER.subtle }}
      >
        {SERVICE_HEALTH.map((svc) => {
          const sc = serviceStatusColor(svc.status);
          return (
            <div
              key={svc.name}
              className="px-3 py-2.5 text-center"
              style={{ borderColor: BORDER.subtle }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc }} />
                <span className="text-[9px] font-medium truncate" style={{ color: TEXT.secondary }}>
                  {svc.name}
                </span>
              </div>
              <div className="text-[10px] font-mono" style={{ color: sc }}>
                {svc.latency}
              </div>
              <div className="text-[7px] font-mono" style={{ color: TEXT.muted }}>
                {svc.uptime}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApprovalAuditChain({ chain }: { chain: (typeof PENDING_APPROVALS)[0]['approvalChain'] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap mt-1.5">
      {chain.map((step, i) => (
        <div key={i} className="flex items-center gap-0.5">
          <div className="flex items-center gap-1 text-[8px]">
            <span
              className="px-1.5 py-0.5 rounded font-mono"
              style={{
                color:
                  step.status === 'done'
                    ? '#22c55e'
                    : step.status === 'pending'
                      ? TEXT.muted
                      : '#d4a054',
                background:
                  step.status === 'done'
                    ? 'rgba(34,197,94,0.07)'
                    : step.status === 'pending'
                      ? 'rgba(255,255,255,0.03)'
                      : 'rgba(212,160,84,0.07)',
              }}
            >
              {step.actor}
            </span>
            {step.status === 'done' && (
              <CheckCircle2 className="w-2.5 h-2.5" style={{ color: '#22c55e' }} />
            )}
            {step.status === 'pending' && (
              <Clock className="w-2.5 h-2.5" style={{ color: TEXT.muted }} />
            )}
            {step.status === 'review' && (
              <Eye className="w-2.5 h-2.5" style={{ color: '#d4a054' }} />
            )}
          </div>
          {i < chain.length - 1 && (
            <ArrowRight className="w-2.5 h-2.5" style={{ color: TEXT.muted }} />
          )}
        </div>
      ))}
    </div>
  );
}

function DemoModeBanner() {
  const { state } = useDemoMode();
  if (!state.active) return null;
  return (
    <div
      className="flex items-center gap-3 px-4 py-2 rounded-md"
      style={{ background: 'rgba(212,160,84,0.07)', border: `1px solid rgba(212,160,84,0.2)` }}
    >
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
            style={{ background: '#d4a054' }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: '#d4a054' }}
          />
        </span>
        <span
          className="text-[10px] font-mono font-bold uppercase tracking-widest"
          style={{ color: '#d4a054' }}
        >
          Demo Mode Active
        </span>
      </div>
      <span className="text-[9px]" style={{ color: 'rgba(212,160,84,0.6)' }}>
        All data is synthetic — no live systems connected. Toggle demo mode off to connect real
        signals.
      </span>
      <div className="ml-auto shrink-0">
        <span
          className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase"
          style={{
            background: 'rgba(212,160,84,0.12)',
            color: '#d4a054',
            border: '1px solid rgba(212,160,84,0.2)',
          }}
        >
          SEEDED
        </span>
      </div>
    </div>
  );
}

export default function ExecutiveCommandPage() {
  const [tab, setTab] = useState<'pressure' | 'movement'>('pressure');
  const [expandedApproval, setExpandedApproval] = useState<string | null>(null);

  const totalRisk = PACK_SIGNALS.reduce((sum, p) => {
    const v = parseFloat(p.riskValue.replace(/[$M]/g, ''));
    return sum + (p.riskValue.includes('M') ? v : v / 1000);
  }, 0);

  return (
    <div className="p-4 md:p-5 space-y-4" style={{ background: BG.page }}>
      {/* Demo mode banner — only shown when demo is active */}
      <DemoModeBanner />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: ELECTRIC }}
            />
            <span
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: ELECTRIC }}
            >
              Executive Command
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
            Portfolio Health Overview
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Aggregated signals across all intelligence packs —{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="rounded px-2.5 py-1.5 text-center"
            style={{ background: ELECTRIC_DIM, border: `1px solid rgba(45,212,191,0.18)` }}
          >
            <div className="text-[11px] font-mono font-bold" style={{ color: ELECTRIC }}>
              {PENDING_APPROVALS.length}
            </div>
            <div
              className="text-[7px] uppercase tracking-wider"
              style={{ color: 'rgba(45,212,191,0.55)' }}
            >
              Pending Approvals
            </div>
          </div>
          <div
            className="rounded px-2.5 py-1.5 text-center"
            style={{ background: 'rgba(196,90,74,0.08)', border: `1px solid rgba(196,90,74,0.14)` }}
          >
            <div className="text-[11px] font-mono font-bold" style={{ color: '#c45a4a' }}>
              ${totalRisk.toFixed(1)}M
            </div>
            <div
              className="text-[7px] uppercase tracking-wider"
              style={{ color: 'rgba(196,90,74,0.55)' }}
            >
              At Risk
            </div>
          </div>
        </div>
      </div>

      {/* Operating Loop Rail */}
      <OperatingLoopRail />

      {/* Portfolio Health — Pack Status Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span
            className="text-[9px] font-medium uppercase tracking-widest"
            style={{ color: TEXT.muted }}
          >
            Pack Signal Summary
          </span>
          <span className="text-[8px]" style={{ color: TEXT.tertiary }}>
            Updated live
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {PACK_SIGNALS.map((p) => (
            <PackCard key={p.pack} p={p} />
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Active Packs',
            value: '4',
            sub: 'All reporting',
            icon: Layers,
            color: ELECTRIC,
          },
          {
            label: 'Healthy',
            value: String(PACK_SIGNALS.filter((p) => p.status === 'healthy').length),
            sub: 'of 4 packs',
            icon: Heart,
            color: '#22c55e',
          },
          {
            label: 'Open Signals',
            value: String(PACK_SIGNALS.reduce((s, p) => s + p.openItems, 0)),
            sub: 'across portfolio',
            icon: Radio,
            color: '#d4a054',
          },
          {
            label: 'Critical Items',
            value: String(PACK_SIGNALS.reduce((s, p) => s + p.criticalCount, 0)),
            sub: 'require attention',
            icon: AlertTriangle,
            color: '#c45a4a',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-md p-3 flex items-center gap-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{ background: `${k.color}12` }}
            >
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <div>
              <div className="text-base font-bold font-mono" style={{ color: k.color }}>
                {k.value}
              </div>
              <div className="text-[9px]" style={{ color: TEXT.secondary }}>
                {k.label}
              </div>
              <div className="text-[8px]" style={{ color: TEXT.tertiary }}>
                {k.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Service Health */}
      <ServiceHealthStrip />

      {/* Pressure Board + Movement Board */}
      <div
        className="rounded-md overflow-hidden"
        style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
      >
        <div
          className="flex items-center gap-0"
          style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
        >
          {(['pressure', 'movement'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest transition-colors"
              style={{
                color: tab === t ? TEXT.primary : TEXT.tertiary,
                borderBottom: tab === t ? `2px solid ${ELECTRIC}` : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {t === 'pressure' ? 'Pressure Board' : 'Movement Board'}
            </button>
          ))}
          <div className="ml-auto px-3">
            <Link href={tab === 'pressure' ? '/operations/blocker-board' : '/operations/digest'}>
              <span className="text-[8px] flex items-center gap-1" style={{ color: TEXT.tertiary }}>
                View all <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>

        <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
          {tab === 'pressure'
            ? PRESSURE_ITEMS.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-12 shrink-0 pt-0.5">
                    <span
                      className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color:
                          PACK_SIGNALS.find((p) => p.pack === item.pack)?.color ?? TEXT.tertiary,
                        background: `${PACK_SIGNALS.find((p) => p.pack === item.pack)?.color ?? '#fff'}12`,
                      }}
                    >
                      {item.pack}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px]" style={{ color: TEXT.primary }}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <SeverityBadge sev={item.severity} />
                      <span
                        className="text-[8px] flex items-center gap-1"
                        style={{ color: TEXT.muted }}
                      >
                        <Clock className="w-2.5 h-2.5" /> {item.age}
                      </span>
                      <span
                        className="text-[8px] flex items-center gap-1"
                        style={{ color: TEXT.muted }}
                      >
                        <User className="w-2.5 h-2.5" /> {item.owner}
                      </span>
                      <span
                        className="text-[8px] flex items-center gap-1"
                        style={{ color: TEXT.muted }}
                      >
                        <CircleDot className="w-2.5 h-2.5" />
                        <span
                          style={{
                            color: item.stage.includes('Pending')
                              ? '#c8953c'
                              : item.stage === 'Escalated'
                                ? '#c45a4a'
                                : TEXT.tertiary,
                          }}
                        >
                          {item.stage}
                        </span>
                      </span>
                      <span
                        className="text-[8px] flex items-center gap-1"
                        style={{
                          color:
                            item.dueDate === 'Overdue'
                              ? '#c45a4a'
                              : item.dueDate === 'Today'
                                ? '#d4a054'
                                : TEXT.muted,
                        }}
                      >
                        <Calendar className="w-2.5 h-2.5" /> {item.dueDate}
                      </span>
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded"
                        style={{ color: TEXT.tertiary, background: 'rgba(255,255,255,0.03)' }}
                      >
                        {item.risk}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right pt-0.5">
                    <span
                      className="text-[10px] font-mono font-medium"
                      style={{ color: '#c8953c' }}
                    >
                      {item.impact}
                    </span>
                    <div className="text-[7px] uppercase" style={{ color: TEXT.muted }}>
                      impact
                    </div>
                  </div>
                </div>
              ))
            : MOVEMENT_ITEMS.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-12 shrink-0">
                    <span
                      className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color:
                          PACK_SIGNALS.find((p) => p.pack === item.pack)?.color ?? TEXT.tertiary,
                        background: `${PACK_SIGNALS.find((p) => p.pack === item.pack)?.color ?? '#fff'}12`,
                      }}
                    >
                      {item.pack}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate" style={{ color: TEXT.primary }}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded capitalize"
                        style={{
                          color:
                            item.type === 'milestone'
                              ? ELECTRIC
                              : item.type === 'completion'
                                ? '#22c55e'
                                : TEXT.secondary,
                          background:
                            item.type === 'milestone'
                              ? ELECTRIC_DIM
                              : item.type === 'completion'
                                ? 'rgba(34,197,94,0.08)'
                                : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <span className="text-[8px] shrink-0" style={{ color: TEXT.muted }}>
                    {item.time}
                  </span>
                </div>
              ))}
        </div>
      </div>

      {/* Approval Overwatch — with audit trail */}
      <div
        className="rounded-md overflow-hidden"
        style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: ELECTRIC }} />
            <span className="text-[11px] font-medium" style={{ color: TEXT.primary }}>
              Approval Overwatch
            </span>
            <span
              className="w-4 h-4 rounded text-[8px] font-mono flex items-center justify-center"
              style={{ background: 'rgba(196,90,74,0.12)', color: '#c45a4a' }}
            >
              {PENDING_APPROVALS.length}
            </span>
          </div>
          <Link href="/operations/approvals">
            <span className="text-[9px] flex items-center gap-1" style={{ color: TEXT.tertiary }}>
              Full console <ArrowUpRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
        <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
          {PENDING_APPROVALS.map((a) => {
            const isExpanded = expandedApproval === a.id;
            return (
              <div
                key={a.id}
                className="transition-colors"
                style={{ background: isExpanded ? 'rgba(255,255,255,0.01)' : 'transparent' }}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
                  onClick={() => setExpandedApproval(isExpanded ? null : a.id)}
                >
                  <span className="text-[8px] font-mono shrink-0" style={{ color: TEXT.tertiary }}>
                    {a.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate" style={{ color: TEXT.secondary }}>
                      {a.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[8px]" style={{ color: TEXT.muted }}>
                        {a.requestedBy}
                      </span>
                      <span
                        className="text-[7px] px-1 py-px rounded font-mono"
                        style={{ background: 'rgba(255,255,255,0.04)', color: TEXT.muted }}
                      >
                        {a.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <SeverityBadge sev={a.urgency} />
                    <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                      {a.age}
                    </span>
                    <ChevronRight
                      className="w-3 h-3 transition-transform"
                      style={{
                        color: TEXT.muted,
                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                      }}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div
                    className="px-4 pb-3 pt-1"
                    style={{ borderTop: `1px solid ${BORDER.subtle}` }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div
                          className="text-[8px] uppercase tracking-widest mb-1.5 font-medium"
                          style={{ color: TEXT.muted }}
                        >
                          Evidence / Provenance
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <FileText className="w-2.5 h-2.5" style={{ color: TEXT.tertiary }} />
                          <span className="text-[9px]" style={{ color: TEXT.secondary }}>
                            {a.evidence}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-[8px] uppercase tracking-widest mb-1.5 font-medium"
                          style={{ color: TEXT.muted }}
                        >
                          Approval Chain
                        </div>
                        <ApprovalAuditChain chain={a.approvalChain} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        className="text-[9px] px-2.5 py-1.5 rounded font-medium transition-all hover:opacity-80"
                        style={{
                          color: '#22c55e',
                          background: 'rgba(34,197,94,0.08)',
                          border: '1px solid rgba(34,197,94,0.2)',
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="text-[9px] px-2.5 py-1.5 rounded font-medium transition-all hover:opacity-80"
                        style={{
                          color: '#c45a4a',
                          background: 'rgba(196,90,74,0.08)',
                          border: '1px solid rgba(196,90,74,0.2)',
                        }}
                      >
                        Reject
                      </button>
                      <button
                        className="text-[9px] px-2.5 py-1.5 rounded font-medium transition-all hover:opacity-80"
                        style={{
                          color: '#8b7ac8',
                          background: 'rgba(139,92,246,0.08)',
                          border: '1px solid rgba(139,92,246,0.2)',
                        }}
                      >
                        Escalate
                      </button>
                      <Link href="/operations/approvals" className="ml-auto">
                        <span
                          className="text-[9px] flex items-center gap-1"
                          style={{ color: TEXT.tertiary }}
                        >
                          Full detail <ArrowUpRight className="w-2.5 h-2.5" />
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <GovernedDecisionSummary />

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          {
            href: '/operations/blocker-board',
            label: 'Blocker Board',
            icon: AlertTriangle,
            color: '#c45a4a',
          },
          { href: '/operations/digest', label: 'Digest Center', icon: FileText, color: '#d4a054' },
          {
            href: '/operations/approvals',
            label: 'Approvals',
            icon: CheckCircle2,
            color: ELECTRIC,
          },
          {
            href: '/operations/trust-audit',
            label: 'Trust & Audit',
            icon: Shield,
            color: '#8b7ac8',
          },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer hover:border-opacity-30 transition-all"
              style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
            >
              <link.icon className="w-3.5 h-3.5 shrink-0" style={{ color: link.color }} />
              <span className="text-[10px] font-medium" style={{ color: TEXT.secondary }}>
                {link.label}
              </span>
              <ChevronRight className="w-3 h-3 ml-auto" style={{ color: TEXT.muted }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
