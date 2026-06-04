import type { ToolRegistry } from '@workspace/tool-mesh';
import type { PlanStep } from './types.js';

export interface DiscoveryOptions {
  registry: ToolRegistry;
  maxToolsPerStep?: number;
  discoveryThresholdCount?: number;
}

export interface DiscoveredToolEntry {
  toolId: string;
  name: string;
  description: string;
  score: number;
}

function cacheKey(stepDescription: string, routeClass: string): string {
  return `${routeClass}:${stepDescription.slice(0, 80)}`;
}

export class DiscoverySession {
  private readonly cache = new Map<string, DiscoveredToolEntry[]>();

  discoverToolsForStep(step: PlanStep, options: DiscoveryOptions): DiscoveredToolEntry[] {
    const { registry, maxToolsPerStep = 5 } = options;
    const key = cacheKey(step.description, step.route.routeClass);

    const cached = this.cache.get(key);
    if (cached) return cached;

    const query = `${step.description} ${step.route.routeClass}`.trim();
    const results = registry.searchTools(query, { limit: maxToolsPerStep });
    const entries: DiscoveredToolEntry[] = results.map((r) => ({
      toolId: r.toolId,
      name: r.name,
      description: r.description,
      score: r.score,
    }));

    this.cache.set(key, entries);
    return entries;
  }

  annotateStepsWithDiscovery(steps: PlanStep[], options: DiscoveryOptions): PlanStep[] {
    const { registry, discoveryThresholdCount = 10 } = options;

    if (registry.count() <= discoveryThresholdCount) {
      return steps;
    }

    return steps.map((step) => {
      const discovered = this.discoverToolsForStep(step, options);
      const discoveredToolIds = discovered.map((d) => d.toolId);

      const updatedRoute =
        !step.route.toolId && discoveredToolIds.length > 0
          ? { ...step.route, toolId: discoveredToolIds[0] }
          : step.route;

      return {
        ...step,
        route: updatedRoute,
        metadata: {
          ...step.metadata,
          discoveredToolIds,
          discoveredTools: discovered,
          discoveryApplied: true,
        },
      };
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// ─── Module-level convenience functions (kept for backward compatibility) ─────
// These create a new DiscoverySession per call, so they are stateless.
// For session-scoped caching across multiple steps, use DiscoverySession directly.

export function discoverToolsForStep(
  step: PlanStep,
  options: DiscoveryOptions,
): DiscoveredToolEntry[] {
  return new DiscoverySession().discoverToolsForStep(step, options);
}

export function annotateStepsWithDiscovery(
  steps: PlanStep[],
  options: DiscoveryOptions,
): PlanStep[] {
  return new DiscoverySession().annotateStepsWithDiscovery(steps, options);
}

/**
 * @deprecated No-op since the refactor to instance-scoped `DiscoverySession`.
 *
 * The module-level discovery cache was removed when the global process-level
 * `Map` was replaced by `DiscoverySession` instances (each session owns its own
 * cache). There is no longer a shared cache to clear at the module level.
 *
 * If you need to clear the cache for a specific session, call
 * `session.clearCache()` on your `DiscoverySession` instance instead.
 */
export function clearDiscoveryCache(): void {
  // Intentional no-op: discovery caches are now scoped to DiscoverySession
  // instances. Use DiscoverySession.clearCache() to reset a specific session.
}
