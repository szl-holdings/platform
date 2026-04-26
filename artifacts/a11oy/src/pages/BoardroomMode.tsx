import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

interface BoardSection {
  title: string;
  bullets: string[];
  metric?: string;
  metricLabel?: string;
}

interface BoardPacket {
  id: string; tenantId: string; tenantName: string; domain: string;
  generatedAt: string; period: string; approvedBy: string;
  executiveSummary: string; sections: BoardSection[];
  kpis: Array<{ label: string; value: string; trend: string; delta: string }>;
  approvalStatement: string; nextReviewDate: string;
  modelUsed: string; evalDisposition: string; evalComposite: number;
  proofRef: string;
}

interface BoardroomData {
  packets: BoardPacket[];
  summary: { totalPackets: number; tenantsServed: number; avgEvalComposite: number };
  capabilities: string[];
  generationLatencyMs: number;
}

const TREND_STYLE: Record<string, { color: string; symbol: string }> = {
  up: { color: '#c9b787', symbol: '▲' },
  down: { color: '#f5f5f5', symbol: '▼' },
  stable: { color: '#5e5e5e', symbol: '→' },
  mixed: { color: '#c9b787', symbol: '⟷' },
};

const DISP_STYLE: Record<string, string> = {
  pass: '#c9b787', pass_with_warning: '#c9b787', needs_more_evidence: '#c9b787',
  requires_human_review: '#f5f5f5', blocked: '#f5f5f5',
};

const INITIAL_DATA: BoardroomData = {
  summary: { totalPackets: 5, tenantsServed: 5, avgEvalComposite: 0.914 },
  generationLatencyMs: 1840,
  capabilities: [
    'Multi-domain signal ingestion across 7 verticals',
    'Automated synthesis from Workcells, Outcomes, and Proof Ledger',
    'MirrorEval 2.0 scoring — 14-dimension composite',
    'Human-approved before delivery (PCE gate)',
    'Full proof chain — SHA-256 hash-verified',
    'Narrative generation from structured evidence',
    'Boardroom-ready PDF export (production posture)',
    'Mythos Doctrine L8 — per-agent system cards, behavioral audit, alignment review',
  ],
  packets: [
    {
      id: 'bp-001', tenantId: 'szl-holdings', tenantName: 'SZL Holdings', domain: 'Multi-Domain Enterprise',
      generatedAt: '2026-04-26T14:32:00Z', period: 'Q2 2026', approvedBy: 'CFO, SZL Holdings',
      executiveSummary: 'Q2 2026 performance across maritime, legal, real estate, and revenue verticals remains strong despite geopolitical headwinds. Three critical signals resolved with governed autonomous action, five pending executive approval. Proof coverage at 94%. MirrorEval 2.0 composite: 94%.',
      kpis: [
        { label: 'Revenue at Risk', value: '$2.4M', trend: 'down', delta: '-12% vs prior period' },
        { label: 'Signals Resolved', value: '47', trend: 'up', delta: '+8 this week' },
        { label: 'Proof Coverage', value: '94%', trend: 'stable', delta: '+1% MoM' },
        { label: 'Pending Approvals', value: '5', trend: 'mixed', delta: '3 high priority' },
      ],
      sections: [
        { title: 'Maritime Operations', metric: '$2.4M/day', metricLabel: 'Standby Cost Exposure', bullets: ['VLCC Everest ETA deviation: 74 drift — reroute awaiting VP approval', 'Port Antwerp congestion index: ELEVATED — cost model executed', 'Fleet compliance: 100% — no flag-state violations', 'Environmental monitoring: NOMINAL'] },
        { title: 'Legal & Compliance', metric: '3', metricLabel: 'Active Matters', bullets: ['SZL v. CrossBridge — motion filed, outcome projected favorable', 'EU Antitrust Review — privilege preservation active, firewall enforced', 'IP Licensing — review on track, no escalation'] },
        { title: 'Revenue Intelligence', metric: '$180K ARR', metricLabel: 'At-Risk Recovery', bullets: ['3 mid-market accounts at churn risk — executive outreach initiated', 'Pipeline velocity: +12% QoQ', 'Q2 forecast: 98% of plan'] },
        { title: 'Real Estate Portfolio', metric: '34%', metricLabel: 'Wilshire Vacancy', bullets: ['Wilshire covenant breach imminent — lease-up strategy approved', '45 Park Ave occupancy stable at 89%', 'NorCal portfolio — 2 new LOIs received'] },
      ],
      evalDisposition: 'pass', evalComposite: 0.94, modelUsed: 'gpt-4-turbo',
      approvalStatement: 'This board packet has been reviewed by MirrorEval 2.0 (composite: 94%) and approved by CFO prior to distribution. Proof chain verified. All data sourced from governed A11oy signal mesh.',
      nextReviewDate: '2026-05-26T14:00:00Z', proofRef: 'sha256:c9f2e5b8a1d3e6f9b2c5a8f1d4e7c2b9a6f3e0d1',
    },
    {
      id: 'bp-002', tenantId: 'acme-industries', tenantName: 'Acme Industries', domain: 'Manufacturing & Supply Chain',
      generatedAt: '2026-04-25T10:15:00Z', period: 'Q2 2026', approvedBy: 'VP Operations, Acme',
      executiveSummary: 'Supply chain resilience posture improved after Q1 vendor consolidation. One critical procurement signal — Apex Supply SLA breach — resolved with renegotiation workcell. Revenue forecast revised upward by 3%. MirrorEval composite: 89%.',
      kpis: [
        { label: 'Supply Chain Risk', value: 'MEDIUM', trend: 'down', delta: 'from HIGH last period' },
        { label: 'Vendor SLA Breaches', value: '1', trend: 'down', delta: '-3 vs Q1' },
        { label: 'Revenue Forecast', value: '+3%', trend: 'up', delta: 'Revision upward' },
        { label: 'Open Workcells', value: '8', trend: 'stable', delta: '2 pending approval' },
      ],
      sections: [
        { title: 'Procurement Risk', metric: '79', metricLabel: 'Vendor Trust Score', bullets: ['Apex Supply SLA breach: renegotiation workcell approved', 'Secondary vendor onboarded for critical component', 'Sanctions screening: 100% coverage maintained'] },
        { title: 'Revenue Intelligence', metric: '$12.4M', metricLabel: 'Q2 Revenue Projection', bullets: ['Q2 forecast revised upward 3% — new contract wins', 'Pipeline conversion rate: +8% QoQ', '2 enterprise deals in final negotiation'] },
      ],
      evalDisposition: 'pass', evalComposite: 0.89, modelUsed: 'gpt-4-turbo',
      approvalStatement: 'Approved by VP Operations. Eval composite: 89%. Proof chain verified.',
      nextReviewDate: '2026-05-25T10:00:00Z', proofRef: 'sha256:e3a1d4f7b2c8e1a6d3f29a5b7c4e2f1a8d6b3c9',
    },
    {
      id: 'bp-003', tenantId: 'northwind-labs', tenantName: 'Northwind Labs', domain: 'Defense & Cybersecurity',
      generatedAt: '2026-04-24T09:00:00Z', period: 'Q2 2026', approvedBy: 'CISO, Northwind Labs',
      executiveSummary: 'CVE-2025-4891 contained. Threat intelligence posture elevated to GUARDED. Zero trust boundary enforcement 100%. No unauthorized exfiltration events. Board notified per incident protocol. MirrorEval composite: 87%.',
      kpis: [
        { label: 'Threat Level', value: 'GUARDED', trend: 'down', delta: 'from ELEVATED' },
        { label: 'CVEs Patched', value: '3', trend: 'up', delta: 'All critical resolved' },
        { label: 'ZT Coverage', value: '100%', trend: 'stable', delta: 'Full boundary' },
        { label: 'Incidents', value: '0', trend: 'stable', delta: 'This quarter' },
      ],
      sections: [
        { title: 'Cyber Threat Response', metric: 'CONTAINED', metricLabel: 'CVE-2025-4891 Status', bullets: ['CVE-2025-4891 zero-day contained — patch applied across 847 endpoints', 'Threat actor attribution: nation-state TTPs — CISA notification filed', 'Zero trust boundary: 100% enforced — no lateral movement detected'] },
        { title: 'Compliance Posture', metric: '98%', metricLabel: 'CMMC Compliance Score', bullets: ['CMMC Level 2 audit: 98% — 2 items in remediation', 'FedRAMP authorization package: in preparation', 'Insider threat monitoring: 0 anomalies'] },
      ],
      evalDisposition: 'pass', evalComposite: 0.87, modelUsed: 'gpt-4-turbo',
      approvalStatement: 'Approved by CISO. Eval composite: 87%. Proof chain verified. Classified appendix excluded from this version.',
      nextReviewDate: '2026-05-24T09:00:00Z', proofRef: 'sha256:b8c3f9e2a4d1e7f3b6c2a5d8f1e4b7c3a9d2f6',
    },
    {
      id: 'bp-004', tenantId: 'crossbridge-capital', tenantName: 'CrossBridge Capital', domain: 'Investment & Finance',
      generatedAt: '2026-04-23T16:45:00Z', period: 'Q2 2026', approvedBy: 'CFO, CrossBridge Capital',
      executiveSummary: 'Q2 portfolio performance: AUM stable, 2 new fund closes executed. Meridian acquisition process on track — legal review 80% complete. Regulatory reporting compliance: 100%. MirrorEval composite: 93%.',
      kpis: [
        { label: 'AUM', value: '$4.2B', trend: 'up', delta: '+2.3% QoQ' },
        { label: 'Fund Closes', value: '2', trend: 'up', delta: 'Q2 target: 3' },
        { label: 'Legal Review', value: '80%', trend: 'up', delta: 'Meridian acquisition' },
        { label: 'Regulatory', value: '100%', trend: 'stable', delta: 'All filings current' },
      ],
      sections: [
        { title: 'Portfolio Performance', metric: '$4.2B', metricLabel: 'Assets Under Management', bullets: ['Q2 fund performance: +4.1% net of fees', 'Meridian acquisition: term sheet signed, due diligence 80% complete', 'LP capital call: $240M — fully subscribed'] },
        { title: 'Regulatory & Legal', metric: '100%', metricLabel: 'Compliance Coverage', bullets: ['All SEC/FINRA filings current — no late filings', 'AML/KYC screening: 100% portfolio covered', 'CrossBridge v. SZL dispute: confidential settlement discussions ongoing'] },
      ],
      evalDisposition: 'pass', evalComposite: 0.93, modelUsed: 'gpt-4-turbo',
      approvalStatement: 'Approved by CFO. Eval composite: 93%. Proof chain verified. LP distribution version excludes exhibit B.',
      nextReviewDate: '2026-05-23T16:00:00Z', proofRef: 'sha256:a2d7e1f4b9c3e6a8d2f5a1b6c9e3d7f2a5b8c1',
    },
    {
      id: 'bp-005', tenantId: 'meridian-group', tenantName: 'Meridian Group', domain: 'Multi-Industry Conglomerate',
      generatedAt: '2026-04-22T11:30:00Z', period: 'Q2 2026', approvedBy: 'CEO, Meridian Group',
      executiveSummary: 'Strong cross-vertical performance. Real estate portfolio expanding in Pacific NW. Revenue friction in legacy division resolved via AI-governed outreach. Legal exposure contained. MirrorEval composite: 91%.',
      kpis: [
        { label: 'Group Revenue', value: '$890M', trend: 'up', delta: '+6% YoY' },
        { label: 'Signals Resolved', value: '23', trend: 'up', delta: 'This quarter' },
        { label: 'AI Actions Approved', value: '18', trend: 'up', delta: '3 pending' },
        { label: 'Proof Coverage', value: '91%', trend: 'stable', delta: 'Target: 95%' },
      ],
      sections: [
        { title: 'Executive Summary', metric: '$890M', metricLabel: 'Q2 Revenue Forecast', bullets: ['Cross-vertical revenue: +6% YoY — ahead of plan', 'A11oy fabric resolved 23 signals autonomously — 18 approved by humans', 'Board-level concerns: Pacific NW expansion timeline delayed 30 days'] },
        { title: 'AI Governance Posture', metric: '91%', metricLabel: 'Proof Coverage', bullets: ['18 autonomous actions approved by humans this quarter', '0 actions executed without approval above Tier 2', 'Proof chain integrity: 100%', 'MirrorEval 2.0 composite: 91% across all governed actions'] },
      ],
      evalDisposition: 'pass', evalComposite: 0.91, modelUsed: 'gpt-4-turbo',
      approvalStatement: 'Approved by CEO. Eval composite: 91%. Proof chain verified. Distributed to full board and A11oy governance team.',
      nextReviewDate: '2026-05-22T11:00:00Z', proofRef: 'sha256:f1c6b3a8d5e2f7c1b4a9d3e8f2b7c4a1d6e9f3',
    },
  ],
};

let genCounter = 6;

export function BoardroomMode() {
  const [data, setData] = useState<BoardroomData>(INITIAL_DATA);
  const [selected, setSelected] = useState<BoardPacket>(INITIAL_DATA.packets[0]);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<BoardPacket | null>(null);

  function generatePacket() {
    setGenerating(true);
    setGenResult(null);
    setTimeout(() => {
      const newPacket: BoardPacket = {
        id: `bp-gen-${genCounter++}`, tenantId: 'gen-tenant', tenantName: 'Generated Enterprise Co.',
        domain: 'Multi-Domain', generatedAt: new Date().toISOString(), period: 'Q2 2026',
        approvedBy: 'AI Governance Lead', evalDisposition: 'pass', evalComposite: 0.91,
        modelUsed: 'gpt-4-turbo', proofRef: `sha256:gen${Math.random().toString(36).slice(2, 18)}`,
        nextReviewDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        executiveSummary: 'Synthesis complete. 12 signals ingested across 3 verticals. 4 workcells resolved. 1 pending human approval. Eval composite: 91%. Proof chain: intact.',
        kpis: [
          { label: 'Signals Processed', value: '12', trend: 'up', delta: 'This period' },
          { label: 'Actions Approved', value: '4', trend: 'up', delta: '1 pending' },
          { label: 'Eval Composite', value: '91%', trend: 'stable', delta: 'MirrorEval 2.0' },
          { label: 'Proof Coverage', value: '94%', trend: 'up', delta: '+2% vs last' },
        ],
        sections: [
          { title: 'Operational Summary', metric: '91%', metricLabel: 'Eval Composite', bullets: ['12 signals processed across revenue, legal, and operations verticals', '4 governed actions approved and executed', '1 action pending Tier 3 human approval', 'Zero policy violations — covenant enforced throughout'] },
        ],
        approvalStatement: 'Auto-generated via A11oy Boardroom Mode. MirrorEval 2.0 composite: 91%. Awaiting final human approval before distribution.',
      };
      setData(d => ({
        ...d,
        packets: [newPacket, ...d.packets],
        summary: { ...d.summary, totalPackets: d.summary.totalPackets + 1 },
      }));
      setGenResult(newPacket);
      setSelected(newPacket);
      setGenerating(false);
    }, 2200);
  }

  return (
    <Layout>
      <PageHeader
        label="BOARDROOM MODE"
        title="Board Packet Generation"
        subtitle="Synthesize every running signal, Workcell, proof packet, and twin state into a single board-ready executive briefing — with MirrorEval 2.0 scoring and full proof chain."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="BOARD PACKETS" value={String(data.summary.totalPackets)} sub="Generated" accent="#c9b787" />
        <KpiCard label="TENANTS SERVED" value={String(data.summary.tenantsServed)} sub="Enterprises" accent="#8a8a8a" />
        <KpiCard label="AVG EVAL SCORE" value={`${Math.round(data.summary.avgEvalComposite * 100)}%`} sub="MirrorEval 2.0" accent="#c9b787" />
        <KpiCard label="GEN LATENCY" value={`${data.generationLatencyMs}ms`} sub="Estimated" accent="#b08d52" />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={generatePacket}
          disabled={generating}
          className="text-xs px-4 py-2 rounded font-medium"
          style={{ backgroundColor: 'rgba(201,183,135,0.15)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.3)', opacity: generating ? 0.6 : 1 }}
        >
          {generating ? 'Generating board packet…' : '+ Generate New Board Packet'}
        </button>
        {genResult && (
          <span className="text-xs" style={{ color: '#c9b787' }}>✓ Generated for {genResult.tenantName}</span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div>
          <SectionTitle>Board Packets ({data.packets.length})</SectionTitle>
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {data.packets.map(p => (
              <Card key={p.id} className={`cursor-pointer hover:opacity-80 ${selected?.id === p.id ? 'ring-1 ring-pink-500/30' : ''}`} onClick={() => setSelected(p)}>
                <div className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{p.tenantName}</div>
                <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.domain} · {p.period}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: DISP_STYLE[p.evalDisposition] ?? '#5e5e5e' }}>{Math.round(p.evalComposite * 100)}% eval</span>
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.approvedBy}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4">
            <SectionTitle>Capabilities</SectionTitle>
            <div className="space-y-1">
              {data.capabilities.map(c => (
                <div key={c} className="flex items-start gap-2 text-xs">
                  <span style={{ color: '#c9b787', flexShrink: 0 }}>✓</span>
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <>
              <SectionTitle>Board Packet — {selected.tenantName}</SectionTitle>
              <div className="flex flex-col gap-4">
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{selected.tenantName}</div>
                      <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selected.domain} · {selected.period}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div style={{ color: DISP_STYLE[selected.evalDisposition] ?? '#5e5e5e' }}>
                        Eval: {Math.round(selected.evalComposite * 100)}%
                      </div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selected.approvedBy}</div>
                    </div>
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{selected.executiveSummary}</p>
                  <div className="text-xs p-2 rounded" style={{ backgroundColor: 'rgba(176,141,82,0.08)', color: '#b08d52', border: '1px solid rgba(176,141,82,0.2)' }}>
                    {selected.approvalStatement}
                  </div>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {selected.kpis.map(kpi => {
                    const ts = TREND_STYLE[kpi.trend] ?? TREND_STYLE.stable;
                    return (
                      <Card key={kpi.label}>
                        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{kpi.label}</div>
                        <div className="font-semibold mt-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{kpi.value}</div>
                        <div className="text-xs" style={{ color: ts.color }}>{ts.symbol} {kpi.delta}</div>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3">
                  {selected.sections.map((sec, i) => (
                    <Card key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{sec.title}</div>
                        {sec.metric && (
                          <div className="text-right">
                            <div className="text-lg font-bold font-mono" style={{ color: 'var(--color-a11oy-gold)' }}>{sec.metric}</div>
                            {sec.metricLabel && <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sec.metricLabel}</div>}
                          </div>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {sec.bullets.map((b, bi) => (
                          <li key={bi} className="flex items-start gap-2 text-xs">
                            <span style={{ color: 'var(--color-a11oy-gold)', flexShrink: 0 }}>·</span>
                            <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  <span>◇ {selected.proofRef}</span>
                  <span>model: {selected.modelUsed}</span>
                  <span>next review: {new Date(selected.nextReviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Select a board packet to view.</div>
          )}
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.2)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)]" /> Governed Environment — board packets synthesized from live signal mesh. All packets proof-chained and eval-scored before approval.
      </div>
    </Layout>
  );
}
