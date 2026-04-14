/**
 * Orchestration Telemetry Pipeline
 *
 * Persists every OrchestrationTelemetry event to the DB.
 * Implements the full OrchestrationTelemetry type contract.
 * Powers the observability dashboard query API.
 */
import type { OrchestrationTelemetry } from "../types.js";

export async function persistTelemetry(telemetry: OrchestrationTelemetry): Promise<void> {
  try {
    const { db, orchestrationTelemetryTable } = await import("@szl-holdings/db");
    await db.insert(orchestrationTelemetryTable).values({
      orchestrationId: telemetry.orchestrationId,
      timestamp: new Date(telemetry.timestamp),
      selectedAgents: telemetry.routingDecision.selectedAgents,
      routingScores: (telemetry.routingDecision.routingScores ?? null) as unknown as Record<string, unknown> | null,
      agentPerformance: telemetry.agentPerformance as unknown as Record<string, unknown>,
      causalChains: telemetry.causalChains as unknown as Record<string, unknown>,
      conflicts: telemetry.conflicts as unknown as Record<string, unknown>,
      proactiveActivations: telemetry.proactiveActivations as unknown as Record<string, unknown>,
      totalLatencyMs: telemetry.totalLatencyMs,
      tokensBurned: telemetry.tokensBurned,
    });
  } catch (err) {
    console.warn("[telemetry-pipeline] Failed to persist telemetry:", err);
  }
}

export interface TelemetryQueryOptions {
  limit?: number;
  since?: Date;
  hasConflicts?: boolean;
  hasCausalChains?: boolean;
  hasProactiveActivations?: boolean;
  agentId?: string;
}

export async function queryTelemetry(options: TelemetryQueryOptions = {}) {
  try {
    const { db, orchestrationTelemetryTable } = await import("@szl-holdings/db");
    const { desc, gte, sql } = await import("drizzle-orm");

    const conditions: ReturnType<typeof sql>[] = [];

    if (options.since) {
      conditions.push(gte(orchestrationTelemetryTable.timestamp, options.since) as unknown as ReturnType<typeof sql>);
    }

    const rows = await db
      .select()
      .from(orchestrationTelemetryTable)
      .orderBy(desc(orchestrationTelemetryTable.timestamp))
      .limit(Math.min(options.limit ?? 50, 200));

    let filtered = rows;

    if (options.hasConflicts) {
      filtered = filtered.filter(r => {
        const conflicts = r.conflicts as unknown as unknown[];
        return Array.isArray(conflicts) && conflicts.length > 0;
      });
    }

    if (options.hasCausalChains) {
      filtered = filtered.filter(r => {
        const chains = r.causalChains as unknown as unknown[];
        return Array.isArray(chains) && chains.length > 0;
      });
    }

    if (options.hasProactiveActivations) {
      filtered = filtered.filter(r => {
        const activations = r.proactiveActivations as unknown as unknown[];
        return Array.isArray(activations) && activations.length > 0;
      });
    }

    if (options.agentId) {
      const agentId = options.agentId;
      filtered = filtered.filter(r =>
        Array.isArray(r.selectedAgents) && r.selectedAgents.includes(agentId)
      );
    }

    return filtered;
  } catch (err) {
    console.warn("[telemetry-pipeline] Query failed:", err);
    return [];
  }
}

export async function getTelemetrySummary() {
  try {
    const { db, orchestrationTelemetryTable } = await import("@szl-holdings/db");
    const { desc, sql } = await import("drizzle-orm");

    const recent = await db
      .select()
      .from(orchestrationTelemetryTable)
      .orderBy(desc(orchestrationTelemetryTable.timestamp))
      .limit(100);

    if (recent.length === 0) {
      return { totalRuns: 0, avgLatencyMs: 0, totalTokensBurned: 0, conflictRate: 0, causalChainRate: 0, proactiveActivationRate: 0 };
    }

    const totalRuns = recent.length;
    const avgLatencyMs = Math.round(recent.reduce((sum, r) => sum + r.totalLatencyMs, 0) / totalRuns);
    const totalTokensBurned = recent.reduce((sum, r) => sum + r.tokensBurned, 0);
    const conflictCount = recent.filter(r => Array.isArray(r.conflicts) && (r.conflicts as unknown[]).length > 0).length;
    const causalCount = recent.filter(r => Array.isArray(r.causalChains) && (r.causalChains as unknown[]).length > 0).length;
    const proactiveCount = recent.filter(r => Array.isArray(r.proactiveActivations) && (r.proactiveActivations as unknown[]).length > 0).length;

    return {
      totalRuns,
      avgLatencyMs,
      totalTokensBurned,
      conflictRate: Math.round((conflictCount / totalRuns) * 100),
      causalChainRate: Math.round((causalCount / totalRuns) * 100),
      proactiveActivationRate: Math.round((proactiveCount / totalRuns) * 100),
    };
  } catch {
    return { totalRuns: 0, avgLatencyMs: 0, totalTokensBurned: 0, conflictRate: 0, causalChainRate: 0, proactiveActivationRate: 0 };
  }
}
