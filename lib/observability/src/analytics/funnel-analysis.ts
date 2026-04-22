import type {
  FilterCondition,
  FunnelAnalysisResult,
  FunnelDefinitionInput,
  FunnelStepResult,
} from './types.js';

// ---------------------------------------------------------------------------
// Funnel event record
// ---------------------------------------------------------------------------

export interface FunnelEvent {
  entityId: string;
  eventName: string;
  properties?: Record<string, unknown>;
  occurredAt: Date;
}

// ---------------------------------------------------------------------------
// Step matching
// ---------------------------------------------------------------------------

function matchesStep(
  event: FunnelEvent,
  stepEventName: string,
  conditions?: FilterCondition[],
): boolean {
  if (event.eventName !== stepEventName) return false;
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((cond) => {
    const val = event.properties?.[cond.field];
    switch (cond.operator) {
      case 'eq':
        return val === cond.value;
      case 'neq':
        return val !== cond.value;
      case 'gt':
        return typeof val === 'number' && val > (cond.value as number);
      case 'gte':
        return typeof val === 'number' && val >= (cond.value as number);
      case 'lt':
        return typeof val === 'number' && val < (cond.value as number);
      case 'lte':
        return typeof val === 'number' && val <= (cond.value as number);
      case 'in':
        return Array.isArray(cond.value) && (cond.value as unknown[]).includes(val);
      case 'contains':
        return typeof val === 'string' && val.includes(String(cond.value));
      default:
        return true;
    }
  });
}

// ---------------------------------------------------------------------------
// Per-entity funnel path tracing
// ---------------------------------------------------------------------------

interface EntityFunnelTrace {
  entityId: string;
  completedSteps: number;
  stepTimestamps: Date[];
  stepToStepMs: number[];
}

function traceEntityFunnel(
  entityEvents: FunnelEvent[],
  definition: FunnelDefinitionInput,
): EntityFunnelTrace {
  const { steps, windowHours = 168 } = definition;
  const sorted = [...entityEvents].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const stepTimestamps: Date[] = [];
  let currentStepIndex = 0;
  let windowStart: Date | null = null;

  for (const event of sorted) {
    if (currentStepIndex >= steps.length) break;
    const step = steps[currentStepIndex];
    if (!step) break;

    const isMatch = matchesStep(event, step.eventName, step.conditions);
    if (!isMatch) continue;

    if (currentStepIndex === 0) {
      windowStart = event.occurredAt;
      stepTimestamps.push(event.occurredAt);
      currentStepIndex++;
    } else if (windowStart) {
      const windowEnd = new Date(windowStart.getTime() + windowHours * 60 * 60 * 1000);
      if (event.occurredAt <= windowEnd) {
        stepTimestamps.push(event.occurredAt);
        currentStepIndex++;
      }
    }
  }

  const stepToStepMs: number[] = [];
  for (let i = 1; i < stepTimestamps.length; i++) {
    stepToStepMs.push(stepTimestamps[i]?.getTime() - stepTimestamps[i - 1]?.getTime());
  }

  return {
    entityId: sorted[0]?.entityId ?? '',
    completedSteps: currentStepIndex,
    stepTimestamps,
    stepToStepMs,
  };
}

// ---------------------------------------------------------------------------
// Full funnel analysis runner
// ---------------------------------------------------------------------------

export function runFunnelAnalysis(
  definition: FunnelDefinitionInput,
  events: FunnelEvent[],
  from: Date,
  to: Date,
  _segmentDimension?: string,
): FunnelAnalysisResult {
  const { steps, funnelId, domain } = definition;

  const inWindow = events.filter((e) => e.occurredAt >= from && e.occurredAt <= to);

  const byEntity = new Map<string, FunnelEvent[]>();
  for (const event of inWindow) {
    const group = byEntity.get(event.entityId) ?? [];
    group.push(event);
    byEntity.set(event.entityId, group);
  }

  const traces: EntityFunnelTrace[] = [];
  for (const [_id, entityEvents] of byEntity) {
    traces.push(traceEntityFunnel(entityEvents, definition));
  }

  const totalEntries = traces.filter((t) => t.completedSteps >= 1).length;
  const totalCompletions = traces.filter((t) => t.completedSteps >= steps.length).length;
  const overallConversionRate = totalEntries > 0 ? (totalCompletions / totalEntries) * 100 : 0;

  const stepResults: FunnelStepResult[] = steps.map((step, idx) => {
    const reachedThis = traces.filter((t) => t.completedSteps > idx).length;
    const reachedPrev =
      idx === 0 ? totalEntries : traces.filter((t) => t.completedSteps > idx - 1).length;

    const timesToStep = traces
      .filter((t) => t.stepToStepMs[idx] !== undefined)
      .map((t) => t.stepToStepMs[idx]!);
    const avgTimeToStep =
      timesToStep.length > 0
        ? timesToStep.reduce((s, v) => s + v, 0) / timesToStep.length / 1000
        : undefined;

    const segments: Record<string, number> | undefined = undefined;

    return {
      stepId: step.id,
      stepName: step.name,
      eventName: step.eventName,
      count: reachedThis,
      conversionRate: reachedPrev > 0 ? (reachedThis / reachedPrev) * 100 : 0,
      dropoffRate: reachedPrev > 0 ? ((reachedPrev - reachedThis) / reachedPrev) * 100 : 0,
      ...(avgTimeToStep !== undefined ? { avgTimeToStep } : {}),
      ...(segments !== undefined ? { segments } : {}),
    };
  });

  return {
    funnelId,
    domain,
    periodStart: from,
    periodEnd: to,
    totalEntries,
    totalCompletions,
    overallConversionRate,
    steps: stepResults,
  };
}

// ---------------------------------------------------------------------------
// Funnel segment drill-down
// ---------------------------------------------------------------------------

export function drillDownFunnelBySegment(
  definition: FunnelDefinitionInput,
  events: FunnelEvent[],
  from: Date,
  to: Date,
  segmentKey: string,
): Map<string, FunnelAnalysisResult> {
  const segmentValues = new Set<string>();
  for (const event of events) {
    const segVal = event.properties?.[segmentKey];
    if (typeof segVal === 'string') segmentValues.add(segVal);
  }

  const results = new Map<string, FunnelAnalysisResult>();
  for (const segValue of segmentValues) {
    const segEvents = events.filter((e) => e.properties?.[segmentKey] === segValue);
    results.set(segValue, runFunnelAnalysis(definition, segEvents, from, to, segmentKey));
  }
  return results;
}
