import { logger } from '../lib/logger';
import {
  submitJob,
  createSchedule,
  type HfUvJobSpec,
  type HfDockerJobSpec,
  type HfScheduleSpec,
  getFlavorCostPerMinute,
} from './hf-jobs-adapter';
import { watchJob } from './hf-jobs-poller';
import type { ToolResult } from '../a11oy/runtime/tools/registry';

export async function executeSubmitHfJob(
  input: Record<string, unknown>,
  demo: boolean,
): Promise<ToolResult> {
  const start = Date.now();
  const toolId = 'submitHfJob';
  try {
    const jobType = String(input.type ?? 'docker');
    const flavor = String(input.flavor ?? 'cpu-basic');

    const spec = {
      type: jobType,
      image: input.image as string | undefined,
      command: input.command as string[] | undefined,
      script: input.script as string | undefined,
      requirements: input.requirements as string[] | undefined,
      env: input.env as Record<string, string> | undefined,
      secrets: input.secrets as Record<string, string> | undefined,
      volumes: input.volumes as HfUvJobSpec['volumes'],
      flavor,
      timeout: input.timeout as number | string | undefined,
      namespace: input.namespace as string | undefined,
      labels: input.labels as Record<string, string> | undefined,
    } as HfUvJobSpec | HfDockerJobSpec;

    const result = await submitJob(spec);

    watchJob({
      jobId: result.jobId,
      namespace: spec.namespace,
      lastStatus: 'queued',
    });

    logger.info({ jobId: result.jobId, flavor, demo }, '[hf-executor] Job submitted via tool');

    return {
      ok: true,
      toolId,
      output: {
        jobId: result.jobId,
        status: result.status,
        flavor,
        costPerMinute: getFlavorCostPerMinute(flavor),
        namespace: spec.namespace ?? '',
        message: `HF Job submitted (${jobType}) on ${flavor}`,
      },
      durationMs: Date.now() - start,
      isDemo: demo,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, toolId }, '[hf-executor] Job submission failed');
    return { ok: false, toolId, error: msg, durationMs: Date.now() - start };
  }
}

export async function executeSubmitHfScheduledJob(
  input: Record<string, unknown>,
  demo: boolean,
): Promise<ToolResult> {
  const start = Date.now();
  const toolId = 'submitHfScheduledJob';
  try {
    const cron = String(input.cron ?? '0 2 * * *');
    const flavor = String(input.flavor ?? 'cpu-basic');

    const spec: HfScheduleSpec = {
      type: (input.type as 'uv' | 'docker') ?? 'docker',
      cron,
      image: input.image as string | undefined,
      command: input.command as string[] | undefined,
      env: input.env as Record<string, string> | undefined,
      secrets: input.secrets as Record<string, string> | undefined,
      volumes: input.volumes as HfScheduleSpec['volumes'],
      flavor,
      timeout: input.timeout as number | string | undefined,
      namespace: input.namespace as string | undefined,
      labels: input.labels as Record<string, string> | undefined,
    };

    const result = await createSchedule(spec);

    logger.info({ scheduleId: result.scheduleId, cron, flavor, demo }, '[hf-executor] Schedule created via tool');

    return {
      ok: true,
      toolId,
      output: {
        scheduleId: result.scheduleId,
        status: result.status,
        cron,
        flavor,
        costPerMinute: getFlavorCostPerMinute(flavor),
        namespace: spec.namespace ?? '',
        message: `HF scheduled job created with cron "${cron}"`,
      },
      durationMs: Date.now() - start,
      isDemo: demo,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, toolId }, '[hf-executor] Schedule creation failed');
    return { ok: false, toolId, error: msg, durationMs: Date.now() - start };
  }
}
