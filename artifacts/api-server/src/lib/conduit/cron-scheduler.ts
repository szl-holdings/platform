import { db } from '@szl-holdings/db';
import { eq, and } from 'drizzle-orm';
import { conduitSyncsTable, conduitSyncRunsTable } from '@szl-holdings/db';
import { executeSyncRun, isSyncRunning } from './sync-engine';
import { logger } from '../logger';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

function cronMatchesNow(expr: string, now: Date): boolean {
  try {
    const parts = expr.trim().split(/\s+/);
    if (parts.length < 5) return false;

    const [minuteExpr, hourExpr, dayExpr, monthExpr, dowExpr] = parts;
    const minute = now.getMinutes();
    const hour = now.getHours();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const dow = now.getDay();

    return (
      fieldMatches(minuteExpr, minute, 0, 59) &&
      fieldMatches(hourExpr, hour, 0, 23) &&
      fieldMatches(dayExpr, day, 1, 31) &&
      fieldMatches(monthExpr, month, 1, 12) &&
      fieldMatches(dowExpr, dow, 0, 6)
    );
  } catch {
    return false;
  }
}

function fieldMatches(expr: string, value: number, min: number, max: number): boolean {
  if (expr === '*') return true;

  for (const part of expr.split(',')) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    if (stepMatch) {
      const [, range, stepStr] = stepMatch;
      const step = parseInt(stepStr, 10);
      if (range === '*') {
        if (value % step === 0) return true;
      } else {
        const [start, end] = parseRange(range, min, max);
        if (value >= start && value <= end && (value - start) % step === 0) return true;
      }
      continue;
    }

    if (part.includes('-')) {
      const [start, end] = parseRange(part, min, max);
      if (value >= start && value <= end) return true;
      continue;
    }

    if (parseInt(part, 10) === value) return true;
  }

  return false;
}

function parseRange(expr: string, min: number, max: number): [number, number] {
  const parts = expr.split('-');
  const start = parts[0] === '*' ? min : parseInt(parts[0], 10);
  const end = parts.length > 1 ? parseInt(parts[1], 10) : start;
  return [start, end];
}

async function tick(): Promise<void> {
  try {
    const now = new Date();
    const syncs = await db.select().from(conduitSyncsTable)
      .where(and(
        eq(conduitSyncsTable.runMode, 'scheduled'),
        eq(conduitSyncsTable.status, 'active'),
      ));

    for (const sync of syncs) {
      if (!sync.scheduleExpr) continue;
      if (isSyncRunning(sync.id)) continue;
      if (!cronMatchesNow(sync.scheduleExpr, now)) continue;

      logger.info({ syncId: sync.id, name: sync.name, schedule: sync.scheduleExpr }, 'Cron scheduler triggering sync');

      try {
        const [run] = await db.insert(conduitSyncRunsTable).values({
          syncId: sync.id,
          status: 'running',
          triggeredBy: 'scheduler',
        }).returning();

        executeSyncRun(run.id, sync.id, { triggeredBy: 'scheduler' })
          .catch(err => logger.error({ err, syncId: sync.id, runId: run.id }, 'Scheduled sync execution error'));
      } catch (err) {
        logger.error({ err, syncId: sync.id }, 'Failed to create scheduled run');
      }
    }
  } catch (err) {
    logger.error({ err }, 'Cron scheduler tick failed');
  }
}

export function startScheduler(): void {
  if (schedulerInterval) return;
  logger.info('Conduit cron scheduler started (60s interval)');
  schedulerInterval = setInterval(tick, 60_000);
  setTimeout(tick, 5000);
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Conduit cron scheduler stopped');
  }
}
