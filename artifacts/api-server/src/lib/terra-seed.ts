import { db } from "@workspace/db";
import {
  terraBrokeragesTable,
  terraAgentsTable,
  terraPropertiesTable,
  terraListingsTable,
  terraInquiriesTable,
  terraTransactionsTable,
  featureFlagsTable,
} from "@workspace/db";
import { sql, eq } from "drizzle-orm";

export async function seedTerraDemo() {
  console.log("[terra-seed] Starting Terra demo data seed...");

  await db.execute(sql`
    INSERT INTO feature_flags (key, name, description, is_enabled, rollout_percentage, scope, product)
    VALUES
      ('terra_map_mode_enabled', 'Terra Map Mode', 'Activates geospatial property map layer with distress and inquiry heat overlays.', true, 100, 'global', 'terra'),
      ('terra_broker_view_enabled', 'Terra Broker View', 'Enables brokerage-level rollup view with multi-agent comparative analytics.', true, 100, 'global', 'terra')
    ON CONFLICT (key) DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      updated_at = NOW()
  `);
  console.log("[terra-seed] Feature flags upserted.");

  const [insertedBrokerage] = await db.insert(terraBrokeragesTable).values({
    name: "Terra Commercial",
    slug: "terra-commercial",
    licenseNumber: "NY-BRK-2024-001",
    city: "New York",
    state: "NY",
    specialty: "Commercial — Office, Retail, Industrial, Mixed-Use",
    headCount: 4,
    activeListings: 6,
    closedVolumeLtm: "91100000",
    status: "active",
    isDemo: true,
  }).onConflictDoNothing().returning();

  let brokerageId: number;
  if (insertedBrokerage) {
    brokerageId = insertedBrokerage.id;
  } else {
    const [existing] = await db.select({ id: terraBrokeragesTable.id }).from(terraBrokeragesTable).where(eq(terraBrokeragesTable.slug, "terra-commercial")).limit(1);
    if (!existing) {
      console.log("[terra-seed] Brokerage conflict but not found — skipping remaining seed.");
      return;
    }
    brokerageId = existing.id;
  }

  const agentValues = [
    { brokerageId, firstName: "Karla", lastName: "Rivera", email: "k.rivera@terra-commercial.com", phone: "+1-212-555-0101", licenseNumber: "NY-AG-2020-4441", specialty: "office" as const, status: "active" as const, activeListings: 8, closedDealsLtm: 14, closeRatePct: "68.00", avgDaysToContract: 44, inquiryConversionPct: "31.00", isDemo: true },
    { brokerageId, firstName: "Michael", lastName: "Chen", email: "m.chen@terra-commercial.com", phone: "+1-212-555-0102", licenseNumber: "NY-AG-2019-3812", specialty: "mixed-use" as const, status: "active" as const, activeListings: 6, closedDealsLtm: 9, closeRatePct: "52.00", avgDaysToContract: 62, inquiryConversionPct: "22.00", isDemo: true },
    { brokerageId, firstName: "Alejandro", lastName: "Torres", email: "a.torres@terra-commercial.com", phone: "+1-212-555-0103", licenseNumber: "NY-AG-2018-2291", specialty: "office" as const, status: "active" as const, activeListings: 11, closedDealsLtm: 18, closeRatePct: "74.00", avgDaysToContract: 38, inquiryConversionPct: "38.00", isDemo: true },
    { brokerageId, firstName: "Joyce", lastName: "Williams", email: "j.williams@terra-commercial.com", phone: "+1-212-555-0104", licenseNumber: "NY-AG-2021-5502", specialty: "retail" as const, status: "active" as const, activeListings: 4, closedDealsLtm: 6, closeRatePct: "45.00", avgDaysToContract: 78, inquiryConversionPct: "18.00", isDemo: true },
  ];

  const agents = await db.insert(terraAgentsTable).values(agentValues).onConflictDoNothing().returning();
  const agentMap: Record<string, number> = {};
  agents.forEach(a => { agentMap[a.email] = a.id; });
  console.log("[terra-seed] Agents seeded:", agents.length);

  const propertyValues = [
    { address: "800 Fifth Avenue", city: "New York", state: "NY", zipCode: "10065", submarket: "Midtown East", propertyType: "office" as const, sqft: 142000, yearBuilt: 1978, floors: 28, latitude: "40.7636000", longitude: "-73.9717000", ownerName: "Fifth Avenue Holdings LLC", ownerType: "llc" as const, zoning: "C5-3", isDemo: true },
    { address: "1420 Harbor Blvd", city: "Brooklyn", state: "NY", zipCode: "11231", submarket: "Red Hook", propertyType: "mixed-use" as const, sqft: 58000, yearBuilt: 2006, floors: 7, latitude: "40.6765000", longitude: "-74.0062000", ownerName: "Harbor Realty Partners LP", ownerType: "llc" as const, zoning: "M1-6", isDemo: true },
    { address: "340 Park Avenue South", city: "New York", state: "NY", zipCode: "10010", submarket: "Flatiron / NoMad", propertyType: "office" as const, sqft: 88000, yearBuilt: 1965, floors: 22, latitude: "40.7437000", longitude: "-73.9868000", ownerName: "Park South Properties Trust", ownerType: "trust" as const, zoning: "C5-2", isDemo: true },
    { address: "620 Atlantic Ave", city: "Brooklyn", state: "NY", zipCode: "11217", submarket: "Boerum Hill", propertyType: "retail" as const, sqft: 14200, yearBuilt: 1922, floors: 2, latitude: "40.6847000", longitude: "-73.9769000", ownerName: "Atlantic Grove LLC", ownerType: "llc" as const, zoning: "C4-4", isDemo: true },
    { address: "1800 Westchester Ave", city: "Bronx", state: "NY", zipCode: "10472", submarket: "Hunts Point", propertyType: "industrial" as const, sqft: 76000, yearBuilt: 1994, floors: 1, latitude: "40.8194000", longitude: "-73.8632000", ownerName: "South Bronx Industrial LP", ownerType: "llc" as const, zoning: "M3-1", isDemo: true },
    { address: "55 Water Street", city: "New York", state: "NY", zipCode: "10041", submarket: "Financial District", propertyType: "office" as const, sqft: 298000, yearBuilt: 1972, floors: 54, latitude: "40.7024000", longitude: "-74.0098000", ownerName: "Water Street Ventures LLC", ownerType: "corporate" as const, zoning: "C6-9", isDemo: true },
  ];

  const properties = await db.insert(terraPropertiesTable).values(propertyValues).onConflictDoNothing().returning();
  console.log("[terra-seed] Properties seeded:", properties.length);

  if (properties.length > 0 && agents.length > 0) {
    const getRivera = () => agentMap["k.rivera@terra-commercial.com"] ?? agents[0]!.id;
    const getChen = () => agentMap["m.chen@terra-commercial.com"] ?? agents[1]!.id;
    const getTorres = () => agentMap["a.torres@terra-commercial.com"] ?? agents[2]!.id;
    const getWilliams = () => agentMap["j.williams@terra-commercial.com"] ?? agents[3]!.id;

    const listingValues = [
      { propertyId: properties[0]!.id, agentId: getRivera(), brokerageId, status: "active" as const, listPrice: "89500000", pricePerSqft: "630", originalListPrice: "89500000", capRate: "5.10", noi: "4565000", daysOnMarket: 38, inquiryCount: 14, viewCount: 82, priceReductions: 0, listDate: "2026-02-20", opportunityScore: 87, isDemo: true },
      { propertyId: properties[1]!.id, agentId: getChen(), brokerageId, status: "active" as const, listPrice: "24800000", pricePerSqft: "428", originalListPrice: "26500000", capRate: "4.80", noi: "1190400", daysOnMarket: 72, inquiryCount: 7, viewCount: 34, priceReductions: 1, listDate: "2026-01-17", opportunityScore: 62, isDemo: true },
      { propertyId: properties[2]!.id, agentId: getTorres(), brokerageId, status: "active" as const, listPrice: "47200000", pricePerSqft: "536", originalListPrice: "47200000", capRate: "5.80", noi: "2737600", daysOnMarket: 21, inquiryCount: 22, viewCount: 118, priceReductions: 0, listDate: "2026-03-07", opportunityScore: 94, isDemo: true },
      { propertyId: properties[3]!.id, agentId: getWilliams(), brokerageId, status: "active" as const, listPrice: "8900000", pricePerSqft: "627", originalListPrice: "9800000", capRate: "4.20", noi: "373800", daysOnMarket: 115, inquiryCount: 3, viewCount: 18, priceReductions: 2, listDate: "2025-12-05", opportunityScore: 44, isDemo: true },
      { propertyId: properties[4]!.id, agentId: getRivera(), brokerageId, status: "under_contract" as const, listPrice: "12400000", pricePerSqft: "163", originalListPrice: "12400000", capRate: "6.20", noi: "768800", daysOnMarket: 58, inquiryCount: 11, viewCount: 54, priceReductions: 0, listDate: "2026-01-31", opportunityScore: 79, isDemo: true },
      { propertyId: properties[5]!.id, agentId: getChen(), brokerageId, status: "active" as const, listPrice: "134000000", pricePerSqft: "450", originalListPrice: "158000000", capRate: "3.90", noi: "5226000", daysOnMarket: 189, inquiryCount: 4, viewCount: 22, priceReductions: 3, listDate: "2025-09-22", opportunityScore: 38, isDemo: true },
    ];

    const listings = await db.insert(terraListingsTable).values(listingValues).onConflictDoNothing().returning();
    console.log("[terra-seed] Listings seeded:", listings.length);

    if (listings.length > 0) {
      const inquiryValues = [
        { listingId: listings[2]!.id, assignedAgentId: getTorres(), buyerName: "Apex Partners LP", buyerEmail: "contact@apexpartners.com", buyerType: "investor" as const, financingStatus: "cash" as const, qualificationScore: 92, status: "qualified" as const, source: "referral" as const, message: "Interested in full-floor acquisition. Can close in 45 days.", routingReason: "Cash buyer — high score. Matched to A003 by office specialty.", isDemo: true },
        { listingId: listings[0]!.id, assignedAgentId: getRivera(), buyerName: "Midtown Capital Fund III", buyerEmail: "acquisitions@midtowncapital.com", buyerType: "family_office" as const, financingStatus: "pre_approved" as const, qualificationScore: 84, status: "showing_scheduled" as const, source: "portal" as const, message: "Looking for 60,000+ sf contiguous for HQ relocation.", routingReason: "Pre-approved buyer. Office need matched to A001.", isDemo: true },
        { listingId: listings[5]!.id, assignedAgentId: getChen(), buyerName: "Cerberus RE Opportunities", buyerEmail: "re@cerberus.com", buyerType: "investor" as const, financingStatus: "cash" as const, qualificationScore: 78, status: "contacted" as const, source: "direct" as const, message: "Monitoring distressed office for debt play. Need financials.", routingReason: "Distress signal listing — investor profile. Routed to M002.", isDemo: true },
        { listingId: listings[1]!.id, assignedAgentId: null, buyerName: "Red Hook Development LLC", buyerEmail: "info@redhookdev.com", buyerType: "developer" as const, financingStatus: "seeking_financing" as const, qualificationScore: 56, status: "new" as const, source: "web" as const, message: "Mixed-use development interest. Need zoning details.", routingReason: "Financing not secured — held for manual review.", isDemo: true },
        { listingId: listings[3]!.id, assignedAgentId: getWilliams(), buyerName: "Atlantic Strip Partners", buyerEmail: "ops@atlanticstrip.com", buyerType: "investor" as const, financingStatus: "pre_approved" as const, qualificationScore: 67, status: "qualified" as const, source: "email" as const, message: "Interested in NNN retail. Currently hold 3 Brooklyn retail assets.", routingReason: "Retail investor matched to J004 by retail specialty.", isDemo: true },
      ];
      const inquiries = await db.insert(terraInquiriesTable).values(inquiryValues).onConflictDoNothing().returning();
      console.log("[terra-seed] Inquiries seeded:", inquiries.length);

      const txPropertyIds = [properties[2]!.id, properties[1]!.id, properties[4]!.id];
      const txValues = [
        { propertyId: txPropertyIds[0], agentId: getTorres(), brokerageId, buyerName: "Beacon Capital Partners", sellerName: "William Holdings LLC", salePrice: "62400000", listPrice: "68000000", commission: "1248000", commissionPct: "2.00", daysOnMarket: 94, daysToClose: 58, closedDate: "2026-02-14", financingType: "cmbs" as const, status: "completed" as const, isDemo: true },
        { propertyId: txPropertyIds[1], agentId: getRivera(), brokerageId, buyerName: "North8 Capital", sellerName: "Meserole Family Trust", salePrice: "18900000", listPrice: "19500000", commission: "378000", commissionPct: "2.00", daysOnMarket: 67, daysToClose: 42, closedDate: "2026-01-29", financingType: "conventional" as const, status: "completed" as const, isDemo: true },
        { propertyId: txPropertyIds[2], agentId: getRivera(), brokerageId, buyerName: "Skylar Logistics Inc", sellerName: "South Bronx Industrial LLC", salePrice: "9800000", listPrice: "9800000", commission: "245000", commissionPct: "2.50", daysOnMarket: 41, daysToClose: 35, closedDate: "2026-01-08", financingType: "conventional" as const, status: "completed" as const, isDemo: true },
      ];
      const transactions = await db.insert(terraTransactionsTable).values(txValues).onConflictDoNothing().returning();
      console.log("[terra-seed] Transactions seeded:", transactions.length);
    }
  }

  console.log("[terra-seed] Terra demo data seed complete.");
}
