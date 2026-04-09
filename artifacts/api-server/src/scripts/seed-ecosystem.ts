import { db } from "@szl-holdings/db";
import {
  terraDistressPropertiesTable,
  firestormAssessmentsTable,
  firestormFindingsTable,
  auditLogsTable,
  platformJobRunsTable,
  recommendationsTable,
  type InsertTerraDistressProperty,
} from "@szl-holdings/db";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

async function seedDistressProperties() {
  console.log("Seeding distress properties…");

  const existing = await db.select({ id: terraDistressPropertiesTable.id })
    .from(terraDistressPropertiesTable)
    .where(sql`external_id = 'dp-seed-001'`)
    .limit(1);
  if (existing.length > 0) {
    console.log("  Distress seed properties already seeded, skipping.");
    return;
  }

  const properties: InsertTerraDistressProperty[] = [
    {
      externalId: "dp-seed-001",
      address: "1847 Flatbush Ave",
      borough: "Brooklyn",
      county: "Kings",
      zipCode: "11210",
      propertyType: "multifamily",
      distressType: "pre-foreclosure",
      stage: "lis-pendens",
      estimatedValue: "2850000",
      debtAmount: "1920000",
      filingDate: "2025-11-14",
      lastActivityDate: "2026-02-18",
      ownerName: "GreenHouse Realty LLC",
      ownerType: "llc",
      opportunityScore: 87,
      confidenceLevel: "high",
      scoreRationale: "High-demand area, 45% equity cushion, 136 days in distress with no resolution activity",
      latitude: "40.6321",
      longitude: "-73.9476",
      sqft: 5800,
      yearBuilt: 1962,
      daysInDistress: 136,
      tags: ["high-equity", "multifamily", "brooklyn", "pre-foreclosure"],
      connectorSource: "NYC ACRIS / Kings County Court Records",
      timeline: [
        { date: "2025-09-01", type: "Payment Default", description: "Borrower missed 3 consecutive mortgage payments" },
        { date: "2025-11-14", type: "Lis Pendens Filed", description: "Foreclosure proceeding initiated by lender" },
        { date: "2026-02-18", type: "Status Update", description: "No cure plan submitted — escalating to foreclosure" },
      ],
      ingestSource: "seed",
    },
    {
      externalId: "dp-seed-002",
      address: "234 W 145th St",
      borough: "Manhattan",
      county: "New York",
      zipCode: "10039",
      propertyType: "multifamily",
      distressType: "auction",
      stage: "scheduled",
      estimatedValue: "4200000",
      debtAmount: "3100000",
      auctionDate: "2026-04-10",
      filingDate: "2025-06-20",
      lastActivityDate: "2026-03-20",
      ownerName: "145th Holdings LLC",
      ownerType: "llc",
      opportunityScore: 92,
      confidenceLevel: "high",
      scoreRationale: "Auction in 11 days, below-market debt load, Harlem demand surging — immediate action window",
      latitude: "40.8261",
      longitude: "-73.9363",
      sqft: 9200,
      yearBuilt: 1948,
      daysInDistress: 283,
      tags: ["auction-imminent", "harlem", "high-demand", "multifamily"],
      connectorSource: "NYC Foreclosure Auction Registry",
      timeline: [
        { date: "2025-04-01", type: "Payment Default", description: "First missed payment recorded" },
        { date: "2025-06-20", type: "Lis Pendens Filed", description: "Foreclosure proceeding initiated" },
        { date: "2026-04-10", type: "Auction", description: "NYC auction scheduled" },
      ],
      ingestSource: "seed",
    },
    {
      externalId: "dp-seed-003",
      address: "89-12 Jamaica Ave",
      borough: "Queens",
      county: "Queens",
      zipCode: "11421",
      propertyType: "commercial",
      distressType: "tax-lien",
      stage: "lien-filed",
      estimatedValue: "1650000",
      lienAmount: "142000",
      filingDate: "2025-08-30",
      lastActivityDate: "2026-01-15",
      ownerName: "Silverman Family Trust",
      ownerType: "trust",
      opportunityScore: 68,
      confidenceLevel: "medium",
      scoreRationale: "Tax lien grows daily, owner aging trust with no active management — likely motivated to sell",
      latitude: "40.6928",
      longitude: "-73.8478",
      sqft: 4200,
      yearBuilt: 1975,
      daysInDistress: 212,
      tags: ["tax-lien", "queens", "commercial", "trust-owned"],
      connectorSource: "NYC Dept of Finance — Tax Lien Sales",
      timeline: [
        { date: "2024-12-01", type: "Tax Delinquency", description: "Property tax payments 12 months overdue" },
        { date: "2025-08-30", type: "Tax Lien Filed", description: "NYC Finance filed tax lien — $142,000" },
      ],
      ingestSource: "seed",
    },
    {
      externalId: "dp-seed-004",
      address: "572 Fox St",
      borough: "Bronx",
      county: "Bronx",
      zipCode: "10455",
      propertyType: "multifamily",
      distressType: "foreclosure",
      stage: "notice",
      estimatedValue: "1200000",
      debtAmount: "980000",
      filingDate: "2025-10-01",
      lastActivityDate: "2026-03-10",
      ownerName: "Fox Street Properties Inc",
      ownerType: "corporate",
      opportunityScore: 75,
      confidenceLevel: "high",
      scoreRationale: "Foreclosure notice filed, 18% equity cushion, South Bronx renovation corridor",
      latitude: "40.8104",
      longitude: "-73.9051",
      sqft: 3400,
      yearBuilt: 1938,
      daysInDistress: 180,
      tags: ["foreclosure", "bronx", "multifamily", "renovation-candidate"],
      connectorSource: "Bronx County Supreme Court / NYSCEF",
      ingestSource: "seed",
    },
    {
      externalId: "dp-seed-005",
      address: "1421 Richmond Terrace",
      borough: "Staten Island",
      county: "Richmond",
      zipCode: "10310",
      propertyType: "mixed-use",
      distressType: "pre-foreclosure",
      stage: "lis-pendens",
      estimatedValue: "890000",
      debtAmount: "720000",
      filingDate: "2026-01-08",
      lastActivityDate: "2026-03-01",
      ownerName: "Terrace Holdings Group",
      ownerType: "llc",
      opportunityScore: 61,
      confidenceLevel: "medium",
      scoreRationale: "Early-stage pre-foreclosure, mixed-use building near ferry terminal, conversion potential",
      latitude: "40.6365",
      longitude: "-74.1242",
      sqft: 2800,
      yearBuilt: 1955,
      daysInDistress: 81,
      tags: ["pre-foreclosure", "staten-island", "mixed-use", "ferry-district"],
      connectorSource: "Richmond County Court Records",
      ingestSource: "seed",
    },
    {
      externalId: "dp-seed-006",
      address: "40-22 Main St",
      borough: "Queens",
      county: "Queens",
      zipCode: "11354",
      propertyType: "commercial",
      distressType: "tax-lien",
      stage: "lien-filed",
      estimatedValue: "3100000",
      lienAmount: "287000",
      filingDate: "2025-07-12",
      lastActivityDate: "2026-02-28",
      ownerName: "Flushing Commercial Partners",
      ownerType: "llc",
      opportunityScore: 79,
      confidenceLevel: "high",
      scoreRationale: "Major Flushing corridor, growing Asian-American commercial district, lien exceeds 9% of value",
      latitude: "40.7580",
      longitude: "-73.8318",
      sqft: 7800,
      yearBuilt: 1968,
      daysInDistress: 261,
      tags: ["tax-lien", "flushing", "commercial", "high-value"],
      connectorSource: "NYC Dept of Finance — Tax Lien Sales",
      ingestSource: "seed",
    },
    {
      externalId: "dp-seed-007",
      address: "333 Eastern Pkwy",
      borough: "Brooklyn",
      county: "Kings",
      zipCode: "11225",
      propertyType: "multifamily",
      distressType: "foreclosure",
      stage: "judgment",
      estimatedValue: "5400000",
      debtAmount: "4200000",
      filingDate: "2025-03-15",
      lastActivityDate: "2026-03-15",
      ownerName: "Eastern Pkwy Development LLC",
      ownerType: "llc",
      opportunityScore: 83,
      confidenceLevel: "high",
      scoreRationale: "Foreclosure judgment entered, Prospect Heights premium location, forced sale approaching",
      latitude: "40.6697",
      longitude: "-73.9585",
      sqft: 12600,
      yearBuilt: 1924,
      daysInDistress: 380,
      tags: ["foreclosure-judgment", "prospect-heights", "multifamily", "premium-location"],
      connectorSource: "Kings County Supreme Court",
      ingestSource: "seed",
    },
    {
      externalId: "dp-seed-008",
      address: "108 West 125th St",
      borough: "Manhattan",
      county: "New York",
      zipCode: "10027",
      propertyType: "retail" as any,
      distressType: "auction",
      stage: "scheduled",
      estimatedValue: "6800000",
      debtAmount: "5900000",
      auctionDate: "2026-05-02",
      filingDate: "2025-05-01",
      lastActivityDate: "2026-03-25",
      ownerName: "Harlem Retail Holdings Corp",
      ownerType: "corporate",
      opportunityScore: 91,
      confidenceLevel: "high",
      scoreRationale: "125th St corridor premier retail, auction May 2nd — below market acquisition opportunity, zero cure activity",
      latitude: "40.8086",
      longitude: "-73.9510",
      sqft: 8400,
      yearBuilt: 1985,
      daysInDistress: 328,
      tags: ["auction-imminent", "harlem-125th", "retail", "prime-location"],
      connectorSource: "NYC Foreclosure Auction Registry",
      ingestSource: "seed",
    },
    {
      externalId: "dp-seed-009",
      address: "15 Sutphin Blvd",
      borough: "Queens",
      county: "Queens",
      zipCode: "11435",
      propertyType: "industrial" as any,
      distressType: "pre-foreclosure",
      stage: "lis-pendens",
      estimatedValue: "2200000",
      debtAmount: "1750000",
      filingDate: "2025-12-10",
      lastActivityDate: "2026-02-20",
      ownerName: "Jamaica Industrial Partners LLC",
      ownerType: "llc",
      opportunityScore: 72,
      confidenceLevel: "medium",
      scoreRationale: "JFK-adjacent industrial, pre-foreclosure stage, potential rezoning to logistics/last-mile",
      latitude: "40.7010",
      longitude: "-73.8058",
      sqft: 11200,
      yearBuilt: 1962,
      daysInDistress: 110,
      tags: ["pre-foreclosure", "industrial", "jfk-adjacent", "queens"],
      connectorSource: "Queens County Court Records",
      ingestSource: "seed",
    },
    {
      externalId: "dp-seed-010",
      address: "2280 Grand Concourse",
      borough: "Bronx",
      county: "Bronx",
      zipCode: "10457",
      propertyType: "multifamily",
      distressType: "tax-lien",
      stage: "lien-filed",
      estimatedValue: "3600000",
      lienAmount: "318000",
      filingDate: "2025-09-05",
      lastActivityDate: "2026-01-30",
      ownerName: "Grand Concourse Realty Trust",
      ownerType: "trust",
      opportunityScore: 77,
      confidenceLevel: "high",
      scoreRationale: "Grand Concourse Art Deco landmark, architectural district, lien 8.8% of value — motivated trust owners",
      latitude: "40.8530",
      longitude: "-73.9161",
      sqft: 16400,
      yearBuilt: 1931,
      daysInDistress: 206,
      tags: ["tax-lien", "grand-concourse", "historic", "multifamily"],
      connectorSource: "NYC Dept of Finance — Tax Lien Sales",
      ingestSource: "seed",
    },
    {
      externalId: "dp-seed-011",
      address: "456 Fulton St",
      borough: "Brooklyn",
      county: "Kings",
      zipCode: "11201",
      propertyType: "mixed-use",
      distressType: "foreclosure",
      stage: "notice",
      estimatedValue: "7200000",
      debtAmount: "6100000",
      filingDate: "2025-11-20",
      lastActivityDate: "2026-03-08",
      ownerName: "Fulton Street Capital LLC",
      ownerType: "llc",
      opportunityScore: 80,
      confidenceLevel: "high",
      scoreRationale: "Downtown Brooklyn Fulton corridor, mixed-use asset, 15% equity, foreclosure notice — strong buyer demand",
      latitude: "40.6917",
      longitude: "-73.9881",
      sqft: 14200,
      yearBuilt: 1972,
      daysInDistress: 130,
      tags: ["foreclosure", "downtown-brooklyn", "mixed-use", "fulton-corridor"],
      connectorSource: "Kings County Supreme Court",
      ingestSource: "seed",
    },
    {
      externalId: "dp-seed-012",
      address: "91 Westchester Ave",
      borough: "Bronx",
      county: "Bronx",
      zipCode: "10461",
      propertyType: "commercial",
      distressType: "pre-foreclosure",
      stage: "lis-pendens",
      estimatedValue: "1380000",
      debtAmount: "1050000",
      filingDate: "2026-01-25",
      lastActivityDate: "2026-03-12",
      ownerName: "Westchester Ave Commercial LLC",
      ownerType: "llc",
      opportunityScore: 66,
      confidenceLevel: "medium",
      scoreRationale: "East Bronx commercial strip, early pre-foreclosure, 24% equity cushion — outreach window open",
      latitude: "40.8401",
      longitude: "-73.8527",
      sqft: 3600,
      yearBuilt: 1958,
      daysInDistress: 64,
      tags: ["pre-foreclosure", "east-bronx", "commercial"],
      connectorSource: "Bronx County Court Records",
      ingestSource: "seed",
    },
  ];

  await db.insert(terraDistressPropertiesTable).values(properties);
  console.log(`  Inserted ${properties.length} distress properties.`);
}

async function seedFirestormData() {
  console.log("Seeding Firestorm assessments and findings…");

  const existingAssessments = await db.select({ id: firestormAssessmentsTable.id }).from(firestormAssessmentsTable).limit(1);
  if (existingAssessments.length > 0) {
    console.log("  Firestorm data already seeded, skipping.");
    return;
  }

  const [assessment1] = await db.insert(firestormAssessmentsTable).values({
    name: "Q1 2026 Platform Vulnerability Assessment",
    description: "Quarterly red team exercise covering API surface, auth flows, and data pipeline security",
    assessmentType: "vulnerability_scan",
    status: "in_progress",
    scope: "SZL Platform API, Database Layer, Frontend Applications",
    targetEnvironment: "Production-Mirror",
    assessorName: "Firestorm Security Team",
    startDate: new Date("2026-03-01"),
    overallRiskScore: "67.4",
    executiveSummary: "7 critical findings, 12 high, 23 medium identified across the platform surface. Authentication bypass and injection vectors prioritized.",
  }).returning();

  const [assessment2] = await db.insert(firestormAssessmentsTable).values({
    name: "API Gateway Penetration Test",
    description: "Targeted penetration test of the API gateway and rate limiting infrastructure",
    assessmentType: "penetration_test",
    status: "completed",
    scope: "API Server — /api/* endpoints",
    targetEnvironment: "Staging",
    assessorName: "External Red Team — CyberSec Partners",
    startDate: new Date("2026-02-10"),
    endDate: new Date("2026-02-24"),
    overallRiskScore: "58.2",
    executiveSummary: "Rate limiting bypass identified on 3 endpoints. CORS misconfiguration on legacy routes. All critical findings remediated.",
  }).returning();

  if (assessment1 && assessment2) {
    const findings = [
      {
        assessmentId: assessment1.id,
        title: "SQL Injection Vector in Distress Property Search",
        description: "Unsanitized borough parameter allows SQL injection via crafted search query",
        severity: "critical" as const,
        status: "open" as const,
        category: "injection",
        affectedAsset: "/api/terra/distress/search?borough=",
        impact: "Full database read access, potential data exfiltration",
        recommendation: "Parameterize all query inputs, add WAF rule, validate enum values server-side",
        cvssScore: "9.1",
      },
      {
        assessmentId: assessment1.id,
        title: "JWT Token Not Rotated on Password Change",
        description: "Existing JWT sessions remain valid after password change, allowing session hijack persistence",
        severity: "high" as const,
        status: "open" as const,
        category: "authentication",
        affectedAsset: "/api/auth/* — session management",
        impact: "Persistent unauthorized access after account compromise",
        recommendation: "Implement token blacklist or version-based invalidation on credential changes",
        cvssScore: "7.8",
      },
      {
        assessmentId: assessment1.id,
        title: "Sensitive Data in Error Stack Traces",
        description: "Production error responses expose internal stack traces and file paths in non-prod mode",
        severity: "medium" as const,
        status: "open" as const,
        category: "information-disclosure",
        affectedAsset: "Global error handler — app.ts",
        impact: "Internal architecture exposure, assists further attack planning",
        recommendation: "Enforce NODE_ENV=production check, strip all stack traces from API responses",
        cvssScore: "5.3",
      },
      {
        assessmentId: assessment1.id,
        title: "Missing Rate Limiting on Recommendation Endpoint",
        description: "POST /api/core/recommendations lacks per-IP rate limiting, enabling AI inference abuse",
        severity: "high" as const,
        status: "open" as const,
        category: "abuse-prevention",
        affectedAsset: "/api/core/recommendations",
        impact: "Excessive AI inference costs, potential DoS via sustained requests",
        recommendation: "Apply writeLimiter middleware, add auth requirement, implement cost-per-user tracking",
        cvssScore: "7.2",
      },
      {
        assessmentId: assessment2.id,
        title: "CORS Wildcard on Legacy Data Routes",
        description: "Legacy /api/gov/* routes allow wildcard CORS origin, exposing data to any cross-origin request",
        severity: "high" as const,
        status: "mitigated" as const,
        category: "cors",
        affectedAsset: "/api/gov/data routes",
        impact: "Cross-origin data leakage, CSRF attack surface",
        recommendation: "Explicitly enumerate allowed origins, remove wildcard from non-public routes",
        cvssScore: "6.5",
      },
      {
        assessmentId: assessment2.id,
        title: "Audit Log Missing for Admin Route Access",
        description: "Admin panel access not tracked in audit_logs — no forensic trail for admin operations",
        severity: "medium" as const,
        status: "open" as const,
        category: "audit-trail",
        affectedAsset: "/api/admin/* routes",
        impact: "Cannot detect unauthorized admin access, reduces incident response capability",
        recommendation: "Add audit log middleware to admin router, capture actor, action, and IP",
        cvssScore: "4.8",
      },
    ];

    await db.insert(firestormFindingsTable).values(findings);
    console.log(`  Inserted 1 assessments, ${findings.length} findings.`);
  }
}

async function seedWorkflowRuns() {
  console.log("Seeding platform workflow runs…");

  const existing = await db.select({ id: platformJobRunsTable.id }).from(platformJobRunsTable).limit(1);
  if (existing.length > 0) {
    console.log("  Workflow runs already seeded, skipping.");
    return;
  }

  const runs = [
    {
      runId: `run-${randomUUID()}`,
      workflowType: "terra.distress.ingest",
      status: "completed" as const,
      domain: "beacon",
      triggeredBy: "scheduler",
      payload: { source: "NYC ACRIS", records: 47 },
      result: { ingested: 47, skipped: 3, errors: 0 },
      startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 8000),
    },
    {
      runId: `run-${randomUUID()}`,
      workflowType: "alloy.score.batch",
      status: "completed" as const,
      domain: "alloy",
      triggeredBy: "scheduler",
      payload: { entity_type: "distress_property", count: 12 },
      result: { scored: 12, recommendations_generated: 12 },
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 3000),
    },
    {
      runId: `run-${randomUUID()}`,
      workflowType: "firestorm.scan.daily",
      status: "completed_with_warnings" as const,
      domain: "firestorm",
      triggeredBy: "scheduler",
      payload: { scope: "full_platform" },
      result: { scanned: 847, findings_new: 4, findings_resolved: 2, warnings: ["CVE-2025-1234 unpatched on 2 nodes"] },
      startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 14000),
    },
    {
      runId: `run-${randomUUID()}`,
      workflowType: "vessels.ais.sync",
      status: "completed" as const,
      domain: "vessels",
      triggeredBy: "scheduler",
      payload: { vessels: 2847, port: "NYC/NJ" },
      result: { synced: 2847, anomalies_detected: 3 },
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000 + 5500),
    },
    {
      runId: `run-${randomUUID()}`,
      workflowType: "alloy.signal.normalize",
      status: "running" as const,
      domain: "alloy",
      triggeredBy: "scheduler",
      payload: { signals_pending: 134 },
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      runId: `run-${randomUUID()}`,
      workflowType: "lyte.incident.triage",
      status: "failed" as const,
      domain: "lyte",
      triggeredBy: "api",
      payload: { incident_id: "inc-7821", severity: "high" },
      error: "Playbook execution timeout after 30s — retry scheduled",
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
      completedAt: new Date(Date.now() - 29 * 60 * 1000),
    },
    {
      runId: `run-${randomUUID()}`,
      workflowType: "beacon.kpi.aggregate",
      status: "completed" as const,
      domain: "beacon",
      triggeredBy: "scheduler",
      payload: { metrics: ["arr", "leads", "deals", "distress"] },
      result: { metrics_computed: 4, alerts_triggered: 1 },
      startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 2100),
    },
  ];

  await db.insert(platformJobRunsTable).values(runs);
  console.log(`  Inserted ${runs.length} workflow runs.`);
}

async function seedAuditLogs() {
  console.log("Seeding audit log events…");

  const existing = await db.select({ id: auditLogsTable.id }).from(auditLogsTable).limit(1);
  if (existing.length > 0) {
    console.log("  Audit logs already seeded, skipping.");
    return;
  }

  const events = [
    { actionType: "distress_property.ingested", entityType: "distress_property", entityId: "dp-seed-001", payloadJson: { source: "NYC ACRIS", score: 87 } },
    { actionType: "distress_property.ingested", entityType: "distress_property", entityId: "dp-seed-002", payloadJson: { source: "NYC Auction Registry", score: 92 } },
    { actionType: "alloy.recommendation.generated", entityType: "recommendation", entityId: "rec-batch-001", payloadJson: { entity_type: "distress_property", count: 12 } },
    { actionType: "firestorm.finding.created", entityType: "vulnerability", entityId: "finding-sql-001", payloadJson: { severity: "critical", cvss: "9.1" } },
    { actionType: "alloy.workflow.started", entityType: "workflow", entityId: "wf-normalize-001", payloadJson: { domain: "alloy", type: "signal.normalize" } },
    { actionType: "user.login", entityType: "session", entityId: "admin", payloadJson: { method: "replit-oidc", ip: "10.0.0.1" } },
    { actionType: "holdings.inquiry.submitted", entityType: "inquiry", entityId: "inq-001", payloadJson: { type: "investment", interest: "$5M+" } },
    { actionType: "vessels.anomaly.detected", entityType: "vessel", entityId: "vessel-mmsi-123456789", payloadJson: { type: "dark_period", duration_hours: 18 } },
    { actionType: "lyte.incident.escalated", entityType: "incident", entityId: "inc-7821", payloadJson: { severity: "high", playbook: "P3-network-intrusion" } },
    { actionType: "terra.lead.created", entityType: "lead", entityId: "lead-001", payloadJson: { source: "distress_alert", property: "dp-seed-007" } },
  ];

  await db.insert(auditLogsTable).values(events);
  console.log(`  Inserted ${events.length} audit events.`);
}

async function seedRecommendations() {
  console.log("Seeding Alloy recommendations…");

  const existing = await db.select({ id: recommendationsTable.id }).from(recommendationsTable).limit(1);
  if (existing.length > 0) {
    console.log("  Recommendations already seeded, skipping.");
    return;
  }

  const recs = [
    {
      entityType: "distress_property" as const,
      entityId: "dp-seed-002",
      domain: "beacon",
      score: "92",
      confidence: "0.94",
      severity: "critical" as const,
      title: "Auction Imminent: 234 W 145th St in Manhattan — Act Within 11 Days",
      reasoning: "Opportunity score 92/100 — 283 days in distress, distress type: auction (est. $4,200,000). Auction scheduled April 10. Owner is highly motivated — advanced distress stage.",
      recommendedAction: "Acquire or note-purchase 234 W 145th St in Manhattan. High-priority — act within 72 hours.",
      timeframe: "72 hours",
      context: { opportunity_score: 92, days_in_distress: 283, auction_date: "2026-04-10", address: "234 W 145th St", borough: "Manhattan" },
    },
    {
      entityType: "distress_property" as const,
      entityId: "dp-seed-001",
      domain: "beacon",
      score: "87",
      confidence: "0.88",
      severity: "high" as const,
      title: "High-Opportunity Distress: 1847 Flatbush Ave in Brooklyn",
      reasoning: "Opportunity score 87/100 — 136 days in distress, distress type: pre-foreclosure (est. $2,850,000). Opportunity score, days in distress, debt to value all factored. Early/mid-stage — window available for outreach.",
      recommendedAction: "Acquire or note-purchase 1847 Flatbush Ave in Brooklyn. High-priority — act within 72 hours.",
      timeframe: "72 hours",
      context: { opportunity_score: 87, days_in_distress: 136, distress_type: "pre-foreclosure" },
    },
    {
      entityType: "vulnerability" as const,
      entityId: "finding-sql-001",
      domain: "firestorm",
      score: "91",
      confidence: "0.95",
      severity: "critical" as const,
      title: "Critical Vulnerability: SQL Injection Vector in Distress Property Search",
      reasoning: "CVSS score 9.1/10 on /api/terra/distress/search?borough=. Exploitability and asset criticality indicate critical business risk. Immediate remediation prevents potential breach escalation.",
      recommendedAction: "Remediate within 24 hours — patch /api/terra/distress/search?borough=, verify remediation, update security posture in Firestorm.",
      timeframe: "24 hours",
      context: { cvss_score: 9.1, affected_asset: "/api/terra/distress/search", title: "SQL Injection Vector in Distress Property Search" },
    },
    {
      entityType: "incident" as const,
      entityId: "inc-7821",
      domain: "aegis-ops",
      score: "95",
      confidence: "0.96",
      severity: "critical" as const,
      title: "Active Critical Incident: Lyte Playbook Execution Timeout",
      reasoning: "Incident severity is critical. Containment status and blast radius indicate immediate escalation required. Cross-domain correlation with known threat patterns.",
      recommendedAction: "Escalate and contain immediately in Aegis Operations — assign incident commander, activate playbook, notify stakeholders within 15 minutes.",
      timeframe: "15 minutes",
      context: { severity: "critical", title: "Lyte Playbook Execution Timeout", incident_id: "inc-7821" },
    },
    {
      entityType: "vessel" as const,
      entityId: "vessel-mmsi-123456789",
      domain: "vessels",
      score: "72",
      confidence: "0.78",
      severity: "high" as const,
      title: "Vessel Recommendation: AIS Dark Period — MMSI 123456789",
      reasoning: "Analyzed anomaly score, sanctions risk, route deviation for entity of type vessel. Score of 72 reflects elevated priority across vessels domain.",
      recommendedAction: "Flag for review this vessel within 48 hours — review in vessels dashboard.",
      timeframe: "48 hours",
      context: { mmsi: "123456789", dark_period_hours: 18, route: "NYC-NJ Port Complex" },
    },
  ];

  await db.insert(recommendationsTable).values(recs);
  console.log(`  Inserted ${recs.length} recommendations.`);
}

async function main() {
  console.log("=== SZL Ecosystem Seed ===");
  try {
    await seedDistressProperties();
    await seedFirestormData();
    await seedWorkflowRuns();
    await seedAuditLogs();
    await seedRecommendations();
    console.log("=== Seed complete ===");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

main();
