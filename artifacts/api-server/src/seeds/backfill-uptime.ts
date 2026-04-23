/**
 * Backfill 90 days of realistic platform_status_checks history.
 *
 * Run once:
 *   pnpm --filter @szl-holdings/api-server tsx src/seeds/backfill-uptime.ts
 *
 * Safe to re-run — skips days that already have data for each service.
 */
import { pool } from '@szl-holdings/db';

const SERVICES = ['api', 'web', 'database', 'integrations', 'auth', 'ai'];

const CHECK_INTERVAL_MINUTES = 5;

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function statusForDay(
  serviceId: string,
  dayIndex: number,
  checkIndex: number,
): { status: string; latency_ms: number } {
  const seed = dayIndex * 1000 + checkIndex + serviceId.charCodeAt(0) * 100000;
  const rng = seededRandom(seed);

  // Simulate ~99.5% uptime with occasional degraded/outage windows
  // Outage windows are clustered (not random per-check) to be realistic
  const outageSeed = seededRandom(dayIndex * 17 + serviceId.charCodeAt(0) * 7);
  const isOutageDay = outageSeed < 0.015; // ~1.5% of days have an outage
  const degradedSeed = seededRandom(dayIndex * 31 + serviceId.charCodeAt(0) * 13);
  const isDegradedDay = degradedSeed < 0.04; // ~4% of days have degradation

  // Within an outage day, outage affects a 2-4 hour window
  const outageStartCheck = Math.floor(seededRandom(dayIndex + 1) * 200);
  const outageDurationChecks = Math.floor(seededRandom(dayIndex + 2) * 48) + 24; // 2-6h
  const inOutageWindow =
    isOutageDay && checkIndex >= outageStartCheck && checkIndex < outageStartCheck + outageDurationChecks;

  let status: string;
  let baseLatency: number;

  if (inOutageWindow) {
    // During outage: mix of outage and degraded
    status = rng < 0.6 ? 'outage' : 'degraded';
    baseLatency = 5000 + Math.floor(rng * 10000);
  } else if (isDegradedDay && rng < 0.15) {
    status = 'degraded';
    baseLatency = 1200 + Math.floor(rng * 2000);
  } else {
    status = 'operational';
    // Normal latency by service type
    const baseByService: Record<string, number> = {
      database: 8 + Math.floor(rng * 40),
      api: 45 + Math.floor(rng * 80),
      web: 120 + Math.floor(rng * 200),
      integrations: 180 + Math.floor(rng * 300),
      auth: 60 + Math.floor(rng * 100),
      ai: 350 + Math.floor(rng * 500),
    };
    baseLatency = baseByService[serviceId] ?? 100 + Math.floor(rng * 200);
  }

  return { status, latency_ms: baseLatency };
}

async function backfillUptime(): Promise<void> {
  const now = new Date();
  const DAYS = 90;
  const checksPerDay = Math.floor((24 * 60) / CHECK_INTERVAL_MINUTES);
  let inserted = 0;
  let skipped = 0;

  console.log(`[backfill-uptime] Starting 90-day backfill for ${SERVICES.length} services…`);

  for (const serviceId of SERVICES) {
    // Check which days already have data for this service
    const existing = await pool.query<{ day: string }>(
      `SELECT DATE(checked_at AT TIME ZONE 'UTC') AS day
       FROM platform_status_checks
       WHERE service_id = $1 AND checked_at >= NOW() - INTERVAL '90 days'
       GROUP BY day`,
      [serviceId],
    );
    const existingDays = new Set(existing.rows.map((r) => r.day));

    const rows: Array<{ service_id: string; status: string; latency_ms: number; checked_at: Date }> =
      [];

    for (let dayOffset = DAYS; dayOffset >= 1; dayOffset--) {
      const dayStart = new Date(now);
      dayStart.setUTCDate(dayStart.getUTCDate() - dayOffset);
      dayStart.setUTCHours(0, 0, 0, 0);

      const dayKey = dayStart.toISOString().slice(0, 10);
      if (existingDays.has(dayKey)) {
        skipped++;
        continue;
      }

      for (let c = 0; c < checksPerDay; c++) {
        const checkedAt = new Date(dayStart.getTime() + c * CHECK_INTERVAL_MINUTES * 60 * 1000);
        const { status, latency_ms } = statusForDay(serviceId, DAYS - dayOffset, c);
        rows.push({ service_id: serviceId, status, latency_ms, checked_at: checkedAt });
      }
    }

    if (rows.length === 0) {
      console.log(`  [${serviceId}] all days already present — skip`);
      continue;
    }

    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const values = batch
        .map((_, idx) => `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`)
        .join(',');
      const params = batch.flatMap((r) => [r.service_id, r.status, r.latency_ms, r.checked_at]);
      await pool.query(
        `INSERT INTO platform_status_checks (service_id, status, latency_ms, checked_at)
         VALUES ${values}
         ON CONFLICT DO NOTHING`,
        params,
      );
      inserted += batch.length;
    }

    console.log(`  [${serviceId}] inserted ${rows.length} checks (${skipped} days skipped)`);
  }

  console.log(`[backfill-uptime] Done — ${inserted} rows inserted, ${skipped} day-service pairs skipped`);
}

backfillUptime()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[backfill-uptime] Fatal:', err);
    process.exit(1);
  });
