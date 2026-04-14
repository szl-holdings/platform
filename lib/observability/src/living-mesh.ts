/**
 * Living Mesh — real-time heartbeat signals, distributed trace correlation,
 * GPU/compute metric schemas, business impact calculators, and a "Living Mesh"
 * event stream that broadcasts system vitality continuously.
 */

export interface HeartbeatSignal {
  serviceId: string;
  serviceName: string;
  timestamp: number;
  healthScore: number;
  pulse: number;
  latencyMs: number;
  errorRate: number;
  throughput: number;
  status: "alive" | "degraded" | "critical" | "dead";
  anomalyDetected: boolean;
  anomalyScore?: number;
}

export interface DistributedTraceSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  startTime: number;
  durationMs: number;
  status: "ok" | "error" | "timeout";
  tags?: Record<string, string | number | boolean>;
  db?: { query: string; durationMs: number };
  http?: { url: string; method: string; statusCode: number };
  ai?: { model: string; tokens: number; costUsd: number };
}

export interface DistributedTrace {
  traceId: string;
  correlationId: string;
  rootSpan: string;
  spans: DistributedTraceSpan[];
  totalDurationMs: number;
  startTime: number;
  endTime: number;
  status: "ok" | "error" | "partial";
  userAction?: string;
  affectedServices: string[];
  criticalPath: string[];
}

export interface GpuMetric {
  gpuId: string;
  gpuName: string;
  timestamp: number;
  utilizationPct: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
  temperatureC: number;
  powerWatts: number;
  computeWorkload: string;
}

export interface ModelInferenceMetric {
  modelId: string;
  modelName: string;
  provider: string;
  timestamp: number;
  latencyMs: number;
  tokensPerSecond: number;
  promptTokens: number;
  completionTokens: number;
  costPerInferenceUsd: number;
  driftScore: number;
  driftAlert: boolean;
  requestCount: number;
  errorRate: number;
}

export interface BusinessImpactEvent {
  eventId: string;
  timestamp: number;
  infraEventType: "latency_spike" | "error_surge" | "outage" | "security_incident" | "capacity_limit";
  affectedService: string;
  revenueImpactPerHourUsd: number;
  affectedClients: string[];
  affectedClientCount: number;
  slaBreachRisk: number;
  operationalCostUsd: number;
  description: string;
}

export interface PredictiveSignal {
  signalId: string;
  timestamp: number;
  type: "capacity_exhaustion" | "threat_trajectory" | "sla_breach" | "business_impact" | "anomaly_convergence";
  title: string;
  description: string;
  confidenceScore: number;
  predictedAt: number;
  severity: "info" | "warning" | "critical";
  timeToEventMs?: number;
  affectedEntities: string[];
  recommendedActions: string[];
  businessImpactUsd?: number;
}

export interface LivingMeshEvent {
  eventId: string;
  timestamp: number;
  type:
    | "heartbeat"
    | "anomaly_ripple"
    | "traffic_surge"
    | "connection_formed"
    | "connection_degraded"
    | "service_recovered"
    | "threat_detected"
    | "business_impact"
    | "predictive_alert";
  sourceServiceId: string;
  targetServiceId?: string;
  severity: "nominal" | "elevated" | "critical";
  magnitude: number;
  metadata?: Record<string, unknown>;
}

type LivingMeshListener = (event: LivingMeshEvent) => void;

const MAX_HEARTBEATS = 200;
const MAX_TRACES = 100;
const MAX_GPU_METRICS = 500;
const MAX_MODEL_METRICS = 1000;
const MAX_BUSINESS_IMPACTS = 200;
const MAX_PREDICTIVE_SIGNALS = 100;
const MAX_MESH_EVENTS = 500;

export class LivingMeshStream {
  private heartbeats: Map<string, HeartbeatSignal[]> = new Map();
  private traces: DistributedTrace[] = [];
  private gpuMetrics: GpuMetric[] = [];
  private modelMetrics: ModelInferenceMetric[] = [];
  private businessImpacts: BusinessImpactEvent[] = [];
  private predictiveSignals: PredictiveSignal[] = [];
  private meshEvents: LivingMeshEvent[] = [];
  private listeners: Set<LivingMeshListener> = new Set();

  recordHeartbeat(signal: HeartbeatSignal): void {
    const history = this.heartbeats.get(signal.serviceId) ?? [];
    history.push(signal);
    if (history.length > MAX_HEARTBEATS) history.shift();
    this.heartbeats.set(signal.serviceId, history);

    this.emitMeshEvent({
      type: signal.anomalyDetected ? "anomaly_ripple" : "heartbeat",
      sourceServiceId: signal.serviceId,
      severity: signal.status === "critical" ? "critical" : signal.status === "degraded" ? "elevated" : "nominal",
      magnitude: signal.anomalyScore ?? signal.healthScore,
    });
  }

  recordTrace(trace: DistributedTrace): void {
    this.traces.unshift(trace);
    if (this.traces.length > MAX_TRACES) this.traces.pop();
  }

  recordGpuMetric(metric: GpuMetric): void {
    this.gpuMetrics.push(metric);
    if (this.gpuMetrics.length > MAX_GPU_METRICS) this.gpuMetrics.shift();
  }

  recordModelMetric(metric: ModelInferenceMetric): void {
    this.modelMetrics.push(metric);
    if (this.modelMetrics.length > MAX_MODEL_METRICS) this.modelMetrics.shift();
  }

  recordBusinessImpact(impact: BusinessImpactEvent): void {
    this.businessImpacts.unshift(impact);
    if (this.businessImpacts.length > MAX_BUSINESS_IMPACTS) this.businessImpacts.pop();

    this.emitMeshEvent({
      type: "business_impact",
      sourceServiceId: impact.affectedService,
      severity: impact.revenueImpactPerHourUsd > 10000 ? "critical" : "elevated",
      magnitude: Math.min(100, impact.revenueImpactPerHourUsd / 1000),
      metadata: { revenueImpact: impact.revenueImpactPerHourUsd },
    });
  }

  recordPredictiveSignal(signal: PredictiveSignal): void {
    this.predictiveSignals.unshift(signal);
    if (this.predictiveSignals.length > MAX_PREDICTIVE_SIGNALS) this.predictiveSignals.pop();

    this.emitMeshEvent({
      type: "predictive_alert",
      sourceServiceId: signal.affectedEntities[0] ?? "system",
      severity: signal.severity === "critical" ? "critical" : signal.severity === "warning" ? "elevated" : "nominal",
      magnitude: signal.confidenceScore,
    });
  }

  emitMeshEvent(partial: Omit<LivingMeshEvent, "eventId" | "timestamp">): LivingMeshEvent {
    const event: LivingMeshEvent = {
      ...partial,
      eventId: `me_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    this.meshEvents.unshift(event);
    if (this.meshEvents.length > MAX_MESH_EVENTS) this.meshEvents.pop();
    this.listeners.forEach(l => l(event));
    return event;
  }

  subscribe(listener: LivingMeshListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getHeartbeats(serviceId?: string): HeartbeatSignal[] {
    if (serviceId) {
      return this.heartbeats.get(serviceId) ?? [];
    }
    const all: HeartbeatSignal[] = [];
    for (const signals of this.heartbeats.values()) {
      if (signals.length > 0) all.push(signals[signals.length - 1]!);
    }
    return all;
  }

  getTraces(windowMs = 300_000): DistributedTrace[] {
    const cutoff = Date.now() - windowMs;
    return this.traces.filter(t => t.startTime >= cutoff);
  }

  getGpuMetrics(windowMs = 60_000): GpuMetric[] {
    const cutoff = Date.now() - windowMs;
    return this.gpuMetrics.filter(m => m.timestamp >= cutoff);
  }

  getLatestGpuByDevice(): Map<string, GpuMetric> {
    const latest = new Map<string, GpuMetric>();
    for (const m of [...this.gpuMetrics].reverse()) {
      if (!latest.has(m.gpuId)) latest.set(m.gpuId, m);
    }
    return latest;
  }

  getModelMetrics(windowMs = 300_000): ModelInferenceMetric[] {
    const cutoff = Date.now() - windowMs;
    return this.modelMetrics.filter(m => m.timestamp >= cutoff);
  }

  getLatestModelMetrics(): Map<string, ModelInferenceMetric> {
    const latest = new Map<string, ModelInferenceMetric>();
    for (const m of [...this.modelMetrics].reverse()) {
      if (!latest.has(m.modelId)) latest.set(m.modelId, m);
    }
    return latest;
  }

  getBusinessImpacts(windowMs = 3_600_000): BusinessImpactEvent[] {
    const cutoff = Date.now() - windowMs;
    return this.businessImpacts.filter(b => b.timestamp >= cutoff);
  }

  getTotalRevenueImpact(windowMs = 3_600_000): number {
    return this.getBusinessImpacts(windowMs).reduce((s, b) => s + b.revenueImpactPerHourUsd, 0);
  }

  getPredictiveSignals(windowMs = 3_600_000): PredictiveSignal[] {
    const cutoff = Date.now() - windowMs;
    return this.predictiveSignals.filter(s => s.timestamp >= cutoff);
  }

  getMeshEvents(windowMs = 300_000): LivingMeshEvent[] {
    const cutoff = Date.now() - windowMs;
    return this.meshEvents.filter(e => e.timestamp >= cutoff);
  }

  calculateBusinessImpact(service: string, durationMs: number, errorRatePct: number): number {
    const BASE_REVENUE_PER_HOUR: Record<string, number> = {
      "api-gateway": 50000,
      "lyte-core": 30000,
      "alloy-engine": 20000,
      "firestorm-soc": 25000,
      default: 10000,
    };
    const baseRate = BASE_REVENUE_PER_HOUR[service] ?? BASE_REVENUE_PER_HOUR.default;
    const impactFraction = Math.min(1, errorRatePct / 100);
    const hoursAffected = durationMs / 3_600_000;
    return baseRate * impactFraction * hoursAffected;
  }
}

export const livingMesh = new LivingMeshStream();

export function seedLivingMeshData(): void {
  const services = [
    "api-gateway", "lyte-core", "alloy-engine", "firestorm-soc",
    "signal-bus", "ml-inference", "terra-beacon", "vessels-intel",
  ];
  const models = [
    { id: "alloy-gpt4", name: "Alloy GPT-4o", provider: "openai" },
    { id: "quipu-claude", name: "Quipu Claude-3.5", provider: "anthropic" },
    { id: "rag-embed", name: "RAG Embedder ada-002", provider: "openai" },
    { id: "drift-detector", name: "Drift Detector v2", provider: "custom" },
  ];

  const now = Date.now();

  for (const svc of services) {
    const base = 70 + Math.random() * 25;
    for (let i = 30; i >= 0; i--) {
      const jitter = (Math.random() - 0.5) * 20;
      const score = Math.max(0, Math.min(100, base + jitter));
      const anomaly = Math.random() < 0.05;
      livingMesh.recordHeartbeat({
        serviceId: svc,
        serviceName: svc.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        timestamp: now - i * 10_000,
        healthScore: score,
        pulse: 60 + Math.random() * 40,
        latencyMs: 20 + Math.random() * 180,
        errorRate: Math.random() * 3,
        throughput: 100 + Math.random() * 900,
        status: score > 70 ? "alive" : score > 50 ? "degraded" : "critical",
        anomalyDetected: anomaly,
        anomalyScore: anomaly ? 60 + Math.random() * 40 : undefined,
      });
    }
  }

  for (const model of models) {
    for (let i = 20; i >= 0; i--) {
      livingMesh.recordModelMetric({
        modelId: model.id,
        modelName: model.name,
        provider: model.provider,
        timestamp: now - i * 15_000,
        latencyMs: 300 + Math.random() * 1200,
        tokensPerSecond: 50 + Math.random() * 150,
        promptTokens: 200 + Math.random() * 800,
        completionTokens: 100 + Math.random() * 400,
        costPerInferenceUsd: 0.001 + Math.random() * 0.05,
        driftScore: Math.random() * 30,
        driftAlert: Math.random() < 0.1,
        requestCount: Math.floor(10 + Math.random() * 100),
        errorRate: Math.random() * 5,
      });
    }
  }

  const gpus = ["GPU-0 A100", "GPU-1 A100", "GPU-2 H100", "GPU-3 H100"];
  for (let i = 0; i < gpus.length; i++) {
    for (let j = 10; j >= 0; j--) {
      livingMesh.recordGpuMetric({
        gpuId: `gpu-${i}`,
        gpuName: gpus[i]!,
        timestamp: now - j * 5_000,
        utilizationPct: 40 + Math.random() * 55,
        memoryUsedGb: 20 + Math.random() * 40,
        memoryTotalGb: 80,
        temperatureC: 55 + Math.random() * 30,
        powerWatts: 200 + Math.random() * 200,
        computeWorkload: ["Alloy Inference", "RAG Pipeline", "Embedding", "Drift Detection"][i % 4]!,
      });
    }
  }

  const impactTypes: BusinessImpactEvent["infraEventType"][] = ["latency_spike", "error_surge", "security_incident"];
  for (let i = 0; i < 8; i++) {
    livingMesh.recordBusinessImpact({
      eventId: `bi_${now}_${i}`,
      timestamp: now - i * 600_000,
      infraEventType: impactTypes[i % impactTypes.length]!,
      affectedService: services[i % services.length]!,
      revenueImpactPerHourUsd: 1000 + Math.random() * 25000,
      affectedClients: ["Northgate Corp", "Meridian Fund", "Pacific Logistics"].slice(0, 1 + Math.floor(Math.random() * 3)),
      affectedClientCount: 1 + Math.floor(Math.random() * 15),
      slaBreachRisk: 20 + Math.random() * 75,
      operationalCostUsd: 500 + Math.random() * 5000,
      description: `${impactTypes[i % impactTypes.length]} detected on ${services[i % services.length]}`,
    });
  }

  const predTypes: PredictiveSignal["type"][] = ["capacity_exhaustion", "threat_trajectory", "sla_breach", "business_impact"];
  for (let i = 0; i < 6; i++) {
    livingMesh.recordPredictiveSignal({
      signalId: `ps_${now}_${i}`,
      timestamp: now - i * 300_000,
      type: predTypes[i % predTypes.length]!,
      title: [
        "API Gateway capacity exhaustion in ~4 hours",
        "Threat actor TTP progression toward lateral movement",
        "SLA breach risk: 3 client agreements",
        "Revenue impact from ML inference bottleneck",
        "Database query degradation accelerating",
        "Compliance drift approaching threshold",
      ][i]!,
      description: "Predictive model confidence based on trend analysis over 72h window",
      confidenceScore: 70 + Math.random() * 25,
      predictedAt: now - i * 300_000,
      severity: i < 2 ? "critical" : i < 4 ? "warning" : "info",
      timeToEventMs: (2 + i) * 3_600_000,
      affectedEntities: [services[i % services.length]!],
      recommendedActions: [
        "Scale compute allocation by 40%",
        "Activate containment playbook Alpha-3",
        "Notify account managers and extend SLA window",
      ],
      businessImpactUsd: 5000 + Math.random() * 50000,
    });
  }
}
