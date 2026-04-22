import { serverTelemetry } from '@szl-holdings/observability';
import { randomUUID } from 'node:crypto';
import type { WsPublishFn } from './job-queue.js';
import { logger } from './logger.js';

/**
 * Job status lifecycle:
 *   pending    → ready to be claimed (new jobs, retried jobs after backoff)
 *   waiting    → blocked on dependency job(s) completing
 *   running    → claimed by a worker, handler executing
 *   completed  → handler finished successfully (terminal)
 *   cancelled  → cancelled before execution (terminal)
 *   dead_letter → exhausted all retries; payload preserved for replay (terminal)
 *
 * The "failed" status is reserved in the enum for intermediate use during
 * retry-eligibility checks only. Production jobs move from running → pending
 * (with backoff) until maxRetries is exhausted, then → dead_letter. Use
 * dead_letter for terminal failure visibility and DLQ dashboard queries.
 */
export type JobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'dead_letter'
  | 'cancelled'
  | 'waiting';
export type JobPriority = 'critical' | 'high' | 'normal' | 'low';

const PRIORITY_VALUES: Record<JobPriority, number> = {
  critical: 10,
  high: 30,
  normal: 50,
  low: 80,
};

export interface DurableJobOptions {
  queue?: string;
  priority?: JobPriority;
  maxRetries?: number;
  retryDelayMs?: number;
  scheduledAt?: Date;
  parentJobId?: string;
  dependsOn?: string[];
  metadata?: Record<string, unknown>;
}

export interface DurableJob<T = unknown> {
  id: string;
  type: string;
  queue: string;
  priority: number;
  payload: T;
  status: JobStatus;
  retryCount: number;
  maxRetries: number;
  retryDelayMs: number;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  parentJobId?: string;
  dependsOn: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

type JobHandler<T = unknown> = (job: DurableJob<T>, ctx: JobExecutionContext) => Promise<void>;

export interface JobExecutionContext {
  spawnChild: <T>(type: string, payload: T, opts?: DurableJobOptions) => Promise<DurableJob<T>>;
  log: (msg: string, data?: Record<string, unknown>) => void;
  heartbeat: () => Promise<void>;
}

export interface QueueConfig {
  concurrency: number;
  pollIntervalMs?: number;
}

export type AnyPool = {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
};

const DEFAULT_QUEUE_CONFIGS: Record<string, QueueConfig> = {
  critical: { concurrency: 10, pollIntervalMs: 500 },
  high: { concurrency: 8, pollIntervalMs: 1000 },
  default: { concurrency: 5, pollIntervalMs: 2000 },
  low: { concurrency: 2, pollIntervalMs: 5000 },
  agents: { concurrency: 3, pollIntervalMs: 2000 },
};

export class DurableJobQueue {
  private handlers = new Map<string, JobHandler>();
  private pool: AnyPool | null = null;
  private workerId: string;
  private isRunning = false;
  private isShuttingDown = false;
  private activeJobs = new Map<string, Promise<void>>();
  private pollTimers: ReturnType<typeof setInterval>[] = [];
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private publishFn?: WsPublishFn;
  private queueConfigs: Map<string, QueueConfig>;
  private queueConcurrency = new Map<string, number>();

  constructor() {
    this.workerId = `worker-${randomUUID().slice(0, 8)}`;
    this.queueConfigs = new Map(Object.entries(DEFAULT_QUEUE_CONFIGS));
  }

  private async getPool(): Promise<AnyPool> {
    if (!this.pool) {
      const dbModule = await import('@szl-holdings/db');
      this.pool = dbModule.pool as unknown as AnyPool;
    }
    return this.pool;
  }

  setPublishFn(fn: WsPublishFn): void {
    this.publishFn = fn;
  }

  configureQueue(name: string, config: QueueConfig): void {
    this.queueConfigs.set(name, config);
  }

  register<T>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
    logger.debug({ type }, 'DurableJobQueue: handler registered');
  }

  async enqueue<T>(
    type: string,
    payload: T,
    options: DurableJobOptions = {},
  ): Promise<DurableJob<T>> {
    const pool = await this.getPool();

    const jobId = `${type}-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const queue = options.queue ?? 'default';
    const priorityStr = options.priority ?? 'normal';
    const priorityValue = PRIORITY_VALUES[priorityStr] ?? 50;
    const maxRetries = options.maxRetries ?? 3;
    const retryDelayMs = options.retryDelayMs ?? 1000;
    const scheduledAt = options.scheduledAt ?? new Date();
    const dependsOn = options.dependsOn ?? [];
    const status: JobStatus = dependsOn.length > 0 ? 'waiting' : 'pending';

    const result = await pool.query(
      `INSERT INTO durable_jobs
         (job_id, type, queue, priority, payload, status, max_retries, retry_delay_ms,
          scheduled_at, parent_job_id, depends_on, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [
        jobId,
        type,
        queue,
        priorityValue,
        JSON.stringify(payload),
        status,
        maxRetries,
        retryDelayMs,
        scheduledAt,
        options.parentJobId ?? null,
        JSON.stringify(dependsOn),
        JSON.stringify(options.metadata ?? {}),
      ],
    );

    const job = this.rawRowToJob<T>(result.rows[0]!);

    logger.debug({ jobId, type, queue, priority: priorityStr }, 'DurableJobQueue: job enqueued');

    this.publishFn?.('job-queue', 'enqueued', { id: jobId, type, queue, status });

    if (this.isRunning) {
      setImmediate(() => this.pollQueue(queue));
    }

    return job;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    await this.recoverStaleJobs();
    await this.resolveWaitingJobs();

    for (const [queueName, config] of this.queueConfigs) {
      const intervalMs = config.pollIntervalMs ?? 2000;
      const timer = setInterval(() => {
        if (!this.isShuttingDown) {
          this.pollQueue(queueName).catch((err) => {
            logger.warn({ err, queue: queueName }, 'DurableJobQueue: poll error');
          });
        }
      }, intervalMs);
      this.pollTimers.push(timer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.updateHeartbeats().catch((err) => {
        logger.warn({ err }, 'DurableJobQueue: heartbeat update failed');
      });
    }, 15_000);

    logger.info(
      { workerId: this.workerId, queues: [...this.queueConfigs.keys()] },
      'DurableJobQueue: started',
    );
  }

  private async recoverStaleJobs(): Promise<void> {
    try {
      const pool = await this.getPool();

      const result = await pool.query(
        `UPDATE durable_jobs
         SET status = 'pending', worker_id = NULL, started_at = NULL, updated_at = NOW()
         WHERE status = 'running'`,
      );

      const recovered = result.rowCount ?? 0;
      if (recovered > 0) {
        logger.info({ recovered }, 'DurableJobQueue: recovered orphaned running jobs on startup');
      }
    } catch (err) {
      logger.warn({ err }, 'DurableJobQueue: stale job recovery failed (non-fatal)');
    }
  }

  private async resolveWaitingJobs(): Promise<void> {
    try {
      const pool = await this.getPool();

      await pool.query(
        `UPDATE durable_jobs SET status = 'pending', updated_at = NOW()
         WHERE status = 'waiting'
           AND NOT EXISTS (
             SELECT 1 FROM jsonb_array_elements_text(depends_on) dep_id
             JOIN durable_jobs dep ON dep.job_id = dep_id
             WHERE dep.status NOT IN ('completed')
           )`,
      );

      await pool.query(
        `UPDATE durable_jobs
         SET status = 'cancelled',
             error = 'dependency failed or dead-lettered',
             updated_at = NOW()
         WHERE status = 'waiting'
           AND EXISTS (
             SELECT 1 FROM jsonb_array_elements_text(depends_on) dep_id
             JOIN durable_jobs dep ON dep.job_id = dep_id
             WHERE dep.status IN ('dead_letter', 'failed', 'cancelled')
           )`,
      );
    } catch (err) {
      logger.warn({ err }, 'DurableJobQueue: waiting job resolution failed (non-fatal)');
    }
  }

  private async pollQueue(queueName: string): Promise<void> {
    if (this.isShuttingDown) return;

    const config = this.queueConfigs.get(queueName) ?? DEFAULT_QUEUE_CONFIGS.default!;
    const currentConcurrency = this.queueConcurrency.get(queueName) ?? 0;

    if (currentConcurrency >= config.concurrency) return;

    const slots = config.concurrency - currentConcurrency;

    try {
      const pool = await this.getPool();

      const result = await pool.query(
        `WITH claimed AS (
           SELECT job_id FROM durable_jobs
           WHERE queue = $1
             AND status = 'pending'
             AND scheduled_at <= NOW()
           ORDER BY priority ASC, scheduled_at ASC
           LIMIT $2
           FOR UPDATE SKIP LOCKED
         )
         UPDATE durable_jobs
           SET status = 'running',
               started_at = NOW(),
               worker_id = $3,
               last_heartbeat_at = NOW(),
               updated_at = NOW()
         FROM claimed
         WHERE durable_jobs.job_id = claimed.job_id
         RETURNING durable_jobs.*`,
        [queueName, slots, this.workerId],
      );

      for (const row of result.rows) {
        const job = this.rawRowToJob(row);
        const runId = await this.createJobRun(pool, job);

        this.queueConcurrency.set(queueName, (this.queueConcurrency.get(queueName) ?? 0) + 1);

        const execution = this.executeJob(job, runId, pool).finally(() => {
          this.queueConcurrency.set(
            queueName,
            Math.max(0, (this.queueConcurrency.get(queueName) ?? 1) - 1),
          );
          this.activeJobs.delete(job.id);
          if (!this.isShuttingDown) {
            setImmediate(() => this.pollQueue(queueName));
          }
        });

        this.activeJobs.set(job.id, execution);
      }
    } catch (err) {
      logger.warn({ err, queue: queueName }, 'DurableJobQueue: poll failed');
    }
  }

  private async createJobRun(pool: AnyPool, job: DurableJob): Promise<number> {
    const result = await pool.query(
      `INSERT INTO job_runs (job_id, attempt_number, worker_id, started_at, status)
       VALUES ($1, $2, $3, NOW(), 'running')
       RETURNING id`,
      [job.id, job.retryCount + 1, this.workerId],
    );
    return result.rows[0]?.id as number;
  }

  private async executeJob(job: DurableJob, runId: number, pool: AnyPool): Promise<void> {
    const handler = this.handlers.get(job.type);
    const start = Date.now();

    if (!handler) {
      await this.handleFailure(
        job,
        runId,
        pool,
        new Error(`No handler registered for job type: ${job.type}`),
        start,
      );
      return;
    }

    const ctx: JobExecutionContext = {
      spawnChild: async <T>(type: string, payload: T, opts?: DurableJobOptions) => {
        return this.enqueue(type, payload, { ...opts, parentJobId: job.id });
      },
      log: (msg: string, data?: Record<string, unknown>) => {
        logger.info({ jobId: job.id, jobType: job.type, ...data }, `[job] ${msg}`);
      },
      heartbeat: async () => {
        await pool.query(`UPDATE durable_jobs SET last_heartbeat_at = NOW() WHERE job_id = $1`, [
          job.id,
        ]);
      },
    };

    try {
      await handler(job, ctx);

      const durationMs = Date.now() - start;

      await pool.query(
        `UPDATE durable_jobs SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE job_id = $1`,
        [job.id],
      );

      await pool.query(
        `UPDATE job_runs SET status = 'completed', completed_at = NOW(), duration_ms = $1 WHERE id = $2`,
        [durationMs, runId],
      );

      logger.debug({ jobId: job.id, type: job.type, durationMs }, 'DurableJobQueue: job completed');

      serverTelemetry.recordBusinessEvent({
        type: 'job_completed',
        domain: job.type,
        durationMs,
        success: true,
        metadata: { jobId: job.id, queue: job.queue },
      });

      this.publishFn?.('job-queue', 'completed', { id: job.id, type: job.type, durationMs });

      await this.resolveWaitingJobs();
    } catch (err) {
      await this.handleFailure(job, runId, pool, err, start);
    }
  }

  private async handleFailure(
    job: DurableJob,
    runId: number,
    pool: AnyPool,
    err: unknown,
    startMs: number,
  ): Promise<void> {
    const durationMs = Date.now() - startMs;
    const errorMsg = err instanceof Error ? err.message : String(err);
    const newRetryCount = job.retryCount + 1;

    await pool.query(
      `UPDATE job_runs SET status = 'failed', completed_at = NOW(), duration_ms = $1, error = $2 WHERE id = $3`,
      [durationMs, errorMsg, runId],
    );

    if (newRetryCount <= job.maxRetries) {
      const backoffMs = Math.min(job.retryDelayMs * 2 ** (newRetryCount - 1), 300_000);
      const retryAt = new Date(Date.now() + backoffMs);

      await pool.query(
        `UPDATE durable_jobs
         SET status = 'pending', retry_count = $1, scheduled_at = $2, error = $3,
             started_at = NULL, worker_id = NULL, updated_at = NOW()
         WHERE job_id = $4`,
        [newRetryCount, retryAt, errorMsg, job.id],
      );

      logger.warn(
        { jobId: job.id, type: job.type, attempt: newRetryCount, backoffMs, err },
        'DurableJobQueue: job failed, retrying',
      );

      serverTelemetry.recordBusinessEvent({
        type: 'job_retry',
        domain: job.type,
        success: false,
        metadata: { jobId: job.id, attempt: newRetryCount, error: errorMsg },
      });
    } else {
      await pool.query(
        `UPDATE durable_jobs SET status = 'dead_letter', completed_at = NOW(), error = $1, updated_at = NOW() WHERE job_id = $2`,
        [errorMsg, job.id],
      );

      await pool.query(
        `INSERT INTO dead_letter_queue
           (original_job_id, type, queue, payload, error, retry_count, max_retries, failed_at, first_failed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          job.id,
          job.type,
          job.queue,
          JSON.stringify(job.payload),
          errorMsg,
          newRetryCount - 1,
          job.maxRetries,
        ],
      );

      logger.error(
        { jobId: job.id, type: job.type, err },
        'DurableJobQueue: job dead-lettered after max retries',
      );

      serverTelemetry.recordBusinessEvent({
        type: 'job_failed',
        domain: job.type,
        success: false,
        metadata: {
          jobId: job.id,
          error: errorMsg,
          retries: newRetryCount - 1,
          deadLettered: true,
        },
      });

      this.publishFn?.('job-queue', 'dead_letter', { id: job.id, type: job.type, error: errorMsg });

      await this.resolveWaitingJobs();
    }
  }

  private async updateHeartbeats(): Promise<void> {
    if (this.activeJobs.size === 0) return;
    const pool = await this.getPool();
    const activeIds = [...this.activeJobs.keys()];
    if (activeIds.length === 0) return;

    await pool.query(
      `UPDATE durable_jobs SET last_heartbeat_at = NOW()
       WHERE job_id = ANY($1::text[]) AND status = 'running'`,
      [activeIds],
    );
  }

  async getStats(): Promise<{
    pending: number;
    running: number;
    completed: number;
    failed: number;
    deadLetter: number;
    waiting: number;
    byQueue: Record<string, { pending: number; running: number }>;
    byType: Record<
      string,
      { total: number; completed: number; failed: number; avgDurationMs: number }
    >;
    throughputPerMinute: number;
    failureRate: number;
  }> {
    const pool = await this.getPool();

    const [statusResult, queueResult, typeResult, throughputResult] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) as count FROM durable_jobs GROUP BY status`),
      pool.query(
        `SELECT queue, status, COUNT(*) as count FROM durable_jobs
         WHERE status IN ('pending', 'running') GROUP BY queue, status`,
      ),
      pool.query(
        `SELECT type,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status IN ('failed', 'dead_letter') THEN 1 ELSE 0 END) as failed,
                AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) as avg_duration_ms
         FROM durable_jobs
         WHERE created_at > NOW() - INTERVAL '24 hours'
         GROUP BY type
         ORDER BY total DESC LIMIT 50`,
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM durable_jobs
         WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '1 minute'`,
      ),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of statusResult.rows) {
      statusMap[row.status as string] = parseInt(row.count as string, 10);
    }

    const byQueue: Record<string, { pending: number; running: number }> = {};
    for (const row of queueResult.rows) {
      const q = row.queue as string;
      if (!byQueue[q]) byQueue[q] = { pending: 0, running: 0 };
      const st = row.status as 'pending' | 'running';
      byQueue[q]![st] = parseInt(row.count as string, 10);
    }

    const byType: Record<
      string,
      { total: number; completed: number; failed: number; avgDurationMs: number }
    > = {};
    for (const row of typeResult.rows) {
      byType[row.type as string] = {
        total: parseInt(row.total as string, 10),
        completed: parseInt(row.completed as string, 10),
        failed: parseInt(row.failed as string, 10),
        avgDurationMs: parseFloat((row.avg_duration_ms as string | null) ?? '0'),
      };
    }

    const total24h = Object.values(byType).reduce((s, t) => s + t.total, 0);
    const failed24h = Object.values(byType).reduce((s, t) => s + t.failed, 0);
    const failureRate = total24h > 0 ? (failed24h / total24h) * 100 : 0;

    return {
      pending: statusMap.pending ?? 0,
      running: statusMap.running ?? 0,
      completed: statusMap.completed ?? 0,
      failed: statusMap.failed ?? 0,
      deadLetter: statusMap.dead_letter ?? 0,
      waiting: statusMap.waiting ?? 0,
      byQueue,
      byType,
      throughputPerMinute: parseInt(
        (throughputResult.rows[0]?.count as string | undefined) ?? '0',
        10,
      ),
      failureRate,
    };
  }

  async getRecentJobs(
    limit = 20,
    filter?: { status?: JobStatus; type?: string; queue?: string },
  ): Promise<DurableJob[]> {
    const pool = await this.getPool();

    let query = `SELECT * FROM durable_jobs WHERE 1=1`;
    const params: unknown[] = [];
    let pIdx = 1;

    if (filter?.status) {
      query += ` AND status = $${pIdx++}`;
      params.push(filter.status);
    }
    if (filter?.type) {
      query += ` AND type = $${pIdx++}`;
      params.push(filter.type);
    }
    if (filter?.queue) {
      query += ` AND queue = $${pIdx++}`;
      params.push(filter.queue);
    }

    query += ` ORDER BY created_at DESC LIMIT $${pIdx}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows.map((r) => this.rawRowToJob(r));
  }

  async getDeadLetterQueue(limit = 50): Promise<unknown[]> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM dead_letter_queue ORDER BY failed_at DESC LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  async replayDeadLetterJob(originalJobId: string): Promise<DurableJob> {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT * FROM dead_letter_queue WHERE original_job_id = $1 LIMIT 1`,
      [originalJobId],
    );
    if (result.rows.length === 0) {
      throw new Error(`Dead letter job not found: ${originalJobId}`);
    }
    const dlq = result.rows[0]!;

    const newJob = await this.enqueue(dlq.type as string, dlq.payload, {
      queue: dlq.queue as string,
      maxRetries: dlq.max_retries as number,
      metadata: { replayedFrom: originalJobId },
    });

    await pool.query(
      `UPDATE dead_letter_queue SET resolved_at = NOW(), resolution = $1 WHERE original_job_id = $2`,
      [`replayed as ${newJob.id}`, originalJobId],
    );

    return newJob;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const pool = await this.getPool();
    const result = await pool.query(
      `UPDATE durable_jobs SET status = 'cancelled', updated_at = NOW()
       WHERE job_id = $1 AND status IN ('pending', 'waiting')`,
      [jobId],
    );
    const cancelled = (result.rowCount ?? 0) > 0;
    if (cancelled) {
      await this.resolveWaitingJobs();
    }
    return cancelled;
  }

  async getJob(jobId: string): Promise<DurableJob | null> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM durable_jobs WHERE job_id = $1`, [jobId]);
    if (result.rows.length === 0) return null;
    return this.rawRowToJob(result.rows[0]!);
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    for (const timer of this.pollTimers) clearInterval(timer);
    this.pollTimers.length = 0;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    const maxWaitMs = 30_000;
    const start = Date.now();

    while (this.activeJobs.size > 0 && Date.now() - start < maxWaitMs) {
      logger.info({ remaining: this.activeJobs.size }, 'DurableJobQueue: draining active jobs...');
      await Promise.race([
        Promise.allSettled(this.activeJobs.values()),
        new Promise<void>((r) => setTimeout(r, 1000)),
      ]);
    }

    if (this.activeJobs.size > 0) {
      logger.warn(
        { remaining: this.activeJobs.size },
        'DurableJobQueue: shutdown with remaining jobs — they will be recovered on next startup',
      );
    }

    logger.info('DurableJobQueue: shutdown complete');
  }

  private rawRowToJob<T = unknown>(row: Record<string, unknown>): DurableJob<T> {
    const id = (row.job_id ?? row.jobId) as string;
    const payloadRaw = row.payload;
    const payload =
      typeof payloadRaw === 'string' ? (JSON.parse(payloadRaw) as T) : (payloadRaw as T);
    const dependsOnRaw = row.depends_on ?? row.dependsOn;
    const dependsOn = Array.isArray(dependsOnRaw)
      ? (dependsOnRaw as string[])
      : typeof dependsOnRaw === 'string'
        ? (JSON.parse(dependsOnRaw) as string[])
        : [];
    const metaRaw = row.metadata;
    const metadata =
      typeof metaRaw === 'string'
        ? (JSON.parse(metaRaw) as Record<string, unknown>)
        : ((metaRaw as Record<string, unknown> | null) ?? {});

    return {
      id,
      type: row.type as string,
      queue: (row.queue as string | null) ?? 'default',
      priority: (row.priority as number | null) ?? 50,
      payload,
      status: row.status as JobStatus,
      retryCount:
        (row.retry_count as number | null) ?? (row.retryCount as number | null) ?? 0,
      maxRetries:
        (row.max_retries as number | null) ?? (row.maxRetries as number | null) ?? 3,
      retryDelayMs:
        (row.retry_delay_ms as number | null) ?? (row.retryDelayMs as number | null) ?? 1000,
      scheduledAt: new Date((row.scheduled_at ?? row.scheduledAt) as string),
      startedAt: row.started_at ? new Date(row.started_at as string) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
      error: (row.error as string | null) ?? undefined,
      parentJobId:
        (row.parent_job_id as string | null) ??
        (row.parentJobId as string | null) ??
        undefined,
      dependsOn,
      metadata,
      createdAt: new Date((row.created_at ?? row.createdAt) as string),
    };
  }
}

export const durableJobQueue = new DurableJobQueue();

export interface JobChainStep {
  type: string;
  payload?: Record<string, unknown>;
  condition?: (prevResult: Record<string, unknown> | undefined) => boolean;
  opts?: DurableJobOptions;
}

export class JobChain {
  private steps: JobChainStep[] = [];

  constructor(private readonly queue: DurableJobQueue) {}

  step(type: string, payload?: Record<string, unknown>, opts?: DurableJobOptions): this {
    this.steps.push({ type, payload, opts });
    return this;
  }

  branch(
    type: string,
    condition: (prevResult: Record<string, unknown> | undefined) => boolean,
    payload?: Record<string, unknown>,
    opts?: DurableJobOptions,
  ): this {
    this.steps.push({ type, payload, condition, opts });
    return this;
  }

  async execute(): Promise<DurableJob[]> {
    const jobs: DurableJob[] = [];
    let prevResult: Record<string, unknown> | undefined;

    for (const step of this.steps) {
      if (step.condition && !step.condition(prevResult)) {
        continue;
      }
      const prev = jobs.at(-1);
      const job = await this.queue.enqueue(step.type, step.payload ?? {}, {
        ...step.opts,
        dependsOn: prev ? [prev.id, ...(step.opts?.dependsOn ?? [])] : step.opts?.dependsOn,
      });
      jobs.push(job);
      prevResult = { jobId: job.id, type: job.type };
    }

    return jobs;
  }
}
