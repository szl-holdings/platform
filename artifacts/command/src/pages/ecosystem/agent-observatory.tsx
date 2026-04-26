import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Ban,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { MOCK_SESSIONS } from './data';
import { ECOSYSTEM_ACCENT } from './layout';
import type { AgentSession, Decision, SessionStatus, ToolInvocation } from './types';

const BASE = (import.meta.env.BASE_URL ?? '/command/').replace(/\/$/, '');
const apiUrl = (path: string) => `${BASE}/api${path}`;

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url, { credentials: 'include' }).then((r) =>
    r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
  );
}

function ensureCsrfCookie(): void {
  if (!document.cookie.includes('csrf_token=')) {
    document.cookie = `csrf_token=${crypto.randomUUID()}; path=/; SameSite=Lax`;
  }
}

function getCsrfToken(): string {
  return (
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('csrf_token='))
      ?.split('=')?.[1] ?? ''
  );
}

function postJson<T>(url: string): Promise<T> {
  ensureCsrfCookie();
  return fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
    body: JSON.stringify({}),
  }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))));
}

function DecisionBadge({ decision }: { decision: Decision }) {
  const config: Record<Decision, { color: string; label: string }> = {
    allowed:     { color: '#22c55e', label: 'ALLOW' },
    logged:      { color: '#8b7ac8', label: 'LOG' },
    blocked:     { color: '#ef4444', label: 'BLOCK' },
    quarantined: { color: '#f97316', label: 'QUAR' },
  };
  const c = config[decision] ?? { color: '#6b7280', label: decision.toUpperCase() };
  return (
    <span
      className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
      style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}25` }}
    >
      {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const config: Record<SessionStatus, { color: string; label: string }> = {
    active:      { color: '#22c55e', label: 'ACTIVE' },
    idle:        { color: '#6b7280', label: 'IDLE' },
    quarantined: { color: '#f97316', label: 'QUARANTINED' },
  };
  const c = config[status];
  return (
    <span
      className="flex items-center gap-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
      style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}25` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

function formatRelative(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  return `${Math.round(ms / 3_600_000)}h ago`;
}

function InvocationRow({ inv }: { inv: ToolInvocation }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded text-[9px]"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <DecisionBadge decision={inv.decision} />
      <span className="font-mono font-medium flex-1 truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
        {inv.tool}
      </span>
      <span className="font-mono shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {inv.mcpServerId}
      </span>
      {inv.latencyMs != null && (
        <span className="font-mono shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {inv.latencyMs}ms
        </span>
      )}
      <span className="font-mono shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
        {formatRelative(inv.occurredAt)}
      </span>
    </div>
  );
}

function SessionCard({
  session,
  onQuarantine,
  onRevoke,
}: {
  session: AgentSession;
  onQuarantine: (sessionId: string) => void;
  onRevoke: (sessionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${
          session.status === 'quarantined'
            ? 'rgba(249,115,22,0.25)'
            : session.status === 'active'
              ? 'rgba(34,197,94,0.15)'
              : 'rgba(255,255,255,0.07)'
        }`,
        background:
          session.status === 'quarantined'
            ? 'rgba(249,115,22,0.04)'
            : 'rgba(255,255,255,0.02)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
          style={{
            background: `${session.color}15`,
            border: `1px solid ${session.color}30`,
            color: session.color,
          }}
        >
          {session.agentName.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {session.agentName}
            </span>
            <StatusBadge status={session.status} />
            <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {session.transport}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {session.invocationCount} invocations
            </span>
            {session.blockedCount > 0 && (
              <span className="text-[9px] font-mono" style={{ color: '#ef4444' }}>
                {session.blockedCount} blocked
              </span>
            )}
            {session.quarantinedCount > 0 && (
              <span className="text-[9px] font-mono" style={{ color: '#f97316' }}>
                {session.quarantinedCount} quarantined
              </span>
            )}
            {session.avgLatencyMs != null && (
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
                avg {session.avgLatencyMs}ms
              </span>
            )}
            <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
              last seen {formatRelative(session.lastSeenAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {session.status !== 'quarantined' && (
            <button
              onClick={() => onQuarantine(session.sessionId)}
              title="Quarantine session"
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono transition-all hover:opacity-80"
              style={{
                background: 'rgba(249,115,22,0.08)',
                border: '1px solid rgba(249,115,22,0.2)',
                color: '#f97316',
              }}
            >
              <ShieldAlert className="w-2.5 h-2.5" />
              Quarantine
            </button>
          )}
          <button
            onClick={() => onRevoke(session.sessionId)}
            title="Revoke session"
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono transition-all hover:opacity-80"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444',
            }}
          >
            <Ban className="w-2.5 h-2.5" />
            Revoke
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded transition-all hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Invocations list */}
      {expanded && session.toolInvocations.length > 0 && (
        <div className="px-4 pb-3 flex flex-col gap-1.5">
          <div className="text-[8px] uppercase tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Recent Tool Invocations
          </div>
          {session.toolInvocations.map((inv, i) => (
            <InvocationRow key={`${inv.tool}-${i}`} inv={inv} />
          ))}
        </div>
      )}
    </div>
  );
}

type FilterValue = 'all' | 'active' | 'quarantined' | 'blocked';
type ClassFilter = 'all' | string;

export function AgentObservatoryPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all');
  const [classFilter, setClassFilter] = useState<ClassFilter>('all');
  const [quarantinedIds, setQuarantinedIds] = useState<Set<string>>(new Set());
  const [revokedIds, setRevokedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, refetch } = useQuery<{ sessions: AgentSession[] }>({
    queryKey: ['ecosystem', 'sessions'],
    queryFn: () => fetchJson(apiUrl('/ecosystem/sessions')),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 0,
  });

  const quarantineMutation = useMutation({
    mutationFn: (sessionId: string) =>
      postJson<{ sessionId: string; action: string; proofChainId: string }>(
        apiUrl(`/ecosystem/sessions/${sessionId}/quarantine`),
      ),
    onSuccess: (_, sessionId) => {
      setQuarantinedIds((prev) => new Set([...prev, sessionId]));
      void queryClient.invalidateQueries({ queryKey: ['ecosystem', 'sessions'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      postJson<{ sessionId: string; action: string; proofChainId: string }>(
        apiUrl(`/ecosystem/sessions/${sessionId}/revoke`),
      ),
    onSuccess: (_, sessionId) => {
      setRevokedIds((prev) => new Set([...prev, sessionId]));
      void queryClient.invalidateQueries({ queryKey: ['ecosystem', 'sessions'] });
    },
  });

  const allSessions: AgentSession[] = (data?.sessions ?? (isError ? MOCK_SESSIONS : [])).filter(
    (s) => !revokedIds.has(s.sessionId),
  );

  const sessions = allSessions
    .map((s) => ({
      ...s,
      status: quarantinedIds.has(s.sessionId) ? ('quarantined' as const) : s.status,
    }))
    .filter((s) => {
      if (statusFilter === 'active') return s.status === 'active';
      if (statusFilter === 'quarantined') return s.status === 'quarantined';
      if (statusFilter === 'blocked') return s.blockedCount > 0;
      return true;
    })
    .filter((s) => classFilter === 'all' || s.agentClass === classFilter);

  const agentClasses = Array.from(new Set(allSessions.map((s) => s.agentClass)));
  const activeCount = allSessions.filter((s) => s.status === 'active').length;
  const quarantinedCount = allSessions.filter(
    (s) => quarantinedIds.has(s.sessionId) || s.status === 'quarantined',
  ).length;
  const totalInvocations = allSessions.reduce((sum, s) => sum + s.invocationCount, 0);
  const blockedTotal = allSessions.reduce((sum, s) => sum + s.blockedCount, 0);

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Sessions', value: String(activeCount), color: '#22c55e', icon: Bot },
          { label: 'Quarantined', value: String(quarantinedCount), color: '#f97316', icon: ShieldAlert },
          { label: 'Total Invocations', value: totalInvocations.toLocaleString(), color: ECOSYSTEM_ACCENT, icon: Activity },
          { label: 'Blocked', value: String(blockedTotal), color: '#ef4444', icon: Ban },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-lg p-3 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                style={{ background: `${kpi.color}12`, border: `1px solid ${kpi.color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <div>
                <div className="text-[8px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {kpi.label}
                </div>
                <div className="text-[14px] font-bold font-mono" style={{ color: kpi.color }}>
                  {isLoading ? '…' : kpi.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3 h-3 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />

        {(['all', 'active', 'quarantined', 'blocked'] as FilterValue[]).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className="px-2.5 py-1 rounded text-[9px] font-mono font-medium capitalize transition-all"
            style={{
              background: statusFilter === f ? `${ECOSYSTEM_ACCENT}18` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${statusFilter === f ? ECOSYSTEM_ACCENT + '40' : 'rgba(255,255,255,0.08)'}`,
              color: statusFilter === f ? ECOSYSTEM_ACCENT : 'rgba(255,255,255,0.55)',
            }}
          >
            {f}
          </button>
        ))}

        <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {(['all', ...agentClasses] as ClassFilter[]).map((cls) => (
          <button
            key={cls}
            onClick={() => setClassFilter(cls)}
            className="px-2.5 py-1 rounded text-[9px] font-mono font-medium transition-all"
            style={{
              background: classFilter === cls ? `${ECOSYSTEM_ACCENT}18` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${classFilter === cls ? ECOSYSTEM_ACCENT + '40' : 'rgba(255,255,255,0.08)'}`,
              color: classFilter === cls ? ECOSYSTEM_ACCENT : 'rgba(255,255,255,0.55)',
            }}
          >
            {cls === 'all' ? 'All agents' : cls}
          </button>
        ))}

        <button
          onClick={() => refetch()}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-mono transition-all hover:opacity-80"
          style={{
            background: `${ECOSYSTEM_ACCENT}12`,
            border: `1px solid ${ECOSYSTEM_ACCENT}28`,
            color: ECOSYSTEM_ACCENT,
          }}
        >
          <RefreshCw className="w-2.5 h-2.5" />
          Refresh
        </button>
      </div>

      {/* Session cards */}
      <div className="flex flex-col gap-3">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,162,39,0.25)', borderTopColor: ECOSYSTEM_ACCENT }} />
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <Bot className="w-8 h-8 mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No agent sessions match the current filters
            </p>
          </div>
        )}

        {sessions.map((session) => (
          <SessionCard
            key={session.sessionId}
            session={session}
            onQuarantine={(id) => quarantineMutation.mutate(id)}
            onRevoke={(id) => revokeMutation.mutate(id)}
          />
        ))}
      </div>

      {isError && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded text-[9px] font-mono"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}
        >
          <AlertTriangle className="w-3 h-3 shrink-0" />
          API unavailable — showing synthetic session data.
        </div>
      )}
    </div>
  );
}
