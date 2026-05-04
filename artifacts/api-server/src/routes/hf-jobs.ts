import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { bodyShape } from '@szl-holdings/contracts/common';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { recordGuardianAction, makeGuardianRequestId, getGuardianEngine } from '../lib/guardian-engine';
import {
  submitJob,
  listJobs,
  inspectJob,
  fetchJobLogs,
  cancelJob,
  deleteJob,
  createSchedule,
  listSchedules,
  inspectSchedule,
  suspendSchedule,
  resumeSchedule,
  deleteSchedule,
  HARDWARE_FLAVORS,
  type HfUvJobSpec,
  type HfDockerJobSpec,
  type HfScheduleSpec,
} from '../services/hf-jobs-adapter';
import { watchJob } from '../services/hf-jobs-poller';

const router = Router();

const VALID_FLAVORS = new Set(HARDWARE_FLAVORS.map((f) => f.id));

const volumeSchema = z.object({
  type: z.enum(['model', 'dataset', 'bucket', 'subfolder']),
  source: z.string().min(1),
  mount: z.string().min(1),
  readOnly: z.boolean().optional(),
});

const kvStringRecord = z.record(z.string(), z.string()).optional();

function recordHfGuardianAction(req: Request, action: string, meta: Record<string, unknown>) {
  const user = req.user;
  const orgId = user?.orgs?.[0]?.orgId ?? null;
  const agentId = req.headers['x-agent-id'];
  const requestId = makeGuardianRequestId('hf-jobs');

  const engine = getGuardianEngine();
  const decision = engine.decide({
    requestId,
    agentId: typeof agentId === 'string' ? agentId : undefined,
    action,
    domain: 'hf-jobs',
    tier: 'operator-approved',
    environment: process.env.NODE_ENV ?? 'development',
    context: { orgId, userId: user?.id ?? null, ...meta },
  });

  void recordGuardianAction({
    request: {
      requestId,
      agentId: typeof agentId === 'string' ? agentId : undefined,
      action,
      domain: 'hf-jobs',
      tier: 'operator-approved',
      environment: process.env.NODE_ENV ?? 'development',
      context: meta,
    },
    result: decision,
    orgId: typeof orgId === 'number' ? orgId : null,
    payload: meta,
  });

  return { requestId, decision };
}

router.get(
  '/hf-jobs/flavors',
  authMiddleware(),
  (_req: Request, res: Response) => {
    sendSuccess(res, { flavors: HARDWARE_FLAVORS });
  },
);

router.get(
  '/hf-jobs/runs',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const namespace = req.query.namespace as string | undefined;
      const jobs = await listJobs(namespace, status);
      sendSuccess(res, { jobs, total: jobs.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list HF jobs');
    }
  },
);

router.get(
  '/hf-jobs/runs/:jobId',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const job = await inspectJob(req.params.jobId as string);
      if (!job) {
        res.status(404).json({ success: false, error: 'Job not found' });
        return;
      }
      sendSuccess(res, job);
    } catch (err) {
      handleRouteError(res, err, 'Failed to inspect HF job');
    }
  },
);

router.get(
  '/hf-jobs/runs/:jobId/logs',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const logs = await fetchJobLogs(req.params.jobId as string);
      sendSuccess(res, { logs, total: logs.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch HF job logs');
    }
  },
);

const submitJobSchema = bodyShape({
  type: z.enum(['uv', 'docker']).default('docker'),
  image: z.string().min(1).optional(),
  command: z.array(z.string()).optional(),
  script: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  env: kvStringRecord,
  secrets: kvStringRecord,
  volumes: z.array(volumeSchema).optional(),
  flavor: z.string().min(1).default('cpu-basic'),
  timeout: z.union([z.number().int().positive(), z.string().min(1)]).optional(),
  namespace: z.string().optional(),
  labels: kvStringRecord,
});

router.post(
  '/hf-jobs/runs',
  authMiddleware(),
  requireRole('ops', 'super_admin', 'admin', 'operator'),
  validateBody(submitJobSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof submitJobSchema>;
      const jobType = body.type ?? 'docker';
      const flavor = body.flavor ?? 'cpu-basic';

      if (!VALID_FLAVORS.has(flavor)) {
        sendBadRequest(res, `Unknown flavor "${flavor}". Valid: ${[...VALID_FLAVORS].join(', ')}`);
        return;
      }

      if (jobType === 'docker' && !body.image) {
        sendBadRequest(res, 'image is required for Docker jobs');
        return;
      }

      if (jobType === 'uv' && !body.script && !body.command) {
        sendBadRequest(res, 'script or command is required for UV jobs');
        return;
      }

      const guardianMeta = {
        jobType,
        flavor,
        namespace: body.namespace ?? '',
        labels: body.labels ?? {},
      };
      const { requestId } = recordHfGuardianAction(req, 'hf-jobs.submit', guardianMeta);

      const spec = {
        type: jobType,
        image: body.image,
        command: body.command,
        script: body.script,
        requirements: body.requirements,
        env: body.env,
        secrets: body.secrets,
        volumes: body.volumes,
        flavor,
        timeout: body.timeout,
        namespace: body.namespace,
        labels: body.labels,
      } as HfUvJobSpec | HfDockerJobSpec;

      const result = await submitJob(spec);

      watchJob({
        jobId: result.jobId,
        namespace: spec.namespace,
        lastStatus: 'queued',
      });

      logger.info({ jobId: result.jobId, guardianRequestId: requestId }, '[hf-jobs] Job submitted');

      sendCreated(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to submit HF job');
    }
  },
);

router.post(
  '/hf-jobs/runs/:jobId/cancel',
  authMiddleware(),
  requireRole('ops', 'super_admin', 'admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const jobId = req.params.jobId as string;
      recordHfGuardianAction(req, 'hf-jobs.cancel', { jobId });
      const ok = await cancelJob(jobId);
      if (!ok) {
        res.status(500).json({ success: false, error: 'Cancel failed' });
        return;
      }
      sendSuccess(res, { jobId, status: 'cancelled' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to cancel HF job');
    }
  },
);

router.delete(
  '/hf-jobs/runs/:jobId',
  authMiddleware(),
  requireRole('ops', 'super_admin', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const jobId = req.params.jobId as string;
      recordHfGuardianAction(req, 'hf-jobs.delete', { jobId });
      const ok = await deleteJob(jobId);
      if (!ok) {
        res.status(500).json({ success: false, error: 'Delete failed' });
        return;
      }
      sendSuccess(res, { jobId, deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete HF job');
    }
  },
);

router.get(
  '/hf-jobs/schedules',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const namespace = req.query.namespace as string | undefined;
      const schedules = await listSchedules(namespace);
      sendSuccess(res, { schedules, total: schedules.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list HF schedules');
    }
  },
);

router.get(
  '/hf-jobs/schedules/:scheduleId',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const schedule = await inspectSchedule(req.params.scheduleId as string);
      if (!schedule) {
        res.status(404).json({ success: false, error: 'Schedule not found' });
        return;
      }
      sendSuccess(res, schedule);
    } catch (err) {
      handleRouteError(res, err, 'Failed to inspect HF schedule');
    }
  },
);

const createScheduleSchema = bodyShape({
  type: z.enum(['uv', 'docker']).default('docker'),
  cron: z.string().min(1, 'cron expression is required'),
  image: z.string().min(1).optional(),
  command: z.array(z.string()).optional(),
  env: kvStringRecord,
  secrets: kvStringRecord,
  volumes: z.array(volumeSchema).optional(),
  flavor: z.string().min(1).default('cpu-basic'),
  timeout: z.union([z.number().int().positive(), z.string().min(1)]).optional(),
  namespace: z.string().optional(),
  labels: kvStringRecord,
});

router.post(
  '/hf-jobs/schedules',
  authMiddleware(),
  requireRole('ops', 'super_admin', 'admin', 'operator'),
  validateBody(createScheduleSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof createScheduleSchema>;
      const flavor = body.flavor ?? 'cpu-basic';

      if (!VALID_FLAVORS.has(flavor)) {
        sendBadRequest(res, `Unknown flavor "${flavor}". Valid: ${[...VALID_FLAVORS].join(', ')}`);
        return;
      }

      const guardianMeta = {
        cron: body.cron,
        flavor,
        namespace: body.namespace ?? '',
        labels: body.labels ?? {},
      };
      recordHfGuardianAction(req, 'hf-jobs.schedule.create', guardianMeta);

      const spec: HfScheduleSpec = {
        type: body.type ?? 'docker',
        cron: body.cron,
        image: body.image,
        command: body.command,
        env: body.env,
        secrets: body.secrets,
        volumes: body.volumes,
        flavor,
        timeout: body.timeout,
        namespace: body.namespace,
        labels: body.labels,
      };

      const result = await createSchedule(spec);
      sendCreated(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create HF schedule');
    }
  },
);

router.post(
  '/hf-jobs/schedules/:scheduleId/suspend',
  authMiddleware(),
  requireRole('ops', 'super_admin', 'admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const scheduleId = req.params.scheduleId as string;
      recordHfGuardianAction(req, 'hf-jobs.schedule.suspend', { scheduleId });
      const ok = await suspendSchedule(scheduleId);
      if (!ok) {
        res.status(500).json({ success: false, error: 'Suspend failed' });
        return;
      }
      sendSuccess(res, { scheduleId, status: 'suspended' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to suspend HF schedule');
    }
  },
);

router.post(
  '/hf-jobs/schedules/:scheduleId/resume',
  authMiddleware(),
  requireRole('ops', 'super_admin', 'admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const scheduleId = req.params.scheduleId as string;
      recordHfGuardianAction(req, 'hf-jobs.schedule.resume', { scheduleId });
      const ok = await resumeSchedule(scheduleId);
      if (!ok) {
        res.status(500).json({ success: false, error: 'Resume failed' });
        return;
      }
      sendSuccess(res, { scheduleId, status: 'active' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to resume HF schedule');
    }
  },
);

router.delete(
  '/hf-jobs/schedules/:scheduleId',
  authMiddleware(),
  requireRole('ops', 'super_admin', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const scheduleId = req.params.scheduleId as string;
      recordHfGuardianAction(req, 'hf-jobs.schedule.delete', { scheduleId });
      const ok = await deleteSchedule(scheduleId);
      if (!ok) {
        res.status(500).json({ success: false, error: 'Delete failed' });
        return;
      }
      sendSuccess(res, { scheduleId, deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete HF schedule');
    }
  },
);

router.get(
  '/hf-jobs/summary',
  authMiddleware(),
  async (_req: Request, res: Response) => {
    try {
      const [jobs, schedules] = await Promise.all([listJobs(), listSchedules()]);
      const now = Date.now();
      const last24h = now - 86400_000;

      const running = jobs.filter((j) => j.status === 'running').length;
      const queued = jobs.filter((j) => j.status === 'queued').length;
      const scheduled = schedules.filter((s) => s.status === 'active').length;
      const failedLast24h = jobs.filter(
        (j) => j.status === 'failed' && j.completedAt && new Date(j.completedAt).getTime() > last24h,
      ).length;

      sendSuccess(res, {
        kpis: { running, queued, scheduled, failedLast24h },
        totalJobs: jobs.length,
        totalSchedules: schedules.length,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get HF jobs summary');
    }
  },
);

export default router;
