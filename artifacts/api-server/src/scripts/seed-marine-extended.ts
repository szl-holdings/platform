import {
  db,
  marineInsuranceQuotesTable,
  marineInsurancePoliciesTable,
  marineInsuranceClaimsTable,
  commodityTradingInstrumentsTable,
  commodityTradingOrdersTable,
  commodityTradingPositionsTable,
  fleetExceptionsTable,
  vesselMaintenanceTable,
  vesselSanctionsScreeningTable,
} from "@szl-holdings/db";
import { sql } from "drizzle-orm";

function daysAgo(n: number) { return new Date(Date.now() - n * 86400000); }
function daysAhead(n: number) { return new Date(Date.now() + n * 86400000); }

/**
 * Several marine tables (e.g. marine_insurance_quotes) were historically created
 * as one-column "stub" tables (just `_stub boolean`) by an emergency
 * unblock script that bypassed drizzle-kit's interactive prompts. If we
 * try to insert against a stub the failure is a confusing
 * "column 'id' does not exist" mid-insert. Detect the stub state up
 * front so the operator gets a clear instruction instead of a stack trace.
 *
 * Returns the list of required table/column pairs that are still missing.
 */
async function detectStubTables(): Promise<string[]> {
  const required: Array<{ table: string; column: string }> = [
    { table: "marine_insurance_quotes", column: "id" },
    { table: "marine_insurance_policies", column: "id" },
    { table: "marine_insurance_claims", column: "id" },
    { table: "commodity_trading_instruments", column: "id" },
    { table: "commodity_trading_orders", column: "id" },
    { table: "commodity_trading_positions", column: "id" },
    { table: "fleet_exceptions", column: "id" },
    { table: "vessel_maintenance", column: "id" },
    { table: "vessel_sanctions_screening", column: "id" },
  ];
  const missing: string[] = [];
  for (const { table, column } of required) {
    const result = await db.execute(
      sql`SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ${table} AND column_name = ${column} LIMIT 1`,
    );
    // drizzle's execute returns { rows: [...] } on node-postgres
    const rows = (result as unknown as { rows?: unknown[] }).rows ?? (result as unknown as unknown[]);
    if (!Array.isArray(rows) || rows.length === 0) {
      missing.push(`${table}.${column}`);
    }
  }
  return missing;
}

export async function seedMarineExtended() {
  console.log("[seed-marine-extended] Starting Marine Insurance, Trading & Intelligence seed...");

  const missing = await detectStubTables();
  if (missing.length > 0) {
    console.error(
      `[seed-marine-extended] SKIPPING — schema not migrated. Missing columns: ${missing.join(", ")}.\n` +
        `[seed-marine-extended] Fix: run \`pnpm migrate\` from the repo root, then re-run this seed. ` +
        `(Tables exist as stubs from an earlier emergency unblock; the proper schema is in lib/db/src/schema/marine_insurance.ts and related files.)`,
    );
    return { skipped: true, reason: "schema_not_migrated", missing };
  }

  const existing = await db.select({ id: marineInsuranceQuotesTable.id }).from(marineInsuranceQuotesTable).limit(1);
  if (existing.length > 0) {
    console.log("[seed-marine-extended] Data already seeded, skipping.");
    return { skipped: true };
  }

  const quotes = await db.insert(marineInsuranceQuotesTable).values([
    {
      quoteRef: "MIQ-2026-0041",
      vesselImo: "9876543",
      vesselName: "MV Atlantic Voyager",
      vesselType: "container",
      vesselAge: 7,
      vesselGrossTonnage: "85000",
      vesselFlag: "Panama",
      cargoType: "General Merchandise / Consumer Goods",
      cargoValueUsd: "8500000",
      cargoHazardClass: "Non-Hazardous",
      voyageOrigin: "Port Newark, NJ",
      voyageDestination: "Rotterdam, Netherlands",
      routeChokepoints: ["Strait of Gibraltar"],
      coverageType: "marine_cargo",
      coverageLimitUsd: "8500000",
      deductibleUsd: "50000",
      coveragePeriodDays: 21,
      riskRating: "moderate",
      riskScore: "42.5",
      riskFactors: [
        { factor: "vessel_age", description: "7-year-old vessel — moderate age risk", weight: 0.2 },
        { factor: "route_chokepoints", description: "Gibraltar — standard Atlantic route", weight: 0.1 },
        { factor: "cargo_type", description: "Non-hazardous general merchandise", weight: -0.1 },
      ],
      baseRatePercent: "0.00650",
      vesselAgeFactor: "1.08",
      routeFactor: "1.02",
      cargoHazardFactor: "0.95",
      claimsHistoryFactor: "1.00",
      flagStateFactor: "1.05",
      finalRatePercent: "0.00718",
      annualPremiumUsd: "610300",
      premiumUsd: "35800",
      expiresAt: daysAhead(30),
      status: "bound",
    },
    {
      quoteRef: "MIQ-2026-0042",
      vesselImo: "9876544",
      vesselName: "SS Pacific Guardian",
      vesselType: "tanker",
      vesselAge: 5,
      vesselGrossTonnage: "120000",
      vesselFlag: "Liberia",
      cargoType: "Crude Oil",
      cargoValueUsd: "45000000",
      cargoHazardClass: "Class 3 — Flammable Liquids",
      voyageOrigin: "Ras Tanura, Saudi Arabia",
      voyageDestination: "Los Angeles, CA",
      routeChokepoints: ["Strait of Hormuz", "Strait of Malacca"],
      coverageType: "hull_machinery",
      coverageLimitUsd: "120000000",
      deductibleUsd: "250000",
      coveragePeriodDays: 35,
      riskRating: "high",
      riskScore: "68.2",
      riskFactors: [
        { factor: "hormuz_chokepoint", description: "Strait of Hormuz — geopolitical risk", weight: 0.35 },
        { factor: "cargo_hazard", description: "Class 3 flammable cargo", weight: 0.25 },
        { factor: "high_value_hull", description: "VLCC hull — significant exposure", weight: 0.20 },
      ],
      baseRatePercent: "0.01200",
      vesselAgeFactor: "1.04",
      routeFactor: "1.28",
      cargoHazardFactor: "1.45",
      claimsHistoryFactor: "1.00",
      flagStateFactor: "1.02",
      finalRatePercent: "0.01842",
      annualPremiumUsd: "2210400",
      premiumUsd: "211200",
      expiresAt: daysAhead(14),
      status: "quote",
    },
    {
      quoteRef: "MIQ-2026-0043",
      vesselImo: "9876545",
      vesselName: "MV Northern Star",
      vesselType: "bulk",
      vesselAge: 9,
      vesselGrossTonnage: "75000",
      vesselFlag: "Marshall Islands",
      cargoType: "Iron Ore",
      cargoValueUsd: "12000000",
      cargoHazardClass: "Non-Hazardous",
      voyageOrigin: "Port Hedland, Australia",
      voyageDestination: "Qingdao, China",
      routeChokepoints: ["Strait of Malacca"],
      coverageType: "marine_cargo",
      coverageLimitUsd: "12000000",
      deductibleUsd: "75000",
      coveragePeriodDays: 18,
      riskRating: "moderate",
      riskScore: "48.1",
      riskFactors: [
        { factor: "vessel_age", description: "9-year-old bulk carrier — above-average wear risk", weight: 0.25 },
        { factor: "iron_ore_density", description: "Dense bulk cargo — stability considerations", weight: 0.15 },
      ],
      baseRatePercent: "0.00720",
      vesselAgeFactor: "1.14",
      routeFactor: "1.08",
      cargoHazardFactor: "0.98",
      claimsHistoryFactor: "1.00",
      flagStateFactor: "1.00",
      finalRatePercent: "0.00868",
      annualPremiumUsd: "1041600",
      premiumUsd: "51900",
      expiresAt: daysAhead(20),
      status: "active",
    },
    {
      quoteRef: "MIQ-2026-0044",
      vesselImo: "9876546",
      vesselName: "SS Gulf Explorer",
      vesselType: "cargo",
      vesselAge: 6,
      vesselGrossTonnage: "45000",
      vesselFlag: "Singapore",
      cargoType: "Machinery & Heavy Equipment",
      cargoValueUsd: "22000000",
      cargoHazardClass: "Non-Hazardous",
      voyageOrigin: "Singapore",
      voyageDestination: "Dubai, UAE",
      routeChokepoints: ["Strait of Hormuz"],
      coverageType: "marine_cargo",
      coverageLimitUsd: "22000000",
      deductibleUsd: "100000",
      coveragePeriodDays: 12,
      riskRating: "moderate",
      riskScore: "51.8",
      status: "active",
      premiumUsd: "42800",
    },
    {
      quoteRef: "MIQ-2026-0045",
      vesselImo: "9876547",
      vesselName: "MV Coral Breeze",
      vesselType: "container",
      vesselAge: 4,
      vesselGrossTonnage: "92000",
      vesselFlag: "Hong Kong",
      cargoType: "Electronics & Consumer Goods",
      cargoValueUsd: "68000000",
      cargoHazardClass: "Non-Hazardous",
      voyageOrigin: "Shanghai, China",
      voyageDestination: "Los Angeles, CA",
      routeChokepoints: ["Strait of Malacca", "South China Sea"],
      coverageType: "protection_indemnity",
      coverageLimitUsd: "100000000",
      deductibleUsd: "200000",
      coveragePeriodDays: 28,
      riskRating: "moderate",
      riskScore: "45.3",
      status: "active",
      premiumUsd: "78400",
    },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-marine-extended] Seeded ${quotes.length} insurance quotes`);

  const policies = await db.insert(marineInsurancePoliciesTable).values([
    {
      quoteId: quotes[0].id,
      policyNumber: "MIP-2026-ATL-0041",
      vesselImo: "9876543",
      vesselName: "MV Atlantic Voyager",
      coverageType: "marine_cargo",
      coverageLimitUsd: "8500000",
      deductibleUsd: "50000",
      premiumUsd: "35800",
      status: "active",
      effectiveAt: daysAgo(2),
      expiresAt: daysAhead(19),
      carrier: "Lloyd's of London Syndicate 2987",
      syndicateCode: "SYN-2987",
      policyTerms: { jurisdiction: "English Law", arbitration: "London" },
      exclusions: ["War risk (covered separately)", "Nuclear damage", "Wilful misconduct"],
      claimsCount: 0,
      totalClaimsUsd: "0",
    },
    {
      quoteId: quotes[2].id,
      policyNumber: "MIP-2026-NOR-0043",
      vesselImo: "9876545",
      vesselName: "MV Northern Star",
      coverageType: "marine_cargo",
      coverageLimitUsd: "12000000",
      deductibleUsd: "75000",
      premiumUsd: "51900",
      status: "active",
      effectiveAt: daysAgo(5),
      expiresAt: daysAhead(13),
      carrier: "Lloyd's of London Syndicate 1414",
      syndicateCode: "SYN-1414",
      policyTerms: { jurisdiction: "English Law", arbitration: "London" },
      exclusions: ["War risk", "Nuclear", "Inherent vice"],
      claimsCount: 1,
      totalClaimsUsd: "185000",
    },
    {
      quoteId: quotes[3].id,
      policyNumber: "MIP-2026-GUL-0044",
      vesselImo: "9876546",
      vesselName: "SS Gulf Explorer",
      coverageType: "marine_cargo",
      coverageLimitUsd: "22000000",
      deductibleUsd: "100000",
      premiumUsd: "42800",
      status: "active",
      effectiveAt: daysAgo(8),
      expiresAt: daysAhead(4),
      carrier: "Lloyd's of London Syndicate 3000",
      syndicateCode: "SYN-3000",
      claimsCount: 0,
      totalClaimsUsd: "0",
    },
    {
      quoteId: quotes[4].id,
      policyNumber: "MIP-2026-COR-0045",
      vesselImo: "9876547",
      vesselName: "MV Coral Breeze",
      coverageType: "protection_indemnity",
      coverageLimitUsd: "100000000",
      deductibleUsd: "200000",
      premiumUsd: "78400",
      status: "active",
      effectiveAt: daysAgo(3),
      expiresAt: daysAhead(25),
      carrier: "Gard P&I Club",
      syndicateCode: "GARD-PI",
      claimsCount: 0,
      totalClaimsUsd: "0",
    },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-marine-extended] Seeded ${policies.length} insurance policies`);

  await db.insert(marineInsuranceClaimsTable).values([
    {
      policyId: policies[1].id,
      claimRef: "CLM-2026-NOR-001",
      vesselMmsi: "123456789",
      vesselName: "MV Northern Star",
      incidentType: "cargo_damage",
      incidentDescription: "Water ingress into hold #3 during Pacific storm. Iron ore cargo contaminated — 1,200 MT affected. Loss assessed at $185,000.",
      incidentAt: daysAgo(12),
      incidentLocation: "South Pacific — 28°S, 152°E",
      claimedAmountUsd: "185000",
      approvedAmountUsd: "162500",
      deductibleApplied: "75000",
      status: "negotiation",
      supportingDocuments: [{ type: "surveyor_report", ref: "SURV-NOR-2026-001" }, { type: "cargo_manifest", ref: "CM-NS-2026-0041" }],
      adjustorNotes: "Weather conditions verified via meteorological report. Partial contamination — claim adjusted for recoverable cargo.",
      subrogationPotential: false,
      reserveAmountUsd: "175000",
      filedAt: daysAgo(10),
    },
  ]);

  console.log(`[seed-marine-extended] Seeded insurance claims`);

  const instruments = await db.insert(commodityTradingInstrumentsTable).values([
    { symbol: "BDI-C5TC", name: "Baltic Dry Index — Capesize 5TC Route Average", instrumentType: "dry_bulk", exchange: "Baltic Exchange", currency: "USD", unit: "$/day", lotSize: "1", tickSize: "0.50", currentPrice: "18420", previousClose: "17850", dayHigh: "18650", dayLow: "17820", volume: 42, openInterest: 218, description: "Capesize vessel time charter average — 5 route basket", routeCode: "C5TC", isActive: true },
    { symbol: "BDI-P1A", name: "Baltic Dry Index — Panamax 1A", instrumentType: "dry_bulk", exchange: "Baltic Exchange", currency: "USD", unit: "$/day", lotSize: "1", tickSize: "0.25", currentPrice: "12180", previousClose: "12045", dayHigh: "12310", dayLow: "11980", volume: 67, openInterest: 341, description: "Panamax vessel 1 route — North Pacific grain route", routeCode: "P1A", isActive: true },
    { symbol: "BCI-380-SING", name: "Bunker — IFO 380 Singapore", instrumentType: "bunker_fuel", exchange: "Singapore MPA", currency: "USD", unit: "$/MT", lotSize: "100", tickSize: "0.25", currentPrice: "472.50", previousClose: "468.00", dayHigh: "476.00", dayLow: "465.50", volume: 1240, openInterest: 0, description: "IFO 380 bunker fuel — Singapore stem", isActive: true },
    { symbol: "BCI-VLSFO-ROT", name: "Bunker — VLSFO Rotterdam", instrumentType: "bunker_fuel", exchange: "Rotterdam Port Authority", currency: "USD", unit: "$/MT", lotSize: "100", tickSize: "0.25", currentPrice: "618.00", previousClose: "614.75", dayHigh: "621.50", dayLow: "612.00", volume: 890, openInterest: 0, description: "Very Low Sulphur Fuel Oil — Rotterdam stem", isActive: true },
    { symbol: "FFA-CAPE-Q2", name: "FFA — Capesize Q2 2026", instrumentType: "freight_futures", exchange: "Baltic Exchange / CME", currency: "USD", unit: "$/day", lotSize: "1", tickSize: "1.00", currentPrice: "19200", previousClose: "18950", dayHigh: "19450", dayLow: "18800", volume: 28, openInterest: 156, description: "Capesize forward freight agreement Q2 2026 settlement", isActive: true },
    { symbol: "IRON-62-CFR", name: "Iron Ore 62% CFR China", instrumentType: "iron_ore_swap", exchange: "Singapore Mercantile Exchange", currency: "USD", unit: "$/MT", lotSize: "1000", tickSize: "0.05", currentPrice: "108.45", previousClose: "107.80", dayHigh: "109.20", dayLow: "107.10", volume: 3400, openInterest: 12800, description: "Iron ore 62% Fe fine CFR Qingdao", isActive: true },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-marine-extended] Seeded ${instruments.length} trading instruments`);

  const orders = await db.insert(commodityTradingOrdersTable).values([
    { instrumentId: instruments[0].id, orderRef: "ORD-2026-0081", orderType: "market", side: "buy", status: "filled", quantity: "10", avgFillPrice: "18320", filledQty: "10", remainingQty: "0", notionalValue: "183200", commission: "185.00", submittedAt: daysAgo(3), filledAt: daysAgo(3), notes: "Hedge for Q2 Atlantic capesize exposure" },
    { instrumentId: instruments[1].id, orderRef: "ORD-2026-0082", orderType: "limit", side: "sell", status: "open", quantity: "15", limitPrice: "12500", filledQty: "0", remainingQty: "15", notionalValue: "187500", commission: "0", submittedAt: daysAgo(1), expiresAt: daysAhead(5), notes: "Take profit on Panamax long position" },
    { instrumentId: instruments[2].id, orderRef: "ORD-2026-0083", orderType: "market", side: "buy", status: "filled", quantity: "500", avgFillPrice: "471.00", filledQty: "500", remainingQty: "0", notionalValue: "235500", commission: "420.00", submittedAt: daysAgo(7), filledAt: daysAgo(7), notes: "Singapore bunker purchase for Pacific Guardian voyage" },
    { instrumentId: instruments[4].id, orderRef: "ORD-2026-0084", orderType: "limit", side: "buy", status: "filled", quantity: "5", limitPrice: "18800", avgFillPrice: "18750", filledQty: "5", remainingQty: "0", notionalValue: "93750", commission: "95.00", submittedAt: daysAgo(5), filledAt: daysAgo(5), notes: "Q2 FFA position — anticipating summer demand recovery" },
    { instrumentId: instruments[5].id, orderRef: "ORD-2026-0085", orderType: "market", side: "sell", status: "filled", quantity: "2000", avgFillPrice: "107.20", filledQty: "2000", remainingQty: "0", notionalValue: "214400", commission: "215.00", submittedAt: daysAgo(2), filledAt: daysAgo(2), notes: "Close iron ore swap on China demand concern" },
    { instrumentId: instruments[3].id, orderRef: "ORD-2026-0086", orderType: "market", side: "buy", status: "pending", quantity: "300", filledQty: "0", remainingQty: "300", notionalValue: "185400", commission: "0", submittedAt: new Date(), notes: "Rotterdam bunker stem for Coral Breeze turnaround" },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-marine-extended] Seeded ${orders.length} trading orders`);

  await db.insert(commodityTradingPositionsTable).values([
    { instrumentId: instruments[0].id, side: "buy", quantity: "10", avgEntryPrice: "18320", currentPrice: "18420", unrealizedPnl: "1000", realizedPnl: "0", totalPnl: "1000", notionalValue: "184200", marginUsed: "18432" },
    { instrumentId: instruments[4].id, side: "buy", quantity: "5", avgEntryPrice: "18750", currentPrice: "19200", unrealizedPnl: "2250", realizedPnl: "0", totalPnl: "2250", notionalValue: "96000", marginUsed: "9600" },
    { instrumentId: instruments[2].id, side: "buy", quantity: "500", avgEntryPrice: "471.00", currentPrice: "472.50", unrealizedPnl: "750", realizedPnl: "0", totalPnl: "750", notionalValue: "236250", marginUsed: "23625" },
  ]);

  console.log(`[seed-marine-extended] Seeded trading positions`);

  await db.insert(fleetExceptionsTable).values([
    {
      exceptionRef: "EXC-2026-0041",
      exceptionType: "route_deviation",
      severity: "high",
      title: "MV Atlantic Voyager — Route Deviation Detected",
      description: "MV Atlantic Voyager has deviated 42nm north of planned route. AIS tracking shows altered heading since 14:30 UTC.",
      whyItMatters: "Route deviation may signal weather avoidance, mechanical issue, or unauthorized cargo stop. Increases transit time and fuel cost.",
      recommendedResponse: "Contact vessel master immediately. Request deviation explanation and ETA update.",
      businessConsequence: "Estimated 8-hour delay to Rotterdam arrival — potential demurrage $18,400.",
      owner: "Fleet Operations",
      ownerFunction: "operations",
      estimatedImpactUsd: "18400",
      status: "active",
    },
    {
      exceptionRef: "EXC-2026-0042",
      exceptionType: "weather_disruption",
      severity: "watch",
      title: "SS Pacific Guardian — Storm System Warning",
      description: "NWS track shows Category 2 typhoon developing in South China Sea. SS Pacific Guardian route passes through projected track in 72 hours.",
      whyItMatters: "Typhoon path intercept risk — vessel may require route diversion adding 4–6 days to transit.",
      recommendedResponse: "Pre-position vessel deviation route. Coordinate with charter counterparty on schedule flexibility.",
      businessConsequence: "Potential 5-day delay to LA arrival — $42,000 fuel cost for diversion route.",
      owner: "Navigation Operations",
      ownerFunction: "operations",
      estimatedImpactUsd: "42000",
      status: "acknowledged",
    },
    {
      exceptionRef: "EXC-2026-0043",
      exceptionType: "port_congestion",
      severity: "watch",
      title: "MV Coral Breeze — LA Port Congestion Delay",
      description: "Port of Los Angeles reporting 4.2-day average anchor wait. MV Coral Breeze will arrive in 72 hours — congestion likely.",
      whyItMatters: "Port congestion adds waiting time and potential demurrage exposure.",
      recommendedResponse: "Notify cargo receivers of expected delay. Consider slow steaming to optimize arrival window.",
      businessConsequence: "Estimated 3-4 day delay — demurrage exposure $38,000–$52,000.",
      owner: "Port Operations",
      ownerFunction: "operations",
      estimatedImpactUsd: "45000",
      status: "active",
    },
    {
      exceptionRef: "EXC-2026-0044",
      exceptionType: "maintenance_risk",
      severity: "critical",
      title: "SS Gulf Explorer — Main Engine Anomaly",
      description: "Remote monitoring system detecting elevated exhaust temperatures on cylinder units 3 and 4 of main engine. Early stage of potential failure.",
      whyItMatters: "Unaddressed engine anomaly can escalate to engine failure at sea — requiring towage and cargo transshipment.",
      recommendedResponse: "Divert to Fujairah for inspection within 24 hours. Engage class surveyor.",
      businessConsequence: "Estimated $85,000 repair cost and 7-day schedule disruption.",
      owner: "Technical Operations",
      ownerFunction: "technical",
      estimatedImpactUsd: "85000",
      status: "active",
    },
    {
      exceptionRef: "EXC-2026-0045",
      exceptionType: "fuel_anomaly",
      severity: "watch",
      title: "MV Northern Star — Fuel Consumption 15% Above Plan",
      description: "Daily fuel consumption reports show Northern Star consuming 52MT/day vs. 45MT/day voyage plan — 15.6% over budget.",
      whyItMatters: "Excess fuel consumption at current bunker prices (~$472/MT) adds $3,300/day to voyage cost.",
      recommendedResponse: "Review speed and trim optimization. Investigate potential hull fouling.",
      businessConsequence: "Excess fuel cost ~$26,000 for remaining voyage legs.",
      owner: "Commercial Operations",
      ownerFunction: "commercial",
      estimatedImpactUsd: "26000",
      status: "acknowledged",
    },
  ]);

  console.log(`[seed-marine-extended] Seeded fleet exceptions`);

  await db.insert(vesselMaintenanceTable).values([
    { vesselId: 1, component: "Main Engine — Turbocharger", maintenanceType: "scheduled", description: "Turbocharger inspection and bearing replacement per manufacturer schedule.", status: "due_soon", priority: "high", dueDate: daysAhead(14), estimatedCost: "28000", riskOfServiceIssue: "0.42", impactsVoyageAvailability: true, assetHealth: "0.72", technician: "Chief Engineer Rodriguez" },
    { vesselId: 1, component: "Hull — Anti-Fouling Coating", maintenanceType: "scheduled", description: "Dry dock hull cleaning and anti-fouling paint renewal. Class due.", status: "scheduled", priority: "medium", dueDate: daysAhead(65), estimatedCost: "185000", riskOfServiceIssue: "0.18", impactsVoyageAvailability: true, assetHealth: "0.81", technician: "Drydock Team — Port Newark" },
    { vesselId: 2, component: "Cargo Pump — #2", maintenanceType: "corrective", description: "Cargo pump #2 seal failure detected during last voyage. Repair required before next loading.", status: "in_progress", priority: "critical", dueDate: daysAgo(1), estimatedCost: "42000", riskOfServiceIssue: "0.88", impactsVoyageAvailability: true, assetHealth: "0.55", technician: "Chief Engineer Kim", notes: "Parts on order — ETA 2 days." },
    { vesselId: 3, component: "Hold Hatch Seals — All Holds", maintenanceType: "corrective", description: "Water ingress via hold #3 hatch seals during Pacific storm. All seals require inspection and replacement.", status: "in_progress", priority: "high", dueDate: new Date(), estimatedCost: "18500", riskOfServiceIssue: "0.65", impactsVoyageAvailability: true, assetHealth: "0.68", technician: "Port Maintenance Team — Qingdao" },
    { vesselId: 4, component: "Main Engine — Cylinders 3-4", maintenanceType: "predictive", description: "Elevated exhaust temperatures on cylinders 3-4. Predictive failure signature detected by remote monitoring.", status: "due_soon", priority: "critical", dueDate: daysAhead(1), estimatedCost: "85000", riskOfServiceIssue: "0.91", impactsVoyageAvailability: true, assetHealth: "0.48", technician: "MAN Energy Solutions — Service" },
    { vesselId: 5, component: "Propeller — Pitch Control", maintenanceType: "preventive", description: "Controllable pitch propeller — annual pitch control system lubrication and inspection.", status: "scheduled", priority: "low", dueDate: daysAhead(45), estimatedCost: "8500", riskOfServiceIssue: "0.12", impactsVoyageAvailability: false, assetHealth: "0.92", technician: "Wartsila Service Team" },
  ]);

  console.log(`[seed-marine-extended] Seeded vessel maintenance records`);

  await db.insert(vesselSanctionsScreeningTable).values([
    { vesselId: 1, screeningDate: daysAgo(1), ofacStatus: "clear", euStatus: "clear", unStatus: "clear", ukStatus: "clear", matchedLists: [], matchConfidence: "99.8", flagRegistryValid: true, pscResult: "no_inspection" },
    { vesselId: 2, screeningDate: daysAgo(2), ofacStatus: "clear", euStatus: "clear", unStatus: "clear", ukStatus: "clear", matchedLists: [], matchConfidence: "99.9", flagRegistryValid: true, pscResult: "passed" },
    { vesselId: 3, screeningDate: daysAgo(1), ofacStatus: "clear", euStatus: "clear", unStatus: "clear", ukStatus: "clear", matchedLists: [], matchConfidence: "99.7", flagRegistryValid: true, pscResult: "no_inspection" },
    { vesselId: 4, screeningDate: daysAgo(3), ofacStatus: "clear", euStatus: "clear", unStatus: "clear", ukStatus: "clear", matchedLists: [], matchConfidence: "99.9", flagRegistryValid: true, pscResult: "passed" },
    { vesselId: 5, screeningDate: daysAgo(1), ofacStatus: "clear", euStatus: "clear", unStatus: "clear", ukStatus: "clear", matchedLists: [], matchConfidence: "99.8", flagRegistryValid: true, pscResult: "no_inspection" },
  ]);

  console.log(`[seed-marine-extended] Seeded sanctions screening records`);

  console.log("[seed-marine-extended] Marine Insurance, Trading & Intelligence seed complete.");
  return { seeded: true };
}
