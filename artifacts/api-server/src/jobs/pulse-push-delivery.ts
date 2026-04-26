import {
  db,
  pulseBriefingsTable,
  pulsePersonalizedNarrativesTable,
  pulsePushScheduleTable,
  pulseWatchlistTable,
} from '@szl-holdings/db';
import { and, desc, eq } from 'drizzle-orm';
import { sendPushToUser } from '../lib/expo-push';
import { logger } from '../lib/logger';

const JOB_TAG = '[pulse-push-delivery]';

/**
 * Build the push notification body from the user's personalized narrative
 * (if generated today) or fall back to the global briefing headline.
 */
function buildPushBody(
  personalizedNarrative: string | null | undefined,
  brief: { headline: string; overallRisk?: string | null } | null,
  domainHints: string[],
): string {
  if (personalizedNarrative && personalizedNarrative.trim()) {
    // Truncate the narrative to fit push notification constraints (~200 chars)
    return personalizedNarrative.slice(0, 200);
  }
  if (!brief) {
    return 'Your morning intelligence brief is ready.';
  }
  const riskTag = brief.overallRisk ? ` · Risk: ${brief.overallRisk}` : '';
  const scopeTag = domainHints.length > 0 ? ` (${domainHints.slice(0, 3).join(', ')})` : '';
  return `${brief.headline.slice(0, 100)}${riskTag}${scopeTag}`;
}

/**
 * Deliver morning Pulse briefing push notifications to all users whose push
 * schedule is enabled and whose `delivery_hour_utc` matches the current UTC hour.
 *
 * Called every 15 minutes by the setInterval loop in index.ts.
 * Only users who have not already received a briefing in the current UTC day
 * (last_delivered_at date === today) are dispatched — prevents duplicate sends
 * if the job fires multiple times within the same hour.
 */
export async function runPulsePushDelivery(): Promise<void> {
  const nowUtc = new Date();
  const currentHour = nowUtc.getUTCHours();
  const todayUtc = nowUtc.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  // Load all enabled schedules whose delivery_hour_utc matches the current UTC hour.
  const schedules = await db
    .select()
    .from(pulsePushScheduleTable)
    .where(
      and(
        eq(pulsePushScheduleTable.enabled, true),
        eq(pulsePushScheduleTable.deliveryHourUtc, currentHour),
      ),
    );

  if (schedules.length === 0) return;

  // Load the latest published briefing once (shared baseline for all users).
  const latestBriefing = await db
    .select({
      id: pulseBriefingsTable.id,
      headline: pulseBriefingsTable.headline,
      overallRisk: pulseBriefingsTable.overallRisk,
      overallConfidence: pulseBriefingsTable.overallConfidence,
      date: pulseBriefingsTable.date,
      generatedAt: pulseBriefingsTable.generatedAt,
    })
    .from(pulseBriefingsTable)
    .where(eq(pulseBriefingsTable.status, 'published'))
    .orderBy(desc(pulseBriefingsTable.generatedAt))
    .limit(1);

  const brief = latestBriefing[0] ?? null;

  let delivered = 0;
  let skipped = 0;

  for (const schedule of schedules) {
    try {
      // Skip if already delivered today.
      const lastDelivered = schedule.lastDeliveredAt;
      if (lastDelivered && lastDelivered.toISOString().slice(0, 10) === todayUtc) {
        skipped++;
        continue;
      }

      // Fetch the user's watched domains for scoped push body.
      const watchlistRows = await db
        .select({ domain: pulseWatchlistTable.domain })
        .from(pulseWatchlistTable)
        .where(eq(pulseWatchlistTable.userId, schedule.userId));

      const domainHints = [...new Set(watchlistRows.map((w) => w.domain))];

      // Look up today's per-user personalized narrative (generated async by /briefings/personalized).
      const narrativeRows = await db
        .select({ narrative: pulsePersonalizedNarrativesTable.narrative, status: pulsePersonalizedNarrativesTable.status })
        .from(pulsePersonalizedNarrativesTable)
        .where(
          and(
            eq(pulsePersonalizedNarrativesTable.userId, schedule.userId),
            eq(pulsePersonalizedNarrativesTable.dateKey, todayUtc),
            eq(pulsePersonalizedNarrativesTable.status, 'ready'),
          ),
        )
        .limit(1);
      const personalizedNarrative = narrativeRows[0]?.narrative ?? null;

      const pushBody = buildPushBody(personalizedNarrative, brief, domainHints);

      await sendPushToUser(
        schedule.userId,
        {
          title: '☀ Pulse Morning Brief',
          body: pushBody,
          data: {
            type: 'pulse-morning-brief',
            briefingId: brief?.id ?? null,
            deliveredAt: nowUtc.toISOString(),
            watchedDomains: domainHints,
          },
        },
        { appId: 'cortex-mobile' },
      );

      // Update delivery timestamp and last briefing ID.
      await db
        .update(pulsePushScheduleTable)
        .set({
          lastDeliveredAt: nowUtc,
          lastBriefingId: brief?.id ?? null,
          updatedAt: nowUtc,
        })
        .where(eq(pulsePushScheduleTable.userId, schedule.userId));

      delivered++;
    } catch (err) {
      logger.error(
        { err, userId: schedule.userId },
        `${JOB_TAG} Failed to deliver morning brief push`,
      );
    }
  }

  if (delivered > 0 || skipped > 0) {
    logger.info(
      { delivered, skipped, totalEligible: schedules.length, hour: currentHour },
      `${JOB_TAG} Morning push delivery complete`,
    );
  }
}
