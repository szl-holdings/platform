import type { CohortAnalysisResult, CohortDefinitionInput, FilterCondition } from './types.js';

// ---------------------------------------------------------------------------
// Cohort entity record
// ---------------------------------------------------------------------------

export interface CohortEntity {
  entityId: string;
  entityType: string;
  domain: string;
  cohortDate: Date;
  properties: Record<string, unknown>;
  events: Array<{ eventName: string; occurredAt: Date; numericValue?: number }>;
}

// ---------------------------------------------------------------------------
// Core cohort analysis functions
// ---------------------------------------------------------------------------

export function assignEntityToCohort(
  entity: CohortEntity,
  definition: CohortDefinitionInput,
): boolean {
  if (definition.entryConditions && definition.entryConditions.length > 0) {
    return definition.entryConditions.every((cond) =>
      matchesCohortCondition(entity.properties, cond),
    );
  }
  if (definition.entryEventName) {
    return entity.events.some((e) => e.eventName === definition.entryEventName);
  }
  return true;
}

function matchesCohortCondition(props: Record<string, unknown>, cond: FilterCondition): boolean {
  const val = props[cond.field];
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
}

// ---------------------------------------------------------------------------
// Retention curve computation
// ---------------------------------------------------------------------------

export function computeRetentionCurve(
  entities: CohortEntity[],
  cohortDate: Date,
  windowDays: number,
  retentionEventName?: string,
): Array<{
  periodIndex: number;
  label: string;
  cohortSize: number;
  activeEntities: number;
  retentionRate: number;
}> {
  const periods: Array<{
    periodIndex: number;
    label: string;
    cohortSize: number;
    activeEntities: number;
    retentionRate: number;
  }> = [];
  const cohortSize = entities.length;
  if (cohortSize === 0) return periods;

  for (let period = 0; period <= Math.floor(windowDays / 7); period++) {
    const periodStart = new Date(cohortDate.getTime() + period * 7 * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const activeEntities = entities.filter((entity) => {
      return entity.events.some((e) => {
        const matches = retentionEventName ? e.eventName === retentionEventName : true;
        return matches && e.occurredAt >= periodStart && e.occurredAt < periodEnd;
      });
    }).length;

    periods.push({
      periodIndex: period,
      label: period === 0 ? 'Week 0' : `Week ${period}`,
      cohortSize,
      activeEntities,
      retentionRate: cohortSize > 0 ? (activeEntities / cohortSize) * 100 : 0,
    });
  }

  return periods;
}

// ---------------------------------------------------------------------------
// Lifetime value (LTV) computation
// ---------------------------------------------------------------------------

export function computeLTV(
  entities: CohortEntity[],
  valueEventName: string,
  _valueField: string = 'amount',
): {
  totalLTV: number;
  avgLTVPerEntity: number;
  entityLTVs: Array<{ entityId: string; ltv: number }>;
} {
  const entityLTVs = entities.map((entity) => {
    const ltv = entity.events
      .filter((e) => e.eventName === valueEventName)
      .reduce((sum, e) => sum + (e.numericValue ?? 0), 0);
    return { entityId: entity.entityId, ltv };
  });

  const totalLTV = entityLTVs.reduce((s, e) => s + e.ltv, 0);
  const avgLTVPerEntity = entities.length > 0 ? totalLTV / entities.length : 0;

  return { totalLTV, avgLTVPerEntity, entityLTVs };
}

// ---------------------------------------------------------------------------
// Cohort grouping by time period
// ---------------------------------------------------------------------------

export interface CohortGroup {
  cohortLabel: string;
  cohortDate: Date;
  entities: CohortEntity[];
}

export function groupEntitiesByMonth(entities: CohortEntity[]): CohortGroup[] {
  const grouped = new Map<string, CohortEntity[]>();
  for (const entity of entities) {
    const key = `${entity.cohortDate.getFullYear()}-${String(entity.cohortDate.getMonth() + 1).padStart(2, '0')}`;
    const group = grouped.get(key) ?? [];
    group.push(entity);
    grouped.set(key, group);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, ents]) => ({
      cohortLabel: key,
      cohortDate: new Date(`${key}-01`),
      entities: ents,
    }));
}

// ---------------------------------------------------------------------------
// Full cohort analysis runner
// ---------------------------------------------------------------------------

export function runCohortAnalysis(
  definition: CohortDefinitionInput,
  entities: CohortEntity[],
): CohortAnalysisResult {
  const qualified = entities.filter((e) => assignEntityToCohort(e, definition));
  const cohortGroups = groupEntitiesByMonth(qualified);

  const windowDays = definition.windowDays ?? 30;
  const cohortResults = cohortGroups.map((group) => {
    const periods = computeRetentionCurve(
      group.entities,
      group.cohortDate,
      windowDays,
      definition.entryEventName,
    );
    return {
      cohortLabel: group.cohortLabel,
      cohortDate: group.cohortDate,
      size: group.entities.length,
      periods,
    };
  });

  const allRetentionRates = cohortResults
    .flatMap((c) => c.periods.filter((p) => p.periodIndex > 0))
    .map((p) => p.retentionRate);
  const overallRetentionRate =
    allRetentionRates.length > 0
      ? allRetentionRates.reduce((s, r) => s + r, 0) / allRetentionRates.length
      : 0;

  return {
    cohortId: definition.cohortId,
    domain: definition.domain,
    analysisType: definition.analysisType ?? 'retention',
    cohorts: cohortResults,
    overallRetentionRate,
  };
}
