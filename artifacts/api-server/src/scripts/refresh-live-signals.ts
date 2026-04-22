/**
 * refresh-live-signals.ts — Roll the timestamps on the seeded "live signal"
 * rows forward so the Innovation Layer always shows fresh-looking activity.
 *
 * The companion `seed-live-signals.ts` script only inserts rows the first
 * time. Without periodic refreshing, the seeded firestorm_incidents,
 * vessels_alerts, and vessels_events delay rows quickly drift outside the
 * 24–48h window that downstream UIs use to flag "recent" activity, and the
 * demo feed appears frozen.
 *
 * Scope safety
 * ------------
 * This refresher operates **strictly on seeded demo rows**. It identifies
 * them by the exact-title (firestorm) and stable-prefix (vessels) patterns
 * defined in seed-live-signals.ts and re-exported below. No row whose title
 * doesn't match a seed identifier is ever read, updated, or rotated. Real
 * operational incidents/alerts are therefore guaranteed untouched even when
 * they share the same status enum values as seeded rows.
 *
 * What this does (idempotent, safe to run repeatedly):
 *   1. For each tracked table, shift the relevant timestamp on every
 *      non-resolved/non-closed seeded row forward so the most recent row
 *      sits ~1h in the past. Relative ordering and spread are preserved.
 *      For firestorm_incidents we also shift the per-event timestamps
 *      embedded in the `timeline` JSONB column.
 *   2. Rotate one row per table to give the feed visible motion across
 *      reloads: mark the oldest still-open seeded row as resolved/closed,
 *      and re-open the most-recently-resolved seeded row with a fresh
 *      timestamp. This keeps the seeded active count perfectly stable.
 *
 * Rotation is skipped when there aren't enough seeded rows to keep the
 * required active counts (matches the thresholds enforced by
 * seed-live-signals: firestorm ≥4 active, vessels alerts ≥5 active w/
 * ≥2 high+critical, vessels delay events ≥2 open).
 */
import { db, firestormIncidentsTable, vesselsAlertsTable, vesselsEventsTable } from '@szl-holdings/db';
import { and, desc, eq, inArray, ne, or, sql } from "drizzle-orm";

const HOUR_MS = 3600_000;
const TARGET_NEWEST_AGE_HOURS = 1;

/**
 * Exact titles inserted by ensureFirestormIncidents() in seed-live-signals.ts.
 * Every title is uniquely phrased and would not collide with real analyst-
 * authored incident titles. Keep this list in sync with the seed script.
 */
export const FIRESTORM_SEED_TITLES = [
  "Credential Stuffing Spike — Customer Portal",
  "Suspicious OAuth Grant — Finance Tenant",
  "Outbound Beaconing — Build Agent ci-runner-07",
  "Phishing Cluster — Procurement Inbox",
  "Endpoint EDR Tamper Alert — Workstation WS-441",
] as const;

/**
 * Stable title prefixes for vessels_alerts inserted by ensureVesselsAlerts().
 * The seed script appends a vessel name after each prefix, so we match by
 * prefix using `LIKE 'prefix%'`. The em-dashes and exact phrasing make
 * these effectively impossible to collide with real operator-authored
 * alerts.
 */
export const VESSELS_ALERTS_SEED_TITLE_PREFIXES = [
  "Speed deviation — ",
  "Geofence breach — ",
  "Weather window — ",
  "Schedule risk — ",
  "Maintenance watch — ",
  "Cargo temperature excursion — ",
] as const;

/** Stable title prefixes for vessels_events delay rows. */
export const VESSELS_DELAY_EVENT_SEED_TITLE_PREFIXES = [
  "Port delay +",
  "Inland-haul delay — ",
  "Pilot boarding delay — ",
] as const;

function shiftDelta(maxTs: Date | null): number {
  if (!maxTs) return 0;
  const desired = Date.now() - TARGET_NEWEST_AGE_HOURS * HOUR_MS;
  const delta = desired - maxTs.getTime();
  return delta > 0 ? delta : 0;
}

function shiftTimelineJson(timeline: unknown, deltaMs: number): unknown {
  if (deltaMs === 0 || !Array.isArray(timeline)) return timeline;
  return timeline.map((entry) => {
    if (entry && typeof entry === "object" && "at" in entry) {
      const at = (entry as { at?: unknown }).at;
      if (typeof at === "string") {
        const parsed = Date.parse(at);
        if (!Number.isNaN(parsed)) {
          return { ...(entry as Record<string, unknown>), at: new Date(parsed + deltaMs).toISOString() };
        }
      }
    }
    return entry;
  });
}

interface RefreshResult {
  shifted: number;
  rotated: number;
}

async function refreshFirestormIncidents(): Promise<RefreshResult> {
  // Scope: only rows whose title exactly matches a known seed title AND that
  // are still open (status != closed).
  const seededOpen = await db
    .select()
    .from(firestormIncidentsTable)
    .where(and(
      inArray(firestormIncidentsTable.title, FIRESTORM_SEED_TITLES as unknown as string[]),
      ne(firestormIncidentsTable.status, "closed"),
    ));

  if (seededOpen.length === 0) {
    return { shifted: 0, rotated: 0 };
  }

  const maxTs = seededOpen.reduce<Date | null>((acc, row) => {
    const t = row.detectedAt instanceof Date ? row.detectedAt : new Date(row.detectedAt as unknown as string);
    return !acc || t > acc ? t : acc;
  }, null);
  const delta = shiftDelta(maxTs);

  let shifted = 0;
  if (delta > 0) {
    for (const row of seededOpen) {
      const dt = row.detectedAt instanceof Date ? row.detectedAt : new Date(row.detectedAt as unknown as string);
      await db
        .update(firestormIncidentsTable)
        .set({
          detectedAt: new Date(dt.getTime() + delta),
          timeline: shiftTimelineJson(row.timeline, delta),
          updatedAt: new Date(),
        })
        .where(eq(firestormIncidentsTable.id, row.id));
      shifted += 1;
    }
  }

  // Rotation: only swap within the seeded subset.
  let rotated = 0;
  if (seededOpen.length >= 4) {
    const oldestOpen = [...seededOpen].sort((a, b) => {
      const ta = (a.detectedAt instanceof Date ? a.detectedAt : new Date(a.detectedAt as unknown as string)).getTime();
      const tb = (b.detectedAt instanceof Date ? b.detectedAt : new Date(b.detectedAt as unknown as string)).getTime();
      return ta - tb;
    })[0]!;

    const [seededClosed] = await db
      .select()
      .from(firestormIncidentsTable)
      .where(and(
        inArray(firestormIncidentsTable.title, FIRESTORM_SEED_TITLES as unknown as string[]),
        eq(firestormIncidentsTable.status, "closed"),
      ))
      .orderBy(desc(firestormIncidentsTable.resolvedAt))
      .limit(1);

    if (seededClosed) {
      await db
        .update(firestormIncidentsTable)
        .set({ status: "closed", resolvedAt: new Date(), updatedAt: new Date() })
        .where(eq(firestormIncidentsTable.id, oldestOpen.id));
      const reopenDelta = Date.now() - 2 * HOUR_MS - new Date(seededClosed.detectedAt as unknown as string).getTime();
      await db
        .update(firestormIncidentsTable)
        .set({
          status: "investigation",
          resolvedAt: null,
          detectedAt: new Date(Date.now() - 2 * HOUR_MS),
          timeline: shiftTimelineJson(seededClosed.timeline, reopenDelta),
          updatedAt: new Date(),
        })
        .where(eq(firestormIncidentsTable.id, seededClosed.id));
      rotated = 1;
    }
  }
  return { shifted, rotated };
}

/** Build a SQL OR of `title LIKE 'prefix%'` for a list of stable seed prefixes. */
function vesselsTitleScope(prefixes: readonly string[]) {
  // Each prefix is hard-coded above; building parameterized LIKEs.
  const conds = prefixes.map((p) => sql`${vesselsAlertsTable.title} LIKE ${`${p}%`}`);
  return or(...conds)!;
}

function vesselsEventsTitleScope(prefixes: readonly string[]) {
  const conds = prefixes.map((p) => sql`${vesselsEventsTable.title} LIKE ${`${p}%`}`);
  return or(...conds)!;
}

async function refreshVesselsAlerts(): Promise<RefreshResult> {
  const seededActive = await db
    .select()
    .from(vesselsAlertsTable)
    .where(and(
      vesselsTitleScope(VESSELS_ALERTS_SEED_TITLE_PREFIXES),
      ne(vesselsAlertsTable.status, "resolved"),
    ));

  if (seededActive.length === 0) {
    return { shifted: 0, rotated: 0 };
  }

  const maxTs = seededActive.reduce<Date | null>((acc, row) => {
    const t = row.triggeredAt instanceof Date ? row.triggeredAt : new Date(row.triggeredAt as unknown as string);
    return !acc || t > acc ? t : acc;
  }, null);
  const delta = shiftDelta(maxTs);

  let shifted = 0;
  if (delta > 0) {
    for (const row of seededActive) {
      const tt = row.triggeredAt instanceof Date ? row.triggeredAt : new Date(row.triggeredAt as unknown as string);
      await db
        .update(vesselsAlertsTable)
        .set({ triggeredAt: new Date(tt.getTime() + delta) })
        .where(eq(vesselsAlertsTable.id, row.id));
      shifted += 1;
    }
  }

  // Rotation: only if we'd still meet the seed thresholds (≥5 active, ≥2 high+critical).
  let rotated = 0;
  const highCritical = seededActive.filter((r) => r.severity === "high" || r.severity === "critical").length;
  if (seededActive.length >= 6 && highCritical >= 3) {
    const sorted = [...seededActive].sort((a, b) => {
      const ta = (a.triggeredAt instanceof Date ? a.triggeredAt : new Date(a.triggeredAt as unknown as string)).getTime();
      const tb = (b.triggeredAt instanceof Date ? b.triggeredAt : new Date(b.triggeredAt as unknown as string)).getTime();
      return ta - tb;
    });
    const oldestSafe = sorted.find((r) => r.severity !== "critical" && (highCritical > 2 || r.severity !== "high")) ?? sorted[0]!;

    const [seededResolved] = await db
      .select()
      .from(vesselsAlertsTable)
      .where(and(
        vesselsTitleScope(VESSELS_ALERTS_SEED_TITLE_PREFIXES),
        eq(vesselsAlertsTable.status, "resolved"),
      ))
      .orderBy(desc(vesselsAlertsTable.resolvedAt))
      .limit(1);

    if (seededResolved) {
      await db
        .update(vesselsAlertsTable)
        .set({ status: "resolved", resolvedAt: new Date() })
        .where(eq(vesselsAlertsTable.id, oldestSafe.id));
      await db
        .update(vesselsAlertsTable)
        .set({ status: "active", resolvedAt: null, triggeredAt: new Date(Date.now() - 1.5 * HOUR_MS) })
        .where(eq(vesselsAlertsTable.id, seededResolved.id));
      rotated = 1;
    }
  }
  return { shifted, rotated };
}

async function refreshVesselsDelayEvents(): Promise<RefreshResult> {
  const seededOpen = await db
    .select()
    .from(vesselsEventsTable)
    .where(and(
      eq(vesselsEventsTable.eventType, "delay_event"),
      vesselsEventsTitleScope(VESSELS_DELAY_EVENT_SEED_TITLE_PREFIXES),
      ne(vesselsEventsTable.status, "resolved"),
    ));

  if (seededOpen.length === 0) {
    return { shifted: 0, rotated: 0 };
  }

  const maxTs = seededOpen.reduce<Date | null>((acc, row) => {
    const t = row.occurredAt instanceof Date ? row.occurredAt : new Date(row.occurredAt as unknown as string);
    return !acc || t > acc ? t : acc;
  }, null);
  const delta = shiftDelta(maxTs);

  let shifted = 0;
  if (delta > 0) {
    for (const row of seededOpen) {
      const tt = row.occurredAt instanceof Date ? row.occurredAt : new Date(row.occurredAt as unknown as string);
      await db
        .update(vesselsEventsTable)
        .set({ occurredAt: new Date(tt.getTime() + delta) })
        .where(eq(vesselsEventsTable.id, row.id));
      shifted += 1;
    }
  }

  // Rotation: keep ≥2 open delay events post-rotation.
  let rotated = 0;
  if (seededOpen.length >= 3) {
    const oldest = [...seededOpen].sort((a, b) => {
      const ta = (a.occurredAt instanceof Date ? a.occurredAt : new Date(a.occurredAt as unknown as string)).getTime();
      const tb = (b.occurredAt instanceof Date ? b.occurredAt : new Date(b.occurredAt as unknown as string)).getTime();
      return ta - tb;
    })[0]!;

    const [seededResolved] = await db
      .select()
      .from(vesselsEventsTable)
      .where(and(
        eq(vesselsEventsTable.eventType, "delay_event"),
        vesselsEventsTitleScope(VESSELS_DELAY_EVENT_SEED_TITLE_PREFIXES),
        eq(vesselsEventsTable.status, "resolved"),
      ))
      .orderBy(desc(vesselsEventsTable.resolvedAt))
      .limit(1);

    if (seededResolved) {
      await db
        .update(vesselsEventsTable)
        .set({ status: "resolved", resolvedAt: new Date() })
        .where(eq(vesselsEventsTable.id, oldest.id));
      await db
        .update(vesselsEventsTable)
        .set({ status: "open", resolvedAt: null, acknowledgedAt: null, occurredAt: new Date(Date.now() - 3 * HOUR_MS) })
        .where(eq(vesselsEventsTable.id, seededResolved.id));
      rotated = 1;
    }
  }
  return { shifted, rotated };
}

export interface RefreshLiveSignalsResult {
  firestorm: RefreshResult;
  vesselsAlerts: RefreshResult;
  vesselsDelayEvents: RefreshResult;
}

export async function refreshLiveSignals(): Promise<RefreshLiveSignalsResult> {

  const firestorm = await refreshFirestormIncidents();
  const vesselsAlerts = await refreshVesselsAlerts();
  const vesselsDelayEvents = await refreshVesselsDelayEvents();
  return { firestorm, vesselsAlerts, vesselsDelayEvents };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  refreshLiveSignals()
    .then(() => process.exit(0))
    .catch((_err) => { process.exit(1); });
}
