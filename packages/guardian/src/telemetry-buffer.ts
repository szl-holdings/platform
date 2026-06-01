/**
 * Guardrail Telemetry Buffer
 *
 * Collects structured telemetry events from the Guardian decision engine
 * and policy engine evaluator. Events are buffered in-memory with periodic
 * DB flush (DB flush is a no-op stub in this version; replace with your
 * persistence layer as needed).
 *
 * Operators query the rolling buffer to power the Guardrail Health dashboard.
 */

export type TelemetryOutcome = 'allow' | 'deny' | 'block' | 'require-approval' | 'require-dual-approval' | 'escalate' | 'override';

export interface GuardrailTelemetryEvent {
  eventId: string;
  guardrailId: string;
  guardrailName: string;
  outcome: TelemetryOutcome;
  latencyMs: number;
  tier: string;
  domain?: string;
  agentId?: string;
  isOverride: boolean;
  estimatedCostSavedUsd?: number;
  recordedAt: number;
}

export interface GuardrailStats {
  guardrailId: string;
  guardrailName: string;
  totalEvaluations: number;
  triggerRate: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  overrideCount: number;
  falsePositiveRate: number;
  estimatedCostSavedUsd: number;
  lastTriggeredAt: number | null;
}

const MAX_EVENTS = 10_000;

class GuardrailTelemetryBuffer {
  private events: GuardrailTelemetryEvent[] = [];

  record(event: GuardrailTelemetryEvent): void {
    this.events.push(event);
    if (this.events.length > MAX_EVENTS) {
      this.events.shift();
    }
  }

  getEvents(since?: number, guardrailId?: string): GuardrailTelemetryEvent[] {
    let result = [...this.events];
    if (since !== undefined) result = result.filter((e) => e.recordedAt >= since);
    if (guardrailId !== undefined) result = result.filter((e) => e.guardrailId === guardrailId);
    return result;
  }

  computeStats(windowMs: number = 24 * 60 * 60 * 1000): GuardrailStats[] {
    const since = Date.now() - windowMs;
    const windowEvents = this.events.filter((e) => e.recordedAt >= since);

    const byGuardrail = new Map<string, GuardrailTelemetryEvent[]>();
    for (const ev of windowEvents) {
      const list = byGuardrail.get(ev.guardrailId) ?? [];
      list.push(ev);
      byGuardrail.set(ev.guardrailId, list);
    }

    const stats: GuardrailStats[] = [];
    for (const [guardrailId, evs] of byGuardrail.entries()) {
      const sorted = [...evs].sort((a, b) => a.latencyMs - b.latencyMs);
      const total = evs.length;
      const overrides = evs.filter((e) => e.isOverride).length;
      const triggered = evs.filter((e) => e.outcome !== 'allow').length;
      const totalCost = evs.reduce((s, e) => s + (e.estimatedCostSavedUsd ?? 0), 0);
      const medianIdx = Math.floor(sorted.length / 2);
      const p95Idx = Math.floor(sorted.length * 0.95);

      stats.push({
        guardrailId,
        guardrailName: evs[0]?.guardrailName ?? guardrailId,
        totalEvaluations: total,
        triggerRate: total > 0 ? triggered / total : 0,
        medianLatencyMs: sorted[medianIdx]?.latencyMs ?? 0,
        p95LatencyMs: sorted[Math.min(p95Idx, sorted.length - 1)]?.latencyMs ?? 0,
        overrideCount: overrides,
        falsePositiveRate: triggered > 0 ? overrides / triggered : 0,
        estimatedCostSavedUsd: totalCost,
        lastTriggeredAt: evs.reduce((m, e) => Math.max(m, e.recordedAt), 0) || null,
      });
    }

    return stats.sort((a, b) => b.totalEvaluations - a.totalEvaluations);
  }

  clear(): void {
    this.events = [];
  }
}

export const globalTelemetryBuffer = new GuardrailTelemetryBuffer();

let _eventCounter = 0;
export function nextEventId(): string {
  return `gtev-${Date.now()}-${++_eventCounter}`;
}
