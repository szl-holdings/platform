import { type DurableJobOptions, durableJobQueue } from './durable-job-queue.js';
import { logger } from './logger.js';

export interface ScheduleDefinition {
  name: string;
  jobType: string;
  cronExpression: string;
  payload?: Record<string, unknown>;
  queue?: string;
  priority?: DurableJobOptions['priority'];
  maxRetries?: number;
  enabled?: boolean;
}

type AnyPool = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

function parseCronField(field: string, min: number, max: number): Set<number> {
  const result = new Set<number>();
  for (const part of field.split(',')) {
    const trimmed = part.trim();
    if (trimmed === '*') {
      for (let i = min; i <= max; i++) result.add(i);
    } else if (trimmed.startsWith('*/')) {
      const step = parseInt(trimmed.slice(2), 10);
      if (!isNaN(step) && step > 0) {
        for (let i = min; i <= max; i += step) result.add(i);
      }
    } else if (trimmed.includes('/')) {
      const [rangePart, stepPart] = trimmed.split('/');
      const step = parseInt(stepPart ?? '1', 10);
      if (rangePart === '*') {
        for (let i = min; i <= max; i += step) result.add(i);
      } else if (rangePart?.includes('-')) {
        const [startStr, endStr] = rangePart.split('-');
        const rangeStart = parseInt(startStr ?? String(min), 10);
        const rangeEnd = parseInt(endStr ?? String(max), 10);
        for (let i = rangeStart; i <= rangeEnd && i <= max; i += step) result.add(i);
      }
    } else if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const rangeStart = parseInt(startStr ?? String(min), 10);
      const rangeEnd = parseInt(endStr ?? String(max), 10);
      for (let i = rangeStart; i <= rangeEnd && i <= max; i++) result.add(i);
    } else {
      const val = parseInt(trimmed, 10);
      if (!isNaN(val)) result.add(val);
    }
  }
  return result;
}

interface CronFields {
  minutes: Set<number>;
  hours: Set<number>;
  daysOfMonth: Set<number>;
  months: Set<number>;
  daysOfWeek: Set<number>;
}

function parseCronExpression(expr: string): CronFields {
  const parts = expr.trim().split(/\s+/);
  return {
    minutes: parseCronField(parts[0] ?? '*', 0, 59),
    hours: parseCronField(parts[1] ?? '*', 0, 23),
    daysOfMonth: parseCronField(parts[2] ?? '*', 1, 31),
    months: parseCronField(parts[3] ?? '*', 1, 12),
    daysOfWeek: parseCronField(parts[4] ?? '*', 0, 6),
  };
}

function matchesCron(fields: CronFields, d: Date): boolean {
  return (
    fields.minutes.has(d.getUTCMinutes()) &&
    fields.hours.has(d.getUTCHours()) &&
    fields.daysOfMonth.has(d.getUTCDate()) &&
    fields.months.has(d.getUTCMonth() + 1) &&
    fields.daysOfWeek.has(d.getUTCDay())
  );
}

export function getNextRunTime(cronExpr: string, from: Date = new Date()): Date {
  const fields = parseCronExpression(cronExpr);
  const next = new Date(from);
  next.setUTCSeconds(0, 0);
  next.setUTCMinutes(next.getUTCMinutes() + 1);

  const maxIterations = 60 * 24 * 366;
  for (let i = 0; i < maxIterations; i++) {
    if (matchesCron(fields, next)) return new Date(next);
    next.setUTCMinutes(next.getUTCMinutes() + 1);
  }
  return next;
}

function getAllMissedRunTimes(cronExpr: string, lastRunAt: Date, now: Date): Date[] {
  const fields = parseCronExpression(cronExpr);
  const missed: Date[] = [];

  const cursor = new Date(lastRunAt);
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  const maxMissed = 10;
  while (cursor < now && missed.length < maxMissed) {
    if (matchesCron(fields, cursor)) {
      missed.push(new Date(cursor));
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }
  return missed;
}

export class DurableScheduler {
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private readonly pollIntervalMs: number;

  constructor(pollIntervalMs = 30_000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  async upsertSchedule(def: ScheduleDefinition): Promise<void> {
    const pool = await this.getPool();
    const nextRunAt = getNextRunTime(def.cronExpression);

    await pool.query(
      `INSERT INTO job_schedules
         (name, job_type, queue, priority, cron_expression, payload, max_retries, enabled, next_run_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT (name) DO UPDATE
         SET job_type = EXCLUDED.job_type,
             queue = EXCLUDED.queue,
             priority = EXCLUDED.priority,
             cron_expression = EXCLUDED.cron_expression,
             payload = EXCLUDED.payload,
             max_retries = EXCLUDED.max_retries,
             enabled = EXCLUDED.enabled,
             next_run_at = CASE
               WHEN job_schedules.enabled = false AND EXCLUDED.enabled = true
               THEN EXCLUDED.next_run_at
               ELSE COALESCE(job_schedules.next_run_at, EXCLUDED.next_run_at)
             END,
             updated_at = NOW()`,
      [
        def.name,
        def.jobType,
        def.queue ?? 'default',
        def.priority === 'critical'
          ? 10
          : def.priority === 'high'
            ? 30
            : def.priority === 'low'
              ? 80
              : 50,
        def.cronExpression,
        JSON.stringify(def.payload ?? {}),
        def.maxRetries ?? 3,
        def.enabled !== false,
        nextRunAt,
      ],
    );
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const pool = await this.getPool();
      const recovered = await pool.query(
        `UPDATE job_schedules
         SET last_status = 'failed',
             next_run_at = NOW(),
             fail_count = fail_count + 1,
             updated_at = NOW()
         WHERE last_status = 'running' AND next_run_at = 'infinity'::timestamptz
         RETURNING name`,
      );
      if (recovered.rows.length > 0) {
        logger.warn(
          { count: recovered.rows.length },
          'DurableScheduler: recovered stale claimed schedules on startup',
        );
      }
    } catch (err) {
      logger.warn({ err }, 'DurableScheduler: stale schedule recovery failed (non-fatal)');
    }

    await this.fireDueSchedules();

    this.pollTimer = setInterval(() => {
      this.fireDueSchedules().catch((err) => {
        logger.warn({ err }, 'DurableScheduler: poll error');
      });
    }, this.pollIntervalMs);

    logger.info({ pollIntervalMs: this.pollIntervalMs }, 'DurableScheduler: started');
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.isRunning = false;
    logger.info('DurableScheduler: stopped');
  }

  private async fireDueSchedules(): Promise<void> {
    const pool = await this.getPool();

    const result = await pool.query(
      `WITH due AS (
         SELECT id FROM job_schedules
         WHERE enabled = true AND next_run_at <= NOW()
         FOR UPDATE SKIP LOCKED
       )
       UPDATE job_schedules
         SET last_status = 'running',
             run_count = run_count + 1,
             next_run_at = 'infinity'::timestamptz,
             updated_at = NOW()
       FROM due
       WHERE job_schedules.id = due.id
       RETURNING job_schedules.*`,
    );

    for (const row of result.rows) {
      try {
        await this.fireSchedule(pool, row);
      } catch (err) {
        logger.warn(
          { err, scheduleName: row['name'] },
          'DurableScheduler: failed to fire schedule',
        );
      }
    }
  }

  private async fireSchedule(pool: AnyPool, row: Record<string, unknown>): Promise<void> {
    const cronExpr = row['cron_expression'] as string;
    const lastRunAt = row['last_run_at']
      ? new Date(row['last_run_at'] as string)
      : new Date(Date.now() - 60_000);
    const now = new Date();

    const nextRunAt = getNextRunTime(cronExpr, now);

    const missedRuns = getAllMissedRunTimes(cronExpr, lastRunAt, now);
    const runsToFire = missedRuns.length > 0 ? missedRuns : [now];

    const payload =
      typeof row['payload'] === 'string' ? JSON.parse(row['payload']) : (row['payload'] ?? {});

    let lastError: unknown;
    let firedCount = 0;

    for (const runTime of runsToFire) {
      try {
        await durableJobQueue.enqueue(
          row['job_type'] as string,
          { ...payload, scheduledFor: runTime.toISOString(), catchUp: firedCount > 0 },
          {
            queue: row['queue'] as string,
            maxRetries: row['max_retries'] as number,
            metadata: {
              scheduleName: row['name'] as string,
              triggeredBy: 'scheduler',
              missedRun: firedCount > 0,
            },
          },
        );
        firedCount++;
      } catch (err) {
        lastError = err;
        logger.warn(
          { err, scheduleName: row['name'], runTime },
          'DurableScheduler: failed to enqueue job for run time',
        );
      }
    }

    if (firedCount > 0) {
      await pool.query(
        `UPDATE job_schedules SET last_status = 'completed', last_run_at = NOW(), next_run_at = $1, updated_at = NOW() WHERE id = $2`,
        [nextRunAt, row['id']],
      );
      if (firedCount > 1) {
        logger.info(
          { schedule: row['name'], missedCount: firedCount - 1, nextRunAt },
          'DurableScheduler: fired schedule with catch-up runs',
        );
      } else {
        logger.info(
          { schedule: row['name'], jobType: row['job_type'], nextRunAt },
          'DurableScheduler: schedule fired',
        );
      }
    } else {
      const failedNextRunAt = getNextRunTime(row['cron_expression'] as string, new Date());
      await pool.query(
        `UPDATE job_schedules SET last_status = 'failed', fail_count = fail_count + 1, next_run_at = $1, updated_at = NOW() WHERE id = $2`,
        [failedNextRunAt, row['id']],
      );
      throw lastError;
    }
  }

  async getSchedules(): Promise<unknown[]> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM job_schedules ORDER BY name ASC`);
    return result.rows;
  }

  async enableSchedule(name: string, enabled: boolean): Promise<void> {
    const pool = await this.getPool();
    await pool.query(`UPDATE job_schedules SET enabled = $1, updated_at = NOW() WHERE name = $2`, [
      enabled,
      name,
    ]);
  }

  async triggerNow(name: string): Promise<void> {
    const pool = await this.getPool();
    const result = await pool.query(`SELECT * FROM job_schedules WHERE name = $1`, [name]);
    if (result.rows.length === 0) throw new Error(`Schedule not found: ${name}`);
    await this.fireSchedule(pool, result.rows[0]!);
  }

  private async getPool(): Promise<AnyPool> {
    const { pool } = await import('@szl-holdings/db');
    return pool as unknown as AnyPool;
  }
}

export const durableScheduler = new DurableScheduler();

export async function seedDefaultSchedules(schedules: ScheduleDefinition[]): Promise<void> {
  for (const s of schedules) {
    try {
      await durableScheduler.upsertSchedule(s);
    } catch (err) {
      logger.warn({ err, schedule: s.name }, 'DurableScheduler: failed to seed schedule');
    }
  }
  logger.info({ count: schedules.length }, 'DurableScheduler: default schedules seeded');
}
