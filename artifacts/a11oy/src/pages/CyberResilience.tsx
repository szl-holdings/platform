import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { CYBER_RESILIENCE_CHECKS, DARPA_PROGRAMS, fmtScore, DARPA_VERSION } from '../data/darpaResilience';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const CAT_COLORS: Record<string, string> = {
  'model-integrity': '#3b82f6', 'runtime-protection': '#10b981', 'vulnerability-scan': '#f59e0b', 'incident-response': '#8b5cf6',
};

const STATUS_COLORS: Record<string, string> = {
  passing: '#10b981', warning: '#f59e0b', failing: '#ef4444', 'not-tested': '#8a8a8a',
};

export function CyberResilience() {
  const passing = CYBER_RESILIENCE_CHECKS.filter(c => c.status === 'passing').length;
  const avgScore = CYBER_RESILIENCE_CHECKS.reduce((a, c) => a + c.score, 0) / CYBER_RESILIENCE_CHECKS.length;
  const totalFindings = CYBER_RESILIENCE_CHECKS.reduce((a, c) => a + c.findings, 0);
  const autoRemediated = CYBER_RESILIENCE_CHECKS.reduce((a, c) => a + c.remediatedAuto, 0);
  const aixcc = DARPA_PROGRAMS.find(p => p.id === 'aixcc')!;
  const bordeaux = DARPA_PROGRAMS.find(p => p.id === 'bordeaux')!;

  return (
    <Layout>
      <PageHeader
        label={`DARPA RESILIENCE · v${DARPA_VERSION}`}
        title="Cyber Resilience Center"
        subtitle="BORDEAUX + AIxCC-inspired — model security posture, AI-powered vulnerability scanning, and automated remediation from the $4M DEF CON 33 winning CRS."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="CHECKS PASSING" value={`${passing}/${CYBER_RESILIENCE_CHECKS.length}`} sub="security checks" accent={T.accent} />
        <KpiCard label="POSTURE SCORE" value={fmtScore(avgScore)} sub="mean resilience" accent={T.accent} />
        <KpiCard label="FINDINGS" value={totalFindings.toString()} sub="total detected" accent={totalFindings > 10 ? '#f59e0b' : T.accent} />
        <KpiCard label="AUTO-REMEDIATED" value={autoRemediated.toString()} sub="fixed automatically" accent={T.accent} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
            <span className="text-xs font-mono" style={{ color: T.dim }}>AIxCC — AI CYBER CHALLENGE</span>
          </div>
          <div className="text-sm mb-1" style={{ color: T.text }}>{aixcc.fullName}</div>
          <div className="text-xs" style={{ color: T.dim }}>Office: {aixcc.office}</div>
          <div className="text-xs mt-2" style={{ color: T.muted }}>{aixcc.innovation}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-xs font-mono" style={{ color: T.dim }}>BORDEAUX — AI CYBER SECURITY</span>
          </div>
          <div className="text-sm mb-1" style={{ color: T.text }}>{bordeaux.fullName}</div>
          <div className="text-xs" style={{ color: T.dim }}>Office: {bordeaux.office}</div>
          <div className="text-xs mt-2" style={{ color: T.muted }}>{bordeaux.innovation}</div>
        </Card>
      </div>

      <SectionTitle>Check Categories</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {Object.entries(CAT_COLORS).map(([cat, color]) => {
          const checks = CYBER_RESILIENCE_CHECKS.filter(c => c.category === cat);
          const catScore = checks.reduce((a, c) => a + c.score, 0) / checks.length;
          return (
            <Card key={cat} className="p-3 text-center">
              <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: color }} />
              <div className="text-xs font-mono" style={{ color }}>{cat.replace(/-/g, ' ')}</div>
              <div className="text-lg font-mono font-bold mt-1" style={{ color: T.text }}>{fmtScore(catScore)}</div>
              <div className="text-xs" style={{ color: T.dim }}>{checks.length} checks</div>
            </Card>
          );
        })}
      </div>

      <SectionTitle>Security Checks</SectionTitle>
      <div className="space-y-2 mb-8">
        {CYBER_RESILIENCE_CHECKS.map(check => (
          <Card key={check.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono" style={{ color: T.dim }}>{check.id}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: STATUS_COLORS[check.status] + '15', color: STATUS_COLORS[check.status] }}>
                    {check.status.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: CAT_COLORS[check.category] + '15', color: CAT_COLORS[check.category] }}>
                    {check.category.replace(/-/g, ' ')}
                  </span>
                </div>
                <div className="text-sm font-medium" style={{ color: T.text }}>{check.name}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold" style={{ color: check.score >= 95 ? T.accent : check.score >= 90 ? T.text : '#f59e0b' }}>
                  {fmtScore(check.score)}
                </div>
                <div className="text-xs" style={{ color: T.dim }}>score</div>
              </div>
            </div>

            <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: T.surface }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${check.score}%`,
                  backgroundColor: check.score >= 95 ? T.accent : check.score >= 90 ? '#3b82f6' : '#f59e0b',
                }}
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Findings</div>
                <div className="text-sm font-mono" style={{ color: check.findings > 0 ? '#f59e0b' : T.text }}>{check.findings}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Auto-Fixed</div>
                <div className="text-sm font-mono" style={{ color: T.accent }}>{check.remediatedAuto}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Pending</div>
                <div className="text-sm font-mono" style={{ color: check.pendingReview > 0 ? '#f59e0b' : T.text }}>{check.pendingReview}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Framework</div>
                <div className="text-xs font-mono" style={{ color: T.muted }}>{check.framework}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
