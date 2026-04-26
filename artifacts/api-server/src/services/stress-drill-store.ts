/**
 * Stress Drill Store — Fully isolated, in-memory state.
 *
 * Drills run in an isolated "drill tenant" — NO production database
 * tables are read or written. This file owns all mutable state for the
 * red-team simulator. State resets on server restart (intentional for safety).
 */

import { randomUUID } from 'node:crypto';

// ─── Scenario Schema ──────────────────────────────────────────────────────────

export type ScenarioId = 'ransomware-cfo' | 'sanctions-sweep' | 'hurricane-default';

export interface CrisisInject {
  id: string;
  t: number; // offset in minutes from drill start
  domain: 'sentra' | 'counsel' | 'terra' | 'vessels' | 'aegis' | 'holdings';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedResponse: string;
  runbookRef?: string;
  requiresHumanApproval: boolean;
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

export interface DrillRun {
  id: string;
  tenantId: string;
  scenarioId: ScenarioId;
  status: DrillStatus;
  operatorLabel: string;
  startedAt: string | null;
  completedAt: string | null;
  currentInjectIndex: number;
  injectStatuses: InjectStatus[];
  score: DrillScore | null;
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
  overallScore: number; // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  verdict: string;
  recommendations: string[];
  completedAt: string;
}

export interface DomainScoreEntry {
  domain: string;
  injectCount: number;
  detected: number;
  resolved: number;
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
      },
    ],
  },
  {
    id: 'hurricane-default',
    name: 'Hurricane — Houston Tenant Default',
    tagline: 'Category 4 hurricane makes landfall. Tenant property is damaged; tenant defaults.',
    archetype: 'cascade',
    icon: '🌀',
    accentColor: '#0ea5e9',
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
      },
    ],
  },
];

// ─── In-Memory Store ──────────────────────────────────────────────────────────

const drills = new Map<string, DrillRun>();

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

  // Fire the first inject immediately (t=0)
  if (drill.injectStatuses.length > 0) {
    drill.injectStatuses[0].firedAt = now;
  }

  return drill;
}

export function advanceDrill(id: string): { drill: DrillRun; nextInject: CrisisInject | null } | null {
  const drill = drills.get(id);
  if (!drill || drill.status !== 'running') return null;

  // Move to the next inject
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

  if (injectStatus.response) return drill; // already responded

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
  return drill;
}

export function completeDrill(id: string): DrillRun | null {
  const drill = drills.get(id);
  if (!drill || !['running', 'paused'].includes(drill.status)) return null;

  const now = new Date().toISOString();
  drill.status = 'completed';
  drill.completedAt = now;
  drill.score = scoreDrill(drill, now);

  return drill;
}

export function abortDrill(id: string): DrillRun | null {
  const drill = drills.get(id);
  if (!drill || drill.status === 'completed') return null;

  drill.status = 'aborted';
  drill.completedAt = new Date().toISOString();
  return drill;
}

// ─── Scoring Engine ───────────────────────────────────────────────────────────

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

  for (const s of firedInjects) {
    const domain = s.inject.domain;
    if (!domainMap.has(domain)) {
      domainMap.set(domain, { domain, injectCount: 0, detected: 0, resolved: 0 });
    }
    const entry = domainMap.get(domain)!;
    entry.injectCount++;

    if (s.inject.requiresHumanApproval) humanApprovalsRequired++;

    if (!s.response) {
      missed++;
      missedSteps.push(`[${s.inject.domain.toUpperCase()}] ${s.inject.title}`);
      continue;
    }

    if (s.inject.requiresHumanApproval && s.response.humanApprovalGiven) {
      humanApprovalsGiven++;
    }

    const firedMs = new Date(s.firedAt!).getTime();
    const respondedMs = new Date(s.response.respondedAt).getTime();
    const diffMin = Math.max(0, (respondedMs - firedMs) / 60_000);

    switch (s.response.responseType) {
      case 'detected':
        detected++;
        entry.detected++;
        detectMinutes.push(diffMin);
        break;
      case 'contained':
        detected++;
        contained++;
        entry.detected++;
        detectMinutes.push(diffMin);
        break;
      case 'resolved':
        detected++;
        contained++;
        resolved++;
        entry.detected++;
        entry.resolved++;
        detectMinutes.push(diffMin);
        resolveMinutes.push(diffMin);
        break;
      case 'escalated':
        detected++;
        entry.detected++;
        detectMinutes.push(diffMin);
        break;
      case 'missed':
        missed++;
        missedSteps.push(`[${s.inject.domain.toUpperCase()}] ${s.inject.title}`);
        break;
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

  // Score: weighted components
  const detectionRate = totalInjects > 0 ? detected / totalInjects : 0;
  const resolutionRate = totalInjects > 0 ? resolved / totalInjects : 0;
  const approvalRate = humanApprovalsRequired > 0 ? humanApprovalsGiven / humanApprovalsRequired : 1;
  const missRate = totalInjects > 0 ? missed / totalInjects : 0;

  const rawScore =
    detectionRate * 40 +
    resolutionRate * 30 +
    approvalRate * 20 +
    (1 - missRate) * 10;

  const overallScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  const grade: DrillScore['grade'] =
    overallScore >= 90 ? 'A' :
    overallScore >= 75 ? 'B' :
    overallScore >= 60 ? 'C' :
    overallScore >= 40 ? 'D' : 'F';

  const verdict =
    overallScore >= 90
      ? 'Exemplary response — platform and team performed at best-in-class standard.'
      : overallScore >= 75
      ? 'Solid response with minor gaps. Targeted remediation recommended.'
      : overallScore >= 60
      ? 'Adequate response but significant gaps in detection or resolution. Action required.'
      : overallScore >= 40
      ? 'Below standard. Multiple critical injects missed. Immediate runbook review required.'
      : 'Failing response. Material gaps in team readiness. Crisis simulation should be re-run after remediation.';

  const recommendations: string[] = [];
  if (detectionRate < 0.8) {
    recommendations.push('Improve alert triage SLA — target detection within 30 minutes of inject.');
  }
  if (resolutionRate < 0.6) {
    recommendations.push('Strengthen runbook completeness — resolution steps unclear or untested.');
  }
  if (approvalRate < 1) {
    recommendations.push('Human approval gates were missed. Review escalation tree and authority matrix.');
  }
  if (missed > 2) {
    recommendations.push(`${missed} injects went unanswered. Run tabletop exercise specifically for missed domains.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Continue periodic drills. Consider increasing inject density to simulate concurrent crises.');
  }

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
  };
}
