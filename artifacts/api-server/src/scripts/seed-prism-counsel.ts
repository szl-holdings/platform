import {
  db,
  pcMattersTable,
  pcPartiesTable,
  pcClaimsTable,
  pcOffersTable,
  pcMedicalEventsTable,
  pcDamagesTable,
  pcLiensTable,
  pcDeadlinesTable,
  pcDiscoveryTable,
  pcDepositionsTable,
  pcForecastsTable,
  pcReadinessScoresTable,
  pcCommunicationsTable,
  pcAiRecommendationsTable,
  pcWitnessesTable,
  pcDocumentChunksTable,
  pcPrivilegeFlagsTable,
  pcInconsistencyFlagsTable,
  pcPlaybooksTable,
  pcConnectorAccountsTable,
  pcNyRuleProfilesTable,
  pcMatterClocksTable,
  pcClockEventsTable,
  pcNoFaultClaimsTable,
  pcDisclaimersTable,
  pcCoveragePositionsTable,
  pcMedicalBillCyclesTable,
  pcVerificationRequestsTable,
  pcDenialsTable,
  pcOfferMovementsTable,
  pcDocumentsTable,
  pcPurviewHoldAwarenessTable,
  pcRecoveryItemsTable,
  pcRecoveryPartiesTable,
  pcRecoveryDocumentsTable,
} from "@szl-holdings/db";

function daysAgo(n: number) { return new Date(Date.now() - n * 86400000); }
function daysAhead(n: number) { return new Date(Date.now() + n * 86400000); }

export async function seedPrismCounsel() {
  console.log("[seed-prism-counsel] Starting PRISM Counsel seed...");

  const existing = await db.select({ id: pcMattersTable.id }).from(pcMattersTable).limit(1);
  if (existing.length > 0) {
    console.log("[seed-prism-counsel] Data already seeded, skipping.");
    return { skipped: true };
  }

  const ORG_ID = 1;
  const ATTORNEY_ID = 1;
  const PARALEGAL_ID = 2;

  const matters = await db.insert(pcMattersTable).values([
    {
      orgId: ORG_ID,
      title: "Rivera v. Manhattan Transit Authority — Subway Platform Slip",
      caseNumber: "PC-2024-0081",
      matterType: "premises_liability",
      status: "discovery",
      stage: "active_discovery",
      jurisdiction: "NY Supreme Court — New York County",
      courtName: "Supreme Court of the State of New York",
      filingDate: daysAgo(180),
      statOfLimitations: daysAhead(900),
      healthScore: 82,
      settlementLow: "185000",
      settlementHigh: "420000",
      settlementMid: "290000",
      totalDamages: "385000",
      totalLiens: "47000",
      assignedAttorneyId: ATTORNEY_ID,
      assignedParalegalId: PARALEGAL_ID,
      tags: ["premises", "mta", "high-value", "active-discovery"],
      notes: "Client suffered fractured hip on wet platform. MTA liability strong — security footage obtained.",
      privilegeFlag: false,
      exportSafe: true,
    },
    {
      orgId: ORG_ID,
      title: "Chen v. Apex Logistics — Rear-End Highway Collision",
      caseNumber: "PC-2024-0114",
      matterType: "auto_injury",
      status: "pre_trial",
      stage: "mediation_scheduled",
      jurisdiction: "NY Supreme Court — Kings County",
      courtName: "Supreme Court of the State of New York",
      filingDate: daysAgo(320),
      statOfLimitations: daysAhead(400),
      healthScore: 74,
      settlementLow: "95000",
      settlementHigh: "280000",
      settlementMid: "165000",
      totalDamages: "242000",
      totalLiens: "31500",
      assignedAttorneyId: ATTORNEY_ID,
      assignedParalegalId: PARALEGAL_ID,
      tags: ["auto", "commercial-vehicle", "mediation-pending"],
      notes: "Commercial truck driver rear-ended client at highway speed. Apex liability policy $1M. Mediation April 28.",
      privilegeFlag: false,
      exportSafe: true,
    },
    {
      orgId: ORG_ID,
      title: "Williams v. Northside Medical Center — Surgical Nerve Damage",
      caseNumber: "PC-2024-0152",
      matterType: "medical_malpractice",
      status: "investigation",
      stage: "expert_review",
      jurisdiction: "NY Supreme Court — Bronx County",
      courtName: "Supreme Court of the State of New York",
      filingDate: daysAgo(90),
      statOfLimitations: daysAhead(1000),
      healthScore: 61,
      settlementLow: "500000",
      settlementHigh: "2500000",
      settlementMid: "1200000",
      totalDamages: "1850000",
      totalLiens: "128000",
      assignedAttorneyId: ATTORNEY_ID,
      assignedParalegalId: PARALEGAL_ID,
      tags: ["malpractice", "surgical-error", "high-value", "expert-needed"],
      notes: "Orthopedic surgeon severed ulnar nerve during elbow repair. Client permanent partial hand paralysis.",
      privilegeFlag: false,
      exportSafe: false,
    },
    {
      orgId: ORG_ID,
      title: "Patel v. Queens Property Management — Stairwell Fall",
      caseNumber: "PC-2025-0007",
      matterType: "premises_liability",
      status: "settlement",
      stage: "demand_sent",
      jurisdiction: "NY Supreme Court — Queens County",
      courtName: "Supreme Court of the State of New York",
      filingDate: daysAgo(410),
      statOfLimitations: daysAhead(300),
      healthScore: 88,
      settlementLow: "75000",
      settlementHigh: "175000",
      settlementMid: "115000",
      totalDamages: "138000",
      totalLiens: "22000",
      assignedAttorneyId: ATTORNEY_ID,
      assignedParalegalId: PARALEGAL_ID,
      tags: ["premises", "landlord", "demand-out", "ready-to-move"],
      notes: "Unlit stairwell, broken handrail. Client broke wrist and ankle. Demand $135,000 sent 3 weeks ago — insurer silent.",
      privilegeFlag: false,
      exportSafe: true,
    },
    {
      orgId: ORG_ID,
      title: "Torres v. Brooklyn Construction Partners — Scaffold Fall",
      caseNumber: "PC-2024-0199",
      matterType: "premises_liability",
      status: "trial",
      stage: "trial_prep",
      jurisdiction: "NY Supreme Court — Kings County",
      courtName: "Supreme Court of the State of New York",
      filingDate: daysAgo(520),
      statOfLimitations: daysAhead(100),
      healthScore: 91,
      settlementLow: "800000",
      settlementHigh: "3500000",
      settlementMid: "2000000",
      totalDamages: "3100000",
      totalLiens: "195000",
      assignedAttorneyId: ATTORNEY_ID,
      assignedParalegalId: PARALEGAL_ID,
      tags: ["labor-law-240", "scaffold", "trial-ready", "catastrophic"],
      notes: "Labor Law §240 scaffold fall from 18 feet. Client now paraplegic. Trial scheduled May 12. Carrier at policy limit.",
      privilegeFlag: true,
      exportSafe: false,
    },
    {
      orgId: ORG_ID,
      title: "Johnson v. State Farm — Uninsured Motorist Coverage Dispute",
      caseNumber: "PC-2025-0031",
      matterType: "insurance_coverage",
      status: "discovery",
      stage: "interrogatories_out",
      jurisdiction: "NY Supreme Court — New York County",
      courtName: "Supreme Court of the State of New York",
      filingDate: daysAgo(145),
      statOfLimitations: daysAhead(720),
      healthScore: 69,
      settlementLow: "50000",
      settlementHigh: "150000",
      settlementMid: "90000",
      totalDamages: "125000",
      totalLiens: "15000",
      assignedAttorneyId: ATTORNEY_ID,
      assignedParalegalId: PARALEGAL_ID,
      tags: ["um-coverage", "insurance-dispute", "discovery"],
      notes: "Hit-and-run accident. State Farm disputing UM coverage on technical policy grounds.",
      privilegeFlag: false,
      exportSafe: true,
    },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-prism-counsel] Seeded ${matters.length} matters`);

  const parties = await db.insert(pcPartiesTable).values([
    { matterId: matters[0].id, role: "plaintiff", name: "Maria Rivera", email: "mrivera@email.com", phone: "718-555-0142", notes: "Primary claimant. DOB 1974. Spanish-speaking — interpreter needed." },
    { matterId: matters[0].id, role: "defendant", name: "Manhattan Transit Authority", organization: "MTA", email: "legalnotices@mta.gov", notes: "Public entity, 90-day notice of claim filed timely." },
    { matterId: matters[0].id, role: "carrier", name: "Travelers Insurance", organization: "Travelers", notes: "Carrier for MTA. $10M policy limit." },
    { matterId: matters[1].id, role: "plaintiff", name: "David Chen", email: "dchen.nyc@gmail.com", phone: "646-555-0319" },
    { matterId: matters[1].id, role: "defendant", name: "Apex Logistics Inc.", organization: "Apex Logistics", notes: "Commercial trucking company, PA registered." },
    { matterId: matters[1].id, role: "adjuster", name: "Karen West", organization: "Nationwide Insurance", email: "k.west@nationwide.com", phone: "800-555-0100", notes: "Adjuster responsive, last contact 2 weeks ago." },
    { matterId: matters[2].id, role: "plaintiff", name: "James Williams", email: "jwilliams84@email.com", phone: "929-555-0481" },
    { matterId: matters[2].id, role: "defendant", name: "Northside Medical Center", organization: "Northside MC", notes: "Hospital defendant. Dr. Reyes named individually." },
    { matterId: matters[3].id, role: "plaintiff", name: "Priya Patel", email: "patel.priya@gmail.com", phone: "718-555-0887" },
    { matterId: matters[3].id, role: "defendant", name: "Queens Property Management LLC", organization: "QPM LLC" },
    { matterId: matters[4].id, role: "plaintiff", name: "Roberto Torres", email: "rtorres.bk@email.com", phone: "347-555-0622", notes: "Client paraplegic. Communications through wife Rosa Torres." },
    { matterId: matters[4].id, role: "defendant", name: "Brooklyn Construction Partners LLC", organization: "BCP LLC" },
    { matterId: matters[5].id, role: "plaintiff", name: "Marcus Johnson", email: "m.johnson@email.com", phone: "212-555-0258" },
    { matterId: matters[5].id, role: "carrier", name: "State Farm Mutual", organization: "State Farm", notes: "UM carrier disputing on policy exclusion grounds." },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-prism-counsel] Seeded ${parties.length} parties`);

  const claims = await db.insert(pcClaimsTable).values([
    { matterId: matters[0].id, claimNumber: "TRV-2024-881234", policyNumber: "MTA-GL-2024", carrierName: "Travelers Insurance", coverageType: "general_liability", policyLimit: "10000000", status: "open" },
    { matterId: matters[1].id, claimNumber: "NW-2024-447123", policyNumber: "APX-AUTO-2024", carrierName: "Nationwide Insurance", coverageType: "bodily_injury", policyLimit: "1000000", status: "pending" },
    { matterId: matters[2].id, claimNumber: "CHUBB-2024-991002", policyNumber: "NMC-MP-2024", carrierName: "Chubb Group", coverageType: "general_liability", policyLimit: "5000000", status: "open" },
    { matterId: matters[3].id, claimNumber: "LMIT-2025-002188", policyNumber: "QPM-GL-2025", carrierName: "Liberty Mutual", coverageType: "premises", policyLimit: "2000000", status: "accepted" },
    { matterId: matters[4].id, claimNumber: "AIG-2024-774412", policyNumber: "BCP-GL-2024", carrierName: "AIG Construction", coverageType: "general_liability", policyLimit: "3000000", status: "litigated" },
    { matterId: matters[5].id, claimNumber: "SF-UM-2025-00891", policyNumber: "JOHNSON-UM-2025", carrierName: "State Farm Mutual", coverageType: "uninsured_motorist", policyLimit: "100000", status: "denied" },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-prism-counsel] Seeded ${claims.length} claims`);

  await db.insert(pcOffersTable).values([
    { matterId: matters[0].id, claimId: claims[0].id, offerType: "demand", amount: "350000", source: "Plaintiff", notes: "Initial demand letter sent.", offerDate: daysAgo(60) },
    { matterId: matters[0].id, claimId: claims[0].id, offerType: "offer", amount: "85000", source: "Travelers Insurance", notes: "Low-ball first offer.", offerDate: daysAgo(45) },
    { matterId: matters[0].id, claimId: claims[0].id, offerType: "counter_offer", amount: "290000", source: "Plaintiff", notes: "Counter demand.", offerDate: daysAgo(30) },
    { matterId: matters[1].id, claimId: claims[1].id, offerType: "demand", amount: "165000", source: "Plaintiff", notes: "Demand sent, awaiting response.", offerDate: daysAgo(14) },
    { matterId: matters[3].id, claimId: claims[3].id, offerType: "demand", amount: "135000", source: "Plaintiff", notes: "Policy demand — insurer silent 21 days.", offerDate: daysAgo(21) },
    { matterId: matters[4].id, claimId: claims[4].id, offerType: "final_offer", amount: "2000000", source: "Plaintiff", notes: "At policy limit tender; trial scheduled May 12.", offerDate: daysAgo(7) },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded offers`);

  await db.insert(pcMedicalEventsTable).values([
    { matterId: matters[0].id, providerName: "NYP/Weill Cornell Medical Center", providerType: "hospital", eventType: "visit", description: "Emergency admission post-fall. Hip fracture confirmed via X-ray.", diagnosis: "Right femoral neck fracture", eventDate: daysAgo(185), billedAmount: "48200", paidAmount: "0", outstandingAmount: "48200" },
    { matterId: matters[0].id, providerName: "Manhattan Orthopedic Group", providerType: "orthopedic", eventType: "surgery", description: "Open reduction internal fixation of hip fracture.", diagnosis: "Surgical repair right hip", eventDate: daysAgo(183), billedAmount: "32500", paidAmount: "0", outstandingAmount: "32500" },
    { matterId: matters[0].id, providerName: "NYC Physical Therapy & Rehab", providerType: "physical_therapy", eventType: "therapy_session", description: "Post-surgical physical therapy — 24 sessions completed.", diagnosis: "Post-surgical rehabilitation", eventDate: daysAgo(90), billedAmount: "9800", paidAmount: "0", outstandingAmount: "9800" },
    { matterId: matters[1].id, providerName: "Kings County Hospital", providerType: "er", eventType: "visit", description: "ER admission after rear-end MVA. Cervical strain, shoulder injury.", diagnosis: "Cervical disc herniation C5-C6, rotator cuff tear", eventDate: daysAgo(325), billedAmount: "18400", paidAmount: "0", outstandingAmount: "18400" },
    { matterId: matters[1].id, providerName: "Brooklyn Spine & Pain", providerType: "pain_management", eventType: "procedure", description: "3 epidural steroid injections, cervical.", diagnosis: "Cervical radiculopathy", eventDate: daysAgo(280), billedAmount: "12600", paidAmount: "0", outstandingAmount: "12600" },
    { matterId: matters[2].id, providerName: "Northside Medical Center", providerType: "hospital", eventType: "surgery", description: "Elbow reconstruction — ulnar nerve injury during procedure.", diagnosis: "Iatrogenic ulnar nerve laceration", eventDate: daysAgo(95), billedAmount: "87500", paidAmount: "0", outstandingAmount: "87500" },
    { matterId: matters[4].id, providerName: "Bellevue Hospital Center", providerType: "hospital", eventType: "visit", description: "Trauma admission from scaffold fall, 18 feet. T4 fracture confirmed. SCI complete.", diagnosis: "Complete spinal cord injury T4", eventDate: daysAgo(525), billedAmount: "185000", paidAmount: "0", outstandingAmount: "185000" },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded medical events`);

  await db.insert(pcDamagesTable).values([
    { matterId: matters[0].id, category: "medical_specials", description: "Past medical bills — hospital, surgery, PT", amount: "90500", isProjected: false, verificationStatus: "verified" },
    { matterId: matters[0].id, category: "future_medical", description: "Projected ongoing PT and pain management", amount: "45000", isProjected: true, verificationStatus: "estimated" },
    { matterId: matters[0].id, category: "lost_wages", description: "8 months out of work — restaurant manager", amount: "52000", isProjected: false, verificationStatus: "verified" },
    { matterId: matters[0].id, category: "pain_suffering", description: "General damages — permanent limp expected", amount: "175000", isProjected: false, verificationStatus: "pending" },
    { matterId: matters[1].id, category: "medical_specials", description: "Past medical — ER, pain management, PT", amount: "62000", isProjected: false, verificationStatus: "verified" },
    { matterId: matters[1].id, category: "lost_wages", description: "12 weeks out of work — delivery driver", amount: "18000", isProjected: false, verificationStatus: "verified" },
    { matterId: matters[1].id, category: "pain_suffering", description: "Cervical herniation — chronic pain expected", amount: "120000", isProjected: false, verificationStatus: "pending" },
    { matterId: matters[4].id, category: "medical_specials", description: "Acute trauma care, spinal stabilization surgery", amount: "450000", isProjected: false, verificationStatus: "verified" },
    { matterId: matters[4].id, category: "future_medical", description: "Lifetime wheelchair, nursing care, adaptive equipment", amount: "2200000", isProjected: true, verificationStatus: "estimated" },
    { matterId: matters[4].id, category: "lost_wages", description: "Lifetime lost earning capacity — construction foreman", amount: "380000", isProjected: true, verificationStatus: "estimated" },
    { matterId: matters[4].id, category: "pain_suffering", description: "Complete paralysis — catastrophic damages", amount: "500000", isProjected: false, verificationStatus: "pending" },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded damages`);

  await db.insert(pcLiensTable).values([
    { matterId: matters[0].id, lienHolder: "Medicaid — NYS DOH", lienType: "medicaid", assertedAmount: "38000", negotiatedAmount: "22000", status: "negotiating" },
    { matterId: matters[0].id, lienHolder: "NYP/Weill Cornell", lienType: "hospital", assertedAmount: "9000", status: "asserted" },
    { matterId: matters[1].id, lienHolder: "BCBS — Employer Plan", lienType: "health_insurance", assertedAmount: "28500", status: "asserted" },
    { matterId: matters[1].id, lienHolder: "Social Security — ERISA lien", lienType: "erisa", assertedAmount: "3000", status: "asserted" },
    { matterId: matters[2].id, lienHolder: "Medicare — BCRC", lienType: "medicare", assertedAmount: "95000", negotiatedAmount: "52000", status: "negotiating" },
    { matterId: matters[2].id, lienHolder: "Northside Medical Center", lienType: "hospital", assertedAmount: "33000", status: "asserted" },
    { matterId: matters[4].id, lienHolder: "Medicare — BCRC", lienType: "medicare", assertedAmount: "142000", status: "asserted" },
    { matterId: matters[4].id, lienHolder: "Workers Comp Carrier", lienType: "workers_comp", assertedAmount: "53000", status: "negotiating" },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded liens`);

  await db.insert(pcDeadlinesTable).values([
    { matterId: matters[0].id, title: "Plaintiff EBT — Maria Rivera", deadlineType: "deposition", dueDate: daysAhead(18), priority: "high", status: "pending", assignedTo: PARALEGAL_ID },
    { matterId: matters[0].id, title: "Discovery Cutoff", deadlineType: "discovery_cutoff", dueDate: daysAhead(75), priority: "medium", status: "pending" },
    { matterId: matters[1].id, title: "Mediation — April 28", deadlineType: "mediation", dueDate: daysAhead(13), priority: "critical", status: "pending", assignedTo: ATTORNEY_ID, notes: "Pre-mediation memo due 5 days prior." },
    { matterId: matters[2].id, title: "Expert Disclosure", deadlineType: "expert_disclosure", dueDate: daysAhead(90), priority: "high", status: "pending" },
    { matterId: matters[3].id, title: "Insurer Response Deadline", deadlineType: "response", dueDate: daysAhead(7), priority: "critical", status: "pending", notes: "Demand sent 21 days ago — 30-day response window expiring." },
    { matterId: matters[4].id, title: "Trial Date — May 12", deadlineType: "trial", dueDate: daysAhead(27), priority: "critical", status: "pending", assignedTo: ATTORNEY_ID },
    { matterId: matters[4].id, title: "Pre-Trial Motion Submissions", deadlineType: "motion", dueDate: daysAhead(14), priority: "critical", status: "pending" },
    { matterId: matters[5].id, title: "Statute of Limitations — UM Claim", deadlineType: "statute_of_limitations", dueDate: daysAhead(720), priority: "medium", status: "pending" },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded deadlines`);

  await db.insert(pcDiscoveryTable).values([
    { matterId: matters[0].id, discoveryType: "interrogatories", direction: "sent", title: "First Set of Interrogatories to MTA", servedDate: daysAgo(120), dueDate: daysAgo(90), status: "responded" },
    { matterId: matters[0].id, discoveryType: "requests_for_production", direction: "sent", title: "RFP for MTA Incident Reports and Maintenance Logs", servedDate: daysAgo(115), dueDate: daysAgo(85), status: "responded" },
    { matterId: matters[0].id, discoveryType: "subpoena", direction: "sent", title: "Subpoena — MTA CCTV Footage Platform 4B", servedDate: daysAgo(100), status: "completed" },
    { matterId: matters[1].id, discoveryType: "interrogatories", direction: "sent", title: "First Set of Interrogatories to Apex Logistics", servedDate: daysAgo(200), dueDate: daysAgo(170), status: "responded" },
    { matterId: matters[2].id, discoveryType: "requests_for_production", direction: "sent", title: "RFP for Medical Records — Operating Reports", servedDate: daysAgo(60), dueDate: daysAgo(30), status: "pending_response" },
    { matterId: matters[4].id, discoveryType: "expert_report", direction: "sent", title: "Life Care Plan Expert Report — Lifetime Damages", servedDate: daysAgo(14), status: "completed" },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded discovery`);

  await db.insert(pcDepositionsTable).values([
    { matterId: matters[0].id, deponentName: "Maria Rivera", deponentRole: "plaintiff", scheduledDate: daysAhead(18), location: "PRISM Counsel Offices — 233 Broadway, New York", status: "scheduled" },
    { matterId: matters[0].id, deponentName: "MTA Platform Safety Inspector John Boyle", deponentRole: "corporate_rep", scheduledDate: daysAhead(32), location: "MTA Legal — 2 Broadway", status: "scheduled" },
    { matterId: matters[1].id, deponentName: "David Chen", deponentRole: "plaintiff", scheduledDate: daysAgo(30), status: "completed", keyFindings: "Credible testimony. Consistent with medical records. Jury appeal strong." },
    { matterId: matters[4].id, deponentName: "Roberto Torres", deponentRole: "plaintiff", scheduledDate: daysAgo(60), status: "completed", keyFindings: "Powerful testimony — jury sympathy high. Defense did not break client on cross." },
    { matterId: matters[4].id, deponentName: "OSHA Inspector L. Ramirez", deponentRole: "witness", scheduledDate: daysAgo(45), status: "completed", keyFindings: "OSHA inspector confirmed scaffold was not inspected in 8 months prior to incident." },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded depositions`);

  await db.insert(pcForecastsTable).values([
    { matterId: matters[0].id, forecastType: "settlement_range", confidence: "0.82", valueLow: "185000", valueMid: "290000", valueHigh: "420000", explanation: "Strong liability, verified medicals $90K. MTA likely to settle before trial.", requiresAttorneyReview: false },
    { matterId: matters[0].id, forecastType: "mediation_readiness", confidence: "0.71", valueMid: "0.71", explanation: "Medical chronology complete. Lien resolution pending — mediation feasible in 45 days.", requiresAttorneyReview: false },
    { matterId: matters[1].id, forecastType: "settlement_range", confidence: "0.79", valueLow: "95000", valueMid: "165000", valueHigh: "280000", explanation: "Mediation April 28. Adjuster historically settles at ~60% of demand.", requiresAttorneyReview: false },
    { matterId: matters[2].id, forecastType: "settlement_range", confidence: "0.61", valueLow: "500000", valueMid: "1200000", valueHigh: "2500000", explanation: "Expert needed to confirm causation before settlement range narrows.", requiresAttorneyReview: true },
    { matterId: matters[4].id, forecastType: "settlement_range", confidence: "0.94", valueLow: "1800000", valueMid: "2200000", valueHigh: "3500000", explanation: "Trial imminent. Carrier confirmed at $3M policy limit. Verdict risk to defense is extreme.", requiresAttorneyReview: true },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded forecasts`);

  await db.insert(pcReadinessScoresTable).values([
    { matterId: matters[0].id, pillar: "posture", score: 85, maxScore: 100 },
    { matterId: matters[0].id, pillar: "readiness", score: 78, maxScore: 100 },
    { matterId: matters[0].id, pillar: "integrity", score: 90, maxScore: 100 },
    { matterId: matters[0].id, pillar: "strategy", score: 82, maxScore: 100 },
    { matterId: matters[0].id, pillar: "money", score: 74, maxScore: 100 },
    { matterId: matters[0].id, pillar: "governance", score: 88, maxScore: 100 },
    { matterId: matters[4].id, pillar: "posture", score: 95, maxScore: 100 },
    { matterId: matters[4].id, pillar: "readiness", score: 92, maxScore: 100 },
    { matterId: matters[4].id, pillar: "integrity", score: 97, maxScore: 100 },
    { matterId: matters[4].id, pillar: "strategy", score: 90, maxScore: 100 },
    { matterId: matters[4].id, pillar: "money", score: 88, maxScore: 100 },
    { matterId: matters[4].id, pillar: "governance", score: 93, maxScore: 100 },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded readiness scores`);

  await db.insert(pcCommunicationsTable).values([
    { matterId: matters[0].id, direction: "inbound", channel: "email", fromParty: "Travelers Adjuster M. Huang", toParty: "Counsel", subject: "RE: Rivera v. MTA — Initial Response", summary: "Adjuster acknowledges claim, requests additional medical records before considering offer." },
    { matterId: matters[0].id, direction: "outbound", channel: "letter", fromParty: "Counsel", toParty: "Travelers Insurance", subject: "Demand Letter — Maria Rivera $350,000", summary: "Formal demand letter with attached medical chronology and damages summary." },
    { matterId: matters[1].id, direction: "inbound", channel: "email", fromParty: "Nationwide Adjuster K. West", toParty: "Counsel", subject: "Chen claim — Pre-mediation call request", summary: "Adjuster wants informal pre-mediation call. Indicates possible movement toward $120K." },
    { matterId: matters[3].id, direction: "outbound", channel: "letter", fromParty: "Counsel", toParty: "Liberty Mutual", subject: "Demand Letter — Patel $135,000", summary: "Policy demand sent. 30-day response window now 21 days elapsed." },
    { matterId: matters[4].id, direction: "inbound", channel: "email", fromParty: "AIG Defense Counsel", toParty: "Counsel", subject: "Torres Trial — Motion in Limine Discussion", summary: "Defense seeking to exclude life care plan expert. Motion to be heard May 5.", isPrivileged: true },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded communications`);

  await db.insert(pcAiRecommendationsTable).values([
    { matterId: matters[0].id, recommendationType: "next_best_action", title: "Follow up on Travelers counter-offer", description: "Travelers made offer of $85K 6 weeks ago. No counter-follow-up in 30 days. Re-engage before mediation window closes.", priority: "high", confidence: "0.87", status: "pending" },
    { matterId: matters[1].id, recommendationType: "mediation_prep", title: "Prepare mediation brief for April 28", description: "13 days to mediation. Adjuster signaling movement. Prepare opening package with updated medicals and demand rationale.", priority: "critical", confidence: "0.91", status: "pending" },
    { matterId: matters[2].id, recommendationType: "missing_evidence", title: "Retain surgical expert for causation opinion", description: "Case requires independent surgical expert to rebut defense causation argument. Expert disclosure deadline in 90 days.", priority: "high", confidence: "0.88", status: "pending" },
    { matterId: matters[3].id, recommendationType: "insurer_silence", title: "Insurer silence approaching breach threshold", description: "Liberty Mutual has not responded to demand in 21 of 30 days. Escalate or initiate bad faith notice.", priority: "critical", confidence: "0.92", status: "pending" },
    { matterId: matters[4].id, recommendationType: "deadline_risk", title: "Pre-trial motion deadline in 14 days", description: "Torres trial May 12. All motions in limine and pre-trial submissions due May 1. Confirm assignments.", priority: "critical", confidence: "0.98", status: "pending" },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded AI recommendations`);

  const connectors = await db.insert(pcConnectorAccountsTable).values([
    { orgId: ORG_ID, connectorType: "microsoft_365", displayName: "PRISM Counsel — Microsoft 365", status: "active", config: { tenantId: "szl-prism-tenant", mailboxes: ["counsel@prismcounsel.com", "paralegal@prismcounsel.com"] } },
    { orgId: ORG_ID, connectorType: "clio", displayName: "Clio Matter Management", status: "active", config: { firmId: "clio-szl-001" } },
    { orgId: ORG_ID, connectorType: "docusign", displayName: "DocuSign — Settlement Signatures", status: "active", config: { accountId: "docusign-prism-001" } },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-prism-counsel] Seeded ${connectors.length} connector accounts`);

  await db.insert(pcPlaybooksTable).values([
    {
      orgId: ORG_ID,
      name: "Auto Injury — Standard Track",
      description: "Standard playbook for auto injury matters from intake through settlement.",
      matterType: "auto_injury",
      steps: [
        { step: 1, action: "File notice of claim if applicable", dueWindow: "30 days of retention" },
        { step: 2, action: "Order all medical records", dueWindow: "Within 2 weeks" },
        { step: 3, action: "Send preservation letter to adverse carrier", dueWindow: "Within 10 days" },
        { step: 4, action: "Build medical chronology", dueWindow: "When records complete" },
        { step: 5, action: "Send demand letter", dueWindow: "After medicals complete and maximum recovery reached" },
      ],
      isActive: true,
    },
    {
      orgId: ORG_ID,
      name: "Premises Liability — Public Entity Track",
      description: "Playbook for premises liability claims against public entities (MTA, City, etc.).",
      matterType: "premises_liability",
      steps: [
        { step: 1, action: "File Notice of Claim (GML §50-e)", dueWindow: "Within 90 days of incident — CRITICAL" },
        { step: 2, action: "50-H hearing prep", dueWindow: "Before hearing date" },
        { step: 3, action: "Preserve CCTV footage via subpoena", dueWindow: "Within 30 days" },
        { step: 4, action: "FOIL request for inspection records", dueWindow: "Within 60 days" },
      ],
      isActive: true,
    },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-prism-counsel] Seeded playbooks`);

  await db.insert(pcWitnessesTable).values([
    { matterId: matters[0].id, name: "Thomas Burke", role: "fact", affiliation: "MTA Platform Inspector", deposed: false, keyTestimony: "Platform was wet and not properly cordoned off. Station agent on duty.", credibility: "moderate" },
    { matterId: matters[0].id, name: "Dr. Elena Vasquez", role: "treating_physician", affiliation: "Manhattan Orthopedic Group", deposed: false, keyTestimony: "Will testify to permanence of injury and ongoing medical needs.", credibility: "strong" },
    { matterId: matters[4].id, name: "Dr. Michael Rhodes", role: "expert", affiliation: "Columbia University Medical Center", deposed: true, depositionDate: daysAgo(30), keyTestimony: "Confirmed complete T4 spinal cord injury — permanent paralysis. Testified to lifetime medical needs.", credibility: "strong" },
    { matterId: matters[4].id, name: "James Callahan", role: "fact", affiliation: "Eyewitness — Passerby", deposed: true, depositionDate: daysAgo(15), keyTestimony: "Witnessed fall. States no safety net or harness visible. Scaffold visibly unstable.", credibility: "strong" },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded witnesses`);

  await db.insert(pcDocumentChunksTable).values([
    { matterId: matters[0].id, documentRef: "rivera-mta-police-report.pdf", documentType: "police_report", content: "NYPD Transit Police Report #2024-0881. Officers responded to platform fall. Station agent confirmed wet platform condition. Plaintiff transported by EMS.", reviewState: "reviewed" },
    { matterId: matters[0].id, documentRef: "rivera-hospital-records-nyp.pdf", documentType: "medical_record", content: "NYP Emergency Department — admission note. Patient presents with right hip pain after fall on subway platform. X-ray confirms right femoral neck fracture. Admission ordered.", reviewState: "reviewed" },
    { matterId: matters[4].id, documentRef: "torres-osha-inspection-report.pdf", documentType: "other", content: "OSHA Inspection Report. Scaffold inspection last completed 8 months prior to incident date. Missing safety harness anchor points. $82,000 in citations issued to BCP LLC.", reviewState: "reviewed" },
    { matterId: matters[2].id, documentRef: "williams-operative-report.pdf", documentType: "medical_record", content: "Operative report — Northside Medical Center. Dr. Reyes performing elbow reconstruction. Intraoperative complication: inadvertent ulnar nerve laceration noted and repaired.", reviewState: "flagged", privilegeFlag: false },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded document chunks`);

  await db.insert(pcNyRuleProfilesTable).values([
    { ruleId: "ny-nf-30-day-notice", category: "no_fault", title: "30-Day No-Fault Notice Rule", description: "Insurer must pay or deny no-fault bills within 30 days of receipt or lose the right to deny.", dayLimit: 30, consequence: "Denial forfeiture — late denial is void as a matter of law", citation: "11 NYCRR §65-3.8(a)(1)", lastReviewed: daysAgo(30), isActive: true },
    { ruleId: "ny-sol-mvl-3yr", category: "statute_of_limitations", title: "3-Year SOL — Motor Vehicle Liability", description: "New York CPLR §214 provides a 3-year statute of limitations for personal injury arising from motor vehicle accidents.", dayLimit: 1095, consequence: "Case dismissed with prejudice", citation: "CPLR §214(5)", lastReviewed: daysAgo(30), isActive: true },
    { ruleId: "ny-sol-malpractice-2.5yr", category: "statute_of_limitations", title: "2.5-Year SOL — Medical Malpractice", description: "Medical malpractice claims must be commenced within 2.5 years of the act or omission, with continuous treatment tolling.", dayLimit: 912, consequence: "Case dismissed with prejudice. Continuous treatment doctrine may extend.", citation: "CPLR §214-a", lastReviewed: daysAgo(30), isActive: true },
    { ruleId: "ny-noc-90-day", category: "court_rules", title: "90-Day Notice of Claim — Municipal Defendants", description: "GML §50-e requires a Notice of Claim to be served within 90 days of the incident when suing NYC or any municipal entity.", dayLimit: 90, consequence: "Case dismissed — notice of claim is a condition precedent", citation: "GML §50-e", lastReviewed: daysAgo(30), isActive: true },
    { ruleId: "ny-disclaimer-30-day", category: "disclaimer", title: "30-Day Disclaimer Rule", description: "Insurer must disclaim coverage within 30 days of learning of a potentially applicable exclusion or disclaimer is void.", dayLimit: 30, consequence: "Disclaimer deemed untimely and ineffective as a matter of law", citation: "Insurance Law §3420(d)(2)", lastReviewed: daysAgo(30), isActive: true },
    { ruleId: "ny-arbitration-demand-3yr", category: "arbitration", title: "3-Year Arbitration Demand — No-Fault", description: "No-fault arbitration demands must be filed within 3 years of denial. Master Arbitration is available for awards > $5,000.", dayLimit: 1095, consequence: "Arbitration claim time-barred", citation: "11 NYCRR §65-4.2", lastReviewed: daysAgo(30), isActive: true },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded NY rule profiles`);

  const clocks = await db.insert(pcMatterClocksTable).values([
    { orgId: 1, matterId: matters[0].id, clockType: "sol_tolling", startedAt: daysAgo(220), deadlineAt: daysAhead(875), status: "running", daysRemaining: 875, isBreached: false, ruleRef: "ny-sol-mvl-3yr", notes: "SOL clock — 3-year personal injury from MTA incident. Started on date of loss." },
    { orgId: 1, matterId: matters[1].id, clockType: "sol_tolling", startedAt: daysAgo(540), deadlineAt: daysAhead(555), status: "running", daysRemaining: 555, isBreached: false, ruleRef: "ny-sol-malpractice-2.5yr", notes: "2.5-year medical malpractice SOL running since procedure date." },
    { orgId: 1, matterId: matters[2].id, clockType: "no_fault_verification", startedAt: daysAgo(15), deadlineAt: daysAhead(15), status: "running", daysRemaining: 15, isBreached: false, ruleRef: "ny-nf-30-day-notice", notes: "30-day EUO verification clock running for no-fault claim NF-2024-0442." },
    { orgId: 1, matterId: matters[3].id, clockType: "sol_tolling", startedAt: daysAgo(180), deadlineAt: daysAhead(920), status: "running", daysRemaining: 920, isBreached: false, ruleRef: "ny-sol-mvl-3yr", notes: "3-year SOL running from date of MVA." },
    { orgId: 1, matterId: matters[4].id, clockType: "discovery_clock", startedAt: daysAgo(90), deadlineAt: daysAhead(180), status: "running", daysRemaining: 180, isBreached: false, notes: "Discovery cutoff running per IAS part compliance conference order." },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-prism-counsel] Seeded matter clocks`);

  await db.insert(pcClockEventsTable).values([
    { orgId: 1, matterId: matters[0].id, clockId: clocks[0].id, eventType: "start", occurredAt: daysAgo(220), description: "SOL clock started on date of MTA platform fall incident.", sourceDocument: "NYPD Incident Report #2024-0881", actorId: 1 },
    { orgId: 1, matterId: matters[1].id, clockId: clocks[1].id, eventType: "start", occurredAt: daysAgo(540), description: "Medical malpractice SOL clock started on date of elbow procedure.", sourceDocument: "Northside Medical Center operative report", actorId: 1 },
    { orgId: 1, matterId: matters[2].id, clockId: clocks[2].id, eventType: "start", occurredAt: daysAgo(15), description: "No-fault EUO verification clock started — carrier requested EUO on claimant.", actorId: 1 },
    { orgId: 1, matterId: matters[4].id, clockId: clocks[4].id, eventType: "start", occurredAt: daysAgo(90), description: "Discovery cutoff clock started at IAS compliance conference. Judge ordered 270-day discovery window.", sourceDocument: "IAS Part 12 Compliance Conference Order", actorId: 1 },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded clock events`);

  const noFaultClaims = await db.insert(pcNoFaultClaimsTable).values([
    { orgId: 1, matterId: matters[2].id, claimantName: "David Park", carrierId: null, carrierName: "Allstate Insurance Company", assignorName: "Queens Medical Associates", dateOfLoss: daysAgo(180), noticeSentAt: daysAgo(160), noticeDueDate: daysAgo(150), noticeStatus: "timely", billStatus: "partial", totalBilled: "28400", totalPaid: "14200", totalDenied: "8600", arbitrationStatus: "pending", arbitrationFiledAt: daysAgo(30), awardAmount: null, evidenceLockRisk: 25 },
    { orgId: 1, matterId: matters[3].id, claimantName: "Patricia Chen", carrierId: null, carrierName: "GEICO", assignorName: "Brooklyn Spine Rehabilitation", dateOfLoss: daysAgo(200), noticeSentAt: daysAgo(178), noticeDueDate: daysAgo(170), noticeStatus: "timely", billStatus: "denied", totalBilled: "42000", totalPaid: "0", totalDenied: "42000", arbitrationStatus: "not_filed", evidenceLockRisk: 45 },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-prism-counsel] Seeded no-fault claims`);

  await db.insert(pcDisclaimersTable).values([
    { orgId: 1, matterId: matters[1].id, issuedBy: "Medical Liability Mutual Insurance Company", issuedAt: daysAgo(210), dueDate: daysAgo(185), isTimely: false, daysFromLoss: 28, basis: "Policy exclusion — prior condition", policyExclusion: "Exclusion 6(b): Pre-existing musculoskeletal conditions", vulnerabilityScore: 72, challengeStatus: "challenged", notes: "Disclaimer issued 28 days after notice — within 30-day window but barely. Challenge based on continuity of condition argument and untimeliness of review process." },
    { orgId: 1, matterId: matters[3].id, issuedBy: "GEICO Insurance", issuedAt: daysAgo(140), dueDate: daysAgo(130), isTimely: false, daysFromLoss: 62, basis: "Late notice — accident not reported within policy requirements", vulnerabilityScore: 85, challengeStatus: "challenged", notes: "Disclaimer issued 62 days after insurer learned of accident. Potentially untimely under §3420(d)(2) 30-day rule — strong challenge position." },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded disclaimers`);

  await db.insert(pcCoveragePositionsTable).values([
    { orgId: 1, matterId: matters[0].id, positionType: "coverage_affirmed", carrierName: "MTA Self-Insurance Program", positionDate: daysAgo(200), coverageAmount: "250000", policyRef: "MTA-SIP-2024-7741", analysisNotes: "MTA confirmed coverage under self-insured program. Per CPLR §1601, MTA is 100% liable as sole defendant.", disputeStrength: "strong" },
    { orgId: 1, matterId: matters[1].id, positionType: "reservation_of_rights", carrierName: "Medical Liability Mutual Insurance Company", positionDate: daysAgo(215), coverageAmount: "3000000", reservationBasis: "Investigating whether prior condition exclusion applies and whether disclosure was adequate", policyRef: "MLMIC-2024-DR-8892", analysisNotes: "ROR issued contemporaneously with disclaimer. Challenge disclaimer as untimely — ROR does not reset the 30-day disclaimer clock.", disputeStrength: "moderate" },
    { orgId: 1, matterId: matters[3].id, positionType: "coverage_denied", carrierName: "GEICO", positionDate: daysAgo(140), policyRef: "GEICO-AUTO-2024-5510", analysisNotes: "GEICO denied coverage based on late notice. However, disclaimer itself was issued 62 days after notice — potentially defeating the late notice defense under §3420(d)(2).", disputeStrength: "strong" },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded coverage positions`);

  await db.insert(pcMedicalBillCyclesTable).values([
    { orgId: 1, matterId: matters[2].id, noFaultClaimId: noFaultClaims[0].id, providerName: "Queens Medical Associates", serviceDate: daysAgo(175), submittedDate: daysAgo(168), billedAmount: "12400", paidAmount: "8200", deniedAmount: "4200", status: "partially_paid", denialReason: "Billing code mismatch — CPT 97014 denied as duplicative", daysToResponse: 22, isLate: false },
    { orgId: 1, matterId: matters[2].id, noFaultClaimId: noFaultClaims[0].id, providerName: "Queens MRI & Imaging", serviceDate: daysAgo(160), submittedDate: daysAgo(155), billedAmount: "8400", paidAmount: "0", deniedAmount: "8400", status: "denied", denialReason: "EUO failure — claimant failed to appear for examination under oath. Suspension of benefits.", daysToResponse: 28, isLate: false },
    { orgId: 1, matterId: matters[3].id, noFaultClaimId: noFaultClaims[1].id, providerName: "Brooklyn Spine Rehabilitation", serviceDate: daysAgo(195), submittedDate: daysAgo(190), billedAmount: "16000", paidAmount: "0", deniedAmount: "16000", status: "arbitration", denialReason: "Late notice — coverage disclaimable under late notice defense.", daysToResponse: 31, isLate: true },
    { orgId: 1, matterId: matters[3].id, noFaultClaimId: noFaultClaims[1].id, providerName: "Flushing Orthopedic Center", serviceDate: daysAgo(170), submittedDate: daysAgo(165), billedAmount: "26000", paidAmount: "0", deniedAmount: "26000", status: "denied", denialReason: "Same carrier late notice defense — entire claim block denied.", daysToResponse: 14, isLate: false },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded medical bill cycles`);

  await db.insert(pcVerificationRequestsTable).values([
    { orgId: 1, matterId: matters[2].id, noFaultClaimId: noFaultClaims[0].id, requestType: "euo", requestedBy: "Allstate Insurance Company", requestedAt: daysAgo(40), dueDate: daysAhead(0), status: "failed_to_appear", outcome: "Claimant failed to appear for scheduled EUO. Benefits suspended pending rescheduled appearance. Must appear within 30 days or denial becomes final.", suspensionTrigger: true, notes: "ALERT: EUO non-appearance. Suspension letter sent. Reschedule immediately." },
    { orgId: 1, matterId: matters[3].id, noFaultClaimId: noFaultClaims[1].id, requestType: "peer_review", requestedBy: "GEICO", requestedAt: daysAgo(90), dueDate: daysAgo(75), responseAt: daysAgo(72), status: "completed", outcome: "Peer review denied: medically unnecessary given prior conservative care record. IME scheduled.", suspensionTrigger: false },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded verification requests`);

  await db.insert(pcDenialsTable).values([
    { orgId: 1, matterId: matters[2].id, noFaultClaimId: noFaultClaims[0].id, denialType: "no_fault_bill", deniedBy: "Allstate Insurance Company", deniedAt: daysAgo(100), denialReason: "EUO non-appearance: claimant failed to appear for scheduled EUO on 3 occasions. Benefits suspended per 11 NYCRR §65-3.5(e).", denialCode: "NF-EUO-3", amountDenied: "14200", appealStatus: "filed", appealDeadline: daysAhead(60) },
    { orgId: 1, matterId: matters[3].id, noFaultClaimId: noFaultClaims[1].id, denialType: "no_fault_bill", deniedBy: "GEICO", deniedAt: daysAgo(140), denialReason: "Coverage denial — late notice to carrier. Policy condition violated.", denialCode: "COV-LATE", amountDenied: "42000", appealStatus: "pending", appealDeadline: daysAhead(90) },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded denials`);

  await db.insert(pcOfferMovementsTable).values([
    { orgId: 1, matterId: matters[0].id, offerType: "plaintiff_demand", amount: "750000", offeringParty: "Sullivan & Rivera LLP", offeredAt: daysAgo(90), expiresAt: daysAhead(30), movementSignal: "opening", notes: "Initial demand. MTA liability is uncontested. Demand anchored near policy limits based on fracture permanence and 8-month recovery." },
    { orgId: 1, matterId: matters[0].id, offerType: "insurer_offer", amount: "180000", offeringParty: "MTA Self-Insurance Program", offeredAt: daysAgo(60), deltaFromPrevious: "-570000", deltaPct: "-76.0", movementSignal: "retreating", notes: "MTA counter. Far below demand. Significant gap. AI model indicates 78% probability of trial unless offer movement occurs." },
    { orgId: 1, matterId: matters[4].id, offerType: "policy_limit_tender", amount: "3000000", offeringParty: "Travelers Insurance", offeredAt: daysAgo(20), movementSignal: "closing", notes: "Policy limit tender on scaffold case. Recommend acceptance discussion with client given spinal cord injury permanence." },
    { orgId: 1, matterId: matters[4].id, offerType: "plaintiff_demand", amount: "15000000", offeringParty: "Torres Legal Group", offeredAt: daysAgo(45), movementSignal: "opening", notes: "Initial demand reflecting full damages: lifetime care, lost earnings, pain & suffering. Policy limit of $3M is the practical ceiling unless excess carrier involvement." },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded offer movements`);

  // ── Court Filing Documents ────────────────────────────────────────────────
  const courtDocs = await db.insert(pcDocumentsTable).values([
    { orgId: ORG_ID, matterId: matters[0].id, title: "Summons & Verified Complaint — Rivera v. MTA", fileName: "rivera-mta-complaint.pdf", mimeType: "application/pdf", documentType: "pleading", storageContainer: "normalized-docs", isGenerated: false, privilegeFlag: false, reviewState: "reviewed" },
    { orgId: ORG_ID, matterId: matters[0].id, title: "Bill of Particulars — Rivera v. MTA", fileName: "rivera-mta-bill-of-particulars.pdf", mimeType: "application/pdf", documentType: "pleading", storageContainer: "normalized-docs", isGenerated: false, privilegeFlag: false, reviewState: "reviewed" },
    { orgId: ORG_ID, matterId: matters[0].id, title: "MTA Answer & Affirmative Defenses", fileName: "mta-answer.pdf", mimeType: "application/pdf", documentType: "pleading", storageContainer: "normalized-docs", isGenerated: false, privilegeFlag: false, reviewState: "reviewed" },
    { orgId: ORG_ID, matterId: matters[1].id, title: "Summons & Complaint — Chen v. Apex Logistics", fileName: "chen-apex-complaint.pdf", mimeType: "application/pdf", documentType: "pleading", storageContainer: "normalized-docs", isGenerated: false, privilegeFlag: false, reviewState: "reviewed" },
    { orgId: ORG_ID, matterId: matters[1].id, title: "Notice of Motion to Compel Discovery — Chen v. Apex", fileName: "chen-apex-motion-to-compel.pdf", mimeType: "application/pdf", documentType: "motion", storageContainer: "normalized-docs", isGenerated: false, privilegeFlag: false, reviewState: "reviewed" },
    { orgId: ORG_ID, matterId: matters[2].id, title: "Certificate of Merit — Williams v. Northside Medical", fileName: "williams-northside-cert-of-merit.pdf", mimeType: "application/pdf", documentType: "pleading", storageContainer: "normalized-docs", isGenerated: false, privilegeFlag: false, reviewState: "reviewed" },
    { orgId: ORG_ID, matterId: matters[4].id, title: "Labor Law 240 Motion for Summary Judgment — Torres v. BCP", fileName: "torres-bcp-msj.pdf", mimeType: "application/pdf", documentType: "motion", storageContainer: "normalized-docs", isGenerated: false, privilegeFlag: false, reviewState: "reviewed" },
    { orgId: ORG_ID, matterId: matters[4].id, title: "Court Order: Protective Order re: Expert Reports", fileName: "torres-bcp-protective-order.pdf", mimeType: "application/pdf", documentType: "court_order", storageContainer: "normalized-docs", isGenerated: false, privilegeFlag: false, reviewState: "reviewed" },
    { orgId: ORG_ID, matterId: matters[3].id, title: "Notice of Claim — Patel v. QPM (90-day)", fileName: "patel-qpm-notice-of-claim.pdf", mimeType: "application/pdf", documentType: "pleading", storageContainer: "normalized-docs", isGenerated: false, privilegeFlag: false, reviewState: "reviewed" },
    { orgId: ORG_ID, matterId: matters[5].id, title: "Pre-Suit Demand Letter — Johnson v. State Farm", fileName: "johnson-state-farm-demand.pdf", mimeType: "application/pdf", documentType: "demand_letter", storageContainer: "normalized-docs", isGenerated: true, privilegeFlag: false, reviewState: "reviewed" },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-prism-counsel] Seeded ${courtDocs.length} court filing documents`);

  // ── Privilege Logs ────────────────────────────────────────────────────────
  await db.insert(pcPrivilegeFlagsTable).values([
    { matterId: matters[0].id, entityType: "document_chunk", entityId: 1, flagType: "attorney_client", flaggedBy: ATTORNEY_ID, notes: "Privileged communication re: strategy for MTA platform incident claim." },
    { matterId: matters[0].id, entityType: "communication", entityId: 2, flagType: "work_product", flaggedBy: ATTORNEY_ID, notes: "Internal memo re: expert retention strategy — work product protected." },
    { matterId: matters[1].id, entityType: "document_chunk", entityId: 3, flagType: "attorney_client", flaggedBy: ATTORNEY_ID, notes: "Email thread with client re: settlement authority — attorney-client privilege." },
    { matterId: matters[2].id, entityType: "document_chunk", entityId: 4, flagType: "work_product", flaggedBy: ATTORNEY_ID, notes: "Expert witness analysis draft — Dr. Chen surgical standard of care opinion." },
    { matterId: matters[4].id, entityType: "communication", entityId: 5, flagType: "work_product", flaggedBy: ATTORNEY_ID, notes: "Scaffolding reconstruction analysis prepared in anticipation of litigation." },
    { matterId: matters[4].id, entityType: "document_chunk", entityId: 6, flagType: "joint_defense", flaggedBy: ATTORNEY_ID, notes: "Joint defense agreement correspondence with co-defendant's counsel." },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded privilege logs`);

  // ── Inconsistency Flags ────────────────────────────────────────────────────
  await db.insert(pcInconsistencyFlagsTable).values([
    { matterId: matters[0].id, flagType: "treatment_gap", description: "7-week gap in PT attendance between March 15 and May 3, 2024 — no documented reason.", sourceA: "PT attendance records", sourceB: "Medical chronology", severity: "medium", status: "open" },
    { matterId: matters[1].id, flagType: "document_conflict", description: "Adjuster report states client returned to work week 8; pay stubs show absence through week 14.", sourceA: "Nationwide adjuster report", sourceB: "Employment pay stubs", severity: "high", status: "open" },
    { matterId: matters[2].id, flagType: "chronology_gap", description: "Pre-op anesthesia consent form timestamp differs from OR schedule by 40 minutes.", sourceA: "Consent form metadata", sourceB: "Hospital OR log", severity: "critical", status: "open" },
    { matterId: matters[4].id, flagType: "factual_conflict", description: "Foreman witness statement conflicts with OSHA inspection report on scaffold inspection frequency.", sourceA: "Foreman deposition", sourceB: "OSHA inspection report 2024-07-15", severity: "high", status: "open" },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded inconsistency flags`);

  // ── Legal Holds (Purview) ─────────────────────────────────────────────────
  await db.insert(pcPurviewHoldAwarenessTable).values([
    { orgId: ORG_ID, matterId: matters[0].id, holdId: "PURV-HOLD-2024-0081", holdName: "Rivera v. MTA — Litigation Hold", holdScope: "All communications, incident reports, maintenance records, and CCTV footage related to platform incident at Canal St Station, March 2024", holdStatus: "active", custodians: ["Legal Operations", "Station Operations — Canal St", "CCTV Data Management"], contentSources: ["Exchange mailboxes", "SharePoint — Ops Records", "CCTV Archive"], issuedBy: "Sullivan & Rivera LLP", issuedAt: daysAgo(175), provenanceSource: "purview_api" },
    { orgId: ORG_ID, matterId: matters[1].id, holdId: "PURV-HOLD-2024-0114", holdName: "Chen v. Apex Logistics — Litigation Hold", holdScope: "All driver logs, GPS records, dispatch communications, vehicle maintenance records, and insurance correspondence related to March 2024 Route 9 incident", holdStatus: "active", custodians: ["Fleet Operations", "HR Records", "Insurance Dept"], contentSources: ["Exchange mailboxes", "Fleet telematics DB", "FMCSA compliance portal"], issuedBy: "Sullivan & Rivera LLP", issuedAt: daysAgo(315), provenanceSource: "purview_api" },
    { orgId: ORG_ID, matterId: matters[2].id, holdId: "PURV-HOLD-2024-0152", holdName: "Williams v. Northside Medical — Litigation Hold", holdScope: "All surgical records, OR logs, credentialing files, incident reports, and peer review materials related to Dr. Reyes elbow reconstruction procedure", holdStatus: "active", custodians: ["Medical Records", "Risk Management", "OR Scheduling"], contentSources: ["EHR system — Epic", "OR documentation system", "Credentialing portal"], issuedBy: "Sullivan & Rivera LLP", issuedAt: daysAgo(85), provenanceSource: "purview_api" },
    { orgId: ORG_ID, matterId: matters[4].id, holdId: "PURV-HOLD-2024-0077", holdName: "Torres v. BCP — OSHA & Scaffold Litigation Hold", holdScope: "All scaffold inspection logs, subcontractor agreements, OSHA compliance records, safety meeting minutes, and incident reports for Brooklyn Flushing Ave project", holdStatus: "active", custodians: ["Safety Director", "Project Superintendent", "HR/Payroll"], contentSources: ["Procore project system", "Exchange mailboxes — safety team", "OSHA recordkeeping portal"], issuedBy: "Torres Legal Group", issuedAt: daysAgo(520), provenanceSource: "manual_entry" },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded legal holds`);

  // ── Billing / Recovery Items ──────────────────────────────────────────────
  const recoveryItems = await db.insert(pcRecoveryItemsTable).values([
    { orgId: ORG_ID, matterId: matters[0].id, lienCategory: "medicaid", lienHolder: "NYS Medicaid — Office of the Medicaid Inspector General", lifecycleState: "amount_known", assertedAmount: "38000.00", negotiatedAmount: "22000.00", amountStatus: "confirmed", sourceClass: "government_letter", blocksSettlement: true, blocksExport: false, responseDeadline: daysAhead(30), notes: "Medicaid lien confirmed. Negotiated to $22K. Awaiting final payoff letter." },
    { orgId: ORG_ID, matterId: matters[0].id, lienCategory: "hospital_lien", lienHolder: "NewYork-Presbyterian / Weill Cornell Medical Center", lifecycleState: "identified", assertedAmount: "9000.00", amountStatus: "confirmed", sourceClass: "provider_notice", blocksSettlement: false, notes: "Hospital statutory lien filed. Standard negotiation expected." },
    { orgId: ORG_ID, matterId: matters[1].id, lienCategory: "private_health_reimbursement", lienHolder: "BCBS Empire Plan — Employer Reimbursement Unit", lifecycleState: "documentation_requested", assertedAmount: "28500.00", amountStatus: "pending", sourceClass: "carrier_document", blocksSettlement: true, responseDeadline: daysAhead(14), notes: "ERISA plan. Requested SPD and reimbursement calculation. Response pending." },
    { orgId: ORG_ID, matterId: matters[1].id, lienCategory: "erisa", lienHolder: "Social Security Administration — ERISA Recovery", lifecycleState: "awaiting_response", assertedAmount: "3000.00", amountStatus: "pending", sourceClass: "government_letter", blocksSettlement: false, notes: "SSA secondary payer claim. Minimal amount — standard resolution expected." },
    { orgId: ORG_ID, matterId: matters[2].id, lienCategory: "medicare_msp", lienHolder: "Medicare — BCRC / Treasury Offset Program", lifecycleState: "dispute_flagged", assertedAmount: "95000.00", negotiatedAmount: "52000.00", amountStatus: "confirmed", sourceClass: "government_letter", blocksSettlement: true, blocksExport: true, responseDeadline: daysAhead(21), notes: "Conditional payment letter received. Disputed 41 unrelated charges totaling $43K. Negotiated to $52K." },
    { orgId: ORG_ID, matterId: matters[2].id, lienCategory: "hospital_lien", lienHolder: "Northside Medical Center", lifecycleState: "identified", assertedAmount: "33000.00", amountStatus: "confirmed", sourceClass: "provider_notice", blocksSettlement: false, notes: "Defendant hospital self-lien — expect waiver in settlement negotiation." },
    { orgId: ORG_ID, matterId: matters[4].id, lienCategory: "medicare_msp", lienHolder: "Medicare — BCRC / Section 111 Reporting", lifecycleState: "awaiting_response", assertedAmount: "142000.00", amountStatus: "pending", sourceClass: "government_letter", blocksSettlement: true, blocksExport: true, responseDeadline: daysAhead(45), notes: "Medicare conditional payment inquiry sent. Catastrophic injury — large future medicals trigger MSP compliance." },
    { orgId: ORG_ID, matterId: matters[4].id, lienCategory: "workers_comp", lienHolder: "NYS Workers Compensation Board — Carrier Reimbursement", lifecycleState: "identified", assertedAmount: "78000.00", amountStatus: "pending", sourceClass: "carrier_document", blocksSettlement: true, notes: "WC carrier reimbursement claim filed. Torres received WC benefits. Negotiation expected post-settlement." },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-prism-counsel] Seeded ${recoveryItems.length} billing/recovery items`);

  await db.insert(pcRecoveryPartiesTable).values([
    { recoveryItemId: recoveryItems[0].id, orgId: ORG_ID, role: "government_agency", name: "OMIG Recovery Unit", organization: "NYS Medicaid OMIG", phone: "518-555-0100", notes: "Primary contact for Medicaid lien negotiation." },
    { recoveryItemId: recoveryItems[2].id, orgId: ORG_ID, role: "insurer", name: "BCBS Empire Plan Recovery", organization: "BlueCross BlueShield of NYS", email: "erisa.recovery@bcbs.com", phone: "800-555-0200", notes: "ERISA plan subrogation unit." },
    { recoveryItemId: recoveryItems[4].id, orgId: ORG_ID, role: "government_agency", name: "BCRC Recovery Center", organization: "Medicare Benefits Coordination & Recovery Center", phone: "855-555-0300", notes: "Primary Medicare MSP contact." },
    { recoveryItemId: recoveryItems[6].id, orgId: ORG_ID, role: "government_agency", name: "BCRC — Torres File", organization: "Medicare BCRC", phone: "855-555-0300", notes: "Separate inquiry file for Torres catastrophic injury claim." },
  ]).onConflictDoNothing();

  await db.insert(pcRecoveryDocumentsTable).values([
    { recoveryItemId: recoveryItems[0].id, orgId: ORG_ID, documentType: "conditional_payment_letter", title: "Medicaid Conditional Payment — Rivera Matter", documentRef: "OMIG-2024-RIVERA-0081", reviewState: "reviewed" },
    { recoveryItemId: recoveryItems[0].id, orgId: ORG_ID, documentType: "dispute_letter", title: "Lien Dispute — Unrelated Charges Removed", documentRef: "SRP-DISPUTE-0081-A", reviewState: "reviewed" },
    { recoveryItemId: recoveryItems[2].id, orgId: ORG_ID, documentType: "lien_notice", title: "BCBS ERISA Subrogation Notice — Chen Matter", documentRef: "BCBS-ERISA-2024-0114", reviewState: "reviewed" },
    { recoveryItemId: recoveryItems[4].id, orgId: ORG_ID, documentType: "conditional_payment_letter", title: "Medicare Conditional Payment Letter — Williams", documentRef: "BCRC-2024-WILLIAMS-0152", reviewState: "reviewed" },
    { recoveryItemId: recoveryItems[6].id, orgId: ORG_ID, documentType: "conditional_payment_letter", title: "Medicare MSP Inquiry — Torres Catastrophic Claim", documentRef: "BCRC-2024-TORRES-0077", reviewState: "unreviewed" },
  ]).onConflictDoNothing();

  console.log(`[seed-prism-counsel] Seeded recovery parties and documents`);

  console.log("[seed-prism-counsel] PRISM Counsel seed complete.");
  return { seeded: true, matters: matters.length };
}
