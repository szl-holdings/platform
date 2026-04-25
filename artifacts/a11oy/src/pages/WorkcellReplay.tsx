import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge } from '../components/ui';

const API = '/api/a11oy';
const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

interface ReplaySummary {
  id: string; workcellId: string; workcellName: string; tenant: string; domain: string;
  outcome: string; completedAt: string; durationMs: number; evalDisposition: string | null;
  evalComposite: number | null; proofRef: string | null; failureClass: string | null;
  approvalTier: string;
}

interface ReplaysData {
  replays: ReplaySummary[];
  total: number; successful: number; failed: number;
}

const OUTCOME_COLORS: Record<string, string> = { success: '#10b981', blocked: '#ef4444', failed: '#f59e0b' };
const DISP_COLORS: Record<string, string> = { pass: '#10b981', pass_with_warning: '#f59e0b', needs_more_evidence: '#f59e0b', requires_human_review: '#f59e0b', blocked: '#ef4444' };

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return s > 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

export function WorkcellReplay() {
  const [data, setData] = useState<ReplaysData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterDomain, setFilterDomain] = useState('all');

  useEffect(() => {
    fetch(`${API}/replay`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const domains = data ? [...new Set(data.replays.map(r => r.domain))] : [];
  const filtered = data?.replays.filter(r =>
    (filterOutcome === 'all' || r.outcome === filterOutcome) &&
    (filterDomain === 'all' || r.domain === filterDomain)
  ) ?? [];

  return (
    <Layout>
      <PageHeader
        label="WORKCELL REPLAY"
        title="Flight Recorder & Execution Audit"
        subtitle="Every completed Workcell is replayable — step by step, with timeline, eval scores, approval records, tool calls, and proof chain."
        status="DEMO"
      />

      {loading ? (
        <div className="text-xs animate-pulse mb-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading replay index…</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KpiCard label="TOTAL REPLAYS" value={String(data.total)} sub="All workcells" accent="#3b82f6" />
            <KpiCard label="SUCCESSFUL" value={String(data.successful)} sub="Completed" accent="#10b981" />
            <KpiCard label="FAILED / BLOCKED" value={String(data.failed)} sub="Need review" accent="#ef4444" />
            <KpiCard label="FAILURE CLASSES" value="12" sub="Classification model" accent="#f59e0b" />
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Outcome:</span>
            {['all', 'success', 'failed', 'blocked'].map(o => (
              <button key={o} onClick={() => setFilterOutcome(o)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterOutcome === o ? 'rgba(59,130,246,0.2)' : 'var(--color-a11oy-muted)', color: filterOutcome === o ? '#3b82f6' : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterOutcome === o ? 'rgba(59,130,246,0.4)' : 'var(--color-a11oy-border)'}` }}>
                {o}
              </button>
            ))}
            <span className="text-xs ml-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Domain:</span>
            {['all', ...domains].map(d => (
              <button key={d} onClick={() => setFilterDomain(d)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterDomain === d ? 'rgba(139,92,246,0.2)' : 'var(--color-a11oy-muted)', color: filterDomain === d ? '#8b5cf6' : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterDomain === d ? 'rgba(139,92,246,0.4)' : 'var(--color-a11oy-border)'}` }}>
                {d}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map(r => (
              <Link key={r.id} href={`${BASE}/replay/${r.id}`}>
                <Card className="cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium" style={{ color: OUTCOME_COLORS[r.outcome] ?? '#9bacc4' }}>
                          {r.outcome === 'success' ? '✓' : r.outcome === 'blocked' ? '⊗' : '⚠'} {r.outcome.toUpperCase()}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{r.domain} · {r.tenant}</span>
                      </div>
                      <div className="font-medium text-sm truncate mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{r.workcellName}</div>
                      <div className="flex items-center gap-4 text-xs">
                        <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{new Date(r.completedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>⏱ {fmt(r.durationMs)}</span>
                        {r.approvalTier && <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>⚖ {r.approvalTier}</span>}
                        {r.proofRef && <span style={{ color: '#b08d52' }}>◇ {r.proofRef.split('-').slice(0, 2).join('-')}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {r.evalDisposition && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: DISP_COLORS[r.evalDisposition] ?? '#9bacc4', backgroundColor: `${DISP_COLORS[r.evalDisposition] ?? '#9bacc4'}18` }}>
                          {r.evalDisposition.replace(/_/g, ' ')}
                        </span>
                      )}
                      {r.evalComposite !== null && (
                        <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                          eval {Math.round(r.evalComposite * 100)}%
                        </span>
                      )}
                      {r.failureClass && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                          {r.failureClass.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: '#3b82f6' }}>View replay →</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-xs text-center py-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No replays match the selected filters.</div>
          )}
        </>
      ) : (
        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Replay index unavailable.</div>
      )}

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Replay data is reconstructed from the immutable Proof Ledger in production. Demo replays are seeded.
      </div>
    </Layout>
  );
}
