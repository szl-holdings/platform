/**
 * Protocol Telemetry & Health
 *
 * Tracks per-protocol request latency, throughput, error rates,
 * cross-protocol bridge events, and agent discovery metrics.
 */

import { logger } from "./logger";

export type ProtocolType = "mcp" | "a2a" | "anp" | "acp";

export interface ProtocolRequest {
  id: string;
  protocol: ProtocolType;
  agentId: string;
  action: string;
  latencyMs: number;
  success: boolean;
  timestamp: string;
  isProtocolCrossing: boolean;
  crossingDetails?: ProtocolCrossing;
}

export interface ProtocolCrossing {
  fromProtocol: ProtocolType;
  toProtocol: ProtocolType;
  agentId: string;
  trustLevel: string;
  governanceRequired: boolean;
  taskId?: string;
}

export interface ProtocolMetrics {
  protocol: ProtocolType;
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  requestsLast5Min: number;
  errorCount: number;
  crossingCount: number;
}

export interface GatewayStats {
  totalRequests: number;
  byProtocol: Record<ProtocolType, ProtocolMetrics>;
  crossProtocolBridges: number;
  governanceCheckpoints: number;
  agentDiscoveryHits: Record<string, number>;
  uptime: number;
  lastReset: string;
}

const MAX_TELEMETRY = 1000;
const telemetryStore: ProtocolRequest[] = [];
const discoveryHits: Record<string, number> = {};
const startTime = Date.now();
let governanceCheckpointCount = 0;

const protocolCounters: Record<ProtocolType, {
  total: number;
  errors: number;
  crossings: number;
  latencies: number[];
}> = {
  mcp: { total: 0, errors: 0, crossings: 0, latencies: [] },
  a2a: { total: 0, errors: 0, crossings: 0, latencies: [] },
  anp: { total: 0, errors: 0, crossings: 0, latencies: [] },
  acp: { total: 0, errors: 0, crossings: 0, latencies: [] },
};

export async function recordProtocolRequest(
  protocol: ProtocolType,
  agentId: string,
  action: string,
  latencyMs: number,
  success = true,
): Promise<void> {
  const entry: ProtocolRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    protocol,
    agentId,
    action,
    latencyMs,
    success,
    timestamp: new Date().toISOString(),
    isProtocolCrossing: false,
  };

  telemetryStore.unshift(entry);
  if (telemetryStore.length > MAX_TELEMETRY) {
    telemetryStore.length = MAX_TELEMETRY;
  }

  const counter = protocolCounters[protocol];
  counter.total++;
  if (!success) counter.errors++;
  counter.latencies.push(latencyMs);
  if (counter.latencies.length > 200) counter.latencies.shift();
}

export async function recordProtocolCrossing(crossing: ProtocolCrossing): Promise<void> {
  const entry: ProtocolRequest = {
    id: `cross_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    protocol: crossing.fromProtocol,
    agentId: crossing.agentId,
    action: `bridge_${crossing.fromProtocol}_to_${crossing.toProtocol}`,
    latencyMs: 0,
    success: true,
    timestamp: new Date().toISOString(),
    isProtocolCrossing: true,
    crossingDetails: crossing,
  };

  telemetryStore.unshift(entry);
  if (telemetryStore.length > MAX_TELEMETRY) {
    telemetryStore.length = MAX_TELEMETRY;
  }

  protocolCounters[crossing.fromProtocol].crossings++;

  if (crossing.governanceRequired) {
    governanceCheckpointCount++;
  }

  logger.info({
    fromProtocol: crossing.fromProtocol,
    toProtocol: crossing.toProtocol,
    agentId: crossing.agentId,
    trustLevel: crossing.trustLevel,
    governanceRequired: crossing.governanceRequired,
  }, "Cross-protocol bridge event");
}

export function recordDiscoveryHit(domain: string, format: string): void {
  const key = `${domain}:${format}`;
  discoveryHits[key] = (discoveryHits[key] ?? 0) + 1;
}

function computeP95(latencies: number[]): number {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.95);
  return sorted[idx] ?? sorted[sorted.length - 1] ?? 0;
}

function computeMetrics(protocol: ProtocolType): ProtocolMetrics {
  const counter = protocolCounters[protocol];
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const recentRequests = telemetryStore.filter(
    r => r.protocol === protocol && new Date(r.timestamp).getTime() >= fiveMinAgo
  );

  const avgLatency = counter.latencies.length > 0
    ? counter.latencies.reduce((a, b) => a + b, 0) / counter.latencies.length
    : 0;

  return {
    protocol,
    totalRequests: counter.total,
    successRate: counter.total > 0 ? (counter.total - counter.errors) / counter.total : 1,
    avgLatencyMs: Math.round(avgLatency),
    p95LatencyMs: computeP95(counter.latencies),
    requestsLast5Min: recentRequests.length,
    errorCount: counter.errors,
    crossingCount: counter.crossings,
  };
}

export async function getGatewayStats(): Promise<GatewayStats> {
  const totalCrossings = telemetryStore.filter(r => r.isProtocolCrossing).length;
  const totalRequests = Object.values(protocolCounters).reduce((a, c) => a + c.total, 0);

  return {
    totalRequests,
    byProtocol: {
      mcp: computeMetrics("mcp"),
      a2a: computeMetrics("a2a"),
      anp: computeMetrics("anp"),
      acp: computeMetrics("acp"),
    },
    crossProtocolBridges: totalCrossings,
    governanceCheckpoints: governanceCheckpointCount,
    agentDiscoveryHits: discoveryHits,
    uptime: Date.now() - startTime,
    lastReset: new Date(startTime).toISOString(),
  };
}

export function getProtocolTelemetry(limit = 100): ProtocolRequest[] {
  return telemetryStore.slice(0, limit);
}

export function getProtocolMetricsByAgent(agentId: string, limit = 50): ProtocolRequest[] {
  return telemetryStore.filter(r => r.agentId === agentId).slice(0, limit);
}
