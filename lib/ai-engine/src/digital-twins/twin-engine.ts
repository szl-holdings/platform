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
 */

export type TwinType = "vessel" | "property" | "posture" | "matter" | "portfolio" | "incident" | "port";

export type TwinStatus = "active" | "degraded" | "offline" | "simulating";

export interface TwinState {
  id: string;
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
  timeHorizon: "1h" | "6h" | "24h" | "7d" | "30d" | "90d";
  state: Record<string, unknown>;
  confidence: number;
  drivingFactors: string[];
  generatedAt: string;
}

export interface TwinAlert {
  id: string;
  severity: "info" | "warning" | "critical";
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

export interface SimulationResult {
  scenarioName: string;
  originalState: Record<string, unknown>;
  simulatedState: Record<string, unknown>;
  deltaMetrics: Record<string, { before: unknown; after: unknown; changePercent?: number }>;
  riskAssessment: string;
  recommendedActions: string[];
  confidenceScore: number;
  runDurationMs: number;
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
  routeRiskLevel: "low" | "medium" | "high" | "critical";
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
  marketTrend: "appreciating" | "stable" | "declining" | "distressed";
  tenantRiskScore: number;
  floodRiskScore: number;
  vacancyRisk: "low" | "medium" | "high";
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

class TwinRegistry {
  private twins = new Map<string, TwinState>();
  private updateCallbacks = new Map<string, Array<(state: TwinState) => void>>();

  register(twin: TwinState): void {
    this.twins.set(twin.id, twin);
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
    return [...this.twins.values()].filter(t => t.twinType === type);
  }

  update(twinId: string, updates: Partial<TwinState>): TwinState | null {
    const existing = this.twins.get(twinId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, lastSyncedAt: new Date().toISOString() };
    this.twins.set(twinId, updated);
    const callbacks = this.updateCallbacks.get(twinId) ?? [];
    callbacks.forEach(cb => cb(updated));
    return updated;
  }

  onUpdate(twinId: string, callback: (state: TwinState) => void): () => void {
    if (!this.updateCallbacks.has(twinId)) this.updateCallbacks.set(twinId, []);
    this.updateCallbacks.get(twinId)!.push(callback);
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
}

export const twinRegistry = new TwinRegistry();

export class VesselTwin {
  createTwin(entityId: string, initialState: VesselTwinState): TwinState {
    const alerts = this.computeAlerts(initialState);
    const predictedStates = this.computePredictions(initialState);

    const twin: TwinState = {
      id: `vessel-twin-${entityId}`,
      entityId,
      entityName: initialState.name,
      twinType: "vessel",
      status: "active",
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

  async simulate(twinId: string, scenario: SimulationScenario): Promise<SimulationResult> {
    const twin = twinRegistry.get(twinId);
    if (!twin) throw new Error(`VesselTwin ${twinId} not found`);

    const start = Date.now();
    const original = twin.currentState as unknown as VesselTwinState;
    const params = scenario.parameters;

    const simulated: VesselTwinState = {
      ...original,
      speedKnots: (params.speedChange as number ?? 0) + original.speedKnots,
      fuelLevelPercent: Math.max(0, original.fuelLevelPercent + (params.fuelDelta as number ?? 0)),
      routeRiskLevel: (params.routeRisk as VesselTwinState["routeRiskLevel"]) ?? original.routeRiskLevel,
      weatherConditions: {
        windSpeedKnots: (params.windSpeed as number) ?? original.weatherConditions.windSpeedKnots,
        waveHeightM: (params.waveHeight as number) ?? original.weatherConditions.waveHeightM,
        visibility: (params.visibility as string) ?? original.weatherConditions.visibility,
      },
    };

    const etaDeltaHours = simulated.speedKnots < original.speedKnots
      ? Math.round(24 * (1 - simulated.speedKnots / original.speedKnots))
      : 0;

    const newEtaMs = new Date(original.eta).getTime() + etaDeltaHours * 3600000;
    simulated.eta = new Date(newEtaMs).toISOString();

    return {
      scenarioName: scenario.name,
      originalState: twin.currentState,
      simulatedState: simulated as unknown as Record<string, unknown>,
      deltaMetrics: {
        speedKnots: { before: original.speedKnots, after: simulated.speedKnots, changePercent: ((simulated.speedKnots - original.speedKnots) / original.speedKnots) * 100 },
        fuelLevelPercent: { before: original.fuelLevelPercent, after: simulated.fuelLevelPercent, changePercent: simulated.fuelLevelPercent - original.fuelLevelPercent },
        eta: { before: original.eta, after: simulated.eta },
        routeRiskLevel: { before: original.routeRiskLevel, after: simulated.routeRiskLevel },
      },
      riskAssessment: this.assessSimulationRisk(original, simulated),
      recommendedActions: this.buildRecommendations(original, simulated, etaDeltaHours),
      confidenceScore: 0.82,
      runDurationMs: Date.now() - start,
    };
  }

  private computeAlerts(state: VesselTwinState): TwinAlert[] {
    const alerts: TwinAlert[] = [];
    if (state.fuelLevelPercent < 15) {
      alerts.push({ id: "fuel-low", severity: "critical", message: "Fuel level critically low — refueling required before destination", metric: "fuelLevelPercent", currentValue: state.fuelLevelPercent, threshold: 15, triggeredAt: new Date().toISOString() });
    }
    if (state.routeRiskLevel === "critical" || state.routeRiskLevel === "high") {
      alerts.push({ id: "route-risk", severity: "warning", message: `Route risk elevated: ${state.routeRiskLevel.toUpperCase()} — review passage plan`, metric: "routeRiskLevel", currentValue: state.routeRiskLevel, threshold: "medium", triggeredAt: new Date().toISOString() });
    }
    if (state.sanctionsExposure) {
      alerts.push({ id: "sanctions", severity: "critical", message: "Sanctions exposure detected — halt operations pending compliance review", metric: "sanctionsExposure", currentValue: true, threshold: false, triggeredAt: new Date().toISOString() });
    }
    if (state.weatherConditions.waveHeightM > 4.5) {
      alerts.push({ id: "weather", severity: "warning", message: `Heavy seas: ${state.weatherConditions.waveHeightM}m wave height — assess cargo security`, metric: "waveHeightM", currentValue: state.weatherConditions.waveHeightM, threshold: 4.5, triggeredAt: new Date().toISOString() });
    }
    return alerts;
  }

  private computePredictions(state: VesselTwinState): PredictedState[] {
    const fuelDecay = state.fuelConsumptionRate / 100;
    return [
      { timeHorizon: "6h", state: { fuelLevelPercent: Math.max(0, state.fuelLevelPercent - fuelDecay * 6), speedKnots: state.speedKnots }, confidence: 0.92, drivingFactors: ["Current speed", "Fuel consumption rate"], generatedAt: new Date().toISOString() },
      { timeHorizon: "24h", state: { fuelLevelPercent: Math.max(0, state.fuelLevelPercent - fuelDecay * 24), eta: state.eta }, confidence: 0.85, drivingFactors: ["Weather forecast", "Route conditions", "Fuel consumption"], generatedAt: new Date().toISOString() },
      { timeHorizon: "7d", state: { estimatedPosition: "En route to " + state.destination, fuelLevelPercent: Math.max(0, state.fuelLevelPercent - fuelDecay * 168) }, confidence: 0.71, drivingFactors: ["Route plan", "Historical performance", "Weather patterns"], generatedAt: new Date().toISOString() },
    ];
  }

  private assessSimulationRisk(original: VesselTwinState, simulated: VesselTwinState): string {
    if (simulated.fuelLevelPercent < 10 || simulated.routeRiskLevel === "critical") {
      return "CRITICAL: Simulation indicates unacceptable operational risk. Immediate intervention required.";
    }
    if (simulated.fuelLevelPercent < 20 || simulated.routeRiskLevel === "high") {
      return "HIGH: Simulation indicates elevated risk. Corrective action recommended before proceeding.";
    }
    return "MODERATE: Simulation within acceptable parameters. Monitor closely.";
  }

  private buildRecommendations(original: VesselTwinState, simulated: VesselTwinState, etaDeltaHours: number): string[] {
    const recs: string[] = [];
    if (simulated.fuelLevelPercent < 20) recs.push("Schedule emergency bunker stop at nearest port");
    if (etaDeltaHours > 12) recs.push(`Notify consignee of ${etaDeltaHours}h ETA delay — review demurrage exposure`);
    if (simulated.routeRiskLevel === "high" || simulated.routeRiskLevel === "critical") recs.push("Consult alternate routing via safer passage — engage security risk advisor");
    if (simulated.weatherConditions.waveHeightM > 5) recs.push("Heave-to or reduce speed until sea state improves");
    return recs;
  }
}

export class PropertyTwin {
  createTwin(entityId: string, initialState: PropertyTwinState): TwinState {
    const alerts = this.computeAlerts(initialState);
    const predictedStates = this.computePredictions(initialState);

    const twin: TwinState = {
      id: `property-twin-${entityId}`,
      entityId,
      entityName: initialState.address,
      twinType: "property",
      status: "active",
      currentState: initialState as unknown as Record<string, unknown>,
      predictedStates,
      lastSyncedAt: new Date().toISOString(),
      confidenceScore: 0.88,
      alerts,
      metadata: { capRate: initialState.capRate, noi: initialState.noi, marketTrend: initialState.marketTrend },
    };

    twinRegistry.register(twin);
    return twin;
  }

  async simulate(twinId: string, scenario: SimulationScenario): Promise<SimulationResult> {
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
    const newValuation = marketShock !== 0
      ? original.currentValuation * (1 + marketShock)
      : newNoi / newCapRate;
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
      marketTrend: marketShock < -0.1 ? "distressed" : marketShock < 0 ? "declining" : marketShock > 0.05 ? "appreciating" : "stable",
    };

    return {
      scenarioName: scenario.name,
      originalState: twin.currentState,
      simulatedState: simulated as unknown as Record<string, unknown>,
      deltaMetrics: {
        currentValuation: { before: original.currentValuation, after: newValuation, changePercent: ((newValuation - original.currentValuation) / original.currentValuation) * 100 },
        noi: { before: original.noi, after: newNoi, changePercent: ((newNoi - original.noi) / original.noi) * 100 },
        debtServiceCoverageRatio: { before: original.debtServiceCoverageRatio, after: newDscr },
        loanToValue: { before: original.loanToValue, after: newLtv },
        capRate: { before: original.capRate, after: newCapRate },
      },
      riskAssessment: this.assessPropertyRisk(simulated),
      recommendedActions: this.buildPropertyRecommendations(original, simulated),
      confidenceScore: 0.84,
      runDurationMs: Date.now() - start,
    };
  }

  private computeAlerts(state: PropertyTwinState): TwinAlert[] {
    const alerts: TwinAlert[] = [];
    if (state.debtServiceCoverageRatio < 1.1) alerts.push({ id: "dscr-breach", severity: "critical", message: `DSCR ${state.debtServiceCoverageRatio.toFixed(2)}x below covenant threshold — lender notification required`, metric: "debtServiceCoverageRatio", currentValue: state.debtServiceCoverageRatio, threshold: 1.1, triggeredAt: new Date().toISOString() });
    if (state.loanToValue > 0.80) alerts.push({ id: "ltv-high", severity: "warning", message: `LTV ${(state.loanToValue * 100).toFixed(1)}% exceeds 80% — refinancing risk elevated`, metric: "loanToValue", currentValue: state.loanToValue, threshold: 0.80, triggeredAt: new Date().toISOString() });
    if (state.marketTrend === "distressed") alerts.push({ id: "market-distress", severity: "critical", message: "Property in distressed market — immediate valuation review recommended", metric: "marketTrend", currentValue: "distressed", threshold: "stable", triggeredAt: new Date().toISOString() });
    if (state.occupancyRate < 0.70) alerts.push({ id: "low-occupancy", severity: "warning", message: `Occupancy ${(state.occupancyRate * 100).toFixed(0)}% below 70% — cash flow risk`, metric: "occupancyRate", currentValue: state.occupancyRate, threshold: 0.70, triggeredAt: new Date().toISOString() });
    return alerts;
  }

  private computePredictions(state: PropertyTwinState): PredictedState[] {
    const trendMultiplier = state.marketTrend === "appreciating" ? 1.03 : state.marketTrend === "declining" ? 0.97 : state.marketTrend === "distressed" ? 0.88 : 1.0;
    return [
      { timeHorizon: "30d", state: { currentValuation: state.currentValuation * Math.pow(trendMultiplier, 1/12), occupancyRate: state.occupancyRate }, confidence: 0.90, drivingFactors: ["Current market trend", "Lease expirations"], generatedAt: new Date().toISOString() },
      { timeHorizon: "90d", state: { currentValuation: state.currentValuation * Math.pow(trendMultiplier, 3/12), noi: state.noi * 0.99 }, confidence: 0.82, drivingFactors: ["Market comps", "Tenant retention", "Interest rate trajectory"], generatedAt: new Date().toISOString() },
    ];
  }

  private assessPropertyRisk(state: PropertyTwinState): string {
    if (state.debtServiceCoverageRatio < 1.0 || state.marketTrend === "distressed") return "CRITICAL: Property under severe financial stress. Loan default risk elevated.";
    if (state.debtServiceCoverageRatio < 1.2 || state.loanToValue > 0.80) return "HIGH: Property metrics approaching breach thresholds. Proactive lender engagement advised.";
    return "MODERATE: Property within acceptable risk parameters. Monitor quarterly.";
  }

  private buildPropertyRecommendations(original: PropertyTwinState, simulated: PropertyTwinState): string[] {
    const recs: string[] = [];
    if (simulated.debtServiceCoverageRatio < 1.1) recs.push("Engage lender immediately for covenant waiver discussion");
    if (simulated.occupancyRate < original.occupancyRate) recs.push("Accelerate tenant retention program and leasing pipeline review");
    if (simulated.currentValuation < original.currentValuation * 0.9) recs.push("Commission independent appraisal and review insurance coverage");
    if (simulated.loanToValue > 0.85) recs.push("Evaluate equity injection or partial asset sale to reduce LTV");
    return recs;
  }
}

export class PostureTwin {
  createTwin(entityId: string, initialState: PostureTwinState): TwinState {
    const alerts = this.computeAlerts(initialState);
    const predictedStates = this.computePredictions(initialState);

    const twin: TwinState = {
      id: `posture-twin-${entityId}`,
      entityId,
      entityName: entityId,
      twinType: "posture",
      status: "active",
      currentState: initialState as unknown as Record<string, unknown>,
      predictedStates,
      lastSyncedAt: new Date().toISOString(),
      confidenceScore: 0.85,
      alerts,
      metadata: { postureScore: initialState.overallPostureScore, activeThreats: initialState.activeThreats },
    };

    twinRegistry.register(twin);
    return twin;
  }

  async simulate(twinId: string, scenario: SimulationScenario): Promise<SimulationResult> {
    const twin = twinRegistry.get(twinId);
    if (!twin) throw new Error(`PostureTwin ${twinId} not found`);

    const start = Date.now();
    const original = twin.currentState as unknown as PostureTwinState;
    const params = scenario.parameters;

    const attackType = (params.attackType as string) ?? "ransomware";
    const attackSuccess = (params.attackSuccess as boolean) ?? false;
    const lateralMovement = (params.lateralMovement as boolean) ?? false;

    let scoreDelta = 0;
    let mttrDelta = 0;
    const newThreats = original.activeThreats + 1;

    if (attackType === "ransomware") { scoreDelta = -25; mttrDelta = 48 * 60; }
    else if (attackType === "apt") { scoreDelta = -20; mttrDelta = 72 * 60; }
    else if (attackType === "supply_chain") { scoreDelta = -30; mttrDelta = 96 * 60; }
    else if (attackType === "phishing") { scoreDelta = -10; mttrDelta = 4 * 60; }

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

    const breachImpact = attackSuccess ? "BREACH CONFIRMED" : "CONTAINED";
    return {
      scenarioName: scenario.name,
      originalState: twin.currentState,
      simulatedState: simulated as unknown as Record<string, unknown>,
      deltaMetrics: {
        overallPostureScore: { before: original.overallPostureScore, after: simulated.overallPostureScore, changePercent: scoreDelta },
        meanTimeToRespond: { before: original.meanTimeToRespond, after: simulated.meanTimeToRespond },
        activeThreats: { before: original.activeThreats, after: simulated.activeThreats },
        attackSurfaceScore: { before: original.attackSurfaceScore, after: simulated.attackSurfaceScore },
      },
      riskAssessment: `${breachImpact}: ${attackType} scenario resulted in ${Math.abs(scoreDelta)} point posture degradation. ${lateralMovement ? "Lateral movement detected across network segments." : "Blast radius contained to initial vector."}`,
      recommendedActions: this.buildPostureRecommendations(attackType, attackSuccess, lateralMovement),
      confidenceScore: 0.87,
      runDurationMs: Date.now() - start,
    };
  }

  private computeAlerts(state: PostureTwinState): TwinAlert[] {
    const alerts: TwinAlert[] = [];
    if (state.overallPostureScore < 50) alerts.push({ id: "posture-critical", severity: "critical", message: `Security posture score ${state.overallPostureScore}/100 — critical risk`, metric: "overallPostureScore", currentValue: state.overallPostureScore, threshold: 50, triggeredAt: new Date().toISOString() });
    if (state.criticalVulnerabilities > 5) alerts.push({ id: "critical-cves", severity: "critical", message: `${state.criticalVulnerabilities} critical vulnerabilities unpatched`, metric: "criticalVulnerabilities", currentValue: state.criticalVulnerabilities, threshold: 5, triggeredAt: new Date().toISOString() });
    if (state.meanTimeToDetect > 240) alerts.push({ id: "mttd-high", severity: "warning", message: `MTTD ${state.meanTimeToDetect}min exceeds 4h threshold`, metric: "meanTimeToDetect", currentValue: state.meanTimeToDetect, threshold: 240, triggeredAt: new Date().toISOString() });
    if (state.activeThreats > 0) alerts.push({ id: "active-threats", severity: state.activeThreats > 3 ? "critical" : "warning", message: `${state.activeThreats} active threat(s) under investigation`, metric: "activeThreats", currentValue: state.activeThreats, threshold: 0, triggeredAt: new Date().toISOString() });
    return alerts;
  }

  private computePredictions(state: PostureTwinState): PredictedState[] {
    const patchingRate = 0.02;
    return [
      { timeHorizon: "7d", state: { overallPostureScore: Math.min(100, state.overallPostureScore + 3), criticalVulnerabilities: Math.max(0, state.criticalVulnerabilities - 1) }, confidence: 0.85, drivingFactors: ["Patch cycle", "Threat landscape"], generatedAt: new Date().toISOString() },
      { timeHorizon: "30d", state: { overallPostureScore: Math.min(100, state.overallPostureScore + 8), criticalVulnerabilities: Math.max(0, state.criticalVulnerabilities - 3), zeroTrustMaturity: Math.min(5, state.zeroTrustMaturity + 0.2) }, confidence: 0.76, drivingFactors: ["Remediation roadmap", "ZT implementation progress", "Threat intel"], generatedAt: new Date().toISOString() },
    ];
  }

  private buildPostureRecommendations(attackType: string, success: boolean, lateral: boolean): string[] {
    const recs: string[] = [];
    if (success) recs.push("Initiate incident response protocol — isolate affected systems immediately");
    if (lateral) recs.push("Implement emergency network segmentation — block east-west traffic pending investigation");
    if (attackType === "ransomware") { recs.push("Verify backup integrity and initiate recovery runbook"); recs.push("Engage cyber insurance carrier and legal counsel"); }
    if (attackType === "apt") { recs.push("Engage threat hunting team for persistence mechanism sweep"); recs.push("Review privileged access logs for credential compromise"); }
    if (attackType === "supply_chain") { recs.push("Audit all third-party software dependencies for IOCs"); recs.push("Initiate vendor security assessment for all critical suppliers"); }
    recs.push("Update detection rules based on observed TTP patterns");
    return recs;
  }
}

export const vesselTwin = new VesselTwin();
export const propertyTwin = new PropertyTwin();
export const postureTwin = new PostureTwin();
