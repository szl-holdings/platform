import type { ProofRecord } from '@/components/ProofDrawer';

export type CaseSeverity = 'critical' | 'high' | 'medium' | 'info';
export type CaseDomain = 'Aegis' | 'Vessels' | 'Terra' | 'Counsel' | 'Carlota Jo';

export interface ApprovalContext {
  policyId: string;
  policyName: string;
  covenantText: string;
  requiredRoles: string[];
  escalationPath: string;
  slaWindow: string;
  riskClass: 'tier-1' | 'tier-2' | 'tier-3';
}

export interface DecisionCase {
  id: string;
  title: string;
  summary: string;
  severity: CaseSeverity;
  domain: CaseDomain;
  owner: string;
  ownerRole: string;
  openedAt: string;
  currentStage: number;
  signal: {
    label: string;
    sourceSystem: string;
    receivedAt: string;
    raw: Record<string, string | number>;
  };
  recommendation: {
    title: string;
    body: string;
    confidence: number;
    model: string;
    actions: string[];
    sources: { id: string; label: string; type: string }[];
  };
  simulation: {
    runs: number;
    expectedOutcome: string;
    p10: string;
    p50: string;
    p90: string;
    notes: string;
  };
  approval: ApprovalContext;
  execution: {
    workflowId: string;
    steps: { label: string; status: 'queued' | 'running' | 'complete'; durationMs?: number }[];
  };
  proof: ProofRecord;
  outcome: {
    actual: string;
    predictionDelta: string;
    measuredAt: string;
    successCriteria: string;
  };
  learning: {
    summary: string;
    calibrationNote: string;
    indexedAt: string;
  };
}

export const DECISION_CASES: DecisionCase[] = [
  {
    id: 'DC-2026-0419-001',
    title: 'Port facility breach + tanker route deviation',
    summary:
      'Aegis flagged unauthorized network access at Rotterdam partner port; Vessels detected an AIS gap on an inbound tanker. Cross-domain correlation triggered a governed isolation recommendation.',
    severity: 'critical',
    domain: 'Aegis',
    owner: 'J. van der Berg',
    ownerRole: 'SOC Lead',
    openedAt: '19 Apr 2026 08:14',
    currentStage: 4,
    signal: {
      label: 'Unauthorized auth events on port-edge bastion',
      sourceSystem: 'Aegis SOC Feed · Prism Bus',
      receivedAt: '19 Apr 2026 08:14:22',
      raw: {
        signal_id: 'SIG-20260419-001',
        mitre_technique: 'T1071.001',
        affected_asset: 'auth-svc (prod)',
        peer_signal: 'VES-AIS-DRIFT-447',
        correlation_id: 'CORR-SF1-SF6',
      },
    },
    recommendation: {
      title: 'Isolate auth-svc edge bastion and hold inbound vessel pending verification',
      body: 'Sever northbound traffic from the partner port-edge bastion, raise berth-clearance hold on tanker IMO-9837442 until AIS reconciliation completes, and escalate to SOC Lead for human-in-loop approval.',
      confidence: 0.94,
      model: 'gpt-4o-mini · 2025-07-01',
      actions: [
        'Isolate auth-svc bastion (network segment 10.42.0.0/24)',
        'Hold berth clearance for tanker IMO-9837442',
        'Notify port operator + SOC Lead via on-call channel',
        'Open evidence envelope linked to correlation CORR-SF1-SF6',
      ],
      sources: [
        { id: 'SIG-20260419-001', label: 'Aegis threat feed event', type: 'signal' },
        { id: 'VES-AIS-DRIFT-447', label: 'Vessels AIS anomaly', type: 'signal' },
        { id: 'ASSET-AUTH-SVC', label: 'Asset registry: auth-svc (prod)', type: 'asset' },
        { id: 'POL-AEGIS-ISOLATION', label: 'Covenant: tier-1 isolation policy', type: 'policy' },
      ],
    },
    simulation: {
      runs: 5000,
      expectedOutcome: 'Containment within 14 minutes · 1.2% revenue impact',
      p10: '8 min · 0.4% revenue impact',
      p50: '14 min · 1.2% revenue impact',
      p90: '32 min · 4.1% revenue impact',
      notes:
        'Monte Carlo over historical port-isolation playbooks. Worst-case driven by AIS reconciliation latency from partner network.',
    },
    approval: {
      policyId: 'POL-AEGIS-ISOLATION-T1',
      policyName: 'Tier-1 Cross-Domain Isolation',
      covenantText:
        'Any action that simultaneously affects an Aegis production asset and a Vessels berth-clearance hold requires SOC Lead approval, evidence envelope linkage, and a 2-hour SLA window before automated escalation.',
      requiredRoles: ['soc_lead', 'ops_analyst'],
      escalationPath: 'SOC Lead → Head of Security → CTO',
      slaWindow: '2h',
      riskClass: 'tier-1',
    },
    execution: {
      workflowId: 'WF-ISOLATE-CROSSDOMAIN-447',
      steps: [
        { label: 'Pre-flight policy re-check', status: 'complete', durationMs: 320 },
        { label: 'Isolate bastion network segment', status: 'running' },
        { label: 'Place berth-clearance hold', status: 'queued' },
        { label: 'Notify on-call channel', status: 'queued' },
        { label: 'Seal evidence envelope', status: 'queued' },
      ],
    },
    proof: {
      id: 'PCH-DC-2026-0419-001',
      sourceSystem: 'Aegis SOC Feed',
      sourceDomain: 'Aegis',
      signalType: 'threat_intelligence',
      confidence: 0.94,
      model: 'gpt-4o-mini',
      modelVersion: '2025-07-01',
      reviewState: 'unreviewed',
      exportSafety: 'pending_review',
      policyChecks: [
        { label: 'Role: soc_lead — permitted', passed: true },
        { label: 'Domain: Aegis + Vessels — in scope', passed: true },
        { label: 'Action: tier-1 isolation — permitted with approval', passed: true },
        { label: 'Human-in-loop gate: SOC Lead approval required', passed: true },
        {
          label: 'Review state: must be human_reviewed before export',
          passed: false,
          note: 'Awaiting reviewer sign-off',
        },
        { label: 'Export safety: no PII in output', passed: true },
      ],
      chainLinks: [
        {
          id: 'c1',
          event: 'Signal ingested from Aegis threat feed',
          actor: 'System / Prism Bus',
          timestamp: '19 Apr 2026 08:14:22',
          hash: 'sha256:a3f7b2c1d…',
        },
        {
          id: 'c2',
          event: 'Cross-domain correlation with Vessels AIS',
          actor: 'System / Signal Fusion',
          timestamp: '19 Apr 2026 08:14:24',
          hash: 'sha256:9e1d4f2a8…',
        },
        {
          id: 'c3',
          event: 'AI recommendation generated',
          actor: 'Model: gpt-4o-mini',
          timestamp: '19 Apr 2026 08:14:27',
          hash: 'sha256:b4e8f3c6d…',
        },
        {
          id: 'c4',
          event: 'Policy gate evaluated — approval required',
          actor: 'System / Covenant Policy',
          timestamp: '19 Apr 2026 08:14:29',
          hash: 'sha256:c2a9d1f7e…',
        },
      ],
      metadata: {
        'Signal ID': 'SIG-20260419-001',
        'MITRE Technique': 'T1071.001',
        'Affected asset': 'auth-svc (prod)',
        'SLA window': '2h',
        'Correlation ID': 'CORR-SF1-SF6',
      },
    },
    outcome: {
      actual: 'Containment in 12 min · 0.9% revenue impact',
      predictionDelta: '−2 min vs P50 · −0.3 pts vs P50',
      measuredAt: '19 Apr 2026 08:32',
      successCriteria: 'Containment under 30 min, no PII exposure, evidence envelope sealed',
    },
    learning: {
      summary:
        'Cross-domain correlation rule SF1↔SF6 produced a high-confidence recommendation that beat the P50 prediction. Calibration drift remains under 4%.',
      calibrationNote: 'Confidence calibration error: 0.03 (within tolerance)',
      indexedAt: '19 Apr 2026 08:33',
    },
  },
  {
    id: 'DC-2026-0418-014',
    title: 'Distress property bid window — Cape Town',
    summary:
      'Terra surfaced a distressed asset with a 36-hour bid window. Capital allocation engine recommends a tier-2 bid below floor, conditional on legal review.',
    severity: 'high',
    domain: 'Terra',
    owner: 'S. Mokoena',
    ownerRole: 'Capital Lead',
    openedAt: '18 Apr 2026 11:02',
    currentStage: 2,
    signal: {
      label: 'Distressed asset — TER-DST-2026-447',
      sourceSystem: 'Terra · Distress Pipeline',
      receivedAt: '18 Apr 2026 11:02:18',
      raw: {
        asset_id: 'TER-DST-2026-447',
        location: 'Cape Town · Sea Point',
        listing_floor: 'ZAR 18.4M',
        bid_window_close: '20 Apr 2026 23:00',
      },
    },
    recommendation: {
      title: 'Submit conditional bid at 0.84× floor with legal contingency',
      body: 'Place a tier-2 bid at ZAR 15.5M conditional on a 72-hour legal title review through Counsel. Reserve secondary capital line for top-up if title is clean.',
      confidence: 0.81,
      model: 'gpt-4o · 2025-09-12',
      actions: [
        'Draft bid letter with title-clean contingency clause',
        'Open Counsel matter for title review',
        'Reserve ZAR 4M secondary capital line',
        'Schedule physical walk-through within 24h',
      ],
      sources: [
        { id: 'TER-DST-2026-447', label: 'Terra distress signal', type: 'signal' },
        { id: 'TER-COMP-2026-Q1', label: 'Cape Town comp bands Q1 2026', type: 'dataset' },
        { id: 'POL-CAP-TIER2', label: 'Covenant: tier-2 capital allocation', type: 'policy' },
      ],
    },
    simulation: {
      runs: 4000,
      expectedOutcome: 'Net IRR 18.4% · downside-protected at 9.2%',
      p10: 'Net IRR 9.2%',
      p50: 'Net IRR 18.4%',
      p90: 'Net IRR 27.1%',
      notes:
        'Sensitivities driven by title-defect probability (8%) and refurbishment cost variance (±18%).',
    },
    approval: {
      policyId: 'POL-CAP-TIER2-PROPERTY',
      policyName: 'Tier-2 Property Capital Allocation',
      covenantText:
        'Single-asset bids above ZAR 10M require Capital Lead approval and a linked Counsel matter. Allocation cannot exceed 4% of available capital line without CFO sign-off.',
      requiredRoles: ['capital_lead', 'legal_reviewer'],
      escalationPath: 'Capital Lead → CFO → Investment Committee',
      slaWindow: '24h',
      riskClass: 'tier-2',
    },
    execution: {
      workflowId: 'WF-CAPITAL-BID-CT447',
      steps: [
        { label: 'Generate bid letter draft', status: 'queued' },
        { label: 'Open Counsel matter', status: 'queued' },
        { label: 'Reserve capital line', status: 'queued' },
        { label: 'Notify Capital Committee', status: 'queued' },
      ],
    },
    proof: {
      id: 'PCH-DC-2026-0418-014',
      sourceSystem: 'Terra Intelligence',
      sourceDomain: 'Terra',
      signalType: 'capital_allocation',
      confidence: 0.81,
      model: 'gpt-4o',
      modelVersion: '2025-09-12',
      reviewState: 'unreviewed',
      exportSafety: 'pending_review',
      policyChecks: [
        { label: 'Role: capital_lead — permitted', passed: true },
        { label: 'Tier-2 allocation gate: requires legal review', passed: true },
        { label: 'Allocation under 4% of capital line', passed: true },
        {
          label: 'Counsel matter: not yet opened',
          passed: false,
          note: 'Will be opened on approval',
        },
        { label: 'CFO sign-off: not required at this size', passed: true },
      ],
      chainLinks: [
        {
          id: 'c1',
          event: 'Distress signal ingested',
          actor: 'System / Terra',
          timestamp: '18 Apr 2026 11:02:18',
          hash: 'sha256:7c1a9d…',
        },
        {
          id: 'c2',
          event: 'Comp band correlation',
          actor: 'System / Capital Engine',
          timestamp: '18 Apr 2026 11:02:21',
          hash: 'sha256:5e9b3f…',
        },
        {
          id: 'c3',
          event: 'Recommendation generated',
          actor: 'Model: gpt-4o',
          timestamp: '18 Apr 2026 11:02:25',
          hash: 'sha256:1f4a6c…',
        },
      ],
      metadata: {
        'Asset ID': 'TER-DST-2026-447',
        'Listing floor': 'ZAR 18.4M',
        'Recommended bid': 'ZAR 15.5M',
        'Bid window close': '20 Apr 2026 23:00',
      },
    },
    outcome: {
      actual: 'Pending — bid window open until 20 Apr 23:00',
      predictionDelta: '—',
      measuredAt: '—',
      successCriteria: 'Bid submitted within window with legal contingency intact',
    },
    learning: {
      summary: 'Awaiting outcome. Will fold into Cape Town distress calibration table on close.',
      calibrationNote: 'Pending',
      indexedAt: '—',
    },
  },
  {
    id: 'DC-2026-0417-022',
    title: 'Counsel matter intake — vendor breach notice',
    summary:
      'Counsel intake flagged a vendor breach notice that triggers a 72-hour data subject notification clock. Recommendation drafted with covenant context.',
    severity: 'medium',
    domain: 'Counsel',
    owner: 'L. Nkosi',
    ownerRole: 'Counsel Lead',
    openedAt: '17 Apr 2026 14:48',
    currentStage: 6,
    signal: {
      label: 'Vendor breach notification — VND-2026-088',
      sourceSystem: 'Counsel · Intake Channel',
      receivedAt: '17 Apr 2026 14:48:02',
      raw: {
        vendor: 'Northwind Data Services',
        notice_received: '17 Apr 2026 14:30',
        affected_records_estimate: 2400,
        clock_starts: '17 Apr 2026 14:30',
      },
    },
    recommendation: {
      title: 'Open matter, notify data subjects, and lock vendor contract escalation path',
      body: 'Open a regulatory matter with 72-hour clock, draft data subject notice template, and freeze vendor contract amendments until breach scope is confirmed.',
      confidence: 0.88,
      model: 'claude-sonnet-4 · 2025-08-21',
      actions: [
        'Open regulatory matter with 72h SLA',
        'Generate data subject notice template',
        'Freeze vendor contract amendments',
        'Notify DPO and Counsel Lead',
      ],
      sources: [
        { id: 'VND-2026-088', label: 'Vendor breach notice', type: 'signal' },
        { id: 'CNT-NW-2024-011', label: 'Northwind master agreement', type: 'contract' },
        { id: 'POL-DPA-72H', label: 'Covenant: 72-hour DPA notification', type: 'policy' },
      ],
    },
    simulation: {
      runs: 1500,
      expectedOutcome: 'Notification dispatched within 48h · 0 regulatory penalty',
      p10: '30h · 0 penalty',
      p50: '48h · 0 penalty',
      p90: '70h · risk of late-notice fine',
      notes: 'Sensitivity driven by template legal review turnaround.',
    },
    approval: {
      policyId: 'POL-DPA-72H-NOTIFY',
      policyName: 'DPA 72-Hour Notification',
      covenantText:
        'Data subject notifications triggered by vendor breach must be approved by Counsel Lead, logged with evidence envelope, and dispatched within 72 hours of vendor notice receipt.',
      requiredRoles: ['counsel_lead', 'dpo'],
      escalationPath: 'Counsel Lead → DPO → General Counsel',
      slaWindow: '72h',
      riskClass: 'tier-2',
    },
    execution: {
      workflowId: 'WF-COUNSEL-DPA-088',
      steps: [
        { label: 'Open regulatory matter', status: 'complete', durationMs: 1100 },
        { label: 'Generate notice template', status: 'complete', durationMs: 4400 },
        { label: 'Freeze vendor amendments', status: 'complete', durationMs: 700 },
        { label: 'Dispatch notice batch', status: 'running' },
        { label: 'Seal evidence envelope', status: 'queued' },
      ],
    },
    proof: {
      id: 'PCH-DC-2026-0417-022',
      sourceSystem: 'Counsel',
      sourceDomain: 'Counsel',
      signalType: 'regulatory_obligation',
      confidence: 0.88,
      model: 'claude-sonnet-4',
      modelVersion: '2025-08-21',
      reviewState: 'human_reviewed',
      reviewedBy: 'L. Nkosi · Counsel Lead',
      reviewedAt: '17 Apr 2026 15:12',
      exportSafety: 'safe',
      policyChecks: [
        { label: 'Role: counsel_lead — permitted', passed: true },
        { label: 'DPA 72h covenant — within window', passed: true },
        { label: 'DPO notified', passed: true },
        { label: 'Notice template approved', passed: true },
        { label: 'Export safety: PII redacted', passed: true },
      ],
      chainLinks: [
        {
          id: 'c1',
          event: 'Vendor breach notice ingested',
          actor: 'System / Intake Channel',
          timestamp: '17 Apr 2026 14:48:02',
          hash: 'sha256:2b7e9a…',
        },
        {
          id: 'c2',
          event: 'Recommendation generated',
          actor: 'Model: claude-sonnet-4',
          timestamp: '17 Apr 2026 14:48:09',
          hash: 'sha256:4d8c1f…',
        },
        {
          id: 'c3',
          event: 'Counsel Lead approved',
          actor: 'L. Nkosi',
          timestamp: '17 Apr 2026 15:12:44',
          hash: 'sha256:9a3e7b…',
        },
        {
          id: 'c4',
          event: 'Workflow dispatched',
          actor: 'System / Workflow Mesh',
          timestamp: '17 Apr 2026 15:13:01',
          hash: 'sha256:6f1d2c…',
        },
      ],
      metadata: {
        Vendor: 'Northwind Data Services',
        'Affected records': '≈ 2,400',
        'Clock starts': '17 Apr 2026 14:30',
        'Notice deadline': '20 Apr 2026 14:30',
      },
    },
    outcome: {
      actual: 'Notice dispatched 18 Apr 11:20 · 21 hours into 72-hour window',
      predictionDelta: '−27h vs P50 deadline',
      measuredAt: '18 Apr 2026 11:20',
      successCriteria: 'Notice dispatched within 72h with evidence envelope sealed',
    },
    learning: {
      summary:
        'Template generation and approval cycle compressed by ~40%. Updated calibration with new turnaround baseline.',
      calibrationNote: 'Confidence calibration error: 0.05 (within tolerance)',
      indexedAt: '18 Apr 2026 12:00',
    },
  },
];

export const DEFAULT_CASE_ID = DECISION_CASES[0]?.id ?? 'DC-2026-0419-001';
