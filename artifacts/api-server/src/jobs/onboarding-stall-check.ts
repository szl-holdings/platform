import { db, notificationsTable, pool } from '@szl-holdings/db';
import { logger } from '../lib/logger';
import { publish, WS_CHANNELS } from '../lib/websocket';

export interface OnboardingStallCheckResult {
  stalledCount: number;
  thresholdDays: number;
  adminsNotified: number;
  stalledOrgs: Array<{
    orgId: number;
    orgName: string;
    orgSlug: string;
    currentStep: string;
    completedSteps: string[];
    daysSinceUpdate: number;
  }>;
}

export async function runOnboardingStallCheck(
  overrideThresholdDays?: number,
): Promise<OnboardingStallCheckResult> {
  const envThreshold = Number(process.env.ONBOARDING_STALL_THRESHOLD_DAYS);
  const thresholdDays =
    typeof overrideThresholdDays === 'number' && overrideThresholdDays > 0
      ? overrideThresholdDays
      : Number.isFinite(envThreshold) && envThreshold > 0
        ? envThreshold
        : 3;

  const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

  const { rows: stalledOrgs } = await pool.query<{
    org_id: number;
    org_name: string;
    org_slug: string;
    current_step: string;
    completed_steps: string[];
    updated_at: string;
  }>(
    `SELECT ow.org_id,
            o.name AS org_name,
            o.slug AS org_slug,
            ow.current_step,
            ow.completed_steps,
            ow.updated_at
     FROM onboarding_wizard_state ow
     INNER JOIN organizations o ON o.id = ow.org_id
     WHERE ow.completed_at IS NULL
       AND jsonb_array_length(ow.completed_steps) > 0
       AND ow.updated_at < $1
     ORDER BY ow.updated_at ASC`,
    [cutoff],
  );

  if (stalledOrgs.length === 0) {
    logger.info({ thresholdDays }, '[onboarding-stall-check] No stalled orgs found');
    return { stalledCount: 0, thresholdDays, adminsNotified: 0, stalledOrgs: [] };
  }

  const enriched = stalledOrgs.map((s) => {
    const daysSinceUpdate = Math.round(
      (Date.now() - new Date(s.updated_at).getTime()) / (24 * 60 * 60 * 1000),
    );
    return {
      orgId: s.org_id,
      orgName: s.org_name,
      orgSlug: s.org_slug,
      currentStep: s.current_step,
      completedSteps: s.completed_steps,
      daysSinceUpdate,
    };
  });

  const { rows: adminUsers } = await pool.query<{ user_id: number }>(
    `SELECT DISTINCT ur.user_id
     FROM user_roles ur
     INNER JOIN roles r ON r.id = ur.role_id
     WHERE r.name IN ('super_admin', 'admin')`,
  );

  if (adminUsers.length === 0) {
    logger.warn('[onboarding-stall-check] No admin users found to notify');
    return { stalledCount: enriched.length, thresholdDays, adminsNotified: 0, stalledOrgs: enriched };
  }

  const stalledSummary = enriched.map(
    (s) => `${s.orgName} (step: ${s.currentStep}, stalled ${s.daysSinceUpdate}d)`,
  );

  const notificationTitle = `${enriched.length} org${enriched.length !== 1 ? 's' : ''} stalled mid-onboarding`;
  const notificationMessage =
    stalledSummary.length <= 5
      ? stalledSummary.join('; ')
      : `${stalledSummary.slice(0, 5).join('; ')} and ${stalledSummary.length - 5} more`;

  let notified = 0;
  for (const admin of adminUsers) {
    try {
      const [notification] = await db
        .insert(notificationsTable)
        .values({
          userId: admin.user_id,
          type: 'warning',
          channel: 'in_app',
          title: notificationTitle,
          message: notificationMessage,
          actionUrl: '/admin/onboarding',
        })
        .returning();

      if (notification) {
        publish(WS_CHANNELS.NOTIFICATIONS, 'new_notification', notification);
      }
      notified++;
    } catch (err) {
      logger.warn(
        { err, userId: admin.user_id },
        '[onboarding-stall-check] Failed to insert notification for admin user',
      );
    }
  }

  try {
    const { queueExternalAlert } = await import('../lib/queued-jobs');
    await queueExternalAlert({
      appName: 'Onboarding',
      title: notificationTitle,
      message: `${enriched.length} organization(s) have been in-progress for more than ${thresholdDays} day(s). ${notificationMessage}`,
      severity: 'warning',
      actionUrl: '/admin/onboarding',
    });
  } catch (err) {
    logger.warn({ err }, '[onboarding-stall-check] queueExternalAlert failed (non-fatal)');
  }

  logger.info(
    { stalledCount: enriched.length, thresholdDays, adminsNotified: notified },
    '[onboarding-stall-check] Stall check complete — admins notified',
  );

  return {
    stalledCount: enriched.length,
    thresholdDays,
    adminsNotified: notified,
    stalledOrgs: enriched,
  };
}
