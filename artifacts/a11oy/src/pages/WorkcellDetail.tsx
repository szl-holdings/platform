import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { Layout } from '../components/layout';
import {
  PageHeader,
  Card,
  SectionTitle,
  ApprovalGate,
  ActionButton,
  HashId,
  VerdictBadge,
  TraceStep,
} from '../components/ui';
import {
  SEED_WORKCELLS,
  SEED_SIGNALS,
  SEED_PCE_CONTRACTS,
  SEED_PROOF_PACKETS,
} from '@workspace/a11oy-fabric';
import { DELEGATION_CHAINS } from '../data/complianceFabric';

type ApprovalDecision = 'approved' | 'deferred' | 'rejected';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#c9b787',
  'vessels-maritime': '#8a8a8a',
  'terra-real-estate': '#c9b787',
  'aegis-defense': '#f5f5f5',
  'prism-counsel': '#8a8a8a',
  'carlota-jo': '#c9b787',
  'alloy-core': '#8a8a8a',
};
const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Lyte Revenue',
  'vessels-maritime': 'Vessels Maritime',
  'terra-real-estate': 'Terra Real Estate',
  'aegis-defense': 'Aegis Defense',
  'prism-counsel': 'Counsel',
  'carlota-jo': 'Carlota Jo',
  'alloy-core': 'Alloy Core',
};

function formatFixtureValue(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value) ?? String(value);
}

export function WorkcellDetail() {
  const params = useParams<{ id: string }>();
  const wc = SEED_WORKCELLS.find((w) => w.id === params.id);
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);

  if (!wc) {
    return (
      <Layout>
        <div className="text-center py-24">
          <div className="text-2xl mb-2" style={{ color: 'var(--color-a11oy-border)' }}>
            △
          </div>
          <div className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            Workcell not found: {params.id}
          </div>
          <Link
            href={`${BASE}/workcells`}
            className="inline-flex min-h-11 items-center text-xs"
            style={{ color: 'var(--color-a11oy-blue)' }}
          >
            ← Back to Workcells
          </Link>
        </div>
      </Layout>
    );
  }

  const signals = SEED_SIGNALS.filter((s) => wc.signals.includes(s.id));
  const pceContract = SEED_PCE_CONTRACTS.find((p) => p.id === wc.pceContractId);
  const proofPacket = SEED_PROOF_PACKETS.find((p) => p.id === wc.proofPacketId);
  const color = VERTICAL_COLORS[wc.vertical] ?? '#5e5e5e';
  const statusColor =
    {
      running: '#c9b787',
      completed: '#c9b787',
      error: '#f5f5f5',
      paused: '#5e5e5e',
      idle: '#5e5e5e',
    }[wc.status] ?? '#5e5e5e';
  const executionEntries = Object.entries(wc.mockExecutionResult).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return (
    <Layout>
      <div className="mb-4">
        <Link
          href={`${BASE}/workcells`}
          className="inline-flex min-h-11 items-center text-xs font-mono"
          style={{ color: 'var(--color-a11oy-blue)', textDecoration: 'none' }}
        >
          ← All Workcells
        </Link>
      </div>
      <PageHeader
        label="WORKCELL DETAIL"
        title={wc.name}
        subtitle={`Deterministic demo workcell: ${wc.objective}`}
        status="DEMO"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{ backgroundColor: `${statusColor}18`, color: statusColor }}
          >
            WORKFLOW {wc.status}
          </span>
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{ backgroundColor: 'rgba(229,210,158,0.12)', color: '#e5d29e' }}
          >
            OPERATIONAL {wc.operationalAvailability}
          </span>
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {VERTICAL_LABELS[wc.vertical]}
          </span>
        </div>
      </PageHeader>

      <Card className="mb-6 text-xs">
        <div className="font-mono mb-1" style={{ color: '#e5d29e' }}>
          DEMO EVIDENCE BOUNDARY
        </div>
        <p style={{ color: 'var(--color-a11oy-text-sub)' }}>{wc.operationalEvidence}</p>
        <p className="mt-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Workflow status: {wc.status}. Workflow progress is seed data and does not change the
          operational availability above.
        </p>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Execution Trace (built from agent sequence) */}
          <div>
            <SectionTitle>Demo Execution Trace</SectionTitle>
            <Card>
              <div className="flex flex-col gap-1">
                {[
                  {
                    step: 'Demo Signal Mesh: seed signal routed',
                    status: 'completed',
                    note: `Repository seed: ${wc.signals.slice(0, 2).join(', ')}`,
                  },
                  {
                    step: 'Demo Causal Core: seed evidence graph assembled',
                    status: 'completed',
                    note: `${wc.signals.length} fixture links represented`,
                  },
                  {
                    step: 'Demo Context Engine: seed context pack loaded',
                    status: 'completed',
                    note: `${JSON.stringify(wc.contextPack).slice(0, 60)}…`,
                  },
                  ...wc.agentSequence.map((a) => ({
                    step: `Demo ${a.role}: ${a.action}`,
                    status:
                      wc.status === 'completed'
                        ? 'completed'
                        : wc.status === 'running'
                          ? 'running'
                          : 'pending',
                    note: `Seed agent id: ${a.agentId}`,
                  })),
                  {
                    step: 'Demo Covenant Layer: policy fixture evaluated',
                    status: wc.requiresApproval ? 'running' : 'completed',
                    note: wc.requiresApproval
                      ? `Pending demo ${wc.actionBrief.approvalTier} decision`
                      : 'Seed policy fixture represents a satisfied gate',
                  },
                  {
                    step: 'Demo MirrorEval: seed recommendation scored',
                    status: 'completed',
                    note: `Seed verdict: ${wc.mirrorEvalResult.verdict} · Score: ${Math.round(wc.mirrorEvalResult.score * 100)}%`,
                  },
                  {
                    step: 'Demo Proof Ledger: PCE fixture inspected',
                    status: wc.verificationResult.status === 'passed' ? 'completed' : 'failed',
                    note: `Fixture contract: ${wc.pceContractId}`,
                  },
                ].map((s) => (
                  <TraceStep key={s.step} step={s.step} status={s.status} note={s.note} />
                ))}
              </div>
            </Card>
          </div>

          {/* Agent Sequence */}
          <div>
            <SectionTitle>Demo Agent Sequence ({wc.agentSequence.length})</SectionTitle>
            <div className="flex flex-col gap-2">
              {wc.agentSequence.map((a, i) => (
                <Card key={a.agentId} className="text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="font-mono"
                          style={{ color: 'var(--color-a11oy-text-ghost)' }}
                        >
                          #{i + 1}
                        </span>
                        <span className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>
                          {a.role}
                        </span>
                        <span
                          className="font-mono px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}
                        >
                          {a.agentId}
                        </span>
                      </div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                        Seed action: {a.action}
                      </div>
                    </div>
                    <span
                      className="font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          wc.status === 'completed'
                            ? 'rgba(201,183,135,0.12)'
                            : wc.status === 'running'
                              ? 'rgba(201,183,135,0.12)'
                              : 'rgba(155,172,196,0.1)',
                        color:
                          wc.status === 'completed'
                            ? '#c9b787'
                            : wc.status === 'running'
                              ? '#c9b787'
                              : '#5e5e5e',
                      }}
                    >
                      {wc.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* MirrorEval */}
          <div>
            <SectionTitle>Demo MirrorEval Result</SectionTitle>
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <VerdictBadge verdict={wc.mirrorEvalResult.verdict} />
                <span
                  className="text-xs font-mono"
                  style={{ color: 'var(--color-a11oy-text-ghost)' }}
                >
                  Score: {Math.round(wc.mirrorEvalResult.score * 100)}% · Evaluator:{' '}
                  {wc.mirrorEvalResult.evaluatorModel}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                {wc.mirrorEvalResult.dimensions.map((d) => (
                  <div
                    key={d.name}
                    className="p-2 rounded text-xs"
                    style={{
                      backgroundColor: 'var(--color-a11oy-deep)',
                      border: '1px solid var(--color-a11oy-border)',
                    }}
                  >
                    <div
                      className="font-mono mb-1"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      {d.name}
                    </div>
                    <div className="font-semibold" style={{ color: '#c9b787' }}>
                      {Math.round(d.score * 100)}%
                    </div>
                  </div>
                ))}
              </div>
              {wc.mirrorEvalResult.flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {wc.mirrorEvalResult.flags.map((f) => (
                    <span
                      key={f}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: 'rgba(201,183,135,0.1)',
                        color: '#c9b787',
                        border: '1px solid rgba(201,183,135,0.2)',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Delegation Chain */}
          {(() => {
            const vertParts = wc.vertical.toLowerCase().split('-');
            const chain = DELEGATION_CHAINS.find((c) => {
              if (c.rootAgentId === wc.agentSequence[0]?.agentId || c.workcellId === wc.id)
                return true;
              const cLower = `${c.workcellId} ${c.workcellName}`.toLowerCase();
              return vertParts.some((seg) => seg.length > 2 && cLower.includes(seg));
            });
            if (!chain || chain.hops.length === 0) return null;
            return (
              <div>
                <SectionTitle>Demo Delegation Chain</SectionTitle>
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="text-xs font-mono"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      {chain.id} — {chain.rootAgentName} — {chain.hops.length} hop
                      {chain.hops.length > 1 ? 's' : ''}
                    </div>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          chain.status === 'complete'
                            ? 'rgba(34,197,94,0.1)'
                            : 'rgba(201,183,135,0.1)',
                        color: chain.status === 'complete' ? '#22c55e' : '#c9b787',
                      }}
                    >
                      {chain.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {chain.hops.map((hop, i) => (
                      <div key={hop.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor:
                                hop.covenantDecision === 'approved'
                                  ? 'rgba(34,197,94,0.15)'
                                  : 'rgba(201,183,135,0.15)',
                              color: hop.covenantDecision === 'approved' ? '#22c55e' : '#c9b787',
                              border: `1px solid ${hop.covenantDecision === 'approved' ? 'rgba(34,197,94,0.3)' : 'rgba(201,183,135,0.3)'}`,
                            }}
                          >
                            {i + 1}
                          </div>
                          {i < chain.hops.length - 1 && (
                            <div
                              className="w-px h-4"
                              style={{ backgroundColor: 'var(--color-a11oy-border)' }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-xs mb-0.5">
                            <span
                              className="font-mono px-1 py-0.5 rounded"
                              style={{
                                backgroundColor:
                                  hop.covenantDecision === 'approved'
                                    ? 'rgba(34,197,94,0.1)'
                                    : 'rgba(201,183,135,0.1)',
                                color: hop.covenantDecision === 'approved' ? '#22c55e' : '#c9b787',
                                fontSize: 9,
                              }}
                            >
                              {hop.covenantDecision.toUpperCase()}
                            </span>
                            <span style={{ color: 'var(--color-a11oy-text)' }}>
                              {hop.parentAgentName}
                            </span>
                            <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>→</span>
                            <span style={{ color: 'var(--color-a11oy-text)' }}>
                              {hop.childAgentName}
                            </span>
                          </div>
                          <div
                            className="text-xs truncate"
                            style={{ color: 'var(--color-a11oy-text-ghost)' }}
                          >
                            ↓ {hop.scopeNarrowed} · {hop.permissionsGranted.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-3 p-2 rounded text-xs"
                    style={{
                      backgroundColor: 'var(--color-a11oy-deep)',
                      border: '1px solid var(--color-a11oy-border)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                        Seed hops illustrate scope narrowing; no external privilege or runtime state
                        is changed.
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })()}

          {/* Signal Inputs */}
          <div>
            <SectionTitle>Demo Signal Inputs ({signals.length})</SectionTitle>
            <div className="flex flex-col gap-2">
              {signals.map((sig) => (
                <Card key={sig.id} className="text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium mb-0.5 truncate"
                        style={{ color: 'var(--color-a11oy-text)' }}
                      >
                        {sig.title}
                      </div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                        {sig.description.slice(0, 100)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div
                        className="font-mono"
                        style={{
                          color:
                            sig.severity === 'critical'
                              ? '#f5f5f5'
                              : sig.severity === 'high'
                                ? '#c9b787'
                                : '#c9b787',
                        }}
                      >
                        {sig.severity}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-6">
          {/* Action Brief */}
          <div>
            <SectionTitle>Demo Action Brief</SectionTitle>
            <Card className="text-xs">
              <div className="font-semibold mb-1" style={{ color: 'var(--color-a11oy-text)' }}>
                {wc.actionBrief.title}
              </div>
              <p className="mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                {wc.actionBrief.description}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Seed priority
                  </div>
                  <div style={{ color: '#c9b787' }}>{wc.actionBrief.priority}</div>
                </div>
                <div>
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Demo approval tier
                  </div>
                  <div style={{ color: '#8a8a8a' }}>{wc.actionBrief.approvalTier}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Seed estimated impact
                  </div>
                  <div style={{ color: '#c9b787' }}>{wc.actionBrief.estimatedImpact}</div>
                </div>
              </div>
              {wc.requiresApproval &&
                (decision ? (
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-mono px-3 py-1.5 rounded"
                      style={{
                        backgroundColor:
                          decision === 'approved'
                            ? 'rgba(34,197,94,0.1)'
                            : decision === 'rejected'
                              ? 'rgba(239,68,68,0.1)'
                              : 'rgba(201,183,135,0.1)',
                        color:
                          decision === 'approved'
                            ? '#22c55e'
                            : decision === 'rejected'
                              ? '#ef4444'
                              : '#c9b787',
                        border: `1px solid ${decision === 'approved' ? 'rgba(34,197,94,0.25)' : decision === 'rejected' ? 'rgba(239,68,68,0.25)' : 'rgba(201,183,135,0.25)'}`,
                      }}
                    >
                      {decision === 'approved'
                        ? 'Demo decision: approved locally — no execution authorized'
                        : decision === 'deferred'
                          ? 'Demo decision: deferred locally'
                          : 'Demo decision: rejected locally'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDecision(null)}
                      className="min-h-11 px-2 text-xs ml-2"
                      style={{
                        color: 'var(--color-a11oy-text-ghost)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Undo demo decision
                    </button>
                  </div>
                ) : (
                  <>
                    <ApprovalGate
                      label={`Demo workflow: ${wc.actionBrief.approvalTier} decision required`}
                    />
                    <div className="flex gap-2 mt-2 [&>button]:min-h-11">
                      <ActionButton variant="primary" onClick={() => setDecision('approved')}>
                        Approve demo
                      </ActionButton>
                      <ActionButton variant="ghost" onClick={() => setDecision('deferred')}>
                        Defer demo
                      </ActionButton>
                      <ActionButton variant="danger" onClick={() => setDecision('rejected')}>
                        Reject demo
                      </ActionButton>
                    </div>
                  </>
                ))}
            </Card>
          </div>

          {/* Execution Result */}
          <div>
            <SectionTitle>Demo Execution Result</SectionTitle>
            <Card className="text-xs">
              <p className="mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Fixture result from mockExecutionResult; no connector or external operation ran.
              </p>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="font-mono px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'rgba(201,183,135,0.12)',
                    color: '#c9b787',
                  }}
                >
                  DEMO FIXTURE
                </span>
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {executionEntries.length} recorded field{executionEntries.length === 1 ? '' : 's'}
                </span>
              </div>
              <dl
                className="font-mono text-xs rounded overflow-hidden"
                style={{ border: '1px solid var(--color-a11oy-border)' }}
              >
                {executionEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-3 p-3"
                    style={{
                      backgroundColor: 'var(--color-a11oy-deep)',
                      borderBottom: '1px solid var(--color-a11oy-border)',
                    }}
                  >
                    <dt
                      style={{ color: 'var(--color-a11oy-text-ghost)', overflowWrap: 'anywhere' }}
                    >
                      {key}
                    </dt>
                    <dd
                      className="text-right"
                      style={{ color: 'var(--color-a11oy-text-sub)', overflowWrap: 'anywhere' }}
                    >
                      {formatFixtureValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
              {executionEntries.length === 0 && (
                <div
                  className="text-xs p-3 rounded"
                  style={{ color: 'var(--color-a11oy-text-ghost)' }}
                >
                  No fixture result fields are recorded.
                </div>
              )}
            </Card>
          </div>

          {/* PCE Contract */}
          {pceContract && (
            <div>
              <SectionTitle>Demo PCE Contract Fixture</SectionTitle>
              <Card className="text-xs">
                <HashId id={pceContract.id} />
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Mode
                    </div>
                    <div style={{ color: pceContract.mode === 'governed' ? '#c9b787' : '#c9b787' }}>
                      {pceContract.mode}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Fixture check
                    </div>
                    <div style={{ color: pceContract.isVerified ? '#c9b787' : '#f5f5f5' }}>
                      {pceContract.isVerified ? 'PASSED IN SEED' : 'FAILED IN SEED'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Origin signal
                    </div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>
                      {pceContract.originSignalId}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div
                      className="font-mono mb-1"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      CAUSAL CHAIN
                    </div>
                    {pceContract.causalChainIds.map((id) => (
                      <div
                        key={id}
                        className="font-mono"
                        style={{ color: 'var(--color-a11oy-text-ghost)' }}
                      >
                        → {id}
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="mt-2 font-mono p-2 rounded"
                  style={{
                    backgroundColor:
                      wc.verificationResult.status === 'passed'
                        ? 'rgba(201,183,135,0.08)'
                        : 'rgba(245,245,245,0.08)',
                    color: wc.verificationResult.status === 'passed' ? '#c9b787' : '#f5f5f5',
                    border: `1px solid ${wc.verificationResult.status === 'passed' ? 'rgba(201,183,135,0.2)' : 'rgba(245,245,245,0.2)'}`,
                  }}
                >
                  {wc.verificationResult.status === 'passed'
                    ? 'Demo contract fixture check passed'
                    : 'Demo contract fixture check failed'}
                </div>
              </Card>
            </div>
          )}

          {/* Proof Packet */}
          {proofPacket && (
            <div>
              <SectionTitle>Demo Proof Packet Fixture</SectionTitle>
              <Card className="text-xs">
                <HashId id={proofPacket.id} />
                <div
                  className="mt-2 font-mono p-2 rounded break-all"
                  style={{
                    backgroundColor: 'var(--color-a11oy-deep)',
                    color: '#b08d52',
                    border: '1px solid var(--color-a11oy-border)',
                  }}
                >
                  {proofPacket.hash}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Kind
                    </div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{proofPacket.kind}</div>
                  </div>
                  <div>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Fixture references
                    </div>
                    <div
                      style={{ color: proofPacket.witnessedBy.length > 0 ? '#c9b787' : '#f5f5f5' }}
                    >
                      {proofPacket.witnessedBy.length > 0
                        ? `${proofPacket.witnessedBy.length} seed references`
                        : 'NONE'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Replay link */}
          <div>
            <Link
              href={`${BASE}/workcells/${wc.id}/replay`}
              className="w-full min-h-11 flex items-center justify-center text-center text-xs px-3 py-2 rounded border font-medium"
              style={{
                color: 'var(--color-a11oy-text-sub)',
                borderColor: 'var(--color-a11oy-border)',
                textDecoration: 'none',
              }}
            >
              ↩ Replay Demo Workcell
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
