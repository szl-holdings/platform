/**
 * Terra Property Intelligence Modules — property-scoped endpoints
 *
 * These routes are intentionally registered BEFORE the tenantScope middleware in
 * groups/terra.ts so they are accessible without an authenticated session. This
 * lets the Terra demo show realistic intelligence results when a visitor navigates
 * from the property detail page.
 *
 * All data is generated deterministically from the propertyId (djb2-like hash) so
 * every request for the same ID returns the same result — no DB table required.
 *
 * GUARDRAIL: Only read-only GET endpoints belong in this router. This router is
 * registered without tenantScope/auth enforcement (public prefix in global-auth-enforcer).
 * Any mutating routes (POST/PUT/DELETE) MUST NOT be added here — they must be placed
 * in terra-modules.ts or another router that is protected by tenantScope({ required: true }).
 */

import { type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';
import { publish as publishToAlertBus } from '../lib/terra-alert-bus';

const router = Router();
const authOptional = authMiddleware({ required: false });

function seedRng(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h * 33) ^ id.charCodeAt(i)) >>> 0;
  return (offset: number, min: number, max: number) =>
    min + ((h + offset * 1337) % (max - min + 1));
}

// ---------------------------------------------------------------------------
// Climate Risk Enhanced
// ---------------------------------------------------------------------------
router.get('/terra/properties/:id/climate-risk', authOptional, (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id as string;
    const rng = seedRng(propertyId);
    const overallRiskScore = rng(0, 28, 91);
    const overallGrade =
      overallRiskScore < 35 ? 'A' : overallRiskScore < 55 ? 'B' : overallRiskScore < 72 ? 'C' : 'D';
    const riskLevels: Array<'Negligible' | 'Low' | 'Medium' | 'High' | 'Critical'> = [
      'Negligible',
      'Low',
      'Medium',
      'High',
      'Critical',
    ];
    const toRisk = (n: number) => riskLevels[Math.min(4, Math.floor(n / 20))];
    const data = {
      propertyId,
      overallRiskScore,
      overallGrade,
      annualInsurance: rng(1, 180_000, 950_000),
      insuranceAdjustment: rng(2, 12, 88),
      valuationHaircut: rng(3, 2, 24),
      adaptationCost: rng(4, 400_000, 5_200_000),
      thirtyYearExpectedLoss: rng(5, 800_000, 12_000_000),
      regulatoryFlags: [
        'SEC Climate Risk Rule (Final)',
        ...(rng(6, 0, 1)
          ? ['SB 54 — Climate Disclosure (CA)']
          : ['HB 1557 — Mandatory Flood Disclosure (FL)']),
      ],
      hazards: [
        {
          type: 'flood',
          current: toRisk(rng(7, 0, 100)),
          projected2030: toRisk(rng(8, 0, 100)),
          projected2050: toRisk(Math.min(100, rng(9, 0, 100) + 10)),
          trend: rng(10, 0, 1) ? 'increasing' : 'stable',
          detail:
            'FEMA flood zone assessment based on current SFHA mapping and 2050 SLR projections.',
        },
        {
          type: 'wildfire',
          current: toRisk(rng(11, 0, 100)),
          projected2030: toRisk(Math.min(100, rng(12, 0, 100) + 8)),
          projected2050: toRisk(Math.min(100, rng(13, 0, 100) + 18)),
          trend: 'increasing',
          detail:
            'Cal Fire WUI hazard zone — smoke exposure and direct ignition risk modeled via EMBR platform.',
        },
        {
          type: 'heat',
          current: toRisk(rng(14, 0, 60)),
          projected2030: toRisk(rng(15, 0, 75)),
          projected2050: toRisk(Math.min(100, rng(16, 0, 80) + 15)),
          trend: rng(17, 0, 1) ? 'increasing' : 'stable',
          detail:
            'Urban heat island effect combined with 2050 IPCC temperature anomalies applied to local NOAA data.',
        },
        {
          type: 'seismic',
          current: toRisk(rng(18, 0, 100)),
          projected2030: toRisk(rng(19, 0, 100)),
          projected2050: toRisk(rng(20, 0, 100)),
          trend: 'stable',
          detail: `Site class ${['B', 'C', 'D'][rng(21, 0, 2)]} soils. Estimated PML: ${rng(22, 6, 28)}%.`,
        },
        {
          type: 'storm',
          current: toRisk(rng(23, 0, 60)),
          projected2030: toRisk(rng(24, 0, 75)),
          projected2050: toRisk(Math.min(100, rng(25, 0, 80) + 10)),
          trend: rng(26, 0, 1) ? 'increasing' : 'stable',
          detail:
            'Atmospheric river intensification projected. 100-year storm return period shortening under RCP 8.5.',
        },
        {
          type: 'sea-level',
          current: toRisk(rng(27, 0, 80)),
          projected2030: toRisk(Math.min(100, rng(28, 0, 80) + 10)),
          projected2050: toRisk(Math.min(100, rng(29, 0, 80) + 20)),
          trend: 'increasing',
          detail: `${(rng(30, 14, 36) / 10).toFixed(1)}ft SLR projected by 2060 per NOAA Intermediate High scenario.`,
        },
      ],
      dataSource: 'FIRST STREET FOUNDATION / NOAA / FEMA (seeded)',
      generatedAt: new Date().toISOString(),
    };
    if (overallRiskScore >= 55) {
      publishToAlertBus('terra.climate.elevated_risk', 'terra', {
        propertyId,
        overallRiskScore,
        overallGrade,
        insuranceAdjustment: data.insuranceAdjustment,
        valuationHaircut: data.valuationHaircut,
        regulatoryFlags: data.regulatoryFlags,
        triggeredAt: data.generatedAt,
      });
    }

    sendSuccess(res, { data, propertyId, dataMode: 'seeded' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to generate climate risk data');
  }
});

// ---------------------------------------------------------------------------
// Zoning Intelligence
// ---------------------------------------------------------------------------
router.get('/terra/properties/:id/zoning', authOptional, (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id as string;
    const rng = seedRng(propertyId);
    const zoningCodes = ['CMX-3', 'R7A/C2-4', 'C-2', 'MU-2', 'TOD-1', 'M1-1', 'B-4', 'RD-2'];
    const zones = [
      'Commercial Mixed-Use',
      'Medium-Density Residential',
      'General Commercial',
      'Mixed Use Medium',
      'Transit-Oriented Development',
      'Light Industrial',
      'Business District',
      'Residential High Density',
    ];
    const idx = rng(0, 0, zoningCodes.length - 1);
    const maxFar = [3.5, 4.0, 2.5, 5.0, 4.5, 2.0, 3.0, 6.0][idx];
    const lotSqft = rng(1, 8000, 30000);
    const maxUnits = Math.floor((lotSqft * maxFar) / 850);
    const currentUnits = rng(2, 0, Math.floor(maxUnits * 0.4));
    const scenarios = [
      {
        id: 's1',
        name: 'As-of-Right Development',
        type: 'Mixed Use',
        units: Math.floor(maxUnits * 0.68),
        grossSqft: Math.floor(lotSqft * maxFar * 0.88),
        far: parseFloat((maxFar * 0.88).toFixed(1)),
        stories: rng(11, 4, 7),
        parkingSpaces: Math.floor(maxUnits * 0.68 * 0.5),
        estimatedRevenue: rng(12, 12_000_000, 38_000_000),
        constructionCost: rng(13, 9_000_000, 28_000_000),
        landValue: rng(14, 2_000_000, 8_000_000),
        requiresVariance: false,
        varianceProbability: 100,
        timelineMonths: rng(16, 18, 28),
      },
      {
        id: 's2',
        name: 'Maximum Density Residential',
        type: 'Multifamily',
        units: maxUnits,
        grossSqft: Math.floor(lotSqft * maxFar),
        far: maxFar,
        stories: rng(17, 6, 10),
        parkingSpaces: Math.floor(maxUnits * 0.5),
        estimatedRevenue: rng(18, 20_000_000, 52_000_000),
        constructionCost: rng(19, 14_000_000, 38_000_000),
        landValue: rng(20, 2_000_000, 8_000_000),
        requiresVariance: true,
        varianceProbability: rng(22, 45, 85),
        timelineMonths: rng(23, 24, 36),
      },
      {
        id: 's3',
        name: 'Office + Retail Conversion',
        type: 'Commercial',
        units: 0,
        grossSqft: Math.floor(lotSqft * maxFar * 0.75),
        far: parseFloat((maxFar * 0.75).toFixed(1)),
        stories: rng(24, 3, 6),
        parkingSpaces: rng(25, 30, 80),
        estimatedRevenue: rng(26, 10_000_000, 32_000_000),
        constructionCost: rng(27, 8_000_000, 24_000_000),
        landValue: rng(28, 2_000_000, 8_000_000),
        requiresVariance: false,
        varianceProbability: 100,
        timelineMonths: rng(30, 16, 26),
      },
    ];
    const bestScenario = scenarios[0];
    const bestProfit =
      bestScenario.estimatedRevenue - bestScenario.constructionCost - bestScenario.landValue;
    const data = {
      propertyId,
      currentZoning: zoningCodes[idx],
      zoningDescription: zones[idx],
      lotSizeSqft: lotSqft,
      currentFar: parseFloat((rng(3, 5, 18) / 10).toFixed(1)),
      maxFar,
      currentUnits,
      maxUnits,
      maxHeight: rng(4, 35, 120),
      varianceProbability: rng(5, 40, 90),
      setbacks: { front: rng(6, 0, 20), side: rng(7, 0, 12), rear: rng(8, 8, 40) },
      overlayDistricts: [
        [
          'Transit-Oriented Development',
          'Opportunity Zone',
          'Arts & Cultural District',
          'Affordable Housing Overlay',
          'Inclusionary Housing',
        ][rng(9, 0, 4)],
        ...(rng(10, 0, 1)
          ? [['Historic Preservation', 'Urban Renewal', 'Design Review'][rng(11, 0, 2)]]
          : []),
      ],
      scenarios,
      aiSummary: `This parcel is zoned ${zoningCodes[idx]} (${zones[idx]}) with a maximum FAR of ${maxFar}. The highest-value as-of-right scenario is "${bestScenario.name}" at ${maxUnits} maximum units, generating an estimated ${Math.round((bestProfit / 1_000_000) * 10) / 10}M profit before financing costs. ${scenarios[1].requiresVariance ? `A variance application carries a ${scenarios[1].varianceProbability}% approval probability based on comparable decisions in this submarket.` : 'All modeled scenarios are achievable as-of-right under current zoning.'}`,
      dataSource: 'MUNICIPAL ZONING CODE / REGRID / NEARMAP (seeded)',
      generatedAt: new Date().toISOString(),
    };
    sendSuccess(res, { data, propertyId, dataMode: 'seeded' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to generate zoning data');
  }
});

// ---------------------------------------------------------------------------
// Neighborhood Momentum
// ---------------------------------------------------------------------------
router.get(
  '/terra/properties/:id/neighborhood-momentum',
  authOptional,
  (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id as string;
      const rng = seedRng(propertyId);
      const trajectories = [
        'accelerating',
        'gentrifying',
        'stable',
        'declining',
        'distressed',
      ] as const;
      const trajectory = trajectories[rng(0, 0, trajectories.length - 1)];
      const momentumScore =
        trajectory === 'accelerating'
          ? rng(1, 72, 98)
          : trajectory === 'gentrifying'
            ? rng(2, 55, 80)
            : trajectory === 'stable'
              ? rng(3, 40, 65)
              : trajectory === 'declining'
                ? rng(4, 20, 45)
                : rng(5, 5, 28);
      const data = {
        propertyId,
        trajectory,
        momentumScore,
        institutionalFlowM: parseFloat((rng(6, -20, 120) / 10).toFixed(1)),
        capRateCompression: parseFloat((rng(7, -80, 80) / 100).toFixed(2)),
        priceAppreciation12m: parseFloat((rng(8, -50, 180) / 10).toFixed(1)),
        permitVolume3m: rng(9, 2, 48),
        permitVolumeChange: parseFloat((rng(10, -30, 120) / 10).toFixed(1)),
        restaurantOpenings3m: rng(11, 0, 12),
        retailVacancyPct: parseFloat((rng(12, 2, 28) / 10).toFixed(1)) * 5,
        walkScore: rng(13, 40, 98),
        transitScore: rng(14, 30, 95),
        medianHHIncome: rng(15, 42_000, 185_000),
        incomeGrowth5y: parseFloat((rng(16, -15, 85) / 10).toFixed(1)),
        topSignals: [
          `Institutional buyer volume +${rng(17, 80, 420)}% YoY`,
          `${rng(18, 3, 14)} new permits filed this quarter`,
          `Median rent growth +${(rng(19, 15, 95) / 10).toFixed(1)}% trailing 12m`,
          `${rng(20, 1, 8)} anchor tenant lease signings`,
          `Cap rate compression of ${(rng(21, 10, 65) / 100).toFixed(2)}% in submarket`,
        ],
        microMarkets: [
          {
            name: 'Core Submarket',
            score: momentumScore,
            trajectory,
            deltaQoQ: parseFloat((rng(22, -15, 25) / 10).toFixed(1)),
          },
          {
            name: 'Adjacent Corridor',
            score: Math.min(100, momentumScore + rng(23, -15, 20)),
            trajectory: trajectories[rng(24, 0, 4)],
            deltaQoQ: parseFloat((rng(25, -10, 20) / 10).toFixed(1)),
          },
          {
            name: 'Broader Metro',
            score: rng(26, 35, 70),
            trajectory: trajectories[rng(27, 0, 4)],
            deltaQoQ: parseFloat((rng(28, -8, 12) / 10).toFixed(1)),
          },
        ],
        dataSource: 'COSTAR / REDFIN / YELP FUSION / WALK SCORE (seeded)',
        generatedAt: new Date().toISOString(),
      };
      sendSuccess(res, { data, propertyId, dataMode: 'seeded' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate neighborhood momentum data');
    }
  },
);

// ---------------------------------------------------------------------------
// Seller Motivation Predictor
// ---------------------------------------------------------------------------
router.get(
  '/terra/properties/:id/seller-motivation',
  authOptional,
  (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id as string;
      const rng = seedRng(propertyId);
      const acceptanceScore = rng(0, 15, 95);
      const acceptanceCategory =
        acceptanceScore >= 75
          ? 'very-likely'
          : acceptanceScore >= 55
            ? 'likely'
            : acceptanceScore >= 35
              ? 'possible'
              : 'unlikely';
      const daysOnMarket = rng(6, 12, 220);
      const motivationFactors = [
        { factor: 'Tax delinquency severity', weight: 0.2 },
        { factor: 'Loan maturity proximity', weight: 0.18 },
        { factor: 'Equity position', weight: 0.16 },
        { factor: 'Days on market (prior)', weight: 0.14 },
        { factor: 'Entity dissolution signals', weight: 0.12 },
        { factor: 'Absentee owner flag', weight: 0.1 },
        { factor: 'Permit lapse / code violations', weight: 0.1 },
      ].map((f, i) => ({
        ...f,
        weight: parseFloat((f.weight * (0.8 + rng(i + 7, 0, 40) / 100)).toFixed(2)),
      }));
      const data = {
        propertyId,
        acceptanceScore,
        acceptanceCategory,
        debtLoad: rng(1, 20, 95),
        estimatedEquity: rng(2, 800_000, 12_000_000),
        estimatedLTV: parseFloat((rng(3, 35, 88) / 100).toFixed(2)),
        suggestedDiscount: parseFloat((rng(4, 3, 22) / 10).toFixed(1)),
        ownershipYears: rng(5, 1, 28),
        daysOnMarket,
        priorListings: rng(14, 0, 3),
        taxDelinquencyMonths: rng(15, 0, 1) ? rng(16, 1, 18) : 0,
        motivationFactors,
        distressSignals: [
          ...(rng(17, 0, 1) ? [`Tax lien recorded — ${rng(18, 3, 24)} months delinquent`] : []),
          ...(rng(19, 0, 1) ? [`Loan maturity in ${rng(20, 3, 18)} months`] : []),
          ...(rng(21, 0, 1) ? ['Absentee owner — out-of-state entity'] : []),
          ...(rng(22, 0, 1) ? [`${rng(23, 1, 4)} prior failed listings`] : []),
          ...(rng(24, 0, 1) ? ['Open code violations on record'] : []),
          'Equity position supports below-market exit',
        ].slice(0, 4),
        outreachScript:
          acceptanceCategory === 'very-likely'
            ? `Opening: "We noticed your property at [address] has been on the market. We're able to close in ${rng(25, 14, 30)} days with no contingencies at [offer price]. Would you be open to a quick conversation?" — Emphasize certainty of close and speed.`
            : acceptanceCategory === 'likely'
              ? `Opening: "We're investors specifically looking in your area. We can offer a flexible close and all-cash structure — no repairs required. Can we schedule a walkthrough this week?"`
              : `Opening: "We have a strong interest in acquiring properties in your neighborhood. If you've considered an off-market exit, we'd love to learn more about your timeline."`,
        dataSource: 'COUNTY RECORDS / PROPSTREAM / SEC EDGAR / PITNEY BOWES (seeded)',
        generatedAt: new Date().toISOString(),
      };
      sendSuccess(res, { data, propertyId, dataMode: 'seeded' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate seller motivation data');
    }
  },
);

// ---------------------------------------------------------------------------
// Spatial Walkthrough
// ---------------------------------------------------------------------------
router.get(
  '/terra/properties/:id/spatial-walkthrough',
  authOptional,
  (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id as string;
      const rng = seedRng(propertyId);
      const roomTypes = [
        'Living Room',
        'Kitchen',
        'Primary Suite',
        'Office',
        'Bedroom 2',
        'Dining Room',
        'Garage',
        'Bathroom',
      ] as const;
      const conditions = ['excellent', 'good', 'fair', 'poor'] as const;
      const numRooms = rng(0, 3, 6);
      const rooms = Array.from({ length: numRooms + 2 }, (_, i) => {
        const renovCost = rng(i * 5 + 20, 8_000, 80_000);
        const valueAdd = Math.round(renovCost * (1.2 + rng(i * 5 + 21, 0, 80) / 100));
        return {
          id: `room-${i}`,
          name:
            i === 0
              ? 'Living Room'
              : i === 1
                ? 'Kitchen'
                : roomTypes[rng(1 + i, 0, roomTypes.length - 1)],
          sqft: rng(2 + i, 100, 680),
          condition: conditions[rng(3 + i, 0, conditions.length - 1)],
          ceiling: parseFloat((rng(5 + i, 8, 12) + 0.5).toFixed(1)),
          renovationOptions: [
            {
              name: 'Full Renovation',
              cost: renovCost,
              valueAdd,
              timelineWeeks: rng(i * 5 + 22, 4, 12),
            },
            {
              name: 'Cosmetic Update',
              cost: Math.round(renovCost * 0.35),
              valueAdd: Math.round(valueAdd * 0.4),
              timelineWeeks: rng(i * 5 + 23, 1, 4),
            },
          ],
        };
      });
      const totalRenovationBudget = rooms.reduce((s, r) => s + r.renovationOptions[0].cost, 0);
      const totalValueAdd = rooms.reduce((s, r) => s + r.renovationOptions[0].valueAdd, 0);
      const data = {
        propertyId,
        totalSqft: rooms.reduce((s, r) => s + r.sqft, 0),
        yearBuilt: rng(10, 1945, 2021),
        bedrooms: rng(11, 1, 5),
        bathrooms: parseFloat((rng(12, 1, 4) + (rng(13, 0, 1) ? 0.5 : 0)).toFixed(1)),
        levels: rng(14, 1, 3),
        overallConditionScore: rng(15, 52, 96),
        totalRenovationBudget,
        totalValueAdd,
        rooms,
        stagingOptions: [
          {
            name: 'Modern Minimalist',
            description: 'Clean lines, neutral palette, contemporary furniture',
            estimatedValue: rng(30, 15_000, 65_000),
          },
          {
            name: 'Traditional Classic',
            description: 'Warm tones, classic furniture, layered textures',
            estimatedValue: rng(31, 12_000, 50_000),
          },
          {
            name: 'Luxury Premium',
            description: 'High-end finishes, designer pieces, curated art',
            estimatedValue: rng(32, 25_000, 95_000),
          },
        ],
        recentInspection: {
          date: `20${rng(16, 22, 25)}-${String(rng(17, 1, 12)).padStart(2, '0')}-${String(rng(18, 1, 28)).padStart(2, '0')}`,
          inspector: [
            'Pacific Inspection Group',
            'National Property Inspectors',
            'Metro Verify',
            'SafeHouse Inspections',
          ][rng(19, 0, 3)],
          overallRating: ['A', 'A-', 'B+', 'B', 'B-'][rng(20, 0, 4)],
          criticalItems: rng(21, 0, 3),
          observationCount: rng(22, 4, 22),
        },
        dataSource: 'PROPERTY INSPECTION REPORT / MLS / COUNTY ASSESSOR (seeded)',
        generatedAt: new Date().toISOString(),
      };
      sendSuccess(res, { data, propertyId, dataMode: 'seeded' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate spatial walkthrough data');
    }
  },
);

// ---------------------------------------------------------------------------
// Investor Waterfall Calculator
// ---------------------------------------------------------------------------
router.get('/terra/properties/:id/waterfall', authOptional, (req: Request, res: Response) => {
  try {
    const propertyId = req.params.id as string;
    const rng = seedRng(propertyId);
    const totalEquity = rng(0, 5_000_000, 40_000_000);
    const gpContributionPct = rng(1, 5, 20);
    const preferredReturn = rng(2, 6, 12);
    const catchUpPct = rng(3, 50, 100);
    const promotePct = rng(4, 20, 30);
    const holdMonths = rng(5, 24, 84);
    const exitMultiple = parseFloat((1 + rng(6, 15, 90) / 100).toFixed(2));
    const exitProceeds = Math.round(totalEquity * exitMultiple);
    const gpEquity = totalEquity * (gpContributionPct / 100);
    const lpEquity = totalEquity - gpEquity;
    const prefReturnAmount = totalEquity * (preferredReturn / 100) * (holdMonths / 12);
    const remainingAfterPref = Math.max(0, exitProceeds - totalEquity - prefReturnAmount);
    const catchUpTarget =
      remainingAfterPref > 0 ? (catchUpPct / 100) * (prefReturnAmount / (1 - catchUpPct / 100)) : 0;
    const catchUpAmount = Math.min(catchUpTarget, remainingAfterPref);
    const afterCatchUp = remainingAfterPref - catchUpAmount;
    const gpPromote = afterCatchUp * (promotePct / 100);
    const lpRemainder = afterCatchUp - gpPromote;
    const gpTotal =
      gpEquity + (prefReturnAmount * gpContributionPct) / 100 + catchUpAmount + gpPromote;
    const lpTotal = exitProceeds - gpTotal;
    const gpEM = parseFloat((gpTotal / gpEquity).toFixed(2));
    const lpEM = parseFloat((lpTotal / lpEquity).toFixed(2));
    const gpIRR = parseFloat(((gpEM ** (12 / holdMonths) - 1) * 100).toFixed(2));
    const lpIRR = parseFloat(((lpEM ** (12 / holdMonths) - 1) * 100).toFixed(2));
    const data = {
      propertyId,
      totalEquity,
      gpContributionPct,
      preferredReturn,
      catchUpPct,
      promotePct,
      holdMonths,
      exitProceeds,
      gpEquity,
      lpEquity,
      gpTotal,
      lpTotal,
      gpEM,
      lpEM,
      gpIRR,
      lpIRR,
      tiers: [
        { description: 'Return of Capital — pro-rata', gpAmount: gpEquity, lpAmount: lpEquity },
        {
          description: `Preferred Return — ${preferredReturn}% × ${holdMonths}mo`,
          gpAmount: (prefReturnAmount * gpContributionPct) / 100,
          lpAmount: (prefReturnAmount * (100 - gpContributionPct)) / 100,
        },
        { description: `GP Catch-Up — ${catchUpPct}%`, gpAmount: catchUpAmount, lpAmount: 0 },
        {
          description: `Promoted Interest — ${promotePct}% GP promote`,
          gpAmount: gpPromote,
          lpAmount: lpRemainder,
        },
      ],
      dataSource: 'COMPUTED FROM PROPERTY SEED (seeded)',
      generatedAt: new Date().toISOString(),
    };
    sendSuccess(res, { data, propertyId, dataMode: 'seeded' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to compute waterfall data');
  }
});

export default router;
