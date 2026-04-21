/**
 * Lightweight config helpers for the CORTEX graph snapshot scheduler.
 * Kept in a separate module so durable-init.ts does not pull in snapshot/ontology
 * dependencies at startup just to evaluate a cron expression.
 */

/**
 * Derives the durable-cron expression from CORTEX_SNAPSHOT_INTERVAL_HOURS.
 * - Default (24 or unset): "0 0 * * *" — daily at midnight UTC
 * - Sub-daily (1–23h): "0 *\/<h> * * *" — e.g. 12 → "0 *\/12 * * *"
 * - Values >=24 or non-finite: coerced to daily midnight.
 *   Multi-day cadences (e.g. every 48h) are intentionally not supported because
 *   cron does not natively express hour-based intervals spanning multiple calendar
 *   days with correct midnight anchoring. Use a lower-frequency value (e.g. weekly
 *   via a separate schedule entry) if longer intervals are required.
 */
export function cortexSnapshotCronExpression(): string {
  const raw = process.env.CORTEX_SNAPSHOT_INTERVAL_HOURS;
  const hours = raw !== undefined ? parseInt(raw, 10) : 24;
  if (!Number.isFinite(hours) || hours <= 0 || hours >= 24) return '0 0 * * *';
  return `0 */${hours} * * *`;
}
