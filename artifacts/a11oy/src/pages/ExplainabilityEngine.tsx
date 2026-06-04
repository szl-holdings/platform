import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { EXPLAINABILITY_RECORDS, DARPA_PROGRAMS, fmtPct, DARPA_VERSION } from '../data/darpaResilience';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const METHOD_LABELS: Record<string, string> = {
  saliency: 'Saliency Map', shap: 'SHAP Values', lime: 'LIME',
  attention: 'Attention Weights', counterfactual: 'Counterfactual', 'concept-activation': 'TCAV',
};

const METHOD_COLORS: Record<string, string> = {
  saliency: '#ef4444', shap: '#3b82f6', lime: '#10b981',
  attention: '#f59e0b', counterfactual: '#8b5cf6', 'concept-activation': '#06b6d4',
};

const REVIEW_COLORS: Record<string, string> = {
  accepted: '#10b981', challenged: '#ef4444', pending: '#f59e0b',
};

export function ExplainabilityEngine() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const filtered = selectedMethod ? EXPLAINABILITY_RECORDS.filter(r => r.method === selectedMethod) : EXPLAINABILITY_RECORDS;

  const accepted = EXPLAINABILITY_RECORDS.filter(r => r.humanReviewStatus === 'accepted').length;
  const avgQuality = EXPLAINABILITY_RECORDS.reduce((a, c) => a + c.explanationQualityScore, 0) / EXPLAINABILITY_RECORDS.length;
  const avgConfidence = EXPLAINABILITY_RECORDS.reduce((a, c) => a + c.confidence, 0) / EXPLAINABILITY_RECORDS.length;
  const xai = DARPA_PROGRAMS.find(p => p.id === 'xai')!;

  return (
    <Layout>
      <PageHeader
        label={`DARPA RESILIENCE · v${DARPA_VERSION}`}
        title="Explainability Engine"
        subtitle="XAI / XAITK-inspired — decision attribution, saliency scoring, and human-reviewable explanations for every governed agent action."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="DECISIONS EXPLAINED" value={EXPLAINABILITY_RECORDS.length.toString()} sub="with attribution" accent={T.accent} />
        <KpiCard label="HUMAN ACCEPTED" value={`${accepted}/${EXPLAINABILITY_RECORDS.length}`} sub="explanations validated" accent={T.accent} />
        <KpiCard label="QUALITY SCORE" value={fmtPct(avgQuality)} sub="mean explanation quality" accent={T.accent} />
        <KpiCard label="AVG CONFIDENCE" value={fmtPct(avgConfidence)} sub="decision confidence" accent={T.accent} />
      </div>

      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: T.accent }} />
          <span className="text-xs font-mono" style={{ color: T.dim }}>DARPA PROGRAM REFERENCE</span>
        </div>
        <div className="text-sm mb-1" style={{ color: T.text }}>{xai.fullName}</div>
        <div className="text-xs" style={{ color: T.dim }}>Office: {xai.office} · GitHub: <span style={{ color: T.accent }}>{xai.github}</span></div>
        <div className="text-xs mt-2" style={{ color: T.muted }}>{xai.innovation}</div>
      </Card>

      <SectionTitle>Explanation Methods</SectionTitle>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {Object.entries(METHOD_LABELS).map(([key, label]) => {
          const count = EXPLAINABILITY_RECORDS.filter(r => r.method === key).length;
          const isSelected = selectedMethod === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedMethod(isSelected ? null : key)}
              className="text-left"
              style={{ all: 'unset', cursor: 'pointer', display: 'block' }}
            >
              <Card className="p-3 text-center" style={isSelected ? { border: `1px solid ${METHOD_COLORS[key]}` } : undefined}>
                <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: METHOD_COLORS[key] }} />
                <div className="text-xs font-mono" style={{ color: METHOD_COLORS[key] }}>{label}</div>
                <div className="text-lg font-mono font-bold mt-1" style={{ color: T.text }}>{count}</div>
              </Card>
            </button>
          );
        })}
      </div>

      <SectionTitle>Decision Explanations</SectionTitle>
      <div className="space-y-4 mb-8">
        {filtered.map(record => (
          <Card key={record.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono" style={{ color: T.dim }}>{record.id}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: METHOD_COLORS[record.method] + '15', color: METHOD_COLORS[record.method] }}>
                    {METHOD_LABELS[record.method]}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: REVIEW_COLORS[record.humanReviewStatus] + '15', color: REVIEW_COLORS[record.humanReviewStatus] }}>
                    {record.humanReviewStatus}
                  </span>
                </div>
                <div className="text-sm font-medium" style={{ color: T.text }}>{record.agentLabel}</div>
                <div className="text-xs" style={{ color: T.dim }}>{record.decisionId}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold" style={{ color: T.accent }}>{fmtPct(record.confidence)}</div>
                <div className="text-xs" style={{ color: T.dim }}>confidence</div>
              </div>
            </div>

            <div className="p-3 rounded mb-3" style={{ backgroundColor: 'rgba(201,183,135,0.05)', border: `1px solid ${T.border}` }}>
              <div className="text-xs font-mono" style={{ color: T.dim }}>DECISION</div>
              <div className="text-sm mt-1" style={{ color: T.text }}>{record.decision}</div>
            </div>

            <div className="text-xs font-mono mb-2" style={{ color: T.dim }}>ATTRIBUTION FACTORS</div>
            <div className="space-y-2">
              {record.topFactors.map((factor, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-20 text-right">
                    <span className="text-xs font-mono font-bold" style={{ color: factor.direction === 'positive' ? T.accent : '#ef4444' }}>
                      {factor.direction === 'positive' ? '+' : '-'}{(factor.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: T.surface }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${factor.weight * 100}%`,
                          backgroundColor: factor.direction === 'positive' ? T.accent : '#ef4444',
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-48 text-xs" style={{ color: T.text }}>{factor.factor}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
              <div className="text-xs" style={{ color: T.muted }}>Explanation Quality: <span style={{ color: T.accent }}>{fmtPct(record.explanationQualityScore)}</span></div>
              <div className="text-xs font-mono" style={{ color: T.muted }}>{new Date(record.timestamp).toLocaleString()}</div>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
