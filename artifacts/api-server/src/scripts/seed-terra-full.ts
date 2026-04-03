import { db } from "@szl-holdings/db";
import {
  terraDistressPropertiesTable,
  terraDistressAlertsTable,
  terraIngestionRunsTable,
  terraLeadsTable,
  terraDealsTable,
  terraSavedOpportunitiesTable,
  type InsertTerraDistressProperty,
  type InsertTerraDistressAlert,
  type InsertTerraLead,
  type InsertTerraDeal,
} from "@szl-holdings/db";
import { eq, sql } from "drizzle-orm";
import { generateAlertsForProperty, upsertDistressProperty, startIngestionRun, completeIngestionRun } from "../lib/terra-distress-service";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function dateStr(daysAgo: number) {
  const d = new Date("2026-03-31");
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function futureDateStr(daysAhead: number) {
  const d = new Date("2026-03-31");
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] as const;
const COUNTIES = ["New York", "Kings", "Queens", "Bronx", "Richmond", "Westchester", "Nassau", "Suffolk", "Rockland", "Orange", "Dutchess"] as const;
const DISTRESS_TYPES = ["pre-foreclosure", "foreclosure", "auction", "reo", "tax-lien", "expired-listing"] as const;
const PROPERTY_TYPES = ["multifamily", "single-family", "condo", "commercial", "mixed-use", "vacant-land"] as const;
const OWNER_TYPES = ["individual", "llc", "trust", "corporate"] as const;
const STAGES_BY_TYPE: Record<string, string[]> = {
  "pre-foreclosure": ["lis-pendens", "filing", "notice"],
  "foreclosure": ["lis-pendens", "notice", "judgment", "sale-scheduled"],
  "auction": ["scheduled", "postponed", "adjourned"],
  "reo": ["bank-owned", "fdic-managed", "listed"],
  "tax-lien": ["lien-filed", "escalated", "sale-pending"],
  "expired-listing": ["expired", "withdrawn", "cancelled"],
};

const BOROUGH_DATA: Record<string, { county: string; zips: string[]; lat: [number, number]; lng: [number, number] }> = {
  "Manhattan": { county: "New York", zips: ["10001","10002","10003","10007","10012","10013","10014","10021","10023","10025","10027","10029","10030","10031","10032","10033","10034","10036","10038","10039","10040"], lat: [40.70, 40.88], lng: [-74.02, -73.91] },
  "Brooklyn": { county: "Kings", zips: ["11201","11203","11205","11206","11207","11209","11210","11211","11212","11213","11214","11215","11216","11217","11218","11220","11221","11225","11226","11229","11230","11231","11232","11233","11234","11235","11238"], lat: [40.57, 40.74], lng: [-74.04, -73.86] },
  "Queens": { county: "Queens", zips: ["11101","11103","11104","11105","11106","11355","11357","11372","11374","11375","11377","11385","11412","11413","11420","11421","11422","11423","11428","11432","11433","11434","11691","11692","11693"], lat: [40.54, 40.80], lng: [-73.96, -73.70] },
  "Bronx": { county: "Bronx", zips: ["10451","10452","10453","10454","10455","10456","10457","10458","10460","10462","10463","10465","10467","10468","10471","10472","10473","10474","10475"], lat: [40.79, 40.92], lng: [-73.93, -73.76] },
  "Staten Island": { county: "Richmond", zips: ["10301","10302","10303","10304","10305","10306","10307","10308","10309","10310","10312","10314"], lat: [40.49, 40.65], lng: [-74.26, -74.05] },
};

const COUNTY_DATA: Record<string, { borough: string; zips: string[]; lat: [number, number]; lng: [number, number] }> = {
  "Westchester": { borough: "Manhattan", zips: ["10530","10532","10538","10543","10550","10553","10570","10580","10583","10601","10605","10706","10710","10801","10804","10920"], lat: [40.90, 41.36], lng: [-74.01, -73.68] },
  "Nassau": { borough: "Queens", zips: ["11001","11003","11010","11020","11021","11023","11040","11042","11050","11096","11501","11514","11516","11518","11520","11530","11542","11545","11547","11548","11550","11553","11557","11560","11563","11565","11566","11568","11572","11575","11577","11579","11590"], lat: [40.59, 40.85], lng: [-73.78, -73.48] },
  "Suffolk": { borough: "Queens", zips: ["11701","11706","11714","11717","11718","11719","11720","11721","11722","11724","11725","11726","11727","11731","11733","11741","11742","11746","11747","11751","11752","11754","11755","11757","11763","11768","11769","11771","11772","11775","11776","11777","11778","11779","11780","11782","11784","11786","11787","11788","11789","11790","11792","11794","11795","11796","11798","11901","11933"], lat: [40.58, 41.11], lng: [-73.50, -71.86] },
  "Rockland": { borough: "Bronx", zips: ["10901","10910","10911","10913","10918","10920","10923","10931","10950","10952","10954","10956","10960","10962","10964","10965","10970","10974","10976","10977","10980","10983","10984","10986","10989","10994"], lat: [41.03, 41.34], lng: [-74.23, -73.90] },
  "Orange": { borough: "Bronx", zips: ["10910","10918","10926","10928","10940","10950","10958","10963","10965","10969","10973","10974","10980","10984","10987","10988","10990","10992","10993","10996","12508","12520","12524","12528","12543","12549","12550","12563","12565","12575","12577","12586","12589","12590","12594","12771"], lat: [41.27, 41.70], lng: [-74.75, -73.97] },
  "Dutchess": { borough: "Manhattan", zips: ["12508","12514","12522","12524","12531","12533","12538","12540","12545","12546","12549","12563","12564","12565","12567","12569","12570","12571","12572","12574","12578","12580","12582","12583","12590","12594","12601","12602","12603","12604","12620"], lat: [41.54, 42.07], lng: [-74.00, -73.50] },
};

const OWNER_NAMES_LLC = [
  "Blue Rock Capital LLC","SunBridge Properties LLC","NYC Equity Holdings LLC","Empire State Realty Partners LLC","Tri-Borough Ventures LLC","Westside Capital Group LLC","Gotham Asset Management LLC","Hudson Valley Realty LLC","Crown Heights Properties LLC","BedStuy Partners LLC","Astoria Capital LLC","Flatbush Holdings LLC","Williamsburg Ventures LLC","DUMBO Asset Group LLC","Midtown South Partners LLC","Harlem Renaissance Holdings LLC","Washington Heights Realty LLC","Mott Haven Capital LLC","Soundview Properties LLC","East New York Holdings LLC","Canarsie Partners LLC","Bay Ridge Realty LLC","Sunset Park Holdings LLC","Woodside Capital LLC","Jamaica Ave Properties LLC","Forest Hills Holdings LLC","Kew Gardens Partners LLC","Flushing Capital LLC","Long Island City Holdings LLC","Ridgewood Properties LLC","Rockaway Partners LLC","Howard Beach Holdings LLC","College Point Capital LLC","Whitestone Realty LLC","Bayside Properties LLC","Little Neck Holdings LLC","Great Neck Partners LLC","Manhasset Capital LLC","Garden City Holdings LLC","Valley Stream Properties LLC","Hempstead Capital LLC","Mineola Holdings LLC","Rockville Centre Partners LLC","Lynbrook Realty LLC","Far Rockaway Capital LLC","Ossining Realty LLC","Yonkers Capital Holdings LLC","White Plains Partners LLC","New Rochelle Properties LLC","Mamaroneck Holdings LLC"
];

const OWNER_NAMES_INDIVIDUAL = [
  "Rodriguez, Carlos","Chen, Wei","Johnson, Marcus","Williams, Deborah","Smith, Robert","Davis, Keisha","Thompson, James","Brown, Patricia","Wilson, Anthony","Martinez, Gloria","Anderson, Terrence","Taylor, Linda","Jackson, Michael","White, Sandra","Harris, David","Martin, Yolanda","Garcia, Eduardo","Lewis, Cheryl","Lee, John","Walker, Angela","Hall, Brian","Young, Patricia","Allen, Kenneth","Hernandez, Rosa","King, Charles","Wright, Barbara","Lopez, Francisco","Hill, Dorothy","Scott, Steven","Green, Alice"
];

const OWNER_NAMES_TRUST = [
  "Goldstein Family Trust","O'Brien Revocable Trust","Kim Living Trust","Patel Family Trust","Rosenberg Irrevocable Trust","Nguyen Family Trust","Cohen Revocable Trust","Washington Living Trust","Murphy Family Trust","Schwartz Trust","Fernandez Family Trust","O'Sullivan Irrevocable Trust"
];

const OWNER_NAMES_CORP = [
  "Chase Bank REO","First Republic Bank (FDIC)","Wells Fargo Asset Recovery","Signature Bank REO Portfolio","NYCB REO Division","Citibank REO","Investors Bank Asset Recovery","Metropolitan Savings REO","Apple Bank REO Portfolio","Sterling Bancorp Asset Recovery"
];

const CONNECTOR_SOURCES = [
  "NYC ACRIS / Kings County Court Records",
  "NYSCEF / NY County ACRIS",
  "Queens County Foreclosure List",
  "Bronx County Court Records",
  "Richmond County Court Records",
  "NYC Foreclosure Auction Registry",
  "NYC Dept of Finance — Tax Lien Sales",
  "MLS Delta Signal — REBNY/OneKey",
  "FDIC REO Asset Listings",
  "Kings County Foreclosure Auction Registry",
  "Westchester County Court Records",
  "Nassau County Foreclosure List",
  "Suffolk County Court Records",
  "Rockland County Court Records",
  "Orange County Court Records",
];

function generateOwner(ownerType: typeof OWNER_TYPES[number]): string {
  switch (ownerType) {
    case "llc": return pick(OWNER_NAMES_LLC);
    case "individual": return pick(OWNER_NAMES_INDIVIDUAL);
    case "trust": return pick(OWNER_NAMES_TRUST);
    case "corporate": return pick(OWNER_NAMES_CORP);
  }
}

function generateAddressForBorough(borough: string): { address: string; zipCode: string; lat: string; lng: string } {
  const data = BOROUGH_DATA[borough]!;
  const streets = {
    "Manhattan": ["Broadway","5th Ave","Madison Ave","Lexington Ave","Park Ave","Amsterdam Ave","Columbus Ave","Riverside Dr","West End Ave","Convent Ave","St Nicholas Ave","8th Ave","9th Ave","10th Ave","11th Ave","W 125th St","W 145th St","W 168th St","W 181st St","E 116th St"],
    "Brooklyn": ["Atlantic Ave","Flatbush Ave","Bedford Ave","Kings Hwy","Ocean Ave","Eastern Pkwy","Nostrand Ave","Rogers Ave","Fulton St","Jay St","Court St","Montague St","Myrtle Ave","Park Slope Pl","Carroll St","Union St","DeKalb Ave","Flushing Ave","Gates Ave","Halsey St"],
    "Queens": ["Jamaica Ave","Queens Blvd","Northern Blvd","Sutphin Blvd","Parsons Blvd","Linden Blvd","Merrick Blvd","Springfield Blvd","Hillside Ave","Union Tpke","Metropolitan Ave","Fresh Pond Rd","Myrtle Ave","Grand Ave","Woodhaven Blvd","Liberty Ave","Rockaway Blvd","Francis Lewis Blvd","Farmers Blvd","Guy Brewer Blvd"],
    "Bronx": ["Grand Concourse","Jerome Ave","Boston Rd","White Plains Rd","Boston Post Rd","Pelham Pkwy","Westchester Ave","Southern Blvd","Tremont Ave","Burnside Ave","Fordham Rd","East Tremont Ave","Morris Ave","University Ave","Kingsbridge Rd","Mosholu Pkwy","Webster Ave","Third Ave","Willis Ave","Fox St"],
    "Staten Island": ["Richmond Ave","Forest Ave","Hylan Blvd","Richmond Terrace","Bay St","Victory Blvd","Castleton Ave","Broadway","Manor Rd","Amboy Rd","Arthur Kill Rd","Richmond Valley Rd","Woodrow Rd","New Dorp Ln","Fingerboard Rd","Todt Hill Rd","Rockland Ave"],
  };
  const nums = [rand(1, 200) * 2, rand(100, 3999)];
  const streetList = streets[borough as keyof typeof streets] ?? ["Main St"];
  const addr = `${pick(nums)} ${pick(streetList)}`;
  const zip = pick(data.zips);
  const lat = (data.lat[0] + Math.random() * (data.lat[1] - data.lat[0])).toFixed(7);
  const lng = (data.lng[0] + Math.random() * (data.lng[1] - data.lng[0])).toFixed(7);
  return { address: addr, zipCode: zip, lat, lng };
}

function generateAddressForCounty(county: string): { address: string; zipCode: string; lat: string; lng: string; city: string } {
  const data = COUNTY_DATA[county]!;
  const cities: Record<string, string[]> = {
    "Westchester": ["Yonkers","White Plains","New Rochelle","Mount Vernon","Scarsdale","Tarrytown","Ossining","Peekskill"],
    "Nassau": ["Hempstead","Mineola","Garden City","Great Neck","Valley Stream","Freeport","Long Beach","Lynbrook"],
    "Suffolk": ["Islip","Babylon","Smithtown","Huntington","Brentwood","Hauppauge","Bay Shore","Ronkonkoma"],
    "Rockland": ["Nyack","Spring Valley","Nanuet","Pearl River","New City","Suffern","Haverstraw","Goshen"],
    "Orange": ["Newburgh","Middletown","Port Jervis","Monroe","Warwick","Goshen","Cornwell","Florida"],
    "Dutchess": ["Poughkeepsie","Beacon","Fishkill","Hyde Park","Rhinebeck","Red Hook","Millbrook","Amenia"],
  };
  const streets = ["Main St","Broadway","Central Ave","Oak St","Elm St","Park Ave","Church St","School St","Lake Rd","River Rd","County Rd","Route 9","Route 17","Post Rd","State Route 303"];
  const nums = [rand(1, 500), rand(50, 2999)];
  const cityList = cities[county] ?? ["Anytown"];
  const city = pick(cityList);
  const addr = `${pick(nums)} ${pick(streets)}`;
  const zip = pick(data.zips);
  const lat = (data.lat[0] + Math.random() * (data.lat[1] - data.lat[0])).toFixed(7);
  const lng = (data.lng[0] + Math.random() * (data.lng[1] - data.lng[0])).toFixed(7);
  return { address: addr, zipCode: zip, lat, lng, city };
}

function computeScore(distressType: string, daysInDistress: number, estimatedValue: number, debtAmount: number | undefined, borough: string): number {
  let score = 50;
  if (distressType === "auction") score += 25;
  else if (distressType === "pre-foreclosure") score += 18;
  else if (distressType === "foreclosure") score += 15;
  else if (distressType === "reo") score += 12;
  else if (distressType === "tax-lien") score += 8;
  else score += 3;

  score += Math.min(daysInDistress / 15, 20);

  if (debtAmount) {
    const equity = (estimatedValue - debtAmount) / estimatedValue;
    score += Math.round(equity * 25);
  } else {
    score += 10;
  }

  if (["Manhattan", "Brooklyn"].includes(borough)) score += 12;
  else if (["Queens"].includes(borough)) score += 8;
  else if (["Bronx"].includes(borough)) score += 5;
  else score += 2;

  return Math.min(100, Math.max(10, score));
}

function scoreRationale(distressType: string, borough: string, score: number, daysInDistress: number, ownerType: string): string {
  const parts: string[] = [];
  if (score >= 85) parts.push("Elite opportunity signal");
  else if (score >= 70) parts.push("Strong distress indicator");
  else parts.push("Moderate opportunity");

  if (distressType === "auction") parts.push(`auction approaching — immediate action window`);
  else if (distressType === "pre-foreclosure") parts.push(`early-stage filing — ideal for direct off-market outreach`);
  else if (distressType === "foreclosure") parts.push(`active foreclosure proceeding`);
  else if (distressType === "reo") parts.push(`bank-owned, motivated seller disposition`);
  else if (distressType === "tax-lien") parts.push(`growing tax liability, owner likely under financial pressure`);
  else parts.push(`expired listing signals seller frustration and motivation`);

  parts.push(`${daysInDistress}d in distress`);
  if (["Manhattan", "Brooklyn"].includes(borough)) parts.push(`${borough} premium location commands strong resale demand`);

  if (ownerType === "llc") parts.push(`LLC owner may respond to off-market acquisition approach`);
  else if (ownerType === "individual") parts.push(`individual owner — direct personal outreach recommended`);
  else if (ownerType === "trust") parts.push(`trust-managed — potential estate/succession motivation`);

  return parts.join(". ");
}

function generateTimeline(distressType: string, filingDate: string, auctionDate?: string): Array<{ date: string; type: string; description: string }> {
  const timeline: Array<{ date: string; type: string; description: string }> = [];
  const filing = new Date(filingDate);

  const preDefault = new Date(filing);
  preDefault.setDate(preDefault.getDate() - rand(60, 120));

  timeline.push({
    date: preDefault.toISOString().slice(0, 10),
    type: "Payment Default",
    description: `Borrower missed ${rand(2, 5)} consecutive mortgage/tax payments`,
  });

  timeline.push({
    date: filingDate,
    type: distressType === "tax-lien" ? "Tax Lien Filed" : distressType === "reo" ? "REO Transfer" : distressType === "expired-listing" ? "Listing Expired" : "Lis Pendens Filed",
    description: distressType === "pre-foreclosure" ? "Pre-foreclosure notice filed with county" :
      distressType === "foreclosure" ? "Foreclosure proceeding initiated by lender" :
      distressType === "tax-lien" ? `Tax lien filed — $${(rand(50, 400) * 1000).toLocaleString()}` :
      distressType === "reo" ? "Property transferred to bank REO portfolio" :
      distressType === "expired-listing" ? `Listing expired after ${rand(6, 18)} months on market` :
      `Auction scheduled by ${["Kings","Queens","Bronx","NY","Richmond"][rand(0, 4)]} County`,
  });

  if (auctionDate) {
    timeline.push({ date: auctionDate, type: "Auction", description: "Foreclosure auction scheduled" });
  }

  const statusUpdate = new Date(filing);
  statusUpdate.setDate(statusUpdate.getDate() + rand(30, 90));
  if (statusUpdate < new Date("2026-03-31")) {
    timeline.push({
      date: statusUpdate.toISOString().slice(0, 10),
      type: "Status Update",
      description: pick([
        "No resolution plan submitted — escalating",
        "Attorney response received — negotiations pending",
        "Court date set — awaiting judgment",
        "Mediation session scheduled",
        "Owner missed cure deadline",
      ]),
    });
  }

  return timeline.sort((a, b) => a.date.localeCompare(b.date));
}

function generateProperties(): InsertTerraDistressProperty[] {
  const props: InsertTerraDistressProperty[] = [];
  let counter = 100;

  const nycBoroughCounts = { "Manhattan": 90, "Brooklyn": 120, "Queens": 80, "Bronx": 70, "Staten Island": 30 };
  const nycCountyCounts = { "Westchester": 35, "Nassau": 40, "Suffolk": 25, "Rockland": 20, "Orange": 10, "Dutchess": 10 };

  for (const [borough, count] of Object.entries(nycBoroughCounts)) {
    for (let i = 0; i < count; i++) {
      counter++;
      const distressType = pick(DISTRESS_TYPES);
      const propertyType = pick(PROPERTY_TYPES);
      const ownerType = pick(OWNER_TYPES);
      const stage = pick(STAGES_BY_TYPE[distressType as string] ?? ["unknown"]);
      const daysInDistress = rand(14, 480);
      const filingDate = dateStr(daysInDistress + rand(0, 10));
      const lastActivityDate = dateStr(rand(1, 60));
      const estimatedValue = propertyType === "commercial" ? rand(1, 30) * 500000 :
        propertyType === "multifamily" ? rand(8, 60) * 100000 :
        propertyType === "mixed-use" ? rand(15, 120) * 100000 :
        rand(4, 25) * 100000;

      const hasDebt = distressType !== "tax-lien" && distressType !== "expired-listing";
      const debtAmount = hasDebt ? Math.round(estimatedValue * (rand(55, 92) / 100)) : undefined;
      const lienAmount = distressType === "tax-lien" ? rand(30, 600) * 1000 : undefined;
      const auctionDate = distressType === "auction" ? futureDateStr(rand(3, 60)) : undefined;

      const score = computeScore(distressType, daysInDistress, estimatedValue, debtAmount, borough);
      const confidence = score >= 75 ? "high" : score >= 55 ? "medium" : "low";

      const { address, zipCode, lat, lng } = generateAddressForBorough(borough);
      const sqft = propertyType === "commercial" ? rand(2000, 50000) :
        propertyType === "multifamily" ? rand(2400, 18000) :
        rand(600, 4000);

      props.push({
        externalId: `dp-${counter}`,
        address,
        borough: borough as any,
        county: BOROUGH_DATA[borough]!.county,
        zipCode,
        propertyType: propertyType as any,
        distressType: distressType as any,
        stage,
        estimatedValue: String(estimatedValue),
        debtAmount: debtAmount ? String(debtAmount) : undefined,
        lienAmount: lienAmount ? String(lienAmount) : undefined,
        auctionDate,
        filingDate,
        lastActivityDate,
        ownerName: generateOwner(ownerType),
        ownerType,
        opportunityScore: score,
        confidenceLevel: confidence,
        scoreRationale: scoreRationale(distressType, borough, score, daysInDistress, ownerType),
        latitude: lat,
        longitude: lng,
        sqft,
        yearBuilt: rand(1890, 2010),
        beds: ["single-family", "condo"].includes(propertyType) ? rand(2, 6) : undefined,
        baths: ["single-family", "condo"].includes(propertyType) ? rand(1, 4) : undefined,
        daysInDistress,
        tags: [distressType, borough.toLowerCase().replace(" ", "-"), propertyType, confidence + "-confidence"],
        timeline: generateTimeline(distressType, filingDate, auctionDate),
        connectorSource: pick(CONNECTOR_SOURCES),
        ingestSource: "seed",
        isActive: true,
      });
    }
  }

  for (const [county, count] of Object.entries(nycCountyCounts)) {
    for (let i = 0; i < count; i++) {
      counter++;
      const distressType = pick(DISTRESS_TYPES);
      const propertyType = pick(PROPERTY_TYPES);
      const ownerType = pick(OWNER_TYPES);
      const stage = pick(STAGES_BY_TYPE[distressType as string] ?? ["unknown"]);
      const daysInDistress = rand(14, 480);
      const filingDate = dateStr(daysInDistress + rand(0, 10));
      const lastActivityDate = dateStr(rand(1, 60));
      const estimatedValue = rand(3, 20) * 100000;
      const hasDebt = distressType !== "tax-lien" && distressType !== "expired-listing";
      const debtAmount = hasDebt ? Math.round(estimatedValue * (rand(55, 92) / 100)) : undefined;
      const lienAmount = distressType === "tax-lien" ? rand(15, 200) * 1000 : undefined;
      const auctionDate = distressType === "auction" ? futureDateStr(rand(5, 90)) : undefined;
      const score = computeScore(distressType, daysInDistress, estimatedValue, debtAmount, "");
      const confidence = score >= 75 ? "high" : score >= 55 ? "medium" : "low";
      const { address, zipCode, lat, lng } = generateAddressForCounty(county);
      const sqft = rand(800, 8000);

      props.push({
        externalId: `dp-${counter}`,
        address,
        borough: "Manhattan" as any,
        county,
        zipCode,
        propertyType: propertyType as any,
        distressType: distressType as any,
        stage,
        estimatedValue: String(estimatedValue),
        debtAmount: debtAmount ? String(debtAmount) : undefined,
        lienAmount: lienAmount ? String(lienAmount) : undefined,
        auctionDate,
        filingDate,
        lastActivityDate,
        ownerName: generateOwner(ownerType),
        ownerType,
        opportunityScore: score,
        confidenceLevel: confidence,
        scoreRationale: scoreRationale(distressType, county, score, daysInDistress, ownerType),
        latitude: lat,
        longitude: lng,
        sqft,
        yearBuilt: rand(1920, 2005),
        daysInDistress,
        tags: [distressType, county.toLowerCase().replace(" ", "-"), propertyType],
        timeline: generateTimeline(distressType, filingDate, auctionDate),
        connectorSource: pick(CONNECTOR_SOURCES),
        ingestSource: "seed",
        isActive: true,
      });
    }
  }

  return props;
}

const AGENT_NAMES = [
  "Marcus Chen","Sarah Kowalski","James Torres","Lisa Park","David Rivera","Angela Brooks","Michael Santos","Jennifer Walsh","Robert Kim","Priya Sharma","Carlos Mendez","Diana Osei","Kevin Huang","Tasha Williams","Brett Novak","Aisha Johnson","Frank Reilly","Monica Lee"
];

function generateLeads(propertyIds: number[], propertyMap: Map<number, InsertTerraDistressProperty>): InsertTerraLead[] {
  const leads: InsertTerraLead[] = [];
  const sources = ["distress-engine","referral","website","zillow","realtor","open-house","social","cold-call","past-client","manual"] as const;
  const stages = ["new","engaged","nurtured","hot","inactive","converted"] as const;
  const types = ["buyer","seller","investor","both"] as const;

  for (let i = 1; i <= 120; i++) {
    const source = i <= 40 ? "distress-engine" : pick(sources);
    const stage = pick(stages);
    const type = i <= 40 ? "seller" : pick(types);
    const score = rand(20, 98);
    const daysAgo = rand(1, 365);
    const lastContact = dateStr(rand(1, 30));
    const nextFollowUp = rand(0, 1) === 0 ? futureDateStr(rand(1, 14)) : undefined;
    const ownerName = pick(AGENT_NAMES);
    const distressPropertyId = i <= 40 && propertyIds.length > 0 ? propertyIds[i - 1] ?? null : null;
    const distressProp = distressPropertyId ? propertyMap.get(distressPropertyId) : null;

    const firstNames = ["James","John","Robert","Michael","William","David","Richard","Joseph","Thomas","Charles","Mary","Patricia","Jennifer","Linda","Barbara","Elizabeth","Susan","Jessica","Sarah","Karen","Marcus","Carlos","Priya","Aisha","Kevin","Angela","Diana","Sandra","Yolanda","Cheryl"];
    const lastNames = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Anderson","Martinez","Taylor","Thomas","Hernandez","Moore","Jackson","Martin","Lee","Thompson","White","Chen","Kim","Patel","Osei","Santos","Rivera","Torres","Lopez","Rodriguez","Mendez"];

    const firstName = pick(firstNames);
    const lastName = pick(lastNames);

    leads.push({
      externalId: `lead-${String(i).padStart(3, "0")}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${rand(1, 99)}@${pick(["gmail.com","outlook.com","yahoo.com","icloud.com","proton.me"])}`,
      phone: `(${rand(200, 999)}) ${rand(200, 999)}-${rand(1000, 9999)}`,
      type,
      source,
      stage,
      score,
      conversionProbability: String((score / 100 * rand(70, 130) / 100).toFixed(4)).slice(0, 6),
      ownerName,
      assignedDate: dateStr(daysAgo),
      lastContact,
      nextFollowUp: nextFollowUp ?? null,
      distressPropertyId,
      distressPropertyExternalId: distressProp?.externalId ?? null,
      notes: i <= 40 && distressProp ? `Converted from distress engine — ${distressProp.distressType} at ${distressProp.address}` :
        rand(0, 2) === 0 ? pick(["Looking for off-market multifamily in Brooklyn","Investor seeking distressed commercial properties","Owner-occupant — needs quick close","Wholesale buyer, cash available within 2 weeks","1031 exchange buyer — needs replacement property by Q4"]) : null,
      tags: source === "distress-engine" ? [distressProp?.distressType ?? "distress", "distress-converted"] : [type, source],
      timeline: [
        { date: dateStr(daysAgo), event: "Lead created", type: "created" },
        ...(lastContact ? [{ date: lastContact, event: "Follow-up call completed", type: "contact" }] : []),
      ],
      nextAction: pick(["Initial outreach call","Send property overview","Schedule site visit","Follow up on offer","Qualify budget range","Send market comps","Discuss financing options","Legal intro call"]),
      isActive: true,
      desiredAreas: [pick(["Brooklyn","Manhattan","Queens","Bronx","Staten Island","Westchester"])],
      budget: rand(0, 1) === 0 ? { min: rand(3, 15) * 100000, max: rand(20, 80) * 100000 } : null,
    });
  }

  return leads;
}

function generateDeals(propertyIds: number[], leadIds: number[], propertyMap: Map<number, InsertTerraDistressProperty>): InsertTerraDeal[] {
  const deals: InsertTerraDeal[] = [];
  const stages = ["lead","qualified","showing","offer","negotiation","accepted","inspection","financing","under-contract","clear-to-close","closed","lost"] as const;
  const types = ["acquisition","disposition","assignment","wholesale"] as const;
  const riskLevels = ["low","medium","high","critical"] as const;

  for (let i = 1; i <= 60; i++) {
    const stage = pick(stages);
    const type = pick(types);
    const riskLevel = pick(riskLevels);
    const propId = propertyIds[rand(0, propertyIds.length - 1)];
    const prop = propId ? propertyMap.get(propId) : null;
    const leadId = i <= 30 ? (leadIds[i - 1] ?? null) : null;
    const askingPrice = prop ? Number(prop.estimatedValue) : rand(5, 80) * 100000;
    const price = stage === "closed" ? Math.round(askingPrice * rand(88, 105) / 100) :
      ["offer","negotiation","accepted"].includes(stage) ? Math.round(askingPrice * rand(85, 100) / 100) : null;
    const ownerName = pick(AGENT_NAMES);
    const stageEnteredDaysAgo = rand(0, 45);
    const probability = stage === "closed" ? 100 : stage === "lost" ? 5 :
      stage === "clear-to-close" ? 95 : stage === "under-contract" ? 85 :
      stage === "financing" ? 78 : stage === "inspection" ? 70 :
      stage === "accepted" ? 65 : stage === "negotiation" ? 55 :
      stage === "offer" ? 40 : stage === "showing" ? 30 :
      stage === "qualified" ? 20 : 10;

    deals.push({
      externalId: `deal-${String(i).padStart(3, "0")}`,
      address: prop?.address ?? `${rand(100, 999) * 2} ${pick(["Broadway","Atlantic Ave","Flatbush Ave","Grand Concourse","Jamaica Ave"])}`,
      borough: prop?.borough ?? pick(["Manhattan","Brooklyn","Queens","Bronx","Staten Island"]),
      county: prop?.county ?? pick(["New York","Kings","Queens","Bronx","Richmond"]),
      zipCode: prop?.zipCode ?? undefined,
      stage,
      type,
      price: price ? String(price) : null,
      askingPrice: String(askingPrice),
      arv: prop ? String(Math.round(Number(prop.estimatedValue) * rand(105, 140) / 100)) : null,
      probability,
      riskLevel,
      ownerName,
      ownerUserId: null,
      clientName: pick(["Blackstone RE","SZL Holdings","Greenpoint Capital","Meridian Capital","Battery Park Ventures","Crown Heights Investors","Bed-Stuy Partners","Flatbush Group","Jamaica Capital","Pelham Bay Partners","DUMBO Ventures","Harlem Capital","Hudson Yards Partners","Bronx River Capital","BayRidge Realty"]),
      distressPropertyId: propId ?? null,
      distressPropertyExternalId: prop?.externalId ?? null,
      leadId: leadId,
      stageEnteredAt: new Date(Date.now() - stageEnteredDaysAgo * 86400000),
      estimatedCloseDate: ["closed","lost"].includes(stage) ? null : futureDateStr(rand(14, 120)),
      actualCloseDate: stage === "closed" ? dateStr(rand(1, 30)) : null,
      nextAction: stage === "lost" ? null : pick(["Schedule property tour","Submit offer","Request inspection report","Confirm financing","Sign contract","Title search","Attorney review","Counter-offer due","Environmental Phase I","Rate lock decision"]),
      notes: `${type.replace(/-/g, " ")} — ${prop?.distressType ?? "standard"} deal`,
      timeline: [
        { date: dateStr(rand(30, 120)), event: "Deal created", type: "created" },
        { date: dateStr(stageEnteredDaysAgo), event: `Entered ${stage} stage`, type: "stage_change" },
      ],
      documents: [
        { name: "Property Info Sheet", status: "complete" },
        { name: "Purchase Agreement", status: stage === "offer" ? "pending" : ["negotiation","accepted","inspection","financing","under-contract","clear-to-close","closed"].includes(stage) ? "complete" : "not_started" },
        { name: "Inspection Report", status: ["inspection","financing","under-contract","clear-to-close","closed"].includes(stage) ? "complete" : "not_started" },
        { name: "Title Commitment", status: ["clear-to-close","closed"].includes(stage) ? "complete" : "not_started" },
      ],
      isActive: true,
    });
  }

  return deals;
}

function generateIngestionRuns(): Array<{
  source: string;
  status: "completed" | "failed" | "partial";
  recordsFetched: number;
  recordsInserted: number;
  recordsSkipped: number;
  recordsFailed: number;
  alertsGenerated: number;
  startedAt: Date;
  completedAt: Date;
  metadata: Record<string, unknown>;
}> {
  const runs = [];
  const sources = ["nyc_open_data","csv_upload","nyc_open_data_extended","manual","seed","csv_upload","nyc_open_data","csv_upload","seed","nyc_open_data_extended","csv_upload","nyc_open_data","manual","csv_upload","nyc_open_data","csv_upload","nyc_open_data_extended","csv_upload","nyc_open_data","csv_upload","manual","csv_upload","nyc_open_data"];

  for (let i = 0; i < 22; i++) {
    const daysAgo = rand(1, 180);
    const startedAt = new Date(Date.now() - daysAgo * 86400000);
    const duration = rand(30, 900) * 1000;
    const completedAt = new Date(startedAt.getTime() + duration);
    const fetched = rand(50, 800);
    const inserted = Math.round(fetched * rand(70, 99) / 100);
    const skipped = Math.round(fetched * rand(1, 20) / 100);
    const failed = fetched - inserted - skipped;
    const status = failed > inserted ? "failed" : failed > 0 ? "partial" : "completed";

    runs.push({
      source: sources[i] ?? "seed",
      status: status as "completed" | "failed" | "partial",
      recordsFetched: fetched,
      recordsInserted: inserted,
      recordsSkipped: skipped,
      recordsFailed: Math.max(0, failed),
      alertsGenerated: rand(0, Math.floor(inserted / 10)),
      startedAt,
      completedAt,
      metadata: {
        duration_ms: duration,
        source_label: sources[i],
        triggered_by: pick(["scheduler","manual","csv_upload"]),
      },
    });
  }

  return runs;
}

async function main() {
  console.log("Starting Terra full seed (500+ properties, 100+ leads, 50+ deals, 20+ ingestion runs)...");

  console.log("Generating property records...");
  const allProps = generateProperties();
  console.log(`  Generated ${allProps.length} properties`);

  const runId = await startIngestionRun("seed", { description: "Full Terra distress seed v2" });

  let inserted = 0;
  let skipped = 0;
  let alertsGenerated = 0;
  const insertedPropertyIds: number[] = [];
  const propertyMap = new Map<number, InsertTerraDistressProperty>();

  console.log("Inserting properties...");
  for (const prop of allProps) {
    try {
      const { dbId, isNew } = await upsertDistressProperty(prop, runId);
      if (isNew) {
        inserted++;
        insertedPropertyIds.push(dbId);
        propertyMap.set(dbId, prop);
        const alerts = await generateAlertsForProperty(prop, dbId, prop.externalId!);
        alertsGenerated += alerts;
        if (inserted % 50 === 0) console.log(`  Inserted ${inserted} properties...`);
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`  ! Failed: ${prop.externalId}`, err);
    }
  }

  await completeIngestionRun(runId, {
    recordsFetched: allProps.length,
    recordsInserted: inserted,
    recordsSkipped: skipped,
    recordsFailed: 0,
    alertsGenerated,
    status: "completed",
  });

  console.log(`\nProperties: ${inserted} inserted, ${skipped} skipped`);

  console.log("\nSeeding ingestion run history...");
  const historicRuns = generateIngestionRuns();
  for (const run of historicRuns) {
    try {
      await db.insert(terraIngestionRunsTable).values({
        source: run.source,
        status: run.status,
        recordsFetched: run.recordsFetched,
        recordsInserted: run.recordsInserted,
        recordsSkipped: run.recordsSkipped,
        recordsFailed: run.recordsFailed,
        alertsGenerated: run.alertsGenerated,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        metadata: run.metadata,
      });
    } catch (err) {
      console.error(`  ! Failed ingestion run insert`, err);
    }
  }
  console.log(`  Inserted ${historicRuns.length} ingestion run records`);

  console.log("\nSeeding leads...");
  const allDbPropertyIds = [...insertedPropertyIds];
  const leads = generateLeads(allDbPropertyIds.slice(0, 40), propertyMap);
  const leadDbIds: number[] = [];
  for (const lead of leads) {
    try {
      const result = await db.insert(terraLeadsTable).values(lead as any).onConflictDoNothing({ target: terraLeadsTable.externalId }).returning({ id: terraLeadsTable.id });
      if (result[0]) leadDbIds.push(result[0].id);
    } catch (err) {
      console.error(`  ! Failed lead: ${lead.externalId}`, err);
    }
  }
  console.log(`  Inserted ${leadDbIds.length} leads`);

  console.log("\nSeeding deals...");
  const deals = generateDeals(allDbPropertyIds.slice(0, 50), leadDbIds.slice(0, 30), propertyMap);
  let dealCount = 0;
  for (const deal of deals) {
    try {
      await db.insert(terraDealsTable).values(deal).onConflictDoNothing({ target: terraDealsTable.externalId });
      dealCount++;
    } catch (err) {
      console.error(`  ! Failed deal: ${deal.externalId}`, err);
    }
  }
  console.log(`  Inserted ${dealCount} deals`);

  console.log("\nFull Terra seed complete:");
  console.log(`  Properties: ${inserted}`);
  console.log(`  Leads: ${leadDbIds.length}`);
  console.log(`  Deals: ${dealCount}`);
  console.log(`  Ingestion runs: ${historicRuns.length}`);
  console.log(`  Alerts generated: ${alertsGenerated}`);

  process.exit(0);
}

main().catch(err => {
  console.error("Full seed failed:", err);
  process.exit(1);
});
