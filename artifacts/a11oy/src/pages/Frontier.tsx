import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusPill } from '../components/ui';

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

interface TimelineEvent {
  id: string;
  at: string;
  kind: string;
  provider?: string;
  artifactId?: string;
  inboxId?: string;
  message: string;
  costUsd?: number;
}

interface SourceMeta {
  provider: string;
  name: string;
  kind: string;
  ratePerHour: number;
}

interface Stats {
  totalDiscovered: number;
  totalPromoted: number;
  totalQueued: number;
  totalDiscarded: number;
  pendingInbox: number;
  spend: Array<{ provider: string; spendUsd: number; callCount: number }>;
  spendCapUsd: number;
  capReached: boolean;
  lastPullAt?: string;
  workerRunning: boolean;
  sources: SourceMeta[];
  dailySpend?: {
    usd: number;
    capUsd: number;
    windowStart: string;
    msUntilReset: number;
    history?: Array<{ day: string; usd: number }>;
  };
}

function formatDuration(ms: number): string {
  if (ms <= 0) return 'resetting…';
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
  return (json.data ?? json) as T;
}

const KIND_COLOR: Record<string, string> = {
  discovered: 'rgba(94,94,94,0.25)',
  promoted: 'rgba(34,197,94,0.30)',
  queued: 'rgba(201,183,135,0.30)',
  discarded: 'rgba(120,120,120,0.20)',
  approved: 'rgba(34,197,94,0.30)',
  rejected: 'rgba(239,68,68,0.30)',
  'pull-started': 'rgba(94,94,94,0.20)',
  'pull-completed': 'rgba(94,94,94,0.20)',
  'cap-reached': 'rgba(239,68,68,0.30)',
};

export function Frontier() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([
        api<Stats>('/a11oy/frontier/stats'),
        api<{ events: TimelineEvent[] }>(
          `/a11oy/frontier/timeline?limit=200${providerFilter !== 'all' ? `&provider=${providerFilter}` : ''}`,
        ),
      ]);
      setStats(s);
      setEvents(t.events);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [providerFilter]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 10_000);
    return () => clearInterval(t);
  }, [refresh]);

  const triggerPull = async () => {
    setBusy(true);
    try {
      await api('/a11oy/frontier/pull', { method: 'POST', body: JSON.stringify({}) });
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleWorker = async () => {
    setBusy(true);
    try {
      const path = stats?.workerRunning
        ? '/a11oy/frontier/worker/stop'
        : '/a11oy/frontier/worker/start';
      await api(path, { method: 'POST', body: JSON.stringify({}) });
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const totalSpend = stats?.spend.reduce((s, x) => s + x.spendUsd, 0) ?? 0;
  const providers = ['all', ...Array.from(new Set(stats?.sources.map((s) => s.provider) ?? []))];
  const daily = stats?.dailySpend;
  const dailyPct = daily && daily.capUsd > 0 ? Math.min(100, (daily.usd / daily.capUsd) * 100) : 0;
  const dailyTripped = !!daily && daily.capUsd > 0 && daily.usd >= daily.capUsd;
  const dailyBarColor = dailyTripped ? '#ef4444' : dailyPct >= 80 ? '#f59e0b' : '#c9b787';
  const history = daily?.history ?? [];
  const historyMax = history.reduce((m, h) => Math.max(m, h.usd), 0);
  const sparkScaleRef = Math.max(historyMax, daily?.capUsd ?? 0, 0.0001);

  return (
    <Layout>
      <PageHeader
        title="Frontier Ingestion Engine"
        subtitle="Continuous pulls from Anthropic, OpenAI, Google, NVIDIA, HuggingFace — codex-scored, auto-promoted or queued for operator review."
      />

      {err && (
        <div className="mb-4 px-3 py-2 rounded text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
          {err}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KpiCard label="Discovered" value={stats?.totalDiscovered ?? 0} accent="#c9b787" />
        <KpiCard label="Auto-promoted" value={stats?.totalPromoted ?? 0} accent="#22c55e" />
        <KpiCard label="Pending review" value={stats?.pendingInbox ?? 0} sub={`${stats?.totalQueued ?? 0} total queued`} accent="#c9b787" />
        <KpiCard label="Discarded" value={stats?.totalDiscarded ?? 0} accent="#8a8a8a" />
        <KpiCard
          label="Lifetime spend"
          value={`$${totalSpend.toFixed(4)}`}
          sub={`cap $${(stats?.spendCapUsd ?? 0).toFixed(2)}${stats?.capReached ? ' • REACHED' : ''}`}
          accent={stats?.capReached ? '#ef4444' : '#c9b787'}
        />
      </div>

      {daily && (
        <Card className="p-3 mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">
                Daily spend (24h rolling window)
              </div>
              <div className="text-xs text-neutral-200 font-mono mt-0.5">
                ${daily.usd.toFixed(4)} <span className="text-neutral-500">of</span> ${daily.capUsd.toFixed(2)}
                {dailyTripped && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(239,68,68,0.20)', color: '#fca5a5' }}>
                    CAP REACHED
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-neutral-500 font-mono">resets in</div>
              <div className="text-xs text-neutral-300 font-mono">{formatDuration(daily.msUntilReset)}</div>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <div className="h-2 rounded overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="h-full transition-all"
                  style={{ width: `${dailyPct}%`, backgroundColor: dailyBarColor }}
                />
              </div>
              <div className="mt-1 text-[10px] text-neutral-500 font-mono">
                window started {new Date(daily.windowStart).toLocaleString()}
              </div>
            </div>
            <div className="shrink-0" title="Daily spend, last 7 days (rightmost = today)">
              <div className="flex items-end gap-0.5 h-8">
                {history.length === 0 && (
                  <div className="text-[10px] text-neutral-600 font-mono self-center">
                    no trend yet
                  </div>
                )}
                {history.map((h) => {
                  const pct = sparkScaleRef > 0 ? Math.max(2, Math.round((h.usd / sparkScaleRef) * 100)) : 2;
                  const isToday = h.day === daily.windowStart.slice(0, 10);
                  const overCap = daily.capUsd > 0 && h.usd >= daily.capUsd;
                  const color = overCap
                    ? '#ef4444'
                    : isToday
                      ? dailyBarColor
                      : 'rgba(201,183,135,0.55)';
                  return (
                    <div
                      key={h.day}
                      title={`${h.day}: $${h.usd.toFixed(4)}`}
                      className="w-2 rounded-sm"
                      style={{ height: `${pct}%`, backgroundColor: color, minHeight: 2 }}
                    />
                  );
                })}
              </div>
              <div className="mt-1 text-[10px] text-neutral-500 font-mono text-right">
                7d trend
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={triggerPull}
          disabled={busy}
          className="px-3 py-1.5 text-xs rounded font-mono"
          style={{ backgroundColor: 'rgba(201,183,135,0.15)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.3)' }}
        >
          {busy ? 'Pulling…' : 'Pull all sources now'}
        </button>
        <button
          onClick={toggleWorker}
          disabled={busy}
          className="px-3 py-1.5 text-xs rounded font-mono"
          style={{ backgroundColor: 'rgba(94,94,94,0.15)', color: '#f5f5f5', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {stats?.workerRunning ? 'Stop worker' : 'Start worker'}
        </button>
        <Link
          href={`${BASE}/frontier/inbox`}
          className="px-3 py-1.5 text-xs rounded font-mono"
          style={{ backgroundColor: 'rgba(201,183,135,0.10)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.25)' }}
        >
          Operator inbox →
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-neutral-500">Filter:</span>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-2 py-1 text-xs rounded font-mono bg-neutral-900 border border-neutral-700 text-neutral-200"
          >
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <StatusPill status={stats?.workerRunning ? 'LIVE' : 'GATED'} />
        </div>
      </div>

      <SectionTitle>Sources</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {stats?.sources.map((s) => {
          const meter = stats.spend.find((m) => m.provider === s.provider);
          return (
            <Card key={s.name} className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-mono text-neutral-300">{s.name}</div>
                  <div className="text-[10px] text-neutral-500 uppercase mt-1">
                    {s.provider} • {s.kind}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-500">{s.ratePerHour}/hr</div>
                  <div className="text-[10px] text-neutral-400">{meter?.callCount ?? 0} calls</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <SectionTitle>Live Timeline</SectionTitle>
      <Card className="p-0 overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-neutral-800">
          {events.length === 0 && (
            <div className="px-4 py-6 text-xs text-neutral-500 text-center">
              No frontier events yet. Trigger a pull to discover artifacts.
            </div>
          )}
          {events.map((ev) => (
            <div key={ev.id} className="px-4 py-2 flex items-start gap-3 hover:bg-neutral-900/40">
              <div
                className="text-[10px] font-mono px-1.5 py-0.5 rounded mt-0.5 uppercase"
                style={{ backgroundColor: KIND_COLOR[ev.kind] ?? 'rgba(94,94,94,0.2)', color: '#f5f5f5' }}
              >
                {ev.kind}
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-200">{ev.message}</div>
                <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                  {new Date(ev.at).toLocaleString()}
                  {ev.provider ? ` • ${ev.provider}` : ''}
                  {typeof ev.costUsd === 'number' && ev.costUsd > 0 ? ` • $${ev.costUsd.toFixed(4)}` : ''}
                </div>
              </div>
              {ev.inboxId && (
                <Link
                  href={`${BASE}/frontier/inbox`}
                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{ color: '#c9b787', border: '1px solid rgba(201,183,135,0.3)' }}
                >
                  review
                </Link>
              )}
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  );
}
