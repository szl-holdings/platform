import { useParams, useLocation } from 'wouter';
import {
  ArrowLeft,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  FileCheck,
  ShieldCheck,
  Zap,
  Bot,
  Wrench,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { WORKCELL_MAP, TOOL_MAP } from '@szl/a11oy-runtime';
import type { TraceStep, MirrorEvalScore } from '@szl/a11oy-runtime';

const STATUS_COLOR: Record<string, string> = {
  success: '#22c55e',
  warning: '#d4a054',
  failure: '#ef4444',
  blocked: '#ef4444',
  pending: '#64748b',
};

function MirrorEvalDisplay({ eval: ev }: { eval: MirrorEvalScore }) {
  const dims = [
    { label: 'Groundedness', value: ev.groundedness },
    { label: 'Evidence Coverage', value: ev.evidenceCoverage },
    { label: 'Policy Compliance', value: ev.policyCompliance },
    { label: 'Unsafe Autonomy Risk', value: 1 - ev.unsafeAutonomyRisk, inverted: true },
    { label: 'Hallucination Risk', value: 1 - ev.hallucinationRisk, inverted: true },
    { label: 'Impact Clarity', value: ev.businessImpactClarity },
    { label: 'Action Specificity', value: ev.actionSpecificity },
    { label: 'Verification Readiness', value: ev.verificationReadiness },
    { label: 'Stale Context Risk', value: 1 - ev.staleContextRisk, inverted: true },
    { label: 'Approval Correctness', value: ev.approvalCorrectness },
  ];

  const dispositionColor: Record<string, string> = {
    pass: '#22c55e',
    pass_with_warning: '#d4a054',
    needs_more_evidence: '#f59e0b',
    requires_human_review: '#f97316',
    blocked: '#ef4444',
  };

  return (
    <div style={{ background: '#0a0f1a', borderRadius: 10, border: '1px solid #1e293b', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>MirrorEval</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#8b7ac8' }}>{Math.round(ev.overallScore * 100)}%</div>
          <div style={{ background: `${dispositionColor[ev.disposition]}18`, border: `1px solid ${dispositionColor[ev.disposition]}38`, borderRadius: 20, padding: '3px 10px' }}>
            <span style={{ fontSize: 10, color: dispositionColor[ev.disposition], fontWeight: 600 }}>{ev.disposition.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 7 }}>
        {dims.map((d) => (
          <div key={d.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: '#64748b' }}>{d.label}</span>
              <span style={{ fontSize: 10, color: d.value >= 0.85 ? '#22c55e' : d.value >= 0.7 ? '#d4a054' : '#ef4444' }}>
                {Math.round(d.value * 100)}%
              </span>
            </div>
            <div style={{ height: 3, background: '#1e293b', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${d.value * 100}%`, background: d.value >= 0.85 ? '#22c55e' : d.value >= 0.7 ? '#d4a054' : '#ef4444', borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {ev.warnings.length > 0 && (
        <div style={{ marginTop: 12, background: 'rgba(212,160,84,0.08)', border: '1px solid rgba(212,160,84,0.2)', borderRadius: 6, padding: 10 }}>
          {ev.warnings.map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <AlertTriangle size={10} color="#d4a054" style={{ marginTop: 2 }} />
              <span style={{ fontSize: 11, color: '#d4a054' }}>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TraceStepRow({ step }: { step: TraceStep }) {
  const color = STATUS_COLOR[step.status];
  const icon = step.type === 'agent_call' ? Bot
    : step.type === 'tool_call' ? Wrench
    : step.type === 'approval_gate' ? ShieldCheck
    : step.type === 'eval' ? FileCheck
    : Zap;
  const Icon = icon;

  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: `${color}18`, border: `1px solid ${color}38`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={11} color={color} />
        </div>
        <div style={{ width: 1, flex: 1, background: '#1e293b', marginTop: 4 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{step.label}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{step.detail}</div>
        {step.tokens && (
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#475569' }}>{step.tokens.toLocaleString()} tokens</span>
            {step.costUsd && <span style={{ fontSize: 10, color: '#475569' }}>${step.costUsd.toFixed(4)}</span>}
            <span style={{ fontSize: 10, color: '#475569' }}>{(step.latencyMs / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 10, color: color, fontWeight: 600, paddingTop: 4 }}>{step.status}</div>
    </div>
  );
}

export function WorkcellDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const wc = params.id ? WORKCELL_MAP[params.id] : null;

  if (!wc) {
    return (
      <div style={{ background: '#080c14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Workcell not found
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    proven: '#22c55e', blocked: '#ef4444', executing: '#0ea5e9',
    approval_required: '#f59e0b', approved: '#22c55e', planning: '#8b7ac8',
    action_brief_created: '#8b7ac8', risk_review: '#d4a054',
    verifying: '#8b7ac8', rejected: '#ef4444', intake: '#64748b', context_building: '#0ea5e9', archived: '#475569',
  };

  return (
    <div style={{ background: '#080c14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/agents/workcells')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
          <ArrowLeft size={14} />
          <span style={{ fontSize: 12 }}>Workcells</span>
        </button>
        <ChevronRight size={12} color="#334155" />
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{wc.title}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div style={{ background: `${statusColor[wc.status] ?? '#64748b'}12`, border: `1px solid ${statusColor[wc.status] ?? '#64748b'}28`, borderRadius: 20, padding: '4px 12px' }}>
            <span style={{ fontSize: 11, color: statusColor[wc.status] ?? '#64748b', fontWeight: 600 }}>{wc.status.replace(/_/g, ' ')}</span>
          </div>
          <button
            onClick={() => navigate(`/agents/workcells/${wc.id}/replay`)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(139,122,200,0.1)', border: '1px solid rgba(139,122,200,0.25)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#8b7ac8', fontSize: 12 }}
          >
            <RotateCcw size={12} />
            Replay
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: 'calc(100vh - 65px)' }}>
        {/* Main Content */}
        <div style={{ overflow: 'auto', padding: '20px 24px', borderRight: '1px solid #1e293b' }}>
          {/* Signals */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Trigger Signals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {wc.signals.map((s) => (
                <div key={s.id} style={{ background: '#0f172a', border: `1px solid ${s.severity === 'critical' ? 'rgba(239,68,68,0.2)' : s.severity === 'warning' ? 'rgba(212,160,84,0.2)' : '#1e293b'}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.severity === 'critical' ? '#ef4444' : s.severity === 'warning' ? '#d4a054' : '#64748b', marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.value}</div>
                  </div>
                  <span style={{ fontSize: 10, color: '#475569' }}>{s.source}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Context Pack */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Context Pack</div>
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div><div style={{ fontSize: 10, color: '#64748b' }}>Mode</div><div style={{ fontSize: 12, color: '#8b7ac8', fontWeight: 600 }}>{wc.contextPack.mode}</div></div>
                <div><div style={{ fontSize: 10, color: '#64748b' }}>Citations</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{wc.contextPack.citations.length}</div></div>
                <div><div style={{ fontSize: 10, color: '#64748b' }}>Tokens Used</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{wc.contextPack.tokensUsed.toLocaleString()} / {wc.contextPack.tokenBudget.toLocaleString()}</div></div>
                <div><div style={{ fontSize: 10, color: '#64748b' }}>Stale</div><div style={{ fontSize: 12, color: wc.contextPack.staleCount > 0 ? '#d4a054' : '#22c55e' }}>{wc.contextPack.staleCount}</div></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {wc.contextPack.citations.map((c, i) => (
                  <div key={c.id} style={{ background: '#080c14', borderRadius: 6, border: `1px solid ${c.isStale ? 'rgba(212,160,84,0.2)' : '#0f172a'}`, padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>{c.label}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {c.isStale && <span style={{ fontSize: 10, color: '#d4a054' }}>stale</span>}
                        <span style={{ fontSize: 10, color: '#475569' }}>conf {Math.round(c.confidence * 100)}%</span>
                        <span style={{ fontSize: 10, color: '#475569' }}>fresh {Math.round(c.freshnessScore * 100)}%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{c.source}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{c.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Brief */}
          {wc.actionBrief && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Action Brief</div>
              <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{wc.actionBrief.title}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>{wc.actionBrief.objective}</div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div><div style={{ fontSize: 10, color: '#64748b' }}>Risk Category</div><div style={{ fontSize: 11, color: '#d4a054', fontWeight: 600 }}>{wc.actionBrief.riskCategory.replace(/_/g, ' ')}</div></div>
                  <div><div style={{ fontSize: 10, color: '#64748b' }}>Approver Role</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{wc.actionBrief.requiredApproverRole}</div></div>
                  <div><div style={{ fontSize: 10, color: '#64748b' }}>Impact</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{wc.actionBrief.estimatedImpact.slice(0, 50)}…</div></div>
                </div>

                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Proposed Actions</div>
                {wc.actionBrief.proposedActions.map((pa) => (
                  <div key={pa.id} style={{ background: '#080c14', borderRadius: 6, border: '1px solid #0f172a', padding: '8px 12px', marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>{pa.tool}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {pa.requiresApproval && <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '1px 6px' }}>approval required</span>}
                        <span style={{ fontSize: 10, color: '#64748b' }}>{pa.riskLevel}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{pa.description}</div>
                  </div>
                ))}

                <MirrorEvalDisplay eval={wc.actionBrief.mirrorEval} />
              </div>
            </div>
          )}

          {/* Execution Result */}
          {wc.executionResult && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Execution Result</div>
              <div style={{ background: wc.executionResult.success ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${wc.executionResult.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <CheckCircle2 size={14} color={wc.executionResult.success ? '#22c55e' : '#ef4444'} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: wc.executionResult.success ? '#22c55e' : '#ef4444' }}>
                    {wc.executionResult.success ? 'Execution Succeeded' : 'Execution Failed'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{wc.executionResult.summary}</div>
              </div>
            </div>
          )}

          {/* Blocked State */}
          {wc.failureReason && (
            <div style={{ marginBottom: 20, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>Blocked</span>
              </div>
              <div style={{ fontSize: 12, color: '#fca5a5', marginBottom: 8 }}>{wc.failureReason}</div>
              {wc.retryRecommendation && (
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  <span style={{ color: '#d4a054' }}>Retry: </span>{wc.retryRecommendation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel — Trace + Proof */}
        <div style={{ overflow: 'auto', padding: '20px 20px', background: '#080c14' }}>
          {/* Operator Sequence */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Operator Sequence</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {wc.operatorSequence.map((op, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, background: 'rgba(139,122,200,0.1)', border: '1px solid rgba(139,122,200,0.25)', color: '#8b7ac8', borderRadius: 4, padding: '3px 8px' }}>{op}</span>
                  {i < wc.operatorSequence.length - 1 && <ChevronRight size={10} color="#334155" style={{ margin: '0 2px' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Execution Trace */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Execution Trace</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 10, color: '#475569' }}>{wc.executionTrace.totalTokens.toLocaleString()} tokens</span>
                <span style={{ fontSize: 10, color: '#475569' }}>${wc.totalCostUsd.toFixed(3)}</span>
              </div>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: '12px 14px' }}>
              {wc.executionTrace.steps.map((step) => (
                <TraceStepRow key={step.id} step={step} />
              ))}
            </div>
          </div>

          {/* Proof Packet */}
          {wc.proofPacket && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Proof Packet</div>
              <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <ShieldCheck size={14} color="#22c55e" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>Proven</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>{wc.proofPacket.executionSummary}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><div style={{ fontSize: 10, color: '#64748b' }}>Evidence Coverage</div><div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>{Math.round(wc.proofPacket.evidenceCoverage * 100)}%</div></div>
                  <div><div style={{ fontSize: 10, color: '#64748b' }}>Agent Calls</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{wc.proofPacket.agentTrace.length}</div></div>
                  <div><div style={{ fontSize: 10, color: '#64748b' }}>Tool Calls</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{wc.proofPacket.toolCalls.length}</div></div>
                  <div><div style={{ fontSize: 10, color: '#64748b' }}>Approvals</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{wc.proofPacket.approvalChain.length}</div></div>
                </div>
                <div style={{ marginTop: 10, padding: '6px 10px', background: '#080c14', borderRadius: 6, border: '1px solid #0f172a' }}>
                  <div style={{ fontSize: 9, color: '#475569', marginBottom: 2 }}>Hash Digest</div>
                  <div style={{ fontSize: 10, color: '#22c55e', fontFamily: 'monospace' }}>{wc.proofPacket.hashDigest}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkcellDetailPage;
