import { logger } from "./logger";
import { pool } from "@szl-holdings/db";
import { emitDomainEvent } from "./mastra/event-triggers";

export interface FilingDeadline {
  matterId: number;
  matterTitle: string;
  caseNumber: string | null;
  deadlineId: number;
  deadlineType: string;
  dueDate: Date;
  daysRemaining: number;
  isBreached: boolean;
  priority: string;
  status: string;
  urgency: "critical" | "urgent" | "upcoming" | "monitor";
  preFilingChecklist: PreFilingChecklistItem[];
}

export interface PreFilingChecklistItem {
  item: string;
  category: "documentation" | "procedural" | "deadline" | "review";
  required: boolean;
}

function buildPreFilingChecklist(deadlineType: string, daysRemaining: number): PreFilingChecklistItem[] {
  const baseChecklist: PreFilingChecklistItem[] = [
    { item: "Confirm filing deadline date in court calendar", category: "deadline", required: true },
    { item: "Verify court filing fees and payment method", category: "procedural", required: true },
    { item: "Confirm e-filing vs. paper filing requirements", category: "procedural", required: true },
    { item: "Obtain supervising attorney signature/approval", category: "review", required: true },
  ];

  const typeSpecific: Record<string, PreFilingChecklistItem[]> = {
    statute_of_limitations: [
      { item: "Calculate exact SOL expiry date from date of loss", category: "deadline", required: true },
      { item: "Draft summons and complaint", category: "documentation", required: true },
      { item: "Identify all defendants for service", category: "documentation", required: true },
      { item: "Confirm service of process method for each defendant", category: "procedural", required: true },
      { item: "File index number application", category: "procedural", required: true },
      { item: "Arrange process server for timely service", category: "procedural", required: true },
    ],
    no_fault_ack: [
      { item: "Prepare AAA arbitration demand form", category: "documentation", required: true },
      { item: "Attach all denied bills with denial letters", category: "documentation", required: true },
      { item: "Calculate total amount in dispute", category: "documentation", required: true },
      { item: "Verify arbitration filing fee", category: "procedural", required: true },
      { item: "Confirm AAA portal access and case docketing", category: "procedural", required: true },
    ],
    no_fault_verify: [
      { item: "Schedule EUO appearance (if applicable)", category: "procedural", required: true },
      { item: "Prepare client for EUO questions", category: "review", required: true },
      { item: "Gather all treatment records for EUO date", category: "documentation", required: true },
    ],
    no_fault_pay_deny: [
      { item: "Draft disclaimer letter with legal basis", category: "documentation", required: true },
      { item: "Identify all grounds for coverage denial", category: "review", required: true },
      { item: "Review Ins. Law § 3420(d) timeliness requirements", category: "documentation", required: true },
      { item: "Certify mail / service confirmation", category: "procedural", required: true },
    ],
    bill_submission: [
      { item: "Compile all outstanding bills with supporting documentation", category: "documentation", required: true },
      { item: "Verify billing codes and amounts", category: "review", required: true },
      { item: "Prepare claim package for submission", category: "documentation", required: true },
    ],
    filing: [
      { item: "Draft all required pleadings", category: "documentation", required: true },
      { item: "Complete court cover sheet", category: "procedural", required: true },
      { item: "Verify local court rules for formatting", category: "procedural", required: true },
    ],
    motion: [
      { item: "Prepare motion papers (notice, affirmation, memorandum)", category: "documentation", required: true },
      { item: "Research supporting case law", category: "review", required: true },
      { item: "File proof of service with court", category: "procedural", required: true },
    ],
    notice_of_claim: [
      { item: "Complete Notice of Claim form (General Municipal Law § 50-e)", category: "documentation", required: true },
      { item: "Identify proper municipal entity as respondent", category: "documentation", required: true },
      { item: "Serve within 90-day statutory deadline", category: "deadline", required: true },
    ],
    discovery_cutoff: [
      { item: "Confirm all discovery requests are served and responded to", category: "procedural", required: true },
      { item: "File note of issue with court (if applicable)", category: "procedural", required: true },
      { item: "Ensure all depositions are completed", category: "documentation", required: true },
    ],
  };

  const specific = [...(typeSpecific[deadlineType] ?? [])];

  if (daysRemaining <= 7) {
    specific.push({ item: "URGENT: Verify filing is prepared for same-day or next-day submission", category: "deadline", required: true });
  }

  return [...specific, ...baseChecklist];
}

export async function scanApproachingDeadlines(options: {
  daysAhead?: number;
  orgId?: number;
} = {}): Promise<FilingDeadline[]> {
  const daysAhead = options.daysAhead ?? 14;
  const now = new Date();
  const horizon = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  try {
    const params: unknown[] = [horizon];
    let orgFilter = "";
    if (options.orgId !== undefined) {
      params.push(options.orgId);
      orgFilter = `AND m.org_id = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
         d.id as deadline_id,
         d.matter_id,
         d.deadline_type,
         d.due_date,
         d.priority,
         d.status,
         m.title as matter_title,
         m.case_number,
         m.org_id
       FROM pc_deadlines d
       JOIN pc_matters m ON d.matter_id = m.id
       WHERE d.status = 'pending'
         AND d.due_date <= $1
         ${orgFilter}
       ORDER BY d.due_date ASC
       LIMIT 100`,
      params
    );

    const deadlines: FilingDeadline[] = [];

    for (const row of result.rows) {
      const dueDate = new Date(row.due_date);
      const msRemaining = dueDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msRemaining / 86400000);
      const isBreached = daysRemaining < 0;

      const urgency: FilingDeadline["urgency"] =
        isBreached || daysRemaining <= 0 ? "critical" :
        daysRemaining <= 3 ? "critical" :
        daysRemaining <= 7 ? "urgent" :
        daysRemaining <= 14 ? "upcoming" : "monitor";

      const checklist = buildPreFilingChecklist(row.deadline_type, daysRemaining);

      deadlines.push({
        matterId: row.matter_id,
        matterTitle: row.matter_title,
        caseNumber: row.case_number,
        deadlineId: row.deadline_id,
        deadlineType: row.deadline_type,
        dueDate,
        daysRemaining,
        isBreached,
        priority: row.priority,
        status: row.status,
        urgency,
        preFilingChecklist: checklist,
      });

      if (urgency === "critical" || urgency === "urgent") {
        await emitDomainEvent("compliance_deadline", {
          matterId: row.matter_id,
          matterTitle: row.matter_title,
          caseNumber: row.case_number,
          deadlineType: row.deadline_type,
          deadline: dueDate.toISOString(),
          daysRemaining,
          priority: row.priority,
          urgency,
        }, "prism-deadline-scanner").catch(() => {});
      }
    }

    logger.info({ count: deadlines.length, daysAhead }, "Prism deadline scan complete");
    return deadlines;
  } catch (err) {
    logger.warn({ err }, "Prism deadline scan error — pc_deadlines table may not exist yet");
    return [];
  }
}

interface NyCourtRule {
  type: string;
  label: string;
  windowDays: number;
  anchorField: "date_of_loss" | "filing_date" | "service_date" | "incident_date" | "discovery_date";
  appliesTo?: string[];
  notes?: string;
}

const NY_COURT_FILING_RULES: NyCourtRule[] = [
  {
    type: "statute_of_limitations_personal_injury",
    label: "NY Personal Injury SOL (CPLR § 214(5))",
    windowDays: 3 * 365,
    anchorField: "date_of_loss",
    appliesTo: ["personal_injury", "negligence"],
    notes: "3 years from date of accident",
  },
  {
    type: "statute_of_limitations_medical_malpractice",
    label: "NY Medical Malpractice SOL (CPLR § 214-a)",
    windowDays: 2 * 365 + 183,
    anchorField: "date_of_loss",
    appliesTo: ["medical_malpractice"],
    notes: "2.5 years from date of malpractice or last treatment",
  },
  {
    type: "statute_of_limitations_property_damage",
    label: "NY Property Damage SOL (CPLR § 214(4))",
    windowDays: 3 * 365,
    anchorField: "date_of_loss",
    appliesTo: ["property_damage"],
    notes: "3 years from date of loss",
  },
  {
    type: "statute_of_limitations_contract",
    label: "NY Contract SOL (CPLR § 213(2))",
    windowDays: 6 * 365,
    anchorField: "date_of_loss",
    appliesTo: ["contract", "breach_of_contract"],
    notes: "6 years from breach date",
  },
  {
    type: "notice_of_claim_municipal",
    label: "Municipal Notice of Claim (GML § 50-e)",
    windowDays: 90,
    anchorField: "date_of_loss",
    appliesTo: ["personal_injury", "property_damage", "slip_and_fall"],
    notes: "90 days from accrual; required before suit vs municipal entity",
  },
  {
    type: "no_fault_ack_deadline",
    label: "No-Fault NF-10 Acknowledgment (11 NYCRR 65-3.5)",
    windowDays: 10,
    anchorField: "filing_date",
    appliesTo: ["no_fault"],
    notes: "Insurer must send NF-10 within 10 days of application",
  },
  {
    type: "no_fault_pay_deny_deadline",
    label: "No-Fault Pay or Deny (11 NYCRR 65-3.8)",
    windowDays: 30,
    anchorField: "service_date",
    appliesTo: ["no_fault"],
    notes: "30 days from receipt of bills to pay or deny",
  },
  {
    type: "no_fault_euo_verification",
    label: "No-Fault EUO Verification Deadline (11 NYCRR 65-3.5(d))",
    windowDays: 30,
    anchorField: "service_date",
    appliesTo: ["no_fault"],
    notes: "Verification requests (including EUO) within 30 days of receipt",
  },
  {
    type: "discovery_note_of_issue",
    label: "Note of Issue / Discovery Cutoff (CPLR § 3402)",
    windowDays: 180,
    anchorField: "filing_date",
    appliesTo: ["personal_injury", "medical_malpractice", "contract"],
    notes: "Note of Issue typically filed within 6 months of discovery completion",
  },
  {
    type: "summary_judgment_motion",
    label: "Summary Judgment Motion Deadline (CPLR § 3212(a))",
    windowDays: 120,
    anchorField: "filing_date",
    appliesTo: ["personal_injury", "contract", "property_damage"],
    notes: "SJ motion must be filed within 120 days of Note of Issue",
  },
  {
    type: "insurance_disclaimer_deadline",
    label: "Insurance Disclaimer (Ins. Law § 3420(d)(2))",
    windowDays: 30,
    anchorField: "discovery_date",
    appliesTo: ["liability", "personal_injury"],
    notes: "Written disclaimer required within 30 days of disclaimer grounds discovered",
  },
];

export interface RuleComputedDeadline {
  matterId: number;
  matterTitle: string;
  caseNumber: string | null;
  ruleType: string;
  ruleLabel: string;
  anchorDate: string;
  windowDays: number;
  computedDueDate: string;
  daysRemaining: number;
  isNew: boolean;
  notes?: string;
}

export async function computeRuleBasedDeadlines(): Promise<{
  mattersScanned: number;
  deadlinesComputed: number;
  deadlinesInserted: number;
  deadlinesAlreadyExist: number;
}> {
  let mattersScanned = 0;
  let deadlinesComputed = 0;
  let deadlinesInserted = 0;
  let deadlinesAlreadyExist = 0;

  try {
    const mattersResult = await pool.query(
      `SELECT
         m.id,
         m.title,
         m.case_number,
         m.practice_area,
         m.date_of_loss,
         m.filing_date,
         m.service_date,
         m.incident_date,
         m.discovery_date
       FROM pc_matters m
       WHERE m.status NOT IN ('closed', 'archived')
         AND (
           m.date_of_loss IS NOT NULL
           OR m.filing_date IS NOT NULL
           OR m.service_date IS NOT NULL
           OR m.incident_date IS NOT NULL
           OR m.discovery_date IS NOT NULL
         )
       LIMIT 100`
    );

    const now = new Date();

    for (const matter of mattersResult.rows) {
      mattersScanned++;
      const practiceArea: string = (matter.practice_area ?? "").toLowerCase();

      for (const rule of NY_COURT_FILING_RULES) {
        if (rule.appliesTo && rule.appliesTo.length > 0) {
          const matches = rule.appliesTo.some(tag => practiceArea.includes(tag));
          if (!matches) continue;
        }

        const anchorRaw: Date | null = matter[rule.anchorField] ?? null;
        if (!anchorRaw) continue;

        const anchorDate = new Date(anchorRaw);
        const computedDueDate = new Date(anchorDate.getTime() + rule.windowDays * 24 * 60 * 60 * 1000);
        const daysRemaining = Math.ceil((computedDueDate.getTime() - now.getTime()) / 86400000);

        if (daysRemaining < -30) continue;

        deadlinesComputed++;

        const existCheck = await pool.query(
          `SELECT id FROM pc_deadlines
           WHERE matter_id = $1 AND deadline_type = $2
           LIMIT 1`,
          [matter.id, rule.type]
        );

        if (existCheck.rows.length > 0) {
          deadlinesAlreadyExist++;
          continue;
        }

        const priority = daysRemaining <= 7 ? "critical" : daysRemaining <= 30 ? "high" : "medium";

        await pool.query(
          `INSERT INTO pc_deadlines (matter_id, deadline_type, due_date, priority, status, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'pending', $5, NOW(), NOW())`,
          [matter.id, rule.type, computedDueDate, priority, rule.notes ?? rule.label]
        ).catch((err) => {
          logger.debug({ err, matterId: matter.id, ruleType: rule.type }, "Rule-computed deadline insert skipped");
        });

        deadlinesInserted++;

        if (daysRemaining <= 14) {
          const checklist = buildPreFilingChecklist(rule.type, daysRemaining);
          await emitDomainEvent("compliance_deadline", {
            matterId: matter.id,
            matterTitle: matter.title,
            caseNumber: matter.case_number,
            deadlineType: rule.type,
            ruleLabel: rule.label,
            computedDueDate: computedDueDate.toISOString(),
            anchorDate: anchorDate.toISOString(),
            windowDays: rule.windowDays,
            daysRemaining,
            urgency: daysRemaining <= 3 ? "critical" : daysRemaining <= 7 ? "urgent" : "upcoming",
            source: "ny-court-rule-computation",
            preFilingChecklist: checklist,
          }, "rule-based-deadline-computation").catch(() => {});
        }
      }
    }

    logger.info(
      { mattersScanned, deadlinesComputed, deadlinesInserted, deadlinesAlreadyExist },
      "Rule-based deadline computation complete"
    );
  } catch (err) {
    logger.warn({ err }, "Rule-based deadline computation error — tables may not exist yet");
  }

  return { mattersScanned, deadlinesComputed, deadlinesInserted, deadlinesAlreadyExist };
}

export interface CourtFilingUpdate {
  matterId: number;
  caseNumber: string;
  matterTitle: string;
  updateType: "new_filing" | "order_entered" | "appearance_scheduled" | "status_change";
  description: string;
  discoveredAt: string;
  externalSource: string;
}

async function pollCourtFilingUpdates(activeMatter: {
  id: number;
  caseNumber: string | null;
  title: string;
  courtName: string | null;
  jurisdiction: string | null;
  updatedAt: Date | null;
}): Promise<CourtFilingUpdate[]> {
  const updates: CourtFilingUpdate[] = [];

  if (!activeMatter.caseNumber) return updates;

  const lastCheckWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const recentComms = await pool.query(
      `SELECT id, comm_type, subject, body, created_at
       FROM pc_communications
       WHERE matter_id = $1
         AND created_at >= $2
         AND comm_type IN ('court_notice','filing_confirmation','order_received','appearance_notice')
       ORDER BY created_at DESC
       LIMIT 5`,
      [activeMatter.id, lastCheckWindow]
    );

    for (const comm of recentComms.rows) {
      const updateType: CourtFilingUpdate["updateType"] =
        comm.comm_type === "order_received" ? "order_entered" :
        comm.comm_type === "appearance_notice" ? "appearance_scheduled" :
        comm.comm_type === "filing_confirmation" ? "new_filing" : "status_change";

      updates.push({
        matterId: activeMatter.id,
        caseNumber: activeMatter.caseNumber ?? "",
        matterTitle: activeMatter.title,
        updateType,
        description: String(comm.subject ?? comm.body ?? "Court communication received"),
        discoveredAt: new Date(comm.created_at).toISOString(),
        externalSource: "pc_communications",
      });
    }
  } catch {}

  try {
    const caseNumber = activeMatter.caseNumber ?? "";
    if (/^\d{6}\/\d{4}$/.test(caseNumber) || /^[A-Z]{2}\d{6}$/.test(caseNumber)) {
      const court = (activeMatter.courtName ?? "").toLowerCase();
      const isSupremeCourt = court.includes("supreme") || activeMatter.jurisdiction?.toLowerCase().includes("ny");

      if (isSupremeCourt) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        try {
          const encodedCase = encodeURIComponent(caseNumber);
          const res = await fetch(
            `https://iapps.courts.state.ny.us/nyscef/CaseSearch?SearchType=IndexNumber&txtIndexNumber=${encodedCase}`,
            {
              signal: controller.signal,
              headers: {
                "User-Agent": "SZL-Prism/1.0 (legal-deadline-monitor)",
                Accept: "text/html",
              },
            }
          );

          if (res.ok) {
            const html = await res.text();
            const hasRecentActivity = html.includes("Documents Filed") || html.includes("E-Filed");
            if (hasRecentActivity) {
              updates.push({
                matterId: activeMatter.id,
                caseNumber,
                matterTitle: activeMatter.title,
                updateType: "new_filing",
                description: `NYSCEF court docket activity detected for index ${caseNumber}`,
                discoveredAt: new Date().toISOString(),
                externalSource: "nyscef",
              });
            }
          }
        } finally {
          clearTimeout(timer);
        }
      }
    }
  } catch (err) {
    logger.debug({ err, caseNumber: activeMatter.caseNumber }, "NYSCEF poll error (non-fatal)");
  }

  return updates;
}

export async function runCaseStatusMonitoring(): Promise<{
  mattersChecked: number;
  overdueFound: number;
  filingUpdatesFound: number;
  alertsEmitted: number;
}> {
  let mattersChecked = 0;
  let overdueFound = 0;
  let filingUpdatesFound = 0;
  let alertsEmitted = 0;

  try {
    const now = new Date();

    const overdueResult = await pool.query(
      `SELECT
         d.id as deadline_id,
         d.matter_id,
         d.deadline_type,
         d.due_date,
         d.priority,
         m.title as matter_title,
         m.case_number
       FROM pc_deadlines d
       JOIN pc_matters m ON d.matter_id = m.id
       WHERE d.status = 'pending'
         AND d.due_date < $1
       LIMIT 50`,
      [now]
    );

    for (const deadline of overdueResult.rows) {
      mattersChecked++;
      overdueFound++;

      await pool.query(
        `UPDATE pc_deadlines SET status = 'overdue' WHERE id = $1`,
        [deadline.deadline_id]
      ).catch(() => {});

      await emitDomainEvent("compliance_deadline", {
        matterId: deadline.matter_id,
        matterTitle: deadline.matter_title,
        caseNumber: deadline.case_number,
        deadlineType: deadline.deadline_type,
        deadline: deadline.due_date,
        breached: true,
        urgency: "critical",
        priority: deadline.priority,
      }, "case-status-monitor").catch(() => {});
      alertsEmitted++;
    }

    const activeMattersResult = await pool.query(
      `SELECT id, case_number, title, court_name, jurisdiction, updated_at
       FROM pc_matters
       WHERE status IN ('intake','investigation','discovery','pre_trial','trial')
       ORDER BY updated_at DESC
       LIMIT 20`
    );

    for (const matter of activeMattersResult.rows) {
      const filingUpdates = await pollCourtFilingUpdates({
        id: matter.id,
        caseNumber: matter.case_number,
        title: matter.title,
        courtName: matter.court_name,
        jurisdiction: matter.jurisdiction,
        updatedAt: matter.updated_at,
      });

      if (filingUpdates.length > 0) {
        filingUpdatesFound += filingUpdates.length;

        for (const update of filingUpdates) {
          await emitDomainEvent("compliance_deadline", {
            matterId: update.matterId,
            matterTitle: update.matterTitle,
            caseNumber: update.caseNumber,
            updateType: update.updateType,
            description: update.description,
            urgency: update.updateType === "order_entered" ? "urgent" : "upcoming",
            source: update.externalSource,
            discoveredAt: update.discoveredAt,
          }, "court-filing-monitor").catch(() => {});
          alertsEmitted++;
        }

        await pool.query(
          `UPDATE pc_matters SET updated_at = NOW() WHERE id = $1`,
          [matter.id]
        ).catch(() => {});
      }
    }

    logger.info({ mattersChecked, overdueFound, filingUpdatesFound, alertsEmitted }, "Case status monitoring complete");
  } catch (err) {
    logger.warn({ err }, "Case status monitoring error — tables may not be initialized");
  }

  return { mattersChecked, overdueFound, filingUpdatesFound, alertsEmitted };
}

export async function runPrismDeadlineScan(): Promise<{
  mattersChecked: number;
  deadlinesFound: number;
  criticalCount: number;
  urgentCount: number;
  alertsEmitted: number;
}> {
  const deadlines = await scanApproachingDeadlines({ daysAhead: 14 });
  const monitoring = await runCaseStatusMonitoring();

  const criticalCount = deadlines.filter(d => d.urgency === "critical").length;
  const urgentCount = deadlines.filter(d => d.urgency === "urgent").length;

  return {
    mattersChecked: monitoring.mattersChecked,
    deadlinesFound: deadlines.length,
    criticalCount,
    urgentCount,
    alertsEmitted: monitoring.alertsEmitted + criticalCount + urgentCount,
  };
}

export async function generatePreFilingChecklist(deadlineId: number): Promise<{
  checklist: PreFilingChecklistItem[];
  deadline: FilingDeadline | null;
}> {
  try {
    const result = await pool.query(
      `SELECT
         d.id as deadline_id,
         d.matter_id,
         d.deadline_type,
         d.due_date,
         d.priority,
         d.status,
         m.title as matter_title,
         m.case_number
       FROM pc_deadlines d
       JOIN pc_matters m ON d.matter_id = m.id
       WHERE d.id = $1
       LIMIT 1`,
      [deadlineId]
    );

    if (result.rows.length === 0) return { checklist: [], deadline: null };
    const row = result.rows[0];

    const now = new Date();
    const dueDate = new Date(row.due_date);
    const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000);
    const checklist = buildPreFilingChecklist(row.deadline_type, daysRemaining);

    const deadline: FilingDeadline = {
      matterId: row.matter_id,
      matterTitle: row.matter_title,
      caseNumber: row.case_number,
      deadlineId: row.deadline_id,
      deadlineType: row.deadline_type,
      dueDate,
      daysRemaining,
      isBreached: daysRemaining < 0,
      priority: row.priority,
      status: row.status,
      urgency: daysRemaining <= 3 ? "critical" : daysRemaining <= 7 ? "urgent" : "upcoming",
      preFilingChecklist: checklist,
    };

    return { checklist, deadline };
  } catch (err) {
    logger.warn({ err, deadlineId }, "Failed to generate pre-filing checklist");
    return { checklist: [], deadline: null };
  }
}
