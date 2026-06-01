import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { SIMULATION_SCENARIOS, DARPA_PROGRAMS, fmtPct, fmtMs, DARPA_VERSION } from '../data/darpaResilience';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const STATUS_COLORS: Record<string, string> = {
  validated: '#10b981', 'needs-revision': '#f59e0b', 'in-progress': '#3b82f6', failed: '#ef4444',
};

export function SimGovernance() {
  const validated = SIMULATION_SCENARIOS.filter(s => s.status === 'validated').length;
  const totalRuns = SIMULATION_SCENARIOS.reduce((a, c) => a + c.simRuns, 0);
  const avgPassRate = SIMULATION_SCENARIOS.reduce((a, c) => a + c.passRate, 0) / SIMULATION_SCENARIOS.length;
  const totalEdgeCases = SIMULATION_SCENARIOS.reduce((a, c) => a + c.edgeCasesFound, 0);
  const avgTransfer = SIMULATION_SCENARIOS.reduce((a, c) => a + c.transferReadiness, 0) / SIMULATION_SCENARIOS.length;
  const tiamat = DARPA_PROGRAMS.find(p => p.id === 'tiamat')!;

  return (
    <Layout>
      <PageHeader
        label={`DARPA RESILIENCE · v${DARPA_VERSION}`}
        title="Governance Simulation Lab"
        subtitle="TIAMAT-inspired — sim-to-real governance policy transfer, constitutional stress testing, and edge-case discovery before production deployment."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="VALIDATED" value={`${validated}/${SIMULATION_SCENARIOS.length}`} sub="scenarios production-ready" accent={T.accent} />
        <KpiCard label="TOTAL RUNS" value={totalRuns.toLocaleString()} sub="simulation executions" accent={T.accent} />
        <KpiCard label="PASS RATE" value={fmtPct(avgPassRate)} sub="mean across scenarios" accent={T.accent} />
        <KpiCard label="EDGE CASES" value={totalEdgeCases.toString()} sub="discovered via simulation" accent={totalEdgeCases > 30 ? '#f59e0b' : T.accent} />
      </div>

      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: T.accent }} />
          <span className="text-xs font-mono" style={{ color: T.dim }}>DARPA PROGRAM REFERENCE</span>
        </div>
        <div className="text-sm mb-1" style={{ color: T.text }}>{tiamat.fullName}</div>
        <div className="text-xs" style={{ color: T.dim }}>Office: {tiamat.office}</div>
        <div className="text-xs mt-2" style={{ color: T.muted }}>{tiamat.innovation}</div>
      </Card>

      <SectionTitle>Transfer Readiness Overview</SectionTitle>
      <Card className="mb-6 p-4">
        <div className="text-xs font-mono mb-3" style={{ color: T.dim }}>SIM → PRODUCTION TRANSFER READINESS</div>
        <div className="flex items-end gap-1" style={{ height: '100px' }}>
          {SIMULATION_SCENARIOS.map(scenario => (
            <div key={scenario.id} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs font-mono" style={{ color: scenario.transferReadiness >= 0.95 ? T.accent : '#f59e0b', fontSize: '9px' }}>
                {fmtPct(scenario.transferReadiness)}
              </div>
              <div
                className="w-full rounded-t"
                style={{
                  height: `${scenario.transferReadiness * 80}px`,
                  backgroundColor: scenario.transferReadiness >= 0.95 ? T.accent : scenario.transferReadiness >= 0.90 ? '#3b82f6' : '#f59e0b',
                  opacity: 0.6,
                }}
              />
              <div className="text-xs font-mono" style={{ color: T.muted, fontSize: '8px' }}>{scenario.id.split('-')[1]}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="text-xs" style={{ color: T.dim }}>Mean Transfer Readiness: <span style={{ color: T.accent }}>{fmtPct(avgTransfer)}</span></div>
          <div className="text-xs" style={{ color: T.dim }}>Target: ≥ 95%</div>
        </div>
      </Card>

      <SectionTitle>Simulation Scenarios</SectionTitle>
      <div className="space-y-4 mb-8">
        {SIMULATION_SCENARIOS.map(scenario => (
          <Card key={scenario.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono" style={{ color: T.dim }}>{scenario.id}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: STATUS_COLORS[scenario.status] + '15', color: STATUS_COLORS[scenario.status] }}>
                    {scenario.status.toUpperCase().replace('-', ' ')}
                  </span>
                </div>
                <div className="text-sm font-medium" style={{ color: T.text }}>{scenario.name}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold" style={{ color: scenario.transferReadiness >= 0.95 ? T.accent : '#f59e0b' }}>
                  {fmtPct(scenario.transferReadiness)}
                </div>
                <div className="text-xs" style={{ color: T.dim }}>transfer ready</div>
              </div>
            </div>

            <div className="text-xs mb-3" style={{ color: T.muted }}>{scenario.description}</div>

            <div className="p-3 rounded mb-3" style={{ backgroundColor: 'rgba(201,183,135,0.05)', border: `1px solid ${T.border}` }}>
              <div className="text-xs font-mono" style={{ color: T.dim }}>POLICY UNDER TEST</div>
              <div className="text-xs font-mono mt-1" style={{ color: T.accent }}>{scenario.policyUnderTest}</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Sim Runs</div>
                <div className="text-sm font-mono" style={{ color: T.text }}>{scenario.simRuns.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Pass Rate</div>
                <div className="text-sm font-mono" style={{ color: scenario.passRate >= 0.995 ? T.accent : T.text }}>{fmtPct(scenario.passRate)}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Mean Latency</div>
                <div className="text-sm font-mono" style={{ color: T.text }}>{fmtMs(scenario.meanLatencyMs)}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Worst Case</div>
                <div className="text-sm font-mono" style={{ color: scenario.worstCaseLatencyMs > 5000 ? '#f59e0b' : T.text }}>{fmtMs(scenario.worstCaseLatencyMs)}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Edge Cases</div>
                <div className="text-sm font-mono" style={{ color: scenario.edgeCasesFound > 5 ? '#f59e0b' : T.text }}>{scenario.edgeCasesFound}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
