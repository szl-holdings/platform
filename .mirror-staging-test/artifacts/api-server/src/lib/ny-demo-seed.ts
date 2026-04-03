import { db } from "@workspace/db";
import {
  pcMattersTable,
  pcMatterClocksTable,
  pcClockEventsTable,
  pcNoFaultClaimsTable,
  pcVerificationRequestsTable,
  pcDenialsTable,
  pcAppealsTable,
  pcExternalAppealsTable,
  pcDisclaimersTable,
  pcCoveragePositionsTable,
  pcMedicalBillCyclesTable,
  pcOfferMovementsTable,
  pcReserveMovementsTable,
  pcMediationEventsTable,
  pcVenueProfilesTable,
  pcPartProfilesTable,
  pcInsurerProfilesTable,
  pcAdjusterProfilesTable,
  pcCommunicationWindowsTable,
  pcDemandPacketsTable,
  pcDemandReadinessSnapshotsTable,
  pcForecastRunsTable,
  pcForecastDriversTable,
  pcForecastExplanationsTable,
  pcAiReviewPacketsTable,
  pcDefensibilityScoresTable,
  pcClockRulesTable,
  pcNyRuleProfilesTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const logger = { info: (msg: string, meta?: unknown) => console.log(`[ny-demo-seed] ${msg}`, meta ?? ""), error: (msg: string, e?: unknown) => console.error(`[ny-demo-seed] ERROR: ${msg}`, e ?? "") };

async function seedClockRules() {
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(pcClockRulesTable);
  if (existing[0].count > 0) { logger.info("Clock rules already seeded"); return; }

  await db.insert(pcClockRulesTable).values([
    { ruleId: "NY-NF-001", clockType: "no_fault_notice", title: "No-Fault Notice of Claim — 30-Day Window", dayLimit: 30, triggerEvent: "Date of accident", consequence: "Late notice may void no-fault benefits unless carrier waived", citation: "11 NYCRR § 65-2.4(b)", isMandatory: true, appliesTo: "no_fault" },
    { ruleId: "NY-NF-002", clockType: "no_fault_verification", title: "No-Fault Verification Request — 30-Day EUO Window", dayLimit: 30, triggerEvent: "Carrier request date", consequence: "Failure to appear triggers suspension of no-fault benefits", citation: "11 NYCRR § 65-3.6", isMandatory: true, appliesTo: "no_fault" },
    { ruleId: "NY-NF-003", clockType: "no_fault_arbitration", title: "No-Fault Arbitration Filing — 30 Days from Denial", dayLimit: 30, triggerEvent: "Denial of bill date", consequence: "Claim forfeited if arbitration not filed within 30 days of denial", citation: "11 NYCRR § 65-4.2", isMandatory: true, appliesTo: "no_fault" },
    { ruleId: "NY-DISC-001", clockType: "disclaimer_timeliness", title: "Coverage Disclaimer — 30-Day Timeliness", dayLimit: 30, triggerEvent: "Notice of claim received", consequence: "Late disclaimer may be deemed waiver of coverage defense", citation: "Ins. Law § 3420(d)", isMandatory: true, appliesTo: "coverage" },
    { ruleId: "NY-SOL-001", clockType: "sol_tolling", title: "Statute of Limitations — Personal Injury (3 Years)", dayLimit: 1095, triggerEvent: "Date of loss/injury", consequence: "Action time-barred if not commenced within 3 years", citation: "CPLR § 214(5)", isMandatory: true, appliesTo: "bodily_injury" },
    { ruleId: "NY-SOL-002", clockType: "sol_tolling", title: "Statute of Limitations — Coverage Dispute (6 Years)", dayLimit: 2190, triggerEvent: "Disclaimer date", consequence: "Contract action time-barred if not commenced within 6 years", citation: "CPLR § 213(2)", isMandatory: true, appliesTo: "coverage" },
    { ruleId: "NY-NF-004", clockType: "imc_verification", title: "IMC Verification — 30-Day Response Window", dayLimit: 30, triggerEvent: "IMC request date", consequence: "Non-response may suspend treatment authorization", citation: "11 NYCRR § 65-3.6(b)", isMandatory: true, appliesTo: "no_fault" },
    { ruleId: "NY-NF-005", clockType: "peer_review_window", title: "Peer Review — 30-Day Payment or Denial Window", dayLimit: 30, triggerEvent: "Bill receipt date", consequence: "Failure to pay or deny constitutes waiver of billing dispute", citation: "11 NYCRR § 65-3.8", isMandatory: true, appliesTo: "no_fault" },
  ]);
  logger.info("Clock rules seeded (8 rules)");
}

async function seedNyRuleProfiles() {
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(pcNyRuleProfilesTable);
  if (existing[0].count > 0) { logger.info("NY rule profiles already seeded"); return; }

  await db.insert(pcNyRuleProfilesTable).values([
    { ruleId: "NY-R-001", category: "no_fault", title: "30-Day Notice Window", dayLimit: 30, consequence: "Late notice voids NF benefits unless waived", citation: "11 NYCRR § 65-2.4" },
    { ruleId: "NY-R-002", category: "disclaimer", title: "30-Day Disclaimer Timeliness", dayLimit: 30, consequence: "Late disclaimer may waive coverage defense", citation: "Ins. Law § 3420(d)" },
    { ruleId: "NY-R-003", category: "statute_of_limitations", title: "3-Year Personal Injury SOL", dayLimit: 1095, consequence: "Time bar on personal injury action", citation: "CPLR § 214(5)" },
    { ruleId: "NY-R-004", category: "arbitration", title: "No-Fault AAA Arbitration Filing", dayLimit: 30, consequence: "Claim forfeiture on missed arbitration deadline", citation: "11 NYCRR § 65-4.2" },
    { ruleId: "NY-R-005", category: "no_fault", title: "EUO Suspension Trigger", dayLimit: 30, consequence: "Non-appearance triggers mandatory suspension", citation: "11 NYCRR § 65-3.6" },
    { ruleId: "NY-R-006", category: "court_rules", title: "Bronx Supreme — Part Rules", consequence: "Mandatory CCO appearance within 90 days of RJI", citation: "Bronx Supreme Civil Term" },
  ]);
  logger.info("NY rule profiles seeded (6 profiles)");
}

async function seedVenueProfiles() {
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(pcVenueProfilesTable);
  if (existing[0].count > 0) { logger.info("Venue profiles already seeded"); return; }

  await db.insert(pcVenueProfilesTable).values([
    { county: "Bronx", courtName: "Bronx Supreme Court", courtType: "supreme", averageCycleMonths: 36, medianVerdictAuto: "1250000.00", medianVerdictPremises: "975000.00", plaintiffFriendliness: "very_high", adrAvailability: "mandatory", conferenceFrequency: "Monthly CCO", typicalPartsAssigned: "Parts I, II, VIII", velocityScore: 72, filingExpectations: "Strict filing calendar; RJI required within 120 days of joinder" },
    { county: "Queens", courtName: "Queens Supreme Court", courtType: "supreme", averageCycleMonths: 30, medianVerdictAuto: "875000.00", medianVerdictPremises: "725000.00", plaintiffFriendliness: "high", adrAvailability: "available", conferenceFrequency: "Bi-monthly", typicalPartsAssigned: "Parts 2, 5, 10", velocityScore: 65, filingExpectations: "Streamlined NF arbitration track available; CPLR § 3124 motions common" },
    { county: "New York", courtName: "New York County Supreme Court", courtType: "supreme", averageCycleMonths: 24, medianVerdictAuto: "650000.00", medianVerdictPremises: "825000.00", medianVerdictCoverage: "500000.00", plaintiffFriendliness: "moderate", adrAvailability: "mandatory", conferenceFrequency: "Monthly", typicalPartsAssigned: "Commercial Division (coverage disputes)", velocityScore: 80, filingExpectations: "Commercial Division Part rules apply to coverage disputes" },
  ]);
  logger.info("Venue profiles seeded (3 venues)");
}

async function seedPartProfiles(venueIds: Record<string, number>) {
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(pcPartProfilesTable);
  if (existing[0].count > 0) { logger.info("Part profiles already seeded"); return; }

  const rows = [];
  if (venueIds["Bronx"]) {
    rows.push({ venueId: venueIds["Bronx"], partName: "Part I", judgeName: "Hon. Maria Torres", trackType: "complex" as const, conferenceRules: "CCO within 90 days of RJI; all parties must attend", discoveryTimeline: "18-month standard track; expert disclosure 60 days before note of issue", mediationPolicy: "Mandatory court-ordered mediation prior to trial" });
    rows.push({ venueId: venueIds["Bronx"], partName: "Part VIII", judgeName: "Hon. James Obi", trackType: "trial_ready" as const, conferenceRules: "Strict — telephonic conferences bi-weekly during discovery", discoveryTimeline: "12-month expedited; depositions within 90 days of joinder", mediationPolicy: "Judge strongly encourages voluntary mediation before note of issue" });
  }
  if (venueIds["Queens"]) {
    rows.push({ venueId: venueIds["Queens"], partName: "Part 2", judgeName: "Hon. David Chen", trackType: "standard" as const, conferenceRules: "CCO within 60 days; NF arbitration track available", discoveryTimeline: "15-month standard track", mediationPolicy: "Available through Queens Mediation Center" });
    rows.push({ venueId: venueIds["Queens"], partName: "Part 5", judgeName: "Hon. Sarah Okonkwo", trackType: "expedited" as const, conferenceRules: "Expedited track for claims under $250k; CCO within 45 days", discoveryTimeline: "10-month expedited; automatic preclusion if late", mediationPolicy: "Settlement conference required before trial" });
  }
  if (venueIds["New York"]) {
    rows.push({ venueId: venueIds["New York"], partName: "Commercial Division - Part 3", judgeName: "Hon. Robert Klein", trackType: "complex" as const, conferenceRules: "Preliminary conference within 45 days; complex commercial rules apply", discoveryTimeline: "Court-managed; ESI protocol required", mediationPolicy: "JAMS or AAA mediation strongly encouraged" });
  }

  if (rows.length > 0) {
    await db.insert(pcPartProfilesTable).values(rows);
    logger.info(`Part profiles seeded (${rows.length} parts)`);
  }
}

async function seedInsurerProfiles(orgId: number) {
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(pcInsurerProfilesTable).where(eq(pcInsurerProfilesTable.orgId, orgId));
  if (existing[0].count > 0) { logger.info("Insurer profiles already seeded"); return; }

  const [progressive] = await db.insert(pcInsurerProfilesTable).values([
    { orgId, carrierName: "Progressive Insurance", region: "NY Metro", reservingStyle: "conservative", denialPattern: "IME/peer review-heavy; EUO suspension tactics", medianFirstOffer: "42000.00", averageResponseDays: 18, mediationBehavior: "strategic", escalationThreshold: "150000.00", litigationTolerance: "moderate", notes: "Known for aggressive EUO use; reserve increases often signal authority expansion" },
    { orgId, carrierName: "AIG / Chartis", region: "NY Metro", reservingStyle: "aggressive", denialPattern: "Late notice defenses; coverage disclaimer disputes", medianFirstOffer: "75000.00", averageResponseDays: 45, mediationBehavior: "resistant", escalationThreshold: "250000.00", litigationTolerance: "high", notes: "Slow to respond; escalation via motion practice typically accelerates movement" },
    { orgId, carrierName: "Travelers Insurance", region: "NY Metro", reservingStyle: "market", denialPattern: "Policy exclusion defense; reservation of rights standard", medianFirstOffer: "95000.00", averageResponseDays: 22, mediationBehavior: "cooperative", escalationThreshold: "300000.00", litigationTolerance: "low", notes: "Commercial division claims managed through specialized coverage counsel" },
  ]).returning();

  await db.insert(pcAdjusterProfilesTable).values([
    { orgId, insurerProfileId: progressive.id, name: "Maria Santos", email: "m.santos@progressive.com", claimOffice: "Queens NY", negotiationStyle: "by_the_book", averageResponseDays: 12, decisionAuthority: "75000.00" },
  ]);
  logger.info("Insurer profiles seeded (3 insurers)");
}

async function seedDemoMatters(orgId: number) {
  const existing = await db.select({ id: pcMattersTable.id, caseNumber: pcMattersTable.caseNumber }).from(pcMattersTable)
    .where(eq(pcMattersTable.orgId, orgId));
  const existingByCaseNumber = new Map(existing.map(m => [m.caseNumber, m.id]));

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const daysFrom = (d: number) => new Date(now.getTime() + d * 86400000);

  /* ── MATTER 1: Vasquez — Auto/No-Fault, Queens ── */
  const vasquezCaseNumber = "2025-NY-CV-08419";
  if (existingByCaseNumber.has(vasquezCaseNumber)) {
    logger.info(`NY demo matter Vasquez (${vasquezCaseNumber}) already exists, skipping`);
  } else {

  const [vasquez] = await db.insert(pcMattersTable).values({
    orgId,
    caseNumber: vasquezCaseNumber,
    title: "Vasquez v. Progressive Insurance (NY Auto / No-Fault)",
    status: "investigation",
    matterType: "auto_injury",
    jurisdiction: "Queens County, NY",
    courtName: "Queens Supreme Court",
    healthScore: 64,
    notes: "Auto accident; no-fault claim with EUO pending; bill arbitration risk on 3 bills. Plaintiff: Carlos Vasquez. Opposing: Progressive Insurance. Attorney: Jennifer Walsh, Esq.",
  }).returning();

  await db.insert(pcMatterClocksTable).values([
    { orgId, matterId: vasquez.id, clockType: "no_fault_verification", startedAt: daysAgo(18), deadlineAt: daysFrom(12), status: "running", daysRemaining: 12, isBreached: false, ruleRef: "NY-NF-002", notes: "EUO scheduled with Progressive; suspension trigger if missed" },
    { orgId, matterId: vasquez.id, clockType: "no_fault_arbitration", startedAt: daysAgo(2), deadlineAt: daysFrom(28), status: "running", daysRemaining: 28, isBreached: false, ruleRef: "NY-NF-003", notes: "Bill #3 — $14,800 denied; AAA arbitration required within 30 days" },
    { orgId, matterId: vasquez.id, clockType: "sol_tolling", startedAt: new Date("2022-07-22"), deadlineAt: new Date("2025-07-22"), status: "met", isBreached: false, ruleRef: "NY-SOL-001", notes: "SOL over 800 days past; no near-term risk" },
  ]);

  const [vasquezNfClaim] = await db.insert(pcNoFaultClaimsTable).values({
    orgId, matterId: vasquez.id, claimantName: "Carlos Vasquez", carrierName: "Progressive Insurance",
    dateOfLoss: new Date("2022-07-22"), noticeSentAt: daysAgo(619), noticeDueDate: daysAgo(589),
    noticeStatus: "timely", billStatus: "partial", totalBilled: "82400.00", totalPaid: "41200.00", totalDenied: "22600.00",
    arbitrationStatus: "pending", arbitrationFiledAt: null, evidenceLockRisk: 72,
  }).returning();

  await db.insert(pcVerificationRequestsTable).values([
    { orgId, matterId: vasquez.id, noFaultClaimId: vasquezNfClaim.id, requestType: "euo", requestedBy: "Progressive Insurance", requestedAt: daysAgo(18), dueDate: daysFrom(12), status: "scheduled", suspensionTrigger: true, notes: "EUO suspension trigger — non-appearance will suspend no-fault benefits" },
    { orgId, matterId: vasquez.id, noFaultClaimId: vasquezNfClaim.id, requestType: "imc", requestedBy: "Progressive Insurance", requestedAt: daysAgo(45), dueDate: daysAgo(15), status: "completed", suspensionTrigger: false, outcome: "Attended; physician found causally related" },
  ]);

  await db.insert(pcDenialsTable).values([
    { orgId, matterId: vasquez.id, noFaultClaimId: vasquezNfClaim.id, denialType: "no_fault_bill", deniedBy: "Progressive Insurance", deniedAt: daysAgo(32), denialReason: "IME finding — treatment not causally related after visit #8", amountDenied: "14800.00", appealStatus: "filed", appealDeadline: daysFrom(28) },
    { orgId, matterId: vasquez.id, noFaultClaimId: vasquezNfClaim.id, denialType: "no_fault_bill", deniedBy: "Progressive Insurance", deniedAt: daysAgo(10), denialReason: "Peer review — excessive frequency of treatment", amountDenied: "7800.00", appealStatus: "not_appealed", appealDeadline: daysFrom(20) },
  ]);

  await db.insert(pcOfferMovementsTable).values([
    { orgId, matterId: vasquez.id, offerType: "insurer_offer", amount: "42000.00", offeringParty: "Progressive Insurance", offeredAt: daysAgo(120) },
    { orgId, matterId: vasquez.id, offerType: "insurer_offer", amount: "72000.00", offeringParty: "Progressive Insurance", offeredAt: daysAgo(45), deltaFromPrevious: "30000.00", deltaPct: "71.43", movementSignal: "approaching" },
    { orgId, matterId: vasquez.id, offerType: "plaintiff_demand", amount: "195000.00", offeringParty: "Plaintiff", offeredAt: daysAgo(60) },
  ]);

  await db.insert(pcReserveMovementsTable).values([
    { orgId, matterId: vasquez.id, carrierName: "Progressive Insurance", reserveAmount: "85000.00", reserveDate: daysAgo(180), movementType: "set" },
    { orgId, matterId: vasquez.id, carrierName: "Progressive Insurance", reserveAmount: "125000.00", priorReserve: "85000.00", delta: "40000.00", reserveDate: daysAgo(40), movementType: "increase", inferredSignal: "Carrier acknowledging higher exposure; 47% reserve increase" },
  ]);

  await db.insert(pcMediationEventsTable).values({
    orgId, matterId: vasquez.id, scheduledAt: daysFrom(73), sessionType: "court_ordered", status: "scheduled",
    preReadinessScore: 61, conversionProbability: "0.58", openingDemand: "195000.00", openingOffer: "72000.00",
    notes: "Queens Mediation Center — June 15, 2026",
  });

  await db.insert(pcCommunicationWindowsTable).values([
    { orgId, matterId: vasquez.id, partyName: "Maria Santos", partyRole: "adjuster", lastContactAt: daysAgo(22), daysSilent: 22, silenceRisk: "medium", expectedResponseDays: 14, outstandingItems: ["EUO confirmation letter", "Reserve authority update"], escalationStatus: "sent" },
  ]);

  await db.insert(pcDemandReadinessSnapshotsTable).values({
    orgId, matterId: vasquez.id, overallScore: 61, medicalChronologyScore: 88, liabilityScore: 72, damagesScore: 65, lienScore: 55, photographicScore: 80, witnessScore: 70, expertScore: 35,
    missingItems: ["Life care plan", "IME rebuttal letter", "Future damages calculation"],
    blockingItems: ["IME rebuttal outstanding — required before demand finalization"],
  });

  const vasquezClocks = await db.select({ id: pcMatterClocksTable.id }).from(pcMatterClocksTable).where(eq(pcMatterClocksTable.matterId, vasquez.id));
  for (const clock of vasquezClocks) {
    await db.insert(pcClockEventsTable).values({ orgId, matterId: vasquez.id, clockId: clock.id, eventType: "start", occurredAt: daysAgo(18), description: "Clock started upon carrier verification request", sourceDocument: "Progressive Insurance verification letter dated " + daysAgo(18).toDateString() });
  }

  await db.insert(pcMedicalBillCyclesTable).values([
    { orgId, matterId: vasquez.id, noFaultClaimId: vasquezNfClaim.id, providerName: "Queens Advanced Physical Therapy", serviceDate: daysAgo(310), submittedDate: daysAgo(298), billedAmount: "18400.00", paidAmount: "14200.00", deniedAmount: "0.00", status: "paid", daysToResponse: 28, isLate: false },
    { orgId, matterId: vasquez.id, noFaultClaimId: vasquezNfClaim.id, providerName: "Flushing Orthopedic & Spine", serviceDate: daysAgo(250), submittedDate: daysAgo(238), billedAmount: "22000.00", paidAmount: "0.00", deniedAmount: "14800.00", status: "denied", denialReason: "IME finding — not causally related after visit #8", daysToResponse: 32, isLate: true },
    { orgId, matterId: vasquez.id, noFaultClaimId: vasquezNfClaim.id, providerName: "Queens Radiology Associates", serviceDate: daysAgo(280), submittedDate: daysAgo(270), billedAmount: "9200.00", paidAmount: "9200.00", status: "paid", daysToResponse: 14, isLate: false },
    { orgId, matterId: vasquez.id, noFaultClaimId: vasquezNfClaim.id, providerName: "Metro Pain Specialists", serviceDate: daysAgo(190), submittedDate: daysAgo(178), billedAmount: "32800.00", paidAmount: "17800.00", deniedAmount: "7800.00", status: "partially_paid", denialReason: "Peer review — excessive frequency", daysToResponse: 21, isLate: false },
  ]);

  const [vasquezDemandPacket] = await db.insert(pcDemandPacketsTable).values({
    orgId, matterId: vasquez.id, version: 1, status: "draft", demandAmount: "195000.00", readinessScore: 61,
    missingItems: ["Life care plan", "IME rebuttal letter", "Future damages calculation"],
    includedItems: ["Medical records (2022-2025)", "Police report", "Photographs", "Wage loss documentation", "Expert liability report"],
    notes: "Draft demand — requires IME rebuttal before finalization. Do not send until blocking items resolved.",
  }).returning();

  const [vasquezForecastRun] = await db.insert(pcForecastRunsTable).values({
    orgId, matterId: vasquez.id, forecastType: "deadline_breach_risk", score: "72.00", confidence: "74.00", weeklyDelta: "3.00",
    nextBestAction: "File AAA arbitration for Bill #2 within 20 days to preserve $7,800 claim", modelVersion: "v1.0.0-seed",
  }).returning();

  await db.insert(pcForecastDriversTable).values([
    { forecastRunId: vasquezForecastRun.id, orgId, matterId: vasquez.id, driverName: "EUO Suspension Risk", driverValue: "12 days remaining", impact: "negative", weight: "0.40", explanation: "EUO scheduled; non-appearance triggers mandatory suspension of all NF benefits", sourceLineage: "seed:deadline_breach_risk", exportFlag: false },
    { forecastRunId: vasquezForecastRun.id, orgId, matterId: vasquez.id, driverName: "Bill #2 Arbitration Window", driverValue: "20 days remaining", impact: "negative", weight: "0.35", explanation: "$7,800 denied bill at risk — 20 days remaining to file AAA arbitration or claim forfeited", sourceLineage: "seed:deadline_breach_risk", exportFlag: false },
    { forecastRunId: vasquezForecastRun.id, orgId, matterId: vasquez.id, driverName: "SOL Status", driverValue: "safe", impact: "positive", weight: "0.25", explanation: "3-year SOL window expired 800+ days ago — no immediate statute risk", sourceLineage: "seed:deadline_breach_risk", exportFlag: false },
  ]);

  await db.insert(pcForecastExplanationsTable).values({
    forecastRunId: vasquezForecastRun.id, orgId, matterId: vasquez.id, headline: "High deadline breach risk — 2 clocks in critical window",
    detail: "The EUO verification clock (12 days) and NF arbitration clock (20 days) create compounding deadline breach risk. Combined exposure: $22,600 in denied bills plus potential full NF suspension.",
    recommendations: ["Schedule EUO confirmation call with Progressive by EOW", "File AAA arbitration for Bill #2 ($7,800) within 20 days", "Prepare IME rebuttal to address Bill #1 denial ($14,800)"],
    citations: ["11 NYCRR § 65-3.6 (EUO suspension)", "11 NYCRR § 65-4.2 (NF arbitration filing)", "11 NYCRR § 65-3.8 (30-day denial response)"],
    isPrivileged: false, sourceLineage: "seed:deadline_breach_risk", exportFlag: false,
  });

  await db.insert(pcAiReviewPacketsTable).values({
    orgId, matterId: vasquez.id, reviewType: "demand_packet",
    generatedContent: "DRAFT DEMAND PACKET REVIEW — Vasquez v. Progressive Insurance\n\nSummary: The matter presents a strong liability case with significant no-fault billing complications. The demand is supportable at $195,000 based on medical specials of $82,400, pain and suffering, and lost wage documentation. However, two blocking items must be resolved before sending: (1) IME rebuttal letter addressing the $14,800 denial, and (2) life care plan for future damages calculation.\n\nKey Strengths: Clear causation, strong medical chronology through Queens AP&S, 3 MRI findings, documented functional limitations.\n\nKey Weaknesses: Peer review denials on $7,800; EUO pending creates uncertainty; no expert retained for future damages.",
    sourceReferences: [{ docType: "medical_records", providerName: "Queens Advanced Physical Therapy", dateRange: "2022-07 to 2025-01" }, { docType: "police_report", ref: "NYPD Incident #22-QN-58841" }],
    groundingScore: 82, status: "pending_review", modelRoute: "anthropic/claude-3-5-sonnet", isPrivileged: true,
    flaggedAssertions: [{ assertion: "Future damages calculation", flag: "no_expert_retained", severity: "high" }],
  });

  const [vasquezAppeal] = await db.insert(pcAppealsTable).values({
    orgId, matterId: vasquez.id, noFaultClaimId: vasquezNfClaim.id,
    appealType: "arbitration", status: "not_filed",
    deadlineAt: daysFrom(20), filedAt: null,
    appealingParty: "Plaintiff / Claimant",
    groundsForAppeal: "Bill #2 ($7,800) denied under peer review — excessive frequency. AAA arbitration required within 30 days of denial per 11 NYCRR § 65-4.2.",
    decisionNotes: null,
    sourceLineage: "seed:vasquez_matter", actorId: null, isPrivileged: true, exportFlag: false,
  }).returning();

  await db.insert(pcExternalAppealsTable).values({
    orgId, matterId: vasquez.id, appealId: vasquezAppeal.id,
    tribunal: "American Arbitration Association (AAA) — No-Fault Arbitration",
    tribunalCaseNo: null,
    panelComposition: "Single arbitrator — AAA No-Fault Panel",
    hearingDate: null,
    filingDeadline: daysFrom(20),
    status: "pending",
    awardAmount: null,
    outcome: null,
    representingCounsel: "Jennifer Walsh, Esq.",
    notes: "Must file within 20 days or $7,800 claim is forfeited. Matter is time-critical.",
    sourceLineage: "seed:vasquez_matter", actorId: null, isPrivileged: true, exportFlag: false,
  });

  await db.insert(pcDefensibilityScoresTable).values({
    orgId, matterId: vasquez.id, overallScore: 74, groundingScore: 82, humanApprovalScore: null, privilegeScore: 95, auditCompleteness: 68, sourceAttributionScore: 85, openFlags: 2,
    flagDetails: [{ flag: "pending_human_review", severity: "medium", description: "AI demand review not yet approved by supervising attorney" }, { flag: "incomplete_lien_clearance", severity: "medium", description: "Medicare/Medicaid lien status unconfirmed" }],
  });
  logger.info("NY demo matter Vasquez seeded");
  } // end Vasquez block

  /* ── MATTER 2: Okafor — Premises/BI, Bronx ── */
  const okaforCaseNumber = "2024-BX-CV-14722";
  if (existingByCaseNumber.has(okaforCaseNumber)) {
    logger.info(`NY demo matter Okafor (${okaforCaseNumber}) already exists, skipping`);
  } else {

  const [okafor] = await db.insert(pcMattersTable).values({
    orgId,
    caseNumber: okaforCaseNumber,
    title: "Okafor v. Starbucks Corp. (NY Premises / Bodily Injury)",
    status: "discovery",
    matterType: "premises_liability",
    jurisdiction: "Bronx County, NY",
    courtName: "Bronx Supreme Court",
    healthScore: 57,
    notes: "Slip-and-fall at Bronx location; lien exposure; mediation window pending. Plaintiff: Adaeze Okafor. Opposing: AIG / Chartis. Attorney: Marcus Thompson, Esq.",
  }).returning();

  await db.insert(pcMatterClocksTable).values([
    { orgId, matterId: okafor.id, clockType: "sol_tolling", startedAt: new Date("2021-11-14"), deadlineAt: new Date("2024-11-14"), status: "met", isBreached: false, ruleRef: "NY-SOL-001" },
    { orgId, matterId: okafor.id, clockType: "discovery_clock", startedAt: daysAgo(180), deadlineAt: daysFrom(45), status: "running", daysRemaining: 45, isBreached: false, ruleRef: "NY-R-006", notes: "Discovery compliance order — outstanding DOC requests" },
  ]);

  await db.insert(pcCommunicationWindowsTable).values([
    { orgId, matterId: okafor.id, partyName: "AIG / Chartis", partyRole: "insurer", lastContactAt: daysAgo(71), daysSilent: 71, silenceRisk: "critical", expectedResponseDays: 14, outstandingItems: ["Reserve disclosure", "Settlement authority confirmation", "Mediation date confirmation", "Lien status update"], escalationStatus: "escalated" },
    { orgId, matterId: okafor.id, partyName: "Gregory Holt, Esq.", partyRole: "opposing_counsel", lastContactAt: daysAgo(77), daysSilent: 77, silenceRisk: "critical", expectedResponseDays: 7, outstandingItems: ["Discovery response overdue", "Deposition scheduling"], escalationStatus: "pending_response" },
  ]);

  await db.insert(pcOfferMovementsTable).values([
    { orgId, matterId: okafor.id, offerType: "insurer_offer", amount: "38000.00", offeringParty: "AIG / Chartis", offeredAt: daysAgo(240), movementSignal: "stalling" },
    { orgId, matterId: okafor.id, offerType: "plaintiff_demand", amount: "385000.00", offeringParty: "Plaintiff", offeredAt: daysAgo(90) },
  ]);

  await db.insert(pcReserveMovementsTable).values([
    { orgId, matterId: okafor.id, carrierName: "AIG / Chartis", reserveAmount: "150000.00", reserveDate: daysAgo(300), movementType: "set" },
  ]);

  await db.insert(pcMediationEventsTable).values({
    orgId, matterId: okafor.id, scheduledAt: daysFrom(138), sessionType: "court_ordered", status: "pending",
    preReadinessScore: 54, conversionProbability: "0.47",
    notes: "Bronx Supreme — pending mediation date assignment",
  });

  await db.insert(pcDemandReadinessSnapshotsTable).values({
    orgId, matterId: okafor.id, overallScore: 54, medicalChronologyScore: 72, liabilityScore: 60, damagesScore: 48, lienScore: 35, photographicScore: 65, witnessScore: 55, expertScore: 40,
    missingItems: ["Medicare/Medicaid lien clearance", "Future medical projection", "Employment loss documentation", "Liability expert report"],
    blockingItems: ["Lien clearance must be obtained before demand finalization"],
  });

  const okaforClocks = await db.select({ id: pcMatterClocksTable.id }).from(pcMatterClocksTable).where(eq(pcMatterClocksTable.matterId, okafor.id));
  for (const clock of okaforClocks) {
    await db.insert(pcClockEventsTable).values({ orgId, matterId: okafor.id, clockId: clock.id, eventType: "start", occurredAt: daysAgo(180), description: "Discovery clock initiated at compliance conference", sourceDocument: "Bronx Supreme Court compliance conference order" });
  }

  const [okaforDemandPacket] = await db.insert(pcDemandPacketsTable).values({
    orgId, matterId: okafor.id, version: 1, status: "draft", demandAmount: "385000.00", readinessScore: 54,
    missingItems: ["Medicare/Medicaid lien clearance", "Future medical projection", "Employment loss documentation", "Liability expert report"],
    includedItems: ["Medical records", "Incident photographs", "Witness statements"],
    notes: "Demand blocked on lien clearance. Bronx venue premium supports high demand. Do not send until blocking items resolved.",
  }).returning();

  const [okaforForecastRun] = await db.insert(pcForecastRunsTable).values({
    orgId, matterId: okafor.id, forecastType: "mediation_conversion_probability", score: "47.00", confidence: "58.00", weeklyDelta: "-2.00",
    nextBestAction: "File CPLR § 3124 motion to compel AIG discovery response; silence exceeds 71 days", modelVersion: "v1.0.0-seed",
  }).returning();

  await db.insert(pcForecastDriversTable).values([
    { forecastRunId: okaforForecastRun.id, orgId, matterId: okafor.id, driverName: "AIG Silence Window", driverValue: "71 days", impact: "negative", weight: "0.35", explanation: "AIG 71-day silence — critical. Delay tactics pattern requires escalation via motion practice", sourceLineage: "seed:mediation_conversion_probability", exportFlag: false },
    { forecastRunId: okaforForecastRun.id, orgId, matterId: okafor.id, driverName: "Bronx Venue Premium", driverValue: "very_high plaintiff-friendly", impact: "positive", weight: "0.30", explanation: "Bronx median verdict $975K (premises); strong leverage for mediation", sourceLineage: "seed:mediation_conversion_probability", exportFlag: false },
    { forecastRunId: okaforForecastRun.id, orgId, matterId: okafor.id, driverName: "Lien Clearance Pending", driverValue: "blocking", impact: "negative", weight: "0.20", explanation: "Medicare/Medicaid lien unresolved — cannot finalize demand or move to serious mediation", sourceLineage: "seed:mediation_conversion_probability", exportFlag: false },
    { forecastRunId: okaforForecastRun.id, orgId, matterId: okafor.id, driverName: "Demand-Offer Gap", driverValue: "$347,000 gap", impact: "neutral", weight: "0.15", explanation: "Demand $385K vs first offer $38K — wide gap; carrier not yet serious about settlement", sourceLineage: "seed:mediation_conversion_probability", exportFlag: false },
  ]);

  await db.insert(pcForecastExplanationsTable).values({
    forecastRunId: okaforForecastRun.id, orgId, matterId: okafor.id, headline: "Low mediation conversion — AIG not yet motivated",
    detail: "AIG's 71-day silence pattern is consistent with their known delay tactics profile. The $347K demand-offer gap and unresolved lien indicate mediation is premature without escalation. Filing a CPLR § 3124 motion to compel discovery would signal credibility and accelerate movement.",
    recommendations: ["File CPLR § 3124 motion to compel immediately", "Obtain Medicare/Medicaid lien clearance within 30 days", "Retain liability expert for report", "Escalate to AIG coverage counsel if adjuster remains silent after motion"],
    citations: ["CPLR § 3124 (motion to compel discovery)", "CPLR § 3126 (preclusion order)"],
    isPrivileged: false, sourceLineage: "seed:mediation_conversion_probability", exportFlag: false,
  });

  await db.insert(pcAiReviewPacketsTable).values({
    orgId, matterId: okafor.id, reviewType: "mediation_brief",
    generatedContent: "MEDIATION BRIEF DRAFT — Okafor v. Starbucks Corp.\n\nLiability Summary: Plaintiff slipped and fell on wet floor at Bronx Starbucks location. Defendant had actual notice via 3 prior incident reports. No wet floor sign posted at time of incident. Strong liability position.\n\nDamages Summary: Lumbar disc herniation (L4-L5, L5-S1), knee meniscus tear requiring surgery, 18 months of treatment. Medical specials to date: $247,000. Future medical projection pending. Lost wages: $85,000 (18 months documented).\n\nVenue Analysis: Bronx Supreme — historically plaintiff-friendly. Median verdict for comparable premises cases: $975,000. Strong incentive for carrier to settle pre-trial.",
    sourceReferences: [{ docType: "medical_records", providerName: "Lincoln Hospital Bronx" }, { docType: "incident_report", ref: "Starbucks Incident #BX-2021-1114" }],
    groundingScore: 79, status: "draft", modelRoute: "anthropic/claude-3-5-sonnet", isPrivileged: true,
    flaggedAssertions: [{ assertion: "Future medical projection pending", flag: "incomplete_damages", severity: "high" }],
  });

  await db.insert(pcDefensibilityScoresTable).values({
    orgId, matterId: okafor.id, overallScore: 62, groundingScore: 79, humanApprovalScore: null, privilegeScore: 90, auditCompleteness: 55, sourceAttributionScore: 72, openFlags: 3,
    flagDetails: [{ flag: "lien_unresolved", severity: "high", description: "Medicare/Medicaid lien unconfirmed — blocks settlement" }, { flag: "expert_not_retained", severity: "high", description: "No liability expert report" }, { flag: "discovery_outstanding", severity: "medium", description: "AIG discovery response 71 days overdue" }],
  });
  logger.info("NY demo matter Okafor seeded");
  } // end Okafor block

  /* ── MATTER 3: Kensington — Coverage Dispute, NY County ── */
  const kensingtonCaseNumber = "2025-NY-CV-03817";
  if (existingByCaseNumber.has(kensingtonCaseNumber)) {
    logger.info(`NY demo matter Kensington (${kensingtonCaseNumber}) already exists, skipping`);
  } else {

  const [kensington] = await db.insert(pcMattersTable).values({
    orgId,
    caseNumber: kensingtonCaseNumber,
    title: "Kensington Realty v. Travelers (NY Coverage Dispute)",
    status: "pre_trial",
    matterType: "insurance_coverage",
    jurisdiction: "New York County, NY",
    courtName: "New York County Supreme Court — Commercial Division",
    healthScore: 69,
    notes: "Commercial coverage dispute; disclaimer timeliness challenge; venue velocity favorable. Plaintiff: Kensington Realty Group. Opposing: Travelers Insurance. Attorney: Rachel Kim, Esq.",
  }).returning();

  await db.insert(pcMatterClocksTable).values([
    { orgId, matterId: kensington.id, clockType: "sol_tolling", startedAt: new Date("2024-03-08"), deadlineAt: new Date("2030-03-08"), status: "running", daysRemaining: 1440, isBreached: false, ruleRef: "NY-SOL-002", notes: "6-year contract SOL for coverage dispute" },
    { orgId, matterId: kensington.id, clockType: "disclaimer_timeliness", startedAt: daysAgo(95), deadlineAt: daysAgo(65), status: "breached", isBreached: true, breachedAt: daysAgo(65), ruleRef: "NY-DISC-001", notes: "Disclaimer issued 95 days post-notice — 65 days late; waiver argument strong" },
  ]);

  await db.insert(pcDisclaimersTable).values({
    orgId, matterId: kensington.id, issuedBy: "Travelers Insurance", issuedAt: daysAgo(95), dueDate: daysAgo(65),
    isTimely: false, daysFromLoss: 95, basis: "Policy exclusion — commercial property damage clause",
    policyExclusion: "Section 14(b) — intentional acts exclusion", vulnerabilityScore: 74,
    challengeStatus: "challenged", notes: "Untimely disclaimer by 65 days; arguable waiver of coverage defense",
  });

  await db.insert(pcCoveragePositionsTable).values([
    { orgId, matterId: kensington.id, positionType: "disclaimer_issued", carrierName: "Travelers Insurance", positionDate: daysAgo(95), coverageAmount: "2500000.00", reservationBasis: "Policy exclusion 14(b)", policyRef: "CGL-2024-KRG-001", analysisNotes: "Disclaimer untimely — 95 days vs. 30-day window", disputeStrength: "strong" },
  ]);

  await db.insert(pcOfferMovementsTable).values([
    { orgId, matterId: kensington.id, offerType: "insurer_offer", amount: "95000.00", offeringParty: "Travelers Insurance", offeredAt: daysAgo(60), movementSignal: "opening" },
    { orgId, matterId: kensington.id, offerType: "plaintiff_demand", amount: "750000.00", offeringParty: "Plaintiff", offeredAt: daysAgo(75) },
    { orgId, matterId: kensington.id, offerType: "counter_offer", amount: "550000.00", offeringParty: "Plaintiff", offeredAt: daysAgo(20), movementSignal: "closing" },
  ]);

  await db.insert(pcReserveMovementsTable).values([
    { orgId, matterId: kensington.id, carrierName: "Travelers Insurance", reserveAmount: "300000.00", reserveDate: daysAgo(120), movementType: "set" },
    { orgId, matterId: kensington.id, carrierName: "Travelers Insurance", reserveAmount: "450000.00", priorReserve: "300000.00", delta: "150000.00", reserveDate: daysAgo(30), movementType: "increase", inferredSignal: "50% reserve increase post-disclaimer challenge" },
  ]);

  await db.insert(pcMediationEventsTable).values({
    orgId, matterId: kensington.id, scheduledAt: daysFrom(221), sessionType: "voluntary", status: "pending",
    preReadinessScore: 72, conversionProbability: "0.63",
    notes: "Commercial mediation — to be scheduled at JAMS; strong disclaimer challenge leverage",
  });

  await db.insert(pcDemandReadinessSnapshotsTable).values({
    orgId, matterId: kensington.id, overallScore: 72, medicalChronologyScore: null, liabilityScore: 85, damagesScore: 70, lienScore: 80, photographicScore: 75, witnessScore: 65, expertScore: 60,
    missingItems: ["Coverage counsel opinion letter", "Damage quantification report"],
    blockingItems: [],
  });

  const kensingtonClocks = await db.select({ id: pcMatterClocksTable.id }).from(pcMatterClocksTable).where(eq(pcMatterClocksTable.matterId, kensington.id));
  for (const clock of kensingtonClocks) {
    await db.insert(pcClockEventsTable).values([
      { orgId, matterId: kensington.id, clockId: clock.id, eventType: "start", occurredAt: daysAgo(95), description: "Clock started on disclaimer issuance", sourceDocument: "Travelers Insurance disclaimer letter" },
      { orgId, matterId: kensington.id, clockId: clock.id, eventType: "breach", occurredAt: daysAgo(65), description: "30-day disclaimer window expired without timely disclaimer", sourceDocument: "Disclaimer dated 95 days post-notice — 65 days late" },
    ]);
  }

  await db.insert(pcDemandPacketsTable).values({
    orgId, matterId: kensington.id, version: 1, status: "review", demandAmount: "750000.00", readinessScore: 72,
    missingItems: ["Coverage counsel opinion letter", "Damage quantification report"],
    includedItems: ["Policy documents", "Disclaimer letter (untimely)", "Notice of claim", "Expert liability report", "Commercial property assessment"],
    notes: "Coverage dispute demand. Untimely disclaimer gives strong waiver argument. Demand is ready to send pending coverage counsel opinion letter.",
  });

  const [kensingtonForecastRun] = await db.insert(pcForecastRunsTable).values({
    orgId, matterId: kensington.id, forecastType: "disclaimer_vulnerability_score", score: "74.00", confidence: "81.00", weeklyDelta: "5.00",
    nextBestAction: "Retain coverage expert to provide opinion on waiver of disclaimer; file summary judgment motion on timeliness", modelVersion: "v1.0.0-seed",
  }).returning();

  await db.insert(pcForecastDriversTable).values([
    { forecastRunId: kensingtonForecastRun.id, orgId, matterId: kensington.id, driverName: "Disclaimer Timeliness Breach", driverValue: "65 days late", impact: "positive", weight: "0.45", explanation: "Disclaimer issued 95 days post-notice vs. 30-day window — strong waiver argument under Ins. Law § 3420(d)", sourceLineage: "seed:disclaimer_vulnerability_score", exportFlag: false },
    { forecastRunId: kensingtonForecastRun.id, orgId, matterId: kensington.id, driverName: "Reserve 50% Increase", driverValue: "+$150,000", impact: "positive", weight: "0.30", explanation: "Carrier's 50% reserve increase post-disclaimer challenge signals internal acknowledgment of vulnerability", sourceLineage: "seed:disclaimer_vulnerability_score", exportFlag: false },
    { forecastRunId: kensingtonForecastRun.id, orgId, matterId: kensington.id, driverName: "Offer Movement", driverValue: "from $95K toward $550K counter", impact: "positive", weight: "0.25", explanation: "Plaintiff reduced demand from $750K to $550K — bid gap narrowing; favorable trajectory", sourceLineage: "seed:disclaimer_vulnerability_score", exportFlag: false },
  ]);

  await db.insert(pcForecastExplanationsTable).values({
    forecastRunId: kensingtonForecastRun.id, orgId, matterId: kensington.id, headline: "Strong disclaimer vulnerability — 65-day late disclaimer creates waiver risk",
    detail: "Travelers issued their disclaimer 95 days after receiving notice of claim, missing the 30-day window by 65 days. Under Insurance Law § 3420(d), this late disclaimer may constitute a waiver of the coverage defense. The 50% reserve increase post-challenge and narrowing bid gap (offer $95K → counter $550K) suggest Travelers is reassessing their exposure.",
    recommendations: ["Retain coverage counsel to render written opinion on waiver", "File summary judgment motion on disclaimer timeliness", "Prepare motion for declaratory judgment if needed", "Counter at $625K — signal firmness while leaving room for mediation"],
    citations: ["Ins. Law § 3420(d)(2) (disclaimer timeliness)", "First Fin. Ins. Co. v. Jetco Contr. Corp., 1 NY3d 64 (2003)"],
    isPrivileged: false, sourceLineage: "seed:disclaimer_vulnerability_score", exportFlag: false,
  });

  await db.insert(pcAiReviewPacketsTable).values({
    orgId, matterId: kensington.id, reviewType: "coverage_analysis",
    generatedContent: "COVERAGE ANALYSIS — Kensington Realty v. Travelers Insurance\n\nIssue: Whether Travelers' disclaimer is timely under Insurance Law § 3420(d)(2).\n\nConclusion: The disclaimer is almost certainly untimely. Travelers received notice of claim on March 8, 2024 and did not issue the disclaimer until June 11, 2024 — 95 days later. The statutory window is 30 days. Under First Financial Insurance Co. v. Jetco Contracting Corp. (1 NY3d 64), a late disclaimer under § 3420(d)(2) is vitiated and cannot be used to disclaim coverage.\n\nPolicy Exclusion Analysis: Travelers relies on Section 14(b) intentional acts exclusion. However, even assuming the exclusion applies on the merits, the untimely disclaimer likely waives Travelers' right to assert it.\n\nRisk Assessment: 74% vulnerability score. Recommend motion for declaratory judgment.",
    sourceReferences: [{ docType: "policy", ref: "CGL-2024-KRG-001" }, { docType: "disclaimer_letter", ref: "Travelers disclaimer dated 2024-06-11" }],
    groundingScore: 88, status: "pending_review", modelRoute: "anthropic/claude-3-5-sonnet", isPrivileged: true,
    flaggedAssertions: [{ assertion: "Exclusion applies on the merits", flag: "legal_conclusion_unverified", severity: "medium" }],
  });

  const [kensingtonAppeal] = await db.insert(pcAppealsTable).values({
    orgId, matterId: kensington.id, denialId: null, noFaultClaimId: null,
    appealType: "sup_ct_article_75", status: "not_filed",
    deadlineAt: daysFrom(90), filedAt: null,
    appealingParty: "Kensington Realty Group (Plaintiff)",
    groundsForAppeal: "Travelers disclaimer issued 65 days late (95 days post-notice vs. 30-day window). Late disclaimer constitutes waiver of coverage defense under Ins. Law § 3420(d)(2). Filing declaratory judgment action for coverage.",
    decisionNotes: null,
    sourceLineage: "seed:kensington_matter", actorId: null, isPrivileged: true, exportFlag: false,
  }).returning();

  await db.insert(pcExternalAppealsTable).values({
    orgId, matterId: kensington.id, appealId: kensingtonAppeal.id,
    tribunal: "New York County Supreme Court — Commercial Division",
    tribunalCaseNo: null,
    panelComposition: "Single judge — Commercial Division",
    hearingDate: null,
    filingDeadline: daysFrom(90),
    status: "pending",
    awardAmount: null,
    outcome: null,
    representingCounsel: "Rachel Kim, Esq.",
    notes: "Declaratory judgment action for coverage — Travelers waiver argument. Filing pending coverage counsel opinion letter.",
    sourceLineage: "seed:kensington_matter", actorId: null, isPrivileged: true, exportFlag: false,
  });

  await db.insert(pcDefensibilityScoresTable).values({
    orgId, matterId: kensington.id, overallScore: 82, groundingScore: 88, humanApprovalScore: null, privilegeScore: 95, auditCompleteness: 78, sourceAttributionScore: 90, openFlags: 1,
    flagDetails: [{ flag: "pending_coverage_opinion", severity: "medium", description: "Coverage counsel written opinion required before sending demand" }],
  });

  logger.info("NY demo matter Kensington seeded");
  } // end Kensington block

  logger.info("NY demo matters seeded (Vasquez, Okafor, Kensington — skipped any already existing)");
}

export async function seedNyDemoData(orgId = 1) {
  try {
    logger.info("Starting NY Insurance Observability demo data seed...", { orgId });
    await seedClockRules();
    await seedNyRuleProfiles();
    await seedVenueProfiles();
    const venues = await db.select({ id: pcVenueProfilesTable.id, county: pcVenueProfilesTable.county }).from(pcVenueProfilesTable);
    const venueIds: Record<string, number> = {};
    for (const v of venues) { venueIds[v.county] = v.id; }
    await seedPartProfiles(venueIds);
    await seedInsurerProfiles(orgId);
    await seedDemoMatters(orgId);
    logger.info("NY demo seed complete");
  } catch (err) {
    logger.error("NY demo seed failed", err);
    throw err;
  }
}
