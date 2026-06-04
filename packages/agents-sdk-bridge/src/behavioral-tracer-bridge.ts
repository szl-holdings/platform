/**
 * BehavioralTracerBridge — minimal interface for recording routing DecisionForks
 * via the behavioral-tracer without a direct import cycle.
 *
 * The bridge can be wired at startup with the real behavioral tracer from
 * lib/ai-engine, or left unset for environments where it's not available.
 */

export interface RoutingForkRecord {
  forkId: string;
  parentForkId: string | null;
  traceId: string;
  agentId: string;
  agentName: string;
  domain: string;
  decision: string;
  output: string;
  latencyMs: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface BehavioralTracerBridge {
  recordRoutingFork(fork: RoutingForkRecord): Promise<void>;
}

/**
 * No-op bridge — used as default when no behavioral tracer is wired in.
 */
export class NoopBehavioralTracerBridge implements BehavioralTracerBridge {
  async recordRoutingFork(_fork: RoutingForkRecord): Promise<void> {
  }
}
