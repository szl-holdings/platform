/**
 * seed-constellation-extended.ts
 *
 * Inserts cross-domain Constellation graph data directly into the DB.
 *
 * Populates:
 *   • cst_node_types — domain entity type registry
 *   • cst_nodes      — 25+ cross-domain entities
 *   • cst_edges      — 20+ cross-domain links
 *
 * Entity provenance IDs cross-reference real records from:
 *   - seed-aegis: firestorm assets (payment-api-v3, azure-ad-tenant) + cases (CASE-2026-001)
 *   - seed-terra-full: distress properties (dp-seed-001 through dp-seed-012)
 *   - seed-marine-extended: vessels (IMO 9876543 — MV Pacific Star)
 *   - seed-holdings-fundops: ventures (vessels-maritime, prism-counsel, etc.)
 *
 * Idempotent: skips if cst_nodes table already has data.
 */

import { db } from "@szl-holdings/db";
import { cstNodes, cstNodeTypes, cstEdges } from "@szl-holdings/db";
import { createHash, randomUUID } from "crypto";

function daysAgo(n: number) { return new Date(Date.now() - n * 86400000); }

/** Generates a deterministic, stable UUID v4-format string from any seed key. */
function stableUuid(key: string): string {
  const h = createHash("sha256").update(`cst-seed-ext:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${((parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export async function seedConstellationExtended() {
  console.log("[seed-constellation-extended] Starting Constellation graph seed...");

  // Per-row idempotency: stable UUIDs + onConflictDoNothing() — safe to rerun without early-exit.

  // ── Node Types ──────────────────────────────────────────────────────────────

  const nodeTypeDefs = [
    { domain: "terra", typeKey: "property", displayName: "Distress Property", description: "Real estate asset in distress pipeline" },
    { domain: "terra", typeKey: "lead", displayName: "Acquisition Lead", description: "Active lead on a distress opportunity" },
    { domain: "vessels", typeKey: "vessel", displayName: "Vessel", description: "Maritime vessel under AIS monitoring" },
    { domain: "vessels", typeKey: "fleet", displayName: "Fleet Grouping", description: "Logical grouping of vessels" },
    { domain: "aegis", typeKey: "finding", displayName: "Security Finding", description: "Vulnerability or security issue" },
    { domain: "aegis", typeKey: "incident", displayName: "Security Incident", description: "Active or historical security incident" },
    { domain: "aegis", typeKey: "asset", displayName: "IT/OT Asset", description: "Technology or operational asset" },
    { domain: "lyte", typeKey: "signal", displayName: "Business Signal", description: "Revenue or operational anomaly signal" },
    { domain: "lyte", typeKey: "entity", displayName: "Portfolio Entity", description: "Monitored portfolio company" },
    { domain: "platform", typeKey: "organization", displayName: "Organization", description: "SZL Holdings entity" },
    { domain: "platform", typeKey: "agent", displayName: "AI Agent", description: "Active AI agent in the system" },
    { domain: "carlota-jo", typeKey: "client", displayName: "Client Engagement", description: "Carlota Jo advisory client" },
    { domain: "carlota-jo", typeKey: "engagement", displayName: "Service Engagement", description: "Active service engagement" },
  ];

  await db.insert(cstNodeTypes).values(nodeTypeDefs.map(t => ({
    ...t,
    defaultSensitivity: "internal" as const,
    extensionSchema: {},
    createdAt: daysAgo(30),
  }))).onConflictDoNothing();
  console.log(`[seed-constellation-extended] Inserted ${nodeTypeDefs.length} node types`);

  // ── Stable node IDs: deterministic UUIDs from stable keys (UUID type in schema) ─

  const IDS = {
    property_145th:         stableUuid("terra-145th-st"),
    property_flatbush:      stableUuid("terra-flatbush"),
    property_flushing:      stableUuid("terra-flushing"),
    property_concourse:     stableUuid("terra-concourse"),
    property_fulton:        stableUuid("terra-fulton-st"),
    vessel_pacific_meridian:stableUuid("vessel-pacific-star-ais"),
    vessel_atlantic_voyager:stableUuid("vessel-pacific-star-route"),
    fleet_szl_managed:      stableUuid("fleet-szl-managed"),
    finding_payment_idor:   stableUuid("aegis-finding-payment-idor"),
    finding_azure_ad:       stableUuid("aegis-finding-azure-ad"),
    incident_ransomware:    stableUuid("aegis-incident-ransomware"),
    asset_payment_api:      stableUuid("aegis-asset-payment-api"),
    signal_vessels_arr:     stableUuid("lyte-signal-vessels-arr"),
    signal_prism_latency:   stableUuid("lyte-signal-prism-latency"),
    entity_vessels:         stableUuid("alloy-entity-vessels"),
    entity_prism:           stableUuid("alloy-entity-prism"),
    org_szl:                stableUuid("org-szl-holdings"),
    agent_terra:            stableUuid("agent-terra"),
    agent_aegis:            stableUuid("agent-aegis"),
    agent_vessels:          stableUuid("agent-vessels"),
    client_chro:            stableUuid("carlota-client-chro"),
    engagement_board:       stableUuid("carlota-engagement-board"),
  };

  // ── Nodes ───────────────────────────────────────────────────────────────────

  const nodes: (typeof cstNodes.$inferInsert)[] = [
    // Terra
    {
      id: IDS.property_145th, canonicalId: randomUUID(), domain: "terra", entityType: "property",
      labels: ["distress", "auction", "high-opportunity", "harlem", "multifamily"],
      name: "234 W 145th St — Manhattan",
      description: "Multifamily property in Harlem. 283 days distress. Auction April 10, 2026. Opportunity score 92/100.",
      provenanceSourceId: "dp-seed-002", provenanceSourceType: "terra_distress_properties", provenanceSourceLabel: "Terra Distress Pipeline",
      freshness: daysAgo(1), confidence: 0.92, sensitivityTier: "confidential",
      extensions: { externalId: "dp-seed-002", opportunityScore: 92, distressType: "auction", estimatedValueUsd: 4_200_000, borough: "Manhattan" },
    },
    {
      id: IDS.property_flatbush, canonicalId: randomUUID(), domain: "terra", entityType: "property",
      labels: ["distress", "pre-foreclosure", "brooklyn", "multifamily"],
      name: "1847 Flatbush Ave — Brooklyn",
      description: "Brooklyn multifamily pre-foreclosure. 136 days distress. Opportunity score 87/100.",
      provenanceSourceId: "dp-seed-001", provenanceSourceType: "terra_distress_properties", provenanceSourceLabel: "Terra Distress Pipeline",
      freshness: daysAgo(2), confidence: 0.87, sensitivityTier: "confidential",
      extensions: { externalId: "dp-seed-001", opportunityScore: 87, distressType: "pre-foreclosure", estimatedValueUsd: 2_850_000 },
    },
    {
      id: IDS.property_flushing, canonicalId: randomUUID(), domain: "terra", entityType: "property",
      labels: ["distress", "tax-lien", "queens", "commercial"],
      name: "40-22 Main St — Flushing, Queens",
      description: "Commercial property, Flushing corridor. Tax lien $287K. Opportunity score 79/100.",
      provenanceSourceId: "dp-seed-006", provenanceSourceType: "terra_distress_properties", provenanceSourceLabel: "Terra Distress Pipeline",
      freshness: daysAgo(3), confidence: 0.82, sensitivityTier: "internal",
      extensions: { externalId: "dp-seed-006", opportunityScore: 79, distressType: "tax-lien", lienAmount: 287_000 },
    },
    {
      id: IDS.property_concourse, canonicalId: randomUUID(), domain: "terra", entityType: "property",
      labels: ["distress", "tax-lien", "bronx", "historic", "multifamily"],
      name: "2280 Grand Concourse — Bronx",
      description: "Art Deco landmark multifamily. Tax lien $318K. Opportunity score 77/100.",
      provenanceSourceId: "dp-seed-010", provenanceSourceType: "terra_distress_properties", provenanceSourceLabel: "Terra Distress Pipeline",
      freshness: daysAgo(4), confidence: 0.78, sensitivityTier: "internal",
      extensions: { externalId: "dp-seed-010", opportunityScore: 77, distressType: "tax-lien", lienAmount: 318_000 },
    },
    {
      id: IDS.property_fulton, canonicalId: randomUUID(), domain: "terra", entityType: "property",
      labels: ["distress", "foreclosure", "brooklyn", "mixed-use"],
      name: "456 Fulton St — Downtown Brooklyn",
      description: "Mixed-use Fulton corridor. Foreclosure notice. 130 days distress. Opportunity score 80/100.",
      provenanceSourceId: "dp-seed-011", provenanceSourceType: "terra_distress_properties", provenanceSourceLabel: "Terra Distress Pipeline",
      freshness: daysAgo(2), confidence: 0.83, sensitivityTier: "internal",
      extensions: { externalId: "dp-seed-011", opportunityScore: 80, distressType: "foreclosure" },
    },
    // Vessels — both nodes reference IMO 9876543 (MV Pacific Star), the canonical seeded vessel
    {
      id: IDS.vessel_pacific_meridian, canonicalId: randomUUID(), domain: "vessels", entityType: "vessel",
      labels: ["container", "ais-monitored", "cleared", "atlantic"],
      name: "MV Pacific Star — AIS Screening",
      description: "IMO 9876543. Container vessel. 18-hour AIS dark period resolved. OFAC cleared. Route: NYC → Rotterdam.",
      provenanceSourceId: "9876543", provenanceSourceType: "vessels_ais", provenanceSourceLabel: "AIS Monitoring Feed",
      freshness: daysAgo(5), confidence: 0.93, sensitivityTier: "confidential",
      extensions: { imo: "9876543", flag: "Panama", vesselType: "container", ofacStatus: "cleared", trackingContext: "ais_dark_period" },
    },
    {
      id: IDS.vessel_atlantic_voyager, canonicalId: randomUUID(), domain: "vessels", entityType: "vessel",
      labels: ["container", "ais-monitored", "red-sea-rerouted", "atlantic"],
      name: "MV Pacific Star — Red Sea Route",
      description: "IMO 9876543. Red Sea re-routing active. Cost impact $800K/30 days. Alternate route: Suez bypassed via Cape of Good Hope.",
      provenanceSourceId: "9876543", provenanceSourceType: "vessels_ais", provenanceSourceLabel: "AIS Monitoring Feed",
      freshness: daysAgo(1), confidence: 0.97, sensitivityTier: "internal",
      extensions: { imo: "9876543", flag: "Panama", rerouteActive: true, rerouteCostImpact: 800_000, trackingContext: "route_deviation" },
    },
    {
      id: IDS.fleet_szl_managed, canonicalId: randomUUID(), domain: "vessels", entityType: "fleet",
      labels: ["szl-managed", "monitoring-active"],
      name: "SZL Vessels — Managed Fleet",
      description: "47 vessels under active AIS monitoring and intelligence analysis.",
      provenanceSourceId: "fleet-szl-001", provenanceSourceType: "vessels_fleet_registry", provenanceSourceLabel: "Fleet Registry",
      freshness: daysAgo(0), confidence: 0.99, sensitivityTier: "internal",
      extensions: { vesselCount: 47, activeScreenings: 2, lanesMonitored: ["Atlantic", "Mediterranean", "Pacific"] },
    },
    // Aegis
    // Findings reference the seeded Firestorm ASSET records (stable names, not auto-generated finding IDs)
    {
      id: IDS.finding_payment_idor, canonicalId: randomUUID(), domain: "aegis", entityType: "finding",
      labels: ["critical", "idor", "payment-api", "active"],
      name: "IDOR — payment-api-v3 (CVSS 9.3)",
      description: "Insecure Direct Object Reference in payment API. Active exploitation probes. Emergency patch pre-staged.",
      provenanceSourceId: "payment-api-v3", provenanceSourceType: "firestorm_assets", provenanceSourceLabel: "Aegis Asset Registry",
      freshness: daysAgo(0), confidence: 0.99, sensitivityTier: "restricted",
      extensions: { cvss: 9.3, status: "open", affectedAsset: "payment-api-v3", probeAttempts: 3, patchReady: true },
    },
    {
      id: IDS.finding_azure_ad, canonicalId: randomUUID(), domain: "aegis", entityType: "finding",
      labels: ["critical", "iam", "azure-ad", "mfa-gap"],
      name: "Azure AD MFA Enforcement Gap (CVSS 9.0)",
      description: "4 admin accounts without MFA. Conditional access policy gap. Remediation in progress.",
      provenanceSourceId: "azure-ad-tenant", provenanceSourceType: "firestorm_assets", provenanceSourceLabel: "Aegis Asset Registry",
      freshness: daysAgo(3), confidence: 0.95, sensitivityTier: "restricted",
      extensions: { cvss: 9.0, status: "in_remediation", affectedAccounts: 4 },
    },
    {
      id: IDS.incident_ransomware, canonicalId: randomUUID(), domain: "aegis", entityType: "incident",
      labels: ["high", "ransomware-precursor", "contained"],
      name: "Ransomware Precursor — Playbook Contained",
      description: "MITRE T1059 + T1486 pattern detected at 67% confidence. Playbook triggered. Contained. Case CASE-2026-002.",
      provenanceSourceId: "CASE-2026-002", provenanceSourceType: "firestorm_cases", provenanceSourceLabel: "Aegis Incident Response",
      freshness: daysAgo(2), confidence: 0.81, sensitivityTier: "confidential",
      extensions: { mitreIds: ["T1059", "T1486"], confidence: 0.67, status: "contained", caseNumber: "CASE-2026-002" },
    },
    {
      id: IDS.asset_payment_api, canonicalId: randomUUID(), domain: "aegis", entityType: "asset",
      labels: ["production", "public-facing", "critical-asset", "api"],
      name: "payment-api-v3",
      description: "Production payment API. $2.4M daily volume. 4 critical, 9 high findings open. Risk score 9.5.",
      provenanceSourceId: "asset-payment-api-v3", provenanceSourceType: "firestorm_assets", provenanceSourceLabel: "Asset Registry",
      freshness: daysAgo(0), confidence: 1.0, sensitivityTier: "restricted",
      extensions: { riskScore: 9.5, criticalFindings: 4, highFindings: 9, environment: "production", dailyTransactionVolume: 2_400_000 },
    },
    // Lyte
    {
      id: IDS.signal_vessels_arr, canonicalId: randomUUID(), domain: "lyte", entityType: "signal",
      labels: ["revenue", "positive", "vessels", "arr"],
      name: "Vessels ARR — Above Plan Q2",
      description: "Vessels Maritime ARR tracking $200K above Q2 plan. NRR TTM 119%.",
      provenanceSourceId: "lyte-signal-vessels-arr-q2", provenanceSourceType: "lyte_signals", provenanceSourceLabel: "Lyte Revenue Intelligence",
      freshness: daysAgo(1), confidence: 0.91, sensitivityTier: "confidential",
      extensions: { arrVsPlan: 200_000, nrrTtm: 1.19, quarter: "Q2-2026", status: "positive" },
    },
    {
      id: IDS.signal_prism_latency, canonicalId: randomUUID(), domain: "lyte", entityType: "signal",
      labels: ["operations", "latency", "prism", "resolved"],
      name: "PRISM Document Review Latency Spike",
      description: "P95 latency 340% above baseline on PRISM pipeline. Resolved via DB replica routing.",
      provenanceSourceId: "lyte-signal-prism-latency-001", provenanceSourceType: "lyte_signals", provenanceSourceLabel: "Lyte AIOps",
      freshness: daysAgo(2), confidence: 0.88, sensitivityTier: "internal",
      extensions: { p95LatencyMs: 8400, baselineMs: 2100, status: "resolved" },
    },
    {
      id: IDS.entity_vessels, canonicalId: randomUUID(), domain: "lyte", entityType: "entity",
      labels: ["portfolio", "vessels", "monitored"],
      name: "Vessels Maritime Intelligence — Portfolio Entity",
      description: "SZL Holdings portfolio company. $2.8M ARR. 14 customers. NRR 119% TTM. Series A.",
      provenanceSourceId: "venture-vessels-maritime", provenanceSourceType: "holdings_ventures", provenanceSourceLabel: "Holdings Venture Registry",
      freshness: daysAgo(0), confidence: 0.99, sensitivityTier: "confidential",
      extensions: { arr: 2_800_000, customers: 14, nrr: 1.19, stage: "Series A" },
    },
    {
      id: IDS.entity_prism, canonicalId: randomUUID(), domain: "lyte", entityType: "entity",
      labels: ["portfolio", "prism", "monitored"],
      name: "PRISM Counsel — Portfolio Entity",
      description: "SZL Holdings portfolio company. $840K ARR. 6 customers. NRR 142% TTM. Seed.",
      provenanceSourceId: "venture-prism-counsel", provenanceSourceType: "holdings_ventures", provenanceSourceLabel: "Holdings Venture Registry",
      freshness: daysAgo(0), confidence: 0.99, sensitivityTier: "confidential",
      extensions: { arr: 840_000, customers: 6, nrr: 1.42, stage: "Seed" },
    },
    // Platform
    {
      id: IDS.org_szl, canonicalId: randomUUID(), domain: "platform", entityType: "organization",
      labels: ["szl-holdings", "parent-org", "active"],
      name: "SZL Holdings",
      description: "Parent organization. 4 active portfolio entities. $42.8M aggregate ARR.",
      provenanceSourceId: "org-1", provenanceSourceType: "organizations", provenanceSourceLabel: "Platform Organization Registry",
      freshness: daysAgo(0), confidence: 1.0, sensitivityTier: "internal",
      extensions: { orgId: 1, portfolioEntities: 4, aggregateArr: 42_800_000 },
    },
    {
      id: IDS.agent_terra, canonicalId: randomUUID(), domain: "platform", entityType: "agent",
      labels: ["terra", "intelligence", "active"],
      name: "Terra Intelligence Agent",
      description: "AI agent for distress property scoring, opportunity analysis, and market intelligence.",
      provenanceSourceId: "agent-terra-intel-v2", provenanceSourceType: "agent_registry", provenanceSourceLabel: "Agent OS",
      freshness: daysAgo(0), confidence: 0.99, sensitivityTier: "internal",
      extensions: { agentId: "terra-intelligence-agent", version: "2.1", runsToday: 12, status: "healthy" },
    },
    {
      id: IDS.agent_aegis, canonicalId: randomUUID(), domain: "platform", entityType: "agent",
      labels: ["aegis", "soar", "active"],
      name: "Aegis SOAR Engine",
      description: "Security orchestration, automation and response engine.",
      provenanceSourceId: "agent-aegis-soar-v3", provenanceSourceType: "agent_registry", provenanceSourceLabel: "Agent OS",
      freshness: daysAgo(0), confidence: 0.99, sensitivityTier: "restricted",
      extensions: { agentId: "aegis-soar-engine", version: "3.0", runsToday: 8, status: "healthy" },
    },
    {
      id: IDS.agent_vessels, canonicalId: randomUUID(), domain: "platform", entityType: "agent",
      labels: ["vessels", "compliance", "sanctions", "active"],
      name: "Vessels Compliance & Sanctions Agent",
      description: "Maritime compliance agent for OFAC sanctions screening and AIS anomaly analysis.",
      provenanceSourceId: "agent-vessels-compliance-v2", provenanceSourceType: "agent_registry", provenanceSourceLabel: "Agent OS",
      freshness: daysAgo(0), confidence: 0.99, sensitivityTier: "confidential",
      extensions: { agentId: "vessels-sanctions-screener", version: "2.0", screeningsToday: 47 },
    },
    // Carlota Jo
    {
      id: IDS.client_chro, canonicalId: randomUUID(), domain: "carlota-jo", entityType: "client",
      labels: ["fortune-500", "chro", "new-inquiry", "high-fit"],
      name: "Fortune 500 CHRO — New Advisory Inquiry",
      description: "Incoming advisory inquiry from Fortune 500 CHRO. High fit — Executive Strategy Intensive. Discovery call scheduled.",
      provenanceSourceId: "inquiry-cj-2026-018", provenanceSourceType: "carlota_inquiries", provenanceSourceLabel: "Carlota Jo CRM",
      freshness: daysAgo(1), confidence: 0.85, sensitivityTier: "confidential",
      extensions: { inquiryType: "executive-strategy", fitScore: 94, status: "discovery" },
    },
    {
      id: IDS.engagement_board, canonicalId: randomUUID(), domain: "carlota-jo", entityType: "engagement",
      labels: ["board-readiness", "active-cohort", "4-executives"],
      name: "Board Readiness Cohort — Q2 2026",
      description: "4 executives cleared for board placement after completing Board Readiness Program.",
      provenanceSourceId: "engagement-board-readiness-q2-2026", provenanceSourceType: "carlota_reservations", provenanceSourceLabel: "Carlota Jo Engagement Registry",
      freshness: daysAgo(2), confidence: 0.92, sensitivityTier: "confidential",
      extensions: { cohortSize: 4, cleared: 4, quarter: "Q2-2026", status: "active" },
    },
  ];

  await db.insert(cstNodes).values(nodes).onConflictDoNothing();
  console.log(`[seed-constellation-extended] Inserted ${nodes.length} nodes`);

  // ── Edges ────────────────────────────────────────────────────────────────────
  // cstEdges schema: fromNodeId, toNodeId, relationshipType, confidence, sourceId, sourceType, sourceLabel, active, extensions

  const edges: (typeof cstEdges.$inferInsert)[] = [
    // Aegis: finding → asset
    { fromNodeId: IDS.finding_payment_idor, toNodeId: IDS.asset_payment_api, relationshipType: "affects", confidence: 0.99, sourceId: "seed-aegis", sourceType: "seed", sourceLabel: "Seed: Aegis domain", active: true, extensions: { cvss: 9.3 } },
    { fromNodeId: IDS.incident_ransomware, toNodeId: IDS.asset_payment_api, relationshipType: "targets", confidence: 0.81, sourceId: "seed-aegis", sourceType: "seed", sourceLabel: "Seed: Aegis domain", active: true, extensions: {} },
    // Vessels: vessel → fleet
    { fromNodeId: IDS.vessel_pacific_meridian, toNodeId: IDS.fleet_szl_managed, relationshipType: "member_of", confidence: 1.0, sourceId: "seed-vessels", sourceType: "seed", sourceLabel: "Seed: Vessels domain", active: true, extensions: {} },
    { fromNodeId: IDS.vessel_atlantic_voyager, toNodeId: IDS.fleet_szl_managed, relationshipType: "member_of", confidence: 1.0, sourceId: "seed-vessels", sourceType: "seed", sourceLabel: "Seed: Vessels domain", active: true, extensions: {} },
    // Fleet → Lyte (cross-domain: fleet performance → revenue signal)
    { fromNodeId: IDS.fleet_szl_managed, toNodeId: IDS.signal_vessels_arr, relationshipType: "generates", confidence: 0.87, sourceId: "seed-cross", sourceType: "seed", sourceLabel: "Seed: Cross-domain", active: true, extensions: { signalType: "revenue" } },
    { fromNodeId: IDS.entity_vessels, toNodeId: IDS.signal_vessels_arr, relationshipType: "tracks", confidence: 0.91, sourceId: "seed-lyte", sourceType: "seed", sourceLabel: "Seed: Lyte domain", active: true, extensions: {} },
    // Lyte signal → PRISM portfolio (operational impact)
    { fromNodeId: IDS.signal_prism_latency, toNodeId: IDS.entity_prism, relationshipType: "impacts", confidence: 0.88, sourceId: "seed-lyte", sourceType: "seed", sourceLabel: "Seed: Lyte domain", active: true, extensions: { slaImpact: "at_risk" } },
    // Platform org → portfolio entities
    { fromNodeId: IDS.org_szl, toNodeId: IDS.entity_vessels, relationshipType: "owns", confidence: 1.0, sourceId: "seed-platform", sourceType: "seed", sourceLabel: "Seed: Platform", active: true, extensions: {} },
    { fromNodeId: IDS.org_szl, toNodeId: IDS.entity_prism, relationshipType: "owns", confidence: 1.0, sourceId: "seed-platform", sourceType: "seed", sourceLabel: "Seed: Platform", active: true, extensions: {} },
    // Org → properties (tracking)
    { fromNodeId: IDS.org_szl, toNodeId: IDS.property_145th, relationshipType: "tracks", confidence: 0.92, sourceId: "seed-terra", sourceType: "seed", sourceLabel: "Seed: Terra domain", active: true, extensions: {} },
    { fromNodeId: IDS.org_szl, toNodeId: IDS.property_flatbush, relationshipType: "tracks", confidence: 0.87, sourceId: "seed-terra", sourceType: "seed", sourceLabel: "Seed: Terra domain", active: true, extensions: {} },
    // Agent → domain entities
    { fromNodeId: IDS.agent_terra, toNodeId: IDS.property_145th, relationshipType: "analyzed", confidence: 0.89, sourceId: "seed-agent", sourceType: "seed", sourceLabel: "Seed: Agent runs", active: true, extensions: { runId: "run-wf-terra-outreach-002-1" } },
    { fromNodeId: IDS.agent_terra, toNodeId: IDS.property_flatbush, relationshipType: "analyzed", confidence: 0.87, sourceId: "seed-agent", sourceType: "seed", sourceLabel: "Seed: Agent runs", active: true, extensions: {} },
    { fromNodeId: IDS.agent_aegis, toNodeId: IDS.incident_ransomware, relationshipType: "responded_to", confidence: 0.81, sourceId: "seed-agent", sourceType: "seed", sourceLabel: "Seed: Agent runs", active: true, extensions: { playbook: "ransomware-containment-v3" } },
    { fromNodeId: IDS.agent_aegis, toNodeId: IDS.finding_payment_idor, relationshipType: "escalated", confidence: 0.99, sourceId: "seed-agent", sourceType: "seed", sourceLabel: "Seed: Agent runs", active: true, extensions: {} },
    { fromNodeId: IDS.agent_vessels, toNodeId: IDS.vessel_pacific_meridian, relationshipType: "screened", confidence: 0.93, sourceId: "seed-agent", sourceType: "seed", sourceLabel: "Seed: Agent runs", active: true, extensions: { ofacResult: "no_match" } },
    // Carlota Jo
    { fromNodeId: IDS.org_szl, toNodeId: IDS.engagement_board, relationshipType: "manages", confidence: 0.95, sourceId: "seed-carlota", sourceType: "seed", sourceLabel: "Seed: Carlota Jo", active: true, extensions: {} },
    { fromNodeId: IDS.client_chro, toNodeId: IDS.engagement_board, relationshipType: "candidate_for", confidence: 0.72, sourceId: "seed-carlota", sourceType: "seed", sourceLabel: "Seed: Carlota Jo", active: true, extensions: {} },
    // Cross-domain: fleet billing → payment API (shared infrastructure risk)
    { fromNodeId: IDS.fleet_szl_managed, toNodeId: IDS.asset_payment_api, relationshipType: "depends_on", confidence: 0.71, sourceId: "seed-cross", sourceType: "seed", sourceLabel: "Seed: Cross-domain", active: true, extensions: { riskType: "shared_infrastructure" } },
  ];

  await db.insert(cstEdges).values(edges).onConflictDoNothing();
  console.log(`[seed-constellation-extended] Inserted ${edges.length} edges`);

  return {
    nodeTypes: nodeTypeDefs.length,
    nodes: nodes.length,
    edges: edges.length,
  };
}
