import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  GovernedCockpitShell,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
  productAccent,
  color,
} from '@szl-holdings/design-system';
import { Activity, AlertTriangle, Shield, Zap } from 'lucide-react';
import { cpsApi } from '@/lib/cps-api';

const ACCENT = productAccent.aegis;

const NOW = new Date().toISOString();
const FRESH_2M = new Date(Date.now() - 2 * 60_000).toISOString();
const FRESH_8M = new Date(Date.now() - 8 * 60_000).toISOString();
const AGING_25M = new Date(Date.now() - 25 * 60_000).toISOString();

const THREAT_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-1',
    label: 'EDR Alert: Lateral Movement Detected',
    type: 'signal',
    timestamp: FRESH_2M,
    excerpt:
      'Mimikatz-pattern credential harvesting on HOST-042, C2 beacon to 185.220.x.x confirmed.',
  },
  {
    id: 'ev-2',
    label: 'SIEM Correlation Rule R-4417',
    type: 'api',
    timestamp: FRESH_2M,
    excerpt: '3 of 5 MITRE ATT&CK T1059 sub-techniques observed in 6-minute window.',
  },
  {
    id: 'ev-3',
    label: 'Threat Intel Feed: FS-ISAC',
    type: 'document',
    timestamp: FRESH_8M,
    excerpt:
      'TTP cluster matches APT-29 campaign targeting financial services. IoCs shared cross-sector.',
  },
  {
    id: 'ev-4',
    label: 'Analyst Review — SOC Tier 2',
    type: 'user',
    timestamp: AGING_25M,
    excerpt: 'Reviewed and escalated to Tier 3. Containment pre-authorised per IR policy IR-12.',
  },
];

const COMPLIANCE_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-c1',
    label: 'MFA Audit Export — IAM System',
    type: 'api',
    timestamp: FRESH_8M,
    excerpt: '23 privileged accounts missing MFA on admin console. Bulk export confirms scope.',
  },
  {
    id: 'ev-c2',
    label: 'SOC 2 CC6.1 Control Mapping',
    type: 'document',
    timestamp: AGING_25M,
    excerpt:
      'Logical access controls require MFA for all privileged access. Non-compliance triggers finding.',
  },
  {
    id: 'ev-c3',
    label: 'Remediation Velocity Model',
    type: 'model',
    timestamp: NOW,
    excerpt:
      'At current ticket burn rate (4.2/day), full remediation will take 5.4 days — within 7-day SLA.',
  },
];

const RISK_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-r1',
    label: 'Patch Management Telemetry',
    type: 'api',
    timestamp: FRESH_8M,
    excerpt:
      'CVE-2026-1147 (CVSS 9.1) unpatched on 14 production hosts. Exploit PoC public since 48h.',
  },
  {
    id: 'ev-r2',
    label: 'Asset Criticality Registry',
    type: 'document',
    timestamp: AGING_25M,
    excerpt:
      '8 of 14 affected hosts classified Tier-1 (revenue-critical). SLA: patch within 24h of disclosure.',
  },
  {
    id: 'ev-r3',
    label: 'Threat Feed: ExploitDB + CISA KEV',
    type: 'signal',
    timestamp: FRESH_2M,
    excerpt: 'CISA added CVE-2026-1147 to Known Exploited Vulnerabilities catalog 6h ago.',
  },
];

export default function GovernedCockpit() {
  return (
    <GovernedCockpitShell
      accentColor={ACCENT}
      headerIcon={<Shield className="w-4 h-4" style={{ color: ACCENT }} />}
      headerTitle="Sentra — Governed Security Intelligence"
      headerSubtitle="Every threat, compliance gap, and risk carries a full proof chain"
      liveIndicatorLabel="Live Threat Intelligence · Deterministic Fallback (Counsel integration active)"
      defaultAutonomyMode="ask-to-act"
      kpiCards={[
        { label: 'Active Threats', value: '3', icon: AlertTriangle, color: color.accent.red },
        { label: 'Open Findings', value: '17', icon: Shield, color: ACCENT },
        { label: 'Hosts Monitored', value: '2,847', icon: Activity, color: color.accent.green },
      ]}
    >
      {(autonomyMode, setAutonomyMode) => (
        <>

        <ProofEnvelope
          title="Critical: Active Lateral Movement — APT-29 TTP Cluster"
          accentColor={color.accent.red}
          evidence={THREAT_EVIDENCE}
          timestamp={FRESH_2M}
          confidence={91}
          policyState={'requires-approval' as PolicyState}
          policyReason="Containment action exceeds auto-remediation threshold — CISO approval required"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--gi-text-primary)' }}>
              Credential harvesting activity consistent with APT-29 TTPs detected on HOST-042 in the
              treasury network segment. C2 beacon confirmed to threat-actor-controlled
              infrastructure. Lateral movement to 3 adjacent hosts detected.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['T1059.001', 'T1003.001', 'T1071.001', 'TA0006'].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{
                    background: 'rgba(201,96,112,0.09)',
                    color: color.accent.red,
                    border: '1px solid rgba(201,96,112,0.19)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div
              className="mt-3 rounded-lg p-3 text-xs"
              style={{ background: 'var(--gi-bg-base)', border: '1px solid var(--gi-border-default)' }}
            >
              <span className="font-semibold" style={{ color: color.accent.amber }}>
                Suggested containment:
              </span>
              <span style={{ color: 'var(--gi-text-secondary)' }}>
                {' '}
                Isolate HOST-042, force password reset for 4 harvested accounts, block C2 IP range
                at perimeter firewall. Pre-authorised under IR-12 subject to CISO sign-off.
              </span>
            </div>
          </div>
        </ProofEnvelope>

        <ProofEnvelope
          title="Compliance Gap: 23 Privileged Accounts Missing MFA"
          accentColor={ACCENT}
          evidence={COMPLIANCE_EVIDENCE}
          timestamp={FRESH_8M}
          confidence={97}
          policyState={'allowed' as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--gi-text-primary)' }}>
              23 accounts with administrative console access are operating without MFA enforcement,
              violating SOC 2 CC6.1 and the firm's access control policy. Remediation velocity
              projects full compliance in 5.4 days — within the 7-day SLA.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: 'var(--gi-bg-base)', border: '1px solid var(--gi-border-default)' }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Affected Accounts', value: '23' },
                  { label: 'Days to Remediate', value: '5.4' },
                  { label: 'SLA Remaining', value: '1.6d' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs" style={{ color: 'var(--gi-text-muted)' }}>
                      {label}
                    </div>
                    <div className="text-base font-bold" style={{ color: ACCENT }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ProofEnvelope>

        <ProofEnvelope
          title="Vulnerability: CVE-2026-1147 (CVSS 9.1) — 14 Production Hosts Unpatched"
          accentColor={color.accent.amber}
          evidence={RISK_EVIDENCE}
          timestamp={FRESH_2M}
          confidence={88}
          policyState={'requires-approval' as PolicyState}
          policyReason="Emergency patch window requires change management approval — CAB notified"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--gi-text-primary)' }}>
              CISA added CVE-2026-1147 to the Known Exploited Vulnerabilities catalog 6 hours ago. A
              public PoC has been available for 48 hours. 8 of the 14 unpatched hosts are Tier-1
              revenue-critical systems requiring a change management approval for emergency
              patching.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: 'var(--gi-bg-base)', border: '1px solid var(--gi-border-default)' }}
            >
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'CVSS Score', value: '9.1', color: color.accent.red },
                  { label: 'Tier-1 Hosts', value: '8', color: color.accent.amber },
                  { label: 'PoC Available', value: '48h', color: color.accent.red },
                  { label: 'Patch ETA', value: '4h', color: color.accent.green },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-xs" style={{ color: 'var(--gi-text-muted)' }}>
                      {label}
                    </div>
                    <div className="text-base font-bold" style={{ color }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ProofEnvelope>

        <CpsContainmentEnvelopes autonomyMode={autonomyMode} onAutonomyChange={setAutonomyMode} />
        </>
      )}
    </GovernedCockpitShell>
  );
}

function CpsContainmentEnvelopes({
  autonomyMode,
  onAutonomyChange,
}: {
  autonomyMode: string;
  onAutonomyChange: (mode: string) => void;
}) {
  const { data } = useStandardQuery({
    queryKey: ['cps-executive-cockpit'],
    queryFn: () => cpsApi.executive.status(),
    retry: false,
  });

  const activeContainments: Array<{
    id: string;
    payloadId: string;
    status: string;
    startedAt: string;
    detect: { confidence: number; signals: Array<{ severity: string; description: string; timestamp: string }> } | null;
    decide: { riskLevel: string; businessImpact: string; reasoning: string } | null;
    governanceChecks: Array<{ rule: string; passed: boolean; detail: string }>;
    approvals: Array<{ tier: string; status: string; deadlineAt: string }>;
    linkedCaseId: string | null;
  }> = data?.activeContainments ?? [];

  const summary = data?.summary;

  if (!summary && activeContainments.length === 0) return null;

  const containmentEvidence: EvidenceSource[] = activeContainments.flatMap((run) =>
    (run.detect?.signals ?? []).map((sig, i) => ({
      id: `cps-${run.id}-sig-${i}`,
      label: sig.description,
      type: 'signal' as const,
      timestamp: sig.timestamp,
      excerpt: `Severity: ${sig.severity} — detected by CPS payload ${run.payloadId}`,
    })),
  );

  if (containmentEvidence.length === 0 && activeContainments.length === 0) return null;

  const hasPendingApproval = activeContainments.some((r) =>
    r.approvals.some((a) => a.status === 'pending'),
  );
  const maxRisk = activeContainments.reduce(
    (max, r) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const level = r.decide?.riskLevel ?? 'low';
      return (riskOrder[level as keyof typeof riskOrder] ?? 0) > (riskOrder[max as keyof typeof riskOrder] ?? 0) ? level : max;
    },
    'low',
  );
  const avgConfidence = activeContainments.length > 0
    ? Math.round(activeContainments.reduce((sum, r) => sum + (r.detect?.confidence ?? 0), 0) / activeContainments.length * 100)
    : 0;

  const policyState: PolicyState = hasPendingApproval
    ? 'requires-approval'
    : 'allowed';
  const accentForRisk = maxRisk === 'critical' ? color.accent.red : maxRisk === 'high' ? color.accent.amber : ACCENT;

  return (
    <ProofEnvelope
      title={`CPS Active Containment — ${activeContainments.length} Run(s) in Progress`}
      accentColor={accentForRisk}
      evidence={containmentEvidence.length > 0 ? containmentEvidence : [{
        id: 'cps-summary',
        label: 'CPS Executive Summary',
        type: 'api' as const,
        timestamp: new Date().toISOString(),
        excerpt: `${summary?.totalPayloads ?? 0} payloads registered, ${summary?.totalRuns ?? 0} total runs, ${summary?.pendingApprovals ?? 0} pending approvals`,
      }]}
      timestamp={activeContainments[0]?.startedAt ?? new Date().toISOString()}
      confidence={avgConfidence}
      policyState={policyState}
      policyReason={hasPendingApproval ? 'CPS containment actions awaiting tiered approval' : undefined}
      autonomyMode={autonomyMode}
      onAutonomyChange={onAutonomyChange}
    >
      <div className="space-y-3">
        {activeContainments.map((run) => (
          <div
            key={run.id}
            className="rounded-lg p-3"
            style={{ background: 'var(--gi-bg-base)', border: '1px solid var(--gi-border-default)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5" style={{ color: accentForRisk }} />
              <span className="text-xs font-medium" style={{ color: 'var(--gi-text-primary)' }}>
                {run.payloadId}
              </span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(201,96,112,0.09)', color: color.accent.red }}
              >
                {run.status}
              </span>
              {run.linkedCaseId && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${ACCENT}15`, color: ACCENT }}>
                  {run.linkedCaseId}
                </span>
              )}
            </div>
            {run.decide && (
              <p className="text-xs mb-2" style={{ color: 'var(--gi-text-secondary)' }}>
                {run.decide.businessImpact}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {run.governanceChecks.map((gc) => (
                <span
                  key={gc.rule}
                  className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                  style={{
                    background: gc.passed ? `${ACCENT}12` : 'rgba(201,96,112,0.09)',
                    color: gc.passed ? ACCENT : color.accent.red,
                    border: `1px solid ${gc.passed ? `${ACCENT}25` : 'rgba(201,96,112,0.19)'}`,
                  }}
                >
                  {gc.passed ? '✓' : '✗'} {gc.rule}
                </span>
              ))}
            </div>
          </div>
        ))}

        {summary && (
          <div
            className="rounded-lg p-3"
            style={{ background: 'var(--gi-bg-base)', border: '1px solid var(--gi-border-default)' }}
          >
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Payloads', value: String(summary.totalPayloads ?? 0), color: ACCENT },
                { label: 'Active', value: String(summary.activeContainments ?? 0), color: color.accent.red },
                { label: 'Pending', value: String(summary.pendingApprovals ?? 0), color: color.accent.amber },
                { label: 'Completed (24h)', value: String(summary.completedLast24h ?? 0), color: color.accent.green },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="text-xs" style={{ color: 'var(--gi-text-muted)' }}>{label}</div>
                  <div className="text-base font-bold" style={{ color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProofEnvelope>
  );
}
