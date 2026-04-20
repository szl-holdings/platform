/**
 * seed-live-signals.ts — Seed the four "live signal" tables that drive the
 * Innovation Layer's Ambient Signal Ranker, Correlation Map, and Signal
 * Chain evaluation:
 *
 *   - firestorm_incidents        (3-5, varied severity)
 *   - vessels_alerts             (5+, 2+ high/critical)
 *   - vessels_events delay_event (2+)
 *   - terra_distress_properties  (10+ active — handled by seed-terra-distress)
 *
 * Without these rows the Innovation Layer falls back to static demo data
 * and reports `live: false`. This script is idempotent: it counts existing
 * rows that match the required filters and only inserts what's missing.
 */
import {
  db,
  firestormIncidentsTable,
  terraDistressPropertiesTable,
  vesselsAlertsTable,
  vesselsEventsTable,
  vesselsTable,
} from '@szl-holdings/db';
import { and, eq, ne, or, sql } from 'drizzle-orm';
import { seedTerraDistress } from './seed-terra-distress.js';

function hoursAgo(n: number) {
  return new Date(Date.now() - n * 3600_000);
}
function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000);
}

async function ensureFirestormIncidents() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(firestormIncidentsTable)
    .where(ne(firestormIncidentsTable.status, 'closed'));
  if (count >= 4) {
    console.log(`[seed-live-signals] firestorm_incidents: ${count} active rows, skipping`);
    return 0;
  }

  const rows = await db
    .insert(firestormIncidentsTable)
    .values([
      {
        title: 'Credential Stuffing Spike — Customer Portal',
        description:
          'Detected 4,200 failed logins from 318 unique source IPs against /portal/login over 22 minutes. Velocity 18× baseline; WAF rate-limit engaged at minute 14.',
        severity: 'critical',
        status: 'investigation',
        assignedAnalyst: 'K. Okafor',
        affectedAssets: ['customer-portal-prod', 'okta-tenant-szl', 'auth-edge-cdn'],
        attackTechnique: 'T1110.004',
        timeline: [
          { at: hoursAgo(2).toISOString(), event: 'Detection — anomaly trigger' },
          { at: hoursAgo(1).toISOString(), event: 'Triage — analyst assigned' },
          { at: hoursAgo(0.5).toISOString(), event: 'Containment — IP block list updated' },
        ],
        notes:
          'Likely tied to overnight breach disclosure at SaaS competitor; replay attempts using leaked corpus.',
        detectedAt: hoursAgo(2),
      },
      {
        title: 'Suspicious OAuth Grant — Finance Tenant',
        description:
          'Unsanctioned third-party app granted offline_access + Mail.Read on M365 finance tenant. Token issued at 03:14 UTC by user with no recent activity.',
        severity: 'high',
        status: 'triage',
        assignedAnalyst: 'M. Patel',
        affectedAssets: ['m365-finance-tenant', 'user:cfo-office@szl.com'],
        attackTechnique: 'T1528',
        timeline: [
          { at: hoursAgo(6).toISOString(), event: 'Detection — Defender alert' },
          { at: hoursAgo(5).toISOString(), event: 'Triage — token revocation queued' },
        ],
        notes: 'App publisher unverified; pending revoke + user re-auth.',
        detectedAt: hoursAgo(6),
      },
      {
        title: 'Outbound Beaconing — Build Agent ci-runner-07',
        description:
          'Periodic 60s POST to 185.107.83.x observed from CI runner. Traffic encrypted; certificate self-signed. Host quarantined at network edge.',
        severity: 'high',
        status: 'containment',
        assignedAnalyst: 'R. Chen',
        affectedAssets: ['ci-runner-07', 'build-vlan-22'],
        attackTechnique: 'T1071.001',
        timeline: [
          { at: daysAgo(1).toISOString(), event: 'Detection — Zeek anomaly' },
          { at: hoursAgo(18).toISOString(), event: 'Containment — host isolated' },
        ],
        notes: 'Forensic image in progress; checking for compromised CI secrets.',
        detectedAt: daysAgo(1),
      },
      {
        title: 'Phishing Cluster — Procurement Inbox',
        description:
          '11 lookalike-domain emails (szl-procurement[.]co) targeting AP team with invoice attachments. 2 users opened, 0 credentials submitted.',
        severity: 'medium',
        status: 'remediation',
        assignedAnalyst: 'T. Alvarez',
        affectedAssets: ['m365-corp-mail', 'user:ap-team@szl.com'],
        attackTechnique: 'T1566.001',
        timeline: [
          { at: daysAgo(2).toISOString(), event: 'Detection — user report + Defender' },
          { at: daysAgo(1).toISOString(), event: 'Remediation — domain blocked, mailbox sweep' },
        ],
        notes: 'Awareness reminder queued for AP team; no lateral movement detected.',
        detectedAt: daysAgo(2),
      },
      {
        title: 'Endpoint EDR Tamper Alert — Workstation WS-441',
        description:
          'CrowdStrike sensor reported repeated stop attempts on workstation assigned to a contractor. No payload executed, but persistence concern.',
        severity: 'medium',
        status: 'detection',
        assignedAnalyst: 'Unassigned',
        affectedAssets: ['ws-441', 'user:contractor-vendor-bridge'],
        attackTechnique: 'T1562.001',
        timeline: [{ at: hoursAgo(3).toISOString(), event: 'Detection — EDR tamper signal' }],
        notes: 'Contractor offboarding workflow opened in parallel.',
        detectedAt: hoursAgo(3),
      },
    ])
    .returning({ id: firestormIncidentsTable.id });

  console.log(`[seed-live-signals] firestorm_incidents: inserted ${rows.length}`);
  return rows.length;
}

async function ensureVesselsAlerts() {
  const [{ active }] = await db
    .select({ active: sql<number>`count(*)::int` })
    .from(vesselsAlertsTable)
    .where(ne(vesselsAlertsTable.status, 'resolved'));
  const [{ critical }] = await db
    .select({ critical: sql<number>`count(*)::int` })
    .from(vesselsAlertsTable)
    .where(
      and(
        ne(vesselsAlertsTable.status, 'resolved'),
        or(eq(vesselsAlertsTable.severity, 'critical'), eq(vesselsAlertsTable.severity, 'high')),
      ),
    );
  if (active >= 5 && critical >= 2) {
    console.log(
      `[seed-live-signals] vessels_alerts: ${active} active / ${critical} high+critical, skipping`,
    );
    return 0;
  }

  const vessels = await db
    .select({ id: vesselsTable.id, name: vesselsTable.name })
    .from(vesselsTable)
    .limit(5);
  if (vessels.length === 0) {
    console.warn(
      '[seed-live-signals] vessels_alerts: no vessels rows — run seed:demo first; skipping',
    );
    return 0;
  }
  const v = (i: number) => vessels[i % vessels.length].id;
  const vName = (i: number) => vessels[i % vessels.length].name;

  const rows = await db
    .insert(vesselsAlertsTable)
    .values([
      {
        vesselId: v(0),
        title: `Speed deviation — ${vName(0)}`,
        message: 'Vessel speed dropped to 6.2kn vs. plan 11.5kn over last 90min; ETA slipping.',
        severity: 'high',
        status: 'active',
        metadata: { observedSpeedKn: 6.2, plannedSpeedKn: 11.5, etaSlipHours: 9 },
        triggeredAt: hoursAgo(1.5),
      },
      {
        vesselId: v(1),
        title: `Geofence breach — ${vName(1)} entered restricted zone`,
        message: 'Vessel crossed into PSSA exclusion polygon near Strait of Bonifacio.',
        severity: 'critical',
        status: 'active',
        metadata: { polygon: 'psa-bonifacio', lat: 41.34, lon: 9.21 },
        triggeredAt: hoursAgo(0.4),
      },
      {
        vesselId: v(2),
        title: `Weather window — ${vName(2)} entering Force 9`,
        message:
          'Forecast shows Beaufort 9 winds within 6h on current heading; reroute advisory issued.',
        severity: 'high',
        status: 'acknowledged',
        metadata: { beaufort: 9, etaToWeather: 6 },
        triggeredAt: hoursAgo(3),
      },
      {
        vesselId: v(3),
        title: `Schedule risk — ${vName(3)} berth slot at risk`,
        message:
          'Cumulative delay (+11h) projected to miss Rotterdam berth window; queue position +2.',
        severity: 'medium',
        status: 'active',
        metadata: { delayHours: 11, port: 'Rotterdam', berthSlotAt: hoursAgo(-18).toISOString() },
        triggeredAt: hoursAgo(2),
      },
      {
        vesselId: v(4),
        title: `Maintenance watch — ${vName(4)} main engine vibration`,
        message:
          "ISO 10816 vibration band crossed 'alarm' threshold on cylinder 4 over last 4 hours.",
        severity: 'medium',
        status: 'active',
        metadata: { component: 'main_engine', iso10816Band: 'alarm', cylinder: 4 },
        triggeredAt: hoursAgo(5),
      },
      {
        vesselId: v(0),
        title: `Cargo temperature excursion — ${vName(0)} reefer bay 3`,
        message:
          'Reefer bay 3 temperature 4.2°C above setpoint for 38 minutes; QA notification sent.',
        severity: 'high',
        status: 'active',
        metadata: { bay: 3, setpointC: -18, observedC: -13.8, durationMin: 38 },
        triggeredAt: hoursAgo(0.7),
      },
    ])
    .returning({ id: vesselsAlertsTable.id });

  console.log(`[seed-live-signals] vessels_alerts: inserted ${rows.length}`);
  return rows.length;
}

async function ensureVesselsDelayEvents() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vesselsEventsTable)
    .where(
      and(
        eq(vesselsEventsTable.eventType, 'delay_event'),
        ne(vesselsEventsTable.status, 'resolved'),
      ),
    );
  if (count >= 2) {
    console.log(`[seed-live-signals] vessels_events delay_event: ${count} open, skipping`);
    return 0;
  }

  const vessels = await db
    .select({ id: vesselsTable.id, name: vesselsTable.name })
    .from(vesselsTable)
    .limit(3);
  if (vessels.length === 0) {
    console.warn('[seed-live-signals] vessels_events: no vessels rows; skipping');
    return 0;
  }

  const rows = await db
    .insert(vesselsEventsTable)
    .values([
      {
        vesselId: vessels[0].id,
        eventType: 'delay_event',
        severity: 'critical',
        status: 'open',
        title: `Port delay +32h — ${vessels[0].name} at Shanghai`,
        description:
          'Anchorage queue extended; berth allocation shifted by 32 hours due to congestion.',
        consequenceData: {
          delayHours: 32,
          port: 'Shanghai',
          queuePosition: 14,
          marginImpact: 380000,
        },
        occurredAt: hoursAgo(4),
      },
      {
        vesselId: vessels[Math.min(1, vessels.length - 1)].id,
        eventType: 'delay_event',
        severity: 'warning',
        status: 'open',
        title: `Inland-haul delay — ${vessels[Math.min(1, vessels.length - 1)].name} container backlog`,
        description:
          'Rail handover at LA/LB delayed 14h; 2 customer SLAs at risk on automotive parts shipment.',
        consequenceData: { delayHours: 14, mode: 'rail', port: 'LA/LB', slaAtRisk: 2 },
        occurredAt: hoursAgo(7),
      },
      {
        vesselId: vessels[Math.min(2, vessels.length - 1)].id,
        eventType: 'delay_event',
        severity: 'warning',
        status: 'acknowledged',
        title: `Pilot boarding delay — ${vessels[Math.min(2, vessels.length - 1)].name} at Singapore`,
        description: 'Pilot dispatch backlog at Singapore Strait added 6h to inbound transit.',
        consequenceData: { delayHours: 6, port: 'Singapore', cause: 'pilot_backlog' },
        occurredAt: hoursAgo(9),
      },
    ])
    .returning({ id: vesselsEventsTable.id });

  console.log(`[seed-live-signals] vessels_events delay_event: inserted ${rows.length}`);
  return rows.length;
}

async function ensureTerraDistress() {
  const before = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(terraDistressPropertiesTable)
    .where(eq(terraDistressPropertiesTable.isActive, true));
  const beforeCount = before[0]?.count ?? 0;
  console.log(`[seed-live-signals] terra_distress_properties: ${beforeCount} active before seed`);
  if (beforeCount >= 10) return 0;

  console.log(
    '[seed-live-signals] terra_distress_properties below threshold — invoking seedTerraDistress()…',
  );
  try {
    const result = await seedTerraDistress();
    const after = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(terraDistressPropertiesTable)
      .where(eq(terraDistressPropertiesTable.isActive, true));
    console.log(
      `[seed-live-signals] terra_distress_properties: ${after[0]?.count ?? 0} active after seed`,
    );
    return result.inserted;
  } catch (err) {
    console.error('[seed-live-signals] seedTerraDistress failed:', err);
    return 0;
  }
}

export async function seedLiveSignals() {
  console.log('[seed-live-signals] Starting…');
  const incidents = await ensureFirestormIncidents();
  const alerts = await ensureVesselsAlerts();
  const delays = await ensureVesselsDelayEvents();
  const distress = await ensureTerraDistress();
  console.log(
    `[seed-live-signals] Done. inserted: incidents=${incidents}, vessel_alerts=${alerts}, vessel_delays=${delays}, terra_distress=${distress}`,
  );
  return { incidents, alerts, delays, distress };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedLiveSignals()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed-live-signals] failed:', err);
      process.exit(1);
    });
}
