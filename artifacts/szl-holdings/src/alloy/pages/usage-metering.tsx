import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { DataStateBadge } from '@szl-holdings/shared-ui/data-state-badge';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  DollarSign,
  FileText,
  Globe,
  Radio,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface UsageEvent {
  id: number;
  orgId: number | null;
  eventType:
    | 'agent_run'
    | 'skill_invocation'
    | 'artifact_generated'
    | 'browser_task'
    | 'model_tokens';
  quantity: number;
  model?: string;
  agentId?: string;
  skillSlug?: string;
  costCents: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const CURRENT_USAGE = {
  agentRuns: { used: 1221, limit: 2000, tier: 'Professional' },
  skillInvocations: { used: 3678, limit: 6000, tier: 'Professional' },
  artifactsGenerated: { used: 267, limit: 1000, tier: 'Professional' },
  browserTasks: { used: 142, limit: 500, tier: 'Professional' },
  modelTokens: { used: 4820000, limit: 10000000, tier: 'Professional' },
  costMtd: { used: 412.5, limit: 500, tier: 'Professional' },
};

const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; unit: string }
> = {
  agent_run: {
    label: 'Agent Runs',
    icon: <Activity className="w-3.5 h-3.5" />,
    color: '#4B8BDB',
    unit: 'runs',
  },
  skill_invocation: {
    label: 'Skill Invocations',
    icon: <Zap className="w-3.5 h-3.5" />,
    color: '#8b5cf6',
    unit: 'calls',
  },
  artifact_generated: {
    label: 'Artifacts Generated',
    icon: <FileText className="w-3.5 h-3.5" />,
    color: '#10b981',
    unit: 'artifacts',
  },
  browser_task: {
    label: 'Browser Tasks',
    icon: <Globe className="w-3.5 h-3.5" />,
    color: '#f59e0b',
    unit: 'tasks',
  },
  model_tokens: {
    label: 'Model Tokens',
    icon: <BarChart2 className="w-3.5 h-3.5" />,
    color: '#0ea5e9',
    unit: 'tokens',
  },
};

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function UsageBar({ used, limit, color }: { used: number; limit: number; color: string }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const alertColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : color;
  return (
    <div>
      <div
        className="flex items-center justify-between mb-1 text-[9px]"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        <span>{pct}% used</span>
        <span className="font-mono">
          {formatNumber(used)} / {formatNumber(limit)}
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct >= 80 ? alertColor : color }}
        />
      </div>
      {pct >= 80 && (
        <div
          className="flex items-center gap-1 mt-1 text-[9px]"
          style={{ color: pct >= 100 ? '#ef4444' : '#f59e0b' }}
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          {pct >= 100
            ? 'Limit reached — new events blocked'
            : 'Approaching limit — 80% threshold reached'}
        </div>
      )}
    </div>
  );
}

export default function UsageMetering() {
  const [tab, setTab] = useState<'dashboard' | 'events' | 'tiers'>('dashboard');

  const { data: liveEvents } = useStandardQuery({
    queryKey: ['usageEvents'],
    queryFn: async () => {
      try {
        const resp =
          await apiFetch<
            Array<{
              id: number;
              orgId: number | null;
              eventType: string;
              quantity: number;
              model?: string;
              agentId?: string;
              skillSlug?: string;
              costCents: number;
              createdAt: string;
            }>
          >('/alloy/usage/events');
        if (Array.isArray(resp) && resp.length > 0) return resp;
        return null;
      } catch {
        return null;
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  const isDemo = !liveEvents;

  const usageTrendData = useMemo(() => {
    if (!liveEvents || liveEvents.length === 0) return [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map: Record<
      string,
      { day: string; agent_run: number; artifact: number; browser: number }
    > = {};
    liveEvents.forEach((e) => {
      const day = dayNames[new Date(e.createdAt).getDay()];
      if (!map[day]) map[day] = { day, agent_run: 0, artifact: 0, browser: 0 };
      if (e.eventType === 'agent_run') map[day].agent_run += e.quantity;
      if (e.eventType === 'artifact_generated') map[day].artifact += e.quantity;
      if (e.eventType === 'browser_task') map[day].browser += e.quantity;
    });
    return Object.values(map);
  }, [liveEvents]);

  // Derive live KPIs from real events when available
  const liveCostMtdUsd = isDemo
    ? CURRENT_USAGE.costMtd.used
    : liveEvents.reduce((s, e) => s + e.costCents, 0) / 100;
  const liveAgentRuns = isDemo
    ? CURRENT_USAGE.agentRuns.used
    : liveEvents.filter((e) => e.eventType === 'agent_run').reduce((s, e) => s + e.quantity, 0);
  const liveSkillInvocations = isDemo
    ? CURRENT_USAGE.skillInvocations.used
    : liveEvents
        .filter((e) => e.eventType === 'skill_invocation')
        .reduce((s, e) => s + e.quantity, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5 p-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#10b981' }}
            >
              Alloy · Usage Metering
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Usage Metering</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Per-tenant usage tracking: agent runs, skill invocations, artifacts, browser tasks,
            tokens consumed. Powers billing.
          </p>
        </div>
        <DataStateBadge state={isDemo ? 'demo' : 'live'} />
      </div>

      {isDemo && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-medium border"
          style={{
            background: 'rgba(75,139,219,0.04)',
            borderColor: 'rgba(75,139,219,0.1)',
            color: 'rgba(75,139,219,0.6)',
          }}
        >
          <Radio className="w-3 h-3 shrink-0 animate-pulse" />
          Demo Mode — Illustrative usage data shown. Connect live API for real metering.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Cost (MTD)',
            value: `$${liveCostMtdUsd.toFixed(2)}`,
            sub: `of $${CURRENT_USAGE.costMtd.limit} budget`,
            color: '#f59e0b',
            pct: Math.round((liveCostMtdUsd / CURRENT_USAGE.costMtd.limit) * 100),
          },
          {
            label: 'Agent Runs (MTD)',
            value: formatNumber(liveAgentRuns),
            sub: isDemo
              ? `of ${formatNumber(CURRENT_USAGE.agentRuns.limit)} limit`
              : 'recorded this session',
            color: '#4B8BDB',
            pct: isDemo
              ? Math.round((liveAgentRuns / CURRENT_USAGE.agentRuns.limit) * 100)
              : Math.min(100, Math.round((liveAgentRuns / CURRENT_USAGE.agentRuns.limit) * 100)),
          },
          {
            label: 'Skill Invocations (MTD)',
            value: formatNumber(liveSkillInvocations),
            sub: isDemo
              ? `of ${formatNumber(CURRENT_USAGE.skillInvocations.limit)} limit`
              : 'recorded this session',
            color: '#8b5cf6',
            pct: isDemo
              ? Math.round((liveSkillInvocations / CURRENT_USAGE.skillInvocations.limit) * 100)
              : Math.min(
                  100,
                  Math.round((liveSkillInvocations / CURRENT_USAGE.skillInvocations.limit) * 100),
                ),
          },
        ].map((c) => {
          const alertColor = c.pct >= 80 ? (c.pct >= 100 ? '#ef4444' : '#f59e0b') : c.color;
          return (
            <div
              key={c.label}
              className="rounded-xl border p-4"
              style={{
                borderColor: 'rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div
                className="text-[10px] font-medium mb-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {c.label}
              </div>
              <div className="text-2xl font-bold mb-0.5" style={{ color: alertColor }}>
                {c.value}
              </div>
              <div className="text-[9px] mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {c.sub}
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${c.pct}%`, background: alertColor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {(['dashboard', 'events', 'tiers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize"
            style={{
              borderColor: tab === t ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)',
              background: tab === t ? 'rgba(16,185,129,0.08)' : 'transparent',
              color: tab === t ? '#10b981' : 'rgba(255,255,255,0.4)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-4">
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="text-sm font-semibold text-white mb-4">
              Usage by Event Type — 7 Days
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={usageTrendData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  barSize={8}
                >
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0d1117',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: 10,
                    }}
                  />
                  <Bar
                    dataKey="agent_run"
                    name="Agent Runs"
                    fill="#4B8BDB"
                    opacity={0.8}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="artifact"
                    name="Artifacts"
                    fill="#10b981"
                    opacity={0.7}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="browser"
                    name="Browser Tasks"
                    fill="#f59e0b"
                    opacity={0.7}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                key: 'agentRuns',
                label: 'Agent Runs',
                ...CURRENT_USAGE.agentRuns,
                color: '#4B8BDB',
              },
              {
                key: 'skillInvocations',
                label: 'Skill Invocations',
                ...CURRENT_USAGE.skillInvocations,
                color: '#8b5cf6',
              },
              {
                key: 'artifactsGenerated',
                label: 'Artifacts Generated',
                ...CURRENT_USAGE.artifactsGenerated,
                color: '#10b981',
              },
              {
                key: 'browserTasks',
                label: 'Browser Tasks',
                ...CURRENT_USAGE.browserTasks,
                color: '#f59e0b',
              },
            ].map((u) => (
              <div
                key={u.key}
                className="rounded-xl border p-4"
                style={{
                  borderColor: 'rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div
                  className="text-[10px] font-medium mb-3"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {u.label}
                </div>
                <UsageBar used={u.used} limit={u.limit} color={u.color} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-3">
          {isDemo && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-medium border"
              style={{
                background: 'rgba(75,139,219,0.04)',
                borderColor: 'rgba(75,139,219,0.1)',
                color: 'rgba(75,139,219,0.6)',
              }}
            >
              <Radio className="w-3 h-3 shrink-0 animate-pulse" />
              Demo Data — Illustrative events shown. Live metering events appear as agent runs
              execute.
            </div>
          )}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="grid text-[9px] font-bold uppercase tracking-widest px-4 py-2"
              style={{
                gridTemplateColumns: '1fr 1fr 1fr 80px 80px',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              <div>Event Type</div>
              <div>Agent / Skill</div>
              <div>Model</div>
              <div>Qty</div>
              <div>Cost</div>
            </div>
            {isDemo ? (
              [
                {
                  type: 'agent_run',
                  agent: 'beacon',
                  model: 'gpt-5.2',
                  qty: 12,
                  costCents: 340,
                  ts: '2m ago',
                },
                {
                  type: 'skill_invocation',
                  agent: 'inca',
                  model: 'gemini-3.1-pro-preview',
                  qty: 1,
                  costCents: 8,
                  ts: '5m ago',
                },
                {
                  type: 'artifact_generated',
                  agent: 'alloy',
                  model: 'gpt-5.2',
                  qty: 1,
                  costCents: 22,
                  ts: '8m ago',
                },
                {
                  type: 'agent_run',
                  agent: 'sentinel',
                  model: 'claude-sonnet-4-6',
                  qty: 4,
                  costCents: 180,
                  ts: '12m ago',
                },
                {
                  type: 'browser_task',
                  agent: 'alloy',
                  model: '—',
                  qty: 2,
                  costCents: 40,
                  ts: '18m ago',
                },
                {
                  type: 'skill_invocation',
                  agent: 'zeus',
                  model: 'gpt-5.2',
                  qty: 3,
                  costCents: 24,
                  ts: '25m ago',
                },
              ].map((ev, i) => {
                const cfg = EVENT_TYPE_CONFIG[ev.type];
                return (
                  <div
                    key={i}
                    className="grid items-center px-4 py-3 border-t text-xs"
                    style={{
                      gridTemplateColumns: '1fr 1fr 1fr 80px 80px',
                      borderColor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: cfg?.color }}>{cfg?.icon}</span>
                      <span className="text-white">{cfg?.label}</span>
                    </div>
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {ev.agent}
                    </span>
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {ev.model
                        .replace('claude-sonnet-4-6', 'claude')
                        .replace('gemini-3.1-pro-preview', 'gemini')}
                    </span>
                    <span className="text-white">{ev.qty}</span>
                    <span className="font-mono" style={{ color: '#f59e0b' }}>
                      ${(ev.costCents / 100).toFixed(2)}
                    </span>
                  </div>
                );
              })
            ) : liveEvents.length === 0 ? (
              <div
                className="text-center py-12 text-[11px]"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                No usage events recorded yet. Events appear as agents run.
              </div>
            ) : (
              liveEvents.slice(0, 50).map((ev, i) => {
                const cfg = EVENT_TYPE_CONFIG[ev.eventType as keyof typeof EVENT_TYPE_CONFIG];
                return (
                  <div
                    key={i}
                    className="grid items-center px-4 py-3 border-t text-xs"
                    style={{
                      gridTemplateColumns: '1fr 1fr 1fr 80px 80px',
                      borderColor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: cfg?.color }}>{cfg?.icon}</span>
                      <span className="text-white">{cfg?.label ?? ev.eventType}</span>
                    </div>
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {ev.agentId ?? ev.skillSlug ?? '—'}
                    </span>
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {ev.model ?? '—'}
                    </span>
                    <span className="text-white">{ev.quantity}</span>
                    <span className="font-mono" style={{ color: '#f59e0b' }}>
                      ${(ev.costCents / 100).toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === 'tiers' && (
        <div className="space-y-3">
          <div
            className="rounded-xl border p-4 flex items-center gap-3"
            style={{ borderColor: 'rgba(75,139,219,0.15)', background: 'rgba(75,139,219,0.04)' }}
          >
            <DollarSign className="w-4 h-4 shrink-0" style={{ color: '#4B8BDB' }} />
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Billing events are generated automatically when usage crosses tier thresholds and
              integrated with Stripe.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
