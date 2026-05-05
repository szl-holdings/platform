import { Layout } from '../../../components/layout';
import { PageHeader, Card, KpiCard } from '../../../components/ui';

const GOLD = '#c9b787';

const SOURCES = [
  { name: 'MarineTraffic AIS', domain: 'Maritime', reliability: 98, citedLast30d: 421, hallucinationsBlocked: 0, avgConfidence: 96 },
  { name: 'OFAC API', domain: 'Compliance', reliability: 100, citedLast30d: 88, hallucinationsBlocked: 0, avgConfidence: 99 },
  { name: 'Port Authority RSS', domain: 'Maritime', reliability: 92, citedLast30d: 284, hallucinationsBlocked: 2, avgConfidence: 91 },
  { name: 'Reuters News Wire', domain: 'Strategy', reliability: 88, citedLast30d: 1421, hallucinationsBlocked: 14, avgConfidence: 84 },
  { name: 'Counsel Sentinel Decisions', domain: 'Legal', reliability: 99, citedLast30d: 212, hallucinationsBlocked: 1, avgConfidence: 97 },
  { name: 'Guardian NOC Alerts', domain: 'Security', reliability: 97, citedLast30d: 842, hallucinationsBlocked: 3, avgConfidence: 95 },
  { name: 'Bloomberg Terminal', domain: 'Finance', reliability: 95, citedLast30d: 0, hallucinationsBlocked: 0, avgConfidence: 0 },
];

const CALIBRATION_HISTORY = [
  { date: 'Apr 1', declared: 90, actual: 87 },
  { date: 'Apr 8', declared: 88, actual: 89 },
  { date: 'Apr 15', declared: 91, actual: 90 },
  { date: 'Apr 22', declared: 89, actual: 91 },
  { date: 'Apr 29', declared: 92, actual: 92 },
  { date: 'May 5', declared: 93, actual: 93 },
];

export function ConfidenceDashboard() {
  const avgReliability = Math.round(SOURCES.filter(s => s.citedLast30d > 0).reduce((sum, s) => sum + s.reliability, 0) / SOURCES.filter(s => s.citedLast30d > 0).length);
  const totalHallucinationsBlocked = SOURCES.reduce((s, src) => s + src.hallucinationsBlocked, 0);

  return (
    <Layout>
      <PageHeader
        label="STRATEGY / BRIEFINGS / CONFIDENCE"
        title="Confidence & Source Reliability"
        subtitle="Source reliability scores, citation verification rates, hallucination blocks, and AI confidence calibration history. Tracks whether declared confidence matches actual accuracy."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="AVG SOURCE RELIABILITY" value={`${avgReliability}%`} sub="active sources" accent={GOLD} />
        <KpiCard label="HALLUCINATIONS BLOCKED" value={String(totalHallucinationsBlocked)} sub="last 30 days" accent="#22c55e" />
        <KpiCard label="CITATION COVERAGE" value="100%" sub="all published briefs" accent={GOLD} />
        <KpiCard label="CALIBRATION ERROR" value="<2%" sub="declared vs. actual" accent="#22c55e" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Source Reliability Scores</div>
          <div className="space-y-3">
            {SOURCES.sort((a, b) => b.reliability - a.reliability).map(src => (
              <div key={src.name} className="rounded-lg border p-4"
                style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{src.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{src.domain} · {src.citedLast30d} citations (30d)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium" style={{ color: src.reliability >= 95 ? '#22c55e' : src.reliability >= 88 ? GOLD : '#f87171' }}>
                      {src.reliability}%
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>reliability</div>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(201,183,135,0.08)' }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${src.reliability}%`, backgroundColor: src.reliability >= 95 ? '#22c55e' : src.reliability >= 88 ? GOLD : '#f87171' }} />
                </div>
                {src.hallucinationsBlocked > 0 && (
                  <div className="mt-1 text-xs" style={{ color: '#22c55e' }}>🛡 {src.hallucinationsBlocked} hallucination{src.hallucinationsBlocked > 1 ? 's' : ''} blocked</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>AI Confidence Calibration</div>
          <Card>
            <p className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              Calibration tracks whether declared confidence (what the AI says) matches actual accuracy (whether the cited claim was verified as true). A well-calibrated AI has {'<'}2% calibration error.
            </p>
            <div className="space-y-2">
              {CALIBRATION_HISTORY.map(h => (
                <div key={h.date} className="flex items-center gap-3 text-xs">
                  <div className="w-14 shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{h.date}</div>
                  <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: 'rgba(201,183,135,0.06)' }}>
                    <div className="h-full rounded" style={{ width: `${h.declared}%`, backgroundColor: 'rgba(201,183,135,0.3)' }} />
                  </div>
                  <div className="w-24 text-right space-x-2">
                    <span style={{ color: GOLD }}>Declared: {h.declared}%</span>
                  </div>
                  <div className="w-20 text-right">
                    <span style={{ color: Math.abs(h.declared - h.actual) <= 2 ? '#22c55e' : '#f87171' }}>Actual: {h.actual}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded text-xs" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <div style={{ color: '#22c55e' }}>✓ Calibration within target</div>
              <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Max calibration error in period: 3% (Apr 1) · Current: {'<'}1% · Target: {'<'}2%</div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
