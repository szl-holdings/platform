import { demoAuditEvents } from '@lyte/lib/demo-seed';
import { AlertTriangle, CheckCircle, Clock, FileText, Filter, Search } from 'lucide-react';
import { useState } from 'react';

const BG = { surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};

const OUTCOME: Record<string, { color: string; bg: string; border: string }> = {
  success: { color: '#6b8f71', bg: 'rgba(107,143,113,0.08)', border: 'rgba(107,143,113,0.2)' },
  failure: { color: '#c45a4a', bg: 'rgba(196,90,74,0.08)', border: 'rgba(196,90,74,0.2)' },
  partial: { color: '#c8953c', bg: 'rgba(200,149,60,0.08)', border: 'rgba(200,149,60,0.2)' },
};

const ACTOR_TYPE: Record<string, string> = {
  'Command Signal Engine': '#d4a054',
  'Command Workflow Engine': '#4a90b8',
  'Command Alert Engine': '#c8953c',
  'Command Compliance Engine': '#8b7ac8',
  'Admin System': '#6b8f71',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const absDiff = -diff;
    const mins = Math.floor(absDiff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${Math.floor(hrs / 24)}d`;
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );
}

export default function DemoAuditPage() {
  const [tagFilter, setTagFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const allTags = Array.from(new Set(demoAuditEvents.flatMap((e) => e.tags)));
  const filtered = demoAuditEvents.filter((e) => {
    if (tagFilter !== 'all' && !e.tags.includes(tagFilter)) return false;
    if (outcomeFilter !== 'all' && e.outcome !== outcomeFilter) return false;
    if (
      search &&
      !e.action.toLowerCase().includes(search.toLowerCase()) &&
      !e.actor.toLowerCase().includes(search.toLowerCase()) &&
      !e.context.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const failures = demoAuditEvents.filter((e) => e.outcome === 'failure').length;
  const systemEvents = demoAuditEvents.filter((e) => e.actorRole === 'System').length;
  const manualEvents = demoAuditEvents.filter((e) => e.actorRole !== 'System').length;

  return (
    <div className="p-4 max-w-[1100px] space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <FileText className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
          <span
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: '#d4a054' }}
          >
            Command · Audit
          </span>
        </div>
        <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>
          Audit Trail
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
          Complete event log with actors, actions, outcomes, and context
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: demoAuditEvents.length, color: TEXT.secondary },
          { label: 'System Automated', value: systemEvents, color: '#4a90b8' },
          { label: 'Manual Actions', value: manualEvents, color: '#d4a054' },
          { label: 'Failures', value: failures, color: '#c45a4a' },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-md p-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>
              {c.label}
            </div>
            <div className="text-xl font-bold font-mono" style={{ color: c.color as string }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-1 flex-1 max-w-xs rounded-md px-2.5 py-1.5"
          style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
        >
          <Search className="w-3 h-3 shrink-0" style={{ color: TEXT.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="flex-1 bg-transparent text-[10px] outline-none"
            style={{ color: TEXT.primary }}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider mr-1" style={{ color: TEXT.muted }}>
            Outcome:
          </span>
          {['all', 'success', 'failure', 'partial'].map((f) => {
            const oc = OUTCOME[f as keyof typeof OUTCOME];
            return (
              <button
                key={f}
                onClick={() => setOutcomeFilter(f)}
                className="text-[9px] px-2.5 py-1 rounded border capitalize transition-all"
                style={{
                  color: outcomeFilter === f ? (oc?.color ?? '#d4a054') : TEXT.muted,
                  background:
                    outcomeFilter === f ? (oc?.bg ?? 'rgba(212,160,84,0.08)') : 'transparent',
                  borderColor:
                    outcomeFilter === f ? (oc?.border ?? 'rgba(212,160,84,0.2)') : BORDER.subtle,
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
        <span className="ml-auto text-[9px] font-mono" style={{ color: TEXT.muted }}>
          {filtered.length} events
        </span>
      </div>

      <div
        className="rounded-md overflow-hidden"
        style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
      >
        <div className="relative pl-10">
          <div
            className="absolute left-5 top-0 bottom-0 w-px"
            style={{ background: BORDER.muted }}
          />
          <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
            {filtered.map((evt, i) => {
              const oc = OUTCOME[evt.outcome];
              const actorColor = ACTOR_TYPE[evt.actor] ?? TEXT.secondary;
              const isSystem = evt.actorRole === 'System';
              return (
                <div
                  key={evt.id}
                  className="relative px-4 py-3 hover:bg-white/[0.015] transition-colors"
                >
                  <div
                    className="absolute left-3.5 top-4 w-3 h-3 rounded-full border flex items-center justify-center"
                    style={{
                      background: BG.surface,
                      borderColor: isSystem ? '#4a90b8' : '#d4a054',
                    }}
                  >
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: isSystem ? '#4a90b8' : '#d4a054' }}
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold" style={{ color: TEXT.primary }}>
                          {evt.action}
                        </span>
                        <span
                          className="text-[8px] px-1.5 py-px rounded"
                          style={{
                            color: oc.color,
                            background: oc.bg,
                            border: `1px solid ${oc.border}`,
                          }}
                        >
                          {evt.outcome.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-medium" style={{ color: actorColor }}>
                          {evt.actor}
                        </span>
                        <span
                          className="text-[8px] px-1 py-px rounded"
                          style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
                        >
                          {evt.actorRole}
                        </span>
                        <span className="text-[9px]" style={{ color: TEXT.muted }}>
                          → {evt.resource}: {evt.resourceId}
                        </span>
                      </div>
                      <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>
                        {evt.context}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {evt.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[7px] px-1.5 py-px rounded-full"
                            style={{
                              color: TEXT.muted,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            {t.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
                        {timeAgo(evt.timestamp)}
                      </div>
                      <div className="text-[8px]" style={{ color: TEXT.muted }}>
                        {evt.ipAddress}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
