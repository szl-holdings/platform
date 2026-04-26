/**
 * Stress Drill Store — Fully isolated, in-memory state.
 *
 * Drills run in an isolated "drill tenant" — NO production database
 * tables are read or written. This file owns all mutable state for the
 * red-team simulator. State resets on server restart (intentional for safety).
 *
 * Scoring model: 4-dimension resilience scoring
 *   1. Time-to-Detect (TTD)  — how fast did the team detect each inject?
 *   2. Time-to-Respond (TTR) — how fast did the team resolve/contain?
 *   3. Runbook Adherence     — did the team follow expected runbook steps?
 *   4. Business Impact Containment — were human approvals given, was escalation appropriate?
 */

import { randomUUID } from 'node:crypto';

// ─── Scenario Schema ──────────────────────────────────────────────────────────

export type ScenarioId =
  | 'ransomware-cfo'
  | 'sanctions-sweep'
  | 'hurricane-default'
  | 'contract-breach-cascade'
  | 'multi-domain-simultaneous';

export interface CrisisInject {
  id: string;
  t: number;
  domain: 'sentra' | 'counsel' | 'terra' | 'vessels' | 'aegis' | 'holdings';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedResponse: string;
  runbookRef?: string;
  requiresHumanApproval: boolean;
  businessImpactWeight?: number;
}

export interface CrisisScenario {
  id: ScenarioId;
  name: string;
  tagline: string;
  archetype: string;
  icon: string;
  accentColor: string;
  durationHours: number;
  summary: string;
  domains: string[];
  injects: CrisisInject[];
}

// ─── Drill Run State ──────────────────────────────────────────────────────────

export type DrillStatus = 'ready' | 'running' | 'paused' | 'completed' | 'aborted';

export interface TeamResponse {
  id: string;
  injectId: string;
  respondedAt: string;
  responseType: 'detected' | 'contained' | 'resolved' | 'escalated' | 'missed';
  notes: string;
  humanApprovalGiven: boolean;
  respondedByLabel: string;
}

export interface InjectStatus {
  inject: CrisisInject;
  firedAt: string | null;
  response: TeamResponse | null;
}

export interface DomainScoreEntry {
  domain: string;
  injectCount: number;
  detected: number;
  resolved: number;
}

export interface DimensionScore {
  score: number;
  weight: number;
  label: string;
  detail: string;
}

export interface ParticipantScore {
  label: string;
  responsesGiven: number;
  detectRate: number;
  resolveRate: number;
  avgResponseMinutes: number | null;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface DrillScore {
  totalInjects: number;
  detected: number;
  contained: number;
  resolved: number;
  missed: number;
  humanApprovalsRequired: number;
  humanApprovalsGiven: number;
  avgDetectMinutes: number | null;
  avgResolveMinutes: number | null;
  missedSteps: string[];
  domainBreakdown: DomainScoreEntry[];
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  verdict: string;
  recommendations: string[];
  completedAt: string;
  dimensions: {
    timeToDetect: DimensionScore;
    timeToRespond: DimensionScore;
    runbookAdherence: DimensionScore;
    businessImpactContainment: DimensionScore;
  };
  participantScores: ParticipantScore[];
  resilienceScore: number;
}

export interface DrillRun {
  id: string;
  tenantId: string;
  scenarioId: ScenarioId;
  status: DrillStatus;
  operatorLabel: string;
  participants: string[];
  startedAt: string | null;
  completedAt: string | null;
  currentInjectIndex: number;
  injectStatuses: InjectStatus[];
  score: DrillScore | null;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  participantLabel: string;
  optedIn: boolean;
  totalDrills: number;
  avgResilienceScore: number;
  bestGrade: string;
  totalInjectsHandled: number;
  avgDetectMinutes: number | null;
  lastDrillAt: string | null;
}

export interface ResilienceScorePoint {
  drillId: string;
  scenarioId: string;
  score: number;
  completedAt: string;
  grade: string;
  dimensions: {
    timeToDetect: number;
    timeToRespond: number;
    runbookAdherence: number;
    businessImpactContainment: number;
  };
}

// ─── Scenario Library ─────────────────────────────────────────────────────────

export const SCENARIO_LIBRARY: CrisisScenario[] = [
  {
    id: 'ransomware-cfo',
    name: 'Ransomware — CFO Endpoint',
    tagline: "Ransomware breach originates on the CFO's laptop and spreads to finance systems.",
    archetype: 'ransomware',
    icon: '💀',
    accentColor: '#ef4444',
    durationHours: 72,
    summary:
      'A spear-phishing email delivers a staged payload to the CFO\'s endpoint. Within 4 hours lateral movement reaches the finance ERP, backups are encrypted, and a ransom demand arrives. The team must detect, contain, notify regulators, and restore operations within 72 hours.',
    domains: ['sentra', 'holdings', 'aegis', 'counsel'],
    injects: [
      {
        id: 'rc-01',
        t: 0,
        domain: 'sentra',
        severity: 'high',
        title: 'Anomalous process spawned on CFO endpoint',
        description:
          'EDR alert: cmd.exe spawned by Outlook.exe on CFO-LAPTOP-001. PowerShell encoded command observed. No antivirus signature match.',
        expectedResponse:
          'Isolate endpoint from network, escalate to SOC tier 2, notify CISO.',
        runbookRef: 'IR-001: Endpoint Isolation',
        requiresHumanApproval: false,
        businessImpactWeight: 0.6,
      },
      {
        id: 'rc-02',
        t: 45,
        domain: 'aegis',
        severity: 'critical',
        title: 'Lateral movement detected — finance VLAN',
        description:
          'SIEM correlation: CFO-LAPTOP-001 authenticating to 14 hosts in the finance VLAN using harvested Kerberos tickets. PsExec signatures observed.',
        expectedResponse:
          'Segment finance VLAN, revoke CFO AD credentials, initiate forensic imaging.',
        runbookRef: 'IR-002: Lateral Movement Containment',
        requiresHumanApproval: true,
        businessImpactWeight: 0.9,
      },
      {
        id: 'rc-03',
        t: 240,
        domain: 'holdings',
        severity: 'critical',
        title: 'ERP file encryption begins — finance systems offline',
        description:
          'Finance ERP (SAP) reports mass file encryption. Ransom note dropped: $4.2M BTC demand, 72h deadline. Backup storage also showing encryption markers.',
        expectedResponse:
          'Invoke BCP, disable ERP access, engage cyber insurance carrier, notify board.',
        runbookRef: 'IR-003: Ransomware Response',
        requiresHumanApproval: true,
        businessImpactWeight: 1.0,
      },
      {
        id: 'rc-04',
        t: 300,
        domain: 'counsel',
        severity: 'high',
        title: 'Regulatory notification deadline — 72h clock starts',
        description:
          'GDPR Article 33 and SEC Rule 10b-5 notification obligations triggered. Material breach of PII and financial data. Legal hold required on all communications.',
        expectedResponse:
          'File preliminary breach notification with ICO and SEC, engage outside counsel, place legal hold.',
        runbookRef: 'LEGAL-001: Breach Notification',
        requiresHumanApproval: true,
        businessImpactWeight: 0.8,
      },
      {
        id: 'rc-05',
        t: 720,
        domain: 'sentra',
        severity: 'high',
        title: 'Second-stage payload — exfiltration confirmed',
        description:
          'NetFlow analysis shows 48 GB egressed to a Tor exit node over 12 hours. Data classification: board minutes, LOI documents, LP capital call schedules.',
        expectedResponse:
          'Escalate to critical incident, notify LPs of potential data exposure, engage threat intelligence retainer.',
        runbookRef: 'IR-004: Data Exfiltration Response',
        requiresHumanApproval: false,
        businessImpactWeight: 0.9,
      },
      {
        id: 'rc-06',
        t: 1440,
        domain: 'aegis',
        severity: 'medium',
        title: 'Threat actor dwell-time persistence mechanism found',
        description:
          'Forensics confirms scheduled task persistence on 3 hosts. Attacker likely had access for 14 days prior to detonation. Indicators of Compromise published to ISAC.',
        expectedResponse:
          'Full enterprise threat hunt, reset all privileged credentials, patch CVE-2024-1337 in 24h.',
        runbookRef: 'IR-005: Threat Hunt',
        requiresHumanApproval: false,
        businessImpactWeight: 0.5,
      },
    ],
  },
  {
    id: 'sanctions-sweep',
    name: 'Sanctions Sweep — OFAC List Update',
    tagline: 'New OFAC SDN list drops 3 active counterparties and one LP into restricted status.',
    archetype: 'regulatory',
    icon: '🚫',
    accentColor: '#f59e0b',
    durationHours: 72,
    summary:
      'OFAC publishes an emergency sanctions update. Three active counterparties in the vessels and terra portfolios are designated. One LP is flagged. The team must screen, freeze funds, terminate contracts, and file SARs within statutory deadlines while managing LP communication.',
    domains: ['counsel', 'vessels', 'terra', 'holdings'],
    injects: [
      {
        id: 'ss-01',
        t: 0,
        domain: 'counsel',
        severity: 'critical',
        title: 'OFAC SDN emergency list update published',
        description:
          'OFAC SDN list update (2026-04-26T02:00Z) adds 847 new entries including Meridian Cargo LLC, Delphi Logistics SA, and Apex Freight Partners — all active charter counterparties.',
        expectedResponse:
          'Trigger sanctions screening workflow, freeze all pending payments, notify compliance officer.',
        runbookRef: 'COMP-001: Sanctions Screening',
        requiresHumanApproval: false,
        businessImpactWeight: 0.7,
      },
      {
        id: 'ss-02',
        t: 30,
        domain: 'vessels',
        severity: 'critical',
        title: 'Inbound charter payment blocked — MV Poseidon',
        description:
          'MV Poseidon charter payment of $1.8M from Meridian Cargo LLC blocked by banking correspondent. SWIFT gpi status: compliance hold. Voyage is currently underway.',
        expectedResponse:
          'Suspend charter, instruct vessel to hold at anchorage, engage P&I club, issue notice of termination.',
        runbookRef: 'OPS-001: Charter Suspension',
        requiresHumanApproval: true,
        businessImpactWeight: 0.9,
      },
      {
        id: 'ss-03',
        t: 90,
        domain: 'terra',
        severity: 'high',
        title: 'Tenant entity match — Houston Industrial Park',
        description:
          'Apex Freight Partners holds a 15,000 sqft lease at Houston Industrial Park (Terra portfolio). Entity confirmed as SDN match. Lease rent of $180K/month due in 4 days.',
        expectedResponse:
          'Reject pending rent payment, initiate lease termination proceedings, file SAR with FinCEN within 30 days.',
        runbookRef: 'LEGAL-002: SDN Lease Termination',
        requiresHumanApproval: true,
        businessImpactWeight: 0.8,
      },
      {
        id: 'ss-04',
        t: 180,
        domain: 'holdings',
        severity: 'critical',
        title: 'LP flagged — capital call frozen',
        description:
          'Quarterly AML/KYC re-screening flags Delphi Logistics SA as a beneficial owner of Everest Capital Partners LP (4.2% fund interest). Capital call of $12M due next week cannot be accepted.',
        expectedResponse:
          'Freeze LP interest, engage fund administrator, notify board, prepare investor communication.',
        runbookRef: 'COMP-002: LP Freeze Protocol',
        requiresHumanApproval: true,
        businessImpactWeight: 1.0,
      },
      {
        id: 'ss-05',
        t: 720,
        domain: 'counsel',
        severity: 'high',
        title: 'OFAC voluntary disclosure deadline — 10 business days',
        description:
          'Internal review determines two transactions totalling $3.2M were processed before the SDN update. OFAC voluntary self-disclosure required within 10 business days to qualify for penalty mitigation.',
        expectedResponse:
          'Draft OFAC voluntary disclosure, engage sanctions counsel, compile transaction documentation.',
        runbookRef: 'LEGAL-003: OFAC Voluntary Disclosure',
        requiresHumanApproval: true,
        businessImpactWeight: 0.9,
      },
      {
        id: 'ss-06',
        t: 1440,
        domain: 'holdings',
        severity: 'medium',
        title: 'Portfolio stress — 3 counterparties offline simultaneously',
        description:
          'With 3 counterparties suspended, maritime revenue drops 18% and terra rental income drops 12%. Treasury models revised; covenant headroom narrows to 1.2x (threshold: 1.1x).',
        expectedResponse:
          'Revise rolling forecast, brief lenders proactively, activate contingency liquidity facility.',
        runbookRef: 'FIN-001: Covenant Stress Protocol',
        requiresHumanApproval: false,
        businessImpactWeight: 0.7,
      },
    ],
  },
  {
    id: 'hurricane-default',
    name: 'Hurricane — Houston Tenant Default',
    tagline: 'Category 4 hurricane makes landfall. Tenant property is damaged; tenant defaults.',
    archetype: 'cascade',
    icon: '🌀',
    accentColor: '#4d8fcc',
    durationHours: 72,
    summary:
      'A Category 4 hurricane makes landfall near Houston. Two terra properties sustain major structural damage. The primary industrial tenant invokes force majeure and stops rent. The team must activate BCP, engage insurers, coordinate emergency repairs, and manage LP communication — all while a potential tenant default threatens covenant compliance.',
    domains: ['terra', 'holdings', 'counsel', 'aegis'],
    injects: [
      {
        id: 'hd-01',
        t: 0,
        domain: 'terra',
        severity: 'critical',
        title: 'Cat-4 hurricane landfall — Houston metro',
        description:
          'National Hurricane Center confirms Cat-4 landfall (145mph winds) at 06:00 CDT. Houston Industrial Park and Bayou Commerce Center are both within the projected cone. Mandatory evacuation in effect.',
        expectedResponse:
          'Activate property BCP, confirm tenant evacuations, dispatch loss assessors, notify insurers within 24h.',
        runbookRef: 'BCP-001: Natural Disaster Protocol',
        requiresHumanApproval: false,
        businessImpactWeight: 0.8,
      },
      {
        id: 'hd-02',
        t: 60,
        domain: 'aegis',
        severity: 'high',
        title: 'Physical security breach — looting reported at Houston Industrial',
        description:
          'Property management reports opportunistic looting at Houston Industrial Park. Site cameras offline. Two tenants report inventory theft. Police response ETA unknown.',
        expectedResponse:
          'Engage private security firm, file police reports, document inventory losses for insurance, notify affected tenants.',
        runbookRef: 'SEC-001: Physical Security Incident',
        requiresHumanApproval: false,
        businessImpactWeight: 0.6,
      },
      {
        id: 'hd-03',
        t: 180,
        domain: 'terra',
        severity: 'critical',
        title: 'Structural assessment — 40% roof loss, flooding',
        description:
          'Licensed engineer assessment: Houston Industrial Park — Building A has 40% roof loss, Category B flood damage (>1ft standing water). Estimated repair cost: $8.2M. Uninhabitable for 90–120 days.',
        expectedResponse:
          'File insurance claim (property + BI), place tenants on formal abatement notice, engage general contractor.',
        runbookRef: 'PROP-001: Major Damage Protocol',
        requiresHumanApproval: true,
        businessImpactWeight: 1.0,
      },
      {
        id: 'hd-04',
        t: 240,
        domain: 'counsel',
        severity: 'high',
        title: 'Primary tenant invokes force majeure — Apex Manufacturing',
        description:
          'Apex Manufacturing (12,000 sqft, $145K/month) serves written force majeure notice citing lease section 18.4 (natural disaster). Suspends rent effective immediately. Legal validity contested.',
        expectedResponse:
          'Assess force majeure clause enforceability, respond within 10 days, consult Texas property counsel.',
        runbookRef: 'LEGAL-004: Force Majeure Response',
        requiresHumanApproval: true,
        businessImpactWeight: 0.8,
      },
      {
        id: 'hd-05',
        t: 480,
        domain: 'holdings',
        severity: 'critical',
        title: 'Portfolio covenant stress — debt service coverage narrows',
        description:
          'With Apex rent suspended and repair costs crystallised, Terra segment DSCR falls to 1.08x (covenant: 1.15x). Lender reporting due in 30 days. Bridge financing required.',
        expectedResponse:
          'Engage lender for covenant waiver, model bridge financing options, brief LP advisory committee.',
        runbookRef: 'FIN-002: DSCR Covenant Breach',
        requiresHumanApproval: true,
        businessImpactWeight: 1.0,
      },
      {
        id: 'hd-06',
        t: 1440,
        domain: 'holdings',
        severity: 'medium',
        title: 'Insurance carrier dispute — BI coverage denied',
        description:
          'Property insurer accepts structural claim ($5.1M of $8.2M) but disputes Business Interruption coverage citing "concurrent causation" exclusion. BI claim value: $2.4M over 6 months.',
        expectedResponse:
          'Engage coverage counsel, invoke appraisal clause, file complaint with Texas DOI if carrier is non-responsive.',
        runbookRef: 'INS-001: Coverage Dispute Protocol',
        requiresHumanApproval: false,
        businessImpactWeight: 0.7,
      },
    ],
  },
  {
    id: 'contract-breach-cascade',
    name: 'Contract Breach Cascade',
    tagline: 'A critical vendor breach triggers cascading contract failures across three portfolios.',
    archetype: 'cascade',
    icon: '⚖️',
    accentColor: '#a855f7',
    durationHours: 96,
    summary:
      'A key technology vendor (CloudVault Inc.) suffers a catastrophic data breach exposing PII of your tenants and portfolio companies. Their SLA breach triggers termination rights across 8 contracts. The cascading effect ripples through Terra (property management system), Vessels (cargo tracking), and Counsel (document management). Teams must triage contract positions, engage replacement vendors, manage regulatory exposure, and contain financial damage while maintaining operational continuity.',
    domains: ['counsel', 'terra', 'vessels', 'holdings', 'sentra'],
    injects: [
      {
        id: 'cb-01',
        t: 0,
        domain: 'sentra',
        severity: 'critical',
        title: 'Vendor breach notification — CloudVault Inc. data exfiltration',
        description:
          'CloudVault Inc. (critical SaaS vendor) issues mandatory breach notification: 2.3M records exfiltrated including tenant PII, lease documents, and cargo manifests. Breach occurred 21 days ago; vendor delayed notification.',
        expectedResponse:
          'Invoke vendor incident response protocol, assess data exposure scope, notify DPO and legal, begin impact assessment across all consuming platforms.',
        runbookRef: 'VENDOR-001: Third-Party Breach Protocol',
        requiresHumanApproval: false,
        businessImpactWeight: 0.8,
      },
      {
        id: 'cb-02',
        t: 60,
        domain: 'counsel',
        severity: 'critical',
        title: 'SLA breach triggers termination rights — 8 contracts affected',
        description:
          'Legal review confirms CloudVault violated Section 7.2 (Security Obligations) and 9.1 (Notification Timeliness) across 8 master service agreements. Termination for cause available within 30-day cure window. Estimated switching cost: $4.8M.',
        expectedResponse:
          'Issue formal cure notice to CloudVault, begin RFP for replacement vendors, place litigation hold on all CloudVault communications, quantify termination vs. continuation economics.',
        runbookRef: 'LEGAL-005: Vendor SLA Breach Response',
        requiresHumanApproval: true,
        businessImpactWeight: 1.0,
      },
      {
        id: 'cb-03',
        t: 180,
        domain: 'terra',
        severity: 'high',
        title: 'Property management system degraded — tenant portal offline',
        description:
          'CloudVault-hosted tenant portal (serving 340 tenants across 12 properties) taken offline as precaution. Tenants unable to submit maintenance requests, view lease documents, or make rent payments online. Call volume spikes 400%.',
        expectedResponse:
          'Activate manual payment processing, deploy temporary tenant communication portal, notify all property managers, issue tenant advisory with alternative contact methods.',
        runbookRef: 'OPS-002: Service Degradation Protocol',
        requiresHumanApproval: false,
        businessImpactWeight: 0.7,
      },
      {
        id: 'cb-04',
        t: 360,
        domain: 'vessels',
        severity: 'high',
        title: 'Cargo tracking system compromised — manifests potentially altered',
        description:
          'Integrity check reveals 47 cargo manifests on CloudVault may have been accessed or modified. Customs authorities in Singapore and Rotterdam require re-validation of all manifests filed in the last 90 days. Two vessels held at port pending re-clearance.',
        expectedResponse:
          'Engage customs brokers for expedited re-filing, deploy independent manifest verification, notify P&I club of potential delays, estimate demurrage exposure.',
        runbookRef: 'OPS-003: Manifest Integrity Response',
        requiresHumanApproval: true,
        businessImpactWeight: 0.9,
      },
      {
        id: 'cb-05',
        t: 720,
        domain: 'holdings',
        severity: 'critical',
        title: 'Financial exposure crystallises — $12M contingent liability',
        description:
          'CFO review quantifies total exposure: $4.8M vendor switching costs, $2.1M demurrage claims, $1.4M emergency IT spend, $3.7M potential regulatory fines (GDPR + maritime). Board demands remediation plan within 48 hours.',
        expectedResponse:
          'Prepare board-ready financial impact memo, engage cyber insurance carrier for claim filing, model 3 remediation scenarios (terminate/renegotiate/hybrid), update rolling forecast.',
        runbookRef: 'FIN-003: Contingent Liability Crystallisation',
        requiresHumanApproval: true,
        businessImpactWeight: 1.0,
      },
      {
        id: 'cb-06',
        t: 1440,
        domain: 'counsel',
        severity: 'medium',
        title: 'Regulatory investigation notice — ICO preliminary inquiry',
        description:
          'ICO (UK Information Commissioner) sends preliminary inquiry letter regarding delayed breach notification to affected UK tenants. Response deadline: 28 days. Potential fine: up to 4% of annual turnover.',
        expectedResponse:
          'Engage specialist data protection counsel, prepare ICO response with timeline of events, demonstrate remediation steps taken, coordinate with CloudVault on joint response strategy.',
        runbookRef: 'LEGAL-006: Regulatory Inquiry Response',
        requiresHumanApproval: true,
        businessImpactWeight: 0.8,
      },
    ],
  },
  {
    id: 'multi-domain-simultaneous',
    name: 'Multi-Domain Simultaneous Crisis',
    tagline: 'Coordinated attack hits cyber, maritime, real estate, and legal simultaneously.',
    archetype: 'cascade',
    icon: '🔥',
    accentColor: '#dc2626',
    durationHours: 48,
    summary:
      'A sophisticated adversary launches a coordinated multi-vector attack designed to overwhelm response capacity. A ransomware campaign targets Sentra endpoints while simultaneously a port explosion damages two vessels, a major tenant files for bankruptcy, and a frivolous but high-profile lawsuit is filed. The team must triage across all domains simultaneously — the key test is prioritisation under extreme pressure.',
    domains: ['sentra', 'vessels', 'terra', 'counsel', 'aegis', 'holdings'],
    injects: [
      {
        id: 'md-01',
        t: 0,
        domain: 'sentra',
        severity: 'critical',
        title: 'Coordinated ransomware deployment — 3 business units hit simultaneously',
        description:
          'RansomOps group deploys LockBit 3.0 variant across Sentra, Terra admin, and Vessels tracking infrastructure simultaneously. 340 endpoints encrypted in first 15 minutes. Ransom demand: $8.5M in Monero, 24h deadline.',
        expectedResponse:
          'Activate enterprise-wide IR, isolate all three segments, invoke cyber insurance, notify FBI IC3 and CISA.',
        runbookRef: 'IR-006: Multi-Segment Ransomware',
        requiresHumanApproval: true,
        businessImpactWeight: 1.0,
      },
      {
        id: 'md-02',
        t: 15,
        domain: 'vessels',
        severity: 'critical',
        title: 'Port explosion — MV Artemis and MV Orion damaged at Jebel Ali',
        description:
          'Explosion at Jebel Ali Free Zone (cause unknown, possible industrial accident) damages MV Artemis (hull breach, cargo hold flooding) and MV Orion (superstructure fire). Two crew members injured. Port closed indefinitely.',
        expectedResponse:
          'Activate maritime emergency protocol, contact JAFZA port authority, deploy salvage coordinator, notify H&M and P&I underwriters, arrange crew medical evacuation.',
        runbookRef: 'MARITIME-001: Vessel Casualty Protocol',
        requiresHumanApproval: true,
        businessImpactWeight: 1.0,
      },
      {
        id: 'md-03',
        t: 30,
        domain: 'terra',
        severity: 'high',
        title: 'Major tenant bankruptcy filing — Pinnacle Industries Chapter 11',
        description:
          'Pinnacle Industries (anchor tenant, 45,000 sqft across 3 properties, $680K/month rent) files Chapter 11 bankruptcy. Automatic stay prevents lease termination. $2.7M in unpaid rent accrued. Company requests rent abatement as part of restructuring plan.',
        expectedResponse:
          'Engage bankruptcy counsel, file proof of claim, assess lease assumption/rejection timeline, model vacancy scenarios, notify lenders of material tenant event.',
        runbookRef: 'LEGAL-007: Tenant Bankruptcy Response',
        requiresHumanApproval: true,
        businessImpactWeight: 0.9,
      },
      {
        id: 'md-04',
        t: 45,
        domain: 'counsel',
        severity: 'high',
        title: 'Class action lawsuit filed — securities fraud allegation',
        description:
          'Plaintiff law firm files class action in SDNY alleging securities fraud in connection with recent LP communications about portfolio performance. Claims material misrepresentations in Q3 NAV reporting. Seeks $45M in damages.',
        expectedResponse:
          'Engage securities litigation counsel, implement litigation hold across all relevant communications, notify D&O insurer, prepare board briefing on potential exposure and defense strategy.',
        runbookRef: 'LEGAL-008: Securities Litigation Response',
        requiresHumanApproval: true,
        businessImpactWeight: 0.9,
      },
      {
        id: 'md-05',
        t: 120,
        domain: 'aegis',
        severity: 'critical',
        title: 'Threat intelligence links port explosion to ransomware group',
        description:
          'Threat intelligence feed correlates: RansomOps group previously compromised JAFZA port control systems. The "industrial accident" may have been a deliberate kinetic-cyber hybrid attack. Nation-state involvement suspected. Media inquiries incoming.',
        expectedResponse:
          'Brief government liaison, engage crisis communications firm, coordinate with intelligence agencies, prepare media holding statement, escalate to board and LP advisory committee.',
        runbookRef: 'CRISIS-001: Kinetic-Cyber Hybrid Response',
        requiresHumanApproval: true,
        businessImpactWeight: 1.0,
      },
      {
        id: 'md-06',
        t: 240,
        domain: 'holdings',
        severity: 'critical',
        title: 'Liquidity crisis — simultaneous cash demands exceed reserves',
        description:
          'Combined impact: $8.5M ransom demand + $14M vessel damage + $2.7M unpaid rent + $2.1M emergency response costs + frozen $12M capital call = $39.3M cash requirement against $22M liquid reserves. Covenant breaches imminent on 3 facilities.',
        expectedResponse:
          'Convene emergency board meeting, activate revolving credit facility, engage investment bank for emergency bridge, prepare LP crisis communication, model portfolio liquidation scenarios.',
        runbookRef: 'FIN-004: Liquidity Crisis Protocol',
        requiresHumanApproval: true,
        businessImpactWeight: 1.0,
      },
      {
        id: 'md-07',
        t: 480,
        domain: 'sentra',
        severity: 'high',
        title: 'Decryption key obtained — selective restoration begins',
        description:
          'Law enforcement provides partial decryption key recovered from seized RansomOps infrastructure. Key works for Terra admin and Vessels tracking but NOT Sentra core. Selective restoration possible but integrity verification required before production use.',
        expectedResponse:
          'Validate decryption key in isolated sandbox, verify data integrity via checksums, plan phased restoration priority (revenue-critical first), maintain parallel manual operations until validation complete.',
        runbookRef: 'IR-007: Selective Recovery Protocol',
        requiresHumanApproval: false,
        businessImpactWeight: 0.7,
      },
    ],
  },
];

// ─── In-Memory Store ──────────────────────────────────────────────────────────

const drills = new Map<string, DrillRun>();
const resilienceHistory = new Map<string, ResilienceScorePoint[]>();
const leaderboardEntries = new Map<string, LeaderboardEntry>();
const optedInParticipants = new Set<string>();

function tenantKey(tenantId: string, label: string): string {
  return `${tenantId}::${label}`;
}

export function listScenarios(): CrisisScenario[] {
  return SCENARIO_LIBRARY;
}

export function getScenario(id: ScenarioId): CrisisScenario | undefined {
  return SCENARIO_LIBRARY.find((s) => s.id === id);
}

export function createDrill(params: {
  tenantId: string;
  scenarioId: ScenarioId;
  operatorLabel: string;
  participants?: string[];
}): DrillRun | null {
  const scenario = getScenario(params.scenarioId);
  if (!scenario) return null;

  const id = `drill-${randomUUID().slice(0, 8)}`;
  const run: DrillRun = {
    id,
    tenantId: params.tenantId,
    scenarioId: params.scenarioId,
    status: 'ready',
    operatorLabel: params.operatorLabel,
    participants: params.participants ?? [params.operatorLabel],
    startedAt: null,
    completedAt: null,
    currentInjectIndex: 0,
    injectStatuses: scenario.injects.map((inject) => ({
      inject,
      firedAt: null,
      response: null,
    })),
    score: null,
  };

  drills.set(id, run);
  return run;
}

export function addParticipant(drillId: string, label: string): DrillRun | null {
  const drill = drills.get(drillId);
  if (!drill) return null;
  if (!drill.participants.includes(label)) {
    drill.participants.push(label);
  }
  return drill;
}

export function getDrill(id: string): DrillRun | undefined {
  return drills.get(id);
}

export function listDrills(tenantId: string): DrillRun[] {
  return Array.from(drills.values())
    .filter((d) => d.tenantId === tenantId)
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''));
}

export function startDrill(id: string): DrillRun | null {
  const drill = drills.get(id);
  if (!drill || drill.status !== 'ready') return null;

  const now = new Date().toISOString();
  drill.status = 'running';
  drill.startedAt = now;

  if (drill.injectStatuses.length > 0) {
    drill.injectStatuses[0].firedAt = now;
  }

  return drill;
}

export function advanceDrill(id: string): { drill: DrillRun; nextInject: CrisisInject | null } | null {
  const drill = drills.get(id);
  if (!drill || drill.status !== 'running') return null;

  const nextIndex = drill.currentInjectIndex + 1;
  if (nextIndex >= drill.injectStatuses.length) {
    return { drill, nextInject: null };
  }

  drill.currentInjectIndex = nextIndex;
  const now = new Date().toISOString();
  drill.injectStatuses[nextIndex].firedAt = now;

  return { drill, nextInject: drill.injectStatuses[nextIndex].inject };
}

export function respondToInject(
  drillId: string,
  injectId: string,
  params: {
    responseType: TeamResponse['responseType'];
    notes: string;
    humanApprovalGiven: boolean;
    respondedByLabel: string;
  },
): DrillRun | null {
  const drill = drills.get(drillId);
  if (!drill || drill.status !== 'running') return null;

  const injectStatus = drill.injectStatuses.find((s) => s.inject.id === injectId);
  if (!injectStatus || injectStatus.firedAt === null) return null;

  if (injectStatus.response) return drill;

  const response: TeamResponse = {
    id: randomUUID(),
    injectId,
    respondedAt: new Date().toISOString(),
    responseType: params.responseType,
    notes: params.notes,
    humanApprovalGiven: params.humanApprovalGiven,
    respondedByLabel: params.respondedByLabel,
  };

  injectStatus.response = response;

  if (!drill.participants.includes(params.respondedByLabel)) {
    drill.participants.push(params.respondedByLabel);
  }

  return drill;
}

export function completeDrill(id: string): DrillRun | null {
  const drill = drills.get(id);
  if (!drill || !['running', 'paused'].includes(drill.status)) return null;

  const now = new Date().toISOString();
  drill.status = 'completed';
  drill.completedAt = now;
  drill.score = scoreDrill(drill, now);

  const tenantId = drill.tenantId;
  if (!resilienceHistory.has(tenantId)) {
    resilienceHistory.set(tenantId, []);
  }
  resilienceHistory.get(tenantId)!.push({
    drillId: drill.id,
    scenarioId: drill.scenarioId,
    score: drill.score.resilienceScore,
    completedAt: now,
    grade: drill.score.grade,
    dimensions: {
      timeToDetect: drill.score.dimensions.timeToDetect.score,
      timeToRespond: drill.score.dimensions.timeToRespond.score,
      runbookAdherence: drill.score.dimensions.runbookAdherence.score,
      businessImpactContainment: drill.score.dimensions.businessImpactContainment.score,
    },
  });

  for (const ps of drill.score.participantScores) {
    updateLeaderboardEntry(drill.tenantId, ps, drill.score.resilienceScore, now);
  }

  return drill;
}

function updateLeaderboardEntry(
  tenantId: string,
  participant: ParticipantScore,
  drillResilienceScore: number,
  completedAt: string,
): void {
  const key = tenantKey(tenantId, participant.label);
  const existing = leaderboardEntries.get(key);

  if (existing) {
    existing.totalDrills++;
    existing.avgResilienceScore = Math.round(
      (existing.avgResilienceScore * (existing.totalDrills - 1) + drillResilienceScore) /
        existing.totalDrills,
    );
    existing.totalInjectsHandled += participant.responsesGiven;
    if (
      gradeRank(participant.grade) < gradeRank(existing.bestGrade as ParticipantScore['grade'])
    ) {
      existing.bestGrade = participant.grade;
    }
    if (participant.avgResponseMinutes !== null) {
      existing.avgDetectMinutes =
        existing.avgDetectMinutes !== null
          ? Math.round((existing.avgDetectMinutes + participant.avgResponseMinutes) / 2)
          : participant.avgResponseMinutes;
    }
    existing.lastDrillAt = completedAt;
  } else {
    leaderboardEntries.set(key, {
      participantLabel: participant.label,
      optedIn: optedInParticipants.has(key),
      totalDrills: 1,
      avgResilienceScore: drillResilienceScore,
      bestGrade: participant.grade,
      totalInjectsHandled: participant.responsesGiven,
      avgDetectMinutes: participant.avgResponseMinutes,
      lastDrillAt: completedAt,
    });
  }
}

function gradeRank(g: string): number {
  return g === 'A' ? 1 : g === 'B' ? 2 : g === 'C' ? 3 : g === 'D' ? 4 : 5;
}

export function abortDrill(id: string): DrillRun | null {
  const drill = drills.get(id);
  if (!drill || drill.status === 'completed') return null;

  drill.status = 'aborted';
  drill.completedAt = new Date().toISOString();
  return drill;
}

// ─── Leaderboard & Resilience Trend API ───────────────────────────────────────

export function optInParticipant(tenantId: string, label: string): void {
  const key = tenantKey(tenantId, label);
  optedInParticipants.add(key);
  const entry = leaderboardEntries.get(key);
  if (entry) entry.optedIn = true;
}

export function optOutParticipant(tenantId: string, label: string): void {
  const key = tenantKey(tenantId, label);
  optedInParticipants.delete(key);
  const entry = leaderboardEntries.get(key);
  if (entry) entry.optedIn = false;
}

export function isParticipantOptedIn(tenantId: string, label: string): boolean {
  return optedInParticipants.has(tenantKey(tenantId, label));
}

export function getLeaderboard(tenantId: string): LeaderboardEntry[] {
  return Array.from(leaderboardEntries.entries())
    .filter(([key, e]) => key.startsWith(`${tenantId}::`) && e.optedIn)
    .map(([, e]) => e)
    .sort((a, b) => b.avgResilienceScore - a.avgResilienceScore);
}

export function getResilienceHistory(tenantId: string): ResilienceScorePoint[] {
  return resilienceHistory.get(tenantId) ?? [];
}

export function getLatestResilienceScore(tenantId: string): number | null {
  const history = resilienceHistory.get(tenantId);
  if (!history || history.length === 0) return null;
  return history[history.length - 1].score;
}

// ─── 4-Dimension Scoring Engine ───────────────────────────────────────────────

function scoreDrill(drill: DrillRun, now: string): DrillScore {
  const firedInjects = drill.injectStatuses.filter((s) => s.firedAt !== null);
  const totalInjects = firedInjects.length;

  let detected = 0;
  let contained = 0;
  let resolved = 0;
  let missed = 0;
  const missedSteps: string[] = [];

  let humanApprovalsRequired = 0;
  let humanApprovalsGiven = 0;

  const domainMap = new Map<string, DomainScoreEntry>();
  const detectMinutes: number[] = [];
  const resolveMinutes: number[] = [];

  let runbookFollowed = 0;
  let runbookTotal = 0;
  let businessImpactScore = 0;
  let businessImpactTotal = 0;

  const participantMap = new Map<
    string,
    { responses: number; detected: number; resolved: number; minutes: number[] }
  >();

  for (const s of firedInjects) {
    const domain = s.inject.domain;
    if (!domainMap.has(domain)) {
      domainMap.set(domain, { domain, injectCount: 0, detected: 0, resolved: 0 });
    }
    const entry = domainMap.get(domain)!;
    entry.injectCount++;

    if (s.inject.requiresHumanApproval) humanApprovalsRequired++;

    const biWeight = s.inject.businessImpactWeight ?? 0.5;
    businessImpactTotal += biWeight;

    if (!s.response) {
      missed++;
      missedSteps.push(`[${s.inject.domain.toUpperCase()}] ${s.inject.title}`);
      continue;
    }

    const responder = s.response.respondedByLabel;
    if (!participantMap.has(responder)) {
      participantMap.set(responder, { responses: 0, detected: 0, resolved: 0, minutes: [] });
    }
    const pEntry = participantMap.get(responder)!;
    pEntry.responses++;

    if (s.inject.requiresHumanApproval && s.response.humanApprovalGiven) {
      humanApprovalsGiven++;
    }

    if (s.inject.runbookRef) {
      runbookTotal++;
      if (
        s.response.responseType !== 'missed' &&
        (s.response.responseType === 'resolved' ||
          s.response.responseType === 'contained' ||
          s.response.responseType === 'detected')
      ) {
        runbookFollowed++;
      }
    }

    const firedMs = new Date(s.firedAt!).getTime();
    const respondedMs = new Date(s.response.respondedAt).getTime();
    const diffMin = Math.max(0, (respondedMs - firedMs) / 60_000);
    pEntry.minutes.push(diffMin);

    switch (s.response.responseType) {
      case 'detected':
        detected++;
        entry.detected++;
        pEntry.detected++;
        detectMinutes.push(diffMin);
        businessImpactScore += biWeight * 0.4;
        break;
      case 'contained':
        detected++;
        contained++;
        entry.detected++;
        pEntry.detected++;
        detectMinutes.push(diffMin);
        businessImpactScore += biWeight * 0.7;
        break;
      case 'resolved':
        detected++;
        contained++;
        resolved++;
        entry.detected++;
        entry.resolved++;
        pEntry.detected++;
        pEntry.resolved++;
        detectMinutes.push(diffMin);
        resolveMinutes.push(diffMin);
        businessImpactScore += biWeight * 1.0;
        break;
      case 'escalated':
        detected++;
        entry.detected++;
        pEntry.detected++;
        detectMinutes.push(diffMin);
        businessImpactScore += biWeight * 0.5;
        break;
      case 'missed':
        missed++;
        missedSteps.push(`[${s.inject.domain.toUpperCase()}] ${s.inject.title}`);
        break;
    }

    if (s.inject.requiresHumanApproval && s.response.humanApprovalGiven) {
      businessImpactScore += biWeight * 0.2;
    }
  }

  const avgDetectMinutes =
    detectMinutes.length > 0
      ? Math.round(detectMinutes.reduce((a, b) => a + b, 0) / detectMinutes.length)
      : null;

  const avgResolveMinutes =
    resolveMinutes.length > 0
      ? Math.round(resolveMinutes.reduce((a, b) => a + b, 0) / resolveMinutes.length)
      : null;

  const ttdRaw = avgDetectMinutes !== null ? Math.max(0, 100 - avgDetectMinutes * 2) : 50;
  const ttrRaw = avgResolveMinutes !== null ? Math.max(0, 100 - avgResolveMinutes * 1.5) : 50;
  const runbookRaw = runbookTotal > 0 ? (runbookFollowed / runbookTotal) * 100 : 50;
  const biRaw = businessImpactTotal > 0 ? (businessImpactScore / businessImpactTotal) * 100 : 50;

  const TTD_WEIGHT = 0.25;
  const TTR_WEIGHT = 0.25;
  const RUNBOOK_WEIGHT = 0.25;
  const BI_WEIGHT = 0.25;

  const ttdScore = Math.round(Math.max(0, Math.min(100, ttdRaw)));
  const ttrScore = Math.round(Math.max(0, Math.min(100, ttrRaw)));
  const runbookScore = Math.round(Math.max(0, Math.min(100, runbookRaw)));
  const biScore = Math.round(Math.max(0, Math.min(100, biRaw)));

  const compositeScore = Math.round(
    ttdScore * TTD_WEIGHT +
      ttrScore * TTR_WEIGHT +
      runbookScore * RUNBOOK_WEIGHT +
      biScore * BI_WEIGHT,
  );

  const overallScore = Math.max(0, Math.min(100, compositeScore));

  const resilienceScore = Math.round(
    overallScore * 0.6 +
      (totalInjects > 0 ? (detected / totalInjects) * 100 : 0) * 0.2 +
      (humanApprovalsRequired > 0 ? (humanApprovalsGiven / humanApprovalsRequired) * 100 : 100) *
        0.2,
  );

  const grade: DrillScore['grade'] =
    overallScore >= 90
      ? 'A'
      : overallScore >= 75
        ? 'B'
        : overallScore >= 60
          ? 'C'
          : overallScore >= 40
            ? 'D'
            : 'F';

  const verdict =
    overallScore >= 90
      ? 'Exemplary response — platform and team performed at best-in-class standard across all four dimensions.'
      : overallScore >= 75
        ? 'Solid response with minor gaps. Targeted remediation recommended in the weakest dimension.'
        : overallScore >= 60
          ? 'Adequate response but significant gaps in one or more dimensions. Focused improvement plan required.'
          : overallScore >= 40
            ? 'Below standard. Multiple critical dimensions underperforming. Immediate remediation and re-drill required.'
            : 'Failing response. Material gaps in team readiness across all dimensions. Full crisis simulation must be re-run after remediation.';

  const recommendations: string[] = [];
  if (ttdScore < 70) {
    recommendations.push(
      `Time-to-Detect scored ${ttdScore}/100. Improve alert triage SLA — target detection within 15 minutes of inject.`,
    );
  }
  if (ttrScore < 70) {
    recommendations.push(
      `Time-to-Respond scored ${ttrScore}/100. Strengthen runbook completeness and resolution playbooks.`,
    );
  }
  if (runbookScore < 70) {
    recommendations.push(
      `Runbook Adherence scored ${runbookScore}/100. Review and update runbooks for accuracy. Conduct tabletop walkthrough.`,
    );
  }
  if (biScore < 70) {
    recommendations.push(
      `Business Impact Containment scored ${biScore}/100. Improve escalation paths and human approval workflows.`,
    );
  }
  if (missed > 2) {
    recommendations.push(
      `${missed} injects went unanswered. Run focused drills for missed domains.`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      'All dimensions performing well. Consider increasing inject density and scenario complexity.',
    );
  }

  const dimensions: DrillScore['dimensions'] = {
    timeToDetect: {
      score: ttdScore,
      weight: TTD_WEIGHT,
      label: 'Time-to-Detect',
      detail:
        avgDetectMinutes !== null
          ? `Average detection time: ${avgDetectMinutes} minutes`
          : 'No detections recorded',
    },
    timeToRespond: {
      score: ttrScore,
      weight: TTR_WEIGHT,
      label: 'Time-to-Respond',
      detail:
        avgResolveMinutes !== null
          ? `Average resolution time: ${avgResolveMinutes} minutes`
          : 'No resolutions recorded',
    },
    runbookAdherence: {
      score: runbookScore,
      weight: RUNBOOK_WEIGHT,
      label: 'Runbook Adherence',
      detail: `${runbookFollowed}/${runbookTotal} runbook steps followed correctly`,
    },
    businessImpactContainment: {
      score: biScore,
      weight: BI_WEIGHT,
      label: 'Business Impact Containment',
      detail: `${humanApprovalsGiven}/${humanApprovalsRequired} human approvals given, ${resolved}/${totalInjects} fully resolved`,
    },
  };

  const participantScores: ParticipantScore[] = Array.from(participantMap.entries()).map(
    ([label, data]) => {
      const avgMin =
        data.minutes.length > 0
          ? Math.round(data.minutes.reduce((a, b) => a + b, 0) / data.minutes.length)
          : null;
      const pDetectRate = data.responses > 0 ? data.detected / data.responses : 0;
      const pResolveRate = data.responses > 0 ? data.resolved / data.responses : 0;
      const pScore = Math.round(pDetectRate * 50 + pResolveRate * 50);
      const pGrade: ParticipantScore['grade'] =
        pScore >= 90 ? 'A' : pScore >= 75 ? 'B' : pScore >= 60 ? 'C' : pScore >= 40 ? 'D' : 'F';
      return {
        label,
        responsesGiven: data.responses,
        detectRate: Math.round(pDetectRate * 100),
        resolveRate: Math.round(pResolveRate * 100),
        avgResponseMinutes: avgMin,
        grade: pGrade,
      };
    },
  );

  return {
    totalInjects,
    detected,
    contained,
    resolved,
    missed,
    humanApprovalsRequired,
    humanApprovalsGiven,
    avgDetectMinutes,
    avgResolveMinutes,
    missedSteps,
    domainBreakdown: Array.from(domainMap.values()),
    overallScore,
    grade,
    verdict,
    recommendations,
    completedAt: now,
    dimensions,
    participantScores,
    resilienceScore,
  };
}
