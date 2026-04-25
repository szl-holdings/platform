/**
 * seed-uptime-history.ts — Backfill 90 days of historical uptime data
 *
 * Inserts realistic check rows into platform_status_checks for the 6
 * platform services over the past 90 days. Uses 5-minute intervals to
 * match the live health-check cadence, with ~99.9% uptime and small
 * latency variance.
 *
 * Idempotent: fills only the period before the earliest existing row
 * (or the full 90 days if the table is empty). If data already covers
 * at least 85 days, the script exits without touching the database.
 *
 * Usage:
 *   pnpm seed:uptime-history                       # from repo root
 *   pnpm --filter @workspace/api-server seed:uptime-history
 *   tsx src/scripts/seed-uptime-history.ts         # from api-server dir
 */

import { pool } from '@szl-holdings/db';

const SERVICES = [
  { id: 'api',          baseLow: 38,  baseHigh: 95  },
  { id: 'web',          baseLow: 140, baseHigh: 420 },
  { id: 'database',     baseLow: 2,   baseHigh: 18  },
  { id: 'integrations', baseLow: 55,  baseHigh: 210 },
  { id: 'auth',         baseLow: 22,  baseHigh: 75  },
  { id: 'ai',           baseLow: 75,  baseHigh: 260 },
] as const;

const INTERVAL_MS = 5 * 60 * 1000;
const DAYS = 90;
const COVERAGE_THRESHOLD_DAYS = 85;
const UPTIME_RATE = 0.999;
const BATCH_SIZE = 500;

/** Simple deterministic LCG pseudo-random (avoids Math.random variance). */
class Rng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
  intBetween(lo: number, hi: number): number {
    return Math.round(lo + this.next() * (hi - lo));
  }
}

export async function seedUptimeHistory(): Promise<{ inserted: number; skipped: boolean }> {
  const now = Date.now();
  const ninetyDaysAgo = now - DAYS * 24 * 60 * 60 * 1000;
  const coverageThresholdMs = now - COVERAGE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

  // Find the earliest existing row across all services
  const earliestResult = await pool.query<{ earliest: Date | null }>(
    `SELECT MIN(checked_at) AS earliest FROM platform_status_checks`,
  );
  const earliest = earliestResult.rows[0]?.earliest;

  // If we already have data reaching back at least COVERAGE_THRESHOLD_DAYS, skip
  if (earliest !== null && earliest !== undefined && earliest.getTime() <= coverageThresholdMs) {
    console.log(
      `[seed-uptime-history] Historical data already covers ${Math.round((now - earliest.getTime()) / 86400000)} days — skipping.`,
    );
    return { inserted: 0, skipped: true };
  }

  // Seed from 90 days ago up to (but not including) the earliest existing row.
  // If the table is empty, seed up to now minus one interval.
  const seedEndMs = earliest !== null && earliest !== undefined
    ? earliest.getTime() - INTERVAL_MS
    : now - INTERVAL_MS;
  const seedStartMs = ninetyDaysAgo;

  if (seedEndMs <= seedStartMs) {
    console.log('[seed-uptime-history] No gap to fill — skipping.');
    return { inserted: 0, skipped: true };
  }

  type Row = [string, string, number, Date];
  const rows: Row[] = [];

  for (const svc of SERVICES) {
    const rng = new Rng(svc.id.split('').reduce((acc, c) => acc ^ c.charCodeAt(0) * 31, 0x5eed));

    let t = seedStartMs;
    while (t <= seedEndMs) {
      const isOperational = rng.next() < UPTIME_RATE;
      const latency = isOperational ? rng.intBetween(svc.baseLow, svc.baseHigh) : 0;
      rows.push([
        svc.id,
        isOperational ? 'operational' : 'outage',
        latency,
        new Date(t),
      ]);
      t += INTERVAL_MS;
    }
  }

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = batch
      .map((_, idx) => `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`)
      .join(', ');
    const params = batch.flatMap((r) => r);
    await pool.query(
      `INSERT INTO platform_status_checks (service_id, status, latency_ms, checked_at)
       VALUES ${values}`,
      params,
    );
    inserted += batch.length;
  }

  const daysSeeded = Math.round((seedEndMs - seedStartMs) / 86400000);
  console.log(
    `[seed-uptime-history] Inserted ${inserted} rows (${daysSeeded} days × ${SERVICES.length} services).`,
  );
  return { inserted, skipped: false };
}

const isCLI =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('/seed-uptime-history.ts');

if (isCLI) {
  seedUptimeHistory()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed-uptime-history] Failed:', err);
      process.exit(1);
    });
}
