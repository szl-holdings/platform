import type { AttributionModel, AttributionResult, AttributionTouchpoint } from './types.js';

// ---------------------------------------------------------------------------
// Attribution Engine — Multi-touch attribution modeling
// ---------------------------------------------------------------------------

export function computeAttribution(
  touchpoints: AttributionTouchpoint[],
  outcomeType: string,
  outcomeValue: number | undefined,
  model: AttributionModel,
): AttributionResult {
  const sorted = [...touchpoints].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  if (sorted.length === 0) {
    return {
      journeyId: '',
      entityId: '',
      outcomeType,
      ...(outcomeValue !== undefined ? { outcomeValue } : {}),
      model,
      touchpoints: [],
      totalTouchpoints: 0,
    };
  }

  const credits = allocateCredit(sorted, model);
  const total = credits.reduce((s, c) => s + c, 0);

  return {
    journeyId: sorted[0]!.journeyId,
    entityId: sorted[0]!.entityId,
    outcomeType,
    ...(outcomeValue !== undefined ? { outcomeValue } : {}),
    model,
    touchpoints: sorted.map((tp, i) => ({
      touchpointType: tp.touchpointType,
      ...(tp.channel !== undefined ? { channel: tp.channel } : {}),
      ...(tp.content !== undefined ? { content: tp.content } : {}),
      position: i + 1,
      credit: credits[i]!,
      creditPercent: total > 0 ? (credits[i]! / total) * 100 : 0,
      occurredAt: tp.occurredAt,
    })),
    totalTouchpoints: sorted.length,
  };
}

function allocateCredit(touchpoints: AttributionTouchpoint[], model: AttributionModel): number[] {
  const n = touchpoints.length;
  if (n === 0) return [];

  switch (model) {
    case 'first_touch': {
      return touchpoints.map((_, i) => (i === 0 ? 1 : 0));
    }

    case 'last_touch': {
      return touchpoints.map((_, i) => (i === n - 1 ? 1 : 0));
    }

    case 'linear': {
      const credit = 1 / n;
      return touchpoints.map(() => credit);
    }

    case 'time_decay': {
      const halfLifeDays = 7;
      const now = touchpoints[n - 1]!.occurredAt.getTime();
      const rawWeights = touchpoints.map((tp) => {
        const ageMs = now - tp.occurredAt.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        return 0.5 ** (ageDays / halfLifeDays);
      });
      const totalWeight = rawWeights.reduce((s, w) => s + w, 0);
      return rawWeights.map((w) => (totalWeight > 0 ? w / totalWeight : 1 / n));
    }
  }
}

// ---------------------------------------------------------------------------
// Journey builder — group touchpoints by journeyId
// ---------------------------------------------------------------------------

export function groupTouchpointsByJourney(
  touchpoints: AttributionTouchpoint[],
): Map<string, AttributionTouchpoint[]> {
  const map = new Map<string, AttributionTouchpoint[]>();
  for (const tp of touchpoints) {
    const group = map.get(tp.journeyId) ?? [];
    group.push(tp);
    map.set(tp.journeyId, group);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Attribution report — aggregate across multiple journeys
// ---------------------------------------------------------------------------

export interface AttributionChannelSummary {
  channel: string;
  firstTouchCount: number;
  lastTouchCount: number;
  linearCredit: number;
  timeDecayCredit: number;
  totalOutcomes: number;
  totalOutcomeValue: number;
}

export function buildAttributionReport(results: AttributionResult[]): AttributionChannelSummary[] {
  const channelMap = new Map<string, AttributionChannelSummary>();

  const getOrCreate = (channel: string): AttributionChannelSummary => {
    if (!channelMap.has(channel)) {
      channelMap.set(channel, {
        channel,
        firstTouchCount: 0,
        lastTouchCount: 0,
        linearCredit: 0,
        timeDecayCredit: 0,
        totalOutcomes: 0,
        totalOutcomeValue: 0,
      });
    }
    return channelMap.get(channel)!;
  };

  for (const result of results) {
    if (result.touchpoints.length === 0) continue;

    const outcome = result.outcomeValue ?? 1;
    const tps = result.touchpoints;

    tps.forEach((tp, idx) => {
      const ch = tp.channel ?? 'unknown';
      const summary = getOrCreate(ch);

      if (idx === 0) summary.firstTouchCount += 1;
      if (idx === tps.length - 1) summary.lastTouchCount += 1;

      if (result.model === 'linear') {
        summary.linearCredit += tp.creditPercent / 100;
      } else if (result.model === 'time_decay') {
        summary.timeDecayCredit += tp.creditPercent / 100;
      }
    });

    // Accumulate outcomes to the primary channel (last touch)
    const lastChannel = tps[tps.length - 1]?.channel ?? 'unknown';
    const lastSummary = getOrCreate(lastChannel);
    lastSummary.totalOutcomes += 1;
    lastSummary.totalOutcomeValue += outcome;
  }

  return Array.from(channelMap.values()).sort((a, b) => b.totalOutcomes - a.totalOutcomes);
}

// ---------------------------------------------------------------------------
// Outcome linkage — which touchpoint chain led to a given outcome?
// ---------------------------------------------------------------------------

export function linkOutcomeToJourney(
  outcomeEntityId: string,
  outcomeEntityType: string,
  allTouchpoints: AttributionTouchpoint[],
  windowHours: number = 720,
): AttributionTouchpoint[] {
  const outcomeTimestamp = new Date();
  const cutoff = new Date(outcomeTimestamp.getTime() - windowHours * 60 * 60 * 1000);

  return allTouchpoints
    .filter(
      (tp) =>
        tp.entityId === outcomeEntityId &&
        tp.entityType === outcomeEntityType &&
        tp.occurredAt >= cutoff &&
        tp.occurredAt <= outcomeTimestamp,
    )
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
}
