import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

interface BusinessTwin {
  id: string; name: string; type: string; tenant: string; domain: string;
  fidelity: number; driftScore: number; riskLevel: string; owner: string;
  lastSync: string; signals: number; activeWorkcells: number; proofCoverage: number;
  recommendedAction: string; state: Record<string, unknown>;
}

interface TwinsData {
  twins: BusinessTwin[];
  summary: { total: number; byRisk: Record<string, number>; byType: Record<string, number>; avgDriftScore: number; avgProofCoverage: number };
}

const RISK_COLORS: Record<string, string> = { critical: '#f5f5f5', high: '#c9b787', medium: '#c9b787', low: '#c9b787' };

function DriftBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 rounded-full flex-1" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
        <div className="h-1.5 rounded-full" style={{ width: `${score}%`, backgroundColor: score > 40 ? '#f5f5f5' : score > 20 ? '#c9b787' : '#c9b787' }} />
      </div>
      <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{score}</span>
    </div>
  );
}

const SIM_RESULTS: Record<string, { noAction: string; approvedAction: string; resolution: string }> = {
  'vessel-twin-001': { noAction: 'VLCC Everest continues delayed — standby cost accumulates at $2.4M/day. Port congestion worsens. Fleet scheduling disrupted for 3 subsequent vessels.', approvedAction: 'Reroute to Port Antwerp approved — ETA realigned, $2.4M/day exposure eliminated. Downstream fleet scheduling restored.', resolution: '72 hours post-approval' },
  'deal-twin-003': { noAction: 'Meridian acquisition drift continues — 3 additional data room gaps compound. Regulatory review timeline extends by 60 days. Deal at risk.', approvedAction: 'Data room gap remediation workcell approved — gaps resolved, regulatory review back on track. Deal closes on schedule.', resolution: '14 days post-approval' },
  'matter-twin-012': { noAction: 'SZL v. CrossBridge — motion deadline missed. Adverse inference risk materially increases. Settlement leverage weakens.', approvedAction: 'Motion filing workcell approved — motion filed on time. Privilege preservation maintained. Settlement position preserved.', resolution: 'Immediate (filing deadline)' },
  'asset-twin-007': { noAction: '45 Park Ave occupancy drifts to 82% — below lender covenant threshold. Covenant breach notice issued. Refinancing window closes.', approvedAction: 'Lease-up strategy workcell approved — 2 LOIs converted. Occupancy restored above covenant floor at 87%.', resolution: '30 days post-approval' },
  'vendor-twin-002': { noAction: 'Apex Supply SLA breach compounds — critical component shortage imminent. Production halt risk: HIGH. Revenue at risk: $4.2M.', approvedAction: 'Vendor renegotiation + secondary supplier onboarding approved. SLA restored. Production continuity maintained.', resolution: '10 days post-approval' },
  'incident-twin-009': { noAction: 'CVE-2025-4891 unpatched — lateral movement risk persists. Additional endpoints exposed. Regulatory notification deadline missed.', approvedAction: 'Patch deployment approved across 847 endpoints. Threat contained. CISA notification filed on time.', resolution: '48 hours post-approval' },
  'contract-twin-015': { noAction: 'EU Compliance Bundle — 3 contracts remain non-compliant after GDPR deadline. Regulatory enforcement action likely. Max fine: €4.8M.', approvedAction: 'Contract remediation workcell approved — all 3 contracts updated. GDPR compliance restored. Regulatory risk eliminated.', resolution: '5 business days post-approval' },
};

const DEFAULT_SIM = {
  noAction: 'Continued drift compounds — the risk increases over time without intervention. Financial exposure accumulates.',
  approvedAction: 'Governed action approved — drift resolved within the estimated resolution window. Proof chain maintained.',
  resolution: '5-14 days post-approval',
};

const TWINS_DATA: TwinsData = {
  summary: { total: 7, byRisk: { critical: 1, high: 1, medium: 2, low: 3 }, byType: { vessel: 1, deal: 1, matter: 2, asset: 1, vendor: 1, incident: 1 }, avgDriftScore: 28, avgProofCoverage: 87 },
  twins: [
    { id: 'vessel-twin-001', name: 'VLCC Everest', type: 'vessel', tenant: 'SZL Holdings / SEXTANT', domain: 'Maritime', fidelity: 94, driftScore: 74, riskLevel: 'critical', owner: 'Operations Controller, SEXTANT', lastSync: '2026-04-26T14:28:00Z', signals: 3, activeWorkcells: 1, proofCoverage: 96, recommendedAction: 'Reroute to Port Antwerp — VP Operations approval required', state: { vessel_id: 'VLCC-EVEREST-001', current_port: 'Singapore', destination: 'Rotterdam', eta_deviation_hours: 31, standby_cost_per_day: '$2.4M', cargo_type: 'Crude Oil', flag_state: 'Marshall Islands', compliance_status: 'COMPLIANT' } },
    { id: 'deal-twin-003', name: 'Meridian Acquisition', type: 'deal', tenant: 'CrossBridge Capital', domain: 'Finance', fidelity: 81, driftScore: 42, riskLevel: 'high', owner: 'VP M&A, CrossBridge', lastSync: '2026-04-26T12:15:00Z', signals: 2, activeWorkcells: 1, proofCoverage: 88, recommendedAction: 'Resolve 3 data room gaps before regulatory review — deal counsel required', state: { deal_stage: 'Due Diligence', data_room_gaps: 3, regulatory_review_status: 'PENDING', target_close_date: '2026-06-30', deal_value: '$840M', jurisdiction: 'Delaware / EU', antitrust_status: 'UNDER_REVIEW' } },
    { id: 'matter-twin-012', name: 'SZL v. CrossBridge', type: 'matter', tenant: 'SZL Holdings / Counsel', domain: 'Legal', fidelity: 92, driftScore: 18, riskLevel: 'low', owner: 'General Counsel, SZL', lastSync: '2026-04-26T13:45:00Z', signals: 1, activeWorkcells: 0, proofCoverage: 91, recommendedAction: 'File response motion within 7-day deadline — no action required today', state: { matter_id: 'SZL-2026-047', matter_type: 'Commercial Dispute', status: 'ACTIVE', next_deadline: '2026-05-03', estimated_exposure: '$12M', privilege_preservation: 'ACTIVE', settlement_discussions: 'ONGOING' } },
    { id: 'asset-twin-007', name: '45 Park Ave Portfolio', type: 'asset', tenant: 'DOMAINE Real Estate', domain: 'Real Estate', fidelity: 88, driftScore: 22, riskLevel: 'low', owner: 'Portfolio Director, DOMAINE', lastSync: '2026-04-26T11:00:00Z', signals: 1, activeWorkcells: 0, proofCoverage: 84, recommendedAction: 'Continue lease-up strategy — two LOIs in negotiation', state: { asset_class: 'Class A Office', total_sqft: 284000, occupancy_rate: '89%', covenant_threshold: '85%', lender: 'JPMorgan Real Estate', noi_ytd: '$8.2M', cap_rate: '5.4%', lease_expiry_risk: 'LOW' } },
    { id: 'vendor-twin-002', name: 'Apex Supply', type: 'vendor', tenant: 'Acme Industries', domain: 'Procurement', fidelity: 77, driftScore: 61, riskLevel: 'critical', owner: 'Head of Procurement, Acme', lastSync: '2026-04-26T10:30:00Z', signals: 2, activeWorkcells: 1, proofCoverage: 79, recommendedAction: 'Renegotiate SLA + onboard secondary vendor — procurement approval required', state: { vendor_id: 'APEX-SUPPLY-001', category: 'Critical Components', sla_breach_days: 12, component_stock_days: 8, production_risk: 'HIGH', annual_spend: '$4.2M', secondary_vendor_status: 'PENDING_ONBOARD', sanctions_status: 'CLEAR' } },
    { id: 'incident-twin-009', name: 'CVE-2025-4891', type: 'incident', tenant: 'Northwind Labs', domain: 'Cybersecurity', fidelity: 96, driftScore: 12, riskLevel: 'low', owner: 'CISO, Northwind Labs', lastSync: '2026-04-26T14:00:00Z', signals: 1, activeWorkcells: 0, proofCoverage: 98, recommendedAction: 'Monitor post-patch — all endpoints remediated, threat contained', state: { cve_id: 'CVE-2025-4891', cvss_score: 9.1, status: 'CONTAINED', endpoints_patched: 847, endpoints_total: 847, patch_date: '2026-04-18', threat_actor_type: 'Nation-State', cisa_notification: 'FILED' } },
    { id: 'contract-twin-015', name: 'EU Compliance Bundle', type: 'matter', tenant: 'CrossBridge Capital', domain: 'Legal', fidelity: 83, driftScore: 35, riskLevel: 'medium', owner: 'Chief Privacy Officer, CrossBridge', lastSync: '2026-04-26T09:45:00Z', signals: 2, activeWorkcells: 1, proofCoverage: 82, recommendedAction: 'Remediate 3 GDPR non-compliant contracts before May 15 deadline', state: { bundle_size: 47, compliant_contracts: 44, non_compliant_contracts: 3, deadline: '2026-05-15', regulation: 'GDPR Art. 28', max_fine: '€4.8M', dpo_notified: true, remediation_status: 'IN_PROGRESS' } },
  ],
};

export function TwinFoundry() {
  const [data] = useState<TwinsData>(TWINS_DATA);
  const [selected, setSelected] = useState<BusinessTwin | null>(null);
  const [simResult, setSimResult] = useState<{ noAction: string; approvedAction: string; resolution: string } | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterType, setFilterType] = useState('all');

  function simulate(twin: BusinessTwin) {
    setSimLoading(true);
    setSimResult(null);
    setTimeout(() => {
      const result = SIM_RESULTS[twin.id] ?? DEFAULT_SIM;
      setSimResult(result);
      setSimLoading(false);
    }, 1400);
  }

  const twinTypes = [...new Set(data.twins.map(t => t.type))];
  const filtered = data.twins.filter(t =>
    (filterRisk === 'all' || t.riskLevel === filterRisk) &&
    (filterType === 'all' || t.type === filterType)
  );

  return (
    <Layout>
      <PageHeader
        label="TWIN FOUNDRY"
        title="Business Twin Registry"
        subtitle="Every enterprise asset, deal, vessel, matter, and incident has a live digital twin — continuously synchronized, drift-scored, and simulation-ready."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="BUSINESS TWINS" value={String(data.summary.total)} sub="All tenants" accent="#8a8a8a" />
        <KpiCard label="HIGH / CRITICAL" value={String((data.summary.byRisk.high ?? 0) + (data.summary.byRisk.critical ?? 0))} sub="Risk exposure" accent="#f5f5f5" />
        <KpiCard label="AVG DRIFT SCORE" value={String(data.summary.avgDriftScore)} sub="0=stable · 100=severe" accent="#c9b787" />
        <KpiCard label="AVG PROOF COVERAGE" value={`${data.summary.avgProofCoverage}%`} sub="Across all twins" accent="#c9b787" />
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Risk:</span>
        {['all', 'critical', 'high', 'medium', 'low'].map(r => (
          <button key={r} onClick={() => setFilterRisk(r)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterRisk === r ? 'rgba(201,183,135,0.2)' : 'var(--color-a11oy-muted)', color: filterRisk === r ? '#c9b787' : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterRisk === r ? 'rgba(201,183,135,0.4)' : 'var(--color-a11oy-border)'}` }}>
            {r}
          </button>
        ))}
        <span className="text-xs ml-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Type:</span>
        {['all', ...twinTypes.slice(0, 5)].map(t => (
          <button key={t} onClick={() => setFilterType(t)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterType === t ? 'rgba(138,138,138,0.2)' : 'var(--color-a11oy-muted)', color: filterType === t ? '#8a8a8a' : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterType === t ? 'rgba(138,138,138,0.4)' : 'var(--color-a11oy-border)'}` }}>
            {t === 'all' ? 'all' : t}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionTitle>Twins ({filtered.length})</SectionTitle>
          <div className="flex flex-col gap-2 max-h-[640px] overflow-y-auto pr-1">
            {filtered.map(twin => (
              <Card key={twin.id} className={`cursor-pointer hover:opacity-80 ${selected?.id === twin.id ? 'ring-1 ring-blue-500/30' : ''}`} onClick={() => { setSelected(twin); setSimResult(null); }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{twin.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{twin.type} · {twin.domain} · {twin.tenant}</div>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0" style={{ color: RISK_COLORS[twin.riskLevel], backgroundColor: `${RISK_COLORS[twin.riskLevel]}18` }}>
                    {twin.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>fidelity</div><div style={{ color: '#c9b787' }}>{twin.fidelity}%</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>drift</div><DriftBar score={twin.driftScore} /></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>signals</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{twin.signals}</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>proof</div><div style={{ color: twin.proofCoverage >= 80 ? '#c9b787' : '#c9b787' }}>{twin.proofCoverage}%</div></div>
                </div>
                {twin.activeWorkcells > 0 && (
                  <div className="text-xs" style={{ color: '#8a8a8a' }}>⬡ {twin.activeWorkcells} active workcell{twin.activeWorkcells > 1 ? 's' : ''}</div>
                )}
                <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>→ {twin.recommendedAction}</div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          {selected ? (
            <>
              <SectionTitle>Twin Detail</SectionTitle>
              <Card>
                <div className="font-semibold text-sm mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{selected.name}</div>
                <div className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selected.type} · {selected.owner}</div>

                <div className="space-y-2 text-xs mb-4">
                  {Object.entries(selected.state).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-2">
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{k.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-right" style={{ color: 'var(--color-a11oy-text-sub)' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs p-2 rounded mb-4" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: '#c9b787' }}>
                  → {selected.recommendedAction}
                </div>

                <button
                  onClick={() => simulate(selected)}
                  disabled={simLoading}
                  className="w-full text-xs py-2 rounded font-medium"
                  style={{ backgroundColor: 'rgba(138,138,138,0.15)', color: '#8a8a8a', border: '1px solid rgba(138,138,138,0.3)', opacity: simLoading ? 0.6 : 1 }}
                >
                  {simLoading ? 'Simulating…' : 'Run No-Action vs. Approved-Action'}
                </button>

                {simResult && (
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="p-2 rounded" style={{ backgroundColor: 'rgba(245,245,245,0.08)', border: '1px solid rgba(245,245,245,0.2)' }}>
                      <div className="font-medium mb-1" style={{ color: '#f5f5f5' }}>No Action</div>
                      <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{simResult.noAction}</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.08)', border: '1px solid rgba(201,183,135,0.2)' }}>
                      <div className="font-medium mb-1" style={{ color: '#c9b787' }}>Approved Action</div>
                      <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{simResult.approvedAction}</div>
                      <div className="mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Est. resolution: {simResult.resolution}</div>
                    </div>
                  </div>
                )}
              </Card>

              <div className="mt-3">
                <SectionTitle>Twin Type Distribution</SectionTitle>
                <div className="flex flex-col gap-1">
                  {Object.entries(data.summary.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{type}</span>
                      <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <SectionTitle>Risk Distribution</SectionTitle>
              <Card>
                {Object.entries(data.summary.byRisk).map(([risk, count]) => (
                  <div key={risk} className="flex items-center justify-between text-xs mb-2">
                    <span style={{ color: RISK_COLORS[risk] }}>{risk.toUpperCase()}</span>
                    <span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{count} twins</span>
                  </div>
                ))}
                <div className="mt-3 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Select a twin to view detail and run simulation.</div>
              </Card>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)]" /> Governed Environment — twins are drift-scored and simulation-ready. No workcell executes until human approved.
      </div>
    </Layout>
  );
}
