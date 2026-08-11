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

type WorkcellExecutionResult = {
  status?: string;
  durationMs?: number;
  outputSummary?: string;
  errorMessage?: string;
};

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
            className="text-xs"
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
  const execResult: WorkcellExecutionResult = wc.mockExecutionResult ?? {};
  const execStatus = execResult.status ?? 'unknown';
  const execDuration = execResult.durationMs;
  const execOutputSummary = execResult.outputSummary;

  return (
    <Layout>
      <div className="mb-4">
        <Link
          href={`${BASE}/workcells`}
          className="text-xs font-mono"
          style={{ color: 'var(--color-a11oy-blue)', textDecoration: 'none' }}
        >
          ← All Workcells
        </Link>
      </div>
      <PageHeader
        label="WORKCELL DETAIL"
        title={wc.name}
        subtitle={wc.objective}
        status={wc.evidenceState}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{ backgroundColor: `${statusColor}18`, color: statusColor }}
          >
            {wc.status}
          </span>
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {VERTICAL_LABELS[wc.vertical]}
          </span>
        </div>
      </PageHeader>

      <div
        className="mb-6 rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm leading-6"
        style={{ color: 'var(--color-a11oy-text-sub)' }}
        role="note"
      >
        <strong style={{ color: 'var(--color-a11oy-text)' }}>Demo record:</strong>{' '}
        {wc.evidenceReason} Decisions on this page update browser-local presentation state only.
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Execution Trace (built from agent sequence) */}
          <div>
            <SectionTitle>Execution Trace</SectionTitle>
            <Card>
              <div className="flex flex-col gap-1">
                {[
                  {
                    step: 'Signal Mesh: signal ingested and routed',
                    status: 'completed',
                    note: wc.signals.slice(0, 2).join(', '),
                  },
                  {
                    step: 'Causal Core: evidence graph assembled',
                    status: 'completed',
                    note: `${wc.signals.length} causal links traced`,
                  },
                  {
                    step: 'Context Engine: context pack built',
                    status: 'completed',
                    note: `${JSON.stringify(wc.contextPack).slice(0, 60)}…`,
                  },
                  ...wc.agentSequence.map((a) => ({
                    step: `${a.role}: ${a.action}`,
                    status:
                      wc.status === 'completed'
                        ? 'completed'
                        : wc.status === 'running'
                          ? 'running'
                          : 'pending',
                    note: `Agent: ${a.agentId}`,
                  })),
                  {
                    step: 'Covenant Layer: policy gate evaluated',
                    status: wc.requiresApproval ? 'running' : 'completed',
                    note: wc.requiresApproval
                      ? `Pending ${wc.actionBrief.approvalTier} approval`
                      : 'All policy clauses satisfied',
                  },
                  {
                    step: 'MirrorEval: recommendation scored',
                    status: 'completed',
                    note: `Verdict: ${wc.mirrorEvalResult.verdict} · Score: ${Math.round(wc.mirrorEvalResult.score * 100)}%`,
                  },
                  {
                    step: 'Demo Proof Ledger: seed PCE contract referenced',
                    status: wc.verificationResult.status === 'passed' ? 'completed' : 'failed',
                    note: `Contract: ${wc.pceContractId}`,
                  },
                ].map((s) => (
                  <TraceStep key={s.step} step={s.step} status={s.status} note={s.note} />
                ))}
              </div>
            </Card>
          </div>

          {/* Agent Sequence */}
          <div>
            <SectionTitle>Agent Sequence ({wc.agentSequence.length})</SectionTitle>
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
                        Action: {a.action}
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
            <SectionTitle>MirrorEval Result</SectionTitle>
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
                <SectionTitle>Delegation Chain</SectionTitle>
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
                        Fixture hops show scope narrowing · Privilege boundaries are modeled ·
                        Browser-local chain replay is available
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })()}

          {/* Signal Inputs */}
          <div>
            <SectionTitle>Signal Inputs ({signals.length})</SectionTitle>
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
            <SectionTitle>Action Brief</SectionTitle>
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
                    Priority
                  </div>
                  <div style={{ color: '#c9b787' }}>{wc.actionBrief.priority}</div>
                </div>
                <div>
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Approval tier
                  </div>
                  <div style={{ color: '#8a8a8a' }}>{wc.actionBrief.approvalTier}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Estimated impact
                  </div>
                  <div style={{ color: '#c9b787' }}>{wc.actionBrief.estimatedImpact}</div>
                </div>
              </div>
              {wc.requiresApproval && (
                <>
                  {decision ? (
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
                          ? '✓ Demo approval recorded — no external execution'
                          : decision === 'deferred'
                            ? '⏸ Deferred'
                            : '✕ Rejected'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDecision(null)}
                        className="min-h-11 px-3 text-xs ml-2"
                        style={{
                          color: 'var(--color-a11oy-text-ghost)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  ) : (
                    <>
                      <ApprovalGate label={`Simulated ${wc.actionBrief.approvalTier} approval`} />
                      <div className="flex gap-2 mt-2">
                        <ActionButton variant="primary" onClick={() => setDecision('approved')}>
                          Approve
                        </ActionButton>
                        <ActionButton variant="ghost" onClick={() => setDecision('deferred')}>
                          Defer
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => setDecision('rejected')}>
                          Reject
                        </ActionButton>
                      </div>
                    </>
                  )}
                </>
              )}
            </Card>
          </div>

          {/* Execution Result */}
          <div>
            <SectionTitle>Execution Result</SectionTitle>
            <Card className="text-xs">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="font-mono px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor:
                      execStatus === 'success'
                        ? 'rgba(201,183,135,0.12)'
                        : 'rgba(245,245,245,0.12)',
                    color: execStatus === 'success' ? '#c9b787' : '#f5f5f5',
                  }}
                >
                  {execStatus}
                </span>
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {execDuration != null ? `${execDuration}ms` : 'duration unavailable'}
                </span>
              </div>
              <div
                className="font-mono text-xs p-2 rounded mb-2"
                style={{
                  backgroundColor: 'var(--color-a11oy-deep)',
                  border: '1px solid var(--color-a11oy-border)',
                  color: 'var(--color-a11oy-text-ghost)',
                }}
              >
                {execOutputSummary ?? 'No execution output snapshot is available for this fixture.'}
              </div>
              {execResult.errorMessage && (
                <div
                  className="text-xs p-2 rounded"
                  style={{
                    backgroundColor: 'rgba(245,245,245,0.08)',
                    color: '#f5f5f5',
                    border: '1px solid rgba(245,245,245,0.2)',
                  }}
                >
                  Error: {execResult.errorMessage}
                </div>
              )}
            </Card>
          </div>

          {/* PCE Contract */}
          {pceContract && (
            <div>
              <SectionTitle>PCE Contract</SectionTitle>
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
                      Verified
                    </div>
                    <div style={{ color: pceContract.isVerified ? '#c9b787' : '#f5f5f5' }}>
                      {pceContract.isVerified ? '✓ YES' : '✗ NO'}
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
                    ? '✓ Contract verified'
                    : '✗ Verification failed'}
                </div>
              </Card>
            </div>
          )}

          {/* Proof Packet */}
          {proofPacket && (
            <div>
              <SectionTitle>Proof Packet</SectionTitle>
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
                      Witnesses
                    </div>
                    <div
                      style={{ color: proofPacket.witnessedBy.length > 0 ? '#c9b787' : '#f5f5f5' }}
                    >
                      {proofPacket.witnessedBy.length > 0
                        ? `${proofPacket.witnessedBy.length} recorded`
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
              className="w-full block text-center text-xs px-3 py-2 rounded border font-medium"
              style={{
                color: 'var(--color-a11oy-text-sub)',
                borderColor: 'var(--color-a11oy-border)',
                textDecoration: 'none',
              }}
            >
              ↩ Replay This Workcell
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
