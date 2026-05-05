import { useState, useRef, useEffect } from 'react';
import { useParams } from 'wouter';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, ApprovalGate, ActionButton, HashId, VerdictBadge, TraceStep } from '../components/ui';
import { SEED_WORKCELLS, SEED_SIGNALS, SEED_PCE_CONTRACTS, SEED_PROOF_PACKETS } from '@workspace/a11oy-fabric';
import { DELEGATION_CHAINS } from '../data/complianceFabric';

type ApprovalDecision = 'approved' | 'deferred' | 'rejected';

const MOCK_THINKING_STEPS = [
  { phase: 'perceive', label: 'Perceive', content: 'Signal ingested from Signal Mesh. Parsing evidence pack and context. Checking prior decisions for this entity type...', tokens: 680, ms: 420 },
  { phase: 'orient', label: 'Orient', content: 'Historical pattern retrieval complete. Cross-domain lesson applied: dual-signal requirement verified. Confidence preliminary: 0.88. Adjusting for evidence corroboration...', tokens: 920, ms: 590 },
  { phase: 'plan', label: 'Plan', content: 'Primary recommendation pathway selected. Approval tier identified per covenant policy. Evidence pack assembled. Counterfactual branches evaluated...', tokens: 1140, ms: 720 },
  { phase: 'execute', label: 'Execute', content: 'Action brief generated. MirrorEval pre-check running. Policy compliance verified against 3 covenant clauses. All evidence citations traceable...', tokens: 1080, ms: 660 },
  { phase: 'verify', label: 'Verify', content: 'Verifier: all premises grounded. Inference chain valid. Conclusion certified. Covenant compliance: PASS. Proof packet sealed...', tokens: 720, ms: 450 },
];

const PHASE_COLORS: Record<string, string> = {
  perceive: '#8a8a8a', orient: '#c9b787', plan: '#a78bfa', execute: '#38bdf8', verify: '#22c55e',
};

function ReasoningTracePanel() {
  const [streaming, setStreaming] = useState(false);
  const [revealedSteps, setRevealedSteps] = useState<number>(0);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const startStream = () => {
    setStreaming(true);
    setRevealedSteps(0);
    let step = 0;
    const reveal = () => {
      step++;
      setRevealedSteps(step);
      if (step < MOCK_THINKING_STEPS.length) {
        timerRef.current = setTimeout(reveal, 600);
      } else {
        setStreaming(false);
      }
    };
    timerRef.current = setTimeout(reveal, 300);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.12)', color: '#c9b787' }}>A11OY.1</span>
          <span className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>Extended Thinking Surface</span>
        </div>
        {!streaming && revealedSteps === 0 && (
          <button
            onClick={startStream}
            className="text-[10px] font-mono px-2 py-1 rounded"
            style={{ background: 'rgba(201,183,135,0.12)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.25)' }}
          >
            REPLAY TRACE
          </button>
        )}
        {streaming && (
          <span className="text-[10px] font-mono animate-pulse" style={{ color: '#c9b787' }}>● STREAMING</span>
        )}
        {!streaming && revealedSteps > 0 && (
          <button
            onClick={() => { setRevealedSteps(0); setExpandedPhase(null); }}
            className="text-[10px] font-mono"
            style={{ color: 'var(--color-a11oy-text-ghost)' }}
          >
            RESET
          </button>
        )}
      </div>

      {revealedSteps === 0 && !streaming && (
        <div className="text-center py-6">
          <div className="text-xl mb-2" style={{ color: 'var(--color-a11oy-border)' }}>◎</div>
          <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.6 }}>
            Chain-of-thought reasoning captured at every phase of the cognitive loop. Stored alongside the proof packet.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {MOCK_THINKING_STEPS.slice(0, revealedSteps).map((step, i) => {
          const phaseColor = PHASE_COLORS[step.phase] ?? '#8a8a8a';
          const isExpanded = expandedPhase === step.phase;
          const isStreaming = streaming && i === revealedSteps - 1;
          return (
            <button
              key={step.phase}
              onClick={() => setExpandedPhase(isExpanded ? null : step.phase)}
              className="w-full text-left rounded p-2 transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${isExpanded ? phaseColor + '44' : 'rgba(255,255,255,0.06)'}` }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: phaseColor }} />
                  <span className="text-[11px] font-mono uppercase" style={{ color: phaseColor }}>{step.label}</span>
                  {isStreaming && <span className="text-[9px] font-mono animate-pulse" style={{ color: phaseColor }}>●</span>}
                </div>
                <span className="text-[9px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{step.tokens} tok · {step.ms}ms</span>
              </div>
              {isExpanded && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7, fontFamily: "ui-monospace, 'SF Mono', monospace" }}>
                  {step.content}
                </p>
              )}
              {!isExpanded && (
                <p className="text-[11px] truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{step.content.slice(0, 80)}…</p>
              )}
            </button>
          );
        })}
      </div>

      {revealedSteps > 0 && (
        <div className="mt-3 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[9px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            {MOCK_THINKING_STEPS.slice(0, revealedSteps).reduce((a, s) => a + s.tokens, 0).toLocaleString()} total tokens
          </span>
          <Link href={`${BASE}/reasoning`} className="text-[9px] font-mono" style={{ color: '#c9b787', textDecoration: 'none' }}>
            View Full Trace Library →
          </Link>
        </div>
      )}
    </Card>
  );
}

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#c9b787', 'vessels-maritime': '#8a8a8a', 'terra-real-estate': '#c9b787',
  'aegis-defense': '#f5f5f5', 'prism-counsel': '#8a8a8a', 'carlota-jo': '#c9b787', 'alloy-core': '#8a8a8a',
};
const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'KORA Revenue', 'vessels-maritime': 'SEXTANT Maritime', 'terra-real-estate': 'DOMAINE Real Estate',
  'aegis-defense': 'PARAGON Defense', 'prism-counsel': 'Counsel', 'carlota-jo': 'Carlota Jo', 'alloy-core': 'Alloy Core',
};

type WorkcellExecutionResult = {
  status?: string;
  durationMs?: number;
  outputSummary?: string;
  errorMessage?: string;
};

export function WorkcellDetail() {
  const params = useParams<{ id: string }>();
  const wc = SEED_WORKCELLS.find(w => w.id === params.id);
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);

  if (!wc) {
    return (
      <Layout>
        <div className="text-center py-24">
          <div className="text-2xl mb-2" style={{ color: 'var(--color-a11oy-border)' }}>△</div>
          <div className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Workcell not found: {params.id}</div>
          <Link href={`${BASE}/workcells`} className="text-xs" style={{ color: 'var(--color-a11oy-blue)' }}>← Back to Workcells</Link>
        </div>
      </Layout>
    );
  }

  const signals = SEED_SIGNALS.filter(s => wc.signals.includes(s.id));
  const pceContract = SEED_PCE_CONTRACTS.find(p => p.id === wc.pceContractId);
  const proofPacket = SEED_PROOF_PACKETS.find(p => p.id === wc.proofPacketId);
  const color = VERTICAL_COLORS[wc.vertical] ?? '#5e5e5e';
  const statusColor = { running: '#c9b787', completed: '#c9b787', error: '#f5f5f5', paused: '#5e5e5e', idle: '#5e5e5e' }[wc.status] ?? '#5e5e5e';
  const execResult = wc.mockExecutionResult as WorkcellExecutionResult;

  return (
    <Layout>
      <div className="mb-4">
        <Link href={`${BASE}/workcells`} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-blue)', textDecoration: 'none' }}>
          ← All Workcells
        </Link>
      </div>
      <PageHeader
        label="WORKCELL DETAIL"
        title={wc.name}
        subtitle={wc.objective}
        status="LIVE"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: `${statusColor}18`, color: statusColor }}>{wc.status}</span>
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: `${color}18`, color }}>{VERTICAL_LABELS[wc.vertical]}</span>
        </div>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Execution Trace (built from agent sequence) */}
          <div>
            <SectionTitle>Execution Trace</SectionTitle>
            <Card>
              <div className="flex flex-col gap-1">
                {[
                  { step: 'Signal Mesh: signal ingested and routed', status: 'completed', note: wc.signals.slice(0, 2).join(', ') },
                  { step: 'Causal Core: evidence graph assembled', status: 'completed', note: `${wc.signals.length} causal links traced` },
                  { step: 'Context Engine: context pack built', status: 'completed', note: JSON.stringify(wc.contextPack).slice(0, 60) + '…' },
                  ...wc.agentSequence.map(a => ({
                    step: `${a.role}: ${a.action}`,
                    status: wc.status === 'completed' ? 'completed' : wc.status === 'running' ? 'running' : 'pending',
                    note: `Agent: ${a.agentId}`,
                  })),
                  { step: 'Covenant Layer: policy gate evaluated', status: wc.requiresApproval ? 'running' : 'completed', note: wc.requiresApproval ? `Pending ${wc.actionBrief.approvalTier} approval` : 'All policy clauses satisfied' },
                  { step: 'MirrorEval: recommendation scored', status: 'completed', note: `Verdict: ${wc.mirrorEvalResult.verdict} · Score: ${Math.round(wc.mirrorEvalResult.score * 100)}%` },
                  { step: 'Proof Ledger: PCE contract recorded', status: wc.verificationResult.status === 'passed' ? 'completed' : 'failed', note: `Contract: ${wc.pceContractId}` },
                ].map((s, i) => (
                  <TraceStep key={i} step={s.step} status={s.status} note={s.note} />
                ))}
              </div>
            </Card>
          </div>

          {/* Agent Sequence */}
          <div>
            <SectionTitle>Agent Sequence ({wc.agentSequence.length})</SectionTitle>
            <div className="flex flex-col gap-2">
              {wc.agentSequence.map((a, i) => {
                const tierMap: Record<string, { tier: number; mode: string }> = {
                  'Cascade Navigator': { tier: 3, mode: 'hitl-required' },
                  'Counsel Sentinel': { tier: 3, mode: 'hitl-required' },
                  'Guardian': { tier: 3, mode: 'hitl-required' },
                  'Pipeline Oracle': { tier: 2, mode: 'auto-low-risk' },
                  'DOMAINE Analyst': { tier: 2, mode: 'auto-low-risk' },
                };
                const trust = tierMap[a.role] ?? { tier: 0, mode: 'read-only' };
                const tierColor = trust.tier === 3 ? '#f5f5f5' : trust.tier === 2 ? '#c9b787' : '#5e5e5e';
                return (
                  <Card key={i} className="text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>#{i + 1}</span>
                          <span className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{a.role}</span>
                          <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}>
                            {a.agentId}
                          </span>
                          <span className="font-mono px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: tierColor }} title={`Trust tier ${trust.tier}: ${trust.mode}`}>T{trust.tier}</span>
                        </div>
                        <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Action: {a.action}</div>
                        <div className="mt-1 text-[10px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                          mode: <span style={{ color: tierColor }}>{trust.mode}</span>
                          {' · '}hooks: PreSubagentSpawn · PostSubagentReturn
                        </div>
                      </div>
                      <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: wc.status === 'completed' ? 'rgba(201,183,135,0.12)' : wc.status === 'running' ? 'rgba(201,183,135,0.12)' : 'rgba(155,172,196,0.1)', color: wc.status === 'completed' ? '#c9b787' : wc.status === 'running' ? '#c9b787' : '#5e5e5e' }}>
                        {wc.status}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Subagent Spawn Contract */}
          <div>
            <SectionTitle>Subagent Spawn Contract</SectionTitle>
            <Card className="text-xs">
              <div className="flex flex-col gap-1.5 font-mono">
                {[
                  { k: 'subagent_id', v: `${wc.id.slice(0, 12)}-sub-0` },
                  { k: 'model', v: 'claude-sonnet-4-6' },
                  { k: 'permission_mode', v: wc.requiresApproval ? 'hitl-required' : 'auto-approve-low-risk' },
                  { k: 'trust_tier', v: wc.requiresApproval ? '3' : '2' },
                  { k: 'allowed_tools', v: wc.agentSequence.map(a => a.role.toLowerCase().replace(/\s+/g, '_') + '.*').join(', ') },
                  { k: 'blocked_tools', v: 'charter_sign, filing_submit, settlement_execute' },
                  { k: 'parent_proof_id', v: `proof-${wc.pceContractId.slice(0, 12)}` },
                  { k: 'session_id', v: `sess-${wc.id.slice(4, 12)}` },
                ].map(row => (
                  <div key={row.k} className="flex items-start gap-2">
                    <span className="flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)', minWidth: 140 }}>{row.k}</span>
                    <span style={{ color: '#c9b787', wordBreak: 'break-all' }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* MirrorEval */}
          <div>
            <SectionTitle>MirrorEval Result</SectionTitle>
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <VerdictBadge verdict={wc.mirrorEvalResult.verdict} />
                <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  Score: {Math.round(wc.mirrorEvalResult.score * 100)}% · Evaluator: {wc.mirrorEvalResult.evaluatorModel}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                {wc.mirrorEvalResult.dimensions.map(d => (
                  <div key={d.name} className="p-2 rounded text-xs" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
                    <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{d.name}</div>
                    <div className="font-semibold" style={{ color: '#c9b787' }}>{Math.round(d.score * 100)}%</div>
                  </div>
                ))}
              </div>
              {wc.mirrorEvalResult.flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {wc.mirrorEvalResult.flags.map(f => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.2)' }}>{f}</span>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Delegation Chain */}
          {(() => {
            const vertParts = wc.vertical.toLowerCase().split('-');
            const chain = DELEGATION_CHAINS.find(c => {
              if (c.rootAgentId === wc.agentSequence[0]?.agentId || c.workcellId === wc.id) return true;
              const cLower = (c.workcellId + ' ' + c.workcellName).toLowerCase();
              return vertParts.some(seg => seg.length > 2 && cLower.includes(seg));
            });
            if (!chain || chain.hops.length === 0) return null;
            return (
              <div>
                <SectionTitle>Delegation Chain</SectionTitle>
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {chain.id} — {chain.rootAgentName} — {chain.hops.length} hop{chain.hops.length > 1 ? 's' : ''}
                    </div>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: chain.status === 'complete' ? 'rgba(34,197,94,0.1)' : 'rgba(201,183,135,0.1)', color: chain.status === 'complete' ? '#22c55e' : '#c9b787' }}>
                      {chain.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {chain.hops.map((hop, i) => (
                      <div key={hop.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: hop.covenantDecision === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(201,183,135,0.15)', color: hop.covenantDecision === 'approved' ? '#22c55e' : '#c9b787', border: `1px solid ${hop.covenantDecision === 'approved' ? 'rgba(34,197,94,0.3)' : 'rgba(201,183,135,0.3)'}` }}>
                            {i + 1}
                          </div>
                          {i < chain.hops.length - 1 && <div className="w-px h-4" style={{ backgroundColor: 'var(--color-a11oy-border)' }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-xs mb-0.5">
                            <span className="font-mono px-1 py-0.5 rounded" style={{ backgroundColor: hop.covenantDecision === 'approved' ? 'rgba(34,197,94,0.1)' : 'rgba(201,183,135,0.1)', color: hop.covenantDecision === 'approved' ? '#22c55e' : '#c9b787', fontSize: 9 }}>
                              {hop.covenantDecision.toUpperCase()}
                            </span>
                            <span style={{ color: 'var(--color-a11oy-text)' }}>{hop.parentAgentName}</span>
                            <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>→</span>
                            <span style={{ color: 'var(--color-a11oy-text)' }}>{hop.childAgentName}</span>
                          </div>
                          <div className="text-xs truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                            ↓ {hop.scopeNarrowed} · {hop.permissionsGranted.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>All hops scope-narrowed · Privilege boundaries enforced · Chain replay available</span>
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
              {signals.map(sig => (
                <Card key={sig.id} className="text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium mb-0.5 truncate" style={{ color: 'var(--color-a11oy-text)' }}>{sig.title}</div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sig.description.slice(0, 100)}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono" style={{ color: sig.severity === 'critical' ? '#f5f5f5' : sig.severity === 'high' ? '#c9b787' : '#c9b787' }}>{sig.severity}</div>
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
              <div className="font-semibold mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{wc.actionBrief.title}</div>
              <p className="mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{wc.actionBrief.description}</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Priority</div>
                  <div style={{ color: '#c9b787' }}>{wc.actionBrief.priority}</div>
                </div>
                <div>
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Approval tier</div>
                  <div style={{ color: '#8a8a8a' }}>{wc.actionBrief.approvalTier}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Estimated impact</div>
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
                          backgroundColor: decision === 'approved' ? 'rgba(34,197,94,0.1)' : decision === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(201,183,135,0.1)',
                          color: decision === 'approved' ? '#22c55e' : decision === 'rejected' ? '#ef4444' : '#c9b787',
                          border: `1px solid ${decision === 'approved' ? 'rgba(34,197,94,0.25)' : decision === 'rejected' ? 'rgba(239,68,68,0.25)' : 'rgba(201,183,135,0.25)'}`,
                        }}
                      >
                        {decision === 'approved' ? '✓ Approved — execution authorized' : decision === 'deferred' ? '⏸ Deferred' : '✕ Rejected'}
                      </span>
                      <button onClick={() => setDecision(null)} className="text-xs ml-2" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>Undo</button>
                    </div>
                  ) : (
                    <>
                      <ApprovalGate label={`Requires ${wc.actionBrief.approvalTier} approval`} />
                      <div className="flex gap-2 mt-2">
                        <ActionButton variant="primary" onClick={() => setDecision('approved')}>Approve</ActionButton>
                        <ActionButton variant="ghost" onClick={() => setDecision('deferred')}>Defer</ActionButton>
                        <ActionButton variant="danger" onClick={() => setDecision('rejected')}>Reject</ActionButton>
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
                <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: execResult.status === 'success' ? 'rgba(201,183,135,0.12)' : 'rgba(245,245,245,0.12)', color: execResult.status === 'success' ? '#c9b787' : '#f5f5f5' }}>
                  {execResult.status ?? 'unknown'}
                </span>
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {execResult.durationMs}ms
                </span>
              </div>
              <div className="font-mono text-xs p-2 rounded mb-2" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>
                {execResult.outputSummary}
              </div>
              {execResult.errorMessage && (
                <div className="text-xs p-2 rounded" style={{ backgroundColor: 'rgba(245,245,245,0.08)', color: '#f5f5f5', border: '1px solid rgba(245,245,245,0.2)' }}>
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
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Mode</div>
                    <div style={{ color: pceContract.mode === 'governed' ? '#c9b787' : '#c9b787' }}>{pceContract.mode}</div>
                  </div>
                  <div>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Verified</div>
                    <div style={{ color: pceContract.isVerified ? '#c9b787' : '#f5f5f5' }}>{pceContract.isVerified ? '✓ YES' : '✗ NO'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Origin signal</div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{pceContract.originSignalId}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CAUSAL CHAIN</div>
                    {pceContract.causalChainIds.map((id, i) => (
                      <div key={i} className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>→ {id}</div>
                    ))}
                  </div>
                </div>
                <div className="mt-2 font-mono p-2 rounded" style={{ backgroundColor: wc.verificationResult.status === 'passed' ? 'rgba(201,183,135,0.08)' : 'rgba(245,245,245,0.08)', color: wc.verificationResult.status === 'passed' ? '#c9b787' : '#f5f5f5', border: `1px solid ${wc.verificationResult.status === 'passed' ? 'rgba(201,183,135,0.2)' : 'rgba(245,245,245,0.2)'}` }}>
                  {wc.verificationResult.status === 'passed' ? '✓ Contract verified' : '✗ Verification failed'}
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
                <div className="mt-2 font-mono p-2 rounded break-all" style={{ backgroundColor: 'var(--color-a11oy-deep)', color: '#b08d52', border: '1px solid var(--color-a11oy-border)' }}>
                  {proofPacket.hash}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Kind</div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{proofPacket.kind}</div>
                  </div>
                  <div>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Witnesses</div>
                    <div style={{ color: proofPacket.witnessedBy.length > 0 ? '#c9b787' : '#f5f5f5' }}>{proofPacket.witnessedBy.length > 0 ? `${proofPacket.witnessedBy.length} recorded` : 'NONE'}</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Reasoning Trace — A11oy.1 Extended Thinking Surface */}
          <div>
            <SectionTitle>Reasoning Trace</SectionTitle>
            <ReasoningTracePanel />
          </div>

          {/* Replay link */}
          <div>
            <Link
              href={`${BASE}/workcells/${wc.id}/replay`}
              className="w-full block text-center text-xs px-3 py-2 rounded border font-medium"
              style={{ color: 'var(--color-a11oy-text-sub)', borderColor: 'var(--color-a11oy-border)', textDecoration: 'none' }}
            >
              ↩ Replay This Workcell
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
