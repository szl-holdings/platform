import * as React from 'react';

const ACCENT = '#34d399';
const BG = '#080d14';
const SURFACE = '#0c1422';
const BORDER = 'rgba(255,255,255,0.06)';
const TEXT_DIM = 'rgba(255,255,255,0.45)';

type MemoryTier =
  | 'working'
  | 'session'
  | 'episodic'
  | 'semantic'
  | 'workflow'
  | 'entity'
  | 'artifact'
  | 'operator-feedback'
  | 'executive'
  | 'skill'
  | 'long-term'
  | 'domain';

interface MemoryEntry {
  id: string;
  tier: MemoryTier;
  key: string;
  value?: unknown;
  summary?: string;
  confidence: number;
  sensitivity: string;
  domain: string;
  tags: string[];
  freshness: { isStale: boolean; lastUpdatedAt: string; lastAccessedAt?: string };
  retention: { policy: string; pinned: boolean; expiresAt?: string };
  provenance: { source: string; method: string; author?: string; createdAt: string };
  scopeId?: string;
}

interface MemoryStats {
  total: number;
  byType: Record<string, number>;
}

const TIER_COLORS: Record<string, string> = {
  working: '#60a5fa',
  session: '#a78bfa',
  episodic: '#fb923c',
  semantic: '#34d399',
  workflow: '#facc15',
  entity: '#f472b6',
  artifact: '#38bdf8',
  'operator-feedback': '#c084fc',
  executive: '#e2e8f0',
  skill: '#4ade80',
  'long-term': '#fbbf24',
  domain: '#f87171',
};

function TierBadge({ tier }: { tier: string }) {
  const color = TIER_COLORS[tier] ?? '#94a3b8';
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        padding: '1px 6px',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {tier}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#facc15' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 60,
          height: 4,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color: TEXT_DIM }}>{pct}%</span>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'string') return v.length > 120 ? v.slice(0, 120) + '…' : v;
  if (typeof v === 'object') {
    try {
      const s = JSON.stringify(v, null, 2);
      return s.length > 200 ? s.slice(0, 200) + '…' : s;
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function MemoryCard({
  entry,
  onPin,
  onDelete,
}: {
  entry: MemoryEntry;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${entry.freshness.isStale ? 'rgba(248,113,113,0.2)' : BORDER}`,
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 8,
        opacity: entry.freshness.isStale ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <TierBadge tier={entry.tier} />
            {entry.retention.pinned && (
              <span style={{ fontSize: 10, color: '#facc15' }}>📌 pinned</span>
            )}
            {entry.freshness.isStale && (
              <span style={{ fontSize: 10, color: '#f87171' }}>⚠ stale</span>
            )}
            <span style={{ fontSize: 11, color: TEXT_DIM, fontFamily: 'monospace' }}>
              {entry.domain}
            </span>
          </div>
          <div
            style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4, wordBreak: 'break-all' }}
          >
            {entry.key}
          </div>
          {entry.summary && (
            <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 4, lineHeight: 1.5 }}>
              {entry.summary}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <ConfidenceBar value={entry.confidence} />
            <span style={{ fontSize: 11, color: TEXT_DIM }}>{entry.sensitivity}</span>
            <span style={{ fontSize: 11, color: TEXT_DIM }}>{entry.retention.policy}</span>
            <span style={{ fontSize: 11, color: TEXT_DIM }}>
              {timeAgo(entry.freshness.lastUpdatedAt)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 4,
              color: TEXT_DIM,
              cursor: 'pointer',
              fontSize: 11,
              padding: '3px 8px',
            }}
          >
            {expanded ? 'less' : 'more'}
          </button>
          <button
            type="button"
            onClick={() => onPin(entry.id, !entry.retention.pinned)}
            style={{
              background: entry.retention.pinned ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 4,
              color: entry.retention.pinned ? '#facc15' : TEXT_DIM,
              cursor: 'pointer',
              fontSize: 11,
              padding: '3px 8px',
            }}
          >
            {entry.retention.pinned ? 'unpin' : 'pin'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            style={{
              background: 'rgba(248,113,113,0.1)',
              border: 'none',
              borderRadius: 4,
              color: '#f87171',
              cursor: 'pointer',
              fontSize: 11,
              padding: '3px 8px',
            }}
          >
            delete
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${BORDER}`,
            display: 'grid',
            gap: 8,
          }}
        >
          <Row label="ID" value={entry.id} mono />
          <Row label="Value" value={formatValue(entry.value)} mono />
          <Row label="Scope" value={entry.scopeId ?? '—'} mono />
          <Row label="Provenance" value={`${entry.provenance.source} (${entry.provenance.method})`} />
          {entry.provenance.author && <Row label="Author" value={entry.provenance.author} />}
          <Row label="Created" value={new Date(entry.provenance.createdAt).toLocaleString()} />
          {entry.retention.expiresAt && (
            <Row label="Expires" value={new Date(entry.retention.expiresAt).toLocaleString()} />
          )}
          {entry.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {entry.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    background: 'rgba(52,211,153,0.1)',
                    color: ACCENT,
                    borderRadius: 3,
                    fontSize: 10,
                    padding: '1px 5px',
                    fontFamily: 'monospace',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ width: 90, flexShrink: 0, fontSize: 11, color: TEXT_DIM }}>{label}</span>
      <span
        style={{
          fontSize: 11,
          color: '#e2e8f0',
          fontFamily: mono ? 'monospace' : undefined,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}/api${path}`, { credentials: 'include' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  return (d.data ?? d) as T;
}

async function apiPost(path: string, body?: unknown): Promise<void> {
  await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function apiDelete(path: string): Promise<void> {
  await fetch(`${BASE}/api${path}`, { method: 'DELETE', credentials: 'include' });
}

export default function MemoryInspectorPage() {
  const [entries, setEntries] = React.useState<MemoryEntry[]>([]);
  const [stats, setStats] = React.useState<MemoryStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [tierFilter, setTierFilter] = React.useState<string>('');
  const [includeStale, setIncludeStale] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 25;

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tierFilter) params.set('tier', tierFilter);
      if (search) params.set('search', search);
      if (includeStale) params.set('includeStale', 'true');
      params.set('limit', String(PAGE_SIZE));
      // Backend parsePagination reads "page" (1-based), not "offset".
      params.set('page', String(page + 1));

      const [data, s] = await Promise.all([
        apiGet<{ data: MemoryEntry[]; total: number }>(`/memory?${params}`),
        apiGet<MemoryStats>('/memory/stats/summary'),
      ]);
      setEntries((data as { data: MemoryEntry[] }).data ?? []);
      setStats(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tierFilter, search, includeStale, page]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handlePin = async (id: string, pin: boolean) => {
    try {
      if (pin) {
        await apiPost(`/memory/${id}/pin`, {});
      } else {
        await apiDelete(`/memory/${id}/pin`);
      }
      void fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update pin status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this memory entry?')) return;
    try {
      await apiDelete(`/memory/${id}`);
      void fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed — you may not have permission');
    }
  };

  const handleRetention = async () => {
    try {
      await apiPost('/memory/behaviors/enforce-retention');
      await apiPost('/memory/behaviors/decay-freshness');
      void fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retention enforcement failed — admin role required');
    }
  };

  const TIERS = [
    'working', 'session', 'episodic', 'semantic', 'workflow',
    'entity', 'artifact', 'operator-feedback', 'executive', 'skill',
  ];

  return (
    <div style={{ background: BG, minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 20, color: ACCENT }}>◈</span>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
              Memory Inspector
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: TEXT_DIM }}>
            View, search, pin, and manage the AI memory fabric — operator context persisted across sessions.
          </p>
        </div>

        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <StatCard label="Total Entries" value={stats.total} accent={ACCENT} />
            {Object.entries(stats.byType)
              .filter(([, v]) => v > 0)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([tier, count]) => (
                <StatCard key={tier} label={tier} value={count} accent={TIER_COLORS[tier] ?? '#94a3b8'} />
              ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Search keys, values, tags…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{
              flex: 1,
              minWidth: 180,
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              color: '#e2e8f0',
              fontSize: 13,
              padding: '7px 12px',
              outline: 'none',
            }}
          />
          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); setPage(0); }}
            style={{
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              color: '#e2e8f0',
              fontSize: 13,
              padding: '7px 10px',
              cursor: 'pointer',
            }}
          >
            <option value="">All tiers</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TEXT_DIM, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeStale}
              onChange={(e) => { setIncludeStale(e.target.checked); setPage(0); }}
            />
            Include stale
          </label>
          <button
            type="button"
            onClick={() => void fetchData()}
            style={{
              background: 'rgba(52,211,153,0.12)',
              border: `1px solid ${ACCENT}44`,
              borderRadius: 6,
              color: ACCENT,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              padding: '7px 16px',
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void handleRetention()}
            style={{
              background: 'rgba(250,204,21,0.08)',
              border: '1px solid rgba(250,204,21,0.3)',
              borderRadius: 6,
              color: '#facc15',
              cursor: 'pointer',
              fontSize: 13,
              padding: '7px 14px',
            }}
          >
            Run Retention
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 6,
              color: '#f87171',
              fontSize: 13,
              padding: '10px 14px',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: TEXT_DIM, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
            Loading memory entries…
          </div>
        ) : entries.length === 0 ? (
          <div style={{ color: TEXT_DIM, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
            No memory entries found.{' '}
            {!stats?.total && 'The memory fabric may be empty — publish some signals or run the cognitive runtime to populate it.'}
          </div>
        ) : (
          <>
            {entries.map((entry) => (
              <MemoryCard
                key={entry.id}
                entry={entry}
                onPin={(id, pinned) => void handlePin(id, pinned)}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: 5,
                  color: page === 0 ? TEXT_DIM : '#e2e8f0',
                  cursor: page === 0 ? 'default' : 'pointer',
                  fontSize: 13,
                  padding: '6px 14px',
                }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 13, color: TEXT_DIM, lineHeight: '30px' }}>
                Page {page + 1}
              </span>
              <button
                type="button"
                disabled={entries.length < PAGE_SIZE}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: 5,
                  color: entries.length < PAGE_SIZE ? TEXT_DIM : '#e2e8f0',
                  cursor: entries.length < PAGE_SIZE ? 'default' : 'pointer',
                  fontSize: 13,
                  padding: '6px 14px',
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: '10px 14px',
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: accent }}>{value}</div>
      <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  );
}
