import { useStandardQuery } from '@szl-holdings/api-client-react';
import { ApiError, apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { AlertCircle, Bell, ChevronRight, Phone, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TeamDetailModal } from './deployments';

const GOLD = '#d4a054';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type OnCallSource = 'override' | 'rotation' | 'fallback' | 'none';

interface TeamMemberDto {
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  platformRole: string | null;
  isActive: boolean;
}

interface OwnedAppDto {
  slug: string;
  name: string;
}

interface ScheduleSummaryDto {
  team: string;
  memberCount: number;
  ownedApps: OwnedAppDto[];
  currentOnCall: TeamMemberDto | null;
  currentOnCallSource: OnCallSource;
  escalation: TeamMemberDto | null;
  schedule: {
    rotationIntervalHours: number;
    memberOrder: number[];
    handoffAnchor: string;
    timezone: string;
  } | null;
  upcomingHandoffs: Array<{ at: string; userId: number; displayName: string }>;
  overrides: Array<{
    id: number;
    userId: number;
    displayName: string;
    startAt: string;
    endAt: string;
    note: string | null;
    kind: 'override' | 'shift';
  }>;
}

interface SchedulesResponse {
  generatedAt: string;
  horizonHours: number;
  count: number;
  teams: ScheduleSummaryDto[];
}

const SOURCE_LABEL: Record<OnCallSource, string> = {
  override: 'OVERRIDE',
  rotation: 'ROTATION',
  fallback: 'AUTO',
  none: '—',
};

const SOURCE_COLOR: Record<OnCallSource, string> = {
  override: '#f97316',
  rotation: '#10b981',
  fallback: GOLD,
  none: 'rgba(255,255,255,0.3)',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase();
  return (parts[0]?.[0]! + parts[parts.length - 1]?.[0]!).toUpperCase();
}

function avatarColor(id: number): string {
  const palette = [
    '#60a5fa',
    '#34d399',
    '#a78bfa',
    GOLD,
    '#f97316',
    '#38bdf8',
    '#ef4444',
    '#10b981',
    '#ec4899',
  ];
  return palette[id % palette.length]!;
}

function formatRelative(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = t - now;
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / (60 * 60 * 1000));
  const days = Math.floor(hours / 24);
  if (diff < 0) {
    if (abs < 60_000) return 'just now';
    if (hours < 1) return `${Math.floor(abs / 60_000)}m ago`;
    if (days < 1) return `${hours}h ago`;
    return `${days}d ago`;
  }
  if (hours < 1) return `in ${Math.max(1, Math.floor(abs / 60_000))}m`;
  if (hours < 24) return `in ${hours}h`;
  return `in ${days}d`;
}

function formatDayTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    year: sameYear ? undefined : 'numeric',
  });
}

interface TimelineEvent {
  key: string;
  team: string;
  at: string;
  endAt?: string;
  kind: 'handoff' | 'override-start' | 'override-end' | 'override-active';
  who: string;
  note?: string | null;
}

function buildTimeline(teams: ScheduleSummaryDto[], horizonMs: number): TimelineEvent[] {
  const now = Date.now();
  const events: TimelineEvent[] = [];
  for (const t of teams) {
    for (const o of t.overrides) {
      const start = new Date(o.startAt).getTime();
      const end = new Date(o.endAt).getTime();
      if (start <= now && end > now) {
        events.push({
          key: `ov-active-${o.id}`,
          team: t.team,
          at: new Date(now).toISOString(),
          endAt: o.endAt,
          kind: 'override-active',
          who: o.displayName,
          note: o.note,
        });
      } else if (start > now && start - now <= horizonMs) {
        events.push({
          key: `ov-start-${o.id}`,
          team: t.team,
          at: o.startAt,
          endAt: o.endAt,
          kind: 'override-start',
          who: o.displayName,
          note: o.note,
        });
      }
    }
    for (const h of t.upcomingHandoffs) {
      const at = new Date(h.at).getTime();
      if (at - now <= horizonMs) {
        events.push({
          key: `ho-${t.team}-${h.at}-${h.userId}`,
          team: t.team,
          at: h.at,
          kind: 'handoff',
          who: h.displayName,
        });
      }
    }
  }
  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return events;
}

function SourceBadge({ source }: { source: OnCallSource }) {
  if (source === 'none') return null;
  const color = SOURCE_COLOR[source];
  return (
    <span
      className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
      style={{ color, background: `${color}14`, border: `1px solid ${color}33` }}
      title={
        source === 'override'
          ? 'An admin assigned a one-off override for this slot'
          : source === 'rotation'
            ? 'Configured rotation pick'
            : 'No schedule configured — falling back to weekly auto-rotation'
      }
    >
      {SOURCE_LABEL[source]}
    </span>
  );
}

export default function OnCallCenter() {
  const [tab, setTab] = useState<'current' | 'timeline'>('current');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const query = useStandardQuery<SchedulesResponse>({
    queryKey: ['oncall', 'schedules'],
    queryFn: () => apiFetch<SchedulesResponse>(`/teams/schedules`),
    refetchInterval: 60_000,
  });

  const data = query.data;
  const teams = useMemo(() => data?.teams ?? [], [data]);
  const horizonMs = (data?.horizonHours ?? 7 * 24) * 60 * 60 * 1000;
  const timeline = useMemo(() => buildTimeline(teams, horizonMs), [teams, horizonMs]);
  const now = Date.now();

  const overrideCount = useMemo(
    () =>
      teams.reduce(
        (acc, t) =>
          acc +
          t.overrides.filter(
            (o) => new Date(o.startAt).getTime() <= now && new Date(o.endAt).getTime() > now,
          ).length,
        0,
      ),
    [teams, now],
  );
  const handoffCount = useMemo(
    () => teams.reduce((acc, t) => acc + t.upcomingHandoffs.length, 0),
    [teams],
  );
  const coveredCount = useMemo(() => teams.filter((t) => !!t.currentOnCall).length, [teams]);
  const uncoveredCount = teams.length - coveredCount;

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-5" style={{ background: '#080c14' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>
              On-Call Center
            </h1>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>
            Who's on-call across every team right now, and who's up next. Click a team to edit the
            schedule or page the on-call.
          </p>
        </div>
        <button
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium shrink-0 disabled:opacity-50"
          style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: GOLD }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${query.isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Teams Tracked', value: teams.length, color: GOLD },
          { label: 'Covered', value: coveredCount, color: '#10b981' },
          { label: 'Active Overrides', value: overrideCount, color: '#f97316' },
          { label: 'Handoffs (7d)', value: handoffCount, color: '#3b82f6' },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border p-3"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div
              className="text-[9px] uppercase tracking-widest mb-1"
              style={{ color: DS.text.muted }}
            >
              {k.label}
            </div>
            <div className="text-[18px] font-bold font-mono" style={{ color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {uncoveredCount > 0 && (
        <div
          className="flex items-start gap-2 rounded-lg p-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <div className="text-[11px]" style={{ color: DS.text.primary }}>
            <span className="font-semibold" style={{ color: '#ef4444' }}>
              {uncoveredCount}
            </span>{' '}
            team{uncoveredCount === 1 ? '' : 's'} have no on-call coverage right now — no active
            members or rotation configured.
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b" style={{ borderColor: DS.border }}>
        {(['current', 'timeline'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-[10px] px-4 py-2 capitalize font-medium transition-all"
            style={{
              color: tab === t ? GOLD : DS.text.muted,
              borderBottom: `2px solid ${tab === t ? GOLD : 'transparent'}`,
            }}
          >
            {t === 'current' ? 'Current On-Call' : '7-Day Timeline'}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="text-center py-12 text-[11px]" style={{ color: DS.text.muted }}>
          Loading on-call schedules…
        </div>
      ) : query.error ? (
        <div className="text-center py-12 text-[11px]" style={{ color: '#ef4444' }}>
          {query.error instanceof ApiError ? query.error.message : 'Failed to load schedules'}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12 text-[11px]" style={{ color: DS.text.muted }}>
          No teams configured yet. Assign team owners to apps or members to teams to populate this
          view.
        </div>
      ) : tab === 'current' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {teams.map((t) => {
            const oncall = t.currentOnCall;
            const escalation = t.escalation;
            const color = oncall ? avatarColor(oncall.id) : '#6b7280';
            const nextHandoff = t.upcomingHandoffs[0];
            const activeOverride = t.overrides.find((o) => {
              const s = new Date(o.startAt).getTime();
              const e = new Date(o.endAt).getTime();
              return s <= now && e > now;
            });
            return (
              <button
                key={t.team}
                onClick={() => setSelectedTeam(t.team)}
                className="text-left rounded-xl border p-4 transition-all hover:bg-white/[0.03]"
                style={{
                  borderColor: oncall ? `${color}25` : DS.border,
                  background: oncall ? `${color}05` : DS.surface,
                }}
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[11px] font-semibold truncate"
                        style={{ color: DS.text.primary }}
                      >
                        {t.team}
                      </span>
                      <SourceBadge source={t.currentOnCallSource} />
                    </div>
                    <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                      {t.memberCount} member{t.memberCount === 1 ? '' : 's'}
                      {t.ownedApps.length > 0 &&
                        ` · ${t.ownedApps.length} app${t.ownedApps.length === 1 ? '' : 's'}`}
                    </div>
                  </div>
                  <ChevronRight
                    className="w-3.5 h-3.5 shrink-0 mt-0.5"
                    style={{ color: DS.text.muted }}
                  />
                </div>

                <div className="space-y-2">
                  <div
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                        style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
                      >
                        {oncall ? initials(oncall.displayName) : '—'}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-[10px] font-medium truncate"
                          style={{ color: DS.text.primary }}
                        >
                          {oncall?.displayName ?? 'No coverage'}
                        </div>
                        <div className="text-[8px]" style={{ color: DS.text.muted }}>
                          Primary on-call
                        </div>
                      </div>
                    </div>
                    <Phone className="w-3 h-3 shrink-0" style={{ color }} />
                  </div>

                  {escalation && escalation.id !== oncall?.id && (
                    <div
                      className="flex items-center gap-2 px-2 py-1 rounded text-[9px]"
                      style={{ color: DS.text.muted }}
                    >
                      <Bell className="w-2.5 h-2.5 shrink-0" />
                      Escalation →{' '}
                      <span style={{ color: DS.text.secondary }}>{escalation.displayName}</span>
                    </div>
                  )}
                </div>

                <div
                  className="mt-3 pt-3 grid grid-cols-2 gap-2"
                  style={{ borderTop: `1px solid ${DS.border}` }}
                >
                  <div>
                    <div
                      className="text-[8px] uppercase tracking-wider mb-0.5"
                      style={{ color: DS.text.muted }}
                    >
                      {activeOverride ? 'Override ends' : 'Next handoff'}
                    </div>
                    <div
                      className="text-[10px] font-mono"
                      style={{
                        color: activeOverride ? '#f97316' : nextHandoff ? '#3b82f6' : DS.text.muted,
                      }}
                    >
                      {activeOverride
                        ? formatRelative(activeOverride.endAt, now)
                        : nextHandoff
                          ? formatRelative(nextHandoff.at, now)
                          : t.schedule
                            ? '—'
                            : 'no rotation'}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-[8px] uppercase tracking-wider mb-0.5"
                      style={{ color: DS.text.muted }}
                    >
                      Then
                    </div>
                    <div className="text-[10px] truncate" style={{ color: DS.text.secondary }}>
                      {activeOverride
                        ? `→ ${nextHandoff?.displayName ?? 'rotation resumes'}`
                        : nextHandoff
                          ? `→ ${nextHandoff.displayName}`
                          : '—'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: DS.border, background: DS.surface }}
        >
          <div
            className="p-3 border-b flex items-center justify-between"
            style={{ borderColor: DS.border }}
          >
            <span className="text-[9px] uppercase tracking-widest" style={{ color: DS.text.muted }}>
              Upcoming handoffs &amp; overrides
            </span>
            <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
              Next 7 days · {timeline.length} event{timeline.length === 1 ? '' : 's'}
            </span>
          </div>
          {timeline.length === 0 ? (
            <div className="text-center py-12 text-[11px]" style={{ color: DS.text.muted }}>
              No handoffs or overrides scheduled in the next 7 days.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: DS.border }}>
              {timeline.map((e) => {
                const isOverride = e.kind !== 'handoff';
                const isActiveOverride = e.kind === 'override-active';
                const accent = isActiveOverride ? '#f97316' : isOverride ? GOLD : '#3b82f6';
                return (
                  <button
                    key={e.key}
                    onClick={() => setSelectedTeam(e.team)}
                    className="w-full text-left flex items-start gap-3 p-3 transition-all hover:bg-white/[0.02]"
                    style={{ borderColor: 'rgba(255,255,255,0.03)' }}
                  >
                    <div
                      className="w-1 h-10 rounded-full shrink-0"
                      style={{ background: accent }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: DS.text.primary }}
                        >
                          {e.team}
                        </span>
                        <span
                          className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            color: accent,
                            background: `${accent}14`,
                            border: `1px solid ${accent}30`,
                          }}
                        >
                          {isActiveOverride
                            ? 'ACTIVE OVERRIDE'
                            : isOverride
                              ? 'OVERRIDE'
                              : 'HANDOFF'}
                        </span>
                      </div>
                      <div className="text-[10px]" style={{ color: DS.text.secondary }}>
                        {isActiveOverride ? 'Currently covered by ' : '→ '}
                        <span style={{ color: DS.text.primary }}>{e.who}</span>
                        {e.note && <span style={{ color: DS.text.muted }}> · {e.note}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono" style={{ color: accent }}>
                        {isActiveOverride
                          ? `until ${formatRelative(e.endAt!, now)}`
                          : formatRelative(e.at, now)}
                      </div>
                      <div className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                        {isActiveOverride ? formatDayTime(e.endAt!) : formatDayTime(e.at)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedTeam && (
        <TeamDetailModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}
    </div>
  );
}
