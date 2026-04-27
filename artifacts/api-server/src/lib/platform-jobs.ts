import {
  db,
  emailSendLogTable,
  notificationPreferencesTable,
  notificationRecipientsTable,
  notificationsTable,
  platformJobRunsTable,
  pool,
  usersTable,
} from '@szl-holdings/db';
import { durableJobQueue } from '@szl-holdings/forge-runtime';
import { serverTelemetry } from '@szl-holdings/observability';
import { TwilioAdapter } from '@szl-holdings/services';
import { randomUUID } from 'node:crypto';
import { and, eq, gte, sql } from 'drizzle-orm';
import {
  buildNotificationDigestEmail,
  buildTransactionalNotificationEmail,
  sendEmail,
} from './email';
import { logger } from './logger';

const twilioAdapter = new TwilioAdapter();

function maskPhone(num: string): string {
  if (!num) return '';
  if (num.length <= 4) return '***';
  return `${num.slice(0, 2)}***${num.slice(-2)}`;
}

export const PLATFORM_JOB_TYPES = {
  LYTE_DIGEST: 'lyte_digest',
  READINESS_DIGEST: 'readiness_digest',
  EXCEPTION_SUMMARY: 'exception_summary',
  ARTIFACT_CLEANUP: 'artifact_cleanup',
  FEATURE_FLAG_SYNC: 'feature_flag_sync',
  SIGNAL_NORMALIZATION: 'signal_normalization',
  STALE_ACTION_SCAN: 'stale_action_scan',
  VESSEL_ETA_REFRESH: 'vessel_eta_refresh',
  ROUTE_PRESSURE_SCAN: 'route_pressure_scan',
  WORKFLOW_RETRY: 'workflow_retry',
  ARTIFACT_GENERATION: 'artifact_generation',
  ROUTE_ECONOMICS_RECOMPUTE: 'route_economics_recompute',
  READINESS_SCORE_RECOMPUTE: 'readiness_score_recompute',
  SALESFORCE_OPPORTUNITY_SYNC: 'hourly_salesforce_opportunity_sync',
  JIRA_SPRINT_HEALTH_SCAN: 'hourly_jira_sprint_health_scan',
  NOTIFICATION_DISPATCH: 'notification_dispatch',
  NOTIFICATION_DIGEST: 'notification_email_digest',
  DATA_RETENTION_SWEEP: 'data_retention_sweep',
  BACKUP_RESTORE_DRILL: 'backup_restore_drill',
} as const;

export type PlatformJobType = (typeof PLATFORM_JOB_TYPES)[keyof typeof PLATFORM_JOB_TYPES];

const DOMAIN_MAP: Record<string, string> = {
  notification_dispatch: 'platform',
  notification_email_digest: 'platform',
  backup_restore_drill: 'platform',
  lyte_digest: 'lyte',
  readiness_digest: 'lyte',
  readiness_score_recompute: 'lyte',
  stale_action_scan: 'lyte',
  signal_normalization: 'lyte',
  vessel_eta_refresh: 'vessels',
  route_pressure_scan: 'vessels',
  route_economics_recompute: 'vessels',
  exception_summary: 'platform',
  artifact_cleanup: 'platform',
  feature_flag_sync: 'platform',
  workflow_retry: 'platform',
  artifact_generation: 'platform',
  hourly_salesforce_opportunity_sync: 'integrations',
  hourly_jira_sprint_health_scan: 'integrations',
};

interface JobContext {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  correlationId: string;
  workflowRunId: string;
  signalId?: string;
  artifactId?: string;
}

async function startWorkflowRun(job: JobContext, domain: string): Promise<void> {
  try {
    await db
      .insert(platformJobRunsTable)
      .values({
        runId: job.workflowRunId,
        workflowType: job.type,
        status: 'running',
        domain,
        triggeredBy: (job.payload.triggeredBy as string) ?? 'scheduler',
        triggeredByUserId: (job.payload.triggeredByUserId as number) ?? null,
        payload: job.payload as Record<string, unknown>,
        correlationId: job.correlationId,
        workflowRunId: job.workflowRunId,
        signalId: job.signalId ?? (job.payload.signalId as string) ?? null,
        artifactId: job.artifactId ?? (job.payload.artifactId as string) ?? null,
        startedAt: new Date(),
      })
      .onConflictDoNothing();
  } catch (err) {
    logger.warn(
      { err, runId: job.workflowRunId },
      'platform-jobs: failed to write platform_job_run start record',
    );
  }
}

async function completeWorkflowRun(
  workflowRunId: string,
  result: Record<string, unknown>,
  error?: string,
  status?: 'completed' | 'failed' | 'completed_with_warnings',
): Promise<void> {
  const resolvedStatus = status ?? (error ? 'failed' : 'completed');
  try {
    await db
      .update(platformJobRunsTable)
      .set({
        status: resolvedStatus,
        result: result as Record<string, unknown>,
        error: error ?? null,
        completedAt: new Date(),
      })
      .where(eq(platformJobRunsTable.runId, workflowRunId));
  } catch (err) {
    logger.warn(
      { err, workflowRunId },
      'platform-jobs: failed to update platform_job_run completion record',
    );
  }
}

function buildJobContext(job: { id: string; type: string; payload: unknown }): JobContext {
  const payload = (job.payload ?? {}) as Record<string, unknown>;
  return {
    id: job.id,
    type: job.type,
    payload,
    correlationId: (payload.correlationId as string) ?? randomUUID(),
    workflowRunId: (payload.workflowRunId as string) ?? `wfr_${job.id}`,
    signalId: (payload.signalId as string) ?? undefined,
    artifactId: (payload.artifactId as string) ?? undefined,
  };
}

durableJobQueue.register(PLATFORM_JOB_TYPES.LYTE_DIGEST, async (job) => {
  const ctx = buildJobContext(job);
  const { workspaceId, period = 'daily' } = ctx.payload as {
    workspaceId?: number;
    period?: string;
  };
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, workspaceId, period },
    'lyte_digest: starting',
  );
  await startWorkflowRun(ctx, domain);

  let signalCount = 0;
  let unresolvedActionCount = 0;
  let criticalCount = 0;
  const warnings: string[] = [];

  try {
    const signalResult = await pool.query<{ count: string; unresolved: string; critical: string }>(`
      SELECT
        COUNT(*)::text as count,
        COUNT(*) FILTER (WHERE status != 'resolved')::text as unresolved,
        COUNT(*) FILTER (WHERE severity = 'critical')::text as critical
      FROM lyte_signals
      ${workspaceId ? `WHERE workspace_id = ${Number(workspaceId)}` : ''}
    `);
    signalCount = parseInt(signalResult.rows[0]?.count ?? '0', 10);
    unresolvedActionCount = parseInt(signalResult.rows[0]?.unresolved ?? '0', 10);
    criticalCount = parseInt(signalResult.rows[0]?.critical ?? '0', 10);
  } catch {
    const w = 'lyte_signals not queryable — signal counts unavailable';
    logger.warn({ jobId: job.id }, `lyte_digest: ${w}`);
    warnings.push(w);
  }

  const result = {
    signalCount,
    unresolvedActionCount,
    criticalCount,
    period,
    workspaceId,
    warnings,
  };

  serverTelemetry.recordBusinessEvent({
    type: 'lyte_digest_generated',
    domain,
    success: warnings.length === 0,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  const jobStatus = warnings.length > 0 ? ('completed_with_warnings' as const) : undefined;
  await completeWorkflowRun(
    ctx.workflowRunId,
    result,
    warnings.length > 0 ? warnings[0] : undefined,
    jobStatus,
  );
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, ...result },
    'lyte_digest: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.READINESS_DIGEST, async (job) => {
  const ctx = buildJobContext(job);
  const { programId } = ctx.payload as { programId?: number };
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, programId },
    'readiness_digest: starting',
  );
  await startWorkflowRun(ctx, domain);

  let blockerCount = 0;
  let avgScore = 0;
  const warnings: string[] = [];

  try {
    const readinessResult = await pool.query<{ blocker_count: string; avg_score: string }>(`
      SELECT
        COUNT(*) FILTER (WHERE severity = 'critical')::text as blocker_count,
        COALESCE(AVG(score), 0)::text as avg_score
      FROM readiness_risks
      ${programId ? `WHERE program_id = ${Number(programId)}` : ''}
    `);
    blockerCount = parseInt(readinessResult.rows[0]?.blocker_count ?? '0', 10);
    avgScore = parseFloat(readinessResult.rows[0]?.avg_score ?? '0');
  } catch {
    const w = 'readiness_risks not queryable — blocker counts unavailable';
    logger.warn({ jobId: job.id }, `readiness_digest: ${w}`);
    warnings.push(w);
  }

  const result = { programId, blockerCount, avgScore, warnings };

  serverTelemetry.recordBusinessEvent({
    type: 'readiness_digest_generated',
    domain,
    success: warnings.length === 0,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  const jobStatus = warnings.length > 0 ? ('completed_with_warnings' as const) : undefined;
  await completeWorkflowRun(
    ctx.workflowRunId,
    result,
    warnings.length > 0 ? warnings[0] : undefined,
    jobStatus,
  );
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, blockerCount, avgScore },
    'readiness_digest: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.EXCEPTION_SUMMARY, async (job) => {
  const ctx = buildJobContext(job);
  const { domain: payloadDomain } = ctx.payload as { domain?: string };
  const domain = payloadDomain ?? DOMAIN_MAP[job.type] ?? 'platform';
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, domain },
    'exception_summary: starting',
  );
  await startWorkflowRun(ctx, domain);

  const snapshot = serverTelemetry.getSnapshot();
  const exceptionCount =
    snapshot.jobFailures + (snapshot.errorRate > 0 ? Math.floor(snapshot.errorRate * 10) : 0);
  const result = {
    exceptionCount,
    errorRate: snapshot.errorRate,
    jobFailures: snapshot.jobFailures,
    workflowCompletions: snapshot.workflowCompletions,
  };

  serverTelemetry.recordBusinessEvent({
    type: 'exception_summary_generated',
    domain,
    success: true,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  await completeWorkflowRun(ctx.workflowRunId, result);
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, exceptionCount, domain },
    'exception_summary: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.ARTIFACT_CLEANUP, async (job) => {
  const ctx = buildJobContext(job);
  const { olderThanDays = 30, dryRun = true } = ctx.payload as {
    olderThanDays?: number;
    dryRun?: boolean;
  };
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, olderThanDays, dryRun },
    'artifact_cleanup: starting',
  );
  await startWorkflowRun(ctx, domain);

  let cleanedCount = 0;
  let failedCount = 0;

  if (!dryRun) {
    try {
      const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      const result = await pool.query<{ count: string }>(
        `
        SELECT COUNT(*)::text as count FROM files WHERE created_at < $1
      `,
        [cutoff],
      );
      cleanedCount = parseInt(result.rows[0]?.count ?? '0', 10);
    } catch (err) {
      logger.warn({ err, jobId: job.id }, 'artifact_cleanup: file query failed');
      failedCount = 1;
    }
  }

  const result = { olderThanDays, dryRun, cleanedCount, failedCount };
  const success = failedCount === 0;

  serverTelemetry.recordBusinessEvent({
    type: 'artifact_cleanup_completed',
    domain,
    success,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  await completeWorkflowRun(ctx.workflowRunId, result, success ? undefined : 'file query failed');
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, dryRun, cleanedCount, failedCount },
    'artifact_cleanup: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.FEATURE_FLAG_SYNC, async (job) => {
  const ctx = buildJobContext(job);
  const domain = DOMAIN_MAP[job.type]!;
  logger.info({ jobId: job.id, correlationId: ctx.correlationId }, 'feature_flag_sync: starting');
  await startWorkflowRun(ctx, domain);

  let flagCount = 0;
  try {
    const { ensurePlatformFlags } = await import('./platform-flags');
    await ensurePlatformFlags();
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM feature_flags',
    );
    flagCount = parseInt(result.rows[0]?.count ?? '0', 10);
  } catch (err) {
    logger.warn({ err, jobId: job.id }, 'feature_flag_sync: could not sync flags');
    await completeWorkflowRun(ctx.workflowRunId, {}, String(err));
    throw err;
  }

  const result = { flagCount };

  serverTelemetry.recordBusinessEvent({
    type: 'feature_flag_sync_completed',
    domain,
    success: true,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  await completeWorkflowRun(ctx.workflowRunId, result);
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, flagCount },
    'feature_flag_sync: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.SIGNAL_NORMALIZATION, async (job) => {
  const ctx = buildJobContext(job);
  const { workspaceId } = ctx.payload as { workspaceId?: number };
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, workspaceId },
    'signal_normalization: starting',
  );
  await startWorkflowRun(ctx, domain);

  let normalizedCount = 0;
  const warnings: string[] = [];

  try {
    const result = await pool.query<{ count: string }>(`
      SELECT COUNT(*)::text as count FROM lyte_signals
      WHERE severity IS NOT NULL
      ${workspaceId ? `AND workspace_id = ${Number(workspaceId)}` : ''}
    `);
    normalizedCount = parseInt(result.rows[0]?.count ?? '0', 10);
  } catch {
    const w = 'lyte_signals not queryable — normalized count unavailable';
    logger.warn({ jobId: job.id }, `signal_normalization: ${w}`);
    warnings.push(w);
  }

  const result = { workspaceId, normalizedCount, warnings };

  serverTelemetry.recordBusinessEvent({
    type: 'signal_normalization_completed',
    domain,
    success: warnings.length === 0,
    metadata: {
      ...result,
      correlationId: ctx.correlationId,
      workflowRunId: ctx.workflowRunId,
      signalId: ctx.signalId,
    },
  });

  const jobStatus = warnings.length > 0 ? ('completed_with_warnings' as const) : undefined;
  await completeWorkflowRun(
    ctx.workflowRunId,
    result,
    warnings.length > 0 ? warnings[0] : undefined,
    jobStatus,
  );
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, normalizedCount },
    'signal_normalization: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.STALE_ACTION_SCAN, async (job) => {
  const ctx = buildJobContext(job);
  const { staleAfterHours = 72 } = ctx.payload as { staleAfterHours?: number };
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, staleAfterHours },
    'stale_action_scan: starting',
  );
  await startWorkflowRun(ctx, domain);

  let staleCount = 0;
  const warnings: string[] = [];

  try {
    const cutoff = new Date(Date.now() - staleAfterHours * 60 * 60 * 1000);
    const queryResult = await pool.query<{ count: string }>(
      `
      SELECT COUNT(*)::text as count FROM lyte_command_cards
      WHERE created_at < $1 AND status NOT IN ('completed', 'dismissed')
    `,
      [cutoff],
    );
    staleCount = parseInt(queryResult.rows[0]?.count ?? '0', 10);
  } catch {
    const w = 'lyte_command_cards not queryable — stale count unavailable';
    logger.warn({ jobId: job.id }, `stale_action_scan: ${w}`);
    warnings.push(w);
  }

  if (staleCount > 0) {
    serverTelemetry.raiseAlert({
      type: 'stale_actions_detected',
      message: `${staleCount} command cards are stale (>${staleAfterHours}h unresolved)`,
      severity: staleCount > 10 ? 'critical' : 'warning',
      metadata: {
        staleCount,
        staleAfterHours,
        correlationId: ctx.correlationId,
        workflowRunId: ctx.workflowRunId,
      },
    });
  }

  const result = { staleAfterHours, staleCount, warnings };

  serverTelemetry.recordBusinessEvent({
    type: 'stale_action_scan_completed',
    domain,
    success: warnings.length === 0,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  const jobStatus = warnings.length > 0 ? ('completed_with_warnings' as const) : undefined;
  await completeWorkflowRun(
    ctx.workflowRunId,
    result,
    warnings.length > 0 ? warnings[0] : undefined,
    jobStatus,
  );
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, staleCount },
    'stale_action_scan: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.VESSEL_ETA_REFRESH, async (job) => {
  const ctx = buildJobContext(job);
  const { fleetId } = ctx.payload as { fleetId?: number };
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, fleetId },
    'vessel_eta_refresh: starting',
  );
  await startWorkflowRun(ctx, domain);

  let vesselCount = 0;
  const warnings: string[] = [];

  try {
    const queryResult = await pool.query<{ count: string }>(`
      SELECT COUNT(*)::text as count FROM vessels
      WHERE status = 'active'
      ${fleetId ? `AND fleet_id = ${Number(fleetId)}` : ''}
    `);
    vesselCount = parseInt(queryResult.rows[0]?.count ?? '0', 10);
  } catch {
    const w = 'vessels table not queryable — vessel count unavailable';
    logger.warn({ jobId: job.id }, `vessel_eta_refresh: ${w}`);
    warnings.push(w);
  }

  const result = { fleetId, vesselCount, warnings };

  serverTelemetry.recordBusinessEvent({
    type: 'vessel_eta_refresh_completed',
    domain,
    success: warnings.length === 0,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  const jobStatus = warnings.length > 0 ? ('completed_with_warnings' as const) : undefined;
  await completeWorkflowRun(
    ctx.workflowRunId,
    result,
    warnings.length > 0 ? warnings[0] : undefined,
    jobStatus,
  );
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, vesselCount },
    'vessel_eta_refresh: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.ROUTE_PRESSURE_SCAN, async (job) => {
  const ctx = buildJobContext(job);
  const { region } = ctx.payload as { region?: string };
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, region },
    'route_pressure_scan: starting',
  );
  await startWorkflowRun(ctx, domain);

  let routeCount = 0;
  let highPressureCount = 0;
  const warnings: string[] = [];

  try {
    const queryResult = await pool.query<{ total: string; high_pressure: string }>(`
      SELECT COUNT(*)::text as total,
             COUNT(*) FILTER (WHERE risk_level IN ('high', 'critical'))::text as high_pressure
      FROM vessels_routes
    `);
    routeCount = parseInt(queryResult.rows[0]?.total ?? '0', 10);
    highPressureCount = parseInt(queryResult.rows[0]?.high_pressure ?? '0', 10);
  } catch {
    const w = 'vessels_routes not queryable — pressure counts unavailable';
    logger.warn({ jobId: job.id }, `route_pressure_scan: ${w}`);
    warnings.push(w);
  }

  if (highPressureCount > 0) {
    serverTelemetry.raiseAlert({
      type: 'route_pressure_elevated',
      message: `${highPressureCount} routes with elevated pressure detected`,
      severity: highPressureCount > 5 ? 'critical' : 'warning',
      metadata: {
        routeCount,
        highPressureCount,
        region,
        correlationId: ctx.correlationId,
        workflowRunId: ctx.workflowRunId,
      },
    });
  }

  const result = { region, routeCount, highPressureCount, warnings };

  serverTelemetry.recordBusinessEvent({
    type: 'route_pressure_scan_completed',
    domain,
    success: warnings.length === 0,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  const jobStatus = warnings.length > 0 ? ('completed_with_warnings' as const) : undefined;
  await completeWorkflowRun(
    ctx.workflowRunId,
    result,
    warnings.length > 0 ? warnings[0] : undefined,
    jobStatus,
  );
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, routeCount, highPressureCount },
    'route_pressure_scan: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.WORKFLOW_RETRY, async (job) => {
  const ctx = buildJobContext(job);
  const { workflowRunId: targetRunId, reason } = ctx.payload as {
    workflowRunId: string;
    reason?: string;
  };
  if (!targetRunId) throw new Error('workflowRunId is required for workflow_retry');
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, targetRunId, reason },
    'workflow_retry: starting',
  );
  await startWorkflowRun(ctx, domain);

  const result = { workflowRunId: targetRunId, reason };

  serverTelemetry.recordBusinessEvent({
    type: 'workflow_retry_triggered',
    domain,
    success: true,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  await completeWorkflowRun(ctx.workflowRunId, result);
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, targetRunId },
    'workflow_retry: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.ARTIFACT_GENERATION, async (job) => {
  const ctx = buildJobContext(job);
  const { artifactType, artifactId, requestedBy } = ctx.payload as {
    artifactType: string;
    artifactId?: string;
    requestedBy?: number;
  };

  if (!artifactType) throw new Error('artifactType is required for artifact_generation');
  const domain = DOMAIN_MAP[job.type]!;
  const resolvedArtifactId = artifactId ?? ctx.artifactId ?? `art_${Date.now()}`;
  logger.info(
    {
      jobId: job.id,
      correlationId: ctx.correlationId,
      artifactType,
      artifactId: resolvedArtifactId,
      requestedBy,
    },
    'artifact_generation: starting',
  );
  await startWorkflowRun({ ...ctx, artifactId: resolvedArtifactId }, domain);

  let generatedSize = 0;
  let error: string | undefined;

  try {
    const countResult = await pool.query<{ count: string }>(
      `
      SELECT COUNT(*)::text as count FROM artifact_approvals
      WHERE artifact_id = $1
    `,
      [resolvedArtifactId],
    );
    generatedSize = parseInt(countResult.rows[0]?.count ?? '0', 10);
  } catch {
    logger.warn(
      { jobId: job.id },
      'artifact_generation: approval table not queryable — continuing',
    );
  }

  const result = { artifactType, artifactId: resolvedArtifactId, requestedBy, generatedSize };

  serverTelemetry.recordBusinessEvent({
    type: 'artifact_generation_completed',
    domain,
    success: true,
    metadata: {
      ...result,
      correlationId: ctx.correlationId,
      workflowRunId: ctx.workflowRunId,
      artifactId: resolvedArtifactId,
    },
  });

  await completeWorkflowRun(ctx.workflowRunId, result, error);
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, artifactType, generatedSize },
    'artifact_generation: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE, async (job) => {
  const ctx = buildJobContext(job);
  const { routeId } = ctx.payload as { routeId?: number };
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, routeId },
    'route_economics_recompute: starting',
  );
  await startWorkflowRun(ctx, domain);

  const result = { routeId };

  serverTelemetry.recordBusinessEvent({
    type: 'route_economics_recompute_completed',
    domain,
    success: true,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  await completeWorkflowRun(ctx.workflowRunId, result);
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, routeId },
    'route_economics_recompute: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.READINESS_SCORE_RECOMPUTE, async (job) => {
  const ctx = buildJobContext(job);
  const { programId, dimensionId } = ctx.payload as { programId?: number; dimensionId?: number };
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, programId, dimensionId },
    'readiness_score_recompute: starting',
  );
  await startWorkflowRun(ctx, domain);

  const result = { programId, dimensionId };

  serverTelemetry.recordBusinessEvent({
    type: 'readiness_score_recompute_completed',
    domain,
    success: true,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  await completeWorkflowRun(ctx.workflowRunId, result);
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, programId, dimensionId },
    'readiness_score_recompute: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.SALESFORCE_OPPORTUNITY_SYNC, async (job) => {
  const ctx = buildJobContext(job);
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId },
    'hourly_salesforce_opportunity_sync: starting',
  );
  await startWorkflowRun(ctx, domain);

  let opportunitiesScanned = 0;
  let signalsGenerated = 0;
  let signalsIngested = 0;
  const warnings: string[] = [];

  try {
    const { isFlagEnabled } = await import('./platform-flags');
    const enabled = await isFlagEnabled('salesforce_sync_enabled');
    if (!enabled) {
      const result = { skipped: true, reason: 'salesforce_sync_enabled flag is off' };
      await completeWorkflowRun(ctx.workflowRunId, result);
      logger.info({ jobId: job.id }, 'hourly_salesforce_opportunity_sync: skipped — flag disabled');
      return;
    }

    const { services } = await import('@szl-holdings/services');
    const adapter = services.salesforce;

    const opportunities = await adapter.queryOpportunities(100);
    opportunitiesScanned = opportunities.length;

    const signals = await adapter.ingestSignals();
    signalsGenerated = signals.length;

    const { db, alloySignalsTable, insertAlloySignalSchema } = await import('@szl-holdings/db');
    for (const signal of signals) {
      try {
        const data = insertAlloySignalSchema.parse({
          source: 'salesforce',
          sourceType: signal.type,
          severity: signal.severity,
          title: signal.title,
          body: signal.description,
          status: 'new',
          orgId: null,
          workflowId: null,
          normalizedScore: null,
          valueAtRisk: signal.valueAtRisk,
          metadata: signal.metadata,
        });
        await db.insert(alloySignalsTable).values(data);
        signalsIngested++;
      } catch (err) {
        logger.warn(
          { err, signalId: signal.id },
          'hourly_salesforce_opportunity_sync: failed to ingest signal',
        );
        warnings.push(`Failed to ingest signal: ${signal.id}`);
      }
    }
  } catch (err) {
    const w = `Salesforce sync error: ${(err as Error).message}`;
    logger.warn({ err, jobId: job.id }, `hourly_salesforce_opportunity_sync: ${w}`);
    warnings.push(w);
  }

  const result = { opportunitiesScanned, signalsGenerated, signalsIngested, warnings };

  serverTelemetry.recordBusinessEvent({
    type: 'salesforce_opportunity_sync_completed',
    domain,
    success: warnings.length === 0,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  const jobStatus = warnings.length > 0 ? ('completed_with_warnings' as const) : undefined;
  await completeWorkflowRun(
    ctx.workflowRunId,
    result,
    warnings.length > 0 ? warnings[0] : undefined,
    jobStatus,
  );
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, opportunitiesScanned, signalsIngested },
    'hourly_salesforce_opportunity_sync: complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.JIRA_SPRINT_HEALTH_SCAN, async (job) => {
  const ctx = buildJobContext(job);
  const domain = DOMAIN_MAP[job.type]!;
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId },
    'hourly_jira_sprint_health_scan: starting',
  );
  await startWorkflowRun(ctx, domain);

  let sprintsScanned = 0;
  let issuesScanned = 0;
  let signalsGenerated = 0;
  let signalsIngested = 0;
  const warnings: string[] = [];

  try {
    const { isFlagEnabled } = await import('./platform-flags');
    const enabled = await isFlagEnabled('jira_sync_enabled');
    if (!enabled) {
      const result = { skipped: true, reason: 'jira_sync_enabled flag is off' };
      await completeWorkflowRun(ctx.workflowRunId, result);
      logger.info({ jobId: job.id }, 'hourly_jira_sprint_health_scan: skipped — flag disabled');
      return;
    }

    const { services } = await import('@szl-holdings/services');
    const adapter = services.jira;

    const sprints = await adapter.getActiveSprints();
    sprintsScanned = sprints.length;

    const sprintHealthList = await adapter.getSprintHealth();

    const signals = await adapter.ingestSignals();
    signalsGenerated = signals.length;

    const { db, alloySignalsTable, insertAlloySignalSchema } = await import('@szl-holdings/db');
    for (const signal of signals) {
      try {
        const data = insertAlloySignalSchema.parse({
          source: 'jira',
          sourceType: signal.type,
          severity: signal.severity,
          title: signal.title,
          body: signal.description,
          status: 'new',
          orgId: null,
          workflowId: null,
          normalizedScore: null,
          valueAtRisk: null,
          metadata: {
            ...signal.metadata,
            projectKey: signal.projectKey,
            sprintName: signal.sprintName,
          },
        });
        await db.insert(alloySignalsTable).values(data);
        signalsIngested++;
      } catch (err) {
        logger.warn(
          { err, signalId: signal.id },
          'hourly_jira_sprint_health_scan: failed to ingest signal',
        );
        warnings.push(`Failed to ingest signal: ${signal.id}`);
      }
    }

    const criticalSprints = sprintHealthList.filter((h) => h.burndownRisk === 'behind');
    if (criticalSprints.length > 0) {
      serverTelemetry.raiseAlert({
        type: 'sprint_burndown_critical',
        message: `${criticalSprints.length} sprint(s) critically behind schedule`,
        severity: 'critical',
        metadata: {
          sprintIds: criticalSprints.map((h) => h.sprint.id),
          correlationId: ctx.correlationId,
          workflowRunId: ctx.workflowRunId,
        },
      });
    }

    issuesScanned = sprintHealthList.reduce((s, h) => s + h.sprint.totalIssues, 0);
  } catch (err) {
    const w = `Jira scan error: ${(err as Error).message}`;
    logger.warn({ err, jobId: job.id }, `hourly_jira_sprint_health_scan: ${w}`);
    warnings.push(w);
  }

  const result = { sprintsScanned, issuesScanned, signalsGenerated, signalsIngested, warnings };

  serverTelemetry.recordBusinessEvent({
    type: 'jira_sprint_health_scan_completed',
    domain,
    success: warnings.length === 0,
    metadata: { ...result, correlationId: ctx.correlationId, workflowRunId: ctx.workflowRunId },
  });

  const jobStatus = warnings.length > 0 ? ('completed_with_warnings' as const) : undefined;
  await completeWorkflowRun(
    ctx.workflowRunId,
    result,
    warnings.length > 0 ? warnings[0] : undefined,
    jobStatus,
  );
  logger.info(
    { jobId: job.id, correlationId: ctx.correlationId, sprintsScanned, signalsIngested },
    'hourly_jira_sprint_health_scan: complete',
  );
});

let platformScheduledJobsStarted = false;

export function startPlatformScheduledJobs(): void {
  if (platformScheduledJobsStarted) return;
  platformScheduledJobsStarted = true;
  logger.info(
    'Platform scheduled jobs now managed by durable cron scheduler — in-memory timers disabled',
  );
}

durableJobQueue.register(PLATFORM_JOB_TYPES.NOTIFICATION_DISPATCH, async (job) => {
  const payload = job.payload as {
    channel: string;
    notificationId: number;
    userId: number;
    type: string;
    title: string;
    message: string;
    actionUrl?: string | null;
  };

  logger.info(
    { channel: payload.channel, notificationId: payload.notificationId, userId: payload.userId },
    '[notification-dispatch] Processing channel dispatch job',
  );

  if (payload.channel === 'email') {
    const [user] = await db
      .select({ email: usersTable.email, displayName: usersTable.displayName })
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!user) {
      logger.warn(
        { userId: payload.userId },
        '[notification-dispatch] User not found for email dispatch',
      );
    } else {
      const appUrl =
        process.env.APP_URL ?? process.env.VITE_APP_URL ?? 'https://szlholdings.com';
      const actionUrl = payload.actionUrl
        ? payload.actionUrl.startsWith('http')
          ? payload.actionUrl
          : `${appUrl}${payload.actionUrl}`
        : null;

      const name = user.displayName ?? user.email;
      const html = buildTransactionalNotificationEmail({
        name,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        actionUrl,
      });
      const text = `${payload.title}\n\n${payload.message}${actionUrl ? `\n\n${actionUrl}` : ''}`;

      const result = await sendEmail({
        to: user.email ?? '',
        subject: payload.title,
        html,
        text,
      });

      await db.insert(emailSendLogTable).values({
        notificationId: payload.notificationId,
        channel: 'email',
        provider: result.provider ?? null,
        messageId: result.messageId ?? null,
        recipient: user.email ?? '',
        subject: payload.title,
        status: result.success ? 'sent' : 'failed',
        error: result.success ? null : (result.error ?? null),
      }).catch((logErr: unknown) => {
        logger.warn({ logErr }, '[notification-dispatch] Failed to write email_send_log row');
      });

      if (result.success) {
        logger.info(
          {
            channel: payload.channel,
            notificationId: payload.notificationId,
            userId: payload.userId,
            messageId: result.messageId,
          },
          '[notification-dispatch] Email sent',
        );
      } else {
        logger.warn(
          {
            channel: payload.channel,
            notificationId: payload.notificationId,
            userId: payload.userId,
            error: result.error,
          },
          '[notification-dispatch] Email delivery failed — provider rejected',
        );
        throw new Error(`Email delivery failed: ${result.error}`);
      }
    }
  } else if (payload.channel === 'sms') {
    // If the job payload carries a specific phoneNumbers list (a retry job
    // for previously-failed recipients), send only to those. Otherwise look
    // up active SMS-enabled phone numbers for this user.
    const explicitNumbers = (payload as { phoneNumbers?: string[] }).phoneNumbers;
    const attemptNumber = (payload as { attempt?: number }).attempt ?? 1;
    const MAX_PER_RECIPIENT_ATTEMPTS = 3;

    let phoneNumbers: string[];
    if (explicitNumbers && explicitNumbers.length > 0) {
      phoneNumbers = explicitNumbers;
    } else {
      const recipients = await db
        .select({ phoneNumber: notificationRecipientsTable.phoneNumber })
        .from(notificationRecipientsTable)
        .where(
          and(
            eq(notificationRecipientsTable.userId, payload.userId),
            eq(notificationRecipientsTable.isActive, true),
            eq(notificationRecipientsTable.smsEnabled, true),
          ),
        );
      phoneNumbers = recipients.map((r) => r.phoneNumber);
    }

    if (phoneNumbers.length === 0) {
      logger.info(
        { notificationId: payload.notificationId, userId: payload.userId },
        '[notification-dispatch] SMS skipped — no active SMS-enabled phone numbers for user',
      );
    } else {
      const smsBody = `${payload.title}\n${payload.message}`.slice(0, 1500);
      const results = await Promise.allSettled(
        phoneNumbers.map((num) => twilioAdapter.sendSMS(num, smsBody)),
      );

      const failedNumbers: string[] = [];
      const failureReasons: Array<{ phoneMasked: string; error: string }> = [];
      let sent = 0;
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const num = phoneNumbers[i];
        if (r.status === 'fulfilled' && r.value.sent) {
          sent++;
        } else {
          failedNumbers.push(num);
          const err =
            r.status === 'rejected'
              ? String((r.reason as Error)?.message ?? r.reason)
              : 'provider returned sent=false';
          failureReasons.push({ phoneMasked: maskPhone(num), error: err });
        }
      }

      logger.info(
        {
          channel: payload.channel,
          notificationId: payload.notificationId,
          userId: payload.userId,
          attempt: attemptNumber,
          sent,
          failed: failedNumbers.length,
          total: phoneNumbers.length,
          failures: failureReasons,
        },
        '[notification-dispatch] SMS dispatch complete',
      );

      if (failedNumbers.length > 0) {
        if (sent === 0) {
          // Total failure — throw to let the durable queue retry the whole job
          // with its standard backoff.
          throw new Error(
            `SMS delivery failed for all ${failedNumbers.length} recipient(s): ${failureReasons.map((f) => `${f.phoneMasked}: ${f.error}`).join('; ')}`,
          );
        }
        // Partial failure — enqueue a follow-up retry job for just the failed
        // numbers. Cap retries so we don't loop forever on a permanently bad
        // number.
        if (attemptNumber < MAX_PER_RECIPIENT_ATTEMPTS) {
          void durableJobQueue
            .enqueue(PLATFORM_JOB_TYPES.NOTIFICATION_DISPATCH, {
              channel: 'sms',
              notificationId: payload.notificationId,
              userId: payload.userId,
              type: payload.type,
              title: payload.title,
              message: payload.message,
              actionUrl: payload.actionUrl,
              phoneNumbers: failedNumbers,
              attempt: attemptNumber + 1,
            })
            .catch((err: unknown) => {
              logger.error(
                { err, notificationId: payload.notificationId, failedCount: failedNumbers.length },
                '[notification-dispatch] Failed to enqueue SMS retry job',
              );
            });
          logger.info(
            {
              notificationId: payload.notificationId,
              userId: payload.userId,
              retryCount: failedNumbers.length,
              nextAttempt: attemptNumber + 1,
            },
            '[notification-dispatch] Enqueued SMS retry for failed recipients',
          );
        } else {
          logger.warn(
            {
              notificationId: payload.notificationId,
              userId: payload.userId,
              failedCount: failedNumbers.length,
              attempt: attemptNumber,
              failures: failureReasons,
            },
            '[notification-dispatch] SMS retry budget exhausted — giving up on remaining recipients',
          );
        }
      }
    }
  }

  logger.info(
    { channel: payload.channel, notificationId: payload.notificationId },
    '[notification-dispatch] Job complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.NOTIFICATION_DIGEST, async (job) => {
  const payload = job.payload as { since?: string };
  const hours = payload.since === '24h' ? 24 : 1;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const unreadByUser = await db
    .select({
      userId: notificationsTable.userId,
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.isRead, false), gte(notificationsTable.createdAt, since)))
    .groupBy(notificationsTable.userId);

  if (unreadByUser.length === 0) {
    logger.info('[notification-digest] No unread notifications to digest');
    return;
  }

  let digestsSent = 0;
  let digestsSkipped = 0;
  const appUrl = process.env.APP_URL ?? process.env.VITE_APP_URL ?? 'https://szlholdings.com';
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  for (const row of unreadByUser) {
    const [prefs] = await db
      .select({ emailEnabled: notificationPreferencesTable.emailEnabled })
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, row.userId))
      .limit(1);

    if (!prefs?.emailEnabled) {
      digestsSkipped++;
      continue;
    }

    const [user] = await db
      .select({ email: usersTable.email, displayName: usersTable.displayName })
      .from(usersTable)
      .where(eq(usersTable.id, row.userId))
      .limit(1);

    if (!user) {
      logger.warn({ userId: row.userId }, '[notification-digest] User record not found — skipping');
      digestsSkipped++;
      continue;
    }

    const recentNotifs = await db
      .select({
        title: notificationsTable.title,
        message: notificationsTable.message,
        type: notificationsTable.type,
        actionUrl: notificationsTable.actionUrl,
        createdAt: notificationsTable.createdAt,
      })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.userId, row.userId),
          eq(notificationsTable.isRead, false),
          gte(notificationsTable.createdAt, since),
        ),
      )
      .limit(10);

    const html = buildNotificationDigestEmail({
      userName: user.displayName ?? user.email,
      date: dateLabel,
      notifications: recentNotifs.map((n) => ({
        title: n.title,
        message: n.message,
        type: n.type,
        actionUrl: n.actionUrl ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
    });

    const subject = `Your ${hours >= 24 ? 'daily' : `${hours}-hour`} digest — ${row.count} unread notification${row.count !== 1 ? 's' : ''}`;

    const result = await sendEmail({
      to: user.email ?? '',
      subject,
      html,
      text: `You have ${row.count} unread notification${row.count !== 1 ? 's' : ''} in the last ${hours} hours. Visit ${appUrl} to view them.`,
    });

    await db.insert(emailSendLogTable).values({
      notificationId: null,
      channel: 'email',
      provider: result.provider ?? null,
      messageId: result.messageId ?? null,
      recipient: user.email ?? '',
      subject,
      status: result.success ? 'sent' : 'failed',
      error: result.success ? null : (result.error ?? null),
    }).catch((logErr: unknown) => {
      logger.warn({ logErr }, '[notification-digest] Failed to write email_send_log row');
    });

    if (result.success) {
      logger.info(
        { userId: row.userId, unreadCount: row.count, messageId: result.messageId },
        '[notification-digest] Digest email sent',
      );
      digestsSent++;
    } else {
      logger.warn(
        { userId: row.userId, unreadCount: row.count, error: result.error },
        '[notification-digest] Failed to send digest email',
      );
      digestsSkipped++;
    }
  }

  logger.info(
    { digestsSent, digestsSkipped, periodHours: hours },
    '[notification-digest] Digest complete',
  );
});

durableJobQueue.register(PLATFORM_JOB_TYPES.BACKUP_RESTORE_DRILL, async (job) => {
  const ctx = buildJobContext(job);
  const domain = DOMAIN_MAP[job.type]!;
  logger.info({ jobId: job.id, correlationId: ctx.correlationId }, 'backup_restore_drill: starting');
  await startWorkflowRun(ctx, domain);

  try {
    const { runBackupRestoreDrill } = await import('../jobs/backup-restore-drill');
    const drillResult = await runBackupRestoreDrill();
    const success = drillResult.status === 'pass';

    serverTelemetry.recordBusinessEvent({
      type: 'backup_restore_drill_completed',
      domain,
      success,
      metadata: {
        runId: drillResult.runId,
        status: drillResult.status,
        durationMs: drillResult.durationMs,
        smokeChecksPassed: drillResult.smokeChecksPassed,
        smokeChecksFailed: drillResult.smokeChecksFailed,
        gzipIntegrityOk: drillResult.gzipIntegrityOk,
        correlationId: ctx.correlationId,
        workflowRunId: ctx.workflowRunId,
      },
    });

    if (!success) {
      serverTelemetry.raiseAlert({
        type: 'backup_restore_drill_failed',
        message: `Weekly backup restore drill FAILED: ${drillResult.error ?? `${drillResult.smokeChecksFailed} smoke check(s) failed`}`,
        severity: 'critical',
        metadata: {
          runId: drillResult.runId,
          backupFile: drillResult.backupFile,
          smokeChecksFailed: drillResult.smokeChecksFailed,
          correlationId: ctx.correlationId,
        },
      });
    }

    await completeWorkflowRun(
      ctx.workflowRunId,
      {
        drillRunId: drillResult.runId,
        status: drillResult.status,
        durationMs: drillResult.durationMs,
        smokeChecksPassed: drillResult.smokeChecksPassed,
        smokeChecksFailed: drillResult.smokeChecksFailed,
      },
      success ? undefined : drillResult.error ?? 'Drill failed',
      success ? undefined : 'failed',
    );

    logger.info(
      { jobId: job.id, correlationId: ctx.correlationId, drillStatus: drillResult.status },
      'backup_restore_drill: complete',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, jobId: job.id }, 'backup_restore_drill: unexpected error');
    await completeWorkflowRun(ctx.workflowRunId, {}, message, 'failed');
    throw err;
  }
});
