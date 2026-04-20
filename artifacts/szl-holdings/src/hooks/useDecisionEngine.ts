import type { CovenantDecision, CovenantPolicy } from '@szl-holdings/covenant-policy/engine';
import { CovenantPolicyEngine } from '@szl-holdings/covenant-policy/engine';
import { sample } from '@szl-holdings/monte-carlo/distributions';
import { VESSELS_VOYAGE_COST } from '@szl-holdings/monte-carlo/scenarios';
import type { ScenarioDefinition } from '@szl-holdings/monte-carlo/schema';
import type { PrismBusEvent } from '@szl-holdings/prism-bus/bus';
import { PrismEventBus } from '@szl-holdings/prism-bus/bus';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface MonteCarloResult {
  scenarioId: string;
  title: string;
  description: string;
  domain: string;
  iterations: number;
  validIterations: number;
  durationMs: number;
  metrics: Record<
    string,
    {
      label: string;
      format?: string;
      higherIsBetter?: boolean;
      mean: number;
      p5: number;
      p25: number;
      p50: number;
      p75: number;
      p95: number;
      min: number;
      max: number;
      stdDev: number;
    }
  >;
  inputSensitivity: Array<{ inputId: string; label: string; impact: number }>;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.ceil((sorted.length * p) / 100) - 1);
  return sorted[idx]!;
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function runScenarioSimulation(scenario: ScenarioDefinition, iterations: number): MonteCarloResult {
  const start = performance.now();
  const outputAccum: Record<string, number[]> = {};
  for (const out of scenario.outputs) outputAccum[out.id] = [];
  const inputAccum: Record<string, number[]> = {};
  for (const inp of scenario.inputs) inputAccum[inp.id] = [];

  let validIterations = 0;

  for (let i = 0; i < iterations; i++) {
    const inputs: Record<string, number> = {};
    for (const inp of scenario.inputs) {
      const val = sample(inp.distribution);
      inputs[inp.id] = val;
      inputAccum[inp.id]!.push(val);
    }
    try {
      const outputs = scenario.calculate(inputs, i);
      let valid = true;
      if (scenario.constraints) {
        for (const constraint of scenario.constraints) {
          if (!constraint.check(outputs)) {
            valid = false;
            break;
          }
        }
      }
      if (!valid) continue;
      validIterations++;
      for (const out of scenario.outputs) {
        const v = outputs[out.id];
        if (v !== undefined && isFinite(v)) outputAccum[out.id]!.push(v);
      }
    } catch {
      /* constraint violation */
    }
  }

  const metrics: MonteCarloResult['metrics'] = {};
  for (const out of scenario.outputs) {
    const values = outputAccum[out.id] ?? [];
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    metrics[out.id] = {
      label: out.label,
      format: out.format,
      higherIsBetter: out.higherIsBetter,
      mean,
      p5: percentile(sorted, 5),
      p25: percentile(sorted, 25),
      p50: percentile(sorted, 50),
      p75: percentile(sorted, 75),
      p95: percentile(sorted, 95),
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
      stdDev: computeStdDev(values, mean),
    };
  }

  const primaryOutput = scenario.outputs[0];
  const baseOutputs = primaryOutput ? (outputAccum[primaryOutput.id] ?? []) : [];
  const baseMean =
    baseOutputs.length > 0 ? baseOutputs.reduce((s, v) => s + v, 0) / baseOutputs.length : 0;
  const baseVar =
    baseOutputs.length > 0
      ? baseOutputs.reduce((s, v) => s + (v - baseMean) ** 2, 0) / baseOutputs.length
      : 0;

  const inputSensitivity = scenario.inputs
    .map((inp) => {
      const inputVals = inputAccum[inp.id]!;
      const inputMean = inputVals.reduce((s, v) => s + v, 0) / inputVals.length;
      let cov = 0;
      for (let i = 0; i < Math.min(inputVals.length, baseOutputs.length); i++) {
        cov += (inputVals[i]! - inputMean) * (baseOutputs[i]! - baseMean);
      }
      cov /= inputVals.length;
      const inputVar = inputVals.reduce((s, v) => s + (v - inputMean) ** 2, 0) / inputVals.length;
      const r2 = baseVar > 0 && inputVar > 0 ? (cov * cov) / (inputVar * baseVar) : 0;
      return { inputId: inp.id, label: inp.label, impact: Math.sqrt(r2) };
    })
    .sort((a, b) => b.impact - a.impact);

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    description: scenario.description,
    domain: scenario.domain,
    iterations,
    validIterations,
    durationMs: performance.now() - start,
    metrics,
    inputSensitivity,
  };
}

const MARITIME_RESPONSE_POLICY: CovenantPolicy = {
  id: 'maritime-critical-response-v2',
  name: 'Maritime Critical Response Protocol',
  description:
    'Governs emergency response actions for maritime threats involving cross-domain signals',
  version: '2.0.0',
  roles: ['super_admin', 'admin', 'exec', 'ops', 'compliance'],
  domains: ['aegis', 'vessels', 'global'],
  permissions: ['execute', 'approve'],
  conditions: [],
  effect: 'allow',
  priority: 100,
};

export interface Recommendation {
  title: string;
  confidence: number;
  modelId: string;
  modelProvider: string;
  actions: string[];
  inputSources: Array<{ type: string; id: string; label: string }>;
  correlationId: string;
}

export interface ExecutionStep {
  action: string;
  status: string;
  duration: string;
  executor: string;
  triggeredAt: number;
}

export interface ProofRecord {
  proofChainId: string;
  contentId: string;
  contentType: string;
  sourceClass: string;
  confidenceScore: number;
  modelId: string;
  modelProvider: string;
  reviewState: string;
  exportSafetyState: string;
  promptHash: string;
  correlationId: string;
  inputSources: Array<{ type: string; id: string; label: string }>;
  createdAt: string;
}

export interface OutcomeRecord {
  outcomeId: string;
  domain: string;
  entityType: string;
  recommendationText: string;
  recommendationAction: string;
  confidence: number;
  decisionStatus: string;
  outcomeResult: string;
  predictedCost: number;
  actualCost: number;
  predictedHours: number;
  actualHours: number;
  createdAt: string;
}

export interface EngineState {
  status: 'idle' | 'running' | 'complete' | 'error';
  publishedSignals: PrismBusEvent[];
  correlatedEvents: PrismBusEvent[];
  busStats: {
    totalPublished: number;
    byType: Record<string, number>;
    subscriptionCount: number;
    historySize: number;
  };
  busHistory: PrismBusEvent[];
  policyDecision: CovenantDecision | null;
  policySimulation: { decision: CovenantDecision; explanation: string[] } | null;
  monteCarloResult: MonteCarloResult | null;
  recommendation: Recommendation | null;
  executionSteps: ExecutionStep[];
  proofRecord: ProofRecord | null;
  outcomeRecord: OutcomeRecord | null;
  error: string | null;
}

export function useDecisionEngine() {
  const [state, setState] = useState<EngineState>({
    status: 'idle',
    publishedSignals: [],
    correlatedEvents: [],
    busStats: { totalPublished: 0, byType: {}, subscriptionCount: 0, historySize: 0 },
    busHistory: [],
    policyDecision: null,
    policySimulation: null,
    monteCarloResult: null,
    recommendation: null,
    executionSteps: [],
    proofRecord: null,
    outcomeRecord: null,
    error: null,
  });

  const busRef = useRef<PrismEventBus | null>(null);
  const policyEngineRef = useRef<CovenantPolicyEngine | null>(null);
  const ranRef = useRef(false);

  const runDemo = useCallback(async () => {
    if (ranRef.current) return;
    ranRef.current = true;

    setState((prev) => ({ ...prev, status: 'running' }));

    try {
      const bus = new PrismEventBus();
      busRef.current = bus;

      const correlatedEvents: PrismBusEvent[] = [];
      bus.subscribe(
        'correlation-engine',
        ['domain_signal', 'cross_domain_correlation'],
        (evt) => {
          correlatedEvents.push(evt);
        },
        ['aegis', 'vessels', 'global'],
      );

      const correlationId = `incident-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const aegisSignal = await bus.publish({
        type: 'domain_signal',
        domain: 'aegis',
        sourceId: 'aegis-ids-sensor-07',
        severity: 'critical',
        correlationId,
        payload: {
          signalType: 'intrusion_detection',
          title: 'Unauthorized SSH access detected — Port of Rotterdam OT network',
          source_ip: '185.220.101.42',
          target: 'SCADA-RTU-07',
          protocol: 'SSH',
          geo: 'Tor exit node (Frankfurt)',
        },
      });

      const vesselsSignal = await bus.publish({
        type: 'domain_signal',
        domain: 'vessels',
        sourceId: 'vessels-ais-monitor',
        severity: 'high',
        correlationId,
        payload: {
          signalType: 'ais_anomaly',
          title: 'MV Nordic Pioneer — AIS transponder dark for 47 minutes near approach channel',
          vessel: 'MV Nordic Pioneer',
          imo: '9847231',
          flag: 'Marshall Islands',
          last_position: '51.95°N, 4.12°E',
          cargo: 'Crude Oil (VLCC)',
        },
      });

      const inputSources = [
        { type: 'threat_intel', id: 'OSINT-2026-0341', label: 'Maritime Cyber Threat Feed' },
        { type: 'ais_data', id: 'IMO-9847231', label: 'Vessel AIS Track History' },
        { type: 'scada_log', id: 'RTU-07-LOG', label: 'Port SCADA Event Log' },
        { type: 'historical', id: 'OG-4821', label: 'Prior similar incident (Rotterdam, 2025-11)' },
      ];

      const crossDomainLinks = [
        'SSH source IP previously flagged in maritime threat feed (OSINT-2026-0341)',
        'MV Nordic Pioneer scheduled berth at compromised port facility',
        'Temporal overlap: AIS dark period began 4 minutes before SSH intrusion',
        "Port SCADA target controls berth crane allocation for the vessel's assigned dock",
      ];

      const correlationEvent = await bus.publish({
        type: 'cross_domain_correlation',
        domain: 'global',
        sourceId: 'prism-correlation-engine',
        severity: 'critical',
        correlationId,
        payload: {
          confidence: 0.87,
          pattern: 'Coordinated port intrusion + vessel approach anomaly',
          linkedSignals: [aegisSignal.id, vesselsSignal.id],
          crossDomainLinks,
          inputSources,
        },
      });

      const busHistory = bus.getHistory({ correlationId });
      const busStats = bus.getStats();

      const recommendation: Recommendation = {
        title: 'Initiate port security lockdown and divert vessel to secondary anchorage',
        confidence: 0.82,
        modelId: 'szl-threat-correlation-v3',
        modelProvider: 'SZL CORTEX',
        correlationId,
        actions: [
          `Isolate ${aegisSignal.payload.target} from OT network (Aegis automated response)`,
          `Issue HOLD order for ${vesselsSignal.payload.vessel} via VTS channel 14`,
          'Deploy incident response team to port control room',
          `Notify flag state authority (${vesselsSignal.payload.flag} MDA)`,
        ],
        inputSources,
      };

      const monteCarloResult = runScenarioSimulation(VESSELS_VOYAGE_COST, 5000);

      const policyEngine = new CovenantPolicyEngine();
      policyEngineRef.current = policyEngine;
      policyEngine.register(MARITIME_RESPONSE_POLICY);

      const policyRequest = {
        subject: {
          userId: 'user-jvandenberg',
          roles: ['exec' as const, 'ops' as const],
          tenantId: 'szl-holdings',
          attributes: { department: 'maritime-security', clearanceLevel: 'top-secret' },
        },
        resource: {
          type: 'incident-response',
          id: correlationId,
          domain: 'vessels' as const,
          actionClass: 'emergency_response',
        },
        action: 'execute' as const,
        context: {
          correlationConfidence: correlationEvent.payload.confidence,
          estimatedCost: monteCarloResult.metrics['totalVoyageCost']?.p50 ?? 0,
          signalCount: busHistory.filter((e) => e.type === 'domain_signal').length,
          domains: ['aegis', 'vessels'],
        },
      };

      const policyDecision = policyEngine.evaluate(policyRequest);
      const policySimulation = policyEngine.simulate(policyRequest);

      await bus.publish({
        type: 'policy_decision',
        domain: 'global',
        sourceId: 'covenant-policy-engine',
        severity: 'info',
        correlationId,
        payload: {
          requestId: policyDecision.requestId,
          effect: policyDecision.effect,
          matchedPolicies: policyDecision.matchedPolicies,
          reason: policyDecision.reason,
        },
      });

      const now = Date.now();
      const executionSteps: ExecutionStep[] = [
        {
          action: `Isolate ${aegisSignal.payload.target}`,
          status: 'completed',
          duration: '12s',
          executor: 'Aegis Automated Response',
          triggeredAt: now,
        },
        {
          action: `VTS Channel 14 — HOLD order for ${vesselsSignal.payload.vessel}`,
          status: 'completed',
          duration: '34s',
          executor: 'Maritime Comms Gateway',
          triggeredAt: now + 12000,
        },
        {
          action: 'IR team dispatched to port control',
          status: 'completed',
          duration: '4m 12s',
          executor: 'Ops Coordinator',
          triggeredAt: now + 46000,
        },
        {
          action: `Flag state notification (${vesselsSignal.payload.flag} MDA)`,
          status: 'completed',
          duration: '1s',
          executor: 'Regulatory Compliance Engine',
          triggeredAt: now + 298000,
        },
      ];

      for (const step of executionSteps) {
        await bus.publish({
          type: 'execution_completed',
          domain: 'vessels',
          sourceId: step.executor.toLowerCase().replace(/\s+/g, '-'),
          severity: 'info',
          correlationId,
          payload: {
            action: step.action,
            status: step.status,
            duration: step.duration,
            executor: step.executor,
          },
        });
      }

      const promptText = `Correlate signals [${aegisSignal.id}, ${vesselsSignal.id}] across domains [aegis, vessels] and recommend response for pattern: ${correlationEvent.payload.pattern}`;
      const promptHashBytes = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(promptText),
      );
      const promptHash = Array.from(new Uint8Array(promptHashBytes))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 16);

      const proofRecord: ProofRecord = {
        proofChainId: `PC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        contentId: correlationId,
        contentType: 'incident_response_recommendation',
        sourceClass: 'llm_summarized',
        confidenceScore: recommendation.confidence,
        modelId: recommendation.modelId,
        modelProvider: recommendation.modelProvider,
        reviewState: 'approved',
        exportSafetyState: 'safe',
        promptHash,
        correlationId,
        inputSources: recommendation.inputSources,
        createdAt: new Date().toISOString(),
      };

      await bus.publish({
        type: 'evidence_captured',
        domain: 'global',
        sourceId: 'proof-chain-engine',
        severity: 'info',
        correlationId,
        payload: {
          proofChainId: proofRecord.proofChainId,
          sourceClass: proofRecord.sourceClass,
          contentType: proofRecord.contentType,
          confidenceScore: proofRecord.confidenceScore,
          reviewState: proofRecord.reviewState,
          exportSafetyState: proofRecord.exportSafetyState,
        },
      });

      const predictedCost = monteCarloResult.metrics['totalVoyageCost']?.p50 ?? 340;
      const predictedHours = (monteCarloResult.metrics['totalDays']?.p50 ?? 1) * 24;

      const outcomeRecord: OutcomeRecord = {
        outcomeId: `OG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        domain: monteCarloResult.domain,
        entityType: 'incident_response',
        recommendationText: recommendation.title,
        recommendationAction: 'lockdown_and_divert',
        confidence: recommendation.confidence,
        decisionStatus: policyDecision.allowed ? 'accepted' : 'rejected',
        outcomeResult: policyDecision.allowed ? 'achieved' : 'blocked',
        predictedCost,
        actualCost: predictedCost * 0.84,
        predictedHours,
        actualHours: predictedHours * 0.75,
        createdAt: new Date().toISOString(),
      };

      const finalBusHistory = bus.getHistory({ correlationId });
      const finalBusStats = bus.getStats();

      setState({
        status: 'complete',
        publishedSignals: finalBusHistory.filter((e) => e.type === 'domain_signal'),
        correlatedEvents: finalBusHistory.filter((e) => e.type === 'cross_domain_correlation'),
        busStats: finalBusStats,
        busHistory: finalBusHistory,
        policyDecision,
        policySimulation,
        monteCarloResult,
        recommendation,
        executionSteps,
        proofRecord,
        outcomeRecord,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  useEffect(() => {
    runDemo();
  }, [runDemo]);

  return state;
}
