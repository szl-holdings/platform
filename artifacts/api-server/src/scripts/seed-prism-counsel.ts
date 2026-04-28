import {
  db,
  pcGcAuditEntriesTable,
  pcGcMattersTable,
  pcGcObligationsTable,
  pcGcProofChainEntriesTable,
} from '@szl-holdings/db';
import { sql } from 'drizzle-orm';

const ORG_ID = '1';

function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86_400_000);
  return d.toISOString().slice(0, 10);
}
function daysAhead(n: number): string {
  const d = new Date(Date.now() + n * 86_400_000);
  return d.toISOString().slice(0, 10);
}
function tsAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

export async function seedPrismCounsel(): Promise<Record<string, number> | { skipped: boolean }> {
  const existing = await db
    .select({ id: pcGcMattersTable.id })
    .from(pcGcMattersTable)
    .limit(1);
  if (existing.length > 0) {
    return { skipped: true };
  }

  const matters = [
    {
      id: 'matter-001',
      orgId: ORG_ID,
      name: 'Luminary Brands v. Meridian Retail Corp',
      clientName: 'Luminary Brands',
      matterNumber: 'LIT-2025-0047',
      type: 'litigation',
      status: 'active',
      privilegeLevel: 'privileged',
      pressureScore: 82,
      complexityScore: 74,
      openedDate: daysAgo(210),
      trialDate: daysAhead(62),
      nextDeadline: daysAhead(14),
      nextDeadlineLabel: 'Expert Witness Disclosure',
      leadCounsel: 'S. Harrington QC',
      jurisdiction: 'England & Wales',
      estimatedExposure: '4200000',
      summary:
        'Luminary Brands alleges trade dress infringement and passing off against Meridian Retail Corp following the launch of a competing product line that appropriates Luminary\'s distinctive packaging and colour palette. Claim includes injunctive relief, damages, and an account of profits.',
      tags: JSON.stringify(['trade-dress', 'IP', 'high-value', 'trial-prep']),
      parties: JSON.stringify([
        { id: 'p1', name: 'Luminary Brands Ltd', role: 'client' },
        { id: 'p2', name: 'Meridian Retail Corp', role: 'opposing-counsel', counsel: 'Barrow & Kline LLP' },
        { id: 'p3', name: 'Prof. D. Ashworth', role: 'expert', jurisdiction: 'England & Wales' },
      ]),
      wall: JSON.stringify({
        enabled: false,
        reason: '',
        blockedRoles: [],
        approvedUsers: [],
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      }),
    },
    {
      id: 'matter-002',
      orgId: ORG_ID,
      name: 'Vertex Capital Partners — Regulatory Inquiry',
      clientName: 'Vertex Capital Partners',
      matterNumber: 'REG-2026-0012',
      type: 'regulatory',
      status: 'escalated',
      privilegeLevel: 'restricted',
      pressureScore: 91,
      complexityScore: 87,
      openedDate: daysAgo(45),
      nextDeadline: daysAhead(7),
      nextDeadlineLabel: 'FCA Information Request Response',
      leadCounsel: 'M. Okafor',
      jurisdiction: 'United Kingdom',
      estimatedExposure: '12500000',
      summary:
        'FCA formal inquiry into Vertex Capital Partners regarding potential market conduct issues relating to Q3 2025 secondary trading activity. Response to the formal information request must be filed within the statutory window. Privilege review of communications is ongoing.',
      tags: JSON.stringify(['FCA', 'regulatory', 'privilege-review', 'urgent']),
      parties: JSON.stringify([
        { id: 'p1', name: 'Vertex Capital Partners LP', role: 'client' },
        { id: 'p2', name: 'Financial Conduct Authority', role: 'regulator' },
      ]),
      wall: JSON.stringify({
        enabled: true,
        reason: 'FCA investigation — restricted to core team only',
        blockedRoles: ['associate', 'paralegal'],
        approvedUsers: ['m.okafor', 's.harrington'],
        createdAt: tsAgo(40).toISOString(),
        createdBy: 'm.okafor',
      }),
    },
    {
      id: 'matter-003',
      orgId: ORG_ID,
      name: 'Aurelius PE — Meridian Acquisition',
      clientName: 'Aurelius Private Equity',
      matterNumber: 'TXN-2026-0034',
      type: 'transaction',
      status: 'active',
      privilegeLevel: 'confidential',
      pressureScore: 67,
      complexityScore: 79,
      openedDate: daysAgo(88),
      closingDate: daysAhead(34),
      nextDeadline: daysAhead(10),
      nextDeadlineLabel: 'CP Satisfaction — Antitrust Clearance',
      leadCounsel: 'L. Travers',
      jurisdiction: 'England & Wales / Germany',
      estimatedExposure: '0',
      summary:
        'Acting for Aurelius Private Equity on the £340M acquisition of Meridian Industrial Group. Key workstreams include competition clearance (CMA and Bundeskartellamt), warranty and indemnity negotiation, management incentive plan structuring, and completion accounts mechanism.',
      tags: JSON.stringify(['M&A', 'antitrust', 'cross-border', 'completion-accounts']),
      parties: JSON.stringify([
        { id: 'p1', name: 'Aurelius Private Equity GmbH', role: 'client' },
        { id: 'p2', name: 'Meridian Industrial Group plc', role: 'third-party', counsel: 'Allen & Overton LLP' },
        { id: 'p3', name: 'BrightPath W&I Underwriters', role: 'third-party' },
      ]),
      wall: JSON.stringify({
        enabled: false,
        reason: '',
        blockedRoles: [],
        approvedUsers: [],
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      }),
    },
    {
      id: 'matter-004',
      orgId: ORG_ID,
      name: 'Solaris Health Systems — Employment Dispute',
      clientName: 'Solaris Health Systems',
      matterNumber: 'EMP-2025-0089',
      type: 'employment',
      status: 'pending',
      privilegeLevel: 'confidential',
      pressureScore: 44,
      complexityScore: 38,
      openedDate: daysAgo(142),
      nextDeadline: daysAhead(28),
      nextDeadlineLabel: 'Tribunal Bundle Submission',
      leadCounsel: 'K. Nwosu',
      jurisdiction: 'England & Wales',
      estimatedExposure: '380000',
      summary:
        'Employment tribunal claim by former Chief Digital Officer alleging unfair dismissal and whistleblowing detriment following an internal restructuring. Solaris maintains the dismissal was a genuine redundancy. Settlement discussions are ongoing in parallel with tribunal preparation.',
      tags: JSON.stringify(['employment-tribunal', 'whistleblowing', 'settlement']),
      parties: JSON.stringify([
        { id: 'p1', name: 'Solaris Health Systems Ltd', role: 'client' },
        { id: 'p2', name: 'Dr. A. Kamara', role: 'opposing-counsel', counsel: 'Prospect Employment Law' },
      ]),
      wall: JSON.stringify({
        enabled: false,
        reason: '',
        blockedRoles: [],
        approvedUsers: [],
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      }),
    },
    {
      id: 'matter-005',
      orgId: ORG_ID,
      name: 'Oasis Wellness — IP Portfolio & Licensing',
      clientName: 'Oasis Wellness',
      matterNumber: 'IP-2026-0008',
      type: 'ip',
      status: 'active',
      privilegeLevel: 'confidential',
      pressureScore: 31,
      complexityScore: 55,
      openedDate: daysAgo(29),
      nextDeadline: daysAhead(21),
      nextDeadlineLabel: 'Patent Filing — Formulation Process',
      leadCounsel: 'R. Villanueva',
      jurisdiction: 'UK / EU',
      estimatedExposure: '0',
      summary:
        'Comprehensive IP audit, prosecution, and licensing programme for Oasis Wellness\'s proprietary supplement formulations and trade marks across UK and EU markets. Includes freedom-to-operate analysis, patent prosecution strategy, and negotiation of a cross-licensing agreement with a Nordic distributor.',
      tags: JSON.stringify(['patents', 'trade-marks', 'licensing', 'EU']),
      parties: JSON.stringify([
        { id: 'p1', name: 'Oasis Wellness UK Ltd', role: 'client' },
        { id: 'p2', name: 'NordiWell AS', role: 'third-party', jurisdiction: 'Norway' },
        { id: 'p3', name: 'UKIPO', role: 'regulator' },
      ]),
      wall: JSON.stringify({
        enabled: false,
        reason: '',
        blockedRoles: [],
        approvedUsers: [],
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      }),
    },
  ];

  await db.insert(pcGcMattersTable).values(matters);

  const obligations = [
    // Matter 001 — Luminary v Meridian
    {
      id: 'obl-001-1', matterId: 'matter-001', title: 'Expert Witness Disclosure', sortOrder: 1,
      description: 'File and serve expert reports from Prof. D. Ashworth (technical) and economic loss expert.',
      dueDate: daysAhead(14), status: 'in-progress', assignee: 'S. Harrington QC',
      dependencies: JSON.stringify([]), privilegeLevel: 'privileged', filingRequired: true,
      courtId: 'IPEC-2025-4710', consequence: 'Unless order risk — exclusion of expert evidence',
    },
    {
      id: 'obl-001-2', matterId: 'matter-001', title: 'Trial Bundle Preparation', sortOrder: 2,
      description: 'Compile agreed trial bundle with opponent. Target 3 lever-arch volumes.',
      dueDate: daysAhead(38), status: 'pending', assignee: 'L. Travers',
      dependencies: JSON.stringify(['obl-001-1']), privilegeLevel: 'confidential', filingRequired: false,
    },
    {
      id: 'obl-001-3', matterId: 'matter-001', title: 'Witness Statements — Final Review', sortOrder: 3,
      description: 'Final approval of lay witness statements by client before service.',
      dueDate: daysAhead(21), status: 'at-risk', assignee: 'K. Nwosu',
      dependencies: JSON.stringify([]), privilegeLevel: 'privileged', filingRequired: true,
      courtId: 'IPEC-2025-4710', consequence: 'Statements not served on time — court direction required',
    },
    // Matter 002 — FCA Inquiry
    {
      id: 'obl-002-1', matterId: 'matter-002', title: 'FCA Section 165 Response', sortOrder: 1,
      description: 'Draft, review, and submit formal response to FCA s.165 information request. All communications to pass privilege review before disclosure.',
      dueDate: daysAhead(7), status: 'in-progress', assignee: 'M. Okafor',
      dependencies: JSON.stringify([]), privilegeLevel: 'restricted', filingRequired: true,
      consequence: 'Criminal liability for non-compliance with s.165 FSMA 2000',
    },
    {
      id: 'obl-002-2', matterId: 'matter-002', title: 'Privilege Log Finalisation', sortOrder: 2,
      description: 'Complete privilege log for all withheld communications. Legal professional privilege and without-prejudice analysis required.',
      dueDate: daysAhead(5), status: 'in-progress', assignee: 'S. Harrington QC',
      dependencies: JSON.stringify([]), privilegeLevel: 'restricted', filingRequired: false,
      consequence: 'FCA may challenge privilege claims — litigation risk',
    },
    {
      id: 'obl-002-3', matterId: 'matter-002', title: 'Board Briefing — FCA Update', sortOrder: 3,
      description: 'Prepare privileged board memorandum summarising regulatory exposure and recommended strategy.',
      dueDate: daysAhead(10), status: 'pending', assignee: 'M. Okafor',
      dependencies: JSON.stringify(['obl-002-1']), privilegeLevel: 'restricted', filingRequired: false,
    },
    // Matter 003 — Aurelius Acquisition
    {
      id: 'obl-003-1', matterId: 'matter-003', title: 'CMA Phase 1 Clearance', sortOrder: 1,
      description: 'Monitor CMA review timetable and respond to any information requests within the statutory window.',
      dueDate: daysAhead(10), status: 'in-progress', assignee: 'L. Travers',
      dependencies: JSON.stringify([]), privilegeLevel: 'confidential', filingRequired: true,
      consequence: 'Phase 2 reference if not cleared — 24-week delay and deal risk',
    },
    {
      id: 'obl-003-2', matterId: 'matter-003', title: 'Completion Accounts Mechanism', sortOrder: 2,
      description: 'Agree locked-box vs. completion accounts mechanism with seller counsel. Draft schedule to SPA.',
      dueDate: daysAhead(18), status: 'pending', assignee: 'R. Villanueva',
      dependencies: JSON.stringify([]), privilegeLevel: 'confidential', filingRequired: false,
    },
    {
      id: 'obl-003-3', matterId: 'matter-003', title: 'W&I Policy — Disclosure Letter Review', sortOrder: 3,
      description: 'Review seller disclosure letter against W&I policy schedules and identify uncovered items.',
      dueDate: daysAhead(14), status: 'in-progress', assignee: 'K. Nwosu',
      dependencies: JSON.stringify([]), privilegeLevel: 'confidential', filingRequired: false,
    },
    // Matter 004 — Solaris Employment
    {
      id: 'obl-004-1', matterId: 'matter-004', title: 'ET1 Response Bundle', sortOrder: 1,
      description: 'Compile claimant and respondent documents for tribunal bundle per Employment Tribunal Rules.',
      dueDate: daysAhead(28), status: 'pending', assignee: 'K. Nwosu',
      dependencies: JSON.stringify([]), privilegeLevel: 'confidential', filingRequired: true,
      courtId: 'ET-2025-122840', consequence: 'Unless order and wasted costs risk',
    },
    {
      id: 'obl-004-2', matterId: 'matter-004', title: 'Mediation ACAS Certificate Review', sortOrder: 2,
      description: 'Confirm ACAS Early Conciliation certificate and assess ACAS settlement offer received.',
      dueDate: daysAhead(7), status: 'at-risk', assignee: 'K. Nwosu',
      dependencies: JSON.stringify([]), privilegeLevel: 'confidential', filingRequired: false,
      consequence: 'Delay in settlement decision — costs exposure grows',
    },
    // Matter 005 — Oasis IP
    {
      id: 'obl-005-1', matterId: 'matter-005', title: 'UK Patent Application Filing', sortOrder: 1,
      description: 'File UK patent application for proprietary emulsification process with UKIPO. Priority date must be secured before any public disclosure.',
      dueDate: daysAhead(21), status: 'in-progress', assignee: 'R. Villanueva',
      dependencies: JSON.stringify([]), privilegeLevel: 'confidential', filingRequired: true,
      consequence: 'Loss of priority date — EU filing invalidated',
    },
    {
      id: 'obl-005-2', matterId: 'matter-005', title: 'Licensing Term Sheet — NordiWell', sortOrder: 2,
      description: 'Negotiate and execute non-exclusive licensing term sheet covering Scandinavian territory.',
      dueDate: daysAhead(45), status: 'pending', assignee: 'R. Villanueva',
      dependencies: JSON.stringify(['obl-005-1']), privilegeLevel: 'confidential', filingRequired: false,
    },
  ];

  await db.insert(pcGcObligationsTable).values(obligations);

  const auditEntries = [
    { id: 'aud-001-1', matterId: 'matter-001', timestamp: tsAgo(5), user: 'S. Harrington QC', role: 'Lead Counsel', action: 'edited', detail: 'Updated trial date and expert witness schedule following PTR hearing.', ip: '10.0.1.4' },
    { id: 'aud-001-2', matterId: 'matter-001', timestamp: tsAgo(2), user: 'L. Travers', role: 'Associate', action: 'viewed', detail: 'Reviewed claimant expert report for trial bundle.', ip: '10.0.1.8' },
    { id: 'aud-002-1', matterId: 'matter-002', timestamp: tsAgo(3), user: 'M. Okafor', role: 'Lead Counsel', action: 'accessed-wall', detail: 'Accessed restricted matter under ethical wall — confirmed authorised access.', ip: '10.0.1.4' },
    { id: 'aud-002-2', matterId: 'matter-002', timestamp: tsAgo(1), user: 'M. Okafor', role: 'Lead Counsel', action: 'edited', detail: 'Escalated matter status following FCA follow-up letter received.', ip: '10.0.1.4' },
    { id: 'aud-003-1', matterId: 'matter-003', timestamp: tsAgo(10), user: 'L. Travers', role: 'Lead Associate', action: 'edited', detail: 'Updated CMA timetable and added Bundeskartellamt parallel filing obligation.', ip: '10.0.1.8' },
    { id: 'aud-003-2', matterId: 'matter-003', timestamp: tsAgo(4), user: 'R. Villanueva', role: 'Associate', action: 'edited', detail: 'Commenced W&I policy disclosure letter review. 3 uncovered items flagged.', ip: '10.0.1.9' },
    { id: 'aud-004-1', matterId: 'matter-004', timestamp: tsAgo(21), user: 'K. Nwosu', role: 'Lead Counsel', action: 'edited', detail: 'Matter opened following receipt of ET1 claim. Respondent ET3 filed.', ip: '10.0.1.5' },
    { id: 'aud-004-2', matterId: 'matter-004', timestamp: tsAgo(6), user: 'K. Nwosu', role: 'Lead Counsel', action: 'deadline-updated', detail: 'Tribunal bundle date confirmed as ' + daysAhead(28) + ' per case management order.', ip: '10.0.1.5' },
    { id: 'aud-005-1', matterId: 'matter-005', timestamp: tsAgo(12), user: 'R. Villanueva', role: 'IP Counsel', action: 'edited', detail: 'Freedom-to-operate analysis complete. No blocking prior art identified. Patent strategy approved.', ip: '10.0.1.9' },
    { id: 'aud-005-2', matterId: 'matter-005', timestamp: tsAgo(3), user: 'R. Villanueva', role: 'IP Counsel', action: 'edited', detail: 'NordiWell licensing term sheet negotiation commenced. Initial positions exchanged.', ip: '10.0.1.9' },
  ];

  await db.insert(pcGcAuditEntriesTable).values(auditEntries);

  const proofChain = [
    { id: 'prf-001-1', matterId: 'matter-001', timestamp: tsAgo(180), eventType: 'filing', title: 'Claim Form Issued', summary: 'Claim form issued in IPEC for trade dress infringement and passing off.', privilegeLevel: 'public', author: 'S. Harrington QC', parties: JSON.stringify(['Luminary Brands Ltd', 'Meridian Retail Corp']), documentRef: 'IPEC-2025-4710-CF', hash: 'sha256:a1b2c3d4', redacted: false },
    { id: 'prf-001-2', matterId: 'matter-001', timestamp: tsAgo(140), eventType: 'discovery', title: 'Disclosure Schedule Served', summary: 'Standard disclosure schedule served by both parties. 1,240 documents disclosed by respondent.', privilegeLevel: 'confidential', author: 'L. Travers', parties: JSON.stringify(['Luminary Brands Ltd']), documentRef: 'IPEC-DS-001', hash: 'sha256:b3c4d5e6', redacted: false },
    { id: 'prf-001-3', matterId: 'matter-001', timestamp: tsAgo(30), eventType: 'hearing', title: 'Pre-Trial Review Hearing', summary: 'PTR heard before HHJ Halpin. Trial dates confirmed. Expert witness directions made.', privilegeLevel: 'public', author: 'S. Harrington QC', parties: JSON.stringify(['Luminary Brands Ltd', 'Meridian Retail Corp']), documentRef: 'IPEC-PTR-2026-001', hash: 'sha256:c5d6e7f8', redacted: false },
    { id: 'prf-002-1', matterId: 'matter-002', timestamp: tsAgo(44), eventType: 'communication', title: 'FCA Section 165 Notice Received', summary: 'Formal information request received from FCA under s.165 FSMA 2000. 30-day response window commenced.', privilegeLevel: 'restricted', author: 'M. Okafor', parties: JSON.stringify(['Vertex Capital Partners LP', 'Financial Conduct Authority']), documentRef: 'FCA-REF-2026-0341', hash: 'sha256:d7e8f9a0', redacted: false },
    { id: 'prf-002-2', matterId: 'matter-002', timestamp: tsAgo(28), eventType: 'communication', title: 'Privilege Review — Withheld Communications Log', summary: 'Completed privilege review of 847 communications. 213 withheld under legal professional privilege. Privilege log filed.', privilegeLevel: 'restricted', author: 'S. Harrington QC', parties: JSON.stringify(['Vertex Capital Partners LP']), hash: 'sha256:e9f0a1b2', redacted: true },
    { id: 'prf-003-1', matterId: 'matter-003', timestamp: tsAgo(85), eventType: 'filing', title: 'SPA Heads of Terms Executed', summary: 'Heads of Terms executed for £340M acquisition. Exclusivity period of 60 days agreed.', privilegeLevel: 'confidential', author: 'L. Travers', parties: JSON.stringify(['Aurelius Private Equity GmbH', 'Meridian Industrial Group plc']), documentRef: 'AUR-HOT-2025-001', hash: 'sha256:f1a2b3c4', redacted: false },
    { id: 'prf-003-2', matterId: 'matter-003', timestamp: tsAgo(42), eventType: 'filing', title: 'CMA Merger Notice Filed', summary: 'Voluntary Phase 1 merger notice submitted to CMA. Statutory review period commenced.', privilegeLevel: 'public', author: 'L. Travers', parties: JSON.stringify(['Aurelius Private Equity GmbH', 'Meridian Industrial Group plc']), documentRef: 'CMA-ME-2025-0892', hash: 'sha256:a3b4c5d6', redacted: false },
    { id: 'prf-003-3', matterId: 'matter-003', timestamp: tsAgo(10), eventType: 'order', title: 'CMA Phase 1 — Unconditional Clearance', summary: 'CMA granted unconditional clearance at Phase 1. No substantial lessening of competition found.', privilegeLevel: 'public', author: 'L. Travers', parties: JSON.stringify(['Aurelius Private Equity GmbH', 'Meridian Industrial Group plc', 'Competition and Markets Authority']), documentRef: 'CMA-DEC-2026-0892', hash: 'sha256:b5c6d7e8', redacted: false },
    { id: 'prf-004-1', matterId: 'matter-004', timestamp: tsAgo(141), eventType: 'filing', title: 'ACAS Early Conciliation Certificate Issued', summary: 'ACAS EC certificate issued — conciliation unsuccessful. Tribunal claim window open.', privilegeLevel: 'confidential', author: 'K. Nwosu', parties: JSON.stringify(['Solaris Health Systems Ltd', 'Dr. A. Kamara']), documentRef: 'ACAS-EC-2025-44912', hash: 'sha256:c7d8e9f0', redacted: false },
    { id: 'prf-004-2', matterId: 'matter-004', timestamp: tsAgo(120), eventType: 'filing', title: 'ET1 Claim Received', summary: 'Employment tribunal claim received alleging unfair dismissal and whistleblowing detriment. Quantum: £380,000.', privilegeLevel: 'confidential', author: 'K. Nwosu', parties: JSON.stringify(['Solaris Health Systems Ltd', 'Dr. A. Kamara']), documentRef: 'ET-2025-122840', hash: 'sha256:d9e0f1a2', redacted: false },
    { id: 'prf-005-1', matterId: 'matter-005', timestamp: tsAgo(28), eventType: 'expert-report', title: 'Freedom-to-Operate Analysis Completed', summary: 'FTO analysis across UK and EU patent landscape. No blocking prior art. Green light for patent prosecution.', privilegeLevel: 'confidential', author: 'R. Villanueva', parties: JSON.stringify(['Oasis Wellness UK Ltd']), documentRef: 'OAW-FTO-2026-001', hash: 'sha256:e1f2a3b4', redacted: false },
    { id: 'prf-005-2', matterId: 'matter-005', timestamp: tsAgo(14), eventType: 'communication', title: 'NordiWell Licensing Proposal Received', summary: 'NordiWell AS submitted licensing term sheet for Scandinavian distribution. Royalty rate of 4.5% proposed.', privilegeLevel: 'confidential', author: 'R. Villanueva', parties: JSON.stringify(['Oasis Wellness UK Ltd', 'NordiWell AS']), documentRef: 'OAW-LIC-2026-001', hash: 'sha256:f3a4b5c6', redacted: false },
  ];

  await db.insert(pcGcProofChainEntriesTable).values(proofChain);

  return {
    matters: matters.length,
    obligations: obligations.length,
    auditEntries: auditEntries.length,
    proofChainEntries: proofChain.length,
  };
}

