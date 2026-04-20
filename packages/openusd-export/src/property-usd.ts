import type { UsdExportResult, UsdPrim, UsdStage } from './serializer.js';
import { buildExportResult } from './serializer.js';

export interface PropertyUsdState {
  propertyId: string;
  address: string;
  coordinates?: { lat: number; lon: number };
  propertyType?: 'commercial' | 'residential' | 'industrial' | 'mixed_use' | 'land';
  currentValuation?: number;
  noi?: number;
  capRate?: number;
  occupancyRate?: number;
  loanToValue?: number;
  debtServiceCoverageRatio?: number;
  floodRiskScore?: number;
  fireRiskScore?: number;
  vacancyRisk?: 'low' | 'medium' | 'high';
  marketTrend?: 'rising' | 'stable' | 'declining';
  tenantRiskScore?: number;
  buildingHeightM?: number;
  buildingAreaSqM?: number;
  yearBuilt?: number;
  lastAppraisalDate?: string;
  comparableCapRate?: number;
  pricePerSqft?: number;
  simulationScenario?:
    | 'baseline'
    | 'stress_test'
    | 'vacancy_spike'
    | 'cap_rate_compression'
    | 'rate_shock';
  metadata?: Record<string, string>;
}

export interface PropertySimulationParams {
  property: PropertyUsdState;
  scenario: PropertyUsdState['simulationScenario'];
  interestRateDelta?: number;
  vacancyRateDelta?: number;
  noiDelta?: number;
  marketCapRateDelta?: number;
}

export function exportPropertyTwin(state: PropertyUsdState): UsdExportResult {
  const warnings: string[] = [];
  const primId = state.propertyId.replace(/\W/g, '_');

  const locationPrim: UsdPrim = {
    path: `/${primId}/GeoPosition`,
    typeName: 'Xform',
    attributes: state.coordinates
      ? [
          {
            name: 'xformOp:translate',
            type: 'float3',
            value: [state.coordinates.lon, 0, state.coordinates.lat],
          },
        ]
      : [{ name: 'szl:noGeoData', type: 'bool', value: true, custom: true }],
  };

  const propertyPrim: UsdPrim = {
    path: `/${primId}`,
    typeName: 'Xform',
    attributes: [
      { name: 'szl:propertyId', type: 'string', value: state.propertyId, custom: true },
      { name: 'szl:address', type: 'string', value: state.address, custom: true },
      { name: 'szl:type', type: 'token', value: state.propertyType ?? 'commercial', custom: true },
      { name: 'szl:valuation', type: 'double', value: state.currentValuation ?? 0, custom: true },
      { name: 'szl:noi', type: 'double', value: state.noi ?? 0, custom: true },
      { name: 'szl:capRate', type: 'float', value: state.capRate ?? 0, custom: true },
      { name: 'szl:occupancyRate', type: 'float', value: state.occupancyRate ?? 1.0, custom: true },
      { name: 'szl:ltv', type: 'float', value: state.loanToValue ?? 0, custom: true },
      {
        name: 'szl:dscr',
        type: 'float',
        value: state.debtServiceCoverageRatio ?? 1.0,
        custom: true,
      },
      { name: 'szl:floodRisk', type: 'float', value: state.floodRiskScore ?? 0, custom: true },
      { name: 'szl:vacancyRisk', type: 'token', value: state.vacancyRisk ?? 'low', custom: true },
      {
        name: 'szl:marketTrend',
        type: 'token',
        value: state.marketTrend ?? 'stable',
        custom: true,
      },
      { name: 'szl:tenantRisk', type: 'float', value: state.tenantRiskScore ?? 0, custom: true },
      {
        name: 'szl:buildingAreaSqM',
        type: 'float',
        value: state.buildingAreaSqM ?? 0,
        custom: true,
      },
      { name: 'szl:yearBuilt', type: 'int', value: state.yearBuilt ?? 0, custom: true },
      {
        name: 'szl:scenario',
        type: 'token',
        value: state.simulationScenario ?? 'baseline',
        custom: true,
      },
    ],
    children: [locationPrim],
  };

  if ((state.floodRiskScore ?? 0) > 70)
    warnings.push('High flood risk score — consider insurance and elevation data');
  if ((state.loanToValue ?? 0) > 0.8)
    warnings.push('High LTV — limited equity buffer in stress scenarios');
  if ((state.debtServiceCoverageRatio ?? 1.5) < 1.1)
    warnings.push('Low DSCR — close to coverage breach threshold');

  const stage: UsdStage = {
    defaultPrim: primId,
    upAxis: 'Y',
    metersPerUnit: 1.0,
    prims: [propertyPrim],
    metadata: {
      'szl:exportType': 'property_digital_twin',
      'szl:exportedAt': new Date().toISOString(),
      'szl:scenario': state.simulationScenario ?? 'baseline',
    },
  };

  return buildExportResult(stage, state.propertyId, 'property', warnings);
}

export function exportPropertySimulation(params: PropertySimulationParams): UsdExportResult {
  const warnings: string[] = [];
  const base = { ...params.property };

  switch (params.scenario) {
    case 'stress_test':
      if (params.noiDelta !== undefined) base.noi = (base.noi ?? 0) + params.noiDelta;
      if (params.vacancyRateDelta !== undefined)
        base.occupancyRate = Math.max(0, (base.occupancyRate ?? 1) - params.vacancyRateDelta);
      if (params.marketCapRateDelta !== undefined) {
        const newCapRate = (base.capRate ?? 0) + params.marketCapRateDelta;
        base.capRate = newCapRate;
        if (base.noi && newCapRate > 0) base.currentValuation = base.noi / newCapRate;
      }
      warnings.push('Stress test applied — valuation reflects simulated downturn conditions');
      break;
    case 'vacancy_spike':
      base.occupancyRate = Math.max(
        0,
        (base.occupancyRate ?? 1) - (params.vacancyRateDelta ?? 0.2),
      );
      base.vacancyRisk = 'high';
      warnings.push('Vacancy spike scenario: NOI and valuation may be materially impacted');
      break;
    case 'cap_rate_compression':
      if (params.marketCapRateDelta !== undefined && base.noi) {
        base.capRate = Math.max(0.01, (base.capRate ?? 0.05) + params.marketCapRateDelta);
        base.currentValuation = base.noi / base.capRate;
      }
      warnings.push('Cap rate compression scenario applied');
      break;
    case 'rate_shock':
      base.debtServiceCoverageRatio = Math.max(
        0.5,
        (base.debtServiceCoverageRatio ?? 1.3) - (params.interestRateDelta ?? 0) * 0.15,
      );
      warnings.push('Rate shock scenario: DSCR reduced based on interest rate delta');
      break;
  }

  base.simulationScenario = params.scenario ?? 'baseline';
  return exportPropertyTwin(base);
}
