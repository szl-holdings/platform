import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { SEED_WORKCELLS } from '@workspace/a11oy-fabric';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

interface ReplaySummary {
  id: string;
  workcellId: string;
  workcellName: string;
  tenant: string;
  domain: string;
  outcome: string;
  completedAt: string;
  durationMs: number;
  evalDisposition: string | null;
  evalComposite: number | null;
  proofRef: string | null;
  failureClass: string | null;
  approvalTier: string;
}

const OUTCOME_COLORS: Record<string, string> = {
  success: '#c9b787',
  blocked: '#f5f5f5',
  failed: '#c9b787',
};
const DISP_COLORS: Record<string, string> = {
  pass: '#c9b787',
  pass_with_warning: '#c9b787',
  needs_more_evidence: '#c9b787',
  requires_human_review: '#c9b787',
  blocked: '#f5f5f5',
};

const VERTICAL_TENANT_MAP: Record<string, { tenant: string; domain: string }> = {
  'lyte-revenue': { tenant: 'Lyte', domain: 'Revenue' },
  'vessels-maritime': { tenant: 'Vessels', domain: 'Maritime' },
  'terra-real-estate': { tenant: 'Terra', domain: 'Real Estate' },
  'aegis-defense': { tenant: 'Aegis', domain: 'Defense' },
  'prism-counsel': { tenant: 'Counsel', domain: 'Legal' },
  'carlota-jo': { tenant: 'Carlota Jo', domain: 'Advisory' },
  'alloy-core': { tenant: 'A11oy', domain: 'Platform' },
};

const FAILURE_CLASSES = [
  'evidence_insufficient',
  'approval_timeout',
  'eval_blocked',
  'connector_denied',
  'policy_violation',
  null,
];
const REPLAY_FIXTURE_EPOCH_MS = Date.parse('2026-04-16T12:00:00.000Z');

const REPLAYS: ReplaySummary[] = SEED_WORKCELLS.map((wc, i) => {
  const meta = VERTICAL_TENANT_MAP[wc.vertical as string] ?? {
    tenant: 'Enterprise',
    domain: 'Operations',
  };
  const outcome =
    wc.status === 'error'
      ? 'failed'
      : wc.status === 'idle' && !wc.requiresApproval
        ? 'success'
        : wc.status === 'running'
          ? 'success'
          : 'success';
  const failureClass = outcome === 'failed' ? FAILURE_CLASSES[i % FAILURE_CLASSES.length] : null;
  return {
    id: `replay-${wc.id}`,
    workcellId: wc.id,
    workcellName: wc.name,
    tenant: meta.tenant,
    domain: meta.domain,
    outcome,
    completedAt: new Date(REPLAY_FIXTURE_EPOCH_MS - (i * 3600000 + (i % 4) * 300000)).toISOString(),
    durationMs: 8000 + ((i * 7919) % 90000),
    evalDisposition:
      wc.mirrorEvalResult.verdict === 'pass'
        ? 'pass'
        : wc.mirrorEvalResult.verdict === 'warn'
          ? 'pass_with_warning'
          : 'blocked',
    evalComposite: wc.mirrorEvalResult.score,
    proofRef: wc.proofPacketId,
    failureClass,
    approvalTier: wc.requiresApproval
      ? (wc.actionBrief?.approvalTier?.toUpperCase() ?? 'TIER_3')
      : 'TIER_1',
  };
});

const REPLAYS_DATA = {
  replays: REPLAYS,
  total: REPLAYS.length,
  successful: REPLAYS.filter((r) => r.outcome === 'success').length,
  failed: REPLAYS.filter((r) => r.outcome !== 'success').length,
};

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return s > 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

export function WorkcellReplay() {
  const [data] = useState(REPLAYS_DATA);
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterDomain, setFilterDomain] = useState('all');

  const domains = [...new Set(data.replays.map((r) => r.domain))];
  const filtered = data.replays.filter(
    (r) =>
      (filterOutcome === 'all' || r.outcome === filterOutcome) &&
      (filterDomain === 'all' || r.domain === filterDomain),
  );

  return (
    <Layout>
      <PageHeader
        label="WORKCELL REPLAY"
        title="Seeded Flight Recorder"
        subtitle="Deterministic demonstration replays show timeline, eval, approval, and receipt fields without asserting operational executions."
        status="DEMO"
      />

      <div
        className="mb-6 rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm leading-6"
        style={{ color: 'var(--color-a11oy-text-sub)' }}
        role="note"
      >
        <strong style={{ color: 'var(--color-a11oy-text)' }}>Evidence boundary:</strong> all replay
        rows are derived deterministically from repository seed Workcells.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="DEMO REPLAYS"
          value={String(data.total)}
          sub="seed fixtures"
          accent="#c9b787"
        />
        <KpiCard
          label="DEMO SUCCESS"
          value={String(data.successful)}
          sub="derived outcome"
          accent="#c9b787"
        />
        <KpiCard
          label="DEMO FAILED"
          value={String(data.failed)}
          sub="derived outcome"
          accent="#f5f5f5"
        />
        <KpiCard
          label="FAILURE CLASSES"
          value={String(FAILURE_CLASSES.filter(Boolean).length)}
          sub="named fixtures"
          accent="#c9b787"
        />
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Outcome:
        </span>
        {['all', 'success', 'failed', 'blocked'].map((o) => (
          <button
            type="button"
            key={o}
            onClick={() => setFilterOutcome(o)}
            aria-pressed={filterOutcome === o}
            className="min-h-11 text-xs px-3 py-2 rounded"
            style={{
              backgroundColor:
                filterOutcome === o ? 'rgba(201,183,135,0.2)' : 'var(--color-a11oy-muted)',
              color: filterOutcome === o ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${filterOutcome === o ? 'rgba(201,183,135,0.4)' : 'var(--color-a11oy-border)'}`,
            }}
          >
            {o}
          </button>
        ))}
        <span className="text-xs ml-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Domain:
        </span>
        {['all', ...domains].map((d) => (
          <button
            type="button"
            key={d}
            onClick={() => setFilterDomain(d)}
            aria-pressed={filterDomain === d}
            className="min-h-11 text-xs px-3 py-2 rounded"
            style={{
              backgroundColor:
                filterDomain === d ? 'rgba(138,138,138,0.2)' : 'var(--color-a11oy-muted)',
              color: filterDomain === d ? '#a3a3a3' : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${filterDomain === d ? 'rgba(138,138,138,0.4)' : 'var(--color-a11oy-border)'}`,
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <SectionTitle>Replay Index ({filtered.length})</SectionTitle>
      <div className="flex flex-col gap-3">
        {filtered.map((r) => (
          <Link key={r.id} href={`${BASE}/replay/${r.id}`}>
            <Card className="cursor-pointer hover:opacity-80 transition-opacity">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-medium"
                      style={{ color: OUTCOME_COLORS[r.outcome] ?? '#5e5e5e' }}
                    >
                      {r.outcome === 'success' ? '✓' : r.outcome === 'blocked' ? '⊗' : '⚠'}{' '}
                      {r.outcome.toUpperCase()}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {r.domain} · {r.tenant}
                    </span>
                  </div>
                  <div
                    className="font-medium text-sm truncate mb-1"
                    style={{ color: 'var(--color-a11oy-text)' }}
                  >
                    {r.workcellName}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {new Date(r.completedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      ⏱ {fmt(r.durationMs)}
                    </span>
                    {r.approvalTier && (
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                        ⚖ {r.approvalTier}
                      </span>
                    )}
                    {r.proofRef && (
                      <span style={{ color: '#b08d52' }}>
                        ◇ {r.proofRef.split('-').slice(0, 2).join('-')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {r.evalDisposition && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{
                        color: DISP_COLORS[r.evalDisposition] ?? '#5e5e5e',
                        backgroundColor: `${DISP_COLORS[r.evalDisposition] ?? '#5e5e5e'}18`,
                      }}
                    >
                      {r.evalDisposition.replace(/_/g, ' ')}
                    </span>
                  )}
                  {r.evalComposite !== null && (
                    <span
                      className="text-xs font-mono"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      eval {Math.round(r.evalComposite * 100)}%
                    </span>
                  )}
                  {r.failureClass && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'rgba(245,245,245,0.08)', color: '#f5f5f5' }}
                    >
                      {r.failureClass.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: '#c9b787' }}>
                    View replay →
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          className="text-xs text-center py-8"
          style={{ color: 'var(--color-a11oy-text-ghost)' }}
        >
          No replays match the selected filters.
        </div>
      )}

      <div
        className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2"
        style={{
          backgroundColor: 'rgba(201,183,135,0.06)',
          border: '1px solid rgba(201,183,135,0.15)',
          color: 'var(--color-a11oy-text-ghost)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)]" /> Demo environment
        — replay rows are deterministic fixtures that illustrate an intended audit-trail model.
      </div>
    </Layout>
  );
}
