import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { CYBER_RESILIENCE_CHECKS } from '../data/darpaResilience';

const T = {
  text: '#f5f5f5', dim: '#8a8a8a', accent: '#c9b787',
};

const CAT_COLORS: Record<string, string> = {
  'model-integrity': '#3b82f6',
  'runtime-protection': '#10b981',
  'vulnerability-scan': '#f59e0b',
  'incident-response': '#8b5cf6',
};

export function CyberResilience() {
  return (
    <Layout>
      <PageHeader
        label="CYBER RESILIENCE · DESIGN SURFACE"
        title="Cyber Resilience Center"
        subtitle="Modeled security check concepts from local seed data. No current-head scan, runtime posture, finding, or remediation evidence is connected to this page."
        status="DEMO"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <KpiCard label="RUNTIME CHECKS" value="UNAVAILABLE" sub="No bound run evidence" accent={T.accent} />
        <KpiCard label="POSTURE SCORE" value="UNAVAILABLE" sub="No measured assessment" accent={T.accent} />
        <KpiCard label="FINDINGS" value="UNAVAILABLE" sub="No verified scan output" accent={T.accent} />
        <KpiCard label="REMEDIATION" value="UNAVAILABLE" sub="No external action receipt" accent={T.accent} />
      </div>

      <Card className="mb-6">
        <p className="text-sm" style={{ color: T.text }}>
          The check names below are design examples. Their seeded status, score, finding, and
          auto-remediation fields are not current security measurements and are not displayed.
        </p>
      </Card>

      <SectionTitle>Modeled Check Categories</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {Object.entries(CAT_COLORS).map(([category, color]) => (
          <Card key={category} className="p-3 text-center">
            <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: color }} />
            <div className="text-xs font-mono" style={{ color }}>
              {category.replace(/-/g, ' ')}
            </div>
            <div className="text-xs mt-2" style={{ color: T.dim }}>DEMO CONCEPT</div>
          </Card>
        ))}
      </div>

      <SectionTitle>Proposed Security Checks</SectionTitle>
      <div className="space-y-2 mb-8">
        {CYBER_RESILIENCE_CHECKS.map(check => (
          <Card key={check.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono" style={{ color: T.dim }}>{check.id}</span>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ color: CAT_COLORS[check.category], backgroundColor: CAT_COLORS[check.category] + '15' }}
                  >
                    {check.category.replace(/-/g, ' ')}
                  </span>
                </div>
                <div className="text-sm font-medium" style={{ color: T.text }}>{check.name}</div>
                <div className="text-xs mt-1" style={{ color: T.dim }}>
                  A source definition only; execution and result evidence are unavailable.
                </div>
              </div>
              <span className="text-xs font-mono" style={{ color: T.accent, flexShrink: 0, whiteSpace: 'nowrap' }}>DEMO</span>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
