import { SEED_WORKCELLS } from '@workspace/a11oy-fabric';
import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { Card, KpiCard, PageHeader, SectionTitle } from '../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

interface ReplaySummary {
  id: string;
  workcellId: string;
  workcellName: string;
  tenant: string;
  domain: string;
  workflowOutcome: string;
  operationalAvailability: string;
  operationalEvidence: string;
  completedAt: string;
  durationMs: number;
  evalDisposition: string | null;
  evalComposite: number | null;
  proofRef: string | null;
  failureClass: string | null;
  approvalTier: string;
}

const WORKFLOW_OUTCOME_COLORS: Record<string, string> = {
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

const REPLAYS: ReplaySummary[] = SEED_WORKCELLS.map((wc, i) => {
  const meta = VERTICAL_TENANT_MAP[wc.vertical as string] ?? {
    tenant: 'Enterprise',
    domain: 'Operations',
  };
  const workflowOutcome = wc.status === 'error' ? 'failed' : 'success';
  const failureClass =
    workflowOutcome === 'failed' ? FAILURE_CLASSES[i % FAILURE_CLASSES.length] : null;
  return {
    id: `replay-${wc.id}`,
    workcellId: wc.id,
    workcellName: wc.name,
    tenant: meta.tenant,
    domain: meta.domain,
    workflowOutcome,
    operationalAvailability: wc.operationalAvailability,
    operationalEvidence: wc.operationalEvidence,
    completedAt: wc.updatedAt,
    durationMs: 8000 + ((i * 4093) % 90000),
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
  workflowSuccessful: REPLAYS.filter((replay) => replay.workflowOutcome === 'success').length,
  workflowFailed: REPLAYS.filter((replay) => replay.workflowOutcome !== 'success').length,
};

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return s > 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

export function WorkcellReplay() {
  const data = REPLAYS_DATA;
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterDomain, setFilterDomain] = useState('all');

  const domains = [...new Set(data.replays.map((replay) => replay.domain))];
  const filtered = data.replays.filter(
    (replay) =>
      (filterOutcome === 'all' || replay.workflowOutcome === filterOutcome) &&
      (filterDomain === 'all' || replay.domain === filterDomain),
  );

  return (
    <Layout>
      <PageHeader
        label="WORKCELL REPLAY"
        title="Demo Flight Recorder & Execution Audit"
        subtitle="Deterministic replay fixtures illustrate workflow steps, evaluation scores, approval records, tool-call shapes, and proof references without claiming production execution."
        status="DEMO"
      />

      <Card className="mb-6 text-xs">
        <div className="font-mono mb-1" style={{ color: '#e5d29e' }}>
          DEMO EVIDENCE BOUNDARY
        </div>
        <p style={{ color: 'var(--color-a11oy-text-sub)' }}>
          Every row comes from SEED_WORKCELLS. Workflow outcomes are fixture state; operational
          availability and evidence remain separate and do not represent authenticated production
          operations.
        </p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="DEMO REPLAYS"
          value={String(data.total)}
          sub="Seed workcells"
          accent="#c9b787"
        />
        <KpiCard
          label="WORKFLOW SUCCESS"
          value={String(data.workflowSuccessful)}
          sub="Demo outcomes"
          accent="#c9b787"
        />
        <KpiCard
          label="WORKFLOW FAILED"
          value={String(data.workflowFailed)}
          sub="Demo outcomes"
          accent="#f5f5f5"
        />
        <KpiCard
          label="SEED FAILURE CLASSES"
          value={String(FAILURE_CLASSES.filter((value) => value !== null).length)}
          sub="Fixture taxonomy"
          accent="#c9b787"
        />
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Workflow outcome:
        </span>
        {['all', 'success', 'failed', 'blocked'].map((outcome) => (
          <button
            type="button"
            key={outcome}
            aria-pressed={filterOutcome === outcome}
            onClick={() => setFilterOutcome(outcome)}
            className="min-h-11 min-w-11 px-3 rounded text-xs"
            style={{
              backgroundColor:
                filterOutcome === outcome ? 'rgba(201,183,135,0.2)' : 'var(--color-a11oy-muted)',
              color: filterOutcome === outcome ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${filterOutcome === outcome ? 'rgba(201,183,135,0.4)' : 'var(--color-a11oy-border)'}`,
            }}
          >
            {outcome}
          </button>
        ))}
        <span className="text-xs ml-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Domain:
        </span>
        {['all', ...domains].map((domain) => (
          <button
            type="button"
            key={domain}
            aria-pressed={filterDomain === domain}
            onClick={() => setFilterDomain(domain)}
            className="min-h-11 min-w-11 px-3 rounded text-xs"
            style={{
              backgroundColor:
                filterDomain === domain ? 'rgba(138,138,138,0.2)' : 'var(--color-a11oy-muted)',
              color: filterDomain === domain ? '#8a8a8a' : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${filterDomain === domain ? 'rgba(138,138,138,0.4)' : 'var(--color-a11oy-border)'}`,
            }}
          >
            {domain}
          </button>
        ))}
      </div>

      <SectionTitle>Replay Index ({filtered.length})</SectionTitle>
      <div className="flex flex-col gap-3">
        {filtered.map((replay) => (
          <Link
            key={replay.id}
            href={`${BASE}/workcells/${replay.workcellId}/replay`}
            className="block min-h-11"
          >
            <Card className="min-w-0 cursor-pointer hover:opacity-80 transition-opacity [overflow-wrap:anywhere]">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="w-full flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: WORKFLOW_OUTCOME_COLORS[replay.workflowOutcome] ?? '#5e5e5e',
                      }}
                    >
                      WORKFLOW{' '}
                      {replay.workflowOutcome === 'success'
                        ? '✓'
                        : replay.workflowOutcome === 'blocked'
                          ? '⊗'
                          : '⚠'}{' '}
                      {replay.workflowOutcome.toUpperCase()}
                    </span>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{
                        color: '#e5d29e',
                        backgroundColor: 'rgba(229,210,158,0.1)',
                      }}
                    >
                      OPERATIONAL {replay.operationalAvailability}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {replay.domain} · {replay.tenant}
                    </span>
                  </div>
                  <div
                    className="font-medium text-sm mb-1"
                    style={{ color: 'var(--color-a11oy-text)' }}
                  >
                    {replay.workcellName}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {new Date(replay.completedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'UTC',
                        timeZoneName: 'short',
                      })}
                    </span>
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      ⏱ {fmt(replay.durationMs)}
                    </span>
                    {replay.approvalTier && (
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                        ⚖ {replay.approvalTier}
                      </span>
                    )}
                    {replay.proofRef && (
                      <span style={{ color: '#b08d52' }}>
                        ◇ {replay.proofRef.split('-').slice(0, 2).join('-')}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Evidence: {replay.operationalEvidence}
                  </div>
                </div>
                <div className="flex max-w-full flex-col items-start sm:items-end gap-1.5 flex-shrink-0">
                  {replay.evalDisposition && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{
                        color: DISP_COLORS[replay.evalDisposition] ?? '#5e5e5e',
                        backgroundColor: `${DISP_COLORS[replay.evalDisposition] ?? '#5e5e5e'}18`,
                      }}
                    >
                      demo {replay.evalDisposition.replace(/_/g, ' ')}
                    </span>
                  )}
                  {replay.evalComposite !== null && (
                    <span
                      className="text-xs font-mono"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      seed eval {Math.round(replay.evalComposite * 100)}%
                    </span>
                  )}
                  {replay.failureClass && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'rgba(245,245,245,0.08)', color: '#f5f5f5' }}
                    >
                      {replay.failureClass.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: '#c9b787' }}>
                    View demo replay →
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
        — replay rows are reconstructed from deterministic repository seeds and proof references,
        not an authenticated production ledger or external audit trail.
      </div>
    </Layout>
  );
}
