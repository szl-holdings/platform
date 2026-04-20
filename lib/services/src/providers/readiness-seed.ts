const today = new Date();

export type Program = {
  id: string;
  name: string;
  description: string;
  overallScore: number;
  targetScore: number;
  status: 'active' | 'paused' | 'completed' | 'archived';
  owner: string;
  createdAt: string;
};

export type Dimension = {
  id: string;
  programId: string;
  name: string;
  category:
    | 'operational'
    | 'security'
    | 'compliance'
    | 'financial'
    | 'technical'
    | 'strategic'
    | 'people'
    | 'process';
  currentScore: number;
  targetScore: number;
  maxScore: number;
  assessorName: string;
  lastAssessedAt: string;
};

export type Milestone = {
  id: string;
  programId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'canceled';
  dueDate: string;
  owner: string;
};

export type Risk = {
  id: string;
  programId: string;
  dimensionId?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: 'very_likely' | 'likely' | 'possible' | 'unlikely';
  status: 'open' | 'mitigating' | 'resolved' | 'accepted';
  mitigation: string;
  owner: string;
  createdAt: string;
};

export type Alert = {
  id: string;
  programId: string;
  type:
    | 'score_drop'
    | 'milestone_overdue'
    | 'risk_escalation'
    | 'target_missed'
    | 'improvement'
    | 'general';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  isRead: boolean;
  createdAt: string;
};

export type ScoreHistory = {
  id: string;
  dimensionId: string;
  score: number;
  recordedAt: string;
};

export const mockPrograms: Program[] = [
  {
    id: 'p_1',
    name: 'Zero-Trust Architecture Migration',
    description:
      'Enterprise-wide Zero Trust Network Architecture (ZTNA) implementation aligned with NIST SP 800-207 and CISA Zero Trust Maturity Model. Covers identity-centric perimeter, micro-segmentation, continuous verification, and least-privilege access across all business units.',
    overallScore: 74.3,
    targetScore: 90,
    status: 'active',
    owner: 'CISO Office / Dr. Elena Vasquez',
    createdAt: new Date(today.getTime() - 210 * 86400000).toISOString(),
  },
  {
    id: 'p_2',
    name: 'FedRAMP Cloud Modernization',
    description:
      'Migration of on-premises infrastructure to FedRAMP-authorized cloud environments (AWS GovCloud, Azure Government). Includes ATO package preparation, continuous monitoring per NIST SP 800-137, and legacy system decommissioning.',
    overallScore: 61.8,
    targetScore: 85,
    status: 'active',
    owner: 'CTO Office / James Harrington',
    createdAt: new Date(today.getTime() - 90 * 86400000).toISOString(),
  },
  {
    id: 'p_3',
    name: 'Digital Supply Chain Resilience',
    description:
      'End-to-end supply chain digitization with real-time visibility, SBOM management per EO 14028, and third-party risk scoring aligned with NIST Cybersecurity Supply Chain Risk Management (C-SCRM) practices.',
    overallScore: 55.2,
    targetScore: 80,
    status: 'active',
    owner: 'VP Supply Chain / Maria Santos',
    createdAt: new Date(today.getTime() - 60 * 86400000).toISOString(),
  },
];

export const mockDimensions: Dimension[] = [
  {
    id: 'd_1',
    programId: 'p_1',
    name: 'Identity & Access Mgmt (NIST CSF PR.AC)',
    category: 'security',
    currentScore: 82,
    targetScore: 95,
    maxScore: 100,
    assessorName: 'Dr. Elena Vasquez',
    lastAssessedAt: new Date(today.getTime() - 2 * 86400000).toISOString(),
  },
  {
    id: 'd_2',
    programId: 'p_1',
    name: 'Network Segmentation (CMMC L3)',
    category: 'technical',
    currentScore: 68,
    targetScore: 85,
    maxScore: 100,
    assessorName: 'Marcus Cole, CISSP',
    lastAssessedAt: new Date(today.getTime() - 4 * 86400000).toISOString(),
  },
  {
    id: 'd_3',
    programId: 'p_1',
    name: 'Continuous Monitoring (NIST SP 800-137)',
    category: 'operational',
    currentScore: 71,
    targetScore: 90,
    maxScore: 100,
    assessorName: 'Sarah Kim, CISM',
    lastAssessedAt: new Date(today.getTime() - 1 * 86400000).toISOString(),
  },
  {
    id: 'd_4',
    programId: 'p_1',
    name: 'Data Protection (ISO 27001 A.8)',
    category: 'compliance',
    currentScore: 88,
    targetScore: 90,
    maxScore: 100,
    assessorName: 'David Thornton, CISA',
    lastAssessedAt: new Date(today.getTime() - 7 * 86400000).toISOString(),
  },
  {
    id: 'd_5',
    programId: 'p_1',
    name: 'Incident Response (NIST CSF RS)',
    category: 'operational',
    currentScore: 76,
    targetScore: 85,
    maxScore: 100,
    assessorName: 'Lt. Col. (Ret.) Frank Reeves',
    lastAssessedAt: new Date(today.getTime() - 3 * 86400000).toISOString(),
  },
  {
    id: 'd_6',
    programId: 'p_1',
    name: 'Workforce Cyber Readiness (NICE Framework)',
    category: 'people',
    currentScore: 58,
    targetScore: 80,
    maxScore: 100,
    assessorName: 'Dr. Amara Osei',
    lastAssessedAt: new Date(today.getTime() - 10 * 86400000).toISOString(),
  },
  {
    id: 'd_7',
    programId: 'p_1',
    name: 'Supply Chain Risk (NIST CSF ID.SC)',
    category: 'strategic',
    currentScore: 64,
    targetScore: 80,
    maxScore: 100,
    assessorName: 'Maria Santos',
    lastAssessedAt: new Date(today.getTime() - 5 * 86400000).toISOString(),
  },
  {
    id: 'd_8',
    programId: 'p_1',
    name: 'Governance & Policy (ISO 27001 A.5)',
    category: 'process',
    currentScore: 91,
    targetScore: 90,
    maxScore: 100,
    assessorName: 'Chief Compliance Officer',
    lastAssessedAt: new Date(today.getTime() - 12 * 86400000).toISOString(),
  },
];

export const mockMilestones: Milestone[] = [
  {
    id: 'm_1',
    programId: 'p_1',
    title: 'NIST CSF Gap Assessment Complete',
    description:
      'Finalize current-state assessment against all five NIST CSF functions (Identify, Protect, Detect, Respond, Recover) with maturity scoring per Tier 1-4 model.',
    status: 'completed',
    dueDate: new Date(today.getTime() - 45 * 86400000).toISOString(),
    owner: 'Dr. Elena Vasquez',
  },
  {
    id: 'm_2',
    programId: 'p_1',
    title: 'Identity Provider (IdP) Migration',
    description:
      'Complete migration from legacy LDAP to Okta/Azure AD with SAML 2.0 and OIDC federation. Enforce MFA across all privileged accounts per NIST SP 800-63B AAL2.',
    status: 'completed',
    dueDate: new Date(today.getTime() - 14 * 86400000).toISOString(),
    owner: 'IAM Engineering Team',
  },
  {
    id: 'm_3',
    programId: 'p_1',
    title: 'Micro-Segmentation Phase 1 Deployment',
    description:
      'Deploy software-defined perimeter (SDP) for Tier 1 critical assets. Implement east-west traffic inspection and policy enforcement at the workload level.',
    status: 'in_progress',
    dueDate: new Date(today.getTime() + 12 * 86400000).toISOString(),
    owner: 'Marcus Cole, CISSP',
  },
  {
    id: 'm_4',
    programId: 'p_1',
    title: 'SIEM/SOAR Integration & Playbook Validation',
    description:
      'Integrate Splunk SIEM with SOAR platform. Validate automated incident response playbooks for MITRE ATT&CK top 10 TTPs. Conduct tabletop exercises with SOC team.',
    status: 'in_progress',
    dueDate: new Date(today.getTime() + 25 * 86400000).toISOString(),
    owner: 'Lt. Col. (Ret.) Frank Reeves',
  },
  {
    id: 'm_5',
    programId: 'p_1',
    title: 'Workforce Security Awareness Training (NICE-aligned)',
    description:
      'Complete role-based cybersecurity training aligned with NICE Workforce Framework. Achieve 90% completion rate with phishing simulation pass rate above 85%.',
    status: 'overdue',
    dueDate: new Date(today.getTime() - 5 * 86400000).toISOString(),
    owner: 'Dr. Amara Osei',
  },
  {
    id: 'm_6',
    programId: 'p_1',
    title: 'Third-Party Risk Assessment (TPRM)',
    description:
      'Complete Tier 1 vendor risk assessments using SIG Lite questionnaire. Validate SOC 2 Type II reports for all critical service providers. Implement continuous monitoring via SecurityScorecard.',
    status: 'pending',
    dueDate: new Date(today.getTime() + 40 * 86400000).toISOString(),
    owner: 'Maria Santos',
  },
  {
    id: 'm_7',
    programId: 'p_1',
    title: 'ATO Package Submission (FedRAMP Moderate)',
    description:
      'Prepare and submit Authorization to Operate (ATO) package including SSP, SAR, POA&M, and continuous monitoring plan to 3PAO for independent assessment.',
    status: 'pending',
    dueDate: new Date(today.getTime() + 75 * 86400000).toISOString(),
    owner: 'David Thornton, CISA',
  },
  {
    id: 'm_8',
    programId: 'p_1',
    title: 'Zero Trust Architecture Board Review',
    description:
      'Present ZTA implementation progress to Architecture Review Board. Obtain formal Go/No-Go decision for Phase 2 rollout to non-critical business systems.',
    status: 'pending',
    dueDate: new Date(today.getTime() + 55 * 86400000).toISOString(),
    owner: 'CISO Office',
  },
];

export const mockRisks: Risk[] = [
  {
    id: 'r_1',
    programId: 'p_1',
    dimensionId: 'd_6',
    title: 'Critical Cybersecurity Talent Shortage',
    description:
      'Two senior Zero Trust architects and one SIEM engineer have tendered resignations. Current labor market shows 3.4M unfilled cybersecurity positions globally (ISC2 2024). Replacement timeline estimated at 90-120 days, creating a critical skills gap during Phase 1 micro-segmentation deployment.',
    severity: 'critical',
    likelihood: 'very_likely',
    status: 'open',
    mitigation:
      'Engage Booz Allen Hamilton for interim ZTA consulting. Activate SANS cyber workforce development pipeline. Negotiate retention bonuses for remaining senior staff. Accelerate knowledge transfer documentation per NIST NICE framework.',
    owner: 'CISO Office / Dr. Elena Vasquez',
    createdAt: new Date(today.getTime() - 3 * 86400000).toISOString(),
  },
  {
    id: 'r_2',
    programId: 'p_1',
    dimensionId: 'd_2',
    title: 'Legacy OT/SCADA System Incompatibility',
    description:
      'Operational Technology systems running legacy protocols (Modbus, DNP3) cannot support modern micro-segmentation agents. Purdue Model Level 2-3 assets have no path to Zero Trust without hardware refresh. Affects 23% of network infrastructure.',
    severity: 'high',
    likelihood: 'likely',
    status: 'mitigating',
    mitigation:
      'Deploy Claroty/Dragos for OT-specific network monitoring. Implement compensating controls per IEC 62443. Create air-gapped DMZ between IT and OT networks. Submit capital expenditure request for FY26 hardware refresh cycle.',
    owner: 'Marcus Cole, CISSP',
    createdAt: new Date(today.getTime() - 8 * 86400000).toISOString(),
  },
  {
    id: 'r_3',
    programId: 'p_1',
    dimensionId: 'd_4',
    title: 'Data Residency & Sovereignty Compliance Gap',
    description:
      'Cloud migration to AWS GovCloud may violate GDPR Article 46 data transfer requirements for EU-origin PII. Schrems II ruling implications not fully addressed in current Data Protection Impact Assessment (DPIA). Potential for regulatory enforcement action.',
    severity: 'high',
    likelihood: 'possible',
    status: 'open',
    mitigation:
      'Engage external counsel for updated DPIA under GDPR/Schrems II. Implement AWS CloudHSM for encryption key sovereignty. Evaluate EU-based region deployment for affected data categories. Prepare Standard Contractual Clauses (SCCs) with supplementary measures.',
    owner: 'David Thornton, CISA',
    createdAt: new Date(today.getTime() - 1 * 86400000).toISOString(),
  },
  {
    id: 'r_4',
    programId: 'p_1',
    dimensionId: 'd_3',
    title: 'SIEM Alert Fatigue & Detection Efficacy',
    description:
      'Current SIEM generating 12,000+ alerts/day with estimated 94% false positive rate. SOC analyst burnout contributing to mean-time-to-detect (MTTD) of 197 hours, significantly above industry benchmark of 72 hours (IBM X-Force 2024).',
    severity: 'medium',
    likelihood: 'likely',
    status: 'mitigating',
    mitigation:
      'Deploy SOAR-driven alert triage with ML-based correlation. Implement MITRE ATT&CK-based detection engineering. Reduce alert volume to actionable threshold (<500/day). Establish tiered escalation procedures aligned with NIST SP 800-61r2.',
    owner: 'Lt. Col. (Ret.) Frank Reeves',
    createdAt: new Date(today.getTime() - 12 * 86400000).toISOString(),
  },
  {
    id: 'r_5',
    programId: 'p_1',
    dimensionId: 'd_7',
    title: 'Third-Party Supply Chain Concentration Risk',
    description:
      'Analysis reveals 67% of critical software dependencies sourced from three vendors. No validated Software Bill of Materials (SBOM) exists for 41% of deployed applications. SolarWinds/Log4j-class supply chain attack would affect entire Zero Trust deployment.',
    severity: 'critical',
    likelihood: 'possible',
    status: 'open',
    mitigation:
      'Mandate SBOM generation per EO 14028 and NTIA minimum elements. Deploy Snyk/Sonatype for continuous dependency scanning. Implement vendor diversification strategy for critical components. Establish software supply chain incident response plan per SSDF (NIST SP 800-218).',
    owner: 'Maria Santos',
    createdAt: new Date(today.getTime() - 6 * 86400000).toISOString(),
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 'a_1',
    programId: 'p_1',
    type: 'risk_escalation',
    title: 'CRITICAL: Workforce Readiness Below CMMC Threshold',
    message:
      'Workforce Cyber Readiness score (58) has fallen below CMMC Level 3 minimum threshold of 65. Two senior ZTA architects departed this week. Immediate remediation required to maintain CMMC certification eligibility.',
    severity: 'critical',
    isRead: false,
    createdAt: new Date(today.getTime() - 0 * 86400000).toISOString(),
  },
  {
    id: 'a_2',
    programId: 'p_1',
    type: 'milestone_overdue',
    title: 'Overdue: NICE-Aligned Security Training',
    message:
      'Workforce Security Awareness Training milestone is 5 days past due. Current completion rate at 62% against 90% target. Non-compliance with NIST SP 800-50 training requirements may delay ATO submission.',
    severity: 'critical',
    isRead: false,
    createdAt: new Date(today.getTime() - 1 * 86400000).toISOString(),
  },
  {
    id: 'a_3',
    programId: 'p_1',
    type: 'score_drop',
    title: 'Network Segmentation Score Degraded',
    message:
      'Network Segmentation (CMMC L3) dimension dropped 4 points to 68 following discovery of unpatched east-west traffic paths in OT environment. Compensating controls under evaluation.',
    severity: 'warning',
    isRead: false,
    createdAt: new Date(today.getTime() - 2 * 86400000).toISOString(),
  },
  {
    id: 'a_4',
    programId: 'p_1',
    type: 'improvement',
    title: 'Governance & Policy Target Achieved',
    message:
      'ISO 27001 Annex A.5 Governance & Policy dimension has reached target score of 90. Information Security Management System (ISMS) documentation now meets Stage 2 audit requirements.',
    severity: 'info',
    isRead: true,
    createdAt: new Date(today.getTime() - 3 * 86400000).toISOString(),
  },
  {
    id: 'a_5',
    programId: 'p_1',
    type: 'target_missed',
    title: 'Supply Chain Risk Assessment Delayed',
    message:
      'Third-Party Risk Management program reports 14 of 38 Tier 1 vendors have not returned SIG Lite questionnaires. SecurityScorecard integration pending API provisioning. NIST CSF ID.SC-2 control effectiveness at risk.',
    severity: 'warning',
    isRead: true,
    createdAt: new Date(today.getTime() - 5 * 86400000).toISOString(),
  },
  {
    id: 'a_6',
    programId: 'p_1',
    type: 'general',
    title: 'FedRAMP PMO Guidance Update',
    message:
      'FedRAMP PMO released updated Rev 5 baselines incorporating NIST SP 800-53r5 controls. 12 additional controls now required for Moderate baseline. Impact assessment in progress by compliance team.',
    severity: 'info',
    isRead: true,
    createdAt: new Date(today.getTime() - 8 * 86400000).toISOString(),
  },
];

export const mockScoreHistory: ScoreHistory[] = [];
const dimensions = ['d_1', 'd_2', 'd_3', 'd_4', 'd_5', 'd_6', 'd_7', 'd_8'];
const baseScores: Record<string, number> = {
  d_1: 52,
  d_2: 38,
  d_3: 45,
  d_4: 72,
  d_5: 50,
  d_6: 65,
  d_7: 40,
  d_8: 78,
};

dimensions.forEach((dimId) => {
  let currentScore = baseScores[dimId];
  for (let i = 6; i >= 0; i--) {
    mockScoreHistory.push({
      id: `sh_${dimId}_${i}`,
      dimensionId: dimId,
      score: currentScore,
      recordedAt: new Date(today.getTime() - i * 30 * 86400000).toISOString(),
    });
    currentScore += Math.floor(Math.random() * 8) - 1;
    if (currentScore > 100) currentScore = 100;
    if (currentScore < 0) currentScore = 0;
  }
});
