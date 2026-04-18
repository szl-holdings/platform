export interface Property {
  id: string;
  name: string;
  type: "multifamily" | "office" | "retail" | "industrial" | "mixed-use";
  address: string;
  city: string;
  state: string;
  units: number;
  sqft: number;
  occupancy: number;
  monthlyRevenue: number;
  annualNOI: number;
  capRate: number;
  value: number;
  purchasePrice: number;
  purchaseDate: string;
  status: "performing" | "watch" | "critical";
  image?: string;
  latitude: number;
  longitude: number;
}

export interface Tenant {
  id: string;
  propertyId: string;
  name: string;
  unit: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  status: "active" | "expiring" | "delinquent";
}

export interface Deal {
  id: string;
  name: string;
  type: "acquisition" | "disposition";
  stage: "sourcing" | "underwriting" | "due-diligence" | "closing" | "closed";
  value: number;
  capRate: number;
  property_type: string;
  city: string;
  state: string;
  contact: string;
  daysInStage: number;
  probability: number;
}

export interface Alert {
  id: string;
  propertyId: string;
  propertyName: string;
  type: "vacancy" | "lease-expiry" | "maintenance" | "payment" | "market";
  severity: "high" | "medium" | "low";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface MarketData {
  region: string;
  medianPrice: number;
  pricePerSqft: number;
  yoyChange: number;
  avgCapRate: number;
  vacancyRate: number;
  daysOnMarket: number;
  inventory: number;
}

export const properties: Property[] = [
  {
    id: "prop-001", name: "Meridian Tower", type: "multifamily", address: "1200 Meridian Ave", city: "Miami", state: "FL",
    units: 240, sqft: 285000, occupancy: 94.2, monthlyRevenue: 528000, annualNOI: 4180000, capRate: 5.8, value: 72100000,
    purchasePrice: 58500000, purchaseDate: "2021-06-15", status: "performing", latitude: 25.7617, longitude: -80.1918,
  },
  {
    id: "prop-002", name: "Pacific Heights Plaza", type: "office", address: "450 California St", city: "San Francisco", state: "CA",
    units: 48, sqft: 180000, occupancy: 87.5, monthlyRevenue: 675000, annualNOI: 5640000, capRate: 5.2, value: 108500000,
    purchasePrice: 92000000, purchaseDate: "2020-03-20", status: "performing", latitude: 37.7749, longitude: -122.4194,
  },
  {
    id: "prop-003", name: "Riverside Commons", type: "mixed-use", address: "88 River Walk", city: "Austin", state: "TX",
    units: 156, sqft: 195000, occupancy: 91.8, monthlyRevenue: 412000, annualNOI: 3420000, capRate: 6.1, value: 56100000,
    purchasePrice: 48200000, purchaseDate: "2022-01-10", status: "performing", latitude: 30.2672, longitude: -97.7431,
  },
  {
    id: "prop-004", name: "Summit Industrial Park", type: "industrial", address: "7700 Distribution Dr", city: "Dallas", state: "TX",
    units: 12, sqft: 420000, occupancy: 96.7, monthlyRevenue: 315000, annualNOI: 2780000, capRate: 6.8, value: 40900000,
    purchasePrice: 35000000, purchaseDate: "2019-09-05", status: "performing", latitude: 32.7767, longitude: -96.797,
  },
  {
    id: "prop-005", name: "The Atrium", type: "retail", address: "555 Market Square", city: "Nashville", state: "TN",
    units: 32, sqft: 95000, occupancy: 78.1, monthlyRevenue: 186000, annualNOI: 1520000, capRate: 7.2, value: 21100000,
    purchasePrice: 22800000, purchaseDate: "2020-11-30", status: "watch", latitude: 36.1627, longitude: -86.7816,
  },
  {
    id: "prop-006", name: "Harborview Residences", type: "multifamily", address: "200 Harbor Blvd", city: "Boston", state: "MA",
    units: 180, sqft: 210000, occupancy: 97.2, monthlyRevenue: 495000, annualNOI: 4120000, capRate: 4.9, value: 84100000,
    purchasePrice: 71000000, purchaseDate: "2021-04-22", status: "performing", latitude: 42.3601, longitude: -71.0589,
  },
  {
    id: "prop-007", name: "Skyline Lofts", type: "multifamily", address: "330 W Grand Ave", city: "Chicago", state: "IL",
    units: 96, sqft: 112000, occupancy: 68.4, monthlyRevenue: 172000, annualNOI: 1180000, capRate: 5.5, value: 21500000,
    purchasePrice: 24200000, purchaseDate: "2023-02-14", status: "critical", latitude: 41.8781, longitude: -87.6298,
  },
  {
    id: "prop-008", name: "Greenfield Office Campus", type: "office", address: "1500 Innovation Way", city: "Denver", state: "CO",
    units: 24, sqft: 145000, occupancy: 89.6, monthlyRevenue: 362000, annualNOI: 2940000, capRate: 5.9, value: 49800000,
    purchasePrice: 43500000, purchaseDate: "2022-07-08", status: "performing", latitude: 39.7392, longitude: -104.9903,
  },
];

export const tenants: Tenant[] = [
  { id: "t-001", propertyId: "prop-001", name: "Apex Financial Group", unit: "Suite 1400", leaseStart: "2022-01-01", leaseEnd: "2027-12-31", monthlyRent: 28500, status: "active" },
  { id: "t-002", propertyId: "prop-001", name: "Horizon Tech Labs", unit: "Suite 800", leaseStart: "2021-06-01", leaseEnd: "2026-05-31", monthlyRent: 22000, status: "expiring" },
  { id: "t-003", propertyId: "prop-002", name: "Vertex Consulting", unit: "Floor 12", leaseStart: "2020-09-01", leaseEnd: "2025-08-31", monthlyRent: 85000, status: "active" },
  { id: "t-004", propertyId: "prop-002", name: "NovaBio Sciences", unit: "Floor 8-9", leaseStart: "2021-03-01", leaseEnd: "2026-02-28", monthlyRent: 142000, status: "expiring" },
  { id: "t-005", propertyId: "prop-003", name: "Ember Restaurant Group", unit: "Ground Floor", leaseStart: "2022-04-01", leaseEnd: "2032-03-31", monthlyRent: 18500, status: "active" },
  { id: "t-006", propertyId: "prop-005", name: "Luna Boutique", unit: "Unit 12A", leaseStart: "2021-01-01", leaseEnd: "2026-06-30", monthlyRent: 8200, status: "expiring" },
  { id: "t-007", propertyId: "prop-005", name: "Craft & Barrel Co.", unit: "Unit 8B", leaseStart: "2023-03-01", leaseEnd: "2028-02-28", monthlyRent: 6800, status: "active" },
  { id: "t-008", propertyId: "prop-007", name: "Sterling Design Studio", unit: "Unit 4C", leaseStart: "2023-06-01", leaseEnd: "2025-05-31", monthlyRent: 3200, status: "delinquent" },
  { id: "t-009", propertyId: "prop-004", name: "Atlas Logistics", unit: "Warehouse A-C", leaseStart: "2020-01-01", leaseEnd: "2030-12-31", monthlyRent: 125000, status: "active" },
  { id: "t-010", propertyId: "prop-006", name: "Individual Residents", unit: "175 Units", leaseStart: "2021-04-22", leaseEnd: "2026-04-21", monthlyRent: 487500, status: "active" },
];

export const deals: Deal[] = [
  { id: "deal-001", name: "Sunrise Village Apartments", type: "acquisition", stage: "due-diligence", value: 45200000, capRate: 5.9, property_type: "Multifamily", city: "Tampa", state: "FL", contact: "Marcus Chen", daysInStage: 14, probability: 72 },
  { id: "deal-002", name: "Tech Corridor Office", type: "acquisition", stage: "underwriting", value: 78500000, capRate: 5.4, property_type: "Office", city: "Raleigh", state: "NC", contact: "Sarah Mitchell", daysInStage: 8, probability: 45 },
  { id: "deal-003", name: "Lakewood Retail Center", type: "disposition", stage: "closing", value: 18900000, capRate: 7.8, property_type: "Retail", city: "Nashville", state: "TN", contact: "James Wheeler", daysInStage: 5, probability: 95 },
  { id: "deal-004", name: "Harbor Point Condos", type: "acquisition", stage: "sourcing", value: 62000000, capRate: 4.7, property_type: "Multifamily", city: "Seattle", state: "WA", contact: "Elena Rodriguez", daysInStage: 21, probability: 25 },
  { id: "deal-005", name: "Midwest Distribution Hub", type: "acquisition", stage: "due-diligence", value: 33500000, capRate: 7.1, property_type: "Industrial", city: "Columbus", state: "OH", contact: "David Park", daysInStage: 10, probability: 65 },
  { id: "deal-006", name: "Parkside Mixed-Use", type: "acquisition", stage: "underwriting", value: 52800000, capRate: 5.6, property_type: "Mixed-Use", city: "Charlotte", state: "NC", contact: "Amanda Foster", daysInStage: 4, probability: 38 },
  { id: "deal-007", name: "Industrial Portfolio (3 assets)", type: "disposition", stage: "sourcing", value: 28700000, capRate: 6.5, property_type: "Industrial", city: "Phoenix", state: "AZ", contact: "Robert Kim", daysInStage: 30, probability: 15 },
  { id: "deal-008", name: "Downtown Office Tower", type: "acquisition", stage: "closed", value: 125000000, capRate: 5.1, property_type: "Office", city: "Atlanta", state: "GA", contact: "Victoria Lane", daysInStage: 0, probability: 100 },
];

export const alerts: Alert[] = [
  { id: "a-001", propertyId: "prop-007", propertyName: "Skyline Lofts", type: "vacancy", severity: "high", message: "Occupancy dropped to 68.4% — 30 units vacant. Immediate leasing strategy needed.", timestamp: "2026-03-29T08:30:00Z", acknowledged: false },
  { id: "a-002", propertyId: "prop-005", propertyName: "The Atrium", type: "vacancy", severity: "high", message: "Retail occupancy at 78.1%. 7 units vacant — consider tenant incentive program.", timestamp: "2026-03-28T14:15:00Z", acknowledged: false },
  { id: "a-003", propertyId: "prop-002", propertyName: "Pacific Heights Plaza", type: "lease-expiry", severity: "medium", message: "NovaBio Sciences lease (Floors 8-9) expires Feb 2026. $142K/mo at risk.", timestamp: "2026-03-27T10:00:00Z", acknowledged: true },
  { id: "a-004", propertyId: "prop-001", propertyName: "Meridian Tower", type: "maintenance", severity: "medium", message: "HVAC system in Building B requires scheduled maintenance — overdue by 15 days.", timestamp: "2026-03-26T16:45:00Z", acknowledged: false },
  { id: "a-005", propertyId: "prop-007", propertyName: "Skyline Lofts", type: "payment", severity: "high", message: "Sterling Design Studio (Unit 4C) — 45 days past due. $6,400 outstanding.", timestamp: "2026-03-25T09:20:00Z", acknowledged: false },
  { id: "a-006", propertyId: "prop-001", propertyName: "Meridian Tower", type: "lease-expiry", severity: "low", message: "Horizon Tech Labs lease expires May 2026. Early renewal discussions recommended.", timestamp: "2026-03-24T11:30:00Z", acknowledged: true },
  { id: "a-007", propertyId: "prop-003", propertyName: "Riverside Commons", type: "market", severity: "low", message: "Austin multifamily vacancy rates trending up +0.8% QoQ. Monitor competitive positioning.", timestamp: "2026-03-23T08:00:00Z", acknowledged: true },
  { id: "a-008", propertyId: "prop-006", propertyName: "Harborview Residences", type: "maintenance", severity: "medium", message: "Elevator modernization project — Phase 2 scheduled to begin April 15.", timestamp: "2026-03-22T13:10:00Z", acknowledged: true },
];

export const marketData: MarketData[] = [
  { region: "Miami-Dade, FL", medianPrice: 485000, pricePerSqft: 342, yoyChange: 8.2, avgCapRate: 5.6, vacancyRate: 4.8, daysOnMarket: 32, inventory: 12400 },
  { region: "San Francisco, CA", medianPrice: 1250000, pricePerSqft: 895, yoyChange: -2.1, avgCapRate: 4.8, vacancyRate: 8.2, daysOnMarket: 45, inventory: 5800 },
  { region: "Austin, TX", medianPrice: 425000, pricePerSqft: 268, yoyChange: 5.4, avgCapRate: 5.9, vacancyRate: 6.1, daysOnMarket: 38, inventory: 9200 },
  { region: "Dallas-Fort Worth, TX", medianPrice: 378000, pricePerSqft: 195, yoyChange: 4.8, avgCapRate: 6.4, vacancyRate: 5.2, daysOnMarket: 29, inventory: 18500 },
  { region: "Nashville, TN", medianPrice: 415000, pricePerSqft: 285, yoyChange: 6.1, avgCapRate: 6.8, vacancyRate: 5.9, daysOnMarket: 34, inventory: 7100 },
  { region: "Boston, MA", medianPrice: 695000, pricePerSqft: 520, yoyChange: 3.2, avgCapRate: 4.6, vacancyRate: 3.1, daysOnMarket: 28, inventory: 4200 },
  { region: "Chicago, IL", medianPrice: 315000, pricePerSqft: 218, yoyChange: 1.8, avgCapRate: 6.2, vacancyRate: 7.4, daysOnMarket: 42, inventory: 15800 },
  { region: "Denver, CO", medianPrice: 545000, pricePerSqft: 325, yoyChange: 4.1, avgCapRate: 5.5, vacancyRate: 5.8, daysOnMarket: 31, inventory: 6900 },
];

export const revenueHistory = [
  { month: "Apr '25", revenue: 2980000, expenses: 1920000, noi: 1060000, occupancy: 91.2 },
  { month: "May '25", revenue: 3045000, expenses: 1895000, noi: 1150000, occupancy: 91.8 },
  { month: "Jun '25", revenue: 3120000, expenses: 1940000, noi: 1180000, occupancy: 92.1 },
  { month: "Jul '25", revenue: 3085000, expenses: 2010000, noi: 1075000, occupancy: 91.5 },
  { month: "Aug '25", revenue: 3150000, expenses: 1960000, noi: 1190000, occupancy: 92.4 },
  { month: "Sep '25", revenue: 3200000, expenses: 1985000, noi: 1215000, occupancy: 92.8 },
  { month: "Oct '25", revenue: 3180000, expenses: 2050000, noi: 1130000, occupancy: 92.2 },
  { month: "Nov '25", revenue: 3095000, expenses: 1990000, noi: 1105000, occupancy: 91.6 },
  { month: "Dec '25", revenue: 3250000, expenses: 2080000, noi: 1170000, occupancy: 92.5 },
  { month: "Jan '26", revenue: 3180000, expenses: 2020000, noi: 1160000, occupancy: 92.0 },
  { month: "Feb '26", revenue: 3290000, expenses: 1975000, noi: 1315000, occupancy: 93.1 },
  { month: "Mar '26", revenue: 3345000, expenses: 2015000, noi: 1330000, occupancy: 93.4 },
];

export const portfolioSummary = {
  totalProperties: properties.length,
  totalUnits: properties.reduce((sum, p) => sum + p.units, 0),
  totalSqft: properties.reduce((sum, p) => sum + p.sqft, 0),
  totalValue: properties.reduce((sum, p) => sum + p.value, 0),
  avgOccupancy: properties.reduce((sum, p) => sum + p.occupancy, 0) / properties.length,
  totalMonthlyRevenue: properties.reduce((sum, p) => sum + p.monthlyRevenue, 0),
  totalAnnualNOI: properties.reduce((sum, p) => sum + p.annualNOI, 0),
  avgCapRate: properties.reduce((sum, p) => sum + p.capRate, 0) / properties.length,
};
