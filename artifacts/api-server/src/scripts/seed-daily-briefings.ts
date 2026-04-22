/**
 * seed-daily-briefings.ts
 *
 * Seeds 30 days of cross-domain executive daily briefings into daily_briefings.
 * These power the Command portal and cross-domain trend charts.
 *
 * Idempotent: skips if data already present.
 */

import { dailyBriefingsTable, db } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}
function dateStr(n: number) {
  return daysAgo(n).toISOString().slice(0, 10);
}

const ORG_ID = 1;

const HEADLINES = [
  '3 critical security findings open — payment API and Redis cluster flagged',
  'Vessels fleet operating normally — Red Sea re-routing cost tracking active',
  'Terra distress pipeline: 12 active opportunities, 2 auction windows this week',
  'Alloy governance ceiling breach — 2 agent runs paused for human review',
  'Platform health nominal — 847 assets monitored, 0 service disruptions',
  'Aegis SOC: ransomware precursor detected — playbook activated, contained',
  'Carlota Jo Q2 pipeline ahead — $480K above target, 3 new inquiries',
  'PRISM Counsel: 8 settlements closed in 48 hours — velocity record',
  'Lyte observability: latency spike resolved, all systems green',
  'Constellation graph: 2,341 cross-domain edges active, 3 drift alerts',
  'Vessels: IMO 9876543 AIS dark period cleared — no sanctions match',
  'Terra: Harlem auction cluster — 4 properties within acquisition window',
  'Aegis: MITRE coverage improved to 74% — 3 new detections deployed',
  'SZL Holdings LP portal: 2 new capital inquiries from Tier-1 funds',
  'Alloy AI decisions: 98 executed, 3 pending approval past 24h threshold',
  'Platform quarterly snapshot: $42.8M aggregate ARR, 22% velocity up',
  'Vessels Red Sea exposure: $0.8M cost impact projected over 30 days',
  'Terra: Brooklyn cap rate compression — acquisition models refreshed',
  'Aegis: payment API remediation completed — CVSS 9.3 finding closed',
  'Lyte AIOps: NRR signal updated — Vessels at 119% TTM, Lyte at 127%',
  'PRISM: document AI review 3x baseline — demand letters on schedule',
  'Vessels: cargo insurance renewal — 2 vessels flagged for rate increase',
  'Aegis: OT/ICS industrial scan — 0 critical findings confirmed',
  'Terra: Westchester commercial corridor — early distress clustering detected',
  'Carlota Jo: board readiness cohort — 4 executives cleared for placement',
  'Alloy: weekly governance digest — 12 policy gates triggered, 0 bypassed',
  'PRISM: NY discovery acceleration — AI review saved 340 attorney hours',
  'Vessels: Panamax repositioning — Atlantic lane demand shift signaled',
  'Aegis: privileged access review — 3 over-permissioned accounts flagged',
  'SZL Holdings: roadshow deck finalized — investor materials approved',
];

const HEALTH_STATES: Array<'nominal' | 'elevated' | 'degraded' | 'critical'> = [
  'nominal',
  'nominal',
  'nominal',
  'nominal',
  'elevated',
  'nominal',
  'nominal',
  'nominal',
  'elevated',
  'nominal',
  'nominal',
  'nominal',
  'elevated',
  'nominal',
  'nominal',
  'nominal',
  'nominal',
  'degraded',
  'nominal',
  'nominal',
  'critical',
  'nominal',
  'nominal',
  'nominal',
  'elevated',
  'nominal',
  'nominal',
  'nominal',
  'nominal',
  'elevated',
];

function makeDomainScores(day: number) {
  const base = (d: number, variance: number) =>
    Math.min(100, Math.max(40, Math.round(d + Math.sin(day * 0.3 + d * 0.1) * variance)));
  return {
    aegis: base(72, 12),
    vessels: base(84, 8),
    terra: base(91, 5),
    lyte: base(88, 6),
    'carlota-jo': base(94, 4),
    platform: base(96, 3),
  };
}

function makeSignals(day: number) {
  return [
    {
      id: `sig-aegis-${day}`,
      domain: 'aegis',
      type: 'security_alert',
      severity: day === 20 ? 'critical' : day % 5 === 0 ? 'high' : 'medium',
      title:
        day === 20
          ? 'Ransomware precursor detected — playbook triggered'
          : 'Aegis daily scan completed',
      count: 2 + (day % 6),
      timestamp: daysAgo(day).toISOString(),
    },
    {
      id: `sig-vessels-${day}`,
      domain: 'vessels',
      type: 'fleet_event',
      severity: day === 25 ? 'high' : 'info',
      title: day === 25 ? 'AIS dark period — IMO 9876543 (18 hours)' : 'Fleet tracking nominal',
      count: 1 + (day % 4),
      timestamp: daysAgo(day).toISOString(),
    },
    {
      id: `sig-terra-${day}`,
      domain: 'terra',
      type: 'distress_signal',
      severity: day % 4 === 0 ? 'high' : 'medium',
      title: day % 4 === 0 ? 'Auction deadline alert — 2 properties' : 'Distress pipeline updated',
      count: 12 + (day % 8),
      timestamp: daysAgo(day).toISOString(),
    },
    {
      id: `sig-lyte-${day}`,
      domain: 'lyte',
      type: 'revenue_signal',
      severity: 'info',
      title: `Portfolio ARR tracking $${(42.8 - day * 0.03).toFixed(1)}M aggregate`,
      count: 4,
      timestamp: daysAgo(day).toISOString(),
    },
  ];
}

export async function seedDailyBriefings() {

  // Count existing rows for this org — if exactly 30 rows already exist, skip.
  // Otherwise, delete and reinsert to heal any partial seed.
  const existing = await db
    .select({ id: dailyBriefingsTable.id })
    .from(dailyBriefingsTable)
    .where(eq(dailyBriefingsTable.orgId, ORG_ID));
  if (existing.length >= 30) {
    return { skipped: true };
  }
  if (existing.length > 0) {
    await db.delete(dailyBriefingsTable).where(eq(dailyBriefingsTable.orgId, ORG_ID));
  }

  const rows: (typeof dailyBriefingsTable.$inferInsert)[] = [];

  for (let day = 29; day >= 0; day--) {
    const health = HEALTH_STATES[day] ?? 'nominal';
    const critCount = health === 'critical' ? 3 : health === 'degraded' ? 1 : 0;
    const highCount = health === 'elevated' ? 4 : health === 'critical' ? 7 : 2;
    const totalAlerts = critCount + highCount + 3 + (day % 5);

    rows.push({
      orgId: ORG_ID,
      briefingDate: dateStr(day),
      headline: HEADLINES[day % HEADLINES.length]!,
      executiveSummary: `SZL Holdings intelligence systems processed ${1200 + day * 15} signals across 4 active domains. ${critCount > 0 ? `${critCount} critical alert${critCount > 1 ? 's' : ''} require immediate executive review. ` : ''}Overall platform health is ${health}. ${highCount} high-priority items in active queues. Governance gates operating normally — ${98 - (day % 4)} policy checks executed, 0 bypassed.`,
      signals: makeSignals(day),
      domainScores: makeDomainScores(day),
      totalAlerts,
      criticalCount: critCount,
      highCount,
      overallHealth: health,
      generatedAt: daysAgo(day),
      isPublished: true,
    });
  }

  await db.insert(dailyBriefingsTable).values(rows);

  return { dailyBriefings: rows.length };
}
