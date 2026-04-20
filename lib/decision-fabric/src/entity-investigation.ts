/**
 * Entity Investigation — given an entity reference (e.g. vessel, property,
 * agent, model, supplier, account), return every fabric-known event,
 * decision, recommendation and outcome that touched it.
 */

import type { CorrelationLink, DecisionRecord } from '@szl-holdings/db';
import { getEventsForEntity } from './correlation';
import { listDecisions } from './decision-records';

export interface EntityInvestigationOptions {
  orgId?: number | null;
  limit?: number;
}

export interface EntityInvestigationResult {
  entityType: string;
  entityId: string;
  decisions: DecisionRecord[];
  events: CorrelationLink[];
  primitivesTouched: CorrelationLink['primitive'][];
  domains: string[];
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
}

export async function investigateEntity(
  entityType: string,
  entityId: string,
  options: EntityInvestigationOptions = {},
): Promise<EntityInvestigationResult> {
  const [events, decisions] = await Promise.all([
    getEventsForEntity(entityType, entityId, {
      orgId: options.orgId ?? null,
      limit: options.limit ?? 500,
    }),
    listDecisions({
      orgId: options.orgId ?? null,
      entityType,
      entityId,
      limit: options.limit ?? 200,
    }),
  ]);

  const primitives = Array.from(new Set(events.map((e) => e.primitive)));
  const domains = Array.from(new Set(events.map((e) => e.domain)));
  const sorted = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  return {
    entityType,
    entityId,
    decisions,
    events,
    primitivesTouched: primitives,
    domains,
    firstSeenAt: sorted[0]?.occurredAt ?? null,
    lastSeenAt: sorted[sorted.length - 1]?.occurredAt ?? null,
  };
}
