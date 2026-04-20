/**
 * Demo Narrative 2: Security / SOC / Risk Lens
 *
 * Scenario: Vantage Infrastructure Partners — SOC analyst detects a credential
 * stuffing attack against the authentication service. Aegis correlates the
 * signal with a CISA KEV match, assembles the threat context, recommends
 * containment, CISO approves, analyst executes the playbook, and a full
 * evidence record is preserved for compliance.
 *
 * Signal → Context → Recommendation → Approval → Execution → Outcome → Executive Summary
 */

export const SECURITY_SOC_NARRATIVE = {
  id: 'security-soc',
  title: 'Security / SOC / Risk Lens — CISO & Analyst',
  personas: ['ciso-exec', 'soc-analyst'],
  org: 'Vantage Infrastructure Partners',
  duration: '12 minutes',

  scenario: {
    name: 'Credential Stuffing Attack — Auth Service Compromise Attempt',
    summary:
      'A coordinated credential stuffing campaign targeting the Auth Service has been detected. 2,400 failed login attempts in 3 minutes from 14 IPs matching a CISA KEV-flagged botnet. Sentinel correlates identity signals, CVE exposure, and an active MITRE ATT&CK technique T1110.004.',
    attackVector: 'Credential Stuffing via Distributed Botnet',
    mitreTechnique: 'T1110.004 — Credential Stuffing',
    cvssScore: 9.1,
    affectedAssets: ['Auth Service Cluster', 'Customer Identity Provider'],
    containmentWindow: '4 minutes to block; 23 minutes to full remediation',
  },

  entities: {
    org: {
      id: 'demo-org-vantage',
      name: 'Vantage Infrastructure Partners',
      sector: 'Critical Infrastructure',
      employees: 340,
      regulatoryFrameworks: ['SOC 2 Type II', 'ISO 27001', 'NIST CSF'],
    },
    signal: {
      id: 'demo-signal-sec-001',
      type: 'authentication_anomaly',
      severity: 'critical',
      title: 'Credential stuffing — 2,400 failed auth attempts in 3 min from 14 IPs',
      body: 'Auth Service Cluster is under active credential stuffing attack. 2,400 failed login attempts detected from 14 source IPs in a 3-minute window. IP cluster matches CISA KEV-listed botnet signature from 2026-04-10 advisory. MITRE ATT&CK mapping: T1110.004.',
      source: 'Aegis Sentinel — Identity Telemetry',
      confidence: 0.96,
      detectedAt: '2026-04-14T14:07:33Z',
      cisaKevReference: 'KEV-2026-0247',
      cvePrimary: 'CVE-2025-31982',
    },
    context: {
      id: 'demo-context-sec-001',
      summary:
        'Sentinel assembled 8 signals across identity telemetry, endpoint behavior, CVE exposure, and network telemetry.',
      signals: [
        {
          source: 'Identity',
          signal: '2,400 failed auth attempts from 14 IPs in 3 min (normal: 12/hour)',
        },
        {
          source: 'CISA KEV',
          signal: 'IP cluster matches KEV-2026-0247 botnet — listed 4 days ago',
        },
        { source: 'NVD CVE', signal: 'CVE-2025-31982 active in Auth Service v2.8.0 — CVSS 9.1' },
        { source: 'MITRE ATT&CK', signal: 'T1110.004 — Credential Stuffing — Active' },
        { source: 'Endpoint', signal: 'No lateral movement detected — attack is external' },
        { source: 'Network', signal: 'Traffic pattern consistent with distributed botnet' },
        {
          source: 'Identity',
          signal: '3 accounts with elevated privileges showed suspicious session tokens',
        },
        {
          source: 'Business',
          signal: 'Auth Service handles 340,000 active sessions — blast radius: critical',
        },
      ],
    },
    recommendation: {
      id: 'demo-rec-sec-001',
      agent: 'Sentinel',
      action:
        'Immediate IP block for 14 flagged addresses; rate limiting on Auth Service; rotate 3 elevated session tokens; patch Auth Service to v2.9.0 within 24 hours',
      rationale:
        'Active attack with high blast radius. Lateral movement not yet observed — containment window is open. CVE-2025-31982 is actively exploited per CISA KEV. Rate limiting will protect during the patch window. Session token rotation is precautionary for the 3 flagged privileged accounts.',
      confidence: 0.94,
      requiresApproval: true,
      approvalRole: 'executive',
      playbook: 'P-001: Credential Stuffing Containment',
      generatedAt: '2026-04-14T14:08:11Z',
    },
    approval: {
      id: 'demo-approval-sec-001',
      approver: 'Diana Reyes (CISO)',
      decision: 'approved',
      note: 'Execute containment immediately. Escalate patch to P0. Notify legal for regulatory reporting window.',
      approvedAt: '2026-04-14T14:09:47Z',
      durationToApproval: '96 seconds',
    },
    execution: {
      id: 'demo-execution-sec-001',
      analyst: 'Priya Nair',
      steps: [
        {
          step: 1,
          action: '14 IPs blocked at perimeter firewall — confirmed at 14:11:03',
          tool: 'Aegis Firewall Connector',
        },
        {
          step: 2,
          action: 'Auth Service rate limiting enabled — 5 req/min per IP threshold',
          tool: 'Aegis Auth Connector',
        },
        {
          step: 3,
          action: '3 elevated session tokens rotated — users notified via email',
          tool: 'Aegis Identity Connector',
        },
        {
          step: 4,
          action: 'Auth Service v2.9.0 patch scheduled — deployment at 2026-04-15 02:00 UTC',
          tool: 'Alloy Workflow',
        },
        {
          step: 5,
          action: 'Regulatory notification drafted — GDPR 72-hour window logged',
          tool: 'PRISM Compliance Module',
        },
      ],
      completedAt: '2026-04-14T14:30:22Z',
    },
    outcome: {
      id: 'demo-outcome-sec-001',
      summary:
        'Attack contained in 23 minutes. No accounts compromised. No data exfiltration detected. Auth Service patched and restored. Regulatory timeline within 72-hour window.',
      accountsCompromised: 0,
      dataExfiltrated: false,
      minutesToContainment: 23,
      regulatoryStatus: 'Notification filed within 72-hour GDPR window',
      recordedAt: '2026-04-14T15:00:00Z',
    },
    executiveSummary: {
      id: 'demo-exsummary-sec-001',
      headline:
        'Credential stuffing attack contained in 23 minutes — 0 accounts compromised, regulatory notification filed',
      body: 'A coordinated credential stuffing attack was detected, triaged, approved, and contained in a single 23-minute workflow. Sentinel identified the CISA KEV match automatically. The CISO approved containment in 96 seconds. Analyst executed the playbook with full attribution. Evidence package ready for SOC 2 and ISO 27001 review.',
      generatedAt: '2026-04-14T15:02:00Z',
    },
    evidencePackage: {
      id: 'demo-evidence-sec-001',
      artifacts: [
        'IP block confirmation log (firewall audit)',
        'Rate limit enforcement record (auth service logs)',
        'Session token rotation attestation (identity provider log)',
        'Patch deployment schedule (signed by CISO)',
        'GDPR notification draft and timestamp',
        'MITRE ATT&CK technique mapping (T1110.004)',
        'CVE-2025-31982 remediation evidence',
        'Full Aegis audit trail — actor attribution on every step',
      ],
      generatedAt: '2026-04-14T15:05:00Z',
    },
  },

  talkingScript: [
    {
      step: 'Threat Signal',
      duration: '2 min',
      narrative:
        'Priya opens the SOC dashboard — Sentinel has already surfaced a critical alert. 2,400 failed auth attempts in 3 minutes. Sentinel has correlated this with a CISA KEV match and MITRE T1110.004 automatically. No manual research required.',
      showIn: ['aegis/defense/soc-dashboard', 'aegis/incidents/detail'],
      roleSwitch: 'soc-analyst',
    },
    {
      step: 'Threat Context',
      duration: '2 min',
      narrative:
        'The Threat Twin is assembled: 8 signals across identity, endpoint, CVE, and network telemetry. CVSS 9.1. Blast radius: critical — 340,000 active sessions. Priya sees the full exposure picture in one view.',
      showIn: ['aegis/threat-twin', 'aegis/exposure'],
      roleSwitch: 'soc-analyst',
    },
    {
      step: 'Playbook Recommendation',
      duration: '2 min',
      narrative:
        'Sentinel recommends a 4-step containment playbook. Confidence 94%. Rationale cites lateral movement status, patch availability, and session token risk. Priya reviews and escalates for CISO approval.',
      showIn: ['aegis/playbook/P-001', 'aegis/escalation'],
      roleSwitch: 'soc-analyst',
    },
    {
      step: 'CISO Approval',
      duration: '2 min',
      narrative:
        'Diana receives the escalation in her Aegis command view. She approves in 96 seconds — with a note to escalate the patch to P0 and notify legal. No phone call required. The approval is recorded with full attribution.',
      showIn: ['aegis/approval-gate', 'aegis/audit'],
      roleSwitch: 'ciso-exec',
    },
    {
      step: 'Playbook Execution',
      duration: '2 min',
      narrative:
        'Priya executes the playbook. Each step is logged with timestamp and tool attribution. Attack contained in 23 minutes. 0 accounts compromised. Regulatory notification drafted.',
      showIn: ['aegis/playbook/execution', 'aegis/evidence'],
      roleSwitch: 'soc-analyst',
    },
    {
      step: 'Evidence & Summary',
      duration: '2 min',
      narrative:
        "The evidence package is assembled automatically: firewall logs, session rotation attestation, patch schedule, GDPR notification. Ready for SOC 2 review. The executive summary is one click away for Diana's board report.",
      showIn: ['aegis/evidence-package', 'aegis/executive-summary'],
      roleSwitch: 'ciso-exec',
    },
  ],
};

export type SecuritySocNarrative = typeof SECURITY_SOC_NARRATIVE;
