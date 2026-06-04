import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge } from '../components/ui';
import { VERIFICATION_PROOFS, DARPA_PROGRAMS, fmtPct, fmtMs, DARPA_VERSION } from '../data/darpaResilience';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const METHOD_COLORS: Record<string, string> = {
  'reachability': '#3b82f6', 'interval-bound': '#10b981', 'abstract-interpretation': '#8b5cf6',
  'smt-solver': '#f59e0b', 'lipschitz-bound': '#06b6d4',
};

const STATUS_MAP: Record<string, 'ok' | 'warn' | 'error' | 'info'> = {
  'verified': 'ok', 'counterexample': 'warn', 'timeout': 'error', 'in-progress': 'info',
};

export function FormalVerification() {
  const verified = VERIFICATION_PROOFS.filter(p => p.status === 'verified').length;
  const totalBounds = VERIFICATION_PROOFS.reduce((a, c) => a + c.boundsTested, 0);
  const totalViolations = VERIFICATION_PROOFS.reduce((a, c) => a + c.violationsFound, 0);
  const avgConfidence = VERIFICATION_PROOFS.filter(p => p.confidence > 0).reduce((a, c) => a + c.confidence, 0) / VERIFICATION_PROOFS.filter(p => p.confidence > 0).length;
  const assured = DARPA_PROGRAMS.find(p => p.id === 'assured')!;

  return (
    <Layout>
      <PageHeader
        label={`DARPA RESILIENCE · v${DARPA_VERSION}`}
        title="Formal Verification Engine"
        subtitle="Assured Autonomy + Verisig-inspired — mathematical proofs that agent behavior stays within safety envelopes."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="PROOFS VERIFIED" value={`${verified}/${VERIFICATION_PROOFS.length}`} sub="agents with verified properties" accent={T.accent} />
        <KpiCard label="BOUNDS TESTED" value={totalBounds.toLocaleString()} sub="input-output pairs" accent={T.accent} />
        <KpiCard label="VIOLATIONS" value={totalViolations.toString()} sub="out of bounds behaviors" accent={totalViolations > 0 ? '#f59e0b' : T.accent} />
        <KpiCard label="AVG CONFIDENCE" value={fmtPct(avgConfidence)} sub="verification confidence" accent={T.accent} />
      </div>

      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: T.accent }} />
          <span className="text-xs font-mono" style={{ color: T.dim }}>DARPA PROGRAM REFERENCE</span>
        </div>
        <div className="text-sm mb-1" style={{ color: T.text }}>{assured.fullName}</div>
        <div className="text-xs" style={{ color: T.dim }}>Office: {assured.office} · GitHub: <span style={{ color: T.accent }}>{assured.github}</span></div>
        <div className="text-xs mt-2" style={{ color: T.muted }}>{assured.innovation}</div>
      </Card>

      <SectionTitle>Verification Methods</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {Object.entries(METHOD_COLORS).map(([method, color]) => {
          const count = VERIFICATION_PROOFS.filter(p => p.method === method).length;
          return (
            <Card key={method} className="p-3 text-center">
              <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: color }} />
              <div className="text-xs font-mono" style={{ color }}>{method}</div>
              <div className="text-lg font-mono font-bold mt-1" style={{ color: T.text }}>{count}</div>
              <div className="text-xs" style={{ color: T.dim }}>proofs</div>
            </Card>
          );
        })}
      </div>

      <SectionTitle>Agent Behavioral Proofs</SectionTitle>
      <div className="space-y-3 mb-8">
        {VERIFICATION_PROOFS.map(proof => (
          <Card key={proof.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono" style={{ color: T.dim }}>{proof.id}</span>
                  <StatusBadge status={STATUS_MAP[proof.status]} label={proof.status.toUpperCase().replace('-', ' ')} />
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: METHOD_COLORS[proof.method] + '15', color: METHOD_COLORS[proof.method] }}>
                    {proof.method}
                  </span>
                </div>
                <div className="text-sm font-medium" style={{ color: T.text }}>{proof.agentLabel}</div>
              </div>
              {proof.confidence > 0 && (
                <div className="text-right">
                  <div className="text-lg font-mono font-bold" style={{ color: proof.confidence >= 0.99 ? T.accent : proof.confidence >= 0.95 ? T.text : '#f59e0b' }}>
                    {fmtPct(proof.confidence)}
                  </div>
                  <div className="text-xs" style={{ color: T.dim }}>confidence</div>
                </div>
              )}
            </div>

            <div className="p-3 rounded mb-3" style={{ backgroundColor: 'rgba(201,183,135,0.05)', border: `1px solid ${T.border}` }}>
              <div className="text-xs font-mono" style={{ color: T.dim }}>PROPERTY UNDER VERIFICATION</div>
              <div className="text-sm mt-1" style={{ color: T.text }}>{proof.property}</div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Bounds Tested</div>
                <div className="text-sm font-mono" style={{ color: T.text }}>{proof.boundsTested.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Violations</div>
                <div className="text-sm font-mono" style={{ color: proof.violationsFound > 0 ? '#f59e0b' : T.accent }}>{proof.violationsFound}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Verification Time</div>
                <div className="text-sm font-mono" style={{ color: T.text }}>{fmtMs(proof.verificationTimeMs)}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Verisig Ref</div>
                <div className="text-xs font-mono" style={{ color: T.muted }}>{proof.verisigRef}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
