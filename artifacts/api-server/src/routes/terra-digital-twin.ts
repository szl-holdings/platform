import { bodyShape } from '@szl-holdings/contracts/common';
import { db, terraPropertiesTable } from '@szl-holdings/db';
import { type PropertySimulationParams, type PropertyUsdState, exportPropertySimulation, exportPropertyTwin } from '@szl-holdings/openusd-export';
import { eq, or, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handleRouteError, sendBadRequest, sendNotFound } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const twinRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Digital twin rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
});

// ─── Property Digital Twin Export ─────────────────────────────────────────────

router.get(
  '/terra/:propertyId/digital-twin',
  twinRateLimit,
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const { propertyId } = req.params;

      const [property] = await db
        .select()
        .from(terraPropertiesTable)
        .where(
          or(
            eq(terraPropertiesTable.externalId, propertyId),
            sql`CAST(${terraPropertiesTable.id} AS TEXT) = ${propertyId}`,
          )!,
        )
        .limit(1);

      if (!property) {
        sendNotFound(res, `Property ${propertyId}`);
        return;
      }

      const state: PropertyUsdState = {
        propertyId: property.externalId ?? String(property.id),
        address: property.address,
        propertyType: normalizePropertyType(property.propertyType),
        currentValuation: property.assessedValue ? Number(property.assessedValue) : undefined,
        yearBuilt: property.yearBuilt ?? undefined,
        coordinates:
          property.latitude && property.longitude
            ? { lat: Number(property.latitude), lon: Number(property.longitude) }
            : undefined,
        simulationScenario: 'baseline',
        metadata: {
          internalId: String(property.id),
          ownerName: property.ownerName ?? '',
          ownerType: property.ownerType,
          source: 'terra_properties',
          city: property.city,
          state: property.state,
        },
      };

      const result = exportPropertyTwin(state);

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="property-${propertyId}.usda"`);
      res.setHeader('X-SZL-Export-Type', 'property_digital_twin');
      res.setHeader('X-SZL-Prim-Count', String(result.primCount));
      res.setHeader('X-SZL-Export-At', result.exportedAt);
      if (result.warnings.length > 0) {
        res.setHeader('X-SZL-Warnings', result.warnings.join('; '));
      }
      res.status(200).send(result.usdaContent);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export property digital twin');
    }
  },
);

// ─── Property Financial Simulation ────────────────────────────────────────────

const VALID_PROPERTY_SCENARIOS = [
  'baseline',
  'stress_test',
  'vacancy_spike',
  'cap_rate_compression',
  'rate_shock',
] as const;
type PropertyScenario = (typeof VALID_PROPERTY_SCENARIOS)[number];

router.post(
  '/terra/:propertyId/simulate',
  twinRateLimit,
  authMiddleware({ required: false }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const { propertyId } = req.params;
      const rawScenario = (req.body?.scenario as string | undefined) ?? 'stress_test';
      const interestRateDelta = req.body?.interestRateDelta as number | undefined;
      const vacancyRateDelta = req.body?.vacancyRateDelta as number | undefined;
      const noiDelta = req.body?.noiDelta as number | undefined;
      const marketCapRateDelta = req.body?.marketCapRateDelta as number | undefined;

      if (!VALID_PROPERTY_SCENARIOS.includes(rawScenario as PropertyScenario)) {
        sendBadRequest(
          res,
          `Invalid scenario. Valid values: ${VALID_PROPERTY_SCENARIOS.join(', ')}`,
        );
        return;
      }

      const scenario = rawScenario as PropertyScenario;

      const [property] = await db
        .select()
        .from(terraPropertiesTable)
        .where(
          or(
            eq(terraPropertiesTable.externalId, propertyId),
            sql`CAST(${terraPropertiesTable.id} AS TEXT) = ${propertyId}`,
          )!,
        )
        .limit(1);

      if (!property) {
        sendNotFound(res, `Property ${propertyId}`);
        return;
      }

      const baseState: PropertyUsdState = {
        propertyId: property.externalId ?? String(property.id),
        address: property.address,
        propertyType: normalizePropertyType(property.propertyType),
        currentValuation: property.assessedValue ? Number(property.assessedValue) : undefined,
        yearBuilt: property.yearBuilt ?? undefined,
        coordinates:
          property.latitude && property.longitude
            ? { lat: Number(property.latitude), lon: Number(property.longitude) }
            : undefined,
        simulationScenario: scenario,
        metadata: {
          internalId: String(property.id),
          ownerName: property.ownerName ?? '',
          ownerType: property.ownerType,
          source: 'terra_properties',
        },
      };

      const params: PropertySimulationParams = {
        property: baseState,
        scenario,
        interestRateDelta,
        vacancyRateDelta,
        noiDelta,
        marketCapRateDelta,
      };

      const result = exportPropertySimulation(params);

      const projection = buildFinancialProjection(baseState, scenario, params);

      res.json({
        propertyId,
        scenario,
        property: {
          id: property.id,
          externalId: property.externalId,
          address: property.address,
          propertyType: property.propertyType,
          assessedValue: property.assessedValue,
          ownerName: property.ownerName,
        },
        financialProjection: projection,
        export: {
          entityId: result.entityId,
          entityType: result.entityType,
          exportedAt: result.exportedAt,
          fileSizeBytes: result.fileSizeBytes,
          primCount: result.primCount,
          warnings: result.warnings,
          usdaContent: result.usdaContent,
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to run property simulation');
    }
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizePropertyType(raw: string | null | undefined): PropertyUsdState['propertyType'] {
  const map: Record<string, PropertyUsdState['propertyType']> = {
    commercial: 'commercial',
    office: 'commercial',
    retail: 'commercial',
    hospitality: 'commercial',
    other: 'commercial',
    residential: 'residential',
    multifamily: 'residential',
    industrial: 'industrial',
    mixed_use: 'mixed_use',
    'mixed-use': 'mixed_use',
    land: 'land',
  };
  return map[raw ?? ''] ?? 'commercial';
}

function buildFinancialProjection(
  base: PropertyUsdState,
  scenario: PropertyScenario,
  params: PropertySimulationParams,
): Record<string, unknown> {
  const baseValuation = base.currentValuation ?? 0;
  const baseNoi = base.noi ?? 0;
  const baseCapRate = base.capRate ?? 0.05;
  const baseOccupancy = base.occupancyRate ?? 0.95;
  const baseDscr = base.debtServiceCoverageRatio ?? 1.3;

  let projectedValuation = baseValuation;
  let projectedNoi = baseNoi;
  let projectedCapRate = baseCapRate;
  let projectedOccupancy = baseOccupancy;
  let projectedDscr = baseDscr;
  const notes: string[] = [];

  switch (scenario) {
    case 'stress_test':
      projectedNoi = baseNoi + (params.noiDelta ?? -baseNoi * 0.1);
      projectedOccupancy = Math.max(0, baseOccupancy - (params.vacancyRateDelta ?? 0.05));
      if (params.marketCapRateDelta !== undefined) {
        projectedCapRate = baseCapRate + params.marketCapRateDelta;
        projectedValuation = projectedNoi / Math.max(0.001, projectedCapRate);
      }
      notes.push('Stress-test scenario: NOI and occupancy reduced, cap rate expanded.');
      break;
    case 'vacancy_spike':
      projectedOccupancy = Math.max(0, baseOccupancy - (params.vacancyRateDelta ?? 0.2));
      projectedNoi = baseNoi * (projectedOccupancy / Math.max(0.001, baseOccupancy));
      projectedValuation = projectedCapRate > 0 ? projectedNoi / projectedCapRate : 0;
      notes.push('Vacancy spike: NOI adjusted proportionally to occupancy drop.');
      break;
    case 'cap_rate_compression':
      projectedCapRate = Math.max(0.01, baseCapRate + (params.marketCapRateDelta ?? -0.01));
      projectedValuation = baseNoi / Math.max(0.001, projectedCapRate);
      notes.push('Cap rate compression: valuation adjusted to reflect tightened market.');
      break;
    case 'rate_shock':
      projectedDscr = Math.max(0.5, baseDscr - (params.interestRateDelta ?? 0.015) * 0.15);
      notes.push('Rate shock: DSCR reduced based on interest rate delta.');
      break;
    default:
      notes.push('Baseline: no adjustments applied.');
  }

  const valuationDelta = projectedValuation - baseValuation;
  const noiBefore = baseNoi;
  const noiAfter = projectedNoi;

  return {
    scenario,
    before: {
      valuation: baseValuation,
      noi: noiBefore,
      capRate: baseCapRate,
      occupancyRate: baseOccupancy,
      dscr: baseDscr,
    },
    after: {
      valuation: projectedValuation,
      noi: noiAfter,
      capRate: projectedCapRate,
      occupancyRate: projectedOccupancy,
      dscr: projectedDscr,
    },
    delta: {
      valuationChange: valuationDelta,
      valuationChangePct:
        baseValuation > 0 ? Math.round((valuationDelta / baseValuation) * 10000) / 100 : null,
      noiChange: noiAfter - noiBefore,
    },
    notes,
    generatedAt: new Date().toISOString(),
  };
}

export default router;
