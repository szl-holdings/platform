import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { fetchJson } from './cognitive/shared';

const API_BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/a11oy\/$/, '/api').replace(/\/$/, '');

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

type HookEvent =
  | 'SessionStart' | 'PreToolUse' | 'PostToolUse' | 'PrePromptSubmit'
  | 'PreSubagentSpawn' | 'PostSubagentReturn' | 'OnError'
  | 'OnPlanProposed' | 'OnPlanApproved' | 'OnDecisionEmitted' | 'OnProofPacketSealed';

type HookAction = 'allow' | 'block' | 'modify' | 'route';

interface HookPack {
  id: string;
  name: string;
  description: string;
  events: HookEvent[];
  priority: number;
  timeout_ms: number;
  policy_bundle: string;
  source: 'builtin' | 'operator' | 'rego';
  allow_24h: number;
  block_24h: number;
  modify_24h: number;
  route_24h: number;
  avg_duration_ms: number;
  last_invoked: string | null;
  status: 'active' | 'paused' | 'error';
}

interface InvocationRecord {
  id: string;
  hook_id: string;
  hook_name: string;
  event: HookEvent;
  action: HookAction;
  reason: string;
  duration_ms: number;
  session_id: string;
  agent_id: string;
  proof_entry_id: string;
  timestamp: string;
}

const EVENT_COLORS: Record<HookEvent, string> = {
  SessionStart: '#c9b787',
  PreToolUse: '#f5f5f5',
  PostToolUse: '#8a8a8a',
  PrePromptSubmit: '#c9b787',
  PreSubagentSpawn: '#f5f5f5',
  PostSubagentReturn: '#8a8a8a',
  OnError: '#f5f5f5',
  OnPlanProposed: '#c9b787',
  OnPlanApproved: '#c9b787',
  OnDecisionEmitted: '#8a8a8a',
  OnProofPacketSealed: '#5e5e5e',
};

const ACTION_COLORS: Record<HookAction, string> = {
  allow: '#c9b787',
  block: '#f5f5f5',
  modify: '#8a8a8a',
  route: '#c9b787',
};


function eventBadge(event: HookEvent) {
  return (
    <span
      key={event}
      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
      style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: EVENT_COLORS[event] ?? T.dim }}
    >
      {event}
    </span>
  );
}

function SourceBadge({ source }: { source: HookPack['source'] }) {
  const label = source === 'builtin' ? 'BUILT-IN' : source === 'rego' ? 'OPA/REGO' : 'OPERATOR';
  const color = source === 'builtin' ? '#c9b787' : source === 'rego' ? '#f5f5f5' : '#8a8a8a';
  return (
    <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded"
      style={{ backgroundColor: 'rgba(255,255,255,0.05)', color }}>{label}</span>
  );
}

export function HookPacks() {
  const [selected, setSelected] = useState<HookPack | null>(null);
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [replayId, setReplayId] = useState<string | null>(null);
  const [replayResult, setReplayResult] = useState<Record<string, unknown> | null>(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [hookPacks, setHookPacks] = useState<HookPack[]>([]);
  const [invocations, setInvocations] = useState<InvocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFetchError(null);
      try {
        const [hooksRes, invRes] = await Promise.all([
          fetch(`${API_BASE}/a11oy/hooks`),
          fetch(`${API_BASE}/a11oy/hooks/invocations?limit=50`),
        ]);
        const [hooksJson, invJson] = await Promise.all([hooksRes.json(), invRes.json()]);
        if (!cancelled) {
          if (hooksJson.ok && Array.isArray(hooksJson.data) && hooksJson.data.length > 0) {
            setHookPacks(hooksJson.data as HookPack[]);
          }
          if (invJson.ok && Array.isArray(invJson.data)) {
            setInvocations(invJson.data as InvocationRecord[]);
          }
        }
      } catch (e) {
        if (!cancelled) setFetchError(e instanceof Error ? e.message : 'Failed to load hook data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredPacks = hookPacks.filter(h =>
    (filterEvent === 'all' || h.events.includes(filterEvent as HookEvent)) &&
    (filterSource === 'all' || h.source === filterSource),
  );

  const totalAllow = hookPacks.reduce((s, h) => s + h.allow_24h, 0);
  const totalBlock = hookPacks.reduce((s, h) => s + h.block_24h, 0);
  const totalModify = hookPacks.reduce((s, h) => s + h.modify_24h, 0);
  const totalRoute = hookPacks.reduce((s, h) => s + h.route_24h, 0);

  return (
    <Layout>
      <PageHeader
        label="HOOK PACKS"
        title="Lifecycle Hook Registry"
        subtitle="Every skill invocation, tool call, subagent spawn, and plan signing passes through registered lifecycle hooks. Each decision is proof-chained by construction."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="ALLOW (24h)" value={totalAllow.toLocaleString()} sub="passed through" accent={T.accent} />
        <KpiCard label="BLOCK (24h)" value={totalBlock.toLocaleString()} sub="hard gated" accent="#f5f5f5" />
        <KpiCard label="MODIFY (24h)" value={totalModify.toLocaleString()} sub="redacted / modified" accent={T.dim} />
        <KpiCard label="ROUTE (24h)" value={totalRoute.toLocaleString()} sub="re-routed" accent={T.accent} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1 flex-wrap">
          {['all', 'PreToolUse', 'PostToolUse', 'PreSubagentSpawn', 'PostSubagentReturn', 'PrePromptSubmit', 'OnPlanProposed'].map(ev => (
            <button
              key={ev}
              type="button"
              onClick={() => setFilterEvent(ev)}
              className="text-[11px] font-mono px-2.5 py-1 rounded transition-colors"
              style={{
                backgroundColor: filterEvent === ev ? 'rgba(201,183,135,0.15)' : 'rgba(255,255,255,0.04)',
                color: filterEvent === ev ? T.accent : T.dim,
              }}
            >
              {ev === 'all' ? 'All Events' : ev}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['all', 'builtin', 'operator', 'rego'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterSource(s)}
              className="text-[11px] font-mono px-2.5 py-1 rounded transition-colors"
              style={{
                backgroundColor: filterSource === s ? 'rgba(201,183,135,0.15)' : 'rgba(255,255,255,0.04)',
                color: filterSource === s ? T.accent : T.dim,
              }}
            >
              {s === 'all' ? 'All Sources' : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Hook pack list */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <SectionTitle>Registered Hook Packs — {filteredPacks.length} of {hookPacks.length}</SectionTitle>
          {filteredPacks.map(hook => (
            <Card
              key={hook.id}
              className="cursor-pointer transition-colors"
              style={{
                borderColor: selected?.id === hook.id ? T.accent : T.border,
                backgroundColor: selected?.id === hook.id ? 'rgba(201,183,135,0.04)' : T.surface,
              }}
              onClick={() => setSelected(selected?.id === hook.id ? null : hook)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: T.text }}>{hook.name}</span>
                  <SourceBadge source={hook.source} />
                  <span className="text-[10px] font-mono" style={{ color: hook.status === 'active' ? '#c9b787' : '#5e5e5e' }}>
                    {hook.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] font-mono shrink-0" style={{ color: T.muted }}>P{hook.priority}</span>
              </div>

              <p className="text-xs mb-3" style={{ color: T.dim }}>{hook.description}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {hook.events.map(ev => eventBadge(ev))}
              </div>

              <div className="grid grid-cols-4 gap-2 mb-2">
                {[
                  { label: 'ALLOW', value: hook.allow_24h, color: '#c9b787' },
                  { label: 'BLOCK', value: hook.block_24h, color: '#f5f5f5' },
                  { label: 'MODIFY', value: hook.modify_24h, color: '#8a8a8a' },
                  { label: 'ROUTE', value: hook.route_24h, color: '#5e5e5e' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-sm font-mono font-semibold" style={{ color }}>{value}</div>
                    <div className="text-[10px] font-mono" style={{ color: T.muted }}>{label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono" style={{ color: T.muted }}>avg {hook.avg_duration_ms}ms · timeout {hook.timeout_ms}ms</span>
                <span className="text-[10px] font-mono" style={{ color: T.muted }}>
                  {hook.last_invoked ? new Date(hook.last_invoked).toLocaleTimeString() : '—'}
                </span>
              </div>

              {selected?.id === hook.id && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: T.border }}>
                  <div className="flex gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase" style={{ color: T.muted }}>Policy Bundle</span>
                    <span className="text-[10px] font-mono" style={{ color: T.accent }}>{hook.policy_bundle}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-mono uppercase" style={{ color: T.muted }}>Hook ID</span>
                    <span className="text-[10px] font-mono" style={{ color: T.dim }}>{hook.id}</span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Invocation Log */}
        <div className="flex flex-col gap-2">
          <SectionTitle>Live Invocation Log</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {invocations.map(inv => (
              <div
                key={inv.id}
                className="p-2.5 rounded border"
                style={{ backgroundColor: T.surface, borderColor: replayId === inv.id ? T.accent : T.border }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono" style={{ color: EVENT_COLORS[inv.event] ?? T.dim }}>{inv.event}</span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: ACTION_COLORS[inv.action] }}
                  >
                    {inv.action.toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] font-medium mb-0.5 truncate" style={{ color: T.text }}>{inv.hook_name}</div>
                <div className="text-[10px] mb-1 leading-tight" style={{ color: T.dim }}>{inv.reason}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono" style={{ color: T.muted }}>{inv.agent_id} · {inv.duration_ms}ms</span>
                  <button
                    type="button"
                    disabled={replayLoading && replayId === inv.id}
                    onClick={async () => {
                      if (replayId === inv.id) { setReplayId(null); setReplayResult(null); return; }
                      setReplayId(inv.id);
                      setReplayResult(null);
                      setReplayLoading(true);
                      try {
                        const json = await fetchJson<{ ok: boolean; data?: Record<string, unknown> }>(
                          `${API_BASE}/a11oy/hooks/replay`,
                          { method: 'POST', body: JSON.stringify({ invocation_id: inv.id }) },
                        );
                        if (json.ok) setReplayResult(json.data ?? null);
                      } finally {
                        setReplayLoading(false);
                      }
                    }}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors"
                    style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: replayLoading && replayId === inv.id ? T.muted : T.accent, cursor: replayLoading && replayId === inv.id ? 'wait' : 'pointer' }}
                  >
                    {replayLoading && replayId === inv.id ? '…' : 'REPLAY'}
                  </button>
                </div>
                {replayId === inv.id && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: T.border }}>
                    <div className="text-[10px] font-mono mb-0.5" style={{ color: T.muted }}>
                      session: {inv.session_id}
                    </div>
                    <div className="text-[10px] font-mono mb-0.5" style={{ color: T.muted }}>
                      proof: {inv.proof_entry_id}
                    </div>
                    {replayResult && (
                      <div className="mt-1 text-[10px] font-mono px-2 py-1 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.06)', color: T.accent }}>
                        ◆ replayed · action: {String((replayResult.replay_decision as Record<string, unknown>)?.action ?? '—')} · {new Date(String(replayResult.replayed_at ?? '')).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded border" style={{ borderColor: T.border, backgroundColor: T.surface }}>
            <div className="text-[11px] font-mono uppercase mb-2" style={{ color: T.muted }}>Decision Contract Shape</div>
            <pre className="text-[10px] font-mono leading-relaxed" style={{ color: T.accent }}>
{`{
  action: 'allow'
         | 'block'
         | 'modify'
         | 'route',
  reason: string,
  redactions?: string[],
  proof_attachments?: {
    ...
  },
  modified_content?: string,
  route_target?: string,
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Lifecycle diagram */}
      <SectionTitle>Lifecycle Event Surface</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-8">
        {([
          ['SessionStart', 'Session initialization'],
          ['PreToolUse', 'Before any tool call'],
          ['PostToolUse', 'After tool returns'],
          ['PrePromptSubmit', 'Before model call'],
          ['PreSubagentSpawn', 'Before child spawn'],
          ['PostSubagentReturn', 'After child returns'],
          ['OnPlanProposed', 'When plan is drafted'],
          ['OnPlanApproved', 'When plan is signed'],
          ['OnDecisionEmitted', 'On decision card emit'],
          ['OnProofPacketSealed', 'On proof sealed'],
          ['OnError', 'Any hook/tool error'],
        ] as [HookEvent, string][]).map(([ev, desc]) => (
          <div key={ev} className="p-2 rounded border" style={{ borderColor: T.border, backgroundColor: T.surface }}>
            <div className="text-[10px] font-mono mb-0.5" style={{ color: EVENT_COLORS[ev] }}>{ev}</div>
            <div className="text-[10px]" style={{ color: T.muted }}>{desc}</div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
