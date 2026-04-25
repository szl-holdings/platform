import {
  type AutonomyMode,
  AutonomyModeToggle,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
  productAccent,
  color,
} from '@szl-holdings/design-system';
import { Activity, AlertTriangle, Shield } from 'lucide-react';
import { useState } from 'react';

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
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('ask-to-act');

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#060b12',
        color: '#c8d8e8',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="border-b" style={{ borderColor: '#1a2535', background: '#0d1520' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}40` }}
            >
              <Shield className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#c8d8e8' }}>
                Aegis — Governed Security Intelligence
              </div>
              <div className="text-xs" style={{ color: '#4a6070' }}>
                Every threat, compliance gap, and risk carries a full proof chain
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest" style={{ color: '#4a6070' }}>
              Autonomy Mode
            </span>
            <AutonomyModeToggle value={autonomyMode} onChange={setAutonomyMode} variant="compact" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
          <span
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: '#4a6070' }}
          >
            Live Threat Intelligence · Deterministic Fallback (Counsel integration active)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Active Threats', value: '3', icon: AlertTriangle, color: color.accent.red },
            { label: 'Open Findings', value: '17', icon: Shield, color: ACCENT },
            { label: 'Hosts Monitored', value: '2,847', icon: Activity, color: color.accent.green },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: '#0d1520', border: '1px solid #1a2535' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs uppercase tracking-wide" style={{ color: '#4a6070' }}>
                  {label}
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color }}>
                {value}
              </div>
            </div>
          ))}
        </div>

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
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
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
              style={{ background: '#060b12', border: '1px solid #243040' }}
            >
              <span className="font-semibold" style={{ color: color.accent.amber }}>
                Suggested containment:
              </span>
              <span style={{ color: '#7a99b8' }}>
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
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              23 accounts with administrative console access are operating without MFA enforcement,
              violating SOC 2 CC6.1 and the firm's access control policy. Remediation velocity
              projects full compliance in 5.4 days — within the 7-day SLA.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: '#060b12', border: '1px solid #243040' }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Affected Accounts', value: '23' },
                  { label: 'Days to Remediate', value: '5.4' },
                  { label: 'SLA Remaining', value: '1.6d' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs" style={{ color: '#4a6070' }}>
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
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              CISA added CVE-2026-1147 to the Known Exploited Vulnerabilities catalog 6 hours ago. A
              public PoC has been available for 48 hours. 8 of the 14 unpatched hosts are Tier-1
              revenue-critical systems requiring a change management approval for emergency
              patching.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: '#060b12', border: '1px solid #243040' }}
            >
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'CVSS Score', value: '9.1', color: color.accent.red },
                  { label: 'Tier-1 Hosts', value: '8', color: color.accent.amber },
                  { label: 'PoC Available', value: '48h', color: color.accent.red },
                  { label: 'Patch ETA', value: '4h', color: color.accent.green },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-xs" style={{ color: '#4a6070' }}>
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
      </div>
    </div>
  );
}
