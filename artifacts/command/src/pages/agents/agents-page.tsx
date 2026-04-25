import { useState } from 'react';
import {
  Bot,
  ChevronRight,
  Shield,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Brain,
  Lock,
} from 'lucide-react';
import type { A11oyOperator, AutonomyLevel } from '@szl/a11oy-runtime';
import { OPERATORS, AUTONOMY_LEVELS } from '@szl/a11oy-runtime';

const RISK_COLOR: Record<string, string> = {
  observe_only: '#64748b',
  recommend_only: '#8b7ac8',
  draft_only: '#0ea5e9',
  execute_approved: '#d4a054',
  full_demo_autopilot: '#22c55e',
};

export function AgentsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [globalAutonomy, setGlobalAutonomy] = useState<AutonomyLevel>('recommend_only');

  const selectedOp = selected ? OPERATORS.find((o) => o.id === selected) : null;

  const totalCalls = 847;
  const successRate = 0.974;
  const avgLatencyMs = 1240;

  return (
    <div style={{ background: '#080c14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(139,122,200,0.15)', border: '1px solid rgba(139,122,200,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="#8b7ac8" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>Operator Control Plane</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>A11oy Agent Runtime — Phase 2</div>
          </div>
        </div>

        {/* Global Autonomy Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Global Autonomy:</span>
          <select
            value={globalAutonomy}
            onChange={(e) => setGlobalAutonomy(e.target.value as AutonomyLevel)}
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', color: RISK_COLOR[globalAutonomy], fontSize: 12, cursor: 'pointer' }}
          >
            {Object.entries(AUTONOMY_LEVELS).map(([k, v]) => (
              <option key={k} value={k} style={{ color: RISK_COLOR[k] }}>{v.label}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(139,122,200,0.08)', border: '1px solid rgba(139,122,200,0.2)', borderRadius: 6, padding: '4px 10px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Demo Mode</span>
          </div>
        </div>
      </div>

      {/* Autonomy level banner */}
      <div style={{ background: `${RISK_COLOR[globalAutonomy]}12`, borderBottom: `1px solid ${RISK_COLOR[globalAutonomy]}22`, padding: '10px 32px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Shield size={14} color={RISK_COLOR[globalAutonomy]} />
        <span style={{ fontSize: 12, color: RISK_COLOR[globalAutonomy] }}>{AUTONOMY_LEVELS[globalAutonomy].label}</span>
        <span style={{ fontSize: 12, color: '#64748b' }}>—</span>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{AUTONOMY_LEVELS[globalAutonomy].description}</span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, borderBottom: '1px solid #1e293b' }}>
        {[
          { label: 'Active Operators', value: '9', icon: Bot, color: '#8b7ac8' },
          { label: 'Total Calls (24h)', value: totalCalls.toLocaleString(), icon: Activity, color: '#0ea5e9' },
          { label: 'Success Rate', value: `${(successRate * 100).toFixed(1)}%`, icon: TrendingUp, color: '#22c55e' },
          { label: 'Avg Latency', value: `${(avgLatencyMs / 1000).toFixed(2)}s`, icon: Clock, color: '#d4a054' },
        ].map((s) => (
          <div key={s.label} style={{ padding: '16px 24px', background: '#080c14' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <s.icon size={14} color={s.color} />
              <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 220px)' }}>
        {/* Operator Grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {OPERATORS.map((op) => {
              const isSelected = selected === op.id;
              const exceeds = Object.keys(AUTONOMY_LEVELS).indexOf(op.maxAutonomyLevel) > Object.keys(AUTONOMY_LEVELS).indexOf(globalAutonomy);

              return (
                <div
                  key={op.id}
                  onClick={() => setSelected(isSelected ? null : op.id)}
                  style={{
                    background: isSelected ? 'rgba(139,122,200,0.08)' : '#0f172a',
                    border: `1px solid ${isSelected ? 'rgba(139,122,200,0.4)' : '#1e293b'}`,
                    borderRadius: 10,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, background: 'rgba(139,122,200,0.12)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Brain size={14} color="#8b7ac8" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{op.name}</div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{op.id}</div>
                      </div>
                    </div>
                    {exceeds && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '2px 6px' }}>
                        <Lock size={10} color="#ef4444" />
                        <span style={{ fontSize: 10, color: '#ef4444' }}>Restricted</span>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>{op.description.slice(0, 90)}…</p>

                  {/* Trust Score */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#64748b' }}>Trust Score</span>
                      <span style={{ fontSize: 10, color: '#8b7ac8', fontWeight: 600 }}>{op.trustScore.overall}%</span>
                    </div>
                    <div style={{ height: 3, background: '#1e293b', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${op.trustScore.overall}%`, background: 'linear-gradient(90deg, #8b7ac8, #a78bfa)', borderRadius: 2 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', align: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#64748b' }}>Max autonomy:</span>
                      <span style={{ fontSize: 10, color: RISK_COLOR[op.maxAutonomyLevel], fontWeight: 600, marginLeft: 4 }}>
                        {AUTONOMY_LEVELS[op.maxAutonomyLevel].label}
                      </span>
                    </div>
                    <ChevronRight size={12} color={isSelected ? '#8b7ac8' : '#475569'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedOp && (
          <div style={{ width: 380, borderLeft: '1px solid #1e293b', background: '#080c14', overflow: 'auto', padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{selectedOp.name}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>{selectedOp.description}</div>

            {/* Trust Score Breakdown */}
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Trust Score Breakdown</div>
              {[
                { label: 'Groundedness', value: selectedOp.trustScore.groundedness },
                { label: 'Evidence Coverage', value: selectedOp.trustScore.evidenceCoverage },
                { label: 'Approval Correctness', value: selectedOp.trustScore.approvalCorrectness },
                { label: 'Low Hallucination', value: selectedOp.trustScore.lowHallucinationScore },
                { label: 'Successful Verification', value: selectedOp.trustScore.successfulVerification },
                { label: 'Low Rollback Rate', value: selectedOp.trustScore.lowRollbackRate },
              ].map((d) => (
                <div key={d.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{d.label}</span>
                    <span style={{ fontSize: 11, color: d.value >= 90 ? '#22c55e' : d.value >= 80 ? '#d4a054' : '#ef4444' }}>{d.value}</span>
                  </div>
                  <div style={{ height: 3, background: '#1e293b', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${d.value}%`, background: d.value >= 90 ? '#22c55e' : d.value >= 80 ? '#d4a054' : '#ef4444', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Allowed Tools */}
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Allowed Tools</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedOp.allowedTools.map((t) => (
                  <span key={t} style={{ fontSize: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', borderRadius: 4, padding: '3px 8px' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Blocked Tools */}
            {selectedOp.blockedTools.length > 0 && (
              <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Blocked Tools</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedOp.blockedTools.map((t) => (
                    <span key={t} style={{ fontSize: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 4, padding: '3px 8px' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Handoff Targets */}
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Handoff Targets</div>
              {selectedOp.allowedHandoffTargets.length === 0 ? (
                <div style={{ fontSize: 11, color: '#475569' }}>Terminal operator — no handoffs</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedOp.allowedHandoffTargets.map((t) => (
                    <span key={t} style={{ fontSize: 10, background: 'rgba(139,122,200,0.08)', border: '1px solid rgba(139,122,200,0.2)', color: '#8b7ac8', borderRadius: 4, padding: '3px 8px' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions Preview */}
            <div style={{ marginTop: 14, background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>System Instructions (Excerpt)</div>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>{selectedOp.instructions}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentsPage;
