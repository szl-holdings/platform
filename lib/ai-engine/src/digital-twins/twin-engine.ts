/**
 * Digital Twin Engine
 *
 * Maintains live virtual representations of key assets.
 * Each twin has: current state, predicted future states, and what-if simulation API.
 *
 * Twin types:
 * - VesselTwin: route, fuel, weather, ETA projections
 * - PropertyTwin: valuation model, market stress test, tenant risk
 * - PostureTwin: security posture score, attack surface map, breach simulation
 *
 * Persistence: TwinRegistry is backed by the `digital_twins` database table.
 * State is loaded on startup and written through on every create/update.
 *
 * Monte Carlo: simulation methods produce probabilistic confidence bands
 * using domain-specific scenario definitions from the @szl-holdings/monte-carlo library.
 */

import { db, digitalTwinsTable, twinSimulationRunsTable } from '@szl-holdings/db';
import { AEGIS_CYBER_RISK, TERRA_PROPERTY_RETURNS, VESSELS_VOYAGE_COST, runSimulation } from '@szl-holdings/monte-carlo';
import { eq } from 'drizzle-orm';

export type TwinType =
  | 'vessel'
  | 'property'
  | 'posture'
  | 'matter'
  | 'portfolio'
  | 'incident'
  | 'port';

export type TwinStatus = 'active' | 'degraded' | 'offline' | 'simulating';

export interface TwinState {
  id: string;
  orgId?: number;
  entityId: string;
  entityName: string;
  twinType: TwinType;
  status: TwinStatus;
  currentState: Record<string, unknown>;
  predictedStates: PredictedState[];
  lastSyncedAt: string;
  confidenceScore: number;
  alerts: TwinAlert[];
  metadata: Record<string, unknown>;
}

export interface PredictedState {
  timeHorizon: '1h' | '6h' | '24h' | '7d' | '30d' | '90d';
  state: Record<string, unknown>;
  confidence: number;
  drivingFactors: string[];
  generatedAt: string;
}

export interface TwinAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  currentValue: unknown;
  threshold: unknown;
  triggeredAt: string;
}

export interface SimulationScenario {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  impactedMetrics: string[];
}

export interface MonteCarloConfidenceBand {
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  mean: number;
  stdDev: number;
}

export interface SimulationResult {
  scenarioName: string;
  originalState: Record<string, unknown>;
  simulatedState: Record<string, unknown>;
  deltaMetrics: Record<string, { before: unknown; after: unknown; changePercent?: number }>;
  riskAssessment: string;
  recommendedActions: string[];
  confidenceScore: number;
  runDurationMs: number;
  monteCarlo?: {
    iterations: number;
    primaryMetric: string;
    confidenceBands: Record<string, MonteCarloConfidenceBand>;
    sensitivityDrivers: Array<{ id: string; label: string; impact: number }>;
  };
}

export interface VesselTwinState {
  imoNumber: string;
  name: string;
  currentPosition: { lat: number; lon: number; timestamp: string };
  heading: number;
  speedKnots: number;
  statusCode: string;
  destination: string;
  eta: string;
  fuelLevelPercent: number;
  fuelConsumptionRate: number;
  cargoStatus: string;
  weatherConditions: { windSpeedKnots: number; waveHeightM: number; visibility: string };
  routeRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  sanctionsExposure: boolean;
  predictedArrivalConfidence: number;
}

export interface PropertyTwinState {
  address: string;
  currentValuation: number;
  lastAppraisalDate: string;
  capRate: number;
  noi: number;
  occupancyRate: number;
  weightedAverageLeaseTerm: number;
  debtServiceCoverageRatio: number;
  loanToValue: number;
  marketTrend: 'appreciating' | 'stable' | 'declining' | 'distressed';
  tenantRiskScore: number;
  floodRiskScore: number;
  vacancyRisk: 'low' | 'medium' | 'high';
  comparableCapRate: number;
  pricePerSqft: number;
}

export interface PostureTwinState {
  overallPostureScore: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  meanTimeToDetect: number;
  meanTimeToRespond: number;
  attackSurfaceScore: number;
  identityRiskScore: number;
  dataExposureRisk: number;
  endpointCoverage: number;
  networkSegmentationScore: number;
  zeroTrustMaturity: number;
  incidentResponseReadiness: number;
  threatActorTargeting: string[];
  lastPenTestDate: string;
  activeThreats: number;
}

function twinStateFromDb(row: typeof digitalTwinsTable.$inferSelect): TwinState {
  return {
    id: row.id,
    orgId: row.orgId ?? undefined,
    entityId: row.entityId,
    entityName: row.entityName,
    twinType: row.twinType as TwinType,
    status: row.status as TwinStatus,
    currentState: (row.currentState as Record<string, unknown>) ?? {},
    predictedStates: (row.predictedStates as PredictedState[]) ?? [],
    alerts: (row.alerts as TwinAlert[]) ?? [],
    confidenceScore: row.confidenceScore,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    lastSyncedAt: row.lastSyncedAt.toISOString(),
  };
}

class TwinRegistry {
  private twins = new Map<string, TwinState>();
  private updateCallbacks = new Map<string, Array<(state: TwinState) => void>>();
  private initialized = false;

  async initialize(attempt = 1): Promise<void> {
    if (this.initialized) return;
    try {
      const rows = await db.select().from(digitalTwinsTable);
      for (const row of rows) {
        this.twins.set(row.id, twinStateFromDb(row));
      }
      this.initialized = true;
      console.info(`[TwinRegistry] Initialized with ${this.twins.size} twin(s) from DB (attempt ${attempt})`);
    } catch (err) {
      const delayMs = Math.min(30_000, 5_000 * attempt);
      console.error(`[TwinRegistry] Init failed (attempt ${attempt}) — retrying in ${delayMs / 1000}s:`, err);
      setTimeout(() => {
        this.initialize(attempt + 1).catch((e) =>
          console.error('[TwinRegistry] Retry error:', e),
        );
      }, delayMs);
    }
  }

  register(twin: TwinState): void {
    this.twins.set(twin.id, twin);
    this._persistTwin(twin).catch((err) =>
      console.error('[TwinRegistry] Failed to persist twin:', err),
    );
  }

  get(twinId: string): TwinState | null {
    return this.twins.get(twinId) ?? null;
  }

  getByEntity(entityId: string): TwinState | null {
    for (const twin of this.twins.values()) {
      if (twin.entityId === entityId) return twin;
    }
    return null;
  }

  getByType(type: TwinType): TwinState[] {
    return [...this.twins.values()].filter((t) => t.twinType === type);
  }

  update(twinId: string, updates: Partial<TwinState>): TwinState | null {
    const existing = this.twins.get(twinId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, lastSyncedAt: new Date().toISOString() };
    this.twins.set(twinId, updated);
    this._persistTwin(updated).catch((err) =>
      console.error('[TwinRegistry] Failed to persist twin update:', err),
    );
    const callbacks = this.updateCallbacks.get(twinId) ?? [];
    callbacks.forEach((cb) => cb(updated));
    return updated;
  }

  onUpdate(twinId: string, callback: (state: TwinState) => void): () => void {
    if (!this.updateCallbacks.has(twinId)) this.updateCallbacks.set(twinId, []);
    this.updateCallbacks.get(twinId)?.push(callback);
    return () => {
      const cbs = this.updateCallbacks.get(twinId);
      if (cbs) {
        const idx = cbs.indexOf(callback);
        if (idx >= 0) cbs.splice(idx, 1);
      }
    };
  }

  list(): TwinState[] {
    return [...this.twins.values()];
  }

  isReady(): boolean {
    return this.initialized;
  }

  private async _persistTwin(twin: TwinState): Promise<void> {
    await db
      .insert(digitalTwinsTable)
      .values({
        id: twin.id,
        orgId: twin.orgId ?? null,
        entityId: twin.entityId,
        entityName: twin.entityName,
        twinType: twin.twinType as typeof digitalTwinsTable.$inferInsert['twinType'],
        status: twin.status,
        currentState: twin.currentState,
        predictedStates: twin.predictedStates,
        alerts: twin.alerts,
        confidenceScore: twin.confidenceScore,
        metadata: twin.metadata,
        lastSyncedAt: new Date(twin.lastSyncedAt),
      })
      .onConflictDoUpdate({
        target: digitalTwinsTable.id,
        set: {
          entityName: twin.entityName,
          status: twin.status,
          currentState: twin.currentState,
          predictedStates: twin.predictedStates,
          alerts: twin.alerts,
          confidenceScore: twin.confidenceScore,
          metadata: twin.metadata,
          lastSyncedAt: new Date(twin.lastSyncedAt),
          updatedAt: new Date(),
        },
      });
  }
}

export const twinRegistry = new TwinRegistry();

async function persistSimulationRun(
  twinId: string,
  result: SimulationResult,
  scenario: SimulationScenario,
  createdByUserId?: number,
  orgId?: number,
): Promise<void> {
  try {
    await db.insert(twinSimulationRunsTable).values({
      twinId,
      orgId: orgId ?? null,
      scenarioName: result.scenarioName,
      scenarioParameters: scenario.parameters,
      originalState: result.originalState,
      simulatedState: result.simulatedState,
      deltaMetrics: result.deltaMetrics as Record<string, unknown>,
      riskAssessment: result.riskAssessment,
      recommendedActions: result.recommendedActions,
      confidenceScore: result.confidenceScore,
      monteCarloResult: result.monteCarlo ?? null,
      runDurationMs: result.runDurationMs,
      createdByUserId: createdByUserId ?? null,
    });
  } catch (err) {
    console.error('[TwinEngine] Failed to persist simulation run:', err);
  }
}

function buildConfidenceBand(values: number[]): MonteCarloConfidenceBand {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const pct = (p: number) => sorted[Math.max(0, Math.floor((n * p) / 100) - 1)] ?? 0;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  return {
    p5: pct(5),
    p25: pct(25),
    p50: pct(50),
    p75: pct(75),
    p95: pct(95),
    mean,
    stdDev: Math.sqrt(variance),
  };
}

export class VesselTwin {
  createTwin(entityId: string, initialState: VesselTwinState, orgId?: number): TwinState {
    const alerts = this.computeAlerts(initialState);
    const predictedStates = this.computePredictions(initialState);

    const twin: TwinState = {
      id: orgId != null ? `vessel-twin-${orgId}-${entityId}` : `vessel-twin-${entityId}`,
      orgId,
      entityId,
      entityName: initialState.name,
      twinType: 'vessel',
      status: 'active',
      currentState: initialState as unknown as Record<string, unknown>,
      predictedStates,
      lastSyncedAt: new Date().toISOString(),
      confidenceScore: initialState.predictedArrivalConfidence,
      alerts,
      metadata: { imoNumber: initialState.imoNumber, destination: initialState.destination },
    };

    twinRegistry.register(twin);
    return twin;
  }

  refreshTwin(twinId: string, newState: VesselTwinState): TwinState {
    const alerts = this.computeAlerts(newState);
    const predictedStates = this.computePredictions(newState);
    const updated = twinRegistry.update(twinId, {
      currentState: newState as unknown as Record<string, unknown>,
      alerts,
      predictedStates,
      confidenceScore: newState.predictedArrivalConfidence,
      status: 'active',
      metadata: { imoNumber: newState.imoNumber, destination: newState.destination },
    });
    if (!updated) throw new Error(`VesselTwin ${twinId} not found for refresh`);
    return updated;
  }

  async simulate(twinId: string, scenario: SimulationScenario, createdByUserId?: number): Promise<SimulationResult> {
    const twin = twinRegistry.get(twinId);
    if (!twin) throw new Error(`VesselTwin ${twinId} not found`);

    const start = Date.now();
    const original = twin.currentState as unknown as VesselTwinState;
    const params = scenario.parameters;

    const simulated: VesselTwinState = {
      ...original,
      speedKnots: ((params.speedChange as number) ?? 0) + original.speedKnots,
      fuelLevelPercent: Math.max(
        0,
        original.fuelLevelPercent + ((params.fuelDelta as number) ?? 0),
      ),
      routeRiskLevel:
        (params.routeRisk as VesselTwinState['routeRiskLevel']) ?? original.routeRiskLevel,
      weatherConditions: {
        windSpeedKnots: (params.windSpeed as number) ?? original.weatherConditions.windSpeedKnots,
        waveHeightM: (params.waveHeight as number) ?? original.weatherConditions.waveHeightM,
        visibility: (params.visibility as string) ?? original.weatherConditions.visibility,
      },
    };

    const etaDeltaHours =
      simulated.speedKnots < original.speedKnots
        ? Math.round(24 * (1 - simulated.speedKnots / original.speedKnots))
        : 0;

    const newEtaMs = new Date(original.eta).getTime() + etaDeltaHours * 3600000;
    simulated.eta = new Date(newEtaMs).toISOString();

    const mcResult = await this._runMonteCarlo(original, simulated);

    const result: SimulationResult = {
      scenarioName: scenario.name,
      originalState: twin.currentState,
      simulatedState: simulated as unknown as Record<string, unknown>,
      deltaMetrics: {
        speedKnots: {
          before: original.speedKnots,
          after: simulated.speedKnots,
          changePercent: ((simulated.speedKnots - original.speedKnots) / original.speedKnots) * 100,
        },
        fuelLevelPercent: {
          before: original.fuelLevelPercent,
          after: simulated.fuelLevelPercent,
          changePercent: simulated.fuelLevelPercent - original.fuelLevelPercent,
        },
        eta: { before: original.eta, after: simulated.eta },
        routeRiskLevel: { before: original.routeRiskLevel, after: simulated.routeRiskLevel },
      },
      riskAssessment: this.assessSimulationRisk(original, simulated),
      recommendedActions: this.buildRecommendations(original, simulated, etaDeltaHours),
      confidenceScore: 0.82,
      runDurationMs: Date.now() - start,
      monteCarlo: mcResult,
    };

    persistSimulationRun(twinId, result, scenario, createdByUserId, twin.orgId);
    return result;
  }

  private async _runMonteCarlo(
    original: VesselTwinState,
    _simulated: VesselTwinState,
  ): Promise<SimulationResult['monteCarlo']> {
    try {
      const scenario = {
        ...VESSELS_VOYAGE_COST,
        inputs: VESSELS_VOYAGE_COST.inputs.map((inp) => {
          if (inp.id === 'fuelPricePerTon') {
            return { ...inp, distribution: { type: 'normal' as const, mean: 620 + (original.routeRiskLevel === 'critical' ? 80 : 0), stdDev: 90 } };
          }
          if (inp.id === 'voyageDays') {
            return { ...inp, distribution: { type: 'normal' as const, mean: 18, stdDev: 4 } };
          }
          return inp;
        }),
      };
      const mcSim = await runSimulation(scenario, { iterations: 500, seed: 42 });
      const costBand = buildConfidenceBand(
        mcSim.results['totalVoyageCost']?.values ?? [],
      );
      const fuelBand = buildConfidenceBand(
        mcSim.results['effectiveFuelCost']?.values ?? [],
      );

      const sensitivity = mcSim.correlationMatrix;
      const drivers = Object.entries(sensitivity['totalVoyageCost'] ?? {})
        .filter(([k]) => k !== 'totalVoyageCost')
        .map(([id, impact]) => ({
          id,
          label: VESSELS_VOYAGE_COST.inputs.find((i) => i.id === id)?.label ?? id,
          impact: Math.abs(impact as number),
        }))
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 5);

      return {
        iterations: mcSim.validIterations,
        primaryMetric: 'totalVoyageCost',
        confidenceBands: { totalVoyageCost: costBand, effectiveFuelCost: fuelBand },
        sensitivityDrivers: drivers,
      };
    } catch {
      return undefined;
    }
  }

  private computeAlerts(state: VesselTwinState): TwinAlert[] {
    const alerts: TwinAlert[] = [];
    if (state.fuelLevelPercent < 15) {
      alerts.push({
        id: 'fuel-low',
        severity: 'critical',
        message: 'Fuel level critically low — refueling required before destination',
        metric: 'fuelLevelPercent',
        currentValue: state.fuelLevelPercent,
        threshold: 15,
        triggeredAt: new Date().toISOString(),
      });
    }
    if (state.routeRiskLevel === 'critical' || state.routeRiskLevel === 'high') {
      alerts.push({
        id: 'route-risk',
        severity: 'warning',
        message: `Route risk elevated: ${state.routeRiskLevel.toUpperCase()} — review passage plan`,
        metric: 'routeRiskLevel',
        currentValue: state.routeRiskLevel,
        threshold: 'medium',
        triggeredAt: new Date().toISOString(),
      });
    }
    if (state.sanctionsExposure) {
      alerts.push({
        id: 'sanctions',
        severity: 'critical',
        message: 'Sanctions exposure detected — halt operations pending compliance review',
        metric: 'sanctionsExposure',
        currentValue: true,
        threshold: false,
        triggeredAt: new Date().toISOString(),
      });
    }
    if (state.weatherConditions.waveHeightM > 4.5) {
      alerts.push({
        id: 'weather',
        severity: 'warning',
        message: `Heavy seas: ${state.weatherConditions.waveHeightM}m wave height — assess cargo security`,
        metric: 'waveHeightM',
        currentValue: state.weatherConditions.waveHeightM,
        threshold: 4.5,
        triggeredAt: new Date().toISOString(),
      });
    }
    return alerts;
  }

  private computePredictions(state: VesselTwinState): PredictedState[] {
    const fuelDecay = state.fuelConsumptionRate / 100;
    return [
      {
        timeHorizon: '6h',
        state: {
          fuelLevelPercent: Math.max(0, state.fuelLevelPercent - fuelDecay * 6),
          speedKnots: state.speedKnots,
        },
        confidence: 0.92,
        drivingFactors: ['Current speed', 'Fuel consumption rate'],
        generatedAt: new Date().toISOString(),
      },
      {
        timeHorizon: '24h',
        state: {
          fuelLevelPercent: Math.max(0, state.fuelLevelPercent - fuelDecay * 24),
          eta: state.eta,
        },
        confidence: 0.85,
        drivingFactors: ['Weather forecast', 'Route conditions', 'Fuel consumption'],
        generatedAt: new Date().toISOString(),
      },
      {
        timeHorizon: '7d',
        state: {
          estimatedPosition: `En route to ${state.destination}`,
          fuelLevelPercent: Math.max(0, state.fuelLevelPercent - fuelDecay * 168),
        },
        confidence: 0.71,
        drivingFactors: ['Route plan', 'Historical performance', 'Weather patterns'],
        generatedAt: new Date().toISOString(),
      },
    ];
  }

  private assessSimulationRisk(_original: VesselTwinState, simulated: VesselTwinState): string {
    if (simulated.fuelLevelPercent < 10 || simulated.routeRiskLevel === 'critical') {
      return 'CRITICAL: Simulation indicates unacceptable operational risk. Immediate intervention required.';
    }
    if (simulated.fuelLevelPercent < 20 || simulated.routeRiskLevel === 'high') {
      return 'HIGH: Simulation indicates elevated risk. Corrective action recommended before proceeding.';
    }
    return 'MODERATE: Simulation within acceptable parameters. Monitor closely.';
  }

  private buildRecommendations(
    _original: VesselTwinState,
    simulated: VesselTwinState,
    etaDeltaHours: number,
  ): string[] {
    const recs: string[] = [];
    if (simulated.fuelLevelPercent < 20)
      recs.push('Schedule emergency bunker stop at nearest port');
    if (etaDeltaHours > 12)
      recs.push(`Notify consignee of ${etaDeltaHours}h ETA delay — review demurrage exposure`);
    if (simulated.routeRiskLevel === 'high' || simulated.routeRiskLevel === 'critical')
      recs.push('Consult alternate routing via safer passage — engage security risk advisor');
    if (simulated.weatherConditions.waveHeightM > 5)
      recs.push('Heave-to or reduce speed until sea state improves');
    return recs;
  }
}

export class PropertyTwin {
  createTwin(entityId: string, initialState: PropertyTwinState, orgId?: number): TwinState {
    const alerts = this.computeAlerts(initialState);
    const predictedStates = this.computePredictions(initialState);

    const twin: TwinState = {
      id: orgId != null ? `property-twin-${orgId}-${entityId}` : `property-twin-${entityId}`,
      orgId,
      entityId,
      entityName: initialState.address,
      twinType: 'property',
      status: 'active',
      currentState: initialState as unknown as Record<string, unknown>,
      predictedStates,
      lastSyncedAt: new Date().toISOString(),
      confidenceScore: 0.88,
      alerts,
      metadata: {
        capRate: initialState.capRate,
        noi: initialState.noi,
        marketTrend: initialState.marketTrend,
      },
    };

    twinRegistry.register(twin);
    return twin;
  }

  refreshTwin(twinId: string, newState: PropertyTwinState): TwinState {
    const alerts = this.computeAlerts(newState);
    const predictedStates = this.computePredictions(newState);
    const updated = twinRegistry.update(twinId, {
      currentState: newState as unknown as Record<string, unknown>,
      alerts,
      predictedStates,
      confidenceScore: 0.88,
      status: 'active',
      metadata: { capRate: newState.capRate, noi: newState.noi, marketTrend: newState.marketTrend },
    });
    if (!updated) throw new Error(`PropertyTwin ${twinId} not found for refresh`);
    return updated;
  }

  async simulate(twinId: string, scenario: SimulationScenario, createdByUserId?: number): Promise<SimulationResult> {
    const twin = twinRegistry.get(twinId);
    if (!twin) throw new Error(`PropertyTwin ${twinId} not found`);

    const start = Date.now();
    const original = twin.currentState as unknown as PropertyTwinState;
    const params = scenario.parameters;

    const occupancyDelta = (params.occupancyChange as number) ?? 0;
    const interestRateDelta = (params.interestRateChange as number) ?? 0;
    const marketShock = (params.marketValueChange as number) ?? 0;

    const newOccupancy = Math.max(0, Math.min(1, original.occupancyRate + occupancyDelta));
    const newNoi = original.noi * (newOccupancy / original.occupancyRate);
    const capRateAdjustment = interestRateDelta * 0.6;
    const newCapRate = original.capRate + capRateAdjustment;
    const newValuation =
      marketShock !== 0 ? original.currentValuation * (1 + marketShock) : newNoi / newCapRate;
    const newDscr = newNoi / (original.noi / original.debtServiceCoverageRatio);
    const newLtv = original.loanToValue * (original.currentValuation / newValuation);

    const simulated: PropertyTwinState = {
      ...original,
      occupancyRate: newOccupancy,
      noi: newNoi,
      capRate: newCapRate,
      currentValuation: newValuation,
      debtServiceCoverageRatio: newDscr,
      loanToValue: newLtv,
      marketTrend:
        marketShock < -0.1
          ? 'distressed'
          : marketShock < 0
            ? 'declining'
            : marketShock > 0.05
              ? 'appreciating'
              : 'stable',
    };

    const mcResult = await this._runMonteCarlo(original, simulated);

    const result: SimulationResult = {
      scenarioName: scenario.name,
      originalState: twin.currentState,
      simulatedState: simulated as unknown as Record<string, unknown>,
      deltaMetrics: {
        currentValuation: {
          before: original.currentValuation,
          after: newValuation,
          changePercent:
            ((newValuation - original.currentValuation) / original.currentValuation) * 100,
        },
        noi: {
          before: original.noi,
          after: newNoi,
          changePercent: ((newNoi - original.noi) / original.noi) * 100,
        },
        debtServiceCoverageRatio: { before: original.debtServiceCoverageRatio, after: newDscr },
        loanToValue: { before: original.loanToValue, after: newLtv },
        capRate: { before: original.capRate, after: newCapRate },
      },
      riskAssessment: this.assessPropertyRisk(simulated),
      recommendedActions: this.buildPropertyRecommendations(original, simulated),
      confidenceScore: 0.84,
      runDurationMs: Date.now() - start,
      monteCarlo: mcResult,
    };

    persistSimulationRun(twinId, result, scenario, createdByUserId, twin.orgId);
    return result;
  }

  private async _runMonteCarlo(
    original: PropertyTwinState,
    _simulated: PropertyTwinState,
  ): Promise<SimulationResult['monteCarlo']> {
    try {
      const annualRent = original.noi;
      const scenario = {
        ...TERRA_PROPERTY_RETURNS,
        inputs: TERRA_PROPERTY_RETURNS.inputs.map((inp) => {
          if (inp.id === 'acquisitionPrice') {
            return { ...inp, distribution: { type: 'constant' as const, value: original.currentValuation } };
          }
          if (inp.id === 'annualRent') {
            return { ...inp, distribution: { type: 'normal' as const, mean: annualRent, stdDev: annualRent * 0.08 } };
          }
          return inp;
        }),
      };
      const mcSim = await runSimulation(scenario, { iterations: 500, seed: 42 });
      const primaryKey = Object.keys(mcSim.results)[0] ?? '';
      const primaryValues = mcSim.results[primaryKey]?.values ?? [];
      const band = buildConfidenceBand(primaryValues);

      const drivers = Object.entries(mcSim.correlationMatrix[primaryKey] ?? {})
        .filter(([k]) => k !== primaryKey)
        .map(([id, impact]) => ({
          id,
          label: TERRA_PROPERTY_RETURNS.inputs.find((i) => i.id === id)?.label ?? id,
          impact: Math.abs(impact as number),
        }))
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 5);

      return {
        iterations: mcSim.validIterations,
        primaryMetric: primaryKey,
        confidenceBands: { [primaryKey]: band },
        sensitivityDrivers: drivers,
      };
    } catch {
      return undefined;
    }
  }

  private computeAlerts(state: PropertyTwinState): TwinAlert[] {
    const alerts: TwinAlert[] = [];
    if (state.debtServiceCoverageRatio < 1.1)
      alerts.push({
        id: 'dscr-breach',
        severity: 'critical',
        message: `DSCR ${state.debtServiceCoverageRatio.toFixed(2)}x below covenant threshold — lender notification required`,
        metric: 'debtServiceCoverageRatio',
        currentValue: state.debtServiceCoverageRatio,
        threshold: 1.1,
        triggeredAt: new Date().toISOString(),
      });
    if (state.loanToValue > 0.8)
      alerts.push({
        id: 'ltv-high',
        severity: 'warning',
        message: `LTV ${(state.loanToValue * 100).toFixed(1)}% exceeds 80% — refinancing risk elevated`,
        metric: 'loanToValue',
        currentValue: state.loanToValue,
        threshold: 0.8,
        triggeredAt: new Date().toISOString(),
      });
    if (state.marketTrend === 'distressed')
      alerts.push({
        id: 'market-distress',
        severity: 'critical',
        message: 'Property in distressed market — immediate valuation review recommended',
        metric: 'marketTrend',
        currentValue: 'distressed',
        threshold: 'stable',
        triggeredAt: new Date().toISOString(),
      });
    if (state.occupancyRate < 0.7)
      alerts.push({
        id: 'low-occupancy',
        severity: 'warning',
        message: `Occupancy ${(state.occupancyRate * 100).toFixed(0)}% below 70% — cash flow risk`,
        metric: 'occupancyRate',
        currentValue: state.occupancyRate,
        threshold: 0.7,
        triggeredAt: new Date().toISOString(),
      });
    return alerts;
  }

  private computePredictions(state: PropertyTwinState): PredictedState[] {
    const trendMultiplier =
      state.marketTrend === 'appreciating'
        ? 1.03
        : state.marketTrend === 'declining'
          ? 0.97
          : state.marketTrend === 'distressed'
            ? 0.88
            : 1.0;
    return [
      {
        timeHorizon: '30d',
        state: {
          currentValuation: state.currentValuation * trendMultiplier ** (1 / 12),
          occupancyRate: state.occupancyRate,
        },
        confidence: 0.9,
        drivingFactors: ['Current market trend', 'Lease expirations'],
        generatedAt: new Date().toISOString(),
      },
      {
        timeHorizon: '90d',
        state: {
          currentValuation: state.currentValuation * trendMultiplier ** (3 / 12),
          noi: state.noi * 0.99,
        },
        confidence: 0.82,
        drivingFactors: ['Market comps', 'Tenant retention', 'Interest rate trajectory'],
        generatedAt: new Date().toISOString(),
      },
    ];
  }

  private assessPropertyRisk(state: PropertyTwinState): string {
    if (state.debtServiceCoverageRatio < 1.0 || state.marketTrend === 'distressed')
      return 'CRITICAL: Property under severe financial stress. Loan default risk elevated.';
    if (state.debtServiceCoverageRatio < 1.2 || state.loanToValue > 0.8)
      return 'HIGH: Property metrics approaching breach thresholds. Proactive lender engagement advised.';
    return 'MODERATE: Property within acceptable risk parameters. Monitor quarterly.';
  }

  private buildPropertyRecommendations(
    original: PropertyTwinState,
    simulated: PropertyTwinState,
  ): string[] {
    const recs: string[] = [];
    if (simulated.debtServiceCoverageRatio < 1.1)
      recs.push('Engage lender immediately for covenant waiver discussion');
    if (simulated.occupancyRate < original.occupancyRate)
      recs.push('Accelerate tenant retention program and leasing pipeline review');
    if (simulated.currentValuation < original.currentValuation * 0.9)
      recs.push('Commission independent appraisal and review insurance coverage');
    if (simulated.loanToValue > 0.85)
      recs.push('Evaluate equity injection or partial asset sale to reduce LTV');
    return recs;
  }
}

export class PostureTwin {
  createTwin(entityId: string, initialState: PostureTwinState, orgId?: number): TwinState {
    const alerts = this.computeAlerts(initialState);
    const predictedStates = this.computePredictions(initialState);

    const twin: TwinState = {
      id: orgId != null ? `posture-twin-${orgId}-${entityId}` : `posture-twin-${entityId}`,
      orgId,
      entityId,
      entityName: entityId,
      twinType: 'posture',
      status: 'active',
      currentState: initialState as unknown as Record<string, unknown>,
      predictedStates,
      lastSyncedAt: new Date().toISOString(),
      confidenceScore: 0.85,
      alerts,
      metadata: {
        postureScore: initialState.overallPostureScore,
        activeThreats: initialState.activeThreats,
      },
    };

    twinRegistry.register(twin);
    return twin;
  }

  refreshTwin(twinId: string, newState: PostureTwinState): TwinState {
    const alerts = this.computeAlerts(newState);
    const predictedStates = this.computePredictions(newState);
    const updated = twinRegistry.update(twinId, {
      currentState: newState as unknown as Record<string, unknown>,
      alerts,
      predictedStates,
      confidenceScore: 0.85,
      status: 'active',
      metadata: { postureScore: newState.overallPostureScore, activeThreats: newState.activeThreats },
    });
    if (!updated) throw new Error(`PostureTwin ${twinId} not found for refresh`);
    return updated;
  }

  async simulate(twinId: string, scenario: SimulationScenario, createdByUserId?: number): Promise<SimulationResult> {
    const twin = twinRegistry.get(twinId);
    if (!twin) throw new Error(`PostureTwin ${twinId} not found`);

    const start = Date.now();
    const original = twin.currentState as unknown as PostureTwinState;
    const params = scenario.parameters;

    const attackType = (params.attackType as string) ?? 'ransomware';
    const attackSuccess = (params.attackSuccess as boolean) ?? false;
    const lateralMovement = (params.lateralMovement as boolean) ?? false;

    let scoreDelta = 0;
    let mttrDelta = 0;
    const newThreats = original.activeThreats + 1;

    if (attackType === 'ransomware') {
      scoreDelta = -25;
      mttrDelta = 48 * 60;
    } else if (attackType === 'apt') {
      scoreDelta = -20;
      mttrDelta = 72 * 60;
    } else if (attackType === 'supply_chain') {
      scoreDelta = -30;
      mttrDelta = 96 * 60;
    } else if (attackType === 'phishing') {
      scoreDelta = -10;
      mttrDelta = 4 * 60;
    }

    if (lateralMovement) scoreDelta -= 15;
    if (attackSuccess) scoreDelta -= 10;

    const simulated: PostureTwinState = {
      ...original,
      overallPostureScore: Math.max(0, original.overallPostureScore + scoreDelta),
      criticalVulnerabilities: original.criticalVulnerabilities + (attackSuccess ? 2 : 0),
      meanTimeToRespond: original.meanTimeToRespond + mttrDelta,
      activeThreats: newThreats,
      attackSurfaceScore: Math.min(100, original.attackSurfaceScore + (lateralMovement ? 20 : 5)),
    };

    const mcResult = await this._runMonteCarlo(original, simulated);

    const breachImpact = attackSuccess ? 'BREACH CONFIRMED' : 'CONTAINED';
    const result: SimulationResult = {
      scenarioName: scenario.name,
      originalState: twin.currentState,
      simulatedState: simulated as unknown as Record<string, unknown>,
      deltaMetrics: {
        overallPostureScore: {
          before: original.overallPostureScore,
          after: simulated.overallPostureScore,
          changePercent: scoreDelta,
        },
        meanTimeToRespond: {
          before: original.meanTimeToRespond,
          after: simulated.meanTimeToRespond,
        },
        activeThreats: { before: original.activeThreats, after: simulated.activeThreats },
        attackSurfaceScore: {
          before: original.attackSurfaceScore,
          after: simulated.attackSurfaceScore,
        },
      },
      riskAssessment: `${breachImpact}: ${attackType} scenario resulted in ${Math.abs(scoreDelta)} point posture degradation. ${lateralMovement ? 'Lateral movement detected across network segments.' : 'Blast radius contained to initial vector.'}`,
      recommendedActions: this.buildPostureRecommendations(
        attackType,
        attackSuccess,
        lateralMovement,
      ),
      confidenceScore: 0.87,
      runDurationMs: Date.now() - start,
      monteCarlo: mcResult,
    };

    persistSimulationRun(twinId, result, scenario, createdByUserId, twin.orgId);
    return result;
  }

  private async _runMonteCarlo(
    original: PostureTwinState,
    _simulated: PostureTwinState,
  ): Promise<SimulationResult['monteCarlo']> {
    try {
      const postureNorm = original.overallPostureScore / 100;
      const scenario = {
        ...AEGIS_CYBER_RISK,
        inputs: AEGIS_CYBER_RISK.inputs.map((inp) => {
          if (inp.id === 'attackProbability') {
            return {
              ...inp,
              distribution: {
                type: 'beta' as const,
                alpha: 2,
                beta: Math.max(1, Math.round(postureNorm * 8)),
                min: 0,
                max: 1,
              },
            };
          }
          if (inp.id === 'controlEffectiveness') {
            return {
              ...inp,
              distribution: {
                type: 'triangular' as const,
                min: Math.max(0, postureNorm - 0.15),
                mode: postureNorm,
                max: Math.min(1, postureNorm + 0.1),
              },
            };
          }
          return inp;
        }),
      };
      const mcSim = await runSimulation(scenario, { iterations: 500, seed: 42 });
      const primaryKey = 'expectedAnnualLoss';
    const primaryValues = mcSim.results[primaryKey]?.values ?? Object.values(mcSim.results)[0]?.values ?? [];
      const band = buildConfidenceBand(primaryValues);

      const drivers = Object.entries(mcSim.correlationMatrix[primaryKey] ?? Object.entries(mcSim.correlationMatrix)[0]?.[1] ?? {})
        .filter(([k]) => k !== primaryKey)
        .map(([id, impact]) => ({
          id,
          label: AEGIS_CYBER_RISK.inputs.find((i) => i.id === id)?.label ?? id,
          impact: Math.abs(impact as number),
        }))
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 5);

      return {
        iterations: mcSim.validIterations,
        primaryMetric: primaryKey,
        confidenceBands: { [primaryKey]: band },
        sensitivityDrivers: drivers,
      };
    } catch {
      return undefined;
    }
  }

  private computeAlerts(state: PostureTwinState): TwinAlert[] {
    const alerts: TwinAlert[] = [];
    if (state.overallPostureScore < 50)
      alerts.push({
        id: 'posture-critical',
        severity: 'critical',
        message: `Security posture score ${state.overallPostureScore}/100 — critical risk`,
        metric: 'overallPostureScore',
        currentValue: state.overallPostureScore,
        threshold: 50,
        triggeredAt: new Date().toISOString(),
      });
    if (state.criticalVulnerabilities > 5)
      alerts.push({
        id: 'critical-cves',
        severity: 'critical',
        message: `${state.criticalVulnerabilities} critical vulnerabilities unpatched`,
        metric: 'criticalVulnerabilities',
        currentValue: state.criticalVulnerabilities,
        threshold: 5,
        triggeredAt: new Date().toISOString(),
      });
    if (state.meanTimeToDetect > 240)
      alerts.push({
        id: 'mttd-high',
        severity: 'warning',
        message: `MTTD ${state.meanTimeToDetect}min exceeds 4h threshold`,
        metric: 'meanTimeToDetect',
        currentValue: state.meanTimeToDetect,
        threshold: 240,
        triggeredAt: new Date().toISOString(),
      });
    if (state.activeThreats > 0)
      alerts.push({
        id: 'active-threats',
        severity: state.activeThreats > 3 ? 'critical' : 'warning',
        message: `${state.activeThreats} active threat(s) under investigation`,
        metric: 'activeThreats',
        currentValue: state.activeThreats,
        threshold: 0,
        triggeredAt: new Date().toISOString(),
      });
    return alerts;
  }

  private computePredictions(state: PostureTwinState): PredictedState[] {
    const _patchingRate = 0.02;
    return [
      {
        timeHorizon: '7d',
        state: {
          overallPostureScore: Math.min(100, state.overallPostureScore + 3),
          criticalVulnerabilities: Math.max(0, state.criticalVulnerabilities - 1),
        },
        confidence: 0.85,
        drivingFactors: ['Patch cycle', 'Threat landscape'],
        generatedAt: new Date().toISOString(),
      },
      {
        timeHorizon: '30d',
        state: {
          overallPostureScore: Math.min(100, state.overallPostureScore + 8),
          criticalVulnerabilities: Math.max(0, state.criticalVulnerabilities - 3),
          zeroTrustMaturity: Math.min(5, state.zeroTrustMaturity + 0.2),
        },
        confidence: 0.76,
        drivingFactors: ['Remediation roadmap', 'ZT implementation progress', 'Threat intel'],
        generatedAt: new Date().toISOString(),
      },
    ];
  }

  private buildPostureRecommendations(
    attackType: string,
    success: boolean,
    lateral: boolean,
  ): string[] {
    const recs: string[] = [];
    if (success)
      recs.push('Initiate incident response protocol — isolate affected systems immediately');
    if (lateral)
      recs.push(
        'Implement emergency network segmentation — block east-west traffic pending investigation',
      );
    if (attackType === 'ransomware') {
      recs.push('Verify backup integrity and initiate recovery runbook');
      recs.push('Engage cyber insurance carrier and legal counsel');
    }
    if (attackType === 'apt') {
      recs.push('Engage threat hunting team for persistence mechanism sweep');
      recs.push('Review privileged access logs for credential compromise');
    }
    if (attackType === 'supply_chain') {
      recs.push('Audit all third-party software dependencies for IOCs');
      recs.push('Initiate vendor security assessment for all critical suppliers');
    }
    recs.push('Update detection rules based on observed TTP patterns');
    return recs;
  }
}

export const vesselTwin = new VesselTwin();
export const propertyTwin = new PropertyTwin();
export const postureTwin = new PostureTwin();
