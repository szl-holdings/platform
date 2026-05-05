import { useStandardQuery } from '@szl-holdings/api-client-react';
import { DataStateBadge } from '@szl-holdings/shared-ui/data-state-badge';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlarmClock,
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Heart,
  Radio,
  Shield,
  Undo2,
  User,
  Workflow,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';

// ---------------------------------------------------------------------------
// Cross-Platform Correlation Alerts (live, persistable)
//
// These are the alerts surfaced from /api/command/alerts (driven by the
// prism-bus correlation stream + other domain feeds). Operators can
// acknowledge, snooze, or resolve them; state survives api-server
// restarts via the command_inbox_alert_states table.
// ---------------------------------------------------------------------------

type CommandAlertStatus = 'active' | 'acknowledged' | 'snoozed' | 'resolved';
type CommandAlertPriority = 'critical' | 'high' | 'medium' | 'low';

interface CommandAlert {
  id: string;
  domain: string;
  domainColor: string;
  priority: CommandAlertPriority;
  title: string;
  description: string;
  time: string;
  status: CommandAlertStatus;
  category: string;
  href?: string;
}

interface CommandAlertsResponse {
  alerts: CommandAlert[];
  counts: { active: number; critical: number; acknowledged: number; snoozed: number };
  generatedAt: string;
  dataSource: 'live' | 'empty';
}

const SNOOZE_PRESETS: Array<{ label: string; minutes: number }> = [
  { label: '15m', minutes: 15 },
  { label: '1h', minutes: 60 },
  { label: '4h', minutes: 240 },
  { label: '24h', minutes: 1440 },
];

function CommandInboxAlerts() {
  const qc = useQueryClient();
  const { data, isLoading } = useStandardQuery<CommandAlertsResponse>({
    queryKey: ['command-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/command/alerts', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load alerts');
      const json = await res.json();
      return (json?.data ?? json) as CommandAlertsResponse;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const [snoozeOpenFor, setSnoozeOpenFor] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function postState(
    id: string,
    body: { state: CommandAlertStatus | 'active'; snoozeMinutes?: number },
  ) {
    setPendingId(id);
    try {
      // Best-effort CSRF — fetch a fresh token if we don't have one yet.
      let csrfToken = '';
      try {
        const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
        if (csrfRes.ok) {
          const j = await csrfRes.json();
          csrfToken = j?.data?.token ?? j?.token ?? '';
        }
      } catch {
        /* tolerate */
      }

      const res = await fetch(`/api/command/alerts/${encodeURIComponent(id)}/state`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
      }
      await qc.invalidateQueries({ queryKey: ['command-alerts'] });
      await qc.invalidateQueries({ queryKey: ['ops-badge-counts'] });
    } finally {
      setPendingId(null);
      setSnoozeOpenFor(null);
    }
  }

  const alerts = data?.alerts ?? [];
  const counts = data?.counts ?? { active: 0, critical: 0, acknowledged: 0, snoozed: 0 };

  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)' }}
    >
      <div
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.04)' }}
      >
        <Bell className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: '#a78bfa' }}
        >
          Command Inbox — Cross-Platform Alerts
        </span>
        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
          ({counts.active} active · {counts.acknowledged} ack · {counts.snoozed} snoozed)
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#6b8f71' }}
          />
          <span className="text-[9px] font-mono" style={{ color: 'rgba(107,143,113,0.7)' }}>
            live
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="px-4 py-6 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Loading correlation alerts…
        </div>
      )}

      {!isLoading && alerts.length === 0 && (
        <div
          className="px-4 py-6 flex items-center gap-2 text-[11px]"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <BellOff className="w-3 h-3" /> No active correlation alerts. Snoozed and resolved items
          have been dismissed.
        </div>
      )}

      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {alerts.map((a) => {
          const isAck = a.status === 'acknowledged';
          const isPending = pendingId === a.id;
          const snoozeOpen = snoozeOpenFor === a.id;
          const priorityColor =
            a.priority === 'critical'
              ? '#c45a4a'
              : a.priority === 'high'
                ? '#c8953c'
                : a.priority === 'medium'
                  ? '#d4a054'
                  : 'rgba(255,255,255,0.4)';
          return (
            <div
              key={a.id}
              className="px-4 py-3 flex items-start gap-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}
            >
              <div
                className="shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: `${a.domainColor}15`,
                  border: `1px solid ${a.domainColor}25`,
                  color: a.domainColor,
                }}
              >
                <span className="text-[10px] font-bold">{a.domain[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span
                    className="text-[9px] font-mono uppercase tracking-wider"
                    style={{ color: a.domainColor }}
                  >
                    {a.domain}
                  </span>
                  <span className="text-[9px] font-mono uppercase" style={{ color: priorityColor }}>
                    {a.priority}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {a.category}
                  </span>
                  {isAck && (
                    <span className="text-[9px] font-mono uppercase" style={{ color: '#6b8f71' }}>
                      acknowledged
                    </span>
                  )}
                </div>
                <div className="text-[12px] font-semibold text-white truncate">{a.title}</div>
                <div
                  className="text-[10px] mt-0.5 leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {a.description}
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {!isAck && (
                    <button
                      disabled={isPending}
                      onClick={() => postState(a.id, { state: 'acknowledged' })}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium disabled:opacity-50"
                      style={{
                        background: 'rgba(107,143,113,0.1)',
                        border: '1px solid rgba(107,143,113,0.3)',
                        color: '#6b8f71',
                      }}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Acknowledge
                    </button>
                  )}
                  <div className="relative">
                    <button
                      disabled={isPending}
                      onClick={() => setSnoozeOpenFor(snoozeOpen ? null : a.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium disabled:opacity-50"
                      style={{
                        background: 'rgba(212,160,84,0.08)',
                        border: '1px solid rgba(212,160,84,0.25)',
                        color: '#d4a054',
                      }}
                    >
                      <AlarmClock className="w-3 h-3" /> Snooze{' '}
                      <ChevronRight
                        className="w-2.5 h-2.5 -mr-1"
                        style={{ transform: snoozeOpen ? 'rotate(90deg)' : 'none' }}
                      />
                    </button>
                    {snoozeOpen && (
                      <div
                        className="absolute z-10 mt-1 left-0 rounded-md flex"
                        style={{
                          background: '#0f1115',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {SNOOZE_PRESETS.map((p) => (
                          <button
                            key={p.minutes}
                            onClick={() =>
                              postState(a.id, { state: 'snoozed', snoozeMinutes: p.minutes })
                            }
                            className="px-2 py-1 text-[10px] font-mono hover:bg-white/5"
                            style={{ color: '#d4a054' }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    disabled={isPending}
                    onClick={() => postState(a.id, { state: 'resolved' })}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium disabled:opacity-50"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <BellOff className="w-3 h-3" /> Resolve
                  </button>
                  {isAck && (
                    <button
                      disabled={isPending}
                      onClick={() => postState(a.id, { state: 'active' })}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium disabled:opacity-50"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <Undo2 className="w-3 h-3" /> Undo
                    </button>
                  )}
                  {a.href && (
                    <a
                      href={a.href}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ml-auto"
                      style={{
                        background: 'rgba(139,122,200,0.1)',
                        border: '1px solid rgba(139,122,200,0.25)',
                        color: '#a78bfa',
                      }}
                    >
                      <ExternalLink className="w-3 h-3" /> Drill in
                    </a>
                  )}
                </div>
              </div>
              <span
                className="text-[10px] font-mono shrink-0"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {a.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PRISM_CARDS = [
  {
    key: 'Pulse',
    icon: Heart,
    color: '#c9b787',
    score: 72,
    label: 'Business Health',
    trend: 'stable',
    detail: '3 systems nominal · 2 degraded',
    href: '/operations/prism/pulse',
  },
  {
    key: 'Risk',
    icon: AlertTriangle,
    color: '#c45a4a',
    score: 5,
    label: 'Active Exposures',
    trend: 'up',
    detail: '$5.03M total value at risk',
    href: '/operations/prism/risk',
  },
  {
    key: 'Intelligence',
    icon: Brain,
    color: '#8b7ac8',
    score: 4,
    label: 'AI Recommendations',
    trend: 'new',
    detail: '2 high-confidence · 2 pending review',
    href: '/operations/prism/intelligence',
  },
  {
    key: 'Signals',
    icon: Radio,
    color: '#d4a054',
    score: 18,
    label: 'Active Signals',
    trend: 'up',
    detail: '7 anomalies · 6 threshold · 5 events',
    href: '/operations/prism/signals',
  },
  {
    key: 'Motion',
    icon: Workflow,
    color: '#4a90b8',
    score: 12,
    label: 'In-Flight Actions',
    trend: 'down',
    detail: '4 escalations · 5 approvals · 3 routing',
    href: '/operations/prism/motion',
  },
];

interface QueueItem {
  id: string;
  title: string;
  reason: string;
  owner: string | null;
  risk: number;
  confidence: number;
  age_hours: number;
  type: 'approval' | 'escalation' | 'ownership' | 'exception';
  evidence: string;
  next_action: string;
  linked_product?: string;
  linked_href?: string;
}

const ACTION_QUEUE: QueueItem[] = [
  {
    id: 'q-001',
    title: 'Northgate Contract — Legal Review Stalled',
    reason:
      '48h past SLA. No legal reviewer assigned. Contract lapses Friday without renewal signature.',
    owner: 'Jordan Alvarez',
    risk: 840000,
    confidence: 94,
    age_hours: 48,
    type: 'approval',
    evidence: 'SLA breach detected by Counsel workflow monitor',
    next_action: 'Escalate to VP Legal with 24h deadline',
    linked_product: 'Counsel',
    linked_href: '/continuum',
  },
  {
    id: 'q-002',
    title: 'TechCorp Churn Risk — Executive Outreach Required',
    reason:
      '88% churn probability. Declining usage -34%, 3 unresolved tickets, zero executive contact in 14 days.',
    owner: 'Marcus Webb',
    risk: 480000,
    confidence: 88,
    age_hours: 24,
    type: 'escalation',
    evidence: 'Counsel churn model v3.2 + usage telemetry',
    next_action: 'Schedule executive call within 24h',
    linked_product: 'Counsel',
    linked_href: '/continuum',
  },
  {
    id: 'q-003',
    title: 'Apex Logistics Onboarding — No Compliance Owner',
    reason:
      'Compliance review step created without owner. 6 vendor onboardings blocked downstream.',
    owner: null,
    risk: 320000,
    confidence: 97,
    age_hours: 144,
    type: 'ownership',
    evidence: 'Workflow graph gap detected automatically',
    next_action: 'Assign compliance owner and unblock pipeline',
    linked_product: 'DOMAINE',
    linked_href: '/terra/',
  },
  {
    id: 'q-004',
    title: 'SEC Filing Q1 — CFO Sign-off Pending',
    reason: 'Regulatory deadline risk. Two of four approvers have not responded.',
    owner: 'Thomas Nguyen',
    risk: 2100000,
    confidence: 91,
    age_hours: 36,
    type: 'approval',
    evidence: 'Approval chain audit — Command governance module',
    next_action: 'Send reminder with 48h escalation trigger',
  },
  {
    id: 'q-005',
    title: 'Contract Workflow Step 4 Failed — No Approver',
    reason: 'Counsel run failed at step 4. No approver assigned. Retry available.',
    owner: null,
    risk: 840000,
    confidence: 100,
    age_hours: 6,
    type: 'exception',
    evidence: 'Counsel execution engine — run #GF-2026-Q1-001',
    next_action: 'Assign approver or reroute workflow',
    linked_product: 'Counsel',
    linked_href: '/continuum',
  },
];

const SIGNAL_FEED = [
  {
    time: '2m ago',
    type: 'anomaly',
    text: 'Unusual approval volume spike — 3x normal for Q1 filing cluster',
    severity: 'high' as const,
  },
  {
    time: '8m ago',
    type: 'threshold',
    text: 'Decision latency exceeded 48h SLA on 2 active approvals',
    severity: 'critical' as const,
  },
  {
    time: '15m ago',
    type: 'event',
    text: 'Counsel workflow #GF-2026-Q1-001 entered exception state',
    severity: 'high' as const,
  },
  {
    time: '22m ago',
    type: 'change',
    text: 'Ownership gap detected: compliance step missing assignee in vendor pipeline',
    severity: 'medium' as const,
  },
  {
    time: '34m ago',
    type: 'anomaly',
    text: 'TechCorp engagement score dropped below retention threshold',
    severity: 'high' as const,
  },
  {
    time: '1h ago',
    type: 'event',
    text: 'New distress signal forwarded from DOMAINE — Northgate portfolio cluster',
    severity: 'medium' as const,
  },
];

const CORRELATION_ITEMS = [
  {
    entity: 'Northgate Group',
    type: 'Account',
    connections: ['Contract #NG-2026-R1', 'Approval Chain #AC-847', 'Counsel Run #GF-001'],
    risk: '$840K',
  },
  {
    entity: 'TechCorp Inc.',
    type: 'Account',
    connections: ['Usage Telemetry', 'Support Tickets (3)', 'Churn Model v3.2'],
    risk: '$480K',
  },
  {
    entity: 'Q1 Filing Cluster',
    type: 'Process',
    connections: ['SEC Filing', 'CFO Approval', 'CapEx Auth', 'Board Review'],
    risk: '$2.55M',
  },
];

function formatCurrency(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

const TYPE_COLORS: Record<string, { color: string; label: string }> = {
  approval: { color: '#60a5fa', label: 'Approval' },
  escalation: { color: '#f87171', label: 'Escalation' },
  ownership: { color: '#a78bfa', label: 'Ownership' },
  exception: { color: '#fb923c', label: 'Exception' },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#c45a4a',
  high: '#c8953c',
  medium: '#d4a054',
  low: 'rgba(255,255,255,0.3)',
};

function LiveDot() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      key={tick}
      className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
      style={{ background: '#6b8f71' }}
    />
  );
}

export default function CommandOverview() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Business Observability</h1>
          <p className="text-[11px] mt-0.5 italic" style={{ color: 'rgba(212,160,84,0.5)' }}>
            In the dark, let Command guide you.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataStateBadge state="demo" label="Demo Data" />
          <div className="flex items-center gap-1.5">
            <LiveDot />
            <span className="text-[9px] font-mono" style={{ color: 'rgba(107,143,113,0.6)' }}>
              live
            </span>
          </div>
        </div>
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="grid grid-cols-3 md:grid-cols-6">
          {[
            { label: 'Urgent Exposures', value: '5', color: '#c45a4a', pulse: true },
            { label: 'Aged Approvals', value: '3', color: '#c8953c', sub: '>24h' },
            { label: 'Ownership Gaps', value: '8', color: '#a78bfa' },
            { label: 'Active Signals', value: '18', color: '#d4a054' },
            { label: 'Value at Risk', value: '$5.03M', color: '#c45a4a' },
            { label: 'Decision Latency', value: '34h', color: '#c8953c', sub: 'avg' },
          ].map((c, i) => (
            <div
              key={c.label}
              className="px-3 py-3 text-center"
              style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-base font-bold font-mono" style={{ color: c.color }}>
                  {c.value}
                </span>
                {c.pulse && (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                    style={{ background: c.color }}
                  />
                )}
              </div>
              <div
                className="text-[8px] font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {c.label}
              </div>
              {c.sub && (
                <div className="text-[7px] mt-0.5" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  {c.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <CommandInboxAlerts />

      <div className="grid grid-cols-5 gap-3">
        {PRISM_CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group rounded-xl border p-3 transition-all hover:scale-[1.02] cursor-pointer"
            style={{
              borderColor: `${card.color}20`,
              background: `linear-gradient(135deg, ${card.color}06, transparent)`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${card.color}15`, border: `1px solid ${card.color}25` }}
              >
                <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: card.color }}
                >
                  {card.key}
                </div>
              </div>
              <span className="text-lg font-bold font-mono" style={{ color: card.color }}>
                {card.score}
              </span>
            </div>
            <div className="text-[10px] font-medium text-white/70">{card.label}</div>
            <div className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {card.detail}
            </div>
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-medium" style={{ color: card.color }}>
                Explore
              </span>
              <ChevronRight className="w-3 h-3" style={{ color: card.color }} />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#c45a4a' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: '#c45a4a' }}
            >
              Priority Action Queue
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
              ({ACTION_QUEUE.length})
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(to right, rgba(196,90,74,0.3), transparent)' }}
            />
          </div>

          {ACTION_QUEUE.map((item) => {
            const tc = TYPE_COLORS[item.type];
            const isOverdue = item.age_hours >= 48;
            const isWarning = item.age_hours >= 24;
            return (
              <div
                key={item.id}
                className="rounded-xl border p-4 transition-all hover:border-opacity-60"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.012)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                    style={{
                      background: `${tc.color}12`,
                      border: `1px solid ${tc.color}20`,
                      color: tc.color,
                    }}
                  >
                    {item.type === 'approval' && <Clock className="w-3 h-3" />}
                    {item.type === 'escalation' && <AlertTriangle className="w-3 h-3" />}
                    {item.type === 'ownership' && <User className="w-3 h-3" />}
                    {item.type === 'exception' && <Zap className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          color: tc.color,
                          background: `${tc.color}10`,
                          border: `1px solid ${tc.color}20`,
                        }}
                      >
                        {tc.label}
                      </span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          color: isOverdue
                            ? '#c45a4a'
                            : isWarning
                              ? '#c8953c'
                              : 'rgba(255,255,255,0.35)',
                          background: isOverdue
                            ? 'rgba(196,90,74,0.08)'
                            : isWarning
                              ? 'rgba(249,115,22,0.08)'
                              : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isOverdue ? 'rgba(196,90,74,0.2)' : isWarning ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {item.age_hours}h
                      </span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          color: item.confidence >= 90 ? '#6b8f71' : '#d4a054',
                          background:
                            item.confidence >= 90
                              ? 'rgba(107,143,113,0.08)'
                              : 'rgba(212,160,84,0.08)',
                          border: `1px solid ${item.confidence >= 90 ? 'rgba(107,143,113,0.2)' : 'rgba(212,160,84,0.2)'}`,
                        }}
                      >
                        {item.confidence}% conf
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-tight">{item.title}</p>
                    <p
                      className="text-[10px] mt-1 leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      {item.reason}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {item.owner ? (
                        <span
                          className="flex items-center gap-1 text-[10px]"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                          <User className="w-2.5 h-2.5" /> {item.owner}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-[#c45a4a]/70">
                          <User className="w-2.5 h-2.5" /> No owner
                        </span>
                      )}
                      <span
                        className="flex items-center gap-1 text-[10px]"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                      >
                        <Eye className="w-2.5 h-2.5" /> {item.evidence}
                      </span>
                      {item.linked_product && item.linked_href && (
                        <a
                          href={item.linked_href}
                          className="flex items-center gap-1 text-[10px] hover:opacity-80 transition-opacity"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          {item.linked_product}
                        </a>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-2 mt-2 p-2 rounded-lg"
                      style={{
                        background: 'rgba(212,160,84,0.04)',
                        border: '1px solid rgba(212,160,84,0.08)',
                      }}
                    >
                      <ArrowRight className="w-3 h-3 shrink-0" style={{ color: '#d4a054' }} />
                      <span className="text-[10px] font-medium" style={{ color: '#d4a054' }}>
                        {item.next_action}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold" style={{ color: '#c45a4a' }}>
                      {formatCurrency(item.risk)}
                    </div>
                    <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      at risk
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: '#d4a054' }}
              >
                Signal Timeline
              </span>
            </div>
            <div className="space-y-0">
              {SIGNAL_FEED.map((sig, i) => (
                <div
                  key={i}
                  className="flex gap-3 py-2 group"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                >
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: SEVERITY_COLORS[sig.severity] }}
                    />
                    {i < SIGNAL_FEED.length - 1 && (
                      <div
                        className="w-px flex-1 mt-1"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[10px] leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {sig.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[8px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                      >
                        {sig.time}
                      </span>
                      <span
                        className="text-[8px] px-1 py-0.5 rounded uppercase tracking-wider font-medium"
                        style={{
                          color: SEVERITY_COLORS[sig.severity],
                          background: `${SEVERITY_COLORS[sig.severity]}10`,
                        }}
                      >
                        {sig.severity}
                      </span>
                      <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
                        {sig.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/operations/prism/signals"
              className="flex items-center gap-1 mt-3 text-[10px] font-medium hover:opacity-80 transition-opacity"
              style={{ color: '#d4a054' }}
            >
              View all signals <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div
            className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: '#8b7ac8' }}
              >
                Correlations
              </span>
            </div>
            {CORRELATION_ITEMS.map((corr, i) => (
              <div
                key={i}
                className="py-2"
                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-white">{corr.entity}</span>
                  <span className="text-[9px] font-mono font-bold" style={{ color: '#c45a4a' }}>
                    {corr.risk}
                  </span>
                </div>
                <span
                  className="text-[8px] px-1 py-0.5 rounded uppercase"
                  style={{ color: '#8b7ac8', background: 'rgba(139,92,246,0.1)' }}
                >
                  {corr.type}
                </span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {corr.connections.map((conn, j) => (
                    <span
                      key={j}
                      className="text-[8px] px-1.5 py-0.5 rounded"
                      style={{
                        color: 'rgba(255,255,255,0.4)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {conn}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl border p-3"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span
                  className="text-[9px] uppercase tracking-wider font-medium"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  System State
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6b8f71' }} />
                <span className="text-[9px] font-mono" style={{ color: '#6b8f71' }}>
                  Demo
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Last refresh
                </div>
                <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Just now
                </div>
              </div>
              <div>
                <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Confidence
                </div>
                <div className="text-[9px] font-mono" style={{ color: '#6b8f71' }}>
                  High
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
