import { useStandardQuery } from '@szl-holdings/api-client-react';
import { useEffect, useState } from 'react';
import { CognitiveLayout } from './cognitive-layout';

const ACCENT = '#8b7ac8';

type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip';
type VerifierSeverity = 'blocker' | 'major' | 'minor' | 'info';

interface VerifierCheck {
  id: string;
  name: string;
  category: string;
  status: CheckStatus;
  score: number;
  severity: VerifierSeverity;
  description: string;
  evidence: string;
  rule?: string;
  latencyMs: number;
}

interface VerifierResult {
  id: string;
  outputId: string;
  domain: string;
  agentName: string;
  outputSummary: string;
  outputType: 'recommendation' | 'report' | 'plan' | 'action' | 'notification';
  timestamp: string;
  overallScore: number;
  overallStatus: CheckStatus;
  checksTotal: number;
  checksPassed: number;
  checksFailed: number;
  checksWarned: number;
  totalLatencyMs: number;
  checks: VerifierCheck[];
}

const SEEDED_VERIFIER_RESULTS: VerifierResult[] = [
  {
    id: 'vr-001',
    outputId: 'out-9f3a2b1c',
    domain: 'aegis',
    agentName: 'SOC Triage Agent v3.2',
    outputSummary:
      'Threat classification and containment recommendation for ransomware incident #1182.',
    outputType: 'recommendation',
    timestamp: '2026-04-17T08:13:01Z',
    overallScore: 0.91,
    overallStatus: 'pass',
    checksTotal: 8,
    checksPassed: 7,
    checksFailed: 0,
    checksWarned: 1,
    totalLatencyMs: 284,
    checks: [
      {
        id: 'c1',
        name: 'Factual Accuracy',
        category: 'Quality',
        status: 'pass',
        score: 0.94,
        severity: 'blocker',
        description:
          'Verify all cited threat indicators (IP, hash, CVE) are traceable to ingested telemetry.',
        evidence:
          'C2 IP 185.220.101.47 confirmed in Zeek conn.log at 2026-04-17T08:10:44Z. Hash SHA256:a3f1b2... matches known LockBit 3.0 sample in VirusTotal (72/72).',
        rule: 'FACT-001',
        latencyMs: 38,
      },
      {
        id: 'c2',
        name: 'Scope Completeness',
        category: 'Quality',
        status: 'pass',
        score: 0.89,
        severity: 'major',
        description: 'All affected hosts in the blast radius must be enumerated.',
        evidence:
          '14 endpoints identified via EDR lateral movement graph. Cross-referenced with SIEM DHCP logs — no additional hosts missed.',
        rule: 'COMP-001',
        latencyMs: 52,
      },
      {
        id: 'c3',
        name: 'Policy Compliance',
        category: 'Safety',
        status: 'pass',
        score: 0.97,
        severity: 'blocker',
        description:
          'Action must comply with Aegis Incident Response Policy v3.2 and SOC SLA thresholds.',
        evidence:
          'Proposed containment actions align with IR Policy §4.2 (Critical — isolate within 15 min). Current elapsed: 2m 17s. SLA: compliant.',
        rule: 'POL-AEGIS-003',
        latencyMs: 29,
      },
      {
        id: 'c4',
        name: 'Escalation Routing',
        category: 'Safety',
        status: 'pass',
        score: 0.96,
        severity: 'major',
        description:
          'Critical severity incidents must route to CISO and on-call lead within 5 minutes.',
        evidence:
          'Notification dispatched to James Okafor (CISO) and on-call lead at T+1m 44s. Both acknowledged within SLA window.',
        rule: 'ESC-002',
        latencyMs: 22,
      },
      {
        id: 'c5',
        name: 'Containment Risk Assessment',
        category: 'Risk',
        status: 'pass',
        score: 0.88,
        severity: 'major',
        description:
          'Validate that isolation of endpoints does not create unacceptable operational risk.',
        evidence:
          '14 endpoints include 2 OT-adjacent hosts. Agent correctly flagged dependency on OT gateway and included manual override step. Risk accepted by operator.',
        rule: 'RISK-CON-001',
        latencyMs: 41,
      },
      {
        id: 'c6',
        name: 'Confidence Calibration',
        category: 'Quality',
        status: 'warn',
        score: 0.72,
        severity: 'minor',
        description:
          'Agent confidence (0.94) should be compared against historical calibration for this threat class.',
        evidence:
          'Historical calibration for ransomware triage: μ=0.88, σ=0.07. Current confidence 0.94 is within 1σ but high. Monitor for potential over-confidence bias.',
        rule: 'CAL-001',
        latencyMs: 35,
      },
      {
        id: 'c7',
        name: 'Data Source Freshness',
        category: 'Quality',
        status: 'pass',
        score: 0.98,
        severity: 'info',
        description: 'All intelligence feeds used must have been updated within the last 24 hours.',
        evidence:
          'VirusTotal feed: updated 4m ago. Threat Intel API: updated 12m ago. EDR telemetry: live stream. All sources fresh.',
        rule: 'FRESH-001',
        latencyMs: 19,
      },
      {
        id: 'c8',
        name: 'Tenant Isolation',
        category: 'Safety',
        status: 'pass',
        score: 0.99,
        severity: 'blocker',
        description: 'Verify no cross-tenant data leakage in the recommendation payload.',
        evidence:
          'Output scoped to tenant: SZL-AEGIS-001. No cross-tenant references detected in payload. Tenant isolation verified.',
        rule: 'ISO-001',
        latencyMs: 18,
      },
    ],
  },
  {
    id: 'vr-002',
    outputId: 'out-7c2a0e55',
    domain: 'terra',
    agentName: 'Portfolio Valuation Agent v1.8',
    outputSummary:
      'NAV impact analysis for NYC mid-market portfolio under 200bps interest rate shock.',
    outputType: 'report',
    timestamp: '2026-04-15T10:42:00Z',
    overallScore: 0.83,
    overallStatus: 'warn',
    checksTotal: 7,
    checksPassed: 5,
    checksFailed: 1,
    checksWarned: 1,
    totalLatencyMs: 412,
    checks: [
      {
        id: 'c1',
        name: 'Model Input Validation',
        category: 'Quality',
        status: 'pass',
        score: 0.92,
        severity: 'blocker',
        description: 'All 42 portfolio assets must have current cap rates, LTV, and DSCR data.',
        evidence: '42/42 assets have data updated within 30 days. No stale records detected.',
        rule: 'INPUT-001',
        latencyMs: 62,
      },
      {
        id: 'c2',
        name: 'Rate Shock Methodology',
        category: 'Quality',
        status: 'fail',
        score: 0.54,
        severity: 'major',
        description:
          'Shock model must apply rate increase consistently across all asset classes and LTV bands.',
        evidence:
          'Cap rate compression applied correctly for office (8 assets) and retail (6 assets). However, industrial assets (12) used 2024 benchmark data instead of current 2026 comps. Recommend re-run with updated industrial comps.',
        rule: 'MODEL-002',
        latencyMs: 88,
      },
      {
        id: 'c3',
        name: 'Comparable Set Adequacy',
        category: 'Quality',
        status: 'pass',
        score: 0.84,
        severity: 'major',
        description: 'DCF comparable set must include ≥10 recent transactions within 12 months.',
        evidence:
          'Comparable set: 12 assets, 11 within 12 months, 1 from 14 months ago (acceptable given market conditions).',
        rule: 'COMP-002',
        latencyMs: 55,
      },
      {
        id: 'c4',
        name: 'Regulatory Sensitivity Disclosure',
        category: 'Safety',
        status: 'pass',
        score: 0.96,
        severity: 'major',
        description:
          'Report must include sensitivity ranges and model uncertainty disclosures for regulatory compliance.',
        evidence:
          'Sensitivity table present (±50bps range). Monte Carlo confidence interval (90%) included. IFRS 13 Level 3 disclosure clause added.',
        rule: 'REG-TERRA-001',
        latencyMs: 48,
      },
      {
        id: 'c5',
        name: 'Distress Asset Identification',
        category: 'Quality',
        status: 'pass',
        score: 0.91,
        severity: 'major',
        description:
          'All assets entering distress zone (DSCR <1.0 post-shock) must be explicitly flagged.',
        evidence:
          '8 assets identified with post-shock DSCR <1.0. All 8 flagged in report with recommended actions. No missed cases.',
        rule: 'RISK-TERRA-001',
        latencyMs: 71,
      },
      {
        id: 'c6',
        name: 'Confidence Calibration',
        category: 'Quality',
        status: 'warn',
        score: 0.69,
        severity: 'minor',
        description: 'Model confidence (0.87) evaluated against historical valuation accuracy.',
        evidence:
          'Historical MAPE for this model: 8.2%. Current shock scenario is outside historical training distribution (2021–2024). Confidence may be overstated. Recommend expert review.',
        rule: 'CAL-002',
        latencyMs: 53,
      },
      {
        id: 'c7',
        name: 'Tenant Isolation',
        category: 'Safety',
        status: 'pass',
        score: 0.99,
        severity: 'blocker',
        description: 'Report scoped to authorised portfolio only. No cross-portfolio data leakage.',
        evidence: 'Output scoped to SZL-TERRA-NYC-MID portfolio. Isolation verified.',
        rule: 'ISO-001',
        latencyMs: 15,
      },
    ],
  },
  {
    id: 'vr-003',
    outputId: 'out-4d8e1f09',
    domain: 'vessels',
    agentName: 'Voyage Planner Agent v2.1',
    outputSummary: 'Cyclone avoidance reroute recommendation for MV Aurora Constellation.',
    outputType: 'recommendation',
    timestamp: '2026-04-16T14:52:00Z',
    overallScore: 0.97,
    overallStatus: 'pass',
    checksTotal: 6,
    checksPassed: 6,
    checksFailed: 0,
    checksWarned: 0,
    totalLatencyMs: 198,
    checks: [
      {
        id: 'c1',
        name: 'Weather Data Validity',
        category: 'Quality',
        status: 'pass',
        score: 0.99,
        severity: 'blocker',
        description:
          'Cyclone track and intensity data must come from ECMWF or NWS with ≤6h latency.',
        evidence:
          'ECMWF HRES run from 06:00Z (8h ago). NWS NHC advisory #22 from 09:00Z (5h ago). Both within threshold.',
        rule: 'WX-001',
        latencyMs: 28,
      },
      {
        id: 'c2',
        name: 'Route Safety Margin',
        category: 'Safety',
        status: 'pass',
        score: 0.96,
        severity: 'blocker',
        description: 'Recommended route must maintain ≥200nm exclusion radius from cyclone center.',
        evidence:
          'Recommended track via Colombo: minimum distance to cyclone center = 312nm at closest approach. Margin: 112nm above threshold.',
        rule: 'NAV-001',
        latencyMs: 44,
      },
      {
        id: 'c3',
        name: 'Fuel Budget Compliance',
        category: 'Quality',
        status: 'pass',
        score: 0.94,
        severity: 'major',
        description: 'Reroute fuel cost must not exceed voyage charter party fuel budget by >15%.',
        evidence:
          'Additional fuel cost: +$42K (+12.3% vs budget). Within 15% threshold. CII impact: +0.04 (still within CII-B rating).',
        rule: 'FUEL-001',
        latencyMs: 36,
      },
      {
        id: 'c4',
        name: 'Port Availability',
        category: 'Quality',
        status: 'pass',
        score: 0.98,
        severity: 'major',
        description:
          'Diversion port (Colombo) must have confirmed berth availability in the required window.',
        evidence:
          'Colombo JICT berth confirmed via Port Community System API. ETA window 19–21 Apr. Berth reservation: confirmed.',
        rule: 'PORT-001',
        latencyMs: 31,
      },
      {
        id: 'c5',
        name: 'Charterer Notification Requirement',
        category: 'Safety',
        status: 'pass',
        score: 0.97,
        severity: 'major',
        description:
          'Any ETA deviation >24h must trigger mandatory charterer notification per charter party clause 14.',
        evidence:
          'Deviation: +28h. Notification required. Charterer notified at 15:08 UTC. Charter party clause 14 compliant.',
        rule: 'CP-014',
        latencyMs: 22,
      },
      {
        id: 'c6',
        name: 'Tenant Isolation',
        category: 'Safety',
        status: 'pass',
        score: 0.99,
        severity: 'blocker',
        description: 'Recommendation scoped to authorised vessel and voyage only.',
        evidence:
          'Output scoped to vessel: MV-AURORA-CONSTELLATION (IMO 9871234). Isolation verified.',
        rule: 'ISO-001',
        latencyMs: 11,
      },
    ],
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  aegis: '#ef4444',
  vessels: '#4d8fcc',
  terra: '#22c55e',
  prism: '#a855f7',
  default: '#8b7ac8',
};

const CHECK_COLORS: Record<CheckStatus, string> = {
  pass: '#22c55e',
  fail: '#ef4444',
  warn: '#f59e0b',
  skip: '#475569',
};

const SEVERITY_COLORS: Record<VerifierSeverity, string> = {
  blocker: '#ef4444',
  major: '#f97316',
  minor: '#f59e0b',
  info: '#4d8fcc',
};

const CHECK_ICONS: Record<CheckStatus, string> = {
  pass: '✓',
  fail: '✕',
  warn: '⚠',
  skip: '—',
};

const OUTPUT_TYPE_COLORS: Record<VerifierResult['outputType'], string> = {
  recommendation: '#8b7ac8',
  report: '#4d8fcc',
  plan: '#22c55e',
  action: '#ef4444',
  notification: '#f59e0b',
};

function ScoreRing({ score, color, size = 48 }: { score: number; color: string; size?: number }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.22}
        fontWeight={700}
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {(score * 100).toFixed(0)}
      </text>
    </svg>
  );
}

export default function VerifierConsole() {
  const { data: apiResults } = useStandardQuery<VerifierResult[]>({
    queryKey: ['cognitive', 'verifier'],
    queryFn: async () => {
      const res = await fetch('/verifier', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<VerifierResult[]>;
    },
    retry: 0,
    staleTime: 30_000,
  });

  const verifierResults = apiResults ?? SEEDED_VERIFIER_RESULTS;

  const [selectedResult, setSelectedResult] = useState<VerifierResult>(SEEDED_VERIFIER_RESULTS[0]!);
  const [selectedCheck, setSelectedCheck] = useState<VerifierCheck | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (verifierResults.length > 0) {
      const stillSelected = verifierResults.find((r) => r.id === selectedResult.id);
      setSelectedResult(stillSelected ?? verifierResults[0]!);
      setSelectedCheck(null);
    }
  }, [verifierResults]);

  const categories = ['all', ...Array.from(new Set(selectedResult.checks.map((c) => c.category)))];
  const filteredChecks =
    categoryFilter === 'all'
      ? selectedResult.checks
      : selectedResult.checks.filter((c) => c.category === categoryFilter);

  const overallColor = CHECK_COLORS[selectedResult.overallStatus];

  return (
    <CognitiveLayout
      title="Verifier Console"
      subtitle="Inspect per-check pass/fail/score for any agent output. Review the underlying evidence for each verification criterion."
    >
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            Verifier Results ({verifierResults.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {verifierResults.map((result) => {
              const color = CHECK_COLORS[result.overallStatus];
              return (
                <div
                  key={result.id}
                  onClick={() => {
                    setSelectedResult(result);
                    setSelectedCheck(null);
                    setCategoryFilter('all');
                  }}
                  style={{
                    background:
                      selectedResult.id === result.id ? `${ACCENT}10` : 'rgba(255,255,255,0.03)',
                    border:
                      selectedResult.id === result.id
                        ? `1px solid ${ACCENT}55`
                        : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}
                  >
                    <ScoreRing score={result.overallScore} color={color} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: DOMAIN_COLORS[result.domain] ?? DOMAIN_COLORS.default,
                            background: `${DOMAIN_COLORS[result.domain] ?? DOMAIN_COLORS.default}15`,
                            padding: '1px 6px',
                            borderRadius: 3,
                          }}
                        >
                          {result.domain}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: OUTPUT_TYPE_COLORS[result.outputType],
                            background: `${OUTPUT_TYPE_COLORS[result.outputType]}15`,
                            padding: '1px 6px',
                            borderRadius: 3,
                          }}
                        >
                          {result.outputType}
                        </span>
                      </div>
                      <div
                        style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}
                      >
                        {result.agentName}
                      </div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
                        {new Date(result.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, marginBottom: 8 }}>
                    {result.outputSummary}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#22c55e' }}>✓ {result.checksPassed}</span>
                    {result.checksFailed > 0 && (
                      <span style={{ fontSize: 10, color: '#ef4444' }}>
                        ✕ {result.checksFailed}
                      </span>
                    )}
                    {result.checksWarned > 0 && (
                      <span style={{ fontSize: 10, color: '#f59e0b' }}>
                        ⚠ {result.checksWarned}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: '#334155', marginLeft: 'auto' }}>
                      {result.totalLatencyMs}ms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${overallColor}30`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <ScoreRing score={selectedResult.overallScore} color={overallColor} size={64} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: DOMAIN_COLORS[selectedResult.domain] ?? DOMAIN_COLORS.default,
                      background: `${DOMAIN_COLORS[selectedResult.domain] ?? DOMAIN_COLORS.default}15`,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {selectedResult.domain.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: OUTPUT_TYPE_COLORS[selectedResult.outputType],
                      background: `${OUTPUT_TYPE_COLORS[selectedResult.outputType]}15`,
                      padding: '2px 8px',
                      borderRadius: 4,
                      textTransform: 'capitalize',
                    }}
                  >
                    {selectedResult.outputType}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: overallColor,
                      background: `${overallColor}15`,
                      padding: '2px 8px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedResult.overallStatus}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                  {selectedResult.agentName}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 8 }}>
                  {selectedResult.outputSummary}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#475569' }}>
                  <span>
                    Output:{' '}
                    <span style={{ fontFamily: 'monospace', color: '#334155' }}>
                      {selectedResult.outputId}
                    </span>
                  </span>
                  <span>{new Date(selectedResult.timestamp).toLocaleString()}</span>
                  <span>
                    Total latency:{' '}
                    <span style={{ color: '#94a3b8' }}>{selectedResult.totalLatencyMs}ms</span>
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {[
                  { label: 'Passed', value: selectedResult.checksPassed, color: '#22c55e' },
                  { label: 'Failed', value: selectedResult.checksFailed, color: '#ef4444' },
                  { label: 'Warned', value: selectedResult.checksWarned, color: '#f59e0b' },
                ].map((m) => (
                  <div
                    key={m.label}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 7,
                      padding: '8px 10px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 9, color: '#475569' }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  background: categoryFilter === cat ? ACCENT : 'rgba(255,255,255,0.05)',
                  color: categoryFilter === cat ? '#fff' : '#64748b',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: selectedCheck ? '1fr 340px' : '1fr',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredChecks.map((check) => {
                const color = CHECK_COLORS[check.status];
                return (
                  <div
                    key={check.id}
                    onClick={() => setSelectedCheck(selectedCheck?.id === check.id ? null : check)}
                    style={{
                      background:
                        selectedCheck?.id === check.id ? `${color}0c` : 'rgba(255,255,255,0.03)',
                      border:
                        selectedCheck?.id === check.id
                          ? `1px solid ${color}55`
                          : '1px solid rgba(255,255,255,0.07)',
                      borderLeft: `3px solid ${color}`,
                      borderRadius: 8,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: `${color}20`,
                          border: `2px solid ${color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9,
                          color,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {CHECK_ICONS[check.status]}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                            {check.name}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: SEVERITY_COLORS[check.severity],
                              background: `${SEVERITY_COLORS[check.severity]}15`,
                              padding: '1px 6px',
                              borderRadius: 3,
                              textTransform: 'uppercase',
                            }}
                          >
                            {check.severity}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              color: '#475569',
                              background: 'rgba(255,255,255,0.05)',
                              padding: '1px 6px',
                              borderRadius: 3,
                            }}
                          >
                            {check.category}
                          </span>
                          {check.rule && (
                            <span
                              style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace' }}
                            >
                              {check.rule}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color }}>
                            {(check.score * 100).toFixed(0)}
                          </div>
                          <div style={{ fontSize: 9, color: '#475569' }}>score</div>
                        </div>
                        <div style={{ width: 32, height: 32 }}>
                          <ScoreRing score={check.score} color={color} size={32} />
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                      {check.description}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#475569',
                        lineHeight: 1.4,
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 4,
                        padding: '6px 8px',
                        borderLeft: `2px solid ${color}40`,
                      }}
                    >
                      {check.evidence.length > 140
                        ? `${check.evidence.slice(0, 140)}…`
                        : check.evidence}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 10, color: '#334155' }}>
                      Latency: {check.latencyMs}ms
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedCheck && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${CHECK_COLORS[selectedCheck.status]}30`,
                  borderRadius: 12,
                  padding: 18,
                  alignSelf: 'flex-start',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Check Detail
                  </div>
                  <button
                    onClick={() => setSelectedCheck(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#475569',
                      cursor: 'pointer',
                      fontSize: 16,
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <ScoreRing
                    score={selectedCheck.score}
                    color={CHECK_COLORS[selectedCheck.status]}
                    size={56}
                  />
                  <div>
                    <div
                      style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}
                    >
                      {selectedCheck.name}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: CHECK_COLORS[selectedCheck.status],
                        }}
                      >
                        {selectedCheck.status.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: SEVERITY_COLORS[selectedCheck.severity],
                          background: `${SEVERITY_COLORS[selectedCheck.severity]}15`,
                          padding: '1px 6px',
                          borderRadius: 3,
                          textTransform: 'uppercase',
                        }}
                      >
                        {selectedCheck.severity}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 4,
                      }}
                    >
                      Description
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                      {selectedCheck.description}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 4,
                      }}
                    >
                      Evidence
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#94a3b8',
                        lineHeight: 1.6,
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${CHECK_COLORS[selectedCheck.status]}30`,
                        borderRadius: 7,
                        padding: 10,
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {selectedCheck.evidence}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Category', value: selectedCheck.category },
                      { label: 'Rule', value: selectedCheck.rule ?? '—' },
                      { label: 'Latency', value: `${selectedCheck.latencyMs}ms` },
                      { label: 'Score', value: `${(selectedCheck.score * 100).toFixed(1)}%` },
                    ].map((row) => (
                      <div
                        key={row.label}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 6,
                          padding: '8px 10px',
                        }}
                      >
                        <div style={{ fontSize: 9, color: '#475569', marginBottom: 2 }}>
                          {row.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#e2e8f0', fontFamily: 'monospace' }}>
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CognitiveLayout>
  );
}
