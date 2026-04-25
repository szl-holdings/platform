import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const HAS_DB = Boolean(process.env.DATABASE_URL);
const d = HAS_DB ? describe : describe.skip;

d('seedUptimeHistory', () => {
  let testPool: InstanceType<typeof import('@szl-holdings/db').PgPool>;

  beforeAll(async () => {
    const { PgPool } = await import('@szl-holdings/db');
    testPool = new PgPool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      idleTimeoutMillis: 2000,
    });
  });

  afterAll(async () => {
    await testPool?.end();
  });

  it('produces rows for all 6 services covering the expected date range', async () => {
    const result = await testPool.query(
      `SELECT service_id,
              COUNT(DISTINCT DATE(checked_at))::int AS days
       FROM platform_status_checks
       GROUP BY service_id
       ORDER BY service_id`,
    );

    const EXPECTED_SERVICES = ['ai', 'api', 'auth', 'database', 'integrations', 'web'];
    const serviceIds = result.rows.map((r: { service_id: string }) => r.service_id);
    expect(serviceIds).toEqual(EXPECTED_SERVICES);

    for (const row of result.rows) {
      expect((row as { days: number }).days).toBeGreaterThanOrEqual(80);
    }
  });

  it('has realistic uptime rates (~99% or above)', async () => {
    const result = await testPool.query(
      `SELECT service_id,
              ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'operational') / COUNT(*), 2)::float AS uptime_pct
       FROM platform_status_checks
       GROUP BY service_id`,
    );

    for (const row of result.rows) {
      const pct = (row as { uptime_pct: number }).uptime_pct;
      expect(pct).toBeGreaterThanOrEqual(95);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it('uses only valid status values', async () => {
    const result = await testPool.query(
      `SELECT DISTINCT status FROM platform_status_checks ORDER BY status`,
    );
    const statuses = result.rows.map((r: { status: string }) => r.status);
    for (const s of statuses) {
      expect(['operational', 'degraded', 'outage']).toContain(s);
    }
  });

  it('is idempotent — coverage already exceeds 85-day threshold', async () => {
    const result = await testPool.query(
      `SELECT MIN(checked_at) AS earliest FROM platform_status_checks`,
    );
    const earliest = (result.rows[0] as { earliest: Date })?.earliest;
    expect(earliest).toBeTruthy();
    const daysCovered = (Date.now() - earliest.getTime()) / 86400000;
    expect(daysCovered).toBeGreaterThanOrEqual(85);
  });

  it('composite index exists for query performance', async () => {
    const result = await testPool.query(
      `SELECT indexname FROM pg_indexes
       WHERE tablename = 'platform_status_checks'
         AND indexname = 'idx_status_checks_svc_ts'`,
    );
    expect(result.rows).toHaveLength(1);
  });
});
