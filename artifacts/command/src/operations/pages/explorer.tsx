import { Activity, ArrowUpRight, FileText, Network, Search, Workflow } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
};
const GOLD = '#d4a054';

interface Entry {
  id: string;
  title: string;
  kind: 'signal' | 'decision' | 'service' | 'doc';
  href: string;
  summary: string;
}

const KIND_ICON: Record<Entry['kind'], typeof Activity> = {
  signal: Activity,
  decision: Workflow,
  service: Network,
  doc: FileText,
};

const ENTRIES: Entry[] = [
  { id: 'e1', kind: 'signal', title: 'Capacity drift on h100-pool-02', href: '/operations/prism/signals', summary: 'Utilization above 90% for 12m; recommend cooldown.' },
  { id: 'e2', kind: 'decision', title: 'Approve marketing campaign launch', href: '/operations/approvals', summary: 'Awaiting two of three approvers; SLA in 4h.' },
  { id: 'e3', kind: 'service', title: 'Knowledge graph service', href: '/operations/knowledge-graph', summary: 'Healthy. 12.4M nodes, 41.7M edges, last sync 2m ago.' },
  { id: 'e4', kind: 'doc', title: 'Decision receipt — incident #4421', href: '/operations/decision-receipts', summary: 'Postmortem cross-linked with run console + evidence.' },
  { id: 'e5', kind: 'signal', title: 'Latency anomaly on /api/holdings', href: '/operations/alerts', summary: 'p95 +23% over baseline; tied to upstream change.' },
  { id: 'e6', kind: 'decision', title: 'Defer non-critical jobs to overnight', href: '/operations/defer-lane', summary: 'Auto-suggested by scheduler; one click to apply.' },
];

export default function ExplorerPage() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ENTRIES;
    return ENTRIES.filter(
      (e) => e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q) || e.kind.includes(q),
    );
  }, [query]);

  return (
    <div style={{ background: BG.page, minHeight: '100vh', padding: '24px 28px' }}>
      <header style={{ marginBottom: 20 }}>
        <div style={{ color: TEXT.tertiary, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 }}>
          OPERATIONS · DISCOVERY
        </div>
        <h1 style={{ color: TEXT.primary, fontSize: 22, fontWeight: 600, margin: 0 }}>Explorer</h1>
        <div style={{ color: TEXT.secondary, fontSize: 13, marginTop: 6, maxWidth: 720 }}>
          Unified search across signals, decisions, services, and decision receipts. Use this when you don't yet know
          which surface owns the answer.
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: BG.surface,
          border: `1px solid ${BORDER.muted}`,
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 16,
        }}
      >
        <Search size={14} color={TEXT.tertiary} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search signals, decisions, services, docs…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: TEXT.primary,
            fontSize: 13,
          }}
        />
        <span style={{ color: TEXT.tertiary, fontSize: 11 }}>
          {filtered.length} of {ENTRIES.length}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {filtered.map((e) => {
          const Icon = KIND_ICON[e.kind];
          return (
            <Link
              key={e.id}
              href={e.href}
              style={{
                display: 'block',
                background: BG.elevated,
                border: `1px solid ${BORDER.subtle}`,
                borderRadius: 10,
                padding: 14,
                textDecoration: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={14} color={GOLD} />
                  <div style={{ color: TEXT.tertiary, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' }}>{e.kind}</div>
                </div>
                <ArrowUpRight size={12} color={TEXT.tertiary} />
              </div>
              <div style={{ color: TEXT.primary, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{e.title}</div>
              <div style={{ color: TEXT.secondary, fontSize: 12, lineHeight: 1.5 }}>{e.summary}</div>
            </Link>
          );
        })}
        {filtered.length === 0 ? (
          <div style={{ color: TEXT.tertiary, fontSize: 12, padding: 20 }}>No matches for &ldquo;{query}&rdquo;.</div>
        ) : null}
      </div>
    </div>
  );
}
