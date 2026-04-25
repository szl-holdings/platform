/**
 * Terra Portfolio Intelligence — list/portfolio-level endpoints (public, read-only)
 *
 * These complement terra-property-intel.ts by serving the portfolio/list views
 * that were previously hardcoded as constants in the frontend pages. The data
 * shapes mirror the existing per-property module data so the UI can consume both
 * the property-scoped GETs and these list endpoints with the same schemas.
 *
 * GUARDRAIL: Read-only GETs only. Registered in groups/terra.ts BEFORE the
 * tenantScope middleware so unauthenticated demo visitors can fetch results.
 */

import { db, terraPortfolioModulesTable } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const authOptional = authMiddleware({ required: false });

type ModuleKey =
  | 'climate-risk'
  | 'zoning'
  | 'neighborhood-momentum'
  | 'seller-motivation'
  | 'spatial-walkthrough'
  | 'portfolio-dashboard';

const PAYLOAD_CACHE = new Map<ModuleKey, { payload: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

async function readModulePayload(key: ModuleKey, fallback: unknown): Promise<unknown> {
  const cached = PAYLOAD_CACHE.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.payload;
  try {
    const rows = await db
      .select({ payload: terraPortfolioModulesTable.payload })
      .from(terraPortfolioModulesTable)
      .where(eq(terraPortfolioModulesTable.module, key))
      .limit(1);
    const payload = rows[0]?.payload ?? fallback;
    PAYLOAD_CACHE.set(key, { payload, expiresAt: now + CACHE_TTL_MS });
    return payload;
  } catch {
    return fallback;
  }
}

export async function seedTerraPortfolioModules(): Promise<void> {
  const entries: Array<{ module: ModuleKey; payload: unknown }> = [
    { module: 'climate-risk', payload: { properties: CLIMATE_PORTFOLIO } },
    { module: 'zoning', payload: { parcels: ZONING_PARCELS } },
    { module: 'neighborhood-momentum', payload: { neighborhoods: NEIGHBORHOODS } },
    { module: 'seller-motivation', payload: { sellers: SELLERS } },
    { module: 'spatial-walkthrough', payload: { property: SPATIAL_DEMO_PROPERTY } },
    { module: 'portfolio-dashboard', payload: PORTFOLIO_DASHBOARD_PAYLOAD },
  ];
  for (const e of entries) {
    await db
      .insert(terraPortfolioModulesTable)
      .values({ module: e.module, payload: e.payload as object })
      .onConflictDoNothing();
  }
  PAYLOAD_CACHE.clear();
}

// ---------------------------------------------------------------------------
// Climate Risk Portfolio
// ---------------------------------------------------------------------------
const CLIMATE_PORTFOLIO = [
  {
    id: 'cp-1',
    name: 'One Market Plaza',
    address: '1 Market Plaza',
    location: 'San Francisco, CA',
    type: 'Commercial',
    value: 48_000_000,
    overallRiskScore: 62,
    overallGrade: 'B',
    annualInsurance: 2_100_000,
    insuranceAdjustment: 34,
    valuationHaircut: 8,
    adaptationCost: 4_200_000,
    thirtyYearExpectedLoss: 6_100_000,
    regulatoryFlags: ['SB 54 — Climate Disclosure (CA)', 'SEC Climate Risk Rule (Final)'],
    hazards: [
      {
        type: 'seismic',
        current: 'High',
        projected2030: 'High',
        projected2050: 'High',
        trend: 'stable',
        detail: 'Located 0.8mi from Hayward Fault. Site class D soils. Estimated PML: 18%.',
      },
      {
        type: 'flood',
        current: 'Low',
        projected2030: 'Low',
        projected2050: 'Medium',
        trend: 'increasing',
        detail: 'Outside current SFHA. 2050 sea level rise projections push to marginal risk zone.',
      },
      {
        type: 'heat',
        current: 'Low',
        projected2030: 'Low',
        projected2050: 'Low',
        trend: 'stable',
        detail: 'Bay microclimate modulates heat exposure. Minimal risk through 2050.',
      },
      {
        type: 'wildfire',
        current: 'Medium',
        projected2030: 'Medium',
        projected2050: 'High',
        trend: 'increasing',
        detail: 'Wildland-urban interface risk via East Bay hills. Smoke exposure increasing.',
      },
      {
        type: 'storm',
        current: 'Low',
        projected2030: 'Medium',
        projected2050: 'Medium',
        trend: 'increasing',
        detail:
          'Atmospheric river intensification projected. 100-year storm frequency compressing.',
      },
    ],
  },
  {
    id: 'cp-2',
    name: 'South Beach Retail',
    address: '100 Ocean Dr',
    location: 'Miami, FL',
    type: 'Retail',
    value: 12_000_000,
    overallRiskScore: 89,
    overallGrade: 'D',
    annualInsurance: 1_400_000,
    insuranceAdjustment: 87,
    valuationHaircut: 22,
    adaptationCost: 3_800_000,
    thirtyYearExpectedLoss: 8_900_000,
    regulatoryFlags: [
      'HB 1557 — Mandatory Flood Disclosure (FL)',
      'FEMA SFHA Zone AE',
      'Miami-Dade Sea Level Rise Ordinance',
    ],
    hazards: [
      {
        type: 'flood',
        current: 'Critical',
        projected2030: 'Critical',
        projected2050: 'Critical',
        trend: 'increasing',
        detail:
          'FEMA Zone AE. Street-level flooding now occurring during king tides. Annual flood probability >40% by 2035.',
      },
      {
        type: 'sea-level',
        current: 'High',
        projected2030: 'Critical',
        projected2050: 'Critical',
        trend: 'increasing',
        detail: '2.1ft SLR projected by 2060. Property currently 3.4ft above mean sea level.',
      },
      {
        type: 'storm',
        current: 'High',
        projected2030: 'High',
        projected2050: 'Critical',
        trend: 'increasing',
        detail:
          'Direct hurricane path exposure. Category 4+ wind zone. Insurance withdrawals accelerating.',
      },
      {
        type: 'heat',
        current: 'High',
        projected2030: 'High',
        projected2050: 'Critical',
        trend: 'increasing',
        detail: '28+ days >95°F by 2040. Outdoor retail occupancy increasingly constrained.',
      },
      {
        type: 'wildfire',
        current: 'Negligible',
        projected2030: 'Negligible',
        projected2050: 'Negligible',
        trend: 'stable',
        detail: 'No significant wildfire exposure.',
      },
      {
        type: 'seismic',
        current: 'Negligible',
        projected2030: 'Negligible',
        projected2050: 'Negligible',
        trend: 'stable',
        detail: 'No significant seismic exposure.',
      },
    ],
  },
  {
    id: 'cp-3',
    name: 'Austin Mixed-Use Tower',
    address: '400 Congress Ave',
    location: 'Austin, TX',
    type: 'Mixed-Use',
    value: 31_000_000,
    overallRiskScore: 76,
    overallGrade: 'C+',
    annualInsurance: 1_200_000,
    insuranceAdjustment: 52,
    valuationHaircut: 12,
    adaptationCost: 2_100_000,
    thirtyYearExpectedLoss: 5_200_000,
    regulatoryFlags: ['SEC Climate Risk Rule (Final)', 'Texas Grid Resilience Requirements'],
    hazards: [
      {
        type: 'heat',
        current: 'Critical',
        projected2030: 'Critical',
        projected2050: 'Critical',
        trend: 'increasing',
        detail:
          '47+ days >100°F projected by 2045. Grid stress risk during peak demand. HVAC costs +68% by 2040.',
      },
      {
        type: 'flood',
        current: 'Medium',
        projected2030: 'High',
        projected2050: 'High',
        trend: 'increasing',
        detail:
          'Shoal Creek 100-yr floodplain adjacent. 2021 freeze event highlighted infrastructure fragility.',
      },
      {
        type: 'storm',
        current: 'Medium',
        projected2030: 'High',
        projected2050: 'High',
        trend: 'increasing',
        detail: 'Severe convective storm frequency increasing. Hail, tornado risk elevated.',
      },
      {
        type: 'wildfire',
        current: 'Medium',
        projected2030: 'High',
        projected2050: 'High',
        trend: 'increasing',
        detail: 'Central Texas wildland-urban interface expanding rapidly.',
      },
      {
        type: 'sea-level',
        current: 'Negligible',
        projected2030: 'Negligible',
        projected2050: 'Negligible',
        trend: 'stable',
        detail: 'Inland location. No sea level exposure.',
      },
      {
        type: 'seismic',
        current: 'Low',
        projected2030: 'Low',
        projected2050: 'Low',
        trend: 'stable',
        detail:
          'Low natural seismic risk. Induced seismicity from wastewater injection negligible at this location.',
      },
    ],
  },
  {
    id: 'cp-4',
    name: 'Silicon Valley Industrial',
    address: '880 N McCarthy Blvd',
    location: 'San Jose, CA',
    type: 'Industrial',
    value: 22_000_000,
    overallRiskScore: 71,
    overallGrade: 'B-',
    annualInsurance: 1_800_000,
    insuranceAdjustment: 41,
    valuationHaircut: 9,
    adaptationCost: 1_600_000,
    thirtyYearExpectedLoss: 4_100_000,
    regulatoryFlags: [
      'SB 54 — Climate Disclosure (CA)',
      'Santa Clara Valley Water District Flood Rules',
    ],
    hazards: [
      {
        type: 'seismic',
        current: 'High',
        projected2030: 'High',
        projected2050: 'High',
        trend: 'stable',
        detail: '0.3mi from Calaveras Fault. Soil liquefaction zone class C. PML: 22%.',
      },
      {
        type: 'wildfire',
        current: 'Medium',
        projected2030: 'High',
        projected2050: 'High',
        trend: 'increasing',
        detail:
          'Diablo Range wildfire exposure increasing. 2020 fires directly impacted air quality significantly.',
      },
      {
        type: 'flood',
        current: 'Low',
        projected2030: 'Medium',
        projected2050: 'Medium',
        trend: 'increasing',
        detail:
          'Guadalupe River 500-year flood zone. Climate amplification could increase frequency.',
      },
      {
        type: 'heat',
        current: 'Medium',
        projected2030: 'Medium',
        projected2050: 'High',
        trend: 'increasing',
        detail: 'Inland heat amplification. Data center cooling costs projected up 44%.',
      },
      {
        type: 'storm',
        current: 'Low',
        projected2030: 'Low',
        projected2050: 'Medium',
        trend: 'increasing',
        detail: 'Atmospheric river events increasing in intensity and frequency.',
      },
      {
        type: 'sea-level',
        current: 'Negligible',
        projected2030: 'Low',
        projected2050: 'Low',
        trend: 'increasing',
        detail: 'South Bay exposure marginal through 2050.',
      },
    ],
  },
  {
    id: 'cp-5',
    name: 'Pacific Heights Apts',
    address: '2850 Broadway',
    location: 'San Francisco, CA',
    type: 'Residential',
    value: 14_000_000,
    overallRiskScore: 58,
    overallGrade: 'B+',
    annualInsurance: 890_000,
    insuranceAdjustment: 28,
    valuationHaircut: 6,
    adaptationCost: 980_000,
    thirtyYearExpectedLoss: 2_800_000,
    regulatoryFlags: ['SB 54 — Climate Disclosure (CA)', 'SF Mandatory Seismic Retrofit Ordinance'],
    hazards: [
      {
        type: 'seismic',
        current: 'High',
        projected2030: 'High',
        projected2050: 'High',
        trend: 'stable',
        detail:
          'Pre-1978 wood-frame construction. Mandatory retrofit complete. Residual risk moderate.',
      },
      {
        type: 'wildfire',
        current: 'Medium',
        projected2030: 'Medium',
        projected2050: 'High',
        trend: 'increasing',
        detail: 'Smoke exposure risk increasing. Structure itself in low fire hazard zone.',
      },
      {
        type: 'flood',
        current: 'Low',
        projected2030: 'Low',
        projected2050: 'Low',
        trend: 'stable',
        detail: 'Elevated hilltop site. Minimal flood exposure through 2060.',
      },
      {
        type: 'heat',
        current: 'Low',
        projected2030: 'Low',
        projected2050: 'Low',
        trend: 'stable',
        detail: 'Bay fog belt location moderates heat. AC penetration <30% building stock.',
      },
      {
        type: 'storm',
        current: 'Low',
        projected2030: 'Medium',
        projected2050: 'Medium',
        trend: 'increasing',
        detail: 'Atmospheric river exposure. Ridge site has wind exposure.',
      },
      {
        type: 'sea-level',
        current: 'Negligible',
        projected2030: 'Negligible',
        projected2050: 'Negligible',
        trend: 'stable',
        detail: 'Hillside site. No direct sea level exposure.',
      },
    ],
  },
];

router.get('/terra/portfolio/climate-risk', authOptional, async (_req: Request, res: Response) => {
  try {
    const payload = await readModulePayload('climate-risk', { properties: CLIMATE_PORTFOLIO });
    sendSuccess(res, {
      ...(payload as object),
      dataMode: 'persisted',
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load climate portfolio');
  }
});

// ---------------------------------------------------------------------------
// Zoning Portfolio
// ---------------------------------------------------------------------------
const ZONING_PARCELS = [
  {
    id: 'zp-1',
    address: '2400 Market St, Philadelphia, PA 19103',
    currentZoning: 'CMX-3',
    zoningDescription: 'Commercial Mixed-Use (Medium Intensity)',
    lotSizeSqft: 18500,
    currentFar: 1.2,
    maxFar: 5.0,
    currentUnits: 0,
    maxUnits: 92,
    setbacks: { front: 0, side: 0, rear: 10 },
    maxHeight: 85,
    overlayDistricts: ['Transit-Oriented Development', 'Opportunity Zone'],
    scenarios: [
      {
        id: 's1',
        name: 'As-of-Right Mixed Use',
        type: 'Mixed Use',
        units: 62,
        grossSqft: 82000,
        far: 4.4,
        stories: 6,
        parkingSpaces: 31,
        estimatedRevenue: 24800000,
        constructionCost: 18500000,
        landValue: 3200000,
        residualLandValue: 3100000,
        requiresVariance: false,
        varianceProbability: 100,
        timelineMonths: 24,
      },
      {
        id: 's2',
        name: 'Maximum Density Residential',
        type: 'Multifamily',
        units: 92,
        grossSqft: 92500,
        far: 5.0,
        stories: 7,
        parkingSpaces: 46,
        estimatedRevenue: 31050000,
        constructionCost: 22800000,
        landValue: 3200000,
        residualLandValue: 5050000,
        requiresVariance: true,
        varianceProbability: 72,
        timelineMonths: 30,
      },
      {
        id: 's3',
        name: 'Office + Retail',
        type: 'Commercial',
        units: 0,
        grossSqft: 75000,
        far: 4.0,
        stories: 5,
        parkingSpaces: 50,
        estimatedRevenue: 22500000,
        constructionCost: 19200000,
        landValue: 3200000,
        residualLandValue: 100000,
        requiresVariance: false,
        varianceProbability: 100,
        timelineMonths: 22,
      },
      {
        id: 's4',
        name: 'Boutique Hotel + Retail',
        type: 'Hospitality',
        units: 85,
        grossSqft: 68000,
        far: 3.7,
        stories: 5,
        parkingSpaces: 20,
        estimatedRevenue: 28900000,
        constructionCost: 21600000,
        landValue: 3200000,
        residualLandValue: 4100000,
        requiresVariance: true,
        varianceProbability: 58,
        timelineMonths: 28,
      },
    ],
    varianceHistory: [
      {
        year: 2023,
        type: 'Height',
        requested: '95 ft (vs 85 ft max)',
        result: 'approved',
        conditions: 'Design review panel approval, enhanced streetscape',
      },
      {
        year: 2022,
        type: 'Parking',
        requested: 'Reduce from 1:1 to 0.5:1 ratio',
        result: 'approved',
        conditions: 'Transit proximity, bike storage, TDM plan',
      },
      {
        year: 2021,
        type: 'Use',
        requested: 'Outdoor dining in setback',
        result: 'approved',
        conditions: 'Seasonal only, noise mitigation',
      },
      {
        year: 2020,
        type: 'Density',
        requested: '110 units (vs 92 max)',
        result: 'denied',
        conditions: 'Exceeded community impact threshold',
      },
    ],
  },
  {
    id: 'zp-2',
    address: '800 Fulton St, Brooklyn, NY 11238',
    currentZoning: 'R7A/C2-4',
    zoningDescription: 'Medium-Density Residential / Commercial Overlay',
    lotSizeSqft: 12000,
    currentFar: 0.8,
    maxFar: 4.0,
    currentUnits: 4,
    maxUnits: 48,
    setbacks: { front: 15, side: 8, rear: 30 },
    maxHeight: 75,
    overlayDistricts: ['Inclusionary Housing', 'Arts & Cultural District'],
    scenarios: [
      {
        id: 's5',
        name: 'As-of-Right Residential',
        type: 'Multifamily',
        units: 36,
        grossSqft: 42000,
        far: 3.5,
        stories: 5,
        parkingSpaces: 18,
        estimatedRevenue: 19800000,
        constructionCost: 14200000,
        landValue: 4100000,
        residualLandValue: 1500000,
        requiresVariance: false,
        varianceProbability: 100,
        timelineMonths: 20,
      },
      {
        id: 's6',
        name: 'Affordable Housing Bonus',
        type: 'Multifamily',
        units: 48,
        grossSqft: 48000,
        far: 4.0,
        stories: 6,
        parkingSpaces: 12,
        estimatedRevenue: 18500000,
        constructionCost: 15800000,
        landValue: 4100000,
        residualLandValue: -1400000,
        requiresVariance: false,
        varianceProbability: 100,
        timelineMonths: 24,
      },
    ],
    varianceHistory: [
      {
        year: 2024,
        type: 'Rear Yard',
        requested: '20 ft (vs 30 ft)',
        result: 'approved',
        conditions: 'Community garden access easement',
      },
      {
        year: 2022,
        type: 'Height',
        requested: '85 ft (vs 75 ft)',
        result: 'denied',
        conditions: 'Contextual zoning district',
      },
    ],
  },
];

router.get('/terra/portfolio/zoning', authOptional, async (_req: Request, res: Response) => {
  try {
    const payload = await readModulePayload('zoning', { parcels: ZONING_PARCELS });
    sendSuccess(res, {
      ...(payload as object),
      dataMode: 'persisted',
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load zoning portfolio');
  }
});

// ---------------------------------------------------------------------------
// Neighborhood Momentum Portfolio
// ---------------------------------------------------------------------------
const NEIGHBORHOODS = [
  {
    id: 'n-01',
    name: 'Bushwick',
    borough: 'Brooklyn',
    trajectory: 'accelerating',
    momentumScore: 91,
    priceChangePct: 18.4,
    permitActivity: 87,
    institutionalFlowM: 142,
    populationGrowthPct: 4.2,
    medianPrice: 1_250_000,
    capRateCompression: -1.8,
    lat: 40.6958,
    lng: -73.9226,
    topSignals: [
      'Institutional buyer volume +340%',
      'New restaurant permits +62%',
      'Median days-on-market: 9',
    ],
    description:
      'Strong acceleration driven by creative industry spillover from Williamsburg. Institutional capital rotating in at scale.',
  },
  {
    id: 'n-02',
    name: 'Crown Heights',
    borough: 'Brooklyn',
    trajectory: 'gentrifying',
    momentumScore: 78,
    priceChangePct: 11.2,
    permitActivity: 64,
    institutionalFlowM: 89,
    populationGrowthPct: 2.8,
    medianPrice: 980_000,
    capRateCompression: -0.9,
    lat: 40.6689,
    lng: -73.9503,
    topSignals: [
      'Renovation permits up 48%',
      'Median HHI rising +$18K',
      '3 boutique hotels permitted',
    ],
    description:
      'Classic gentrification pattern: rising permits, demographic shift, early institutional interest. 3-5 year runway.',
  },
  {
    id: 'n-03',
    name: 'East New York',
    borough: 'Brooklyn',
    trajectory: 'gentrifying',
    momentumScore: 68,
    priceChangePct: 7.8,
    permitActivity: 52,
    institutionalFlowM: 61,
    populationGrowthPct: 1.4,
    medianPrice: 710_000,
    capRateCompression: -0.4,
    lat: 40.6643,
    lng: -73.8868,
    topSignals: [
      'Rezoning 2025 activated',
      'Transit investment confirmed',
      'Land assemblage activity emerging',
    ],
    description:
      'City-driven rezoning catalyst. Earliest gentrification stage — highest upside, highest execution risk.',
  },
  {
    id: 'n-04',
    name: 'Ridgewood',
    borough: 'Queens',
    trajectory: 'accelerating',
    momentumScore: 84,
    priceChangePct: 14.6,
    permitActivity: 72,
    institutionalFlowM: 108,
    populationGrowthPct: 3.1,
    medianPrice: 1_090_000,
    capRateCompression: -1.4,
    lat: 40.7003,
    lng: -73.9044,
    topSignals: [
      'Bushwick price compression driving demand',
      'L-train accessible corridor',
      'Multi-family conversion surge',
    ],
    description:
      'Overflow neighborhood from Bushwick hitting inflection. Buyers priced out of core are creating demand surge.',
  },
  {
    id: 'n-05',
    name: 'Wakefield',
    borough: 'Bronx',
    trajectory: 'stable',
    momentumScore: 48,
    priceChangePct: 3.1,
    permitActivity: 29,
    institutionalFlowM: 18,
    populationGrowthPct: 0.4,
    medianPrice: 620_000,
    capRateCompression: 0.1,
    lat: 40.8878,
    lng: -73.8643,
    topSignals: [
      'Cash flow positive market',
      'Low competition, moderate demand',
      'No catalyst identified yet',
    ],
    description:
      'Income-stable, appreciation-limited. Good for yield-focused strategies; minimal appreciation expectation.',
  },
  {
    id: 'n-06',
    name: 'East Flatbush',
    borough: 'Brooklyn',
    trajectory: 'declining',
    momentumScore: 34,
    priceChangePct: -2.4,
    permitActivity: 15,
    institutionalFlowM: 8,
    populationGrowthPct: -1.1,
    medianPrice: 780_000,
    capRateCompression: 0.6,
    lat: 40.6312,
    lng: -73.9278,
    topSignals: [
      'Days-on-market expanding (+34d)',
      'Landlord distress signals rising',
      'Retail vacancy increasing',
    ],
    description:
      'Micro-market losing momentum. Distress buying opportunity emerging, but appreciation thesis weak near-term.',
  },
  {
    id: 'n-07',
    name: 'Brownsville',
    borough: 'Brooklyn',
    trajectory: 'distressed',
    momentumScore: 19,
    priceChangePct: -6.8,
    permitActivity: 8,
    institutionalFlowM: 3,
    populationGrowthPct: -2.4,
    medianPrice: 510_000,
    capRateCompression: 1.4,
    lat: 40.6634,
    lng: -73.9138,
    topSignals: [
      'Highest vacancy rate in borough',
      'Systematic landlord abandonment',
      'Insurance withdrawal risk',
    ],
    description:
      'Deep distress. Contra-cyclical opportunity only — requires patient capital and operational expertise.',
  },
  {
    id: 'n-08',
    name: 'Long Island City',
    borough: 'Queens',
    trajectory: 'accelerating',
    momentumScore: 89,
    priceChangePct: 16.1,
    permitActivity: 94,
    institutionalFlowM: 287,
    populationGrowthPct: 6.8,
    medianPrice: 1_820_000,
    capRateCompression: -2.1,
    lat: 40.7447,
    lng: -73.9484,
    topSignals: [
      'Amazon HQ2 adjacent spillover',
      'Major office-to-resi conversion',
      'Transit megaproject activated',
    ],
    description:
      'Institutional-grade momentum. Cap rate compression accelerating. Prime entry window closing in 12-18 months.',
  },
];

router.get(
  '/terra/portfolio/neighborhood-momentum',
  authOptional,
  async (_req: Request, res: Response) => {
    try {
      const payload = await readModulePayload('neighborhood-momentum', {
        neighborhoods: NEIGHBORHOODS,
      });
      sendSuccess(res, {
        ...(payload as object),
        dataMode: 'persisted',
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load neighborhood portfolio');
    }
  },
);

// ---------------------------------------------------------------------------
// Seller Motivation Portfolio
// ---------------------------------------------------------------------------
const SELLERS = [
  {
    id: 's-001',
    address: '211 Liberty Ave',
    neighborhood: 'East New York',
    ownerName: 'Liberty RE Holdings LLC',
    ownerType: 'LLC',
    debtLoad: 920_000,
    estimatedEquity: 180_000,
    daysInDistress: 127,
    priorOffers: 0,
    listingExpiry: null,
    acceptanceScore: 92,
    acceptanceCategory: 'very-likely',
    suggestedDiscount: 28,
    comparableAcceptances: 7,
    aiInsight:
      'LLC in dissolution with cascading debt. Owner has no equity cushion and foreclosure is imminent. A cash offer with 15-day close will likely be accepted well below market. Comparable distress exits in this zip suggest 25-32% discount range.',
    factors: [
      {
        factor: 'Tax delinquency severity',
        impact: 'positive',
        weight: 0.92,
        description: '5 quarters unpaid — In Rem foreclosure imminent',
      },
      {
        factor: 'LLC dissolution filing',
        impact: 'positive',
        weight: 0.87,
        description: 'Entity unwinding — principals motivated to liquidate',
      },
      {
        factor: 'Days in distress',
        impact: 'positive',
        weight: 0.81,
        description: '127 days — psychological exhaustion threshold exceeded',
      },
      {
        factor: 'Equity position',
        impact: 'positive',
        weight: 0.76,
        description: 'Only $180K equity — can close at significant discount',
      },
      {
        factor: 'No prior offer history',
        impact: 'neutral',
        weight: 0.5,
        description: 'No competing offers detected — no anchoring upward',
      },
      {
        factor: 'Multiple code violations',
        impact: 'positive',
        weight: 0.68,
        description: 'HPD emergency order adding pressure to resolve',
      },
    ],
  },
  {
    id: 's-002',
    address: '1847 Myrtle Ave',
    neighborhood: 'Bushwick',
    ownerName: 'Myrtle Holdings LLC',
    ownerType: 'LLC',
    debtLoad: 1_420_000,
    estimatedEquity: 430_000,
    daysInDistress: 87,
    priorOffers: 1,
    listingExpiry: '2026-05-30',
    acceptanceScore: 74,
    acceptanceCategory: 'likely',
    suggestedDiscount: 18,
    comparableAcceptances: 12,
    aiInsight:
      'Motivated LLC with debt load at 77% LTV on declining NOI. One prior offer rejected — likely too low. Current window is a second approach at a 15-20% discount framed as certainty of execution vs. foreclosure risk. 60-day close preferred.',
    factors: [
      {
        factor: 'Debt-to-equity ratio',
        impact: 'positive',
        weight: 0.79,
        description: '77% LTV — high leverage amplifies distress',
      },
      {
        factor: 'Utility disconnections',
        impact: 'positive',
        weight: 0.71,
        description: 'Service interruptions — operational failure underway',
      },
      {
        factor: 'Code violations',
        impact: 'positive',
        weight: 0.65,
        description: 'Compounding liability risk motivating exit',
      },
      {
        factor: 'Prior rejected offer',
        impact: 'negative',
        weight: 0.42,
        description: 'One offer rejected — may have higher reservation price',
      },
      {
        factor: 'Listing expiry approaching',
        impact: 'positive',
        weight: 0.69,
        description: 'Agent contract expiring — increased willingness to deal direct',
      },
      {
        factor: 'Equity buffer',
        impact: 'negative',
        weight: 0.38,
        description: '$430K equity gives seller patience — not desperate',
      },
    ],
  },
  {
    id: 's-003',
    address: '392 Nostrand Ave',
    neighborhood: 'Crown Heights',
    ownerName: 'Crown Cap Partners',
    ownerType: 'LLC',
    debtLoad: 1_890_000,
    estimatedEquity: 510_000,
    daysInDistress: 64,
    priorOffers: 2,
    listingExpiry: '2026-06-15',
    acceptanceScore: 61,
    acceptanceCategory: 'possible',
    suggestedDiscount: 12,
    comparableAcceptances: 4,
    aiInsight:
      'Mixed motivation. Substantial equity creates patience, but permit liability ($240K) and LLC restructuring create urgency vectors. Two prior offers suggest an active market — differentiate on certainty and speed rather than just price.',
    factors: [
      {
        factor: 'Permit lapse liability',
        impact: 'positive',
        weight: 0.72,
        description: '$240K exposed construction liability — growing pressure',
      },
      {
        factor: 'LLC restructuring',
        impact: 'positive',
        weight: 0.66,
        description: 'Manager transfers suggest entity stress',
      },
      {
        factor: 'Tax delinquency',
        impact: 'positive',
        weight: 0.64,
        description: 'Lien filing imminent per DOF schedule',
      },
      {
        factor: 'Strong equity position',
        impact: 'negative',
        weight: 0.61,
        description: '$510K equity — seller can afford to wait',
      },
      {
        factor: 'Prior offer competition',
        impact: 'negative',
        weight: 0.55,
        description: '2 prior offers — seller has leverage & precedent',
      },
      {
        factor: 'Days in distress',
        impact: 'neutral',
        weight: 0.44,
        description: '64 days — early enough that patience remains',
      },
    ],
  },
  {
    id: 's-004',
    address: '78 Covert St',
    neighborhood: 'Ridgewood',
    ownerName: 'Covert Street Partners',
    ownerType: 'LLC',
    debtLoad: 980_000,
    estimatedEquity: 640_000,
    daysInDistress: 30,
    priorOffers: 3,
    listingExpiry: '2026-07-01',
    acceptanceScore: 34,
    acceptanceCategory: 'unlikely',
    suggestedDiscount: 5,
    comparableAcceptances: 1,
    aiInsight:
      'Seller has substantial equity and strong Ridgewood market tailwinds. Three prior offers demonstrate active demand at or near market. Below-market offer will likely be rejected. Monitor for 90 days — if NOD escalates, motivation will shift significantly.',
    factors: [
      {
        factor: 'Equity position',
        impact: 'negative',
        weight: 0.82,
        description: '$640K equity — no pressure to discount',
      },
      {
        factor: 'Strong market trajectory',
        impact: 'negative',
        weight: 0.78,
        description: "Ridgewood accelerating — time is on seller's side",
      },
      {
        factor: 'Multiple competing offers',
        impact: 'negative',
        weight: 0.74,
        description: '3 prior offers — seller knows market value',
      },
      {
        factor: 'Early distress stage',
        impact: 'negative',
        weight: 0.61,
        description: 'Only 30 days in distress — psychology intact',
      },
      {
        factor: 'Partial utility disruption',
        impact: 'positive',
        weight: 0.32,
        description: 'Minor cashflow signal — not yet motivating',
      },
      {
        factor: 'Lender NOD issued',
        impact: 'positive',
        weight: 0.48,
        description: 'Notice of default — escalating timeline if not resolved',
      },
    ],
  },
  {
    id: 's-005',
    address: '5519 Flatlands Ave',
    neighborhood: 'East Flatbush',
    ownerName: 'Eugene Watts',
    ownerType: 'individual',
    debtLoad: 640_000,
    estimatedEquity: 250_000,
    daysInDistress: 45,
    priorOffers: 0,
    listingExpiry: null,
    acceptanceScore: 67,
    acceptanceCategory: 'likely',
    suggestedDiscount: 15,
    comparableAcceptances: 3,
    aiInsight:
      'Individual owner-occupant facing gas disconnection and code violations. Personal hardship signals are strong — utility shutoff in a residential context suggests payment inability. A compassionate direct outreach with a fair offer may be well-received.',
    factors: [
      {
        factor: 'Gas service terminated',
        impact: 'positive',
        weight: 0.81,
        description: 'Owner-occupant hardship — personal motivation strong',
      },
      {
        factor: 'Code violations accumulating',
        impact: 'positive',
        weight: 0.68,
        description: 'Remediation cost exceeding owner capacity',
      },
      {
        factor: 'Individual owner psychology',
        impact: 'positive',
        weight: 0.64,
        description: 'No institutional sophistication — simpler negotiation',
      },
      {
        factor: 'No prior offers',
        impact: 'neutral',
        weight: 0.5,
        description: 'No market anchoring — clean slate for negotiation',
      },
      {
        factor: 'Declining neighborhood',
        impact: 'positive',
        weight: 0.55,
        description: 'East Flatbush declining — owner aware of trajectory',
      },
      {
        factor: 'Some equity cushion',
        impact: 'negative',
        weight: 0.41,
        description: '$250K equity provides some patience',
      },
    ],
  },
];

router.get(
  '/terra/portfolio/seller-motivation',
  authOptional,
  async (_req: Request, res: Response) => {
    try {
      const payload = await readModulePayload('seller-motivation', { sellers: SELLERS });
      sendSuccess(res, {
        ...(payload as object),
        dataMode: 'persisted',
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load seller portfolio');
    }
  },
);

// ---------------------------------------------------------------------------
// Spatial Walkthrough — Demo Property
// ---------------------------------------------------------------------------
const SPATIAL_DEMO_PROPERTY = {
  id: 'sw-1',
  address: '425 Park Ave, New York, NY 10022',
  type: 'Luxury Penthouse',
  totalSqft: 3850,
  bedrooms: 3,
  bathrooms: 3,
  stories: 1,
  rooms: [
    {
      id: 'r1',
      name: 'Living Room',
      sqft: 680,
      ceiling: 11.5,
      condition: 'excellent',
      features: [
        'Floor-to-ceiling windows (south exposure)',
        'White oak herringbone flooring',
        'Gas fireplace with marble surround',
        'Custom millwork paneling',
      ],
      measurements: [
        { label: 'Width', value: '26\' 2"' },
        { label: 'Length', value: '26\' 0"' },
        { label: 'Window Wall', value: '24\' 8"' },
        { label: 'Ceiling', value: '11\' 6"' },
      ],
      renovationOptions: [
        {
          name: 'Smart Home Integration',
          cost: 28000,
          valueAdd: 45000,
          timelineDays: 14,
          description:
            'Lutron HomeWorks whole-home automation — lighting, shades, climate, AV. Voice + app control.',
        },
        {
          name: 'Window Treatment Upgrade',
          cost: 18500,
          valueAdd: 22000,
          timelineDays: 21,
          description:
            'Motorized blackout/sheer dual shades. Solar fabric for UV protection without blocking views.',
        },
      ],
    },
    {
      id: 'r2',
      name: 'Primary Bedroom',
      sqft: 520,
      ceiling: 10,
      condition: 'excellent',
      features: [
        'Walk-in closet (120 SF)',
        'En-suite bathroom',
        'Blackout motorized shades',
        'Recessed accent lighting',
      ],
      measurements: [
        { label: 'Width', value: '22\' 4"' },
        { label: 'Length', value: '23\' 3"' },
        { label: 'Closet', value: "12' × 10'" },
        { label: 'Ceiling', value: '10\' 0"' },
      ],
      renovationOptions: [
        {
          name: 'Closet System',
          cost: 15000,
          valueAdd: 20000,
          timelineDays: 7,
          description:
            'Italian-made custom closet with LED lighting, island dresser, and jewelry drawers.',
        },
      ],
    },
    {
      id: 'r3',
      name: 'Kitchen',
      sqft: 380,
      ceiling: 10,
      condition: 'good',
      features: [
        'Miele appliance package',
        'Calacatta marble countertops',
        'Custom Italian cabinetry',
        'Wine cooler (48 bottles)',
        'Pot filler',
      ],
      measurements: [
        { label: 'Width', value: '16\' 8"' },
        { label: 'Length', value: '22\' 9"' },
        { label: 'Island', value: '8\' 6" × 4\' 2"' },
        { label: 'Ceiling', value: '10\' 0"' },
      ],
      renovationOptions: [
        {
          name: 'Appliance Upgrade to Gaggenau',
          cost: 42000,
          valueAdd: 55000,
          timelineDays: 14,
          description:
            'Full Gaggenau 400 series. Steam oven, induction cooktop, speed microwave, column fridge/freezer.',
        },
        {
          name: 'Backsplash Refresh',
          cost: 8500,
          valueAdd: 12000,
          timelineDays: 5,
          description: 'Book-matched Calacatta slab backsplash replacing existing subway tile.',
        },
      ],
    },
    {
      id: 'r4',
      name: 'Primary Bathroom',
      sqft: 240,
      ceiling: 10,
      condition: 'fair',
      features: ['Soaking tub', 'Frameless glass shower', 'Heated floors', 'Double vanity'],
      measurements: [
        { label: 'Width', value: '12\' 0"' },
        { label: 'Length', value: '20\' 0"' },
        { label: 'Shower', value: "5' × 4'" },
        { label: 'Tub', value: "6' freestanding" },
      ],
      renovationOptions: [
        {
          name: 'Full Bathroom Renovation',
          cost: 85000,
          valueAdd: 120000,
          timelineDays: 42,
          description:
            'Dornbracht fixtures. Heated towel bars. LED mirror. Re-tile in large-format porcelain. New stone counters.',
        },
        {
          name: 'Fixture Upgrade Only',
          cost: 22000,
          valueAdd: 30000,
          timelineDays: 10,
          description:
            'Replace fixtures with Waterworks collection. Chrome to brushed nickel transition.',
        },
      ],
    },
    {
      id: 'r5',
      name: 'Terrace',
      sqft: 450,
      ceiling: 0,
      condition: 'good',
      features: [
        '360° city views',
        'IPE wood decking',
        'Built-in planters',
        'Gas line for outdoor kitchen',
        'Drainage system',
      ],
      measurements: [
        { label: 'Width', value: '30\' 0"' },
        { label: 'Depth', value: '15\' 0"' },
        { label: 'Railing Height', value: '42"' },
        { label: 'Weight Capacity', value: '100 PSF' },
      ],
      renovationOptions: [
        {
          name: 'Outdoor Kitchen Build-out',
          cost: 65000,
          valueAdd: 85000,
          timelineDays: 28,
          description:
            'Lynx professional grill, refrigerator, sink, and bar counter. Covered pergola with heaters.',
        },
      ],
    },
  ],
  stagingPresets: [
    {
      id: 'sp1',
      name: 'Modern Minimalist',
      style: 'Contemporary',
      monthlyRent: 42000,
      furnishingCost: 185000,
      items: [
        'B&B Italia sectional',
        'Minotti dining set',
        'Flos lighting collection',
        'Poliform bedroom suite',
        'Custom art curation',
      ],
    },
    {
      id: 'sp2',
      name: 'Classic Luxury',
      style: 'Transitional',
      monthlyRent: 45000,
      furnishingCost: 220000,
      items: [
        'Ralph Lauren Home sofa',
        'Restoration Hardware dining',
        'Visual Comfort chandeliers',
        'Baker bedroom furniture',
        'Curated antiques',
      ],
    },
    {
      id: 'sp3',
      name: 'Tech Executive',
      style: 'Modern Industrial',
      monthlyRent: 40000,
      furnishingCost: 165000,
      items: [
        'Herman Miller Eames collection',
        'CB2 dining ensemble',
        'Artemide task lighting',
        'Room & Board bedroom',
        'Abstract art selection',
      ],
    },
  ],
};

router.get(
  '/terra/portfolio/spatial-walkthrough',
  authOptional,
  async (_req: Request, res: Response) => {
    try {
      const payload = await readModulePayload('spatial-walkthrough', {
        property: SPATIAL_DEMO_PROPERTY,
      });
      sendSuccess(res, {
        ...(payload as object),
        dataMode: 'persisted',
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load spatial walkthrough demo');
    }
  },
);

// ---------------------------------------------------------------------------
// Portfolio Dashboard (asset list + NOI trend + asset allocation)
// ---------------------------------------------------------------------------
const PORTFOLIO_DASHBOARD_ASSETS = [
  {
    id: 'P001',
    name: 'The Meridian',
    type: 'Multifamily',
    location: 'Williamsburg, BK',
    acquisition_date: 'Mar 2021',
    acquisition_price: 24800000,
    current_value: 31200000,
    noi_annual: 1720000,
    noi_change_pct: 6.8,
    occupancy_pct: 96.2,
    cap_rate: 5.5,
    debt_amount: 14880000,
    equity_value: 16320000,
    irr_pct: 18.4,
    status: 'performing',
    units: 54,
    sqft: 58000,
  },
  {
    id: 'P002',
    name: 'Corsair Plaza',
    type: 'Mixed Use',
    location: 'LIC, Queens',
    acquisition_date: 'Sep 2022',
    acquisition_price: 18200000,
    current_value: 21400000,
    noi_annual: 1240000,
    noi_change_pct: 4.2,
    occupancy_pct: 91.4,
    cap_rate: 5.8,
    debt_amount: 10920000,
    equity_value: 10480000,
    irr_pct: 14.2,
    status: 'performing',
    units: 32,
    sqft: 42000,
  },
  {
    id: 'P003',
    name: '125 Pine Commerce',
    type: 'Office',
    location: 'Downtown Manhattan',
    acquisition_date: 'Jan 2020',
    acquisition_price: 42400000,
    current_value: 36800000,
    noi_annual: 2680000,
    noi_change_pct: -8.4,
    occupancy_pct: 74.0,
    cap_rate: 7.3,
    debt_amount: 25440000,
    equity_value: 11360000,
    irr_pct: -4.2,
    status: 'critical',
    sqft: 180000,
  },
  {
    id: 'P004',
    name: 'Thornfield Residences',
    type: 'Multifamily',
    location: 'Astoria, Queens',
    acquisition_date: 'Jun 2022',
    acquisition_price: 14600000,
    current_value: 17200000,
    noi_annual: 1020000,
    noi_change_pct: 8.1,
    occupancy_pct: 98.0,
    cap_rate: 5.9,
    debt_amount: 8760000,
    equity_value: 8440000,
    irr_pct: 16.8,
    status: 'performing',
    units: 38,
    sqft: 38400,
  },
  {
    id: 'P005',
    name: 'Brooklyn Navy Industrial',
    type: 'Industrial',
    location: 'Navy Yard, BK',
    acquisition_date: 'Nov 2023',
    acquisition_price: 28400000,
    current_value: 29200000,
    noi_annual: 1840000,
    noi_change_pct: 2.4,
    occupancy_pct: 100,
    cap_rate: 6.3,
    debt_amount: 17040000,
    equity_value: 12160000,
    irr_pct: 8.2,
    status: 'performing',
    sqft: 82000,
  },
  {
    id: 'P006',
    name: 'South Fordham Apartments',
    type: 'Multifamily',
    location: 'Fordham, Bronx',
    acquisition_date: 'Apr 2021',
    acquisition_price: 8200000,
    current_value: 10800000,
    noi_annual: 720000,
    noi_change_pct: 12.4,
    occupancy_pct: 97.4,
    cap_rate: 6.7,
    debt_amount: 4920000,
    equity_value: 5880000,
    irr_pct: 22.1,
    status: 'performing',
    units: 24,
    sqft: 28000,
  },
  {
    id: 'P007',
    name: 'Metro Commons',
    type: 'Retail Strip',
    location: 'Bay Ridge, BK',
    acquisition_date: 'Aug 2019',
    acquisition_price: 6800000,
    current_value: 6200000,
    noi_annual: 420000,
    noi_change_pct: -3.8,
    occupancy_pct: 82.0,
    cap_rate: 6.8,
    debt_amount: 4080000,
    equity_value: 2120000,
    irr_pct: -1.2,
    status: 'watch',
    sqft: 14000,
  },
];

const PORTFOLIO_DASHBOARD_NOI_TREND = [
  { q: "Q1 '23", noi: 7.2 },
  { q: "Q2 '23", noi: 7.6 },
  { q: "Q3 '23", noi: 7.9 },
  { q: "Q4 '23", noi: 8.0 },
  { q: "Q1 '24", noi: 8.4 },
  { q: "Q2 '24", noi: 8.6 },
];

const PORTFOLIO_DASHBOARD_ALLOCATION = [
  { name: 'Multifamily', value: 54, color: '#34d399' },
  { name: 'Office', value: 23, color: '#60a5fa' },
  { name: 'Industrial', value: 13, color: '#a78bfa' },
  { name: 'Mixed Use', value: 7, color: '#c8a060' },
  { name: 'Retail', value: 3, color: '#f97316' },
];

const PORTFOLIO_DASHBOARD_PAYLOAD = {
  assets: PORTFOLIO_DASHBOARD_ASSETS,
  noiTrend: PORTFOLIO_DASHBOARD_NOI_TREND,
  allocation: PORTFOLIO_DASHBOARD_ALLOCATION,
};

router.get(
  '/terra/portfolio/dashboard',
  authOptional,
  async (_req: Request, res: Response) => {
    try {
      const payload = await readModulePayload(
        'portfolio-dashboard',
        PORTFOLIO_DASHBOARD_PAYLOAD,
      );
      sendSuccess(res, {
        ...(payload as object),
        dataMode: 'persisted',
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load portfolio dashboard');
    }
  },
);

export default router;
