import { useState } from 'react';
import { FlaskConical, AlertTriangle, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';
import { DEMO_WORKCELLS } from '@szl/a11oy-runtime';
import type { MirrorEvalScore } from '@szl/a11oy-runtime';

const DISPOSITION_COLOR: Record<string, string> = {
  pass: '#22c55e',
  pass_with_warning: '#d4a054',
  needs_more_evidence: '#f59e0b',
  requires_human_review: '#f97316',
  blocked: '#ef4444',
};

const DIM_LABELS = [
  { key: 'groundedness', label: 'Groundedness' },
  { key: 'evidenceCoverage', label: 'Evidence Coverage' },
  { key: 'policyCompliance', label: 'Policy Compliance' },
  { key: 'businessImpactClarity', label: 'Impact Clarity' },
  { key: 'actionSpecificity', label: 'Action Specificity' },
  { key: 'verificationReadiness', label: 'Verification Ready' },
  { key: 'approvalCorrectness', label: 'Approval Correctness' },
];

interface EvalRow {
  workcellId: string;
  title: string;
  domain: string;
  eval: MirrorEvalScore;
}

export function EvalsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const evalRows: EvalRow[] = DEMO_WORKCELLS
    .filter((w) => w.actionBrief)
    .map((w) => ({
      workcellId: w.id,
      title: w.title,
      domain: w.domain,
      eval: w.actionBrief!.mirrorEval,
    }));

  const selected = selectedId ? evalRows.find((r) => r.workcellId === selectedId) : null;

  const avgScore = evalRows.length > 0 ? evalRows.reduce((s, r) => s + r.eval.overallScore, 0) / evalRows.length : 0;
  const passCount = evalRows.filter((r) => r.eval.disposition === 'pass').length;
  const warnCount = evalRows.filter((r) => r.eval.disposition === 'pass_with_warning').length;
  const blockCount = evalRows.filter((r) => r.eval.disposition === 'blocked' || r.eval.disposition === 'requires_human_review').length;

  return (
    <div style={{ background: 'var(--gi-bg-base)', minHeight: '100vh', color: 'var(--gi-text-primary)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--gi-border-subtle)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: 'rgba(77,143,204,0.15)', border: '1px solid rgba(77,143,204,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FlaskConical size={18} color="var(--gi-accent-blue)" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>MirrorEval</div>
          <div style={{ fontSize: 12, color: 'var(--gi-text-muted)' }}>10-dimension evaluation across {evalRows.length} Action Briefs</div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, borderBottom: '1px solid var(--gi-border-subtle)' }}>
        {[
          { label: 'Avg Overall Score', value: `${Math.round(avgScore * 100)}%`, color: avgScore >= 0.85 ? '#22c55e' : '#d4a054', icon: BarChart3 },
          { label: 'Pass', value: passCount, color: '#22c55e', icon: CheckCircle2 },
          { label: 'Pass w/ Warning', value: warnCount, color: '#d4a054', icon: AlertTriangle },
          { label: 'Review / Blocked', value: blockCount, color: '#ef4444', icon: AlertTriangle },
        ].map((s) => (
          <div key={s.label} style={{ padding: '16px 24px', background: 'var(--gi-bg-base)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <s.icon size={14} color={s.color} />
              <span style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 186px)' }}>
        {/* Eval Rows */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {evalRows.map((row) => {
              const dColor = DISPOSITION_COLOR[row.eval.disposition];
              const isSelected = selectedId === row.workcellId;

              return (
                <div
                  key={row.workcellId}
                  onClick={() => setSelectedId(isSelected ? null : row.workcellId)}
                  style={{
                    background: isSelected ? 'rgba(77,143,204,0.05)' : 'var(--gi-bg-base)',
                    border: `1px solid ${isSelected ? 'rgba(77,143,204,0.25)' : 'var(--gi-border-subtle)'}`,
                    borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gi-text-primary)' }}>{row.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--gi-text-muted)', marginTop: 2 }}>{row.domain}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#8b7ac8' }}>{Math.round(row.eval.overallScore * 100)}%</div>
                      <div style={{ background: `${dColor}12`, border: `1px solid ${dColor}28`, borderRadius: 20, padding: '3px 10px' }}>
                        <span style={{ fontSize: 10, color: dColor, fontWeight: 600 }}>{row.eval.disposition.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini bar chart */}
                  <div style={{ display: 'flex', gap: 2 }}>
                    {DIM_LABELS.map((d) => {
                      const val = row.eval[d.key as keyof MirrorEvalScore] as number;
                      const c = val >= 0.85 ? '#22c55e' : val >= 0.7 ? '#d4a054' : '#ef4444';
                      return (
                        <div key={d.key} title={`${d.label}: ${Math.round(val * 100)}%`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: '100%', height: 24, background: 'var(--gi-border-subtle)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${val * 100}%`, background: c, borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 8, color: '#475569', textAlign: 'center', lineHeight: 1 }}>{d.label.slice(0, 4)}</div>
                        </div>
                      );
                    })}
                  </div>

                  {row.eval.warnings.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <AlertTriangle size={10} color="#d4a054" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ fontSize: 10, color: '#d4a054' }}>{row.eval.warnings.join(' · ')}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ width: 360, borderLeft: '1px solid var(--gi-border-subtle)', overflow: 'auto', padding: 20, background: 'var(--gi-bg-base)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>{selected.title}</div>

            <div style={{ display: 'grid', gap: 7 }}>
              {[
                { label: 'Groundedness', value: selected.eval.groundedness },
                { label: 'Evidence Coverage', value: selected.eval.evidenceCoverage },
                { label: 'Policy Compliance', value: selected.eval.policyCompliance },
                { label: 'Unsafe Autonomy Risk', value: 1 - selected.eval.unsafeAutonomyRisk, inverted: true },
                { label: 'Hallucination Risk', value: 1 - selected.eval.hallucinationRisk, inverted: true },
                { label: 'Business Impact Clarity', value: selected.eval.businessImpactClarity },
                { label: 'Action Specificity', value: selected.eval.actionSpecificity },
                { label: 'Verification Readiness', value: selected.eval.verificationReadiness },
                { label: 'Stale Context Risk', value: 1 - selected.eval.staleContextRisk, inverted: true },
                { label: 'Approval Correctness', value: selected.eval.approvalCorrectness },
              ].map((d) => {
                const c = d.value >= 0.85 ? '#22c55e' : d.value >= 0.7 ? '#d4a054' : '#ef4444';
                return (
                  <div key={d.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{d.label}</span>
                      <span style={{ fontSize: 11, color: c, fontWeight: 600 }}>{Math.round(d.value * 100)}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--gi-border-subtle)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${d.value * 100}%`, background: c, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 16, background: 'var(--gi-bg-base)', borderRadius: 8, border: '1px solid var(--gi-border-subtle)', padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', marginBottom: 6 }}>Run At</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(selected.eval.runAt).toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EvalsPage;
