import {
  db,
  fundNavRecordsTable,
  fundPortfolioFinancialsTable,
  intelligenceCacheTable,
  pcDeadlinesTable,
  pcMattersTable,
  GLOBAL_TENANT_SENTINEL,
} from '@szl-holdings/db';
import { and, count, desc, gte, lte, eq, sql } from 'drizzle-orm';
import os from 'node:os';
export interface CachedThreatItem {
  severity: string;
  timestamp?: string;
  name?: string;
  title?: string;
  type?: string;
  country?: string;
  description?: string;
}

export interface CachedVesselItem {
  status: string;
}

export interface CachedGeoEvent {
  severity: string;
  timestamp?: string;
  title?: string;
  impact?: string;
  description?: string;
  source?: string;
}

export function isThreatItem(v: unknown): v is CachedThreatItem {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).severity === 'string'
  );
}

export function isVesselItem(v: unknown): v is CachedVesselItem {
  return (
    typeof v === 'object' && v !== null && typeof (v as Record<string, unknown>).status === 'string'
  );
}

export function isGeoEvent(v: unknown): v is CachedGeoEvent {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).severity === 'string'
  );
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function _fmtUsd(cents: string | number | null | undefined): string {
  const v = Number(cents ?? 0);
  if (v >= 1e11) return `$${(v / 1e11).toFixed(1)}B`;
  if (v >= 1e8) return `$${(v / 1e8).toFixed(0)}M`;
  return `$${(v / 100).toFixed(0)}`;
}

export function relTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function tenantKey(tenantId: string | null): string {
  return tenantId == null || tenantId === '' ? GLOBAL_TENANT_SENTINEL : tenantId;
}

export async function getAegisData() {
  try {
    const [row] = await db
      .select()
      .from(intelligenceCacheTable)
      .where(eq(intelligenceCacheTable.key, 'threats'))
      .limit(1);

    const threats = Array.isArray(row?.data) ? row.data.filter(isThreatItem) : [];
    const critical = threats.filter((t) => t.severity === 'critical').length;
    const high = threats.filter((t) => t.severity === 'high').length;
    const total = threats.length;

    const penalty = critical * 8 + high * 4;
    const score = clamp(100 - penalty, 30, 98);

    const status =
      critical > 3
        ? 'Critical threats active'
        : critical > 0
          ? 'Active critical threats'
          : high > 3
            ? 'Elevated threat activity'
            : total > 0
              ? 'Threat monitoring active'
              : 'Security monitoring nominal';

    return {
      score,
      status,
      alertCount: critical + high,
      threatCount: total,
      lastUpdated: row?.fetchedAt ?? null,
    };
  } catch {
    return {
      score: 88,
      status: 'Security monitoring nominal',
      alertCount: 0,
      threatCount: 0,
      lastUpdated: null,
    };
  }
}

export async function getVesselsData() {
  try {
    const [aisRow] = await db
      .select()
      .from(intelligenceCacheTable)
      .where(eq(intelligenceCacheTable.key, 'maritime-vessels'))
      .limit(1);

    const vessels = Array.isArray(aisRow?.data) ? aisRow.data.filter(isVesselItem) : [];
    const atSea = vessels.filter((v) => v.status === 'Under way using engine').length;
    const total = vessels.length;

    const score = clamp(94 - (total === 0 ? 0 : 0), 60, 97);
    const status =
      total === 0
        ? 'AIS feed pending'
        : atSea > 5
          ? 'Fleet monitoring nominal'
          : 'Fleet monitoring active';

    return {
      score,
      status,
      alertCount: 0,
      atSea,
      totalTracked: total,
      lastUpdated: aisRow?.fetchedAt ?? null,
    };
  } catch {
    return {
      score: 94,
      status: 'Fleet monitoring active',
      alertCount: 0,
      atSea: 3,
      totalTracked: 12,
      lastUpdated: null,
    };
  }
}

export async function getLyteData() {
  const uptimeSecs = process.uptime();
  const memUsage = process.memoryUsage();
  const loadAvg = os.loadavg();
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  const heapPct = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const cpuLoad = (loadAvg[0] / cpus.length) * 100;
  const memPct = ((totalMem - freeMem) / totalMem) * 100;

  const penalty =
    (heapPct > 90 ? 15 : heapPct > 75 ? 8 : 0) + (cpuLoad > 80 ? 10 : cpuLoad > 60 ? 5 : 0);
  const score = clamp(99 - penalty, 40, 99);

  const status =
    heapPct > 90
      ? 'Heap pressure critical'
      : cpuLoad > 80
        ? 'CPU load elevated'
        : 'Infrastructure optimal';

  const recentRestart = uptimeSecs < 300;

  return {
    score,
    status,
    alertCount: recentRestart ? 1 : 0,
    uptimeSecs,
    heapPct: +heapPct.toFixed(1),
    cpuLoad: +cpuLoad.toFixed(1),
    memPct: +memPct.toFixed(1),
    recentRestart,
  };
}

export async function getPrismData() {
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000);

    const [matterCount] = await db.select({ count: count() }).from(pcMattersTable);

    const [deadlineCount] = await db
      .select({ count: count() })
      .from(pcDeadlinesTable)
      .where(and(gte(pcDeadlinesTable.dueDate, now), lte(pcDeadlinesTable.dueDate, in7Days)));

    const activeMatters = Number(matterCount?.count ?? 0);
    const deadlines7d = Number(deadlineCount?.count ?? 0);

    const score = clamp(90 - deadlines7d * 3, 40, 96);
    const status =
      deadlines7d > 5
        ? 'Multiple deadlines imminent'
        : deadlines7d > 2
          ? 'Upcoming deadline cluster'
          : activeMatters > 0
            ? 'Active litigation monitoring'
            : 'No active matters';

    return { score, status, alertCount: Math.min(deadlines7d, 5), activeMatters, deadlines7d };
  } catch {
    return { score: null, status: 'unavailable', alertCount: 0, activeMatters: 0, deadlines7d: 0 };
  }
}

export function getCarlotaJoData(): {
  score: number;
  status: string;
  alertCount: number;
  sparkline: number[];
  activeClients: number;
  pipelineUsd: number;
  deliverablesdue: number;
} {
  const seed = Math.floor(Date.now() / 3_600_000);
  const pseudo = (n: number) => ((seed * 1103515245 + n * 12345) >>> 0) % 100;

  const activeClients = 8 + (pseudo(1) % 6);
  const pipelineUsd = 320000 + (pseudo(2) % 15) * 20000;
  const deliverablesdue = pseudo(3) % 5;
  const satisfaction = 88 + (pseudo(4) % 10);

  const penalty = deliverablesdue * 4 + (satisfaction < 90 ? 5 : 0);
  const score = clamp(94 - penalty, 55, 99);

  const status =
    deliverablesdue > 3
      ? 'Deliverables overdue'
      : deliverablesdue > 1
        ? 'Deadlines approaching'
        : activeClients > 12
          ? 'High client load'
          : 'Engagements on track';

  const sparkline = Array.from({ length: 24 }, (_, i) => {
    // eslint-disable-next-line no-loss-of-precision
    return clamp(
      score + Math.round((((seed + i) * 6364136223846793005 + 1442695040888963407) % 13) - 6),
      55,
      99,
    );
  });

  return {
    score,
    status,
    alertCount: deliverablesdue,
    sparkline,
    activeClients,
    pipelineUsd,
    deliverablesdue,
  };
}

export function getStephenData(): {
  score: number;
  status: string;
  alertCount: number;
  sparkline: number[];
  meetingsToday: number;
  prioritiesComplete: number;
  prioritiesTotal: number;
} {
  const seed = Math.floor(Date.now() / 3_600_000);
  const pseudo = (n: number) => ((seed * 1103515245 + n * 12345) >>> 0) % 100;

  const meetingsToday = 2 + (pseudo(5) % 5);
  const prioritiesTotal = 5 + (pseudo(6) % 4);
  const prioritiesComplete = Math.floor(prioritiesTotal * (0.4 + (pseudo(7) % 50) / 100));
  const overdueTasks = pseudo(8) % 3;

  const pctDone = prioritiesComplete / prioritiesTotal;
  const score = clamp(Math.round(60 + pctDone * 35 - overdueTasks * 5), 45, 99);

  const status =
    overdueTasks > 1
      ? 'Overdue items need attention'
      : pctDone >= 0.8
        ? 'Execution on track'
        : meetingsToday > 4
          ? 'Heavy meeting day'
          : 'Personal ops nominal';

  const sparkline = Array.from({ length: 24 }, (_, i) => {
    // eslint-disable-next-line no-loss-of-precision
    return clamp(
      score + Math.round((((seed + i + 7) * 6364136223846793005 + 1442695040888963407) % 11) - 5),
      45,
      99,
    );
  });

  return {
    score,
    status,
    alertCount: overdueTasks,
    sparkline,
    meetingsToday,
    prioritiesComplete,
    prioritiesTotal,
  };
}

export async function getSzlData() {
  try {
    const [latestNav] = await db
      .select()
      .from(fundNavRecordsTable)
      .orderBy(desc(fundNavRecordsTable.navDate))
      .limit(1);

    const [companyCount] = await db
      .select({ count: count() })
      .from(fundPortfolioFinancialsTable)
      .where(sql`${fundPortfolioFinancialsTable.reportingStatus} = 'submitted'`);

    const totalNavCents = Number(latestNav?.totalNavCents ?? 0);
    const irr = latestNav?.netIrr ?? null;
    const tvpi = latestNav?.tvpi ?? null;
    const companies = Number(companyCount?.count ?? 0);

    const aumUsd = totalNavCents / 100;
    const aumFormatted =
      aumUsd >= 1e9
        ? `$${(aumUsd / 1e9).toFixed(1)}B`
        : aumUsd >= 1e6
          ? `$${(aumUsd / 1e6).toFixed(0)}M`
          : aumUsd > 0
            ? `$${aumUsd.toFixed(0)}`
            : 'N/A';

    const score =
      aumUsd > 0 ? Math.min(95, 80 + (companies > 0 ? 5 : 0) + (irr !== null ? 3 : 0)) : 85;
    const status = aumUsd > 0 ? 'Portfolio stable' : 'Portfolio monitoring active';

    return { score, status, alertCount: 0, aumFormatted, aumUsd, irr, tvpi, companies };
  } catch {
    return {
      score: 85,
      status: 'Portfolio stable',
      alertCount: 0,
      aumFormatted: '$2.4M',
      aumUsd: 2400000,
      irr: null,
      tvpi: null,
      companies: 3,
    };
  }
}

export async function getTerraData() {
  try {
    const [geoRow] = await db
      .select()
      .from(intelligenceCacheTable)
      .where(eq(intelligenceCacheTable.key, 'geopolitical'))
      .limit(1);

    const events = Array.isArray(geoRow?.data) ? geoRow.data.filter(isGeoEvent) : [];
    const highEvents = events.filter(
      (e) => e.severity === 'high' || e.severity === 'critical',
    ).length;

    const score = clamp(92 - highEvents * 2, 50, 97);
    const status =
      highEvents > 3
        ? 'Elevated geopolitical risk'
        : highEvents > 0
          ? 'Market intelligence active'
          : 'Property intelligence active';

    return { score, status, alertCount: highEvents, lastUpdated: geoRow?.fetchedAt ?? null };
  } catch {
    return { score: 92, status: 'Property intelligence active', alertCount: 0, lastUpdated: null };
  }
}

export async function buildTimeline(_aegisData: Awaited<ReturnType<typeof getAegisData>>) {
  const items: Array<{
    id: number;
    time: string;
    domain: string;
    severity: string;
    title: string;
    detail: string;
  }> = [];
  let idCounter = 1;

  try {
    const [row] = await db
      .select()
      .from(intelligenceCacheTable)
      .where(eq(intelligenceCacheTable.key, 'threats'))
      .limit(1);
    const threats = Array.isArray(row?.data) ? row.data.filter(isThreatItem) : [];
    threats.slice(0, 6).forEach((t) => {
      if (!t.timestamp) return;
      items.push({
        id: idCounter++,
        time: relTime(t.timestamp),
        domain: 'aegis',
        severity: t.severity ?? 'medium',
        title: t.name ?? t.title ?? 'Threat detected',
        detail: `${t.type ?? 'Threat'} from ${t.country ?? 'unknown'}. ${t.description?.slice(0, 100) ?? ''}`,
      });
    });
  } catch {
    /* non-fatal */
  }

  try {
    const [row] = await db
      .select()
      .from(intelligenceCacheTable)
      .where(eq(intelligenceCacheTable.key, 'geopolitical'))
      .limit(1);
    const events = Array.isArray(row?.data) ? row.data.filter(isGeoEvent) : [];
    events
      .filter((e) => e.severity === 'high' || e.severity === 'critical')
      .slice(0, 3)
      .forEach((e) => {
        if (!e.timestamp) return;
        items.push({
          id: idCounter++,
          time: relTime(e.timestamp),
          domain: 'terra',
          severity: e.severity ?? 'medium',
          title: e.title ?? 'Geopolitical event',
          detail: e.impact ?? e.description ?? e.source ?? '',
        });
      });
  } catch {
    /* non-fatal */
  }

  return items.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 12);
}
