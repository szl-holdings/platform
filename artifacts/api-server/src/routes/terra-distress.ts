import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

type DistressType = "pre-foreclosure" | "foreclosure" | "auction" | "reo" | "tax-lien" | "expired-listing";
type Borough = "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island";
type PropertyType = "multifamily" | "single-family" | "condo" | "commercial" | "mixed-use" | "vacant-land";

interface DistressedPropertyRecord {
  id: string;
  address: string;
  borough: Borough;
  county: string;
  zipCode: string;
  propertyType: PropertyType;
  distressType: DistressType;
  stage: string;
  estimatedValue: number;
  debtAmount?: number;
  lienAmount?: number;
  auctionDate?: string;
  filingDate: string;
  lastActivityDate: string;
  ownerName: string;
  ownerType: string;
  opportunityScore: number;
  confidenceLevel: "low" | "medium" | "high";
  scoreRationale: string;
  latitude: number;
  longitude: number;
  sqft?: number;
  yearBuilt?: number;
  daysInDistress: number;
  tags: string[];
  connectorSource: string;
  timeline: Array<{ date: string; type: string; description: string }>;
}

const DEMO_DISTRESSED: DistressedPropertyRecord[] = [
  { id: "dp-001", address: "1847 Flatbush Ave", borough: "Brooklyn", county: "Kings", zipCode: "11210", propertyType: "multifamily", distressType: "pre-foreclosure", stage: "lis-pendens", estimatedValue: 2850000, debtAmount: 1920000, filingDate: "2025-11-14", lastActivityDate: "2026-02-18", ownerName: "GreenHouse Realty LLC", ownerType: "llc", opportunityScore: 87, confidenceLevel: "high", scoreRationale: "High-demand area, 45% equity cushion, 136 days in distress with no resolution activity", latitude: 40.6321, longitude: -73.9476, sqft: 5800, yearBuilt: 1962, daysInDistress: 136, tags: ["high-equity", "multifamily", "brooklyn", "pre-foreclosure"], connectorSource: "NYC ACRIS / Kings County Court Records", timeline: [{ date: "2025-09-01", type: "Payment Default", description: "Borrower missed 3 consecutive mortgage payments" }, { date: "2025-11-14", type: "Lis Pendens Filed", description: "Foreclosure proceeding initiated by lender" }, { date: "2026-02-18", type: "Status Update", description: "No cure plan submitted — escalating to foreclosure" }] },
  { id: "dp-002", address: "234 W 145th St", borough: "Manhattan", county: "New York", zipCode: "10039", propertyType: "multifamily", distressType: "auction", stage: "scheduled", estimatedValue: 4200000, debtAmount: 3100000, auctionDate: "2026-04-10", filingDate: "2025-06-20", lastActivityDate: "2026-03-20", ownerName: "145th Holdings LLC", ownerType: "llc", opportunityScore: 92, confidenceLevel: "high", scoreRationale: "Auction in 11 days, below-market debt load, Harlem demand surging — immediate action window", latitude: 40.8261, longitude: -73.9363, sqft: 9200, yearBuilt: 1948, daysInDistress: 283, tags: ["auction-imminent", "harlem", "high-demand", "multifamily"], connectorSource: "NYC Foreclosure Auction Registry", timeline: [{ date: "2025-04-01", type: "Payment Default", description: "First missed payment recorded" }, { date: "2025-06-20", type: "Lis Pendens Filed", description: "Foreclosure proceeding initiated" }, { date: "2026-04-10", type: "Auction", description: "NYC auction scheduled" }] },
  { id: "dp-003", address: "89-12 Jamaica Ave", borough: "Queens", county: "Queens", zipCode: "11421", propertyType: "commercial", distressType: "tax-lien", stage: "lien-filed", estimatedValue: 1650000, lienAmount: 142000, filingDate: "2025-08-30", lastActivityDate: "2026-01-15", ownerName: "Silverman Family Trust", ownerType: "trust", opportunityScore: 68, confidenceLevel: "medium", scoreRationale: "Tax lien grows daily, owner aging trust with no active management — likely motivated to sell", latitude: 40.6928, longitude: -73.8478, sqft: 4200, yearBuilt: 1975, daysInDistress: 212, tags: ["tax-lien", "queens", "commercial", "trust-owned"], connectorSource: "NYC Dept of Finance — Tax Lien Sales", timeline: [{ date: "2024-12-01", type: "Tax Delinquency", description: "Property tax payments 12 months overdue" }, { date: "2025-08-30", type: "Tax Lien Filed", description: "NYC Finance filed tax lien — $142,000" }] },
  { id: "dp-004", address: "572 Fox St", borough: "Bronx", county: "Bronx", zipCode: "10455", propertyType: "multifamily", distressType: "foreclosure", stage: "notice", estimatedValue: 1280000, debtAmount: 980000, filingDate: "2025-12-01", lastActivityDate: "2026-02-28", ownerName: "Ramos, Miguel", ownerType: "individual", opportunityScore: 71, confidenceLevel: "medium", scoreRationale: "Active foreclosure in Mott Haven — area undergoing rapid gentrification, strong upside potential", latitude: 40.8118, longitude: -73.9185, sqft: 3600, yearBuilt: 1928, daysInDistress: 119, tags: ["foreclosure", "bronx", "mott-haven", "multifamily"], connectorSource: "Bronx County Court Records", timeline: [{ date: "2025-12-01", type: "Foreclosure Filed", description: "Lis pendens filed in Bronx County" }, { date: "2026-02-28", type: "Court Date Set", description: "Bronx Supreme Court appearance scheduled" }] },
  { id: "dp-005", address: "1203 Richmond Terrace", borough: "Staten Island", county: "Richmond", zipCode: "10310", propertyType: "single-family", distressType: "reo", stage: "bank-owned", estimatedValue: 580000, debtAmount: 495000, filingDate: "2025-04-22", lastActivityDate: "2026-03-01", ownerName: "Chase Bank REO", ownerType: "corporate", opportunityScore: 63, confidenceLevel: "high", scoreRationale: "Bank-owned, below market, motivated seller — potential for quick close with cash offer", latitude: 40.6296, longitude: -74.0918, sqft: 2100, yearBuilt: 1958, daysInDistress: 341, tags: ["reo", "bank-owned", "staten-island", "motivated-seller"], connectorSource: "Bank REO Listings / Chase Distressed Asset Portal", timeline: [{ date: "2025-04-22", type: "REO Transfer", description: "Property transferred to bank REO portfolio" }, { date: "2026-03-01", type: "Listed REO", description: "Listed on bank's REO portal" }] },
  { id: "dp-006", address: "451 Park Pl", borough: "Brooklyn", county: "Kings", zipCode: "11238", propertyType: "multifamily", distressType: "pre-foreclosure", stage: "filing", estimatedValue: 3900000, debtAmount: 2100000, filingDate: "2026-01-30", lastActivityDate: "2026-02-15", ownerName: "Park Place Ventures LLC", ownerType: "llc", opportunityScore: 82, confidenceLevel: "high", scoreRationale: "Crown Heights brownstone, 46% equity, early-stage filing — ideal for direct outreach before listing", latitude: 40.6698, longitude: -73.9563, sqft: 6400, yearBuilt: 1905, daysInDistress: 59, tags: ["pre-foreclosure", "crown-heights", "brooklyn", "brownstone", "high-equity"], connectorSource: "Kings County ACRIS", timeline: [{ date: "2026-01-30", type: "Notice Filed", description: "Pre-foreclosure notice filed with county" }] },
  { id: "dp-007", address: "3342 White Plains Rd", borough: "Bronx", county: "Bronx", zipCode: "10467", propertyType: "commercial", distressType: "expired-listing", stage: "expired", estimatedValue: 2200000, filingDate: "2025-07-14", lastActivityDate: "2026-03-01", ownerName: "Bronx Commercial Realty LLC", ownerType: "llc", opportunityScore: 54, confidenceLevel: "medium", scoreRationale: "Expired 255 days ago after 3 failed sales, price drop signals — motivated seller likely", latitude: 40.8699, longitude: -73.8679, sqft: 8100, yearBuilt: 1968, daysInDistress: 229, tags: ["expired-listing", "bronx", "commercial", "price-drops"], connectorSource: "MLS Delta Signal — REBNY/OneKey", timeline: [{ date: "2025-07-14", type: "Listing Expired", description: "Listing expired after 9 months on market" }] },
  { id: "dp-009", address: "5 Beekman St", borough: "Manhattan", county: "New York", zipCode: "10038", propertyType: "commercial", distressType: "foreclosure", stage: "lis-pendens", estimatedValue: 18500000, debtAmount: 14200000, filingDate: "2025-10-08", lastActivityDate: "2026-03-15", ownerName: "FiDi Capital Partners LLC", ownerType: "llc", opportunityScore: 79, confidenceLevel: "high", scoreRationale: "Downtown office distress — adjacent to City Hall, zoning allows residential conversion", latitude: 40.7108, longitude: -74.0085, sqft: 48000, yearBuilt: 1890, daysInDistress: 173, tags: ["foreclosure", "manhattan", "office", "conversion-opportunity", "high-value"], connectorSource: "NY State Courts (NYSCEF) / ACRIS", timeline: [{ date: "2025-10-08", type: "Lis Pendens", description: "Foreclosure proceeding initiated — NYSCEF filed" }, { date: "2026-01-20", type: "Receiver Appointed", description: "Court-appointed receiver managing property" }] },
  { id: "dp-010", address: "287 Nostrand Ave", borough: "Brooklyn", county: "Kings", zipCode: "11216", propertyType: "mixed-use", distressType: "pre-foreclosure", stage: "lis-pendens", estimatedValue: 2650000, debtAmount: 1750000, filingDate: "2025-12-19", lastActivityDate: "2026-03-10", ownerName: "Nostrand Holdings LLC", ownerType: "llc", opportunityScore: 85, confidenceLevel: "high", scoreRationale: "Bed-Stuy mixed-use, strong retail corridor, 34% equity — high probability of off-market deal", latitude: 40.6807, longitude: -73.9493, sqft: 5200, yearBuilt: 1930, daysInDistress: 102, tags: ["pre-foreclosure", "bed-stuy", "mixed-use", "brooklyn"], connectorSource: "Kings County Court Records / ACRIS", timeline: [{ date: "2025-12-19", type: "Lis Pendens", description: "Pre-foreclosure filing — Kings County" }] },
  { id: "dp-011", address: "2890 Broadway", borough: "Manhattan", county: "New York", zipCode: "10025", propertyType: "multifamily", distressType: "pre-foreclosure", stage: "lis-pendens", estimatedValue: 6800000, debtAmount: 4900000, filingDate: "2026-01-05", lastActivityDate: "2026-03-01", ownerName: "UWS Properties LLC", ownerType: "llc", opportunityScore: 78, confidenceLevel: "high", scoreRationale: "Upper West Side multifamily, Ivy League tenant base, strong rent roll below market", latitude: 40.8004, longitude: -73.9662, sqft: 14200, yearBuilt: 1921, daysInDistress: 84, tags: ["pre-foreclosure", "upper-west-side", "manhattan", "multifamily"], connectorSource: "NYSCEF / NY County ACRIS", timeline: [{ date: "2026-01-05", type: "Lis Pendens Filed", description: "Pre-foreclosure notice filed NYSCEF" }] },
  { id: "dp-012", address: "194-08 Linden Blvd", borough: "Queens", county: "Queens", zipCode: "11412", propertyType: "single-family", distressType: "auction", stage: "scheduled", estimatedValue: 680000, debtAmount: 540000, auctionDate: "2026-04-05", filingDate: "2025-05-12", lastActivityDate: "2026-03-18", ownerName: "Williams, Deborah", ownerType: "individual", opportunityScore: 74, confidenceLevel: "high", scoreRationale: "Auction in 6 days, St. Albans single-family, 21% equity — fast close opportunity", latitude: 40.6928, longitude: -73.7478, sqft: 1800, yearBuilt: 1955, daysInDistress: 322, tags: ["auction-imminent", "queens", "single-family", "fast-close"], connectorSource: "Queens County Foreclosure List", timeline: [{ date: "2025-05-12", type: "Foreclosure Filed", description: "Queens County lis pendens" }, { date: "2026-02-20", type: "Auction Scheduled", description: "Auction date set: April 5, 2026" }] },
  { id: "dp-016", address: "312 West 125th St", borough: "Manhattan", county: "New York", zipCode: "10027", propertyType: "mixed-use", distressType: "pre-foreclosure", stage: "lis-pendens", estimatedValue: 8900000, debtAmount: 6200000, filingDate: "2025-09-15", lastActivityDate: "2026-03-05", ownerName: "Harlem Renaissance Holdings LLC", ownerType: "llc", opportunityScore: 88, confidenceLevel: "high", scoreRationale: "125th Street corridor, Harlem Renaissance district — mixed-use with retail upside, strong foot traffic", latitude: 40.8084, longitude: -73.9499, sqft: 22000, yearBuilt: 1920, daysInDistress: 196, tags: ["pre-foreclosure", "harlem", "mixed-use", "125th-street", "manhattan"], connectorSource: "NYSCEF / ACRIS", timeline: [{ date: "2025-09-15", type: "Lis Pendens", description: "Pre-foreclosure filed in NY County" }] },
  { id: "dp-019", address: "768 Park Ave", borough: "Brooklyn", county: "Kings", zipCode: "11206", propertyType: "multifamily", distressType: "auction", stage: "scheduled", estimatedValue: 2400000, debtAmount: 1900000, auctionDate: "2026-04-18", filingDate: "2025-07-15", lastActivityDate: "2026-03-22", ownerName: "Williamsburg Capital LLC", ownerType: "llc", opportunityScore: 89, confidenceLevel: "high", scoreRationale: "Williamsburg auction in 19 days, prime rental market, discount to assessed value — rare opportunity", latitude: 40.7070, longitude: -73.9448, sqft: 6800, yearBuilt: 1918, daysInDistress: 258, tags: ["auction-imminent", "williamsburg", "brooklyn", "multifamily", "high-demand"], connectorSource: "Kings County Foreclosure Auction Registry", timeline: [{ date: "2025-07-15", type: "Lis Pendens", description: "Foreclosure filed Kings County" }, { date: "2026-02-25", type: "Auction Scheduled", description: "Auction: April 18, 2026" }] },
  { id: "dp-025", address: "1780 Grand Concourse", borough: "Bronx", county: "Bronx", zipCode: "10457", propertyType: "multifamily", distressType: "auction", stage: "scheduled", estimatedValue: 3600000, debtAmount: 2800000, auctionDate: "2026-05-02", filingDate: "2025-06-10", lastActivityDate: "2026-03-10", ownerName: "Grand Concourse LLC", ownerType: "llc", opportunityScore: 81, confidenceLevel: "high", scoreRationale: "Grand Concourse landmark area, 22% equity, auction in 33 days — investor pre-auction outreach window", latitude: 40.8448, longitude: -73.9168, sqft: 12000, yearBuilt: 1940, daysInDistress: 292, tags: ["auction-imminent", "bronx", "grand-concourse", "multifamily"], connectorSource: "Bronx County Foreclosure List", timeline: [{ date: "2025-06-10", type: "Lis Pendens", description: "Foreclosure filed Bronx County" }, { date: "2026-03-01", type: "Auction Scheduled", description: "Auction set: May 2, 2026" }] },
  { id: "dp-026", address: "506 Atlantic Ave", borough: "Brooklyn", county: "Kings", zipCode: "11217", propertyType: "commercial", distressType: "pre-foreclosure", stage: "lis-pendens", estimatedValue: 5800000, debtAmount: 3900000, filingDate: "2025-10-28", lastActivityDate: "2026-02-28", ownerName: "Atlantic Ave Properties LLC", ownerType: "llc", opportunityScore: 86, confidenceLevel: "high", scoreRationale: "Cobble Hill commercial, Atlantic Yards proximity, 33% equity — A+ location with motivated lender", latitude: 40.6864, longitude: -73.9916, sqft: 14500, yearBuilt: 1899, daysInDistress: 153, tags: ["pre-foreclosure", "brooklyn", "cobble-hill", "commercial"], connectorSource: "Kings County Court Records", timeline: [{ date: "2025-10-28", type: "Lis Pendens", description: "Pre-foreclosure filed" }] },
  { id: "dp-034", address: "200 W 135th St", borough: "Manhattan", county: "New York", zipCode: "10030", propertyType: "multifamily", distressType: "foreclosure", stage: "lis-pendens", estimatedValue: 4800000, debtAmount: 3700000, filingDate: "2025-09-28", lastActivityDate: "2026-03-01", ownerName: "Hamilton Heights Partners LLC", ownerType: "llc", opportunityScore: 83, confidenceLevel: "high", scoreRationale: "Hamilton Heights walkable brownstone district, rent-stabilized units below market — strong buy-and-hold thesis", latitude: 40.8191, longitude: -73.9484, sqft: 12800, yearBuilt: 1910, daysInDistress: 183, tags: ["foreclosure", "manhattan", "hamilton-heights", "rent-stabilized"], connectorSource: "NYSCEF / ACRIS", timeline: [{ date: "2025-09-28", type: "Foreclosure Filed", description: "Lis pendens — NY County Supreme Court" }] },
  { id: "dp-039", address: "150 Joralemon St", borough: "Brooklyn", county: "Kings", zipCode: "11201", propertyType: "commercial", distressType: "reo", stage: "bank-owned", estimatedValue: 8500000, debtAmount: 7200000, filingDate: "2024-12-15", lastActivityDate: "2026-02-28", ownerName: "First Republic Bank REO (FDIC)", ownerType: "corporate", opportunityScore: 84, confidenceLevel: "high", scoreRationale: "Brooklyn Heights commercial — FDIC-managed, premium location, office-to-residential conversion candidate", latitude: 40.6944, longitude: -73.9910, sqft: 24000, yearBuilt: 1928, daysInDistress: 471, tags: ["reo", "fdic", "brooklyn-heights", "conversion-candidate"], connectorSource: "FDIC REO Asset Listings", timeline: [{ date: "2024-12-15", type: "REO Transfer", description: "Property moved to FDIC disposition queue" }] },
  { id: "dp-041", address: "1448 Fulton St", borough: "Brooklyn", county: "Kings", zipCode: "11216", propertyType: "mixed-use", distressType: "auction", stage: "scheduled", estimatedValue: 2100000, debtAmount: 1650000, auctionDate: "2026-04-14", filingDate: "2025-08-12", lastActivityDate: "2026-03-22", ownerName: "Bed-Stuy Retail LLC", ownerType: "llc", opportunityScore: 83, confidenceLevel: "high", scoreRationale: "Bedford-Stuyvesant mixed-use — auction in 15 days, Fulton St corridor, strong community demand", latitude: 40.6813, longitude: -73.9509, sqft: 6800, yearBuilt: 1920, daysInDistress: 230, tags: ["auction-imminent", "brooklyn", "bed-stuy", "mixed-use"], connectorSource: "Kings County Foreclosure Auction", timeline: [{ date: "2025-08-12", type: "Lis Pendens", description: "Foreclosure — Kings County" }, { date: "2026-04-14", type: "Auction", description: "Kings County auction scheduled" }] },
  { id: "dp-047", address: "25 Jay St", borough: "Brooklyn", county: "Kings", zipCode: "11201", propertyType: "commercial", distressType: "pre-foreclosure", stage: "lis-pendens", estimatedValue: 12500000, debtAmount: 9800000, filingDate: "2025-08-22", lastActivityDate: "2026-03-20", ownerName: "DUMBO Ventures LLC", ownerType: "llc", opportunityScore: 91, confidenceLevel: "high", scoreRationale: "DUMBO tech-adjacent loft building — pre-foreclosure in highest-demand Brooklyn market, 22% equity, note purchase ideal", latitude: 40.7032, longitude: -73.9873, sqft: 42000, yearBuilt: 1898, daysInDistress: 220, tags: ["pre-foreclosure", "brooklyn", "dumbo", "commercial", "premium"], connectorSource: "Kings County NYSCEF", timeline: [{ date: "2025-08-22", type: "Lis Pendens", description: "Pre-foreclosure filed Kings County" }] },
  { id: "dp-049", address: "700 E New York Ave", borough: "Brooklyn", county: "Kings", zipCode: "11203", propertyType: "multifamily", distressType: "auction", stage: "scheduled", estimatedValue: 1350000, debtAmount: 1050000, auctionDate: "2026-04-28", filingDate: "2025-07-08", lastActivityDate: "2026-03-20", ownerName: "East Flatbush Partners LLC", ownerType: "llc", opportunityScore: 76, confidenceLevel: "high", scoreRationale: "East Flatbush auction — 29 days out, 22% equity buffer, Caribbean community hub, stable rental demand", latitude: 40.6551, longitude: -73.9412, sqft: 4200, yearBuilt: 1945, daysInDistress: 265, tags: ["auction-imminent", "brooklyn", "east-flatbush", "multifamily"], connectorSource: "Kings County Foreclosure Auction Registry", timeline: [{ date: "2025-07-08", type: "Lis Pendens", description: "Foreclosure filed Kings County" }, { date: "2026-04-28", type: "Auction Scheduled", description: "Set for April 28, 2026" }] },
];

const DISTRESS_ALERTS = [
  { id: "da-001", type: "auction", message: "234 W 145th St auction in 11 days — Manhattan multifamily", propertyId: "dp-002", severity: "critical", timestamp: "2026-03-30T08:00:00Z", zipCode: "10039", borough: "Manhattan" },
  { id: "da-002", type: "foreclosure", message: "New pre-foreclosure filed in ZIP 11201 — DUMBO Brooklyn", propertyId: "dp-047", severity: "high", timestamp: "2026-03-29T14:30:00Z", zipCode: "11201", borough: "Brooklyn" },
  { id: "da-003", type: "lien", message: "Tax lien escalated — 2340 Adam Clayton Powell Jr Blvd now $214K", propertyId: "dp-040", severity: "high", timestamp: "2026-03-28T10:00:00Z", zipCode: "10030", borough: "Manhattan" },
  { id: "da-004", type: "auction", message: "Queens multifamily auction approaching — 82-11 37th Ave (April 22)", propertyId: "dp-032", severity: "high", timestamp: "2026-03-27T09:00:00Z", zipCode: "11372", borough: "Queens" },
  { id: "da-005", type: "signal", message: "Price drop detected — 475 Kent Ave Williamsburg reduced $900K below original ask", propertyId: "dp-036", severity: "medium", timestamp: "2026-03-26T16:00:00Z", zipCode: "11249", borough: "Brooklyn" },
  { id: "da-006", type: "foreclosure", message: "New pre-foreclosure in ZIP 11238 — Crown Heights Brooklyn brownstone", propertyId: "dp-006", severity: "high", timestamp: "2026-03-25T11:00:00Z", zipCode: "11238", borough: "Brooklyn" },
  { id: "da-007", type: "reo", message: "FDIC REO update — 150 Joralemon St Brooklyn Heights: active disposition", propertyId: "dp-039", severity: "medium", timestamp: "2026-03-24T09:00:00Z", zipCode: "11201", borough: "Brooklyn" },
];

router.get("/terra/distress/search", authMiddleware({ required: false }), (req, res) => {
  try {
    const { borough, county, zip, propertyType, distressType, minValue, maxValue, sort, q } = req.query;
    let results = [...DEMO_DISTRESSED];

    if (borough) results = results.filter(p => p.borough.toLowerCase() === (borough as string).toLowerCase());
    if (county) results = results.filter(p => p.county.toLowerCase().includes((county as string).toLowerCase()));
    if (zip) results = results.filter(p => p.zipCode === zip);
    if (propertyType) results = results.filter(p => p.propertyType === propertyType);
    if (distressType) results = results.filter(p => p.distressType === distressType);
    if (minValue) results = results.filter(p => p.estimatedValue >= Number(minValue));
    if (maxValue) results = results.filter(p => p.estimatedValue <= Number(maxValue));
    if (q) {
      const query = (q as string).toLowerCase();
      results = results.filter(p =>
        p.address.toLowerCase().includes(query) ||
        p.ownerName.toLowerCase().includes(query) ||
        p.tags.some(t => t.includes(query))
      );
    }

    if (sort === "newest") results.sort((a, b) => b.filingDate.localeCompare(a.filingDate));
    else if (sort === "highest-value") results.sort((a, b) => b.estimatedValue - a.estimatedValue);
    else if (sort === "highest-risk") results.sort((a, b) => b.opportunityScore - a.opportunityScore);
    else if (sort === "closest-auction") {
      results.sort((a, b) => {
        if (!a.auctionDate && !b.auctionDate) return 0;
        if (!a.auctionDate) return 1;
        if (!b.auctionDate) return -1;
        return a.auctionDate.localeCompare(b.auctionDate);
      });
    } else {
      results.sort((a, b) => b.opportunityScore - a.opportunityScore);
    }

    sendSuccess(res, {
      source: "Terra Distress Intelligence Engine — NYC ACRIS + County Records + Tax Liens + Auction Registry",
      count: results.length,
      properties: results,
      fetchedAt: new Date().toISOString(),
      connectors: ["NYC ACRIS", "Kings/Queens/Bronx/NY/Richmond County Courts", "NYC Dept of Finance", "FDIC REO", "MLS Delta Signal", "NYSCEF"],
      dataAbstractionLayer: "v1.0 — abstracted, no hardcoded keys, ready for live connectors",
    });
  } catch (err) { handleRouteError(res, err, "Failed to search distressed properties"); }
});

router.get("/terra/distress/property/:id", authMiddleware({ required: false }), (req, res) => {
  try {
    const { id } = req.params;
    const property = DEMO_DISTRESSED.find(p => p.id === id);
    if (!property) {
      res.status(404).json({ error: "Distressed property not found", id });
      return;
    }

    const equityPercent = property.debtAmount
      ? Math.round(((property.estimatedValue - property.debtAmount) / property.estimatedValue) * 100)
      : null;

    sendSuccess(res, {
      property,
      analysis: {
        equityPercent,
        debtToValue: property.debtAmount ? Math.round((property.debtAmount / property.estimatedValue) * 100) : null,
        opportunityWindow: property.distressType === "auction" && property.auctionDate
          ? `Auction ${property.auctionDate} — act now`
          : property.daysInDistress < 90
          ? "Early stage — direct outreach recommended"
          : property.daysInDistress > 200
          ? "Advanced distress — seller likely motivated"
          : "Mid-stage — approaching resolution point",
        suggestedStrategy: property.opportunityScore >= 85
          ? "Direct acquisition or note purchase — high priority"
          : property.opportunityScore >= 70
          ? "Direct outreach to owner — medium priority"
          : "Monitor — lower priority, add to watchlist",
        aiInsight: `${property.scoreRationale}. Suggested outreach: Contact ${property.ownerName} directly via attorney of record or certified mail. Mention ability to close quickly and take subject to existing debt.`,
      },
      conversionActions: {
        convertToLead: { endpoint: "/api/crm/leads", payload: { source: "distress-engine", propertyId: property.id } },
        convertToDeal: { endpoint: "/api/pipeline/deals", payload: { source: "distress-engine", propertyId: property.id } },
        assignAgent: { endpoint: "/api/lyte/assignments", payload: { propertyId: property.id } },
        triggerOutreach: { endpoint: "/api/alloy/workflows/trigger", payload: { trigger: "distress-outreach", propertyId: property.id } },
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch distress property detail"); }
});

router.get("/terra/distress/alerts", authMiddleware({ required: false }), (req, res) => {
  try {
    const { borough, type, severity } = req.query;
    let alerts = [...DISTRESS_ALERTS];

    if (borough) alerts = alerts.filter(a => a.borough?.toLowerCase() === (borough as string).toLowerCase());
    if (type) alerts = alerts.filter(a => a.type === type);
    if (severity) alerts = alerts.filter(a => a.severity === severity);

    sendSuccess(res, {
      alerts,
      count: alerts.length,
      alertRules: [
        { rule: "new-foreclosure-in-zip", description: "New lis pendens filed in watched zip codes", active: true },
        { rule: "lien-filed", description: "New tax lien filed on tracked properties", active: true },
        { rule: "auction-approaching", description: "Auction date within 14 days", active: true },
        { rule: "price-drop-signal", description: "Listing price reduced 5%+ from original", active: true },
        { rule: "distressed-listing-added", description: "New distressed property added to engine", active: true },
      ],
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch distress alerts"); }
});

router.get("/terra/distress/score", authMiddleware({ required: false }), (req, res) => {
  try {
    const { id } = req.query;
    const property = id ? DEMO_DISTRESSED.find(p => p.id === id) : null;

    if (id && !property) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    const results = property ? [property] : DEMO_DISTRESSED;

    const scores = results.map(p => ({
      id: p.id,
      address: p.address,
      borough: p.borough,
      opportunityScore: p.opportunityScore,
      confidenceLevel: p.confidenceLevel,
      scoreRationale: p.scoreRationale,
      scoreBreakdown: {
        distressTypeWeight: p.distressType === "auction" ? 30 : p.distressType === "pre-foreclosure" ? 25 : 20,
        timeInDistressWeight: Math.min(p.daysInDistress / 10, 20),
        equityWeight: p.debtAmount ? Math.round(((p.estimatedValue - p.debtAmount) / p.estimatedValue) * 25) : 15,
        locationDemandWeight: ["Manhattan", "Brooklyn"].includes(p.borough) ? 15 : 10,
        listingHistoryWeight: p.distressType === "expired-listing" ? 10 : 5,
      },
      investorOpportunityScore: p.opportunityScore,
      likelihoodOfSale: p.opportunityScore >= 80 ? "High (70-85%)" : p.opportunityScore >= 60 ? "Medium (40-70%)" : "Low (10-40%)",
    }));

    sendSuccess(res, {
      scores,
      scoringMethodology: {
        version: "2.0",
        factors: ["Distress type", "Time in distress", "Property value vs debt", "Borough location demand", "Listing history", "Price changes"],
        scale: "0–100 (100 = highest opportunity)",
        confidenceLevels: { high: ">80% data completeness", medium: "50–80%", low: "<50%" },
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch opportunity scores"); }
});

export default router;
