import { bodyShape } from '@szl-holdings/contracts/common';
import { type RequestHandler, type IRouter, type Request, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const simulateSchema = z.object({
  scenarioId: z.string().min(1).max(200),
  iterations: z.number().int().min(1000).max(100000).optional(),
  batchSize: z.number().int().min(100).max(5000).optional(),
  snapshotInterval: z.number().int().min(100).max(50000).optional(),
});

const customSimulateSchema = z.object({
  scenario: z.record(z.unknown()),
  iterations: z.number().int().min(1000).max(50000).optional(),
  batchSize: z.number().int().min(100).max(5000).optional(),
});

const _compareSchema = z.object({
  scenarioIds: z.array(z.string().min(1).max(200)).min(2).max(10),
  iterations: z.number().int().min(100).max(100000).optional(),
});

const isProduction = process.env.NODE_ENV === 'production';

const simulationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many simulation requests. Please try again later.' },
}) as unknown as RequestHandler;

import {
  cleanupOldJobs,
  getJob,
  getScenario,
  getVariants,
  listJobs,
  listScenarios,
  runBacktest,
  runCalibrationCheck,
  runComparison,
  type SimulationJob,
  type SimulationProgress,
  startCustomSimulationJob,
  startSimulationJob,
  validateSerializableScenario,
} from '../lib/monte-carlo-service';
import { WS_CHANNELS } from '../lib/websocket';

const ADMIN_ROLES = new Set(['founder_admin', 'platform_admin', 'super_admin', 'admin']);

function isAdmin(req: Request): boolean {
  return req.user?.roles?.some((r: string) => ADMIN_ROLES.has(r)) ?? false;
}

function parsePositiveInt(
  value: unknown,
  defaultVal: number | undefined,
  min: number,
  max: number,
): number | null {
  if (value === undefined || value === null) {
    if (defaultVal === undefined) return null;
    return Math.max(min, Math.min(max, defaultVal));
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n !== Math.floor(n) || n < min) return null;
  return Math.min(n, max);
}

function canAccessJob(job: SimulationJob, req: Request): boolean {
  if (isAdmin(req)) return true;
  if (job.creatorUserId === null || job.creatorUserId === undefined) return isAdmin(req);
  return req.user ? String(req.user.id) === job.creatorUserId : false;
}

const router: IRouter = Router();

router.get('/monte-carlo/scenarios', authMiddleware({ required: false }), (_req, res) => {
  try {
    sendSuccess(res, { scenarios: listScenarios() });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list scenarios');
  }
});

router.get('/monte-carlo/scenarios/:id', authMiddleware({ required: false }), (req, res) => {
  try {
    const id = decodeURIComponent((req.params.id as string) ?? '');
    const scenario = getScenario(id);
    if (!scenario) {
      sendNotFound(res, 'Scenario');
      return;
    }
    const variants = getVariants(id);
    sendSuccess(res, {
      id: scenario.id,
      version: scenario.version,
      title: scenario.title,
      description: scenario.description,
      domain: scenario.domain,
      tags: scenario.tags,
      inputs: scenario.inputs.map((i) => ({
        id: i.id,
        label: i.label,
        description: i.description,
        unit: i.unit,
        format: i.format,
        distribution: i.distribution,
      })),
      outputs: scenario.outputs,
      variants,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get scenario');
  }
});

router.post(
  '/monte-carlo/simulate',
  simulationLimiter,
  authMiddleware(),
  validateBody(simulateSchema),
  (req, res) => {
    try {
      const { scenarioId, iterations, batchSize, snapshotInterval } = req.body as z.infer<
        typeof simulateSchema
      >;
      if (!getScenario(scenarioId)) {
        sendNotFound(res, 'Scenario');
        return;
      }

      const parsedIterations = parsePositiveInt(iterations, 10_000, 1_000, 100_000) ?? 10_000;
      const parsedBatchSize = parsePositiveInt(batchSize, 1_000, 100, 5_000) ?? 1_000;
      const parsedSnapshotInterval =
        snapshotInterval !== undefined
          ? (parsePositiveInt(snapshotInterval, undefined, 100, 50_000) ?? undefined)
          : undefined;

      const config = {
        iterations: parsedIterations,
        batchSize: parsedBatchSize,
        ...(parsedSnapshotInterval !== undefined
          ? { snapshotInterval: parsedSnapshotInterval }
          : {}),
      };

      const creatorUserId = req.user ? String(req.user.id) : null;
      const creatorTenantId = req.user?.orgs?.[0] ? String(req.user.orgs[0].orgId) : null;

      const job = startSimulationJob(scenarioId, config, creatorUserId, creatorTenantId);
      sendCreated(res, {
        jobId: job.jobId,
        status: job.status,
        scenarioId: job.scenarioId,
        config: job.config,
        createdAt: job.createdAt,
        wsChannel: WS_CHANNELS.MONTE_CARLO_PROGRESS,
        message: `Simulation started. Subscribe to WebSocket channel '${WS_CHANNELS.MONTE_CARLO_PROGRESS}' for real-time progress, or poll GET /monte-carlo/jobs/${job.jobId}`,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to start simulation');
    }
  },
);

router.post(
  '/monte-carlo/simulate/custom',
  simulationLimiter,
  authMiddleware(),
  validateBody(customSimulateSchema),
  (req, res) => {
    try {
      const { scenario, iterations, batchSize } = req.body as z.infer<typeof customSimulateSchema>;

      if (!validateSerializableScenario(scenario)) {
        sendBadRequest(
          res,
          'Invalid scenario definition. Must include id, title, domain, inputs[], outputs[], outputExprs[] (1:1 with outputs), and optionally constraints[] with valid BoolExpr trees.',
        );
        return;
      }

      const parsedIterations = parsePositiveInt(iterations, 5_000, 1_000, 50_000);
      if (parsedIterations === null) {
        sendBadRequest(res, 'iterations must be a positive integer between 1,000 and 50,000');
        return;
      }
      const parsedBatchSize = parsePositiveInt(batchSize, 500, 100, 2_000);
      if (parsedBatchSize === null) {
        sendBadRequest(res, 'batchSize must be a positive integer between 100 and 2,000');
        return;
      }

      const config = { iterations: parsedIterations, batchSize: parsedBatchSize };

      const creatorUserId = req.user ? String(req.user.id) : null;
      const creatorTenantId = req.user?.orgs?.[0] ? String(req.user.orgs[0].orgId) : null;

      const job = startCustomSimulationJob(scenario, config, creatorUserId, creatorTenantId);
      sendCreated(res, {
        jobId: job.jobId,
        status: job.status,
        scenarioId: job.scenarioId,
        config: job.config,
        createdAt: job.createdAt,
        wsChannel: WS_CHANNELS.MONTE_CARLO_PROGRESS,
        message: `Custom DSL simulation started (parallel worker threads). Subscribe to WebSocket channel '${WS_CHANNELS.MONTE_CARLO_PROGRESS}' for real-time progress.`,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to start custom simulation');
    }
  },
);

router.get('/monte-carlo/jobs', authMiddleware(), (req, res) => {
  try {
    const jobs = listJobs()
      .filter((j) => canAccessJob(j, req))
      .map((j) => ({
        jobId: j.jobId,
        status: j.status,
        scenarioId: j.scenarioId,
        scenarioType: j.scenarioType,
        progress: j.progress,
        createdAt: j.createdAt,
        completedAt: j.completedAt,
        error: j.error,
        hasResult: !!j.result,
      }));
    sendSuccess(res, { jobs });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list jobs');
  }
});

router.get('/monte-carlo/jobs/:id', authMiddleware(), (req, res) => {
  try {
    const job = getJob((req.params.id as string) ?? '');
    if (!job) {
      sendNotFound(res, 'Job');
      return;
    }
    if (!canAccessJob(job, req)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    sendSuccess(res, {
      jobId: job.jobId,
      status: job.status,
      scenarioId: job.scenarioId,
      scenarioType: job.scenarioType,
      config: job.config,
      progress: job.progress,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      error: job.error,
      result: job.result
        ? {
            scenarioId: job.result.scenarioId,
            scenarioTitle: job.result.scenarioTitle,
            totalIterations: job.result.totalIterations,
            validIterations: job.result.validIterations,
            constraintViolationRate: job.result.constraintViolationRate,
            durationMs: job.result.durationMs,
            timestamp: job.result.timestamp,
            results: Object.fromEntries(
              Object.entries(job.result.results).map(([k, v]) => [
                k,
                {
                  metric: v.metric,
                  stats: v.stats,
                  histogram: v.histogram,
                  cdf: v.cdf,
                  constraintViolations: v.constraintViolations,
                },
              ]),
            ),
          }
        : null,
      sensitivity: job.sensitivity ?? null,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get job');
  }
});

router.get('/monte-carlo/jobs/:id/stream', authMiddleware(), (req, res: Response) => {
  const job = getJob((req.params.id as string) ?? '');
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  const requestingUserId = req.user ? String(req.user.id) : null;
  const isAdmin =
    req.user?.roles?.some(
      (r: string) =>
        r === 'founder_admin' || r === 'platform_admin' || r === 'super_admin' || r === 'admin',
    ) ?? false;
  if (!isAdmin && job.creatorUserId !== null && job.creatorUserId !== requestingUserId) {
    res.status(403).json({ error: 'Forbidden: you do not own this simulation job' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  if (job.status === 'complete') {
    sendEvent('complete', buildCompletePayload(job));
    res.end();
    return;
  }

  if (job.status === 'error') {
    sendEvent('error', { jobId: job.jobId, error: job.error });
    res.end();
    return;
  }

  const poll = setInterval(() => {
    const current = getJob(job.jobId);
    if (!current) {
      sendEvent('error', { error: 'Job disappeared' });
      clearInterval(poll);
      res.end();
      return;
    }

    if (current.progress) {
      sendEvent('progress', {
        jobId: current.jobId,
        iteration: current.progress.iteration,
        totalIterations: current.progress.totalIterations,
        percentComplete: current.progress.percentComplete,
        estimatedRemainingMs: current.progress.estimatedRemainingMs,
        elapsedMs: current.progress.elapsedMs,
      } satisfies SimulationProgress & { jobId: string });
    }

    if (current.status === 'complete') {
      sendEvent('complete', buildCompletePayload(current));
      clearInterval(poll);
      res.end();
    } else if (current.status === 'error') {
      sendEvent('error', { jobId: current.jobId, error: current.error });
      clearInterval(poll);
      res.end();
    }
  }, 500);

  req.on('close', () => clearInterval(poll));
});

function buildCompletePayload(job: ReturnType<typeof getJob>) {
  if (!job) return null;
  return {
    jobId: job.jobId,
    status: job.status,
    result: job.result
      ? {
          scenarioId: job.result.scenarioId,
          totalIterations: job.result.totalIterations,
          validIterations: job.result.validIterations,
          durationMs: job.result.durationMs,
          results: Object.fromEntries(
            Object.entries(job.result.results).map(([k, v]) => [
              k,
              { stats: v.stats, histogram: v.histogram },
            ]),
          ),
        }
      : null,
    sensitivity: job.sensitivity,
  };
}

const fullCompareSchema = z.object({
  scenarioId: z.string().min(1).max(200),
  outputId: z.string().min(1).max(200),
  variantIds: z.array(z.string().min(1).max(200)).max(20).optional(),
  iterations: z.number().int().min(1000).max(20000).optional(),
  weights: z.array(z.number().nonnegative().finite()).max(20).optional(),
});

router.post(
  '/monte-carlo/compare',
  simulationLimiter,
  authMiddleware(),
  validateBody(fullCompareSchema),
  async (req, res) => {
    try {
      const { scenarioId, variantIds, outputId, iterations, weights } = req.body as z.infer<
        typeof fullCompareSchema
      >;
      if (!getScenario(scenarioId)) {
        sendNotFound(res, 'Scenario');
        return;
      }

      const parsedIterations = parsePositiveInt(iterations, 5_000, 1_000, 20_000) ?? 5_000;
      const config = { iterations: parsedIterations };
      const comparison = await runComparison(
        scenarioId,
        Array.isArray(variantIds) ? variantIds : [],
        outputId,
        config,
        weights ?? undefined,
      );
      sendSuccess(res, comparison);
    } catch (err) {
      handleRouteError(res, err, 'Failed to run comparison');
    }
  },
);

router.post(
  '/monte-carlo/calibrate',
  authMiddleware(),
  validateBody(
    bodyShape({
      historicalData: z.unknown().optional(),
      scenarioId: z.unknown().optional(),
      simulationJobId: z.unknown().optional(),
    }),
  ),
  (req, res) => {
    try {
      const { scenarioId, historicalData, simulationJobId } = req.body ?? {};
      if (!scenarioId) {
        sendBadRequest(res, 'scenarioId is required');
        return;
      }
      if (!simulationJobId) {
        sendBadRequest(res, 'simulationJobId is required');
        return;
      }

      const job = getJob(simulationJobId);
      if (!job) {
        sendNotFound(res, 'Simulation job');
        return;
      }
      if (!canAccessJob(job, req)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      if (job.status !== 'complete' || !job.result) {
        sendBadRequest(res, 'Simulation job is not complete');
        return;
      }

      const result = runCalibrationCheck(scenarioId, historicalData ?? [], job.result);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to calibrate');
    }
  },
);

router.post(
  '/monte-carlo/backtest',
  authMiddleware(),
  validateBody(
    bodyShape({
      historicalData: z.unknown().optional(),
      outputId: z.unknown().optional(),
      scenarioId: z.unknown().optional(),
      simulationJobId: z.unknown().optional(),
    }),
  ),
  (req, res) => {
    try {
      const { scenarioId, historicalData, simulationJobId, outputId } = req.body ?? {};
      if (!scenarioId) {
        sendBadRequest(res, 'scenarioId is required');
        return;
      }
      if (!outputId) {
        sendBadRequest(res, 'outputId is required');
        return;
      }
      if (!simulationJobId) {
        sendBadRequest(res, 'simulationJobId is required');
        return;
      }

      const job = getJob(simulationJobId);
      if (!job) {
        sendNotFound(res, 'Simulation job');
        return;
      }
      if (!canAccessJob(job, req)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      if (job.status !== 'complete' || !job.result) {
        sendBadRequest(res, 'Simulation job is not complete');
        return;
      }

      const result = runBacktest(scenarioId, historicalData ?? [], job.result, outputId);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to run backtest');
    }
  },
);

// ─── Scaled Batch Monte Carlo — 10k+ iterations with SSE progress ─────────────
//
// POST /monte-carlo/batch
//
// An explicit endpoint that accepts a scenarioId + iteration count (up to 50k),
// spawns a simulation job, then streams SSE progress events until the job
// completes and emits a final 'complete' event with the full result.
//
// This is the canonical path for large-scale batch simulation. The standard
// /monte-carlo/simulate endpoints cap at 20k iterations; this endpoint extends
// to 50k and provides real-time progress over SSE in a single request.
//
// Query params:
//   ?stream=true  (default) — keep connection open and stream SSE events.
//   ?stream=false           — launch the job and return the jobId immediately.

const batchSimulateSchema = z.object({
  scenarioId: z.string().min(1).max(200),
  iterations: z.number().int().min(1_000).max(50_000).default(10_000),
  batchSize: z.number().int().min(100).max(5_000).default(1_000),
  label: z.string().max(200).optional(),
});

router.post(
  '/monte-carlo/batch',
  simulationLimiter,
  authMiddleware(),
  validateBody(batchSimulateSchema),
  (req, res) => {
    try {
      const body = req.body as z.infer<typeof batchSimulateSchema>;
      const { scenarioId, iterations, batchSize, label } = body;

      const wantStream = req.query.stream !== 'false';
      const creatorUserId = req.user ? String(req.user.id) : null;
      const creatorTenantId = req.user?.orgs?.[0]?.orgId ? String(req.user.orgs[0].orgId) : null;

      const job = startSimulationJob(
        scenarioId,
        { iterations, batchSize },
        creatorUserId,
        creatorTenantId,
      );

      if (!wantStream) {
        // Fire-and-forget mode — client will poll /monte-carlo/jobs/:id
        res.status(202).json({
          jobId: job.jobId,
          scenarioId,
          iterations,
          batchSize,
          label,
          streamUrl: `/monte-carlo/jobs/${job.jobId}/stream`,
          message: 'Batch simulation job started. Stream progress via the streamUrl.',
        });
        return;
      }

      // SSE streaming mode
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.setHeader('X-Batch-Job-Id', job.jobId);
      res.flushHeaders();

      const sendEvent = (event: string, data: unknown) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      // Send initial 'started' event
      sendEvent('started', {
        jobId: job.jobId,
        scenarioId,
        iterations,
        batchSize,
        label,
        startedAt: new Date().toISOString(),
      });

      const poll = setInterval(() => {
        const current = getJob(job.jobId);
        if (!current) {
          sendEvent('error', { error: 'Batch job disappeared from store' });
          clearInterval(poll);
          res.end();
          return;
        }

        if (current.progress) {
          sendEvent('progress', {
            jobId: current.jobId,
            iteration: current.progress.iteration,
            totalIterations: current.progress.totalIterations,
            percentComplete: current.progress.percentComplete,
            elapsedMs: current.progress.elapsedMs,
            estimatedRemainingMs: current.progress.estimatedRemainingMs,
            throughputPerSec:
              current.progress.elapsedMs > 0
                ? Math.round((current.progress.iteration / current.progress.elapsedMs) * 1000)
                : 0,
          });
        }

        if (current.status === 'complete') {
          sendEvent('complete', buildCompletePayload(current));
          clearInterval(poll);
          res.end();
        } else if (current.status === 'error') {
          sendEvent('error', { jobId: current.jobId, error: current.error });
          clearInterval(poll);
          res.end();
        }
      }, 300);

      req.on('close', () => clearInterval(poll));
    } catch (err) {
      handleRouteError(res, err, 'Failed to start batch simulation');
    }
  },
);

router.post('/monte-carlo/cleanup', authMiddleware(), validateBody(bodyShape({})), (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'Forbidden: admin role required' });
    return;
  }
  try {
    cleanupOldJobs();
    sendSuccess(res, { message: 'Old jobs cleaned up' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to clean up jobs');
  }
});

router.get('/monte-carlo/execution-profile', authMiddleware({ required: false }), (_req, res) => {
  sendSuccess(res, {
    executionModel: {
      builtinScenarios: {
        method: 'in-process-batched',
        description:
          'Built-in scenario simulations run in-process using an async batching loop. The event loop is yielded between each batch (setTimeout 0) to avoid blocking the server. Sensitivity OAT sweeps run synchronously after the main simulation.',
        recommendedIterationLimit: 50_000,
        hardLimit: 100_000,
        parallelism: 'single-threaded (main process); safe for concurrent HTTP requests',
        snapshotSupport: true,
        note: 'For best throughput at high iteration counts, use POST /simulate/custom with a serializable DSL scenario, which runs in parallel worker threads.',
      },
      customDslScenarios: {
        method: 'parallel-worker-threads',
        description:
          'Custom DSL scenario simulations distribute work across up to 4 Node.js Worker threads. Each worker receives an equal chunk of iterations and evaluates the DSL expression tree. Workers emit progress messages at 10% intervals.',
        recommendedIterationLimit: 100_000,
        hardLimit: 100_000,
        parallelism:
          'up to 4 worker threads (scales with CPU, capped at min(4, ceil(iterations/2000)))',
        snapshotSupport: false,
        note: 'To maximize parallelism, encode your scenario as a SerializableScenario DSL document and submit to POST /simulate/custom.',
      },
    },
    timeouts: {
      defaultTimeoutMs: 120_000,
      maxConfigurableTimeoutMs: 120_000,
    },
    jobStore: {
      type: 'in-memory',
      ttl: '2 hours (auto-evicted every 15 minutes)',
      persistence: 'none — jobs are lost on server restart and not shared across replicas',
      scalingNote: 'Replace with Redis or DB-backed job store before horizontal scaling.',
    },
    sensitivityAnalysis: {
      method: 'one-at-a-time (OAT) perturbation + correlation',
      samplesPerVariable:
        'default 200, configurable via sensitivitySamples config param (clamped 50–1000)',
      description:
        'For each input, runs samplesPerVariable independent evaluations sampling only that input while holding all others at their expected value. P10/P90 of the resulting output distribution provides tornado low/high bars. Pearson correlation from the main simulation run provides impact percentages.',
    },
  });
});

router.get('/monte-carlo/schema', authMiddleware({ required: false }), (_req, res) => {
  sendSuccess(res, {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://szlholdings.com/schemas/monte-carlo/serializable-scenario.json',
    title: 'SerializableScenario',
    description:
      'Monte Carlo DSL scenario definition — submittable to POST /monte-carlo/simulate/custom',
    type: 'object',
    required: ['id', 'title', 'domain', 'inputs', 'outputs', 'outputExprs'],
    additionalProperties: false,
    properties: {
      id: { type: 'string', minLength: 1, description: 'Unique scenario identifier' },
      version: { type: 'string', description: 'Scenario version string (semver recommended)' },
      title: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      domain: {
        type: 'string',
        minLength: 1,
        description: 'One of: vessels, terra, szl, prism, aegis, nexus, lyte',
      },
      tags: { type: 'array', items: { type: 'string' } },
      inputs: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['id', 'distribution'],
          properties: {
            id: { type: 'string', minLength: 1 },
            label: { type: 'string' },
            description: { type: 'string' },
            unit: { type: 'string' },
            format: { type: 'string' },
            distribution: {
              type: 'object',
              required: ['type'],
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'normal',
                    'log_normal',
                    'uniform',
                    'triangular',
                    'beta',
                    'poisson',
                    'constant',
                    'custom',
                  ],
                },
                mean: { type: 'number' },
                stdDev: { type: 'number' },
                min: { type: 'number' },
                max: { type: 'number' },
                mode: { type: 'number' },
                alpha: { type: 'number' },
                beta: { type: 'number' },
                lambda: { type: 'number' },
                value: { type: 'number' },
                values: { type: 'array', items: { type: 'number' }, minItems: 1 },
              },
            },
          },
        },
      },
      outputs: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['id', 'label'],
          properties: {
            id: { type: 'string', minLength: 1 },
            label: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            unit: { type: 'string' },
            format: { type: 'string', enum: ['currency', 'percentage', 'number', 'years'] },
            higherIsBetter: { type: 'boolean' },
          },
        },
      },
      outputExprs: {
        type: 'array',
        minItems: 1,
        description: 'Each entry maps an output id to its DSL expression tree',
        items: {
          type: 'object',
          required: ['id', 'expr'],
          properties: {
            id: { type: 'string', minLength: 1 },
            expr: { $ref: '#/definitions/Expr' },
          },
        },
      },
      intermediates: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'label', 'expr'],
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            expr: { $ref: '#/definitions/Expr' },
          },
        },
      },
      constraints: {
        type: 'array',
        description:
          'Optional constraints evaluated after outputs are computed. Iterations violating any constraint are counted as violations and excluded from valid results.',
        items: {
          type: 'object',
          required: ['id', 'description', 'expr'],
          properties: {
            id: { type: 'string', minLength: 1, description: 'Unique constraint identifier' },
            description: { type: 'string', description: 'Human-readable constraint description' },
            expr: {
              $ref: '#/definitions/BoolExpr',
              description:
                'Boolean expression tree evaluated against input, intermediate, and output variables',
            },
          },
        },
      },
    },
    definitions: {
      Expr: {
        description: 'DSL expression node (max depth 32)',
        oneOf: [
          {
            type: 'object',
            required: ['type', 'value'],
            title: 'NumberExpr',
            properties: { type: { const: 'number' }, value: { type: 'number' } },
          },
          {
            type: 'object',
            required: ['type', 'id'],
            title: 'VariableExpr',
            properties: { type: { const: 'variable' }, id: { type: 'string', minLength: 1 } },
          },
          {
            type: 'object',
            required: ['type', 'op', 'left', 'right'],
            title: 'BinaryExpr',
            properties: {
              type: { const: 'binary' },
              op: { type: 'string', enum: ['+', '-', '*', '/', '**', '%', 'min', 'max'] },
              left: { $ref: '#/definitions/Expr' },
              right: { $ref: '#/definitions/Expr' },
            },
          },
          {
            type: 'object',
            required: ['type', 'op', 'operand'],
            title: 'UnaryExpr',
            properties: {
              type: { const: 'unary' },
              op: {
                type: 'string',
                enum: ['-', 'abs', 'sqrt', 'log', 'log10', 'exp', 'floor', 'ceil', 'round'],
              },
              operand: { $ref: '#/definitions/Expr' },
            },
          },
          {
            type: 'object',
            required: ['type', 'fn', 'args'],
            title: 'CallExpr',
            properties: {
              type: { const: 'call' },
              fn: { type: 'string', enum: ['max', 'min', 'pow', 'clamp'] },
              args: { type: 'array', items: { $ref: '#/definitions/Expr' } },
            },
          },
          {
            type: 'object',
            required: ['type', 'condition', 'then', 'else'],
            title: 'ConditionalExpr',
            properties: {
              type: { const: 'conditional' },
              condition: { $ref: '#/definitions/BoolExpr' },
              then: { $ref: '#/definitions/Expr' },
              else: { $ref: '#/definitions/Expr' },
            },
          },
        ],
      },
      BoolExpr: {
        oneOf: [
          {
            type: 'object',
            required: ['type', 'op', 'left', 'right'],
            title: 'CompareExpr',
            properties: {
              type: { const: 'compare' },
              op: { type: 'string', enum: ['<', '<=', '>', '>=', '==', '!='] },
              left: { $ref: '#/definitions/Expr' },
              right: { $ref: '#/definitions/Expr' },
            },
          },
          {
            type: 'object',
            required: ['type', 'op', 'operands'],
            title: 'LogicalExpr',
            properties: {
              type: { const: 'logical' },
              op: { type: 'string', enum: ['and', 'or', 'not'] },
              operands: { type: 'array', items: { $ref: '#/definitions/BoolExpr' }, minItems: 1 },
            },
          },
        ],
      },
    },
  });
});

router.get('/monte-carlo/ws-info', authMiddleware({ required: false }), (_req, res) => {
  sendSuccess(res, {
    wsChannel: WS_CHANNELS.MONTE_CARLO_PROGRESS,
    events: [
      {
        event: 'progress',
        description:
          'Emitted every iteration batch — contains jobId, iteration, totalIterations, percentComplete, elapsedMs, estimatedRemainingMs',
      },
      {
        event: 'interim-snapshot',
        description:
          'Emitted every snapshotInterval valid iterations (built-in scenarios via POST /simulate; pass snapshotInterval in request body, e.g. 500). Contains jobId, validIterations, totalIterations, percentComplete, and snapshots[] with per-output mean/p25/p50/p75/min/max. Enables live distribution formation UX.',
      },
      {
        event: 'complete',
        description: 'Emitted when simulation finishes — contains jobId, status, result summary',
      },
      {
        event: 'error',
        description: 'Emitted on simulation failure — contains jobId and error message',
      },
    ],
    auth: {
      required: true,
      roles: ['founder_admin', 'platform_admin', 'operator', 'analyst', 'ops_manager'],
      tokenFormats: [
        {
          type: 'ws-ticket',
          description:
            'Recommended for tenant-scoped subscriptions. Obtain a short-lived ticket via POST /auth/ws-ticket (requires session auth). The ticket embeds your userId, platformRole, and tenantId. Clients subscribing with a ticket receive ONLY events scoped to their tenantId.',
          howToSubscribe:
            "Connect to /ws, then send: { type: 'subscribe', channel: 'monte-carlo:progress', token: '<ws-ticket>' }",
        },
        {
          type: 'session-token',
          description:
            'Session token from the Authorization header or session cookie. Resolves without tenantId context. Clients using session tokens will NOT receive tenant-scoped job progress events (i.e., events published with a creatorTenantId). Use the ws-ticket flow to receive tenant-scoped Monte Carlo events.',
          howToSubscribe:
            "Connect to /ws, then send: { type: 'subscribe', channel: 'monte-carlo:progress', token: '<session-token>' }",
        },
      ],
    },
    tenantScoping: {
      description:
        "Monte Carlo job progress events are scoped to the tenant of the job creator. Only clients whose WS session tenantId matches the job's creatorTenantId will receive those events. Platform/founder admins with no tenantId context receive all events for cross-tenant monitoring.",
      recommendation:
        'Always use a WS ticket (which carries tenantId) for tenant-aware applications. Session-token subscribers with tenantId=null are excluded from tenant-scoped events.',
    },
    parallelExecution:
      'Custom DSL scenarios (POST /simulate/custom) use parallel worker threads; built-in scenarios execute in-process.',
  });
});

export default router;
